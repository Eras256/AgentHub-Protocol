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
 * Lazy initialization to avoid build-time errors if env vars are missing
 */
let _thirdwebClient: ReturnType<typeof createThirdwebClient> | null = null;

export function getThirdwebClient() {
  if (!_thirdwebClient) {
    const secretKey = process.env.THIRDWEB_SECRET_KEY;
    if (!secretKey) {
      throw new Error("THIRDWEB_SECRET_KEY is required for x402 facilitator");
    }
    _thirdwebClient = createThirdwebClient({
      secretKey,
    });
  }
  return _thirdwebClient;
}

/**
 * Create x402 facilitator instance
 * Uses ERC4337 Smart Account as facilitator wallet
 * Reference: https://portal.thirdweb.com/x402/facilitator
 * Lazy initialization to avoid build-time errors if env vars are missing
 */
let _thirdwebX402Facilitator: ReturnType<typeof facilitator> | null = null;

export function getThirdwebX402Facilitator() {
  if (!_thirdwebX402Facilitator) {
    const serverWalletAddress = process.env.THIRDWEB_SERVER_WALLET_ADDRESS;
    if (!serverWalletAddress) {
      throw new Error("THIRDWEB_SERVER_WALLET_ADDRESS is required for the x402 facilitator");
    }
    _thirdwebX402Facilitator = facilitator({
      client: getThirdwebClient(),
      serverWalletAddress,
    });
  }
  return _thirdwebX402Facilitator;
}

// Export for backward compatibility - wrapped in try-catch to prevent build-time errors
// These will only throw errors when actually used at runtime, not during build
let thirdwebClient: ReturnType<typeof createThirdwebClient>;
let thirdwebX402Facilitator: ReturnType<typeof facilitator>;

try {
  thirdwebClient = getThirdwebClient();
  thirdwebX402Facilitator = getThirdwebX402Facilitator();
} catch (error) {
  // During build, if env vars are missing, create dummy objects that will throw at runtime
  // This allows the build to complete successfully
  console.warn("x402 facilitator not initialized (env vars missing):", error);
  thirdwebClient = null as any;
  thirdwebX402Facilitator = null as any;
}

export { thirdwebClient, thirdwebX402Facilitator };

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

