'use client';

import { useState } from 'react';
import type { ParsedPitch } from '@/lib/live-game';
import {
  categorizePitch,
  inferStrikeZone,
  isPitchInZone,
  PITCH_COLORS,
  PITCH_LABELS,
  type StrikeZone,
} from '@/lib/at-bat';

// ─── Coordinate space ────────────────────────────────────────────────────────
// Catcher's view, feet:
//   x in [-2.0, 2.0]  → svg in [PAD_X, W - PAD_X]
//   z in [0.4, 4.6]   → svg in [H - PAD_Y, PAD_Y]   (inverted: top of svg = high z)

const W = 220;
const H = 260;
const PAD_X = 12;
const PAD_Y = 14;
const X_MIN = -2.0;
const X_MAX = 2.0;
const Z_MIN = 0.4;
const Z_MAX = 4.6;

function mapX(x: number) {
  const t = (x - X_MIN) / (X_MAX - X_MIN);
  return PAD_X + t * (W - 2 * PAD_X);
}
function mapZ(z: number) {
  const t = (z - Z_MIN) / (Z_MAX - Z_MIN);
  return H - PAD_Y - t * (H - 2 * PAD_Y);
}

function veloRadius(speed?: number): number {
  if (speed == null) return 5.5;
  // Map 70..102 mph to 4..7.5 px (pure visual scale).
  const t = Math.max(0, Math.min(1, (speed - 70) / 32));
  return 4 + t * 3.5;
}

interface PitchHover extends ParsedPitch {
  category: ReturnType<typeof categorizePitch>;
}

interface StrikeZoneLiveProps {
  pitches: ParsedPitch[];
  /** Override the inferred zone (e.g., when caller already has it). */
  zone?: StrikeZone;
  /** "L" or "R" — annotates which side the batter stands. */
  batSide?: 'L' | 'R';
  /** When true, only most-recent pitch is highlighted; older pitches faded. */
  emphasizeLast?: boolean;
  /** Optional season heatmap underlay: zone numbers 1-9 with intensity 0..1. */
  heatmap?: { zone: number; intensity: number }[];
  /** Optional title shown above the SVG. */
  caption?: string;
}

// 9-zone (1..9) layout inside the strike zone box for the heatmap.
function zoneRect(zNum: number, zone: StrikeZone) {
  if (zNum < 1 || zNum > 9) return null;
  const cellW = (zone.halfWidth * 2) / 3;
  const cellH = (zone.top - zone.bottom) / 3;
  const col = (zNum - 1) % 3;       // 0 = left from catcher's view
  const row = Math.floor((zNum - 1) / 3);
  const xLeft = -zone.halfWidth + col * cellW;
  const zTop = zone.top - row * cellH;
  return {
    x: mapX(xLeft),
    y: mapZ(zTop),
    width: mapX(xLeft + cellW) - mapX(xLeft),
    height: mapZ(zTop - cellH) - mapZ(zTop),
  };
}

