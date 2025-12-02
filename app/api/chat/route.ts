import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // Check if Google Gemini API key is available
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      // Return mock response if no API key
      return NextResponse.json({
        content:
          "I'm currently running in demo mode. To enable full AI capabilities, please configure GOOGLE_GEMINI_API_KEY in your environment variables.",
      });
    }

    // Dynamic import to avoid issues if package is not installed
    const { GoogleGenerativeAI } = await import("@google/generative-ai");

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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

    // Build conversation history for Gemini
    // Gemini expects alternating user/model messages in history
    // Include system instruction as first message in history
    const history: any[] = [
      {
        role: "user",
        parts: [{ text: systemInstruction }],
      },
      {
        role: "model",
        parts: [{ text: "I understand. I'm ready to help with AgentHub Protocol." }],
      },
    ];
    
    // Process all messages except the last one (which is the current user query)
    const messagesForHistory = messages.slice(0, -1);
    
    for (let i = 0; i < messagesForHistory.length; i++) {
      const msg = messagesForHistory[i];
      if (msg.role === "user") {
        history.push({
          role: "user",
          parts: [{ text: msg.content }],
        });
      } else if (msg.role === "assistant" && i > 0) {
        // Only add assistant message if there was a user message before
        history.push({
          role: "model",
          parts: [{ text: msg.content }],
        });
      }
    }

    // Get the last user message (current query)
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage?.content || "";

    // Start chat with history
    const chat = model.startChat({
      history: history,
    });

    // Send the last user message
    const result = await chat.sendMessage(userQuery);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      content: text,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to get AI response" },
      { status: 500 }
    );
  }
}

