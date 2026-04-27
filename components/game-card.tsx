"use client";

import Link from "next/link";
import { cn, formatDate, formatGameTime, getCountdown, teamLogoUrl } from "@/lib/utils";
import type { MLBGame, MLBGameTeam } from "@/types/mlb";

interface GameCardProps {
  game: MLBGame;
  teamId?: number;
}

function getPrediction(us: MLBGameTeam, them: MLBGameTeam, isHome: boolean) {
  const usPct  = parseFloat(us.leagueRecord?.pct  ?? "0.500");
  const themPct = parseFloat(them.leagueRecord?.pct ?? "0.500");
  const homeBonus = isHome ? 0.03 : -0.03;
  const raw = usPct / Math.max(0.001, usPct + themPct) + homeBonus;
  const prob = Math.max(0.25, Math.min(0.80, raw));

  let label: string;
  let color: string;
  let quip: string;
  const oppEra = them.leagueRecord.losses + them.leagueRecord.wins > 0
    ? them.leagueRecord.losses / (them.leagueRecord.wins + them.leagueRecord.losses)
    : 0.5;

  if (prob >= 0.65) {
    label = "SEA favored";
    color = "#22C55E";
    quip = usPct > 0.550 ? "Lock it in. We're the better team." : oppEra > 0.55 ? "Their record is a disaster. We should feast." : "Playing well lately. Good spot to take this one.";
  } else if (prob >= 0.52) {
    label = "Slight edge";
    color = "#00A3A3";
    quip = isHome ? "Home field matters. Take it." : "On the road but we've got the edge. Probably.";
  } else if (prob >= 0.48) {
    label = "Coin flip";
    color = "#FFB700";
    quip = "50/50. Could go either way. Don't make plans.";
  } else if (prob >= 0.35) {
    label = "Uphill battle";
    color = "#F97316";
    quip = themPct > 0.600 ? "They're hot right now. Gonna need a big game." : "Not our best matchup. Prove me wrong.";
  } else {
    label = "Long shot";
    color = "#EF4444";
    quip = "They're better than us on paper. Let's embarrass them anyway.";
  }

  return { prob, label, color, quip };
}

function getResultBadge(us: MLBGameTeam, them: MLBGameTeam, weWon: boolean) {
  const usPct   = parseFloat(us.leagueRecord?.pct   ?? "0.500");
  const themPct = parseFloat(them.leagueRecord?.pct  ?? "0.500");
  const diff = themPct - usPct;
  if (weWon && diff > 0.06)   return { text: "🚨 UPSET",  color: "text-amber-400 bg-amber-400/10 border-amber-400/30" };
  if (weWon && diff > 0.03)   return { text: "DAWG 🐕",   color: "text-orange-400 bg-orange-400/10 border-orange-400/30" };
  if (!weWon && diff < -0.06) return { text: "🚨 UPSET",  color: "text-red-400 bg-red-400/10 border-red-400/30" };
  if (weWon && diff <= 0)     return { text: "Chalk ✓",   color: "text-muted bg-white/5 border-white/10" };
  return null;
}

