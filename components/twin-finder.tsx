"use client";

import { cn } from "@/lib/utils";
import type { DimensionDef } from "@/lib/compare";
import { findTwins } from "@/lib/compare";

export interface TwinFinderPlayer {
  id: number;
  name: string;
  position: string;
  headshot?: string;
  isPitcher: boolean;
  isGhost?: boolean;
  stats: Record<string, number>;
}

interface TwinFinderProps {
  primary: TwinFinderPlayer | null;
  pool: TwinFinderPlayer[];
  dims: DimensionDef[];
  onAdd?: (player: TwinFinderPlayer) => void;
  alreadySelected: Set<number>;
}

function similarityColor(sim: number): string {
  if (sim >= 0.92) return "text-teal bg-teal/10 border-teal/30";
  if (sim >= 0.85) return "text-amber-400 bg-amber-400/10 border-amber-400/30";
  return "text-muted bg-surface-2 border-border";
}

export function TwinFinder({ primary, pool, dims, onAdd, alreadySelected }: TwinFinderProps) {
  if (!primary || primary.isGhost) {
    return (
      <div className="trident-card p-3">
        <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-2">
          Twin Finder
        </p>
        <p className="text-xs text-muted/60 text-center py-2">
          Pick a current Mariner to find their twins
        </p>
      </div>
    );
  }

  const twins = findTwins(primary, pool, dims, 3);

  return (
    <div className="trident-card p-3 space-y-2">
      <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">
        Twins of {primary.name.split(" ").pop()}
      </p>
      {twins.length === 0 ? (
        <p className="text-xs text-muted/60 text-center py-2">Not enough shared data</p>
      ) : (
        <div className="flex flex-col gap-2">
          {twins.map(({ player, similarity }) => {
            const alreadyIn = alreadySelected.has(player.id);
            return (
              <div key={player.id} className="flex items-center gap-2">
                {/* Headshot */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={player.headshot ?? ""}
                  alt={player.name}
                  width={32} height={32}
                  className="rounded-full w-8 h-8 object-cover bg-white/5 shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-primary truncate leading-tight">{player.name}</p>
                  <p className="text-[9px] text-muted">{player.position}</p>
                </div>
                {/* Similarity badge */}
                <span className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0",
                  similarityColor(similarity)
                )}>
                  {(similarity * 100).toFixed(0)}%
                </span>
                {/* Add button */}
                {onAdd && !alreadyIn && (
                  <button
                    onClick={() => onAdd(player)}
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal/10 text-teal border border-teal/30 hover:bg-teal/20 transition-colors shrink-0"
                  >
                    +Add
                  </button>
                )}
                {alreadyIn && (
                  <span className="text-[9px] text-muted/40 shrink-0">added</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
