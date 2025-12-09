/**
 * AgentHub Protocol SDK - Main Client
 * 
 * Official TypeScript SDK for AgentHub Protocol
 * Enables developers to build autonomous AI agents on Avalanche
 */

import { ethers } from "ethers";
import type { Signer, Provider } from "ethers";

export interface SDKConfig {
  network?: "avalanche-fuji" | "avalanche-mainnet" | "local";
  privateKey?: string;
  rpcUrl?: string;
  signer?: Signer;
  provider?: Provider;
  agentRegistryAddress?: string;
  marketplaceAddress?: string;
  revenueDistributorAddress?: string;
}

export class AgentHubSDK {
  private config: Required<Pick<SDKConfig, "network">> & SDKConfig;
  private _signer?: Signer;
  private _provider?: Provider;

  constructor(config: SDKConfig) {
    this.config = {
      network: config.network || "avalanche-fuji",
      ...config,
    };

    // Initialize provider
    if (config.provider) {
      this._provider = config.provider;
    } else if (config.rpcUrl) {
      this._provider = new ethers.JsonRpcProvider(config.rpcUrl);
    } else {
      // Default RPC URLs
      const rpcUrls = {
        "avalanche-fuji": "https://api.avax-test.network/ext/bc/C/rpc",
        "avalanche-mainnet": "https://api.avax.network/ext/bc/C/rpc",
        local: "http://localhost:8545",
      };
      this._provider = new ethers.JsonRpcProvider(
        rpcUrls[this.config.network]
      );
    }

    // Initialize signer
    if (config.signer) {
      this._signer = config.signer;
    } else if (config.privateKey) {
      this._signer = new ethers.Wallet(config.privateKey, this._provider);
    }
  }

  /**
   * Get the configured signer
   */
  get signer(): Signer {
    if (!this._signer) {
      throw new Error("Signer not configured. Provide privateKey or signer in config.");
    }
    return this._signer;
  }

  /**
   * Get the configured provider
   */
  get provider(): Provider {
    if (!this._provider) {
      throw new Error("Provider not configured.");
    }
    return this._provider;
  }

  /**
   * Get network configuration
   */
  get network() {
    return this.config.network;
  }

  /**
   * Agent Registry operations
   */
  get agents() {
    const config = {
      defaultAddress: this.config.agentRegistryAddress,
    };
    return {
      register: async (params: {
        agentId: string;
        metadataIPFS: string;
        stakeAmount: string;
      }) => {
        const { registerAgent } = await import("./contracts/agentRegistry");
        return registerAgent(
          this.signer,
          params.agentId,
          params.metadataIPFS,
          params.stakeAmount,
          config
        );
      },
      get: async (address: string) => {
        const { getAgent } = await import("./contracts/agentRegistry");
        return getAgent(this.provider, address, config);
      },
      addStake: async (amount: string) => {
        const { addStake } = await import("./contracts/agentRegistry");
        return addStake(this.signer, amount, config);
      },
      withdrawStake: async (amount: string) => {
        const { withdrawStake } = await import("./contracts/agentRegistry");
        return withdrawStake(this.signer, amount, config);
      },
    };
  }

  /**
   * Marketplace operations
   */
  get marketplace() {
    const config = {
      defaultAddress: this.config.marketplaceAddress,
    };
    return {
      publishService: async (params: {
        name: string;
        description: string;
        endpointURL: string;
        pricePerRequest: string;
      }) => {
        const { publishService } = await import("./contracts/marketplace");
        return publishService(
          this.signer,
          params.name,
          params.description,
          params.endpointURL,
          params.pricePerRequest,
          config
        );
      },
      requestService: async (serviceId: string) => {
        const { requestService } = await import("./contracts/marketplace");
        return requestService(this.signer, serviceId, config);
      },
      getAllServices: async () => {
        const { getAllServices } = await import("./contracts/marketplace");
        return getAllServices(this.provider, config);
      },
      getService: async (serviceId: string) => {
        const { getService } = await import("./contracts/marketplace");
        return getService(this.provider, serviceId, config);
      },
    };
  }

  /**
   * x402 Payment operations
   */
  get x402() {
    return {
      pay: async (params: {
        amount: string;
        token: "USDC" | "AVAX";
        recipient?: string;
        tier?: "basic" | "premium";
        apiUrl?: string;
      }) => {
        const { initiateX402Payment } = await import("./x402/payments");
        return initiateX402Payment({
          amount: params.amount,
          token: params.token,
          chain: this.config.network,
          recipient: params.recipient,
          tier: params.tier,
          apiUrl: params.apiUrl,
        });
      },
    };
  }

  /**
   * AI operations (Gemini)
   * Note: Full AI integration requires GEMINI_API_KEY and full implementation
   */
  get ai() {
    return {
      generateContent: async (prompt: string, options?: {
        temperature?: number;
        maxOutputTokens?: number;
      }) => {
        const { generateContentWithFallback } = await import("./ai/gemini");
        return generateContentWithFallback(prompt, undefined, options);
      },
      // optimizeDeFi requires full Gemini implementation
      // Users should import from main project or implement their own
    };
  }
}

