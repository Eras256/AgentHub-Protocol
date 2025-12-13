// x402 payment middleware
// Based on x402-starter-kit: https://github.com/federiconardelli7/x402-starter-kit
// Implements HTTP 402 payment verification with Thirdweb facilitator (v5)

import { NextRequest, NextResponse } from "next/server";
import { getRpcClient } from "thirdweb";
import { avalancheFuji } from "thirdweb/chains";
import { getThirdwebClient, getFacilitatorUrl, getMerchantAddress } from "./facilitator";

export interface X402PaymentResult {
  paid: boolean;
  required?: boolean; // Whether payment is required for this endpoint
  transactionHash?: string;
  amount?: string;
  token?: string;
  verified?: boolean;
  paymentUrl?: string; // URL for payment if required
  txHash?: string; // Alias for transactionHash
}

/**
 * Verify x402 payment via Thirdweb facilitator
 * Checks on-chain transaction status using Thirdweb v5
 */
export async function verifyX402Payment(
  req: NextRequest
): Promise<X402PaymentResult> {
  // Check for payment headers
  const paymentAuth = req.headers.get("X-Payment-Authorization");
  const txHash = req.headers.get("x-payment-tx") || req.headers.get("X-Payment-Tx");
  const amount = req.headers.get("x-payment-amount") || req.headers.get("X-Payment-Amount");
  const token = req.headers.get("x-payment-token") || req.headers.get("X-Payment-Token");

  // If payment authorization header exists, verify it
  if (paymentAuth && txHash) {
    try {
      const verified = await verifyTransactionOnChain(txHash, amount, token);

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

  // Fallback: check for simple payment header (for backward compatibility)
  const paymentHeader = req.headers.get("x-payment-verified");
  if (paymentHeader === "true" && txHash) {
    try {
      const verified = await verifyTransactionOnChain(txHash, amount, token);
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
 * Verify transaction on-chain using Thirdweb v5 RPC client
 */
async function verifyTransactionOnChain(
  txHash: string,
  expectedAmount?: string | null,
  expectedToken?: string | null
): Promise<boolean> {
  try {
    if (!process.env.THIRDWEB_SECRET_KEY) {
      console.warn("THIRDWEB_SECRET_KEY not configured, skipping on-chain verification");
      // In development, allow if we have a txHash
      return !!txHash;
    }

    const rpcClient = getRpcClient({
      client: getThirdwebClient(),
      chain: avalancheFuji,
    });

    // Get transaction receipt
    // Ensure txHash has 0x prefix for type safety
    const txHashWithPrefix = txHash.startsWith('0x') ? txHash : `0x${txHash}`;
    const receipt = await rpcClient({
      method: "eth_getTransactionReceipt",
      params: [txHashWithPrefix as `0x${string}`],
    });

    if (!receipt || !receipt.status) {
      return false;
    }

    // Check transaction status (0x1 = success, 0x0 = failed)
    const isConfirmed = receipt.status === "0x1";

    // Optionally verify recipient address matches merchant
    if (process.env.MERCHANT_WALLET_ADDRESS && receipt.to) {
      const isToMerchant = receipt.to.toLowerCase() === getMerchantAddress().toLowerCase();
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
 * Includes facilitator URL and recipient address in headers
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
      const facilitatorUrl = getFacilitatorUrl();
      const merchantAddress = getMerchantAddress();

      return NextResponse.json(
        {
          error: "Payment required",
          message: `This endpoint requires payment of ${options.price} ${options.token}`,
          payment: {
            amount: options.price,
            token: options.token,
            chain: options.chain,
            tier: options.tier || "basic",
            facilitatorUrl,
            recipient: merchantAddress,
          },
        },
        {
          status: 402,
          headers: {
            "X-Accept-Payment": options.token,
            "X-Payment-Amount": options.price,
            "X-Payment-Chain": options.chain,
            "X-Payment-Tier": options.tier || "basic",
            "X-Facilitator-URL": facilitatorUrl,
            "X-Payment-Recipient": merchantAddress,
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
