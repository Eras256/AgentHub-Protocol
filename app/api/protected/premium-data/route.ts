import { NextRequest, NextResponse } from "next/server";
import { verifyX402Payment, PAYMENT_TIERS } from "@/lib/x402/middleware";

export async function GET(req: NextRequest) {
  // Verify x402 payment using middleware
  const paymentResult = await verifyX402Payment(req);

  if (!paymentResult.paid) {
    // Return 402 Payment Required with payment details
    return NextResponse.json(
      {
        error: "Payment required",
        message: "This endpoint requires premium payment",
        payment: {
          tier: "premium",
          ...PAYMENT_TIERS.premium,
        },
      },
      {
        status: 402,
        headers: {
          "X-Accept-Payment": PAYMENT_TIERS.premium.token,
          "X-Payment-Amount": PAYMENT_TIERS.premium.amount,
          "X-Payment-Chain": PAYMENT_TIERS.premium.chain,
          "X-Payment-Tier": "premium",
        },
      }
    );
  }

  // Payment verified - return premium data
  const premiumData = {
    timestamp: Date.now(),
    data: {
      avaxPrice: 38.45,
      btcPrice: 67890.12,
      ethPrice: 3456.78,
      volume24h: 1234567890,
      marketCap: 98765432100,
      prediction: {
        next1h: "+2.3%",
        next24h: "+5.7%",
        confidence: 0.87,
      },
    },
    source: "AgentHub Premium Oracle",
    paymentId: paymentResult.transactionHash,
  };

  return NextResponse.json(premiumData);
}

