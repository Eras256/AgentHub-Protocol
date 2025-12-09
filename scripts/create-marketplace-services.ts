import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load .env.local first, then .env as fallback
dotenv.config({ path: ".env.local" });
dotenv.config();

// ServiceMarketplace ABI (minimal needed for publishService)
const MARKETPLACE_ABI = [
  "function publishService(string calldata _name, string calldata _description, string calldata _endpointURL, uint256 _pricePerRequest) external returns (bytes32)",
  "function getAllServices() external view returns (tuple(bytes32 serviceId, address provider, string name, string description, string endpointURL, uint256 pricePerRequest, uint256 totalRequests, uint256 rating, uint256 ratingCount, bool isActive, uint256 createdAt)[])",
  "function totalServices() external view returns (uint256)",
  "event ServicePublished(bytes32 indexed serviceId, address indexed provider, string name, uint256 pricePerRequest)",
];

// Example services to create
const SERVICES = [
  {
    name: "Premium Market Data",
    description: "Real-time cryptocurrency market data with 99.9% uptime. Includes price feeds, volume, market cap, and historical data for 1000+ tokens.",
    endpointURL: "https://api.agenthub.io/market-data",
    pricePerRequest: "0.00001", // 0.00001 USDC (minimum)
  },
  {
    name: "AI Sentiment Analysis",
    description: "Advanced AI-powered sentiment analysis for social media, news, and market trends. Returns sentiment scores and confidence levels.",
    endpointURL: "https://api.agenthub.io/sentiment",
    pricePerRequest: "0.00001", // 0.00001 USDC
  },
  {
    name: "Yield Optimizer",
    description: "Automated DeFi yield optimization recommendations. Analyzes opportunities across Trader Joe, Benqi, Aave, and more.",
    endpointURL: "https://api.agenthub.io/yield",
    pricePerRequest: "0.00001", // 0.00001 USDC
  },
  {
    name: "Weather Oracle",
    description: "Reliable weather data oracle for IoT devices. Provides temperature, humidity, and forecast data for any location.",
    endpointURL: "https://api.agenthub.io/weather",
    pricePerRequest: "0.00001", // 0.00001 USDC
  },
  {
    name: "Price Oracle",
    description: "On-chain price oracle with Chainlink integration. Provides verified price feeds for DeFi protocols.",
    endpointURL: "https://api.agenthub.io/price-oracle",
    pricePerRequest: "0.00001", // 0.00001 USDC
  },
  {
    name: "Transaction Analytics",
    description: "Deep transaction analysis and pattern detection. Identifies anomalies, MEV opportunities, and trading signals.",
    endpointURL: "https://api.agenthub.io/analytics",
    pricePerRequest: "0.00001", // 0.00001 USDC
  },
];

