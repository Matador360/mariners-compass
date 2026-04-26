import { cn } from "@/lib/utils";
import type { MarinersMood } from "@/types/mlb";

interface MoodIndicatorProps {
  mood: MarinersMood;
  className?: string;
}

const MOOD_BG: Record<string, string> = {
  "🔥": "from-amber-500/10 to-orange-500/5 border-amber-500/20",
  "😎": "from-teal/10 to-cyan-500/5 border-teal/20",
  "😐": "from-surface-2/50 to-surface/50 border-border",
  "😬": "from-red-500/10 to-rose-500/5 border-red-500/20",
};

export function MoodIndicator({ mood, className }: MoodIndicatorProps) {
  const bgClass = MOOD_BG[mood.emoji] ?? MOOD_BG["😐"];

  return (
    <div
      className={cn(
        "trident-card p-5 bg-gradient-to-br",
        bgClass,
        className
      )}
    >
      <p className="text-[10px] uppercase tracking-widest text-muted mb-2 font-semibold">
        Mariners Mood
      </p>

      <div className="flex items-center gap-3">
        <span className="text-5xl mood-emoji leading-none" aria-label={mood.label}>
          {mood.emoji}
        </span>
        <div>
          <p className="text-xl font-bold text-primary leading-tight">{mood.label}</p>
          <p className="text-sm text-secondary mt-0.5">{mood.description}</p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
        <span className="text-muted">
          Last 10:{" "}
          <span className="text-win font-bold">{mood.last10W}W</span>
          {" "}
          <span className="text-loss font-bold">{mood.last10L}L</span>
        </span>
        <span className={cn(
          "font-bold",
          mood.runDiff10 > 0 ? "text-win" : mood.runDiff10 < 0 ? "text-loss" : "text-muted"
        )}>
          {mood.runDiff10 > 0 ? "+" : ""}{mood.runDiff10} run diff
        </span>
        <span className="text-muted">
          Streak:{" "}
          <span className={cn(
            "font-bold",
            mood.streakCode.startsWith("W") ? "text-win" : "text-loss"
          )}>
            {mood.streakCode}
          </span>
        </span>
      </div>
    </div>
  );
}
