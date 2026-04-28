"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/sparkline";
import { playerHeadshotUrl } from "@/lib/utils";
import {
  computeMultiSnapshot,
  type PlayerWithGameLog,
  type RankSnapshotSet,
  type GameLogEntry,
} from "@/lib/rank-history";
import {
  scoreHitter,
  scorePitcher,
  attendanceFlag,
  type SustainabilityVerdict,
} from "@/lib/sustainability";
import {
  fetchExpectedStatsLeaderboard,
  type SavantExpected,
} from "@/lib/savant";
import { captionForLeagueRank } from "@/lib/captions";
import { loadTone, subscribeTone, type Tone } from "@/lib/tone";
import { SustainabilityBadge } from "@/components/sustainability-badge";
import { TheCooler, type CoolerCard } from "@/components/the-cooler";
import { RankBumpChart } from "@/components/rank-bump-chart";
import {
  PositionGroupToggle,
  type PositionGroupMode,
} from "@/components/position-group-toggle";

interface RankedPlayer {
  id: number;
  name: string;
  position: string;
  isPitcher: boolean;
  ops?: string;
  era?: string;
  last7Values: number[];
  highlights: string[];
  whyHotCaption?: string;
  slumpDriver?: string;
  verdict: SustainabilityVerdict;
  unavailable: boolean;
}

interface DisplayCard extends RankedPlayer {
  rank: number;
  prevRank: number;
  hotScore: number;
}

type FilterMode = "all" | "hitters" | "pitchers" | "hot" | "cold";
type TimeOffset = 0 | 7 | 14 | 28;

const TIME_OFFSETS: { offset: TimeOffset; label: string }[] = [
  { offset: 0, label: "Now" },
  { offset: 7, label: "7d" },
  { offset: 14, label: "14d" },
  { offset: 28, label: "28d" },
];

const SEASON = new Date().getFullYear();

const POSITION_DISPLAY: Record<string, string> = {
  C: "Catcher",
  IF: "Infield",
  OF: "Outfield",
  DH: "DH",
  SP: "Starters",
  RP: "Bullpen",
};

const BUCKETS_FOR_GROUPED: { key: string; label: string; matches: (pos: string, isPitcher: boolean) => boolean }[] = [
  { key: "C", label: "Catcher", matches: (p) => p === "C" },
  { key: "IF", label: "Infield", matches: (p) => ["1B", "2B", "3B", "SS"].includes(p) },
  { key: "OF", label: "Outfield", matches: (p) => ["LF", "CF", "RF", "OF"].includes(p) },
  { key: "DH", label: "DH", matches: (p) => p === "DH" },
  { key: "SP", label: "Starters", matches: (_p, isP) => isP && _p !== "RP" },
  { key: "RP", label: "Bullpen", matches: (_p, isP) => isP && (_p === "RP" || _p === "P") },
];

const BEST_AT_EACH_POSITIONS = ["C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH", "SP", "RP"] as const;

