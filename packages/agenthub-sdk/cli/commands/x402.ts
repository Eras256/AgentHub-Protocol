/**
 * x402 Payment Commands
 */

import { initiateX402Payment } from "../index-export";

export async function x402PayCommand(options: {
  amount: string;
  token?: string;
  tier?: string;
  apiUrl?: string;
}) {
  try {
    console.log("💳 Processing x402 payment...");
    console.log(`   Amount: ${options.amount} ${options.token || "USDC"}`);
    console.log(`   Tier: ${options.tier || "basic"}`);

    const result = await initiateX402Payment({
      amount: options.amount,
      token: (options.token as "USDC" | "AVAX") || "USDC",
      chain: "avalanche-fuji",
      tier: (options.tier as "basic" | "premium") || "basic",
      apiUrl: options.apiUrl,
    });

    if (result.success) {
      console.log("✅ Payment successful!");
      console.log(`   Transaction: ${result.txHash}`);
    } else {
      console.error("❌ Payment failed:", result.error);
      process.exit(1);
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

