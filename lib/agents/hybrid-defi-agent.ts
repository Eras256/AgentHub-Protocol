// Hybrid DeFi Agent: Gemini (analysis) + Kite AI (on-chain attribution)
// Real DeFi protocol integrations with Trader Joe, Benqi, and Aave

import { GoogleGenerativeAI } from "@google/generative-ai";
import { HybridAIAgent, Decision } from "../ai/hybrid-agent";
import { ethers } from "ethers";
import {
  executeSwap,
  getSwapQuote,
  supplyToBenqi,
  borrowFromBenqi,
  repayToBenqi,
  withdrawFromBenqi,
  supplyToAave,
  borrowFromAave,
  repayToAave,
  withdrawFromAave,
  getAaveProviderAddress,
  type SwapParams,
} from "../defi";

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

export interface DeFiDecision {
  action: "rebalance" | "deposit" | "withdraw" | "swap" | "wait";
  protocol?: string;
  token?: string;
  amount?: number;
  reasoning: string;
  confidence: number;
  expectedROI?: number;
}

/**
 * Hybrid DeFi Agent
 * Uses Gemini for analysis, Kite AI for on-chain attribution
 * Real integrations with Trader Joe, Benqi, and Aave
 */
export class DeFiAgent {
  private gemini: GoogleGenerativeAI;
  private hybridAgent: HybridAIAgent;
  private agentId: string;
  private signer?: ethers.Signer;
  private network: "avalanche-fuji" | "avalanche-mainnet";
  private protocolConfig: {
    benqiComptroller?: string;
    aaveProvider?: string;
  };

  constructor(
    agentId?: string,
    signer?: ethers.Signer,
    network: "avalanche-fuji" | "avalanche-mainnet" = "avalanche-fuji",
    protocolConfig?: {
      benqiComptroller?: string;
      aaveProvider?: string;
    }
  ) {
    this.agentId = agentId || this.generateAgentId();
    this.gemini = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
    this.signer = signer;
    this.network = network;
    this.protocolConfig = protocolConfig || {
      benqiComptroller: process.env.BENQI_COMPTROLLER_ADDRESS,
      aaveProvider: process.env.AAVE_PROVIDER_ADDRESS || getAaveProviderAddress(network),
    };
    
    // Initialize hybrid agent with Kite AI support
    const useKiteAI = !!process.env.KITE_API_KEY;
    this.hybridAgent = new HybridAIAgent(this.agentId, useKiteAI);
  }

