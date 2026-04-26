"use client";

import { useEffect, useState } from "react";
import { TeamStatsChart } from "@/components/charts/team-stats-chart";
import { TridentDivider } from "@/components/trident-logo";
import { ChartSkeleton } from "@/components/skeleton-loader";
import { cn, statAsNumber, calculatePercentile, getStatDecoration, ordinal } from "@/lib/utils";
import type { MLBHittingStats, MLBPitchingStats, MLBTeamStatsEntry } from "@/types/mlb";
import { StatClickable } from "@/components/stat-explainer";

const TEAM_ID = 136;
const SEASON = new Date().getFullYear();

interface ChartDataPoint {
  date: string;
  runs: number;
  runsAllowed: number;
  diff: number;
  gameNum: number;
}

interface TeamPageData {
  hitting: MLBHittingStats | null;
  pitching: MLBPitchingStats | null;
  leagueHitting: MLBTeamStatsEntry[];
  leaguePitching: MLBTeamStatsEntry[];
  runDiffByGame: ChartDataPoint[];
}

function useTeamStats() {
  const [data, setData] = useState<TeamPageData>({
    hitting: null,
    pitching: null,
    leagueHitting: [],
    leaguePitching: [],
    runDiffByGame: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = "https://statsapi.mlb.com/api/v1";
    Promise.allSettled([
      fetch(`${base}/teams/${TEAM_ID}/stats?season=${SEASON}&group=hitting&stats=season&sportId=1`).then((r) => r.json()),
      fetch(`${base}/teams/${TEAM_ID}/stats?season=${SEASON}&group=pitching&stats=season&sportId=1`).then((r) => r.json()),
      fetch(`${base}/teams/stats?sportId=1&season=${SEASON}&group=hitting&stats=season`).then((r) => r.json()),
      fetch(`${base}/teams/stats?sportId=1&season=${SEASON}&group=pitching&stats=season`).then((r) => r.json()),
      fetch(`${base}/schedule?teamId=${TEAM_ID}&sportId=1&season=${SEASON}&hydrate=linescore`).then((r) => r.json()),
    ]).then(([hit, pitch, lHit, lPitch, sched]) => {
      const hitting = hit.status === "fulfilled" ? hit.value?.stats?.[0]?.splits?.[0]?.stat ?? null : null;
      const pitching = pitch.status === "fulfilled" ? pitch.value?.stats?.[0]?.splits?.[0]?.stat ?? null : null;
      const leagueHitting = lHit.status === "fulfilled" ? lHit.value?.stats?.[0]?.splits ?? [] : [];
      const leaguePitching = lPitch.status === "fulfilled" ? lPitch.value?.stats?.[0]?.splits ?? [] : [];

      // Build cumulative run differential
      let cumulativeDiff = 0;
      const runDiffByGame: ChartDataPoint[] = [];
      if (sched.status === "fulfilled") {
        const games = (sched.value?.dates ?? []).flatMap((d: { games: unknown[] }) => d.games ?? []) as Array<{
          status: { abstractGameState: string };
          gameDate: string;
          teams: { home: { team: { id: number }; score?: number }; away: { team: { id: number }; score?: number } };
        }>;
        const finished = games
          .filter((g) => g.status.abstractGameState === "Final")
          .sort((a, b) => a.gameDate.localeCompare(b.gameDate));

        finished.forEach((g, i) => {
          const isHome = g.teams.home.team.id === TEAM_ID;
          const us = isHome ? g.teams.home : g.teams.away;
          const them = isHome ? g.teams.away : g.teams.home;
          const runs = us.score ?? 0;
          const allowed = them.score ?? 0;
          cumulativeDiff += runs - allowed;
          runDiffByGame.push({
            date: g.gameDate.split("T")[0],
            runs,
            runsAllowed: allowed,
            diff: cumulativeDiff,
            gameNum: i + 1,
          });
        });
      }

      setData({ hitting, pitching, leagueHitting, leaguePitching, runDiffByGame });
      setLoading(false);
    });
  }, []);

  return { data, loading };
}

function percentileFor(
  value: string | number | undefined,
  entries: MLBTeamStatsEntry[],
  key: string,
  higherIsBetter = true
): number {
  const v = statAsNumber(value as string);
  const all = entries
    .map((e) => statAsNumber((e.stat as unknown as Record<string, unknown>)[key] as string))
    .filter((n) => n > 0);
  return calculatePercentile(v, all, higherIsBetter);
}

interface StatTileProps {
  label: string;
  value: string | number | undefined;
  percentile?: number;
  flip?: boolean;
}

