// x402 React hooks
// Client-side hooks for x402 payments

"use client";

import { useActiveAccount, useActiveWallet } from "@thirdweb-dev/react";
import { initiateX402Payment, X402PaymentOptions, X402PaymentResponse } from "./client";

/**
 * Hook for making x402 payments from React components
 */
export function useX402Payment() {
  const account = useActiveAccount();
  const wallet = useActiveWallet();

  const pay = async (options: X402PaymentOptions): Promise<X402PaymentResponse> => {
    if (!account || !wallet) {
      return {
        success: false,
        error: "Wallet not connected",
      };
    }

    return await initiateX402Payment(options);
  };

  return { pay, isReady: !!account && !!wallet };
}

