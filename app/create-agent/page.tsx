"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Bot,
  Zap,
  Settings,
  Loader2,
} from "lucide-react";
import GlassCard from "@/components/effects/GlassCard";
import { useAddress, useSDK } from "@thirdweb-dev/react";
import { useRegisterAgent, useMinStake } from "@/lib/hooks/useAgents";
import SuccessModal from "@/components/ui/SuccessModal";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";

export default function CreateAgentPage() {
  const address = useAddress();
  const sdk = useSDK();
  const router = useRouter();
  const registerAgentMutation = useRegisterAgent();
  const { data: minStake = "0.01", isLoading: minStakeLoading } = useMinStake();
  const [isDeploying, setIsDeploying] = useState(false);
  
  // Debug logging
  if (typeof window !== 'undefined') {
    console.log("Create Agent - Min Stake (from contract):", minStake);
    console.log("Create Agent - Min Stake Loading:", minStakeLoading);
  }
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{
    agentId: string;
    transactionHash: string;
  } | null>(null);
  const [agentData, setAgentData] = useState({
    name: "",
    type: "",
    description: "",
    budget: "",
    riskProfile: "moderate",
    strategies: [] as string[],
    pricePerRequest: "",
  });

  const steps = [
    { id: 1, title: "Agent Type", icon: Bot },
    { id: 2, title: "Configuration", icon: Settings },
    { id: 3, title: "Deploy", icon: Zap },
  ];

  // Agent type options for UI - these are configuration templates, not contract data
  // The actual agent data is stored on-chain via the AgentRegistry contract
  const agentTypes = [
    {
      id: "defi",
      name: "DeFi Portfolio Manager",
      description: "Optimizes yields across Trader Joe, Benqi, and Aave (real protocol integrations)",
      icon: "💰",
      features: ["Auto-rebalancing", "Yield optimization", "Risk management"],
    },
    {
      id: "api",
      name: "API Service Provider",
      description: "Publish APIs with x402 micropayment gates (real x402 integration)",
      icon: "🔌",
      features: ["x402 payments", "Rate limiting", "Analytics dashboard"],
    },
    {
      id: "iot",
      name: "IoT Device Agent",
      description: "Hardware agents with autonomous payments (real IoT integration)",
      icon: "🌡️",
      features: ["ESP32 support", "Sensor data", "Alert system"],
    },
    {
      id: "trading",
      name: "Trading Bot",
      description: "Automated trading strategies and arbitrage",
      icon: "📈",
      features: ["Market analysis", "Auto-trading", "Stop-loss"],
    },
  ];

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleDeploy = async () => {
    if (!agentData.name || !agentData.type) {
      alert("Please complete all required fields");
      return;
    }

    if (!sdk) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      setIsDeploying(true);
      
      // Generate unique agent ID
      const agentId = `${agentData.name}-${Date.now()}`;
      // Store original agentId in metadataIPFS for easy retrieval
      // Format: ipfs://originalAgentId|metadata
      const metadataIPFS = `ipfs://${agentId}|${agentData.description || 'No description'}`;
      
      // Register agent on-chain (requires minStake from contract)
      const receipt = await registerAgentMutation.mutateAsync({
        agentId,
        metadataIPFS,
        stakeAmount: minStake, // Use real minStake from contract
      });

      console.log("Agent registered:", { agentId, txHash: receipt.hash });
      
      // Store agentId mapping in localStorage for easy lookup
      try {
        const agentMappings = JSON.parse(localStorage.getItem('agentIdMappings') || '{}');
        // Hash the agentId the same way the contract does (keccak256)
        const ethersAny = ethers as any;
        const hashedId = ethersAny.utils?.id 
          ? ethersAny.utils.id(agentId) 
          : ethersAny.id 
          ? ethersAny.id(agentId)
          : ethersAny.utils?.keccak256 && ethersAny.utils?.toUtf8Bytes
          ? ethersAny.utils.keccak256(ethersAny.utils.toUtf8Bytes(agentId))
          : null;
        
        if (hashedId) {
          agentMappings[hashedId.toLowerCase()] = agentId;
          localStorage.setItem('agentIdMappings', JSON.stringify(agentMappings));
        }
      } catch (e) {
        console.warn('Could not save agentId mapping:', e);
      }
      
      // Show success modal with transaction details
      setSuccessData({
        agentId,
        transactionHash: receipt.hash,
      });
      setShowSuccessModal(true);
      
      // Reset form
      setAgentData({
        name: "",
        type: "",
        description: "",
        budget: "",
        riskProfile: "moderate",
        strategies: [],
        pricePerRequest: "",
      });
      setCurrentStep(1);
    } catch (error: any) {
      console.error("Error deploying agent:", error);
      
      // Check for insufficient funds error (can be nested in data property)
      const errorMessage = error?.message || error?.data?.message || error?.reason || "";
      const errorCode = error?.code || error?.data?.code;
      const errorString = JSON.stringify(error).toLowerCase();
      
      const isInsufficientFunds = 
        errorMessage.toLowerCase().includes("insufficient funds") || 
        errorMessage.toLowerCase().includes("insufficient balance") ||
        errorMessage.toLowerCase().includes("have 0 want") ||
        errorString.includes("insufficient funds") ||
        errorCode === -32003 ||
        error?.data?.code === -32003;
      
      const isAgentIdTaken = 
        errorMessage.toLowerCase().includes("agent id already registered") ||
        errorMessage.toLowerCase().includes("agent id taken") ||
        errorMessage.toLowerCase().includes("agent id ya registrado") ||
        errorString.includes("agent id already registered") ||
        errorString.includes("agent id taken");
      
      if (isAgentIdTaken) {
        alert(
          "⚠️ Agent ID Already Registered\n\n" +
          "The agent ID you're trying to use is already registered. " +
          "Please choose a different name for your agent.\n\n" +
          "Note: You can create multiple agents per wallet address, but each must have a unique agent ID."
        );
      } else if (isInsufficientFunds) {
        const totalNeeded = (parseFloat(minStake) + 0.000015).toFixed(6);
        alert(
          "❌ Insufficient Funds\n\n" +
          "You need AVAX in your wallet to deploy an agent:\n" +
          `• Required stake: ${minStake} AVAX (real data from AgentRegistry contract)\n` +
          "• Gas fees: ~0.000015 AVAX\n" +
          `• Total: ~${totalNeeded} AVAX\n\n` +
          "Get testnet AVAX from:\n" +
          "• https://faucet.avalanche.org/\n" +
          "• https://faucet.quicknode.com/avalanche/fuji\n\n" +
          "Make sure you're connected to Avalanche Fuji Testnet in MetaMask."
        );
      } else {
        const displayMessage = errorMessage || error?.reason || "Unknown error";
        alert(`❌ Error deploying agent: ${displayMessage}`);
      }
    } finally {
      setIsDeploying(false);
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-20">
        <GlassCard className="max-w-md text-center">
          <Bot className="w-16 h-16 mx-auto mb-4 text-purple-400" />
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">
            Connect your wallet to create and deploy AI agents
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-16 md:pb-20 px-3 sm:px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Create Your AI Agent
            </span>
          </h1>
          <p className="text-sm sm:text-base text-gray-400 px-2">
            Deploy autonomous agents in minutes with our guided wizard. You can create multiple agents per wallet address, each with a unique agent ID.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 sm:mb-10 md:mb-12 overflow-x-auto pb-4">
          <div className="flex items-center min-w-max px-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <motion.div
                    animate={{
                      scale: isActive ? 1.1 : 1,
                    }}
                    className="flex flex-col items-center"
                  >
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? "bg-gradient-to-r from-purple-600 to-cyan-600"
                          : isActive
                          ? "bg-gradient-to-r from-purple-600 to-cyan-600"
                          : "bg-white/10"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      ) : (
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      )}
                    </div>
                    <span
                      className={`text-xs sm:text-sm mt-2 whitespace-nowrap ${
                        isActive ? "text-white font-semibold" : "text-gray-400"
                      }`}
                    >
                      {step.title}
                    </span>
                  </motion.div>

                  {index < steps.length - 1 && (
                    <div
                      className={`w-12 sm:w-16 md:w-24 h-1 mx-2 sm:mx-3 md:mx-4 rounded transition-all ${
                        isCompleted
                          ? "bg-gradient-to-r from-purple-600 to-cyan-600"
                          : "bg-white/10"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <GlassCard>
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Choose Agent Type</h2>
                <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {agentTypes.map((type) => (
                    <motion.button
                      key={type.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setAgentData({ ...agentData, type: type.id })}
                      className={`p-6 rounded-xl text-left transition-all ${
                        agentData.type === type.id
                          ? "bg-gradient-to-br from-purple-600/30 to-cyan-600/30 border-2 border-purple-500"
                          : "bg-white/5 border-2 border-transparent hover:border-white/20"
                      }`}
                      tabIndex={0}
                      aria-label={`Select ${type.name}`}
                    >
                      <div className="text-4xl mb-3">{type.icon}</div>
                      <h3 className="text-lg font-bold mb-2">{type.name}</h3>
                      <p className="text-sm text-gray-400 mb-4">
                        {type.description}
                      </p>
                      <div className="space-y-1">
                        {type.features.map((feature, i) => (
                          <div
                            key={i}
                            className="flex items-center space-x-2 text-xs text-gray-300"
                          >
                            <Check className="w-3 h-3 text-green-400" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <GlassCard>
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
                  Configure Your Agent
                </h2>
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Agent Name
                    </label>
                    <input
                      type="text"
                      value={agentData.name}
                      onChange={(e) =>
                        setAgentData({ ...agentData, name: e.target.value })
                      }
                      placeholder="My DeFi Agent"
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
                      value={agentData.description}
                      onChange={(e) =>
                        setAgentData({
                          ...agentData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe what your agent does..."
                      rows={4}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                      tabIndex={0}
                      aria-label="Agent description"
                    />
                  </div>

                  {agentData.type === "defi" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Initial Budget (USDC)
                        </label>
                        <input
                          type="number"
                          value={agentData.budget}
                          onChange={(e) =>
                            setAgentData({
                              ...agentData,
                              budget: e.target.value,
                            })
                          }
                          placeholder="1000"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                          tabIndex={0}
                          aria-label="Initial budget in USDC"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Risk Profile
                        </label>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                          {["conservative", "moderate", "aggressive"].map(
                            (risk) => (
                              <button
                                key={risk}
                                onClick={() =>
                                  setAgentData({
                                    ...agentData,
                                    riskProfile: risk,
                                  })
                                }
                                className={`py-3 rounded-lg capitalize transition-all ${
                                  agentData.riskProfile === risk
                                    ? "bg-gradient-to-r from-purple-600 to-cyan-600"
                                    : "bg-white/5 hover:bg-white/10"
                                }`}
                                tabIndex={0}
                                aria-label={`Select ${risk} risk profile`}
                              >
                                {risk}
                              </button>
                            )
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Select DeFi Protocols
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                            {["Trader Joe", "Benqi", "Aave"].map((protocol) => (
                              <button
                                key={protocol}
                                type="button"
                                onClick={() => {
                                  const currentStrategies = agentData.strategies || [];
                                  const newStrategies = currentStrategies.includes(protocol)
                                    ? currentStrategies.filter((s: string) => s !== protocol)
                                    : [...currentStrategies, protocol];
                                  setAgentData({
                                    ...agentData,
                                    strategies: newStrategies,
                                  });
                                }}
                                className={`py-3 rounded-lg transition-all ${
                                  agentData.strategies?.includes(protocol)
                                    ? "bg-gradient-to-r from-purple-600 to-cyan-600"
                                    : "bg-white/5 hover:bg-white/10"
                                }`}
                                tabIndex={0}
                                aria-label={`Select ${protocol} protocol`}
                              >
                                {protocol}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Your agent will optimize across selected protocols using real on-chain integrations (Trader Joe, Benqi, Aave)
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {agentData.type === "api" && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Price Per Request (USDC)
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={agentData.pricePerRequest}
                        onChange={(e) =>
                          setAgentData({
                            ...agentData,
                            pricePerRequest: e.target.value,
                          })
                        }
                        placeholder="0.001"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                        tabIndex={0}
                        aria-label="Price per request in USDC"
                      />
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <GlassCard>
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Review & Deploy</h2>
                <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="text-sm text-gray-400">Agent Name</div>
                    <div className="text-lg font-semibold">
                      {agentData.name || "Unnamed Agent"}
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="text-sm text-gray-400">Type</div>
                    <div className="text-lg font-semibold capitalize">
                      {agentTypes.find((t) => t.id === agentData.type)?.name ||
                        "Not selected"}
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="text-sm text-gray-400">Description</div>
                    <div className="text-lg">
                      {agentData.description || "No description"}
                    </div>
                  </div>

                  {agentData.budget && (
                    <div className="p-4 bg-white/5 rounded-lg">
                      <div className="text-sm text-gray-400">Budget</div>
                      <div className="text-lg font-semibold">
                        ${agentData.budget} USDC
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-purple-600/20 border border-purple-500/30 rounded-lg mb-6">
                  <div className="flex items-start space-x-3">
                    <Zap className="w-5 h-5 text-purple-400 mt-0.5" />
                    <div>
                      <div className="font-semibold mb-1">Deployment Fee</div>
                      {minStakeLoading ? (
                        <div className="text-sm text-gray-400">Loading stake requirement from contract...</div>
                      ) : (
                        <div className="text-sm text-gray-400">
                          <span className="font-semibold text-purple-300">{minStake} AVAX</span> staking required (real data from AgentRegistry contract) + gas fees (~0.000015 AVAX)
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-cyan-600/20 border border-cyan-500/30 rounded-lg mb-6">
                  <div className="flex items-start space-x-3">
                    <Bot className="w-5 h-5 text-cyan-400 mt-0.5" />
                    <div>
                      <div className="font-semibold mb-1">Multiple Agents Supported</div>
                      <div className="text-sm text-gray-400">
                        You can create multiple agents per wallet address. Each agent will have a unique agent ID based on the agent name and timestamp.
                      </div>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDeploy}
                  disabled={isDeploying || registerAgentMutation.isPending}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-semibold text-lg shadow-[0_0_50px_rgba(168,85,247,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  tabIndex={0}
                  aria-label="Deploy agent"
                >
                  {isDeploying || registerAgentMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Deploying...</span>
                    </>
                  ) : (
                    <span>Deploy Agent</span>
                  )}
                </motion.button>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Modal */}
        {successData && (
          <SuccessModal
            isOpen={showSuccessModal}
            onClose={() => {
              setShowSuccessModal(false);
              router.push("/dashboard");
            }}
            title="Agent Registered Successfully!"
            message="Your AI agent has been registered on-chain. You can now create additional agents with different IDs or publish services in the marketplace."
            details={[
              {
                label: "Agent ID",
                value: successData.agentId,
              },
            ]}
            transactionHash={successData.transactionHash}
            network="fuji"
          />
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 sm:mt-8 gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base flex items-center space-x-2 transition-all ${
              currentStep === 1
                ? "opacity-50 cursor-not-allowed bg-white/5"
                : "bg-white/10 hover:bg-white/20"
            }`}
            tabIndex={currentStep === 1 ? -1 : 0}
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Back</span>
          </motion.button>

          {currentStep < 3 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              disabled={!agentData.type && currentStep === 1}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base flex items-center space-x-2 transition-all ${
                !agentData.type && currentStep === 1
                  ? "opacity-50 cursor-not-allowed bg-white/5"
                  : "bg-gradient-to-r from-purple-600 to-cyan-600"
              }`}
              tabIndex={
                !agentData.type && currentStep === 1 ? -1 : 0
              }
              aria-label="Continue to next step"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}