function StatTile({ label, value, percentile, flip = false }: StatTileProps) {
  const deco = percentile !== undefined ? getStatDecoration(flip ? 100 - percentile : percentile) : null;
  return (
    <div className={cn("trident-card p-4 flex flex-col gap-1.5", deco?.glow && "border-gold/20")}>
      <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className={cn("text-2xl font-black stat-number", deco?.glow)}>{value ?? "—"}</span>
        {deco?.emoji && <span className="text-base">{deco.emoji}</span>}
      </div>
      {percentile !== undefined && (
        <span className={cn("text-[10px] px-2 py-0.5 rounded-full border w-fit font-medium", deco?.badge)}>
          {ordinal(flip ? 100 - percentile : percentile)} %ile in MLB
        </span>
      )}
    </div>
  );
}

const SPLITS = [
  { key: "home", label: "Home" },
  { key: "away", label: "Away" },
  { key: "day", label: "Day games" },
  { key: "night", label: "Night games" },
  { key: "vsLeft", label: "vs LHP" },
  { key: "vsRight", label: "vs RHP" },
];

export default function StatsPage() {
  const { data, loading } = useTeamStats();
  const [activeTab, setActiveTab] = useState<"hitting" | "pitching" | "runDiff">("hitting");
  const { hitting, pitching, leagueHitting, leaguePitching, runDiffByGame } = data;

  const hittingTiles = hitting
    ? [
        { label: "Team AVG", value: hitting.avg, p: percentileFor(hitting.avg, leagueHitting, "avg"), statKey: "AVG" },
        { label: "OBP", value: hitting.obp, p: percentileFor(hitting.obp, leagueHitting, "obp"), statKey: "OBP" },
        { label: "SLG", value: hitting.slg, p: percentileFor(hitting.slg, leagueHitting, "slg"), statKey: "SLG" },
        { label: "OPS", value: hitting.ops, p: percentileFor(hitting.ops, leagueHitting, "ops"), statKey: "OPS" },
        { label: "Home Runs", value: hitting.homeRuns, p: percentileFor(hitting.homeRuns, leagueHitting, "homeRuns"), statKey: "HR" },
        { label: "RBI", value: hitting.rbi, p: percentileFor(hitting.rbi, leagueHitting, "rbi"), statKey: "RBI" },
        { label: "Stolen Bases", value: hitting.stolenBases, p: percentileFor(hitting.stolenBases, leagueHitting, "stolenBases"), statKey: "SB" },
        { label: "Runs Scored", value: hitting.runs, p: percentileFor(hitting.runs, leagueHitting, "runs"), statKey: "" },
        { label: "Strikeouts", value: hitting.strikeOuts, p: percentileFor(hitting.strikeOuts, leagueHitting, "strikeOuts"), flip: true, statKey: "K" },
        { label: "Walks", value: hitting.baseOnBalls, p: percentileFor(hitting.baseOnBalls, leagueHitting, "baseOnBalls"), statKey: "BB" },
      ]
    : [];

  const pitchingTiles = pitching
    ? [
        { label: "ERA", value: pitching.era, p: percentileFor(pitching.era, leaguePitching, "era"), flip: true, statKey: "ERA" },
        { label: "WHIP", value: pitching.whip, p: percentileFor(pitching.whip, leaguePitching, "whip"), flip: true, statKey: "WHIP" },
        { label: "K/9", value: pitching.strikeoutsPer9Inn, p: percentileFor(pitching.strikeoutsPer9Inn, leaguePitching, "strikeoutsPer9Inn"), statKey: "K/9" },
        { label: "BB/9", value: pitching.walksPer9Inn, p: percentileFor(pitching.walksPer9Inn, leaguePitching, "walksPer9Inn"), flip: true, statKey: "BB/9" },
        { label: "Strikeouts", value: pitching.strikeOuts, p: percentileFor(pitching.strikeOuts, leaguePitching, "strikeOuts"), statKey: "K" },
        { label: "Wins", value: pitching.wins, p: percentileFor(pitching.wins, leaguePitching, "wins"), statKey: "WINS" },
        { label: "Saves", value: pitching.saves, p: percentileFor(pitching.saves, leaguePitching, "saves"), statKey: "SAVES" },
        { label: "Innings", value: pitching.inningsPitched, p: undefined, statKey: "IP" },
      ]
    : [];

  // Build chart data — run diff cumulative
  const runDiffChartData = runDiffByGame.slice(-40).map((d) => ({
    date: `G${d.gameNum}`,
    mariners: d.diff,
    runs: d.runs,
    runsAllowed: d.runsAllowed,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-black text-primary tracking-tight">Team Stats</h1>
        <p className="text-sm text-muted">{SEASON} Season</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface rounded-xl w-fit">
        {(["hitting", "pitching", "runDiff"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
              activeTab === tab
                ? "bg-teal text-white"
                : "text-muted hover:text-primary"
            )}
          >
            {tab === "hitting" ? "Hitting" : tab === "pitching" ? "Pitching" : "Run Diff"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="trident-card p-4 h-24 skeleton-shimmer" />
            ))}
          </div>
          <ChartSkeleton height={240} />
        </div>
      ) : (
        <>
          {/* Hitting tab */}
          {activeTab === "hitting" && (
            <div className="space-y-6 fade-up">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {hittingTiles.map((t) => (
                  <StatClickable key={t.label} statKey={t.statKey ?? t.label} value={t.value ?? "—"}>
                    <StatTile label={t.label} value={t.value} percentile={t.p} flip={t.flip} />
                  </StatClickable>
                ))}
              </div>

              {runDiffByGame.length > 0 && (
                <div className="trident-card p-5">
                  <p className="text-sm font-bold text-primary mb-1">
                    Runs Scored vs Allowed — Last 40 Games
                  </p>
                  <p className="text-xs text-muted mb-4">Per-game bar view</p>
                  <TeamStatsChart
                    data={runDiffChartData.map((d) => ({
                      date: d.date,
                      mariners: d.runs,
                      alAvg: d.runsAllowed,
                    }))}
                    dataKey="mariners"
                    label="Runs Scored"
                    color="#00A3A3"
                    comparisonKey="alAvg"
                    comparisonLabel="Runs Allowed"
                    height={220}
                  />
                </div>
              )}
            </div>
          )}

          {/* Pitching tab */}
          {activeTab === "pitching" && (
            <div className="space-y-6 fade-up">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {pitchingTiles.map((t) => (
                  <StatClickable key={t.label} statKey={t.statKey ?? t.label} value={t.value ?? "—"}>
                    <StatTile label={t.label} value={t.value} percentile={t.p} flip={t.flip} />
                  </StatClickable>
                ))}
              </div>
            </div>
          )}

          {/* Run differential chart */}
          {activeTab === "runDiff" && (
            <div className="space-y-4 fade-up">
              {runDiffByGame.length > 0 ? (
                <>
                  <div className="trident-card p-5">
                    <p className="text-sm font-bold text-primary mb-1">
                      Cumulative Run Differential
                    </p>
                    <p className="text-xs text-muted mb-4">
                      Rising = outscoring opponents over time. Flat or falling = trouble.
                    </p>
                    <TeamStatsChart
                      data={runDiffChartData.map((d) => ({
                        date: d.date,
                        mariners: d.mariners,
                      }))}
                      dataKey="mariners"
                      label="Run Diff"
                      color={runDiffByGame[runDiffByGame.length - 1]?.diff >= 0 ? "#22C55E" : "#EF4444"}
                      referenceValue={0}
                      referenceLabel=".500 pace"
                      height={280}
                    />
                  </div>

                  {/* Summary stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      {
                        label: "Total Run Diff",
                        value: `${runDiffByGame[runDiffByGame.length - 1]?.diff >= 0 ? "+" : ""}${runDiffByGame[runDiffByGame.length - 1]?.diff ?? 0}`,
                      },
                      {
                        label: "Games Played",
                        value: runDiffByGame.length,
                      },
                      {
                        label: "Avg Runs/Game",
                        value: runDiffByGame.length
                          ? (runDiffByGame.reduce((s, d) => s + d.runs, 0) / runDiffByGame.length).toFixed(2)
                          : "—",
                      },
                      {
                        label: "Avg Allowed/Game",
                        value: runDiffByGame.length
                          ? (runDiffByGame.reduce((s, d) => s + d.runsAllowed, 0) / runDiffByGame.length).toFixed(2)
                          : "—",
                      },
                    ].map(({ label, value }) => (
                      <div key={label} className="trident-card p-4">
                        <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-1">{label}</p>
                        <p className="text-2xl font-black stat-number text-primary">{value}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="trident-card p-10 text-center text-muted">
                  No game data available yet for this season.
                </div>
              )}
            </div>
          )}
        </>
      )}

      <TridentDivider />

      {/* League context note */}
      <p className="text-[11px] text-muted text-center">
        Percentiles calculated against all 30 MLB teams · {SEASON} regular season
      </p>
    </div>
  );
}
