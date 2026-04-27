import type { MLBHittingStats, MLBPitchingStats } from "@/types/mlb";

export type RecordTier = "hitting" | "pitching";
export type ChasePace = "on-track" | "unlikely" | "long-shot" | "shattered";

/**
 * Optional qualification gate for rate-stat records (AVG, OPS, ERA).
 *
 * MLB record books require minimum playing time so that a 4-PA hitter who
 * went 3-for-4 doesn't appear above .322 career average. The label on these
 * records already says "min 1000 PA" / "min 1000 IP"; this enforces it.
 *
 * For pitching records the field is `inningsPitched`, which the MLB API
 * returns as a string like "1234.1" (.1 = 1 out, .2 = 2 outs). We coerce
 * with parseFloat — close enough for a >=/<= gate at 1000.
 */
export interface RecordThreshold {
  /** Field on the MLBHittingStats / MLBPitchingStats object. */
  field: string;
  /** Minimum value (inclusive). */
  min: number;
}

export interface FranchiseRecord {
  statKey: string;
  label: string;
  emoji: string;
  holder: { name: string; mlbId?: number; years: string };
  value: number;
  unit?: "rate" | "int";
  tier: RecordTier;
  betterDirection: "higher" | "lower";
  /** If set, players below the threshold do not qualify for the chase. */
  threshold?: RecordThreshold;
}

export interface ChaseResult {
  current: number;
  pct: number;
  gap: number;
  pace: ChasePace;
  /**
   * False when the player's volume (PA / IP) is below the record's threshold.
   * Callers should hide non-qualifying chasers from leaderboards. Always
   * true for counting-stat records (no threshold defined).
   */
  qualifies: boolean;
}

// Verified against baseball-reference.com/teams/SEA/leaders.shtml as of 2026.
// Counting stats are integers, rate stats are kept as their published values.
export const FRANCHISE_RECORDS: FranchiseRecord[] = [
  {
    statKey: "hits",
    label: "Career Hits",
    emoji: "🎯",
    holder: { name: "Ichiro Suzuki", mlbId: 400085, years: "2001–2012" },
    value: 2542,
    unit: "int",
    tier: "hitting",
    betterDirection: "higher",
  },
  {
    statKey: "homeRuns",
    label: "Career Home Runs",
    emoji: "💣",
    holder: { name: "Ken Griffey Jr.", mlbId: 116338, years: "1989–1999, 2009" },
    value: 417,
    unit: "int",
    tier: "hitting",
    betterDirection: "higher",
  },
  {
    statKey: "rbi",
    label: "Career RBI",
    emoji: "🥎",
    holder: { name: "Edgar Martinez", mlbId: 118800, years: "1987–2004" },
    value: 1261,
    unit: "int",
    tier: "hitting",
    betterDirection: "higher",
  },
  {
    statKey: "runs",
    label: "Career Runs",
    emoji: "🏃",
    holder: { name: "Edgar Martinez", mlbId: 118800, years: "1987–2004" },
    value: 1219,
    unit: "int",
    tier: "hitting",
    betterDirection: "higher",
  },
  {
    statKey: "doubles",
    label: "Career Doubles",
    emoji: "↗️",
    holder: { name: "Edgar Martinez", mlbId: 118800, years: "1987–2004" },
    value: 514,
    unit: "int",
    tier: "hitting",
    betterDirection: "higher",
  },
  {
    statKey: "stolenBases",
    label: "Career Stolen Bases",
    emoji: "💨",
    holder: { name: "Julio Cruz", years: "1977–1983" },
    value: 290,
    unit: "int",
    tier: "hitting",
    betterDirection: "higher",
  },
  {
    statKey: "avg",
    label: "Career AVG (min 1000 PA)",
    emoji: "📐",
    holder: { name: "Ichiro Suzuki", mlbId: 400085, years: "2001–2012" },
    value: 0.322,
    unit: "rate",
    tier: "hitting",
    betterDirection: "higher",
    threshold: { field: "plateAppearances", min: 1000 },
  },
  {
    statKey: "ops",
    label: "Career OPS (min 1000 PA)",
    emoji: "📈",
    holder: { name: "Edgar Martinez", mlbId: 118800, years: "1987–2004" },
    value: 0.933,
    unit: "rate",
    tier: "hitting",
    betterDirection: "higher",
    threshold: { field: "plateAppearances", min: 1000 },
  },
  {
    statKey: "wins",
    label: "Career Wins (P)",
    emoji: "🏆",
    holder: { name: "Félix Hernández", mlbId: 433587, years: "2005–2019" },
    value: 169,
    unit: "int",
    tier: "pitching",
    betterDirection: "higher",
  },
  {
    statKey: "strikeOuts",
    label: "Career Strikeouts (P)",
    emoji: "🔥",
    holder: { name: "Félix Hernández", mlbId: 433587, years: "2005–2019" },
    value: 2524,
    unit: "int",
    tier: "pitching",
    betterDirection: "higher",
  },
  {
    statKey: "era",
    label: "Career ERA (P, min 1000 IP)",
    emoji: "🛡️",
    holder: { name: "Félix Hernández", mlbId: 433587, years: "2005–2019" },
    value: 3.42,
    unit: "rate",
    tier: "pitching",
    betterDirection: "lower",
    threshold: { field: "inningsPitched", min: 1000 },
  },
  {
    statKey: "saves",
    label: "Career Saves",
    emoji: "🔒",
    holder: { name: "Kazuhiro Sasaki", years: "2000–2003" },
    value: 129,
    unit: "int",
    tier: "pitching",
    betterDirection: "higher",
  },
];

