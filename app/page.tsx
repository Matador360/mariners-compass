"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { usePoll, useLastUpdatedLabel } from "@/lib/mlb-poll";
import { calcAdvancedHitting, calcAdvancedPitching, detectHittingOutliers, detectPitchingOutliers, computeHotScore, MARINERS_FACTS, fmtPct, fmtRate } from "@/lib/calc-stats";
import { PulseTicker, buildPulseItems } from "@/components/pulse-ticker";
import { StreakTracker, computeStreaks } from "@/components/streak-tracker";
import { OutlierCallout, TeamOutlier } from "@/components/outlier-callout";
import { CountingNumber } from "@/components/counting-number";
import { StatClickable } from "@/components/stat-explainer";
import { Sparkline } from "@/components/sparkline";
import { GameCard } from "@/components/game-card";
import { Last10Strip } from "@/components/last10-strip";
import { StandingsWidget } from "@/components/standings-widget";
import { TridentDivider } from "@/components/trident-logo";
import type { MLBGame, MLBHittingStats, MLBPitchingStats, MLBStandingsDivision, MLBStandingsTeamRecord } from "@/types/mlb";
import { pythagWins, pythagLuck, magicNumber, tragicNumber, pace162 } from "@/lib/predictions";
import { captionForStreak, captionForRunDiff, type Tone } from "@/lib/captions";
import type { OutlierFact } from "@/lib/calc-stats";

const BASE = "https://statsapi.mlb.com/api/v1";

// ─── Data fetchers (client-side) ─────────────────────────────────────────────

async function fetchDashboard() {
  const today = new Date().toISOString().split("T")[0];
  const season = new Date().getFullYear();

  const [schedRes, hitsRes, pitchRes, standRes] = await Promise.allSettled([
    fetch(`${BASE}/schedule?teamId=136&sportId=1&startDate=${season}-01-01&endDate=${season}-12-31&hydrate=probablePitcher,decisions,linescore,team&limit=180`),
    fetch(`${BASE}/teams/136/stats?stats=season&group=hitting&season=${season}`),
    fetch(`${BASE}/teams/136/stats?stats=season&group=pitching&season=${season}`),
    fetch(`${BASE}/standings?leagueId=103&season=${season}&standingsTypes=regularSeason&hydrate=team,division`),
  ]);

  const schedData = schedRes.status === "fulfilled" ? await schedRes.value.json() : { dates: [] };
  const hitsData = hitsRes.status === "fulfilled" ? await hitsRes.value.json() : null;
  const pitchData = pitchRes.status === "fulfilled" ? await pitchRes.value.json() : null;
  const standData = standRes.status === "fulfilled" ? await standRes.value.json() : null;

  const allGames: MLBGame[] = schedData.dates?.flatMap((d: { games: MLBGame[] }) => d.games ?? []) ?? [];
  const todayGame = allGames.find((g) => g.gameDate.startsWith(today)) ?? null;
  const games = allGames;

  const finished = allGames
    .filter((g) => g.status.abstractGameState === "Final")
    .sort((a, b) => b.gameDate.localeCompare(a.gameDate));
  const lastGame = finished[0] ?? null;

  const hitting: MLBHittingStats | null = hitsData?.stats?.[0]?.splits?.[0]?.stat ?? null;
  const pitching: MLBPitchingStats | null = pitchData?.stats?.[0]?.splits?.[0]?.stat ?? null;

  const alWest: MLBStandingsDivision | null =
    standData?.records?.find((r: MLBStandingsDivision) => r.division?.id === 200) ?? null;
  const marinersRecord = alWest?.teamRecords.find((t) => t.team.id === 136) ?? null;

  // Last 10 W/L streak
  const last10 = finished.slice(0, 10);
  const wins = last10.filter((g) => g.teams.home.team.id === 136 ? g.teams.home.isWinner : g.teams.away.isWinner).length;
  const last10Str = `${wins}-${last10.length - wins}`;

  // Win streak / loss streak
  let streak = 0;
  let streakType: "W" | "L" = "W";
  for (const g of finished) {
    const won = g.teams.home.team.id === 136 ? g.teams.home.isWinner : g.teams.away.isWinner;
    if (streak === 0) { streakType = won ? "W" : "L"; streak = 1; continue; }
    if ((streakType === "W") === !!won) streak++;
    else break;
  }

  return { todayGame, lastGame, games, hitting, pitching, alWest, marinersRecord, last10, wins, last10Str, streak, streakType };
}

