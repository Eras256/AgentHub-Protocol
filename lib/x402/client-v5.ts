// x402 Client-Side Integration (Thirdweb v5)
// Official useFetchWithPayment hook wrapper
// Reference: https://portal.thirdweb.com/x402/client

"use client";

import { createThirdwebClient } from "thirdweb";

/**
 * Create Thirdweb client for client-side x402 payments
 * This client is used by useFetchWithPayment hook
 */
export const x402Client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
});

/**
 * Example usage of useFetchWithPayment:
 * 
 * ```tsx
 * import { useFetchWithPayment } from "thirdweb/react";
 * import { x402Client } from "@/lib/x402/client-v5";
 * 
 * function MyComponent() {
 *   const { fetchWithPayment, isPending } = useFetchWithPayment(x402Client);
 * 
 *   const handleApiCall = async () => {
 *     const data = await fetchWithPayment("/api/protected/premium-data");
 *     console.log(data);
 *   };
 * 
 *   return (
 *     <button onClick={handleApiCall} disabled={isPending}>
 *       {isPending ? "Loading..." : "Make Paid API Call"}
 *     </button>
 *   );
 * }
 * ```
 */

