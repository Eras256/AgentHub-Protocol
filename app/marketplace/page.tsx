"use client";

export const dynamic = 'force-dynamic';

import { motion } from "framer-motion";
import { useState } from "react";
import { Search, Filter, Zap, Loader2, Bot } from "lucide-react";
import Link from "next/link";
import GlassCard from "@/components/effects/GlassCard";
import NeuralBackground from "@/components/effects/NeuralBackground";
import { useMarketplaceServices, useRequestService } from "@/lib/hooks/useMarketplace";
import { useAddress, useSDK } from "@thirdweb-dev/react";
import ServiceCard from "@/components/marketplace/ServiceCard";
import { ethers } from "ethers";
import { useEffect } from "react";

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

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const address = useAddress();
  const sdk = useSDK();
  const { data: services = [], isLoading, error } = useMarketplaceServices();
  const requestServiceMutation = useRequestService();
  
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
        const usdcAbi = ["function balanceOf(address) view returns (uint256)", "function allowance(address,address) view returns (uint256)", "function approve(address,uint256) returns (bool)"];
        const signer = await sdk.getSigner();
        
        // Normalize marketplace address
        const marketplaceAddressRaw = process.env.NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS || "";
        const marketplaceAddress = normalizeAddress(marketplaceAddressRaw);
        
        // Normalize user address
        const normalizedUserAddress = normalizeAddress(address);
        
        // Create USDC contract with normalized address (no ENS resolution)
        const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, signer);
        
        const balance = await usdcContract.balanceOf(normalizedUserAddress);
        // Use ethers v5 API: ethers.utils.parseUnits
        // TypeScript sees ethers v6 types, but runtime uses v5 via webpack alias
        const price = (ethers as any).utils.parseUnits(service.pricePerRequest, 6);
        
        if (balance < price) {
          alert(`Insufficient USDC balance. You need ${service.pricePerRequest} USDC`);
          return;
        }

        const allowance = await usdcContract.allowance(normalizedUserAddress, marketplaceAddress);
        if (allowance < price) {
          // Request approval with normalized addresses
          const approveTx = await usdcContract.approve(marketplaceAddress, price);
          await approveTx.wait();
        }

        // Request service
        setSelectedServiceId(serviceId);
        await requestServiceMutation.mutateAsync(serviceId);
        alert("Service requested successfully!");
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
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

