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
  woba: number;        // weighted on-base average (2024 weights)
  wrcPlus: number;     // wRC+ (100 = league avg)
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

  const ibb = s.intentionalWalks ?? 0;
  const uBB = s.baseOnBalls - ibb;
  const hbp = s.hitByPitch ?? 0;
  const singles = s.hits - s.doubles - s.triples - s.homeRuns;
  const wobaDenom = s.atBats + s.baseOnBalls - ibb + (s.sacFlies ?? 0) + hbp;
  const wobaNum = 0.69 * uBB + 0.72 * hbp + 0.89 * singles + 1.27 * s.doubles + 1.62 * s.triples + 2.10 * s.homeRuns;
  const woba = wobaDenom > 0 ? Math.round((wobaNum / wobaDenom) * 1000) / 1000 : 0;
  const wrcPlus = Math.round(((woba - 0.315) / 1.24 + 0.118) / 0.118 * 100);

  return { babip, iso, kPct, bbPct, hrPer600, sbPct, xbhPct, runsPer27, woba, wrcPlus };
}

export function fmtRate(n: number, digits = 3): string {
  return n.toFixed(digits).replace(/^0\./, ".");
}

export function fmtPct(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`;
}

export function calcWOBA(s: MLBHittingStats): number {
  const ibb = s.intentionalWalks ?? 0;
  const uBB = s.baseOnBalls - ibb;
  const hbp = s.hitByPitch ?? 0;
  const singles = s.hits - s.doubles - s.triples - s.homeRuns;
  const denom = s.atBats + s.baseOnBalls - ibb + (s.sacFlies ?? 0) + hbp;
  if (denom <= 0) return 0;
  const num = 0.69 * uBB + 0.72 * hbp + 0.89 * singles + 1.27 * s.doubles + 1.62 * s.triples + 2.10 * s.homeRuns;
  return Math.round((num / denom) * 1000) / 1000;
}

export function calcWRCPlus(woba: number): number {
  return Math.round(((woba - 0.315) / 1.24 + 0.118) / 0.118 * 100);
}

export function calcXFIP(s: MLBPitchingStats): number {
  const ip = parseFloat(s.inningsPitched ?? '0');
  if (ip <= 0) return FIP_CONSTANT;
  const tbf = Math.round(ip * 3 + (s.hits ?? 0) + (s.baseOnBalls ?? 0) + (s.intentionalWalks ?? 0));
  const xHR = tbf * 0.038;
  const raw = (13 * xHR + 3 * ((s.baseOnBalls ?? 0) + (s.intentionalWalks ?? 0)) - 2 * (s.strikeOuts ?? 0)) / ip + FIP_CONSTANT;
  return Math.round(Math.max(0, raw) * 100) / 100;
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
  xfip: number;        // xFIP: FIP with HR replaced by TBF×0.038
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

  // Standard LOB%: (H+BB+HBP-R) / (H+BB+HBP-1.4*HR)
  const r = s.runs ?? 0;
  const lobH = s.hits ?? 0;
  const lobBB = (s.baseOnBalls ?? 0) + (s.intentionalWalks ?? 0);
  const lobHBP = s.hitByPitch ?? 0;
  const lobHR = s.homeRuns ?? 0;
  const lobNum = lobH + lobBB + lobHBP - r;
  const lobDen = lobH + lobBB + lobHBP - 1.4 * lobHR;
  const lob = lobDen > 0 ? Math.min(1, Math.max(0, lobNum / lobDen)) : 0.72;

  const xHR = tbf * 0.038;
  const xfipRaw = ip > 0
    ? (13 * xHR + 3 * ((s.baseOnBalls ?? 0) + (s.intentionalWalks ?? 0)) - 2 * (s.strikeOuts ?? 0)) / ip + FIP_CONSTANT
    : FIP_CONSTANT;
  const xfip = Math.round(Math.max(0, xfipRaw) * 100) / 100;

  return { fip: Math.max(0, fip), kbb, gbPct, hr9, kPct, bbPct, lob, xfip };
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

  if (ops > 0.900) facts.push({ emoji: "🔥", headline: `${name} offense is ELITE right now`, detail: `${s.ops} OPS. Best in the damn league territory. Put some respect on it.`, tier: "elite" });
  if (adv.kPct < 0.12 && s.atBats > 50) facts.push({ emoji: "🎯", headline: `${name} makes elite contact`, detail: `${fmtPct(adv.kPct)} K-rate — better than 90% of MLB. Pitchers hate them.`, tier: "elite" });
  if (adv.bbPct > 0.12) facts.push({ emoji: "👁️", headline: `${name} sees pitches like a hawk`, detail: `${fmtPct(adv.bbPct)} walk rate — elite plate discipline. These guys don't chase.`, tier: "elite" });
  if (adv.iso > 0.220) facts.push({ emoji: "💣", headline: `${name} is making exits`, detail: `ISO of ${fmtRate(adv.iso)} — legitimately scary raw power numbers.`, tier: "elite" });
  if (adv.kPct > 0.28) facts.push({ emoji: "📉", headline: `${name} is striking out too damn much`, detail: `${fmtPct(adv.kPct)} K-rate. Yeah, this is bad. Contact is a skill, fellas.`, tier: "bad" });
  if (avg < 0.215 && s.atBats > 80) facts.push({ emoji: "🥶", headline: `${name} offense has cratered`, detail: `${s.avg} team average. Dogshit tier. The bats need to wake up.`, tier: "terrible" });
  if (adv.sbPct < 0.65 && (s.stolenBases + (s.caughtStealing ?? 0)) >= 10) facts.push({ emoji: "🤦", headline: `${name} is costing outs on the bases`, detail: `${fmtPct(adv.sbPct)} SB success rate. Under 70% is actively hurting us. Stop running.`, tier: "bad" });

  return facts;
}

