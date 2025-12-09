"use client";

import { ReactNode } from "react";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import { AvalancheFuji } from "@thirdweb-dev/chains";

// Custom Avalanche Fuji chain configuration with public RPC
// This avoids ThirdWeb RPC authentication issues (401 errors)
const publicRpcUrl = process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC || "https://api.avax-test.network/ext/bc/C/rpc";
const AvalancheFujiCustom = {
  ...AvalancheFuji,
  rpc: [publicRpcUrl], // RPC must be an array of strings
};

export function ThirdwebProviders({ children }: { children: ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

  // Development validation - show clear error if variable is missing
  if (!clientId && process.env.NODE_ENV === 'development') {
    console.warn(
      '⚠️ NEXT_PUBLIC_THIRDWEB_CLIENT_ID is not configured.\n' +
      'Please add NEXT_PUBLIC_THIRDWEB_CLIENT_ID to your .env.local file\n' +
      'Get your Client ID from: https://thirdweb.com/dashboard'
    );
  }

  return (
    <ThirdwebProvider
      activeChain={AvalancheFujiCustom}
      clientId={clientId}
      supportedChains={[AvalancheFujiCustom]}
    >
      {children}
    </ThirdwebProvider>
  );
}

