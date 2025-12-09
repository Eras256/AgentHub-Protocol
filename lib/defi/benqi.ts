/**
 * Benqi Integration
 * Lending and borrowing protocol on Avalanche
 * 
 * Contract Addresses (Avalanche Fuji Testnet):
 * - Comptroller: Check Benqi docs for testnet addresses
 * - qiAVAX: Testnet address
 * 
 * Reference: https://docs.benqi.fi/
 */

import { ethers } from "ethers";

// Benqi Comptroller ABI (simplified)
const BENQI_COMPTROLLER_ABI = [
  "function enterMarkets(address[] calldata qTokens) external returns (uint[] memory)",
  "function exitMarket(address qToken) external returns (uint)",
  "function getAccountLiquidity(address account) external view returns (uint, uint, uint)",
  "function getAssetsIn(address account) external view returns (address[] memory)",
  "function markets(address) external view returns (bool isListed, uint256 collateralFactorMantissa, bool isQied)",
];

// qToken (cToken-like) ABI
const QTOKEN_ABI = [
  "function mint() external payable", // For native tokens like AVAX
  "function mint(uint mintAmount) external returns (uint)", // For ERC20 tokens
  "function redeem(uint redeemTokens) external returns (uint)",
  "function redeemUnderlying(uint redeemAmount) external returns (uint)",
  "function borrow(uint borrowAmount) external returns (uint)",
  "function repayBorrow() external payable", // For native tokens
  "function repayBorrow(uint repayAmount) external returns (uint)", // For ERC20
  "function borrowBalanceStored(address account) external view returns (uint)",
  "function balanceOf(address account) external view returns (uint)",
  "function exchangeRateStored() external view returns (uint)",
  "function supplyRatePerBlock() external view returns (uint)",
  "function borrowRatePerBlock() external view returns (uint)",
  "function underlying() external view returns (address)",
  "function totalSupply() external view returns (uint)",
  "function totalBorrows() external view returns (uint)",
];

export interface SupplyParams {
  asset: string; // Token address or "AVAX" for native
  amount: string; // Amount to supply
  qTokenAddress?: string; // qToken contract address (optional, will be looked up)
}

export interface BorrowParams {
  asset: string; // Token address to borrow
  amount: string; // Amount to borrow
  qTokenAddress?: string; // qToken contract address
}

export interface RepayParams {
  asset: string; // Token address to repay
  amount: string; // Amount to repay (or "max" for full repayment)
  qTokenAddress?: string; // qToken contract address
}

export interface WithdrawParams {
  asset: string; // Token address to withdraw
  amount: string; // Amount to withdraw (or "max" for all)
  qTokenAddress?: string; // qToken contract address
}

export interface OperationResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

// Common qToken addresses (these need to be configured per network)
const QTOKEN_ADDRESSES: Record<string, Record<string, string>> = {
  "avalanche-fuji": {
    // Testnet addresses - these need to be verified
    AVAX: "", // qiAVAX testnet address
    USDC: "", // qiUSDC testnet address
    USDT: "", // qiUSDT testnet address
  },
  "avalanche-mainnet": {
    AVAX: "0x5C0401e81Bc07Ca70fAD469b451682c0d747Ef1c", // qiAVAX
    USDC: "0xB715808a78F6041E46E61C20082e3C5b8b4b4a3", // qiUSDC
    USDT: "0x334AD834Cd4481BB02d09615E7c11a00579A7909", // qiUSDT
  },
};

/**
 * Get qToken address for an asset
 */
export function getQTokenAddress(
  asset: string,
  network: "avalanche-fuji" | "avalanche-mainnet" = "avalanche-fuji"
): string | null {
  const assetUpper = asset.toUpperCase();
  const addresses = QTOKEN_ADDRESSES[network];
  return addresses[assetUpper] || null;
}

/**
 * Get Benqi Comptroller contract
 */
export function getBenqiComptroller(
  signerOrProvider: any, // ethers.Signer | ethers.Provider
  comptrollerAddress: string
): ethers.Contract {
  return new ethers.Contract(comptrollerAddress, BENQI_COMPTROLLER_ABI, signerOrProvider);
}

/**
 * Get qToken contract
 */
export function getQTokenContract(
  signerOrProvider: any, // ethers.Signer | ethers.Provider
  qTokenAddress: string
): ethers.Contract {
  return new ethers.Contract(qTokenAddress, QTOKEN_ABI, signerOrProvider);
}

/**
 * Supply assets to Benqi
 */
