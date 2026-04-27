import type { ProspectIntel, ToolGrades } from "@/lib/prospects-intel";

export type HypeBand = "lock" | "high" | "medium" | "low" | "wait";

export interface HypeResult {
  score: number;
  band: HypeBand;
  reason: string;
}

interface SeasonStats {
  hitting?: { avg?: number; ops?: number; ab?: number };
  pitching?: { era?: number; whip?: number; ip?: number };
}

type Level = "AAA" | "AA" | "A+" | "A" | "Rookie";

const TOOL_KEYS: (keyof ToolGrades)[] = [
  "hit",
  "power",
  "speed",
  "arm",
  "glove",
  "fastball",
  "slider",
  "curve",
  "changeup",
  "control",
  "command",
];

// "Ahead of curve" age targets per level.
const AHEAD_TARGET: Record<Level, number> = {
  AAA: 23,
  AA: 22,
  "A+": 21,
  A: 20,
  Rookie: 19,
};

interface Adjustment {
  delta: number;
  label: string;
}

export function computeHype(
  intel: ProspectIntel,
  currentSeasonStats?: SeasonStats,
  age?: number,
  level?: Level
): HypeResult {
  const adjustments: Adjustment[] = [];

  if (intel.rank <= 3) adjustments.push({ delta: 30, label: `Top-3 prospect (#${intel.rank})` });
  else if (intel.rank <= 10) adjustments.push({ delta: 20, label: `Top-10 prospect (#${intel.rank})` });
  else if (intel.rank <= 20) adjustments.push({ delta: 10, label: `Top-20 prospect (#${intel.rank})` });

  let plusGrades = 0;
  for (const k of TOOL_KEYS) {
    const v = intel.tools[k];
    if (typeof v === "number" && v >= 60) plusGrades += 1;
  }
  if (plusGrades > 0) {
    const delta = Math.min(20, plusGrades * 5);
    adjustments.push({ delta, label: `${plusGrades} plus tool${plusGrades === 1 ? "" : "s"} (60+)` });
  }

  if (level && typeof age === "number" && age > 0) {
    const target = AHEAD_TARGET[level];
    if (age < target) {
      const delta = level === "AAA" || level === "AA" ? 10 : 5;
      adjustments.push({ delta, label: `Ahead of curve at ${level} (age ${age})` });
    } else if (age >= target + 2) {
      adjustments.push({ delta: -10, label: `Old for ${level} (age ${age})` });
    }
  }

  const isPitcher = intel.tools.fastball !== undefined || intel.tools.control !== undefined || intel.tools.command !== undefined;
  if (currentSeasonStats) {
    if (!isPitcher && currentSeasonStats.hitting) {
      const ops = currentSeasonStats.hitting.ops ?? 0;
      const ab = currentSeasonStats.hitting.ab ?? 0;
      if (ab >= 50 && ops > 0.85) adjustments.push({ delta: 10, label: `Raking — OPS ${ops.toFixed(3)}` });
      else if (ab >= 50 && ops > 0 && ops < 0.68) adjustments.push({ delta: -15, label: `Struggling — OPS ${ops.toFixed(3)}` });
    }
    if (isPitcher && currentSeasonStats.pitching) {
      const era = currentSeasonStats.pitching.era ?? 99;
      const ip = currentSeasonStats.pitching.ip ?? 0;
      if (ip >= 15 && era > 0 && era < 3.2) adjustments.push({ delta: 10, label: `Dealing — ${era.toFixed(2)} ERA` });
      else if (ip >= 15 && era > 5.5) adjustments.push({ delta: -15, label: `Getting hit — ${era.toFixed(2)} ERA` });
    }
  }

  if (intel.injuryNote) adjustments.push({ delta: -10, label: `Health flag: ${intel.injuryNote}` });

  const total = adjustments.reduce((s, a) => s + a.delta, 0);
  const score = Math.max(0, Math.min(100, 50 + total));

  const band: HypeBand =
    score >= 85 ? "lock" : score >= 70 ? "high" : score >= 50 ? "medium" : score >= 30 ? "low" : "wait";

  const dominant = adjustments.length
    ? adjustments.reduce((a, b) => (Math.abs(a.delta) >= Math.abs(b.delta) ? a : b))
    : null;
  const reason = dominant ? dominant.label : "Average prospect baseline";

  return { score, band, reason };
}
