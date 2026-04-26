import type { Metadata } from "next";
import { Suspense } from "react";
import {
  fetchTodayGame,
  fetchNextGame,
  fetchSchedule,
  fetchALWestStandings,
  fetchTeamHittingStats,
  fetchTeamPitchingStats,
  computeMarinersMood,
} from "@/lib/mlb-api";
import { getStatOfDay } from "@/lib/utils";
import { GameCard } from "@/components/game-card";
import { MoodIndicator } from "@/components/mood-indicator";
import { Last10Strip } from "@/components/last10-strip";
import { StandingsWidget } from "@/components/standings-widget";
import { StatOfDay } from "@/components/stat-of-day";
import { TridentDivider } from "@/components/trident-logo";
import { GameCardSkeleton, StatsRowSkeleton } from "@/components/skeleton-loader";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const revalidate = 30;

async function HeroGameSection() {
  const [today, next, schedule, hitting, pitching] = await Promise.allSettled([
    fetchTodayGame(),
    fetchNextGame(),
    fetchSchedule(),
    fetchTeamHittingStats(),
    fetchTeamPitchingStats(),
  ]);

  const todayGame = today.status === "fulfilled" ? today.value : null;
  const nextGame = next.status === "fulfilled" ? next.value : null;
  const games = schedule.status === "fulfilled" ? schedule.value : [];
  const hittingStats = hitting.status === "fulfilled" ? hitting.value : null;
  const pitchingStats = pitching.status === "fulfilled" ? pitching.value : null;

  const displayGame = todayGame ?? nextGame;
  const mood = await computeMarinersMood(games);

  // Last game hero stat
  const finishedGames = games
    .filter((g) => g.status.abstractGameState === "Final")
    .sort((a, b) => b.gameDate.localeCompare(a.gameDate));
  const lastGame = finishedGames[0];
  const isLastGameWin =
    lastGame &&
    (lastGame.teams.home.team.id === 136
      ? lastGame.teams.home.isWinner
      : lastGame.teams.away.isWinner);

  const statOfDay = getStatOfDay(hittingStats, pitchingStats);

  const [standings] = await Promise.allSettled([fetchALWestStandings()]);
  const division = standings.status === "fulfilled" ? standings.value : null;
  const marinersRecord = division?.teamRecords.find((t) => t.team.id === 136);

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-primary tracking-tight leading-none">
            Seattle Mariners
          </h1>
          <p className="text-sm text-secondary mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
              timeZone: "America/Los_Angeles",
            })}
            {marinersRecord && (
              <span className="ml-3 font-bold text-teal">
                {marinersRecord.wins}–{marinersRecord.losses}
              </span>
            )}
          </p>
        </div>
        {mood.emoji && (
          <span className="text-4xl mood-emoji hidden sm:block" title={mood.label}>
            {mood.emoji}
          </span>
        )}
      </div>

      {/* Live/Next game hero */}
      {displayGame ? (
        <GameCard game={displayGame} />
      ) : (
        <div className="trident-card p-8 text-center text-muted">
          <p className="text-lg font-bold">No game scheduled today</p>
          <p className="text-sm mt-1">Check the schedule for upcoming games</p>
        </div>
      )}

      {/* Last game hero stat */}
      {lastGame && (
        <div
          className="trident-card p-5 relative overflow-hidden"
          aria-label="Last game result"
        >
          <div
            className={`absolute inset-0 opacity-5 ${isLastGameWin ? "bg-win" : "bg-loss"}`}
          />
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-1">
                Last Game
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                    isLastGameWin
                      ? "bg-win/20 text-win"
                      : "bg-loss/20 text-loss"
                  }`}
                >
                  {isLastGameWin ? "Win" : "Loss"}
                </span>
                <span className="text-secondary text-sm">
                  vs{" "}
                  {lastGame.teams.home.team.id === 136
                    ? lastGame.teams.away.team.name
                    : lastGame.teams.home.team.name}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="display-stat text-primary stat-number">
                {lastGame.teams.home.team.id === 136
                  ? lastGame.teams.home.score
                  : lastGame.teams.away.score}
                <span className="text-muted/50 mx-2 font-light">–</span>
                {lastGame.teams.home.team.id === 136
                  ? lastGame.teams.away.score
                  : lastGame.teams.home.score}
              </p>
              <p className="text-[10px] text-muted mt-1">Final score</p>
            </div>
          </div>
        </div>
      )}

      <TridentDivider className="my-6" />

      {/* 3-up widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MoodIndicator mood={mood} className="sm:col-span-2 lg:col-span-1 fade-up fade-up-delay-1" />
        <Last10Strip games={games} className="sm:col-span-2 lg:col-span-1 fade-up fade-up-delay-2" />
        {division && (
          <StandingsWidget
            division={division}
            className="sm:col-span-2 lg:col-span-1 fade-up fade-up-delay-3"
          />
        )}
      </div>

      <TridentDivider className="my-6" />

      {/* Stat of the day */}
      <StatOfDay
        title={statOfDay.title}
        value={statOfDay.value}
        context={statOfDay.context}
        emoji={statOfDay.emoji}
        className="fade-up fade-up-delay-4"
      />

      {/* Team quick stats */}
      {(hittingStats || pitchingStats) && (
        <div className="trident-card p-5">
          <p className="text-[10px] uppercase tracking-widest text-muted mb-4 font-semibold">
            {new Date().getFullYear()} Season Stats
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {hittingStats && (
              <>
                {[
                  { v: hittingStats.avg, l: "AVG" },
                  { v: hittingStats.obp, l: "OBP" },
                  { v: hittingStats.slg, l: "SLG" },
                  { v: hittingStats.ops, l: "OPS" },
                  { v: hittingStats.homeRuns, l: "HR" },
                  { v: hittingStats.rbi, l: "RBI" },
                  { v: hittingStats.stolenBases, l: "SB" },
                  { v: hittingStats.runs, l: "R" },
                ].map(({ v, l }) => (
                  <div key={l} className="flex flex-col items-center gap-0.5">
                    <span className="text-lg font-black stat-number tabular-nums text-primary">
                      {v}
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-muted font-semibold">
                      {l}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
          {pitchingStats && (
            <>
              <div className="h-px bg-border my-4" />
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                {[
                  { v: pitchingStats.era, l: "ERA" },
                  { v: pitchingStats.whip, l: "WHIP" },
                  { v: pitchingStats.strikeOuts, l: "K" },
                  { v: pitchingStats.strikeoutsPer9Inn, l: "K/9" },
                  { v: pitchingStats.wins, l: "W" },
                  { v: pitchingStats.losses, l: "L" },
                  { v: pitchingStats.saves, l: "SV" },
                  { v: pitchingStats.earnedRuns, l: "ER" },
                ].map(({ v, l }) => (
                  <div key={l} className="flex flex-col items-center gap-0.5">
                    <span className="text-lg font-black stat-number tabular-nums text-primary">
                      {v}
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-muted font-semibold">
                      {l}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HeroGameSection />
    </Suspense>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 skeleton-shimmer rounded-lg" />
      <GameCardSkeleton />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="trident-card p-5 h-36 skeleton-shimmer" />
        <div className="trident-card p-5 h-36 skeleton-shimmer" />
        <div className="trident-card p-5 h-36 skeleton-shimmer" />
      </div>
      <StatsRowSkeleton />
    </div>
  );
}
