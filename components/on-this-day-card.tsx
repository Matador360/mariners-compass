import Link from "next/link";
import { cn } from "@/lib/utils";
import type { OnThisDayEntry, HistoricalGameOnDate } from "@/lib/on-this-day";

interface OnThisDayCardProps {
  todayLabel: string;
  monthDay: string;
  curated: OnThisDayEntry[];
  historicalGames: HistoricalGameOnDate[];
}

export function OnThisDayCard({
  todayLabel,
  monthDay,
  curated,
  historicalGames,
}: OnThisDayCardProps) {
  return (
    <div className="trident-card p-6">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-5">
        <h3 className="text-xl font-black text-primary">
          📅 On This Day in M&apos;s History
        </h3>
        <span className="text-xs text-teal font-bold uppercase tracking-widest">
          {todayLabel}
        </span>
      </div>

      {curated.length > 0 ? (
        <div className="space-y-4">
          {curated.map((entry, i) => (
            <div
              key={`${entry.year}-${i}`}
              className="border-l-2 border-gold/30 pl-4 py-1"
            >
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xl">{entry.emoji}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gold">
                  {entry.year}
                </span>
                <p className="font-black text-primary text-sm">{entry.title}</p>
              </div>
              <p className="text-xs text-secondary leading-relaxed mt-1">
                {entry.blurb}
              </p>
              {entry.link && (
                <Link
                  href={entry.link}
                  className="inline-block mt-1 text-[10px] text-teal hover:text-teal/70 font-bold underline underline-offset-2 transition-colors"
                >
                  Read more →
                </Link>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted italic">
          No iconic moments cataloged for {todayLabel}. Yet.
        </p>
      )}

      {historicalGames.length > 0 && (
        <div className="mt-6 pt-5 border-t border-border/60">
          <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-3">
            Mariners Games on {monthDay}
          </p>
          <div className="space-y-1.5">
            {historicalGames.map((g) => {
              const chip =
                g.result === "W"
                  ? "bg-teal/15 text-teal border-teal/30"
                  : "bg-red-500/15 text-red-400 border-red-500/30";
              return (
                <Link
                  key={`${g.year}-${g.gamePk}`}
                  href={`/game/${g.gamePk}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] border border-transparent hover:border-white/[0.06] transition-colors"
                >
                  <span
                    className="text-xs font-bold tabular-nums text-muted w-12 shrink-0"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {g.year}
                  </span>
                  <span className="text-xs text-secondary flex-1 min-w-0">
                    {g.homeAway === "home" ? "vs" : "@"}{" "}
                    <span className="font-bold text-primary">{g.opponent}</span>
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border tabular-nums",
                      chip
                    )}
                  >
                    {g.result} {g.score.sea}–{g.score.opp}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
