"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { motion } from "framer-motion";
import { useAddress, useSDK } from "@thirdweb-dev/react";
import { usePublishService } from "@/lib/hooks/useMarketplace";
import { useAgents } from "@/lib/hooks/useAgents";
import { useRouter } from "next/navigation";
import { ArrowLeft, Zap, Loader2, Bot, Info } from "lucide-react";
import GlassCard from "@/components/effects/GlassCard";
import Link from "next/link";
import SuccessModal from "@/components/ui/SuccessModal";

export default function PublishServicePage() {
  const router = useRouter();
  const address = useAddress();
  const sdk = useSDK();
  const publishServiceMutation = usePublishService();
  const { data: agents = [] } = useAgents();
  const [isPublishing, setIsPublishing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    endpointURL: "",
    pricePerRequest: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address || !sdk) {
      alert("Please connect your wallet first");
      return;
    }

    if (!formData.name || !formData.description || !formData.endpointURL || !formData.pricePerRequest) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setIsPublishing(true);
      const receipt = await publishServiceMutation.mutateAsync({
        name: formData.name,
        description: formData.description,
        endpointURL: formData.endpointURL,
        pricePerRequest: formData.pricePerRequest,
      });

      // Get transaction hash - ethers v5 uses transactionHash, v6 uses hash
      const txHash = receipt.transactionHash || receipt.hash || receipt.transaction?.hash;
      console.log("Service published:", { txHash, receipt });
      if (!txHash) {
        console.error("No transaction hash found in receipt:", receipt);
      }
      setTransactionHash(txHash || "");
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Error publishing service:", error);
      alert(`Error: ${error.message || "Failed to publish service"}`);
    } finally {
      setIsPublishing(false);
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-20">
        <GlassCard className="max-w-md text-center">
          <Zap className="w-16 h-16 mx-auto mb-4 text-purple-400" />
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">
            Connect your wallet to publish services on-chain
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-16 md:pb-20 px-3 sm:px-4 md:px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/marketplace">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mb-6 sm:mb-8 flex items-center space-x-2 text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Back to Marketplace</span>
          </motion.button>
        </Link>

        <GlassCard>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Publish Service
            </span>
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">
            Create a service that your AI agent can provide. Services are API endpoints that others can request and pay for with USDC.
          </p>

          {/* Agent Selection */}
          {agents.length > 0 && (
            <GlassCard className="mb-6 border-cyan-500/30">
              <div className="flex items-start space-x-3 mb-4">
                <Bot className="w-5 h-5 text-cyan-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 text-white">Associate with Agent (Optional)</h3>
                  <p className="text-xs text-gray-300 mb-3">
                    Select an agent from the list or enter the agent ID manually. The endpoint URL should point to where this agent&apos;s service is running.
                  </p>
                  
                  {/* Manual ID Input */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium mb-2 text-white">
                      Agent ID (Manual Entry)
                    </label>
                    <input
                      type="text"
                      value={selectedAgentId}
                      onChange={(e) => {
                        setSelectedAgentId(e.target.value);
                        // Try to find agent by ID to suggest endpoint
                        const agent = agents.find((a: any) => 
                          a.agentId.toLowerCase() === e.target.value.toLowerCase() ||
                          a.agentId === e.target.value ||
                          (a.originalAgentId && a.originalAgentId.toLowerCase() === e.target.value.toLowerCase())
                        );
                        if (agent && !formData.endpointURL) {
                          setFormData({
                            ...formData,
                            endpointURL: `https://api.yourdomain.com/agent/${agent.agentId.substring(0, 16)}`,
                          });
                        }
                      }}
                      placeholder="Enter agent ID (e.g., 0x1234... or agent-123-456)"
                      className="w-full px-4 py-2.5 bg-white/10 border-2 border-cyan-500/40 rounded-lg focus:outline-none focus:border-cyan-500 focus:bg-white/15 text-sm text-white placeholder:text-gray-400"
                    />
                  </div>

                  {/* Dropdown Selection */}
                  <div>
                    <label className="block text-xs font-medium mb-2 text-white">
                      Or Select from Your Agents
                    </label>
                    <select
                      value={selectedAgentId}
                      onChange={(e) => {
                        setSelectedAgentId(e.target.value);
                        const agent = agents.find((a: any) => a.agentId === e.target.value);
                        if (agent && !formData.endpointURL) {
                          // Suggest endpoint based on agent
                          setFormData({
                            ...formData,
                            endpointURL: `https://api.yourdomain.com/agent/${agent.agentId.substring(0, 16)}`,
                          });
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-white/10 border-2 border-cyan-500/40 rounded-lg focus:outline-none focus:border-cyan-500 focus:bg-white/15 text-sm text-white"
                    >
                      <option value="" className="bg-gray-900 text-gray-300">No agent selected</option>
                      {agents.map((agent: any) => (
                        <option key={agent.agentId} value={agent.agentId} className="bg-gray-900 text-white">
                          {agent.originalAgentId || agent.agentId.substring(0, 16)}... (Trust: {(agent.trustScore || 0).toFixed(1)}/10)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {agents.length === 0 && (
            <GlassCard className="mb-6 border-yellow-500/30 bg-yellow-600/10">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-1 text-yellow-400">No Agents Found</h3>
                  <p className="text-xs text-gray-400 mb-3">
                    You don&apos;t have any registered agents yet. You can enter an agent ID manually or create a new agent.
                  </p>
                  
                  {/* Manual ID Input when no agents */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium mb-2 text-white">
                      Agent ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={selectedAgentId}
                      onChange={(e) => setSelectedAgentId(e.target.value)}
                      placeholder="Enter agent ID (e.g., 0x1234... or agent-123-456)"
                      className="w-full px-4 py-2.5 bg-white/10 border-2 border-cyan-500/40 rounded-lg focus:outline-none focus:border-cyan-500 focus:bg-white/15 text-sm text-white placeholder:text-gray-400"
                    />
                  </div>

                  <Link href="/create-agent">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-medium text-sm"
                    >
                      Create Agent First
                    </motion.button>
                  </Link>
                </div>
              </div>
            </GlassCard>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Service Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="AI Trading Bot"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what your service does..."
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Endpoint URL *
              </label>
              <input
                type="url"
                value={formData.endpointURL}
                onChange={(e) => setFormData({ ...formData, endpointURL: e.target.value })}
                placeholder="https://api.example.com/service"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                required
              />
              <div className="mt-2 p-3 bg-cyan-600/10 border border-cyan-500/20 rounded-lg">
                <p className="text-xs text-gray-300 mb-2 font-semibold">What is an Endpoint URL?</p>
                <p className="text-xs text-gray-400 mb-2">
                  This is the API endpoint URL where your agent&apos;s service is running. When someone requests your service, they will call this endpoint to interact with your agent.
                </p>
                {selectedAgentId ? (
                  <div className="text-xs text-gray-300 mb-2 p-2 bg-cyan-600/20 rounded">
                    <span className="font-semibold">Selected Agent:</span> {selectedAgentId.substring(0, 16)}...
                    <br />
                    <span className="text-gray-400">Make sure this endpoint is where your agent is listening for requests.</span>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 space-y-1 mb-2">
                    <p className="font-semibold text-gray-300">Examples:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Trading Bot: <code className="text-cyan-400">https://api.yourdomain.com/trading/signals</code></li>
                      <li>DeFi Optimizer: <code className="text-cyan-400">https://api.yourdomain.com/defi/optimize</code></li>
                      <li>Smart Contract Auditor: <code className="text-cyan-400">https://api.yourdomain.com/audit/analyze</code></li>
                      <li>Data Analysis: <code className="text-cyan-400">https://api.yourdomain.com/analyze/data</code></li>
                    </ul>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  <span className="font-semibold text-yellow-400">Note:</span> This endpoint should be publicly accessible and ready to receive HTTP POST requests. The service will be called with the service request details when someone purchases your service.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Price Per Request (USDC) *
              </label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                value={formData.pricePerRequest}
                onChange={(e) => setFormData({ ...formData, pricePerRequest: e.target.value })}
                placeholder="0.001"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                required
              />
              <p className="text-xs text-gray-400 mt-2">
                Minimum: 0.0001 USDC (6 decimals)
              </p>
            </div>

            <div className="p-4 bg-purple-600/20 border border-purple-500/30 rounded-lg">
              <div className="flex items-start space-x-3">
                <Zap className="w-5 h-5 text-purple-400 mt-0.5" />
                <div>
                  <div className="font-semibold mb-1">Publishing Fee</div>
                  <div className="text-sm text-gray-400">
                    Only gas fees required (~0.00002 AVAX). No upfront cost!
                  </div>
                </div>
              </div>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isPublishing || publishServiceMutation.isPending}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-semibold text-lg shadow-[0_0_50px_rgba(168,85,247,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isPublishing || publishServiceMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Publish Service</span>
                </>
              )}
            </motion.button>
          </form>
        </GlassCard>

        {/* Success Modal */}
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            router.push("/marketplace");
          }}
          title="Service Published Successfully!"
          message="Your service is now live on the marketplace and available for others to request."
          details={[
            {
              label: "Service Name",
              value: formData.name,
            },
            {
              label: "Price Per Request",
              value: `${formData.pricePerRequest} USDC`,
            },
          ]}
          transactionHash={transactionHash || undefined}
          network="fuji"
        />
      </div>
    </div>
  );
}

