import { useQuery } from "@tanstack/react-query";
import { useSDK } from "@thirdweb-dev/react";

export function useMarketplaceServices() {
  const sdk = useSDK();

  return useQuery({
    queryKey: ["marketplace-services"],
    queryFn: async () => {
      if (!sdk) return [];
      // TODO: Fetch from contract
      return [];
    },
    enabled: !!sdk,
  });
}

