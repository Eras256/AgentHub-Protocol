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
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-bold">{service.name}</h3>
            {service.verified && (
              <CheckCircle className="w-4 h-4 text-cyan-400" />
            )}
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span>{service.providerName}</span>
            <span>•</span>
            <span className="font-mono text-xs">{service.provider}</span>
          </div>
        </div>

        {featured && (
          <div className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-semibold">
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
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-white/5 rounded-lg">
          <div className="flex items-center justify-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-bold">{service.rating}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">({service.ratingCount})</div>
        </div>

        <div className="text-center p-2 bg-white/5 rounded-lg">
          <div className="flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold">{service.pricePerRequest}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">per call</div>
        </div>

        <div className="text-center p-2 bg-white/5 rounded-lg">
          <div className="flex items-center justify-center">
            <Activity className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-bold">
              {(service.totalRequests / 1000).toFixed(1)}k
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-1">requests</div>
        </div>
      </div>

      {/* CTA Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-medium text-sm flex items-center justify-center space-x-2 group"
        tabIndex={0}
        aria-label={`Request ${service.name}`}
      >
        <span>Request Service</span>
        <ExternalLink
          className={`w-4 h-4 transition-transform ${
            isHovered ? "translate-x-1" : ""
          }`}
        />
      </motion.button>
    </GlassCard>
  );
}

