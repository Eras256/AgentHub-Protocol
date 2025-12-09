/**
 * Trader Joe Integration
 * DEX integration for swaps and liquidity operations on Avalanche
 * 
 * Contract Addresses (Avalanche Fuji Testnet):
 * - Router V2: 0xd7f655E3376cE2d7A2b08fF01Eb3B1023191A901 (testnet)
 * - Router V2 (Mainnet): 0x60aE616a2155Ee3d9A68541Ba4544862300933d8
 * 
 * Reference: https://docs.traderjoexyz.com/
 */

import { ethers } from "ethers";

// Trader Joe Router V2 ABI (simplified for swaps)
const TRADER_JOE_ROUTER_ABI = [
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactAVAXForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapTokensForExactAVAX(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactTokensForAVAX(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapAVAXForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
  "function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts)",
  "function WAVAX() external pure returns (address)",
];

// Contract addresses
const CONTRACT_ADDRESSES = {
  "avalanche-fuji": "0xd7f655E3376cE2d7A2b08fF01Eb3B1023191A901", // Testnet
  "avalanche-mainnet": "0x60aE616a2155Ee3d9A68541Ba4544862300933d8", // Mainnet
};

export interface SwapParams {
  tokenIn: string; // Token address to swap from
  tokenOut: string; // Token address to swap to
  amountIn: string; // Amount to swap (in token decimals)
  amountOutMin?: string; // Minimum amount out (slippage protection)
  recipient?: string; // Address to receive tokens (defaults to signer)
  deadline?: number; // Transaction deadline (defaults to 20 minutes)
  slippageTolerance?: number; // Slippage tolerance in basis points (default: 300 = 3%)
}

export interface SwapResult {
  success: boolean;
  txHash?: string;
  amountOut?: string;
  error?: string;
}

/**
 * Get Trader Joe Router contract
 */
export function getTraderJoeRouter(
  signerOrProvider: any, // ethers.Signer | ethers.Provider
  network: "avalanche-fuji" | "avalanche-mainnet" = "avalanche-fuji"
): ethers.Contract {
  const address = CONTRACT_ADDRESSES[network];
  if (!address) {
    throw new Error(`Trader Joe Router not available on ${network}`);
  }
  return new ethers.Contract(address, TRADER_JOE_ROUTER_ABI, signerOrProvider);
}

/**
 * Get quote for a swap (amount out for amount in)
 */
export async function getSwapQuote(
  provider: ethers.Provider,
  tokenIn: string,
  tokenOut: string,
  amountIn: string,
  network: "avalanche-fuji" | "avalanche-mainnet" = "avalanche-fuji"
): Promise<{ amountOut: string; path: string[] }> {
  const router = getTraderJoeRouter(provider, network);
  
  // Determine if using WAVAX
  const wavax = await router.WAVAX();
  const isAVAXIn = tokenIn.toLowerCase() === "avax" || tokenIn.toLowerCase() === "native";
  const isAVAXOut = tokenOut.toLowerCase() === "avax" || tokenOut.toLowerCase() === "native";
  
  // Build path
  const path: string[] = [];
  if (isAVAXIn) {
    path.push(wavax);
  } else {
    path.push(tokenIn);
  }
  
  if (isAVAXOut) {
    if (!isAVAXIn) path.push(wavax);
  } else {
    if (isAVAXIn) path.push(tokenOut);
    else {
      // Direct swap or through WAVAX
      path.push(wavax);
      path.push(tokenOut);
    }
  }
  
  // Get quote
  const amounts = await router.getAmountsOut(amountIn, path);
  const amountOut = amounts[amounts.length - 1].toString();
  
  return { amountOut, path };
}

/**
 * Execute a token swap on Trader Joe
 */
export async function executeSwap(
  signer: ethers.Signer,
  params: SwapParams,
  network: "avalanche-fuji" | "avalanche-mainnet" = "avalanche-fuji"
): Promise<SwapResult> {
  try {
    const router = getTraderJoeRouter(signer, network);
    const recipient = params.recipient || await signer.getAddress();
    const deadline = params.deadline || Math.floor(Date.now() / 1000) + 20 * 60; // 20 minutes
    
    // Get WAVAX address
    const wavax = await router.WAVAX();
    const isAVAXIn = params.tokenIn.toLowerCase() === "avax" || params.tokenIn.toLowerCase() === "native";
    const isAVAXOut = params.tokenOut.toLowerCase() === "avax" || params.tokenOut.toLowerCase() === "native";
    
    // Build path
    const path: string[] = [];
    if (isAVAXIn) {
      path.push(wavax);
    } else {
      path.push(params.tokenIn);
    }
    
    if (isAVAXOut) {
      if (!isAVAXIn) path.push(wavax);
    } else {
      if (isAVAXIn) {
        path.push(params.tokenOut);
      } else {
        // Swap through WAVAX
        path.push(wavax);
        path.push(params.tokenOut);
      }
    }
    
    // Calculate minimum amount out if not provided
    let amountOutMin = params.amountOutMin;
    if (!amountOutMin) {
      const amounts = await router.getAmountsOut(params.amountIn, path);
      const expectedOut = amounts[amounts.length - 1];
      const slippage = params.slippageTolerance || 300; // 3% default
      amountOutMin = (expectedOut * BigInt(10000 - slippage)) / BigInt(10000);
    }
    
    let tx: ethers.ContractTransactionResponse;
    
    // Execute swap based on token types
    if (isAVAXIn && isAVAXOut) {
      // This shouldn't happen, but handle it
      throw new Error("Cannot swap AVAX to AVAX");
    } else if (isAVAXIn) {
      // AVAX -> Token
      tx = await router.swapExactAVAXForTokens(
        amountOutMin,
        path,
        recipient,
        deadline,
        { value: params.amountIn }
      );
    } else if (isAVAXOut) {
      // Token -> AVAX
      // First approve token if needed
      const tokenContract = new ethers.Contract(
        params.tokenIn,
        ["function approve(address spender, uint256 amount) external returns (bool)", "function allowance(address owner, address spender) external view returns (uint256)"],
        signer
      );
      
      const allowance = await tokenContract.allowance(await signer.getAddress(), router.target);
      if (allowance < BigInt(params.amountIn)) {
        const approveTx = await tokenContract.approve(router.target, ethers.MaxUint256);
        await approveTx.wait();
      }
      
      tx = await router.swapExactTokensForAVAX(
        params.amountIn,
        amountOutMin,
        path,
        recipient,
        deadline
      );
    } else {
      // Token -> Token
      // Approve if needed
      const tokenContract = new ethers.Contract(
        params.tokenIn,
        ["function approve(address spender, uint256 amount) external returns (bool)", "function allowance(address owner, address spender) external view returns (uint256)"],
        signer
      );
      
      const allowance = await tokenContract.allowance(await signer.getAddress(), router.target);
      if (allowance < BigInt(params.amountIn)) {
        const approveTx = await tokenContract.approve(router.target, ethers.MaxUint256);
        await approveTx.wait();
      }
      
      tx = await router.swapExactTokensForTokens(
        params.amountIn,
        amountOutMin,
        path,
        recipient,
        deadline
      );
    }
    
    const receipt = await tx.wait();
    
    // Extract amount out from logs (simplified)
    const amounts = await router.getAmountsOut(params.amountIn, path);
    const amountOut = amounts[amounts.length - 1].toString();
    
    return {
      success: true,
      txHash: receipt!.hash,
      amountOut,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Swap failed",
    };
  }
}

/**
 * Get liquidity pool information (simplified)
 */
export async function getPoolInfo(
  provider: ethers.Provider,
  tokenA: string,
  tokenB: string,
  network: "avalanche-fuji" | "avalanche-mainnet" = "avalanche-fuji"
): Promise<{ reserveA: string; reserveB: string; totalSupply: string } | null> {
  // This would require the Factory contract to get pair address
  // For now, return null - can be extended later
  return null;
}

