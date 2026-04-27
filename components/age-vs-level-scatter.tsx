"use client";

import { useEffect, useState } from "react";

type Level = "Rookie" | "A" | "A+" | "AA" | "AAA";

export interface ScatterPoint {
  name: string;
  rank?: number;
  age: number;
  level: Level;
  ops?: number;
  era?: number;
  position: string;
  isPitcher: boolean;
}

interface Props {
  points: ScatterPoint[];
}

const LEVELS: Level[] = ["Rookie", "A", "A+", "AA", "AAA"];

// Largest age that's "ahead of curve" for each level (dot left of line is good).
const EXPECTED_AGE: Record<Level, number> = {
  AAA: 24,
  AA: 22,
  "A+": 21,
  A: 20,
  Rookie: 19,
};

const POS_COLOR = {
  C: "#00A3A3",   // teal
  IF: "#22d3ee",  // cyan
  OF: "#a855f7",  // purple
  SP: "#fbbf24",  // gold
  RP: "#f43f5e",  // rose
  DH: "#71717a",  // muted
} as const;

function bucket(position: string, isPitcher: boolean): keyof typeof POS_COLOR {
  if (isPitcher) {
    if (position === "RP" || position === "CL") return "RP";
    return "SP";
  }
  if (position === "C") return "C";
  if (position === "DH") return "DH";
  if (["1B", "2B", "3B", "SS", "IF"].includes(position)) return "IF";
  return "OF";
}

function dotRadius(p: ScatterPoint): number {
  if (p.isPitcher) {
    const era = p.era ?? 4.5;
    // 2.0 ERA → 14, 6.0 ERA → 5
    const r = 14 - (era - 2.0) * 2.25;
    return Math.max(5, Math.min(14, r));
  }
  const ops = p.ops ?? 0.7;
  // .600 OPS → 5, 1.000 OPS → 14
  const r = 5 + (ops - 0.6) * 22.5;
  return Math.max(5, Math.min(14, r));
}

export function AgeVsLevelScatter({ points }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const width = isMobile ? 360 : 720;
  const height = isMobile ? 260 : 360;
  const padL = 50;
  const padR = isMobile ? 18 : 30;
  const padT = 20;
  const padB = 32;

  const ageMin = 17;
  const ageMax = 28;

  const xFor = (age: number) => padL + ((age - ageMin) / (ageMax - ageMin)) * (width - padL - padR);
  const yFor = (level: Level) => {
    const idx = LEVELS.indexOf(level);
    const usable = height - padT - padB;
    const step = usable / (LEVELS.length - 1);
    return height - padB - idx * step;
  };

  const sorted = [...points].sort((a, b) => dotRadius(b) - dotRadius(a));

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      className="block"
      aria-label="Age vs level scatter chart"
    >
      {/* Y axis: level lines + labels */}
      {LEVELS.map((lvl) => {
        const y = yFor(lvl);
        const expectedX = xFor(EXPECTED_AGE[lvl]);
        return (
          <g key={lvl}>
            <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            {/* Expected-age threshold */}
            <line
              x1={expectedX}
              y1={y - 12}
              x2={expectedX}
              y2={y + 12}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1"
              strokeDasharray="2 3"
            />
            <text x={padL - 8} y={y + 3} textAnchor="end" fontSize="10" fontWeight="700" fill="rgba(255,255,255,0.5)">
              {lvl}
            </text>
          </g>
        );
      })}

      {/* X axis: age ticks */}
      {Array.from({ length: ageMax - ageMin + 1 }, (_, i) => ageMin + i).map((age) => {
        if (isMobile && age % 2 !== 0) return null;
        const x = xFor(age);
        return (
          <g key={age}>
            <line x1={x} y1={height - padB} x2={x} y2={height - padB + 4} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <text x={x} y={height - padB + 14} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.45)">
              {age}
            </text>
          </g>
        );
      })}
      <text x={(width + padL - padR) / 2} y={height - 6} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.4)" fontWeight="600">
        AGE
      </text>

      {/* Dots */}
      {sorted.map((p, i) => {
        const cx = xFor(Math.max(ageMin, Math.min(ageMax, p.age)));
        const cy = yFor(p.level);
        const color = POS_COLOR[bucket(p.position, p.isPitcher)];
        const r = dotRadius(p);
        const stat = p.isPitcher
          ? p.era != null ? ` · ${p.era.toFixed(2)} ERA` : ""
          : p.ops != null ? ` · ${p.ops.toFixed(3)} OPS` : "";
        const showLabel = p.rank !== undefined && p.rank <= 10;
        return (
          <g key={`${p.name}-${i}`}>
            <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={0.5} stroke={color} strokeOpacity={0.95} strokeWidth="1.2">
              <title>
                {`${p.name} · ${p.position} · age ${p.age} · ${p.level}${stat}`}
              </title>
            </circle>
            {showLabel && (
              <text
                x={cx + r + 3}
                y={cy + 3}
                fontSize="9"
                fontWeight="800"
                fill={color}
                fontFamily="inherit"
              >
                #{p.rank}
              </text>
            )}
          </g>
        );
      })}

      {/* Legend */}
      {(["C", "IF", "OF", "SP", "RP"] as const).map((b, i) => (
        <g key={b} transform={`translate(${padL + i * 56}, ${padT - 4})`}>
          <circle r={4} fill={POS_COLOR[b]} fillOpacity={0.6} />
          <text x={9} y={3} fontSize="9" fill="rgba(255,255,255,0.5)" fontFamily="inherit">{b}</text>
        </g>
      ))}
    </svg>
  );
}
