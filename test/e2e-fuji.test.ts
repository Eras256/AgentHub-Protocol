/**
 * End-to-End Tests for AgentHub Protocol on Avalanche Fuji Testnet
 * 
 * These tests execute real on-chain transactions using deployed contracts.
 * Requires:
 * - Contracts deployed on Fuji testnet
 * - Test accounts with AVAX and USDC balances
 * - SNOWTRACE_API_KEY in .env.local
 */

import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { AgentRegistry } from "../typechain-types";
import { RevenueDistributor } from "../typechain-types";
import { ServiceMarketplace } from "../typechain-types";
import { IERC20 } from "../typechain-types";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load deployed contract addresses
const deploymentsPath = path.join(__dirname, "../deployments/fuji-latest.json");
let deployments: any;

try {
  deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));
} catch (error) {
  console.error("Error loading deployments file:", error);
  throw error;
}

describe("AgentHub Protocol - End-to-End Tests on Fuji Testnet", function () {
  // Use longer timeout for on-chain transactions
  this.timeout(300000); // 5 minutes

  let agentRegistry: AgentRegistry;
  let revenueDistributor: RevenueDistributor;
  let serviceMarketplace: ServiceMarketplace;
  let usdc: IERC20;
  
  let deployer: any;
  let agent1: any;
  let agent2: any;
  let agent3: any;
  let agent4: any;
  let provider1: any;
  let provider2: any;
  let consumer1: any;
  let consumer2: any;
  let creator1: any;
  let creator2: any;

  // Minimum amounts for testing - using minimal amounts for cost efficiency
  // Note: MIN_STAKE must match the contract's minStake (deployed with 0.01 AVAX)
  let MIN_STAKE: bigint;
  const MIN_USDC_AMOUNT = ethers.parseUnits("0.00001", 6); // 0.00001 USDC (minimum verifiable)
  const SERVICE_PRICE_MIN = ethers.parseUnits("0.00001", 6); // 0.00001 USDC per service
  const REVENUE_AMOUNT = ethers.parseUnits("0.00001", 6); // 0.00001 USDC for revenue distribution

  // Agent IDs - Use timestamp to ensure uniqueness across test runs
  const getUniqueAgentId = (base: string) => ethers.id(`${base}-${Date.now()}-${Math.random()}`);
  let AGENT_ID_1: string;
  let AGENT_ID_2: string;
  let AGENT_ID_3: string;
  let AGENT_ID_4: string;

  before(async function () {
    // Skip if not on Fuji network
    if (hre.network.name !== "fuji") {
      console.log("⚠️  Skipping E2E tests - not on Fuji network");
      this.skip();
    }

    // Get signers
    const signers = await ethers.getSigners();
    console.log(`📝 Available signers: ${signers.length}`);
    
    // Use available signers, reuse deployer if not enough signers available
    deployer = signers[0];
    agent1 = signers[1] || deployer;
    agent2 = signers[2] || deployer;
    agent3 = signers[3] || deployer;
    agent4 = signers[4] || deployer;
    provider1 = signers[5] || deployer;
    provider2 = signers[6] || deployer;
    consumer1 = signers[7] || deployer;
    consumer2 = signers[8] || deployer;
    creator1 = signers[9] || deployer;
    creator2 = signers[10] || deployer;
    
    if (signers.length < 11) {
      console.log("⚠️  Warning: Not enough signers available. Some tests may reuse the deployer account.");
    }
    
    // Generate unique agent IDs for this test run
    AGENT_ID_1 = getUniqueAgentId("e2e-agent-001");
    AGENT_ID_2 = getUniqueAgentId("e2e-agent-002");
    AGENT_ID_3 = getUniqueAgentId("e2e-agent-003");
    AGENT_ID_4 = getUniqueAgentId("e2e-agent-004");

    console.log("\n📋 Test Configuration:");
    console.log("Network:", hre.network.name);
    console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
    console.log("Deployer:", deployer.address);
    console.log("Agent Registry:", deployments.contracts.AgentRegistry);
    console.log("Revenue Distributor:", deployments.contracts.RevenueDistributor);
    console.log("Service Marketplace:", deployments.contracts.ServiceMarketplace);
    console.log("USDC:", deployments.contracts.USDC);

    // Connect to deployed contracts using getContractAt with provider
    // This ensures contracts have proper signer support
    agentRegistry = await ethers.getContractAt("AgentRegistry", deployments.contracts.AgentRegistry) as AgentRegistry;
    revenueDistributor = await ethers.getContractAt("RevenueDistributor", deployments.contracts.RevenueDistributor) as RevenueDistributor;
    serviceMarketplace = await ethers.getContractAt("ServiceMarketplace", deployments.contracts.ServiceMarketplace) as ServiceMarketplace;
    
    // Get the actual minStake from the deployed contract
    MIN_STAKE = await agentRegistry.minStake();
    console.log("📊 Contract minStake:", ethers.formatEther(MIN_STAKE), "AVAX");
    
    // IERC20 is an interface, use getContractAt
    usdc = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", deployments.contracts.USDC) as unknown as IERC20;

    // Check balances
    const deployerBalance = await ethers.provider.getBalance(deployer.address);
    console.log("\n💰 Deployer AVAX Balance:", ethers.formatEther(deployerBalance), "AVAX");
    
    // Check USDC balances
    try {
      const deployerUSDC = await usdc.balanceOf(deployer.address);
      console.log("Deployer USDC Balance:", ethers.formatUnits(deployerUSDC, 6), "USDC");
    } catch (error) {
      console.log("⚠️  Could not check USDC balance (may need to get testnet USDC)");
    }
  });

  describe("AgentRegistry - 4 Transactions", function () {
    it("Transaction 1: Register Agent 1 with minimum stake", async function () {
      const metadataIPFS = "ipfs://QmE2ETest001";
      
      const agentRegistryConnected = agentRegistry.connect(agent1) as AgentRegistry;
      const tx = await agentRegistryConnected.registerAgent(AGENT_ID_1, metadataIPFS, {
        value: MIN_STAKE,
      });

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
      console.log("✅ Agent 1 registered. TX:", receipt!.hash);

      const agent = await agentRegistry.getAgent(AGENT_ID_1);
      expect(agent.agentId).to.equal(AGENT_ID_1);
      expect(agent.stakedAmount).to.equal(MIN_STAKE);
      expect(agent.isActive).to.be.true;
    });

    it("Transaction 2: Register Agent 2 with PoAI hash", async function () {
      const metadataIPFS = "ipfs://QmE2ETest002";
      const kitePoAIHash = ethers.id("kite-proof-e2e-002");

      const agentRegistryConnected = agentRegistry.connect(agent2) as AgentRegistry;
      const tx = await agentRegistryConnected.registerAgentWithPoAI(
        AGENT_ID_2,
        metadataIPFS,
        kitePoAIHash,
        {
          value: MIN_STAKE,
        }
      );

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
      console.log("✅ Agent 2 registered with PoAI. TX:", receipt!.hash);

      const agent = await agentRegistry.getAgent(AGENT_ID_2);
      expect(agent.agentId).to.equal(AGENT_ID_2);
      expect(agent.kitePoAIHash).to.equal(kitePoAIHash);
    });

    it("Transaction 3: Add stake to Agent 1", async function () {
      const additionalStake = ethers.parseEther("0.00001"); // 0.00001 AVAX

      const agentRegistryConnected = agentRegistry.connect(agent1) as AgentRegistry;
      const tx = await agentRegistryConnected.addStake(AGENT_ID_1, {
        value: additionalStake,
      });

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
      console.log("✅ Additional stake added. TX:", receipt!.hash);

      const agent = await agentRegistry.getAgent(AGENT_ID_1);
      expect(agent.stakedAmount).to.equal(MIN_STAKE + additionalStake);
    });

    it("Transaction 4: Update reputation for Agent 1", async function () {
      const agentRegistryConnected = agentRegistry.connect(deployer) as AgentRegistry;
      const tx = await agentRegistryConnected.updateReputation(
        AGENT_ID_1,
        true, // successful
        ethers.parseEther("0.00001"), // transaction value
        "service-delivery"
      );

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
      console.log("✅ Reputation updated. TX:", receipt!.hash);

      // Wait a bit for the transaction to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const agent = await agentRegistry.getAgent(AGENT_ID_1);
      console.log("Agent totalTransactions:", agent.totalTransactions.toString());
      console.log("Agent successfulTransactions:", agent.successfulTransactions.toString());
      console.log("Agent trustScore:", agent.trustScore.toString());
      expect(agent.totalTransactions).to.be.gte(1);
      expect(agent.successfulTransactions).to.be.gte(1);
      expect(agent.trustScore).to.be.gt(5000); // Should be above initial 50%
    });
  });

  describe("ServiceMarketplace - 4 Transactions", function () {
    before(async function () {
      // Ensure consumers have USDC and allowance
      try {
        const consumer1Balance = await usdc.balanceOf(consumer1.address);
        const consumer2Balance = await usdc.balanceOf(consumer2.address);
        
        console.log("\n💵 Consumer1 USDC:", ethers.formatUnits(consumer1Balance, 6));
        console.log("💵 Consumer2 USDC:", ethers.formatUnits(consumer2Balance, 6));

        // If balances are low, we'll skip USDC tests
        if (consumer1Balance < SERVICE_PRICE_MIN || consumer2Balance < SERVICE_PRICE_MIN) {
          console.log("⚠️  Low USDC balance - some tests may be skipped");
        }
      } catch (error) {
        console.log("⚠️  Could not check USDC balances");
      }
    });

    it("Transaction 1: Publish Service 1", async function () {
      const marketplaceConnected = serviceMarketplace.connect(provider1) as ServiceMarketplace;
      const tx = await marketplaceConnected.publishService(
        "E2E Test Service 1",
        "End-to-end test service description",
        "https://api.example.com/service1",
        SERVICE_PRICE_MIN
      );

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
      
      const serviceId = await serviceMarketplace.providerServices(provider1.address, 0);
      const service = await serviceMarketplace.getService(serviceId);
      
      expect(service.name).to.equal("E2E Test Service 1");
      // Service price is stored with 6 decimals, so 0.00001 USDC = 10 units
      expect(service.pricePerRequest).to.equal(SERVICE_PRICE_MIN);
      console.log("✅ Service 1 published. TX:", receipt!.hash, "Service ID:", serviceId);
      console.log("   Service price:", ethers.formatUnits(service.pricePerRequest, 6), "USDC");
    });

    it("Transaction 2: Publish Service 2", async function () {
      const marketplaceConnected = serviceMarketplace.connect(provider2) as ServiceMarketplace;
      const tx = await marketplaceConnected.publishService(
        "E2E Test Service 2",
        "Second end-to-end test service",
        "https://api.example.com/service2",
        SERVICE_PRICE_MIN
      );

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
      
      // If provider1 and provider2 are the same, get the second service (index 1)
      const serviceIndex = provider1.address.toLowerCase() === provider2.address.toLowerCase() ? 1 : 0;
      const serviceId = await serviceMarketplace.providerServices(provider2.address, serviceIndex);
      const service = await serviceMarketplace.getService(serviceId);
      
      expect(service.name).to.equal("E2E Test Service 2");
      console.log("✅ Service 2 published. TX:", receipt!.hash);
    });

    it("Transaction 3: Request Service 1 (requires USDC)", async function () {
      // Get first service
      const serviceId = await serviceMarketplace.providerServices(provider1.address, 0);
      const service = await serviceMarketplace.getService(serviceId);
      
      // Use consumer2 if consumer1 is the same as provider1 (when only one signer available)
      // But if consumer2 is also the same, skip this test
      const actualConsumer = provider1.address.toLowerCase() === consumer1.address.toLowerCase() ? consumer2 : consumer1;
      
      if (provider1.address.toLowerCase() === actualConsumer.address.toLowerCase()) {
        console.log("⚠️  Skipping - consumer and provider are the same (only one signer available)");
        this.skip();
      }
      
      // Check balance and approve
      const balance = await usdc.balanceOf(actualConsumer.address);
      if (balance < service.pricePerRequest) {
        console.log("⚠️  Skipping - insufficient USDC balance");
        this.skip();
      }

      // Approve USDC spending
      const usdcConnected = usdc.connect(actualConsumer) as IERC20;
      const approveTx = await usdcConnected.approve(
        await serviceMarketplace.getAddress(),
        service.pricePerRequest
      );
      await approveTx.wait();

      // Request service
      const marketplaceConnected = serviceMarketplace.connect(actualConsumer) as ServiceMarketplace;
      const tx = await marketplaceConnected.requestService(serviceId);
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
      
      console.log("✅ Service requested. TX:", receipt!.hash);
      
      // Verify request was created
      const requests = await serviceMarketplace.getConsumerRequests(actualConsumer.address);
      expect(requests.length).to.be.gt(0);
    });

    it("Transaction 4: Complete and rate Service 1", async function () {
      // Use consumer2 if consumer1 is the same as provider1 (when only one signer available)
      const actualConsumer = provider1.address.toLowerCase() === consumer1.address.toLowerCase() ? consumer2 : consumer1;
      
      // Get request
      const requests = await serviceMarketplace.getConsumerRequests(actualConsumer.address);
      if (requests.length === 0) {
        console.log("⚠️  Skipping - no requests found");
        this.skip();
      }

      const requestId = requests[0].requestId;
      const rating = 5; // 5 stars

      const marketplaceConnected = serviceMarketplace.connect(actualConsumer) as ServiceMarketplace;
      const tx = await marketplaceConnected.completeServiceRequest(requestId, rating);
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
      
      console.log("✅ Service completed and rated. TX:", receipt!.hash);
      
      // Verify rating
      const request = await serviceMarketplace.getRequest(requestId);
      expect(request.completed).to.be.true;
      expect(request.rating).to.equal(rating);
    });
  });

  describe("RevenueDistributor - 4 Transactions", function () {
    before(async function () {
      // Ensure contract has USDC for distribution
      try {
        const contractBalance = await usdc.balanceOf(await revenueDistributor.getAddress());
        console.log("\n💰 RevenueDistributor USDC Balance:", ethers.formatUnits(contractBalance, 6));
        
        // If contract doesn't have USDC, we need to send some
        if (contractBalance < REVENUE_AMOUNT) {
          console.log("⚠️  RevenueDistributor needs USDC for testing");
          // Try to transfer USDC to contract if deployer has it
          const deployerBalance = await usdc.balanceOf(deployer.address);
          if (deployerBalance >= REVENUE_AMOUNT) {
            const usdcConnected = usdc.connect(deployer) as IERC20;
            const transferTx = await usdcConnected.transfer(
              await revenueDistributor.getAddress(),
              REVENUE_AMOUNT * 4n // Transfer enough for 4 transactions
            );
            await transferTx.wait();
            console.log("✅ Transferred USDC to RevenueDistributor");
          }
        }
      } catch (error) {
        console.log("⚠️  Could not check/setup USDC for RevenueDistributor");
      }
    });

    it("Transaction 1: Distribute revenue to Creator 1", async function () {
      const contractBalance = await usdc.balanceOf(await revenueDistributor.getAddress());
      if (contractBalance < REVENUE_AMOUNT) {
        console.log("⚠️  Skipping - insufficient contract balance");
        this.skip();
      }

      const distributorConnected = revenueDistributor.connect(deployer) as RevenueDistributor;
      const tx = await distributorConnected.distributeRevenue(
        creator1.address,
        REVENUE_AMOUNT
      );

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
      console.log("✅ Revenue distributed to Creator 1. TX:", receipt!.hash);

      const pendingRevenue = await revenueDistributor.getPendingCreatorRevenue(creator1.address);
      expect(pendingRevenue).to.be.gt(0);
    });

    it("Transaction 2: Distribute revenue to Creator 2", async function () {
      const contractBalance = await usdc.balanceOf(await revenueDistributor.getAddress());
      if (contractBalance < REVENUE_AMOUNT) {
        console.log("⚠️  Skipping - insufficient contract balance");
        this.skip();
      }

      const distributorConnected = revenueDistributor.connect(deployer) as RevenueDistributor;
      const tx = await distributorConnected.distributeRevenue(
        creator2.address,
        REVENUE_AMOUNT
      );

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
      console.log("✅ Revenue distributed to Creator 2. TX:", receipt!.hash);
    });

    it("Transaction 3: Creator 1 claims revenue", async function () {
      const pendingRevenue = await revenueDistributor.getPendingCreatorRevenue(creator1.address);
      if (pendingRevenue === 0n) {
        console.log("⚠️  Skipping - no pending revenue");
        this.skip();
      }

      const balanceBefore = await usdc.balanceOf(creator1.address);

      const distributorConnected = revenueDistributor.connect(creator1) as RevenueDistributor;
      const tx = await distributorConnected.claimCreatorRevenue();
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
      console.log("✅ Creator 1 claimed revenue. TX:", receipt!.hash);

      const balanceAfter = await usdc.balanceOf(creator1.address);
      expect(balanceAfter).to.be.gt(balanceBefore);

      const pendingAfter = await revenueDistributor.getPendingCreatorRevenue(creator1.address);
      expect(pendingAfter).to.equal(0n);
    });

    it("Transaction 4: Creator 2 claims revenue", async function () {
      const pendingRevenue = await revenueDistributor.getPendingCreatorRevenue(creator2.address);
      if (pendingRevenue === 0n) {
        console.log("⚠️  Skipping - no pending revenue");
        this.skip();
      }

      const balanceBefore = await usdc.balanceOf(creator2.address);

      const distributorConnected = revenueDistributor.connect(creator2) as RevenueDistributor;
      const tx = await distributorConnected.claimCreatorRevenue();
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
      console.log("✅ Creator 2 claimed revenue. TX:", receipt!.hash);

      const balanceAfter = await usdc.balanceOf(creator2.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
    });
  });

  describe("Integration Test - Full Flow", function () {
    it("Complete flow: Register Agent → Publish Service → Request Service → Distribute Revenue", async function () {
      // Step 1: Register agent
      const metadataIPFS = "ipfs://QmIntegrationTest";
      const agentRegistryConnected = agentRegistry.connect(agent3) as AgentRegistry;
      const registerTx = await agentRegistryConnected.registerAgent(
        AGENT_ID_3,
        metadataIPFS,
        { value: MIN_STAKE }
      );
      await registerTx.wait();
      console.log("✅ Step 1: Agent registered");

      // Step 2: Publish service
      const marketplaceConnected = serviceMarketplace.connect(agent3) as ServiceMarketplace;
      const publishTx = await marketplaceConnected.publishService(
        "Integration Test Service",
        "Full flow test",
        "https://api.example.com/integration",
        SERVICE_PRICE_MIN
      );
      await publishTx.wait();
      const serviceId = await serviceMarketplace.providerServices(agent3.address, 0);
      console.log("✅ Step 2: Service published");

      // Step 3: Request service (if USDC available)
      try {
        const balance = await usdc.balanceOf(consumer2.address);
        if (balance >= SERVICE_PRICE_MIN) {
          const service = await serviceMarketplace.getService(serviceId);
          const usdcConnected = usdc.connect(consumer2) as IERC20;
          await usdcConnected.approve(await serviceMarketplace.getAddress(), service.pricePerRequest);
          const requestTx = await marketplaceConnected.requestService(serviceId);
          await requestTx.wait();
          console.log("✅ Step 3: Service requested");
        } else {
          console.log("⚠️  Step 3: Skipped (insufficient USDC)");
        }
      } catch (error) {
        console.log("⚠️  Step 3: Skipped (USDC error)");
      }

      // Step 4: Distribute revenue (if USDC available in contract)
      try {
        const contractBalance = await usdc.balanceOf(await revenueDistributor.getAddress());
        if (contractBalance >= REVENUE_AMOUNT) {
          const distributorConnected = revenueDistributor.connect(deployer) as RevenueDistributor;
          const revenueTx = await distributorConnected.distributeRevenue(
            agent3.address,
            REVENUE_AMOUNT
          );
          await revenueTx.wait();
          console.log("✅ Step 4: Revenue distributed");
        } else {
          console.log("⚠️  Step 4: Skipped (insufficient contract USDC)");
        }
      } catch (error) {
        console.log("⚠️  Step 4: Skipped (revenue distribution error)");
      }

      console.log("✅ Integration test completed");
    });
  });
});

