"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Twitter,
  Zap,
  ExternalLink,
} from "lucide-react";

export default function Footer() {
  const links = {
    product: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Marketplace", href: "/marketplace" },
      { label: "Create Agent", href: "/create-agent" },
      { label: "Documentation", href: "/docs" },
    ],
    resources: [
      {
        label: "GitHub",
        href: "https://github.com/yourusername/agenthub",
        external: true,
      },
      { label: "x402 Docs", href: "https://x402.org", external: true },
      {
        label: "Avalanche Docs",
        href: "https://docs.avax.network",
        external: true,
      },
      { label: "Kite AI", href: "https://gokite.ai", external: true },
    ],
    community: [
      { label: "X (Twitter)", href: "https://twitter.com/agenthub", icon: Twitter },
    ],
  };

  return (
    <footer className="relative border-t border-white/10 backdrop-blur-xl bg-black/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Brand */}
          <div className="col-span-1">
            <Link
              href="/"
              className="flex items-center space-x-3 mb-4 group"
              tabIndex={0}
            >
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-gradient-to-br from-purple-600 to-cyan-500 p-2 rounded-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                AgentHub
              </span>
            </Link>
            <p className="text-gray-400 text-sm mb-4">
              The first complete infrastructure for autonomous AI agents on
              Avalanche
            </p>
            <div className="flex space-x-3">
              {links.community.map((link) => {
                const Icon = link.icon;
                return (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label={link.label}
                    tabIndex={0}
                  >
                    <Icon className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                  </motion.a>
                );
              })}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              {links.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                    tabIndex={0}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resource Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              {links.resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors text-sm flex items-center space-x-1"
                    tabIndex={0}
                  >
                    <span>{link.label}</span>
                    {link.external && <ExternalLink className="w-3 h-3" />}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Hackathon Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Hack2Build 2025</h3>
            <div className="text-xs text-gray-400">
              Built for Avalanche Hack2Build: Payments x402 Edition
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 sm:pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center space-y-3 sm:space-y-4 md:space-y-0">
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 text-center sm:text-left">
            <p className="text-gray-400 text-xs sm:text-sm">
              © 2025 AgentHub Protocol. Built on{" "}
              <a
                href="https://avax.network"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 transition-colors"
                tabIndex={0}
              >
                Avalanche
              </a>
            </p>
            <p className="text-gray-500 text-xs sm:text-sm">
              Made by{" "}
              <span className="text-purple-400 font-semibold">Vaiosx & M0nsxx</span>
            </p>
          </div>
          <div className="flex flex-wrap justify-center sm:justify-end gap-3 sm:gap-6 text-xs sm:text-sm">
            <Link
              href="/privacy"
              className="text-gray-400 hover:text-white transition-colors"
              tabIndex={0}
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-gray-400 hover:text-white transition-colors"
              tabIndex={0}
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

