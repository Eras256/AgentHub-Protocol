// Multi-Agent Collaboration System
// 3 agentes colaborando vía Gemini para decisiones complejas

import { generateGeminiResponse } from "../ai/gemini";

export interface AgentRole {
  id: string;
  name: string;
  expertise: string;
  systemInstruction: string;
}

export interface AgentResponse {
  agentId: string;
  response: string;
  confidence: number;
  reasoning: string;
  timestamp: number;
}

export interface CollaborationResult {
  finalDecision: string;
  agentResponses: AgentResponse[];
  consensus: number; // 0-100
  executionPlan: string[];
}

/**
 * Multi-agent collaboration system
 * Agents work together to make complex decisions
 */
export class MultiAgentCollaboration {
  private agents: AgentRole[];

  constructor(agents: AgentRole[]) {
    this.agents = agents;
  }

  /**
   * Market Analyst Agent
   * Analyzes market conditions and trends
   */
  static createMarketAnalyst(): AgentRole {
    return {
      id: "market-analyst",
      name: "Market Analyst",
      expertise: "Market analysis, price trends, volume analysis",
      systemInstruction: `You are a professional market analyst for AgentHub Protocol on Avalanche.

Your expertise:
- Technical analysis (RSI, MACD, Bollinger Bands)
- On-chain metrics (volume, transactions, whale movements)
- Market sentiment analysis
- Price prediction models

Provide clear, data-driven analysis with confidence levels.
Format: JSON with analysis, recommendation, confidence (0-100), keyMetrics`,
    };
  }

  /**
   * Risk Manager Agent
   * Reviews decisions for risk assessment
   */
  static createRiskManager(): AgentRole {
    return {
      id: "risk-manager",
      name: "Risk Manager",
      expertise: "Risk assessment, portfolio protection, stop-loss strategies",
      systemInstruction: `You are a risk management specialist for AgentHub Protocol.

Your expertise:
- Risk/reward ratio analysis
- Portfolio exposure assessment
- Stop-loss and take-profit strategies
- Volatility analysis
- Slippage and gas cost evaluation

Review proposals and provide risk assessment.
Format: JSON with riskLevel (low/medium/high), riskScore (0-100), recommendation, safeguards`,
    };
  }

  /**
   * Executor Agent
   * Executes approved strategies
   */
  static createExecutor(): AgentRole {
    return {
      id: "executor",
      name: "Strategy Executor",
      expertise: "Trade execution, smart contract interactions, x402 payments",
      systemInstruction: `You are an execution specialist for AgentHub Protocol.

Your expertise:
- Optimal execution timing
- Gas optimization
- x402 micropayment routing
- Smart contract interaction patterns
- Transaction batching

Create execution plans for approved strategies.
Format: JSON with executionPlan (array of steps), estimatedGas, timing, confidence`,
    };
  }

  /**
   * Create default 3-agent collaboration system
   */
  static createDefault(): MultiAgentCollaboration {
    return new MultiAgentCollaboration([
      MultiAgentCollaboration.createMarketAnalyst(),
      MultiAgentCollaboration.createRiskManager(),
      MultiAgentCollaboration.createExecutor(),
    ]);
  }

  /**
   * Run collaborative decision-making process
   */
  async collaborate(context: {
    marketData?: Record<string, any>;
    portfolio?: Record<string, any>;
    objective: string;
  }): Promise<CollaborationResult> {
    const agentResponses: AgentResponse[] = [];

    // Step 1: Market Analyst analyzes the situation
    const analystPrompt = `Analyze the current market situation for: ${context.objective}

Market data: ${JSON.stringify(context.marketData || {})}
Portfolio: ${JSON.stringify(context.portfolio || {})}

Provide your analysis and recommendation.`;

    const analystResponse = await generateGeminiResponse(
      analystPrompt,
      this.agents[0].systemInstruction
    );

    agentResponses.push({
      agentId: this.agents[0].id,
      response: analystResponse,
      confidence: 85,
      reasoning: "Market analysis completed",
      timestamp: Date.now(),
    });

    // Step 2: Risk Manager reviews the analysis
    const riskPrompt = `Review this market analysis and assess risks:

${analystResponse}

Context: ${context.objective}
Portfolio: ${JSON.stringify(context.portfolio || {})}

Provide risk assessment and recommendation.`;

    const riskResponse = await generateGeminiResponse(
      riskPrompt,
      this.agents[1].systemInstruction
    );

    agentResponses.push({
      agentId: this.agents[1].id,
      response: riskResponse,
      confidence: 80,
      reasoning: "Risk assessment completed",
      timestamp: Date.now(),
    });

    // Step 3: Executor creates execution plan if approved
    const executorPrompt = `Based on this analysis and risk assessment, create an execution plan:

Market Analysis:
${analystResponse}

Risk Assessment:
${riskResponse}

Objective: ${context.objective}

If the risk is acceptable, provide a detailed execution plan. If not, recommend waiting or adjusting strategy.`;

    const executorResponse = await generateGeminiResponse(
      executorPrompt,
      this.agents[2].systemInstruction
    );

    agentResponses.push({
      agentId: this.agents[2].id,
      response: executorResponse,
      confidence: 75,
      reasoning: "Execution plan created",
      timestamp: Date.now(),
    });

    // Step 4: Determine consensus and final decision
    const consensusPrompt = `Synthesize these agent responses into a final decision:

1. Market Analyst: ${analystResponse}
2. Risk Manager: ${riskResponse}
3. Executor: ${executorResponse}

Objective: ${context.objective}

Provide final decision, consensus level (0-100), and execution plan.
Format: JSON with finalDecision, consensus, executionPlan (array)`;

    const finalDecision = await generateGeminiResponse(consensusPrompt);

    try {
      const parsed = JSON.parse(finalDecision);
      return {
        finalDecision: parsed.finalDecision || finalDecision,
        agentResponses,
        consensus: parsed.consensus || 75,
        executionPlan: parsed.executionPlan || [],
      };
    } catch {
      return {
        finalDecision,
        agentResponses,
        consensus: 70,
        executionPlan: [executorResponse],
      };
    }
  }

  /**
   * Quick collaboration for simple decisions
   */
  async quickCollaborate(
    marketAnalystPrompt: string,
    riskManagerContext?: string,
    executorContext?: string
  ): Promise<CollaborationResult> {
    // Market Analyst
    const marketAnalyst = await generateGeminiResponse(
      marketAnalystPrompt,
      this.agents[0].systemInstruction
    );

    // Risk Manager reviews
    const riskManager = await generateGeminiResponse(
      `Review: ${marketAnalyst}${riskManagerContext ? `\n\nContext: ${riskManagerContext}` : ""}`,
      this.agents[1].systemInstruction
    );

    // Executor decides
    const executor = await generateGeminiResponse(
      `Execute if safe: ${riskManager}${executorContext ? `\n\nContext: ${executorContext}` : ""}`,
      this.agents[2].systemInstruction
    );

    return {
      finalDecision: executor,
      agentResponses: [
        {
          agentId: this.agents[0].id,
          response: marketAnalyst,
          confidence: 80,
          reasoning: "Market analysis",
          timestamp: Date.now(),
        },
        {
          agentId: this.agents[1].id,
          response: riskManager,
          confidence: 75,
          reasoning: "Risk review",
          timestamp: Date.now(),
        },
        {
          agentId: this.agents[2].id,
          response: executor,
          confidence: 70,
          reasoning: "Execution decision",
          timestamp: Date.now(),
        },
      ],
      consensus: 75,
      executionPlan: [executor],
    };
  }
}

