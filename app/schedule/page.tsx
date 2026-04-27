"use client";

import { useEffect, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, List, Grid3X3, X } from "lucide-react";
import { cn, formatGameTime, teamLogoUrl } from "@/lib/utils";
import { calcWinProb } from "@/lib/predictions";
import type { MLBGame } from "@/types/mlb";

const TEAM_ID = 136;

type ConfKey = "lock" | "lean-sea" | "flip" | "lean-opp" | "pray";

function getConfidence(prob: number): { label: string; color: string; key: ConfKey } {
  if (prob >= 0.68) return { label: "Lock 🔒",      color: "text-teal bg-teal/10 border-teal/30",               key: "lock" };
  if (prob >= 0.57) return { label: "Lean SEA",     color: "text-green-400 bg-green-400/10 border-green-400/30", key: "lean-sea" };
  if (prob >= 0.43) return { label: "Coin flip 🪙", color: "text-amber-400 bg-amber-400/10 border-amber-400/30", key: "flip" };
  if (prob >= 0.32) return { label: "Lean opp",     color: "text-orange-400 bg-orange-400/10 border-orange-400/30", key: "lean-opp" };
  return             { label: "Pray 🙏",            color: "text-red-400 bg-red-400/10 border-red-400/30",       key: "pray" };
}

const TAKES: Record<ConfKey, string[]> = {
  lock:       [
    "We should handle this. Famous last words.",
    "The math says take it. Trust the math.",
    "Favorable matchup. Let's not overcomplicate it.",
    "Clean W on paper. Don't let us down.",
    "Numbers say yes. Mariners say... probably yes.",
  ],
  "lean-sea": [
    "Slight edge for Seattle. I'll take it.",
    "We've got the advantage. Don't blow it.",
    "Leaning SEA. Cautiously. Very cautiously.",
    "We're the better team tonight. Act like it.",
    "Should be a W. Let's not jinx this.",
  ],
  flip:       [
    "Literally could go either way. I refuse to predict this.",
    "50-50. The most Mariners outcome possible.",
    "Coin flip energy. Might go 14 innings.",
    "Anyone's game. Even I'm nervous, and I'm always confident.",
    "Classic Mariners ambiguity. Could be a masterpiece or a disaster.",
  ],
  "lean-opp": [
    "Tough matchup tonight. Prove me wrong, boys.",
    "The numbers aren't great. Time for a miracle.",
    "Uphill battle. But stranger things have happened.",
    "Rough one on paper. This is what Mariners baseball is about.",
    "Not great, not great. But we've won uglier.",
  ],
  pray:       [
    "Pray for rain. Or a miracle. Either works.",
    "If we win this it goes in the highlight reel forever.",
    "This is not favorable. I love this team anyway.",
    "The math says no. The heart says also no. But let's watch.",
    "Buckle up. Could get ugly, or it could be legendary.",
  ],
};

function getTake(prob: number, pitcher?: string, seed = 0): string {
  const { key } = getConfidence(prob);
  const lines = TAKES[key];
  const base = lines[seed % lines.length];
  const lastName = pitcher ? pitcher.split(" ").slice(-1)[0] : null;
  const pitcherPrefixes = lastName
    ? [`${lastName} takes the ball tonight. `, `${lastName} on the mound. `, `Counting on ${lastName} tonight. `]
    : [];
  const prefix = pitcherPrefixes.length > 0 ? pitcherPrefixes[seed % pitcherPrefixes.length] : "";
  return prefix + base;
}

function probFillColor(prob: number): string {
  if (prob >= 0.60) return "#00A3A3";
  if (prob >= 0.45) return "#FFB700";
  return "#F87171";
}

// ─── Result badge ─────────────────────────────────────────────────────────────

