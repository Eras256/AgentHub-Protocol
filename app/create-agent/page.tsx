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
} from "lucide-react";
import GlassCard from "@/components/effects/GlassCard";
import { useAddress } from "@thirdweb-dev/react";

export default function CreateAgentPage() {
  const address = useAddress();
  const [currentStep, setCurrentStep] = useState(1);
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

  const agentTypes = [
    {
      id: "defi",
      name: "DeFi Portfolio Manager",
      description: "Optimizes yields across Trader Joe, Benqi, and Aave",
      icon: "💰",
      features: ["Auto-rebalancing", "Yield optimization", "Risk management"],
    },
    {
      id: "api",
      name: "API Service Provider",
      description: "Publish APIs with x402 micropayment gates",
      icon: "🔌",
      features: ["x402 payments", "Rate limiting", "Analytics dashboard"],
    },
    {
      id: "iot",
      name: "IoT Device Agent",
      description: "Hardware agents with autonomous payments",
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
    // Deploy agent logic here
    console.log("Deploying agent:", agentData);
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
    <div className="min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Create Your AI Agent
            </span>
          </h1>
          <p className="text-gray-400">
            Deploy autonomous agents in minutes with our guided wizard
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
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
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? "bg-gradient-to-r from-purple-600 to-cyan-600"
                        : isActive
                        ? "bg-gradient-to-r from-purple-600 to-cyan-600"
                        : "bg-white/10"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : (
                      <Icon className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <span
                    className={`text-sm mt-2 ${
                      isActive ? "text-white font-semibold" : "text-gray-400"
                    }`}
                  >
                    {step.title}
                  </span>
                </motion.div>

                {index < steps.length - 1 && (
                  <div
                    className={`w-24 h-1 mx-4 rounded transition-all ${
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
                <h2 className="text-2xl font-bold mb-6">Choose Agent Type</h2>
                <div className="grid md:grid-cols-2 gap-4">
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
                <h2 className="text-2xl font-bold mb-6">
                  Configure Your Agent
                </h2>
                <div className="space-y-6">
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
                        <div className="grid grid-cols-3 gap-3">
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
                <h2 className="text-2xl font-bold mb-6">Review & Deploy</h2>
                <div className="space-y-4 mb-8">
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
                      <div className="text-sm text-gray-400">
                        1 AVAX staking required + gas fees (~0.01 AVAX)
                      </div>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDeploy}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-semibold text-lg shadow-[0_0_50px_rgba(168,85,247,0.5)]"
                  tabIndex={0}
                  aria-label="Deploy agent"
                >
                  Deploy Agent
                </motion.button>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-all ${
              currentStep === 1
                ? "opacity-50 cursor-not-allowed bg-white/5"
                : "bg-white/10 hover:bg-white/20"
            }`}
            tabIndex={currentStep === 1 ? -1 : 0}
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </motion.button>

          {currentStep < 3 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              disabled={!agentData.type && currentStep === 1}
              className={`px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-all ${
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
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}

