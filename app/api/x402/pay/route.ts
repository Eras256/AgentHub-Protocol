// x402 payment API route
// Based on x402-starter-kit: https://github.com/federiconardelli7/x402-starter-kit
// Initiates payment via Thirdweb facilitator (ERC4337 Smart Account)

import { NextRequest, NextResponse } from "next/server";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { AvalancheFuji } from "@thirdweb-dev/chains";
import { PAYMENT_TIERS } from "@/lib/x402/middleware";

export async function POST(req: NextRequest) {
  try {
    const { amount, token, chain, recipient, tier } = await req.json();

    // Validate required environment variables
    if (!process.env.THIRDWEB_SECRET_KEY) {
      return NextResponse.json(
        { error: "THIRDWEB_SECRET_KEY not configured" },
        { status: 500 }
      );
    }

    if (!process.env.THIRDWEB_SERVER_WALLET_ADDRESS) {
      return NextResponse.json(
        { error: "THIRDWEB_SERVER_WALLET_ADDRESS (facilitator) not configured" },
        { status: 500 }
      );
    }

    if (!process.env.MERCHANT_WALLET_ADDRESS) {
      return NextResponse.json(
        { error: "MERCHANT_WALLET_ADDRESS not configured" },
        { status: 500 }
      );
    }

    // Determine payment amount based on tier
    const paymentAmount = tier && PAYMENT_TIERS[tier]
      ? PAYMENT_TIERS[tier].amount
      : amount || PAYMENT_TIERS.basic.amount;

    const merchantAddress = process.env.MERCHANT_WALLET_ADDRESS;
    const facilitatorAddress = process.env.THIRDWEB_SERVER_WALLET_ADDRESS;

    // Initialize Thirdweb SDK
    const sdk = ThirdwebSDK.fromPrivateKey(
      process.env.THIRDWEB_SECRET_KEY,
      AvalancheFuji,
      {
        secretKey: process.env.THIRDWEB_SECRET_KEY,
      }
    );

    // Get USDC contract (Avalanche Fuji testnet USDC)
    // Note: Replace with actual USDC contract address on Fuji
    const usdcAddress = process.env.USDC_CONTRACT_ADDRESS || "0x5425890298aed601595a70AB815c96711a31Bc65"; // Fuji USDC testnet
    
    const usdcContract = await sdk.getContract(usdcAddress);

    // Convert amount to wei (USDC has 6 decimals)
    const amountInWei = BigInt(Math.floor(parseFloat(paymentAmount) * 1e6));

    // Transfer USDC from facilitator to merchant
    // Using ERC4337 Smart Account as facilitator
    const tx = await usdcContract.erc20.transfer(
      merchantAddress,
      amountInWei.toString()
    );

    // Wait for transaction confirmation
    const receipt = await tx.receipt();

    return NextResponse.json({
      success: true,
      txHash: receipt.transactionHash,
      amount: paymentAmount,
      token: token || "USDC",
      chain: chain || "avalanche-fuji",
      recipient: merchantAddress,
      facilitator: facilitatorAddress,
    });
  } catch (error) {
    console.error("x402 payment error:", error);
    return NextResponse.json(
      {
        error: "Payment failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