export function GameCard({ game, teamId = 136 }: GameCardProps) {
  const isHome = game.teams.home.team.id === teamId;
  const us     = isHome ? game.teams.home : game.teams.away;
  const them   = isHome ? game.teams.away : game.teams.home;
  const state  = game.status.abstractGameState;
  const isLive    = state === "Live";
  const isFinal   = state === "Final";
  const isPreview = state === "Preview";

  const weWon  = isFinal && !!us.isWinner;
  const weLost = isFinal && !us.isWinner;

  const prediction  = isPreview ? getPrediction(us, them, isHome) : null;
  const resultBadge = isFinal   ? getResultBadge(us, them, weWon) : null;

  return (
    <Link href={`/schedule?game=${game.gamePk}`} className="block group">
      <div
        className={cn(
          "card-gradient-border p-6 relative overflow-hidden",
          isLive  && "trident-card-glow",
          weWon   && "!border-win/30",
          weLost  && "!border-loss/20"
        )}
      >
        {/* Background tint for win/loss */}
        {weWon  && <div className="absolute inset-0 bg-win/[0.04] pointer-events-none rounded-2xl" />}
        {weLost && <div className="absolute inset-0 bg-loss/[0.04] pointer-events-none rounded-2xl" />}

        {/* Live badge */}
        {isLive && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-teal">Live</span>
          </div>
        )}

        {/* Result badge */}
        {resultBadge && (
          <div className="absolute top-4 right-4">
            <span className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full border", resultBadge.color)}>
              {resultBadge.text}
            </span>
          </div>
        )}

        {/* Series context */}
        {game.seriesDescription && (
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted mb-4 font-semibold">
            {game.seriesDescription}
            {game.seriesGameNumber && game.gamesInSeries
              ? ` · Game ${game.seriesGameNumber} of ${game.gamesInSeries}`
              : ""}
          </p>
        )}

        {/* Teams row — cinematic */}
        <div className="flex items-center justify-between gap-4">
          <TeamSide team={them} isUs={false} showScore={!isPreview} isWinner={them.isWinner} />

          {/* Center divider */}
          <div className="flex flex-col items-center gap-1.5 min-w-[72px]">
            {isPreview && (
              <>
                <span className="text-[10px] uppercase tracking-[0.1em] text-muted font-semibold">
                  {isHome ? "Home" : "Away"}
                </span>
                <span className="text-lg font-black text-muted/40 tracking-widest">VS</span>
                <span
                  className="text-base font-bold text-teal tabular-nums"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {formatGameTime(game.gameDate)}
                </span>
                <span className="text-[9px] text-muted">{getCountdown(game.gameDate)}</span>
              </>
            )}
            {(isLive || isFinal) && (
              <div className="flex flex-col items-center gap-1">
                {isLive && game.linescore && (
                  <span className="text-[10px] text-teal font-bold uppercase tracking-wider">
                    {game.linescore.inningState} {game.linescore.currentInningOrdinal}
                  </span>
                )}
                {isFinal && (
                  <span className={cn(
                    "text-sm font-black uppercase tracking-widest px-2.5 py-1 rounded-lg",
                    weWon ? "text-win bg-win/15 border border-win/25" : "text-loss bg-loss/12 border border-loss/20"
                  )}>
                    {weWon ? "W" : "L"} · Final
                  </span>
                )}
              </div>
            )}
          </div>

          <TeamSide team={us} isUs={true} showScore={!isPreview} isWinner={us.isWinner} reverse />
        </div>

        {/* Probable pitchers */}
        {isPreview && game.probablePitchers && (
          <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] uppercase tracking-[0.1em] text-muted font-semibold">Away SP</span>
              <span className="text-xs text-secondary font-medium">
                {game.probablePitchers.away?.fullName ?? "TBD"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-right">
              <span className="text-xs text-secondary font-medium">
                {game.probablePitchers.home?.fullName ?? "TBD"}
              </span>
              <span className="text-[9px] uppercase tracking-[0.1em] text-muted font-semibold">Home SP</span>
            </div>
          </div>
        )}

        {/* Prediction bar */}
        {prediction && (
          <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: prediction.color }}>
                ⚡ Trident&apos;s Take: {prediction.label}
              </span>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: prediction.color, fontFamily: "var(--font-mono)" }}
              >
                {Math.round(prediction.prob * 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${prediction.prob * 100}%`, backgroundColor: prediction.color, boxShadow: `0 0 8px ${prediction.color}66` }}
              />
            </div>
            <p className="text-[10px] text-muted/70 italic">{prediction.quip}</p>
          </div>
        )}

        {/* Venue */}
        <p className="mt-4 text-[10px] text-muted/60 text-center tracking-wider">
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
    <div className={cn("flex items-center gap-3 flex-1", reverse ? "flex-row-reverse text-right" : "flex-row text-left")}>
      {/* Logo */}
      <div className="shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={teamLogoUrl(team.team.id)}
          alt={team.team.name}
          width={56}
          height={56}
          className={cn(
            "w-12 h-12 md:w-14 md:h-14 object-contain transition-all duration-200",
            !isUs && "opacity-55 group-hover:opacity-70"
          )}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </div>
      <div>
        <p className={cn(
          "text-xs font-bold uppercase tracking-[0.1em]",
          isUs ? "text-primary" : "text-secondary"
        )}
          style={{ fontFamily: "var(--font-grotesk)" }}
        >
          {(team.team as { abbreviation?: string }).abbreviation ?? team.team.name.slice(0, 3).toUpperCase()}
        </p>
        {showScore && (
          <p
            className={cn(
              "font-black leading-none tabular-nums",
              isUs
                ? isWinner ? "text-primary" : "text-muted"
                : isWinner ? "text-secondary" : "text-muted/50"
            )}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "clamp(2rem, 5vw, 3rem)",
              letterSpacing: "-0.05em",
            }}
          >
            {team.score ?? 0}
          </p>
        )}
        <p className="text-[10px] text-muted/60 mt-0.5">{team.team.name}</p>
      </div>
    </div>
  );
}
