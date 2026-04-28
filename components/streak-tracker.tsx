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
  last7Values: number[];
  trend: "up" | "down" | "flat";
}

interface StreakTrackerProps {
  streaks: PlayerStreak[];
  className?: string;
}

const STREAK_CONFIG = {
  hitting:    { emoji: "🔥", color: "#FFB700", label: "Hit Streak",     bg: "bg-amber-500/8 border-amber-500/20",  glow: "ring-1 ring-amber-400/40 shadow-sm shadow-amber-400/20" },
  "on-base":  { emoji: "👟", color: "#22C55E", label: "OB Streak",      bg: "bg-green-500/8 border-green-500/20",  glow: "" },
  scoreless:  { emoji: "🎯", color: "#00A3A3", label: "Scoreless Inn",  bg: "bg-teal/8 border-teal/20",            glow: "ring-1 ring-teal/30 shadow-sm shadow-teal/20" },
  save:       { emoji: "🔒", color: "#A78BFA", label: "Saves",          bg: "bg-violet-500/8 border-violet-500/20", glow: "" },
  slump:      { emoji: "💀", color: "#F87171", label: "Slump",          bg: "bg-red-400/8 border-red-400/20",      glow: "" },
};

function hotComment(count: number, statValue: string): string {
  const v = parseFloat(statValue);
  if (!isNaN(v) && v > 0.400 && v < 2) return "This man is seeing beach balls 🏖️";
  if (count >= 10) return "This man is LOCKED. Do not pitch to him.";
  if (count >= 7)  return "This man is seeing beach balls 🏖️";
  if (count >= 5)  return "Feeling himself. Let him cook. Don't touch it.";
  return "Finding his groove.";
}

function coldComment(ops: string): string {
  const v = parseFloat(ops);
  if (!isNaN(v) && v < 0.400) return "💀 Historically bad. Someone send a chaplain.";
  if (!isNaN(v) && v < 0.550) return "Ice cold. Someone get this man a blanket ❄️";
  return "Going through it right now. It happens.";
}