export async function supplyToBenqi(
  signer: ethers.Signer,
  params: SupplyParams,
  comptrollerAddress: string,
  network: "avalanche-fuji" | "avalanche-mainnet" = "avalanche-fuji"
): Promise<OperationResult> {
  try {
    const isAVAX = params.asset.toUpperCase() === "AVAX" || params.asset.toLowerCase() === "native";
    
    // Get qToken address
    let qTokenAddress = params.qTokenAddress;
    if (!qTokenAddress) {
      const qTokenAddr = getQTokenAddress(params.asset, network);
      if (!qTokenAddr) {
        throw new Error(`qToken address not found for ${params.asset}`);
      }
      qTokenAddress = qTokenAddr;
    }
    
    const qToken = getQTokenContract(signer, qTokenAddress);
    
    // Enter market if not already entered
    const comptroller = getBenqiComptroller(signer, comptrollerAddress);
    const assetsIn = await comptroller.getAssetsIn(await signer.getAddress());
    if (!assetsIn.includes(qTokenAddress)) {
      const enterTx = await comptroller.enterMarkets([qTokenAddress]);
      await enterTx.wait();
    }
    
    let tx: ethers.ContractTransactionResponse;
    
    if (isAVAX) {
      // Supply native AVAX
      tx = await qToken.mint({ value: params.amount });
    } else {
      // Supply ERC20 token
      const tokenContract = new ethers.Contract(
        params.asset,
        ["function approve(address spender, uint256 amount) external returns (bool)", "function allowance(address owner, address spender) external view returns (uint256)"],
        signer
      );
      
      const allowance = await tokenContract.allowance(await signer.getAddress(), qTokenAddress);
      if (allowance < BigInt(params.amount)) {
        const approveTx = await tokenContract.approve(qTokenAddress, ethers.MaxUint256);
        await approveTx.wait();
      }
      
      tx = await qToken.mint(params.amount);
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
 * Borrow from Benqi
 */
export async function borrowFromBenqi(
  signer: ethers.Signer,
  params: BorrowParams,
  comptrollerAddress: string,
  network: "avalanche-fuji" | "avalanche-mainnet" = "avalanche-fuji"
): Promise<OperationResult> {
  try {
    // Get qToken address
    let qTokenAddress = params.qTokenAddress;
    if (!qTokenAddress) {
      const qTokenAddr = getQTokenAddress(params.asset, network);
      if (!qTokenAddr) {
        throw new Error(`qToken address not found for ${params.asset}`);
      }
      qTokenAddress = qTokenAddr;
    }
    
    const qToken = getQTokenContract(signer, qTokenAddress);
    
    // Enter market if not already entered
    const comptroller = getBenqiComptroller(signer, comptrollerAddress);
    const assetsIn = await comptroller.getAssetsIn(await signer.getAddress());
    if (!assetsIn.includes(qTokenAddress)) {
      const enterTx = await comptroller.enterMarkets([qTokenAddress]);
      await enterTx.wait();
    }
    
    // Borrow
    const tx = await qToken.borrow(params.amount);
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
 * Repay borrow to Benqi
 */
export async function repayToBenqi(
  signer: ethers.Signer,
  params: RepayParams,
  network: "avalanche-fuji" | "avalanche-mainnet" = "avalanche-fuji"
): Promise<OperationResult> {
  try {
    const isAVAX = params.asset.toUpperCase() === "AVAX" || params.asset.toLowerCase() === "native";
    
    // Get qToken address
    let qTokenAddress = params.qTokenAddress;
    if (!qTokenAddress) {
      const qTokenAddr = getQTokenAddress(params.asset, network);
      if (!qTokenAddr) {
        throw new Error(`qToken address not found for ${params.asset}`);
      }
      qTokenAddress = qTokenAddr;
    }
    
    const qToken = getQTokenContract(signer, qTokenAddress);
    
    // Get borrow balance
    const borrowBalance = await qToken.borrowBalanceStored(await signer.getAddress());
    const repayAmount = params.amount === "max" ? borrowBalance.toString() : params.amount;
    
    let tx: ethers.ContractTransactionResponse;
    
    if (isAVAX) {
      // Repay native AVAX
      tx = await qToken.repayBorrow({ value: repayAmount });
    } else {
      // Repay ERC20 token
      const tokenContract = new ethers.Contract(
        params.asset,
        ["function approve(address spender, uint256 amount) external returns (bool)", "function allowance(address owner, address spender) external view returns (uint256)"],
        signer
      );
      
      const allowance = await tokenContract.allowance(await signer.getAddress(), qTokenAddress);
      if (allowance < BigInt(repayAmount)) {
        const approveTx = await tokenContract.approve(qTokenAddress, ethers.MaxUint256);
        await approveTx.wait();
      }
      
      tx = await qToken.repayBorrow(repayAmount);
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
 * Withdraw from Benqi
 */
export async function withdrawFromBenqi(
  signer: ethers.Signer,
  params: WithdrawParams,
  network: "avalanche-fuji" | "avalanche-mainnet" = "avalanche-fuji"
): Promise<OperationResult> {
  try {
    // Get qToken address
    let qTokenAddress = params.qTokenAddress;
    if (!qTokenAddress) {
      const qTokenAddr = getQTokenAddress(params.asset, network);
      if (!qTokenAddr) {
        throw new Error(`qToken address not found for ${params.asset}`);
      }
      qTokenAddress = qTokenAddr;
    }
    
    const qToken = getQTokenContract(signer, qTokenAddress);
    
    let tx: ethers.ContractTransactionResponse;
    
    if (params.amount === "max") {
      // Redeem all
      const balance = await qToken.balanceOf(await signer.getAddress());
      tx = await qToken.redeem(balance);
    } else {
      // Redeem specific amount (in underlying tokens)
      tx = await qToken.redeemUnderlying(params.amount);
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
 * Get account liquidity and positions
 */
export async function getAccountLiquidity(
  provider: any, // ethers.Provider
  account: string,
  comptrollerAddress: string
): Promise<{
  liquidity: string;
  shortfall: string;
  collateral: string;
  assetsIn: string[];
}> {
  const comptroller = getBenqiComptroller(provider, comptrollerAddress);
  const [error, liquidity, shortfall] = await comptroller.getAccountLiquidity(account);
  const assetsIn = await comptroller.getAssetsIn(account);
  
  return {
    liquidity: liquidity.toString(),
    shortfall: shortfall.toString(),
    collateral: error.toString(),
    assetsIn,
  };
}

