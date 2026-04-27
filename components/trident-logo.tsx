"use client";

import { cn } from "@/lib/utils";

interface TridentLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
  glow?: boolean;
}

export function TridentLogo({ size = 32, className, animated = false, glow = false }: TridentLogoProps) {
  const w = size * 0.72;
  const h = size;
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 36 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        animated && "trident-spinner",
        glow && "drop-shadow-[0_0_8px_rgba(0,163,163,0.8)]",
        className
      )}
      aria-label="Trident"
    >
      {/* Left prong — curves inward */}
      <path
        d="M6 1 L6 13 Q6 18 18 20"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Right prong — curves inward */}
      <path
        d="M30 1 L30 13 Q30 18 18 20"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Center prong — tallest */}
      <path
        d="M18 1 L18 20"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Shaft */}
      <path
        d="M18 20 L18 51"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Cross guard with slight taper */}
      <path
        d="M10 39 Q14 37 18 38 Q22 37 26 39"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Prong tips — filled diamonds */}
      <polygon points="6,1 8.5,4 6,7 3.5,4" fill="currentColor" />
      <polygon points="30,1 32.5,4 30,7 27.5,4" fill="currentColor" />
      <polygon points="18,0 20.5,3 18,6 15.5,3" fill="currentColor" />
    </svg>
  );
}

export function TridentDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <TridentLogo size={14} className="text-teal/40" />
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
}
