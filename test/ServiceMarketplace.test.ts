import { expect } from "chai";
import { ethers } from "hardhat";
import { ServiceMarketplace } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ServiceMarketplace", function () {
  let marketplace: ServiceMarketplace;
  let owner: SignerWithAddress;
  let provider: SignerWithAddress;
  let consumer: SignerWithAddress;
  let usdc: any;

  const USDC_FUJI = "0x5425890298aed601595a70AB815c96711a31Bc65";

  beforeEach(async function () {
    [owner, provider, consumer] = await ethers.getSigners();

    // Deploy mock USDC if needed, or use existing
    const ServiceMarketplaceFactory = await ethers.getContractFactory(
      "ServiceMarketplace"
    );
    marketplace = await ServiceMarketplaceFactory.deploy(USDC_FUJI);
    await marketplace.waitForDeployment();
  });

  describe("Service Publishing", function () {
    it("Should publish a new service", async function () {
      const tx = await marketplace
        .connect(provider)
        .publishService(
          "Test Service",
          "A test service",
          "https://api.example.com",
          ethers.parseUnits("0.1", 18)
        );

      await expect(tx)
        .to.emit(marketplace, "ServicePublished")
        .withArgs(
          await marketplace.connect(provider).publishService.staticCall(
            "Test Service",
            "A test service",
            "https://api.example.com",
            ethers.parseUnits("0.1", 18)
          ),
          provider.address,
          "Test Service",
          ethers.parseUnits("0.1", 18)
        );
    });

    it("Should fail with zero price", async function () {
      await expect(
        marketplace
          .connect(provider)
          .publishService("Test", "Desc", "https://api.example.com", 0)
      ).to.be.revertedWith("Price must be positive");
    });
  });

  describe("Service Requests", function () {
    let serviceId: string;

    beforeEach(async function () {
      const tx = await marketplace
        .connect(provider)
        .publishService(
          "Test Service",
          "A test service",
          "https://api.example.com",
          ethers.parseUnits("0.1", 18)
        );
      // Extract serviceId from event or calculate
      serviceId = ethers.id(
        provider.address + "Test Service" + (await ethers.provider.getBlockNumber())
      );
    });

    it("Should request a service", async function () {
      // Note: This test requires USDC approval and balance
      // Mock implementation needed
    });
  });
});

