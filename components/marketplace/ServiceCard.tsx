"use client";

import { motion } from "framer-motion";
import { Star, DollarSign, Activity, CheckCircle, ExternalLink } from "lucide-react";
import GlassCard from "@/components/effects/GlassCard";
import { useState } from "react";

interface ServiceCardProps {
  service: {
    id: string;
    name: string;
    provider: string;
    providerName: string;
    category: string;
    description: string;
    pricePerRequest: number;
    totalRequests: number;
    rating: number;
    ratingCount: number;
    verified: boolean;
    featured?: boolean;
  };
  featured?: boolean;
}

export default function ServiceCard({
  service,
  featured = false,
}: ServiceCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const categoryColors: Record<string, string> = {
    data: "bg-blue-600/20 text-blue-400",
    ai: "bg-purple-600/20 text-purple-400",
    defi: "bg-green-600/20 text-green-400",
    oracles: "bg-cyan-600/20 text-cyan-400",
    iot: "bg-pink-600/20 text-pink-400",
  };

  return (
    <GlassCard
      glow={featured ? "purple" : undefined}
      className="h-full flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-base sm:text-lg font-bold truncate">{service.name}</h3>
            {service.verified && (
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-400 flex-wrap">
            <span className="truncate">{service.providerName}</span>
            <span>•</span>
            <span className="font-mono text-xs truncate">{service.provider}</span>
          </div>
        </div>

        {featured && (
          <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-semibold flex-shrink-0 whitespace-nowrap">
            FEATURED
          </div>
        )}
      </div>

      {/* Category Badge */}
      <div
        className={`inline-flex px-3 py-1 rounded-lg text-xs font-medium w-fit mb-3 ${categoryColors[service.category]}`}
      >
        {service.category.toUpperCase()}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 mb-4 flex-grow">{service.description}</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
        <div className="text-center p-1.5 sm:p-2 bg-white/5 rounded-lg">
          <div className="flex items-center justify-center space-x-1">
            <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-xs sm:text-sm font-bold">
              {service.ratingCount > 0 ? service.rating.toFixed(1) : "N/A"}
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5 sm:mt-1">
            ({service.ratingCount} {service.ratingCount === 1 ? 'rating' : 'ratings'})
          </div>
        </div>

        <div className="text-center p-1.5 sm:p-2 bg-white/5 rounded-lg">
          <div className="flex items-center justify-center">
            <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
            <span className="text-xs sm:text-sm font-bold truncate ml-0.5">
              {parseFloat(service.pricePerRequest.toString()).toFixed(6)} USDC
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5 sm:mt-1">per request</div>
        </div>

        <div className="text-center p-1.5 sm:p-2 bg-white/5 rounded-lg">
          <div className="flex items-center justify-center">
            <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
            <span className="text-xs sm:text-sm font-bold">
              {service.totalRequests >= 1000 
                ? `${(service.totalRequests / 1000).toFixed(1)}k`
                : service.totalRequests}
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5 sm:mt-1">requests</div>
        </div>
      </div>

      {/* CTA Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center space-x-2 group disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
        tabIndex={0}
        aria-label={`Request ${service.name}`}
        onClick={() => {
          // This will be handled by parent component
          if (typeof window !== 'undefined') {
            const event = new CustomEvent('request-service', { detail: { serviceId: service.id } });
            window.dispatchEvent(event);
          }
        }}
      >
        <span>Request Service</span>
        <ExternalLink
          className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${
            isHovered ? "translate-x-1" : ""
          }`}
        />
      </motion.button>
    </GlassCard>
  );
}

