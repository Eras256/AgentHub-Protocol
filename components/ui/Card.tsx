"use client";

import { ReactNode } from "react";
import GlassCard from "@/components/effects/GlassCard";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: "purple" | "blue" | "cyan" | "pink";
  hover?: boolean;
}

export default function Card({
  children,
  className,
  glow = "purple",
  hover = true,
}: CardProps) {
  return (
    <GlassCard glow={glow} hover={hover} className={cn(className)}>
      {children}
    </GlassCard>
  );
}

