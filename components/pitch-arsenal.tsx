"use client";

import { cn } from "@/lib/utils";
import { SparkBar } from "./sparkline";

export interface PitchType {
  name: string;
  code: string;
  usagePct: number;
  avgVelo: number;
  maxVelo: number;
  avgSpin?: number;
  strikeoutPct: number;
  whiffPct: number;
  putAwayPct: number; // strikeout% when 2 strikes
  color: string;
}

interface PitchArsenalProps {
  pitches: PitchType[];
  pitcherName?: string;
  className?: string;
}

// Pitch type color palette
const PITCH_COLORS: Record<string, string> = {
  FF: "#EF4444", // 4-seam fastball — red
  SI: "#F97316", // sinker — orange
  FC: "#F59E0B", // cutter — amber
  SL: "#22C55E", // slider — green
  SW: "#10B981", // sweeper — emerald
  CU: "#3B82F6", // curveball — blue
  CH: "#8B5CF6", // changeup — violet
  FS: "#EC4899", // splitter — pink
  KC: "#06B6D4", // knuckle-curve — cyan
  KN: "#6B7280", // knuckleball — gray
  SC: "#84CC16", // screwball — lime
  FO: "#A78BFA", // forkball — purple
};

const PITCH_NAMES: Record<string, string> = {
  FF: "4-Seam FB",
  SI: "Sinker",
  FC: "Cutter",
  SL: "Slider",
  SW: "Sweeper",
  CU: "Curveball",
  CH: "Changeup",
  FS: "Splitter",
  KC: "Knuckle-Curve",
  KN: "Knuckleball",
  SC: "Screwball",
  FO: "Forkball",
};

function veloColor(velo: number): string {
  if (velo >= 97) return "#EF4444";
  if (velo >= 94) return "#F97316";
  if (velo >= 90) return "#FFB700";
  if (velo >= 85) return "#22C55E";
  return "#60A5FA";
}

function WhiffBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-secondary w-8 text-right">
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

