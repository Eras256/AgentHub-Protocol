"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ExternalLink, X, Copy, Check } from "lucide-react";
import { useState } from "react";
import GlassCard from "@/components/effects/GlassCard";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  details?: {
    label: string;
    value: string;
  }[];
  transactionHash?: string;
  network?: "fuji" | "mainnet";
}

export default function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  details = [],
  transactionHash,
  network = "fuji",
}: SuccessModalProps) {
  const [copied, setCopied] = useState(false);

  const getExplorerUrl = (hash: string) => {
    const baseUrl = network === "fuji" 
      ? "https://testnet.snowtrace.io/tx"
      : "https://snowtrace.io/tx";
    return `${baseUrl}/${hash}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <GlassCard glow="cyan" className="relative overflow-hidden">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-3 sm:top-4 right-3 sm:right-4 p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors z-10 touch-manipulation"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                </button>

                {/* Success Icon Animation */}
                <div className="flex flex-col items-center text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                      delay: 0.1,
                    }}
                    className="relative mb-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{
                        duration: 0.6,
                        delay: 0.2,
                        type: "spring",
                        stiffness: 200,
                      }}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.5)]"
                    >
                      <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                    </motion.div>
                    {/* Ripple Effect */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0.8 }}
                      animate={{ scale: 2, opacity: 0 }}
                      transition={{
                        duration: 1,
                        delay: 0.3,
                        repeat: Infinity,
                        repeatDelay: 2,
                      }}
                      className="absolute inset-0 rounded-full bg-green-500"
                    />
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-xl sm:text-2xl font-bold mb-2 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent px-2"
                  >
                    {title}
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6 px-2"
                  >
                    {message}
                  </motion.p>
                </div>

                {/* Details */}
                {details.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-3 mb-6"
                  >
                    {details.map((detail, index) => (
                      <div
                        key={index}
                        className="p-3 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="text-xs text-gray-400 mb-1">
                          {detail.label}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="font-mono text-sm text-white break-all">
                            {detail.value}
                          </div>
                          <button
                            onClick={() => copyToClipboard(detail.value)}
                            className="ml-2 p-1.5 hover:bg-white/10 rounded transition-colors"
                            aria-label="Copy to clipboard"
                          >
                            {copied ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* Transaction Hash with Explorer Link */}
                {transactionHash && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="mb-6"
                  >
                    <div className="p-4 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 rounded-lg border border-purple-500/30">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-400 mb-2">
                            Transaction Hash
                          </div>
                          <div className="font-mono text-xs sm:text-sm text-white break-all mb-3">
                            {transactionHash}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(transactionHash)}
                              className="p-1.5 sm:p-2 hover:bg-white/10 rounded transition-colors"
                              aria-label="Copy transaction hash"
                            >
                              {copied ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                            <a
                              href={getExplorerUrl(transactionHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 inline-flex items-center justify-center space-x-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all border border-cyan-500/30 hover:border-cyan-500/50"
                            >
                              <span>View on Snowtrace</span>
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Action Button */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  onClick={onClose}
                  className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg font-semibold text-sm sm:text-base transition-all shadow-[0_0_30px_rgba(34,197,94,0.3)] touch-manipulation"
                >
                  Continue
                </motion.button>
              </GlassCard>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