async function fetchRosterGameLogs() {
  const season = new Date().getFullYear();
  const rosterRes = await fetch(`${BASE}/teams/136/roster?rosterType=active&season=${season}`);
  if (!rosterRes.ok) return [];
  const rosterData = await rosterRes.json();
  const roster = rosterData.roster ?? [];

  const logs = await Promise.allSettled(
    roster.slice(0, 35).map(async (p: { person: { id: number; fullName: string }; position: { abbreviation: string } }) => {
      const isPitcher = ["SP","RP","P"].includes(p.position.abbreviation);
      const logRes = await fetch(
        `${BASE}/people/${p.person.id}/stats?stats=gameLog&group=${isPitcher ? "pitching" : "hitting"}&season=${season}&limit=15`
      );
      if (!logRes.ok) return null;
      const logData = await logRes.json();
      const splits = logData.stats?.[0]?.splits ?? [];
      return {
        playerId: p.person.id,
        name: p.person.fullName,
        position: p.position.abbreviation,
        isPitcher,
        logs: splits.map((s: { stat: Record<string, unknown> }) => ({ stat: s.stat })),
      };
    })
  );

  return logs
    .filter((r) => r.status === "fulfilled" && r.value !== null)
    .map((r) => (r as PromiseFulfilledResult<{
      playerId: number;
      name: string;
      position: string;
      isPitcher: boolean;
      logs: Array<{ stat: Record<string, number | string> }>;
    }>).value);
}

// ─── Sub-components ────────────────────────────────────────────────────────

function LastGameHero({ game, isWin }: { game: MLBGame; isWin: boolean }) {
  const homeTeam = game.teams.home;
  const awayTeam = game.teams.away;
  const isHome = homeTeam.team.id === 136;
  const opponent = isHome ? awayTeam.team.name : homeTeam.team.name;
  const ourScore = isHome ? homeTeam.score : awayTeam.score;
  const theirScore = isHome ? awayTeam.score : homeTeam.score;

  return (
    <div className={`trident-card p-4 relative overflow-hidden border-l-2 ${isWin ? "border-l-win" : "border-l-loss"}`}>
      <div className={`absolute inset-0 opacity-5 ${isWin ? "bg-win" : "bg-loss"}`} />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">Last Game</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs font-black px-2 py-0.5 rounded uppercase tracking-wider ${isWin ? "bg-win/20 text-win" : "bg-loss/20 text-loss"}`}>
              {isWin ? "W" : "L"}
            </span>
            <span className="text-sm text-secondary">vs {opponent}</span>
            <span className="text-[10px] text-muted">· Final</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black tabular-nums text-primary leading-none">
            {ourScore}
            <span className="text-muted/40 mx-1.5 font-light">–</span>
            {theirScore}
          </p>
          <p className="text-[10px] text-muted mt-0.5">SEA · {isHome ? "Home" : "Away"}</p>
        </div>
      </div>
    </div>
  );
}

function RecordBadge({ wins, losses, streak, streakType }: { wins: number; losses: number; streak: number; streakType: "W" | "L" }) {
  const winPct = wins + losses > 0 ? wins / (wins + losses) : 0;
  const isWinStreak = streakType === "W" && streak >= 3;
  const isLoseStreak = streakType === "L";

  return (
    <div className={`card-gradient-border p-5 flex items-center gap-6 ${isWinStreak ? "streak-banner" : ""}`}>
      <div className="flex-1">
        <p className="text-[10px] uppercase tracking-[0.12em] text-muted font-semibold mb-2">Season Record</p>
        <div className="flex items-baseline gap-2.5">
          <span
            className="font-black text-primary tabular-nums leading-none"
            style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(2rem, 5vw, 2.8rem)", letterSpacing: "-0.05em" }}
          >
            <CountingNumber value={wins} duration={600} />
            <span className="text-muted/40 mx-1 font-light">–</span>
            <CountingNumber value={losses} duration={600} />
          </span>
          <span
            className="text-sm text-muted"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            ({winPct.toFixed(3).replace(/^0/, "")})
          </span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px] uppercase tracking-[0.12em] text-muted font-semibold mb-2">Streak</p>
        <p
          className={`font-black leading-none ${isWinStreak ? "text-gradient-gold text-glow-gold" : isLoseStreak ? "text-loss" : "text-secondary"}`}
          style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(1.5rem, 3vw, 2rem)", letterSpacing: "-0.04em" }}
        >
          {streakType}{streak}
        </p>
      </div>
    </div>
  );
}

