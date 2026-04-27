"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildBumpSeries,
  type BumpSeries,
  type RankSnapshotSet,
} from "@/lib/rank-history";

const LINE_PALETTE = ["#00A3A3", "#FFB700", "#A855F7", "#06B6D4", "#F43F5E"];

interface RankBumpChartProps {
  snapshots: RankSnapshotSet[];
  highlight?: number;
  height?: number;
}

function abbrev(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name.slice(0, 7);
  return `${parts[0][0]}.${parts[parts.length - 1].slice(0, 6)}`;
}

function daysBetween(a: string, b: string): number {
  const t1 = new Date(a).getTime();
  const t2 = new Date(b).getTime();
  return Math.round((t2 - t1) / (24 * 60 * 60 * 1000));
}

export function RankBumpChart({ snapshots, highlight, height = 260 }: RankBumpChartProps) {
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const ordered = useMemo(
    () => [...snapshots].sort((a, b) => a.date.localeCompare(b.date)),
    [snapshots],
  );

  const bump = useMemo(() => buildBumpSeries(ordered), [ordered]);

  if (ordered.length < 2 || !bump.length) return null;

  const latest = ordered[ordered.length - 1];
  const topN = isMobile ? 3 : 5;
  const topIds = new Set(latest.players.slice(0, topN).map((p) => p.playerId));
  const rankLookup = latest.players.reduce<Record<number, number>>((acc, p, i) => {
    acc[p.playerId] = i;
    return acc;
  }, {});

  const maxRank = Math.max(
    1,
    ...bump.flatMap((s) => s.series.map((e) => (e.rank ?? 0))),
  );

  const w = 480;
  const effectiveHeight = isMobile ? 180 : height;
  const padX = 40;
  const padY = 22;
  const colWidth = (w - padX * 2) / Math.max(1, ordered.length - 1);
  const innerH = effectiveHeight - padY * 2;

  const xAt = (i: number) => padX + i * colWidth;
  const yAt = (rank: number | null) =>
    rank == null ? null : padY + ((rank - 1) / Math.max(1, maxRank - 1)) * innerH;

  function lineFor(series: BumpSeries["series"]): string {
    let d = "";
    let started = false;
    series.forEach((s, i) => {
      const yy = yAt(s.rank);
      if (yy == null) {
        started = false;
        return;
      }
      d += `${started ? "L" : "M"} ${xAt(i).toFixed(1)} ${yy.toFixed(1)} `;
      started = true;
    });
    return d.trim();
  }

  function paletteColor(playerId: number): string {
    if (highlight === playerId) return "#00A3A3";
    const i = rankLookup[playerId];
    if (i != null && i < LINE_PALETTE.length && i < topN) return LINE_PALETTE[i];
    return "rgba(148,163,184,0.35)";
  }

  const muted = bump.filter((s) => !topIds.has(s.playerId) && highlight !== s.playerId);
  const colored = bump.filter((s) => topIds.has(s.playerId) || highlight === s.playerId);

  const hoverInfo = hoverId != null ? bump.find((b) => b.playerId === hoverId) : null;
  const hoverFirst = hoverInfo?.series.find((s) => s.rank != null);
  const hoverLast = hoverInfo
    ? [...hoverInfo.series].reverse().find((s) => s.rank != null)
    : null;
  const delta =
    hoverFirst && hoverLast ? (hoverFirst.rank ?? 0) - (hoverLast.rank ?? 0) : 0;
  const oldestDate = ordered[0].date;
  const newestDate = ordered[ordered.length - 1].date;
  const daysSpan = daysBetween(oldestDate, newestDate);

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-sm font-bold text-primary">
          Rank movement, last {daysSpan}d
        </h2>
        <span className="text-[10px] text-muted">oldest → today</span>
      </div>
      <svg
        viewBox={`0 0 ${w} ${effectiveHeight}`}
        className="w-full"
        role="img"
        aria-label="Bump chart of player rank movement over time"
      >
        {[1, Math.max(2, Math.ceil(maxRank / 2)), maxRank].map((rk) => {
          const yy = yAt(rk);
          if (yy == null) return null;
          return (
            <g key={`grid-${rk}`}>
              <line
                x1={padX}
                x2={w - padX}
                y1={yy}
                y2={yy}
                stroke="rgba(148,163,184,0.10)"
                strokeDasharray="2 3"
              />
              <text
                x={padX - 6}
                y={yy + 3}
                textAnchor="end"
                fontSize="9"
                fill="rgb(148,163,184)"
              >
                {rk}
              </text>
            </g>
          );
        })}

        {ordered.map((s, i) => {
          const days = daysBetween(s.date, newestDate);
          return (
            <text
              key={`xlabel-${s.date}`}
              x={xAt(i)}
              y={effectiveHeight - 4}
              textAnchor="middle"
              fontSize="9"
              fill="rgb(148,163,184)"
            >
              {days === 0 ? "now" : `-${days}d`}
            </text>
          );
        })}

        {muted.map((b) => (
          <path
            key={`m-${b.playerId}`}
            d={lineFor(b.series)}
            fill="none"
            stroke="rgba(148,163,184,0.18)"
            strokeWidth="1"
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHoverId(b.playerId)}
            onMouseLeave={() => setHoverId(null)}
          />
        ))}

        {colored.map((b) => {
          const color = paletteColor(b.playerId);
          const isHover = hoverId === b.playerId;
          const isHighlight = highlight === b.playerId;
          return (
            <path
              key={`c-${b.playerId}`}
              d={lineFor(b.series)}
              fill="none"
              stroke={color}
              strokeWidth={isHover || isHighlight ? 3 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ cursor: "pointer", transition: "stroke-width 120ms" }}
              onMouseEnter={() => setHoverId(b.playerId)}
              onMouseLeave={() => setHoverId(null)}
            />
          );
        })}

        {colored.map((b) => {
          const last = b.series[b.series.length - 1];
          const yy = yAt(last.rank);
          if (yy == null) return null;
          return (
            <text
              key={`label-${b.playerId}`}
              x={xAt(b.series.length - 1) + 5}
              y={yy + 3}
              fontSize="9"
              fontWeight="700"
              fill={paletteColor(b.playerId)}
            >
              {abbrev(b.name)}
            </text>
          );
        })}

        {hoverInfo && hoverFirst && hoverLast && (
          <g pointerEvents="none">
            <rect
              x={padX + 2}
              y={2}
              rx={4}
              width={Math.min(260, hoverInfo.name.length * 6.4 + 110)}
              height={18}
              fill="rgba(15,23,42,0.92)"
              stroke="rgba(148,163,184,0.4)"
            />
            <text
              x={padX + 8}
              y={15}
              fontSize="10"
              fill="white"
              fontWeight="700"
            >
              {hoverInfo.name}: rank {hoverFirst.rank ?? "—"} → {hoverLast.rank ?? "—"} (Δ{" "}
              {delta > 0 ? "+" : ""}
              {delta})
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
