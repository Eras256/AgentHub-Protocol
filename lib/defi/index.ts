/**
 * DeFi Protocol Integrations
 * Unified exports for Trader Joe, Benqi, and Aave
 */

// Trader Joe exports
export {
  getTraderJoeRouter,
  getSwapQuote,
  executeSwap,
  getPoolInfo,
  type SwapParams,
  type SwapResult,
} from "./traderjoe";

// Benqi exports
export {
  getBenqiComptroller,
  getQTokenContract,
  getQTokenAddress,
  supplyToBenqi,
  borrowFromBenqi,
  repayToBenqi,
  withdrawFromBenqi,
  getAccountLiquidity,
  type SupplyParams as BenqiSupplyParams,
  type BorrowParams as BenqiBorrowParams,
  type RepayParams as BenqiRepayParams,
  type WithdrawParams as BenqiWithdrawParams,
  type OperationResult as BenqiOperationResult,
} from "./benqi";

// Aave exports
export {
  getAavePool,
  getAaveProviderAddress,
  supplyToAave,
  borrowFromAave,
  repayToAave,
  withdrawFromAave,
  getUserAccountData,
  INTEREST_RATE_MODE,
  type SupplyParams as AaveSupplyParams,
  type BorrowParams as AaveBorrowParams,
  type RepayParams as AaveRepayParams,
  type WithdrawParams as AaveWithdrawParams,
  type OperationResult as AaveOperationResult,
} from "./aave";

/**
 * Protocol configuration helper
 */
export interface ProtocolConfig {
  network: "avalanche-fuji" | "avalanche-mainnet";
  traderJoe?: {
    routerAddress?: string;
  };
  benqi?: {
    comptrollerAddress?: string;
  };
  aave?: {
    poolAddressesProvider?: string;
  };
}

/**
 * Get default protocol addresses for a network
 */
export function getProtocolAddresses(network: "avalanche-fuji" | "avalanche-mainnet"): ProtocolConfig {
  return {
    network,
    traderJoe: {},
    benqi: {},
    aave: {
      poolAddressesProvider: network === "avalanche-mainnet"
        ? "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb"
        : undefined, // Testnet address needs to be configured
    },
  };
}

