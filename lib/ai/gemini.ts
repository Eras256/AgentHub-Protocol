// Shared Gemini AI utility for use across the project
// Can be used by chatbot, autonomous agents, and other AI features

import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

export function initializeGemini() {
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    return null;
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  return { genAI, model };
}

export async function generateGeminiResponse(
  prompt: string,
  systemInstruction?: string,
  history?: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>
): Promise<string> {
  const initialized = initializeGemini();
  if (!initialized) {
    throw new Error("Google Gemini API key not configured");
  }

  const { model: geminiModel } = initialized;

  if (history && history.length > 0) {
    // Use chat mode with history
    // If systemInstruction is provided, prepend it to history
    let chatHistory = history;
    if (systemInstruction) {
      chatHistory = [
        {
          role: "user" as const,
          parts: [{ text: systemInstruction }],
        },
        {
          role: "model" as const,
          parts: [{ text: "Understood. I'm ready to help." }],
        },
        ...history,
      ];
    }
    const chat = geminiModel.startChat({
      history: chatHistory,
    });
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    return response.text();
  } else {
    // Use simple generation
    const result = await geminiModel.generateContent(
      systemInstruction
        ? `${systemInstruction}\n\nUser: ${prompt}\nAssistant:`
        : prompt
    );
    const response = await result.response;
    return response.text();
  }
}

// For autonomous agent decisions
export async function makeAgentDecision(
  agentContext: {
    agentId: string;
    agentType: string;
    currentState: Record<string, any>;
    availableActions: string[];
  },
  marketData?: Record<string, any>
): Promise<{
  decision: string;
  reasoning: string;
  confidence: number;
  recommendedAction: string;
}> {
  const systemInstruction = `You are an autonomous AI agent operating on AgentHub Protocol on Avalanche blockchain.

Your role: ${agentContext.agentType}
Current state: ${JSON.stringify(agentContext.currentState)}
Available actions: ${agentContext.availableActions.join(", ")}

${marketData ? `Market data: ${JSON.stringify(marketData)}` : ""}

Make a strategic decision based on:
1. Current agent state and performance
2. Market conditions and opportunities
3. Risk assessment
4. Trust score implications
5. Revenue optimization

Provide:
- A clear decision
- Reasoning for the decision
- Confidence level (0-100)
- Recommended specific action

Format your response as JSON with: decision, reasoning, confidence, recommendedAction`;

  const prompt = `Analyze the current situation and make an autonomous decision for agent ${agentContext.agentId}.`;

  try {
    const response = await generateGeminiResponse(prompt, systemInstruction);
    
    // Try to parse JSON response
    try {
      const parsed = JSON.parse(response);
      return {
        decision: parsed.decision || response,
        reasoning: parsed.reasoning || "AI-generated decision",
        confidence: parsed.confidence || 75,
        recommendedAction: parsed.recommendedAction || agentContext.availableActions[0],
      };
    } catch {
      // If not JSON, return as decision
      return {
        decision: response,
        reasoning: "AI-generated autonomous decision",
        confidence: 75,
        recommendedAction: agentContext.availableActions[0] || "wait",
      };
    }
  } catch (error) {
    console.error("Gemini decision error:", error);
    throw error;
  }
}

// For DeFi strategy optimization
export async function optimizeDeFiStrategy(
  portfolio: Record<string, any>,
  protocols: string[]
): Promise<{
  strategy: string;
  allocations: Record<string, number>;
  expectedYield: number;
  riskLevel: string;
}> {
  const systemInstruction = `You are a DeFi strategy optimizer for AgentHub Protocol.

Current portfolio: ${JSON.stringify(portfolio)}
Available protocols: ${protocols.join(", ")}

Analyze and recommend:
1. Optimal allocation across protocols
2. Expected yield projections
3. Risk assessment
4. Rebalancing strategy

Consider:
- Current market conditions
- Protocol APYs
- Liquidity risks
- Gas costs
- Trust score impact

Format response as JSON with: strategy, allocations, expectedYield, riskLevel`;

  const prompt = `Optimize the DeFi portfolio strategy.`;

  try {
    const response = await generateGeminiResponse(prompt, systemInstruction);
    
    try {
      return JSON.parse(response);
    } catch {
      return {
        strategy: response,
        allocations: {},
        expectedYield: 0,
        riskLevel: "moderate",
      };
    }
  } catch (error) {
    console.error("DeFi optimization error:", error);
    throw error;
  }
}

// Smart Contract Auditor using Gemini's 1M token context
export async function auditSmartContract(
  contractCode: string,
  contractName: string
): Promise<{
  vulnerabilities: Array<{
    severity: "critical" | "high" | "medium" | "low";
    description: string;
    location: string;
    recommendation: string;
  }>;
  securityScore: number;
  recommendations: string[];
}> {
  const systemInstruction = `You are a smart contract security auditor specializing in Solidity and EVM-compatible chains.

Contract: ${contractName}
Code: ${contractCode}

Analyze the contract for:
1. Reentrancy vulnerabilities
2. Access control issues
3. Integer overflow/underflow
4. Front-running risks
5. Gas optimization opportunities
6. Best practice violations
7. Cross-contract interaction risks

Provide detailed security analysis.
Format response as JSON with: vulnerabilities (array), securityScore (0-100), recommendations (array)`;

  const prompt = `Perform a comprehensive security audit of this smart contract.`;

  try {
    const response = await generateGeminiResponse(prompt, systemInstruction);
    
    try {
      return JSON.parse(response);
    } catch {
      return {
        vulnerabilities: [],
        securityScore: 75,
        recommendations: [response],
      };
    }
  } catch (error) {
    console.error("Contract audit error:", error);
    throw error;
  }
}

// Trading Signal Generator
export async function generateTradingSignal(
  pair: string,
  marketData: Record<string, any>
): Promise<{
  signal: "buy" | "sell" | "hold";
  confidence: number;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  reasoning: string;
  technicalIndicators: Record<string, any>;
}> {
  const systemInstruction = `You are a professional trading signal generator for AgentHub Protocol.

Trading pair: ${pair}
Market data: ${JSON.stringify(marketData)}

Analyze:
1. Technical indicators (RSI, MACD, Bollinger Bands)
2. Price action patterns
3. Volume analysis
4. Support/resistance levels
5. Market sentiment

Generate trading signal with entry, stop-loss, and take-profit levels.
Format response as JSON with: signal, confidence, entryPrice, stopLoss, takeProfit, reasoning, technicalIndicators`;

  const prompt = `Generate a trading signal for ${pair} based on current market conditions.`;

  try {
    const response = await generateGeminiResponse(prompt, systemInstruction);
    
    try {
      return JSON.parse(response);
    } catch {
      return {
        signal: "hold" as const,
        confidence: 50,
        reasoning: response,
        technicalIndicators: {},
      };
    }
  } catch (error) {
    console.error("Trading signal error:", error);
    throw error;
  }
}

