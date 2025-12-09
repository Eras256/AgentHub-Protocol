// Hybrid AI Agent: Gemini (primary) + Kite AI (complement)
// Gemini: Fast, cheap, off-chain decisions
// Kite AI: Verifiable, on-chain attribution (PoAI)

import { generateGeminiResponse, makeAgentDecision } from "./gemini";
import * as kiteAI from "../kite/agent";

export interface Decision {
  agentId: string;
  decision: string;
  reasoning: string;
  confidence: number;
  timestamp: number;
  context: Record<string, any>;
  model: string;
}

export interface PoAIProof {
  agentId: string;
  decision: Decision;
  proofHash: string;
  timestamp: number;
  model: string;
  confidence: number;
  inputs: Record<string, any>;
}

export interface HybridDecisionResult {
  decision: Decision;
  poaiProof?: PoAIProof;
  txHash?: string;
  onChain: boolean;
}

/**
 * Hybrid AI Agent
 * Combines Gemini (off-chain) with Kite AI (on-chain verification)
 */
export class HybridAIAgent {
  private agentId: string;
  private useKiteAI: boolean;

  constructor(agentId: string, useKiteAI: boolean = false) {
    this.agentId = agentId;
    this.useKiteAI = useKiteAI && !!process.env.KITE_API_KEY;
  }

  /**
   * Generate PoAI (Proof of Attributed Intelligence)
   * Creates a verifiable proof that an AI made a specific decision
   */
  private generatePoAI(decision: Decision): PoAIProof {
    // Create deterministic proof hash from decision data
    const proofData = JSON.stringify({
      agentId: decision.agentId,
      decision: decision.decision,
      reasoning: decision.reasoning,
      timestamp: decision.timestamp,
      model: decision.model,
      confidence: decision.confidence,
      inputs: decision.context,
    });

    // In production, this would use cryptographic hashing
    const proofHash = `poai-${Buffer.from(proofData).toString("base64").substring(0, 32)}-${Date.now()}`;

    return {
      agentId: decision.agentId,
      decision,
      proofHash,
      timestamp: Date.now(),
      model: decision.model,
      confidence: decision.confidence,
      inputs: decision.context,
    };
  }

  /**
   * Make decision using Gemini (fast, cheap, off-chain)
   */
  async makeDecision(context: string | Record<string, any>): Promise<Decision> {
    const contextStr = typeof context === "string" ? context : JSON.stringify(context);

    // Use Gemini for fast, cost-effective decision making
    const response = await generateGeminiResponse(
      `Make a decision based on this context: ${contextStr}`,
      `You are an autonomous AI agent (ID: ${this.agentId}) operating on AgentHub Protocol.
      
Make clear, actionable decisions with reasoning and confidence level.
Format response as JSON with: decision, reasoning, confidence (0-100), recommendedAction.`
    );

    try {
      const parsed = JSON.parse(response);
      return {
        agentId: this.agentId,
        decision: parsed.decision || response,
        reasoning: parsed.reasoning || "AI-generated decision",
        confidence: parsed.confidence || 75,
        timestamp: Date.now(),
        context: typeof context === "object" ? context : { prompt: context },
        model: "gemini-pro",
      };
    } catch {
      return {
        agentId: this.agentId,
        decision: response,
        reasoning: "AI-generated decision",
        confidence: 75,
        timestamp: Date.now(),
        context: typeof context === "object" ? context : { prompt: context },
        model: "gemini-pro",
      };
    }
  }

  /**
   * Record decision on-chain using Kite AI (verifiable, attribution)
   */
  async recordDecisionOnChain(decision: Decision): Promise<{
    proof: PoAIProof;
    txHash?: string;
  }> {
    if (!this.useKiteAI) {
      // Generate PoAI proof locally if Kite AI not available
      const proof = this.generatePoAI(decision);
      return { proof };
    }

    // Generate PoAI proof
    const proof = this.generatePoAI(decision);

    try {
      // Submit to Kite AI for on-chain verification
      const kiteDecision = await kiteAI.makeKiteDecision(this.agentId, {
        decision: decision.decision,
        reasoning: decision.reasoning,
        timestamp: decision.timestamp,
        model: decision.model,
        confidence: decision.confidence,
        context: decision.context,
      });

      return {
        proof,
        txHash: kiteDecision.proof, // Kite AI returns proof hash as txHash
      };
    } catch (error) {
      console.error("Kite AI submission failed:", error);
      // Return proof without on-chain submission
      return { proof };
    }
  }

  /**
   * Complete workflow: Make decision + Record on-chain
   */
  async makeDecisionAndRecord(
    context: string | Record<string, any>
  ): Promise<HybridDecisionResult> {
    // Step 1: Make decision with Gemini (off-chain, fast, cheap)
    const decision = await this.makeDecision(context);

    // Step 2: Record on-chain with Kite AI (if enabled)
    if (this.useKiteAI) {
      const { proof, txHash } = await this.recordDecisionOnChain(decision);
      return {
        decision,
        poaiProof: proof,
        txHash,
        onChain: true,
      };
    }

    // Step 3: Generate PoAI proof locally (off-chain)
    const proof = this.generatePoAI(decision);
    return {
      decision,
      poaiProof: proof,
      onChain: false,
    };
  }

  /**
   * Use advanced Gemini decision making with full context
   */
  async makeAdvancedDecision(
    agentContext: {
      agentType: string;
      currentState: Record<string, any>;
      availableActions: string[];
    },
    marketData?: Record<string, any>
  ): Promise<HybridDecisionResult> {
    // Use makeAgentDecision for advanced analysis
    const geminiDecision = await makeAgentDecision(
      { ...agentContext, agentId: this.agentId },
      marketData
    );

    const decision: Decision = {
      agentId: this.agentId,
      decision: geminiDecision.decision,
      reasoning: geminiDecision.reasoning,
      confidence: geminiDecision.confidence,
      timestamp: Date.now(),
      context: {
        agentType: agentContext.agentType,
        currentState: agentContext.currentState,
        availableActions: agentContext.availableActions,
        marketData,
      },
      model: "gemini-pro",
    };

    // Record on-chain if Kite AI enabled
    if (this.useKiteAI) {
      const { proof, txHash } = await this.recordDecisionOnChain(decision);
      return {
        decision,
        poaiProof: proof,
        txHash,
        onChain: true,
      };
    }

    const proof = this.generatePoAI(decision);
    return {
      decision,
      poaiProof: proof,
      onChain: false,
    };
  }
}

