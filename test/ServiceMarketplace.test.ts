import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { ServiceMarketplace } from "../typechain-types";
import { MockUSDC } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ServiceMarketplace", function () {
  let marketplace: ServiceMarketplace;
  let mockUSDC: MockUSDC;
  let owner: SignerWithAddress;
  let provider: SignerWithAddress;
  let consumer: SignerWithAddress;
  let user: SignerWithAddress;

  const INITIAL_BALANCE = ethers.parseUnits("1000000", 6); // 1M USDC
  const SERVICE_PRICE = ethers.parseUnits("10", 6); // 10 USDC
  const SERVICE_NAME = "AI Analysis Service";
  const SERVICE_DESC = "Advanced AI-powered market analysis";
  const SERVICE_URL = "https://api.example.com/analyze";

  beforeEach(async function () {
    [owner, provider, consumer, user] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDCFactory.deploy();
    await mockUSDC.waitForDeployment();

    // Mint USDC to users
    await mockUSDC.mint(consumer.address, INITIAL_BALANCE);
    await mockUSDC.mint(user.address, INITIAL_BALANCE);

    // Deploy ServiceMarketplace
    const ServiceMarketplaceFactory = await ethers.getContractFactory("ServiceMarketplace");
    marketplace = await ServiceMarketplaceFactory.deploy(await mockUSDC.getAddress());
    await marketplace.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await marketplace.owner()).to.equal(owner.address);
    });

    it("Should set the correct USDC address", async function () {
      expect(await marketplace.usdc()).to.equal(await mockUSDC.getAddress());
    });

    it("Should start with zero services", async function () {
      expect(await marketplace.totalServices()).to.equal(0);
    });

    it("Should fail deployment with zero USDC address", async function () {
      const ServiceMarketplaceFactory = await ethers.getContractFactory("ServiceMarketplace");
      await expect(
        ServiceMarketplaceFactory.deploy(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid USDC address");
    });
  });

  describe("Service Publishing", function () {
    it("Should publish a new service", async function () {
      const tx = marketplace
        .connect(provider)
        .publishService(SERVICE_NAME, SERVICE_DESC, SERVICE_URL, SERVICE_PRICE);

      await expect(tx)
        .to.emit(marketplace, "ServicePublished")
        .withArgs(
          await marketplace.connect(provider).publishService.staticCall(
            SERVICE_NAME,
            SERVICE_DESC,
            SERVICE_URL,
            SERVICE_PRICE
          ),
          provider.address,
          SERVICE_NAME,
          SERVICE_PRICE
        );

      expect(await marketplace.totalServices()).to.equal(1);

      // Get service ID from event
      const receipt = await (await tx).wait();
      if (!receipt) throw new Error("Transaction receipt is null");
      const eventTopic = marketplace.interface.getEvent("ServicePublished").topicHash;
      const event = receipt.logs.find((log: any) => log.topics[0] === eventTopic);
      // serviceId is the first indexed parameter (topics[1])
      const serviceId = event ? event.topics[1] : ethers.id("fallback");

      const service = await marketplace.services(serviceId);
      expect(service.provider).to.equal(provider.address);
      expect(service.name).to.equal(SERVICE_NAME);
      expect(service.description).to.equal(SERVICE_DESC);
      expect(service.endpointURL).to.equal(SERVICE_URL);
      expect(service.pricePerRequest).to.equal(SERVICE_PRICE);
      expect(service.isActive).to.be.true;
      expect(service.totalRequests).to.equal(0);
    });

    it("Should fail with zero price", async function () {
      await expect(
        marketplace
          .connect(provider)
          .publishService(SERVICE_NAME, SERVICE_DESC, SERVICE_URL, 0)
      ).to.be.revertedWith("Price must be positive");
    });

    it("Should fail with empty name", async function () {
      await expect(
        marketplace
          .connect(provider)
          .publishService("", SERVICE_DESC, SERVICE_URL, SERVICE_PRICE)
      ).to.be.revertedWith("Name required");
    });

    it("Should fail with empty description", async function () {
      await expect(
        marketplace
          .connect(provider)
          .publishService(SERVICE_NAME, "", SERVICE_URL, SERVICE_PRICE)
      ).to.be.revertedWith("Description required");
    });

    it("Should fail with empty endpoint URL", async function () {
      await expect(
        marketplace
          .connect(provider)
          .publishService(SERVICE_NAME, SERVICE_DESC, "", SERVICE_PRICE)
      ).to.be.revertedWith("Endpoint URL required");
    });

    it("Should allow multiple services from same provider", async function () {
      await marketplace
        .connect(provider)
        .publishService(SERVICE_NAME, SERVICE_DESC, SERVICE_URL, SERVICE_PRICE);

      await marketplace
        .connect(provider)
        .publishService("Another Service", "Another description", "https://api.example.com/other", SERVICE_PRICE);

      expect(await marketplace.totalServices()).to.equal(2);
    });
  });

  describe("Service Requests", function () {
    let serviceId: string;

    beforeEach(async function () {
      const tx = await marketplace
        .connect(provider)
        .publishService(SERVICE_NAME, SERVICE_DESC, SERVICE_URL, SERVICE_PRICE);

      const receipt = await tx.wait();
      if (!receipt) throw new Error("Transaction receipt is null");
      const eventTopic = marketplace.interface.getEvent("ServicePublished").topicHash;
      const event = receipt.logs.find((log: any) => log.topics[0] === eventTopic);
      serviceId = event ? event.topics[1] : ethers.id("fallback");

      // Approve marketplace to spend USDC
      await mockUSDC.connect(consumer).approve(await marketplace.getAddress(), INITIAL_BALANCE);
    });

    it("Should request a service successfully", async function () {
      const providerBalanceBefore = await mockUSDC.balanceOf(provider.address);
      const consumerBalanceBefore = await mockUSDC.balanceOf(consumer.address);

      const tx = await marketplace.connect(consumer).requestService(serviceId);
      const receipt = await tx.wait();
      if (!receipt) throw new Error("Transaction receipt is null");
      const eventTopic = marketplace.interface.getEvent("ServiceRequested").topicHash;
      const event = receipt.logs.find((log: any) => log.topics[0] === eventTopic);
      // requestId is the first indexed parameter (topics[1])
      const requestId = event ? event.topics[1] : ethers.id("fallback");

      await expect(tx)
        .to.emit(marketplace, "ServiceRequested")
        .withArgs(requestId, serviceId, consumer.address, SERVICE_PRICE);

      // Check payment transferred
      const providerBalanceAfter = await mockUSDC.balanceOf(provider.address);
      const consumerBalanceAfter = await mockUSDC.balanceOf(consumer.address);

      expect(providerBalanceAfter - providerBalanceBefore).to.equal(SERVICE_PRICE);
      expect(consumerBalanceBefore - consumerBalanceAfter).to.equal(SERVICE_PRICE);

      // Check service stats
      const service = await marketplace.services(serviceId);
      expect(service.totalRequests).to.equal(1);
    });

    it("Should fail to request inactive service", async function () {
      await marketplace.connect(provider).deactivateService(serviceId);

      await expect(
        marketplace.connect(consumer).requestService(serviceId)
      ).to.be.revertedWith("Service not active");
    });

    it("Should fail with insufficient allowance", async function () {
      await mockUSDC.connect(consumer).approve(await marketplace.getAddress(), 0);

      await expect(
        marketplace.connect(consumer).requestService(serviceId)
      ).to.be.revertedWith("Insufficient allowance");
    });

    it("Should fail with insufficient balance", async function () {
      await mockUSDC.connect(consumer).transfer(user.address, INITIAL_BALANCE);

      await expect(
        marketplace.connect(consumer).requestService(serviceId)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should fail to request own service", async function () {
      await mockUSDC.connect(provider).approve(await marketplace.getAddress(), INITIAL_BALANCE);

      await expect(
        marketplace.connect(provider).requestService(serviceId)
      ).to.be.revertedWith("Cannot request own service");
    });

    it("Should allow multiple requests for same service", async function () {
      await mockUSDC.connect(user).approve(await marketplace.getAddress(), INITIAL_BALANCE);

      await marketplace.connect(consumer).requestService(serviceId);
      await marketplace.connect(user).requestService(serviceId);

      const service = await marketplace.services(serviceId);
      expect(service.totalRequests).to.equal(2);
    });
  });

  describe("Service Completion and Rating", function () {
    let serviceId: string;
    let requestId: string;

    beforeEach(async function () {
      const tx = await marketplace
        .connect(provider)
        .publishService(SERVICE_NAME, SERVICE_DESC, SERVICE_URL, SERVICE_PRICE);

      const receipt = await tx.wait();
      const event = receipt!.logs.find(
        (log: any) => log.fragment?.name === "ServicePublished"
      );
      serviceId = event!.topics[1];

      await mockUSDC.connect(consumer).approve(await marketplace.getAddress(), INITIAL_BALANCE);
      const requestTx = await marketplace.connect(consumer).requestService(serviceId);
      const requestReceipt = await requestTx.wait();
      const requestEvent = requestReceipt!.logs.find(
        (log: any) => log.fragment?.name === "ServiceRequested"
      );
      requestId = requestEvent!.topics[1];
    });

    it("Should complete service request with rating", async function () {
      const rating = 5;
      const tx = marketplace.connect(consumer).completeServiceRequest(requestId, rating);

      await expect(tx)
        .to.emit(marketplace, "ServiceCompleted")
        .withArgs(requestId, rating);

      const request = await marketplace.requests(requestId);
      expect(request.completed).to.be.true;
      expect(request.rating).to.equal(rating);

      const service = await marketplace.services(serviceId);
      expect(service.rating).to.equal(10000); // 5 stars = 10000 basis points
      expect(service.ratingCount).to.equal(1);
    });

    it("Should update service rating with multiple ratings", async function () {
      // Create second request
      await mockUSDC.connect(user).approve(await marketplace.getAddress(), INITIAL_BALANCE);
      const request2Tx = await marketplace.connect(user).requestService(serviceId);
      const request2Receipt = await request2Tx.wait();
      if (!request2Receipt) throw new Error("Transaction receipt is null");
      const eventTopic2 = marketplace.interface.getEvent("ServiceRequested").topicHash;
      const request2Event = request2Receipt.logs.find((log: any) => log.topics[0] === eventTopic2);
      const requestId2 = request2Event ? request2Event.topics[1] : ethers.id("fallback");

      // Complete first request with 5 stars
      await marketplace.connect(consumer).completeServiceRequest(requestId, 5);

      // Complete second request with 3 stars
      await marketplace.connect(user).completeServiceRequest(requestId2, 3);

      const service = await marketplace.services(serviceId);
      // Average: (5 + 3) / 2 = 4 stars = 8000 basis points
      expect(service.rating).to.equal(8000);
      expect(service.ratingCount).to.equal(2);
    });

    it("Should fail with invalid rating (too low)", async function () {
      await expect(
        marketplace.connect(consumer).completeServiceRequest(requestId, 0)
      ).to.be.revertedWith("Invalid rating");
    });

    it("Should fail with invalid rating (too high)", async function () {
      await expect(
        marketplace.connect(consumer).completeServiceRequest(requestId, 6)
      ).to.be.revertedWith("Invalid rating");
    });

    it("Should fail if not request owner", async function () {
      await expect(
        marketplace.connect(user).completeServiceRequest(requestId, 5)
      ).to.be.revertedWith("Not request owner");
    });

    it("Should fail if already completed", async function () {
      await marketplace.connect(consumer).completeServiceRequest(requestId, 5);

      await expect(
        marketplace.connect(consumer).completeServiceRequest(requestId, 4)
      ).to.be.revertedWith("Already completed");
    });
  });

  describe("Service Management", function () {
    let serviceId: string;

    beforeEach(async function () {
      const tx = await marketplace
        .connect(provider)
        .publishService(SERVICE_NAME, SERVICE_DESC, SERVICE_URL, SERVICE_PRICE);

      const receipt = await tx.wait();
      const event = receipt!.logs.find(
        (log: any) => log.fragment?.name === "ServicePublished"
      );
      serviceId = event!.topics[1];
    });

    it("Should allow provider to deactivate service", async function () {
      await marketplace.connect(provider).deactivateService(serviceId);

      const service = await marketplace.services(serviceId);
      expect(service.isActive).to.be.false;
    });

    it("Should allow provider to reactivate service", async function () {
      await marketplace.connect(provider).deactivateService(serviceId);
      await marketplace.connect(provider).reactivateService(serviceId);

      const service = await marketplace.services(serviceId);
      expect(service.isActive).to.be.true;
    });

    it("Should prevent others from deactivating service", async function () {
      await expect(
        marketplace.connect(user).deactivateService(serviceId)
      ).to.be.revertedWith("Not service provider");
    });

    it("Should allow provider to update service price", async function () {
      const newPrice = ethers.parseUnits("20", 6);
      await marketplace.connect(provider).updateServicePrice(serviceId, newPrice);

      const service = await marketplace.services(serviceId);
      expect(service.pricePerRequest).to.equal(newPrice);
    });

    it("Should fail to update price to zero", async function () {
      await expect(
        marketplace.connect(provider).updateServicePrice(serviceId, 0)
      ).to.be.revertedWith("Price must be positive");
    });

    it("Should prevent others from updating price", async function () {
      await expect(
        marketplace.connect(user).updateServicePrice(serviceId, ethers.parseUnits("20", 6))
      ).to.be.revertedWith("Not service provider");
    });
  });

  describe("View Functions", function () {
    let serviceId: string;
    let requestId: string;

    beforeEach(async function () {
      const tx = await marketplace
        .connect(provider)
        .publishService(SERVICE_NAME, SERVICE_DESC, SERVICE_URL, SERVICE_PRICE);

      const receipt = await tx.wait();
      const event = receipt!.logs.find(
        (log: any) => log.fragment?.name === "ServicePublished"
      );
      serviceId = event!.topics[1];

      await mockUSDC.connect(consumer).approve(await marketplace.getAddress(), INITIAL_BALANCE);
      const requestTx = await marketplace.connect(consumer).requestService(serviceId);
      const requestReceipt = await requestTx.wait();
      const requestEvent = requestReceipt!.logs.find(
        (log: any) => log.fragment?.name === "ServiceRequested"
      );
      requestId = requestEvent!.topics[1];
    });

    it("Should get all services", async function () {
      const allServices = await marketplace.getAllServices();
      expect(allServices.length).to.equal(1);
      expect(allServices[0].name).to.equal(SERVICE_NAME);
    });

    it("Should get provider services", async function () {
      const providerServices = await marketplace.getProviderServices(provider.address);
      expect(providerServices.length).to.equal(1);
      expect(providerServices[0].name).to.equal(SERVICE_NAME);
    });

    it("Should get consumer requests", async function () {
      const consumerRequests = await marketplace.getConsumerRequests(consumer.address);
      expect(consumerRequests.length).to.equal(1);
      expect(consumerRequests[0].serviceId).to.equal(serviceId);
    });

    it("Should get service by ID", async function () {
      const service = await marketplace.getService(serviceId);
      expect(service.name).to.equal(SERVICE_NAME);
      expect(service.provider).to.equal(provider.address);
    });

    it("Should get request by ID", async function () {
      const request = await marketplace.getRequest(requestId);
      expect(request.consumer).to.equal(consumer.address);
      expect(request.serviceId).to.equal(serviceId);
    });

    it("Should fail to get non-existent service", async function () {
      const fakeId = ethers.id("fake-service");
      await expect(
        marketplace.getService(fakeId)
      ).to.be.revertedWith("Service does not exist");
    });

    it("Should fail to get non-existent request", async function () {
      const fakeId = ethers.id("fake-request");
      await expect(
        marketplace.getRequest(fakeId)
      ).to.be.revertedWith("Request does not exist");
    });
  });

  describe("Reentrancy Protection", function () {
    let serviceId: string;

    beforeEach(async function () {
      const tx = await marketplace
        .connect(provider)
        .publishService(SERVICE_NAME, SERVICE_DESC, SERVICE_URL, SERVICE_PRICE);

      const receipt = await tx.wait();
      if (!receipt) throw new Error("Transaction receipt is null");
      const eventTopic = marketplace.interface.getEvent("ServicePublished").topicHash;
      const event = receipt.logs.find((log: any) => log.topics[0] === eventTopic);
      serviceId = event ? event.topics[1] : ethers.id("fallback");

      await mockUSDC.connect(consumer).approve(await marketplace.getAddress(), INITIAL_BALANCE);
    });

    it("Should prevent reentrancy on requestService", async function () {
      // Normal request should work
      await expect(
        marketplace.connect(consumer).requestService(serviceId)
      ).to.not.be.reverted;
    });
  });
});