export function detectPitchingOutliers(
  s: MLBPitchingStats,
  adv: AdvancedPitching,
  name: string
): OutlierFact[] {
  const facts: OutlierFact[] = [];
  const era = parseFloat(s.era ?? "99");

  if (era < 3.0 && parseFloat(s.inningsPitched) > 20) facts.push({ emoji: "🔥", headline: `${name} is LIGHTS OUT`, detail: `${s.era} ERA. Ace-level dominance. Lock it in.`, tier: "elite" });
  if (adv.kbb > 4.5) facts.push({ emoji: "🎯", headline: `${name} has elite command`, detail: `${adv.kbb.toFixed(2)} K/BB ratio. Misses bats AND the zone. Beautiful.`, tier: "elite" });
  if (adv.fip < 3.0 && era > 3.5) facts.push({ emoji: "📊", headline: `${name} FIP says better days are coming`, detail: `${adv.fip.toFixed(2)} FIP vs ${s.era} ERA. The defense and luck have been unkind. Regression incoming.`, tier: "elite" });
  if (era > 5.5 && parseFloat(s.inningsPitched) > 15) facts.push({ emoji: "🔴", headline: `${name} ERA is a crime scene`, detail: `${s.era} ERA. This is dogshit tier. Someone needs to fix this.`, tier: "terrible" });
  if (adv.kPct < 0.16 && parseFloat(s.inningsPitched) > 20) facts.push({ emoji: "📉", headline: `${name} isn't missing bats`, detail: `${fmtPct(adv.kPct)} K-rate. Aggressively mid strikeout stuff. League is making contact.`, tier: "bad" });
  if (adv.hr9 > 1.6 && parseFloat(s.inningsPitched) > 20) facts.push({ emoji: "💣", headline: `${name} is getting launched on`, detail: `${adv.hr9.toFixed(2)} HR/9. Pitching to contact is one thing. Pitching to tape-measure shots is another.`, tier: "terrible" });

  return facts;
}

// ─── Did You Know facts ───────────────────────────────────────────────────

export const MARINERS_FACTS = [
  { fact: "The 2001 Mariners tied the all-time MLB wins record at 116, yet didn't reach the World Series.", emoji: "📜" },
  { fact: "Ichiro Suzuki recorded 262 hits in 2004 — the most in a single MLB season since 1930.", emoji: "🏆" },
  { fact: "Ken Griffey Jr. hit 56 HRs in both 1997 and 1998, leading the majors both years.", emoji: "💣" },
  { fact: "The Mariners' 1995 ALDS comeback against the Yankees is remembered simply as 'The Double.'", emoji: "⚾" },
  { fact: "Randy Johnson went 18-2 with a 2.48 ERA and 294 strikeouts in 1995 — then threw 3 innings of relief in ALDS Game 5 to close out the Yankees.", emoji: "🎯" },
  { fact: "Edgar Martinez is the only primary DH in the Baseball Hall of Fame.", emoji: "🥇" },
  { fact: "Félix Hernández threw a perfect game on August 15, 2012 — the 23rd in MLB history.", emoji: "✨" },
  { fact: "The Mariners are the only franchise to never appear in a World Series.", emoji: "😤" },
  { fact: "Julio Rodríguez became the fastest Mariner ever to reach 50 HR + 50 SB in a career.", emoji: "⚡" },
  { fact: "T-Mobile Park opened in 1999 and is widely ranked one of the best ballparks in the majors.", emoji: "🏟️" },
  { fact: "Harold Reynolds led the AL in stolen bases in 1987 with 60 — a franchise record.", emoji: "💨" },
  { fact: "The Mariners have retired 11 numbers, more than any other expansion franchise.", emoji: "🔢" },
];
