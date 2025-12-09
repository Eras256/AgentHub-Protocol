/**
 * End-to-End Transaction Script for AgentHub Protocol on Avalanche Fuji Testnet
 * 
 * Executes 4 real on-chain transactions for each contract:
 * - AgentRegistry: Register agents, add stake, update reputation
 * - ServiceMarketplace: Publish services, request services, rate services
 * - RevenueDistributor: Distribute revenue, claim revenue
 */

import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load deployed contract addresses
const deploymentsPath = path.join(__dirname, "../deployments/fuji-latest.json");
const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));

async function main() {
  console.log("🚀 Starting End-to-End Transactions on Avalanche Fuji Testnet\n");

  const [deployer, agent1, agent2, agent3, agent4, provider1, provider2, consumer1, consumer2, creator1, creator2] = await ethers.getSigners();

  console.log("📋 Configuration:");
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("Deployer:", deployer.address);
  console.log("Deployer Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "AVAX\n");

  // Connect to deployed contracts
  const AgentRegistryFactory = await ethers.getContractFactory("AgentRegistry");
  const RevenueDistributorFactory = await ethers.getContractFactory("RevenueDistributor");
  const ServiceMarketplaceFactory = await ethers.getContractFactory("ServiceMarketplace");
  
  const agentRegistry = AgentRegistryFactory.attach(deployments.contracts.AgentRegistry);
  const revenueDistributor = RevenueDistributorFactory.attach(deployments.contracts.RevenueDistributor);
  const serviceMarketplace = ServiceMarketplaceFactory.attach(deployments.contracts.ServiceMarketplace);
  const usdc = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", deployments.contracts.USDC);

  // Minimum amounts
  const MIN_STAKE = ethers.parseEther("1"); // 1 AVAX
  const MIN_USDC = ethers.parseUnits("0.01", 6); // 0.01 USDC
  const REVENUE_AMOUNT = ethers.parseUnits("1", 6); // 1 USDC

  const transactions: string[] = [];

  // ============================================
  // AgentRegistry - 4 Transactions
  // ============================================
  console.log("📦 AgentRegistry Transactions:\n");

  // Transaction 1: Register Agent 1
  try {
    const agentId1 = ethers.id("e2e-agent-001");
    const tx1 = await (agentRegistry.connect(agent1) as any).registerAgent(agentId1, "ipfs://QmE2ETest001", {
      value: MIN_STAKE,
    });
    const receipt1 = await tx1.wait();
    transactions.push(receipt1!.hash);
    console.log("✅ TX 1: Agent 1 registered");
    console.log("   Hash:", receipt1!.hash);
    console.log("   Link: https://testnet.snowtrace.io/tx/" + receipt1!.hash);
  } catch (error: any) {
    console.log("❌ TX 1 failed:", error.message);
  }

  // Transaction 2: Register Agent 2 with PoAI
  try {
    const agentId2 = ethers.id("e2e-agent-002");
    const kitePoAIHash = ethers.id("kite-proof-e2e-002");
    const tx2 = await (agentRegistry.connect(agent2) as any).registerAgentWithPoAI(
      agentId2,
      "ipfs://QmE2ETest002",
      kitePoAIHash,
      { value: MIN_STAKE }
    );
    const receipt2 = await tx2.wait();
    transactions.push(receipt2!.hash);
    console.log("✅ TX 2: Agent 2 registered with PoAI");
    console.log("   Hash:", receipt2!.hash);
    console.log("   Link: https://testnet.snowtrace.io/tx/" + receipt2!.hash);
  } catch (error: any) {
    console.log("❌ TX 2 failed:", error.message);
  }

  // Transaction 3: Add stake to Agent 1
  try {
    const agentId1 = ethers.id("e2e-agent-001");
    const additionalStake = ethers.parseEther("0.5");
    const tx3 = await (agentRegistry.connect(agent1) as any).addStake(agentId1, { value: additionalStake });
    const receipt3 = await tx3.wait();
    transactions.push(receipt3!.hash);
    console.log("✅ TX 3: Additional stake added to Agent 1");
    console.log("   Hash:", receipt3!.hash);
    console.log("   Link: https://testnet.snowtrace.io/tx/" + receipt3!.hash);
  } catch (error: any) {
    console.log("❌ TX 3 failed:", error.message);
  }

  // Transaction 4: Update reputation for Agent 1
  try {
    const agentId1 = ethers.id("e2e-agent-001");
    const tx4 = await (agentRegistry.connect(deployer) as any).updateReputation(
      agentId1,
      true,
      ethers.parseEther("1"),
      "service-delivery"
    );
    const receipt4 = await tx4.wait();
    transactions.push(receipt4!.hash);
    console.log("✅ TX 4: Reputation updated for Agent 1");
    console.log("   Hash:", receipt4!.hash);
    console.log("   Link: https://testnet.snowtrace.io/tx/" + receipt4!.hash);
  } catch (error: any) {
    console.log("❌ TX 4 failed:", error.message);
  }

  // ============================================
  // ServiceMarketplace - 4 Transactions
  // ============================================
  console.log("\n📦 ServiceMarketplace Transactions:\n");

  // Transaction 1: Publish Service 1
  try {
    const tx5 = await (serviceMarketplace.connect(provider1) as any).publishService(
      "E2E Test Service 1",
      "End-to-end test service description",
      "https://api.example.com/service1",
      MIN_USDC
    );
    const receipt5 = await tx5.wait();
    transactions.push(receipt5!.hash);
    console.log("✅ TX 5: Service 1 published");
    console.log("   Hash:", receipt5!.hash);
    console.log("   Link: https://testnet.snowtrace.io/tx/" + receipt5!.hash);
  } catch (error: any) {
    console.log("❌ TX 5 failed:", error.message);
  }

  // Transaction 2: Publish Service 2
  try {
    const tx6 = await (serviceMarketplace.connect(provider2) as any).publishService(
      "E2E Test Service 2",
      "Second end-to-end test service",
      "https://api.example.com/service2",
      MIN_USDC
    );
    const receipt6 = await tx6.wait();
    transactions.push(receipt6!.hash);
    console.log("✅ TX 6: Service 2 published");
    console.log("   Hash:", receipt6!.hash);
    console.log("   Link: https://testnet.snowtrace.io/tx/" + receipt6!.hash);
  } catch (error: any) {
    console.log("❌ TX 6 failed:", error.message);
  }

  // Transaction 3: Request Service 1
  try {
    const serviceId = await (serviceMarketplace as any).providerServices(provider1.address, 0);
    const service = await (serviceMarketplace as any).getService(serviceId);
    
    // Check balance
    const balance = await (usdc as any).balanceOf(consumer1.address);
    if (balance < service.pricePerRequest) {
      console.log("⚠️  TX 7: Skipped - insufficient USDC balance");
    } else {
      // Approve
      await (usdc.connect(consumer1) as any).approve(await serviceMarketplace.getAddress(), service.pricePerRequest);
      
      // Request
      const tx7 = await (serviceMarketplace.connect(consumer1) as any).requestService(serviceId);
      const receipt7 = await tx7.wait();
      transactions.push(receipt7!.hash);
      console.log("✅ TX 7: Service requested");
      console.log("   Hash:", receipt7!.hash);
      console.log("   Link: https://testnet.snowtrace.io/tx/" + receipt7!.hash);
    }
  } catch (error: any) {
    console.log("❌ TX 7 failed:", error.message);
  }

  // Transaction 4: Complete and rate Service
  try {
    const requests = await (serviceMarketplace as any).getConsumerRequests(consumer1.address);
    if (requests.length === 0) {
      console.log("⚠️  TX 8: Skipped - no requests found");
    } else {
      const requestId = requests[0].requestId;
      const tx8 = await (serviceMarketplace.connect(consumer1) as any).completeServiceRequest(requestId, 5);
      const receipt8 = await tx8.wait();
      transactions.push(receipt8!.hash);
      console.log("✅ TX 8: Service completed and rated");
      console.log("   Hash:", receipt8!.hash);
      console.log("   Link: https://testnet.snowtrace.io/tx/" + receipt8!.hash);
    }
  } catch (error: any) {
    console.log("❌ TX 8 failed:", error.message);
  }

  // ============================================
  // RevenueDistributor - 4 Transactions
  // ============================================
  console.log("\n📦 RevenueDistributor Transactions:\n");

  // First, transfer USDC to contract if needed
  try {
    const contractBalance = await (usdc as any).balanceOf(await revenueDistributor.getAddress());
    const deployerBalance = await (usdc as any).balanceOf(deployer.address);
    
    if (contractBalance < REVENUE_AMOUNT * 4n && deployerBalance >= REVENUE_AMOUNT * 4n) {
      await (usdc.connect(deployer) as any).transfer(await revenueDistributor.getAddress(), REVENUE_AMOUNT * 4n);
      console.log("✅ Transferred USDC to RevenueDistributor");
    }
  } catch (error: any) {
    console.log("⚠️  Could not transfer USDC to contract:", error.message);
  }

  // Transaction 1: Distribute revenue to Creator 1
  try {
    const contractBalance = await (usdc as any).balanceOf(await revenueDistributor.getAddress());
    if (contractBalance < REVENUE_AMOUNT) {
      console.log("⚠️  TX 9: Skipped - insufficient contract balance");
    } else {
      const tx9 = await (revenueDistributor.connect(deployer) as any).distributeRevenue(creator1.address, REVENUE_AMOUNT);
      const receipt9 = await tx9.wait();
      transactions.push(receipt9!.hash);
      console.log("✅ TX 9: Revenue distributed to Creator 1");
      console.log("   Hash:", receipt9!.hash);
      console.log("   Link: https://testnet.snowtrace.io/tx/" + receipt9!.hash);
    }
  } catch (error: any) {
    console.log("❌ TX 9 failed:", error.message);
  }

  // Transaction 2: Distribute revenue to Creator 2
  try {
    const contractBalance = await (usdc as any).balanceOf(await revenueDistributor.getAddress());
    if (contractBalance < REVENUE_AMOUNT) {
      console.log("⚠️  TX 10: Skipped - insufficient contract balance");
    } else {
      const tx10 = await (revenueDistributor.connect(deployer) as any).distributeRevenue(creator2.address, REVENUE_AMOUNT);
      const receipt10 = await tx10.wait();
      transactions.push(receipt10!.hash);
      console.log("✅ TX 10: Revenue distributed to Creator 2");
      console.log("   Hash:", receipt10!.hash);
      console.log("   Link: https://testnet.snowtrace.io/tx/" + receipt10!.hash);
    }
  } catch (error: any) {
    console.log("❌ TX 10 failed:", error.message);
  }

  // Transaction 3: Creator 1 claims revenue
  try {
    const pending = await (revenueDistributor as any).getPendingCreatorRevenue(creator1.address);
    if (pending === 0n) {
      console.log("⚠️  TX 11: Skipped - no pending revenue");
    } else {
      const tx11 = await (revenueDistributor.connect(creator1) as any).claimCreatorRevenue();
      const receipt11 = await tx11.wait();
      transactions.push(receipt11!.hash);
      console.log("✅ TX 11: Creator 1 claimed revenue");
      console.log("   Hash:", receipt11!.hash);
      console.log("   Link: https://testnet.snowtrace.io/tx/" + receipt11!.hash);
    }
  } catch (error: any) {
    console.log("❌ TX 11 failed:", error.message);
  }

  // Transaction 4: Creator 2 claims revenue
  try {
    const pending = await (revenueDistributor as any).getPendingCreatorRevenue(creator2.address);
    if (pending === 0n) {
      console.log("⚠️  TX 12: Skipped - no pending revenue");
    } else {
      const tx12 = await (revenueDistributor.connect(creator2) as any).claimCreatorRevenue();
      const receipt12 = await tx12.wait();
      transactions.push(receipt12!.hash);
      console.log("✅ TX 12: Creator 2 claimed revenue");
      console.log("   Hash:", receipt12!.hash);
      console.log("   Link: https://testnet.snowtrace.io/tx/" + receipt12!.hash);
    }
  } catch (error: any) {
    console.log("❌ TX 12 failed:", error.message);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Summary:");
  console.log("Total transactions executed:", transactions.length);
  console.log("Transaction hashes:", transactions);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

