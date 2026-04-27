import type { MLBPitchingStats } from "@/types/mlb";

// ---------- Types ----------

export interface RelieverGameLog {
  date: string;           // "YYYY-MM-DD"
  inningsPitched: number; // decimal (e.g., 1.333 for 1.1 IP)
  pitches: number;
  earnedRuns: number;
  strikeOuts: number;
  baseOnBalls: number;
}

export type FatigueStatus = "red" | "yellow" | "green" | "unknown";

export interface Fatigue {
  status: FatigueStatus;
  pitches1d: number;
  pitches2d: number;
  pitches3d: number;
  backToBack: boolean;
  threeInRow: boolean;
}

export type RelieverRole =
  | "Closer"
  | "Setup"
  | "High-leverage"
  | "Long"
  | "LOOGY"
  | "Mop-up"
  | "Middle";

export interface SeasonPitchingStats {
  era: number;
  inningsPitched: number;
  gamesAppeared: number;
  saves: number;
  holds: number;
  blownSaves: number;
  strikeOuts: number;
  baseOnBalls: number;
  hits: number;
  earnedRuns: number;
  avgIP: number;       // IP / G
}

export interface RelieverProfile {
  id: number;
  name: string;
  number: string;
  role: RelieverRole;
  season: SeasonPitchingStats;
  fatigue: Fatigue;
  last5: RelieverGameLog[];
}

export interface BullpenSummary {
  era: number;
  whip: number;
  saves: number;
  holds: number;
  blownSaves: number;
  kPer9: number;
  redCount: number;
  dread: number;
}

// ---------- IP parsing ----------

export function parseIP(ip: string | number): number {
  if (typeof ip === "number") return ip;
  const n = parseFloat(ip);
  const whole = Math.floor(n);
  const frac = Math.round((n - whole) * 10); // 0, 1, 2
  return whole + frac / 3;
}

// ---------- computeFatigue ----------

export function computeFatigue(logs: RelieverGameLog[]): Fatigue {
  const today = new Date();

  function daysAgo(dateStr: string): number {
    const d = new Date(dateStr);
    return Math.floor((today.getTime() - d.getTime()) / 86400000);
  }

  const recent = logs
    .map((g) => ({ ...g, daysAgo: daysAgo(g.date) }))
    .filter((g) => g.daysAgo >= 0 && g.daysAgo <= 3)
    .sort((a, b) => a.daysAgo - b.daysAgo);

  const pitched1d = recent.filter((g) => g.daysAgo <= 1);
  const pitched2d = recent.filter((g) => g.daysAgo <= 2);
  const pitched3d = recent.filter((g) => g.daysAgo <= 3);

  const pitches1d = pitched1d.reduce((s, g) => s + g.pitches, 0);
  const pitches2d = pitched2d.reduce((s, g) => s + g.pitches, 0);
  const pitches3d = pitched3d.reduce((s, g) => s + g.pitches, 0);

  // Back-to-back: pitched yesterday and today (daysAgo 0 and 1)
  const backToBack =
    recent.some((g) => g.daysAgo === 0) && recent.some((g) => g.daysAgo === 1);

  // Three-in-a-row: pitched in 3 consecutive days (0,1,2)
  const threeInRow =
    recent.some((g) => g.daysAgo === 0) &&
    recent.some((g) => g.daysAgo === 1) &&
    recent.some((g) => g.daysAgo === 2);

  let status: FatigueStatus = "unknown";

  if (pitched3d.length === 0) {
    status = "green";
  } else if (threeInRow || pitches2d >= 45 || pitches3d >= 65) {
    status = "red";
  } else if (backToBack || pitches2d >= 30 || pitches3d >= 45) {
    status = "yellow";
  } else {
    status = "green";
  }

  return { status, pitches1d, pitches2d, pitches3d, backToBack, threeInRow };
}

// ---------- inferRole ----------

export function inferRole(season: SeasonPitchingStats): RelieverRole {
  const { saves, holds, avgIP, gamesAppeared } = season;

  if (saves >= 5) return "Closer";
  if (holds >= 5) return "Setup";
  if (avgIP >= 3.0) return "Long";
  if (avgIP <= 0.67 && gamesAppeared >= 10) return "LOOGY"; // ~2 outs avg
  if (season.era > 5.5 && gamesAppeared >= 8) return "Mop-up";
  if (holds >= 2 || season.era < 3.75) return "High-leverage";
  return "Middle";
}

// ---------- last5Summary ----------

export function last5Summary(logs: RelieverGameLog[]): RelieverGameLog[] {
  return [...logs]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
}

// ---------- summarizeBullpen ----------

export function summarizeBullpen(
  teamPitching: MLBPitchingStats | null,
  relievers: RelieverProfile[]
): BullpenSummary {
  const era = teamPitching ? parseFloat(teamPitching.era) : 0;
  const whip = teamPitching ? parseFloat(teamPitching.whip) : 0;
  const saves = teamPitching?.saves ?? 0;
  const holds = teamPitching?.holds ?? 0;
  const blownSaves = teamPitching?.blownSaves ?? 0;

  const ip = teamPitching ? parseIP(teamPitching.inningsPitched) : 1;
  const kPer9 = ip > 0 ? ((teamPitching?.strikeOuts ?? 0) / ip) * 9 : 0;

  const redCount = relievers.filter((r) => r.fatigue.status === "red").length;
  const dread = dreadScore(era, redCount, relievers.length);

  return { era, whip, saves, holds, blownSaves, kPer9, redCount, dread };
}

// ---------- dreadScore ----------

export function dreadScore(
  last10ERA: number,
  redCount: number,
  total: number
): number {
  const eraNorm = Math.min(1, Math.max(0, (last10ERA - 2.5) / 5)); // 2.5=0 → 7.5=1
  const redPct = total > 0 ? redCount / total : 0;
  return Math.round((eraNorm * 0.6 + redPct * 0.4) * 100);
}
