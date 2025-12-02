"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "purple" | "blue" | "cyan" | "pink";
}

export default function GlassCard({
  children,
  className,
  hover = true,
  glow = "purple",
}: GlassCardProps) {
  const glowColors = {
    purple:
      "shadow-[0_0_50px_rgba(168,85,247,0.4)] hover:shadow-[0_0_80px_rgba(168,85,247,0.6)]",
    blue: "shadow-[0_0_50px_rgba(59,130,246,0.4)] hover:shadow-[0_0_80px_rgba(59,130,246,0.6)]",
    cyan: "shadow-[0_0_50px_rgba(6,182,212,0.4)] hover:shadow-[0_0_80px_rgba(6,182,212,0.6)]",
    pink: "shadow-[0_0_50px_rgba(236,72,153,0.4)] hover:shadow-[0_0_80px_rgba(236,72,153,0.6)]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { scale: 1.02, y: -5 } : {}}
      transition={{ duration: 0.3 }}
      className={cn(
        // Glassmorphism base
        "relative backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5",
        "border border-white/20 rounded-2xl p-6",
        // Glow effect
        glowColors[glow],
        // Transition
        "transition-all duration-300",
        // Custom classes
        className
      )}
    >
      {/* Inner glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10 opacity-50" />

      {/* Shine effect */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        <div className="absolute -inset-full animate-shine bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

