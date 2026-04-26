"use client";

import Link from "next/link";
import { cn, formatDate, formatGameTime, getCountdown, teamLogoUrl } from "@/lib/utils";
import type { MLBGame } from "@/types/mlb";

interface GameCardProps {
  game: MLBGame;
  teamId?: number;
}

export function GameCard({ game, teamId = 136 }: GameCardProps) {
  const isHome = game.teams.home.team.id === teamId;
  const us = isHome ? game.teams.home : game.teams.away;
  const them = isHome ? game.teams.away : game.teams.home;
  const state = game.status.abstractGameState;
  const isLive = state === "Live";
  const isFinal = state === "Final";
  const isPreview = state === "Preview";

  const weWon = isFinal && us.isWinner;
  const weLost = isFinal && !us.isWinner;

  return (
    <Link href={`/schedule?game=${game.gamePk}`} className="block">
      <div
        className={cn(
          "trident-card p-5 relative overflow-hidden fade-up",
          isLive && "trident-card-glow border-teal/40",
          weWon && "border-win/20",
          weLost && "border-loss/20"
        )}
      >
        {/* Live badge */}
        {isLive && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-teal">
              Live
            </span>
          </div>
        )}

        {/* Series context */}
        {game.seriesDescription && (
          <p className="text-[10px] uppercase tracking-widest text-muted mb-3">
            {game.seriesDescription}
            {game.seriesGameNumber && game.gamesInSeries
              ? ` · Game ${game.seriesGameNumber} of ${game.gamesInSeries}`
              : ""}
          </p>
        )}

        {/* Teams row */}
        <div className="flex items-center justify-between gap-4">
          {/* Away team */}
          <TeamSide
            team={them}
            isUs={false}
            showScore={!isPreview}
            isWinner={them.isWinner}
          />

          {/* VS / Score / State */}
          <div className="flex flex-col items-center gap-1 min-w-[60px]">
            {isPreview && (
              <>
                <span className="text-xs text-muted font-medium">
                  {isHome ? "HOME" : "AWAY"}
                </span>
                <span className="text-2xl font-bold text-secondary">VS</span>
                <span className="text-xs text-teal font-medium">
                  {formatGameTime(game.gameDate)}
                </span>
                <span className="text-[10px] text-muted">
                  {getCountdown(game.gameDate)}
                </span>
              </>
            )}
            {(isLive || isFinal) && (
              <>
                {isLive && game.linescore && (
                  <span className="text-[10px] text-teal font-bold uppercase">
                    {game.linescore.inningState} {game.linescore.currentInningOrdinal}
                  </span>
                )}
                {isFinal && (
                  <span
                    className={cn(
                      "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                      weWon ? "text-win bg-win/10" : "text-loss bg-loss/10"
                    )}
                  >
                    {weWon ? "W" : "L"}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Home team */}
          <TeamSide
            team={us}
            isUs={true}
            showScore={!isPreview}
            isWinner={us.isWinner}
            reverse
          />
        </div>

        {/* Probable pitchers (preview) */}
        {isPreview && game.probablePitchers && (
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted">
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase tracking-widest">Away SP</span>
              <span className="text-primary font-medium">
                {game.probablePitchers.away?.fullName ?? "TBD"}
              </span>
            </div>
            <div className="flex items-center gap-1 text-right">
              <span className="text-primary font-medium">
                {game.probablePitchers.home?.fullName ?? "TBD"}
              </span>
              <span className="text-[10px] uppercase tracking-widest">Home SP</span>
            </div>
          </div>
        )}

        {/* Venue */}
        <p className="mt-3 text-[10px] text-muted text-center">
          {game.venue.name} · {formatDate(game.gameDate)}
        </p>
      </div>
    </Link>
  );
}

function TeamSide({
  team,
  isUs,
  showScore,
  isWinner,
  reverse = false,
}: {
  team: { team: { id: number; name: string; abbreviation?: string }; score?: number };
  isUs: boolean;
  showScore: boolean;
  isWinner?: boolean;
  reverse?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 flex-1",
        reverse ? "flex-row-reverse text-right" : "flex-row text-left"
      )}
    >
      <div className="shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={teamLogoUrl(team.team.id)}
          alt={team.team.name}
          width={40}
          height={40}
          className={cn("w-10 h-10 object-contain", !isUs && "opacity-70")}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
      <div>
        <p
          className={cn(
            "text-sm font-bold uppercase tracking-wide",
            isUs ? "text-primary" : "text-secondary"
          )}
        >
          {(team.team as { abbreviation?: string }).abbreviation ?? team.team.name.slice(0, 3).toUpperCase()}
        </p>
        {showScore && (
          <p
            className={cn(
              "text-3xl font-black stat-number leading-none",
              isWinner ? "text-primary" : "text-muted"
            )}
          >
            {team.score ?? 0}
          </p>
        )}
        <p className="text-[10px] text-muted">
          {team.team.name}
        </p>
      </div>
    </div>
  );
}
