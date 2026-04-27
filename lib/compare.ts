// Pure similarity/normalization helpers — no component imports

export type StatKey =
  | "avg" | "ops" | "hrPer600" | "kPct" | "bbPct" | "iso"
  | "babip" | "woba" | "wrcPlus" | "sbPct" | "xbhPct" | "runsPer27"
  | "era" | "fip" | "xfip" | "whip" | "kbb" | "hr9" | "lob" | "gbPct";

export interface NormalizationRange {
  min: number;
  max: number;
}

export interface DimensionDef {
  key: StatKey;
  label: string;
  higherIsBetter: boolean;
}

// MLB 2025 approximate full-range values
export const STAT_RANGES: Record<StatKey, NormalizationRange> = {
  avg:        { min: 0.140, max: 0.380 },
  ops:        { min: 0.440, max: 1.160 },
  hrPer600:   { min: 0,     max: 58    },
  kPct:       { min: 0.04,  max: 0.42  },
  bbPct:      { min: 0.02,  max: 0.22  },
  iso:        { min: 0.010, max: 0.350 },
  babip:      { min: 0.190, max: 0.410 },
  woba:       { min: 0.220, max: 0.470 },
  wrcPlus:    { min: 25,    max: 210   },
  sbPct:      { min: 0.40,  max: 1.00  },
  xbhPct:     { min: 0.04,  max: 0.60  },
  runsPer27:  { min: 0.5,   max: 11.0  },
  era:        { min: 0.80,  max: 8.00  },
  fip:        { min: 0.80,  max: 8.00  },
  xfip:       { min: 1.00,  max: 7.50  },
  whip:       { min: 0.55,  max: 2.30  },
  kbb:        { min: 0.20,  max: 10.0  },
  hr9:        { min: 0.00,  max: 3.00  },
  lob:        { min: 0.45,  max: 0.95  },
  gbPct:      { min: 0.22,  max: 0.68  },
};

export const STAT_LABELS: Record<StatKey, string> = {
  avg: "AVG", ops: "OPS", hrPer600: "HR/600", kPct: "K%", bbPct: "BB%",
  iso: "ISO", babip: "BABIP", woba: "wOBA", wrcPlus: "wRC+",
  sbPct: "SB%", xbhPct: "XBH%", runsPer27: "R/27",
  era: "ERA", fip: "FIP", xfip: "xFIP", whip: "WHIP",
  kbb: "K/BB", hr9: "HR/9", lob: "LOB%", gbPct: "GB%",
};

export const HITTER_DIMENSIONS: DimensionDef[] = [
  { key: "avg",      label: "AVG",    higherIsBetter: true  },
  { key: "ops",      label: "OPS",    higherIsBetter: true  },
  { key: "hrPer600", label: "HR/600", higherIsBetter: true  },
  { key: "kPct",     label: "K%",     higherIsBetter: false },
  { key: "bbPct",    label: "BB%",    higherIsBetter: true  },
  { key: "iso",      label: "ISO",    higherIsBetter: true  },
];

export const ALL_HITTER_DIMENSIONS: DimensionDef[] = [
  ...HITTER_DIMENSIONS,
  { key: "babip",     label: "BABIP",  higherIsBetter: true  },
  { key: "woba",      label: "wOBA",   higherIsBetter: true  },
  { key: "wrcPlus",   label: "wRC+",   higherIsBetter: true  },
  { key: "sbPct",     label: "SB%",    higherIsBetter: true  },
  { key: "xbhPct",    label: "XBH%",   higherIsBetter: true  },
  { key: "runsPer27", label: "R/27",   higherIsBetter: true  },
];

export const PITCHER_DIMENSIONS: DimensionDef[] = [
  { key: "era",  label: "ERA",  higherIsBetter: false },
  { key: "fip",  label: "FIP",  higherIsBetter: false },
  { key: "kPct", label: "K%",   higherIsBetter: true  },
  { key: "bbPct", label: "BB%", higherIsBetter: false },
  { key: "whip", label: "WHIP", higherIsBetter: false },
  { key: "lob",  label: "LOB%", higherIsBetter: true  },
];

export const ALL_PITCHER_DIMENSIONS: DimensionDef[] = [
  ...PITCHER_DIMENSIONS,
  { key: "xfip", label: "xFIP", higherIsBetter: false },
  { key: "kbb",  label: "K/BB", higherIsBetter: true  },
  { key: "hr9",  label: "HR/9", higherIsBetter: false },
  { key: "gbPct", label: "GB%", higherIsBetter: true  },
];

export function normalize(value: number, key: StatKey, higherIsBetter: boolean): number {
  const range = STAT_RANGES[key];
  if (!range) return 0;
  const { min, max } = range;
  const clamped = Math.max(min, Math.min(max, value));
  const raw = (clamped - min) / (max - min);
  return higherIsBetter ? raw : 1 - raw;
}

type HasStats = {
  id: number;
  isPitcher: boolean;
  isGhost?: boolean;
  stats: Record<string, number>;
};

export function cosineSimilarity(
  a: Record<string, number>,
  b: Record<string, number>,
  dims: DimensionDef[]
): number {
  const shared = dims.filter((d) => a[d.key] != null && b[d.key] != null);
  if (shared.length < 4) return 0;

  const va = shared.map((d) => normalize(a[d.key], d.key, d.higherIsBetter));
  const vb = shared.map((d) => normalize(b[d.key], d.key, d.higherIsBetter));

  const dot = va.reduce((s, v, i) => s + v * vb[i], 0);
  const magA = Math.sqrt(va.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(vb.reduce((s, v) => s + v * v, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

export function findTwins<T extends HasStats>(
  primary: T,
  pool: T[],
  dims: DimensionDef[],
  topN = 3
): Array<{ player: T; similarity: number }> {
  return pool
    .filter((p) => p.isPitcher === primary.isPitcher && p.id !== primary.id && !p.isGhost)
    .map((p) => ({
      player: p,
      similarity: cosineSimilarity(primary.stats, p.stats, dims),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN);
}

export function hasSmallSample(player: HasStats): boolean {
  if (player.isGhost) return false;
  if (player.isPitcher) {
    return (player.stats.inningsPitched ?? 0) < 10 && (player.stats.gamesPitched ?? 0) < 5;
  }
  const pa =
    player.stats.plateAppearances ??
    (player.stats.atBats ?? 0) +
      (player.stats.baseOnBalls ?? 0) +
      (player.stats.hitByPitch ?? 0) +
      (player.stats.sacFlies ?? 0);
  return pa < 50;
}
