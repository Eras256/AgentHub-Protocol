"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Bot,
  DollarSign,
  Activity,
  TrendingUp,
  MoreVertical,
  Play,
  Pause,
} from "lucide-react";
import GlassCard from "@/components/effects/GlassCard";

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    type: string;
    trustScore: number;
    totalEarnings: number;
    transactions: number;
    status: "active" | "paused" | "error";
    avatar: string;
    description: string;
  };
}

export default function AgentCard({ agent }: AgentCardProps) {
  const statusColors = {
    active: "bg-green-500",
    paused: "bg-yellow-500",
    error: "bg-red-500",
  };

  const trustScoreColor = (score: number) => {
    if (score >= 8.5) return "text-green-400";
    if (score >= 7) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <GlassCard glow="purple" className="group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="text-4xl">{agent.avatar}</div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-bold">{agent.name}</h3>
              <div
                className={`w-2 h-2 rounded-full ${statusColors[agent.status]} animate-pulse`}
              />
            </div>
            <p className="text-sm text-gray-400">{agent.description}</p>
          </div>
        </div>

        <button
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="More options"
          tabIndex={0}
        >
          <MoreVertical className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-white/5 rounded-lg">
          <div
            className={`text-2xl font-bold ${trustScoreColor(agent.trustScore)}`}
          >
            {agent.trustScore}/10
          </div>
          <div className="text-xs text-gray-400 mt-1">Trust Score</div>
        </div>

        <div className="text-center p-3 bg-white/5 rounded-lg">
          <div className="text-2xl font-bold text-cyan-400">
            ${agent.totalEarnings}
          </div>
          <div className="text-xs text-gray-400 mt-1">Earnings</div>
        </div>

        <div className="text-center p-3 bg-white/5 rounded-lg">
          <div className="text-2xl font-bold text-purple-400">
            {agent.transactions}
          </div>
          <div className="text-xs text-gray-400 mt-1">Transactions</div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Link href={`/dashboard/${agent.id}`} className="flex-1">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-medium text-sm"
            tabIndex={0}
            aria-label={`View details for ${agent.name}`}
          >
            View Details
          </motion.button>
        </Link>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          aria-label={agent.status === "active" ? "Pause agent" : "Play agent"}
          tabIndex={0}
        >
          {agent.status === "active" ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </motion.button>
      </div>
    </GlassCard>
  );
}
