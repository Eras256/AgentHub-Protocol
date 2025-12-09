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

// Use environment variable or fallback to deployed contract address
const MARKETPLACE_ADDRESS = (
  process.env.NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS || 
  "0xe51BF692F7ce26999f8D18d799f73Ad250BfeEC4" // Default deployed address on Fuji
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
  if (!MARKETPLACE_ADDRESS) {
    throw new Error("NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS is not set");
  }
  
  // Validate and normalize address to avoid ENS resolution
  let address = MARKETPLACE_ADDRESS.trim();
  if (!address.startsWith('0x') || address.length !== 42) {
    throw new Error(`Invalid Marketplace address format: ${address}`);
  }
  
  // Remove any whitespace and validate hex format
  address = address.replace(/\s/g, '');
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error(`Invalid Marketplace address format: ${address} (must be valid hex address)`);
  }
  
  // Normalize address to avoid ENS resolution
  const normalizedAddress = normalizeAddress(address);
  
  // Create contract with normalized address (no ENS resolution)
  return new ethers.Contract(
    normalizedAddress,
    SERVICE_MARKETPLACE_ABI,
    signerOrProvider
  );
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
  const contract = await getMarketplaceContract(signer);
  const tx = await contract.requestService(serviceId);
  return tx.wait();
}

export async function getAllServices(
  signerOrProvider: ethers.Signer | ethers.Provider
) {
  try {
    const contract = await getMarketplaceContract(signerOrProvider);
    console.log("Calling getAllServices on marketplace contract...");
    const services = await contract.getAllServices();
    console.log("Raw services from contract:", services);
    
    if (!services || services.length === 0) {
      console.log("No services returned from contract");
      return [];
    }
    
    return services;
  } catch (error) {
    console.error("Error in getAllServices:", error);
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
  // Normalize address to avoid ENS resolution (Avalanche doesn't support ENS)
  const normalizedConsumerAddress = normalizeAddress(consumerAddress);
  
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

