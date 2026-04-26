"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export interface ComparePlayer {
  id: number;
  name: string;
  position: string;
  headshot?: string;
  isPitcher: boolean;
  stats: Record<string, number>;
  displayStats: Array<{ label: string; key: string; format?: string }>;
}

interface ComparisonToolProps {
  players: ComparePlayer[];
  className?: string;
}

// Radar chart dimensions for hitters
const HITTER_RADAR = [
  { key: "avg", label: "AVG", max: 0.35 },
  { key: "ops", label: "OPS", max: 1.1 },
  { key: "hrPer600", label: "HR/600", max: 50 },
  { key: "kPct", label: "K% (inv)", max: 30, invert: true },
  { key: "bbPct", label: "BB%", max: 15 },
  { key: "iso", label: "ISO", max: 0.3 },
];

// Radar chart dimensions for pitchers
const PITCHER_RADAR = [
  { key: "era", label: "ERA (inv)", max: 5, invert: true },
  { key: "fip", label: "FIP (inv)", max: 5, invert: true },
  { key: "kPct", label: "K%", max: 35 },
  { key: "bbPct", label: "BB% (inv)", max: 12, invert: true },
  { key: "whip", label: "WHIP (inv)", max: 1.5, invert: true },
  { key: "lob", label: "LOB%", max: 80 },
];

const PLAYER_COLORS = ["#00A3A3", "#FFB700"];

function normalize(value: number, max: number, invert: boolean): number {
  const raw = Math.min(Math.max(value, 0), max) / max;
  return Math.round((invert ? 1 - raw : raw) * 100);
}

function HeadshotBubble({ player, color }: { player: ComparePlayer; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="w-14 h-14 rounded-full overflow-hidden border-2 bg-surface-2 flex items-center justify-center"
        style={{ borderColor: color }}
      >
        {player.headshot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.headshot}
            alt={player.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <span className="text-2xl">⚾</span>
        )}
      </div>
      <div className="text-center">
        <p className="text-xs font-bold text-primary leading-tight">{player.name.split(" ").pop()}</p>
        <p className="text-[10px] text-muted">{player.position}</p>
      </div>
    </div>
  );
}

interface StatRowProps {
  label: string;
  val1: string | number;
  val2: string | number;
  higherBetter?: boolean;
}

function StatRow({ label, val1, val2, higherBetter = true }: StatRowProps) {
  const n1 = typeof val1 === "number" ? val1 : parseFloat(String(val1));
  const n2 = typeof val2 === "number" ? val2 : parseFloat(String(val2));
  const hasValues = !isNaN(n1) && !isNaN(n2);
  const p1Better = hasValues && (higherBetter ? n1 > n2 : n1 < n2);
  const p2Better = hasValues && (higherBetter ? n2 > n1 : n2 < n1);

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-1.5 border-b border-border/30 last:border-0">
      <span
        className={cn(
          "text-xs tabular-nums font-bold text-right",
          p1Better ? "text-teal" : "text-primary"
        )}
      >
        {val1}
      </span>
      <span className="text-[10px] text-muted text-center w-20">{label}</span>
      <span
        className={cn(
          "text-xs tabular-nums font-bold text-left",
          p2Better ? "text-gold" : "text-primary"
        )}
      >
        {val2}
      </span>
    </div>
  );
}

