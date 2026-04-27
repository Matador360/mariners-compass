import { Sparkline } from "@/components/sparkline";
import { playerHeadshotUrl } from "@/lib/utils";

export interface CoolerCard {
  id: number;
  name: string;
  position: string;
  hotScore: number;
  primaryStat?: string;
  primaryStatLabel?: string;
  trendValues: number[];
  slumpDriver?: string;
}

export function TheCooler({
  coldPlayers,
  max = 5,
}: {
  coldPlayers: CoolerCard[];
  max?: number;
}) {
  const list = coldPlayers.slice(0, max);
  if (!list.length) return null;

  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-lg font-black text-primary tracking-tight">🥶 The Cooler</h2>
        <span className="text-[10px] uppercase tracking-wider text-muted">
          Sliding hardest
        </span>
      </div>
      <div className="space-y-1.5">
        {list.map((p, i) => (
          <a
            key={p.id}
            href={`/players/${p.id}`}
            className="trident-card p-3 flex items-center gap-3 hover:border-border-accent transition-colors group"
          >
            <div className="flex flex-col items-center w-8 shrink-0">
              <span className="text-sm font-black text-blue-400 tabular-nums leading-none">
                {i + 1}
              </span>
              <span className="text-[10px] text-muted">cold</span>
            </div>
            <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-2 border border-border shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={playerHeadshotUrl(p.id)}
                alt={p.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-primary group-hover:text-blue-300 transition-colors truncate">
                  {p.name}
                </span>
                <span className="text-[10px] text-muted shrink-0">{p.position}</span>
              </div>
              {p.slumpDriver && (
                <p className="text-[10px] text-blue-300/80 truncate mt-0.5">
                  {p.slumpDriver}
                </p>
              )}
            </div>
            <div className="text-center shrink-0 w-14">
              {p.primaryStat && (
                <>
                  <p className="text-xs font-black text-primary tabular-nums">
                    {p.primaryStat}
                  </p>
                  <p className="text-[9px] text-muted">{p.primaryStatLabel}</p>
                </>
              )}
            </div>
            {p.trendValues.length > 1 && (
              <Sparkline
                values={p.trendValues}
                width={48}
                height={20}
                color="#3B82F6"
              />
            )}
            <div className="shrink-0 hidden sm:flex items-center gap-1.5">
              <span className="text-sm">🥶</span>
              <div className="w-16 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${Math.max(0, Math.min(100, p.hotScore))}%` }}
                />
              </div>
              <span className="text-[10px] tabular-nums text-secondary w-5">
                {Math.round(p.hotScore)}
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
