"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  tabIndex?: number;
  ariaLabel?: string;
}

export default function Button({
  children,
  onClick,
  variant = "primary",
  className,
  disabled = false,
  type = "button",
  tabIndex = 0,
  ariaLabel,
}: ButtonProps) {
  const variants = {
    primary:
      "bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-[0_0_50px_rgba(168,85,247,0.5)] hover:shadow-[0_0_80px_rgba(168,85,247,0.8)]",
    secondary:
      "backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20",
    ghost: "bg-transparent hover:bg-white/10",
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={disabled}
      type={type}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      className={cn(
        "px-6 py-3 rounded-lg font-semibold transition-all duration-300",
        variants[variant],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {children}
    </motion.button>
  );
}

