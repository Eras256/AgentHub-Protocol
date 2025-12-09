import { ethers } from "ethers";
// @ts-ignore - Artifacts are generated during contract compilation
import RevenueDistributorABI from "../../artifacts/contracts/RevenueDistributor.sol/RevenueDistributor.json";

const REVENUE_DISTRIBUTOR_ADDRESS =
  process.env.NEXT_PUBLIC_REVENUE_DISTRIBUTOR_ADDRESS || "";

export async function getRevenueDistributorContract(
  signerOrProvider: ethers.Signer | ethers.Provider
) {
  return new ethers.Contract(
    REVENUE_DISTRIBUTOR_ADDRESS,
    RevenueDistributorABI.abi,
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

