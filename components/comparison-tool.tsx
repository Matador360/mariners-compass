"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import {
  normalize,
  hasSmallSample,
  HITTER_DIMENSIONS,
  PITCHER_DIMENSIONS,
  ALL_HITTER_DIMENSIONS,
  ALL_PITCHER_DIMENSIONS,
  type DimensionDef,
} from "@/lib/compare";
import { DimensionPicker } from "@/components/dimension-picker";
import { TwinFinder, type TwinFinderPlayer } from "@/components/twin-finder";

export interface ComparePlayer {
  id: number;
  name: string;
  position: string;
  headshot?: string;
  isPitcher: boolean;
  stats: Record<string, number>;
  displayStats: Array<{ label: string; key: string; format?: string }>;
  isGhost?: boolean;
  ghostYear?: number;
}

interface ComparisonToolProps {
  players: ComparePlayer[];
  className?: string;
}

const PLAYER_COLORS = ["#00A3A3", "#FFB700", "#a855f7", "#22d3ee", "#f43f5e"];
const MAX_SELECTED = 5;

// ─── Headshot bubble ─────────────────────────────────────────────────────────

function HeadshotBubble({ player, color, onRemove }: {
  player: ComparePlayer;
  color: string;
  onRemove?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1 relative">
      <div
        className="w-12 h-12 rounded-full overflow-hidden border-2 bg-surface-2 flex items-center justify-center"
        style={{ borderColor: color }}
      >
        {player.headshot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.headshot}
            alt={player.name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <span className="text-xl">{player.isGhost ? "👻" : "⚾"}</span>
        )}
      </div>
      <div className="text-center">
        <p className="text-[10px] font-bold text-primary leading-tight truncate max-w-[64px]">
          {player.name.split(" ").slice(-1)[0]}
          {player.isGhost && <span className="text-muted/60 ml-0.5">'{player.ghostYear?.toString().slice(2)}</span>}
        </p>
        <p className="text-[9px] text-muted">{player.position}</p>
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-surface text-muted hover:text-red-400 border border-border text-[9px] flex items-center justify-center transition-colors"
        >
          ×
        </button>
      )}
    </div>
  );
}

// ─── Player picker ────────────────────────────────────────────────────────────

