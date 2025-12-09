"use client";

/**
 * Example component using x402 payment hook
 * Automatically handles 402 Payment Required responses
 * Reference: https://portal.thirdweb.com/x402/client
 */

import { useX402Fetch } from "@/lib/x402/hooks";
import { useState } from "react";
import { Loader2, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import Button from "@/components/ui/Button";

export function PremiumDataButton() {
  const { fetchWithPayment, isPending, isReady } = useX402Fetch();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFetchPremiumData = async () => {
    try {
      setError(null);
      setSuccess(false);
      setData(null);
      
      // Automatically handles:
      // - 402 Payment Required detection
      // - Wallet connection (if not connected)
      // - Payment authorization and signing
      // - Retry with payment headers
      // - Response parsing (JSON)
      const result = await fetchWithPayment("/api/protected/premium-data");
      setData(result);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch premium data");
      setSuccess(false);
      console.error("Premium data fetch error:", err);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleFetchPremiumData}
        disabled={isPending || !isReady}
        className="w-full"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : !isReady ? (
          <>
            <XCircle className="mr-2 h-4 w-4" />
            Connect Wallet First
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Get Premium AI Analysis ($0.15)
          </>
        )}
      </Button>

      {!isReady && (
        <p className="text-sm text-yellow-400 text-center">
          Please connect your wallet to make paid API calls
        </p>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && data && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <p className="font-semibold text-green-400">Premium Data Received</p>
          </div>
          {data.paymentProof && (
            <div className="mb-3 text-xs text-green-300">
              <p>Payment TX: {data.paymentProof.txHash?.substring(0, 20)}...</p>
              <p>Payer: {data.paymentProof.payer?.substring(0, 20)}...</p>
            </div>
          )}
          {data.data?.analysis && (
            <div className="text-sm text-white">
              <p className="font-semibold mb-2">AI Analysis:</p>
              <p className="whitespace-pre-wrap">{data.data.analysis}</p>
            </div>
          )}
          <details className="mt-3">
            <summary className="text-xs text-gray-400 cursor-pointer">View Full Response</summary>
            <pre className="text-xs overflow-auto max-h-60 mt-2">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

