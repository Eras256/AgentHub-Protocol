"use client";

import { ReactNode, useState } from "react";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import { AvalancheFuji } from "@thirdweb-dev/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function ClientProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Get clientId directly - it should be available at build time for NEXT_PUBLIC_ vars
  // In Next.js, NEXT_PUBLIC_ variables are embedded at build time
  const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

  // Development validation - show clear error if variable is missing
  if (!clientId && typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.error(
      '❌ NEXT_PUBLIC_THIRDWEB_CLIENT_ID is not configured.\n' +
      'Please add NEXT_PUBLIC_THIRDWEB_CLIENT_ID to your .env.local file\n' +
      'Get your Client ID from: https://thirdweb.com/dashboard\n\n' +
      'The app will not work correctly without this configuration.'
    );
  }

  // According to Thirdweb v4 documentation, clientId is required
  // If not provided, we still render the provider but it will show connection errors
  // This is better than crashing the entire app
  return (
    <ThirdwebProvider
      activeChain={AvalancheFuji}
      clientId={clientId || ""}
      supportedChains={[AvalancheFuji]}
    >
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ThirdwebProvider>
  );
}

