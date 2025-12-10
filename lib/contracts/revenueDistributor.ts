import { ethers } from "ethers";

// Helper function to normalize addresses and avoid ENS resolution
// Avalanche networks don't support ENS, so we must use hex addresses directly
function normalizeAddress(address: string): string {
  if (!address || !address.startsWith('0x') || address.length !== 42) {
    return address; // Return as-is if not a valid hex address
  }
  
  const ethersAny = ethers as any;
  try {
    // Normalize address format (checksum)
    return ethersAny.utils?.getAddress 
      ? ethersAny.utils.getAddress(address)
      : ethersAny.getAddress 
      ? ethersAny.getAddress(address)
      : address;
  } catch (error) {
    // If normalization fails, return original address
    console.warn('Address normalization failed, using original:', address);
    return address;
  }
}

// RevenueDistributor ABI (hardcoded to avoid dependency on artifacts during build)
const REVENUE_DISTRIBUTOR_ABI = [
  "function claimCreatorRevenue() external",
  "function claimStakerRevenue(address _agent) external",
  "function getPendingCreatorRevenue(address _creator) external view returns (uint256)",
  "function getPendingStakerRevenue(address _agent) external view returns (uint256)",
  "function distributeRevenue(address _agentCreator, uint256 _totalRevenue) external",
  "function defaultShares() external view returns (uint256 creatorShare, uint256 stakersShare, uint256 protocolFee)",
  "function pendingCreatorRevenue(address) external view returns (uint256)",
  "function pendingStakerRevenue(address) external view returns (uint256)",
  "function stakerShares(address, address) external view returns (uint256)",
  "function updateRevenueShares(uint256 _creatorShare, uint256 _stakersShare, uint256 _protocolFee) external",
  "event RevenueClaimed(address indexed claimer, uint256 amount, bool isCreator)",
  "event RevenueDistributed(address indexed agent, uint256 totalRevenue, uint256 creatorAmount, uint256 stakersAmount, uint256 protocolAmount)",
] as const;

// Default RevenueDistributor address (OLD contract that works)
// NOTE: The new deployment (0x3C5B450591E1a02deA4Adbed259ba0bf72EaC782) is empty
const DEFAULT_REVENUE_DISTRIBUTOR_ADDRESS = "0x0B987e64a7cB481Aad7500011503D5d0444b1707";

const REVENUE_DISTRIBUTOR_ADDRESS = (
  process.env.NEXT_PUBLIC_REVENUE_DISTRIBUTOR_ADDRESS || DEFAULT_REVENUE_DISTRIBUTOR_ADDRESS
).trim();

export async function getRevenueDistributorContract(
  signerOrProvider: ethers.Signer | ethers.Provider
) {
  if (!REVENUE_DISTRIBUTOR_ADDRESS) {
    throw new Error("NEXT_PUBLIC_REVENUE_DISTRIBUTOR_ADDRESS is not set");
  }
  
  // Validate and normalize address to avoid ENS resolution
  let address = REVENUE_DISTRIBUTOR_ADDRESS.trim();
  if (!address.startsWith('0x') || address.length !== 42) {
    throw new Error(`Invalid RevenueDistributor address format: ${address}`);
  }
  
  // Remove any whitespace and validate hex format
  address = address.replace(/\s/g, '');
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error(`Invalid RevenueDistributor address format: ${address} (must be valid hex address)`);
  }
  
  // Normalize address to avoid ENS resolution
  const normalizedAddress = normalizeAddress(address);
  
  // Create contract with normalized address (no ENS resolution)
  return new ethers.Contract(
    normalizedAddress,
    REVENUE_DISTRIBUTOR_ABI,
    signerOrProvider
  );
}

export async function claimCreatorRevenue(signer: ethers.Signer) {
  const contract = await getRevenueDistributorContract(signer);
  const tx = await contract.claimCreatorRevenue();
  return tx.wait();
}

export async function claimStakerRevenue(signer: ethers.Signer, agentAddress: string) {
  // Normalize address to avoid ENS resolution (Avalanche doesn't support ENS)
  const normalizedAgentAddress = normalizeAddress(agentAddress);
  
  const contract = await getRevenueDistributorContract(signer);
  const tx = await contract.claimStakerRevenue(normalizedAgentAddress);
  return tx.wait();
}

export async function getPendingCreatorRevenue(
  signerOrProvider: ethers.Signer | ethers.Provider,
  creatorAddress: string
) {
  // Normalize address to avoid ENS resolution (Avalanche doesn't support ENS)
  const normalizedCreatorAddress = normalizeAddress(creatorAddress);
  
  const contract = await getRevenueDistributorContract(signerOrProvider);
  return contract.getPendingCreatorRevenue(normalizedCreatorAddress);
}

export async function getPendingStakerRevenue(
  signerOrProvider: ethers.Signer | ethers.Provider,
  agentAddress: string
) {
  // Normalize address to avoid ENS resolution (Avalanche doesn't support ENS)
  const normalizedAgentAddress = normalizeAddress(agentAddress);
  
  const contract = await getRevenueDistributorContract(signerOrProvider);
  return contract.getPendingStakerRevenue(normalizedAgentAddress);
}

