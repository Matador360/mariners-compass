"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PlayerTrendChart } from "@/components/charts/player-trend-chart";
import { TridentDivider } from "@/components/trident-logo";
import { Skeleton } from "@/components/skeleton-loader";
import {
  cn,
  playerHeadshotUrl,
  positionColor,
  statAsNumber,
  rollingAverage,
  getStatDecoration,
  formatDate,
} from "@/lib/utils";
import type { MLBPerson, MLBHittingStats, MLBPitchingStats } from "@/types/mlb";

const SEASON = new Date().getFullYear();
const BASE = "https://statsapi.mlb.com/api/v1";

interface PlayerPageData {
  bio: MLBPerson | null;
  hitting: MLBHittingStats | null;
  pitching: MLBPitchingStats | null;
  career: Array<{ season: string; stat: MLBHittingStats | MLBPitchingStats }>;
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
    bio: null,
    hitting: null,
    pitching: null,
    career: [],
    gameLog: [],
    isPitcher: false,
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
          fetch(`${BASE}/people/${id}/stats?stats=gameLog&group=${group}&season=${SEASON}`).then((r) => r.json()),
        ]);

        const seasonStats = seasonRes.status === "fulfilled"
          ? seasonRes.value?.stats?.[0]?.splits?.[0]?.stat ?? null
          : null;
        const career = careerRes.status === "fulfilled"
          ? careerRes.value?.stats?.[0]?.splits ?? []
          : [];
        const gameLog = logRes.status === "fulfilled"
          ? logRes.value?.stats?.[0]?.splits?.reverse() ?? []
          : [];

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

function StatTile({
  label,
  value,
  percentileLabel,
  glow,
  badge,
}: {
  label: string;
  value: string | number | undefined;
  percentileLabel?: string;
  glow?: string;
  badge?: string;
}) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-xl bg-surface-2/60 border border-border">
      <p className="text-[9px] uppercase tracking-widest text-muted font-semibold">{label}</p>
      <p className={cn("text-xl font-black stat-number", glow)}>{value ?? "—"}</p>
      {percentileLabel && (
        <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border w-fit font-medium", badge)}>
          {percentileLabel}
        </span>
      )}
    </div>
  );
}