function StatCell({ v, l, fmt, good, bad }: { v: number; l: string; fmt: (n: number) => string; good: (n: number) => boolean; bad: (n: number) => boolean }) {
  const isGood = good(v);
  const isBad  = bad(v);
  const color  = isGood ? "#22C55E" : isBad ? "#EF4444" : "var(--text-primary)";
  const glow   = isGood ? "0 0 12px rgba(34,197,94,0.4)" : isBad ? "0 0 12px rgba(239,68,68,0.3)" : "none";
  return (
    <StatClickable statKey={l} value={fmt(v)}>
      <div className="flex flex-col items-center gap-1 py-2.5 rounded-lg transition-all duration-150 hover:bg-white/[0.04] cursor-pointer">
        <span
          className="text-lg font-bold tabular-nums leading-none stat-dense"
          style={{ color, textShadow: glow, fontFamily: "var(--font-mono)" }}
        >
          {fmt(v)}
        </span>
        <span className="text-[8px] uppercase tracking-[0.12em] text-muted font-bold">{l}</span>
      </div>
    </StatClickable>
  );
}

function TeamStatGrid({ hitting, pitching }: { hitting: MLBHittingStats | null; pitching: MLBPitchingStats | null }) {
  if (!hitting && !pitching) return null;

  const hitterStats = hitting ? [
    { v: parseFloat(hitting.avg ?? "0"), l: "AVG", fmt: (n: number) => n.toFixed(3).replace(/^0/, ""), good: (n: number) => n > 0.255, bad: (n: number) => n < 0.235 },
    { v: parseFloat(hitting.obp ?? "0"), l: "OBP", fmt: (n: number) => n.toFixed(3).replace(/^0/, ""), good: (n: number) => n > 0.330, bad: (n: number) => n < 0.305 },
    { v: parseFloat(hitting.slg ?? "0"), l: "SLG", fmt: (n: number) => n.toFixed(3).replace(/^0/, ""), good: (n: number) => n > 0.420, bad: (n: number) => n < 0.380 },
    { v: parseFloat(hitting.ops ?? "0"), l: "OPS", fmt: (n: number) => n.toFixed(3).replace(/^0/, ""), good: (n: number) => n > 0.760, bad: (n: number) => n < 0.700 },
    { v: Number(hitting.homeRuns ?? 0), l: "HR", fmt: (n: number) => String(Math.round(n)), good: (n: number) => n > 150, bad: (n: number) => n < 100 },
    { v: Number(hitting.stolenBases ?? 0), l: "SB", fmt: (n: number) => String(Math.round(n)), good: (n: number) => n > 80, bad: (n: number) => n < 50 },
    { v: Number(hitting.runs ?? 0), l: "R", fmt: (n: number) => String(Math.round(n)), good: (n: number) => n > 700, bad: (n: number) => n < 600 },
    { v: Number(hitting.rbi ?? 0), l: "RBI", fmt: (n: number) => String(Math.round(n)), good: (n: number) => n > 650, bad: (n: number) => n < 550 },
  ] : [];

  const pitcherStats = pitching ? [
    { v: parseFloat(pitching.era ?? "99"), l: "ERA", fmt: (n: number) => n.toFixed(2), good: (n: number) => n < 3.80, bad: (n: number) => n > 4.50 },
    { v: parseFloat(pitching.whip ?? "99"), l: "WHIP", fmt: (n: number) => n.toFixed(2), good: (n: number) => n < 1.20, bad: (n: number) => n > 1.40 },
    { v: Number(pitching.strikeOuts ?? 0), l: "K", fmt: (n: number) => String(Math.round(n)), good: (n: number) => n > 1200, bad: (n: number) => n < 900 },
    { v: parseFloat(pitching.strikeoutsPer9Inn ?? "0"), l: "K/9", fmt: (n: number) => n.toFixed(1), good: (n: number) => n > 9.0, bad: (n: number) => n < 7.5 },
    { v: Number(pitching.wins ?? 0), l: "W", fmt: (n: number) => String(Math.round(n)), good: (n: number) => n > 75, bad: (n: number) => n < 60 },
    { v: Number(pitching.saves ?? 0), l: "SV", fmt: (n: number) => String(Math.round(n)), good: (n: number) => n > 35, bad: (n: number) => n < 20 },
    { v: Number(pitching.homeRuns ?? 0), l: "HRA", fmt: (n: number) => String(Math.round(n)), good: (n: number) => n < 80, bad: (n: number) => n > 140 },
    { v: Number(pitching.losses ?? 0), l: "L", fmt: (n: number) => String(Math.round(n)), good: (n: number) => n < 55, bad: (n: number) => n > 75 },
  ] : [];

  return (
    <div className="trident-card p-4">
      <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-3">
        {new Date().getFullYear()} Team Stats
      </p>
      <div className="grid grid-cols-4 sm:grid-cols-8 divide-x divide-border/30">
        {hitterStats.map(({ v, l, fmt, good, bad }) => (
          <StatCell key={l} v={v} l={l} fmt={fmt} good={good} bad={bad} />
        ))}
      </div>
      {pitcherStats.length > 0 && (
        <>
          <div className="h-px bg-border/30 my-2" />
          <div className="grid grid-cols-4 sm:grid-cols-8 divide-x divide-border/30">
            {pitcherStats.slice(0, 8).map(({ v, l, fmt, good, bad }) => (
              <StatCell key={`p-${l}`} v={v} l={l} fmt={fmt} good={good} bad={bad} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AdvancedStatsPanel({ hitting, pitching }: { hitting: MLBHittingStats | null; pitching: MLBPitchingStats | null }) {
  if (!hitting && !pitching) return null;

  const adv = hitting ? calcAdvancedHitting(hitting) : null;
  const advP = pitching ? calcAdvancedPitching(pitching) : null;

  const hitterRows = adv && hitting ? [
    { l: "BABIP", v: fmtRate(adv.babip), note: ".300 is league avg" },
    { l: "ISO", v: fmtRate(adv.iso), note: "raw power metric" },
    { l: "K%", v: fmtPct(adv.kPct), note: "lower is better" },
    { l: "BB%", v: fmtPct(adv.bbPct), note: "plate discipline" },
    { l: "HR/600", v: adv.hrPer600.toFixed(1), note: "pace over 600 PA" },
    { l: "SB%", v: fmtPct(adv.sbPct), note: "success on bags" },
  ] : [];

  const pitcherRows = advP ? [
    { l: "FIP", v: advP.fip.toFixed(2), note: "fielding independent" },
    { l: "K/BB", v: advP.kbb.toFixed(2), note: "command ratio" },
    { l: "GB%", v: fmtPct(advP.gbPct), note: "ground ball rate" },
    { l: "HR/9", v: advP.hr9.toFixed(2), note: "HR rate" },
    { l: "K%", v: fmtPct(advP.kPct), note: "strikeout rate" },
    { l: "LOB%", v: fmtPct(advP.lob), note: "strand rate" },
  ] : [];

  return (
    <div className="trident-card p-4">
      <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-3">
        Advanced Metrics
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-0">
        <div>
          <p className="text-[9px] text-teal uppercase tracking-wider font-bold mb-2">Offense</p>
          {hitterRows.map(({ l, v, note }) => (
            <StatClickable key={l} statKey={l} value={v}>
              <div className="flex items-center justify-between py-1 border-b border-border/20 last:border-0 hover:bg-surface-2/40 rounded px-1 -mx-1 transition-colors">
                <div>
                  <span className="text-xs font-bold text-primary">{l}</span>
                  <span className="text-[9px] text-muted ml-2 hidden sm:inline">{note}</span>
                </div>
                <span className="text-xs font-black tabular-nums text-teal">{v}</span>
              </div>
            </StatClickable>
          ))}
        </div>
        <div>
          <p className="text-[9px] text-violet-400 uppercase tracking-wider font-bold mb-2">Pitching</p>
          {pitcherRows.map(({ l, v, note }) => (
            <StatClickable key={l} statKey={l} value={v}>
              <div className="flex items-center justify-between py-1 border-b border-border/20 last:border-0 hover:bg-surface-2/40 rounded px-1 -mx-1 transition-colors">
                <div>
                  <span className="text-xs font-bold text-primary">{l}</span>
                  <span className="text-[9px] text-muted ml-2 hidden sm:inline">{note}</span>
                </div>
                <span className="text-xs font-black tabular-nums text-violet-400">{v}</span>
              </div>
            </StatClickable>
          ))}
        </div>
      </div>
    </div>
  );
}

const FACT_GRADIENTS = [
  "from-gold/10", "from-teal/10", "from-violet-500/10",
  "from-green-500/10", "from-orange-500/10", "from-pink-500/10",
  "from-blue-500/10", "from-red-500/10", "from-indigo-500/10",
  "from-emerald-500/10", "from-amber-500/10", "from-cyan-500/10",
];

function DidYouKnow() {
  const [idx, setIdx] = useState(0);
  const [animating, setAnimating] = useState(false);

  const fact = MARINERS_FACTS[idx % MARINERS_FACTS.length];
  const gradientClass = FACT_GRADIENTS[idx % FACT_GRADIENTS.length];

  const advance = useCallback(() => {
    setAnimating(true);
    setTimeout(() => {
      setIdx((i) => i + 1);
      setAnimating(false);
    }, 220);
  }, []);

  const goTo = useCallback((nextIdx: number) => {
    setAnimating(true);
    setTimeout(() => {
      setIdx(nextIdx);
      setAnimating(false);
    }, 220);
  }, []);

  useEffect(() => {
    const id = setInterval(advance, 12000);
    return () => clearInterval(id);
  }, [advance]);

  return (
    <div className={`trident-card p-5 border-gold/20 bg-gradient-to-br ${gradientClass} to-transparent transition-all duration-500`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-widest text-gold font-semibold">
          Did You Know?
        </p>
        <button
          onClick={advance}
          className="text-[10px] text-muted hover:text-gold transition-colors px-1"
        >
          next →
        </button>
      </div>
      <div
        className="transition-all duration-220"
        style={{
          opacity: animating ? 0 : 1,
          transform: animating ? "translateY(8px)" : "translateY(0px)",
          transition: "opacity 220ms ease, transform 220ms ease",
        }}
      >
        <div className="flex items-start gap-3">
          <span className="text-4xl leading-none shrink-0 mt-0.5">{fact.emoji}</span>
          <p className="text-base font-semibold text-primary leading-snug">{fact.fact}</p>
        </div>
      </div>
      <div className="flex gap-1 mt-4 items-center">
        {MARINERS_FACTS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === idx % MARINERS_FACTS.length ? "bg-gold w-5" : "bg-border w-1.5 hover:bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function SeasonMoodChart({ games, tone = 'spicy' }: { games: MLBGame[]; tone?: Tone }) {
  const data = useMemo(() => {
    const finished = games
      .filter((g) => g.status.abstractGameState === "Final")
      .sort((a, b) => a.gameDate.localeCompare(b.gameDate));
    if (finished.length < 5) return null;

    let cumulative = 0;
    const values: number[] = [];
    for (const g of finished) {
      const isHome = g.teams.home.team.id === 136;
      const us = isHome ? g.teams.home : g.teams.away;
      const them = isHome ? g.teams.away : g.teams.home;
      cumulative += (us.score ?? 0) - (them.score ?? 0);
      values.push(cumulative);
    }

    // Compute current streak (most recent first)
    const desc = [...finished].reverse();
    let streakDir: "W" | "L" | null = null;
    let streakCount = 0;
    for (const g of desc) {
      const isHome = g.teams.home.team.id === 136;
      const us = isHome ? g.teams.home : g.teams.away;
      const dir: "W" | "L" = us.isWinner ? "W" : "L";
      if (!streakDir) { streakDir = dir; streakCount = 1; }
      else if (dir === streakDir) streakCount++;
      else break;
    }

    // Last game details
    const last = desc[0];
    let lastWin = false, lastClose = false, lastBlowout = false;
    if (last) {
      const isHome = last.teams.home.team.id === 136;
      const us = isHome ? last.teams.home : last.teams.away;
      const them = isHome ? last.teams.away : last.teams.home;
      const diff = Math.abs((us.score ?? 0) - (them.score ?? 0));
      lastWin = !!us.isWinner;
      lastClose = diff <= 2;
      lastBlowout = diff >= 5;
    }

    return { values, count: finished.length, streakDir, streakCount, lastWin, lastClose, lastBlowout };
  }, [games]);

  if (!data) return null;

  const { values, count, streakDir, streakCount, lastWin, lastClose, lastBlowout } = data;
  const current = values[values.length - 1];

  const streakN = streakDir === "W" ? streakCount : streakDir === "L" ? -streakCount : 0;
  const seed = count;
  const captions = Math.abs(streakN) >= 3
    ? captionForStreak(streakN, seed, tone)
    : captionForRunDiff(current, seed, tone);
  const cap = captions[0] ?? { tier: "neutral" as const, text: "Aggressively mediocre. The Mariners special™" };

  const tierEmoji: Record<string, string> = { hot: "🔥", spicy: "⚡", cold: "🥶", tragic: "💀", neutral: "😐", lore: "🔱" };
  const tierColor: Record<string, string> = { hot: "#FFB700", spicy: "#22C55E", cold: "#8BA4BA", tragic: "#EF4444", neutral: "#00A3A3", lore: "#FFB700" };

  const moodEmoji = cap.emoji ?? tierEmoji[cap.tier] ?? "😐";
  const moodLabel = cap.text;
  const moodColor = tierColor[cap.tier] ?? "#00A3A3";

  const lineColor = current >= 0 ? "#22C55E" : "#EF4444";
  const W = 400, H = 56, pad = 4;
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;
  const zeroY = pad + ((1 - (0 - min) / range) * (H - pad * 2));
  const points = values.map((v, i) => [
    pad + (i / (values.length - 1)) * (W - pad * 2),
    pad + (1 - (v - min) / range) * (H - pad * 2),
  ] as [number, number]);

  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1][0].toFixed(1)},${zeroY.toFixed(1)} L${points[0][0].toFixed(1)},${zeroY.toFixed(1)} Z`;

  return (
    <div className="trident-card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">
          Season Mood · {count}G
        </p>
        <span className="text-xs font-bold" style={{ color: moodColor }}>
          {moodEmoji} {moodLabel}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden="true">
        <line
          x1={pad} y1={zeroY} x2={W - pad} y2={zeroY}
          stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="5 4"
        />
        <path d={areaPath} fill={lineColor} fillOpacity={0.12} />
        <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="3" fill={lineColor} />
      </svg>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-muted">Opening Day</span>
        <span className="text-[10px] font-bold tabular-nums" style={{ color: lineColor }}>
          {current >= 0 ? "+" : ""}{current} run diff
        </span>
        <span className="text-[10px] text-muted">Now →</span>
      </div>
    </div>
  );
}

function PythagLuckCard({ runsScored, runsAllowed, actualWins, gamesPlayed }: {
  runsScored: number;
  runsAllowed: number;
  actualWins: number;
  gamesPlayed: number;
}) {
  if (gamesPlayed < 10 || runsScored <= 0 || runsAllowed <= 0) return null;
  const { expectedW } = pythagWins(runsScored, runsAllowed, gamesPlayed);
  const { delta, label } = pythagLuck(actualWins, expectedW);
  const sign = delta >= 0 ? "+" : "";
  const color = label === "lucky" ? "#FFB700" : label === "unlucky" ? "#EF4444" : "#8BA4BA";
  const text = label === "lucky" ? "Running Hot" : label === "unlucky" ? "Running Cold" : "As Expected";

  return (
    <StatClickable statKey="PYTHAG_W" value={expectedW.toFixed(1)}>
      <div className="trident-card p-4 flex flex-col gap-2 cursor-pointer hover:bg-white/[0.02] transition-colors">
        <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">Pythagorean W</p>
        <div className="flex items-baseline gap-2">
          <span className="font-black text-2xl tabular-nums text-primary leading-none" style={{ fontFamily: "var(--font-mono)" }}>
            <CountingNumber value={expectedW} decimals={1} duration={600} />
          </span>
          <span className="text-xs text-muted">expected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold tabular-nums" style={{ color }}>
            {sign}{delta.toFixed(1)}W
          </span>
          <span className="text-[10px] text-muted uppercase tracking-wider">{text}</span>
        </div>
      </div>
    </StatClickable>
  );
}

function MagicNumberCard({ teamRecord, divisionRecords }: {
  teamRecord: MLBStandingsTeamRecord;
  divisionRecords: MLBStandingsTeamRecord[];
}) {
  const gamesPlayed = teamRecord.wins + teamRecord.losses;
  const gamesRemaining = Math.max(0, 162 - gamesPlayed);

  if (gamesPlayed < 30) {
    const { projectedWins, pace } = pace162(teamRecord.wins, teamRecord.losses);
    return (
      <div className="trident-card p-4 flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">Pace / 162</p>
        <div className="flex items-baseline gap-2">
          <span className="font-black text-2xl tabular-nums text-primary leading-none" style={{ fontFamily: "var(--font-mono)" }}>
            <CountingNumber value={projectedWins} duration={600} />
          </span>
          <span className="text-xs text-muted">proj wins</span>
        </div>
        <span className="text-[10px] text-muted">{pace.toFixed(3).replace(/^0/, "")} win%</span>
      </div>
    );
  }

  const sorted = [...divisionRecords].sort((a, b) => b.wins - a.wins || a.losses - b.losses);
  const isLeader = sorted[0]?.team.id === 136;

  if (isLeader) {
    const second = sorted[1];
    const mn = second != null ? magicNumber(teamRecord.wins, teamRecord.losses, second.losses, gamesRemaining) : null;
    const color = mn != null && mn <= 10 ? "#FFB700" : "#22C55E";
    return (
      <StatClickable statKey="MAGIC_NUM" value={mn != null ? String(mn) : "–"}>
        <div className="trident-card p-4 flex flex-col gap-2 cursor-pointer hover:bg-white/[0.02] transition-colors">
          <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">Magic #</p>
          <div className="flex items-baseline gap-2">
            <span className="font-black text-2xl tabular-nums leading-none" style={{ fontFamily: "var(--font-mono)", color }}>
              {mn != null ? <CountingNumber value={mn} duration={600} /> : "–"}
            </span>
            <span className="text-xs text-muted">to clinch</span>
          </div>
          <span className="text-[10px] text-muted">AL West lead · {gamesRemaining}G left</span>
        </div>
      </StatClickable>
    );
  }

  const leader = sorted[0];
  const tn = leader != null ? tragicNumber(teamRecord.wins, teamRecord.losses, leader.wins, gamesRemaining) : null;
  const color = tn != null && tn <= 10 ? "#EF4444" : "#F97316";
  return (
    <StatClickable statKey="TRAGIC_NUM" value={tn != null ? String(tn) : "–"}>
      <div className="trident-card p-4 flex flex-col gap-2 cursor-pointer hover:bg-white/[0.02] transition-colors">
        <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">Tragic #</p>
        <div className="flex items-baseline gap-2">
          <span className="font-black text-2xl tabular-nums leading-none" style={{ fontFamily: "var(--font-mono)", color }}>
            {tn != null ? <CountingNumber value={tn} duration={600} /> : "–"}
          </span>
          <span className="text-xs text-muted">to elim</span>
        </div>
        <span className="text-[10px] text-muted">{gamesRemaining}G left</span>
      </div>
    </StatClickable>
  );
}

function LiveBadge({ lastUpdated }: { lastUpdated: Date | null }) {
  const label = useLastUpdatedLabel(lastUpdated);
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      <span className="text-[10px] text-muted">Updated {label}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { data: dash, lastUpdated, loading: dashLoading } = usePoll(fetchDashboard, 30_000);
  const { data: gameLogs, loading: logsLoading } = usePoll(fetchRosterGameLogs, 120_000);

  const streaks = gameLogs ? computeStreaks(gameLogs) : [];

  const hitting = dash?.hitting ?? null;
  const pitching = dash?.pitching ?? null;

  // Build outlier facts from team-level advanced stats
  const outlierFacts: OutlierFact[] = [];
  if (hitting) {
    try {
      const adv = calcAdvancedHitting(hitting);
      const h = detectHittingOutliers(hitting, adv, "The M's");
      outlierFacts.push(...h.slice(0, 2));
    } catch { /* ignore */ }
  }
  if (pitching) {
    try {
      const adv = calcAdvancedPitching(pitching);
      const p = detectPitchingOutliers(pitching, adv, "The Rotation");
      outlierFacts.push(...p.slice(0, 2));
    } catch { /* ignore */ }
  }

  // Build pulse items
  const pulseItems = buildPulseItems({
    teamRecord: dash?.marinersRecord ? { wins: dash.marinersRecord.wins, losses: dash.marinersRecord.losses } : undefined,
    streaks: streaks.slice(0, 3).map((s) => ({
      name: s.name.split(" ").pop()!,
      type: s.streakType === "hitting" ? "hit" : s.streakType === "scoreless" ? "scoreless" : "hit",
      count: s.count,
    })),
    teamHR: Number(hitting?.homeRuns ?? 0) || undefined,
    teamERA: pitching?.era ?? undefined,
    lastResult: dash?.lastGame
      ? {
          won: dash.lastGame.teams.home.team.id === 136
            ? !!dash.lastGame.teams.home.isWinner
            : !!dash.lastGame.teams.away.isWinner,
          opponent:
            dash.lastGame.teams.home.team.id === 136
              ? dash.lastGame.teams.away.team.name
              : dash.lastGame.teams.home.team.name,
          score:
            dash.lastGame.teams.home.team.id === 136
              ? `${dash.lastGame.teams.home.score}-${dash.lastGame.teams.away.score}`
              : `${dash.lastGame.teams.away.score}-${dash.lastGame.teams.home.score}`,
        }
      : undefined,
  });

  const marinersRecord = dash?.marinersRecord;
  const isLoading = dashLoading;

  const [tone, setTone] = useState<Tone>('spicy');
  useEffect(() => {
    const saved = localStorage.getItem('trident:tone');
    if (saved === 'family' || saved === 'spicy' || saved === 'profane') setTone(saved as Tone);
  }, []);

  return (
    <div className="space-y-0">
      {/* THE PULSE ticker — full bleed */}
      <PulseTicker items={pulseItems} className="sticky top-0 z-30 mb-0" />

      <div className="max-w-screen-xl mx-auto px-4 pt-4 pb-8 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              className="font-black text-primary leading-none tracking-tight"
              style={{
                fontFamily: "var(--font-grotesk)",
                fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
                letterSpacing: "-0.03em",
              }}
            >
              Seattle{" "}
              <span className="text-gradient-teal">Mariners</span>
            </h1>
            <p className="text-xs text-secondary mt-1.5 flex items-center gap-2">
              <span>
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  timeZone: "America/Los_Angeles",
                })}
              </span>
              {marinersRecord && (
                <span
                  className="font-bold text-teal"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {marinersRecord.wins}–{marinersRecord.losses}
                </span>
              )}
            </p>
          </div>
          <LiveBadge lastUpdated={lastUpdated} />
        </div>

        {/* Main 2-column layout on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* LEFT — main content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Today's game or last game result */}
            {isLoading ? (
              <div className="trident-card p-8 animate-pulse h-40" />
            ) : dash?.todayGame ? (
              <GameCard game={dash.todayGame} />
            ) : dash?.lastGame ? (
              <LastGameHero
                game={dash.lastGame}
                isWin={
                  dash.lastGame.teams.home.team.id === 136
                    ? !!dash.lastGame.teams.home.isWinner
                    : !!dash.lastGame.teams.away.isWinner
                }
              />
            ) : null}

            {/* Record + streak */}
            {marinersRecord && (
              <RecordBadge
                wins={marinersRecord.wins}
                losses={marinersRecord.losses}
                streak={dash?.streak ?? 1}
                streakType={dash?.streakType ?? "W"}
              />
            )}

            {/* Pythagorean luck + magic/tragic number */}
            {!isLoading && marinersRecord && dash?.alWest && (
              <div className="grid grid-cols-2 gap-4">
                <PythagLuckCard
                  runsScored={marinersRecord.runsScored ?? 0}
                  runsAllowed={marinersRecord.runsAllowed ?? 0}
                  actualWins={marinersRecord.wins}
                  gamesPlayed={marinersRecord.wins + marinersRecord.losses}
                />
                <MagicNumberCard
                  teamRecord={marinersRecord}
                  divisionRecords={dash.alWest.teamRecords}
                />
              </div>
            )}

            {/* Team stats grid */}
            {!isLoading && <TeamStatGrid hitting={hitting} pitching={pitching} />}

            {/* Advanced metrics panel */}
            {!isLoading && <AdvancedStatsPanel hitting={hitting} pitching={pitching} />}

            {/* Outlier callouts */}
            {outlierFacts.length > 0 && (
              <div className="space-y-2">
                {outlierFacts.map((f, i) => (
                  <OutlierCallout key={i} fact={f} />
                ))}
              </div>
            )}

            {/* Last 10 strip */}
            {dash?.games && (
              <Last10Strip games={dash.games} />
            )}

            {/* Season Mood chart */}
            {dash?.games && dash.games.length > 0 && (
              <SeasonMoodChart games={dash.games} tone={tone} />
            )}

            {/* Did You Know */}
            <DidYouKnow />
          </div>

          {/* RIGHT — sidebar */}
          <div className="space-y-4">
            {/* Standings */}
            {dash?.alWest && <StandingsWidget division={dash.alWest} />}

            {/* Streak Tracker */}
            {!logsLoading && streaks.length > 0 && (
              <StreakTracker streaks={streaks} />
            )}
            {logsLoading && (
              <div className="trident-card p-5 animate-pulse">
                <div className="h-3 w-32 bg-surface-2 rounded mb-3" />
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-10 bg-surface-2 rounded-lg" />)}
                </div>
              </div>
            )}

            {/* Quick nav tiles */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: "/power-rankings", emoji: "⚡", label: "Power Rankings", color: "rgba(255,183,0,0.08)", border: "rgba(255,183,0,0.2)" },
                { href: "/compare", emoji: "⚔️", label: "Player Compare", color: "rgba(0,163,163,0.08)", border: "rgba(0,163,163,0.2)" },
                { href: "/stats", emoji: "📊", label: "Team Stats", color: "rgba(139,164,186,0.06)", border: "rgba(139,164,186,0.15)" },
                { href: "/roster", emoji: "👥", label: "Roster", color: "rgba(34,197,94,0.06)", border: "rgba(34,197,94,0.15)" },
              ].map((t) => (
                <a
                  key={t.href}
                  href={t.href}
                  className="trident-card p-4 flex flex-col items-center gap-2 text-center group"
                  style={{ background: t.color, borderColor: t.border }}
                >
                  <span className="text-2xl transition-transform duration-200 group-hover:scale-110">{t.emoji}</span>
                  <span
                    className="text-[10px] font-bold text-secondary group-hover:text-primary transition-colors"
                    style={{ fontFamily: "var(--font-grotesk)" }}
                  >{t.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
