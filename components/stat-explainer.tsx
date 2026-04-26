"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { STAT_DEFINITIONS } from "@/lib/stat-definitions";

interface StatExplainerState {
  statKey: string;
  value: string | number;
  rank?: number;
  total?: number;
  leagueAvg?: string;
  leagueBest?: string;
  leagueWorst?: string;
}

// Global event bus (simpler than a React context that needs provider)
type Listener = (state: StatExplainerState | null) => void;
const listeners = new Set<Listener>();
let currentState: StatExplainerState | null = null;

function emitOpen(state: StatExplainerState) {
  currentState = state;
  listeners.forEach((l) => l(state));
}

function emitClose() {
  currentState = null;
  listeners.forEach((l) => l(null));
}

function useExplainerState() {
  const [state, setState] = useState<StatExplainerState | null>(currentState);
  useEffect(() => {
    listeners.add(setState);
    return () => { listeners.delete(setState); };
  }, []);
  return state;
}

// ─── Stat Explainer Modal ─────────────────────────────────────────────────────

function RankBar({ rank, total }: { rank: number; total: number }) {
  const pct = ((total - rank) / total) * 100;
  const isGreat = pct >= 75;
  const isGood = pct >= 50;
  const isBad = pct < 25;
  const color = isGreat ? "#FFB700" : isGood ? "#22C55E" : isBad ? "#EF4444" : "#00A3A3";

  const rankWord = rank === 1 ? "1st" : rank === 2 ? "2nd" : rank === 3 ? "3rd" : `${rank}th`;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5 text-xs">
        <span className="text-muted">MLB Rank</span>
        <span className="font-bold" style={{ color }}>
          {rankWord} of {total} teams
        </span>
      </div>
      <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted mt-1">
        <span>Last</span>
        <span>League Avg</span>
        <span>Best</span>
      </div>
    </div>
  );
}

// Dedup guard: only the first-mounted instance renders the portal.
// Without this, multiple StatClickable wrappers stack identical backdrops.
const _modalInstances = new Set<symbol>();