function getResultBadge(
  us: { leagueRecord?: { pct?: string } },
  them: { leagueRecord?: { pct?: string } },
  weWon: boolean
): { text: string; color: string; mobileHide?: boolean } | null {
  const usPct   = parseFloat(us.leagueRecord?.pct   ?? "0.500");
  const themPct = parseFloat(them.leagueRecord?.pct ?? "0.500");
  const diff = themPct - usPct; // positive = they're better
  if (weWon  && diff > 0.06)  return { text: "🚨 UPSET",  color: "text-amber-400 bg-amber-400/10 border-amber-400/30" };
  if (weWon  && diff > 0.03)  return { text: "DAWG 🐕",   color: "text-orange-400 bg-orange-400/10 border-orange-400/30" };
  if (weWon)                  return { text: "Chalk ✓",   color: "text-muted bg-surface-2 border-border", mobileHide: true };
  if (!weWon && diff < -0.05) return { text: "Choke 😬",  color: "text-red-400 bg-red-400/10 border-red-400/30" };
  return null;
}

// ─── Series forecast ──────────────────────────────────────────────────────────

function getSeriesForecast(games: MLBGame[], isHome: boolean): { label: string; color: string } {
  const first = games[0];
  const us   = isHome ? first.teams.home : first.teams.away;
  const them = isHome ? first.teams.away : first.teams.home;
  const p    = calcWinProb(
    parseFloat(us.leagueRecord?.pct   ?? "0.500"),
    parseFloat(them.leagueRecord?.pct ?? "0.500"),
    isHome
  );
  const n  = games.length;
  const eW = Math.round(p * n);

  const finished = games.filter(g => g.status.abstractGameState === "Final");
  const seaWins  = finished.filter(g => {
    const t = g.teams.home.team.id === TEAM_ID ? g.teams.home : g.teams.away;
    return t.isWinner;
  }).length;

  if (finished.length === n) {
    const predictedW = eW > n / 2;
    const actualW    = seaWins > n / 2;
    if (predictedW && actualW)   return { label: `Called it: ${seaWins}–${n - seaWins} ✅`, color: "text-teal" };
    if (!predictedW && !actualW) return { label: `Saw it coming: ${seaWins}–${n - seaWins} ✅`, color: "text-teal" };
    if (predictedW && !actualW)  return { label: `Whiffed: ${seaWins}–${n - seaWins} 😬`, color: "text-red-400" };
    return { label: `Didn't see that: ${seaWins}–${n - seaWins} 😤`, color: "text-amber-400" };
  }
  if (finished.length > 0) {
    const ahead = seaWins > finished.length - seaWins;
    const tied  = seaWins === finished.length - seaWins;
    const suffix = tied ? "tied" : ahead ? `SEA up ${seaWins}–${finished.length - seaWins}` : `trailing ${seaWins}–${finished.length - seaWins}`;
    return { label: `${suffix} · ${n - finished.length} left`, color: ahead ? "text-teal" : "text-orange-400" };
  }
  if (eW > Math.floor(n / 2)) return { label: `Take ${eW} of ${n} 🔒`, color: "text-teal" };
  if (eW === Math.floor(n / 2) && n % 2 === 0) return { label: "Could split", color: "text-muted" };
  return { label: `Tough ${n}-game set 😬`, color: "text-orange-400" };
}

// ─── Data hook ────────────────────────────────────────────────────────────────

