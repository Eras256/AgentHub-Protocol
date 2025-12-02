"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Search, Filter, Zap } from "lucide-react";
import GlassCard from "@/components/effects/GlassCard";
import NeuralBackground from "@/components/effects/NeuralBackground";

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock services data
  const services = [
    {
      id: "1",
      name: "AI Trading Bot",
      description: "Automated trading bot for DeFi protocols",
      price: "0.1",
      rating: 4.5,
      requests: 1234,
    },
    {
      id: "2",
      name: "Data Oracle Service",
      description: "Real-time price feeds and market data",
      price: "0.05",
      rating: 4.8,
      requests: 5678,
    },
    {
      id: "3",
      name: "NFT Analytics API",
      description: "Comprehensive NFT market analysis",
      price: "0.2",
      rating: 4.2,
      requests: 890,
    },
  ];

  return (
    <div className="relative min-h-screen bg-black text-white">
      <NeuralBackground />
      <div className="relative pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Service Marketplace
              </span>
            </h1>
            <p className="text-gray-400 text-xl">
              Discover and purchase AI agent services
            </p>
          </motion.div>

          {/* Search and Filter */}
          <GlassCard glow="purple" className="mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                  tabIndex={0}
                  aria-label="Search services"
                />
              </div>
              <button
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-semibold hover:from-purple-500 hover:to-cyan-500 transition-all flex items-center space-x-2"
                tabIndex={0}
                aria-label="Filter services"
              >
                <Filter className="w-5 h-5" />
                <span>Filter</span>
              </button>
            </div>
          </GlassCard>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard glow="purple" className="h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-xl">
                      <Zap className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        ${service.price}
                      </p>
                      <p className="text-sm text-gray-400">per request</p>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                  <p className="text-gray-400 mb-4 flex-grow">
                    {service.description}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-400">★</span>
                      <span>{service.rating}</span>
                      <span className="text-gray-400">
                        ({service.requests} requests)
                      </span>
                    </div>
                    <button
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-semibold hover:from-purple-500 hover:to-cyan-500 transition-all text-sm"
                      tabIndex={0}
                      aria-label={`Purchase ${service.name}`}
                    >
                      Purchase
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {services.length === 0 && (
            <GlassCard glow="purple" className="text-center p-12">
              <p className="text-xl text-gray-400">
                No services found. Be the first to publish a service!
              </p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}

