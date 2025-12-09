import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAddress, useSDK } from "@thirdweb-dev/react";
import {
  claimCreatorRevenue,
  claimStakerRevenue,
  getPendingCreatorRevenue,
  getPendingStakerRevenue,
} from "@/lib/contracts/revenueDistributor";
import { ethers } from "ethers";

export function usePendingRevenue() {
  const address = useAddress();
  const sdk = useSDK();

  return useQuery({
    queryKey: ["pending-revenue", address],
    queryFn: async () => {
      if (!address || !sdk) return { creator: "0", staker: "0" };

      try {
        const provider = sdk.getProvider();
        if (!provider) return { creator: "0", staker: "0" };

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
    enabled: !!address && !!sdk,
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