  private generateAgentId(): string {
    return `defi-agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Analyze portfolio using Gemini (off-chain, fast, cheap)
   */
  async analyzePortfolio(data: PortfolioData): Promise<{
    analysis: string;
    recommendations: DeFiDecision[];
    riskLevel: string;
  }> {
    const model = this.gemini.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Analyze this DeFi portfolio on Avalanche:

Portfolio Data:
${JSON.stringify(data, null, 2)}

Available Protocols:
- Trader Joe (DEX, Liquidity Pools)
- Benqi (Lending)
- Aave (Lending)

Provide:
1. Current portfolio health assessment
2. Risk level (low/medium/high)
3. Recommended actions (rebalance, deposit, withdraw, swap)
4. Expected ROI for each recommendation
5. Confidence level (0-100)

Format as JSON with: analysis, recommendations (array), riskLevel, expectedROI`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      try {
        const parsed = JSON.parse(response);
        return {
          analysis: parsed.analysis || response,
          recommendations: parsed.recommendations || [],
          riskLevel: parsed.riskLevel || "medium",
        };
      } catch {
        return {
          analysis: response,
          recommendations: [],
          riskLevel: "medium",
        };
      }
    } catch (error) {
      console.error("Portfolio analysis error:", error);
      throw error;
    }
  }

  /**
   * Parse analysis into structured decision
   */
  private parseDecision(analysis: {
    analysis: string;
    recommendations: DeFiDecision[];
    riskLevel: string;
  }): Decision {
    const topRecommendation = analysis.recommendations[0] || {
      action: "wait" as const,
      reasoning: analysis.analysis,
      confidence: 50,
    };

    return {
      agentId: this.agentId,
      decision: `${topRecommendation.action} ${topRecommendation.protocol || ""} ${topRecommendation.token || ""} ${topRecommendation.amount || ""}`.trim(),
      reasoning: topRecommendation.reasoning || analysis.analysis,
      confidence: topRecommendation.confidence || 75,
      timestamp: Date.now(),
      context: {
        portfolio: analysis,
        recommendation: topRecommendation,
      },
      model: "gemini-pro",
    };
  }

  /**
   * Record decision on-chain using Kite AI (verifiable, attribution)
   */
  async recordDecision(decision: Decision): Promise<{
    proof: string;
    txHash?: string;
  }> {
    // Use hybrid agent to record on-chain
    const result = await this.hybridAgent.recordDecisionOnChain(decision);

    return {
      proof: result.proof.proofHash,
      txHash: result.txHash,
    };
  }

  /**
   * Execute DeFi operation on real protocols
   */
  async executeDeFiOperation(decision: DeFiDecision): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    if (decision.action === "wait") {
      return { success: false, error: "No action to execute" };
    }

    if (!this.signer) {
      return { success: false, error: "Signer not provided - cannot execute on-chain operations" };
    }

    try {
      const protocol = (decision.protocol || "").toLowerCase();
      const action = decision.action;
      const amount = decision.amount || 0;
      const token = decision.token || "";

      // Convert amount to wei/decimals (simplified - assumes 18 decimals for most tokens)
      const amountWei = ethers.parseUnits(amount.toString(), 18);

      if (action === "swap") {
        // Execute swap on Trader Joe
        if (!token) {
          return { success: false, error: "Token address required for swap" };
        }

        // Get token addresses (simplified - in production, use token registry)
        const tokenIn = token; // Should be actual token address
        const tokenOut = "USDC"; // Should be actual token address

        const swapParams: SwapParams = {
          tokenIn,
          tokenOut,
          amountIn: amountWei.toString(),
          slippageTolerance: 300, // 3%
        };

        // Get quote first
        const quote = await getSwapQuote(
          this.signer.provider!,
          tokenIn,
          tokenOut,
          amountWei.toString(),
          this.network
        );

        swapParams.amountOutMin = quote.amountOut;

        const result = await executeSwap(this.signer, swapParams, this.network);
        return result;
      } else if (action === "deposit") {
        // Supply to lending protocol
        if (protocol.includes("benqi")) {
          if (!this.protocolConfig.benqiComptroller) {
            return { success: false, error: "Benqi Comptroller address not configured" };
          }

          const result = await supplyToBenqi(
            this.signer,
            {
              asset: token || "AVAX",
              amount: amountWei.toString(),
            },
            this.protocolConfig.benqiComptroller,
            this.network
          );
          return result;
        } else if (protocol.includes("aave")) {
          if (!this.protocolConfig.aaveProvider) {
            return { success: false, error: "Aave Provider address not configured" };
          }

          const result = await supplyToAave(
            this.signer,
            {
              asset: token || "AVAX",
              amount: amountWei.toString(),
            },
            this.protocolConfig.aaveProvider,
            this.network
          );
          return result;
        } else {
          return { success: false, error: `Unknown protocol: ${protocol}` };
        }
      } else if (action === "withdraw") {
        // Withdraw from lending protocol
        if (protocol.includes("benqi")) {
          if (!this.protocolConfig.benqiComptroller) {
            return { success: false, error: "Benqi Comptroller address not configured" };
          }

          const result = await withdrawFromBenqi(
            this.signer,
            {
              asset: token || "AVAX",
              amount: "max", // Withdraw all
            },
            this.network
          );
          return result;
        } else if (protocol.includes("aave")) {
          if (!this.protocolConfig.aaveProvider) {
            return { success: false, error: "Aave Provider address not configured" };
          }

          const result = await withdrawFromAave(
            this.signer,
            {
              asset: token || "AVAX",
              amount: "max", // Withdraw all
            },
            this.protocolConfig.aaveProvider,
            this.network
          );
          return result;
        } else {
          return { success: false, error: `Unknown protocol: ${protocol}` };
        }
      } else if (action === "rebalance") {
        // Rebalancing typically involves multiple operations
        // For now, return a placeholder
        return { success: false, error: "Rebalancing requires multiple operations - not yet implemented" };
      } else {
        return { success: false, error: `Unknown action: ${action}` };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Execution failed",
      };
    }
  }

  /**
   * Complete workflow: Analyze → Record → Execute
   */
  async optimizeAndRecord(portfolio: PortfolioData): Promise<{
    analysis: {
      analysis: string;
      recommendations: DeFiDecision[];
      riskLevel: string;
    };
    decision: Decision;
    proof: string;
    txHash?: string;
    executionResult?: {
      success: boolean;
      txHash?: string;
      error?: string;
    };
  }> {
    // Step 1: Analyze portfolio with Gemini (off-chain, fast, cheap)
    const analysis = await this.analyzePortfolio(portfolio);

    // Step 2: Parse into structured decision
    const decision = this.parseDecision(analysis);

    // Step 3: Record decision on-chain with Kite AI (verifiable, attribution)
    const { proof, txHash } = await this.recordDecision(decision);

    // Step 4: Execute on real DeFi protocols if recommended
    let executionResult;
    if (analysis.recommendations.length > 0) {
      const topRec = analysis.recommendations[0];
      if (topRec.action !== "wait" && topRec.confidence > 70) {
        executionResult = await this.executeDeFiOperation(topRec);
      }
    }

    return {
      analysis,
      decision,
      proof,
      txHash,
      executionResult,
    };
  }

  /**
   * Quick optimization (analysis only, no execution)
   */
  async quickOptimize(portfolio: PortfolioData): Promise<{
    analysis: string;
    recommendations: DeFiDecision[];
    riskLevel: string;
  }> {
    return await this.analyzePortfolio(portfolio);
  }
}

