"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PlayerTrendChart } from "@/components/charts/player-trend-chart";
import { TridentDivider } from "@/components/trident-logo";
import { Skeleton } from "@/components/skeleton-loader";
import { OutlierCallout } from "@/components/outlier-callout";
import { ClickableStatTile } from "@/components/stat-explainer";
import { CountingNumber } from "@/components/counting-number";
import { Sparkline } from "@/components/sparkline";
import { PitchArsenal, buildPitchArsenal } from "@/components/pitch-arsenal";
import {
  calcAdvancedHitting,
  calcAdvancedPitching,
  detectHittingOutliers,
  detectPitchingOutliers,
  fmtPct,
  fmtRate,
} from "@/lib/calc-stats";
import {
  cn,
  playerHeadshotUrl,
  positionColor,
  statAsNumber,
  rollingAverage,
  formatDate,
} from "@/lib/utils";
import type { MLBPerson, MLBHittingStats, MLBPitchingStats } from "@/types/mlb";

const SEASON = new Date().getFullYear();
const BASE = "https://statsapi.mlb.com/api/v1";

interface PlayerPageData {
  bio: MLBPerson | null;
  hitting: MLBHittingStats | null;
  pitching: MLBPitchingStats | null;
  career: Array<{ season: string; team?: { name: string }; stat: MLBHittingStats | MLBPitchingStats }>;
  gameLog: Array<{
    date: string;
    opponent?: { id: number; name: string };
    isHome: boolean;
    stat: MLBHittingStats | MLBPitchingStats;
  }>;
  isPitcher: boolean;
}

