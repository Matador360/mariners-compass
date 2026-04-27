"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PitcherMatchupData, PitcherMatchupSide } from "@/app/api/pitcher-matchup/[gamePk]/route";

const TEAM_ID = 136;

// Simple SVG sparkline for last-5 ERA per outing
function Sparkline({ values, height = 24 }: { values: number[]; height?: number }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 0.001);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 60;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width={w} height={height} className="overflow-visible">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="rgba(0,163,163,0.7)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PitcherSide({
  side,
  isSeattle,
}: {
  side: PitcherMatchupSide;
  isSeattle: boolean;
}) {
  const stats = [
    { label: "ERA",  value: side.seasonERA },
    { label: "FIP",  value: side.seasonFIP },
    { label: "WHIP", value: side.seasonWHIP },
    { label: "K/9",  value: side.seasonK9 },
    { label: "BB/9", value: side.seasonBB9 },
    { label: "HR/9", value: side.seasonHR9 },
    { label: "IP",   value: side.seasonIP },
    { label: "W-L",  value: side.record },
  ];

  return (
    <div className={cn("flex flex-col gap-2", isSeattle && "items-end text-right")}>
      {/* Headshot + name */}
      <div className={cn("flex items-center gap-2", isSeattle && "flex-row-reverse")}>
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={side.headshotUrl}
            alt={side.fullName}
            width={52}
            height={52}
            className="rounded-full w-13 h-13 object-cover bg-white/5"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_120,q_auto:best/v1/people/generic/headshot/67/current";
            }}
          />
        </div>
        <div>
          <p className={cn("text-xs font-bold text-primary leading-tight", isSeattle && "text-teal")}>
            {side.fullName}
          </p>
          <p className="text-[9px] text-muted">
            #{side.jersey} · {side.throws}HP
          </p>
        </div>
      </div>

      {/* Stats grid — 4 per row */}
      <div className="grid grid-cols-4 gap-1">
        {stats.map(({ label, value }) => (
          <div key={label} className={cn("text-center", isSeattle && "text-center")}>
            <p className="text-[8px] text-muted uppercase tracking-wide">{label}</p>
            <p className="text-[11px] font-bold text-primary tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Last 3 ERA + sparkline */}
      <div className={cn("flex items-center gap-2", isSeattle && "flex-row-reverse")}>
        <div>
          <p className="text-[8px] text-muted uppercase">L3 ERA</p>
          <p className={cn("text-sm font-black tabular-nums",
            side.last3ERA == null ? "text-muted" :
            parseFloat(side.last3ERA) < 3.0 ? "text-green-400" :
            parseFloat(side.last3ERA) < 5.0 ? "text-amber-400" : "text-red-400"
          )}>
            {side.last3ERA ?? "—"}
          </p>
        </div>
        {side.last5Sparkline.length >= 2 && (
          <Sparkline values={side.last5Sparkline} />
        )}
      </div>

      {/* Last outing */}
      {side.lastOuting && (
        <p className="text-[9px] text-muted">
          Last:{" "}
          {side.lastOuting.gamePk ? (
            <Link href={`/game/${side.lastOuting.gamePk}`} className="hover:text-primary transition-colors">
              {side.lastOuting.ip} IP, {side.lastOuting.er} ER
            </Link>
          ) : (
            <>{side.lastOuting.ip} IP, {side.lastOuting.er} ER</>
          )}{" "}
          <span className="text-muted/60">({side.lastOuting.date})</span>
        </p>
      )}
    </div>
  );
}

function TbdSide({ label }: { label: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2 py-4 text-center">
      <div className="w-13 h-13 rounded-full bg-white/5 border border-border flex items-center justify-center">
        <span className="text-[10px] text-muted font-bold">TBD</span>
      </div>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

interface PitcherMatchupCardProps {
  gamePk: number;
  isHome: boolean;  // true if SEA is home
  awayTeamAbbrev: string;
  homeTeamAbbrev: string;
}

export function PitcherMatchupCard({
  gamePk,
  isHome,
  awayTeamAbbrev,
  homeTeamAbbrev,
}: PitcherMatchupCardProps) {
  const [data, setData] = useState<PitcherMatchupData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/pitcher-matchup/${gamePk}`)
      .then((r) => r.json())
      .then((d: PitcherMatchupData) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [gamePk]);

  // Determine which side is Seattle's
  const seaSide: PitcherMatchupSide | null | undefined = isHome ? data?.home : data?.away;
  const oppSide: PitcherMatchupSide | null | undefined = isHome ? data?.away : data?.home;

  // Edge indicator: compare FIP (lower is better for pitcher)
  let edgeChip: { text: string; color: string } | null = null;
  if (seaSide && oppSide) {
    const seaFIP = parseFloat(seaSide.seasonFIP) || 99;
    const oppFIP = parseFloat(oppSide.seasonFIP) || 99;
    const diff = seaFIP - oppFIP;
    if (Math.abs(diff) < 0.2) {
      edgeChip = { text: "Even matchup", color: "text-muted bg-surface-2 border-border" };
    } else if (diff < 0) {
      edgeChip = { text: "SEA pitching edge", color: "text-teal bg-teal/10 border-teal/30" };
    } else {
      edgeChip = { text: `${isHome ? awayTeamAbbrev : homeTeamAbbrev} pitching edge`, color: "text-amber-400 bg-amber-400/10 border-amber-400/30" };
    }
  }

  const neitherAnnounced = !loading && !data?.away && !data?.home;

  return (
    <div className="trident-card p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">Pitcher Matchup</p>
        {edgeChip && (
          <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded border", edgeChip.color)}>
            {edgeChip.text}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : neitherAnnounced ? (
        <p className="text-xs text-muted text-center py-4">
          Probable pitchers not yet announced
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 divide-x divide-border/40">
          {/* Away side */}
          <div className="pr-2">
            <p className="text-[8px] text-muted uppercase tracking-wider mb-1">{awayTeamAbbrev}</p>
            {data?.away ? (
              <PitcherSide side={data.away} isSeattle={!isHome} />
            ) : (
              <TbdSide label="TBD" />
            )}
          </div>
          {/* Home side */}
          <div className="pl-2">
            <p className="text-[8px] text-muted uppercase tracking-wider mb-1 text-right">{homeTeamAbbrev}</p>
            {data?.home ? (
              <PitcherSide side={data.home} isSeattle={isHome} />
            ) : (
              <TbdSide label="TBD" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
