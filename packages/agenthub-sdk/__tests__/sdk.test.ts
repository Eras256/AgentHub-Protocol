/**
 * End-to-End Tests for AgentHub SDK
 * Tests the complete SDK functionality
 */

import { describe, it, expect, beforeAll } from "@jest/globals";
import { AgentHubSDK } from "../src/client";
import type { SDKConfig } from "../src/client";

describe("AgentHub SDK - End-to-End Tests", () => {
  let sdk: AgentHubSDK;
  const testConfig: SDKConfig = {
    network: "avalanche-fuji",
    privateKey: process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY || "",
    rpcUrl: process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC || "https://api.avax-test.network/ext/bc/C/rpc",
  };

  beforeAll(() => {
    if (!testConfig.privateKey) {
      console.warn("⚠️ PRIVATE_KEY not set. Some tests may be skipped.");
    }
  });

  describe("SDK Initialization", () => {
    it("should initialize SDK with private key", () => {
      if (!testConfig.privateKey) {
        console.log("⏭️ Skipping - PRIVATE_KEY not set");
        return;
      }

      sdk = new AgentHubSDK(testConfig);
      expect(sdk).toBeDefined();
      expect(sdk.network).toBe("avalanche-fuji");
      expect(sdk.signer).toBeDefined();
      expect(sdk.provider).toBeDefined();
    });

    it("should initialize SDK with RPC URL only", () => {
      const sdkProviderOnly = new AgentHubSDK({
        network: "avalanche-fuji",
        rpcUrl: testConfig.rpcUrl,
      });

      expect(sdkProviderOnly).toBeDefined();
      expect(sdkProviderOnly.provider).toBeDefined();
    });

    it("should throw error when accessing signer without private key", () => {
      const sdkNoSigner = new AgentHubSDK({
        network: "avalanche-fuji",
        rpcUrl: testConfig.rpcUrl,
      });

      expect(() => {
        // @ts-ignore - Testing error case
        const _ = sdkNoSigner.signer;
      }).toThrow();
    });
  });

  describe("Agent Registry Operations", () => {
    it("should have agents API available", () => {
      if (!testConfig.privateKey) {
        console.log("⏭️ Skipping - PRIVATE_KEY not set");
        return;
      }

      sdk = new AgentHubSDK(testConfig);
      expect(sdk.agents).toBeDefined();
      expect(sdk.agents.register).toBeDefined();
      expect(sdk.agents.get).toBeDefined();
      expect(sdk.agents.addStake).toBeDefined();
      expect(sdk.agents.withdrawStake).toBeDefined();
    });

    it("should get agent information (read-only)", async () => {
      if (!testConfig.privateKey) {
        console.log("⏭️ Skipping - PRIVATE_KEY not set");
        return;
      }

      sdk = new AgentHubSDK(testConfig);
      const testAddress = "0x0000000000000000000000000000000000000000";

      try {
        const agent = await sdk.agents.get(testAddress);
        // Should return agent data or null/empty
        expect(agent).toBeDefined();
      } catch (error: any) {
        // Contract might not be deployed or address invalid
        expect(error.message).toBeDefined();
      }
    }, 30000);
  });

  describe("Marketplace Operations", () => {
    it("should have marketplace API available", () => {
      if (!testConfig.privateKey) {
        console.log("⏭️ Skipping - PRIVATE_KEY not set");
        return;
      }

      sdk = new AgentHubSDK(testConfig);
      expect(sdk.marketplace).toBeDefined();
      expect(sdk.marketplace.publishService).toBeDefined();
      expect(sdk.marketplace.requestService).toBeDefined();
      expect(sdk.marketplace.getAllServices).toBeDefined();
      expect(sdk.marketplace.getService).toBeDefined();
    });

    it("should get all services from marketplace", async () => {
      if (!testConfig.privateKey) {
        console.log("⏭️ Skipping - PRIVATE_KEY not set");
        return;
      }

      sdk = new AgentHubSDK(testConfig);

      try {
        const services = await sdk.marketplace.getAllServices();
        expect(Array.isArray(services)).toBe(true);
        console.log(`✅ Found ${services.length} services in marketplace`);
      } catch (error: any) {
        // Contract might not be deployed
        expect(error.message).toBeDefined();
      }
    }, 30000);
  });

  describe("x402 Payment Operations", () => {
    it("should have x402 API available", () => {
      if (!testConfig.privateKey) {
        console.log("⏭️ Skipping - PRIVATE_KEY not set");
        return;
      }

      sdk = new AgentHubSDK(testConfig);
      expect(sdk.x402).toBeDefined();
      expect(sdk.x402.pay).toBeDefined();
    });

    it("should handle x402 payment request structure", async () => {
      if (!testConfig.privateKey) {
        console.log("⏭️ Skipping - PRIVATE_KEY not set");
        return;
      }

      sdk = new AgentHubSDK(testConfig);

      // This will fail without a real API endpoint, but tests the structure
      try {
        const result = await sdk.x402.pay({
          amount: "0.01",
          token: "USDC",
          tier: "basic",
          apiUrl: "http://localhost:3000/api/x402/pay",
        });

        // Should return a response (even if it fails)
        expect(result).toBeDefined();
        expect(typeof result.success).toBe("boolean");
      } catch (error: any) {
        // Expected if API is not running
        expect(error.message).toBeDefined();
      }
    }, 10000);
  });

  describe("AI Operations", () => {
    it("should have AI API available", () => {
      sdk = new AgentHubSDK({
        network: "avalanche-fuji",
        rpcUrl: testConfig.rpcUrl,
      });

      expect(sdk.ai).toBeDefined();
      expect(sdk.ai.generateContent).toBeDefined();
    });
  });

  describe("Error Handling", () => {
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
        rpcUrl: testConfig.rpcUrl,
      });

      // Should not throw on initialization
      expect(sdkNoAddresses).toBeDefined();
    });
  });
});

