// Protected premium data endpoint using x402 payments
// Official Thirdweb x402 integration
// Reference: https://portal.thirdweb.com/x402/server

import { NextRequest, NextResponse } from "next/server";
import { settlePayment } from "thirdweb/x402";
import { getThirdwebX402Facilitator, avalancheFuji } from "@/lib/x402/facilitator";
import { PAYMENT_TIERS } from "@/lib/x402/middleware";
import { generateContentWithFallback } from "@/lib/ai/gemini";

// Force Node.js runtime for Vercel
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // Validate required environment variables
    if (!process.env.THIRDWEB_SECRET_KEY) {
      return NextResponse.json(
        { error: "THIRDWEB_SECRET_KEY not configured" },
        { status: 500 }
      );
    }

    if (!process.env.THIRDWEB_SERVER_WALLET_ADDRESS) {
      return NextResponse.json(
        { error: "THIRDWEB_SERVER_WALLET_ADDRESS (facilitator) not configured" },
        { status: 500 }
      );
    }

    // Get payment data from request headers
    const paymentData = req.headers.get("x-payment");
    const resourceUrl = req.nextUrl.toString();

    // Use settlePayment from thirdweb/x402 for official integration
    // This handles verification and settlement automatically
    const result = await settlePayment({
      resourceUrl,
      method: "GET",
      paymentData: paymentData || undefined,
      payTo: process.env.THIRDWEB_SERVER_WALLET_ADDRESS!,
      network: avalancheFuji,
      price: `$${PAYMENT_TIERS.premium.amount}`,
      facilitator: getThirdwebX402Facilitator(),
    });

    if (result.status === 200) {
      // Payment successful - Generate Premium AI Content
      const txHash = result.paymentReceipt?.transaction || "unknown";
      const payer = result.paymentReceipt?.payer;

      // Generate premium AI analysis
      const prompt = "Generate a brief, premium market sentiment analysis for Avalanche (AVAX) based on latest trends.";
      const aiResponse = await generateContentWithFallback(prompt);

      return NextResponse.json(
        {
          success: true,
          data: {
            analysis: aiResponse.content,
            modelUsed: aiResponse.model,
            timestamp: aiResponse.timestamp,
          },
          paymentProof: {
            txHash,
            payer,
          },
        },
        {
          headers: result.responseHeaders,
        }
      );
    } else {
      // Payment required or failed
      return NextResponse.json(
        result.responseBody || {
          error: "Payment required",
          message: "This endpoint requires premium payment",
          payment: {
            tier: "premium",
            ...PAYMENT_TIERS.premium,
          },
        },
        {
          status: result.status,
          headers: result.responseHeaders,
        }
      );
    }
  } catch (error: any) {
    console.error("Premium data endpoint error:", error);
    return NextResponse.json(
      {
        error: "Server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

