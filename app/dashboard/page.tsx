"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAddress } from "@thirdweb-dev/react";
import {
  Bot,
  TrendingUp,
  DollarSign,
  Activity,
  Plus,
} from "lucide-react";
import GlassCard from "@/components/effects/GlassCard";
import AgentCard from "@/components/agents/AgentCard";
import AIInsights from "@/components/dashboard/AIInsights";
import Link from "next/link";

export default function DashboardPage() {
  const address = useAddress();
  const [selectedPeriod, setSelectedPeriod] = useState<
    "24h" | "7d" | "30d" | "all"
  >("7d");

  // Mock data - replace with real contract calls
  const dashboardStats = {
    totalAgents: 3,
    totalEarnings: 145.67,
    totalTransactions: 1247,
    avgTrustScore: 8.5,
    change24h: {
      earnings: +12.3,
      transactions: +8.7,
      trustScore: +0.4,
    },
  };

  const myAgents = [
    {
      id: "1",
      name: "DeFi Optimizer Pro",
      type: "financial",
      trustScore: 9.2,
      totalEarnings: 67.89,
      transactions: 543,
      status: "active" as const,
      avatar: "🤖",
      description: "Optimizes DeFi yields across Trader Joe and Benqi",
    },
    {
      id: "2",
      name: "Market Analyzer",
      type: "data",
      trustScore: 8.7,
      totalEarnings: 45.23,
      transactions: 432,
      status: "active" as const,
      avatar: "📊",
      description: "Real-time market analysis and price predictions",
    },
    {
      id: "3",
      name: "IoT Monitor",
      type: "iot",
      trustScore: 7.6,
      totalEarnings: 32.55,
      transactions: 272,
      status: "paused" as const,
      avatar: "🌡️",
      description: "Temperature monitoring and alert system",
    },
  ];

  const recentActivity = [
    {
      type: "payment",
      agent: "DeFi Optimizer Pro",
      amount: 0.05,
      time: "2 mins ago",
    },
    {
      type: "transaction",
      agent: "Market Analyzer",
      description: "API call completed",
      time: "15 mins ago",
    },
    {
      type: "reputation",
      agent: "DeFi Optimizer Pro",
      change: +0.2,
      time: "1 hour ago",
    },
    {
      type: "payment",
      agent: "Market Analyzer",
      amount: 0.03,
      time: "2 hours ago",
    },
  ];

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
    <div className="min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-gray-400">Manage your autonomous AI agents</p>
          </div>
          <Link href="/create-agent">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-semibold flex items-center space-x-2 shadow-[0_0_30px_rgba(168,85,247,0.3)]"
              tabIndex={0}
              aria-label="Create New Agent"
            >
              <Plus className="w-5 h-5" />
              <span>Create New Agent</span>
            </motion.button>
          </Link>
        </div>

        {/* AI Insights */}
        <AIInsights
          portfolio={{
            benqi: { balance: 1000, apy: 8.5 },
            traderJoe: { balance: 500, apy: 11.2 },
            aave: { balance: 300, apy: 7.8 },
          }}
          protocols={["Trader Joe", "Benqi", "Aave"]}
          onExecute={(insight) => {
            console.log("Executing insight:", insight);
            // In real implementation, this would trigger x402 payment
          }}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <span
                className={`text-sm ${
                  dashboardStats.change24h.earnings > 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                +{dashboardStats.change24h.earnings}%
              </span>
            </div>
            <div className="text-3xl font-bold mb-1">
              ${dashboardStats.totalEarnings}
            </div>
            <div className="text-gray-400 text-sm">Total Earnings (USDC)</div>
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
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* My Agents */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">My Agents</h2>
              <div className="flex space-x-2">
                {(["24h", "7d", "30d", "all"] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 py-1 rounded-lg text-sm transition-all ${
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

            <div className="space-y-4">
              {myAgents.map((agent, index) => (
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

          {/* Recent Activity */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
            <GlassCard className="space-y-4">
              {recentActivity.map((activity, index) => (
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
                      {"change" in activity &&
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

