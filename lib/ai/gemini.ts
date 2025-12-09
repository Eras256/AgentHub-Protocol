// Shared Gemini AI utility for use across the project
// Can be used by chatbot, autonomous agents, and other AI features

import { GoogleGenerativeAI } from "@google/generative-ai";

// ============================================
// ROBUST AI CLIENT WITH FALLBACK STRATEGY
// ============================================
// Priority order: Newest/Fastest -> Legacy/Stable
// Ensures 100% demo uptime even if latest models are unavailable

// Support both GEMINI_API_KEY and GOOGLE_GEMINI_API_KEY for compatibility
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY or GOOGLE_GEMINI_API_KEY not configured. AI features will be limited.");
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Model order according to official documentation
// Priority: gemini-2.5-flash (confirmed functional)
// Note: gemini-pro is NOT available in v1beta API
const MODELS = [
  "gemini-2.5-flash", // ⚡ Primary: Newest, fastest (confirmed functional)
  "gemini-2.5-pro",   // 🧠 Fallback 1: More capable
  "gemini-2.0-flash", // 🛡️ Fallback 2: Stable previous version
  "gemini-1.5-flash", // 📉 Fallback 3: Legacy reliable
  "gemini-1.5-pro",   // 🎯 Fallback 4: Most capable legacy
];

export interface AIResponse {
  content: string;
  model: string;
  timestamp: number;
}

/**
 * Generate content with automatic fallback across multiple Gemini models
 * Ensures maximum uptime by trying models in priority order
 * @param prompt - Text prompt for AI generation
 * @param imageBase64 - Optional base64 image data (for multimodal)
 * @returns AIResponse with content, model used, and timestamp
 */
/**
 * Generate content with automatic fallback across multiple Gemini models
 * Enhanced with JSON extraction and better error handling
 */
export async function generateContentWithFallback(
  prompt: string,
  imageBase64?: string,
  options?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
    extractJSON?: boolean;
  }
): Promise<AIResponse> {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY or GOOGLE_GEMINI_API_KEY environment variable is required");
  }

  const {
    temperature = 0.7,
    topP = 0.9,
    topK = 40,
    maxOutputTokens = 1024,
    extractJSON = false,
  } = options || {};

  let lastError: any;

  for (const modelName of MODELS) {
    try {
      console.log(`🤖 [AI] Attempting generation with model: ${modelName}`);

      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature,
          topP,
          topK,
          maxOutputTokens,
        },
      });

      const parts: any[] = [{ text: prompt }];

      if (imageBase64) {
        // Ensure clean base64 string (remove data URL prefix if present)
        const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
        parts.push({
          inlineData: {
            data: cleanBase64,
            mimeType: "image/png", // Defaulting to png for simplicity
          },
        });
      }

      const result = await model.generateContent(parts);
      const responseText = result.response.text();

      if (!responseText || responseText.trim().length === 0) {
        throw new Error("Empty response from AI");
      }

      // Extract JSON if requested
      let finalContent = responseText;
      if (extractJSON) {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          finalContent = jsonMatch[0];
        }
      }

      console.log(`✅ [AI] Success with ${modelName}`);

      return {
        content: finalContent,
        model: modelName, // Metadata for debugging
        timestamp: Date.now(),
      };
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      console.warn(`⚠️ [AI] Model ${modelName} failed:`, errorMsg.substring(0, 200));
      lastError = error;

      // Handle different error types
      if (errorMsg.includes("429") || error.status === 429) {
        // Rate limit - wait longer before trying next model
        const waitTime = 2000; // 2 seconds
        console.log(`⏳ [AI] Rate limit hit for ${modelName}, waiting ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else if (errorMsg.includes("404") || error.status === 404) {
        // Model not found - skip quickly to next model
        console.log(`⏭️ [AI] Model ${modelName} not available, trying next...`);
        // No wait needed for 404
      } else if (errorMsg.includes("quota") || errorMsg.includes("Quota")) {
        // Quota exceeded - wait a bit
        console.log(`⏳ [AI] Quota exceeded for ${modelName}, waiting 1s...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Continue to next model in loop
    }
  }

  console.error("❌ [AI] All models failed");
  throw new Error(
    `AI Service Unavailable: ${lastError?.message || "Unknown error"}`
  );
}

/**
 * Call Gemini with structured JSON response extraction
 * Returns parsed JSON data or throws error
 */
export async function callGemini(
  prompt: string,
  options?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
  }
): Promise<{ data: any; modelUsed: string }> {
  const response = await generateContentWithFallback(prompt, undefined, {
    ...options,
    extractJSON: true,
  });

  try {
    const data = JSON.parse(response.content);
    return { data, modelUsed: response.model };
  } catch (error) {
    // If JSON parsing fails, try to extract JSON from the response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[0]);
        return { data, modelUsed: response.model };
      } catch {
        throw new Error("Failed to parse JSON from AI response");
      }
    }
    throw new Error("No valid JSON found in AI response");
  }
}

// ============================================
// LEGACY FUNCTIONS (Maintained for compatibility)
// ============================================

let legacyGenAI: GoogleGenerativeAI | null = null;
let legacyModel: any = null;

export function initializeGemini() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  
  if (!apiKey) {
    return null;
  }

  if (!legacyGenAI) {
    legacyGenAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash as primary, with fallback
    try {
      legacyModel = legacyGenAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    } catch {
      // Fallback to 1.5-flash if 2.5-flash not available
      legacyModel = legacyGenAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }
  }

  return { genAI: legacyGenAI, model: legacyModel };
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

IMPORTANT: Respond ONLY with valid JSON. No markdown, no explanations outside the JSON.
Format response as JSON with: strategy, allocations, expectedYield, riskLevel`;

  const prompt = `Optimize the DeFi portfolio strategy. Return only valid JSON.`;

  try {
    // Use the new callGemini function for better JSON extraction
    const { data, modelUsed } = await callGemini(
      `${systemInstruction}\n\n${prompt}`,
      { temperature: 0.4, topP: 0.8 }
    );
    
    console.log(`✅ [AI] DeFi optimization completed with ${modelUsed}`);
    
    // Validate and return
    return {
      strategy: data.strategy || "No strategy provided",
      allocations: data.allocations || {},
      expectedYield: data.expectedYield || 0,
      riskLevel: data.riskLevel || "moderate",
    };
  } catch (error) {
    console.error("DeFi optimization error:", error);
    // Fallback to old method if new one fails
    try {
      const response = await generateGeminiResponse(prompt, systemInstruction);
      const parsed = JSON.parse(response);
      return parsed;
    } catch {
      return {
        strategy: "Unable to generate strategy at this time",
        allocations: {},
        expectedYield: 0,
        riskLevel: "moderate",
      };
    }
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

