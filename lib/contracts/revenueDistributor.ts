import { ethers } from "ethers";

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

const REVENUE_DISTRIBUTOR_ADDRESS =
  process.env.NEXT_PUBLIC_REVENUE_DISTRIBUTOR_ADDRESS || "";

export async function getRevenueDistributorContract(
  signerOrProvider: ethers.Signer | ethers.Provider
) {
  return new ethers.Contract(
    REVENUE_DISTRIBUTOR_ADDRESS,
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
  const contract = await getRevenueDistributorContract(signer);
  const tx = await contract.claimStakerRevenue(agentAddress);
  return tx.wait();
}

export async function getPendingCreatorRevenue(
  signerOrProvider: ethers.Signer | ethers.Provider,
  creatorAddress: string
) {
  const contract = await getRevenueDistributorContract(signerOrProvider);
  return contract.getPendingCreatorRevenue(creatorAddress);
}

export async function getPendingStakerRevenue(
  signerOrProvider: ethers.Signer | ethers.Provider,
  agentAddress: string
) {
  const contract = await getRevenueDistributorContract(signerOrProvider);
  return contract.getPendingStakerRevenue(agentAddress);
}

