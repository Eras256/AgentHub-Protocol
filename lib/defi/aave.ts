/**
 * Aave V3 Integration
 * Lending and borrowing protocol on Avalanche
 * 
 * Contract Addresses (Avalanche Fuji Testnet):
 * - Pool: Check Aave docs for testnet addresses
 * - PoolAddressesProvider: Testnet address
 * 
 * Reference: https://docs.aave.com/developers/
 */

import { ethers } from "ethers";

// Aave Pool ABI (V3 - simplified)
const AAVE_POOL_ABI = [
  "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external",
  "function withdraw(address asset, uint256 amount, address to) external returns (uint256)",
  "function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external",
  "function repay(address asset, uint256 amount, uint256 rateMode, address onBehalfOf) external returns (uint256)",
  "function setUserUseReserveAsCollateral(address asset, bool useAsCollateral) external",
  "function getUserAccountData(address user) external view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)",
];

// PoolAddressesProvider ABI
const AAVE_PROVIDER_ABI = [
  "function getPool() external view returns (address)",
  "function getPriceOracle() external view returns (address)",
];

// DataProvider ABI (for getting user data)
const AAVE_DATA_PROVIDER_ABI = [
  "function getUserReserveData(address asset, address user) external view returns (uint256 currentATokenBalance, uint256 currentStableDebt, uint256 currentVariableDebt, uint256 principalStableDebt, uint256 scaledVariableDebt, uint256 liquidityRate, uint256 stableBorrowRate, uint256 variableBorrowRate, uint256 avgStableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex, uint40 lastUpdateTimestamp)",
];

export interface SupplyParams {
  asset: string; // Token address or "AVAX" for native
  amount: string; // Amount to supply
  onBehalfOf?: string; // Address to credit (defaults to signer)
  referralCode?: number; // Referral code (default: 0)
}

export interface BorrowParams {
  asset: string; // Token address to borrow
  amount: string; // Amount to borrow
  interestRateMode?: number; // 1 = stable, 2 = variable (default: 2)
  onBehalfOf?: string; // Address to borrow for (defaults to signer)
  referralCode?: number; // Referral code (default: 0)
}

export interface RepayParams {
  asset: string; // Token address to repay
  amount: string; // Amount to repay (or "max" for full repayment)
  rateMode?: number; // 1 = stable, 2 = variable (default: 2)
  onBehalfOf?: string; // Address to repay for (defaults to signer)
}

export interface WithdrawParams {
  asset: string; // Token address to withdraw
  amount: string; // Amount to withdraw (or "max" for all)
  to?: string; // Address to receive (defaults to signer)
}

export interface OperationResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

// Aave V3 addresses (Avalanche)
const AAVE_ADDRESSES: Record<string, Record<string, string>> = {
  "avalanche-fuji": {
    // Testnet addresses - these need to be verified from Aave docs
    PoolAddressesProvider: "",
    Pool: "",
    DataProvider: "",
    WAVAXGateway: "", // For native AVAX operations
  },
  "avalanche-mainnet": {
    PoolAddressesProvider: "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb",
    Pool: "", // Will be fetched from provider
    DataProvider: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654",
    WAVAXGateway: "0x6A6FA664D4Fa49a6a780a1D6143f6f8b5a5d4c3E",
  },
};

// Interest rate modes
export const INTEREST_RATE_MODE = {
  STABLE: 1,
  VARIABLE: 2,
};

/**
 * Get Aave Pool contract
 */
export async function getAavePool(
  signerOrProvider: any, // ethers.Signer | ethers.Provider
  poolAddressesProvider: string,
  network: "avalanche-fuji" | "avalanche-mainnet" = "avalanche-fuji"
): Promise<ethers.Contract> {
  const provider = signerOrProvider instanceof ethers.Signer ? signerOrProvider.provider! : signerOrProvider;
  const addressesProvider = new ethers.Contract(poolAddressesProvider, AAVE_PROVIDER_ABI, provider);
  const poolAddress = await addressesProvider.getPool();
  return new ethers.Contract(poolAddress, AAVE_POOL_ABI, signerOrProvider);
}

/**
 * Get Aave PoolAddressesProvider address
 */
