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

export default function AgentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<
    "overview" | "transactions" | "performance" | "settings"
  >("overview");

  // Mock data - replace with real contract calls
  const agent = {
    id: params.agentId,
    name: "DeFi Optimizer Pro",
    type: "financial",
    trustScore: 9.2,
    totalEarnings: 67.89,
    transactions: 543,
    status: "active",
    avatar: "🤖",
    description: "Optimizes DeFi yields across Trader Joe and Benqi",
    owner: "0x1234...5678",
    createdAt: "2025-11-15",
    stakedAmount: 1.5,
  };

  const performanceData = [
    { date: "Nov 15", earnings: 2.3, transactions: 15, trustScore: 7.5 },
    { date: "Nov 18", earnings: 4.7, transactions: 23, trustScore: 7.8 },
    { date: "Nov 21", earnings: 8.2, transactions: 35, trustScore: 8.1 },
    { date: "Nov 24", earnings: 12.5, transactions: 47, trustScore: 8.5 },
    { date: "Nov 27", earnings: 18.9, transactions: 62, trustScore: 8.9 },
    { date: "Nov 30", earnings: 25.4, transactions: 78, trustScore: 9.2 },
  ];

  const recentTransactions = [
    {
      id: "1",
      type: "yield_deposit",
      protocol: "Trader Joe",
      amount: 45.67,
      status: "success",
      timestamp: "2025-12-01T18:23:00Z",
      gasUsed: 0.0012,
      profit: 2.34,
    },
    {
      id: "2",
      type: "swap",
      protocol: "Benqi",
      amount: 23.45,
      status: "success",
      timestamp: "2025-12-01T17:45:00Z",
      gasUsed: 0.0008,
      profit: 1.12,
    },
    {
      id: "3",
      type: "api_call",
      protocol: "Chainlink Oracle",
      amount: 0.001,
      status: "success",
      timestamp: "2025-12-01T17:30:00Z",
      gasUsed: 0.0003,
      profit: 0,
    },
    {
      id: "4",
      type: "yield_withdraw",
      protocol: "Aave",
      amount: 67.89,
      status: "success",
      timestamp: "2025-12-01T16:12:00Z",
      gasUsed: 0.0015,
      profit: 3.45,
    },
    {
      id: "5",
      type: "swap",
      protocol: "Trader Joe",
      amount: 12.34,
      status: "failed",
      timestamp: "2025-12-01T15:40:00Z",
      gasUsed: 0.0005,
      profit: 0,
    },
  ];

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

  return (
    <div className="min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
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

        {/* Agent Header */}
        <GlassCard glow="purple" className="mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="text-6xl">{agent.avatar}</div>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold">{agent.name}</h1>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      agent.status === "active"
                        ? "bg-green-500"
                        : "bg-yellow-500"
                    } animate-pulse`}
                  />
                </div>
                <p className="text-gray-400 mb-2">{agent.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Created {agent.createdAt}</span>
                  </span>
                  <span>•</span>
                  <span className="font-mono">{agent.owner}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <GlassCard glow="purple">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-purple-400" />
              <span className="text-green-400 text-sm">+0.3</span>
            </div>
            <div className="text-3xl font-bold mb-1">{agent.trustScore}/10</div>
            <div className="text-gray-400 text-sm">Trust Score</div>
          </GlassCard>

          <GlassCard glow="cyan">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-cyan-400" />
              <span className="text-green-400 text-sm">+12.3%</span>
            </div>
            <div className="text-3xl font-bold mb-1">
              ${agent.totalEarnings}
            </div>
            <div className="text-gray-400 text-sm">Total Earnings</div>
          </GlassCard>

          <GlassCard glow="blue">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-blue-400" />
              <span className="text-green-400 text-sm">+8.7%</span>
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
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-all whitespace-nowrap ${
                  selectedTab === tab.id
                    ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
                tabIndex={0}
                aria-label={`View ${tab.label} tab`}
              >
                <Icon className="w-5 h-5" />
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
              <h2 className="text-2xl font-bold mb-6">Earnings Over Time</h2>
              <ResponsiveContainer width="100%" height={300}>
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
            </GlassCard>

            {/* Recent Activity */}
            <GlassCard>
              <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
              <div className="space-y-3">
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
            </GlassCard>
          </div>
        )}

        {selectedTab === "transactions" && (
          <GlassCard>
            <h2 className="text-2xl font-bold mb-6">All Transactions</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Protocol
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Profit
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
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
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <span>{getTransactionIcon(tx.type)}</span>
                          <span className="capitalize">
                            {tx.type.replace("_", " ")}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">{tx.protocol}</td>
                      <td className="py-4 px-4 font-mono">${tx.amount}</td>
                      <td className="py-4 px-4">
                        {tx.profit > 0 ? (
                          <span className="text-green-400">+${tx.profit}</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {tx.status === "success" ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-green-400">Success</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-red-400" />
                              <span className="text-red-400">Failed</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-400 text-sm">
                        {formatTimestamp(tx.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {selectedTab === "performance" && (
          <div className="grid md:grid-cols-2 gap-6">
            <GlassCard>
              <h2 className="text-xl font-bold mb-4">Trust Score History</h2>
              <ResponsiveContainer width="100%" height={250}>
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
            </GlassCard>

            <GlassCard>
              <h2 className="text-xl font-bold mb-4">Transaction Volume</h2>
              <ResponsiveContainer width="100%" height={250}>
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
            </GlassCard>
          </div>
        )}

        {selectedTab === "settings" && (
          <GlassCard>
            <h2 className="text-2xl font-bold mb-6">Agent Settings</h2>
            <div className="space-y-6">
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

