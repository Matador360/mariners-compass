import { cn } from "@/lib/utils";

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  fillOpacity?: number;
  className?: string;
}

export function Sparkline({
  values,
  width = 64,
  height = 24,
  color = "#00A3A3",
  fillOpacity = 0.15,
  className,
}: SparklineProps) {
  if (!values || values.length < 2) {
    return <div style={{ width, height }} className={cn("opacity-30 bg-surface-2 rounded", className)} />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 2;

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return [x, y] as [number, number];
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    `${linePath} L ${points[points.length - 1][0].toFixed(1)} ${height} L ${points[0][0].toFixed(1)} ${height} Z`;

  const last = values[values.length - 1];
  const first = values[0];
  const trending = last > first * 1.03 ? "up" : last < first * 0.97 ? "down" : "flat";
  const trendColor = trending === "up" ? "#22C55E" : trending === "down" ? "#EF4444" : color;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
    >
      <path d={areaPath} fill={trendColor} fillOpacity={fillOpacity} />
      <path
        d={linePath}
        fill="none"
        stroke={trendColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r="2"
        fill={trendColor}
      />
    </svg>
  );
}

interface SparkBarProps {
  values: number[];
  width?: number;
  height?: number;
  positiveColor?: string;
  negativeColor?: string;
  className?: string;
}

export function SparkBar({
  values,
  width = 64,
  height = 24,
  positiveColor = "#22C55E",
  negativeColor = "#EF4444",
  className,
}: SparkBarProps) {
  if (!values || values.length === 0) return null;
  const max = Math.max(...values.map(Math.abs)) || 1;
  const barW = (width / values.length) - 1;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden="true">
      {values.map((v, i) => {
        const barH = Math.max(1, (Math.abs(v) / max) * (height / 2 - 1));
        const x = i * (width / values.length);
        const isPos = v >= 0;
        return (
          <rect
            key={i}
            x={x}
            y={isPos ? height / 2 - barH : height / 2}
            width={Math.max(1, barW)}
            height={barH}
            fill={isPos ? positiveColor : negativeColor}
            fillOpacity={0.8}
            rx="0.5"
          />
        );
      })}
      <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
    </svg>
  );
}