function useSchedule() {
  const [games, setGames] = useState<MLBGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const year = new Date().getFullYear();
    fetch(
      `https://statsapi.mlb.com/api/v1/schedule?teamId=${TEAM_ID}&sportId=1&season=${year}&startDate=${year}-01-01&endDate=${year}-12-31&hydrate=probablePitcher,decisions,linescore,seriesStatus,team`
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

// ─── Page ─────────────────────────────────────────────────────────────────────

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
  const monthName = new Date(selectedYear, selectedMonth, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const seasonMonths = [2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-black text-primary tracking-tight">Schedule</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("list")}
            className={cn("p-2 rounded-lg border transition-colors", view === "list" ? "bg-teal/10 border-teal/30 text-teal" : "border-border text-muted hover:text-primary")}
            aria-label="List view"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setView("calendar")}
            className={cn("p-2 rounded-lg border transition-colors", view === "calendar" ? "bg-teal/10 border-teal/30 text-teal" : "border-border text-muted hover:text-primary")}
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
        <h2 className="text-base font-bold text-primary min-w-[140px] text-center">{monthName}</h2>
        <button
          onClick={() => setSelectedMonth((m) => Math.min(seasonMonths[seasonMonths.length - 1], m + 1))}
          disabled={selectedMonth >= seasonMonths[seasonMonths.length - 1]}
          className="p-1.5 rounded-lg border border-border text-muted hover:text-primary disabled:opacity-30 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
        <div className="hidden sm:flex gap-1 ml-2 flex-wrap">
          {seasonMonths.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={cn("text-[11px] px-2 py-1 rounded font-medium transition-colors", m === selectedMonth ? "bg-teal text-white" : "text-muted hover:text-primary hover:bg-surface-2")}
            >
              {new Date(selectedYear, m, 1).toLocaleDateString("en-US", { month: "short" })}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <ScheduleSkeleton />
      ) : view === "list" ? (
        <ListView games={gamesByMonth} today={today} onSelect={setSelectedGame} selectedGame={selectedGame} />
      ) : (
        <CalendarView games={gamesByMonth} month={selectedMonth} year={selectedYear} today={today} onSelect={setSelectedGame} selectedGame={selectedGame} />
      )}

      {/* Mobile backdrop */}
      {selectedGame && (
        <div
          className="fixed inset-0 z-[59] md:hidden bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedGame(null)}
        />
      )}

      {/* Game detail panel */}
      {selectedGame && (
        <GameDetailPanel game={selectedGame} onClose={() => setSelectedGame(null)} />
      )}
    </div>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────

function ListView({
  games, today, onSelect, selectedGame,
}: { games: MLBGame[]; today: string; onSelect: (g: MLBGame) => void; selectedGame: MLBGame | null; }) {
  if (games.length === 0) {
    return <div className="trident-card p-10 text-center text-muted">No games scheduled this month.</div>;
  }

  interface SeriesGroup {
    opponentId: number; opponentName: string; opponentAbbr: string; isHome: boolean; games: MLBGame[];
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
        const firstDate = new Date(series.games[0].gameDate);
        const lastDate  = new Date(series.games[series.games.length - 1].gameDate);
        const startStr  = firstDate.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Los_Angeles" });
        const endStr    = series.games.length > 1
          ? lastDate.toLocaleDateString("en-US", { day: "numeric", timeZone: "America/Los_Angeles" })
          : null;
        const dateRange = endStr ? `${startStr}–${endStr}` : startStr;

        const finishedGames = series.games.filter(g => g.status.abstractGameState === "Final");
        const seriesWins    = finishedGames.filter(g => (g.teams.home.team.id === TEAM_ID ? g.teams.home : g.teams.away).isWinner).length;
        const seriesLosses  = finishedGames.length - seriesWins;
        const remaining     = series.games.length - finishedGames.length;

        const forecast = getSeriesForecast(series.games, series.isHome);

        return (
          <div key={si}>
            {/* Series header */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://www.mlbstatic.com/team-logos/${series.opponentId}.svg`}
                alt={series.opponentName}
                width={18} height={18}
                className="w-4.5 h-4.5 object-contain opacity-75"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">
                <span className="text-secondary">{series.isHome ? "vs" : "@"} {series.opponentAbbr}</span>
                <span className="ml-2">· {dateRange} · {series.games.length}G</span>
              </p>
              {finishedGames.length > 0 && (
                <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full ml-1",
                  seriesWins > seriesLosses ? "bg-win/10 text-win" :
                  seriesLosses > seriesWins ? "bg-loss/10 text-loss" : "bg-surface-2 text-muted"
                )}>
                  {seriesWins}–{seriesLosses}
                  {remaining > 0 && <span className="font-normal opacity-60"> ({remaining} left)</span>}
                </span>
              )}
              {/* Series forecast */}
              <span className={cn("text-[9px] font-semibold ml-auto shrink-0", forecast.color)}>
                {forecast.label}
              </span>
            </div>

            <div className="space-y-1.5">
              {series.games.map((g, gi) => (
                <GameRow
                  key={g.gamePk}
                  game={g}
                  gameIndex={gi}
                  isSelected={selectedGame?.gamePk === g.gamePk}
                  isToday={new Date(g.gameDate).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" }) === today}
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

// ─── Game row ─────────────────────────────────────────────────────────────────

function GameRow({
  game, gameIndex, isSelected, isToday, onClick,
}: { game: MLBGame; gameIndex: number; isSelected: boolean; isToday: boolean; onClick: () => void; }) {
  const isHome = game.teams.home.team.id === TEAM_ID;
  const us   = isHome ? game.teams.home : game.teams.away;
  const them = isHome ? game.teams.away : game.teams.home;
  const state    = game.status.abstractGameState;
  const isFinal  = state === "Final";
  const isLive   = state === "Live";
  const isPreview = state === "Preview";
  const weWon  = isFinal && us.isWinner;

  // Win probability
  const seaWinPct = parseFloat(us.leagueRecord?.pct   ?? "0.500");
  const oppWinPct = parseFloat(them.leagueRecord?.pct ?? "0.500");
  const prob = calcWinProb(seaWinPct, oppWinPct, isHome);
  const conf = getConfidence(prob);
  const pct  = Math.round(prob * 100);
  const fill = probFillColor(prob);

  // Probable pitcher for upcoming
  const seaPitcher = isHome ? game.probablePitchers?.home?.fullName : game.probablePitchers?.away?.fullName;
  const take = getTake(prob, seaPitcher, gameIndex);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full trident-card p-3 flex flex-col text-left transition-all",
        isSelected && "border-teal/40 bg-teal/5",
        isToday && !isSelected && "border-teal/20",
        "hover:border-border-accent"
      )}
    >
      {/* ── Main row ── */}
      <div className="flex items-center gap-3 w-full">
        {/* Date */}
        <div className="w-14 shrink-0 text-center">
          <p className="text-[9px] uppercase tracking-widest text-muted">
            {new Date(game.gameDate).toLocaleDateString("en-US", { weekday: "short", timeZone: "America/Los_Angeles" })}
          </p>
          <p className="text-sm font-bold text-primary">
            {new Date(game.gameDate).toLocaleDateString("en-US", { month: "numeric", day: "numeric", timeZone: "America/Los_Angeles" })}
          </p>
        </div>

        {/* H/A indicator */}
        <span className={cn("text-[9px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0",
          isHome ? "border-teal/30 text-teal bg-teal/5" : "border-border text-muted"
        )}>
          {isHome ? "HOME" : "AWAY"}
        </span>

        {/* Opponent */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={teamLogoUrl(them.team.id)} alt={them.team.name} width={24} height={24} className="w-6 h-6 object-contain shrink-0 opacity-80" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <span className="text-sm font-medium text-primary truncate">{them.team.name}</span>
        </div>

        {/* Score / time / confidence */}
        <div className="text-right shrink-0">
          {isFinal ? (
            <div className="flex items-center gap-1.5">
              {(() => {
                const badge = getResultBadge(us, them, !!weWon);
                return badge ? (
                  <span className={cn("text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border", badge.color, badge.mobileHide ? "hidden sm:inline" : "")}>{badge.text}</span>
                ) : null;
              })()}
              <span className={cn("text-xs font-black px-2 py-0.5 rounded uppercase", weWon ? "bg-win/15 text-win" : "bg-loss/15 text-loss")}>
                {weWon ? "W" : "L"}
              </span>
              <span className="text-sm font-bold stat-number">{us.score}–{them.score}</span>
            </div>
          ) : isLive ? (
            <span className="text-xs font-bold text-teal flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal animate-ping inline-block" />
              Live
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border hidden sm:inline", conf.color)}>{conf.label}</span>
              <span className="text-xs text-muted">{formatGameTime(game.gameDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Upcoming: probability bar + Trident's Take ── */}
      {isPreview && (
        <div className="mt-2 space-y-1 w-full">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: fill }}
              />
            </div>
            <span className="text-[10px] font-bold shrink-0 tabular-nums" style={{ color: fill }}>SEA {pct}%</span>
            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 sm:hidden", conf.color)}>{conf.label}</span>
          </div>
          <p className="text-[10px] text-muted/80 italic leading-snug">{take}</p>
        </div>
      )}

      {/* ── Past game: retroactive probability footnote (desktop only) ── */}
      {isFinal && (
        <p className="hidden sm:block mt-1 text-[9px] text-muted/50 italic">
          Pre-game model had SEA at {pct}%
          {weWon && prob < 0.45 ? " — we weren't supposed to win that one 👀" :
           !weWon && prob >= 0.60 ? " — yeah, that one hurt." :
           weWon && prob >= 0.60 ? " — chalk result." : "."}
        </p>
      )}
    </button>
  );
}

// ─── Calendar view ─────────────────────────────────────────────────────────────

function CalendarView({
  games, month, year, today, onSelect, selectedGame,
}: { games: MLBGame[]; month: number; year: number; today: string; onSelect: (g: MLBGame) => void; selectedGame: MLBGame | null; }) {
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
      <div className="grid grid-cols-7 border-b border-border">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="p-2 text-center text-[10px] uppercase tracking-widest text-muted font-semibold">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: rows * 7 }).map((_, idx) => {
          const day = idx - firstDay + 1;
          const isValid = day >= 1 && day <= daysInMonth;
          const dayGames = isValid ? (gameByDay[day] ?? []) : [];
          const cellDate = isValid ? new Date(year, month, day).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" }) : "";
          const isTodayCell = cellDate === today;

          return (
            <div key={idx} className={cn("min-h-[72px] sm:min-h-[90px] p-1.5 border-b border-r border-border relative", !isValid && "opacity-30 bg-surface/30", isTodayCell && "bg-teal/5")}>
              {isValid && (
                <>
                  <span className={cn("text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full leading-none", isTodayCell ? "bg-teal text-white" : "text-secondary")}>
                    {day}
                  </span>
                  <div className="space-y-0.5 mt-1">
                    {dayGames.map((g) => {
                      const isHomeG = g.teams.home.team.id === TEAM_ID;
                      const usG = isHomeG ? g.teams.home : g.teams.away;
                      const themG = isHomeG ? g.teams.away : g.teams.home;
                      const isFinalG = g.status.abstractGameState === "Final";
                      const weWonG = isFinalG && usG.isWinner;
                      const isSelectedG = selectedGame?.gamePk === g.gamePk;
                      return (
                        <button
                          key={g.gamePk}
                          onClick={() => onSelect(g)}
                          className={cn("w-full text-left text-[9px] px-1.5 py-0.5 rounded font-medium truncate transition-colors",
                            isSelectedG && "ring-1 ring-teal",
                            isFinalG ? weWonG ? "bg-win/15 text-win hover:bg-win/25" : "bg-loss/15 text-loss hover:bg-loss/25"
                                      : "bg-teal/10 text-teal hover:bg-teal/20"
                          )}
                        >
                          {isFinalG
                            ? `${weWonG ? "W" : "L"} ${usG.score}–${themG.score}`
                            : `${isHomeG ? "vs" : "@"} ${themG.team.abbreviation ?? themG.team.teamName.slice(0, 3)}`}
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

// ─── Game detail panel ────────────────────────────────────────────────────────

function GameDetailPanel({ game, onClose }: { game: MLBGame; onClose: () => void; }) {
  const isHome   = game.teams.home.team.id === TEAM_ID;
  const us       = isHome ? game.teams.home : game.teams.away;
  const them     = isHome ? game.teams.away : game.teams.home;
  const isFinal  = game.status.abstractGameState === "Final";
  const isLive   = game.status.abstractGameState === "Live";
  const isPreview = game.status.abstractGameState === "Preview";
  const weWon    = isFinal && us.isWinner;

  const seaWinPct = parseFloat(us.leagueRecord?.pct   ?? "0.500");
  const oppWinPct = parseFloat(them.leagueRecord?.pct ?? "0.500");
  const prob = calcWinProb(seaWinPct, oppWinPct, isHome);
  const conf = getConfidence(prob);
  const pct  = Math.round(prob * 100);
  const fill = probFillColor(prob);
  const seaPitcher = isHome ? game.probablePitchers?.home?.fullName : game.probablePitchers?.away?.fullName;
  const take = getTake(prob, seaPitcher, 0);

  return (
    /* Panel — sits above mobile nav (bottom-16), full side panel on desktop */
    <div className="fixed bottom-16 left-0 right-0 md:bottom-auto md:right-4 md:top-20 md:left-auto md:w-80 z-[60] bg-card border border-teal/30 shadow-2xl md:rounded-xl rounded-t-2xl flex flex-col max-h-[78vh] md:max-h-[calc(100vh-96px)]">
      {/* Drag handle (mobile) */}
      <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
        <div className="w-10 h-1 bg-border rounded-full" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <p className="text-sm font-bold text-primary">Game Details</p>
        <button onClick={onClose} className="text-muted hover:text-primary p-1 rounded hover:bg-surface-2 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="overflow-y-auto flex-1 p-4 space-y-4">
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
              <p className="text-2xl font-black stat-number">{them.score ?? 0}–{us.score ?? 0}</p>
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

        {/* ── Trident's Take ── */}
        {isPreview && (
          <div className="space-y-2 p-3 rounded-xl bg-teal/5 border border-teal/20">
            <p className="text-[10px] uppercase tracking-widest text-teal font-bold">⚡ Trident&apos;s Take</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: fill }} />
              </div>
              <span className="text-xs font-black tabular-nums shrink-0" style={{ color: fill }}>SEA {pct}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("text-[9px] font-black px-2 py-0.5 rounded border", conf.color)}>{conf.label}</span>
              <span className="text-[9px] text-muted">{isHome ? "Home crowd behind us" : "Road trip vibes"}</span>
            </div>
            <p className="text-xs text-secondary italic">&ldquo;{take}&rdquo;</p>
          </div>
        )}

        {/* ── Pre-game forecast (past games) ── */}
        {isFinal && (
          <div className="p-3 rounded-xl bg-surface-2/40 border border-border/50 space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-muted font-bold">Pre-game Model</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: fill }} />
              </div>
              <span className="text-xs font-bold tabular-nums shrink-0" style={{ color: fill }}>SEA {pct}%</span>
            </div>
            {(() => {
              const badge = getResultBadge(us, them, !!weWon);
              return badge ? (
                <div className="flex items-center gap-1.5">
                  <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded border", badge.color)}>{badge.text}</span>
                  <span className="text-[9px] text-muted italic">
                    {badge.text.includes("UPSET") ? "Didn't see that coming" :
                     badge.text.includes("DAWG")  ? "We punched up and delivered" :
                     badge.text.includes("Choke") ? "Had it. Then didn't." :
                     "Right on schedule"}
                  </span>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* Linescore */}
        {(isFinal || isLive) && game.linescore?.innings?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] text-center">
              <thead>
                <tr className="text-muted">
                  <td className="p-1 text-left">Team</td>
                  {game.linescore.innings.map((inn) => <td key={inn.num} className="p-1 w-6">{inn.num}</td>)}
                  <td className="p-1 font-bold">R</td>
                  <td className="p-1">H</td>
                  <td className="p-1">E</td>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: them.team.abbreviation ?? "AWY", data: game.linescore.innings.map((i) => (isHome ? i.away : i.home)), totals: isHome ? game.linescore.teams.away : game.linescore.teams.home },
                  { label: us.team.abbreviation   ?? "SEA", data: game.linescore.innings.map((i) => (isHome ? i.home : i.away)), totals: isHome ? game.linescore.teams.home : game.linescore.teams.away },
                ].map((row) => (
                  <tr key={row.label} className="border-t border-border">
                    <td className="p-1 text-left font-bold text-secondary">{row.label}</td>
                    {row.data.map((cell, i) => <td key={i} className="p-1 text-muted">{cell?.runs ?? "–"}</td>)}
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
        {isPreview && game.probablePitchers && (
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
            {game.decisions.winner && <p className="text-xs flex justify-between"><span className="text-win font-medium">W</span><span className="text-primary">{game.decisions.winner.fullName}</span></p>}
            {game.decisions.loser  && <p className="text-xs flex justify-between"><span className="text-loss font-medium">L</span><span className="text-primary">{game.decisions.loser.fullName}</span></p>}
            {game.decisions.save   && <p className="text-xs flex justify-between"><span className="text-teal font-medium">SV</span><span className="text-primary">{game.decisions.save.fullName}</span></p>}
          </div>
        )}

        <p className="text-[10px] text-muted text-center">{game.venue.name}</p>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ScheduleSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(6)].map((_, i) => <div key={i} className="trident-card p-3 h-14 skeleton-shimmer" />)}
    </div>
  );
}
