import { ethers } from "ethers";
// @ts-ignore - Artifacts are generated during contract compilation
import AgentRegistryABI from "../../artifacts/contracts/AgentRegistry.sol/AgentRegistry.json";

const AGENT_REGISTRY_ADDRESS =
  process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS || "";

// Helper function to hash agent ID (compatible with both ethers v5 and v6)
// Frontend uses ethers v5 (for thirdweb v4), so we use ethers.utils.id()
function hashAgentId(agentId: string): string {
  // Type assertion needed because TypeScript sees ethers v6 types, but runtime uses v5
  const ethersAny = ethers as any;
  
  // In ethers v5 (used by frontend), use ethers.utils.id()
  if (ethersAny.utils && typeof ethersAny.utils.id === 'function') {
    return ethersAny.utils.id(agentId);
  }
  // Fallback: use keccak256 with UTF-8 bytes (ethers v5 style)
  if (ethersAny.utils && ethersAny.utils.keccak256 && ethersAny.utils.toUtf8Bytes) {
    return ethersAny.utils.keccak256(ethersAny.utils.toUtf8Bytes(agentId));
  }
  // Try ethers v6 id() directly (for server-side or if v6 is available)
  if (typeof ethersAny.id === 'function') {
    return ethersAny.id(agentId);
  }
  // Last resort: use keccak256 with UTF-8 bytes (ethers v6 style)
  if (typeof ethersAny.keccak256 === 'function' && typeof ethersAny.toUtf8Bytes === 'function') {
    return ethersAny.keccak256(ethersAny.toUtf8Bytes(agentId));
  }
  throw new Error('Unable to hash agent ID: ethers.utils.id or keccak256 not available');
}

// Helper function to parse ether (compatible with both ethers v5 and v6)
// Frontend uses ethers v5 (for thirdweb v4), so we use ethers.utils.parseEther()
// Returns BigNumber in v5, bigint in v6 - both work with contract calls
function parseEther(amount: string): any {
  // Type assertion needed because TypeScript sees ethers v6 types, but runtime uses v5
  const ethersAny = ethers as any;
  
  // CRITICAL: In ethers v5 (used by frontend with thirdweb v4), parseEther is in utils
  // Check for ethers.utils.parseEther first (ethers v5)
  if (ethersAny.utils && ethersAny.utils.parseEther && typeof ethersAny.utils.parseEther === 'function') {
    return ethersAny.utils.parseEther(amount);
  }
  
  // Fallback: Try ethers v6 parseEther() directly (for server-side or if v6 is available)
  // This returns a bigint which also works with contract calls
  if (typeof ethersAny.parseEther === 'function') {
    return ethersAny.parseEther(amount);
  }
  
  // Last resort: Try to construct BigNumber manually (ethers v5 fallback)
  if (ethersAny.BigNumber && ethersAny.utils && ethersAny.utils.parseUnits) {
    return ethersAny.utils.parseUnits(amount, 18);
  }
  
  throw new Error('Unable to parse ether: ethers.utils.parseEther or parseEther not available. Ethers version: ' + (ethersAny.version || 'unknown'));
}

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
  const hashedAgentId = hashAgentId(agentId);
  const tx = await contract.registerAgent(
    hashedAgentId,
    metadataIPFS,
    { value: parseEther(stakeAmount) }
  );
  return tx.wait();
}

export async function getAgent(signerOrProvider: ethers.Signer | ethers.Provider, agentId: string) {
  const contract = await getAgentRegistryContract(signerOrProvider);
  const hashedAgentId = hashAgentId(agentId);
  return contract.getAgent(hashedAgentId);
}

export async function getAllAgentsByOwner(signerOrProvider: ethers.Signer | ethers.Provider, ownerAddress: string) {
  try {
    const contract = await getAgentRegistryContract(signerOrProvider);
    console.log("Calling getAllAgentsByOwner for:", ownerAddress);
    
    const agentIds = await contract.getAllAgentsByOwner(ownerAddress);
    console.log("Agent IDs from contract:", agentIds);
    
    if (!agentIds || agentIds.length === 0) {
      console.log("No agent IDs found for owner:", ownerAddress);
      return [];
    }
    
    // Fetch all agent profiles
    const agents = await Promise.all(
      agentIds.map(async (agentId: string) => {
        try {
          const profile = await contract.getAgent(agentId);
          console.log("Agent profile fetched:", { agentId, profile });
          return {
            agentId: agentId,
            profile: profile,
          };
        } catch (error) {
          console.error(`Error fetching profile for agentId ${agentId}:`, error);
          return null;
        }
      })
    );
    
    // Filter out null results
    const validAgents = agents.filter(agent => agent !== null);
    console.log("Valid agents:", validAgents);
    
    return validAgents;
  } catch (error) {
    console.error("Error in getAllAgentsByOwner:", error);
    throw error;
  }
}

export async function getAgentByAddress(signerOrProvider: ethers.Signer | ethers.Provider, address: string) {
  const contract = await getAgentRegistryContract(signerOrProvider);
  return contract.getAgentByAddress(address);
}

export async function addStake(signer: ethers.Signer, agentId: string, amount: string) {
  const contract = await getAgentRegistryContract(signer);
  const hashedAgentId = hashAgentId(agentId);
  const tx = await contract.addStake(hashedAgentId, { value: parseEther(amount) });
  return tx.wait();
}

export async function withdrawStake(signer: ethers.Signer, agentId: string, amount: string) {
  const contract = await getAgentRegistryContract(signer);
  const hashedAgentId = hashAgentId(agentId);
  const tx = await contract.withdrawStake(hashedAgentId, parseEther(amount));
  return tx.wait();
}

export async function getMinStake(signerOrProvider: ethers.Signer | ethers.Provider) {
  try {
    const contract = await getAgentRegistryContract(signerOrProvider);
    console.log("Fetching minStake from contract...");
    const minStake = await contract.minStake();
    console.log("Raw minStake from contract:", minStake.toString());
    
    // Format to readable string (ethers v5/v6 compatible)
    const ethersAny = ethers as any;
    const formatted = ethersAny.utils?.formatEther 
      ? ethersAny.utils.formatEther(minStake)
      : ethersAny.formatEther 
      ? ethersAny.formatEther(minStake)
      : String(minStake);
    
    console.log("Formatted minStake:", formatted, "AVAX");
    return formatted;
  } catch (error) {
    console.error("Error fetching minStake:", error);
    throw error;
  }
}

