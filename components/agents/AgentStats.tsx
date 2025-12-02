"use client";

import { TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react";
import GlassCard from "@/components/effects/GlassCard";

interface AgentStatsProps {
  totalEarnings: number;
  totalTransactions: number;
  avgTrustScore: number;
  change24h: {
    earnings: number;
    transactions: number;
    trustScore: number;
  };
}

export default function AgentStats({
  totalEarnings,
  totalTransactions,
  avgTrustScore,
  change24h,
}: AgentStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <GlassCard glow="cyan">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Earnings</p>
            <p className="text-2xl font-bold">${totalEarnings}</p>
            <div
              className={`text-xs mt-1 flex items-center ${
                change24h.earnings > 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {change24h.earnings > 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {Math.abs(change24h.earnings)}%
            </div>
          </div>
          <DollarSign className="w-8 h-8 text-cyan-400" />
        </div>
      </GlassCard>

      <GlassCard glow="purple">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Transactions</p>
            <p className="text-2xl font-bold">{totalTransactions}</p>
            <div
              className={`text-xs mt-1 flex items-center ${
                change24h.transactions > 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {change24h.transactions > 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {Math.abs(change24h.transactions)}%
            </div>
          </div>
          <Activity className="w-8 h-8 text-purple-400" />
        </div>
      </GlassCard>

      <GlassCard glow="pink">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Avg Trust Score</p>
            <p className="text-2xl font-bold">{avgTrustScore}/10</p>
            <div
              className={`text-xs mt-1 flex items-center ${
                change24h.trustScore > 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {change24h.trustScore > 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              +{change24h.trustScore}
            </div>
          </div>
          <TrendingUp className="w-8 h-8 text-pink-400" />
        </div>
      </GlassCard>
    </div>
  );
}