export function StrikeZoneLive({
  pitches,
  zone: zoneProp,
  batSide,
  emphasizeLast = true,
  heatmap,
  caption,
}: StrikeZoneLiveProps) {
  const [hover, setHover] = useState<PitchHover | null>(null);
  const zone = zoneProp ?? inferStrikeZone(pitches);

  const withCoords = pitches.filter(p => p.coordinates?.pX != null && p.coordinates?.pZ != null);
  const lastIdx = withCoords.length - 1;

  const sxL = mapX(-zone.halfWidth);
  const sxR = mapX(zone.halfWidth);
  const syT = mapZ(zone.top);
  const syB = mapZ(zone.bottom);

  // Plate is 17" = 1.417ft wide. Drawn as a small home-plate pentagon at the bottom.
  const plateW = 1.417;
  const plateY = mapZ(0.55); // just above floor

  return (
    <div className="flex flex-col items-center gap-1.5">
      {caption && (
        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
          {caption}
        </p>
      )}

      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} ${H}`}
        className="max-w-[260px]"
        aria-label="Pitch location strike zone"
      >
        {/* outer field */}
        <rect
          x={1}
          y={1}
          width={W - 2}
          height={H - 2}
          fill="rgba(255,255,255,0.015)"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.5"
          rx={6}
        />

        {/* heatmap underlay (season strengths) */}
        {heatmap?.map(h => {
          const r = zoneRect(h.zone, zone);
          if (!r) return null;
          const alpha = Math.max(0, Math.min(1, h.intensity)) * 0.55;
          return (
            <rect
              key={`hm-${h.zone}`}
              x={r.x}
              y={r.y}
              width={r.width}
              height={r.height}
              fill={`rgba(255,183,0,${alpha})`}
            />
          );
        })}

        {/* strike-zone box */}
        <rect
          x={sxL}
          y={syT}
          width={sxR - sxL}
          height={syB - syT}
          fill="none"
          stroke="rgba(255,255,255,0.30)"
          strokeWidth="1"
        />
        {/* 3x3 grid lines inside zone */}
        {[1, 2].map(i => {
          const x = sxL + ((sxR - sxL) * i) / 3;
          return (
            <line
              key={`vg-${i}`}
              x1={x}
              y1={syT}
              x2={x}
              y2={syB}
              stroke="rgba(255,255,255,0.10)"
              strokeWidth="0.5"
            />
          );
        })}
        {[1, 2].map(i => {
          const y = syT + ((syB - syT) * i) / 3;
          return (
            <line
              key={`hg-${i}`}
              x1={sxL}
              y1={y}
              x2={sxR}
              y2={y}
              stroke="rgba(255,255,255,0.10)"
              strokeWidth="0.5"
            />
          );
        })}

        {/* home plate */}
        {(() => {
          const x0 = mapX(-plateW / 2);
          const x1 = mapX(plateW / 2);
          const xm = mapX(0);
          const yTop = plateY;
          const yBottom = plateY + 10;
          const points = `${x0},${yTop} ${x1},${yTop} ${x1 - 4},${yBottom} ${xm},${yBottom + 5} ${x0 + 4},${yBottom}`;
          return (
            <polygon
              points={points}
              fill="rgba(255,255,255,0.06)"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="0.5"
            />
          );
        })()}

        {/* batter side marker (from catcher's view: L bats stand to the right of plate) */}
        {batSide && (
          <text
            x={batSide === 'L' ? W - PAD_X - 4 : PAD_X + 4}
            y={H - PAD_Y - 2}
            fontSize="9"
            fill="rgba(255,255,255,0.35)"
            textAnchor={batSide === 'L' ? 'end' : 'start'}
            fontFamily="inherit"
          >
            {batSide}HH
          </text>
        )}

        {/* pitch dots — older first, latest on top */}
        {withCoords.map((p, i) => {
          const cat = categorizePitch(p);
          const fill = cat ? PITCH_COLORS[cat] : '#6b7280';
          const cx = mapX(p.coordinates!.pX!);
          const cy = mapZ(p.coordinates!.pZ ?? 2.5);
          const r = veloRadius(p.speed);
          const isLast = emphasizeLast && i === lastIdx;
          const opacity = emphasizeLast ? (isLast ? 1 : 0.55) : 0.85;
          const stroke = isLast ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.4)';
          const strokeW = isLast ? 1.5 : 0.5;

          return (
            <g
              key={i}
              onMouseEnter={() => setHover({ ...p, category: cat })}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover({ ...p, category: cat })}
              onBlur={() => setHover(null)}
              tabIndex={0}
              style={{ cursor: 'pointer', outline: 'none' }}
            >
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={fill}
                opacity={opacity}
                stroke={stroke}
                strokeWidth={strokeW}
              />
              <text
                x={cx}
                y={cy + 2.5}
                fontSize="7"
                fill="white"
                textAnchor="middle"
                fontWeight="700"
                pointerEvents="none"
                fontFamily="inherit"
              >
                {p.pitchNumber ?? i + 1}
              </text>
            </g>
          );
        })}
      </svg>

      {/* hover/focus card */}
      <div className="min-h-[44px] w-full max-w-[260px] text-[11px] leading-tight">
        {hover ? (
          <div className="rounded border border-white/10 bg-black/30 px-2 py-1.5">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: hover.category ? PITCH_COLORS[hover.category] : '#6b7280' }}
              />
              <span className="font-semibold text-gray-200">
                #{hover.pitchNumber ?? '—'} {hover.type?.description ?? 'Unknown'}
              </span>
              {hover.speed != null && (
                <span className="ml-auto tabular-nums text-gray-400">
                  {hover.speed.toFixed(1)} mph
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-gray-500">
              {hover.category && <span>{PITCH_LABELS[hover.category]}</span>}
              {hover.spinRate != null && (
                <span>{Math.round(hover.spinRate)} rpm</span>
              )}
              {hover.break?.length != null && (
                <span>brk {hover.break.length.toFixed(1)}&quot;</span>
              )}
              {hover.extension != null && (
                <span>ext {hover.extension.toFixed(1)}ft</span>
              )}
              {hover.zone != null && <span>z{hover.zone}</span>}
              {(() => {
                const inZ = isPitchInZone(hover, zone);
                if (inZ == null) return null;
                return inZ ? <span className="text-emerald-400">in zone</span> : <span className="text-blue-400">out of zone</span>;
              })()}
            </div>
            {hover.callDescription && (
              <div className="mt-0.5 text-gray-400 truncate">{hover.callDescription}</div>
            )}
            {hover.hit?.launchSpeed != null && (
              <div className="mt-0.5 text-emerald-400 tabular-nums">
                EV {hover.hit.launchSpeed.toFixed(1)} · LA {hover.hit.launchAngle?.toFixed(0) ?? '—'}°
                {hover.hit.totalDistance != null && ` · ${hover.hit.totalDistance}ft`}
              </div>
            )}
          </div>
        ) : (
          <div className="px-1 text-gray-600 italic">Hover a pitch for details</div>
        )}
      </div>
    </div>
  );
}
