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
} from "lucide-react";
import NeuralBackground from "@/components/effects/NeuralBackground";
import GlassCard from "@/components/effects/GlassCard";

export default function HomePage() {
  const features = [
    {
      icon: Zap,
      title: "x402 Payments",
      description:
        "Autonomous micropayments without human intervention using x402 protocol",
      glow: "purple" as const,
    },
    {
      icon: Shield,
      title: "ERC-8004 Reputation",
      description:
        "Verifiable on-chain identity and trust scoring for AI agents",
      glow: "blue" as const,
    },
    {
      icon: Bot,
      title: "AI Agent Marketplace",
      description: "Discover and deploy pre-built agents or create your own",
      glow: "cyan" as const,
    },
    {
      icon: TrendingUp,
      title: "DeFi Integration",
      description: "Optimize portfolios across Trader Joe, Benqi, and Aave",
      glow: "pink" as const,
    },
    {
      icon: Code,
      title: "Developer SDK",
      description: "Build custom agents with our TypeScript SDK and CLI tools",
      glow: "purple" as const,
    },
    {
      icon: Globe,
      title: "IoT Support",
      description: "Hardware agents with autonomous payment capabilities",
      glow: "blue" as const,
    },
  ];

  const stats = [
    { value: "$25K", label: "Prize Pool" },
    { value: "4/4", label: "Track Coverage" },
    { value: "<2s", label: "Settlement Time" },
    { value: "99.9%", label: "Uptime SLA" },
  ];

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <NeuralBackground />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                The Future of
              </span>
              <br />
              <span className="text-white">Autonomous AI</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto">
              First complete infrastructure on Avalanche where AI agents can
              pay, operate, and build reputation autonomously using x402
              protocol
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create-agent">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl font-semibold text-lg flex items-center justify-center space-x-2 shadow-[0_0_50px_rgba(168,85,247,0.5)] hover:shadow-[0_0_80px_rgba(168,85,247,0.8)] transition-all"
                  tabIndex={0}
                  aria-label="Create Your Agent"
                >
                  <span>Create Your Agent</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>

              <Link href="/marketplace">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all"
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
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20"
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

      {/* Features Grid */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-5xl font-bold text-center mb-16"
          >
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Powerful Features
            </span>
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GlassCard glow={feature.glow} className="h-full">
                    <div className="flex flex-col h-full">
                      <div className="inline-flex p-3 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-xl w-fit mb-4">
                        <Icon className="w-6 h-6 text-purple-400" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-gray-400 flex-grow">
                        {feature.description}
                      </p>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <GlassCard glow="purple" className="text-center p-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Build the Future?
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Join the Hack2Build hackathon and create the next generation of
              autonomous AI agents
            </p>
            <Link href="/create-agent">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl font-semibold text-xl shadow-[0_0_50px_rgba(168,85,247,0.5)] hover:shadow-[0_0_80px_rgba(168,85,247,0.8)] transition-all"
                tabIndex={0}
                aria-label="Get Started Now"
              >
                Get Started Now
              </motion.button>
            </Link>
          </GlassCard>
        </div>
      </section>
    </div>
  );
}

