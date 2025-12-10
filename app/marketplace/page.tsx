"use client";

export const dynamic = 'force-dynamic';

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Search, Filter, Zap, Loader2, Bot } from "lucide-react";
import Link from "next/link";
import GlassCard from "@/components/effects/GlassCard";
import NeuralBackground from "@/components/effects/NeuralBackground";
import { useMarketplaceServices, useRequestService } from "@/lib/hooks/useMarketplace";
import { useAddress, useSDK } from "@thirdweb-dev/react";
import ServiceCard from "@/components/marketplace/ServiceCard";
import { ethers } from "ethers";
import { validateAndNormalizeAddress, isValidAddress } from "@/lib/utils";

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

// Helper to create provider without ENS
function createProviderWithoutENS() {
  const rpcUrl = process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC || "https://api.avax-test.network/ext/bc/C/rpc";
  const ethersAny = ethers as any;
  
  if (ethersAny.providers && ethersAny.providers.JsonRpcProvider) {
    return new ethersAny.providers.JsonRpcProvider(rpcUrl, {
      name: 'avalanche-fuji',
      chainId: 43113,
      ensAddress: null, // Explicitly disable ENS
    });
  } else if (ethersAny.JsonRpcProvider) {
    return new ethersAny.JsonRpcProvider(rpcUrl, {
      name: 'avalanche-fuji',
      chainId: 43113,
      ensAddress: null, // Explicitly disable ENS
    });
  }
  
  throw new Error("Cannot create provider: ethers.providers.JsonRpcProvider not available");
}

