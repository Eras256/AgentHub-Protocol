"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, TrendingUp, ArrowRight, Sparkles, X, Loader2 } from "lucide-react";
import GlassCard from "@/components/effects/GlassCard";
import { optimizeDeFiStrategy } from "@/lib/ai/gemini";
import { useDeFiAgent } from "@/lib/hooks/useDeFi";
import { useSDK, useAddress } from "@thirdweb-dev/react";

export interface AIInsight {
  id: string;
  type: "defi" | "trading" | "risk" | "optimization";
  title: string;
  suggestion: string;
  reasoning: string;
  confidence: number;
  expectedImpact?: string;
  action?: {
    label: string;
    protocol?: string;
    amount?: string;
    from?: string;
    to?: string;
  };
}

interface AIInsightsProps {
  portfolio?: Record<string, any>;
  protocols?: string[];
  onExecute?: (insight: AIInsight) => void;
}

export default function AIInsights({
  portfolio = {},
  protocols = ["Trader Joe", "Benqi", "Aave"],
  onExecute,
}: AIInsightsProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [hasRequested, setHasRequested] = useState(false);

  // Removed automatic loading - now only loads on manual request

  const loadInsights = async () => {
    setLoading(true);
    try {
      // Always try to use real AI if available
      const strategy = await optimizeDeFiStrategy(portfolio, protocols);

      const newInsights: AIInsight[] = [];

      // Generate insight from strategy
      if (strategy.allocations && Object.keys(strategy.allocations).length > 0) {
        const topAllocation = Object.entries(strategy.allocations).sort(
          ([, a], [, b]) => (b as number) - (a as number)
        )[0];

        newInsights.push({
          id: `insight-${Date.now()}`,
          type: "defi",
          title: "DeFi Portfolio Optimization",
          suggestion: `Reallocate ${Math.round((topAllocation[1] as number) * 100)}% to ${topAllocation[0]}`,
          reasoning: strategy.strategy,
          confidence: Math.min(Math.round(strategy.expectedYield * 10), 100),
          expectedImpact: `+${strategy.expectedYield.toFixed(2)}% estimated APY`,
          action: {
            label: "Execute via x402",
            protocol: topAllocation[0] as string,
            amount: `${Math.round((topAllocation[1] as number) * 100)}%`,
          },
        });

        // Add risk insights if available
        if (strategy.riskLevel && strategy.riskLevel !== "low") {
          newInsights.push({
            id: `risk-${Date.now()}`,
            type: "risk",
            title: "Risk Analysis",
            suggestion: `Risk level: ${strategy.riskLevel}`,
            reasoning: `GEMINI AI analysis indicates a ${strategy.riskLevel} risk level. Consider adjusting your strategy according to your risk profile.`,
            confidence: 75,
            expectedImpact: "Improved risk management",
          });
        }
      } else {
        // If no allocations, create a general insight
        newInsights.push({
          id: `general-${Date.now()}`,
          type: "defi",
          title: "Portfolio Analysis",
          suggestion: strategy.strategy || "Review your DeFi strategy",
          reasoning: strategy.strategy || "GEMINI AI has analyzed your portfolio and suggests reviewing the current strategy.",
          confidence: 70,
          expectedImpact: `Expected yield: ${strategy.expectedYield.toFixed(2)}%`,
        });
      }

      setInsights(newInsights);
    } catch (error: any) {
      console.error("Error loading AI insights:", error);
      // Fallback to informative error message
      setInsights([
        {
          id: "error",
          type: "defi",
          title: "Error Loading Insights",
          suggestion: "Unable to generate insights at this time",
          reasoning: error.message || "GEMINI AI is not available. Please verify that GEMINI_API_KEY is configured correctly.",
          confidence: 0,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  const { optimizePortfolio, loading: defiLoading } = useDeFiAgent();
  const sdk = useSDK();
  const address = useAddress();

  const handleExecute = async (insight: AIInsight) => {
    if (onExecute) {
      onExecute(insight);
      return;
    }

    // Check if wallet is connected
    if (!address || !sdk) {
      alert("Please connect your wallet to execute DeFi operations");
      return;
    }

    // Show confirmation
    if (!confirm(`Execute: ${insight.suggestion}?`)) {
      return;
    }

    try {
      // Convert insight to portfolio data format
      const portfolioData = {
        balances: portfolio || {},
        positions: [],
        totalValue: Object.values(portfolio || {}).reduce((sum: number, val: any) => {
          return sum + (typeof val === 'object' && val.balance ? val.balance : 0);
        }, 0),
      };

      // Execute optimization with real DeFi integrations
      const result = await optimizePortfolio(portfolioData);

      if (result?.executionResult?.success) {
        alert(`✅ Operation executed successfully!\nTransaction: ${result.executionResult.txHash}`);
      } else if (result?.executionResult?.error) {
        alert(`❌ Execution failed: ${result.executionResult.error}`);
      } else {
        // Analysis completed but no execution
        console.log("Analysis result:", result);
        alert(`✅ Analysis completed. Review the recommendations before executing.`);
      }
    } catch (error: any) {
      console.error("Error executing DeFi operation:", error);
      alert(`Error: ${error.message || "Failed to execute operation"}`);
    }
  };

  const visibleInsights = insights.filter((insight) => !dismissed.has(insight.id));

  const handleRequestInsights = () => {
    setHasRequested(true);
    loadInsights();
  };

  return (
    <GlassCard glow="cyan" className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg">
            <Bot className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold flex items-center space-x-2">
              <span>🤖 GEMINI AI Insights</span>
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </h3>
            <p className="text-sm text-gray-400">Intelligent suggestions for your portfolio</p>
          </div>
        </div>
        {!hasRequested && !loading && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRequestInsights}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg font-semibold flex items-center space-x-2 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
            tabIndex={0}
            aria-label="Request AI Insights"
          >
            <Sparkles className="w-4 h-4" />
            <span>Request Insights</span>
          </motion.button>
        )}
      </div>

      {!hasRequested ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Bot className="w-16 h-16 text-cyan-400/50 mb-4" />
          <p className="text-gray-400 mb-2">Click &quot;Request Insights&quot; to get intelligent analysis</p>
          <p className="text-sm text-gray-500">Powered by GEMINI AI</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          <span className="ml-3 text-gray-400">Analyzing with GEMINI AI...</span>
        </div>
      ) : visibleInsights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Bot className="w-16 h-16 text-cyan-400/50 mb-4" />
          <p className="text-gray-400 mb-4">No insights found at this time</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRequestInsights}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg font-semibold flex items-center space-x-2 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
            tabIndex={0}
            aria-label="Request AI Insights Again"
          >
            <Sparkles className="w-4 h-4" />
            <span>Try Again</span>
          </motion.button>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleInsights.map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative p-4 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-xl border border-cyan-500/20"
            >
              <button
                onClick={() => handleDismiss(insight.id)}
                className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded transition-colors"
                aria-label="Dismiss insight"
                tabIndex={0}
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>

              <div className="pr-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-lg mb-1">{insight.title}</h4>
                    <p className="text-cyan-300 font-medium">{insight.suggestion}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Confidence</div>
                    <div className="text-lg font-bold text-cyan-400">{insight.confidence}%</div>
                  </div>
                </div>

                <p className="text-sm text-gray-300 mb-3">{insight.reasoning}</p>

                {insight.expectedImpact && (
                  <div className="flex items-center space-x-2 mb-3 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-medium">{insight.expectedImpact}</span>
                  </div>
                )}

                {insight.action && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleExecute(insight)}
                    disabled={defiLoading || !address}
                    className="w-full px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    tabIndex={0}
                    aria-label={`Execute: ${insight.suggestion}`}
                  >
                    {defiLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Executing...</span>
                      </>
                    ) : (
                      <>
                        <span>{insight.action.label}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-gray-500 text-center">
          Powered by GEMINI AI • Real DeFi integrations with Trader Joe, Benqi, and Aave
        </p>
      </div>
    </GlassCard>
  );
}

