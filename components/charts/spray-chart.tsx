export interface SprayPoint {
  hcX: number;
  hcY: number;
  event?: string;
  launchSpeed?: number;
  launchAngle?: number;
}

interface SprayChartProps {
  data: SprayPoint[];
  width?: number;
  height?: number;
}

const EVENT_COLOR: Record<string, string> = {
  home_run: '#fbbf24',
  triple: '#a855f7',
  double: '#2dd4bf',
  single: '#22d3ee',
};

// Savant coords: hcX center ~125, hcY home plate ~205, values increase downward in raw
function toSvg(hcX: number, hcY: number, cx: number, cy: number) {
  return {
    x: cx + (hcX - 125) * 1.1,
    y: cy - (205 - hcY) * 1.1,
  };
}

export function SprayChart({ data, width = 480, height = 420 }: SprayChartProps) {
  const cx = width / 2;        // 240
  const cy = height - 30;      // 390 — home plate

  // Outfield arc endpoints (45° foul lines, radius 230)
  const R = 230;
  const rfX = +(cx + R * 0.707).toFixed(1);
  const rfY = +(cy - R * 0.707).toFixed(1);
  const lfX = +(cx - R * 0.707).toFixed(1);
  const lfY = rfY;

  const nonHR = data.filter(d => d.event !== 'home_run');
  const hrs   = data.filter(d => d.event === 'home_run');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full max-w-full"
      aria-label="Spray chart"
    >
      {/* Foul lines */}
      <line x1={cx} y1={cy} x2={rfX} y2={rfY} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <line x1={cx} y1={cy} x2={lfX} y2={lfY} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

      {/* Outfield arc — clockwise from RF to LF */}
      <path
        d={`M ${rfX} ${rfY} A ${R} ${R} 0 0 1 ${lfX} ${lfY}`}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />

      {/* Infield diamond */}
      <polygon
        points={`${cx},${cy} ${cx+72},${cy-72} ${cx},${cy-144} ${cx-72},${cy-72}`}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
      />

      {/* Home plate */}
      <circle cx={cx} cy={cy} r={3} fill="rgba(255,255,255,0.25)" />

      {/* Outs + non-HR hits first, HRs last (on top) */}
      {[...nonHR, ...hrs].map((p, i) => {
        const pos = toSvg(p.hcX, p.hcY, cx, cy);
        const isOut = !p.event || !EVENT_COLOR[p.event];
        const color = EVENT_COLOR[p.event ?? ''] ?? '#52525b';
        return (
          <circle
            key={i}
            cx={pos.x.toFixed(1)}
            cy={pos.y.toFixed(1)}
            r={isOut ? 3 : 4}
            fill={color}
            opacity={isOut ? 0.4 : 0.85}
          >
            <title>
              {[
                p.event?.replace(/_/g, ' ') ?? 'out',
                p.launchSpeed != null ? `${p.launchSpeed} mph EV` : '',
                p.launchAngle != null ? `${p.launchAngle}° LA` : '',
              ].filter(Boolean).join(' · ')}
            </title>
          </circle>
        );
      })}

      {data.length === 0 && (
        <text x={cx} y={cy / 2 + 20} textAnchor="middle" fontSize={12} fill="rgba(255,255,255,0.3)">
          No batted ball data
        </text>
      )}

      {/* Legend */}
      {([
        { label: 'HR', color: '#fbbf24' },
        { label: '2B/3B', color: '#2dd4bf' },
        { label: '1B', color: '#22d3ee' },
        { label: 'Out', color: '#52525b' },
      ] as const).map(({ label, color }, i) => (
        <g key={label} transform={`translate(${10 + i * 62}, ${height - 14})`}>
          <circle r={4} fill={color} opacity={label === 'Out' ? 0.4 : 0.85} />
          <text x={9} y={4} fontSize={9} fill="rgba(255,255,255,0.45)" fontFamily="inherit">{label}</text>
        </g>
      ))}
    </svg>
  );
}
