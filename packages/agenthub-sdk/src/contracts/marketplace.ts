/**
 * Service Marketplace Contract Functions
 */

import { ethers } from "ethers";
import type { Signer, Provider, Contract } from "ethers";

// ServiceMarketplace ABI
const SERVICE_MARKETPLACE_ABI = [
  "function publishService(string calldata _name, string calldata _description, string calldata _endpointURL, uint256 _pricePerRequest) external returns (bytes32)",
  "function requestService(bytes32 _serviceId) external nonReentrant returns (bytes32)",
  "function getAllServices() external view returns (tuple(bytes32 serviceId, address provider, string name, string description, string endpointURL, uint256 pricePerRequest, uint256 totalRequests, uint256 rating, uint256 ratingCount, bool isActive, uint256 createdAt)[])",
  "function getService(bytes32 _serviceId) external view returns (tuple(bytes32 serviceId, address provider, string name, string description, string endpointURL, uint256 pricePerRequest, uint256 totalRequests, uint256 rating, uint256 ratingCount, bool isActive, uint256 createdAt))",
  "function getConsumerRequests(address _consumer) external view returns (tuple(bytes32 requestId, bytes32 serviceId, address consumer, uint256 amount, uint256 timestamp, bool completed, uint8 rating)[])",
  "function completeServiceRequest(bytes32 _requestId, uint8 _rating) external",
  "function totalServices() external view returns (uint256)",
];

export interface MarketplaceConfig {
  address?: string;
  defaultAddress?: string;
}

const DEFAULT_ADDRESSES = {
  "avalanche-fuji":
    process.env.NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS ||
    "0xe51BF692F7ce26999f8D18d799f73Ad250BfeEC4",
  "avalanche-mainnet": "",
};

export function getMarketplaceContract(
  signerOrProvider: Signer | Provider,
  config?: MarketplaceConfig
): Contract {
  const address =
    config?.address ||
    config?.defaultAddress ||
    DEFAULT_ADDRESSES["avalanche-fuji"];

  if (!address) {
    throw new Error(
      "ServiceMarketplace address not configured. Provide address in config or set NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS"
    );
  }

  return new ethers.Contract(address, SERVICE_MARKETPLACE_ABI, signerOrProvider);
}

export async function publishService(
  signer: Signer,
  name: string,
  description: string,
  endpointURL: string,
  pricePerRequest: string,
  config?: MarketplaceConfig
) {
  const contract = getMarketplaceContract(signer, config);
  // USDC uses 6 decimals on Avalanche
  const tx = await contract.publishService(
    name,
    description,
    endpointURL,
    ethers.parseUnits(pricePerRequest, 6)
  );
  return tx.wait();
}

export async function requestService(
  signer: Signer,
  serviceId: string,
  config?: MarketplaceConfig
) {
  const contract = getMarketplaceContract(signer, config);
  const tx = await contract.requestService(serviceId);
  return tx.wait();
}

export async function getAllServices(
  signerOrProvider: Signer | Provider,
  config?: MarketplaceConfig
) {
  const contract = getMarketplaceContract(signerOrProvider, config);
  return contract.getAllServices();
}

export async function getService(
  signerOrProvider: Signer | Provider,
  serviceId: string,
  config?: MarketplaceConfig
) {
  const contract = getMarketplaceContract(signerOrProvider, config);
  return contract.getService(serviceId);
}

export async function getConsumerRequests(
  signerOrProvider: Signer | Provider,
  consumerAddress: string,
  config?: MarketplaceConfig
) {
  const contract = getMarketplaceContract(signerOrProvider, config);
  return contract.getConsumerRequests(consumerAddress);
}

export async function completeServiceRequest(
  signer: Signer,
  requestId: string,
  rating: number,
  config?: MarketplaceConfig
) {
  const contract = getMarketplaceContract(signer, config);
  const tx = await contract.completeServiceRequest(requestId, rating);
  return tx.wait();
}

