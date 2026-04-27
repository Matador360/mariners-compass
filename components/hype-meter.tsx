import { cn } from "@/lib/utils";
import type { HypeBand } from "@/lib/hype";

interface Props {
  score: number;
  band: HypeBand;
  compact?: boolean;
  className?: string;
}

const BAND_META: Record<HypeBand, { color: string; label: string; emoji: string }> = {
  lock:   { color: "#00A3A3", label: "Lock",      emoji: "🔒" },
  high:   { color: "#22C55E", label: "High hype", emoji: "🔥" },
  medium: { color: "#F59E0B", label: "Watching",  emoji: "👀" },
  low:    { color: "#F43F5E", label: "Quiet",     emoji: "😬" },
  wait:   { color: "#71717A", label: "Wait list", emoji: "⏳" },
};

export function HypeMeter({ score, band, compact, className }: Props) {
  const meta = BAND_META[band];
  const pct = Math.max(0, Math.min(100, score));

  if (compact) {
    return (
      <div
        className={cn("flex items-center gap-1", className)}
        title={`Hype ${score} · ${meta.label}`}
      >
        <div className="relative w-12 h-1.5 rounded-full bg-surface-2 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${pct}%`, background: meta.color }}
          />
        </div>
        <span className="text-[9px] tabular-nums font-black" style={{ color: meta.color }}>
          {Math.round(score)}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-base leading-none">{meta.emoji}</span>
      <div className="flex-1 min-w-[80px]">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: meta.color }}>
            {meta.label}
          </span>
          <span className="text-sm font-black tabular-nums" style={{ color: meta.color }}>
            {Math.round(score)}
          </span>
        </div>
        <div className="relative h-2 rounded-full bg-surface-2 overflow-hidden mt-1">
          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, background: meta.color }} />
        </div>
      </div>
    </div>
  );
}
