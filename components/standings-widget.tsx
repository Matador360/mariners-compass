"use client";

import { cn, teamLogoUrl } from "@/lib/utils";
import type { MLBStandingsDivision } from "@/types/mlb";

interface StandingsWidgetProps {
  division: MLBStandingsDivision;
  highlightTeamId?: number;
  className?: string;
}

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
      <p className="text-[10px] uppercase tracking-widest text-muted mb-3 font-semibold">
        AL West Standings
      </p>

      <div className="space-y-1">
        {teams.map((record, i) => {
          const isUs = record.team.id === highlightTeamId;
          const winPct = parseFloat(record.pct);
          const maxPct = parseFloat(teams[0].pct);
          const barWidth = maxPct > 0 ? (winPct / maxPct) * 100 : 0;

          return (
            <div
              key={record.team.id}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg transition-colors",
                isUs
                  ? "bg-teal/10 border border-teal/20"
                  : "hover:bg-surface-2/50"
              )}
            >
              {/* Rank */}
              <span
                className={cn(
                  "text-xs font-bold w-4 text-center shrink-0",
                  i === 0 ? "text-gold" : "text-muted"
                )}
              >
                {i + 1}
              </span>

              {/* Logo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={teamLogoUrl(record.team.id)}
                alt={record.team.name}
                width={20}
                height={20}
                className="w-5 h-5 object-contain shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />

              {/* Team + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "text-xs font-semibold truncate",
                      isUs ? "text-teal" : "text-primary"
                    )}
                  >
                    {record.team.abbreviation ?? record.team.teamName}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs tabular-nums text-secondary">
                      {record.wins}–{record.losses}
                    </span>
                    <span className="text-[10px] text-muted w-8 text-right">
                      {record.gamesBack === "0.0" || record.gamesBack === "-"
                        ? "–"
                        : `${record.gamesBack} GB`}
                    </span>
                  </div>
                </div>
                {/* Win pct bar */}
                <div className="mt-0.5 h-0.5 bg-surface-2 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isUs ? "bg-teal" : "bg-muted/50"
                    )}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>

              {/* Streak */}
              <span
                className={cn(
                  "text-[10px] font-bold w-8 text-right shrink-0",
                  record.streak.streakType === "wins" ? "text-win" : "text-loss"
                )}
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
