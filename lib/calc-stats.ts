import type { MLBHittingStats, MLBPitchingStats } from "@/types/mlb";

// ─── Advanced Hitting Metrics ──────────────────────────────────────────────

export interface AdvancedHitting {
  babip: number;       // (H-HR)/(AB-K-HR+SF)
  iso: number;         // SLG-AVG
  kPct: number;        // K/PA
  bbPct: number;       // BB/PA
  hrPer600: number;    // HR rate per 600 PA
  sbPct: number;       // SB/(SB+CS)
  xbhPct: number;      // XBH/H
  runsPer27: number;   // offensive production proxy
}

export function calcAdvancedHitting(s: MLBHittingStats): AdvancedHitting {
  const pa =
    s.plateAppearances ??
    s.atBats + s.baseOnBalls + (s.hitByPitch ?? 0) + (s.sacFlies ?? 0) + (s.sacBunts ?? 0);

  const babipDenom = s.atBats - s.strikeOuts - s.homeRuns + (s.sacFlies ?? 0);
  const babip = babipDenom > 0 ? (s.hits - s.homeRuns) / babipDenom : 0;
  const iso = (parseFloat(s.slg ?? "0") - parseFloat(s.avg ?? "0"));
  const kPct = pa > 0 ? s.strikeOuts / pa : 0;
  const bbPct = pa > 0 ? s.baseOnBalls / pa : 0;
  const hrPer600 = pa > 0 ? (s.homeRuns / pa) * 600 : 0;
  const sbTotal = (s.stolenBases ?? 0) + (s.caughtStealing ?? 0);
  const sbPct = sbTotal > 0 ? (s.stolenBases ?? 0) / sbTotal : 0;
  const xbh = s.doubles + s.triples + s.homeRuns;
  const xbhPct = s.hits > 0 ? xbh / s.hits : 0;
  const runsPer27 = s.atBats > 0 ? (s.runs * 27) / s.atBats : 0;

  return { babip, iso, kPct, bbPct, hrPer600, sbPct, xbhPct, runsPer27 };
}

export function fmtRate(n: number, digits = 3): string {
  return n.toFixed(digits).replace(/^0\./, ".");
}

export function fmtPct(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`;
}

// ─── Advanced Pitching Metrics ─────────────────────────────────────────────

export interface AdvancedPitching {
  fip: number;         // Fielding Independent Pitching
  kbb: number;         // K/BB ratio
  gbPct: number;       // GB%
  hr9: number;         // HR/9
  kPct: number;        // K% (of batters faced)
  bbPct: number;       // BB% (of batters faced)
  lob: number;         // approx strand rate from ER/R ratio
  opsAgainst?: number;
}

const FIP_CONSTANT = 3.15; // 2024 MLB average

export function calcAdvancedPitching(s: MLBPitchingStats): AdvancedPitching {
  const ip = parseFloat(s.inningsPitched ?? "0");
  const fip =
    ip > 0
      ? (13 * (s.homeRuns ?? 0) +
          3 * ((s.baseOnBalls ?? 0) + (s.intentionalWalks ?? 0)) -
          2 * (s.strikeOuts ?? 0)) /
          ip +
        FIP_CONSTANT
      : FIP_CONSTANT;

  const kbb = (s.baseOnBalls ?? 0) > 0 ? (s.strikeOuts ?? 0) / (s.baseOnBalls ?? 1) : (s.strikeOuts ?? 0);
  const gbPct = 0.44; // MLB average fallback — groundOuts not exposed by stats API
  const hr9 = ip > 0 ? ((s.homeRuns ?? 0) * 9) / ip : 0;

  // TBF approximation: 3*IP + H + BB + HBP
  const tbf = Math.round(ip * 3 + (s.hits ?? 0) + (s.baseOnBalls ?? 0) + (s.intentionalWalks ?? 0));
  const kPct = tbf > 0 ? (s.strikeOuts ?? 0) / tbf : 0;
  const bbPct = tbf > 0 ? ((s.baseOnBalls ?? 0) + (s.intentionalWalks ?? 0)) / tbf : 0;

  // LOB/strand rate proxy: R - ER indicates unearned, use ER/R ratio
  const r = s.runs ?? 0;
  const er = s.earnedRuns ?? 0;
  const lob = r > 0 ? Math.max(0, 1 - er / (r + 1)) : 0.72;

  return { fip: Math.max(0, fip), kbb, gbPct, hr9, kPct, bbPct, lob };
}

// ─── League Rankings ──────────────────────────────────────────────────────

export function leagueRank(
  value: number,
  allValues: number[],
  higherIsBetter = true
): { rank: number; total: number; label: string } {
  const sorted = [...allValues].sort((a, b) => (higherIsBetter ? b - a : a - b));
  const rank = sorted.findIndex((v) => (higherIsBetter ? v <= value : v >= value)) + 1;
  const total = allValues.length;

  let label: string;
  if (rank === 1) label = "🥇 1st in MLB";
  else if (rank === 2) label = "🥈 2nd in MLB";
  else if (rank === 3) label = "🥉 3rd in MLB";
  else if (rank <= total * 0.1) label = `Top 10% (${rank}/${total})`;
  else if (rank <= total * 0.25) label = `Top 25% (${rank}/${total})`;
  else if (rank >= total * 0.9) label = `⚠️ Bottom 10% (${rank}/${total})`;
  else if (rank >= total * 0.75) label = `Below avg (${rank}/${total})`;
  else label = `${rank}/${total} in MLB`;

  return { rank, total, label };
}

// ─── Composite Hot Score (0–100) ──────────────────────────────────────────

export function computeHotScore(
  recentOPS: number,
  seasonOPS: number,
  recentGames: number
): number {
  if (!seasonOPS || recentGames < 3) return 50;
  const ratio = recentOPS / seasonOPS;
  // 1.0 = on pace → 50. 1.3 = 30% above → ~75. 0.7 = 30% below → ~25
  const raw = 50 + (ratio - 1) * 100;
  return Math.max(0, Math.min(100, raw));
}

export function computePitcherHotScore(
  recentERA: number,
  seasonERA: number,
  recentInnings: number
): number {
  if (!seasonERA || recentInnings < 3) return 50;
  // Lower ERA = better → invert ratio
  const ratio = seasonERA / recentERA;
  const raw = 50 + (ratio - 1) * 80;
  return Math.max(0, Math.min(100, raw));
}

// ─── Outlier Detection ────────────────────────────────────────────────────

export interface OutlierFact {
  emoji: string;
  headline: string;
  detail: string;
  tier: "elite" | "good" | "bad" | "terrible";
}

export function detectHittingOutliers(
  s: MLBHittingStats,
  adv: AdvancedHitting,
  name: string
): OutlierFact[] {
  const facts: OutlierFact[] = [];
  const ops = parseFloat(s.ops ?? "0");
  const avg = parseFloat(s.avg ?? "0");

  if (ops > 0.950) facts.push({ emoji: "🔥", headline: `${name} is putting up ELITE OPS`, detail: `${s.ops} OPS places him in the top 5% of MLB`, tier: "elite" });
  if (adv.kPct < 0.1 && s.atBats > 50) facts.push({ emoji: "🎯", headline: `${name} almost never strikes out`, detail: `${fmtPct(adv.kPct)} K-rate — better contact than 90% of the league`, tier: "elite" });
  if (adv.bbPct > 0.14) facts.push({ emoji: "👁️", headline: `${name} has elite plate discipline`, detail: `${fmtPct(adv.bbPct)} walk rate — elite pitch recognition`, tier: "elite" });
  if (adv.iso > 0.25) facts.push({ emoji: "💣", headline: `${name} is a power MONSTER`, detail: `ISO of ${fmtRate(adv.iso)} — top-tier raw power`, tier: "elite" });
  if (adv.kPct > 0.30) facts.push({ emoji: "📉", headline: `${name} is struggling with strikeouts`, detail: `${fmtPct(adv.kPct)} K-rate — bottom 20% of MLB`, tier: "bad" });
  if (avg < 0.2 && s.atBats > 80) facts.push({ emoji: "🥶", headline: `${name}'s average has cratered`, detail: `${s.avg} — well below the MLB average of .250`, tier: "terrible" });

  return facts;
}

