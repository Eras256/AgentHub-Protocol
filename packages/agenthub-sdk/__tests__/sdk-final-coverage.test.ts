/**
 * Final Coverage Tests
 * Covers the last 2 uncovered lines: 52 and 73
 */

import { describe, it, expect } from "@jest/globals";
import { AgentHubSDK } from "../src/client";
import { ethers } from "ethers";

describe("Final Coverage - Last 2 Lines", () => {
  describe("Line 29: Network default value", () => {
    it("should execute line 29 - network default value", () => {
      // Line 29: network: config.network || "avalanche-fuji",
      // Test without network to trigger default
      const sdk1 = new AgentHubSDK({
        // network not provided, should default to "avalanche-fuji"
      });
      expect(sdk1.network).toBe("avalanche-fuji");

      // Test with network provided
      const sdk2 = new AgentHubSDK({
        network: "avalanche-mainnet",
      });
      expect(sdk2.network).toBe("avalanche-mainnet");
    });
  });

  describe("Line 52: Initialize with custom signer", () => {
    it("should execute line 52 - custom signer initialization", () => {
      // Create a custom signer to trigger line 52: this._signer = config.signer;
      const provider = new ethers.JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");
      const wallet = ethers.Wallet.createRandom().connect(provider);
      
      const sdk = new AgentHubSDK({
        network: "avalanche-fuji",
        signer: wallet, // Line 51: if (config.signer) -> Line 52: this._signer = config.signer;
        provider,
      });

      expect(sdk).toBeDefined();
      expect(sdk.signer).toBe(wallet);
      // Access signer again to ensure it's the same
      const signer = sdk.signer;
      expect(signer).toBe(wallet);
    });
  });

  describe("Line 73: Provider getter error path", () => {
    it("should execute line 73 - provider not configured error", () => {
      // Line 73: throw new Error("Provider not configured.");
      // To test this, we need to create an SDK and then manually set _provider to undefined
      // using type casting to bypass TypeScript's private access restrictions
      
      const sdk = new AgentHubSDK({
        network: "avalanche-fuji",
        rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
      });

      // Use type casting to access private _provider and set it to undefined
      // This allows us to test the error path in line 73
      (sdk as any)._provider = undefined;

      // Now accessing provider should trigger line 73: throw new Error("Provider not configured.");
      expect(() => {
        const _ = sdk.provider; // This should throw error at line 73
      }).toThrow("Provider not configured.");
    });
  });
});