export function StreakTracker({ streaks, className }: StreakTrackerProps) {
  const hotStreaks = streaks.filter((s) => s.streakType !== "slump");
  const slumps    = streaks.filter((s) => s.streakType === "slump");

  return (
    <div className={cn("streak-tracker trident-card p-5", className)}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">
          ⚡ Streak Tracker
        </p>
        <p className="text-[10px] text-muted">
          {hotStreaks.length} hot · {slumps.length} cold
        </p>
      </div>

      {streaks.length === 0 ? (
        <div className="text-center py-5 space-y-1">
          <p className="text-2xl">😶</p>
          <p className="text-sm font-medium text-secondary">Nobody&apos;s hot. Nobody&apos;s cold.</p>
          <p className="text-xs text-muted italic">We&apos;re all just... here. Classic Mariners.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {streaks.slice(0, 8).map((s) => {
            const cfg = STREAK_CONFIG[s.streakType];
            const isHot  = s.streakType !== "slump";
            const isCold = s.streakType === "slump";
            const comment = isHot ? hotComment(s.count, s.statValue) : isCold ? coldComment(s.statValue) : "";

            return (
              <Link
                key={s.id}
                href={`/players/${s.id}`}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg border transition-all hover:border-border-accent",
                  cfg.bg,
                  isHot  && s.count >= 7 ? cfg.glow : "",
                  isCold ? "opacity-80" : ""
                )}
              >
                {/* Emoji + count */}
                <div className="flex flex-col items-center w-10 shrink-0">
                  <span className={cn("text-lg leading-none", isHot && s.count >= 7 ? "animate-bounce" : "")}>
                    {cfg.emoji}
                  </span>
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
                    <span className="text-[10px] font-bold tabular-nums" style={{ color: cfg.color }}>
                      {s.statValue} {s.statLabel}
                    </span>
                  </div>
                  {comment && (
                    <p className="text-[9px] italic mt-0.5" style={{ color: cfg.color }}>
                      {comment}
                    </p>
                  )}
                </div>

                {/* Sparkline */}
                {s.last7Values.length > 1 && (
                  <Sparkline values={s.last7Values} width={52} height={20} color={cfg.color} />
                )}

                {/* Trend arrow */}
                <span className="text-sm shrink-0" title={`Trending ${s.trend}`}>
                  {s.trend === "up" ? "↗️" : s.trend === "down" ? "↘️" : "➡️"}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Compute hot/cold rankings — top 3 hot + top 3 cold by recent vs season performance
export function computeStreaks(
  gameLogs: Array<{
    playerId: number;
    name: string;
    position: string;
    isPitcher: boolean;
    logs: Array<{ stat: Record<string, number | string> }>;
  }>
): PlayerStreak[] {
  interface Candidate { streak: PlayerStreak; heatScore: number; isHot: boolean }
  const candidates: Candidate[] = [];

  for (const player of gameLogs) {
    if (player.logs.length < 3) continue;

    if (!player.isPitcher) {
      // Aggregate from all available logs (season sample)
      let totH = 0, totAB = 0, totBB = 0, totHBP = 0, totTB = 0;
      for (const g of player.logs) {
        totH   += Number(g.stat.hits ?? 0);
        totAB  += Number(g.stat.atBats ?? 0);
        totBB  += Number(g.stat.baseOnBalls ?? 0);
        totHBP += Number(g.stat.hitByPitch ?? 0);
        totTB  += Number(g.stat.totalBases ?? 0);
      }
      if (totAB < 10) continue;

      const seasonOBP = (totH + totBB + totHBP) / Math.max(1, totAB + totBB + totHBP);
      const seasonSLG = totTB / totAB;
      const seasonOPS = seasonOBP + seasonSLG;

      // Recent = last 7 games (first in array = most recent)
      const rec = player.logs.slice(0, 7);
      let recH = 0, recAB = 0, recBB = 0, recHBP = 0, recTB = 0;
      for (const g of rec) {
        recH   += Number(g.stat.hits ?? 0);
        recAB  += Number(g.stat.atBats ?? 0);
        recBB  += Number(g.stat.baseOnBalls ?? 0);
        recHBP += Number(g.stat.hitByPitch ?? 0);
        recTB  += Number(g.stat.totalBases ?? 0);
      }
      if (recAB < 8) continue; // less than 8 ABs in last 7 games — not enough signal

      const recOBP = (recH + recBB + recHBP) / Math.max(1, recAB + recBB + recHBP);
      const recSLG = recTB / recAB;
      const recOPS = recOBP + recSLG;
      const recAVG = recH / recAB;

      // Heat score: ratio of recent OPS to season OPS
      const heatScore = seasonOPS > 0.050 ? recOPS / seasonOPS : 1.0;

      // Hit streak
      let hitStreak = 0;
      for (const g of player.logs) {
        if (Number(g.stat.hits ?? 0) > 0) hitStreak++;
        else break;
      }

      const last7Hits = rec.map((g) => Number(g.stat.hits ?? 0)).reverse();
      const half = Math.floor(rec.length / 2);
      const firstHits = rec.slice(half).reduce((s, g) => s + Number(g.stat.hits ?? 0), 0);
      const recentHits = rec.slice(0, half).reduce((s, g) => s + Number(g.stat.hits ?? 0), 0);
      const trend: "up" | "down" | "flat" =
        recentHits > firstHits ? "up" : recentHits < firstHits ? "down" : "flat";

      if (heatScore >= 1.25 && recAVG >= 0.180) {
        // Hot hitter
        const hasStreak = hitStreak >= 5;
        candidates.push({
          streak: {
            id: player.playerId,
            name: player.name,
            position: player.position,
            streakType: hasStreak ? "hitting" : "on-base",
            count: hasStreak ? hitStreak : Math.round(recOPS * 1000),
            statLabel: hasStreak ? `${hitStreak}-game hit streak` : "OPS last 7",
            statValue: hasStreak
              ? recAVG.toFixed(3).replace(/^0/, "")
              : recOPS.toFixed(3).replace(/^0/, ""),
            last7Values: last7Hits,
            trend,
          },
          heatScore,
          isHot: true,
        });
      } else if (heatScore <= 0.68 && recAB >= 10) {
        // Cold hitter
        candidates.push({
          streak: {
            id: player.playerId,
            name: player.name,
            position: player.position,
            streakType: "slump",
            count: recAB,
            statLabel: "OPS last 7",
            statValue: recOPS.toFixed(3).replace(/^0/, ""),
            last7Values: last7Hits,
            trend: "down",
          },
          heatScore,
          isHot: false,
        });
      }
    } else {
      // Pitcher
      let totER = 0, totIP = 0;
      const last7ERA: number[] = [];
      for (const g of player.logs) {
        const ip = parseFloat(String(g.stat.inningsPitched ?? "0"));
        const er = Number(g.stat.earnedRuns ?? 0);
        totIP += ip;
        totER += er;
        if (last7ERA.length < 7 && ip > 0) last7ERA.push((er * 9) / ip);
      }
      if (totIP < 5) continue;
      const seasonERA = (totER * 9) / totIP;

      // Scoreless streak
      let scorelessInnings = 0;
      for (const g of player.logs) {
        const er = Number(g.stat.earnedRuns ?? 0);
        const ip = parseFloat(String(g.stat.inningsPitched ?? "0"));
        if (er === 0 && ip > 0) scorelessInnings += ip;
        else break;
      }

      // Recent 3 outings
      let recER = 0, recIP = 0;
      for (const g of player.logs.slice(0, 3)) {
        recER += Number(g.stat.earnedRuns ?? 0);
        recIP += parseFloat(String(g.stat.inningsPitched ?? "0"));
      }
      if (recIP < 2) continue;

      const recERA = (recER * 9) / recIP;
      // Inverted: lower ERA vs season = hotter
      const heatScore = seasonERA > 0 ? seasonERA / Math.max(0.1, recERA) : 1.0;

      const trend: "up" | "down" | "flat" =
        recERA < seasonERA * 0.75 ? "up" : recERA > seasonERA * 1.3 ? "down" : "flat";

      if (scorelessInnings >= 8 || heatScore >= 1.35) {
        const useScoreless = scorelessInnings >= 8;
        candidates.push({
          streak: {
            id: player.playerId,
            name: player.name,
            position: player.position,
            streakType: "scoreless",
            count: useScoreless ? Math.round(scorelessInnings) : Math.round(recIP),
            statLabel: useScoreless ? "scoreless inn" : "ERA last 3",
            statValue: useScoreless
              ? `${Math.round(scorelessInnings)}`
              : recERA.toFixed(2),
            last7Values: [...last7ERA].reverse(),
            trend,
          },
          heatScore,
          isHot: true,
        });
      } else if (heatScore <= 0.65 && recER >= 5) {
        candidates.push({
          streak: {
            id: player.playerId,
            name: player.name,
            position: player.position,
            streakType: "slump",
            count: Math.round(recER),
            statLabel: "ERA last 3",
            statValue: recERA.toFixed(2),
            last7Values: [...last7ERA].reverse(),
            trend: "down",
          },
          heatScore,
          isHot: false,
        });
      }
    }
  }

  const hot  = candidates.filter((c) => c.isHot) .sort((a, b) => b.heatScore - a.heatScore).slice(0, 3).map((c) => c.streak);
  const cold = candidates.filter((c) => !c.isHot).sort((a, b) => a.heatScore - b.heatScore).slice(0, 3).map((c) => c.streak);
  return [...hot, ...cold];
}
