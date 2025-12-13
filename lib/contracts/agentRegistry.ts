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

// Default AgentRegistry address for Avalanche Fuji Testnet
const DEFAULT_AGENT_REGISTRY_ADDRESS = "0x6750Ed798186b4B5a7441D0f46Dd36F372441306";

const AGENT_REGISTRY_ADDRESS = (
  process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS || DEFAULT_AGENT_REGISTRY_ADDRESS
).trim();

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
  // Ensure address is a valid hex address (not ENS name) to avoid ENS resolution errors on Avalanche
  // Avalanche Fuji doesn't support ENS, so we must use hex addresses directly
  let address = AGENT_REGISTRY_ADDRESS.trim();
  
  // Validate address format
  if (!address) {
    throw new Error('AgentRegistry address is not configured. Please set NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS environment variable.');
  }
  
  if (!address.startsWith('0x')) {
    throw new Error(`Invalid AgentRegistry address format: ${address} (must start with 0x)`);
  }
  
  // Remove any whitespace and validate length
  address = address.replace(/\s/g, '');
  if (address.length !== 42) {
    throw new Error(`Invalid AgentRegistry address length: ${address} (expected 42 characters, got ${address.length})`);
  }
  
  // Validate hex format
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error(`Invalid AgentRegistry address format: ${address} (must be valid hex address)`);
  }
  
  // Normalize address to avoid ENS resolution
  const normalizedAddress = normalizeAddress(address);
  
  // Create contract with normalized address (no ENS resolution)
  return new ethers.Contract(
    normalizedAddress,
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

export async function registerAgentWithPoAI(
  signer: ethers.Signer,
  agentId: string,
  metadataIPFS: string,
  stakeAmount: string,
  kitePoAIHash: string
) {
  const contract = await getAgentRegistryContract(signer);
  const hashedAgentId = hashAgentId(agentId);
  
  // Convert PoAI hash string to bytes32
  // The hash should already be in hex format (0x...), just ensure it's 32 bytes
  const ethersAny = ethers as any;
  let poaiHashBytes32: string;
  
  if (kitePoAIHash.startsWith('0x')) {
    // Already a hex string, pad to 32 bytes (64 hex chars)
    if (kitePoAIHash.length === 66) {
      // Already 32 bytes
      poaiHashBytes32 = kitePoAIHash;
    } else {
      // Pad with zeros
      poaiHashBytes32 = ethersAny.utils?.hexZeroPad 
        ? ethersAny.utils.hexZeroPad(kitePoAIHash, 32)
        : kitePoAIHash.padEnd(66, '0');
    }
  } else {
    // Not a hex string, convert it
    poaiHashBytes32 = ethersAny.utils?.hexlify && ethersAny.utils?.hexZeroPad
      ? ethersAny.utils.hexZeroPad(ethersAny.utils.hexlify(kitePoAIHash), 32)
      : `0x${kitePoAIHash.padStart(64, '0')}`;
  }
  
  const tx = await contract.registerAgentWithPoAI(
    hashedAgentId,
    metadataIPFS,
    poaiHashBytes32,
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
    console.log("getAllAgentsByOwner - Starting, ownerAddress:", ownerAddress);
    console.log("getAllAgentsByOwner - signerOrProvider type:", signerOrProvider?.constructor?.name);
    
    // Normalize address to avoid ENS resolution (Avalanche doesn't support ENS)
    const normalizedOwnerAddress = normalizeAddress(ownerAddress);
    console.log("getAllAgentsByOwner - Normalized address:", normalizedOwnerAddress);
    
    console.log("getAllAgentsByOwner - Getting contract...");
    const contract = await getAgentRegistryContract(signerOrProvider);
    console.log("getAllAgentsByOwner - Contract obtained, address:", contract.target);
    
    console.log("getAllAgentsByOwner - Calling getAllAgentsByOwner on contract for:", normalizedOwnerAddress);
    const agentIds = await contract.getAllAgentsByOwner(normalizedOwnerAddress);
    console.log("getAllAgentsByOwner - Agent IDs from contract:", agentIds);
    console.log("getAllAgentsByOwner - Agent IDs count:", agentIds?.length || 0);
    
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
  // Normalize address to avoid ENS resolution (Avalanche doesn't support ENS)
  const normalizedAddress = normalizeAddress(address);
  
  const contract = await getAgentRegistryContract(signerOrProvider);
  return contract.getAgentByAddress(normalizedAddress);
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

