"use client";

import { cn, teamLogoUrl } from "@/lib/utils";
import type { MLBStandingsDivision } from "@/types/mlb";

interface StandingsWidgetProps {
  division: MLBStandingsDivision;
  highlightTeamId?: number;
  className?: string;
}

const TEAM_SNARK: Record<number, string> = {
  117: "sign stealers 🚩",
  140: "still living off '23",
  108: "Mike Trout hostage",
  133: "lol they moved",
  136: "us 💚",
};

// Subtle team accent colors for standings rows
const TEAM_ACCENTS: Record<number, string> = {
  117: "rgba(235,97,32,0.12)",   // HOU orange
  140: "rgba(0,49,166,0.10)",    // TEX blue
  108: "rgba(186,0,33,0.10)",    // LAA red
  133: "rgba(0,56,49,0.10)",     // OAK green
  136: "rgba(0,163,163,0.10)",   // SEA teal
};

const TEAM_BORDER: Record<number, string> = {
  117: "rgba(235,97,32,0.25)",
  140: "rgba(0,49,166,0.22)",
  108: "rgba(186,0,33,0.22)",
  133: "rgba(0,56,49,0.22)",
  136: "rgba(0,163,163,0.30)",
};

export function StandingsWidget({
  division,
  highlightTeamId = 136,
  className,
}: StandingsWidgetProps) {
  const teams = [...division.teamRecords].sort(
    (a, b) => parseFloat(b.pct) - parseFloat(a.pct)
  );

  return (
    <div className={cn("trident-card p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] uppercase tracking-[0.12em] text-muted font-semibold">
          AL West Standings
        </p>
        <span className="text-[10px] text-teal/60 italic">we&apos;re coming for you</span>
      </div>

      <div className="space-y-1.5">
        {teams.map((record, i) => {
          const isUs     = record.team.id === highlightTeamId;
          const winPct   = parseFloat(record.pct);
          const maxPct   = parseFloat(teams[0].pct);
          const barWidth = maxPct > 0 ? (winPct / maxPct) * 100 : 0;
          const snark    = TEAM_SNARK[record.team.id];
          const accent   = TEAM_ACCENTS[record.team.id] ?? "transparent";
          const borderC  = TEAM_BORDER[record.team.id] ?? "transparent";

          return (
            <div
              key={record.team.id}
              className={cn(
                "flex items-center gap-2 p-2.5 rounded-xl transition-all duration-200",
                isUs ? "shadow-sm" : "hover:bg-white/[0.03]"
              )}
              style={{
                background: isUs ? accent : undefined,
                border: isUs ? `1px solid ${borderC}` : "1px solid transparent",
              }}
            >
              {/* Rank */}
              <span
                className={cn(
                  "text-sm font-black w-5 text-center shrink-0",
                  i === 0 ? "text-gold" : isUs ? "text-teal" : "text-muted"
                )}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {i + 1}
              </span>

              {/* Logo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={teamLogoUrl(record.team.id)}
                alt={record.team.name}
                width={22}
                height={22}
                className={cn("w-5 h-5 object-contain shrink-0", !isUs && "opacity-70")}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />

              {/* Team + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex items-center gap-1.5">
                    <span
                      className={cn(
                        "text-xs font-bold",
                        isUs ? "text-teal" : "text-primary"
                      )}
                      style={{ fontFamily: "var(--font-grotesk)" }}
                    >
                      {record.team.abbreviation ?? record.team.teamName}
                    </span>
                    {snark && !isUs && (
                      <span className="text-[9px] text-muted/60 italic hidden sm:inline truncate">{snark}</span>
                    )}
                    {isUs && <span className="text-[9px] text-teal/70 italic">us 💚</span>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn("text-xs tabular-nums", isUs ? "text-primary font-semibold" : "text-secondary")}
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {record.wins}–{record.losses}
                    </span>
                    <span className="text-[9px] text-muted/60 w-9 text-right tabular-nums"
                      style={{ fontFamily: "var(--font-mono)" }}>
                      {record.gamesBack === "0.0" || record.gamesBack === "-"
                        ? <span className="text-teal/80 font-bold">–</span>
                        : `${record.gamesBack} GB`}
                    </span>
                  </div>
                </div>
                {/* Win pct bar */}
                <div className="mt-1 h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${barWidth}%`,
                      background: isUs
                        ? "linear-gradient(90deg, var(--accent-teal-dim), var(--accent-teal))"
                        : "rgba(255,255,255,0.2)",
                      boxShadow: isUs ? "0 0 6px rgba(0,163,163,0.5)" : undefined,
                    }}
                  />
                </div>
              </div>

              {/* Streak */}
              <span
                className={cn(
                  "text-[10px] font-bold w-7 text-right shrink-0",
                  record.streak.streakType === "wins" ? "text-win" : "text-loss"
                )}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {record.streak.streakCode}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
