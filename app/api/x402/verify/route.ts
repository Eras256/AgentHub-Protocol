// x402 payment verification API route
// Verifies payment transaction on-chain using Thirdweb v5

import { NextRequest, NextResponse } from "next/server";
import { getRpcClient } from "thirdweb";
import { avalancheFuji } from "thirdweb/chains";
import { thirdwebClient, getMerchantAddress } from "@/lib/x402/facilitator";

export async function POST(req: NextRequest) {
  try {
    const { txHash, chain } = await req.json();

    if (!txHash) {
      return NextResponse.json(
        { error: "Transaction hash required" },
        { status: 400 }
      );
    }

    if (!process.env.THIRDWEB_SECRET_KEY) {
      return NextResponse.json(
        { error: "THIRDWEB_SECRET_KEY not configured" },
        { status: 500 }
      );
    }

    // Get RPC client using Thirdweb v5
    const rpcClient = getRpcClient({
      client: thirdwebClient,
      chain: avalancheFuji,
    });

    // Get transaction receipt
    const receipt = await rpcClient({
      method: "eth_getTransactionReceipt",
      params: [txHash],
    });

    if (!receipt) {
      return NextResponse.json({
        verified: false,
        confirmed: false,
        message: "Transaction not found",
      });
    }

    // Check transaction status (0x1 = success, 0x0 = failed)
    const isConfirmed = receipt.status === "0x1";

    // Verify transaction is to merchant address
    let isToMerchant = true;
    if (process.env.MERCHANT_WALLET_ADDRESS && receipt.to) {
      isToMerchant =
        receipt.to.toLowerCase() === getMerchantAddress().toLowerCase();
    }

    return NextResponse.json({
      verified: isConfirmed && isToMerchant,
      confirmed: isConfirmed,
      blockNumber: receipt.blockNumber ? parseInt(receipt.blockNumber, 16) : undefined,
      status: receipt.status,
      to: receipt.to,
      from: receipt.from,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      {
        error: "Verification failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

