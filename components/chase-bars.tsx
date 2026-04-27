import Link from "next/link";
import { cn, playerHeadshotUrl } from "@/lib/utils";
import type { ChasePace, FranchiseRecord } from "@/lib/franchise-records";

export interface ChaseRow {
  record: FranchiseRecord;
  chaser: {
    playerId: number;
    name: string;
    current: number;
    pct: number;
    pace: ChasePace;
  } | null;
}

function formatStatValue(value: number, unit: FranchiseRecord["unit"]): string {
  if (unit === "rate") {
    const s = value.toFixed(3);
    return s.startsWith("0") ? s.slice(1) : s;
  }
  return value.toLocaleString();
}

function barColor(pct: number, pace: ChasePace): string {
  if (pace === "shattered") return "from-gold to-yellow-300";
  if (pct >= 0.85) return "from-gold/90 to-gold";
  if (pct >= 0.5) return "from-teal/80 to-teal";
  if (pct >= 0.25) return "from-blue-500/80 to-blue-400";
  return "from-white/15 to-white/25";
}

function paceLabel(pace: ChasePace): { text: string; cls: string } {
  switch (pace) {
    case "shattered":
      return { text: "SHATTERED", cls: "bg-gold/20 text-gold border-gold/40" };
    case "on-track":
      return { text: "ON TRACK", cls: "bg-teal/15 text-teal border-teal/40" };
    case "unlikely":
      return { text: "UNLIKELY", cls: "bg-blue-500/15 text-blue-400 border-blue-500/40" };
    case "long-shot":
    default:
      return { text: "LONG SHOT", cls: "bg-white/5 text-muted border-white/10" };
  }
}

export function ChaseBars({ rows }: { rows: ChaseRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="trident-card p-5 text-center">
        <p className="text-xs text-muted">Stats unavailable.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map(({ record, chaser }) => {
        const fillPct = chaser ? Math.min(100, chaser.pct * 100) : 0;
        const overflow = chaser && chaser.pct > 1;
        const overflowExtra = overflow ? Math.min(100, (chaser!.pct - 1) * 100) : 0;
        const pace = chaser ? paceLabel(chaser.pace) : null;
        const colorClasses = chaser ? barColor(chaser.pct, chaser.pace) : "from-white/10 to-white/15";

        const inner = (
          <div className="trident-card p-4 group transition-colors hover:border-teal/25">
            <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg shrink-0">{record.emoji}</span>
                <p className="font-black text-primary text-sm truncate">{record.label}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-muted uppercase tracking-widest font-bold">Record</span>
                <span className="text-base font-black stat-number text-gold">
                  {formatStatValue(record.value, record.unit)}
                </span>
              </div>
            </div>

            <div className="relative h-3 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.06]">
              <div
                className={cn(
                  "absolute inset-y-0 left-0 bg-gradient-to-r transition-all duration-700",
                  colorClasses,
                  chaser?.pace === "shattered" && "shadow-[0_0_18px_rgba(248,196,22,0.55)] animate-pulse"
                )}
                style={{ width: `${fillPct}%` }}
              />
              {overflow && (
                <div
                  className="absolute inset-y-0 left-full bg-gold/40"
                  style={{ width: `${overflowExtra}%` }}
                />
              )}
              <div className="absolute inset-y-0 right-0 w-px bg-gold/60" />
            </div>

            <div className="flex items-baseline justify-between gap-3 mt-2 flex-wrap">
              <p className="text-[10px] text-muted">
                Holder: <span className="text-secondary font-bold">{record.holder.name}</span>
                <span className="text-muted/70"> · {record.holder.years}</span>
              </p>
              {chaser ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-secondary font-bold">
                    {chaser.name} ·{" "}
                    <span className="text-primary stat-number">
                      {formatStatValue(chaser.current, record.unit)}
                    </span>
                    <span className="text-muted/80"> ({(chaser.pct * 100).toFixed(0)}%)</span>
                  </span>
                  {pace && (
                    <span
                      className={cn(
                        "text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border",
                        pace.cls
                      )}
                    >
                      {pace.text}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-[10px] text-muted/70 italic">No active chaser this season.</span>
              )}
            </div>
          </div>
        );

        return chaser ? (
          <Link
            key={record.statKey}
            href={`/players/${chaser.playerId}`}
            className="block"
          >
            <div className="flex items-stretch gap-2">
              <div className="hidden sm:flex w-12 h-12 self-center rounded-full overflow-hidden bg-surface-2 border border-border shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={playerHeadshotUrl(chaser.playerId)}
                  alt={chaser.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">{inner}</div>
            </div>
          </Link>
        ) : (
          <div key={record.statKey}>{inner}</div>
        );
      })}
    </div>
  );
}
