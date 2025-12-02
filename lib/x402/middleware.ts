// x402 payment middleware
// Based on x402-starter-kit: https://github.com/federiconardelli7/x402-starter-kit
// Implements HTTP 402 payment verification with Thirdweb facilitator

import { NextRequest, NextResponse } from "next/server";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { AvalancheFuji } from "@thirdweb-dev/chains";

export interface X402PaymentResult {
  paid: boolean;
  transactionHash?: string;
  amount?: string;
  token?: string;
  verified?: boolean;
}

/**
 * Verify x402 payment via Thirdweb facilitator
 * Checks on-chain transaction status
 */
export async function verifyX402Payment(
  req: NextRequest
): Promise<X402PaymentResult> {
  // Check for payment headers (client-side verification)
  const paymentHeader = req.headers.get("x-payment-verified");
  const txHash = req.headers.get("x-payment-tx");
  const amount = req.headers.get("x-payment-amount");
  const token = req.headers.get("x-payment-token");

  if (paymentHeader === "true" && txHash) {
    // Verify transaction on-chain
    try {
      const verified = await verifyTransactionOnChain(txHash);

      if (verified) {
        return {
          paid: true,
          transactionHash: txHash,
          amount: amount || undefined,
          token: token || "USDC",
          verified: true,
        };
      }
    } catch (error) {
      console.error("On-chain verification error:", error);
    }
  }

  return { paid: false };
}

/**
 * Verify transaction on-chain using Thirdweb SDK
 */
async function verifyTransactionOnChain(
  txHash: string
): Promise<boolean> {
  try {
    if (!process.env.THIRDWEB_SECRET_KEY) {
      console.warn("THIRDWEB_SECRET_KEY not configured, skipping on-chain verification");
      return true; // Allow in development
    }

    const sdk = ThirdwebSDK.fromPrivateKey(
      process.env.THIRDWEB_SECRET_KEY,
      AvalancheFuji,
      {
        secretKey: process.env.THIRDWEB_SECRET_KEY,
      }
    );

    const tx = await sdk.getProvider().getTransactionReceipt(txHash);

    if (!tx) {
      return false;
    }

    // Check if transaction is confirmed
    const isConfirmed = tx.status === 1; // 1 = success, 0 = failed

    // Check if transaction is to the merchant address
    if (process.env.MERCHANT_WALLET_ADDRESS) {
      const isToMerchant = tx.to?.toLowerCase() === process.env.MERCHANT_WALLET_ADDRESS.toLowerCase();
      return isConfirmed && isToMerchant;
    }

    return isConfirmed;
  } catch (error) {
    console.error("Transaction verification error:", error);
    return false;
  }
}

/**
 * Create x402 middleware for API routes
 * Returns 402 Payment Required if payment not verified
 */
export function createX402Middleware(options: {
  price: string;
  token: string;
  chain: string;
  tier?: "basic" | "premium";
}) {
  return async (req: NextRequest) => {
    const result = await verifyX402Payment(req);

    if (!result.paid) {
      return NextResponse.json(
        {
          error: "Payment required",
          message: `This endpoint requires payment of ${options.price} ${options.token}`,
          payment: {
            amount: options.price,
            token: options.token,
            chain: options.chain,
            tier: options.tier || "basic",
          },
        },
        {
          status: 402,
          headers: {
            "X-Accept-Payment": options.token,
            "X-Payment-Amount": options.price,
            "X-Payment-Chain": options.chain,
            "X-Payment-Tier": options.tier || "basic",
          },
        }
      );
    }

    return null; // Payment verified, continue
  };
}

/**
 * Payment tier configuration (from x402-starter-kit)
 */
export const PAYMENT_TIERS = {
  basic: {
    amount: "0.01",
    token: "USDC",
    chain: "avalanche-fuji",
  },
  premium: {
    amount: "0.15",
    token: "USDC",
    chain: "avalanche-fuji",
  },
} as const;