export function getAaveProviderAddress(
  network: "avalanche-fuji" | "avalanche-mainnet" = "avalanche-fuji"
): string {
  const address = AAVE_ADDRESSES[network]?.PoolAddressesProvider;
  if (!address) {
    throw new Error(`Aave PoolAddressesProvider not configured for ${network}`);
  }
  return address;
}

/**
 * Supply assets to Aave
 */
export async function supplyToAave(
  signer: ethers.Signer,
  params: SupplyParams,
  poolAddressesProvider: string,
  network: "avalanche-fuji" | "avalanche-mainnet" = "avalanche-fuji"
): Promise<OperationResult> {
  try {
    const pool = await getAavePool(signer, poolAddressesProvider, network);
    const onBehalfOf = params.onBehalfOf || await signer.getAddress();
    const referralCode = params.referralCode || 0;
    
    const isAVAX = params.asset.toUpperCase() === "AVAX" || params.asset.toLowerCase() === "native";
    
    let tx: ethers.ContractTransactionResponse;
    
    if (isAVAX) {
      // For native AVAX, use WAVAX Gateway
      const gatewayAddress = AAVE_ADDRESSES[network]?.WAVAXGateway;
      if (!gatewayAddress) {
        throw new Error("WAVAX Gateway not configured for native AVAX supply");
      }
      
      // Gateway ABI (simplified)
      const gatewayABI = [
        "function depositETH(address pool, address onBehalfOf, uint16 referralCode) external payable",
      ];
      const gateway = new ethers.Contract(gatewayAddress, gatewayABI, signer);
      tx = await gateway.depositETH(pool.target, onBehalfOf, referralCode, { value: params.amount });
    } else {
      // Supply ERC20 token
      const tokenContract = new ethers.Contract(
        params.asset,
        ["function approve(address spender, uint256 amount) external returns (bool)", "function allowance(address owner, address spender) external view returns (uint256)"],
        signer
      );
      
      const allowance = await tokenContract.allowance(await signer.getAddress(), pool.target);
      if (allowance < BigInt(params.amount)) {
        const approveTx = await tokenContract.approve(pool.target, ethers.MaxUint256);
        await approveTx.wait();
      }
      
      tx = await pool.supply(params.asset, params.amount, onBehalfOf, referralCode);
    }
    
    const receipt = await tx.wait();
    
    return {
      success: true,
      txHash: receipt!.hash,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Supply failed",
    };
  }
}

/**
 * Borrow from Aave
 */
export async function borrowFromAave(
  signer: ethers.Signer,
  params: BorrowParams,
  poolAddressesProvider: string,
  network: "avalanche-fuji" | "avalanche-mainnet" = "avalanche-fuji"
): Promise<OperationResult> {
  try {
    const pool = await getAavePool(signer, poolAddressesProvider, network);
    const onBehalfOf = params.onBehalfOf || await signer.getAddress();
    const interestRateMode = params.interestRateMode || INTEREST_RATE_MODE.VARIABLE;
    const referralCode = params.referralCode || 0;
    
    const tx = await pool.borrow(params.asset, params.amount, interestRateMode, referralCode, onBehalfOf);
    const receipt = await tx.wait();
    
    return {
      success: true,
      txHash: receipt!.hash,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Borrow failed",
    };
  }
}

/**
 * Repay borrow to Aave
 */
