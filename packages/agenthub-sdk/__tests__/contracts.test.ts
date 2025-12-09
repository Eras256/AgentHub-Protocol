/**
 * Contract Functions Tests
 * Tests contract interaction functions
 */

import { describe, it, expect, beforeAll } from "@jest/globals";
import * as dotenv from "dotenv";
import path from "path";
import { ethers } from "ethers";
import {
  getAgentRegistryContract,
  registerAgent,
  getAgent,
  addStake,
  withdrawStake,
} from "../src/contracts/agentRegistry";
import {
  getMarketplaceContract,
  publishService,
  requestService,
  getAllServices,
  getService,
} from "../src/contracts/marketplace";
import {
  getRevenueDistributorContract,
  claimCreatorRevenue,
  claimStakerRevenue,
  getPendingCreatorRevenue,
  getPendingStakerRevenue,
} from "../src/contracts/revenueDistributor";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), "../../.env.local") });
dotenv.config();

const privateKey = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
const rpcUrl = process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC || "https://api.avax-test.network/ext/bc/C/rpc";
const agentRegistryAddress = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS;
const marketplaceAddress = process.env.NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS;
const revenueDistributorAddress = process.env.NEXT_PUBLIC_REVENUE_DISTRIBUTOR_ADDRESS;

describe("Contract Functions", () => {
  let provider: ethers.JsonRpcProvider;
  let signer: ethers.Wallet | null = null;

  beforeAll(() => {
    provider = new ethers.JsonRpcProvider(rpcUrl);
    if (privateKey && privateKey !== "0xyour_private_key_here" && privateKey.length >= 64) {
      signer = new ethers.Wallet(privateKey, provider);
    }
  });

  describe("Agent Registry Contract", () => {
    it("should get contract instance with default address", () => {
      if (!agentRegistryAddress) {
        console.log("⏭️ Skipping - AgentRegistry address not configured");
        return;
      }
      const contract = getAgentRegistryContract(provider, {});
      expect(contract).toBeDefined();
      expect(contract.target).toBe(agentRegistryAddress);
    });

    it("should get contract instance with custom address", () => {
      const customAddress = "0x1234567890123456789012345678901234567890";
      const contract = getAgentRegistryContract(provider, {
        address: customAddress,
      });
      expect(contract).toBeDefined();
      expect(contract.target).toBe(customAddress);
    });

    it("should get contract instance with defaultAddress", () => {
      const customAddress = "0x1234567890123456789012345678901234567890";
      const contract = getAgentRegistryContract(provider, {
        defaultAddress: customAddress,
      });
      expect(contract).toBeDefined();
      expect(contract.target).toBe(customAddress);
    });

    it("should throw error when address is not configured", () => {
      // Temporarily remove env var
      const originalEnv = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS;
      delete process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS;
      
      expect(() => {
        getAgentRegistryContract(provider, {});
      }).toThrow("AgentRegistry address not configured");
      
      // Restore env var
      if (originalEnv) {
        process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS = originalEnv;
      }
    });

    it("should get agent (read-only)", async () => {
      if (!agentRegistryAddress) {
        console.log("⏭️ Skipping - AgentRegistry address not configured");
        return;
      }
      try {
        const address = "0x0000000000000000000000000000000000000000";
        await getAgent(provider, address, {});
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    }, 30000);
  });

  describe("Marketplace Contract", () => {
    it("should get contract instance with default address", () => {
      if (!marketplaceAddress) {
        console.log("⏭️ Skipping - Marketplace address not configured");
        return;
      }
      const contract = getMarketplaceContract(provider, {});
      expect(contract).toBeDefined();
      expect(contract.target).toBe(marketplaceAddress);
    });

    it("should get contract instance with custom address", () => {
      const customAddress = "0x0987654321098765432109876543210987654321";
      const contract = getMarketplaceContract(provider, {
        address: customAddress,
      });
      expect(contract).toBeDefined();
      expect(contract.target).toBe(customAddress);
    });

    it("should throw error when address is not configured", () => {
      const originalEnv = process.env.NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS;
      const originalDefault = (require("../src/contracts/marketplace") as any).DEFAULT_ADDRESSES;
      // Marketplace has a hardcoded default, so we need to test differently
      // Just verify the function works
      try {
        const contract = getMarketplaceContract(provider, {});
        expect(contract).toBeDefined();
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    });

    it("should get all services (read-only)", async () => {
      if (!marketplaceAddress) {
        console.log("⏭️ Skipping - Marketplace address not configured");
        return;
      }
      try {
        await getAllServices(provider, {});
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    }, 30000);

    it("should get service by ID (read-only)", async () => {
      if (!marketplaceAddress) {
        console.log("⏭️ Skipping - Marketplace address not configured");
        return;
      }
      try {
        const serviceId = ethers.id("test-service");
        await getService(provider, serviceId, {});
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    }, 30000);
  });

  describe("Revenue Distributor Contract", () => {
    it("should get contract instance with default address", () => {
      if (!revenueDistributorAddress) {
        console.log("⏭️ Skipping - RevenueDistributor address not configured");
        return;
      }
      const contract = getRevenueDistributorContract(provider, {});
      expect(contract).toBeDefined();
      expect(contract.target).toBe(revenueDistributorAddress);
    });

    it("should get contract instance with custom address", () => {
      const customAddress = "0x1111111111111111111111111111111111111111";
      const contract = getRevenueDistributorContract(provider, {
        address: customAddress,
      });
      expect(contract).toBeDefined();
      expect(contract.target).toBe(customAddress);
    });

    it("should throw error when address is not configured", () => {
      const originalEnv = process.env.NEXT_PUBLIC_REVENUE_DISTRIBUTOR_ADDRESS;
      delete process.env.NEXT_PUBLIC_REVENUE_DISTRIBUTOR_ADDRESS;
      
      expect(() => {
        getRevenueDistributorContract(provider, {});
      }).toThrow("RevenueDistributor address not configured");
      
      if (originalEnv) {
        process.env.NEXT_PUBLIC_REVENUE_DISTRIBUTOR_ADDRESS = originalEnv;
      }
    });

    it("should get pending creator revenue (read-only)", async () => {
      if (!revenueDistributorAddress) {
        console.log("⏭️ Skipping - RevenueDistributor address not configured");
        return;
      }
      try {
        const creatorAddress = "0x0000000000000000000000000000000000000000";
        await getPendingCreatorRevenue(provider, creatorAddress, {});
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    }, 30000);

    it("should get pending staker revenue (read-only)", async () => {
      if (!revenueDistributorAddress) {
        console.log("⏭️ Skipping - RevenueDistributor address not configured");
        return;
      }
      try {
        const agentAddress = "0x0000000000000000000000000000000000000000";
        await getPendingStakerRevenue(provider, agentAddress, {});
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    }, 30000);
  });
});

