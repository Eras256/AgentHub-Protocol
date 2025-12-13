"use client";

import { ExternalLink, Shield, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/effects/GlassCard";

interface PoAIHashDisplayProps {
  kitePoAIHash: string;
  className?: string;
  compact?: boolean;
}

export default function PoAIHashDisplay({ 
  kitePoAIHash, 
  className = "",
  compact = false 
}: PoAIHashDisplayProps) {
  const [copied, setCopied] = useState(false);
  
  // Check if hash is zero (no PoAI recorded yet)
  const isZeroHash = kitePoAIHash === "0x0000000000000000000000000000000000000000000000000000000000000000" || 
                     kitePoAIHash === "0x0" ||
                     !kitePoAIHash;

  const handleCopy = async () => {
    if (isZeroHash) return;
    
    try {
      await navigator.clipboard.writeText(kitePoAIHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Kite Chain Testnet Explorer URL
  const kiteExplorerUrl = `https://testnet.kitescan.ai/tx/${kitePoAIHash}`;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Shield className="w-4 h-4 text-cyan-400" />
        {isZeroHash ? (
          <span className="text-xs text-gray-500">No PoAI recorded</span>
        ) : (
          <>
            <span className="text-xs font-mono text-cyan-400 truncate max-w-[120px]">
              {kitePoAIHash.substring(0, 10)}...{kitePoAIHash.substring(kitePoAIHash.length - 8)}
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleCopy}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Copy PoAI hash"
            >
              {copied ? (
                <CheckCircle2 className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3 text-gray-400" />
              )}
            </motion.button>
            <a
              href={kiteExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="View on Kite Chain Explorer"
            >
              <ExternalLink className="w-3 h-3 text-cyan-400" />
            </a>
          </>
        )}
      </div>
    );
  }

  return (
    <GlassCard glow="cyan" className={className}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-semibold">Kite Chain PoAI Proof</h3>
        </div>
        {!isZeroHash && (
          <a
            href={kiteExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>View on Kitescan</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {isZeroHash ? (
        <div className="text-center py-4">
          <Shield className="w-8 h-8 mx-auto mb-2 text-gray-500/50" />
          <p className="text-sm text-gray-400 mb-1">No PoAI proof recorded yet</p>
          <p className="text-xs text-gray-500">
            This agent hasn&apos;t recorded any decisions on Kite Chain
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs text-gray-400">Proof Hash</span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-white/5 hover:bg-white/10 rounded transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </motion.button>
            </div>
            <p className="font-mono text-sm text-cyan-400 break-all">
              {kitePoAIHash}
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Shield className="w-3 h-3" />
            <span>
              Verifiable on-chain proof of AI decision attribution
            </span>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

