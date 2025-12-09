import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAddress, useSDK } from "@thirdweb-dev/react";
import { getAllAgentsByOwner, registerAgent, addStake, getMinStake } from "@/lib/contracts/agentRegistry";
import { ethers } from "ethers";

export function useAgents() {
  const address = useAddress();
  const sdk = useSDK();

  return useQuery({
    queryKey: ["agents", address],
    queryFn: async () => {
      if (!address || !sdk) return [];
      
      try {
        console.log("useAgents - Starting fetch, address:", address, "sdk:", !!sdk);
        
        // Try to get provider from SDK, with fallback to public RPC
        let provider = null;
        try {
          provider = sdk.getProvider();
          console.log("useAgents - Provider obtained from SDK:", provider);
        } catch (e) {
          console.warn("useAgents - Could not get provider from SDK, using fallback:", e);
        }
        
        // Fallback: Create provider directly from public RPC URL
        // This avoids Thirdweb RPC authentication issues
        if (!provider) {
          const rpcUrl = process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC || "https://api.avax-test.network/ext/bc/C/rpc";
          console.log("useAgents - Creating fallback provider with RPC:", rpcUrl);
          
          // Use ethers v5 API (providers.JsonRpcProvider)
          // Type assertion needed because TypeScript sees ethers v6 types, but runtime uses v5
          const ethersAny = ethers as any;
          // Check if providers exists, otherwise try direct JsonRpcProvider
          if (ethersAny.providers && ethersAny.providers.JsonRpcProvider) {
            provider = new ethersAny.providers.JsonRpcProvider(rpcUrl);
          } else if (ethersAny.JsonRpcProvider) {
            // Fallback for ethers v6 style
            provider = new ethersAny.JsonRpcProvider(rpcUrl);
          } else {
            console.error("useAgents - Cannot create provider: ethers.providers.JsonRpcProvider not available");
            return [];
          }
          console.log("useAgents - Fallback provider created:", provider);
        }
        
        if (!provider) {
          console.error("useAgents - No provider available");
          return [];
        }
        
        // Verify provider has getNetwork method (ethers provider)
        if (typeof provider.getNetwork !== 'function') {
          console.error("useAgents - Provider does not have getNetwork method, provider type:", typeof provider);
          return [];
        }
        
        // Check network
        try {
          const network = await provider.getNetwork();
          console.log("useAgents - Network:", network);
          if (network.chainId !== 43113n && network.chainId !== BigInt(43113)) {
            console.warn("useAgents - Wrong network! Expected 43113 (Avalanche Fuji), got:", network.chainId);
          }
        } catch (networkError) {
          console.error("useAgents - Error getting network:", networkError);
          // Continue anyway, network check is not critical
        }
        
        // Normalize address to avoid ENS resolution (Avalanche doesn't support ENS)
        // Helper function to normalize addresses
        const normalizeAddress = (addr: string): string => {
          if (!addr || !addr.startsWith('0x') || addr.length !== 42) {
            console.warn("useAgents - Invalid address format:", addr);
            return addr;
          }
          const ethersAny = ethers as any;
          try {
            const normalized = ethersAny.utils?.getAddress 
              ? ethersAny.utils.getAddress(addr)
              : ethersAny.getAddress 
              ? ethersAny.getAddress(addr)
              : addr;
            console.log("useAgents - Address normalized:", addr, "->", normalized);
            return normalized;
          } catch (normalizeError) {
            console.warn("useAgents - Address normalization failed, using original:", addr, normalizeError);
            return addr;
          }
        };
        
        const normalizedAddress = normalizeAddress(address);
        console.log("useAgents - Fetching agents for normalized address:", normalizedAddress);
        
        // Get all agents owned by this address
        console.log("useAgents - Calling getAllAgentsByOwner...");
        const agents = await getAllAgentsByOwner(provider, normalizedAddress);
        
        console.log("Raw agents from contract:", agents);
        
        if (!agents || agents.length === 0) {
          console.log("No agents found for address:", address);
          return [];
        }
        
        // Try to get original agentId from localStorage mapping or metadataIPFS
        const getOriginalAgentId = (hashedId: string, metadataIPFS: string): string => {
          // First, try to extract from metadataIPFS (new format: ipfs://originalAgentId|description)
          if (metadataIPFS && metadataIPFS.startsWith('ipfs://') && metadataIPFS.includes('|')) {
            const parts = metadataIPFS.split('|');
            if (parts[0].startsWith('ipfs://')) {
              const extracted = parts[0].replace('ipfs://', '');
              // Check if it looks like an agentId (contains dash and timestamp)
              if (extracted.includes('-') && extracted.length > 10) {
                console.log("Extracted agentId from metadataIPFS:", extracted);
                return extracted;
              }
            }
          }
          
          // Second, try localStorage mapping
          try {
            if (typeof window !== 'undefined') {
              const agentMappings = JSON.parse(localStorage.getItem('agentIdMappings') || '{}');
              const original = agentMappings[hashedId.toLowerCase()];
              if (original) {
                console.log("Found agentId in localStorage:", original);
                return original;
              }
            }
          } catch (e) {
            console.warn('Could not read agentId mappings:', e);
          }
          
          // Fallback: return truncated hashed ID
          return hashedId.substring(0, 16) + '...';
        };
        
        // Transform to frontend format - ONLY use real contract data
        const transformedAgents = agents
          .filter(({ agentId, profile }) => {
            // Filter out invalid agents (owner should not be zero address)
            const isValid = profile && profile.owner && profile.owner !== ethers.ZeroAddress;
            if (!isValid) {
              console.warn("Invalid agent found, filtering out:", { agentId, profile });
            }
            return isValid;
          })
          .map(({ agentId, profile }) => {
            const displayAgentId = getOriginalAgentId(agentId, profile.metadataIPFS);
            
            return {
              agentId: agentId, // Keep hashed ID for contract calls
              originalAgentId: displayAgentId, // Original readable ID for display
              address: profile.owner,
            trustScore: Number(profile.trustScore) / 100, // Convert from basis points
            stakedAmount: (ethers as any).utils?.formatEther 
              ? (ethers as any).utils.formatEther(profile.stakedAmount)
              : (ethers as any).formatEther 
              ? (ethers as any).formatEther(profile.stakedAmount)
              : String(profile.stakedAmount),
            isActive: profile.isActive,
              totalTransactions: Number(profile.totalTransactions),
              successfulTransactions: Number(profile.successfulTransactions),
              createdAt: Number(profile.createdAt),
              metadataIPFS: profile.metadataIPFS,
            };
          });
        
        console.log("useAgents - Transformed agents:", transformedAgents);
        console.log("useAgents - Returning", transformedAgents.length, "agents");
        return transformedAgents;
      } catch (error) {
        console.error("useAgents - Error fetching agents:", error);
        console.error("useAgents - Error type:", error?.constructor?.name);
        console.error("useAgents - Error message:", error instanceof Error ? error.message : String(error));
        console.error("useAgents - Error stack:", error instanceof Error ? error.stack : "No stack");
        // Re-throw error so React Query can handle it properly
        throw error;
      }
    },
    enabled: !!address && !!sdk,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 0, // Always consider data stale to force refetch
    retry: 2, // Retry failed requests 2 times
    retryDelay: 1000, // Wait 1 second between retries
  });
}

