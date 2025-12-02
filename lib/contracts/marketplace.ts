import { ethers } from "ethers";
import ServiceMarketplaceABI from "../../artifacts/contracts/ServiceMarketplace.sol/ServiceMarketplace.json";

const MARKETPLACE_ADDRESS =
  process.env.NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS || "";

export async function getMarketplaceContract(
  signerOrProvider: ethers.Signer | ethers.Provider
) {
  return new ethers.Contract(
    MARKETPLACE_ADDRESS,
    ServiceMarketplaceABI.abi,
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
  const tx = await contract.publishService(
    name,
    description,
    endpointURL,
    ethers.parseUnits(pricePerRequest, 18)
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
  const contract = await getMarketplaceContract(signerOrProvider);
  return contract.getAllServices();
}

