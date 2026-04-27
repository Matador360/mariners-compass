"use client";

import { useEffect, useState } from "react";

export interface ETAItem {
  name: string;
  rank?: number;
  position: string;
  etaYear: number;
  etaQuarter?: "Q1" | "Q2" | "Q3" | "Q4";
  isPitcher: boolean;
}

interface Props {
  items: ETAItem[];
  thisYear: number;
}

const POS_COLOR = {
  C: "#00A3A3",
  IF: "#22d3ee",
  OF: "#a855f7",
  SP: "#fbbf24",
  RP: "#f43f5e",
  DH: "#71717a",
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

function quarterToFraction(q: "Q1" | "Q2" | "Q3" | "Q4" | undefined): number {
  switch (q) {
    case "Q1": return 0.125;
    case "Q2": return 0.375;
    case "Q3": return 0.625;
    case "Q4": return 0.875;
    default: return 0.5;
  }
}

export function EtaTimeline({ items, thisYear }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const yearMin = thisYear;
  const yearMax = thisYear + 4;

  // Sort: rank ascending (with no rank last), then ETA ascending.
  const sorted = [...items].sort((a, b) => {
    const aR = a.rank ?? 999;
    const bR = b.rank ?? 999;
    if (aR !== bR) return aR - bR;
    return a.etaYear - b.etaYear;
  });
  const visible = isMobile ? sorted.slice(0, 10) : sorted;

  const rowH = 22;
  const padT = 28;
  const padB = 12;
  const padL = isMobile ? 96 : 140;
  const padR = 16;
  const width = isMobile ? 360 : 720;
  const height = padT + padB + visible.length * rowH;

  const xFor = (yearF: number) =>
    padL + ((yearF - yearMin) / (yearMax - yearMin)) * (width - padL - padR);
  const todayX = xFor(yearMin);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      className="block"
      aria-label="Prospect ETA timeline"
    >
      {/* Year separators */}
      {Array.from({ length: yearMax - yearMin + 1 }, (_, i) => yearMin + i).map((year) => {
        const x = xFor(year);
        return (
          <g key={year}>
            <line x1={x} y1={padT - 8} x2={x} y2={height - padB} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
            <text x={x} y={padT - 12} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.45)" fontWeight="700">
              {year}
            </text>
          </g>
        );
      })}

      {/* TODAY marker */}
      <line x1={todayX} y1={padT - 8} x2={todayX} y2={height - padB} stroke="#00A3A3" strokeWidth="1.2" />
      <text x={todayX + 3} y={padT - 12} fontSize="9" fontWeight="800" fill="#00A3A3" fontFamily="inherit">TODAY</text>

      {/* Rows */}
      {visible.map((item, i) => {
        const y = padT + i * rowH + rowH / 2;
        const targetYear = Math.min(yearMax, Math.max(yearMin, item.etaYear)) + quarterToFraction(item.etaQuarter);
        const barEndX = xFor(targetYear);
        const color = POS_COLOR[bucket(item.position, item.isPitcher)];
        const labelMax = padL - 8;
        const labelText = item.rank ? `#${item.rank} ${item.name}` : item.name;
        const truncated = labelText.length > (isMobile ? 14 : 22) ? labelText.slice(0, isMobile ? 13 : 21) + "…" : labelText;
        const barW = Math.max(2, barEndX - todayX);

        return (
          <g key={`${item.name}-${i}`}>
            <text x={labelMax} y={y + 3} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.7)" fontWeight="600" fontFamily="inherit">
              {truncated}
            </text>
            <rect
              x={todayX}
              y={y - 6}
              width={barW}
              height="12"
              rx="2"
              fill={color}
              fillOpacity={0.25}
              stroke={color}
              strokeOpacity={0.9}
              strokeWidth="1"
            />
            <circle cx={barEndX} cy={y} r="3.5" fill={color} />
            <title>
              {`${item.name} · ${item.position} · ETA ${item.etaYear}${item.etaQuarter ? " " + item.etaQuarter : ""}`}
            </title>
          </g>
        );
      })}

      {isMobile && items.length > 10 && (
        <text x={padL} y={height - 2} fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="inherit">
          Showing top 10 — view on desktop for full top-30
        </text>
      )}
    </svg>
  );
}
