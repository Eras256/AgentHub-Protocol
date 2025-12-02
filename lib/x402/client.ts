// x402 client-side payment utilities
// Based on x402-starter-kit: https://github.com/federiconardelli7/x402-starter-kit
// Implements HTTP 402 payment protocol with Thirdweb on Avalanche Fuji

export interface X402PaymentOptions {
  amount: string;
  token: string;
  chain: string;
  recipient: string;
  tier?: "basic" | "premium";
}

export interface X402PaymentResponse {
  success: boolean;
  txHash?: string;
  error?: string;
  paymentHeaders?: {
    "x-payment-verified": string;
    "x-payment-tx": string;
    "x-payment-amount": string;
    "x-payment-token": string;
  };
}

/**
 * Initiate x402 payment using Thirdweb facilitator
 * Based on x402-starter-kit implementation
 */
export async function initiateX402Payment(
  options: X402PaymentOptions
): Promise<X402PaymentResponse> {
  try {
    // Payment tiers (from x402-starter-kit)
    const paymentTiers = {
      basic: "0.01", // $0.01 USDC
      premium: "0.15", // $0.15 USDC
    };

    const amount = options.tier
      ? paymentTiers[options.tier]
      : options.amount;

    // Call API route to initiate payment
    const response = await fetch("/api/x402/pay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        token: options.token || "USDC",
        chain: options.chain || "avalanche-fuji",
        recipient: options.recipient,
        tier: options.tier || "basic",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Payment failed",
      };
    }

    return {
      success: true,
      txHash: data.txHash,
      paymentHeaders: {
        "x-payment-verified": "true",
        "x-payment-tx": data.txHash,
        "x-payment-amount": amount,
        "x-payment-token": options.token || "USDC",
      },
    };
  } catch (error) {
    console.error("x402 payment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payment failed",
    };
  }
}

/**
 * Verify payment status on-chain
 */
export async function verifyPaymentStatus(
  txHash: string,
  chain: string = "avalanche-fuji"
): Promise<{ verified: boolean; confirmed: boolean; blockNumber?: number }> {
  try {
    const response = await fetch("/api/x402/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        txHash,
        chain,
      }),
    });

    const data = await response.json();

    return {
      verified: data.verified || false,
      confirmed: data.confirmed || false,
      blockNumber: data.blockNumber,
    };
  } catch (error) {
    console.error("Payment verification error:", error);
    return { verified: false, confirmed: false };
  }
}

// React hooks are exported from ./hooks.ts
// Import useX402Payment from "@/lib/x402/hooks" in client components
