/**
 * Revenue Distributor Contract Functions
 */

import { ethers } from "ethers";
import type { Signer, Provider, Contract } from "ethers";

// RevenueDistributor ABI
const REVENUE_DISTRIBUTOR_ABI = [
  "function claimCreatorRevenue() external",
  "function claimStakerRevenue(address _agentAddress) external",
  "function getPendingCreatorRevenue(address _creator) external view returns (uint256)",
  "function getPendingStakerRevenue(address _agentAddress) external view returns (uint256)",
  "event RevenueClaimed(address indexed claimer, uint256 amount, string revenueType)",
];

export interface RevenueDistributorConfig {
  address?: string;
  defaultAddress?: string;
}

const DEFAULT_ADDRESSES = {
  "avalanche-fuji": process.env.NEXT_PUBLIC_REVENUE_DISTRIBUTOR_ADDRESS || "",
  "avalanche-mainnet": "",
};

export function getRevenueDistributorContract(
  signerOrProvider: Signer | Provider,
  config?: RevenueDistributorConfig
): Contract {
  const address =
    config?.address ||
    config?.defaultAddress ||
    DEFAULT_ADDRESSES["avalanche-fuji"];

  if (!address) {
    throw new Error(
      "RevenueDistributor address not configured. Provide address in config or set NEXT_PUBLIC_REVENUE_DISTRIBUTOR_ADDRESS"
    );
  }

  return new ethers.Contract(
    address,
    REVENUE_DISTRIBUTOR_ABI,
    signerOrProvider
  );
}

export async function claimCreatorRevenue(
  signer: Signer,
  config?: RevenueDistributorConfig
) {
  const contract = getRevenueDistributorContract(signer, config);
  const tx = await contract.claimCreatorRevenue();
  return tx.wait();
}

export async function claimStakerRevenue(
  signer: Signer,
  agentAddress: string,
  config?: RevenueDistributorConfig
) {
  const contract = getRevenueDistributorContract(signer, config);
  const tx = await contract.claimStakerRevenue(agentAddress);
  return tx.wait();
}

export async function getPendingCreatorRevenue(
  signerOrProvider: Signer | Provider,
  creatorAddress: string,
  config?: RevenueDistributorConfig
) {
  const contract = getRevenueDistributorContract(signerOrProvider, config);
  return contract.getPendingCreatorRevenue(creatorAddress);
}

export async function getPendingStakerRevenue(
  signerOrProvider: Signer | Provider,
  agentAddress: string,
  config?: RevenueDistributorConfig
) {
  const contract = getRevenueDistributorContract(signerOrProvider, config);
  return contract.getPendingStakerRevenue(agentAddress);
}

