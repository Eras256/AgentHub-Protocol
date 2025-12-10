"use client";

import { ReactNode } from "react";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import { AvalancheFuji } from "@thirdweb-dev/chains";

// Custom Avalanche Fuji chain configuration with public RPC
// This overrides ThirdWeb's RPC to use the public Avalanche RPC
// This avoids 401 authentication errors in production
const publicRpcUrl = process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC || "https://api.avax-test.network/ext/bc/C/rpc";
const customAvalancheFuji = {
  ...AvalancheFuji,
  rpc: [publicRpcUrl] as readonly string[],
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
      activeChain={customAvalancheFuji}
      clientId={clientId}
      supportedChains={[customAvalancheFuji]}
    >
      {children}
    </ThirdwebProvider>
  );
}

