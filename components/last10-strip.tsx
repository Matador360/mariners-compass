import { cn, formatDate } from "@/lib/utils";
import type { MLBGame } from "@/types/mlb";

interface Last10StripProps {
  games: MLBGame[];
  teamId?: number;
  className?: string;
}

export function Last10Strip({ games, teamId = 136, className }: Last10StripProps) {
  const finished = games
    .filter((g) => g.status.abstractGameState === "Final")
    .sort((a, b) => b.gameDate.localeCompare(a.gameDate))
    .slice(0, 10);

  // Reverse so oldest → newest left to right
  const display = [...finished].reverse();

  return (
    <div className={cn("trident-card p-5", className)}>
      <p className="text-[10px] uppercase tracking-widest text-muted mb-3 font-semibold">
        Last {display.length} Games
      </p>
      <div className="flex items-center gap-1.5">
        {display.map((game) => {
          const isHome = game.teams.home.team.id === teamId;
          const us = isHome ? game.teams.home : game.teams.away;
          const them = isHome ? game.teams.away : game.teams.home;
          const won = us.isWinner;
          const ourScore = us.score ?? 0;
          const theirScore = them.score ?? 0;
          const diff = ourScore - theirScore;

          return (
            <div
              key={game.gamePk}
              className="relative group tooltip-trigger flex-1"
            >
              <div
                className={cn(
                  "h-8 rounded flex items-center justify-center text-xs font-bold transition-transform hover:scale-110 cursor-default",
                  won ? "game-result-win" : "game-result-loss"
                )}
              >
                {won ? "W" : "L"}
              </div>
              {/* Tooltip */}
              <div className="tooltip-content absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 bg-elevated border border-border-accent rounded-lg p-2.5 text-center min-w-[100px] shadow-xl">
                <p className="text-[10px] text-muted">{formatDate(game.gameDate)}</p>
                <p className={cn("text-sm font-bold", won ? "text-win" : "text-loss")}>
                  {ourScore}–{theirScore}
                </p>
                <p className="text-[10px] text-secondary">
                  vs {isHome ? game.teams.away.team.name : game.teams.home.team.name}
                </p>
                <p className={cn("text-[10px] font-medium", diff > 0 ? "text-win" : "text-loss")}>
                  {diff > 0 ? "+" : ""}{diff} run{Math.abs(diff) !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          );
        })}
        {/* Placeholder tiles if fewer than 10 */}
        {Array.from({ length: Math.max(0, 10 - display.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex-1 h-8 rounded bg-surface-2/50 border border-border"
          />
        ))}
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-muted">Oldest</span>
        <span className="text-[10px] text-muted">Most recent →</span>
      </div>
    </div>
  );
}
