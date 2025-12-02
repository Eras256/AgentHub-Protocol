// x402 payment verification API route
// Verifies payment transaction on-chain

import { NextRequest, NextResponse } from "next/server";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { AvalancheFuji } from "@thirdweb-dev/chains";

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

    // Initialize Thirdweb SDK
    const sdk = ThirdwebSDK.fromPrivateKey(
      process.env.THIRDWEB_SECRET_KEY,
      AvalancheFuji,
      {
        secretKey: process.env.THIRDWEB_SECRET_KEY,
      }
    );

    // Get transaction receipt
    const receipt = await sdk.getProvider().getTransactionReceipt(txHash);

    if (!receipt) {
      return NextResponse.json({
        verified: false,
        confirmed: false,
        message: "Transaction not found",
      });
    }

    // Check transaction status
    const isConfirmed = receipt.status === 1; // 1 = success, 0 = failed

    // Verify transaction is to merchant address
    let isToMerchant = true;
    if (process.env.MERCHANT_WALLET_ADDRESS) {
      isToMerchant =
        receipt.to?.toLowerCase() ===
        process.env.MERCHANT_WALLET_ADDRESS.toLowerCase();
    }

    return NextResponse.json({
      verified: isConfirmed && isToMerchant,
      confirmed: isConfirmed,
      blockNumber: receipt.blockNumber,
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

