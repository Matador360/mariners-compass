"use client";

import { cn } from "@/lib/utils";
import type { RelieverProfile, FatigueStatus } from "@/lib/bullpen";

const ROLE_COLORS: Record<string, string> = {
  Closer: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  Setup: "bg-teal/15 text-teal border border-teal/20",
  "High-leverage": "bg-blue-500/15 text-blue-300 border border-blue-500/20",
  Long: "bg-purple-500/15 text-purple-300 border border-purple-500/20",
  LOOGY: "bg-pink-500/15 text-pink-300 border border-pink-500/20",
  "Mop-up": "bg-white/5 text-muted border border-white/10",
  Middle: "bg-white/5 text-muted border border-white/10",
};

const FATIGUE_DOT: Record<FatigueStatus, string> = {
  red: "bg-red-500",
  yellow: "bg-amber-400",
  green: "bg-green-500",
  unknown: "bg-white/20",
};

const FATIGUE_RING: Record<FatigueStatus, string> = {
  red: "ring-red-500/40",
  yellow: "ring-amber-400/40",
  green: "ring-green-500/20",
  unknown: "ring-white/10",
};

interface RelieverCardProps {
  reliever: RelieverProfile;
  compact?: boolean;
}

function Last5Chips({ logs }: { logs: RelieverProfile["last5"] }) {
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="flex gap-1">
      {sorted.map((g, i) => {
        const clean = g.earnedRuns === 0;
        return (
          <span
            key={i}
            title={`${g.date}: ${g.inningsPitched.toFixed(1)} IP, ${g.earnedRuns} ER`}
            className={cn(
              "w-4 h-4 rounded-sm text-[8px] font-bold flex items-center justify-center",
              clean
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            )}
          >
            {g.inningsPitched < 1 ? "⅓" : g.inningsPitched.toFixed(0)}
          </span>
        );
      })}
      {sorted.length === 0 && (
        <span className="text-[9px] text-muted/40">no recent outings</span>
      )}
    </div>
  );
}

export function RelieverCard({ reliever, compact = false }: RelieverCardProps) {
  const { season, fatigue, role, name, number, last5 } = reliever;
  const headshotUrl = `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_56,q_auto:best/v1/people/${reliever.id}/headshot/67/current`;

  return (
    <div
      className={cn(
        "trident-card p-3 flex flex-col gap-2",
        `ring-1 ${FATIGUE_RING[fatigue.status]}`
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        {/* Headshot */}
        <div className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={headshotUrl}
            alt={name}
            width={compact ? 40 : 56}
            height={compact ? 40 : 56}
            className="rounded-full object-cover bg-white/5"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_56,q_auto:best/v1/people/generic/headshot/67/current";
            }}
          />
          {/* Fatigue dot */}
          <span
            className={cn(
              "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface",
              FATIGUE_DOT[fatigue.status]
            )}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-primary truncate leading-tight">
            #{number} {name}
          </p>
          <span
            className={cn(
              "inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded mt-0.5",
              ROLE_COLORS[role] ?? ROLE_COLORS.Middle
            )}
          >
            {role}
          </span>
        </div>
      </div>

      {/* Season stats row */}
      <div className="grid grid-cols-4 gap-1 text-center">
        {[
          { label: "ERA", value: season.era > 0 ? season.era.toFixed(2) : "—" },
          { label: "IP", value: season.inningsPitched > 0 ? season.inningsPitched.toFixed(1) : "—" },
          { label: "K", value: season.strikeOuts > 0 ? season.strikeOuts.toString() : "—" },
          { label: "SV", value: season.saves.toString() },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-[9px] text-muted uppercase tracking-wider">{label}</p>
            <p className="text-xs font-bold text-primary tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Fatigue info */}
      {!compact && (
        <div className="flex items-center gap-2 text-[9px] text-muted">
          <span>{fatigue.pitches3d}p / 3d</span>
          {fatigue.threeInRow && <span className="text-red-400 font-bold">3-in-row</span>}
          {!fatigue.threeInRow && fatigue.backToBack && (
            <span className="text-amber-400 font-bold">B2B</span>
          )}
        </div>
      )}

      {/* Last 5 chips */}
      {!compact && <Last5Chips logs={last5} />}
    </div>
  );
}
