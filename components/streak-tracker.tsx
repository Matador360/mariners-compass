"use client";

import { cn } from "@/lib/utils";
import { Sparkline } from "./sparkline";
import Link from "next/link";

export interface PlayerStreak {
  id: number;
  name: string;
  position: string;
  streakType: "hitting" | "on-base" | "scoreless" | "save" | "slump";
  count: number;
  statLabel: string;
  statValue: string;
  last7Values: number[]; // for sparkline
  trend: "up" | "down" | "flat";
}

interface StreakTrackerProps {
  streaks: PlayerStreak[];
  className?: string;
}

const STREAK_CONFIG = {
  hitting: { emoji: "🔥", color: "#FFB700", label: "Hit Streak", bg: "bg-amber-500/8 border-amber-500/20" },
  "on-base": { emoji: "👟", color: "#22C55E", label: "OB Streak", bg: "bg-green-500/8 border-green-500/20" },
  scoreless: { emoji: "🎯", color: "#00A3A3", label: "Scoreless Inn", bg: "bg-teal/8 border-teal/20" },
  save: { emoji: "🔒", color: "#A78BFA", label: "Saves", bg: "bg-violet-500/8 border-violet-500/20" },
  slump: { emoji: "🥶", color: "#60A5FA", label: "Slump", bg: "bg-blue-400/8 border-blue-400/20" },
};

export function StreakTracker({ streaks, className }: StreakTrackerProps) {
  if (!streaks.length) return null;

  const hotStreaks = streaks.filter((s) => s.streakType !== "slump");
  const slumps = streaks.filter((s) => s.streakType === "slump");

  return (
    <div className={cn("trident-card p-5", className)}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">
          ⚡ Streak Tracker
        </p>
        <p className="text-[10px] text-muted">
          {hotStreaks.length} hot · {slumps.length} cold
        </p>
      </div>

      <div className="space-y-1.5">
        {streaks.slice(0, 8).map((s) => {
          const cfg = STREAK_CONFIG[s.streakType];
          return (
            <Link
              key={s.id}
              href={`/players/${s.id}`}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg border transition-colors hover:border-border-accent",
                cfg.bg
              )}
            >
              {/* Emoji + count */}
              <div className="flex flex-col items-center w-10 shrink-0">
                <span className="text-lg leading-none">{cfg.emoji}</span>
                <span
                  className="text-sm font-black leading-none mt-0.5 tabular-nums"
                  style={{ color: cfg.color }}
                >
                  {s.count}
                </span>
              </div>

              {/* Name + detail */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-bold text-primary truncate">{s.name}</span>
                  <span className="text-[10px] text-muted shrink-0">{s.position}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-secondary">{cfg.label}</span>
                  <span
                    className="text-[10px] font-bold tabular-nums"
                    style={{ color: cfg.color }}
                  >
                    {s.statValue} {s.statLabel}
                  </span>
                </div>
              </div>

              {/* Sparkline */}
              {s.last7Values.length > 1 && (
                <Sparkline
                  values={s.last7Values}
                  width={52}
                  height={20}
                  color={cfg.color}
                />
              )}

              {/* Trend arrow */}
              <span
                className="text-sm shrink-0"
                title={`Trending ${s.trend}`}
              >
                {s.trend === "up" ? "↗️" : s.trend === "down" ? "↘️" : "➡️"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Compute streaks from game logs
export function computeStreaks(
  gameLogs: Array<{
    playerId: number;
    name: string;
    position: string;
    isPitcher: boolean;
    logs: Array<{ stat: Record<string, number | string> }>;
  }>
): PlayerStreak[] {
  const streaks: PlayerStreak[] = [];

  for (const player of gameLogs) {
    if (!player.logs.length) continue;

    if (!player.isPitcher) {
      // Count consecutive games with a hit
      let hitStreak = 0;
      let obStreak = 0;
      const last7Hits: number[] = [];
      const last7Avg: number[] = [];

      for (const g of player.logs) {
        const h = Number(g.stat.hits ?? 0);
        const ab = Number(g.stat.atBats ?? 0);
        const bb = Number(g.stat.baseOnBalls ?? 0);
        const hbp = Number(g.stat.hitByPitch ?? 0);
        if (h > 0) hitStreak++;
        else break;
        if (ab + bb + hbp > 0) obStreak++;
      }

      for (const g of player.logs.slice(0, 7)) {
        last7Hits.push(Number(g.stat.hits ?? 0));
        const ab = Number(g.stat.atBats ?? 1);
        const h = Number(g.stat.hits ?? 0);
        last7Avg.push(ab > 0 ? h / ab : 0);
      }

      const recent7Avg = last7Avg.reduce((s, v) => s + v, 0) / Math.max(1, last7Avg.length);

      if (hitStreak >= 5) {
        streaks.push({
          id: player.playerId,
          name: player.name,
          position: player.position,
          streakType: "hitting",
          count: hitStreak,
          statLabel: "game hit streak",
          statValue: `${hitStreak}`,
          last7Values: [...last7Hits].reverse(),
          trend: recent7Avg > 0.3 ? "up" : recent7Avg < 0.2 ? "down" : "flat",
        });
      } else if (hitStreak === 0 && player.logs.slice(0, 7).every((g) => Number(g.stat.hits ?? 0) === 0)) {
        const atBats = player.logs.slice(0, 7).reduce((s, g) => s + Number(g.stat.atBats ?? 0), 0);
        if (atBats >= 14) {
          streaks.push({
            id: player.playerId,
            name: player.name,
            position: player.position,
            streakType: "slump",
            count: 7,
            statLabel: "hitless games",
            statValue: "0-for-last-7",
            last7Values: [...last7Hits].reverse(),
            trend: "down",
          });
        }
      }
    } else {
      // Pitcher: scoreless innings streak
      let scorelessInnings = 0;
      const last7ERA: number[] = [];

      for (const g of player.logs) {
        const er = Number(g.stat.earnedRuns ?? 0);
        const ip = parseFloat(String(g.stat.inningsPitched ?? "0"));
        if (er === 0 && ip > 0) scorelessInnings += ip;
        else break;
        const era = ip > 0 ? (er * 9) / ip : 0;
        if (last7ERA.length < 7) last7ERA.push(era);
      }

      if (scorelessInnings >= 10) {
        streaks.push({
          id: player.playerId,
          name: player.name,
          position: player.position,
          streakType: "scoreless",
          count: Math.round(scorelessInnings),
          statLabel: "scoreless inn",
          statValue: `${Math.round(scorelessInnings)}`,
          last7Values: [...last7ERA].reverse(),
          trend: "up",
        });
      }
    }
  }

  return streaks.sort((a, b) => {
    if (a.streakType === "slump" && b.streakType !== "slump") return 1;
    if (b.streakType === "slump" && a.streakType !== "slump") return -1;
    return b.count - a.count;
  });
}
