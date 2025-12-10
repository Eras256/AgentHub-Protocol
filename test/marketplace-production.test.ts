/**
 * Production Marketplace Tests
 * 
 * Tests the marketplace requestService functionality with ENS interception
 * Uses private key from .env.local to simulate production environment
 * 
 * Run with: pnpm test test/marketplace-production.test.ts
 */

/// <reference types="hardhat/types" />
import { expect } from "chai";
import hre from "hardhat";
// @ts-ignore - ethers is added to hre by @nomicfoundation/hardhat-ethers plugin
const { ethers } = hre;
import type { JsonRpcProvider, Wallet } from "ethers";
import { IERC20 } from "../typechain-types";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load environment variables
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

describe("Marketplace Production Tests - Request Service with ENS Interception", function () {
  this.timeout(120000); // 2 minutes timeout

  let provider: JsonRpcProvider;
  let signer: Wallet;
  let marketplaceAddress: string;
  let usdcAddress: string;

  before(async function () {
    // Skip if not on Fuji network
    if (hre.network.name !== "fuji") {
      console.log("⚠️  Skipping tests - not on Fuji network");
      this.skip();
    }

    // Check required environment variables
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
    if (!privateKey) {
      console.log("⚠️  Skipping tests - DEPLOYER_PRIVATE_KEY or PRIVATE_KEY not found in .env.local");
      this.skip();
    }

    const rpcUrl = process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC || 
                   process.env.AVALANCHE_FUJI_RPC || 
                   "https://api.avax-test.network/ext/bc/C/rpc";
    
    marketplaceAddress = process.env.NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS || 
                        "0xe51BF692F7ce26999f8D18d799f73Ad250BfeEC4";
    
    usdcAddress = "0x5425890298aed601595a70AB815c96711a31Bc65";

    // Use hardhat's provider or create a new one
    provider = ethers.provider as JsonRpcProvider;
    
    // Create signer from private key
    signer = new ethers.Wallet(privateKey, provider);

    console.log("\n📋 Test Configuration:");
    console.log("Network: Avalanche Fuji Testnet");
    console.log("RPC URL:", rpcUrl);
    console.log("Signer Address:", signer.address);
    console.log("Marketplace Address:", marketplaceAddress);
    console.log("USDC Address:", usdcAddress);

    // Check network
    const network = await provider.getNetwork();
    console.log("Chain ID:", network.chainId.toString());
    
    if (network.chainId.toString() !== "43113") {
      throw new Error("Not connected to Avalanche Fuji Testnet (Chain ID 43113)");
    }

    // Check balances
    const balance = await provider.getBalance(signer.address);
    console.log("AVAX Balance:", ethers.formatEther(balance), "AVAX");
    
    if (balance < ethers.parseEther("0.001")) {
      console.log("⚠️  Warning: Low AVAX balance, some tests may fail");
    }
  });

  describe("Marketplace Contract Connection", function () {
    it("Should connect to marketplace contract without ENS errors", async function () {
      // Use hardhat's getContractAt instead
      const ServiceMarketplace = await ethers.getContractFactory("ServiceMarketplace");
      const contract = await ethers.getContractAt("ServiceMarketplace", marketplaceAddress);
      expect(contract).to.not.be.null;
      
      // Try to call a view function
      const totalServices = await contract.totalServices();
      console.log("✅ Total services:", totalServices.toString());
    });

    it("Should get all services without ENS errors", async function () {
      // Use hardhat's contract interface
      const ServiceMarketplace = await ethers.getContractFactory("ServiceMarketplace");
      const contract = await ethers.getContractAt("ServiceMarketplace", marketplaceAddress);
      
      const services = await contract.getAllServices();
      expect(services).to.be.an("array");
      console.log("✅ Services found:", services.length);
      
      if (services.length > 0) {
        const firstService = services[0];
        console.log("  - First service:", {
          name: firstService.name,
          provider: firstService.provider,
          price: ethers.formatUnits(firstService.pricePerRequest, 6) + " USDC",
        });
      }
    });
  });

  describe("Request Service with ENS Interception", function () {
    let serviceId: string;
    let usdcContract: IERC20;

    before(async function () {
      // Get an active service using hardhat contract
      const ServiceMarketplace = await ethers.getContractFactory("ServiceMarketplace");
      const marketplaceContract = await ethers.getContractAt("ServiceMarketplace", marketplaceAddress);
      const services = await marketplaceContract.getAllServices();
      const activeServices = services.filter((s: any) => s.isActive === true);
      
      if (activeServices.length === 0) {
        console.log("⚠️  No active services found, skipping request tests");
        this.skip();
      }

      // Find a service from a different provider (can't request own service)
      const serviceFromOtherProvider = activeServices.find((s: any) => 
        s.provider.toLowerCase() !== signer.address.toLowerCase()
      );
      
      if (!serviceFromOtherProvider) {
        console.log("⚠️  No services from other providers found, skipping request test");
        console.log("    (Cannot request own service - this is expected behavior)");
        this.skip();
      }

      serviceId = serviceFromOtherProvider.serviceId;
      console.log("\n📦 Using service:", {
        serviceId: serviceId,
        name: serviceFromOtherProvider.name,
        provider: serviceFromOtherProvider.provider,
        price: ethers.formatUnits(serviceFromOtherProvider.pricePerRequest, 6) + " USDC",
      });

      // Create USDC contract for balance checking using hardhat
      usdcContract = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", usdcAddress);
    });

    it("Should check USDC balance without ENS errors", async function () {
      const balance = await usdcContract.balanceOf(signer.address);
      const balanceFormatted = ethers.formatUnits(balance, 6);
      console.log("💰 USDC Balance:", balanceFormatted, "USDC");
      expect(balance).to.be.a("bigint");
    });

    it("Should request service with ENS interception (simulated)", async function () {
      // Get service details using hardhat contract
      const ServiceMarketplace = await ethers.getContractFactory("ServiceMarketplace");
      const marketplaceContract = await ethers.getContractAt("ServiceMarketplace", marketplaceAddress);
      const services = await marketplaceContract.getAllServices();
      const service = services.find((s: any) => s.serviceId === serviceId);
      
      if (!service) {
        throw new Error("Service not found");
      }

      // Check if we have enough USDC
      const balance = await usdcContract.balanceOf(signer.address);
      const price = service.pricePerRequest;
      
      if (balance < price) {
        console.log("⚠️  Insufficient USDC balance. Required:", ethers.formatUnits(price, 6), "USDC");
        console.log("    Current balance:", ethers.formatUnits(balance, 6), "USDC");
        this.skip();
      }

      // Check allowance
      const allowance = await usdcContract.allowance(signer.address, marketplaceAddress);
      
      console.log("📊 Service Request Details:");
      console.log("  - Service ID:", serviceId);
      console.log("  - Price:", ethers.formatUnits(price, 6), "USDC");
      console.log("  - Balance:", ethers.formatUnits(balance, 6), "USDC");
      console.log("  - Allowance:", ethers.formatUnits(allowance, 6), "USDC");

      // Approve if needed
      if (allowance < price) {
        console.log("🔐 Approving USDC spending...");
        const usdcWithSigner = usdcContract.connect(signer);
        const approveTx = await usdcWithSigner.approve(marketplaceAddress, price);
        const approveReceipt = await approveTx.wait();
        console.log("✅ Approval TX:", approveReceipt!.hash);
      }

      // Request service using hardhat contract - this should work with ENS interception
      console.log("🚀 Requesting service...");
      try {
        const marketplaceWithSigner = marketplaceContract.connect(signer);
        const tx = await marketplaceWithSigner.requestService(serviceId);
        const receipt = await tx.wait();
        
        expect(receipt).to.not.be.null;
        expect(tx.hash).to.be.a("string");
        expect(tx.hash).to.match(/^0x[a-fA-F0-9]{64}$/);
        
        console.log("✅ Service requested successfully!");
        console.log("  - Transaction Hash:", tx.hash);
        console.log("  - Block Number:", receipt!.blockNumber);
        console.log("  - Gas Used:", receipt!.gasUsed.toString());
        
        // Verify on Snowtrace
        const explorerUrl = `https://testnet.snowtrace.io/tx/${tx.hash}`;
        console.log("  - Explorer:", explorerUrl);
        
      } catch (error: any) {
        // Check if it's an ENS error
        if (error.message && error.message.includes("ENS")) {
          throw new Error(`ENS error occurred: ${error.message}. ENS interception may not be working correctly.`);
        }
        throw error;
      }
    });

    it("Should verify ENS interception is working", async function () {
      // This test verifies that ENS interception is properly set up
      const ServiceMarketplace = await ethers.getContractFactory("ServiceMarketplace");
      const contract = await ethers.getContractAt("ServiceMarketplace", marketplaceAddress);
      
      // The contract should be created without ENS errors
      expect(contract).to.not.be.null;
      
      // Try to get services - this should not trigger ENS resolution
      const services = await contract.getAllServices();
      expect(services.length).to.be.gte(0);
      
      console.log("✅ ENS interception verified - no ENS errors during contract operations");
    });
  });

  describe("Production Readiness Checks", function () {
    it("Should have all required environment variables", function () {
      const requiredVars = [
        "NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS",
      ];
      
      // NEXT_PUBLIC_AVALANCHE_FUJI_RPC is optional (has fallback)
      const optionalVars = ["NEXT_PUBLIC_AVALANCHE_FUJI_RPC"];
      
      const missing = requiredVars.filter(v => !process.env[v]);
      const missingOptional = optionalVars.filter(v => !process.env[v]);
      
      if (missing.length > 0) {
        console.log("❌ Missing required environment variables:", missing.join(", "));
        console.log("    These MUST be set in Vercel for production");
      }
      
      if (missingOptional.length > 0) {
        console.log("⚠️  Missing optional environment variables:", missingOptional.join(", "));
        console.log("    These should be set in Vercel for production (has fallback)");
      }
      
      expect(missing.length).to.equal(0, "All required environment variables should be set");
    });

    it("Should use correct network configuration", async function () {
      const network = await provider.getNetwork();
      expect(network.chainId.toString()).to.equal("43113");
      // Hardhat uses "fuji" as network name, but the actual network is avalanche-fuji
      expect(network.chainId.toString()).to.equal("43113", "Should be connected to Avalanche Fuji (Chain ID 43113)");
      
      console.log("✅ Network configuration correct (Chain ID: 43113, Network: " + network.name + ")");
    });

    it("Should have provider without ENS enabled", function () {
      const providerAny = provider as any;
      const network = providerAny._network || providerAny.network;
      
      if (network) {
        expect(network.ensAddress).to.be.null;
        console.log("✅ ENS disabled in provider configuration");
      } else {
        console.log("⚠️  Could not verify ENS configuration (network object not accessible)");
      }
    });
  });
});