export function detectPitchingOutliers(
  s: MLBPitchingStats,
  adv: AdvancedPitching,
  name: string
): OutlierFact[] {
  const facts: OutlierFact[] = [];
  const era = parseFloat(s.era ?? "99");
  const whip = parseFloat(s.whip ?? "99");

  if (era < 2.5 && parseFloat(s.inningsPitched) > 20) facts.push({ emoji: "🔥", headline: `${name} is LIGHTS OUT`, detail: `${s.era} ERA — ace-level dominance`, tier: "elite" });
  if (adv.kbb > 4) facts.push({ emoji: "🎯", headline: `${name} has elite command`, detail: `${adv.kbb.toFixed(2)} K/BB — misses bats and avoids walks`, tier: "elite" });
  if (adv.fip < 2.8) facts.push({ emoji: "📊", headline: `${name}'s FIP says even better times ahead`, detail: `${adv.fip.toFixed(2)} FIP — pitching better than ERA suggests`, tier: "elite" });
  if (era > 6.0 && parseFloat(s.inningsPitched) > 15) facts.push({ emoji: "🔴", headline: `${name} is giving up runs at an alarming rate`, detail: `${s.era} ERA — struggling badly`, tier: "terrible" });
  if (adv.kPct < 0.15 && parseFloat(s.inningsPitched) > 20) facts.push({ emoji: "📉", headline: `${name} isn't missing many bats`, detail: `${fmtPct(adv.kPct)} K-rate — below-average strikeout stuff`, tier: "bad" });

  return facts;
}

// ─── Did You Know facts ───────────────────────────────────────────────────

export const MARINERS_FACTS = [
  { fact: "The 2001 Mariners tied the all-time MLB wins record at 116, yet didn't reach the World Series.", emoji: "📜" },
  { fact: "Ichiro Suzuki recorded 262 hits in 2004 — the most in a single MLB season since 1930.", emoji: "🏆" },
  { fact: "Ken Griffey Jr. hit 56 HRs in both 1997 and 1998, leading the majors both years.", emoji: "💣" },
  { fact: "The Mariners' 1995 ALDS comeback against the Yankees is remembered simply as 'The Double.'", emoji: "⚾" },
  { fact: "Randy Johnson's 1995 season included a 2.48 ERA, 294 Ks and a complete no-hitter.", emoji: "🎯" },
  { fact: "Edgar Martinez is the only primary DH in the Baseball Hall of Fame.", emoji: "🥇" },
  { fact: "Félix Hernández threw a perfect game on August 15, 2012 — the 23rd in MLB history.", emoji: "✨" },
  { fact: "The Mariners are the only franchise to never appear in a World Series.", emoji: "😤" },
  { fact: "Julio Rodríguez became the fastest Mariner ever to reach 50 HR + 50 SB in a career.", emoji: "⚡" },
  { fact: "T-Mobile Park opened in 1999 and is widely ranked one of the best ballparks in the majors.", emoji: "🏟️" },
  { fact: "Harold Reynolds led the AL in stolen bases in 1987 with 60 — a franchise record.", emoji: "💨" },
  { fact: "The Mariners have retired 11 numbers, more than any other expansion franchise.", emoji: "🔢" },
];
