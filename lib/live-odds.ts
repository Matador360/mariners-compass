/**
 * Count-aware live odds.
 *
 * The 12 ball-strike counts are not equal. League-wide MLB data shows OBP swings
 * from ~.150 (after 0-2) to ~.640 (after 3-0). We multiply a batter's season OBP
 * by the count's leverage factor to project their on-base odds for the rest of
 * THIS at-bat.
 *
 * Source: Aggregated from FanGraphs / Baseball Savant league count splits
 * (2022-2024 averages, rounded). Treat as approximations — the goal is a number
 * that moves intuitively with the count, not an exact projection model.
 */

export interface CountLeague {
  obp: number;     // league OBP for plate appearances reaching this count
  slg: number;     // league SLG
  kPct: number;    // % of PAs that end in K from this count
  bbPct: number;   // % of PAs that end in BB from this count
  woba: number;    // weighted on-base avg from this count
}

export const COUNT_LEAGUE: Record<string, CountLeague> = {
  // Even / start
  '0-0': { obp: 0.317, slg: 0.408, kPct: 0.222, bbPct: 0.085, woba: 0.317 },
  // Hitter ahead
  '1-0': { obp: 0.376, slg: 0.464, kPct: 0.165, bbPct: 0.119, woba: 0.358 },
  '2-0': { obp: 0.470, slg: 0.557, kPct: 0.110, bbPct: 0.241, woba: 0.443 },
  '3-0': { obp: 0.640, slg: 0.520, kPct: 0.040, bbPct: 0.620, woba: 0.530 },
  '2-1': { obp: 0.385, slg: 0.480, kPct: 0.180, bbPct: 0.150, woba: 0.371 },
  '3-1': { obp: 0.520, slg: 0.610, kPct: 0.090, bbPct: 0.395, woba: 0.480 },
  // Pitcher ahead
  '0-1': { obp: 0.272, slg: 0.348, kPct: 0.275, bbPct: 0.058, woba: 0.276 },
  '0-2': { obp: 0.165, slg: 0.225, kPct: 0.490, bbPct: 0.030, woba: 0.180 },
  '1-2': { obp: 0.205, slg: 0.281, kPct: 0.420, bbPct: 0.060, woba: 0.219 },
  '2-2': { obp: 0.265, slg: 0.355, kPct: 0.345, bbPct: 0.115, woba: 0.275 },
  // Even later
  '1-1': { obp: 0.318, slg: 0.408, kPct: 0.230, bbPct: 0.092, woba: 0.317 },
  // Full count
  '3-2': { obp: 0.380, slg: 0.420, kPct: 0.250, bbPct: 0.310, woba: 0.370 },
};

export const LEAGUE_OBP_BASELINE = 0.317;
export const LEAGUE_SLG_BASELINE = 0.408;
export const LEAGUE_K_PCT = 0.222;
export const LEAGUE_BB_PCT = 0.085;

function key(balls: number, strikes: number): string {
  const b = Math.max(0, Math.min(3, balls));
  const s = Math.max(0, Math.min(2, strikes));
  return `${b}-${s}`;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Project on-base odds for the rest of this at-bat given the current count. */
export function liveOnBaseOdds(seasonOBP: number, balls: number, strikes: number): number {
  const ctx = COUNT_LEAGUE[key(balls, strikes)];
  if (!ctx) return seasonOBP;
  const factor = ctx.obp / LEAGUE_OBP_BASELINE;
  return clamp(seasonOBP * factor, 0.04, 0.85);
}

/** Project hit probability if the next swing makes contact. */
export function liveHitProb(seasonXBA: number, balls: number, strikes: number): number {
  const ctx = COUNT_LEAGUE[key(balls, strikes)];
  if (!ctx) return seasonXBA;
  // Hit probability scales with SLG context (good counts → harder contact)
  const factor = ctx.slg / LEAGUE_SLG_BASELINE;
  return clamp(seasonXBA * factor, 0.05, 0.75);
}

/**
 * Strikeout risk for the AB given count + pitcher's K-tendency + batter's K-tendency.
 *
 * pitcherKpct/batterKpct should be season K rates (decimals; e.g. 0.27 for 27%).
 */
export function liveKRisk(
  pitcherKpct: number,
  batterKpct: number,
  balls: number,
  strikes: number,
): number {
  const ctx = COUNT_LEAGUE[key(balls, strikes)];
  if (!ctx) return (pitcherKpct + batterKpct) / 2;
  const countFactor = ctx.kPct / LEAGUE_K_PCT;
  const blended = (pitcherKpct + batterKpct) / 2;
  return clamp(blended * countFactor, 0.01, 0.98);
}

/** Walk probability: blends pitcher BB% × batter BB% × count factor. */
export function liveBBProb(
  pitcherBBpct: number,
  batterBBpct: number,
  balls: number,
  strikes: number,
): number {
  const ctx = COUNT_LEAGUE[key(balls, strikes)];
  if (!ctx) return (pitcherBBpct + batterBBpct) / 2;
  const countFactor = ctx.bbPct / LEAGUE_BB_PCT;
  const blended = (pitcherBBpct + batterBBpct) / 2;
  return clamp(blended * countFactor, 0.0, 0.95);
}

/** Returns short tag describing whether the count favors hitter / pitcher / neutral. */
export function countLean(balls: number, strikes: number): 'hitter' | 'pitcher' | 'neutral' {
  const obp = COUNT_LEAGUE[key(balls, strikes)]?.obp ?? LEAGUE_OBP_BASELINE;
  if (obp > LEAGUE_OBP_BASELINE + 0.04) return 'hitter';
  if (obp < LEAGUE_OBP_BASELINE - 0.04) return 'pitcher';
  return 'neutral';
}
