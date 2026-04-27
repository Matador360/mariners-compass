"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
import type { MLBGame, MLBHittingStats, MLBPitchingStats, MLBStandingsDivision } from "@/types/mlb";
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

  return (
    <div className="trident-card p-4 flex items-center gap-4">
      <div className="flex-1">
        <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-1">Season Record</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-primary tabular-nums leading-none">
            <CountingNumber value={wins} duration={600} />–<CountingNumber value={losses} duration={600} />
          </span>
          <span className="text-sm text-muted">({winPct.toFixed(3).replace(/^0/, "")})</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-1">Streak</p>
        <p className={`text-xl font-black ${streak >= 3 && streakType === "W" ? "text-win" : streakType === "L" ? "text-loss" : "text-secondary"}`}>
          {streakType}{streak}
        </p>
      </div>
    </div>
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
    { v: Number(pitching.homeRuns ?? 0), l: "HR", fmt: (n: number) => String(Math.round(n)), good: (n: number) => n < 80, bad: (n: number) => n > 140 },
    { v: Number(pitching.losses ?? 0), l: "L", fmt: (n: number) => String(Math.round(n)), good: (n: number) => n < 55, bad: (n: number) => n > 75 },
  ] : [];

  const StatCell = ({ v, l, fmt, good, bad }: { v: number; l: string; fmt: (n: number) => string; good: (n: number) => boolean; bad: (n: number) => boolean }) => {
    const color = good(v) ? "text-green-400" : bad(v) ? "text-red-400" : "text-primary";
    return (
      <StatClickable statKey={l} value={fmt(v)}>
        <div className="flex flex-col items-center gap-0.5 py-2 rounded transition-colors hover:bg-surface-2/50">
          <span className={`text-base font-black stat-number tabular-nums ${color}`}>
            {fmt(v)}
          </span>
          <span className="text-[9px] uppercase tracking-widest text-muted font-semibold">{l}</span>
        </div>
      </StatClickable>
    );
  };

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

function DidYouKnow() {
  const [idx, setIdx] = useState(0);
  const fact = MARINERS_FACTS[idx % MARINERS_FACTS.length];

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => i + 1), 12000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="trident-card p-4 border-gold/20 bg-gradient-to-r from-gold/5 to-transparent">
      <p className="text-[10px] uppercase tracking-widest text-gold font-semibold mb-2">
        {fact.emoji} Did You Know?
      </p>
      <p className="text-sm text-primary leading-snug">{fact.fact}</p>
      <div className="flex gap-1 mt-3">
        {MARINERS_FACTS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`h-0.5 rounded-full transition-all ${i === idx % MARINERS_FACTS.length ? "bg-gold w-4" : "bg-border w-2"}`}
          />
        ))}
      </div>
    </div>
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

  return (
    <div className="space-y-0">
      {/* THE PULSE ticker — full bleed */}
      <PulseTicker items={pulseItems} className="sticky top-0 z-30 mb-0" />

      <div className="max-w-screen-xl mx-auto px-4 pt-4 pb-8 space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-primary tracking-tight leading-none">
              Seattle Mariners
            </h1>
            <p className="text-xs text-secondary mt-0.5">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                timeZone: "America/Los_Angeles",
              })}
              {marinersRecord && (
                <span className="ml-2 font-bold text-teal">
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
                { href: "/power-rankings", emoji: "⚡", label: "Power\nRankings" },
                { href: "/compare", emoji: "⚔️", label: "Player\nCompare" },
                { href: "/stats", emoji: "📊", label: "Team\nStats" },
                { href: "/roster", emoji: "👥", label: "Roster" },
              ].map((t) => (
                <a
                  key={t.href}
                  href={t.href}
                  className="trident-card p-3 flex flex-col items-center gap-1 hover:border-border-accent hover:bg-surface-2 transition-colors text-center"
                >
                  <span className="text-xl">{t.emoji}</span>
                  <span className="text-[10px] font-bold text-secondary whitespace-pre-line">{t.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
