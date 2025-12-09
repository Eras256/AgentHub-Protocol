"use client";

import { ReactNode } from "react";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import { AvalancheFuji } from "@thirdweb-dev/chains";

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
      activeChain={AvalancheFuji}
      clientId={clientId}
      supportedChains={[AvalancheFuji]}
    >
      {children}
    </ThirdwebProvider>
  );
}

