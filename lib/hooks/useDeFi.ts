/**
 * React Hook for DeFi Agent Operations
 * Provides access to DeFi integrations (Trader Joe, Benqi, Aave)
 */

import { useState, useCallback } from "react";
import { useSDK, useAddress } from "@thirdweb-dev/react";
import { DeFiAgent } from "@/lib/agents/hybrid-defi-agent";
import { ethers } from "ethers";

export interface PortfolioData {
  balances: Record<string, number>;
  positions: Array<{
    protocol: string;
    token: string;
    amount: number;
    apy: number;
  }>;
  totalValue: number;
}

export interface DeFiOptimizationResult {
  analysis: {
    analysis: string;
    recommendations: Array<{
      action: "rebalance" | "deposit" | "withdraw" | "swap" | "wait";
      protocol?: string;
      token?: string;
      amount?: number;
      reasoning: string;
      confidence: number;
      expectedROI?: number;
    }>;
    riskLevel: string;
  };
  decision: {
    agentId: string;
    decision: string;
    reasoning: string;
    confidence: number;
    timestamp: number;
  };
  proof: string;
  txHash?: string;
  executionResult?: {
    success: boolean;
    txHash?: string;
    error?: string;
  };
}

export function useDeFiAgent(agentId?: string) {
  const sdk = useSDK();
  const address = useAddress();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getAgent = useCallback(async (): Promise<DeFiAgent | null> => {
    if (!sdk || !address) {
      setError(new Error("Wallet not connected"));
      return null;
    }

    try {
      const signer = await sdk.getSigner();
      if (!signer) {
        setError(new Error("Signer not available"));
        return null;
      }

      // Get network
      const network = await signer.provider!.getNetwork();
      const networkName = network.chainId === 43113n ? "avalanche-fuji" : "avalanche-mainnet";

      // Create DeFi agent with protocol configuration
      // Use NEXT_PUBLIC_ variables for frontend access
      const benqiComptroller = typeof window !== 'undefined' 
        ? process.env.NEXT_PUBLIC_BENQI_COMPTROLLER_ADDRESS 
        : undefined;
      const aaveProvider = typeof window !== 'undefined'
        ? process.env.NEXT_PUBLIC_AAVE_PROVIDER_ADDRESS
        : undefined;

      const agent = new DeFiAgent(
        agentId || `defi-agent-${address.slice(0, 8)}`,
        signer,
        networkName,
        {
          benqiComptroller,
          aaveProvider,
        }
      );

      return agent;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to create DeFi agent"));
      return null;
    }
  }, [sdk, address, agentId]);

  const optimizePortfolio = useCallback(
    async (portfolio: PortfolioData): Promise<DeFiOptimizationResult | null> => {
      setLoading(true);
      setError(null);

      try {
        const agent = await getAgent();
        if (!agent) {
          return null;
        }

        const result = await agent.optimizeAndRecord(portfolio);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Portfolio optimization failed"));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getAgent]
  );

  const quickOptimize = useCallback(
    async (portfolio: PortfolioData) => {
      setLoading(true);
      setError(null);

      try {
        const agent = await getAgent();
        if (!agent) {
          return null;
        }

        const result = await agent.quickOptimize(portfolio);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Quick optimization failed"));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getAgent]
  );

  return {
    optimizePortfolio,
    quickOptimize,
    loading,
    error,
    isReady: !!sdk && !!address,
  };
}

