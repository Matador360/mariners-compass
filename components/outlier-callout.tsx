import { cn } from "@/lib/utils";
import type { OutlierFact } from "@/lib/calc-stats";

interface OutlierCalloutProps {
  fact: OutlierFact;
  className?: string;
}

const TIER_STYLES: Record<string, string> = {
  elite: "border-gold/40 bg-gradient-to-br from-gold/10 to-amber-500/5",
  good: "border-teal/40 bg-gradient-to-br from-teal/10 to-cyan-500/5",
  bad: "border-orange-500/40 bg-gradient-to-br from-orange-500/8 to-amber-500/5",
  terrible: "border-red-500/40 bg-gradient-to-br from-red-500/10 to-rose-500/5",
};

const TIER_TEXT: Record<string, string> = {
  elite: "text-gold",
  good: "text-teal",
  bad: "text-orange-400",
  terrible: "text-red-400",
};

export function OutlierCallout({ fact, className }: OutlierCalloutProps) {
  return (
    <div className={cn("trident-card p-4 relative overflow-hidden", TIER_STYLES[fact.tier], className)}>
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0 leading-none mt-0.5">{fact.emoji}</span>
        <div>
          <p className={cn("text-sm font-black leading-tight", TIER_TEXT[fact.tier])}>
            {fact.headline}
          </p>
          <p className="text-xs text-secondary mt-0.5">{fact.detail}</p>
        </div>
      </div>
    </div>
  );
}

interface TeamOutlierProps {
  rank: number;
  total: number;
  stat: string;
  value: string;
  higherIsBetter?: boolean;
  className?: string;
}

export function TeamOutlier({
  rank,
  total,
  stat,
  value,
  higherIsBetter = true,
  className,
}: TeamOutlierProps) {
  const pct = rank / total;
  const isGreat = higherIsBetter ? pct <= 0.1 : pct >= 0.9;
  const isGood = higherIsBetter ? pct <= 0.25 : pct >= 0.75;
  const isBad = higherIsBetter ? pct >= 0.75 : pct <= 0.25;
  const isAwful = higherIsBetter ? pct >= 0.9 : pct <= 0.1;

  const tier = isGreat ? "elite" : isGood ? "good" : isAwful ? "terrible" : isBad ? "bad" : "neutral";

  const rankWord =
    rank === 1
      ? "1st"
      : rank === 2
      ? "2nd"
      : rank === 3
      ? "3rd"
      : `${rank}th`;

  const emoji = isGreat ? "🔥" : isGood ? "📈" : isAwful ? "💀" : isBad ? "📉" : "➖";
  const deadLast = (higherIsBetter && rank === total) || (!higherIsBetter && rank === 1);

  if (tier === "neutral") return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2.5 rounded-lg border text-xs",
        tier === "elite" && "border-gold/30 bg-gold/5",
        tier === "good" && "border-teal/25 bg-teal/5",
        tier === "bad" && "border-orange-400/25 bg-orange-400/5",
        tier === "terrible" && "border-red-500/30 bg-red-500/8",
        className
      )}
    >
      <span>{emoji}</span>
      <span className={cn(
        "font-bold",
        tier === "elite" && "text-gold",
        tier === "good" && "text-teal",
        tier === "bad" && "text-orange-400",
        tier === "terrible" && "text-red-400",
      )}>
        {deadLast ? "DEAD LAST" : rankWord}
      </span>
      <span className="text-secondary">
        in {stat} ({value}) among MLB teams
      </span>
    </div>
  );
}
