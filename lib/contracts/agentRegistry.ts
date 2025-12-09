import { ethers } from "ethers";

// AgentRegistry ABI (hardcoded to avoid dependency on artifacts during build)
const AGENT_REGISTRY_ABI = [
  "function registerAgent(bytes32 _agentId, string _metadataIPFS) external payable",
  "function registerAgentWithPoAI(bytes32 _agentId, string _metadataIPFS, bytes32 _kitePoAIHash) external payable",
  "function getAgent(bytes32 _agentId) external view returns (tuple(bytes32 agentId, address owner, string metadataIPFS, uint256 trustScore, uint256 totalTransactions, uint256 successfulTransactions, uint256 stakedAmount, bool isActive, uint256 createdAt, bytes32 kitePoAIHash))",
  "function getAgentByAddress(address _owner) external view returns (tuple(bytes32 agentId, address owner, string metadataIPFS, uint256 trustScore, uint256 totalTransactions, uint256 successfulTransactions, uint256 stakedAmount, bool isActive, uint256 createdAt, bytes32 kitePoAIHash))",
  "function getAllAgentsByOwner(address _owner) external view returns (bytes32[])",
  "function addStake(bytes32 _agentId) external payable",
  "function withdrawStake(bytes32 _agentId, uint256 _amount) external",
  "function minStake() external view returns (uint256)",
  "function isAgentRegistered(bytes32 _agentId) external view returns (bool)",
  "function totalAgents() external view returns (uint256)",
  "function updateReputation(bytes32 _agentId, bool _successful, uint256 _transactionValue, string _serviceType) external",
  "event AgentRegistered(address indexed agentAddress, bytes32 indexed agentId, string metadataIPFS, uint256 timestamp)",
  "event AgentStaked(address indexed agentAddress, uint256 amount, uint256 newTotalStake)",
  "event AgentUnstaked(address indexed agentAddress, uint256 amount, uint256 remainingStake)",
  "event ReputationUpdated(address indexed agentAddress, uint256 newTrustScore, bool successful, uint256 transactionValue)",
] as const;

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
    AGENT_REGISTRY_ABI,
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

