import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Starting AgentHub deployment on Avalanche Fuji...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "AVAX\n");

  // USDC testnet address on Fuji
  const USDC_FUJI = "0x5425890298aed601595a70AB815c96711a31Bc65";

  // 1. Deploy AgentRegistry
  console.log("📦 Deploying AgentRegistry...");
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();
  const agentRegistryAddress = await agentRegistry.getAddress();
  console.log("✅ AgentRegistry deployed to:", agentRegistryAddress);

  // 2. Deploy RevenueDistributor
  console.log("\n📦 Deploying RevenueDistributor...");
  const RevenueDistributor = await ethers.getContractFactory("RevenueDistributor");
  const revenueDistributor = await RevenueDistributor.deploy(USDC_FUJI);
  await revenueDistributor.waitForDeployment();
  const revenueDistributorAddress = await revenueDistributor.getAddress();
  console.log("✅ RevenueDistributor deployed to:", revenueDistributorAddress);

  // 3. Deploy ServiceMarketplace
  console.log("\n📦 Deploying ServiceMarketplace...");
  const ServiceMarketplace = await ethers.getContractFactory("ServiceMarketplace");
  const serviceMarketplace = await ServiceMarketplace.deploy(USDC_FUJI);
  await serviceMarketplace.waitForDeployment();
  const serviceMarketplaceAddress = await serviceMarketplace.getAddress();
  console.log("✅ ServiceMarketplace deployed to:", serviceMarketplaceAddress);

  // Save deployment addresses
  const deploymentInfo = {
    network: "avalanche-fuji",
    chainId: 43113,
    timestamp: new Date().toISOString(),
    contracts: {
      AgentRegistry: agentRegistryAddress,
      RevenueDistributor: revenueDistributorAddress,
      ServiceMarketplace: serviceMarketplaceAddress,
      USDC: USDC_FUJI,
    },
    deployer: deployer.address,
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentsDir, "fuji-latest.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n✅ Deployment complete!");
  console.log("\n📄 Contract addresses saved to: deployments/fuji-latest.json");
  console.log("\n🔍 Verify contracts with:");
  console.log(`npx hardhat verify --network fuji ${agentRegistryAddress}`);
  console.log(`npx hardhat verify --network fuji ${revenueDistributorAddress} ${USDC_FUJI}`);
  console.log(`npx hardhat verify --network fuji ${serviceMarketplaceAddress} ${USDC_FUJI}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

