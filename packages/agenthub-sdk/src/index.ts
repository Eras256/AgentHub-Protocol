/**
 * AgentHub Protocol SDK
 * 
 * Official TypeScript SDK for building autonomous AI agents on Avalanche
 * 
 * @packageDocumentation
 */

export { AgentHubSDK } from "./client";
export type { SDKConfig } from "./client";

// Re-export contract functions
export * from "./contracts/agentRegistry";
export * from "./contracts/marketplace";
export * from "./contracts/revenueDistributor";

// Re-export x402 functions
export * from "./x402/payments";

// Re-export AI functions (stub - requires full implementation)
export * from "./ai/gemini";

// Re-export utilities
export * from "./utils/formatters";
export * from "./utils/validation";

