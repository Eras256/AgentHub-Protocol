/**
 * Agent Registry Contract Functions
 * ERC-8004 compliant agent registry operations
 */

import { ethers } from "ethers";
import type { Signer, Provider, Contract } from "ethers";

// AgentRegistry ABI (minimal needed functions)
const AGENT_REGISTRY_ABI = [
  "function registerAgent(bytes32 _agentId, string calldata _metadataIPFS) external payable",
  "function getAgent(address _agent) external view returns (tuple(bytes32 agentId, address owner, string metadataIPFS, uint256 trustScore, uint256 totalTransactions, uint256 successfulTransactions, uint256 stakedAmount, bool isActive, uint256 createdAt, bytes32 kitePoAIHash))",
  "function addStake() external payable",
  "function withdrawStake(uint256 _amount) external",
  "function totalAgents() external view returns (uint256)",
  "event AgentRegistered(address indexed agentAddress, bytes32 indexed agentId, string metadataIPFS, uint256 timestamp)",
  "event ReputationUpdated(address indexed agentAddress, uint256 newTrustScore, bool successful, uint256 transactionValue)",
];

export interface AgentRegistryConfig {
  address?: string;
  defaultAddress?: string;
}

const DEFAULT_ADDRESSES = {
  "avalanche-fuji": process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS || "",
  "avalanche-mainnet": "",
};

export function getAgentRegistryContract(
  signerOrProvider: Signer | Provider,
  config?: AgentRegistryConfig
): Contract {
  const address =
    config?.address ||
    config?.defaultAddress ||
    DEFAULT_ADDRESSES["avalanche-fuji"];

  if (!address) {
    throw new Error(
      "AgentRegistry address not configured. Provide address in config or set NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS"
    );
  }

  return new ethers.Contract(address, AGENT_REGISTRY_ABI, signerOrProvider);
}

export async function registerAgent(
  signer: Signer,
  agentId: string,
  metadataIPFS: string,
  stakeAmount: string,
  config?: AgentRegistryConfig
) {
  const contract = getAgentRegistryContract(signer, config);
  const tx = await contract.registerAgent(ethers.id(agentId), metadataIPFS, {
    value: ethers.parseEther(stakeAmount),
  });
  return tx.wait();
}

export async function getAgent(
  signerOrProvider: Signer | Provider,
  address: string,
  config?: AgentRegistryConfig
) {
  const contract = getAgentRegistryContract(signerOrProvider, config);
  return contract.getAgent(address);
}

export async function addStake(
  signer: Signer,
  amount: string,
  config?: AgentRegistryConfig
) {
  const contract = getAgentRegistryContract(signer, config);
  const tx = await contract.addStake({ value: ethers.parseEther(amount) });
  return tx.wait();
}

export async function withdrawStake(
  signer: Signer,
  amount: string,
  config?: AgentRegistryConfig
) {
  const contract = getAgentRegistryContract(signer, config);
  const tx = await contract.withdrawStake(ethers.parseEther(amount));
  return tx.wait();
}