function num(v: unknown, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function rate3(n: number): string {
  if (!Number.isFinite(n)) return ".---";
  return n.toFixed(3).replace(/^0\./, ".");
}

function findStatBlock(
  blocks: Array<{ type?: { displayName?: string }; group?: { displayName?: string }; splits?: unknown[] }> | undefined,
  groupName: string,
  preferGameLog: boolean,
) {
  if (!blocks) return undefined;
  const targets = blocks.filter((b) => b.group?.displayName === groupName);
  if (preferGameLog) {
    return (
      targets.find((b) => (b.type?.displayName ?? "").toLowerCase().includes("log")) ??
      targets.find((b) => (b.splits?.length ?? 0) > 1)
    );
  }
  return (
    targets.find((b) => (b.type?.displayName ?? "").toLowerCase().includes("season") || (b.type?.displayName ?? "").toLowerCase() === "statssingleseason") ??
    targets.find((b) => (b.splits?.length ?? 0) === 1)
  );
}

function buildSlumpDriver(
  isPitcher: boolean,
  log: GameLogEntry[],
  recent: Array<{ stat: Record<string, unknown> }>,
): string | undefined {
  if (isPitcher) {
    const last3 = recent.slice(0, 3);
    let er = 0, ip = 0;
    for (const g of last3) {
      er += num(g.stat.earnedRuns);
      ip += parseFloat(String(g.stat.inningsPitched ?? "0")) || 0;
    }
    if (ip > 0) {
      const era = (er * 9) / ip;
      if (era > 6) return `ERA ${era.toFixed(2)} last ${last3.length} starts`;
    }
    let hr = 0;
    for (const g of recent.slice(0, 5)) hr += num(g.stat.homeRuns);
    if (hr >= 4) return `${hr} HRs allowed last ${Math.min(5, recent.length)}`;
    let kSum = 0, ipSum = 0;
    for (const g of recent.slice(0, 5)) {
      kSum += num(g.stat.strikeOuts);
      ipSum += parseFloat(String(g.stat.inningsPitched ?? "0")) || 0;
    }
    if (ipSum >= 5 && (kSum * 9) / ipSum < 6) {
      return `${((kSum * 9) / ipSum).toFixed(1)} K/9 last 5`;
    }
    return undefined;
  }

  let runHits = 0;
  let runAB = 0;
  for (const g of recent) {
    runHits += num(g.stat.hits);
    runAB += num(g.stat.atBats);
    if (runHits > 0) break;
  }
  if (runHits === 0 && runAB >= 8) {
    let games = 0, ab = 0;
    for (const g of recent) {
      ab += num(g.stat.atBats);
      games++;
      if (num(g.stat.hits) > 0) break;
    }
    if (ab > 0) return `0-for-${ab} last ${games} games`;
  }

  const last7 = recent.slice(0, 7);
  let pa = 0, k = 0, h = 0, ab = 0, tb = 0, bb = 0, hbp = 0, sf = 0;
  for (const g of last7) {
    const a = num(g.stat.atBats);
    ab += a;
    h += num(g.stat.hits);
    tb += num(g.stat.totalBases);
    bb += num(g.stat.baseOnBalls);
    hbp += num(g.stat.hitByPitch);
    sf += num(g.stat.sacFlies);
    pa += a + num(g.stat.baseOnBalls) + num(g.stat.hitByPitch) + num(g.stat.sacFlies);
    k += num(g.stat.strikeOuts);
  }
  if (pa >= 12 && k / pa > 0.40) {
    return `K'd ${k} of ${pa} PAs`;
  }
  if (ab > 0) {
    const obp = pa > 0 ? (h + bb + hbp) / pa : 0;
    const slg = ab > 0 ? tb / ab : 0;
    const ops = obp + slg;
    if (ops < 0.500) return `${rate3(ops)} OPS last 7`;
  }
  if (log.length >= 5) {
    let recentHits = 0, recentAB = 0;
    for (const g of recent.slice(0, 5)) {
      recentHits += num(g.stat.hits);
      recentAB += num(g.stat.atBats);
    }
    if (recentAB > 0 && recentHits / recentAB < 0.180) {
      return `${rate3(recentHits / recentAB)} AVG last 5`;
    }
  }
  return undefined;
}

function topHighlight(highlights: string[]): string | undefined {
  return highlights[0];
}

interface FetchResult {
  meta: Map<number, RankedPlayer>;
  snapshots: RankSnapshotSet[];
  cooler: CoolerCard[];
  leagueCaption: string | null;
  teamLast7Count: number;
}

async function fetchPowerRankings(tone: Tone): Promise<FetchResult> {
  const [rosterRes, savantRes] = await Promise.allSettled([
    fetch(
      `https://statsapi.mlb.com/api/v1/teams/136/roster?rosterType=active&season=${SEASON}`,
    ),
    fetchExpectedStatsLeaderboard(SEASON).catch(() => [] as SavantExpected[]),
  ]);

  const roster =
    rosterRes.status === "fulfilled" ? await rosterRes.value.json() : { roster: [] };
  const savant = savantRes.status === "fulfilled" ? savantRes.value : [];
  const savantMap = new Map<number, SavantExpected>();
  for (const s of savant) savantMap.set(s.playerId, s);

  const rosterList: Array<{
    person: { id: number; fullName: string };
    position: { abbreviation: string };
  }> = roster.roster ?? [];

  const playersWithLogs: PlayerWithGameLog[] = [];
  const meta = new Map<number, RankedPlayer>();
  const todayHotScores = new Map<number, number>();
  const todayPrimary = new Map<number, number>();
  const dateAppearances = new Map<number, Set<string>>();

  await Promise.allSettled(
    rosterList.slice(0, 30).map(async (p) => {
      try {
        const logRes = await fetch(
          `https://statsapi.mlb.com/api/v1/people/${p.person.id}/stats?stats=season,gameLog&group=hitting,pitching&season=${SEASON}&limit=30`,
        );
        const logData = await logRes.json();

        const isPitcher =
          p.position.abbreviation === "SP" ||
          p.position.abbreviation === "RP" ||
          p.position.abbreviation === "P";
        const groupName = isPitcher ? "pitching" : "hitting";

        const gameLogBlock = findStatBlock(logData.stats, groupName, true);
        const seasonBlock = findStatBlock(logData.stats, groupName, false);
        const gameSplits =
          (gameLogBlock?.splits as Array<{ date?: string; stat?: Record<string, unknown> }> | undefined) ?? [];
        const seasonSplits =
          (seasonBlock?.splits as Array<{ stat?: Record<string, unknown> }> | undefined) ?? [];
        const seasonStat: Record<string, unknown> | undefined = seasonSplits[0]?.stat;
        if (!gameSplits.length) return;

        const log: GameLogEntry[] = gameSplits
          .filter((s) => s.date && s.stat)
          .map((s) => ({ date: String(s.date), stat: s.stat as Record<string, unknown> }))
          .sort((a, b) => b.date.localeCompare(a.date));
        if (!log.length) return;

        const recentForCalc = log.map((g) => ({ stat: g.stat }));
        const datesSet = new Set(log.map((g) => g.date));
        dateAppearances.set(p.person.id, datesSet);

        const highlights: string[] = [];
        let last7Values: number[] = [];
        let primaryStat = "";
        let hotScore = 50;
        let primaryNumeric = 0;
        let verdict: SustainabilityVerdict;
        let slumpDriver: string | undefined;
        let seasonOPSNum: number | undefined;
        let seasonERANum: number | undefined;

        if (!isPitcher) {
          const last7 = log.slice(0, 7);
          const opsPerGame = last7.map((g) => {
            const ab = num(g.stat.atBats);
            const h = num(g.stat.hits);
            const bb = num(g.stat.baseOnBalls);
            const hbp = num(g.stat.hitByPitch);
            const sf = num(g.stat.sacFlies);
            const tb = num(g.stat.totalBases);
            const pa = ab + bb + hbp + sf;
            const obp = pa > 0 ? (h + bb + hbp) / pa : 0;
            const slg = ab > 0 ? tb / ab : 0;
            return obp + slg;
          });

          const seasonOPS = parseFloat(String(seasonStat?.ops ?? "0.700")) || 0.700;
          seasonOPSNum = seasonOPS;
          const recentAvg =
            opsPerGame.length > 0
              ? opsPerGame.reduce((a, b) => a + b, 0) / opsPerGame.length
              : seasonOPS;
          hotScore = Math.max(0, Math.min(100, 50 + (recentAvg / Math.max(seasonOPS, 0.001) - 1) * 100));
          last7Values = opsPerGame.slice(0, 7).reverse();
          primaryStat = String(seasonStat?.ops ?? "");
          primaryNumeric = recentAvg;

          if (recentAvg > seasonOPS * 1.2)
            highlights.push(`🔥 ${rate3(recentAvg)} OPS last 7`);
          const recentHR = last7.reduce((sum, g) => sum + num(g.stat.homeRuns), 0);
          if (recentHR >= 3) highlights.push(`💣 ${recentHR} HR last week`);
          const recentHits = last7.filter((g) => num(g.stat.hits) > 0).length;
          if (recentHits >= 6) highlights.push(`⚡ Hit in ${recentHits} of last 7`);

          let pa7 = 0, k7 = 0, h7 = 0, ab7 = 0, hr7 = 0, tb7 = 0, bb7 = 0, hbp7 = 0, sf7 = 0;
          for (const g of last7) {
            const a = num(g.stat.atBats);
            ab7 += a;
            h7 += num(g.stat.hits);
            hr7 += num(g.stat.homeRuns);
            tb7 += num(g.stat.totalBases);
            bb7 += num(g.stat.baseOnBalls);
            hbp7 += num(g.stat.hitByPitch);
            sf7 += num(g.stat.sacFlies);
            pa7 += a + num(g.stat.baseOnBalls) + num(g.stat.hitByPitch) + num(g.stat.sacFlies);
            k7 += num(g.stat.strikeOuts);
          }
          const babipDen7 = ab7 - k7 - hr7 + sf7;
          const babipRecent = babipDen7 > 0 ? (h7 - hr7) / babipDen7 : 0;
          const kPctRecent = pa7 > 0 ? k7 / pa7 : 0;
          const slgRecent = ab7 > 0 ? tb7 / ab7 : 0;
          const avgRecent = ab7 > 0 ? h7 / ab7 : 0;
          const isoRecent = slgRecent - avgRecent;

          const seasonAB = num(seasonStat?.atBats);
          const seasonHits = num(seasonStat?.hits);
          const seasonHR = num(seasonStat?.homeRuns);
          const seasonK = num(seasonStat?.strikeOuts);
          const seasonSF = num(seasonStat?.sacFlies);
          const seasonBB = num(seasonStat?.baseOnBalls);
          const seasonHBP = num(seasonStat?.hitByPitch);
          const seasonPA = seasonAB + seasonBB + seasonHBP + seasonSF;
          const seasonBABIPDen = seasonAB - seasonK - seasonHR + seasonSF;
          const babipSeason = seasonBABIPDen > 0 ? (seasonHits - seasonHR) / seasonBABIPDen : 0;
          const kPctSeason = seasonPA > 0 ? seasonK / seasonPA : 0;
          const slgSeason = parseFloat(String(seasonStat?.slg ?? "0")) || 0;
          const avgSeason = parseFloat(String(seasonStat?.avg ?? "0")) || 0;
          const isoSeason = slgSeason - avgSeason;

          const sav = savantMap.get(p.person.id);
          verdict = scoreHitter({
            recentPA: pa7,
            babipRecent,
            babipSeason,
            hardHitPctSavant: sav?.hardHitPct,
            barrelPctSavant: sav?.brlPct,
            kPctRecent,
            kPctSeason,
            isoRecent,
            isoSeason,
          });
          slumpDriver = buildSlumpDriver(false, log, recentForCalc);
        } else {
          const last5 = log.slice(0, 5);
          const recentERAs = last5.map((g) => {
            const er = num(g.stat.earnedRuns);
            const ip = parseFloat(String(g.stat.inningsPitched ?? "1")) || 1;
            return ip > 0 ? (er * 9) / ip : 0;
          });
          const recentERA =
            recentERAs.length > 0
              ? recentERAs.reduce((a, b) => a + b, 0) / recentERAs.length
              : 4.5;

          const seasonERA = parseFloat(String(seasonStat?.era ?? "4.50")) || 4.5;
          seasonERANum = seasonERA;
          hotScore =
            seasonERA > 0
              ? Math.max(
                  0,
                  Math.min(100, 50 + (seasonERA / Math.max(recentERA, 0.1) - 1) * 80),
                )
              : 50;
          last7Values = recentERAs.slice().reverse();
          primaryStat = String(seasonStat?.era ?? "");
          primaryNumeric = recentERA;

          const scoreless = last5.filter((g) => num(g.stat.earnedRuns) === 0).length;
          if (scoreless >= 3)
            highlights.push(`🎯 ${scoreless} scoreless last 5 starts`);
          const recentK = last5.reduce((sum, g) => sum + num(g.stat.strikeOuts), 0);
          if (recentK >= 25) highlights.push(`🎳 ${recentK} K's last 5 starts`);

          let ip5 = 0, k5 = 0;
          for (const g of last5) {
            ip5 += parseFloat(String(g.stat.inningsPitched ?? "0")) || 0;
            k5 += num(g.stat.strikeOuts);
          }
          const k9Recent = ip5 > 0 ? (k5 * 9) / ip5 : 0;

          const seasonIPVal = parseFloat(String(seasonStat?.inningsPitched ?? "0")) || 0;
          const seasonKVal = num(seasonStat?.strikeOuts);
          const seasonBBVal = num(seasonStat?.baseOnBalls);
          const seasonHRVal = num(seasonStat?.homeRuns);
          const seasonRVal = num(seasonStat?.runs);
          const seasonHVal = num(seasonStat?.hits);
          const seasonHBPVal = num(seasonStat?.hitByPitch);
          const k9Season = seasonIPVal > 0 ? (seasonKVal * 9) / seasonIPVal : 0;
          const fipSeason =
            seasonIPVal > 0
              ? (13 * seasonHRVal + 3 * seasonBBVal - 2 * seasonKVal) / seasonIPVal + 3.15
              : 4.0;
          const lobNum = seasonHVal + seasonBBVal + seasonHBPVal - seasonRVal;
          const lobDen = seasonHVal + seasonBBVal + seasonHBPVal - 1.4 * seasonHRVal;
          const lobPct = lobDen > 0 ? Math.max(0, Math.min(1, lobNum / lobDen)) : 0.72;

          verdict = scorePitcher({
            recentIP: ip5,
            fipSeason,
            eraSeason: seasonERA,
            lobPct,
            k9Recent,
            k9Season,
          });
          slumpDriver = buildSlumpDriver(true, log, recentForCalc);
        }

        playersWithLogs.push({
          playerId: p.person.id,
          name: p.person.fullName,
          position: p.position.abbreviation,
          isPitcher,
          seasonOPS: seasonOPSNum,
          seasonERA: seasonERANum,
          log,
        });

        todayHotScores.set(p.person.id, hotScore);
        todayPrimary.set(p.person.id, primaryNumeric);

        meta.set(p.person.id, {
          id: p.person.id,
          name: p.person.fullName,
          position: p.position.abbreviation,
          isPitcher,
          ops: !isPitcher ? primaryStat : undefined,
          era: isPitcher ? primaryStat : undefined,
          last7Values,
          highlights,
          whyHotCaption: topHighlight(highlights),
          slumpDriver,
          verdict,
          unavailable: false,
        });
      } catch {
        // skip player
      }
    }),
  );

  const allDates = new Set<string>();
  for (const set of dateAppearances.values()) for (const d of set) allDates.add(d);
  const sortedDates = [...allDates].sort((a, b) => b.localeCompare(a));
  const teamLast7 = sortedDates.slice(0, 7);
  const teamLast7Set = new Set(teamLast7);

  for (const [playerId, dates] of dateAppearances) {
    let count = 0;
    for (const d of dates) if (teamLast7Set.has(d)) count++;
    const m = meta.get(playerId);
    if (m) {
      m.unavailable = attendanceFlag({
        lastNGamesPlayed: count,
        teamLastNGames: teamLast7.length,
      });
    }
  }

  const snapshots = computeMultiSnapshot(playersWithLogs, [0, 7, 14, 28]);

  const todaySnap = snapshots[0];
  const hotCount70 = todaySnap.players.filter((p) => p.hotScore >= 70).length;
  const avgHot =
    todaySnap.players.length > 0
      ? todaySnap.players.reduce((s, p) => s + p.hotScore, 0) / todaySnap.players.length
      : 50;

  let leagueCaption: string | null = null;
  const seed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  if (hotCount70 >= 4) {
    const cap = captionForLeagueRank(2, 30, "hot streaks", seed, tone)[0];
    if (cap) leagueCaption = cap.emoji ? `${cap.emoji} ${cap.text}` : cap.text;
  } else if (avgHot < 40) {
    const cap = captionForLeagueRank(27, 30, "hot streaks", seed, tone)[0];
    if (cap) leagueCaption = cap.emoji ? `${cap.emoji} ${cap.text}` : cap.text;
  }

  const cooler: CoolerCard[] = [...todaySnap.players]
    .sort((a, b) => a.hotScore - b.hotScore)
    .slice(0, 5)
    .map((sp) => {
      const m = meta.get(sp.playerId);
      return {
        id: sp.playerId,
        name: sp.name,
        position: sp.position,
        hotScore: sp.hotScore,
        primaryStat: m?.ops ?? m?.era ?? "",
        primaryStatLabel: m?.ops ? "OPS" : m?.era ? "ERA" : "",
        trendValues: m?.last7Values ?? [],
        slumpDriver: m?.slumpDriver,
      };
    });

  return { meta, snapshots, cooler, leagueCaption, teamLast7Count: teamLast7.length };
}

function RankMovement({ current, prev }: { current: number; prev: number }) {
  const diff = prev - current;
  if (Math.abs(diff) < 1) {
    return <span className="text-[10px] text-muted w-6 text-center">—</span>;
  }
  if (diff > 0) {
    return (
      <span className="text-[10px] text-green-400 font-bold w-6 text-center">
        ↑{diff}
      </span>
    );
  }
  return (
    <span className="text-[10px] text-red-400 font-bold w-6 text-center">
      ↓{Math.abs(diff)}
    </span>
  );
}

function HotMeter({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const color =
    clamped >= 75 ? "#EF4444" :
    clamped >= 60 ? "#F97316" :
    clamped >= 50 ? "#FFB700" :
    clamped >= 35 ? "#60A5FA" :
    "#3B82F6";

  const emoji =
    clamped >= 75 ? "🔥" :
    clamped >= 60 ? "📈" :
    clamped >= 50 ? "➖" :
    clamped >= 35 ? "📉" :
    "🥶";

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm">{emoji}</span>
      <div className="w-16 h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-secondary w-5">
        {Math.round(clamped)}
      </span>
    </div>
  );
}

function PlayerCard({ p }: { p: DisplayCard }) {
  return (
    <a
      href={`/players/${p.id}`}
      className="trident-card p-3 flex items-center gap-3 hover:border-border-accent transition-colors group"
    >
      <div className="flex flex-col items-center w-8 shrink-0">
        <span className="text-sm font-black text-primary tabular-nums leading-none">
          {p.rank}
        </span>
        <RankMovement current={p.rank} prev={p.prevRank} />
      </div>

      <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-2 border border-border shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={playerHeadshotUrl(p.id)}
          alt={p.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-bold text-primary group-hover:text-teal transition-colors truncate">
            {p.name}
          </span>
          <span className="text-[10px] text-muted shrink-0">{p.position}</span>
          {p.unavailable && (
            <span
              className="text-[10px] px-1.5 h-5 inline-flex items-center rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/40 leading-none"
              title="Limited recent appearances — small sample"
            >
              🩹 Limited
            </span>
          )}
          <SustainabilityBadge verdict={p.verdict} />
        </div>
        {p.whyHotCaption && (
          <p className="text-[10px] text-secondary truncate mt-0.5">
            {p.whyHotCaption}
          </p>
        )}
        {!p.whyHotCaption && p.slumpDriver && (
          <p className="text-[10px] text-blue-300/80 truncate mt-0.5">
            {p.slumpDriver}
          </p>
        )}
      </div>

      <div className="text-center shrink-0 w-14">
        {p.ops && (
          <>
            <p className="text-xs font-black text-primary tabular-nums">{p.ops}</p>
            <p className="text-[9px] text-muted">OPS</p>
          </>
        )}
        {p.era && (
          <>
            <p className="text-xs font-black text-primary tabular-nums">{p.era}</p>
            <p className="text-[9px] text-muted">ERA</p>
          </>
        )}
      </div>

      {p.last7Values.length > 1 && (
        <Sparkline
          values={p.last7Values}
          width={48}
          height={20}
          color={
            p.hotScore >= 60
              ? "#EF4444"
              : p.hotScore <= 40
                ? "#3B82F6"
                : "#00A3A3"
          }
        />
      )}

      <div className="shrink-0 hidden sm:block">
        <HotMeter score={p.hotScore} />
      </div>
    </a>
  );
}

function PlaceholderCard({ pos }: { pos: string }) {
  return (
    <div className="trident-card p-3 flex items-center gap-3 opacity-60">
      <div className="w-8 shrink-0 text-center">
        <span className="text-sm font-black text-muted tabular-nums leading-none">—</span>
      </div>
      <div className="w-10 h-10 rounded-full bg-surface-2 border border-border shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-bold text-muted">No qualifier</span>
        <p className="text-[10px] text-muted mt-0.5">{pos}</p>
      </div>
    </div>
  );
}

export default function PowerRankingsPage() {
  const [data, setData] = useState<FetchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [groupMode, setGroupMode] = useState<PositionGroupMode>("list");
  const [offset, setOffset] = useState<TimeOffset>(0);
  const [tone, setTone] = useState<Tone>("spicy");

  useEffect(() => {
    setTone(loadTone());
    return subscribeTone(setTone);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchPowerRankings(tone);
      setData(result);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [tone]);

  useEffect(() => {
    load();
  }, [load]);

  const offsetIndex = useMemo(() => {
    const idx = TIME_OFFSETS.findIndex((t) => t.offset === offset);
    return idx >= 0 ? idx : 0;
  }, [offset]);

  const displayCards = useMemo<DisplayCard[]>(() => {
    if (!data) return [];
    const selected = data.snapshots[offsetIndex] ?? data.snapshots[0];
    const prevSnap =
      offsetIndex === 0
        ? data.snapshots[1] ?? data.snapshots[0]
        : data.snapshots[0];
    const prevRankFor = (id: number): number => {
      const idx = prevSnap.players.findIndex((p) => p.playerId === id);
      const sel = selected.players.findIndex((p) => p.playerId === id);
      return idx >= 0 ? idx + 1 : sel + 1;
    };

    return selected.players
      .map((sp, i) => {
        const m = data.meta.get(sp.playerId);
        if (!m) return null;
        return {
          ...m,
          rank: i + 1,
          prevRank: prevRankFor(sp.playerId),
          hotScore: sp.hotScore,
        } as DisplayCard;
      })
      .filter((c): c is DisplayCard => c != null);
  }, [data, offsetIndex]);

  const filteredCards = useMemo(() => {
    return displayCards.filter((p) => {
      if (filter === "hitters") return !p.isPitcher;
      if (filter === "pitchers") return p.isPitcher;
      if (filter === "hot") return p.hotScore >= 60;
      if (filter === "cold") return p.hotScore <= 40;
      return true;
    });
  }, [displayCards, filter]);

  const FILTERS: { key: FilterMode; label: string }[] = [
    { key: "all", label: "All" },
    { key: "hot", label: "🔥 Hot" },
    { key: "cold", label: "🥶 Cold" },
    { key: "hitters", label: "Hitters" },
    { key: "pitchers", label: "Pitchers" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-black text-primary tracking-tight">
          ⚡ Power Rankings
        </h1>
        <p className="text-sm text-secondary mt-0.5">
          Ranked by recent performance vs. season baseline. Updated daily.
        </p>
        {data?.leagueCaption && (
          <p className="text-xs text-teal mt-2 italic">{data.leagueCaption}</p>
        )}
      </div>

      <div className="flex flex-col gap-3 mb-4">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
                filter === f.key
                  ? "bg-teal/20 border-teal text-teal"
                  : "bg-surface-2 border-border text-secondary hover:border-border-accent",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <PositionGroupToggle mode={groupMode} onChange={setGroupMode} />

          <div className="inline-flex items-center gap-1 rounded-full bg-surface-2 border border-border p-0.5">
            {TIME_OFFSETS.map((t) => (
              <button
                key={t.offset}
                onClick={() => setOffset(t.offset)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors",
                  offset === t.offset
                    ? "bg-teal text-black"
                    : "text-secondary hover:text-primary",
                )}
                title={
                  t.offset === 0
                    ? "Today's snapshot"
                    : `${t.offset} days ago`
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {data && data.snapshots.length > 1 && (
        <div className="trident-card p-3 mb-5">
          <RankBumpChart snapshots={data.snapshots} height={260} />
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="trident-card p-3 animate-pulse h-16" />
          ))}
        </div>
      )}

      {!loading && filteredCards.length === 0 && (
        <div className="trident-card p-8 text-center">
          <p className="text-secondary">No players match this filter yet.</p>
        </div>
      )}

      {!loading && groupMode === "list" && (
        <div className="space-y-1.5">
          {filteredCards.map((p) => (
            <PlayerCard key={p.id} p={p} />
          ))}
        </div>
      )}

      {!loading && groupMode === "grouped" && (
        <div className="space-y-6">
          {BUCKETS_FOR_GROUPED.map((bucket) => {
            const inBucket = filteredCards.filter((p) =>
              bucket.matches(p.position, p.isPitcher),
            );
            if (!inBucket.length) return null;
            return (
              <section key={bucket.key}>
                <h2 className="text-xs uppercase tracking-wider text-muted font-bold mb-2">
                  {POSITION_DISPLAY[bucket.key] ?? bucket.label}
                </h2>
                <div className="space-y-1.5">
                  {inBucket.map((p) => (
                    <PlayerCard key={p.id} p={p} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {!loading && groupMode === "best-at-each" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {BEST_AT_EACH_POSITIONS.map((pos) => {
            const candidates = displayCards
              .filter((p) => p.position === pos)
              .sort((a, b) => b.hotScore - a.hotScore);
            const top = candidates[0];
            return (
              <div key={pos}>
                <h3 className="text-[10px] uppercase tracking-wider text-muted font-bold mb-1">
                  {pos}
                </h3>
                {top ? (
                  <PlayerCard p={top} />
                ) : (
                  <PlaceholderCard pos={pos} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && data && data.cooler.length > 0 && (
        <TheCooler coldPlayers={data.cooler} max={5} />
      )}
    </div>
  );
}
