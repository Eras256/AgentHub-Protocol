/**
 * x402 Payment Functions
 * HTTP 402 payment protocol integration
 */

export interface X402PaymentOptions {
  amount: string;
  token: "USDC" | "AVAX";
  chain: string;
  recipient?: string;
  tier?: "basic" | "premium";
  apiUrl?: string;
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

const PAYMENT_TIERS = {
  basic: "0.01", // $0.01 USDC
  premium: "0.15", // $0.15 USDC
};

/**
 * Initiate x402 payment
 * Note: This requires a server-side API endpoint to handle the payment
 */
export async function initiateX402Payment(
  options: X402PaymentOptions
): Promise<X402PaymentResponse> {
  try {
    const amount = options.tier
      ? PAYMENT_TIERS[options.tier]
      : options.amount;

    const apiUrl = options.apiUrl || "/api/x402/pay";

    const response = await fetch(apiUrl, {
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

    const data = (await response.json()) as {
      error?: string;
      txHash?: string;
    };

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
        "x-payment-tx": data.txHash || "",
        "x-payment-amount": amount,
        "x-payment-token": options.token || "USDC",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payment failed",
    };
  }
}

