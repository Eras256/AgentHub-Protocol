import { NextRequest, NextResponse } from "next/server";
import { generateContentWithFallback } from "@/lib/ai/gemini";

// Force Node.js runtime for Vercel
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // Check if Gemini API key is available
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "GEMINI_API_KEY not configured",
        content: "I'm currently running in demo mode. To enable full AI capabilities, please configure GEMINI_API_KEY in your environment variables.",
      });
    }

    // System instruction for the assistant
    const systemInstruction = `You are an AI assistant for AgentHub Protocol, a platform for autonomous AI agents on Avalanche blockchain.

You help users with:
- Creating and configuring AI agents
- Understanding x402 payment protocol
- Trust score and reputation systems
- Marketplace services
- Technical architecture
- DeFi integrations

Be concise, helpful, and technical when needed. Use emojis sparingly. Format code blocks with markdown.`;

    // Build conversation context from message history
    // For simplicity, we'll use the last few messages as context
    const recentMessages = messages.slice(-6); // Last 6 messages for context
    let conversationContext = systemInstruction + "\n\nConversation history:\n";
    
    for (const msg of recentMessages.slice(0, -1)) {
      conversationContext += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}\n`;
    }

    // Get the last user message (current query)
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage?.content || "";

    // Build full prompt
    const fullPrompt = `${conversationContext}\n\nUser: ${userQuery}\n\nAssistant:`;

    // Use the improved generateContentWithFallback function
    const aiResponse = await generateContentWithFallback(fullPrompt, undefined, {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 1024,
    });

    return NextResponse.json({
      success: true,
      content: aiResponse.content,
      model: aiResponse.model, // Log which model was used
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get AI response",
      },
      { status: 500 }
    );
  }
}

