"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, List, Grid3X3 } from "lucide-react";
import { cn, formatDate, formatGameTime, teamLogoUrl } from "@/lib/utils";
import type { MLBGame } from "@/types/mlb";

const TEAM_ID = 136;

function useSchedule() {
  const [games, setGames] = useState<MLBGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const year = new Date().getFullYear();
    fetch(
      `https://statsapi.mlb.com/api/v1/schedule?teamId=${TEAM_ID}&sportId=1&season=${year}&startDate=${year}-01-01&endDate=${year}-12-31&hydrate=probablePitcher,decisions,linescore,seriesStatus`
    )
      .then((r) => r.json())
      .then((data: { dates: Array<{ games: MLBGame[] }> }) => {
        setGames(data.dates?.flatMap((d) => d.games ?? []) ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { games, loading };
}

export default function SchedulePage() {
  const { games, loading } = useSchedule();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [selectedYear] = useState(() => new Date().getFullYear());
  const [selectedGame, setSelectedGame] = useState<MLBGame | null>(null);

  const gamesByMonth = useMemo(() => {
    return games.filter((g) => {
      const d = new Date(g.gameDate);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [games, selectedMonth, selectedYear]);

  const today = new Date().toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" });

  const monthName = new Date(selectedYear, selectedMonth, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const seasonMonths = [2, 3, 4, 5, 6, 7, 8, 9]; // Mar–Oct

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-black text-primary tracking-tight">Schedule</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("list")}
            className={cn(
              "p-2 rounded-lg border transition-colors",
              view === "list"
                ? "bg-teal/10 border-teal/30 text-teal"
                : "border-border text-muted hover:text-primary"
            )}
            aria-label="List view"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setView("calendar")}
            className={cn(
              "p-2 rounded-lg border transition-colors",
              view === "calendar"
                ? "bg-teal/10 border-teal/30 text-teal"
                : "border-border text-muted hover:text-primary"
            )}
            aria-label="Calendar view"
          >
            <Grid3X3 size={16} />
          </button>
        </div>
      </div>

      {/* Month navigator */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSelectedMonth((m) => Math.max(seasonMonths[0], m - 1))}
          disabled={selectedMonth <= seasonMonths[0]}
          className="p-1.5 rounded-lg border border-border text-muted hover:text-primary disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <h2 className="text-base font-bold text-primary min-w-[140px] text-center">
          {monthName}
        </h2>
        <button
          onClick={() => setSelectedMonth((m) => Math.min(seasonMonths[seasonMonths.length - 1], m + 1))}
          disabled={selectedMonth >= seasonMonths[seasonMonths.length - 1]}
          className="p-1.5 rounded-lg border border-border text-muted hover:text-primary disabled:opacity-30 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
        {/* Month quick-jump */}
        <div className="hidden sm:flex gap-1 ml-2 flex-wrap">
          {seasonMonths.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={cn(
                "text-[11px] px-2 py-1 rounded font-medium transition-colors",
                m === selectedMonth
                  ? "bg-teal text-white"
                  : "text-muted hover:text-primary hover:bg-surface-2"
              )}
            >
              {new Date(selectedYear, m, 1).toLocaleDateString("en-US", { month: "short" })}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <ScheduleSkeleton />
      ) : view === "list" ? (
        <ListView
          games={gamesByMonth}
          today={today}
          onSelect={setSelectedGame}
          selectedGame={selectedGame}
        />
      ) : (
        <CalendarView
          games={gamesByMonth}
          month={selectedMonth}
          year={selectedYear}
          today={today}
          onSelect={setSelectedGame}
          selectedGame={selectedGame}
        />
      )}

      {/* Game detail drawer */}
      {selectedGame && (
        <GameDetailPanel game={selectedGame} onClose={() => setSelectedGame(null)} />
      )}
    </div>
  );
}

function ListView({
  games,
  today,
  onSelect,
  selectedGame,
}: {
  games: MLBGame[];
  today: string;
  onSelect: (g: MLBGame) => void;
  selectedGame: MLBGame | null;
}) {
  if (games.length === 0) {
    return (
      <div className="trident-card p-10 text-center text-muted">
        No games scheduled this month.
      </div>
    );
  }

  // Group by series (consecutive games vs same opponent)
  interface SeriesGroup {
    opponentId: number;
    opponentName: string;
    opponentAbbr: string;
    isHome: boolean;
    games: MLBGame[];
  }

  const sorted = [...games].sort((a, b) => a.gameDate.localeCompare(b.gameDate));
  const seriesList: SeriesGroup[] = [];
  let cur: SeriesGroup | null = null;

  for (const g of sorted) {
    const isHome = g.teams.home.team.id === TEAM_ID;
    const opp = isHome ? g.teams.away : g.teams.home;
    const oppId = opp.team.id;
    if (!cur || cur.opponentId !== oppId || cur.isHome !== isHome) {
      cur = {
        opponentId: oppId,
        opponentName: opp.team.name,
        opponentAbbr: opp.team.abbreviation ?? opp.team.teamName ?? opp.team.name?.split(" ").pop()?.slice(0, 3).toUpperCase() ?? "???",
        isHome,
        games: [],
      };
      seriesList.push(cur);
    }
    cur.games.push(g);
  }

  return (
    <div className="space-y-5">
      {seriesList.map((series, si) => {
        const firstGame = series.games[0];
        const lastGame = series.games[series.games.length - 1];
        const firstDate = new Date(firstGame.gameDate);
        const lastDate = new Date(lastGame.gameDate);
        const finishedGames = series.games.filter((g) => g.status.abstractGameState === "Final");
        const seriesWins = finishedGames.filter((g) => {
          const us = g.teams.home.team.id === TEAM_ID ? g.teams.home : g.teams.away;
          return us.isWinner;
        }).length;
        const seriesLosses = finishedGames.length - seriesWins;
        const remaining = series.games.length - finishedGames.length;

        const startStr = firstDate.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Los_Angeles" });
        const endStr = series.games.length > 1
          ? lastDate.toLocaleDateString("en-US", { day: "numeric", timeZone: "America/Los_Angeles" })
          : null;
        const dateRange = endStr ? `${startStr}–${endStr}` : startStr;

        return (
          <div key={si}>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://www.mlbstatic.com/team-logos/${series.opponentId}.svg`}
                alt={series.opponentName}
                width={18}
                height={18}
                className="w-4.5 h-4.5 object-contain opacity-75"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">
                <span className="text-secondary">{series.isHome ? "vs" : "@"} {series.opponentAbbr}</span>
                <span className="ml-2">· {dateRange} · {series.games.length}G</span>
              </p>
              {finishedGames.length > 0 && (
                <span className={cn(
                  "text-[10px] font-black px-2 py-0.5 rounded-full ml-auto",
                  seriesWins > seriesLosses ? "bg-win/10 text-win" :
                  seriesLosses > seriesWins ? "bg-loss/10 text-loss" :
                  "bg-surface-2 text-muted"
                )}>
                  {seriesWins}–{seriesLosses}
                  {remaining > 0 && <span className="font-normal opacity-60"> ({remaining} left)</span>}
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              {series.games.map((g) => (
                <GameRow
                  key={g.gamePk}
                  game={g}
                  isSelected={selectedGame?.gamePk === g.gamePk}
                  isToday={
                    new Date(g.gameDate).toLocaleDateString("en-US", {
                      timeZone: "America/Los_Angeles",
                    }) === today
                  }
                  onClick={() => onSelect(g)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GameRow({
  game,
  isSelected,
  isToday,
  onClick,
}: {
  game: MLBGame;
  isSelected: boolean;
  isToday: boolean;
  onClick: () => void;
}) {
  const isHome = game.teams.home.team.id === TEAM_ID;
  const us = isHome ? game.teams.home : game.teams.away;
  const them = isHome ? game.teams.away : game.teams.home;
  const state = game.status.abstractGameState;
  const isFinal = state === "Final";
  const isLive = state === "Live";
  const weWon = isFinal && us.isWinner;
  const weLost = isFinal && !us.isWinner;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full trident-card p-3 flex items-center gap-3 text-left transition-all",
        isSelected && "border-teal/40 bg-teal/5",
        isToday && !isSelected && "border-teal/20",
        "hover:border-border-accent"
      )}
    >
      {/* Date */}
      <div className="w-14 shrink-0 text-center">
        <p className="text-[9px] uppercase tracking-widest text-muted">
          {new Date(game.gameDate).toLocaleDateString("en-US", {
            weekday: "short",
            timeZone: "America/Los_Angeles",
          })}
        </p>
        <p className="text-sm font-bold text-primary">
          {new Date(game.gameDate).toLocaleDateString("en-US", {
            month: "numeric",
            day: "numeric",
            timeZone: "America/Los_Angeles",
          })}
        </p>
      </div>

      {/* H/A indicator */}
      <span
        className={cn(
          "text-[9px] font-black uppercase px-1.5 py-0.5 rounded border",
          isHome
            ? "border-teal/30 text-teal bg-teal/5"
            : "border-border text-muted"
        )}
      >
        {isHome ? "HOME" : "AWAY"}
      </span>

      {/* Opponent logo + name */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={teamLogoUrl(them.team.id)}
          alt={them.team.name}
          width={24}
          height={24}
          className="w-6 h-6 object-contain shrink-0 opacity-80"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <span className="text-sm font-medium text-primary truncate">
          vs {them.team.name}
        </span>
      </div>

      {/* Probable pitchers (preview) */}
      {state === "Preview" && game.probablePitchers?.home && (
        <span className="text-xs text-muted hidden sm:block truncate max-w-[120px]">
          {isHome
            ? game.probablePitchers.home?.fullName
            : game.probablePitchers.away?.fullName}
        </span>
      )}

      {/* Score / time */}
      <div className="text-right shrink-0">
        {isFinal ? (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-xs font-black px-2 py-0.5 rounded uppercase",
                weWon ? "bg-win/15 text-win" : "bg-loss/15 text-loss"
              )}
            >
              {weWon ? "W" : "L"}
            </span>
            <span className="text-sm font-bold stat-number">
              {us.score}–{them.score}
            </span>
          </div>
        ) : isLive ? (
          <span className="text-xs font-bold text-teal flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-ping inline-block" />
            Live
          </span>
        ) : (
          <span className="text-xs text-muted">{formatGameTime(game.gameDate)}</span>
        )}
      </div>
    </button>
  );
}

function CalendarView({
  games,
  month,
  year,
  today,
  onSelect,
  selectedGame,
}: {
  games: MLBGame[];
  month: number;
  year: number;
  today: string;
  onSelect: (g: MLBGame) => void;
  selectedGame: MLBGame | null;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = firstDay + daysInMonth;
  const rows = Math.ceil(cells / 7);

  const gameByDay = useMemo(() => {
    const m: Record<number, MLBGame[]> = {};
    for (const g of games) {
      const d = new Date(g.gameDate).getDate();
      (m[d] = m[d] ?? []).push(g);
    }
    return m;
  }, [games]);

  return (
    <div className="trident-card overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="p-2 text-center text-[10px] uppercase tracking-widest text-muted font-semibold"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {Array.from({ length: rows * 7 }).map((_, idx) => {
          const day = idx - firstDay + 1;
          const isValid = day >= 1 && day <= daysInMonth;
          const dayGames = isValid ? (gameByDay[day] ?? []) : [];
          const cellDate = isValid
            ? new Date(year, month, day).toLocaleDateString("en-US", {
                timeZone: "America/Los_Angeles",
              })
            : "";
          const isTodayCell = cellDate === today;

          return (
            <div
              key={idx}
              className={cn(
                "min-h-[72px] sm:min-h-[90px] p-1.5 border-b border-r border-border relative",
                !isValid && "opacity-30 bg-surface/30",
                isTodayCell && "bg-teal/5"
              )}
            >
              {isValid && (
                <>
                  <span
                    className={cn(
                      "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full leading-none",
                      isTodayCell
                        ? "bg-teal text-white"
                        : "text-secondary"
                    )}
                  >
                    {day}
                  </span>
                  <div className="space-y-0.5 mt-1">
                    {dayGames.map((g) => {
                      const isHome = g.teams.home.team.id === TEAM_ID;
                      const us = isHome ? g.teams.home : g.teams.away;
                      const them = isHome ? g.teams.away : g.teams.home;
                      const isFinal = g.status.abstractGameState === "Final";
                      const weWon = isFinal && us.isWinner;
                      const isSelected = selectedGame?.gamePk === g.gamePk;

                      return (
                        <button
                          key={g.gamePk}
                          onClick={() => onSelect(g)}
                          className={cn(
                            "w-full text-left text-[9px] px-1.5 py-0.5 rounded font-medium truncate transition-colors",
                            isSelected && "ring-1 ring-teal",
                            isFinal
                              ? weWon
                                ? "bg-win/15 text-win hover:bg-win/25"
                                : "bg-loss/15 text-loss hover:bg-loss/25"
                              : "bg-teal/10 text-teal hover:bg-teal/20"
                          )}
                        >
                          {isFinal
                            ? `${weWon ? "W" : "L"} ${us.score}–${them.score}`
                            : `@ ${them.team.abbreviation ?? them.team.teamName.slice(0, 3)}`}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GameDetailPanel({
  game,
  onClose,
}: {
  game: MLBGame;
  onClose: () => void;
}) {
  const isHome = game.teams.home.team.id === TEAM_ID;
  const us = isHome ? game.teams.home : game.teams.away;
  const them = isHome ? game.teams.away : game.teams.home;
  const isFinal = game.status.abstractGameState === "Final";
  const isLive = game.status.abstractGameState === "Live";
  const weWon = isFinal && us.isWinner;

  return (
    <div className="fixed bottom-0 left-0 right-0 md:bottom-auto md:right-4 md:top-20 md:left-auto md:w-80 z-40 trident-card border-teal/30 shadow-2xl md:rounded-xl rounded-t-2xl">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <p className="text-sm font-bold text-primary">Game Details</p>
        <button
          onClick={onClose}
          className="text-muted hover:text-primary p-1 rounded hover:bg-surface-2 transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Teams + score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={teamLogoUrl(them.team.id)} alt="" width={32} height={32} className="w-8 h-8 object-contain" />
            <div>
              <p className="text-xs font-bold text-primary">{them.team.name}</p>
              <p className="text-[10px] text-muted">{isHome ? "Away" : "Home"}</p>
            </div>
          </div>
          {isFinal || isLive ? (
            <div className="text-center">
              <p className="text-2xl font-black stat-number">
                {them.score ?? 0}–{us.score ?? 0}
              </p>
              <p className={cn("text-xs font-bold", isFinal ? (weWon ? "text-win" : "text-loss") : "text-teal")}>
                {isLive ? game.linescore?.currentInningOrdinal : weWon ? "Final · W" : "Final · L"}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm font-bold text-primary">{formatGameTime(game.gameDate)}</p>
              <p className="text-[10px] text-muted">PT</p>
            </div>
          )}
          <div className="flex items-center gap-2 flex-row-reverse">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={teamLogoUrl(us.team.id)} alt="" width={32} height={32} className="w-8 h-8 object-contain" />
            <div className="text-right">
              <p className="text-xs font-bold text-teal">{us.team.name}</p>
              <p className="text-[10px] text-muted">{isHome ? "Home" : "Away"}</p>
            </div>
          </div>
        </div>

        {/* Linescore innings */}
        {(isFinal || isLive) && game.linescore?.innings?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] text-center">
              <thead>
                <tr className="text-muted">
                  <td className="p-1 text-left">Team</td>
                  {game.linescore.innings.map((inn) => (
                    <td key={inn.num} className="p-1 w-6">{inn.num}</td>
                  ))}
                  <td className="p-1 font-bold">R</td>
                  <td className="p-1">H</td>
                  <td className="p-1">E</td>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: them.team.abbreviation ?? "AWY", data: game.linescore.innings.map((i) => (isHome ? i.away : i.home)), totals: isHome ? game.linescore.teams.away : game.linescore.teams.home },
                  { label: us.team.abbreviation ?? "SEA", data: game.linescore.innings.map((i) => (isHome ? i.home : i.away)), totals: isHome ? game.linescore.teams.home : game.linescore.teams.away },
                ].map((row) => (
                  <tr key={row.label} className="border-t border-border">
                    <td className="p-1 text-left font-bold text-secondary">{row.label}</td>
                    {row.data.map((cell, i) => (
                      <td key={i} className="p-1 text-muted">
                        {cell?.runs ?? "–"}
                      </td>
                    ))}
                    <td className="p-1 font-bold text-primary">{row.totals?.runs ?? "–"}</td>
                    <td className="p-1 text-muted">{row.totals?.hits ?? "–"}</td>
                    <td className="p-1 text-muted">{row.totals?.errors ?? "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {/* Probable pitchers */}
        {game.status.abstractGameState === "Preview" && game.probablePitchers && (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">Probable Pitchers</p>
            <div className="flex justify-between text-xs">
              <div>
                <p className="text-muted">{game.teams.away.team.abbreviation}</p>
                <p className="text-primary font-medium">{game.probablePitchers.away?.fullName ?? "TBD"}</p>
              </div>
              <div className="text-right">
                <p className="text-muted">{game.teams.home.team.abbreviation}</p>
                <p className="text-primary font-medium">{game.probablePitchers.home?.fullName ?? "TBD"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Decisions */}
        {isFinal && game.decisions && (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">Decisions</p>
            {game.decisions.winner && (
              <p className="text-xs flex justify-between">
                <span className="text-win font-medium">W</span>
                <span className="text-primary">{game.decisions.winner.fullName}</span>
              </p>
            )}
            {game.decisions.loser && (
              <p className="text-xs flex justify-between">
                <span className="text-loss font-medium">L</span>
                <span className="text-primary">{game.decisions.loser.fullName}</span>
              </p>
            )}
            {game.decisions.save && (
              <p className="text-xs flex justify-between">
                <span className="text-teal font-medium">SV</span>
                <span className="text-primary">{game.decisions.save.fullName}</span>
              </p>
            )}
          </div>
        )}

        <p className="text-[10px] text-muted text-center">{game.venue.name}</p>
      </div>
    </div>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="trident-card p-3 h-14 skeleton-shimmer" />
      ))}
    </div>
  );
}
