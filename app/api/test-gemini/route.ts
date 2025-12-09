import { NextRequest, NextResponse } from "next/server";
import { callGemini, generateContentWithFallback } from "@/lib/ai/gemini";

// Force Node.js runtime for Vercel
export const runtime = "nodejs";

/**
 * Test endpoint to validate Gemini AI connectivity
 * GET /api/test-gemini - Simple connectivity test
 * POST /api/test-gemini - Test with custom prompt
 */
export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "GEMINI_API_KEY not configured",
      }, { status: 500 });
    }

    // Simple test prompt
    const testPrompt = "Say 'Hello from Gemini AI' and confirm you are working correctly. Respond in JSON format: {status: 'ok', message: 'your message'}";

    try {
      const { data, modelUsed } = await callGemini(testPrompt, {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 256,
      });

      return NextResponse.json({
        success: true,
        data,
        modelUsed,
        message: "Gemini AI is working correctly!",
      });
    } catch (error: any) {
      // Fallback to text response if JSON parsing fails
      const response = await generateContentWithFallback(
        "Say 'Hello from Gemini AI' and confirm you are working correctly.",
        undefined,
        { maxOutputTokens: 256 }
      );

      return NextResponse.json({
        success: true,
        data: { status: "ok", message: response.content },
        modelUsed: response.model,
        message: "Gemini AI is working (text response mode)",
      });
    }
  } catch (error: any) {
    console.error("Test Gemini error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to connect to Gemini AI",
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({
        success: false,
        error: "Prompt is required",
      }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "GEMINI_API_KEY not configured",
      }, { status: 500 });
    }

    // Try JSON response first
    try {
      const { data, modelUsed } = await callGemini(prompt, {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 1024,
      });

      return NextResponse.json({
        success: true,
        data,
        modelUsed,
      });
    } catch {
      // Fallback to text response
      const response = await generateContentWithFallback(prompt, undefined, {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 1024,
      });

      return NextResponse.json({
        success: true,
        data: { content: response.content },
        modelUsed: response.model,
      });
    }
  } catch (error: any) {
    console.error("Test Gemini POST error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to process request",
    }, { status: 500 });
  }
}

