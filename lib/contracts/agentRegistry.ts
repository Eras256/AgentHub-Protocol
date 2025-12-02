import { ethers } from "ethers";
import AgentRegistryABI from "../../artifacts/contracts/AgentRegistry.sol/AgentRegistry.json";

const AGENT_REGISTRY_ADDRESS =
  process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS || "";

export async function getAgentRegistryContract(
  signerOrProvider: ethers.Signer | ethers.Provider
) {
  return new ethers.Contract(
    AGENT_REGISTRY_ADDRESS,
    AgentRegistryABI.abi,
    signerOrProvider
  );
}

export async function registerAgent(
  signer: ethers.Signer,
  agentId: string,
  metadataIPFS: string,
  stakeAmount: string
) {
  const contract = await getAgentRegistryContract(signer);
  const tx = await contract.registerAgent(
    ethers.id(agentId),
    metadataIPFS,
    { value: ethers.parseEther(stakeAmount) }
  );
  return tx.wait();
}

export async function getAgent(signerOrProvider: ethers.Signer | ethers.Provider, address: string) {
  const contract = await getAgentRegistryContract(signerOrProvider);
  return contract.getAgent(address);
}

export async function addStake(signer: ethers.Signer, amount: string) {
  const contract = await getAgentRegistryContract(signer);
  const tx = await contract.addStake({ value: ethers.parseEther(amount) });
  return tx.wait();
}

export async function withdrawStake(signer: ethers.Signer, amount: string) {
  const contract = await getAgentRegistryContract(signer);
  const tx = await contract.withdrawStake(ethers.parseEther(amount));
  return tx.wait();
}

