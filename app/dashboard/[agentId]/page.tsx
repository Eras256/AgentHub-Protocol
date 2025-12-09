"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  TrendingUp,
  DollarSign,
  Activity,
  Settings,
  Pause,
  Play,
  Trash2,
  Download,
  LineChart,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import GlassCard from "@/components/effects/GlassCard";
import Link from "next/link";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAgent } from "@/lib/hooks/useAgents";
import { useAddress } from "@thirdweb-dev/react";
import { usePendingRevenue } from "@/lib/hooks/useRevenue";

export default function AgentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const address = useAddress();
  const agentId = params.agentId as string;
  const { data: agentData, isLoading: agentLoading, error: agentError } = useAgent(agentId);
  const { data: pendingRevenue = { creator: "0", staker: "0" } } = usePendingRevenue();
  const [selectedTab, setSelectedTab] = useState<
    "overview" | "transactions" | "performance" | "settings"
  >("overview");

  // Extract original agentId from metadataIPFS or use hashed ID
  const getOriginalAgentId = (hashedId: string, metadataIPFS?: string): string => {
    if (metadataIPFS && metadataIPFS.startsWith('ipfs://') && metadataIPFS.includes('|')) {
      const parts = metadataIPFS.split('|');
      if (parts[0].startsWith('ipfs://')) {
        const extracted = parts[0].replace('ipfs://', '');
        if (extracted.includes('-') && extracted.length > 10) {
          return extracted;
        }
      }
    }
    try {
      if (typeof window !== 'undefined') {
        const agentMappings = JSON.parse(localStorage.getItem('agentIdMappings') || '{}');
        const original = agentMappings[hashedId.toLowerCase()];
        if (original) return original;
      }
    } catch (e) {
      console.warn('Could not read agentId mappings:', e);
    }
    return hashedId.substring(0, 16) + '...';
  };

  // Format agent data from contract
  const agent = agentData ? {
    id: agentId,
    name: getOriginalAgentId(agentId, agentData.metadataIPFS),
    type: "financial",
    trustScore: agentData.trustScore || 0,
    totalEarnings: parseFloat(pendingRevenue.creator) + parseFloat(pendingRevenue.staker),
    transactions: agentData.totalTransactions || 0,
    status: agentData.isActive ? "active" : "paused",
    avatar: "🤖",
    description: `Agent ID: ${getOriginalAgentId(agentId, agentData.metadataIPFS)} | Staked: ${parseFloat(agentData.stakedAmount || "0").toFixed(2)} AVAX | Trust: ${(agentData.trustScore || 0).toFixed(1)}/10`,
    owner: agentData.address || "",
    createdAt: agentData.createdAt ? new Date(agentData.createdAt * 1000).toISOString().split('T')[0] : "Unknown",
    stakedAmount: parseFloat(agentData.stakedAmount || "0"),
  } : null;

  // No performance data available yet - historical tracking not implemented
  const performanceData: any[] = [];

  // No transaction history available yet - transaction tracking not implemented
  const recentTransactions: any[] = [];

  const tabs = [
    { id: "overview", label: "Overview", icon: LineChart },
    { id: "transactions", label: "Transactions", icon: Activity },
    { id: "performance", label: "Performance", icon: TrendingUp },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "yield_deposit":
        return "💰";
      case "yield_withdraw":
        return "💸";
      case "swap":
        return "🔄";
      case "api_call":
        return "🔌";
      default:
        return "📝";
    }
  };

  if (agentLoading) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <GlassCard className="text-center p-12">
            <Loader2 className="w-8 h-8 mx-auto mb-4 text-purple-400 animate-spin" />
            <p className="text-gray-400">Loading agent data from blockchain...</p>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (agentError || !agentData || !agent) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mb-6 flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              tabIndex={0}
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </motion.button>
          </Link>
          <GlassCard className="text-center p-12 border-red-500/30">
            <Bot className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <p className="text-xl text-red-400 mb-2">Agent Not Found</p>
            <p className="text-sm text-gray-400 mb-4">
              {agentError instanceof Error ? agentError.message : "The agent you're looking for doesn't exist or you don't have permission to view it."}
            </p>
            <p className="text-xs text-gray-500">
              Make sure you're connected to Avalanche Fuji testnet and the agent ID is correct.
            </p>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-16 md:pb-20 px-3 sm:px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link href="/dashboard">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mb-4 sm:mb-6 flex items-center space-x-2 text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
            tabIndex={0}
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Back to Dashboard</span>
          </motion.button>
        </Link>

        {/* Agent Header */}
        <GlassCard glow="purple" className="mb-6 sm:mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
              <div className="text-4xl sm:text-5xl md:text-6xl flex-shrink-0">{agent.avatar}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">{agent.name}</h1>
                  <div
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${
                      agent.status === "active"
                        ? "bg-green-500"
                        : "bg-yellow-500"
                    } animate-pulse`}
                  />
                </div>
                <p className="text-sm sm:text-base text-gray-400 mb-2 line-clamp-2">{agent.description}</p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-500">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Created {agent.createdAt}</span>
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="font-mono truncate">{agent.owner}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center space-x-2"
                tabIndex={0}
                aria-label={
                  agent.status === "active" ? "Pause agent" : "Resume agent"
                }
              >
                {agent.status === "active" ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Resume</span>
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors flex items-center space-x-2"
                tabIndex={0}
                aria-label="Delete agent"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </motion.button>
            </div>
          </div>
        </GlassCard>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <GlassCard glow="purple">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
            <div className="text-3xl font-bold mb-1">{agent.trustScore.toFixed(1)}/10</div>
            <div className="text-gray-400 text-sm">Trust Score</div>
          </GlassCard>

          <GlassCard glow="cyan">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-cyan-400" />
            </div>
            <div className="text-3xl font-bold mb-1">
              ${agent.totalEarnings.toFixed(4)}
            </div>
            <div className="text-gray-400 text-sm">Total Earnings (USDC)</div>
          </GlassCard>

          <GlassCard glow="blue">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
            <div className="text-3xl font-bold mb-1">{agent.transactions}</div>
            <div className="text-gray-400 text-sm">Transactions</div>
          </GlassCard>

          <GlassCard glow="pink">
            <div className="flex items-center justify-between mb-2">
              <Bot className="w-8 h-8 text-pink-400" />
              <Download className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold mb-1">
              {agent.stakedAmount} AVAX
            </div>
            <div className="text-gray-400 text-sm">Staked Amount</div>
          </GlassCard>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-4 sm:mb-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-transparent">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base flex items-center space-x-2 transition-all whitespace-nowrap flex-shrink-0 ${
                  selectedTab === tab.id
                    ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
                tabIndex={0}
                aria-label={`View ${tab.label} tab`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{tab.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Tab Content */}
        {selectedTab === "overview" && (
          <div className="space-y-6">
            {/* Performance Chart */}
            <GlassCard>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Earnings Over Time</h2>
              {performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                  <RechartsLineChart data={performanceData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.8)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="earnings"
                      stroke="#a855f7"
                      strokeWidth={3}
                      dot={{ fill: "#a855f7", r: 6 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <LineChart className="w-16 h-16 text-gray-400/50 mb-4" />
                  <p className="text-gray-400 mb-2">No performance data available</p>
                  <p className="text-sm text-gray-500">Historical tracking is not yet implemented</p>
                </div>
              )}
            </GlassCard>

            {/* Recent Activity */}
            <GlassCard>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Recent Activity</h2>
              {recentTransactions.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {recentTransactions.slice(0, 5).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div>
                          <div className="font-medium capitalize">
                            {tx.type.replace("_", " ")} - {tx.protocol}
                          </div>
                          <div className="text-sm text-gray-400">
                            {formatTimestamp(tx.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${tx.amount}</div>
                        {tx.profit > 0 && (
                          <div className="text-sm text-green-400">
                            +${tx.profit}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="w-16 h-16 text-gray-400/50 mb-4" />
                  <p className="text-gray-400 mb-2">No recent transactions</p>
                  <p className="text-sm text-gray-500">Transaction history tracking is not yet implemented</p>
                </div>
              )}
            </GlassCard>
          </div>
        )}

        {selectedTab === "transactions" && (
          <GlassCard>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">All Transactions</h2>
            {recentTransactions.length > 0 ? (
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-2 sm:px-0">
                  <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-white/10">
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium text-xs sm:text-sm">
                      Type
                    </th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium text-xs sm:text-sm">
                      Protocol
                    </th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium text-xs sm:text-sm">
                      Amount
                    </th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium text-xs sm:text-sm">
                      Profit
                    </th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium text-xs sm:text-sm">
                      Status
                    </th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium text-xs sm:text-sm">
                      Time
                    </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                      <td className="py-3 sm:py-4 px-2 sm:px-4">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <span className="text-base sm:text-lg">{getTransactionIcon(tx.type)}</span>
                          <span className="capitalize text-xs sm:text-sm">
                            {tx.type.replace("_", " ")}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm">{tx.protocol}</td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 font-mono text-xs sm:text-sm">${tx.amount}</td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4">
                        {tx.profit > 0 ? (
                          <span className="text-green-400 text-xs sm:text-sm">+${tx.profit}</span>
                        ) : (
                          <span className="text-gray-500 text-xs sm:text-sm">-</span>
                        )}
                      </td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          {tx.status === "success" ? (
                            <>
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                              <span className="text-green-400 text-xs sm:text-sm">Success</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                              <span className="text-red-400 text-xs sm:text-sm">Failed</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-gray-400 text-xs sm:text-sm">
                        {formatTimestamp(tx.timestamp)}
                      </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Activity className="w-16 h-16 text-gray-400/50 mb-4" />
                <p className="text-gray-400 mb-2">No transactions found</p>
                <p className="text-sm text-gray-500">Transaction history tracking is not yet implemented</p>
              </div>
            )}
          </GlassCard>
        )}

        {selectedTab === "performance" && (
          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <GlassCard>
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Trust Score History</h2>
              {performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200} className="sm:h-[250px]">
                  <RechartsLineChart data={performanceData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" domain={[6, 10]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.8)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="trustScore"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      dot={{ fill: "#06b6d4", r: 6 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <TrendingUp className="w-16 h-16 text-gray-400/50 mb-4" />
                  <p className="text-gray-400 mb-2">No performance data available</p>
                  <p className="text-sm text-gray-500">Historical tracking is not yet implemented</p>
                </div>
              )}
            </GlassCard>

            <GlassCard>
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Transaction Volume</h2>
              {performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200} className="sm:h-[250px]">
                  <RechartsLineChart data={performanceData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.8)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="transactions"
                      stroke="#ec4899"
                      strokeWidth={3}
                      dot={{ fill: "#ec4899", r: 6 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="w-16 h-16 text-gray-400/50 mb-4" />
                  <p className="text-gray-400 mb-2">No transaction volume data</p>
                  <p className="text-sm text-gray-500">Historical tracking is not yet implemented</p>
                </div>
              )}
            </GlassCard>
          </div>
        )}

        {selectedTab === "settings" && (
          <GlassCard>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Agent Settings</h2>
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Agent Name
                </label>
                <input
                  type="text"
                  defaultValue={agent.name}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                  tabIndex={0}
                  aria-label="Agent name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  defaultValue={agent.description}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                  tabIndex={0}
                  aria-label="Agent description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Staked Amount
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    defaultValue={agent.stakedAmount}
                    step="0.1"
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                    tabIndex={0}
                    aria-label="Staked amount in AVAX"
                  />
                  <span className="text-gray-400">AVAX</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <div className="font-medium">Automatic Rebalancing</div>
                  <div className="text-sm text-gray-400">
                    Optimize portfolio automatically
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="sr-only peer"
                    tabIndex={0}
                    aria-label="Toggle automatic rebalancing"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <div className="font-medium">Email Notifications</div>
                  <div className="text-sm text-gray-400">
                    Receive alerts for important events
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    tabIndex={0}
                    aria-label="Toggle email notifications"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-semibold"
                tabIndex={0}
                aria-label="Save changes"
              >
                Save Changes
              </motion.button>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

