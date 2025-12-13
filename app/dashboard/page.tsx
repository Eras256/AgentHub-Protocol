"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { motion } from "framer-motion";
import { useAddress } from "@thirdweb-dev/react";
import {
  Bot,
  TrendingUp,
  DollarSign,
  Activity,
  Plus,
  Loader2,
} from "lucide-react";
import GlassCard from "@/components/effects/GlassCard";
import AgentCard from "@/components/agents/AgentCard";
import AIInsights from "@/components/dashboard/AIInsights";
import Link from "next/link";
import { useAgents } from "@/lib/hooks/useAgents";
import { useConsumerRequests } from "@/lib/hooks/useMarketplace";
import { usePendingRevenue, useClaimCreatorRevenue } from "@/lib/hooks/useRevenue";
import { filterIoTAgents } from "@/lib/hooks/useIoT";
import IoTDeviceCard from "@/components/iot/IoTDeviceCard";
import { DollarSign as DollarSignIcon } from "lucide-react";

export default function DashboardPage() {
  const address = useAddress();
  const { data: agents = [], isLoading: agentsLoading, error: agentsError } = useAgents();
  
  // Debug logging
  if (typeof window !== 'undefined') {
    console.log("Dashboard - Address:", address);
    console.log("Dashboard - Agents:", agents);
    console.log("Dashboard - Loading:", agentsLoading);
    console.log("Dashboard - Error:", agentsError);
  }
  const { data: requests = [] } = useConsumerRequests();
  const { data: pendingRevenue = { creator: "0", staker: "0" } } = usePendingRevenue();
  const claimRevenueMutation = useClaimCreatorRevenue();
  const [selectedPeriod, setSelectedPeriod] = useState<
    "24h" | "7d" | "30d" | "all"
  >("7d");

  // Filter IoT devices
  const iotDevices = filterIoTAgents(agents);
  const regularAgents = agents.filter((agent: any) => !iotDevices.includes(agent));

  // Calculate stats from real contract data
  const totalEarnings = parseFloat(pendingRevenue.creator) + parseFloat(pendingRevenue.staker);
  const dashboardStats = {
    totalAgents: agents.length,
    iotDevices: iotDevices.length,
    totalEarnings: totalEarnings,
    totalTransactions: agents.reduce((sum: number, agent: any) => sum + (agent.totalTransactions || 0), 0),
    avgTrustScore: agents.length > 0 
      ? agents.reduce((sum: number, agent: any) => sum + (agent.trustScore || 0), 0) / agents.length 
      : 0,
    change24h: {
      earnings: 0, // Historical data calculation not yet implemented
      transactions: 0, // Historical data calculation not yet implemented
      trustScore: 0, // Historical data calculation not yet implemented
    },
  };

  const handleClaimRevenue = async () => {
    if (parseFloat(pendingRevenue.creator) <= 0) {
      alert("No pending revenue to claim");
      return;
    }

    try {
      const receipt = await claimRevenueMutation.mutateAsync();
      alert(`✅ Revenue claimed successfully! Transaction: ${receipt.hash}`);
    } catch (error: any) {
      console.error("Error claiming revenue:", error);
      alert(`Error: ${error.message || "Failed to claim revenue"}`);
    }
  };

  // Convert contract agents to dashboard format - ONLY use real contract data
  const myAgents = agents
    .filter((agent: any) => {
      // Only include agents with valid data from contract
      return agent && agent.agentId && agent.address && agent.isActive !== undefined;
    })
    .map((agent: any, index: number) => {
      const stakedAmount = parseFloat(agent.stakedAmount || "0");
      return {
        id: agent.agentId, // Use hashed agentId for contract calls
        name: agent.originalAgentId || `Agent ${index + 1}`, // Use original readable ID for display
        type: "financial" as const,
        trustScore: agent.trustScore || 0,
        totalEarnings: 0, // Real data: Will be fetched from RevenueDistributor in future
        transactions: agent.totalTransactions || 0, // Real data from contract
        status: agent.isActive ? ("active" as const) : ("paused" as const), // Real data from contract
        avatar: "🤖",
        description: `Agent ID: ${agent.originalAgentId || agent.agentId?.substring(0, 16)}... | Staked: ${stakedAmount.toFixed(2)} AVAX | Trust: ${(agent.trustScore || 0).toFixed(1)}/10`,
        address: agent.address, // Real owner address from contract
        agentId: agent.agentId, // Hashed ID for contract operations
        originalAgentId: agent.originalAgentId, // Original readable ID
        stakedAmount: agent.stakedAmount,
        isActive: agent.isActive,
        totalTransactions: agent.totalTransactions || 0,
        successfulTransactions: agent.successfulTransactions || 0,
        createdAt: agent.createdAt || 0,
        metadataIPFS: agent.metadataIPFS,
        kitePoAIHash: agent.kitePoAIHash, // Kite Chain PoAI proof hash
      };
    });

  // Filter IoT devices from myAgents
  const iotDevicesFiltered = filterIoTAgents(myAgents);
  const regularAgentsFiltered = myAgents.filter((agent: any) => !iotDevicesFiltered.includes(agent));

  // Convert requests to recent activity
  type ActivityType = {
    type: string;
    agent: string;
    amount?: number;
    description?: string;
    change?: number;
    time: string;
  };

  const recentActivity: ActivityType[] = requests
    .slice(0, 4)
    .map((request: any) => ({
      type: request.completed ? "payment" : "transaction",
      agent: `Service Request`,
      amount: request.completed ? parseFloat(request.amount) : undefined,
      description: request.completed ? `Rated ${request.rating}/5` : "Service requested",
      time: new Date(request.timestamp * 1000).toLocaleString(),
    }));

  if (!address) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-20">
        <GlassCard className="max-w-md text-center">
          <Bot className="w-16 h-16 mx-auto mb-4 text-purple-400" />
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">
            Connect your wallet to view and manage your AI agents
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-16 md:pb-20 px-3 sm:px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-400">Manage your autonomous AI agents</p>
          </div>
          <Link href="/create-agent" className="w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-semibold text-sm sm:text-base flex items-center justify-center space-x-2 shadow-[0_0_30px_rgba(168,85,247,0.3)]"
              tabIndex={0}
              aria-label="Create New Agent"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Create New Agent</span>
            </motion.button>
          </Link>
        </div>

        {/* AI Insights - Only show if we have real data */}
        {agents.length > 0 && (
          <AIInsights
            portfolio={{}}
            protocols={["Trader Joe", "Benqi", "Aave"]}
            onExecute={(insight) => {
              // This is handled internally by AIInsights component
              // It will use useDeFiAgent hook to execute real operations
              console.log("Insight execution triggered:", insight);
            }}
          />
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <GlassCard glow="purple">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-600/20 rounded-lg">
                <Bot className="w-6 h-6 text-purple-400" />
              </div>
              <span
                className={`text-sm ${
                  dashboardStats.change24h.earnings > 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {dashboardStats.change24h.earnings > 0 ? "+" : ""}
                {dashboardStats.change24h.earnings}%
              </span>
            </div>
            <div className="text-3xl font-bold mb-1">
              {dashboardStats.totalAgents}
            </div>
            <div className="text-gray-400 text-sm">Active Agents</div>
          </GlassCard>

          <GlassCard glow="cyan">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-cyan-600/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-cyan-400" />
              </div>
              {parseFloat(pendingRevenue.creator) > 0 && (
                <button
                  onClick={handleClaimRevenue}
                  disabled={claimRevenueMutation.isPending}
                  className="px-3 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  title="Claim pending revenue"
                >
                  {claimRevenueMutation.isPending ? "Claiming..." : "Claim"}
                </button>
              )}
            </div>
            <div className="text-3xl font-bold mb-1">
              ${dashboardStats.totalEarnings.toFixed(4)}
            </div>
            <div className="text-gray-400 text-sm">
              Total Earnings (USDC)
              {parseFloat(pendingRevenue.creator) > 0 && (
                <span className="block text-xs text-cyan-400 mt-1">
                  {parseFloat(pendingRevenue.creator).toFixed(4)} pending
                </span>
              )}
            </div>
          </GlassCard>

          <GlassCard glow="blue">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-600/20 rounded-lg">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
              <span
                className={`text-sm ${
                  dashboardStats.change24h.transactions > 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                +{dashboardStats.change24h.transactions}%
              </span>
            </div>
            <div className="text-3xl font-bold mb-1">
              {dashboardStats.totalTransactions.toLocaleString()}
            </div>
            <div className="text-gray-400 text-sm">Transactions</div>
          </GlassCard>

          <GlassCard glow="pink">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-pink-600/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-pink-400" />
              </div>
              <span
                className={`text-sm ${
                  dashboardStats.change24h.trustScore > 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                +{dashboardStats.change24h.trustScore}
              </span>
            </div>
            <div className="text-3xl font-bold mb-1">
              {dashboardStats.avgTrustScore}/10
            </div>
            <div className="text-gray-400 text-sm">Avg Trust Score</div>
          </GlassCard>

          {dashboardStats.iotDevices > 0 && (
            <GlassCard glow="cyan">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-cyan-600/20 rounded-lg">
                  <Bot className="w-6 h-6 text-cyan-400" />
                </div>
                <span className="text-sm text-cyan-400">
                  Active
                </span>
              </div>
              <div className="text-3xl font-bold mb-1">
                {dashboardStats.iotDevices}
              </div>
              <div className="text-gray-400 text-sm">IoT Devices</div>
            </GlassCard>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* My Agents */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <h2 className="text-xl sm:text-2xl font-bold">My Agents</h2>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {(["24h", "7d", "30d", "all"] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-all ${
                      selectedPeriod === period
                        ? "bg-purple-600 text-white"
                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                    }`}
                    tabIndex={0}
                    aria-label={`Filter by ${period}`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {agentsLoading ? (
              <GlassCard className="text-center p-12">
                <Loader2 className="w-8 h-8 mx-auto mb-4 text-purple-400 animate-spin" />
                <p className="text-gray-400">Loading your agents from blockchain...</p>
              </GlassCard>
            ) : agentsError ? (
              <GlassCard className="text-center p-12 border-red-500/30">
                <p className="text-xl text-red-400 mb-2">Error loading agents</p>
                <p className="text-sm text-gray-400 mb-4">
                  {agentsError instanceof Error ? agentsError.message : "Unknown error"}
                </p>
                <p className="text-xs text-gray-500">
                  Make sure you&apos;re connected to Avalanche Fuji testnet
                </p>
              </GlassCard>
            ) : myAgents.length === 0 ? (
              <GlassCard className="text-center p-12">
                <Bot className="w-12 h-12 mx-auto mb-4 text-purple-400" />
                <p className="text-xl text-gray-400 mb-2">No agents registered yet</p>
                <p className="text-sm text-gray-500 mb-6">
                  Create your first AI agent to get started. You can create multiple agents per wallet address, each with a unique agent ID.
                </p>
                <Link href="/create-agent">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-semibold"
                  >
                    Create Agent
                  </motion.button>
                </Link>
              </GlassCard>
            ) : (
              <div className="space-y-6">
                {/* IoT Devices Section */}
                {iotDevicesFiltered.length > 0 && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center space-x-2">
                      <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                      <span>IoT Devices ({iotDevicesFiltered.length})</span>
                    </h3>
                    <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                      {iotDevicesFiltered.map((device: any, index: number) => (
                        <motion.div
                          key={device.agentId || device.id || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <IoTDeviceCard
                            agentId={device.agentId || device.id || ""}
                            agentName={device.originalAgentId || device.name}
                            trustScore={device.trustScore || 0}
                            isActive={device.isActive !== false}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Regular Agents Section */}
                {regularAgentsFiltered.length > 0 && (
                  <div>
                    {iotDevicesFiltered.length > 0 && (
                      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">AI Agents ({regularAgentsFiltered.length})</h3>
                    )}
                    <div className="space-y-3 sm:space-y-4">
                      {regularAgentsFiltered.map((agent, index) => (
                        <motion.div
                          key={agent.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <AgentCard agent={agent} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {iotDevicesFiltered.length === 0 && regularAgentsFiltered.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    No agents found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Recent Activity</h2>
            <GlassCard className="space-y-3 sm:space-y-4">
              {recentActivity.map((activity: ActivityType, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3 pb-4 border-b border-white/10 last:border-0 last:pb-0"
                >
                  <div
                    className={`p-2 rounded-lg ${
                      activity.type === "payment"
                        ? "bg-green-600/20"
                        : activity.type === "transaction"
                        ? "bg-blue-600/20"
                        : "bg-purple-600/20"
                    }`}
                  >
                    {activity.type === "payment" && (
                      <DollarSign className="w-4 h-4 text-green-400" />
                    )}
                    {activity.type === "transaction" && (
                      <Activity className="w-4 h-4 text-blue-400" />
                    )}
                    {activity.type === "reputation" && (
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{activity.agent}</div>
                    <div className="text-xs text-gray-400">
                      {"amount" in activity && `+$${activity.amount} USDC`}
                      {"description" in activity && activity.description}
                      {"change" in activity && activity.change !== undefined &&
                        `Trust score ${activity.change > 0 ? "+" : ""}${activity.change}`}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {activity.time}
                    </div>
                  </div>
                </motion.div>
              ))}
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}