// Helper to intercept ENS resolution in signer's provider (same solution as getMarketplaceContract)
function interceptENSInSigner(signer: any) {
  const ethersAny = ethers as any;
  const originalProvider = signer.provider;
  
  if (originalProvider && typeof originalProvider === 'object') {
    // Intercept getResolver - this is called before resolveName and causes the error
    if (typeof originalProvider.getResolver === 'function') {
      const originalGetResolver = originalProvider.getResolver.bind(originalProvider);
      originalProvider.getResolver = async (name: string) => {
        // If it's already a valid hex address, return null (no resolver needed)
        if (name && name.startsWith('0x') && name.length === 42) {
          return null;
        }
        // For non-address names, throw error immediately to prevent ENS resolution
        throw new Error(`Network does not support ENS resolution for: ${name}`);
      };
    }
    
    // Intercept resolveName - return address directly if it's already a hex address
    if (typeof originalProvider.resolveName === 'function') {
      const originalResolveName = originalProvider.resolveName.bind(originalProvider);
      originalProvider.resolveName = async (nameOrAddress: string) => {
        // If it's already a valid hex address, return it directly
        if (nameOrAddress && nameOrAddress.startsWith('0x') && nameOrAddress.length === 42) {
          return nameOrAddress;
        }
        // For non-address names, throw error to prevent ENS resolution
        throw new Error(`Network does not support ENS resolution for: ${nameOrAddress}`);
      };
    }
    
    // Also ensure the provider has ENS disabled in network config
    try {
      if ('_network' in originalProvider && originalProvider._network) {
        originalProvider._network.ensAddress = null;
      }
      // Also try to set it directly on the provider
      if ('network' in originalProvider && originalProvider.network) {
        originalProvider.network.ensAddress = null;
      }
    } catch (e) {
      // Ignore if we can't modify the network config
    }
  }
  
  return signer;
}

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const address = useAddress();
  const sdk = useSDK();
  const { data: services = [], isLoading, error } = useMarketplaceServices();
  const requestServiceMutation = useRequestService();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Debug logging
  if (typeof window !== 'undefined') {
    console.log("Marketplace - Services:", services);
    console.log("Marketplace - Loading:", isLoading);
    console.log("Marketplace - Error:", error);
  }


  // Handle service request
  useEffect(() => {
    const handleRequestService = async (event: CustomEvent) => {
      if (!address || !sdk) {
        alert("Please connect your wallet first");
        return;
      }

      // Validate address is a valid hex string before proceeding
      if (!isValidAddress(address)) {
        console.error("Invalid address format:", address);
        alert("Invalid wallet address. Please reconnect your wallet.");
        return;
      }

      const serviceId = event.detail.serviceId;
      const service = services.find((s: any) => s.serviceId === serviceId);
      
      if (!service) return;

      if (service.provider.toLowerCase() === address.toLowerCase()) {
        alert("You cannot request your own service");
        return;
      }

      try {
        // Check USDC balance and allowance
        // Normalize addresses to avoid ENS resolution (Avalanche doesn't support ENS)
        const usdcAddress = normalizeAddress("0x5425890298aed601595a70AB815c96711a31Bc65");
        
        // Validate USDC address
        if (!isValidAddress(usdcAddress)) {
          throw new Error("Invalid USDC contract address");
        }
        
        const usdcAbi = ["function balanceOf(address) view returns (uint256)", "function allowance(address,address) view returns (uint256)", "function approve(address,uint256) returns (bool)"];
        
        // Get the signer from Thirdweb SDK
        const signer = await sdk.getSigner();
        if (!signer) {
          throw new Error("Signer not available");
        }
        
        // CRITICAL: Intercept ENS resolution in signer's provider before creating contracts
        // This prevents "getResolver" errors when creating contracts with the signer
        interceptENSInSigner(signer);
        
        // Create a provider without ENS support for read operations
        // This avoids ENS resolution errors when creating contracts
        const providerWithoutENS = createProviderWithoutENS();
        const ethersAny = ethers as any;
        
        // Normalize marketplace address
        const marketplaceAddressRaw = process.env.NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS || "";
        const marketplaceAddress = normalizeAddress(marketplaceAddressRaw);
        
        // Validate marketplace address
        if (!isValidAddress(marketplaceAddress)) {
          throw new Error("Invalid marketplace contract address");
        }
        
        // Normalize user address - already validated above, but normalize for consistency
        const normalizedUserAddress = normalizeAddress(address);
        
        // Double-check normalized address is still valid
        if (!isValidAddress(normalizedUserAddress)) {
          throw new Error("Failed to normalize user address");
        }
        
        // Create USDC contract with provider without ENS for read operations
        // Use provider without ENS to avoid ENS resolution when creating contract
        const usdcContractRead = new ethers.Contract(usdcAddress, usdcAbi, providerWithoutENS);
        
        // For write operations, use signer (ENS already intercepted, contract address is normalized)
        const usdcContractWrite = new ethers.Contract(usdcAddress, usdcAbi, signer);
        
        // Check balance using provider without ENS
        const balance = await usdcContractRead.balanceOf(normalizedUserAddress);
        // Use ethers v5 API: ethers.utils.parseUnits
        // TypeScript sees ethers v6 types, but runtime uses v5 via webpack alias
        const price = ethersAny.utils.parseUnits(service.pricePerRequest, 6);
        
        // Format balance for display
        const balanceFormatted = ethersAny.utils?.formatUnits?.(balance, 6) || String(balance);
        console.log(`USDC Balance: ${balanceFormatted} USDC, Required: ${service.pricePerRequest} USDC`);
        
        // Compare BigNumber values correctly (ethers v5 uses BigNumber, v6 uses bigint)
        // In ethers v5, balance and price are already BigNumber objects
        // Use BigNumber's lt (less than) method for comparison
        let isInsufficient = false;
        try {
          if (ethersAny.BigNumber && ethersAny.BigNumber.isBigNumber && ethersAny.BigNumber.isBigNumber(balance) && ethersAny.BigNumber.isBigNumber(price)) {
            // Both are BigNumber (ethers v5)
            isInsufficient = balance.lt(price);
          } else if (typeof balance === 'bigint' && typeof price === 'bigint') {
            // Both are bigint (ethers v6)
            isInsufficient = balance < price;
          } else {
            // Fallback: convert to string and compare as BigInt
            const balanceStr = balance.toString();
            const priceStr = price.toString();
            isInsufficient = BigInt(balanceStr) < BigInt(priceStr);
          }
        } catch (compareError) {
          // If comparison fails, try string comparison as last resort
          console.warn("Error comparing balance, using string comparison:", compareError);
          const balanceStr = balance.toString();
          const priceStr = price.toString();
          isInsufficient = BigInt(balanceStr) < BigInt(priceStr);
        }
        
        if (isInsufficient) {
          alert(`Insufficient USDC balance. You have ${balanceFormatted} USDC, but need ${service.pricePerRequest} USDC`);
          return;
        }

        // Check allowance using provider without ENS
        const allowance = await usdcContractRead.allowance(normalizedUserAddress, marketplaceAddress);
        
        // Compare allowance with price (same logic as balance comparison)
        let needsApproval = false;
        try {
          if (ethersAny.BigNumber && ethersAny.BigNumber.isBigNumber && ethersAny.BigNumber.isBigNumber(allowance) && ethersAny.BigNumber.isBigNumber(price)) {
            needsApproval = allowance.lt(price);
          } else if (typeof allowance === 'bigint' && typeof price === 'bigint') {
            needsApproval = allowance < price;
          } else {
            const allowanceStr = allowance.toString();
            const priceStr = price.toString();
            needsApproval = BigInt(allowanceStr) < BigInt(priceStr);
          }
        } catch (compareError) {
          console.warn("Error comparing allowance, using string comparison:", compareError);
          const allowanceStr = allowance.toString();
          const priceStr = price.toString();
          needsApproval = BigInt(allowanceStr) < BigInt(priceStr);
        }
        
        if (needsApproval) {
          // Request approval using signer (write operation)
          const approveTx = await usdcContractWrite.approve(marketplaceAddress, price);
          await approveTx.wait();
        }

        // Request service
        setSelectedServiceId(serviceId);
        const result = await requestServiceMutation.mutateAsync(serviceId);
        
        // Show success notification with transaction hash and link
        const txHash = result.hash;
        const explorerUrl = `https://testnet.snowtrace.io/tx/${txHash}`;
        const shortHash = `${txHash.slice(0, 10)}...${txHash.slice(-8)}`;
        
        // Create a better notification message
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px 24px;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          z-index: 10000;
          max-width: 400px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        notification.innerHTML = `
          <div style="display: flex; align-items: start; gap: 12px;">
            <div style="flex: 1;">
              <div style="font-weight: 600; font-size: 16px; margin-bottom: 8px;">
                ✓ Service Requested Successfully!
              </div>
              <div style="font-size: 13px; opacity: 0.9; margin-bottom: 12px; word-break: break-all;">
                Transaction Hash: <code style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px; font-size: 12px;">${shortHash}</code>
              </div>
              <a href="${explorerUrl}" target="_blank" rel="noopener noreferrer" 
                 style="display: inline-block; background: rgba(255,255,255,0.2); color: white; 
                        padding: 8px 16px; border-radius: 6px; text-decoration: none; 
                        font-size: 13px; font-weight: 500; transition: background 0.2s;
                        border: 1px solid rgba(255,255,255,0.3);">
                View on Snowtrace →
              </a>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: none; border: none; color: white; cursor: pointer; 
                           font-size: 20px; padding: 0; width: 24px; height: 24px; 
                           display: flex; align-items: center; justify-content: center;
                           opacity: 0.7; transition: opacity 0.2s;"
                    onmouseover="this.style.opacity='1'"
                    onmouseout="this.style.opacity='0.7'">
              ×
            </button>
          </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
          if (notification.parentElement) {
            notification.style.transition = 'opacity 0.3s, transform 0.3s';
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(20px)';
            setTimeout(() => notification.remove(), 300);
          }
        }, 8000);
      } catch (error: any) {
        console.error("Error requesting service:", error);
        alert(`Error: ${error.message || "Failed to request service"}`);
      } finally {
        setSelectedServiceId(null);
      }
    };

    const handler = handleRequestService as unknown as EventListener;
    window.addEventListener('request-service' as any, handler);
    return () => {
      window.removeEventListener('request-service' as any, handler);
    };
  }, [address, sdk, services, requestServiceMutation]);

  // Filter services based on search query - ONLY use real contract data
  // Services are already filtered in useMarketplaceServices hook, but we add search filter here
  const filteredServices = services
    .filter((service: any) => {
      // Double-check: ensure service has valid data (defensive programming)
      if (!service || !service.serviceId || !service.isActive) {
        return false;
      }
      // Ensure all required fields are present (only real contract data)
      if (!service.name || !service.description || !service.provider || !service.pricePerRequest) {
        return false;
      }
      // Exclude "Force Coverage Test" services
      const serviceName = service.name?.toLowerCase() || '';
      if (serviceName.includes('force coverage test')) {
        return false;
      }
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return service.name?.toLowerCase().includes(query) ||
               service.description?.toLowerCase().includes(query);
      }
      return true;
    });

  return (
    <div className="relative min-h-screen bg-black text-white">
      <NeuralBackground />
      <div className="relative pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-3 sm:px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={mounted ? { opacity: 0, y: 20 } : false}
            animate={mounted ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            className="mb-8 sm:mb-12"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
                  <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    Service Marketplace
                  </span>
                </h1>
                <p className="text-gray-400 text-base sm:text-lg md:text-xl">
                  Discover and purchase AI agent services
                </p>
                <p className="text-gray-500 text-xs sm:text-sm mt-2">
                  Note: Agents must publish services to appear in the marketplace. Register your agent first, then publish a service.
                </p>
              </div>
              {address && (
                <div className="flex flex-col sm:flex-row md:flex-col space-y-2 w-full sm:w-auto md:w-auto">
                  <Link href="/marketplace/publish" className="w-full sm:w-auto">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-semibold text-sm sm:text-base flex items-center justify-center space-x-2 shadow-[0_0_30px_rgba(168,85,247,0.3)]"
                      tabIndex={0}
                      aria-label="Publish Service"
                    >
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Publish Service</span>
                    </motion.button>
                  </Link>
                  <Link href="/create-agent" className="w-full sm:w-auto">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium text-sm sm:text-base flex items-center justify-center space-x-2 transition-colors"
                      tabIndex={0}
                      aria-label="Create Agent"
                    >
                      <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Create Agent</span>
                    </motion.button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* Search and Filter */}
          <GlassCard glow="purple" className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition-colors text-sm sm:text-base"
                  tabIndex={0}
                  aria-label="Search services"
                />
              </div>
              <button
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-semibold text-sm sm:text-base hover:from-purple-500 hover:to-cyan-500 transition-all flex items-center justify-center space-x-2"
                tabIndex={0}
                aria-label="Filter services"
              >
                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Filter</span>
              </button>
            </div>
          </GlassCard>

          {/* Loading State */}
          {isLoading && (
            <GlassCard glow="purple" className="text-center p-12">
              <Loader2 className="w-8 h-8 mx-auto mb-4 text-purple-400 animate-spin" />
              <p className="text-xl text-gray-400">Loading services...</p>
            </GlassCard>
          )}

          {/* Error State */}
          {error && (
            <GlassCard glow="purple" className="text-center p-12 border-red-500/30">
              <p className="text-xl text-red-400">Error loading services</p>
              <p className="text-sm text-gray-400 mt-2">
                Make sure you&apos;re connected to Avalanche Fuji testnet
              </p>
            </GlassCard>
          )}

          {/* Services Grid */}
          {!isLoading && !error && (
            <>
              <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredServices.map((service: any, index: number) => (
                  <motion.div
                    key={service.serviceId}
                    initial={mounted ? { opacity: 0, y: 20 } : false}
                    animate={mounted ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                    transition={{ delay: mounted ? index * 0.1 : 0 }}
                  >
                    <ServiceCard
                      service={{
                        id: service.serviceId,
                        name: service.name,
                        provider: service.provider,
                        providerName: `${service.provider.slice(0, 6)}...${service.provider.slice(-4)}`,
                        category: "ai",
                        description: service.description,
                        pricePerRequest: parseFloat(service.pricePerRequest),
                        totalRequests: service.totalRequests,
                        rating: service.rating,
                        ratingCount: service.ratingCount,
                        verified: service.isActive,
                      }}
                      featured={index === 0}
                    />
                  </motion.div>
                ))}
              </div>

              {filteredServices.length === 0 && (
                <GlassCard glow="purple" className="text-center p-12">
                  <Zap className="w-12 h-12 mx-auto mb-4 text-purple-400" />
                  <p className="text-xl text-gray-400 mb-2">
                    {searchQuery ? "No services match your search" : "No services available"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {searchQuery 
                      ? "Try a different search term" 
                      : "Be the first to publish a service on-chain!"}
                  </p>
                </GlassCard>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