export function mapStatKeyToCareerField(
  key: string
): { group: RecordTier; field: keyof MLBHittingStats | keyof MLBPitchingStats } {
  const record = FRANCHISE_RECORDS.find((r) => r.statKey === key);
  if (!record) {
    throw new Error(`Unknown franchise record statKey: ${key}`);
  }
  return {
    group: record.tier,
    field: record.statKey as keyof MLBHittingStats | keyof MLBPitchingStats,
  };
}

export function computeChase(
  record: FranchiseRecord,
  current: { hitting?: MLBHittingStats | null; pitching?: MLBPitchingStats | null },
  careerYearsAsMariner = 0
): ChaseResult {
  const stats = record.tier === "hitting" ? current.hitting : current.pitching;
  const raw = stats
    ? (stats as unknown as Record<string, string | number | undefined>)[record.statKey]
    : undefined;
  const currentValue =
    typeof raw === "number" ? raw : raw != null ? parseFloat(String(raw)) || 0 : 0;

  // Volume gate: rate-stat records require min PA / IP. Counting stats have
  // no threshold and always qualify.
  let qualifies = true;
  if (record.threshold && stats) {
    const thresholdRaw = (stats as unknown as Record<string, string | number | undefined>)[
      record.threshold.field
    ];
    const thresholdValue =
      typeof thresholdRaw === "number"
        ? thresholdRaw
        : thresholdRaw != null
          ? parseFloat(String(thresholdRaw)) || 0
          : 0;
    qualifies = thresholdValue >= record.threshold.min;
  } else if (record.threshold && !stats) {
    qualifies = false;
  }

  const ratio = record.value > 0 ? currentValue / record.value : 0;
  const pct = Math.max(0, Math.min(2, ratio));
  const gap = record.value - currentValue;

  let pace: ChasePace;
  if (pct >= 1.0) {
    pace = "shattered";
  } else if (pct >= 0.5 && careerYearsAsMariner <= 7) {
    pace = "on-track";
  } else if (pct >= 0.25) {
    pace = "unlikely";
  } else {
    pace = "long-shot";
  }

  return { current: currentValue, pct, gap, pace, qualifies };
}
