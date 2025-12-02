// Hybrid DeFi Agent: Gemini (analysis) + Kite AI (on-chain attribution)
// Example implementation of the hybrid architecture

import { GoogleGenerativeAI } from "@google/generative-ai";
import { HybridAIAgent, Decision } from "../ai/hybrid-agent";
import { initiateX402Payment } from "../x402/client";

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
 */
export class DeFiAgent {
  private gemini: GoogleGenerativeAI;
  private hybridAgent: HybridAIAgent;
  private agentId: string;

  constructor(agentId?: string) {
    this.agentId = agentId || this.generateAgentId();
    this.gemini = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
    
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
   * Execute trade via x402 payment
   */
  async executeX402Trade(decision: DeFiDecision): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    if (decision.action === "wait") {
      return { success: false, error: "No action to execute" };
    }

    try {
      // Calculate payment amount (mock - in production, this would be actual trade amount)
      const amount = decision.amount?.toString() || "0.01";

      const paymentResult = await initiateX402Payment({
        amount,
        token: "USDC",
        chain: "avalanche-fuji",
        recipient: `protocol-${decision.protocol || "traderjoe"}`,
      });

      return paymentResult;
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

    // Step 4: Execute via x402 if recommended
    let executionResult;
    if (analysis.recommendations.length > 0) {
      const topRec = analysis.recommendations[0];
      if (topRec.action !== "wait" && topRec.confidence > 70) {
        executionResult = await this.executeX402Trade(topRec);
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

