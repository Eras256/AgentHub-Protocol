/**
 * Integration Tests for AgentHub SDK
 * Tests real blockchain interactions (requires network access)
 */

import { describe, it, expect, beforeAll } from "@jest/globals";
import { AgentHubSDK } from "../src/client";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), "../../.env.local") });
dotenv.config();

describe("AgentHub SDK - Integration Tests", () => {
  let sdk: AgentHubSDK;
  const privateKey = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
  const rpcUrl = process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC || "https://api.avax-test.network/ext/bc/C/rpc";

  beforeAll(() => {
    if (!privateKey) {
      console.warn("⚠️ PRIVATE_KEY not set. Integration tests will be skipped.");
      return;
    }

    sdk = new AgentHubSDK({
      network: "avalanche-fuji",
      privateKey,
      rpcUrl,
    });
  });

  describe("Real Blockchain Interactions", () => {
    it("should connect to Avalanche Fuji network", async () => {
      if (!privateKey) {
        console.log("⏭️ Skipping - PRIVATE_KEY not set");
        return;
      }

      const network = await sdk.provider.getNetwork();
      expect(network).toBeDefined();
      expect(network.chainId).toBeDefined();
      console.log(`✅ Connected to network: ${network.name} (chainId: ${network.chainId})`);
    }, 30000);

    it("should get wallet balance", async () => {
      if (!privateKey) {
        console.log("⏭️ Skipping - PRIVATE_KEY not set");
        return;
      }

      const address = await sdk.signer.getAddress();
      const balance = await sdk.provider.getBalance(address);
      
      expect(balance).toBeDefined();
      expect(Number(balance)).toBeGreaterThanOrEqual(0);
      console.log(`✅ Wallet balance: ${balance.toString()} wei`);
    }, 30000);

    it("should read from AgentRegistry contract", async () => {
      if (!privateKey) {
        console.log("⏭️ Skipping - PRIVATE_KEY not set");
        return;
      }

      try {
        const address = await sdk.signer.getAddress();
        const agent = await sdk.agents.get(address);
        
        // Should return agent data (even if empty/zero)
        expect(agent).toBeDefined();
        console.log("✅ Successfully read from AgentRegistry");
      } catch (error: any) {
        // Contract might not be deployed
        if (error.message.includes("not configured") || error.message.includes("not found")) {
          console.warn("⚠️ AgentRegistry contract not deployed or configured");
        } else {
          throw error;
        }
      }
    }, 30000);

    it("should read from ServiceMarketplace contract", async () => {
      if (!privateKey) {
        console.log("⏭️ Skipping - PRIVATE_KEY not set");
        return;
      }

      try {
        const services = await sdk.marketplace.getAllServices();
        
        expect(Array.isArray(services)).toBe(true);
        console.log(`✅ Found ${services.length} services in marketplace`);
        
        if (services.length > 0) {
          const firstService = services[0];
          expect(firstService).toBeDefined();
          expect(firstService.serviceId).toBeDefined();
          console.log(`   First service: ${firstService.name || "Unnamed"}`);
        }
      } catch (error: any) {
        // Contract might not be deployed
        if (error.message.includes("not configured") || error.message.includes("not found")) {
          console.warn("⚠️ ServiceMarketplace contract not deployed or configured");
        } else {
          throw error;
        }
      }
    }, 30000);
  });

  describe("SDK Configuration", () => {
    it("should use custom contract addresses", () => {
      if (!privateKey) {
        console.log("⏭️ Skipping - PRIVATE_KEY not set");
        return;
      }

      const customSdk = new AgentHubSDK({
        network: "avalanche-fuji",
        privateKey,
        agentRegistryAddress: "0x1234567890123456789012345678901234567890",
        marketplaceAddress: "0x0987654321098765432109876543210987654321",
      });

      expect(customSdk).toBeDefined();
      expect(customSdk.network).toBe("avalanche-fuji");
    });
  });
});

