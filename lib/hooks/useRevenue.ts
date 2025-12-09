import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAddress, useSDK } from "@thirdweb-dev/react";
import {
  claimCreatorRevenue,
  claimStakerRevenue,
  getPendingCreatorRevenue,
  getPendingStakerRevenue,
} from "@/lib/contracts/revenueDistributor";
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

export function usePendingRevenue() {
  const address = useAddress();

  return useQuery({
    queryKey: ["pending-revenue", address],
    queryFn: async () => {
      if (!address) return { creator: "0", staker: "0" };

      try {
        // Always use public RPC to avoid Thirdweb RPC authentication issues
        const provider = createPublicRpcProvider();

        const creatorPending = await getPendingCreatorRevenue(provider, address);
        // For staker revenue, we'd need to check all agents, but for simplicity, return creator
        const stakerPending = "0"; // TODO: Aggregate from all agents

        return {
          // Use ethers v5 API: ethers.utils.formatUnits
          creator: (ethers as any).utils?.formatUnits?.(creatorPending, 6) || String(creatorPending), // USDC uses 6 decimals
          staker: stakerPending,
        };
      } catch (error) {
        console.error("Error fetching pending revenue:", error);
        return { creator: "0", staker: "0" };
      }
    },
    enabled: !!address,
    refetchInterval: 30000,
  });
}

export function useClaimCreatorRevenue() {
  const sdk = useSDK();
  const queryClient = useQueryClient();
  const address = useAddress();

  return useMutation({
    mutationFn: async () => {
      if (!sdk) throw new Error("SDK not initialized");

      const signer = await sdk.getSigner();
      if (!signer) throw new Error("Signer not available");

      const tx = await claimCreatorRevenue(signer);
      return tx;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-revenue", address] });
    },
  });
}

export function useClaimStakerRevenue() {
  const sdk = useSDK();
  const queryClient = useQueryClient();
  const address = useAddress();

  return useMutation({
    mutationFn: async (agentAddress: string) => {
      if (!sdk) throw new Error("SDK not initialized");

      const signer = await sdk.getSigner();
      if (!signer) throw new Error("Signer not available");

      const tx = await claimStakerRevenue(signer, agentAddress);
      return tx;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-revenue", address] });
    },
  });
}