export function useAgent(agentId?: string) {
  const sdk = useSDK();

  return useQuery({
    queryKey: ["agent", agentId],
    queryFn: async () => {
      if (!agentId || !sdk) return null;
      
      try {
        const provider = sdk.getProvider();
        if (!provider) return null;
        
        const { getAgent } = await import("@/lib/contracts/agentRegistry");
        const agentProfile = await getAgent(provider, agentId);
        
        if (agentProfile && agentProfile.owner !== ethers.ZeroAddress) {
          return {
            agentId: agentId,
            address: agentProfile.owner,
            trustScore: Number(agentProfile.trustScore) / 100,
            stakedAmount: ethers.formatEther(agentProfile.stakedAmount),
            isActive: agentProfile.isActive,
            totalTransactions: Number(agentProfile.totalTransactions),
            successfulTransactions: Number(agentProfile.successfulTransactions),
            createdAt: Number(agentProfile.createdAt),
            metadataIPFS: agentProfile.metadataIPFS,
          };
        }
        
        return null;
      } catch (error) {
        console.error("Error fetching agent:", error);
        return null;
      }
    },
    enabled: !!agentId && !!sdk,
  });
}

export function useRegisterAgent() {
  const sdk = useSDK();
  const queryClient = useQueryClient();
  const address = useAddress();

  return useMutation({
    mutationFn: async ({
      agentId,
      metadataIPFS,
      stakeAmount,
    }: {
      agentId: string;
      metadataIPFS: string;
      stakeAmount: string;
    }) => {
      if (!sdk) throw new Error("SDK not initialized");
      
      const signer = await sdk.getSigner();
      if (!signer) throw new Error("Signer not available");
      
      const tx = await registerAgent(signer, agentId, metadataIPFS, stakeAmount);
      return tx;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents", address] });
    },
  });
}

export function useAddStake() {
  const sdk = useSDK();
  const queryClient = useQueryClient();
  const address = useAddress();

  return useMutation({
    mutationFn: async ({ agentId, amount }: { agentId: string; amount: string }) => {
      if (!sdk) throw new Error("SDK not initialized");
      
      const signer = await sdk.getSigner();
      if (!signer) throw new Error("Signer not available");
      
      const tx = await addStake(signer, agentId, amount);
      return tx;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents", address] });
    },
  });
}

export function useMinStake() {
  const sdk = useSDK();

  return useQuery({
    queryKey: ["minStake"],
    queryFn: async () => {
      if (!sdk) return "0.01"; // Fallback if SDK not available
      
      try {
        const provider = sdk.getProvider();
        if (!provider) return "0.01"; // Fallback if provider not available
        
        const minStake = await getMinStake(provider);
        return minStake;
      } catch (error) {
        console.error("Error fetching minStake:", error);
        return "0.01"; // Fallback on error
      }
    },
    enabled: !!sdk,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes (minStake rarely changes)
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
}

