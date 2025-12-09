// x402 React hooks
// Official Thirdweb x402 client-side integration
// Reference: https://portal.thirdweb.com/x402/client

"use client";

import { useState } from "react";
import { useAddress, useWallet } from "@thirdweb-dev/react";
import { initiateX402Payment, X402PaymentOptions, X402PaymentResponse } from "./client";

/**
 * Official useFetchWithPayment hook wrapper
 * Automatically handles 402 Payment Required responses
 * 
 * According to Thirdweb docs: https://portal.thirdweb.com/x402/client
 * The hook is available in thirdweb/react v5
 * 
 * For now, we provide a compatible implementation that:
 * - Detects 402 responses
 * - Handles wallet connection
 * - Processes payments automatically
 * - Retries with payment headers
 * 
 * @example
 * ```tsx
 * const { fetchWithPayment, isPending } = useX402Fetch();
 * 
 * const handleApiCall = async () => {
 *   const data = await fetchWithPayment("/api/protected/premium-data");
 *   console.log(data);
 * };
 * ```
 */
export function useX402Fetch() {
  const address = useAddress();
  const wallet = useWallet();
  const [isPending, setIsPending] = useState(false);

  const fetchWithPayment = async (url: string, options?: RequestInit) => {
    setIsPending(true);
    try {
      // First attempt - may return 402 Payment Required
      let response = await fetch(url, options);
      
      // Handle 402 Payment Required response
      if (response.status === 402) {
        if (!address || !wallet) {
          throw new Error("Wallet not connected. Please connect your wallet first.");
        }

        // Parse payment requirements from response headers
        const paymentAmount = response.headers.get("X-Payment-Amount") || 
                             response.headers.get("x-payment-amount") || 
                             "0.01";
        const paymentToken = response.headers.get("X-Accept-Payment") || 
                            response.headers.get("x-accept-payment") || 
                            "USDC";
        const recipient = response.headers.get("X-Payment-Recipient") || 
                         response.headers.get("x-payment-recipient") || 
                         process.env.NEXT_PUBLIC_MERCHANT_ADDRESS || "";

        // Determine tier based on amount
        const tier = parseFloat(paymentAmount) >= 0.1 ? "premium" : "basic";

        // Initiate payment via our API
        const paymentResult = await initiateX402Payment({
          amount: paymentAmount,
          token: paymentToken,
          chain: "avalanche-fuji",
          recipient: recipient,
          tier: tier,
        });

        if (!paymentResult.success || !paymentResult.txHash) {
          throw new Error(paymentResult.error || "Payment failed");
        }

        // Retry request with payment authorization header
        // The x-payment header format depends on the server implementation
        response = await fetch(url, {
          ...options,
          headers: {
            ...options?.headers,
            "x-payment": paymentResult.txHash, // Simplified - server will verify on-chain
            "x-payment-tx": paymentResult.txHash,
            "x-payment-verified": "true",
            "x-payment-amount": paymentAmount,
            "x-payment-token": paymentToken,
          },
        });

        // If still 402, payment verification failed
        if (response.status === 402) {
          throw new Error("Payment verification failed. Please try again.");
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse response (default: JSON)
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        return await response.json();
      }
      return await response.text();
    } catch (error) {
      console.error("x402 fetch error:", error);
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return { 
    fetchWithPayment, 
    isPending,
    isReady: !!address && !!wallet,
  };
}

/**
 * Legacy hook for backward compatibility
 * Use useX402Fetch() for new code (official API)
 */
export function useX402Payment() {
  const address = useAddress();
  const wallet = useWallet();

  const pay = async (options: X402PaymentOptions): Promise<X402PaymentResponse> => {
    if (!address || !wallet) {
      return {
        success: false,
        error: "Wallet not connected",
      };
    }

    return await initiateX402Payment(options);
  };

  return { pay, isReady: !!address && !!wallet };
}

