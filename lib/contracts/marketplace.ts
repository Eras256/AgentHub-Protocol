import { ethers } from "ethers";
import { validateAndNormalizeAddress } from "@/lib/utils";

// Legacy function name for backward compatibility
// Helper function to normalize addresses and avoid ENS resolution
// Avalanche networks don't support ENS, so we must use hex addresses directly
function normalizeAddress(address: string): string {
  try {
    return validateAndNormalizeAddress(address);
  } catch (error) {
    // If validation fails, return as-is (for backward compatibility)
    console.warn('Address normalization failed, using original:', address, error);
    return address;
  }
}

// Use environment variable or fallback to deployed contract address
// NOTE: Using the OLD contract address that has data and works correctly
// The new deployment (0x1E57856aFFe049aa9f0C654Dd7dd6a60482015a2) is empty
const MARKETPLACE_ADDRESS = (
  process.env.NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS || 
  "0xe51BF692F7ce26999f8D18d799f73Ad250BfeEC4" // Working contract with data
).trim();

// ServiceMarketplace ABI (extracted from contract)
const SERVICE_MARKETPLACE_ABI = [
  "function publishService(string calldata _name, string calldata _description, string calldata _endpointURL, uint256 _pricePerRequest) external returns (bytes32)",
  "function requestService(bytes32 _serviceId) external nonReentrant returns (bytes32)",
  "function getAllServices() external view returns (tuple(bytes32 serviceId, address provider, string name, string description, string endpointURL, uint256 pricePerRequest, uint256 totalRequests, uint256 rating, uint256 ratingCount, bool isActive, uint256 createdAt)[])",
  "function getService(bytes32 _serviceId) external view returns (tuple(bytes32 serviceId, address provider, string name, string description, string endpointURL, uint256 pricePerRequest, uint256 totalRequests, uint256 rating, uint256 ratingCount, bool isActive, uint256 createdAt))",
  "function getConsumerRequests(address _consumer) external view returns (tuple(bytes32 requestId, bytes32 serviceId, address consumer, uint256 amount, uint256 timestamp, bool completed, uint8 rating)[])",
  "function completeServiceRequest(bytes32 _requestId, uint8 _rating) external",
  "function totalServices() external view returns (uint256)",
  "event ServicePublished(bytes32 indexed serviceId, address indexed provider, string name, uint256 pricePerRequest)",
  "event ServiceRequested(bytes32 indexed requestId, bytes32 indexed serviceId, address indexed consumer, uint256 amount)",
  "event ServiceCompleted(bytes32 indexed requestId, uint8 rating)",
];

export async function getMarketplaceContract(
  signerOrProvider: ethers.Signer | ethers.Provider
) {
  // Ensure address is a valid hex address (not ENS name) to avoid ENS resolution errors on Avalanche
  // Avalanche Fuji doesn't support ENS, so we must use hex addresses directly
  // Same approach as getAgentRegistryContract which works correctly
  let address = MARKETPLACE_ADDRESS.trim();
  
  // Validate address format
  if (!address) {
    throw new Error("NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS is not set");
  }
  
  if (!address.startsWith('0x')) {
    throw new Error(`Invalid Marketplace address format: ${address} (must start with 0x)`);
  }
  
  // Remove any whitespace and validate length
  address = address.replace(/\s/g, '');
  if (address.length !== 42) {
    throw new Error(`Invalid Marketplace address length: ${address} (expected 42 characters, got ${address.length})`);
  }
  
  // Validate hex format
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error(`Invalid Marketplace address format: ${address} (must be valid hex address)`);
  }
  
  // Normalize address to avoid ENS resolution
  const normalizedAddress = normalizeAddress(address);
  
  // Create contract with normalized address (no ENS resolution)
  // This is the same approach used in getAgentRegistryContract which works correctly
  // The signerOrProvider is used as-is - if it's a signer, the address normalization prevents ENS resolution
  return new ethers.Contract(
    normalizedAddress,
    SERVICE_MARKETPLACE_ABI,
    signerOrProvider
  ) as any;
}

export async function publishService(
  signer: ethers.Signer,
  name: string,
  description: string,
  endpointURL: string,
  pricePerRequest: string
) {
  const contract = await getMarketplaceContract(signer);
  // USDC uses 6 decimals on Avalanche Fuji
  // Use ethers v5 API: ethers.utils.parseUnits
  const ethersAny = ethers as any;
  const priceInUnits = ethersAny.utils?.parseUnits?.(pricePerRequest, 6) 
    || ethersAny.parseUnits?.(pricePerRequest, 6)
    || ethers.parseUnits(pricePerRequest, 6);
  
  const tx = await contract.publishService(
    name,
    description,
    endpointURL,
    priceInUnits
  );
  return tx.wait();
}

export async function requestService(
  signer: ethers.Signer,
  serviceId: string
) {
  // Get the contract with normalized address (already handled in getMarketplaceContract)
  // The contract is created with the signer, but the address is normalized to avoid ENS
  const contract = await getMarketplaceContract(signer);
  
  // Ensure serviceId is a valid bytes32 (if it's a string, it should already be hashed)
  // The serviceId should be passed as-is from the frontend
  const tx = await contract.requestService(serviceId);
  const receipt = await tx.wait();
  
  // Return both receipt and transaction hash
  return {
    receipt,
    hash: tx.hash,
  };
}

export async function getAllServices(
  signerOrProvider: ethers.Signer | ethers.Provider
) {
  try {
    console.log("getAllServices - Getting contract with provider:", signerOrProvider?.constructor?.name);
    const contract = await getMarketplaceContract(signerOrProvider);
    console.log("getAllServices - Contract obtained, address:", contract.target);
    console.log("getAllServices - Calling getAllServices on marketplace contract...");
    const services = await contract.getAllServices();
    console.log("getAllServices - Raw services from contract:", services);
    console.log("getAllServices - Services count:", services?.length || 0);
    
    if (!services || services.length === 0) {
      console.log("getAllServices - No services returned from contract");
      return [];
    }
    
    return services;
  } catch (error: any) {
    console.error("getAllServices - Error:", error);
    console.error("getAllServices - Error message:", error?.message);
    console.error("getAllServices - Error stack:", error?.stack);
    // Re-throw to let the hook handle it properly
    throw error;
  }
}

export async function getService(
  signerOrProvider: ethers.Signer | ethers.Provider,
  serviceId: string
) {
  const contract = await getMarketplaceContract(signerOrProvider);
  return contract.getService(serviceId);
}

export async function getConsumerRequests(
  signerOrProvider: ethers.Signer | ethers.Provider,
  consumerAddress: string
) {
  // Use the centralized validation function that uses ethers.utils.isAddress() and getAddress()
  // This ensures proper checksum normalization and validation
  const normalizedConsumerAddress = validateAndNormalizeAddress(consumerAddress);
  
  const contract = await getMarketplaceContract(signerOrProvider);
  return contract.getConsumerRequests(normalizedConsumerAddress);
}

export async function completeServiceRequest(
  signer: ethers.Signer,
  requestId: string,
  rating: number
) {
  const contract = await getMarketplaceContract(signer);
  const tx = await contract.completeServiceRequest(requestId, rating);
  return tx.wait();
}

