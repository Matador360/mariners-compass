"use client";

import { cn } from "@/lib/utils";

export interface SosGame {
  gamePk: number;
  date: string;         // "YYYY-MM-DD"
  opponentId: number;
  opponentAbbrev: string;
  opponentLogoUrl: string;
  opponentWinPct: number;
  isHome: boolean;
}

interface SosStripProps {
  upcoming: SosGame[];
  selectedGamePk?: number;
  onSelect?: (gamePk: number) => void;
}

function sosLabel(avg: number): string {
  if (avg < 0.45) return "soft";
  if (avg <= 0.52) return "average";
  return "gauntlet";
}

function sosColor(winPct: number): string {
  if (winPct < 0.45) return "bg-teal/60";
  if (winPct <= 0.52) return "bg-amber-400/70";
  return "bg-red-500/70";
}

function groupAvg(games: SosGame[]): number {
  if (games.length === 0) return 0.5;
  return games.reduce((s, g) => s + g.opponentWinPct, 0) / games.length;
}

export function SosStrip({ upcoming, selectedGamePk, onSelect }: SosStripProps) {
  const capped = upcoming.slice(0, 20);
  if (capped.length < 3) return null;

  const next5 = capped.slice(0, 5);
  const next10 = capped.slice(0, 10);
  const next20 = capped;

  const avg5  = groupAvg(next5);
  const avg10 = groupAvg(next10);
  const avg20 = groupAvg(next20);

  const label5 = sosLabel(avg5);

  function fmtPct(n: number) { return (n * 100).toFixed(0) + "%"; }

  const labelColor = label5 === "soft" ? "text-teal" : label5 === "gauntlet" ? "text-red-400" : "text-amber-400";

  return (
    <div className="trident-card p-3 space-y-2">
      {/* Summary line */}
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-[10px] uppercase tracking-widest text-muted font-semibold shrink-0">Strength of Schedule</p>
        <p className="text-[10px] text-muted">
          Next {next5.length}:{" "}
          <span className={cn("font-bold", labelColor)}>{fmtPct(avg5)} ({label5})</span>
          {next10.length > 5 && (
            <> · Next {next10.length}: <span className="font-semibold text-secondary">{fmtPct(avg10)}</span></>
          )}
          {next20.length > 10 && (
            <> · Next {next20.length}: <span className="font-semibold text-secondary">{fmtPct(avg20)}</span></>
          )}
        </p>
      </div>

      {/* Scrollable cells */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {capped.map((game) => {
          const isSelected = selectedGamePk === game.gamePk;
          const d = new Date(game.date);
          const dateLabel = d.toLocaleDateString("en-US", { month: "numeric", day: "numeric", timeZone: "UTC" });

          return (
            <button
              key={game.gamePk}
              onClick={() => onSelect?.(game.gamePk)}
              className={cn(
                "flex flex-col items-center gap-0.5 shrink-0 rounded-lg border p-1.5 transition-all duration-150",
                "w-[52px] min-w-[44px] max-w-[60px]",
                "hover:scale-105 hover:border-border-accent",
                isSelected ? "border-teal/60 bg-teal/10 ring-1 ring-teal/40" : "border-border bg-surface-2/30"
              )}
              title={`${game.isHome ? "vs" : "@"} ${game.opponentAbbrev} (${(game.opponentWinPct * 100).toFixed(0)}%)`}
            >
              {/* Logo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={game.opponentLogoUrl}
                alt={game.opponentAbbrev}
                width={24} height={24}
                className="w-6 h-6 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              {/* Abbrev + H/A */}
              <p className="text-[8px] font-bold text-primary leading-none">{game.opponentAbbrev}</p>
              <p className="text-[7px] text-muted leading-none">{game.isHome ? "H" : "A"}</p>
              {/* Date */}
              <p className="text-[7px] text-muted/70 leading-none">{dateLabel}</p>
              {/* Strength bar */}
              <div className={cn("w-full h-1 rounded-full mt-0.5", sosColor(game.opponentWinPct))} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