function usePlayer(id: string) {
  const [data, setData] = useState<PlayerPageData>({
    bio: null, hitting: null, pitching: null, career: [], gameLog: [], isPitcher: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    fetch(`${BASE}/people/${id}`)
      .then((r) => r.json())
      .then(async (bioData: { people: MLBPerson[] }) => {
        const bio = bioData.people?.[0] ?? null;
        const isPitcher = bio?.primaryPosition?.type === "Pitcher";
        const group = isPitcher ? "pitching" : "hitting";

        const [seasonRes, careerRes, logRes] = await Promise.allSettled([
          fetch(`${BASE}/people/${id}/stats?stats=season&group=${group}&season=${SEASON}`).then((r) => r.json()),
          fetch(`${BASE}/people/${id}/stats?stats=yearByYear&group=${group}`).then((r) => r.json()),
          fetch(`${BASE}/people/${id}/stats?stats=gameLog&group=${group}&season=${SEASON}&limit=40`).then((r) => r.json()),
        ]);

        const seasonStats = seasonRes.status === "fulfilled"
          ? seasonRes.value?.stats?.[0]?.splits?.[0]?.stat ?? null : null;
        const career = careerRes.status === "fulfilled"
          ? careerRes.value?.stats?.[0]?.splits ?? [] : [];
        const gameLog = logRes.status === "fulfilled"
          ? logRes.value?.stats?.[0]?.splits?.reverse() ?? [] : [];

        setData({
          bio,
          hitting: isPitcher ? null : (seasonStats as MLBHittingStats),
          pitching: isPitcher ? (seasonStats as MLBPitchingStats) : null,
          career,
          gameLog,
          isPitcher,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  return { data, loading };
}

function AdvancedHitterPanel({ hitting }: { hitting: MLBHittingStats }) {
  const adv = useMemo(() => calcAdvancedHitting(hitting), [hitting]);

  const rows = [
    { l: "BABIP", v: fmtRate(adv.babip), note: ".300 = league avg", good: adv.babip > 0.320, bad: adv.babip < 0.270 },
    { l: "ISO", v: fmtRate(adv.iso), note: "raw power", good: adv.iso > 0.220, bad: adv.iso < 0.130 },
    { l: "K%", v: fmtPct(adv.kPct), note: "strikeout rate", good: adv.kPct < 0.18, bad: adv.kPct > 0.28 },
    { l: "BB%", v: fmtPct(adv.bbPct), note: "walk rate", good: adv.bbPct > 0.12, bad: adv.bbPct < 0.06 },
    { l: "HR/600", v: adv.hrPer600.toFixed(1), note: "HR pace per 600 PA", good: adv.hrPer600 > 30, bad: adv.hrPer600 < 10 },
    { l: "XBH%", v: fmtPct(adv.xbhPct), note: "extra base hit rate", good: adv.xbhPct > 0.45, bad: adv.xbhPct < 0.25 },
  ];

  return (
    <div className="trident-card p-4">
      <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-3">
        ⚙️ Advanced Metrics
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {rows.map(({ l, v, note, good, bad }) => (
          <div key={l} className="p-2.5 rounded-lg bg-surface-2/50 border border-border">
            <p className="text-[9px] text-muted uppercase tracking-wider mb-0.5">{l}</p>
            <p className={cn("text-lg font-black tabular-nums leading-none", good ? "text-green-400" : bad ? "text-red-400" : "text-primary")}>
              {v}
            </p>
            <p className="text-[9px] text-muted mt-0.5 hidden sm:block">{note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdvancedPitcherPanel({ pitching }: { pitching: MLBPitchingStats }) {
  const adv = useMemo(() => calcAdvancedPitching(pitching), [pitching]);

  const rows = [
    { l: "FIP", v: adv.fip.toFixed(2), note: "fielding independent", good: adv.fip < 3.00, bad: adv.fip > 4.50 },
    { l: "K/BB", v: adv.kbb.toFixed(2), note: "command ratio", good: adv.kbb > 3.5, bad: adv.kbb < 1.5 },
    { l: "GB%", v: fmtPct(adv.gbPct), note: "ground ball rate", good: adv.gbPct > 0.50, bad: adv.gbPct < 0.35 },
    { l: "K%", v: fmtPct(adv.kPct), note: "strikeout rate", good: adv.kPct > 0.28, bad: adv.kPct < 0.16 },
    { l: "BB%", v: fmtPct(adv.bbPct), note: "walk rate", good: adv.bbPct < 0.07, bad: adv.bbPct > 0.12 },
    { l: "HR/9", v: adv.hr9.toFixed(2), note: "HR allowed rate", good: adv.hr9 < 0.80, bad: adv.hr9 > 1.40 },
  ];

  return (
    <div className="trident-card p-4">
      <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-3">
        ⚙️ Advanced Metrics
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {rows.map(({ l, v, note, good, bad }) => (
          <div key={l} className="p-2.5 rounded-lg bg-surface-2/50 border border-border">
            <p className="text-[9px] text-muted uppercase tracking-wider mb-0.5">{l}</p>
            <p className={cn("text-lg font-black tabular-nums leading-none", good ? "text-green-400" : bad ? "text-red-400" : "text-primary")}>
              {v}
            </p>
            <p className="text-[9px] text-muted mt-0.5 hidden sm:block">{note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GameLogSparklines({ gameLog, isPitcher }: {
  gameLog: PlayerPageData["gameLog"];
  isPitcher: boolean;
}) {
  const recent = gameLog.slice(0, 15);
  if (recent.length < 3) return null;

  const vals = recent.map((g) => {
    if (isPitcher) {
      const ps = g.stat as MLBPitchingStats;
      const ip = parseFloat(String(ps.inningsPitched ?? "0"));
      const er = Number(ps.earnedRuns ?? 0);
      return ip > 0 ? (er * 9) / ip : 0;
    } else {
      const hs = g.stat as MLBHittingStats;
      return statAsNumber(hs.ops);
    }
  }).reverse();

  const hitsVals = !isPitcher ? recent.map((g) => Number((g.stat as MLBHittingStats).hits ?? 0)).reverse() : [];
  const kVals = recent.map((g) => Number(
    isPitcher ? (g.stat as MLBPitchingStats).strikeOuts ?? 0 : (g.stat as MLBHittingStats).strikeOuts ?? 0
  )).reverse();

  return (
    <div className="trident-card p-4">
      <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-3">
        Last {recent.length} Games — Sparklines
      </p>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted w-12 shrink-0">{isPitcher ? "ERA" : "OPS"}</span>
          <Sparkline values={vals} width={180} height={28} color="#00A3A3" className="flex-1" />
        </div>
        {!isPitcher && hitsVals.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted w-12 shrink-0">Hits</span>
            <Sparkline values={hitsVals} width={180} height={28} color="#FFB700" className="flex-1" />
          </div>
        )}
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted w-12 shrink-0">K's</span>
          <Sparkline values={kVals} width={180} height={28} color="#22C55E" className="flex-1" />
        </div>
      </div>
    </div>
  );
}

export default function PlayerPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data, loading } = usePlayer(id ?? "");
  const [activeTab, setActiveTab] = useState<"stats" | "gamelog" | "career">("stats");

  const { bio, hitting, pitching, career, gameLog, isPitcher } = data;

  // Trend chart data
  const trendData = gameLog.slice(0, 30).reverse().map((g) => {
    const v = isPitcher
      ? statAsNumber((g.stat as MLBPitchingStats).era)
      : statAsNumber((g.stat as MLBHittingStats).ops);
    return { date: formatDate(g.date, { month: "numeric", day: "numeric" }), value: v };
  });

  const trendValues = trendData.map((d) => d.value);
  const rolling = rollingAverage(trendValues, 7);
  const trendWithRolling = trendData.map((d, i) => ({
    ...d, rolling: Math.round(rolling[i] * 1000) / 1000,
  }));

  const seasonAvg = isPitcher
    ? statAsNumber(pitching?.era)
    : statAsNumber(hitting?.ops);
  const last7Avg = trendValues.slice(-7).reduce((s, v) => s + v, 0) / Math.max(1, Math.min(7, trendValues.length));
  const hotColdRatio = seasonAvg > 0 ? last7Avg / seasonAvg : 1;
  const isHot = isPitcher ? hotColdRatio < 0.85 : hotColdRatio > 1.15;
  const isCold = isPitcher ? hotColdRatio > 1.15 : hotColdRatio < 0.85;

  // Outlier facts using proper component
  const outlierFacts = useMemo(() => {
    if (!hitting && !pitching) return [];
    try {
      if (!isPitcher && hitting) {
        const adv = calcAdvancedHitting(hitting);
        return detectHittingOutliers(hitting, adv, bio?.firstName ?? "Him");
      }
      if (isPitcher && pitching) {
        const adv = calcAdvancedPitching(pitching);
        return detectPitchingOutliers(pitching, adv, bio?.firstName ?? "Him");
      }
    } catch { /* ignore */ }
    return [];
  }, [hitting, pitching, isPitcher, bio]);

  // Pitch arsenal for pitchers (estimated from season stats)
  const pitchArsenal = useMemo(() => {
    if (!isPitcher || !pitching) return [];
    return buildPitchArsenal({ season: {
      fourSeamFastball: 45,
      slider: 25,
      changeup: 15,
      curveball: 15,
      averageSpeed: parseFloat(String(pitching.strikeoutsPer9Inn ?? "8")) > 10 ? 96 : 93,
      strikeOuts: pitching.strikeOuts,
    }});
  }, [isPitcher, pitching]);

  const posColor = positionColor(bio?.primaryPosition?.abbreviation ?? "");

  const hittingTiles = hitting ? [
    { label: "AVG", value: hitting.avg },
    { label: "OBP", value: hitting.obp },
    { label: "SLG", value: hitting.slg },
    { label: "OPS", value: hitting.ops, highlight: true },
    { label: "HR", value: hitting.homeRuns },
    { label: "RBI", value: hitting.rbi },
    { label: "SB", value: hitting.stolenBases },
    { label: "K", value: hitting.strikeOuts },
    { label: "BB", value: hitting.baseOnBalls },
    { label: "G", value: hitting.gamesPlayed },
    { label: "2B", value: hitting.doubles },
    { label: "3B", value: hitting.triples },
  ] : [];

  const pitchingTiles = pitching ? [
    { label: "ERA", value: pitching.era, highlight: true },
    { label: "WHIP", value: pitching.whip },
    { label: "K/9", value: pitching.strikeoutsPer9Inn },
    { label: "BB/9", value: pitching.walksPer9Inn },
    { label: "K", value: pitching.strikeOuts },
    { label: "W", value: pitching.wins, statKey: "WINS" },
    { label: "L", value: pitching.losses },
    { label: "SV", value: pitching.saves, statKey: "SAVES" },
    { label: "GS", value: pitching.gamesStarted },
    { label: "IP", value: pitching.inningsPitched },
    { label: "G", value: pitching.gamesPitched },
    { label: "HR", value: pitching.homeRuns },
  ] : [];

  const tiles = isPitcher ? pitchingTiles : hittingTiles;

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      </div>
    );
  }

  if (!bio) {
    return (
      <div className="trident-card p-10 text-center max-w-4xl mx-auto mt-8">
        <p className="text-muted">Player not found.</p>
        <Link href="/roster" className="text-teal text-sm mt-2 inline-block hover:underline">
          ← Back to Roster
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto px-4 py-6">
      {/* Back */}
      <Link href="/roster" className="flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors">
        <ArrowLeft size={14} />
        Roster
      </Link>

      {/* Hero card */}
      <div className="trident-card p-5 sm:p-6 flex items-start gap-5 fade-up">
        <div className="shrink-0">
          <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 bg-surface-2" style={{ borderColor: posColor }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={playerHeadshotUrl(bio.id)}
              alt={bio.fullName}
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                const t = e.target as HTMLImageElement;
                t.style.display = "none";
                const p = t.parentElement;
                if (p) p.innerHTML = `<div class="w-full h-full flex items-center justify-center text-3xl font-black text-muted">${bio.firstName?.[0] ?? "?"}${bio.lastName?.[0] ?? ""}</div>`;
              }}
            />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h1 className="text-xl sm:text-3xl font-black text-primary leading-tight">{bio.fullName}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase text-white tracking-wide" style={{ background: posColor }}>
                  {bio.primaryPosition?.abbreviation} · #{bio.primaryNumber ?? "—"}
                </span>
                {bio.batSide && (
                  <span className="text-xs text-muted">
                    Bats: {bio.batSide.description} · Throws: {bio.pitchHand?.description ?? "—"}
                  </span>
                )}
                {bio.currentAge && <span className="text-xs text-muted">Age {bio.currentAge}</span>}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              {isHot && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <TrendingUp size={12} className="text-amber-400" />
                  <span className="text-xs font-bold text-amber-400">Hot 🔥</span>
                </div>
              )}
              {isCold && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-400/10 border border-blue-400/20">
                  <TrendingDown size={12} className="text-blue-400" />
                  <span className="text-xs font-bold text-blue-400">Cold ❄️</span>
                </div>
              )}
              {!isHot && !isCold && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-2 border border-border">
                  <Minus size={12} className="text-muted" />
                  <span className="text-xs text-muted">Neutral</span>
                </div>
              )}
            </div>
          </div>

          {/* Big primary stat with CountingNumber */}
          <div className="mt-3 flex items-end gap-4 flex-wrap">
            {!isPitcher && hitting && (
              <>
                <div>
                  <p className="text-[9px] text-muted uppercase tracking-widest mb-0.5">OPS</p>
                  <p className="text-3xl font-black text-teal tabular-nums leading-none">
                    <CountingNumber value={statAsNumber(hitting.ops)} decimals={3} duration={800} />
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-muted uppercase tracking-widest mb-0.5">HR</p>
                  <p className="text-3xl font-black text-gold tabular-nums leading-none">
                    <CountingNumber value={Number(hitting.homeRuns)} duration={700} />
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-muted uppercase tracking-widest mb-0.5">AVG</p>
                  <p className="text-3xl font-black text-primary tabular-nums leading-none">
                    <CountingNumber value={statAsNumber(hitting.avg)} decimals={3} duration={800} />
                  </p>
                </div>
              </>
            )}
            {isPitcher && pitching && (
              <>
                <div>
                  <p className="text-[9px] text-muted uppercase tracking-widest mb-0.5">ERA</p>
                  <p className="text-3xl font-black text-teal tabular-nums leading-none">
                    <CountingNumber value={statAsNumber(pitching.era)} decimals={2} duration={800} />
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-muted uppercase tracking-widest mb-0.5">K's</p>
                  <p className="text-3xl font-black text-green-400 tabular-nums leading-none">
                    <CountingNumber value={Number(pitching.strikeOuts)} duration={700} />
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-muted uppercase tracking-widest mb-0.5">WHIP</p>
                  <p className="text-3xl font-black text-primary tabular-nums leading-none">
                    <CountingNumber value={statAsNumber(pitching.whip)} decimals={2} duration={800} />
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Outlier callouts */}
      {outlierFacts.length > 0 && (
        <div className="space-y-2">
          {outlierFacts.slice(0, 2).map((f, i) => <OutlierCallout key={i} fact={f} />)}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface rounded-xl w-fit">
        {(["stats", "gamelog", "career"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize",
              activeTab === tab ? "bg-teal text-white" : "text-muted hover:text-primary"
            )}
          >
            {tab === "gamelog" ? "Game Log" : tab}
          </button>
        ))}
      </div>

      {/* STATS TAB */}
      {activeTab === "stats" && (
        <div className="space-y-5 fade-up">
          {/* Stat tiles grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {(tiles as Array<{ label: string; value: string | number | undefined; highlight?: boolean; statKey?: string }>).map((t) => (
              <ClickableStatTile
                key={t.label}
                label={t.label}
                value={t.value}
                statKey={t.statKey}
                highlight={t.highlight}
              />
            ))}
          </div>

          <TridentDivider />

          {/* Advanced metrics */}
          {!isPitcher && hitting && <AdvancedHitterPanel hitting={hitting} />}
          {isPitcher && pitching && <AdvancedPitcherPanel pitching={pitching} />}

          {/* Trend chart */}
          {trendWithRolling.length > 2 && (
            <div className="trident-card p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold text-primary">{isPitcher ? "ERA" : "OPS"} Trend</p>
                <p className="text-xs text-muted">Last 30 games · 7-game rolling avg</p>
              </div>
              <PlayerTrendChart
                data={trendWithRolling}
                statLabel={isPitcher ? "ERA" : "OPS"}
                color={isHot ? "#FFB700" : isCold ? "#60A5FA" : "#00A3A3"}
                seasonAvg={seasonAvg}
                height={200}
              />
            </div>
          )}

          {/* Game log sparklines */}
          {gameLog.length >= 3 && <GameLogSparklines gameLog={gameLog} isPitcher={isPitcher} />}

          {/* Pitch arsenal (pitchers only) */}
          {isPitcher && pitchArsenal.length > 0 && (
            <PitchArsenal pitches={pitchArsenal} pitcherName={bio.fullName} />
          )}
        </div>
      )}

      {/* GAME LOG TAB */}
      {activeTab === "gamelog" && (
        <div className="trident-card overflow-hidden fade-up">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-widest text-muted">
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Opp</th>
                  <th className="p-3 text-right">H/A</th>
                  {isPitcher ? (
                    <>
                      <th className="p-3 text-right">IP</th>
                      <th className="p-3 text-right">H</th>
                      <th className="p-3 text-right">ER</th>
                      <th className="p-3 text-right">K</th>
                      <th className="p-3 text-right">BB</th>
                      <th className="p-3 text-right">ERA</th>
                    </>
                  ) : (
                    <>
                      <th className="p-3 text-right">AB</th>
                      <th className="p-3 text-right">H</th>
                      <th className="p-3 text-right">HR</th>
                      <th className="p-3 text-right">RBI</th>
                      <th className="p-3 text-right">SB</th>
                      <th className="p-3 text-right">OPS</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {gameLog.slice(0, 40).map((g, i) => {
                  const hs = g.stat as MLBHittingStats;
                  const ps = g.stat as MLBPitchingStats;
                  const goodGame = isPitcher
                    ? parseFloat(String(ps.inningsPitched ?? "0")) >= 6 && Number(ps.earnedRuns ?? 99) <= 3
                    : Number(hs.hits ?? 0) >= 2 || Number(hs.homeRuns ?? 0) >= 1;
                  return (
                    <tr key={i} className={cn("border-b border-border/50 hover:bg-surface-2/50 transition-colors", goodGame && "bg-teal/5")}>
                      <td className="p-3 text-muted text-xs">{formatDate(g.date)}</td>
                      <td className="p-3 text-secondary text-xs truncate max-w-[80px]">{g.opponent?.name?.split(" ").pop() ?? "—"}</td>
                      <td className="p-3 text-right">
                        <span className={cn("text-[10px] font-bold", g.isHome ? "text-teal" : "text-muted")}>{g.isHome ? "H" : "A"}</span>
                      </td>
                      {isPitcher ? (
                        <>
                          <td className="p-3 text-right text-primary font-medium tabular-nums">{ps.inningsPitched}</td>
                          <td className="p-3 text-right text-muted tabular-nums">{ps.hits}</td>
                          <td className="p-3 text-right tabular-nums">
                            <span className={Number(ps.earnedRuns ?? 0) === 0 ? "text-green-400 font-bold" : Number(ps.earnedRuns ?? 0) >= 4 ? "text-red-400" : "text-muted"}>
                              {ps.earnedRuns}
                            </span>
                          </td>
                          <td className="p-3 text-right text-primary font-medium tabular-nums">{ps.strikeOuts}</td>
                          <td className="p-3 text-right text-muted tabular-nums">{ps.baseOnBalls}</td>
                          <td className="p-3 text-right text-muted tabular-nums">{ps.era}</td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 text-right text-muted tabular-nums">{hs.atBats}</td>
                          <td className="p-3 text-right font-medium tabular-nums">
                            <span className={Number(hs.hits ?? 0) >= 2 ? "text-teal" : "text-primary"}>{hs.hits}</span>
                          </td>
                          <td className="p-3 text-right tabular-nums">
                            <span className={Number(hs.homeRuns ?? 0) > 0 ? "text-gold font-bold" : "text-muted"}>{hs.homeRuns}</span>
                          </td>
                          <td className="p-3 text-right text-muted tabular-nums">{hs.rbi}</td>
                          <td className="p-3 text-right text-muted tabular-nums">{hs.stolenBases}</td>
                          <td className="p-3 text-right font-medium tabular-nums">
                            <span className={statAsNumber(hs.ops) > 0.9 ? "text-gold font-bold" : "text-primary"}>{hs.ops}</span>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {gameLog.length === 0 && <p className="p-8 text-center text-muted text-sm">No game log available yet.</p>}
        </div>
      )}

      {/* CAREER TAB */}
      {activeTab === "career" && (
        <div className="trident-card overflow-hidden fade-up">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-widest text-muted">
                  <th className="p-3 text-left">Season</th>
                  <th className="p-3 text-left">Team</th>
                  {isPitcher ? (
                    <>
                      <th className="p-3 text-right">W</th><th className="p-3 text-right">L</th>
                      <th className="p-3 text-right">ERA</th><th className="p-3 text-right">G</th>
                      <th className="p-3 text-right">IP</th><th className="p-3 text-right">K</th>
                      <th className="p-3 text-right">WHIP</th>
                    </>
                  ) : (
                    <>
                      <th className="p-3 text-right">G</th><th className="p-3 text-right">AB</th>
                      <th className="p-3 text-right">HR</th><th className="p-3 text-right">RBI</th>
                      <th className="p-3 text-right">AVG</th><th className="p-3 text-right">OPS</th>
                      <th className="p-3 text-right">SB</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {career.map((c, i) => {
                  const hs = c.stat as MLBHittingStats;
                  const ps = c.stat as MLBPitchingStats;
                  const isCurrent = c.season === String(SEASON);
                  return (
                    <tr key={i} className={cn("border-b border-border/50 hover:bg-surface-2/50 transition-colors", isCurrent && "bg-teal/5")}>
                      <td className="p-3 font-bold text-primary">{c.season}{isCurrent && <span className="ml-1 text-[9px] text-teal">★</span>}</td>
                      <td className="p-3 text-muted text-xs">{c.team?.name?.split(" ").pop() ?? "SEA"}</td>
                      {isPitcher ? (
                        <>
                          <td className="p-3 text-right text-win font-medium tabular-nums">{ps.wins}</td>
                          <td className="p-3 text-right text-loss font-medium tabular-nums">{ps.losses}</td>
                          <td className="p-3 text-right font-bold tabular-nums">{ps.era}</td>
                          <td className="p-3 text-right text-muted tabular-nums">{ps.gamesPitched}</td>
                          <td className="p-3 text-right text-muted tabular-nums">{ps.inningsPitched}</td>
                          <td className="p-3 text-right text-primary tabular-nums">{ps.strikeOuts}</td>
                          <td className="p-3 text-right text-muted tabular-nums">{ps.whip}</td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 text-right text-muted tabular-nums">{hs.gamesPlayed}</td>
                          <td className="p-3 text-right text-muted tabular-nums">{hs.atBats}</td>
                          <td className="p-3 text-right text-primary font-medium tabular-nums">{hs.homeRuns}</td>
                          <td className="p-3 text-right text-muted tabular-nums">{hs.rbi}</td>
                          <td className="p-3 text-right font-bold tabular-nums">{hs.avg}</td>
                          <td className="p-3 text-right font-bold tabular-nums">{hs.ops}</td>
                          <td className="p-3 text-right text-muted tabular-nums">{hs.stolenBases}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {career.length === 0 && <p className="p-8 text-center text-muted text-sm">No career stats available.</p>}
        </div>
      )}
    </div>
  );
}