export function PitchArsenal({ pitches, pitcherName, className }: PitchArsenalProps) {
  if (!pitches.length) return null;

  const sorted = [...pitches].sort((a, b) => b.usagePct - a.usagePct);
  const primary = sorted[0];

  return (
    <div className={cn("trident-card p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">
          🎳 Pitch Arsenal
        </p>
        {pitcherName && (
          <p className="text-[10px] text-muted">{pitches.length} pitch types</p>
        )}
      </div>

      {/* Usage donut-style breakdown */}
      <div className="flex gap-1.5 mb-4 h-2 rounded-full overflow-hidden">
        {sorted.map((p) => (
          <div
            key={p.code}
            className="h-full rounded-full transition-all"
            style={{ width: `${p.usagePct}%`, backgroundColor: p.color || PITCH_COLORS[p.code] || "#6B7280" }}
            title={`${p.name || PITCH_NAMES[p.code] || p.code}: ${p.usagePct.toFixed(1)}%`}
          />
        ))}
      </div>

      {/* Pitch rows */}
      <div className="space-y-3">
        {sorted.map((p) => {
          const color = p.color || PITCH_COLORS[p.code] || "#6B7280";
          const name = p.name || PITCH_NAMES[p.code] || p.code;
          const isPrimary = p.code === primary.code;

          return (
            <div key={p.code} className={cn(
              "p-2.5 rounded-lg border",
              isPrimary ? "border-border-accent bg-surface-2/60" : "border-border bg-surface/40"
            )}>
              <div className="flex items-center gap-2 mb-2">
                {/* Color dot + name */}
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs font-bold text-primary flex-1">{name}</span>
                <span className="text-[10px] text-muted font-mono">{p.code}</span>
                {isPrimary && (
                  <span className="text-[9px] uppercase tracking-wider text-gold font-black">Primary</span>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2 mb-2">
                {/* Usage */}
                <div className="text-center">
                  <p className="text-sm font-black tabular-nums" style={{ color }}>
                    {p.usagePct.toFixed(1)}%
                  </p>
                  <p className="text-[9px] text-muted">Usage</p>
                </div>
                {/* Velocity */}
                <div className="text-center">
                  <p className="text-sm font-black tabular-nums" style={{ color: veloColor(p.avgVelo) }}>
                    {p.avgVelo.toFixed(1)}
                  </p>
                  <p className="text-[9px] text-muted">Avg MPH</p>
                </div>
                {/* Max Velo */}
                <div className="text-center">
                  <p className="text-sm font-black tabular-nums text-secondary">
                    {p.maxVelo.toFixed(1)}
                  </p>
                  <p className="text-[9px] text-muted">Max MPH</p>
                </div>
                {/* K% */}
                <div className="text-center">
                  <p className="text-sm font-black tabular-nums text-green-400">
                    {p.strikeoutPct.toFixed(0)}%
                  </p>
                  <p className="text-[9px] text-muted">K%</p>
                </div>
              </div>

              {/* Whiff bar */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-[9px] text-muted w-12 shrink-0">Whiff%</p>
                  <WhiffBar pct={p.whiffPct} color={color} />
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-[9px] text-muted w-12 shrink-0">PutAway</p>
                  <WhiffBar pct={p.putAwayPct} color="#22C55E" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Build pitch arsenal from MLB Stats API pitcher data
export function buildPitchArsenal(pitcherStats: {
  pitchMixBreakdown?: Array<{
    pitchCode?: string;
    pitchName?: string;
    pitchPercentage?: number;
    averageSpeed?: number;
    maxSpeed?: number;
    averageSpin?: number;
    strikeoutPercentage?: number;
    whiffPercentage?: number;
    putAwayPercentage?: number;
  }>;
  season?: {
    fourSeamFastball?: number;
    twoSeamFastball?: number;
    slider?: number;
    curveball?: number;
    changeup?: number;
    cutter?: number;
    sinker?: number;
    splitter?: number;
    averageSpeed?: number;
    strikeOuts?: number;
    battersFaced?: number;
  };
}): PitchType[] {
  // If we have full pitch mix data, use it
  if (pitcherStats.pitchMixBreakdown?.length) {
    return pitcherStats.pitchMixBreakdown
      .filter((p) => (p.pitchPercentage ?? 0) > 1)
      .map((p) => ({
        code: p.pitchCode ?? "??",
        name: p.pitchName ?? PITCH_NAMES[p.pitchCode ?? ""] ?? p.pitchCode ?? "Unknown",
        usagePct: p.pitchPercentage ?? 0,
        avgVelo: p.averageSpeed ?? 88,
        maxVelo: p.maxSpeed ?? 92,
        avgSpin: p.averageSpin,
        strikeoutPct: p.strikeoutPercentage ?? 0,
        whiffPct: p.whiffPercentage ?? 0,
        putAwayPct: p.putAwayPercentage ?? 0,
        color: PITCH_COLORS[p.pitchCode ?? ""] ?? "#6B7280",
      }))
      .sort((a, b) => b.usagePct - a.usagePct);
  }

  // Fallback: estimate from season totals
  const s = pitcherStats.season;
  if (!s) return [];

  const pitches: PitchType[] = [];
  const baseVelo = s.averageSpeed ?? 91;

  if (s.fourSeamFastball && s.fourSeamFastball > 0) {
    pitches.push({ code: "FF", name: "4-Seam FB", usagePct: s.fourSeamFastball, avgVelo: baseVelo, maxVelo: baseVelo + 3, strikeoutPct: 22, whiffPct: 18, putAwayPct: 28, color: PITCH_COLORS.FF });
  }
  if (s.sinker && s.sinker > 0) {
    pitches.push({ code: "SI", name: "Sinker", usagePct: s.sinker, avgVelo: baseVelo - 1, maxVelo: baseVelo + 2, strikeoutPct: 15, whiffPct: 12, putAwayPct: 20, color: PITCH_COLORS.SI });
  }
  if (s.cutter && s.cutter > 0) {
    pitches.push({ code: "FC", name: "Cutter", usagePct: s.cutter, avgVelo: baseVelo - 4, maxVelo: baseVelo - 1, strikeoutPct: 20, whiffPct: 22, putAwayPct: 30, color: PITCH_COLORS.FC });
  }
  if (s.slider && s.slider > 0) {
    pitches.push({ code: "SL", name: "Slider", usagePct: s.slider, avgVelo: baseVelo - 8, maxVelo: baseVelo - 5, strikeoutPct: 28, whiffPct: 35, putAwayPct: 38, color: PITCH_COLORS.SL });
  }
  if (s.curveball && s.curveball > 0) {
    pitches.push({ code: "CU", name: "Curveball", usagePct: s.curveball, avgVelo: baseVelo - 12, maxVelo: baseVelo - 9, strikeoutPct: 25, whiffPct: 30, putAwayPct: 35, color: PITCH_COLORS.CU });
  }
  if (s.changeup && s.changeup > 0) {
    pitches.push({ code: "CH", name: "Changeup", usagePct: s.changeup, avgVelo: baseVelo - 10, maxVelo: baseVelo - 7, strikeoutPct: 22, whiffPct: 28, putAwayPct: 32, color: PITCH_COLORS.CH });
  }
  if (s.splitter && s.splitter > 0) {
    pitches.push({ code: "FS", name: "Splitter", usagePct: s.splitter, avgVelo: baseVelo - 7, maxVelo: baseVelo - 4, strikeoutPct: 26, whiffPct: 38, putAwayPct: 42, color: PITCH_COLORS.FS });
  }

  return pitches.sort((a, b) => b.usagePct - a.usagePct);
}