export function ComparisonTool({ players, className }: ComparisonToolProps) {
  const [selected, setSelected] = useState<[number, number]>([0, Math.min(1, players.length - 1)]);

  if (players.length < 2) {
    return (
      <div className={cn("trident-card p-5 text-center", className)}>
        <p className="text-sm text-muted">Need at least 2 players to compare.</p>
      </div>
    );
  }

  const p1 = players[selected[0]];
  const p2 = players[selected[1]];
  const radarDims = p1.isPitcher ? PITCHER_RADAR : HITTER_RADAR;

  const radarData = radarDims.map((dim) => ({
    subject: dim.label,
    [p1.name]: normalize(p1.stats[dim.key] ?? 0, dim.max, dim.invert ?? false),
    [p2.name]: normalize(p2.stats[dim.key] ?? 0, dim.max, dim.invert ?? false),
  }));

  const displayStats = p1.displayStats.length ? p1.displayStats : p2.displayStats;

  return (
    <div className={cn("trident-card p-5", className)}>
      <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-4">
        ⚔️ Player Comparison
      </p>

      {/* Player selectors */}
      {players.length > 2 && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {([0, 1] as const).map((slot) => (
            <select
              key={slot}
              value={selected[slot]}
              onChange={(e) => {
                const newIdx = Number(e.target.value);
                setSelected((prev) => {
                  const next: [number, number] = [...prev] as [number, number];
                  next[slot] = newIdx;
                  return next;
                });
              }}
              className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-xs text-primary"
            >
              {players.map((p, i) => (
                <option key={p.id} value={i}>{p.name}</option>
              ))}
            </select>
          ))}
        </div>
      )}

      {/* Headshots */}
      <div className="flex justify-between items-center mb-4 px-4">
        <HeadshotBubble player={p1} color={PLAYER_COLORS[0]} />
        <span className="text-sm font-black text-muted">VS</span>
        <HeadshotBubble player={p2} color={PLAYER_COLORS[1]} />
      </div>

      {/* Radar chart */}
      <div className="h-52 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 9 }}
            />
            <Radar
              name={p1.name}
              dataKey={p1.name}
              stroke={PLAYER_COLORS[0]}
              fill={PLAYER_COLORS[0]}
              fillOpacity={0.15}
              strokeWidth={1.5}
            />
            <Radar
              name={p2.name}
              dataKey={p2.name}
              stroke={PLAYER_COLORS[1]}
              fill={PLAYER_COLORS[1]}
              fillOpacity={0.15}
              strokeWidth={1.5}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(6,13,26,0.95)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                fontSize: 11,
              }}
              formatter={(value, name) => [`${value ?? "—"}`, String(name).split(" ").pop()!]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mb-4">
        {[p1, p2].map((p, i) => (
          <div key={p.id} className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: PLAYER_COLORS[i] }} />
            <span className="text-[10px] text-secondary">{p.name}</span>
          </div>
        ))}
      </div>

      {/* Stat-by-stat comparison */}
      <div className="mt-2">
        {displayStats.map((stat) => {
          const v1 = p1.stats[stat.key];
          const v2 = p2.stats[stat.key];
          const fmt = (v: number | undefined) => {
            if (v === undefined) return "—";
            if (stat.format === "pct") return `${(v * 100).toFixed(1)}%`;
            if (stat.format === "avg") return v.toFixed(3);
            if (stat.format === "era") return v.toFixed(2);
            return v.toFixed(stat.format === "int" ? 0 : 1);
          };
          const higherBetter = !["era", "fip", "whip", "bbPct", "kPct_pitcher"].includes(stat.key);
          return (
            <StatRow
              key={stat.key}
              label={stat.label}
              val1={fmt(v1)}
              val2={fmt(v2)}
              higherBetter={higherBetter}
            />
          );
        })}
      </div>
    </div>
  );
}

// Build ComparePlayer objects from roster data
export function buildComparePlayers(
  rosterPlayers: Array<{
    id: number;
    name: string;
    position: string;
    isPitcher: boolean;
    headshot?: string;
    seasonStats?: Record<string, number | string>;
    advancedStats?: Record<string, number>;
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
      whip: parseFloat(String(raw.whip ?? 0)),
      lob: Number(adv.lob ?? 0),
      ...adv,
    };

    const hitterDisplay = [
      { label: "AVG", key: "avg", format: "avg" },
      { label: "OPS", key: "ops", format: "avg" },
      { label: "HR", key: "homeRuns", format: "int" },
      { label: "RBI", key: "rbi", format: "int" },
      { label: "SB", key: "stolenBases", format: "int" },
      { label: "K%", key: "kPct", format: "pct" },
      { label: "BB%", key: "bbPct", format: "pct" },
      { label: "ISO", key: "iso", format: "avg" },
      { label: "BABIP", key: "babip", format: "avg" },
    ];

    const pitcherDisplay = [
      { label: "ERA", key: "era", format: "era" },
      { label: "FIP", key: "fip", format: "era" },
      { label: "WHIP", key: "whip", format: "era" },
      { label: "K%", key: "kPct", format: "pct" },
      { label: "BB%", key: "bbPct", format: "pct" },
      { label: "K/BB", key: "kbb", format: "era" },
      { label: "LOB%", key: "lob", format: "pct" },
      { label: "HR/9", key: "hr9", format: "era" },
    ];

    // Merge raw numeric stats
    for (const [k, v] of Object.entries(raw)) {
      const n = parseFloat(String(v));
      if (!isNaN(n)) stats[k] = n;
    }

    return {
      id: p.id,
      name: p.name,
      position: p.position,
      headshot: p.headshot,
      isPitcher: p.isPitcher,
      stats,
      displayStats: p.isPitcher ? pitcherDisplay : hitterDisplay,
    };
  });
}
