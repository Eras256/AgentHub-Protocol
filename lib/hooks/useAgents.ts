import { useQuery } from "@tanstack/react-query";
import { useAddress, useSDK } from "@thirdweb-dev/react";

export function useAgents() {
  const address = useAddress();
  const sdk = useSDK();

  return useQuery({
    queryKey: ["agents", address],
    queryFn: async () => {
      if (!address || !sdk) return [];
      // TODO: Fetch from contract
      return [];
    },
    enabled: !!address && !!sdk,
  });
}

export function useAgent(address?: string) {
  const sdk = useSDK();

  return useQuery({
    queryKey: ["agent", address],
    queryFn: async () => {
      if (!address || !sdk) return null;
      // TODO: Fetch from contract
      return null;
    },
    enabled: !!address && !!sdk,
  });
}

