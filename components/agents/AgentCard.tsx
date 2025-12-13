"use client";

import { useState } from "react";
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
  Plus,
  Loader2,
} from "lucide-react";
import GlassCard from "@/components/effects/GlassCard";
import { useAddStake } from "@/lib/hooks/useAgents";
import { useSDK, useAddress } from "@thirdweb-dev/react";
import PoAIHashDisplay from "@/components/agents/PoAIHashDisplay";

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
    agentId?: string; // Optional agentId for contract operations
    kitePoAIHash?: string; // Kite Chain PoAI proof hash
  };
}

export default function AgentCard({ agent }: AgentCardProps) {
  const [showAddStake, setShowAddStake] = useState(false);
  const [stakeAmount, setStakeAmount] = useState("");
  const [isAddingStake, setIsAddingStake] = useState(false);
  const address = useAddress();
  const sdk = useSDK();
  const addStakeMutation = useAddStake();

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

  const handleAddStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (!agent.agentId && !agent.id) {
      alert("Error: Agent ID not found");
      return;
    }

    try {
      setIsAddingStake(true);
      // Use agentId if available, otherwise fall back to id
      const agentId = agent.agentId || agent.id;
      const receipt = await addStakeMutation.mutateAsync({ agentId, amount: stakeAmount });
      alert(`✅ Stake added successfully! Transaction: ${receipt.hash}`);
      setStakeAmount("");
      setShowAddStake(false);
    } catch (error: any) {
      console.error("Error adding stake:", error);
      alert(`Error: ${error.message || "Failed to add stake"}`);
    } finally {
      setIsAddingStake(false);
    }
  };

  return (
    <GlassCard glow="purple" className="group">
      <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
          <div className="text-2xl sm:text-3xl md:text-4xl flex-shrink-0">{agent.avatar}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg md:text-xl font-bold truncate">{agent.name}</h3>
              <div
                className={`w-2 h-2 rounded-full ${statusColors[agent.status]} animate-pulse flex-shrink-0`}
              />
            </div>
            <p className="text-xs sm:text-sm text-gray-400 line-clamp-2">{agent.description}</p>
          </div>
        </div>

        <button
          className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 touch-manipulation"
          aria-label="More options"
          tabIndex={0}
        >
          <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
        <div className="text-center p-2 sm:p-3 bg-white/5 rounded-lg">
          <div
            className={`text-lg sm:text-xl md:text-2xl font-bold ${trustScoreColor(agent.trustScore)}`}
          >
            {agent.trustScore}/10
          </div>
          <div className="text-xs text-gray-400 mt-1">Trust Score</div>
        </div>

        <div className="text-center p-2 sm:p-3 bg-white/5 rounded-lg">
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-cyan-400">
            ${agent.totalEarnings}
          </div>
          <div className="text-xs text-gray-400 mt-1">Earnings</div>
        </div>

        <div className="text-center p-2 sm:p-3 bg-white/5 rounded-lg">
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-400">
            {agent.transactions}
          </div>
          <div className="text-xs text-gray-400 mt-1">Transactions</div>
        </div>
      </div>

      {/* PoAI Hash Display */}
      {agent.kitePoAIHash && (
        <div className="mt-3 sm:mt-4">
          <PoAIHashDisplay 
            kitePoAIHash={agent.kitePoAIHash} 
            compact={true}
          />
        </div>
      )}

      {showAddStake ? (
        <div className="space-y-2 sm:space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="Amount (AVAX)"
              className="flex-1 px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
            />
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddStake}
                disabled={isAddingStake || addStakeMutation.isPending}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-medium text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1 sm:space-x-2"
              >
                {isAddingStake || addStakeMutation.isPending ? (
                  <>
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Add</span>
                  </>
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowAddStake(false);
                  setStakeAmount("");
                }}
                className="px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-xs sm:text-sm"
              >
                Cancel
              </motion.button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Link href={`/dashboard/${agent.id}`} className="flex-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-medium text-xs sm:text-sm"
              tabIndex={0}
              aria-label={`View details for ${agent.name}`}
            >
              View Details
            </motion.button>
          </Link>

          {address && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddStake(true)}
              className="px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors touch-manipulation"
              aria-label="Add stake"
              tabIndex={0}
              title="Add stake to improve reputation"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors touch-manipulation"
            aria-label={agent.status === "active" ? "Pause agent" : "Play agent"}
            tabIndex={0}
          >
            {agent.status === "active" ? (
              <Pause className="w-3 h-3 sm:w-4 sm:h-4" />
            ) : (
              <Play className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
          </motion.button>
        </div>
      )}
    </GlassCard>
  );
}