async function main() {
  console.log("🚀 Creating services in AgentHub Marketplace...\n");

  // Get configuration from environment
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY?.trim();
  if (!privateKey) {
    throw new Error("DEPLOYER_PRIVATE_KEY not found in .env.local");
  }

  // Clean private key (remove 0x prefix if present, ensure 64 hex chars)
  const cleanKey = privateKey.replace(/^0x/, "").replace(/\s/g, "");
  if (cleanKey.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
    throw new Error("Invalid DEPLOYER_PRIVATE_KEY format. Must be 64 hex characters.");
  }

  const rpcUrl = process.env.AVALANCHE_FUJI_RPC || "https://api.avax-test.network/ext/bc/C/rpc";
  let marketplaceAddress = process.env.NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS;

  // Try to load from deployments file if not in env
  if (!marketplaceAddress) {
    try {
      const deploymentsPath = path.join(__dirname, "../deployments/fuji-latest.json");
      if (fs.existsSync(deploymentsPath)) {
        const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));
        marketplaceAddress = deployments.contracts?.ServiceMarketplace;
      }
    } catch (e) {
      // Ignore
    }
  }

  // Fallback to default from latest deployment
  if (!marketplaceAddress) {
    marketplaceAddress = "0xe51BF692F7ce26999f8D18d799f73Ad250BfeEC4";
    console.warn("⚠️  Using default marketplace address from latest deployment");
  }

  if (!marketplaceAddress) {
    throw new Error("NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS not found. Please set it in .env.local or deploy the contracts first.");
  }

  console.log("📋 Configuration:");
  console.log(`   Network: Avalanche Fuji`);
  console.log(`   RPC: ${rpcUrl}`);
  console.log(`   Marketplace: ${marketplaceAddress}`);
  console.log(`   Wallet: ${new ethers.Wallet(`0x${cleanKey}`).address}\n`);

  // Connect to network
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(`0x${cleanKey}`, provider);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Wallet Balance: ${ethers.formatEther(balance)} AVAX`);

  if (balance < ethers.parseEther("0.001")) {
    console.warn("⚠️  Warning: Low balance! You may need more AVAX for gas fees.");
    console.log("   Get testnet AVAX from: https://faucet.avax.network/\n");
  }

  // Get marketplace contract
  const marketplace = new ethers.Contract(marketplaceAddress, MARKETPLACE_ABI, wallet);

  // Check current service count
  const currentTotal = await marketplace.totalServices();
  console.log(`📊 Current services in marketplace: ${currentTotal}\n`);

  // Create services
  const createdServices: Array<{ name: string; serviceId: string; txHash: string }> = [];

  for (let i = 0; i < SERVICES.length; i++) {
    const service = SERVICES[i];
    console.log(`📝 Creating service ${i + 1}/${SERVICES.length}: ${service.name}`);

    try {
      // Convert price to USDC (6 decimals)
      const priceInUSDC = ethers.parseUnits(service.pricePerRequest, 6);

      // Publish service
      const tx = await marketplace.publishService(
        service.name,
        service.description,
        service.endpointURL,
        priceInUSDC,
        {
          gasLimit: 500000, // Set gas limit to avoid estimation issues
        }
      );

      console.log(`   ⏳ Transaction sent: ${tx.hash}`);
      console.log(`   ⏳ Waiting for confirmation...`);

      const receipt = await tx.wait();
      console.log(`   ✅ Confirmed in block ${receipt.blockNumber}`);

      // Get service ID from event
      let serviceId: string = "";
      try {
        const event = receipt.logs.find((log: any) => {
          try {
            const parsed = marketplace.interface.parseLog(log);
            return parsed?.name === "ServicePublished";
          } catch {
            return false;
          }
        });

        if (event) {
          const parsed = marketplace.interface.parseLog(event);
          serviceId = parsed?.args[0]; // serviceId is first indexed arg
          console.log(`   🆔 Service ID: ${serviceId}`);
        } else {
          // Try to get from transaction receipt events
          const iface = new ethers.Interface(MARKETPLACE_ABI);
          for (const log of receipt.logs) {
            try {
              const parsed = iface.parseLog(log);
              if (parsed && parsed.name === "ServicePublished") {
                serviceId = parsed.args[0];
                console.log(`   🆔 Service ID: ${serviceId}`);
                break;
              }
            } catch (e) {
              // Continue searching
            }
          }
        }

        if (!serviceId) {
          console.log(`   ⚠️  Could not extract service ID from event, using tx hash as reference`);
          serviceId = tx.hash;
        }
      } catch (error: any) {
        console.log(`   ⚠️  Error extracting service ID: ${error.message}`);
        serviceId = tx.hash;
      }

      createdServices.push({
        name: service.name,
        serviceId: serviceId || tx.hash, // Use tx hash as fallback
        txHash: tx.hash,
      });

      console.log(`   ✅ Service created successfully!\n`);

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error: any) {
      console.error(`   ❌ Error creating service: ${error.message}`);
      if (error.reason) {
        console.error(`   Reason: ${error.reason}`);
      }
      console.log("");
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Successfully created: ${createdServices.length}/${SERVICES.length} services\n`);

  if (createdServices.length > 0) {
    console.log("Created Services:");
    createdServices.forEach((service, index) => {
      console.log(`\n${index + 1}. ${service.name}`);
      console.log(`   Service ID: ${service.serviceId}`);
      console.log(`   Transaction: https://testnet.snowtrace.io/tx/${service.txHash}`);
    });
  }

  // Verify by getting all services
  try {
    console.log("\n🔍 Verifying services in marketplace...");
    const allServices = await marketplace.getAllServices();
    console.log(`✅ Total services in marketplace: ${allServices.length}`);
    
    if (allServices.length > 0) {
      console.log("\n📋 Services in marketplace:");
      allServices.slice(-createdServices.length).forEach((service: any, index: number) => {
        console.log(`\n${index + 1}. ${service.name}`);
        console.log(`   Provider: ${service.provider}`);
        console.log(`   Price: ${ethers.formatUnits(service.pricePerRequest, 6)} USDC`);
        console.log(`   Active: ${service.isActive}`);
        console.log(`   Service ID: ${service.serviceId}`);
      });
    }
  } catch (error: any) {
    console.error(`⚠️  Could not verify services: ${error.message}`);
  }

  console.log("\n✅ Done! Services should now be visible in the marketplace.");
  console.log(`   View marketplace: http://localhost:3000/marketplace`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Script failed:");
    console.error(error);
    process.exit(1);
  });