export default function PlayerPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data, loading } = usePlayer(id ?? "");
  const [activeTab, setActiveTab] = useState<"stats" | "gamelog" | "career">("stats");

  const { bio, hitting, pitching, career, gameLog, isPitcher } = data;

  // Build trend chart data from game log
  const trendData = gameLog.slice(0, 30).reverse().map((g, i) => {
    const stat = g.stat as MLBHittingStats;
    const v = isPitcher
      ? statAsNumber((g.stat as MLBPitchingStats).era)
      : statAsNumber(stat.ops);
    return { date: formatDate(g.date, { month: "numeric", day: "numeric" }), value: v };
  });

  const trendValues = trendData.map((d) => d.value);
  const rolling = rollingAverage(trendValues, 7);
  const trendWithRolling = trendData.map((d, i) => ({
    ...d,
    rolling: Math.round(rolling[i] * 1000) / 1000,
  }));

  // Hot/cold vs season
  const seasonAvg = isPitcher
    ? statAsNumber((pitching as MLBPitchingStats | null)?.era)
    : statAsNumber((hitting as MLBHittingStats | null)?.ops);
  const last7Avg = trendValues.slice(-7).reduce((s, v) => s + v, 0) / Math.max(1, Math.min(7, trendValues.length));
  const hotColdRatio = seasonAvg > 0 ? last7Avg / seasonAvg : 1;
  const isHot = isPitcher ? hotColdRatio < 0.85 : hotColdRatio > 1.15;
  const isCold = isPitcher ? hotColdRatio > 1.15 : hotColdRatio < 0.85;

  // Outlier callout: find the stat that's the most extreme vs league norm
  function buildOutlierCallout(): { stat: string; value: string; context: string } | null {
    if (!hitting && !pitching) return null;
    if (!isPitcher && hitting) {
      if (statAsNumber(hitting.ops) > 0.9) return { stat: "OPS", value: hitting.ops, context: "elite offensive production" };
      if (hitting.homeRuns > 15) return { stat: "HR", value: String(hitting.homeRuns), context: "power threat in the lineup" };
      if (hitting.stolenBases > 10) return { stat: "SB", value: String(hitting.stolenBases), context: "elite baserunning speed" };
    }
    if (isPitcher && pitching) {
      if (statAsNumber(pitching.era) < 3.0) return { stat: "ERA", value: pitching.era, context: "ace-level run prevention" };
      if (statAsNumber(pitching.strikeoutsPer9Inn) > 10) return { stat: "K/9", value: pitching.strikeoutsPer9Inn, context: "elite strikeout rate" };
    }
    return null;
  }
  const outlier = buildOutlierCallout();

  const posColor = positionColor(bio?.primaryPosition?.abbreviation ?? "");

  const hittingTiles = hitting
    ? [
        { label: "AVG", value: hitting.avg },
        { label: "OBP", value: hitting.obp },
        { label: "SLG", value: hitting.slg },
        { label: "OPS", value: hitting.ops },
        { label: "HR", value: hitting.homeRuns },
        { label: "RBI", value: hitting.rbi },
        { label: "SB", value: hitting.stolenBases },
        { label: "K", value: hitting.strikeOuts },
        { label: "BB", value: hitting.baseOnBalls },
        { label: "G", value: hitting.gamesPlayed },
        { label: "AB", value: hitting.atBats },
        { label: "H", value: hitting.hits },
      ]
    : [];

  const pitchingTiles = pitching
    ? [
        { label: "ERA", value: pitching.era },
        { label: "WHIP", value: pitching.whip },
        { label: "K/9", value: pitching.strikeoutsPer9Inn },
        { label: "BB/9", value: pitching.walksPer9Inn },
        { label: "K", value: pitching.strikeOuts },
        { label: "W", value: pitching.wins },
        { label: "L", value: pitching.losses },
        { label: "SV", value: pitching.saves },
        { label: "GS", value: pitching.gamesStarted },
        { label: "G", value: pitching.gamesPitched },
        { label: "IP", value: pitching.inningsPitched },
        { label: "QS", value: pitching.completeGames },
      ]
    : [];

  const tiles = isPitcher ? pitchingTiles : hittingTiles;

  if (loading) {
    return (
      <div className="space-y-6">
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
      <div className="trident-card p-10 text-center">
        <p className="text-muted">Player not found.</p>
        <Link href="/roster" className="text-teal text-sm mt-2 inline-block hover:underline">
          ← Back to Roster
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back */}
      <Link
        href="/roster"
        className="flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        Roster
      </Link>

      {/* Hero */}
      <div className="trident-card p-5 sm:p-6 flex items-start gap-5 fade-up">
        {/* Headshot */}
        <div className="shrink-0">
          <div
            className="w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 bg-surface-2"
            style={{ borderColor: posColor }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={playerHeadshotUrl(bio.id)}
              alt={bio.fullName}
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                const t = e.target as HTMLImageElement;
                t.style.display = "none";
                const p = t.parentElement;
                if (p) {
                  p.innerHTML = `<div class="w-full h-full flex items-center justify-center text-3xl font-black text-muted">${bio.firstName?.[0] ?? "?"}${bio.lastName?.[0] ?? ""}</div>`;
                }
              }}
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h1 className="text-xl sm:text-3xl font-black text-primary leading-tight">
                {bio.fullName}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded uppercase text-white tracking-wide"
                  style={{ background: posColor }}
                >
                  {bio.primaryPosition?.abbreviation} · #{bio.primaryNumber ?? "—"}
                </span>
                {bio.batSide && (
                  <span className="text-xs text-muted">
                    Bats: {bio.batSide.description} · Throws: {bio.pitchHand?.description ?? "—"}
                  </span>
                )}
                {bio.currentAge && (
                  <span className="text-xs text-muted">Age {bio.currentAge}</span>
                )}
              </div>
            </div>

            {/* Hot/cold indicator */}
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

          {/* Outlier callout */}
          {outlier && (
            <div className="mt-3 p-3 rounded-lg bg-gold/5 border border-gold/20">
              <p className="text-xs text-secondary">
                <span className="font-bold text-gold">{outlier.stat}: {outlier.value}</span>
                {" "}— {outlier.context}
                {" "}<span className="text-muted">📊</span>
              </p>
            </div>
          )}
        </div>
      </div>

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

      {/* Stats tab */}
      {activeTab === "stats" && (
        <div className="space-y-6 fade-up">
          {/* Stat tiles */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {tiles.map(({ label, value }) => (
              <StatTile key={label} label={label} value={value} />
            ))}
          </div>

          <TridentDivider />

          {/* Trend chart */}
          {trendWithRolling.length > 0 && (
            <div className="trident-card p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold text-primary">
                  {isPitcher ? "ERA" : "OPS"} Trend
                </p>
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
        </div>
      )}

      {/* Game log tab */}
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
                      <th className="p-3 text-right">R</th>
                      <th className="p-3 text-right">ER</th>
                      <th className="p-3 text-right">K</th>
                      <th className="p-3 text-right">BB</th>
                    </>
                  ) : (
                    <>
                      <th className="p-3 text-right">AB</th>
                      <th className="p-3 text-right">H</th>
                      <th className="p-3 text-right">HR</th>
                      <th className="p-3 text-right">RBI</th>
                      <th className="p-3 text-right">SB</th>
                      <th className="p-3 text-right">AVG</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {gameLog.slice(0, 30).map((g, i) => {
                  const hs = g.stat as MLBHittingStats;
                  const ps = g.stat as MLBPitchingStats;
                  const goodGame = isPitcher
                    ? statAsNumber(ps.inningsPitched) >= 6 && statAsNumber(ps.earnedRuns) <= 3
                    : statAsNumber(hs.avg) >= 0.3 || hs.homeRuns >= 1;
                  return (
                    <tr
                      key={i}
                      className={cn(
                        "border-b border-border/50 hover:bg-surface-2/50 transition-colors",
                        goodGame && "bg-teal/5"
                      )}
                    >
                      <td className="p-3 text-muted text-xs">{formatDate(g.date)}</td>
                      <td className="p-3 text-secondary text-xs">{g.opponent?.name ?? "—"}</td>
                      <td className="p-3 text-right">
                        <span className={cn("text-[10px] font-bold", g.isHome ? "text-teal" : "text-muted")}>
                          {g.isHome ? "H" : "A"}
                        </span>
                      </td>
                      {isPitcher ? (
                        <>
                          <td className="p-3 text-right text-primary font-medium tabular-nums">{ps.inningsPitched}</td>
                          <td className="p-3 text-right text-muted tabular-nums">{ps.hits}</td>
                          <td className="p-3 text-right text-muted tabular-nums">{ps.runs}</td>
                          <td className="p-3 text-right text-muted tabular-nums">{ps.earnedRuns}</td>
                          <td className="p-3 text-right text-primary font-medium tabular-nums">{ps.strikeOuts}</td>
                          <td className="p-3 text-right text-muted tabular-nums">{ps.baseOnBalls}</td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 text-right text-muted tabular-nums">{hs.atBats}</td>
                          <td className="p-3 text-right text-primary font-medium tabular-nums">{hs.hits}</td>
                          <td className="p-3 text-right tabular-nums">
                            <span className={hs.homeRuns > 0 ? "text-gold font-bold" : "text-muted"}>
                              {hs.homeRuns}
                            </span>
                          </td>
                          <td className="p-3 text-right text-muted tabular-nums">{hs.rbi}</td>
                          <td className="p-3 text-right text-muted tabular-nums">{hs.stolenBases}</td>
                          <td className="p-3 text-right text-primary font-medium tabular-nums">{hs.avg}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {gameLog.length === 0 && (
            <p className="p-8 text-center text-muted text-sm">No game log available yet.</p>
          )}
        </div>
      )}

      {/* Career tab */}
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
                      <th className="p-3 text-right">W</th>
                      <th className="p-3 text-right">L</th>
                      <th className="p-3 text-right">ERA</th>
                      <th className="p-3 text-right">G</th>
                      <th className="p-3 text-right">IP</th>
                      <th className="p-3 text-right">K</th>
                      <th className="p-3 text-right">WHIP</th>
                    </>
                  ) : (
                    <>
                      <th className="p-3 text-right">G</th>
                      <th className="p-3 text-right">AB</th>
                      <th className="p-3 text-right">H</th>
                      <th className="p-3 text-right">HR</th>
                      <th className="p-3 text-right">RBI</th>
                      <th className="p-3 text-right">AVG</th>
                      <th className="p-3 text-right">OPS</th>
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
                    <tr
                      key={i}
                      className={cn(
                        "border-b border-border/50 hover:bg-surface-2/50 transition-colors",
                        isCurrent && "bg-teal/5"
                      )}
                    >
                      <td className="p-3 font-bold text-primary">{c.season}</td>
                      <td className="p-3 text-muted text-xs">SEA</td>
                      {isPitcher ? (
                        <>
                          <td className="p-3 text-right text-win font-medium tabular-nums">{ps.wins}</td>
                          <td className="p-3 text-right text-loss font-medium tabular-nums">{ps.losses}</td>
                          <td className="p-3 text-right text-primary font-bold tabular-nums">{ps.era}</td>
                          <td className="p-3 text-right text-muted tabular-nums">{ps.gamesPitched}</td>
                          <td className="p-3 text-right text-muted tabular-nums">{ps.inningsPitched}</td>
                          <td className="p-3 text-right text-primary tabular-nums">{ps.strikeOuts}</td>
                          <td className="p-3 text-right text-muted tabular-nums">{ps.whip}</td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 text-right text-muted tabular-nums">{hs.gamesPlayed}</td>
                          <td className="p-3 text-right text-muted tabular-nums">{hs.atBats}</td>
                          <td className="p-3 text-right text-muted tabular-nums">{hs.hits}</td>
                          <td className="p-3 text-right text-primary font-medium tabular-nums">{hs.homeRuns}</td>
                          <td className="p-3 text-right text-muted tabular-nums">{hs.rbi}</td>
                          <td className="p-3 text-right text-primary font-bold tabular-nums">{hs.avg}</td>
                          <td className="p-3 text-right text-primary font-bold tabular-nums">{hs.ops}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {career.length === 0 && (
            <p className="p-8 text-center text-muted text-sm">No career stats available.</p>
          )}
        </div>
      )}
    </div>
  );
}
