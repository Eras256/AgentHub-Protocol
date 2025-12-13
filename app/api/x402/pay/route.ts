// x402 payment API route
// Official Thirdweb x402 facilitator integration for Avalanche Fuji
// Reference: https://portal.thirdweb.com/x402/server

import { NextRequest, NextResponse } from "next/server";
import { settlePayment } from "thirdweb/x402";
import { getThirdwebX402Facilitator, avalancheFuji } from "@/lib/x402/facilitator";
import { PAYMENT_TIERS } from "@/lib/x402/middleware";

export async function POST(req: NextRequest) {
  try {
    const { amount, token, tier, resourceUrl } = await req.json();

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

    // Determine payment amount based on tier
    const paymentAmount = tier && tier in PAYMENT_TIERS
      ? PAYMENT_TIERS[tier as keyof typeof PAYMENT_TIERS].amount
      : amount || PAYMENT_TIERS.basic.amount;

    // Get payment data from request headers
    const paymentData = req.headers.get("x-payment");

    // Use settlePayment from thirdweb/x402 for official integration
    // This handles the entire payment flow including verification and settlement
    const result = await settlePayment({
      resourceUrl: resourceUrl || req.url || "https://api.agenthub.protocol/premium",
      method: "POST",
      paymentData: paymentData || undefined,
      payTo: process.env.THIRDWEB_SERVER_WALLET_ADDRESS,
      network: avalancheFuji,
      price: `$${paymentAmount}`,
      facilitator: getThirdwebX402Facilitator(),
    });

    if (result.status === 200) {
      // Payment successful
      const txHash = result.paymentReceipt?.transaction || "unknown";
      
      return NextResponse.json({
        success: true,
        txHash: txHash,
        amount: paymentAmount,
        token: token || "USDC",
        chain: "avalanche-fuji",
        recipient: process.env.THIRDWEB_SERVER_WALLET_ADDRESS,
        facilitator: process.env.THIRDWEB_SERVER_WALLET_ADDRESS,
      }, {
        headers: result.responseHeaders,
      });
    } else {
      // Payment required or failed
      return NextResponse.json(
        result.responseBody || {
          error: "Payment required",
          message: `This endpoint requires payment of ${paymentAmount} ${token || "USDC"}`,
        },
        {
          status: result.status,
          headers: result.responseHeaders,
        }
      );
    }
  } catch (error) {
    console.error("x402 payment error:", error);
    return NextResponse.json(
      {
        error: "Payment failed",
        message: error instanceof Error ? error.message : "Unknown error",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

