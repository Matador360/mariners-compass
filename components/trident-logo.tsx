"use client";

import { cn } from "@/lib/utils";

interface TridentLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function TridentLogo({ size = 32, className, animated = false }: TridentLogoProps) {
  const w = size * 0.7;
  const h = size;
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 28 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(animated && "trident-spinner", className)}
      aria-label="Trident logo"
    >
      {/* Left prong */}
      <path
        d="M5 0 L5 10 L14 15"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right prong */}
      <path
        d="M23 0 L23 10 L14 15"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Center prong (tallest) */}
      <path
        d="M14 0 L14 15"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Shaft */}
      <path
        d="M14 15 L14 40"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Cross guard */}
      <path
        d="M8 30 L20 30"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Prong tips — small dots */}
      <circle cx="5" cy="0" r="1.5" fill="currentColor" />
      <circle cx="23" cy="0" r="1.5" fill="currentColor" />
      <circle cx="14" cy="0" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function TridentDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 text-teal/40", className)}>
      <div className="flex-1 h-px bg-border" />
      <TridentLogo size={16} className="opacity-50" />
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
