/**
 * End-to-End Transaction Script for AgentHub Protocol on Avalanche Fuji Testnet
 * 
 * Executes 4 real on-chain transactions for each contract:
 * - AgentRegistry: Register agents, add stake, update reputation
 * - ServiceMarketplace: Publish services, request services, rate services
 * - RevenueDistributor: Distribute revenue, claim revenue
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load deployed contract addresses
const deploymentsPath = path.join(__dirname, "../deployments/fuji-latest.json");
const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));

async function main() {
  console.log("🚀 Starting End-to-End Transactions on Avalanche Fuji Testnet\n");

  const signers = await ethers.getSigners();
  console.log("📋 Available signers:", signers.length);
  
  // Use deployer for all transactions if only one signer available
  const deployer = signers[0];
  const agent1 = signers[1] || deployer;
  const agent2 = signers[2] || deployer;
  const agent3 = signers[3] || deployer;
  const agent4 = signers[4] || deployer;
  const provider1 = signers[5] || deployer;
  const provider2 = signers[6] || deployer;
  const consumer1 = signers[7] || deployer;
  const consumer2 = signers[8] || deployer;
  const creator1 = signers[9] || deployer;
  const creator2 = signers[10] || deployer;

  console.log("📋 Configuration:");
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId);
  console.log("Deployer:", deployer.address);
  console.log("Deployer Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "AVAX");
  
  // Check if we have multiple signers or need to use deployer for all
  if (signers.length === 1) {
    console.log("⚠️  Only one signer available - using deployer for all transactions\n");
  } else {
    console.log(`✅ Using ${signers.length} signers\n`);
  }

  // Connect to deployed contracts using getContractFactory + attach (same pattern as deploy.js)
  const AgentRegistryFactory = await ethers.getContractFactory("AgentRegistry");
  const RevenueDistributorFactory = await ethers.getContractFactory("RevenueDistributor");
  const ServiceMarketplaceFactory = await ethers.getContractFactory("ServiceMarketplace");
  
  // Attach contracts to deployed addresses (will use .connect() for each signer)
  const agentRegistry = AgentRegistryFactory.attach(deployments.contracts.AgentRegistry);
  const revenueDistributor = RevenueDistributorFactory.attach(deployments.contracts.RevenueDistributor);
  const serviceMarketplace = ServiceMarketplaceFactory.attach(deployments.contracts.ServiceMarketplace);
  const usdc = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", deployments.contracts.USDC);

  // Minimum amounts - usando cantidades mínimas verificables
  // Nota: El contrato requiere 1 AVAX mínimo para registro, pero usamos 0.01 para otras operaciones
  const MIN_STAKE_REQUIRED = ethers.parseEther("1"); // 1 AVAX requerido por contrato para registro
  const MIN_STAKE = ethers.parseEther("0.01"); // 0.01 AVAX para operaciones adicionales (mínimo verificable)
  const MIN_USDC = ethers.parseUnits("0.01", 6); // 0.01 USDC (mínimo verificable)
  const REVENUE_AMOUNT = ethers.parseUnits("0.01", 6); // 0.01 USDC (mínimo verificable)
  const ADDITIONAL_STAKE = ethers.parseEther("0.01"); // 0.01 AVAX adicional (mínimo verificable)

  const transactions = [];

  // ============================================
  // AgentRegistry - 4 Transactions
  // ============================================
  console.log("📦 AgentRegistry Transactions:\n");

  // Transaction 1: Register Agent 1 (requiere 1 AVAX mínimo por contrato)
  try {
    // Verificar si ya está registrado
    const agent1Profile = await agentRegistry.agents(agent1.address);
    if (agent1Profile.owner !== ethers.ZeroAddress) {
      console.log("⚠️  TX 1: Agent 1 ya está registrado, saltando...");
    } else {
      const agentId1 = ethers.id("e2e-agent-001-" + Date.now()); // ID único
      const tx1 = await agentRegistry.connect(agent1).registerAgent(agentId1, "ipfs://QmE2ETest001", {
        value: MIN_STAKE_REQUIRED, // 1 AVAX requerido por contrato
      });
      const receipt1 = await tx1.wait();
      transactions.push(receipt1.hash);
      console.log("✅ TX 1: Agent 1 registered (1 AVAX - mínimo requerido por contrato)");
      console.log("   Hash:", receipt1.hash);
      console.log("   Link: https://testnet.snowtrace.io/tx/" + receipt1.hash);
    }
  } catch (error) {
    console.log("❌ TX 1 failed:", error.message);
  }

  // Transaction 2: Register Agent 2 with PoAI
  try {
    const agentId2 = ethers.id("e2e-agent-002");
    const kitePoAIHash = ethers.id("kite-proof-e2e-002");
    const tx2 = await agentRegistry.connect(agent2).registerAgentWithPoAI(
      agentId2,
      "ipfs://QmE2ETest002",
      kitePoAIHash,
      { value: MIN_STAKE }
    );
    const receipt2 = await tx2.wait();
    transactions.push(receipt2.hash);
    console.log("✅ TX 2: Agent 2 registered with PoAI");
    console.log("   Hash:", receipt2.hash);
    console.log("   Link: https://testnet.snowtrace.io/tx/" + receipt2.hash);
  } catch (error) {
    console.log("❌ TX 2 failed:", error.message);
  }

  // Transaction 3: Add stake to Agent 1 (0.01 AVAX mínimo verificable)
  try {
    const agentId1 = ethers.id("e2e-agent-001");
    const tx3 = await agentRegistry.connect(agent1).addStake(agentId1, { value: ADDITIONAL_STAKE });
    const receipt3 = await tx3.wait();
    transactions.push(receipt3.hash);
    console.log("✅ TX 3: Additional stake added to Agent 1 (0.01 AVAX)");
    console.log("   Hash:", receipt3.hash);
    console.log("   Link: https://testnet.snowtrace.io/tx/" + receipt3.hash);
  } catch (error) {
    console.log("❌ TX 3 failed:", error.message);
  }

  // Transaction 4: Update reputation for Agent 1 (con valor mínimo verificable)
  try {
    const agentId1 = ethers.id("e2e-agent-001");
    const tx4 = await agentRegistry.connect(deployer).updateReputation(
      agentId1,
      true,
      ethers.parseEther("0.01"), // 0.01 AVAX mínimo verificable
      "service-delivery"
    );
    const receipt4 = await tx4.wait();
    transactions.push(receipt4.hash);
    console.log("✅ TX 4: Reputation updated for Agent 1 (0.01 AVAX value)");
    console.log("   Hash:", receipt4.hash);
    console.log("   Link: https://testnet.snowtrace.io/tx/" + receipt4.hash);
  } catch (error) {
    console.log("❌ TX 4 failed:", error.message);
  }

  // ============================================
  // ServiceMarketplace - 4 Transactions
  // ============================================
  console.log("\n📦 ServiceMarketplace Transactions:\n");

  // Transaction 1: Publish Service 1
  try {
    const tx5 = await serviceMarketplace.connect(provider1).publishService(
      "E2E Test Service 1",
      "End-to-end test service description",
      "https://api.example.com/service1",
      MIN_USDC
    );
    const receipt5 = await tx5.wait();
    transactions.push(receipt5.hash);
    console.log("✅ TX 5: Service 1 published");
    console.log("   Hash:", receipt5.hash);
    console.log("   Link: https://testnet.snowtrace.io/tx/" + receipt5.hash);
  } catch (error) {
    console.log("❌ TX 5 failed:", error.message);
  }

  // Transaction 2: Publish Service 2
  try {
    const tx6 = await serviceMarketplace.connect(provider2).publishService(
      "E2E Test Service 2",
      "Second end-to-end test service",
      "https://api.example.com/service2",
      MIN_USDC
    );
    const receipt6 = await tx6.wait();
    transactions.push(receipt6.hash);
    console.log("✅ TX 6: Service 2 published");
    console.log("   Hash:", receipt6.hash);
    console.log("   Link: https://testnet.snowtrace.io/tx/" + receipt6.hash);
  } catch (error) {
    console.log("❌ TX 6 failed:", error.message);
  }

  // Transaction 3: Request Service 1 (use different consumer if provider1 == consumer1)
  try {
    const serviceId = await serviceMarketplace.providerServices(provider1.address, 0);
    const service = await serviceMarketplace.getService(serviceId);
    
    // Use consumer2 if consumer1 is the same as provider1
    const actualConsumer = (consumer1.address.toLowerCase() === provider1.address.toLowerCase()) ? consumer2 : consumer1;
    
    // Check balance
    const balance = await usdc.balanceOf(actualConsumer.address);
    if (balance < service.pricePerRequest) {
      console.log("⚠️  TX 7: Skipped - insufficient USDC balance for", actualConsumer.address);
      console.log("   Balance:", ethers.formatUnits(balance, 6), "USDC, Required:", ethers.formatUnits(service.pricePerRequest, 6), "USDC");
    } else {
      // Approve
      await usdc.connect(actualConsumer).approve(await serviceMarketplace.getAddress(), service.pricePerRequest);
      
      // Request
      const tx7 = await serviceMarketplace.connect(actualConsumer).requestService(serviceId);
      const receipt7 = await tx7.wait();
      transactions.push(receipt7.hash);
      console.log("✅ TX 7: Service requested by", actualConsumer.address);
      console.log("   Hash:", receipt7.hash);
      console.log("   Link: https://testnet.snowtrace.io/tx/" + receipt7.hash);
    }
  } catch (error) {
    console.log("❌ TX 7 failed:", error.message);
  }

  // Transaction 4: Complete and rate Service (use same consumer as TX 7)
  try {
    const actualConsumer = (consumer1.address.toLowerCase() === provider1.address.toLowerCase()) ? consumer2 : consumer1;
    const requests = await serviceMarketplace.getConsumerRequests(actualConsumer.address);
    if (requests.length === 0) {
      console.log("⚠️  TX 8: Skipped - no requests found for", actualConsumer.address);
    } else {
      const requestId = requests[0].requestId;
      const tx8 = await serviceMarketplace.connect(actualConsumer).completeServiceRequest(requestId, 5);
      const receipt8 = await tx8.wait();
      transactions.push(receipt8.hash);
      console.log("✅ TX 8: Service completed and rated");
      console.log("   Hash:", receipt8.hash);
      console.log("   Link: https://testnet.snowtrace.io/tx/" + receipt8.hash);
    }
  } catch (error) {
    console.log("❌ TX 8 failed:", error.message);
  }

  // ============================================
  // RevenueDistributor - 4 Transactions
  // ============================================
  console.log("\n📦 RevenueDistributor Transactions:\n");

  // First, transfer USDC to contract if needed
  try {
    const contractAddress = await revenueDistributor.getAddress();
    const contractBalance = await usdc.balanceOf(contractAddress);
    const deployerBalance = await usdc.balanceOf(deployer.address);
    const neededAmount = REVENUE_AMOUNT * 4n;
    
    console.log("💰 RevenueDistributor USDC Balance:", ethers.formatUnits(contractBalance, 6));
    console.log("💰 Deployer USDC Balance:", ethers.formatUnits(deployerBalance, 6));
    
    if (contractBalance < neededAmount && deployerBalance >= neededAmount) {
      const transferTx = await usdc.connect(deployer).transfer(contractAddress, neededAmount);
      await transferTx.wait();
      console.log("✅ Transferred", ethers.formatUnits(neededAmount, 6), "USDC to RevenueDistributor");
    } else if (contractBalance < neededAmount) {
      console.log("⚠️  Deployer doesn't have enough USDC to transfer");
    }
  } catch (error) {
    console.log("⚠️  Could not transfer USDC to contract:", error.message);
  }

  // Transaction 1: Distribute revenue to Creator 1
  try {
    const contractBalance = await usdc.balanceOf(await revenueDistributor.getAddress());
    if (contractBalance < REVENUE_AMOUNT) {
      console.log("⚠️  TX 9: Skipped - insufficient contract balance");
    } else {
      const tx9 = await revenueDistributor.connect(deployer).distributeRevenue(creator1.address, REVENUE_AMOUNT);
      const receipt9 = await tx9.wait();
      transactions.push(receipt9.hash);
      console.log("✅ TX 9: Revenue distributed to Creator 1");
      console.log("   Hash:", receipt9.hash);
      console.log("   Link: https://testnet.snowtrace.io/tx/" + receipt9.hash);
    }
  } catch (error) {
    console.log("❌ TX 9 failed:", error.message);
  }

  // Transaction 2: Distribute revenue to Creator 2
  try {
    const contractBalance = await usdc.balanceOf(await revenueDistributor.getAddress());
    if (contractBalance < REVENUE_AMOUNT) {
      console.log("⚠️  TX 10: Skipped - insufficient contract balance");
    } else {
      const tx10 = await revenueDistributor.connect(deployer).distributeRevenue(creator2.address, REVENUE_AMOUNT);
      const receipt10 = await tx10.wait();
      transactions.push(receipt10.hash);
      console.log("✅ TX 10: Revenue distributed to Creator 2");
      console.log("   Hash:", receipt10.hash);
      console.log("   Link: https://testnet.snowtrace.io/tx/" + receipt10.hash);
    }
  } catch (error) {
    console.log("❌ TX 10 failed:", error.message);
  }

  // Transaction 3: Creator 1 claims revenue
  try {
    const pending = await revenueDistributor.getPendingCreatorRevenue(creator1.address);
    if (pending === 0n) {
      console.log("⚠️  TX 11: Skipped - no pending revenue");
    } else {
      const tx11 = await revenueDistributor.connect(creator1).claimCreatorRevenue();
      const receipt11 = await tx11.wait();
      transactions.push(receipt11.hash);
      console.log("✅ TX 11: Creator 1 claimed revenue");
      console.log("   Hash:", receipt11.hash);
      console.log("   Link: https://testnet.snowtrace.io/tx/" + receipt11.hash);
    }
  } catch (error) {
    console.log("❌ TX 11 failed:", error.message);
  }

  // Transaction 4: Creator 2 claims revenue
  try {
    const pending = await revenueDistributor.getPendingCreatorRevenue(creator2.address);
    if (pending === 0n) {
      console.log("⚠️  TX 12: Skipped - no pending revenue");
    } else {
      const tx12 = await revenueDistributor.connect(creator2).claimCreatorRevenue();
      const receipt12 = await tx12.wait();
      transactions.push(receipt12.hash);
      console.log("✅ TX 12: Creator 2 claimed revenue");
      console.log("   Hash:", receipt12.hash);
      console.log("   Link: https://testnet.snowtrace.io/tx/" + receipt12.hash);
    }
  } catch (error) {
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

