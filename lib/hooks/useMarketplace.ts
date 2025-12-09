import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSDK, useAddress } from "@thirdweb-dev/react";
import { getAllServices, publishService, requestService } from "@/lib/contracts/marketplace";
import { ethers } from "ethers";

// Helper function to create public RPC provider (avoids Thirdweb RPC auth issues)
function createPublicRpcProvider() {
  const rpcUrl = process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC || "https://api.avax-test.network/ext/bc/C/rpc";
  const ethersAny = ethers as any;
  
  // Use ethers v5 API (providers.JsonRpcProvider)
  if (ethersAny.providers && ethersAny.providers.JsonRpcProvider) {
    return new ethersAny.providers.JsonRpcProvider(rpcUrl, {
      name: 'avalanche-fuji',
      chainId: 43113,
      ensAddress: null, // Disable ENS resolution for Avalanche
    });
  } else if (ethersAny.JsonRpcProvider) {
    // Fallback for ethers v6 style
    return new ethersAny.JsonRpcProvider(rpcUrl, {
      name: 'avalanche-fuji',
      chainId: 43113,
      ensAddress: null, // Disable ENS resolution for Avalanche
    });
  }
  
  throw new Error("Cannot create provider: ethers.providers.JsonRpcProvider not available");
}

export function useMarketplaceServices() {
  return useQuery({
    queryKey: ["marketplace-services"],
    queryFn: async () => {
      // Ensure we're in the browser
      if (typeof window === "undefined") {
        return [];
      }
      
      try {
        // Always use public RPC to avoid Thirdweb RPC authentication issues
        const provider = createPublicRpcProvider();
        
        console.log("Fetching services from marketplace contract...");
        const services = await getAllServices(provider);
        console.log("Raw services from contract:", services);
        
        if (!services || services.length === 0) {
          console.log("No services found in marketplace");
          return [];
        }
        
        // Filter and transform services - ONLY use real contract data
        const validServices = services
          .filter((service: any) => {
            // Only include active services with valid data from contract
            // Reject any service that doesn't have all required fields
            const ethersAny = ethers as any;
            const zeroHash = ethersAny.constants?.HashZero || ethersAny.ZeroHash || '0x0000000000000000000000000000000000000000000000000000000000000000';
            const zeroAddress = ethersAny.constants?.AddressZero || ethersAny.ZeroAddress || '0x0000000000000000000000000000000000000000';
            
            const isValid = service && 
              service.serviceId && 
              service.serviceId !== zeroHash &&
              service.provider && 
              service.provider !== zeroAddress &&
              service.isActive === true &&
              service.name && 
              service.name.trim().length > 0 &&
              service.description && 
              service.description.trim().length > 0 &&
              service.endpointURL &&
              service.endpointURL.trim().length > 0 &&
              service.pricePerRequest &&
              Number(service.pricePerRequest) > 0;
            
            if (!isValid) {
              console.warn("Invalid service found, filtering out:", service);
            }
            return isValid;
          })
          .map((service: any) => {
            // Format price - USDC uses 6 decimals on Avalanche Fuji
            const pricePerRequest = (ethers as any).utils?.formatUnits?.(service.pricePerRequest, 6) 
              || (ethers as any).formatUnits?.(service.pricePerRequest, 6)
              || String(service.pricePerRequest);
            
            // Convert rating from basis points (0-10000) to stars (0-5)
            // Contract stores rating as 0-10000 basis points, where 10000 = 5 stars
            const ratingInBasisPoints = Number(service.rating) || 0;
            const ratingInStars = ratingInBasisPoints > 0 ? ratingInBasisPoints / 2000 : 0; // 10000/5 = 2000
            
            return {
              serviceId: service.serviceId,
              provider: service.provider,
              name: service.name.trim(), // Real data from contract
              description: service.description.trim(), // Real data from contract
              endpointURL: service.endpointURL.trim(), // Real data from contract
              pricePerRequest: pricePerRequest, // Real data from contract, formatted
              totalRequests: Number(service.totalRequests) || 0, // Real data from contract
              rating: ratingInStars, // Real data from contract, converted to 0-5 stars
              ratingCount: Number(service.ratingCount) || 0, // Real data from contract
              isActive: service.isActive === true, // Real data from contract
              createdAt: Number(service.createdAt) || 0, // Real data from contract
            };
          });
        
        console.log("Valid services after filtering:", validServices);
        return validServices;
      } catch (error: any) {
        console.error("Error fetching marketplace services:", error);
        console.error("Error details:", error.message, error.stack);
        // Don't throw in production, return empty array instead
        return [];
      }
    },
    enabled: typeof window !== "undefined",
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 2, // Retry twice on failure
    staleTime: 0, // Always consider data stale to force refetch
  });
}

export function usePublishService() {
  const sdk = useSDK();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      endpointURL,
      pricePerRequest,
    }: {
      name: string;
      description: string;
      endpointURL: string;
      pricePerRequest: string;
    }) => {
      if (!sdk) throw new Error("SDK not initialized");
      
      const signer = await sdk.getSigner();
      if (!signer) throw new Error("Signer not available");
      
      const tx = await publishService(signer, name, description, endpointURL, pricePerRequest);
      return tx;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace-services"] });
    },
  });
}

export function useRequestService() {
  const sdk = useSDK();
  const address = useAddress();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serviceId: string) => {
      if (!sdk) throw new Error("SDK not initialized");
      
      const signer = await sdk.getSigner();
      if (!signer) throw new Error("Signer not available");
      
      const tx = await requestService(signer, serviceId);
      return tx;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace-services"] });
      queryClient.invalidateQueries({ queryKey: ["consumer-requests", address] });
    },
  });
}

export function useConsumerRequests() {
  const address = useAddress();

  return useQuery({
    queryKey: ["consumer-requests", address],
    queryFn: async () => {
      if (!address) return [];
      
      try {
        // Always use public RPC to avoid Thirdweb RPC authentication issues
        const provider = createPublicRpcProvider();
        
        const contract = await import("@/lib/contracts/marketplace").then(m => 
          m.getMarketplaceContract(provider)
        );
        
        const requests = await contract.getConsumerRequests(address);
        
        return requests.map((request: any) => ({
          requestId: request.requestId,
          serviceId: request.serviceId,
          consumer: request.consumer,
          // Use ethers v5 API: ethers.utils.formatUnits
          amount: (ethers as any).utils?.formatUnits?.(request.amount, 6) || String(request.amount),
          timestamp: Number(request.timestamp),
          completed: request.completed,
          rating: Number(request.rating),
        }));
      } catch (error) {
        console.error("Error fetching consumer requests:", error);
        return [];
      }
    },
    enabled: !!address,
  });
}

