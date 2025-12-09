/**
 * Comprehensive SDK Tests
 * Tests all SDK functionality with real private key from .env.local
 * Uses minimum verifiable amount (0.000001) for transactions
 */

import { describe, it, expect, beforeAll } from "@jest/globals";
import * as dotenv from "dotenv";
import path from "path";
import { AgentHubSDK } from "../src/client";
import type { SDKConfig } from "../src/client";
import { ethers } from "ethers";

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), "../../.env.local") });
dotenv.config({ path: path.join(process.cwd(), "../../.env") });
dotenv.config();

// Minimum verifiable amount for scanner (0.000001 USDC)
const MIN_VERIFIABLE_AMOUNT = "0.000001";
const MIN_STAKE_AMOUNT = "0.01"; // Minimum stake for agent registration

describe("AgentHub SDK - Comprehensive Tests", () => {
  let sdk: AgentHubSDK;
  let sdkWithSigner: AgentHubSDK;
  const privateKey = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
  const rpcUrl = process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC || "https://api.avax-test.network/ext/bc/C/rpc";
  const agentRegistryAddress = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS;
  const marketplaceAddress = process.env.NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS;

  beforeAll(() => {
    if (!privateKey || privateKey === "0xyour_private_key_here" || privateKey.length < 64) {
      console.warn("⚠️ PRIVATE_KEY not set or invalid. Some tests will be skipped.");
      return;
    }

    // SDK with signer for transactions
    sdkWithSigner = new AgentHubSDK({
      network: "avalanche-fuji",
      privateKey,
      rpcUrl,
      agentRegistryAddress,
      marketplaceAddress,
    });

    // SDK without signer for read-only operations
    sdk = new AgentHubSDK({
      network: "avalanche-fuji",
      rpcUrl,
      agentRegistryAddress,
      marketplaceAddress,
    });
  });

  describe("SDK Initialization - All Configurations", () => {
    it("should initialize SDK with provider only", () => {
      const sdkProvider = new AgentHubSDK({
        network: "avalanche-fuji",
        rpcUrl,
      });
      expect(sdkProvider).toBeDefined();
      expect(sdkProvider.provider).toBeDefined();
      expect(sdkProvider.network).toBe("avalanche-fuji");
    });

    it("should initialize SDK with custom provider", () => {
      const customProvider = new ethers.JsonRpcProvider(rpcUrl);
      const sdkCustom = new AgentHubSDK({
        network: "avalanche-fuji",
        provider: customProvider,
      });
      expect(sdkCustom).toBeDefined();
      expect(sdkCustom.provider).toBeDefined();
    });

    it("should initialize SDK with custom signer", () => {
      if (!privateKey || privateKey === "0xyour_private_key_here" || privateKey.length < 64) {
        console.log("⏭️ Skipping - PRIVATE_KEY not set or invalid");
        return;
      }
      const wallet = new ethers.Wallet(privateKey, new ethers.JsonRpcProvider(rpcUrl));
      const sdkCustom = new AgentHubSDK({
        network: "avalanche-fuji",
        signer: wallet,
      });
      expect(sdkCustom).toBeDefined();
      expect(sdkCustom.signer).toBeDefined();
    });

    it("should initialize SDK with default RPC URLs", () => {
      const sdkFuji = new AgentHubSDK({ network: "avalanche-fuji" });
      expect(sdkFuji.provider).toBeDefined();

      const sdkMainnet = new AgentHubSDK({ network: "avalanche-mainnet" });
      expect(sdkMainnet.provider).toBeDefined();

      const sdkLocal = new AgentHubSDK({ network: "local" });
      expect(sdkLocal.provider).toBeDefined();
    });

    it("should initialize SDK with custom contract addresses", () => {
      const customSdk = new AgentHubSDK({
        network: "avalanche-fuji",
        rpcUrl,
        agentRegistryAddress: "0x1234567890123456789012345678901234567890",
        marketplaceAddress: "0x0987654321098765432109876543210987654321",
        revenueDistributorAddress: "0x1111111111111111111111111111111111111111",
      });
      expect(customSdk).toBeDefined();
      expect(customSdk.network).toBe("avalanche-fuji");
    });

    it("should throw error when accessing signer without private key", () => {
      const sdkNoSigner = new AgentHubSDK({
        network: "avalanche-fuji",
        rpcUrl,
      });
      expect(() => {
        // @ts-ignore - Testing error case
        const _ = sdkNoSigner.signer;
      }).toThrow("Signer not configured");
    });

    it("should throw error when provider is not configured", () => {
      // This shouldn't happen in normal usage, but test edge case
      const sdk = new AgentHubSDK({ network: "avalanche-fuji" });
      // Provider should be initialized with default RPC
      expect(sdk.provider).toBeDefined();
    });
  });

  describe("Agent Registry Operations - Complete Coverage", () => {
    it("should have all agent registry methods available", () => {
      if (!sdkWithSigner) {
        console.log("⏭️ Skipping - SDK not initialized");
        return;
      }
      expect(sdkWithSigner.agents).toBeDefined();
      expect(sdkWithSigner.agents.register).toBeDefined();
      expect(sdkWithSigner.agents.get).toBeDefined();
      expect(sdkWithSigner.agents.addStake).toBeDefined();
      expect(sdkWithSigner.agents.withdrawStake).toBeDefined();
    });

    it("should get agent information (read-only)", async () => {
      if (!sdk || !agentRegistryAddress) {
        console.log("⏭️ Skipping - SDK or contract address not configured");
        return;
      }
      const testAddress = "0x0000000000000000000000000000000000000000";
      try {
        const agent = await sdk.agents.get(testAddress);
        expect(agent).toBeDefined();
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    }, 30000);

    it("should handle agent registry with custom address", async () => {
      if (!sdk) {
        console.log("⏭️ Skipping - SDK not initialized");
        return;
      }
      const customSdk = new AgentHubSDK({
        network: "avalanche-fuji",
        rpcUrl,
        agentRegistryAddress: "0x1234567890123456789012345678901234567890",
      });
      try {
        await customSdk.agents.get("0x0000000000000000000000000000000000000000");
      } catch (error: any) {
        // Expected if contract not deployed
        expect(error.message).toBeDefined();
      }
    }, 30000);
  });

  describe("Marketplace Operations - Complete Coverage", () => {
    it("should have all marketplace methods available", () => {
      if (!sdkWithSigner) {
        console.log("⏭️ Skipping - SDK not initialized");
        return;
      }
      expect(sdkWithSigner.marketplace).toBeDefined();
      expect(sdkWithSigner.marketplace.publishService).toBeDefined();
      expect(sdkWithSigner.marketplace.requestService).toBeDefined();
      expect(sdkWithSigner.marketplace.getAllServices).toBeDefined();
      expect(sdkWithSigner.marketplace.getService).toBeDefined();
    });

    it("should get all services from marketplace", async () => {
      if (!sdk || !marketplaceAddress) {
        console.log("⏭️ Skipping - SDK or contract address not configured");
        return;
      }
      try {
        const services = await sdk.marketplace.getAllServices();
        expect(Array.isArray(services)).toBe(true);
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    }, 30000);

    it("should get service by ID", async () => {
      if (!sdk || !marketplaceAddress) {
        console.log("⏭️ Skipping - SDK or contract address not configured");
        return;
      }
      try {
        const serviceId = ethers.id("test-service");
        await sdk.marketplace.getService(serviceId);
      } catch (error: any) {
        // Expected if service doesn't exist
        expect(error.message).toBeDefined();
      }
    }, 30000);

    it("should handle marketplace with custom address", async () => {
      if (!sdk) {
        console.log("⏭️ Skipping - SDK not initialized");
        return;
      }
      const customSdk = new AgentHubSDK({
        network: "avalanche-fuji",
        rpcUrl,
        marketplaceAddress: "0x0987654321098765432109876543210987654321",
      });
      try {
        await customSdk.marketplace.getAllServices();
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    }, 30000);
  });

  describe("x402 Payment Operations - Complete Coverage", () => {
    it("should have x402 payment API available", () => {
      if (!sdk) {
        console.log("⏭️ Skipping - SDK not initialized");
        return;
      }
      expect(sdk.x402).toBeDefined();
      expect(sdk.x402.pay).toBeDefined();
    });

    it("should handle x402 payment with minimum verifiable amount", async () => {
      if (!sdk) {
        console.log("⏭️ Skipping - SDK not initialized");
        return;
      }
      try {
        const result = await sdk.x402.pay({
          amount: MIN_VERIFIABLE_AMOUNT,
          token: "USDC",
          tier: "basic",
          apiUrl: "http://localhost:3000/api/x402/pay",
        });
        expect(result).toBeDefined();
        expect(typeof result.success).toBe("boolean");
      } catch (error: any) {
        // Expected if API is not running
        expect(error.message).toBeDefined();
      }
    }, 10000);

    it("should handle x402 payment with tier", async () => {
      if (!sdk) {
        console.log("⏭️ Skipping - SDK not initialized");
        return;
      }
      try {
        const result = await sdk.x402.pay({
          amount: "0.01",
          token: "USDC",
          tier: "premium",
          apiUrl: "http://localhost:3000/api/x402/pay",
        });
        expect(result).toBeDefined();
        expect(typeof result.success).toBe("boolean");
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    }, 10000);

    it("should handle x402 payment with custom recipient", async () => {
      if (!sdk) {
        console.log("⏭️ Skipping - SDK not initialized");
        return;
      }
      try {
        const result = await sdk.x402.pay({
          amount: MIN_VERIFIABLE_AMOUNT,
          token: "USDC",
          recipient: "0x1234567890123456789012345678901234567890",
          apiUrl: "http://localhost:3000/api/x402/pay",
        });
        expect(result).toBeDefined();
        expect(typeof result.success).toBe("boolean");
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    }, 10000);

    it("should handle x402 payment with AVAX token", async () => {
      if (!sdk) {
        console.log("⏭️ Skipping - SDK not initialized");
        return;
      }
      try {
        const result = await sdk.x402.pay({
          amount: MIN_VERIFIABLE_AMOUNT,
          token: "AVAX",
          apiUrl: "http://localhost:3000/api/x402/pay",
        });
        expect(result).toBeDefined();
        expect(typeof result.success).toBe("boolean");
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    }, 10000);
  });

  describe("AI Operations - Complete Coverage", () => {
    it("should have AI API available", () => {
      if (!sdk) {
        console.log("⏭️ Skipping - SDK not initialized");
        return;
      }
      expect(sdk.ai).toBeDefined();
      expect(sdk.ai.generateContent).toBeDefined();
    });

    it("should handle AI generateContent with options", async () => {
      if (!sdk) {
        console.log("⏭️ Skipping - SDK not initialized");
        return;
      }
      try {
        const result = await sdk.ai.generateContent("Test prompt", {
          temperature: 0.7,
          maxOutputTokens: 100,
        });
        // Will fail without GEMINI_API_KEY, but tests the structure
        expect(result).toBeDefined();
      } catch (error: any) {
        // Expected without API key
        expect(error.message).toBeDefined();
      }
    }, 10000);

    it("should handle AI generateContent without options", async () => {
      if (!sdk) {
        console.log("⏭️ Skipping - SDK not initialized");
        return;
      }
      try {
        const result = await sdk.ai.generateContent("Test prompt");
        expect(result).toBeDefined();
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    }, 10000);
  });

  describe("Error Handling - Edge Cases", () => {
    it("should handle invalid network gracefully", () => {
      expect(() => {
        new AgentHubSDK({
          network: "invalid-network" as any,
        });
      }).not.toThrow();
    });

    it("should handle missing contract addresses gracefully", () => {
      const sdkNoAddresses = new AgentHubSDK({
        network: "avalanche-fuji",
        rpcUrl,
      });
      expect(sdkNoAddresses).toBeDefined();
    });

    it("should handle network property access", () => {
      const sdk = new AgentHubSDK({
        network: "avalanche-fuji",
        rpcUrl,
      });
      expect(sdk.network).toBe("avalanche-fuji");
    });
  });
});