function PlayerPicker({
  pool, selected, onToggle, ghostFilter, setGhostFilter,
}: {
  pool: ComparePlayer[];
  selected: ComparePlayer[];
  onToggle: (p: ComparePlayer) => void;
  ghostFilter: "active" | "ghosts" | "both";
  setGhostFilter: (f: "active" | "ghosts" | "both") => void;
}) {
  const [search, setSearch] = useState("");
  const lockedType = selected.length > 0 ? selected[0].isPitcher : null;

  const visible = useMemo(() => {
    return pool.filter((p) => {
      if (ghostFilter === "active" && p.isGhost) return false;
      if (ghostFilter === "ghosts" && !p.isGhost) return false;
      if (lockedType !== null && p.isPitcher !== lockedType) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [pool, ghostFilter, lockedType, search]);

  return (
    <div className="space-y-2">
      {/* Ghost filter chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {(["active", "ghosts", "both"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setGhostFilter(f)}
            className={cn(
              "text-[9px] font-bold px-2 py-0.5 rounded-full border transition-colors",
              ghostFilter === f
                ? "bg-teal/20 border-teal text-teal"
                : "border-border text-muted hover:border-border-accent"
            )}
          >
            {f === "active" ? "Active" : f === "ghosts" ? "👻 2001" : "Both"}
          </button>
        ))}
        {lockedType !== null && (
          <span className="text-[9px] text-amber-400/80 ml-1">
            locked to {lockedType ? "pitchers" : "hitters"}
          </span>
        )}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="ml-auto bg-surface-2 border border-border rounded px-2 py-0.5 text-xs text-primary placeholder:text-muted/40 w-28 focus:outline-none focus:border-teal/40"
        />
      </div>
      {/* Player grid */}
      <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1">
        {visible.map((p) => {
          const isSelected = selected.some((s) => s.id === p.id);
          const isFull = selected.length >= MAX_SELECTED && !isSelected;
          const smallSample = hasSmallSample(p);
          return (
            <button
              key={p.id}
              onClick={() => !isFull && onToggle(p)}
              disabled={isFull}
              className={cn(
                "w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors",
                isSelected
                  ? "bg-teal/10 border border-teal/30"
                  : "hover:bg-surface-2 border border-transparent",
                isFull && "opacity-40 cursor-not-allowed"
              )}
            >
              <span className="shrink-0">
                {p.isGhost ? "👻" : isSelected ? "✓" : "·"}
              </span>
              <span className="flex-1 font-medium text-primary truncate">
                {p.name}
              </span>
              <span className="text-[9px] text-muted shrink-0">{p.position}</span>
              {smallSample && (
                <span className="text-[9px] text-amber-400 shrink-0" title="Small sample size">⚠️</span>
              )}
            </button>
          );
        })}
        {visible.length === 0 && (
          <p className="text-xs text-muted/60 text-center py-3">No players match</p>
        )}
      </div>
    </div>
  );
}

// ─── Multi stat row ───────────────────────────────────────────────────────────

function MultiStatRow({
  label,
  statKey,
  values,
  higherBetter,
  dims,
}: {
  label: string;
  statKey: string;
  values: (number | undefined)[];
  higherBetter: boolean;
  dims: DimensionDef[];
}) {
  const nums = values.map((v) => (v !== undefined && !isNaN(v) ? v : null));
  const valid = nums.filter((v): v is number => v !== null);
  const leader = valid.length > 0
    ? higherBetter ? Math.max(...valid) : Math.min(...valid)
    : null;

  // Find DimensionDef for percentile bar width
  const dimDef = dims.find((d) => d.key === statKey);

  function fmt(v: number | null): string {
    if (v === null) return "—";
    if (["avg", "ops", "obp", "slg", "iso", "babip", "woba"].includes(statKey))
      return v.toFixed(3).replace(/^0\./, ".");
    if (["era", "fip", "xfip", "whip", "kbb", "hr9", "lob", "gbPct"].includes(statKey))
      return v.toFixed(2);
    if (["kPct", "bbPct", "sbPct", "xbhPct"].includes(statKey))
      return `${(v * 100).toFixed(1)}%`;
    if (["wrcPlus"].includes(statKey))
      return Math.round(v).toString();
    if (["hrPer600", "runsPer27"].includes(statKey))
      return v.toFixed(1);
    return Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1);
  }

  return (
    <div className="grid items-center py-1 border-b border-border/20 last:border-0 gap-x-2"
      style={{ gridTemplateColumns: `5rem repeat(${values.length}, 1fr)` }}
    >
      <span className="text-[9px] text-muted uppercase tracking-wide truncate">{label}</span>
      {nums.map((v, i) => {
        const isLeader = v !== null && v === leader && valid.length > 1;
        const barPct = dimDef && v !== null
          ? Math.round(normalize(v, dimDef.key, dimDef.higherIsBetter) * 100)
          : 0;
        return (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <span className={cn(
              "text-[11px] tabular-nums font-bold",
              isLeader ? "text-teal" : "text-primary"
            )}>
              {isLeader && <span className="text-[8px] mr-0.5">●</span>}
              {fmt(v)}
            </span>
            {dimDef && v !== null && (
              <div className="w-full h-0.5 rounded-full bg-white/8">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${barPct}%`,
                    backgroundColor: PLAYER_COLORS[i] ?? "#00A3A3",
                    opacity: 0.7,
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── LocalStorage dims helper ─────────────────────────────────────────────────

function loadDims(type: "hitter" | "pitcher"): DimensionDef[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`trident:compare:dims:${type}`);
    if (!raw) return null;
    const keys: string[] = JSON.parse(raw);
    const allDims = type === "hitter" ? ALL_HITTER_DIMENSIONS : ALL_PITCHER_DIMENSIONS;
    const result = allDims.filter((d) => keys.includes(d.key));
    return result.length >= 3 ? result : null;
  } catch {
    return null;
  }
}

function saveDims(type: "hitter" | "pitcher", dims: DimensionDef[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`trident:compare:dims:${type}`, JSON.stringify(dims.map((d) => d.key)));
  } catch { /* ignore */ }
}

// ─── Main ComparisonTool ──────────────────────────────────────────────────────

export function ComparisonTool({ players, className }: ComparisonToolProps) {
  const [selected, setSelected] = useState<ComparePlayer[]>([]);
  const [ghostFilter, setGhostFilter] = useState<"active" | "ghosts" | "both">("active");
  const [hitterDims, setHitterDimsState] = useState<DimensionDef[]>(HITTER_DIMENSIONS);
  const [pitcherDims, setPitcherDimsState] = useState<DimensionDef[]>(PITCHER_DIMENSIONS);

  // Hydrate dims from localStorage after mount
  useEffect(() => {
    const hd = loadDims("hitter");
    if (hd) setHitterDimsState(hd);
    const pd = loadDims("pitcher");
    if (pd) setPitcherDimsState(pd);
  }, []);

  const lockedType = selected.length > 0 ? selected[0].isPitcher : null;
  const dims = lockedType ? pitcherDims : hitterDims;
  const allDims = lockedType ? ALL_PITCHER_DIMENSIONS : ALL_HITTER_DIMENSIONS;
  const dimsStorageKey = `trident:compare:dims:${lockedType ? "pitcher" : "hitter"}`;

  function setDims(next: DimensionDef[]) {
    if (lockedType) {
      setPitcherDimsState(next);
      saveDims("pitcher", next);
    } else {
      setHitterDimsState(next);
      saveDims("hitter", next);
    }
  }

  function togglePlayer(p: ComparePlayer) {
    setSelected((prev) => {
      const isIn = prev.some((s) => s.id === p.id);
      if (isIn) return prev.filter((s) => s.id !== p.id);
      if (prev.length >= MAX_SELECTED) return prev;
      return [...prev, p];
    });
  }

  const displayStats = useMemo(() => {
    if (selected.length === 0) return [];
    return selected[0].displayStats.length ? selected[0].displayStats : selected[1]?.displayStats ?? [];
  }, [selected]);

  // Radar data over selected dims
  const radarData = useMemo(() => {
    return dims.map((dim) => {
      const entry: Record<string, number | string> = { subject: dim.label };
      selected.forEach((p) => {
        const val = p.stats[dim.key] ?? 0;
        entry[p.id.toString()] = Math.round(normalize(val, dim.key, dim.higherIsBetter) * 100);
      });
      return entry;
    });
  }, [dims, selected]);

  const twinPool: TwinFinderPlayer[] = players;
  const selectedIds = new Set(selected.map((p) => p.id));

  if (players.length < 2) {
    return (
      <div className={cn("trident-card p-5 text-center", className)}>
        <p className="text-sm text-muted">Need at least 2 players to compare.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Picker card */}
      <div className="trident-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">
            Select Players
            <span className="ml-1.5 text-muted/60">({selected.length}/{MAX_SELECTED})</span>
          </p>
          {selected.length > 0 && (
            <button
              onClick={() => setSelected([])}
              className="text-[9px] text-muted/60 hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Selected chips row */}
        {selected.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            {selected.map((p, i) => (
              <HeadshotBubble
                key={p.id}
                player={p}
                color={PLAYER_COLORS[i]}
                onRemove={() => togglePlayer(p)}
              />
            ))}
          </div>
        )}

        <PlayerPicker
          pool={players}
          selected={selected}
          onToggle={togglePlayer}
          ghostFilter={ghostFilter}
          setGhostFilter={setGhostFilter}
        />
      </div>

      {selected.length < 2 ? (
        <div className="trident-card p-6 text-center">
          <p className="text-sm text-muted">Select at least 2 players to compare.</p>
        </div>
      ) : (
        <>
          {/* Radar + dimension picker */}
          <div className="trident-card p-4 space-y-3">
            <DimensionPicker
              all={allDims}
              selected={dims}
              onChange={setDims}
              storageKey={dimsStorageKey}
            />

            {/* Radar chart */}
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 0, right: 24, bottom: 0, left: 24 }}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 9 }}
                  />
                  {selected.map((p, i) => (
                    <Radar
                      key={p.id}
                      name={p.name}
                      dataKey={p.id.toString()}
                      stroke={PLAYER_COLORS[i]}
                      fill={PLAYER_COLORS[i]}
                      fillOpacity={0.25}
                      strokeWidth={1.5}
                    />
                  ))}
                  <Tooltip
                    contentStyle={{
                      background: "rgba(6,13,26,0.95)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                    formatter={(value, name) => [`${value}`, String(name).split(" ").pop()!]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-1">
              {selected.map((p, i) => {
                const small = hasSmallSample(p);
                return (
                  <div key={p.id} className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: PLAYER_COLORS[i] }} />
                    <span className="text-[10px] text-secondary">
                      {p.isGhost ? "👻 " : ""}{p.name}
                    </span>
                    {small && <span className="text-[9px] text-amber-400" title="Small sample">⚠️</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stat table */}
          <div className="trident-card p-4">
            <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-3">
              Stat Breakdown
            </p>
            {/* Header */}
            <div className="grid items-center mb-2 gap-x-2"
              style={{ gridTemplateColumns: `5rem repeat(${selected.length}, 1fr)` }}
            >
              <span />
              {selected.map((p, i) => (
                <div key={p.id} className="text-center">
                  <div className="w-1.5 h-1.5 rounded-full mx-auto mb-0.5" style={{ backgroundColor: PLAYER_COLORS[i] }} />
                  <p className="text-[9px] text-muted truncate">{p.name.split(" ").pop()}</p>
                </div>
              ))}
            </div>
            {displayStats.map((stat) => {
              const higherBetter = !["era", "fip", "xfip", "whip", "bbPct", "kPct"].includes(stat.key);
              return (
                <MultiStatRow
                  key={stat.key}
                  label={stat.label}
                  statKey={stat.key}
                  values={selected.map((p) => p.stats[stat.key])}
                  higherBetter={higherBetter}
                  dims={dims}
                />
              );
            })}
          </div>

          {/* Twin Finder */}
          <TwinFinder
            primary={selected[0] ?? null}
            pool={twinPool}
            dims={dims}
            onAdd={(p) => {
              const full = players.find((x) => x.id === p.id);
              if (full) togglePlayer(full);
            }}
            alreadySelected={selectedIds}
          />
        </>
      )}
    </div>
  );
}

// ─── buildComparePlayers ──────────────────────────────────────────────────────

export function buildComparePlayers(
  rosterPlayers: Array<{
    id: number;
    name: string;
    position: string;
    isPitcher: boolean;
    headshot?: string;
    seasonStats?: Record<string, number | string>;
    advancedStats?: Record<string, number>;
    isGhost?: boolean;
    ghostYear?: number;
  }>
): ComparePlayer[] {
  return rosterPlayers.map((p) => {
    const raw = p.seasonStats ?? {};
    const adv = p.advancedStats ?? {};

    const stats: Record<string, number> = {
      avg: parseFloat(String(raw.avg ?? raw.battingAverage ?? 0)),
      ops: parseFloat(String(raw.ops ?? 0)),
      hrPer600: ((Number(raw.homeRuns ?? 0) / Math.max(Number(raw.plateAppearances ?? 1), 1)) * 600),
      kPct: Number(adv.kPct ?? 0),
      bbPct: Number(adv.bbPct ?? 0),
      iso: Number(adv.iso ?? 0),
      babip: Number(adv.babip ?? 0),
      era: parseFloat(String(raw.era ?? raw.earnedRunAverage ?? 0)),
      fip: Number(adv.fip ?? 0),
      xfip: Number(adv.xfip ?? 0),
      whip: parseFloat(String(raw.whip ?? 0)),
      lob: Number(adv.lob ?? 0),
      kbb: Number(adv.kbb ?? 0),
      hr9: Number(adv.hr9 ?? 0),
      gbPct: Number(adv.gbPct ?? 0),
      woba: Number(adv.woba ?? 0),
      wrcPlus: Number(adv.wrcPlus ?? 0),
      sbPct: Number(adv.sbPct ?? 0),
      xbhPct: Number(adv.xbhPct ?? 0),
      runsPer27: Number(adv.runsPer27 ?? 0),
      ...adv,
    };

    for (const [k, v] of Object.entries(raw)) {
      const n = parseFloat(String(v));
      if (!isNaN(n)) stats[k] = n;
    }

    const hitterDisplay = [
      { label: "AVG",   key: "avg",          format: "avg" },
      { label: "OPS",   key: "ops",          format: "avg" },
      { label: "HR",    key: "homeRuns",      format: "int" },
      { label: "RBI",   key: "rbi",          format: "int" },
      { label: "SB",    key: "stolenBases",  format: "int" },
      { label: "K%",    key: "kPct",         format: "pct" },
      { label: "BB%",   key: "bbPct",        format: "pct" },
      { label: "ISO",   key: "iso",          format: "avg" },
      { label: "BABIP", key: "babip",        format: "avg" },
      { label: "wOBA",  key: "woba",         format: "avg" },
      { label: "wRC+",  key: "wrcPlus",      format: "int" },
    ];

    const pitcherDisplay = [
      { label: "ERA",   key: "era",   format: "era" },
      { label: "FIP",   key: "fip",   format: "era" },
      { label: "xFIP",  key: "xfip",  format: "era" },
      { label: "WHIP",  key: "whip",  format: "era" },
      { label: "K%",    key: "kPct",  format: "pct" },
      { label: "BB%",   key: "bbPct", format: "pct" },
      { label: "K/BB",  key: "kbb",   format: "era" },
      { label: "LOB%",  key: "lob",   format: "pct" },
      { label: "HR/9",  key: "hr9",   format: "era" },
    ];

    return {
      id: p.id,
      name: p.name,
      position: p.position,
      headshot: p.headshot,
      isPitcher: p.isPitcher,
      stats,
      displayStats: p.isPitcher ? pitcherDisplay : hitterDisplay,
      isGhost: p.isGhost,
      ghostYear: p.ghostYear,
    };
  });
}
