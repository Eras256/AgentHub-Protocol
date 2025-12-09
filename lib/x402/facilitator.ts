// Thirdweb x402 Facilitator Configuration
// Official x402 facilitator integration for Avalanche Fuji
// Reference: https://portal.thirdweb.com/x402/facilitator

import { createThirdwebClient } from "thirdweb";
import { facilitator } from "thirdweb/x402";
import { defineChain } from "thirdweb/chains";

/**
 * Avalanche Fuji testnet chain definition
 */
export const avalancheFuji = defineChain({
  id: 43113,
  name: "Avalanche Fuji",
  nativeCurrency: {
    name: "Avalanche",
    symbol: "AVAX",
    decimals: 18,
  },
  rpc: process.env.AVALANCHE_FUJI_RPC || "https://api.avax-test.network/ext/bc/C/rpc",
});

/**
 * Create Thirdweb client for x402 facilitator
 */
export const thirdwebClient = createThirdwebClient({
  secretKey: process.env.THIRDWEB_SECRET_KEY!,
});

/**
 * Create x402 facilitator instance
 * Uses ERC4337 Smart Account as facilitator wallet
 * Reference: https://portal.thirdweb.com/x402/facilitator
 */
export const thirdwebX402Facilitator = facilitator({
  client: thirdwebClient,
  serverWalletAddress: process.env.THIRDWEB_SERVER_WALLET_ADDRESS!,
});

/**
 * Get facilitator URL (for backward compatibility)
 * The facilitator URL is handled automatically by thirdweb/x402
 */
export function getFacilitatorUrl(): string {
  return "https://facilitator.thirdweb.com";
}

/**
 * Get merchant address (for backward compatibility)
 * Payments go to serverWalletAddress by default
 */
export function getMerchantAddress(): string {
  return process.env.THIRDWEB_SERVER_WALLET_ADDRESS || process.env.MERCHANT_WALLET_ADDRESS || "";
}

