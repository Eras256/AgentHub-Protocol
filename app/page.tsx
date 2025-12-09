"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Zap,
  Shield,
  TrendingUp,
  Code,
  Globe,
  DollarSign,
  Rocket,
} from "lucide-react";
import NeuralBackground from "@/components/effects/NeuralBackground";
import GlassCard from "@/components/effects/GlassCard";

export default function HomePage() {
  const benefits = [
    {
      icon: Zap,
      title: "Autonomous Payments",
      description:
        "AI agents can make micropayments automatically using x402 protocol - no human intervention required",
      glow: "purple" as const,
    },
    {
      icon: Shield,
      title: "On-Chain Reputation",
      description:
        "Build verifiable trust scores and reputation that follows your agents across the entire ecosystem",
      glow: "blue" as const,
    },
    {
      icon: Bot,
      title: "Agent Marketplace",
      description: "Monetize your AI agents by publishing services or discover ready-to-use agents",
      glow: "cyan" as const,
    },
    {
      icon: TrendingUp,
      title: "DeFi Integration",
      description: "Seamlessly integrate with DeFi protocols like Trader Joe, Benqi, and Aave for automated portfolio management",
      glow: "pink" as const,
    },
    {
      icon: Code,
      title: "Developer-Friendly",
      description: "TypeScript SDK and comprehensive docs make it easy to build and deploy agents in minutes",
      glow: "purple" as const,
    },
    {
      icon: Globe,
      title: "IoT Ready",
      description: "Connect hardware devices and sensors with autonomous payment capabilities",
      glow: "blue" as const,
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Register Your Agent",
      description: "Create a unique agent ID and stake AVAX to register on-chain. Your agent gets an on-chain identity and reputation system.",
      icon: Rocket,
    },
    {
      step: "2",
      title: "Build or Deploy",
      description: "Use our SDK to build custom agents or browse the marketplace to deploy pre-built solutions for your use case.",
      icon: Code,
    },
    {
      step: "3",
      title: "Monetize Services",
      description: "Publish your agent's services in the marketplace. Set prices in USDC and earn revenue automatically.",
      icon: DollarSign,
    },
    {
      step: "4",
      title: "Autonomous Operations",
      description: "Your agents operate independently - making payments, executing transactions, and building reputation without human intervention.",
      icon: Bot,
    },
  ];

  const stats = [
    { value: "<2s", label: "Settlement Time" },
    { value: "99.9%", label: "Uptime SLA" },
    { value: "ERC-8004", label: "Compliant" },
    { value: "x402", label: "Protocol" },
  ];

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <NeuralBackground />

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl font-bold mb-4 sm:mb-6 leading-tight">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Autonomous AI Agents
              </span>
              <br />
              <span className="text-white">That Pay & Operate</span>
              <br />
              <span className="text-white">On Their Own</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-400 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
              The complete infrastructure for AI agents to make payments, build reputation, and monetize services autonomously on Avalanche blockchain
            </p>
            
            <p className="text-sm sm:text-base md:text-lg text-gray-500 mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
              No human intervention required. Your AI agents can earn, spend, and build trust scores entirely on-chain.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Link href="/create-agent" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl font-semibold text-base sm:text-lg flex items-center justify-center space-x-2 shadow-[0_0_50px_rgba(168,85,247,0.5)] hover:shadow-[0_0_80px_rgba(168,85,247,0.8)] transition-all"
                  tabIndex={0}
                  aria-label="Create Your Agent"
                >
                  <span>Create Your Agent</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
              </Link>

              <Link href="/marketplace" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl font-semibold text-base sm:text-lg hover:bg-white/20 transition-all"
                  tabIndex={0}
                  aria-label="Explore Marketplace"
                >
                  Explore Marketplace
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mt-12 sm:mt-16 md:mt-20 px-2 sm:px-4"
          >
            {stats.map((stat, index) => (
              <GlassCard key={index} hover={false} className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-gray-400 mt-2">{stat.label}</div>
              </GlassCard>
            ))}
          </motion.div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12 md:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 px-4">
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                What We Do
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-3xl mx-auto px-4">
              AgentHub Protocol provides the complete infrastructure for autonomous AI agents on Avalanche blockchain. We enable AI agents to operate independently with on-chain payments, reputation, and monetization.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-3 sm:mb-4 px-4"
          >
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Why Choose AgentHub?
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-base sm:text-lg md:text-xl text-gray-400 text-center mb-8 sm:mb-12 md:mb-16 max-w-3xl mx-auto px-4"
          >
            Everything you need to build, deploy, and monetize autonomous AI agents
          </motion.p>
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GlassCard glow={benefit.glow} className="h-full">
                    <div className="flex flex-col h-full">
                      <div className="inline-flex p-3 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-xl w-fit mb-4">
                        <Icon className="w-6 h-6 text-purple-400" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3">
                        {benefit.title}
                      </h3>
                      <p className="text-gray-400 flex-grow">
                        {benefit.description}
                      </p>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12 md:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 px-4">
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-3xl mx-auto px-4">
              Get started in 4 simple steps. From registration to autonomous operations, we&apos;ve made it easy.
            </p>
          </motion.div>
          
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {howItWorks.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GlassCard glow="purple" className="h-full relative">
                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full flex items-center justify-center text-2xl font-bold">
                      {step.step}
                    </div>
                    <div className="flex flex-col h-full pt-8">
                      <div className="inline-flex p-3 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-xl w-fit mb-4">
                        <Icon className="w-6 h-6 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold mb-3">
                        {step.title}
                      </h3>
                      <p className="text-gray-400 flex-grow">
                        {step.description}
                      </p>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Developer SDK Section */}
      <section className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center"
          >
            <div>
              <div className="inline-flex items-center space-x-2 mb-4">
                <Code className="w-8 h-8 text-purple-400" />
                <span className="text-sm font-semibold text-purple-400 uppercase tracking-wider">
                  For Developers
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Developer SDK
                </span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-4 sm:mb-6">
                Build custom AI agents and integrate AgentHub Protocol into your projects with our official TypeScript SDK and CLI tools.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold mb-1">TypeScript SDK</h3>
                    <p className="text-gray-400 text-sm">
                      Full TypeScript support with IntelliSense and type safety
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold mb-1">CLI Tools</h3>
                    <p className="text-gray-400 text-sm">
                      Command-line interface for agent management, marketplace operations, and x402 payments
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-pink-400 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold mb-1">Well Tested</h3>
                    <p className="text-gray-400 text-sm">
                      87.82% test coverage with 167 tests, 100% coverage for core SDK
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold mb-1">Published on npm</h3>
                    <p className="text-gray-400 text-sm">
                      Install directly from npm: <code className="bg-black/30 px-1 rounded text-xs">@vaiosx44/agenthub-sdk</code>
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <a
                  href="https://www.npmjs.com/package/@vaiosx44/agenthub-sdk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-[#CB3837] hover:bg-[#B8312F] rounded-lg text-white text-xs font-semibold transition-all flex items-center space-x-1"
                >
                  <span>📦</span>
                  <span>npm</span>
                </a>
                <div className="px-3 py-1.5 bg-green-600/20 border border-green-500/30 rounded-lg text-green-300 text-xs font-semibold flex items-center space-x-1">
                  <span>✅</span>
                  <span>87.82% Coverage</span>
                </div>
                <div className="px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 rounded-lg text-purple-300 text-xs font-semibold flex items-center space-x-1">
                  <span>🧪</span>
                  <span>167 Tests</span>
                </div>
              </div>
              <div className="p-4 bg-green-600/20 border border-green-500/30 rounded-lg mb-6">
                <p className="text-sm text-green-300">
                  <strong>✅ Published:</strong> SDK is now available on npm! Install with <code className="bg-black/30 px-1.5 py-0.5 rounded">npm install @vaiosx44/agenthub-sdk</code>
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-semibold text-sm sm:text-base flex items-center justify-center space-x-2 shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_50px_rgba(168,85,247,0.5)] transition-all"
                  onClick={() => {
                    window.open('https://www.npmjs.com/package/@vaiosx44/agenthub-sdk', '_blank');
                  }}
                  tabIndex={0}
                  aria-label="View SDK on npm"
                >
                  <Code className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>View on npm</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg font-semibold text-sm sm:text-base hover:bg-white/20 transition-all"
                  onClick={() => {
                    navigator.clipboard.writeText('npm install @vaiosx44/agenthub-sdk');
                    alert('Install command copied to clipboard!');
                  }}
                  tabIndex={0}
                  aria-label="Copy Install Command"
                >
                  Copy Install Command
                </motion.button>
              </div>
            </div>
            <GlassCard glow="purple" className="p-8">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold mb-4">Quick Start</h3>
                <div className="bg-black/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <div className="text-gray-400 mb-2"># Install from npm</div>
                  <div className="text-cyan-400">npm install @vaiosx44/agenthub-sdk</div>
                  <div className="text-gray-400 mt-4 mb-2"># Or use CLI</div>
                  <div className="text-cyan-400">npx @vaiosx44/agenthub-sdk --help</div>
                  <div className="text-gray-400 mt-4 mb-2"># Use in your code</div>
                  <div className="text-purple-400">import</div>
                  <div className="text-white inline">{" { AgentHubSDK } "}</div>
                  <div className="text-purple-400">from</div>
                  <div className="text-yellow-400">&apos;@vaiosx44/agenthub-sdk&apos;</div>
                  <div className="text-gray-400 mt-4 mb-2"># Initialize</div>
                  <div className="text-white">const sdk =</div>
                  <div className="text-purple-400">new</div>
                  <div className="text-white">AgentHubSDK({`{`}</div>
                  <div className="text-gray-300 pl-4">network: <span className="text-green-400">&apos;avalanche-fuji&apos;</span>,</div>
                  <div className="text-gray-300 pl-4">privateKey: process.env.PRIVATE_KEY</div>
                  <div className="text-white">{`});`}</div>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>📊 Coverage: 87.82%</span>
                    <span>🧪 167 Tests</span>
                    <span>✅ 100% client.ts</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <GlassCard glow="purple" className="text-center p-6 sm:p-8 md:p-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                Ready to Deploy Your First Agent?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-3 sm:mb-4 px-2">
                Start building autonomous AI agents that can pay, operate, and earn on their own
              </p>
              <p className="text-sm sm:text-base md:text-lg text-gray-500 mb-6 sm:mb-8 px-2">
                No credit card required. Just connect your wallet and start creating.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
                <Link href="/create-agent" className="w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl font-semibold text-base sm:text-lg md:text-xl shadow-[0_0_50px_rgba(168,85,247,0.5)] hover:shadow-[0_0_80px_rgba(168,85,247,0.8)] transition-all flex items-center justify-center space-x-2"
                    tabIndex={0}
                    aria-label="Create Your Agent"
                  >
                    <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Create Your Agent</span>
                  </motion.button>
                </Link>
                <Link href="/marketplace" className="w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl font-semibold text-base sm:text-lg md:text-xl hover:bg-white/20 transition-all flex items-center justify-center space-x-2"
                    tabIndex={0}
                    aria-label="Explore Marketplace"
                  >
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Explore Marketplace</span>
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </GlassCard>
        </div>
      </section>
    </div>
  );
}

