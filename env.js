/**
 * Environment Variables Validation
 * 
 * This file validates all required environment variables at build-time.
 * If any required variable is missing or invalid, the build will fail.
 * 
 * This prevents deploying broken code to production.
 */

const { z } = require("zod");

// Helper to validate Ethereum addresses
const ethereumAddressSchema = z
  .string()
  .min(1, "Address cannot be empty")
  .startsWith("0x", "Address must start with 0x")
  .length(42, "Address must be exactly 42 characters (0x + 40 hex chars)")
  .regex(/^0x[0-9a-fA-F]{40}$/, "Address must be a valid hexadecimal string");

// Helper for optional addresses - only validates if present
// Empty strings are already converted to undefined by preprocessing
const optionalEthereumAddressSchema = ethereumAddressSchema.optional();

// Schema for required environment variables
const envSchema = z.object({
  // Required - Thirdweb Configuration
  NEXT_PUBLIC_THIRDWEB_CLIENT_ID: z.string().min(1, "Thirdweb Client ID is required"),
  
  // Required - Contract Addresses (after deployment)
  // These are critical for the app to function
  // Always validate format, but allow optional in development
  NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS: optionalEthereumAddressSchema,
  NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS: optionalEthereumAddressSchema,
  NEXT_PUBLIC_REVENUE_DISTRIBUTOR_ADDRESS: optionalEthereumAddressSchema,
  
  // Required - Avalanche RPC
  NEXT_PUBLIC_AVALANCHE_FUJI_RPC: z
    .string()
    .url("AVALANCHE_FUJI_RPC must be a valid URL")
    .optional()
    .default("https://api.avax-test.network/ext/bc/C/rpc"),
  
  // Optional - x402 Payment Protocol
  THIRDWEB_SERVER_WALLET_ADDRESS: optionalEthereumAddressSchema,
  MERCHANT_WALLET_ADDRESS: optionalEthereumAddressSchema,
  NEXT_PUBLIC_MERCHANT_ADDRESS: optionalEthereumAddressSchema,
  
  // Optional - Google Gemini AI
  GOOGLE_GEMINI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  
  // Optional - Application URL
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default("http://localhost:3000"),
  
  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).optional().default("development"),
});

// Preprocess environment variables: treat empty strings as undefined
// This handles cases where Vercel has env vars set but they're empty or invalid
const preprocessedEnv = Object.fromEntries(
  Object.entries(process.env).map(([key, value]) => {
    // Handle all address variables - if empty or invalid format, set to undefined
    const addressKeys = [
      'NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS',
      'NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS',
      'NEXT_PUBLIC_REVENUE_DISTRIBUTOR_ADDRESS',
      'THIRDWEB_SERVER_WALLET_ADDRESS',
      'MERCHANT_WALLET_ADDRESS',
      'NEXT_PUBLIC_MERCHANT_ADDRESS',
    ];
    
    if (addressKeys.includes(key)) {
      // If value is empty, null, or doesn't look like a valid address, set to undefined
      if (!value || typeof value !== 'string' || value.trim() === '' || !value.trim().startsWith('0x') || value.trim().length !== 42) {
        return [key, undefined];
      }
      return [key, value.trim()];
    }
    
    // For other optional keys, just handle empty strings
    const optionalKeys = [
      'GOOGLE_GEMINI_API_KEY',
      'GEMINI_API_KEY',
    ];
    
    if (optionalKeys.includes(key)) {
      if (!value || typeof value !== 'string' || value.trim() === '') {
        return [key, undefined];
      }
    }
    
    return [key, value];
  })
);

// Parse and validate environment variables
const env = envSchema.safeParse(preprocessedEnv);

if (!env.success) {
  console.error("❌ Variables de entorno inválidas:");
  console.error(JSON.stringify(env.error.format(), null, 2));
  console.error("\n📝 Por favor, revisa tu archivo .env.local o las variables de entorno en Vercel.");
  
  // Determine if we're in production for better error messages
  const isProduction = process.env.NODE_ENV === "production";
  
  console.error("\n💡 Variables requeridas:");
  console.error("   - NEXT_PUBLIC_THIRDWEB_CLIENT_ID");
  if (isProduction) {
    console.error("   - NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS (requerida en producción)");
  } else {
    console.error("   - NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS (opcional en desarrollo, pero recomendada)");
  }
  console.error("\n💡 Variables opcionales pero recomendadas:");
  console.error("   - NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS");
  console.error("   - NEXT_PUBLIC_REVENUE_DISTRIBUTOR_ADDRESS");
  console.error("   - NEXT_PUBLIC_AVALANCHE_FUJI_RPC");
  process.exit(1);
}

// Additional validation: In production, NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS is required
const isProduction = process.env.NODE_ENV === "production";
if (isProduction && !env.data.NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS) {
  console.error("❌ Error: NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS es requerida en producción");
  console.error("   Por favor, configura esta variable en Vercel antes de desplegar.");
  process.exit(1);
}

// Log success in development
if (process.env.NODE_ENV === "development") {
  console.log("✅ Variables de entorno validadas correctamente");
}

// Export validated environment variables (for use in next.config.js if needed)
module.exports = env.data;