function StatExplainerModal() {
  const id = useRef(Symbol()).current;
  const [isPortalOwner, setIsPortalOwner] = useState(false);
  const state = useExplainerState();

  useEffect(() => {
    _modalInstances.add(id);
    setIsPortalOwner(_modalInstances.size === 1);
    return () => { _modalInstances.delete(id); };
  }, [id]);

  useEffect(() => {
    if (!state) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") emitClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [state]);

  if (!isPortalOwner || !state) return null;

  const def = STAT_DEFINITIONS[state.statKey.toUpperCase()];
  if (!def) return null;

  const categoryColor = def.category === "pitching" ? "#A78BFA" : def.category === "advanced" ? "#FFB700" : "#00A3A3";
  const categoryLabel = def.category === "advanced" ? "Advanced" : def.category === "pitching" ? "Pitching" : "Hitting";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) emitClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`${def.name} explanation`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="relative w-full sm:max-w-md mx-4 sm:mx-0 bg-[#0D1929] border border-white/10 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl"
        style={{ boxShadow: `0 0 60px ${categoryColor}20` }}
      >
        {/* Close button */}
        <button
          onClick={emitClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-surface flex items-center justify-center text-muted hover:text-primary transition-colors"
          aria-label="Close"
        >
          <X size={14} />
        </button>

        {/* Category badge */}
        <span
          className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border mb-3 inline-block"
          style={{ color: categoryColor, borderColor: `${categoryColor}40`, background: `${categoryColor}12` }}
        >
          {categoryLabel}
        </span>

        {/* Stat value hero */}
        <div className="flex items-baseline gap-3 mb-1">
          <span className="text-4xl font-black tabular-nums text-primary">
            {state.value}
          </span>
          <div>
            <p className="text-lg font-black text-primary leading-none">{def.abbr}</p>
            <p className="text-xs text-muted">{def.name}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-secondary leading-relaxed mb-3">{def.description}</p>

        {/* Formula */}
        {def.formula && (
          <div className="p-2.5 bg-surface/60 rounded-lg border border-border mb-3">
            <p className="text-[9px] text-muted uppercase tracking-widest mb-0.5">Formula</p>
            <p className="text-xs font-mono text-teal">{def.formula}</p>
          </div>
        )}

        {/* League context */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {def.leagueAvg && (
            <div className="text-center p-2 bg-surface/40 rounded-lg border border-border/50">
              <p className="text-[9px] text-muted uppercase tracking-wider mb-0.5">MLB Avg</p>
              <p className="text-sm font-bold text-secondary">{def.leagueAvg}</p>
            </div>
          )}
          {def.leagueBest && (
            <div className="text-center p-2 bg-green-500/5 rounded-lg border border-green-500/20">
              <p className="text-[9px] text-muted uppercase tracking-wider mb-0.5">Best</p>
              <p className="text-sm font-bold text-green-400">{def.leagueBest}</p>
            </div>
          )}
          {def.leagueWorst && (
            <div className="text-center p-2 bg-red-500/5 rounded-lg border border-red-500/20">
              <p className="text-[9px] text-muted uppercase tracking-wider mb-0.5">Worst</p>
              <p className="text-sm font-bold text-red-400">{def.leagueWorst}</p>
            </div>
          )}
        </div>

        {/* Team rank bar */}
        {state.rank !== undefined && state.total !== undefined && (
          <RankBar rank={state.rank} total={state.total} />
        )}

        {/* Tip */}
        {def.tip && (
          <p className="text-[11px] text-muted mt-3 italic border-t border-border/30 pt-3">
            💡 {def.tip}
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}

// ─── StatClickable wrapper ────────────────────────────────────────────────────

interface StatClickableProps {
  statKey: string;
  value: string | number;
  rank?: number;
  total?: number;
  leagueAvg?: string;
  className?: string;
  children: React.ReactNode;
}

export function StatClickable({
  statKey,
  value,
  rank,
  total,
  leagueAvg,
  className,
  children,
}: StatClickableProps) {
  const hasDef = !!STAT_DEFINITIONS[statKey.toUpperCase()];
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!hasDef) return;
      emitOpen({ statKey, value, rank, total, leagueAvg });
    },
    [statKey, value, rank, total, leagueAvg, hasDef]
  );

  return (
    <>
      <div
        onClick={handleClick}
        className={cn(
          hasDef ? "cursor-pointer group" : "",
          className
        )}
        title={hasDef ? `Tap to learn about ${statKey}` : undefined}
      >
        {children}
        {hasDef && (
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[8px] text-teal/60 block -mt-0.5">
            tap for info
          </span>
        )}
      </div>
      {mounted && <StatExplainerModal />}
    </>
  );
}

// ─── Convenience: clickable stat tile ────────────────────────────────────────

interface ClickableStatTileProps {
  label: string;
  value: string | number | undefined;
  statKey?: string;
  rank?: number;
  total?: number;
  highlight?: boolean;
  className?: string;
}

export function ClickableStatTile({
  label,
  value,
  statKey,
  rank,
  total,
  highlight,
  className,
}: ClickableStatTileProps) {
  const key = statKey ?? label;
  const hasDef = !!STAT_DEFINITIONS[key.toUpperCase()];

  return (
    <StatClickable statKey={key} value={value ?? "—"} rank={rank} total={total}>
      <div
        className={cn(
          "flex flex-col gap-1 p-3 rounded-xl border transition-colors",
          highlight ? "bg-teal/5 border-teal/30" : "bg-surface-2/60 border-border",
          hasDef ? "hover:border-teal/30 hover:bg-teal/3" : "",
          className
        )}
      >
        <p className="text-[9px] uppercase tracking-widest text-muted font-semibold">{label}</p>
        <p className={cn("text-xl font-black stat-number", highlight ? "text-teal" : "text-primary")}>
          {value ?? "—"}
        </p>
        {rank !== undefined && total !== undefined && (
          <span className="text-[9px] text-muted">{rank}/{total} in MLB</span>
        )}
      </div>
    </StatClickable>
  );
}