export async function repayToAave(
  signer: ethers.Signer,
  params: RepayParams,
  poolAddressesProvider: string,
  network: "avalanche-fuji" | "avalanche-mainnet" = "avalanche-fuji"
): Promise<OperationResult> {
  try {
    const pool = await getAavePool(signer, poolAddressesProvider, network);
    const onBehalfOf = params.onBehalfOf || await signer.getAddress();
    const rateMode = params.rateMode || INTEREST_RATE_MODE.VARIABLE;
    
    const isAVAX = params.asset.toUpperCase() === "AVAX" || params.asset.toLowerCase() === "native";
    
    let repayAmount = params.amount;
    if (params.amount === "max") {
      // Get current debt
      const dataProviderAddress = AAVE_ADDRESSES[network]?.DataProvider;
      if (dataProviderAddress) {
        const dataProvider = new ethers.Contract(dataProviderAddress, AAVE_DATA_PROVIDER_ABI, signer);
        const userData = await dataProvider.getUserReserveData(params.asset, onBehalfOf);
        repayAmount = rateMode === INTEREST_RATE_MODE.STABLE 
          ? userData.currentStableDebt.toString()
          : userData.currentVariableDebt.toString();
      } else {
        throw new Error("DataProvider not configured - cannot determine max repay amount");
      }
    }
    
    let tx: ethers.ContractTransactionResponse;
    
    if (isAVAX) {
      // For native AVAX, use WAVAX Gateway
      const gatewayAddress = AAVE_ADDRESSES[network]?.WAVAXGateway;
      if (!gatewayAddress) {
        throw new Error("WAVAX Gateway not configured for native AVAX repay");
      }
      
      const gatewayABI = [
        "function repayETH(address pool, uint256 amount, uint256 rateMode, address onBehalfOf) external payable",
      ];
      const gateway = new ethers.Contract(gatewayAddress, gatewayABI, signer);
      tx = await gateway.repayETH(pool.target, repayAmount, rateMode, onBehalfOf, { value: repayAmount });
    } else {
      // Repay ERC20 token
      const tokenContract = new ethers.Contract(
        params.asset,
        ["function approve(address spender, uint256 amount) external returns (bool)", "function allowance(address owner, address spender) external view returns (uint256)"],
        signer
      );
      
      const allowance = await tokenContract.allowance(await signer.getAddress(), pool.target);
      if (allowance < BigInt(repayAmount)) {
        const approveTx = await tokenContract.approve(pool.target, ethers.MaxUint256);
        await approveTx.wait();
      }
      
      tx = await pool.repay(params.asset, repayAmount, rateMode, onBehalfOf);
    }
    
    const receipt = await tx.wait();
    
    return {
      success: true,
      txHash: receipt!.hash,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Repay failed",
    };
  }
}

/**
 * Withdraw from Aave
 */
export async function withdrawFromAave(
  signer: ethers.Signer,
  params: WithdrawParams,
  poolAddressesProvider: string,
  network: "avalanche-fuji" | "avalanche-mainnet" = "avalanche-fuji"
): Promise<OperationResult> {
  try {
    const pool = await getAavePool(signer, poolAddressesProvider, network);
    const to = params.to || await signer.getAddress();
    
    const withdrawAmount = params.amount === "max" ? ethers.MaxUint256 : params.amount;
    
    const isAVAX = params.asset.toUpperCase() === "AVAX" || params.asset.toLowerCase() === "native";
    
    let tx: ethers.ContractTransactionResponse;
    
    if (isAVAX) {
      // For native AVAX, use WAVAX Gateway
      const gatewayAddress = AAVE_ADDRESSES[network]?.WAVAXGateway;
      if (!gatewayAddress) {
        throw new Error("WAVAX Gateway not configured for native AVAX withdraw");
      }
      
      const gatewayABI = [
        "function withdrawETH(address pool, uint256 amount, address to) external",
      ];
      const gateway = new ethers.Contract(gatewayAddress, gatewayABI, signer);
      tx = await gateway.withdrawETH(pool.target, withdrawAmount, to);
    } else {
      tx = await pool.withdraw(params.asset, withdrawAmount, to);
    }
    
    const receipt = await tx.wait();
    
    return {
      success: true,
      txHash: receipt!.hash,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Withdraw failed",
    };
  }
}

/**
 * Get user account data from Aave
 */
export async function getUserAccountData(
  provider: any, // ethers.Provider
  user: string,
  poolAddressesProvider: string,
  network: "avalanche-fuji" | "avalanche-mainnet" = "avalanche-fuji"
): Promise<{
  totalCollateralBase: string;
  totalDebtBase: string;
  availableBorrowsBase: string;
  currentLiquidationThreshold: string;
  ltv: string;
  healthFactor: string;
}> {
  const pool = await getAavePool(provider, poolAddressesProvider, network);
  const [
    totalCollateralBase,
    totalDebtBase,
    availableBorrowsBase,
    currentLiquidationThreshold,
    ltv,
    healthFactor,
  ] = await pool.getUserAccountData(user);
  
  return {
    totalCollateralBase: totalCollateralBase.toString(),
    totalDebtBase: totalDebtBase.toString(),
    availableBorrowsBase: availableBorrowsBase.toString(),
    currentLiquidationThreshold: currentLiquidationThreshold.toString(),
    ltv: ltv.toString(),
    healthFactor: healthFactor.toString(),
  };
}

