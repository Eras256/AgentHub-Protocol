"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, TrendingUp, ArrowRight, Sparkles, X } from "lucide-react";
import GlassCard from "@/components/effects/GlassCard";
import { optimizeDeFiStrategy } from "@/lib/ai/gemini";

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

  useEffect(() => {
    loadInsights();
  }, [portfolio, protocols]);

  const loadInsights = async () => {
    if (!process.env.NEXT_PUBLIC_ENABLE_AI_INSIGHTS) {
      // Mock insights for demo
      setInsights([
        {
          id: "1",
          type: "defi",
          title: "Optimización de Portafolio DeFi",
          suggestion: "Mover 30% de Benqi → Trader Joe",
          reasoning: "APY delta aumentó +2.5% en las últimas 6 horas. Trader Joe muestra mejor liquidez y menor riesgo de impermanent loss.",
          confidence: 87,
          expectedImpact: "+$12.50/mes estimado",
          action: {
            label: "Ejecutar vía x402",
            protocol: "Trader Joe",
            amount: "30%",
            from: "Benqi",
            to: "Trader Joe",
          },
        },
        {
          id: "2",
          type: "risk",
          title: "Alerta de Riesgo",
          suggestion: "Reducir exposición en Aave en 15%",
          reasoning: "Volatilidad aumentó 23% en las últimas 24h. Recomendado reducir exposición para proteger capital.",
          confidence: 72,
          expectedImpact: "Reducción de riesgo del 15%",
        },
      ]);
      return;
    }

    setLoading(true);
    try {
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
          title: "Optimización de Portafolio DeFi",
          suggestion: `Reasignar ${Math.round((topAllocation[1] as number) * 100)}% a ${topAllocation[0]}`,
          reasoning: strategy.strategy,
          confidence: Math.round(strategy.expectedYield * 10),
          expectedImpact: `+${strategy.expectedYield.toFixed(2)}% APY estimado`,
          action: {
            label: "Ejecutar vía x402",
            protocol: topAllocation[0] as string,
            amount: `${Math.round((topAllocation[1] as number) * 100)}%`,
          },
        });
      }

      setInsights(newInsights);
    } catch (error) {
      console.error("Error loading AI insights:", error);
      // Fallback to mock
      setInsights([
        {
          id: "fallback",
          type: "defi",
          title: "Análisis en Progreso",
          suggestion: "Gemini está analizando tu portafolio...",
          reasoning: "Los insights se generarán automáticamente.",
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

  const handleExecute = (insight: AIInsight) => {
    if (onExecute) {
      onExecute(insight);
    } else {
      // Default: show confirmation
      if (confirm(`¿Ejecutar: ${insight.suggestion}?`)) {
        console.log("Executing insight:", insight);
        // In real implementation, this would trigger x402 payment
      }
    }
  };

  const visibleInsights = insights.filter((insight) => !dismissed.has(insight.id));

  if (visibleInsights.length === 0 && !loading) {
    return null;
  }

  return (
    <GlassCard glow="cyan" className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg">
            <Bot className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold flex items-center space-x-2">
              <span>🤖 Gemini AI Insights</span>
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </h3>
            <p className="text-sm text-gray-400">Sugerencias inteligentes para tu portafolio</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          <span className="ml-3 text-gray-400">Analizando con Gemini...</span>
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
                    <div className="text-sm text-gray-400">Confianza</div>
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
                    className="w-full px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all"
                    tabIndex={0}
                    aria-label={`Execute: ${insight.suggestion}`}
                  >
                    <span>{insight.action.label}</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-gray-500 text-center">
          Powered by Google Gemini 2.5 Flash • 133x más económico que GPT-4
        </p>
      </div>
    </GlassCard>
  );
}

