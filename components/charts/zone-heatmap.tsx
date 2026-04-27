// 5×5 grid: inner 3×3 = zones 1-9, corners = 11-14, other border cells empty.
// Row/col → zone:
//   (0,0)=11  (0,1-3)=blank  (0,4)=12
//   (1,1)=1   (1,2)=2  (1,3)=3
//   (2,1)=4   (2,2)=5  (2,3)=6
//   (3,1)=7   (3,2)=8  (3,3)=9
//   (4,0)=13  (4,1-3)=blank  (4,4)=14

export interface ZoneCell {
  zone: number;
  value: number;   // raw metric value
  label: string;   // formatted label
}

interface ZoneHeatmapProps {
  cells: ZoneCell[];
  title?: string;
  handedness?: string;  // "L" | "R" | "All"
  minValue?: number;
  maxValue?: number;
}

const GRID_MAP: (number | null)[][] = [
  [11, null, null, null, 12],
  [null,  1,    2,    3, null],
  [null,  4,    5,    6, null],
  [null,  7,    8,    9, null],
  [13, null, null, null, 14],
];

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function heatColor(value: number, min: number, max: number): string {
  if (max <= min) return '#0f2033';
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  if (t < 0.5) {
    const s = t * 2;
    return `rgb(${Math.round(lerp(15, 0, s))},${Math.round(lerp(32, 163, s))},${Math.round(lerp(51, 163, s))})`;
  }
  const s = (t - 0.5) * 2;
  return `rgb(${Math.round(lerp(0, 255, s))},${Math.round(lerp(163, 183, s))},${Math.round(lerp(163, 0, s))})`;
}

function textColor(value: number, min: number, max: number): string {
  if (max <= min) return 'rgba(255,255,255,0.5)';
  const t = (value - min) / (max - min);
  return t > 0.55 ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)';
}

const CELL = 52;
const PAD  = 4;
const W = 5 * CELL + PAD * 2;
const H = 5 * CELL + PAD * 2;

export function ZoneHeatmap({ cells, title, handedness, minValue, maxValue }: ZoneHeatmapProps) {
  const byZone = new Map(cells.map(c => [c.zone, c]));

  const vals = cells.map(c => c.value);
  const lo = minValue ?? Math.min(...vals, 0);
  const hi = maxValue ?? Math.max(...vals, 0.001);

  return (
    <div className="flex flex-col items-center gap-1">
      {title && (
        <p className="text-[9px] uppercase tracking-widest text-muted font-semibold">{title}</p>
      )}
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-[280px]"
        aria-label={`Zone heatmap${title ? ` — ${title}` : ''}`}
      >
        {GRID_MAP.map((row, ri) =>
          row.map((zone, ci) => {
            if (zone === null) return null;
            const x = PAD + ci * CELL;
            const y = PAD + ri * CELL;
            const cell = byZone.get(zone);
            const isCorner = zone > 9;
            const bg = cell ? heatColor(cell.value, lo, hi) : (isCorner ? '#0c1a24' : '#111f2c');
            const fg = cell ? textColor(cell.value, lo, hi) : 'rgba(255,255,255,0.2)';

            return (
              <g key={zone}>
                <rect
                  x={x} y={y}
                  width={CELL - 1} height={CELL - 1}
                  fill={bg}
                  rx={2}
                  stroke={isCorner ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.10)'}
                  strokeWidth={0.5}
                />
                {cell ? (
                  <text
                    x={x + CELL / 2}
                    y={y + CELL / 2 + 4}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight="700"
                    fill={fg}
                    fontFamily="inherit"
                  >
                    {cell.label}
                  </text>
                ) : (
                  <text
                    x={x + CELL / 2}
                    y={y + CELL / 2 + 4}
                    textAnchor="middle"
                    fontSize={9}
                    fill="rgba(255,255,255,0.15)"
                    fontFamily="inherit"
                  >
                    {zone}
                  </text>
                )}
              </g>
            );
          })
        )}

        {/* Strike zone border overlay */}
        <rect
          x={PAD + CELL}
          y={PAD + CELL}
          width={CELL * 3 - 1}
          height={CELL * 3 - 1}
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={1.5}
          rx={1}
        />
      </svg>

      {handedness && (
        <p className="text-[9px] text-muted">Catcher&apos;s view · vs {handedness === 'L' ? 'LHH' : handedness === 'R' ? 'RHH' : 'All'}</p>
      )}

      {/* Color scale */}
      <svg width={W - 16} height={14} className="max-w-[260px]">
        <defs>
          <linearGradient id="hm-grad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%"   stopColor="#0f2033" />
            <stop offset="50%"  stopColor="#00A3A3" />
            <stop offset="100%" stopColor="#FFB700" />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={W - 16} height={8} fill="url(#hm-grad)" rx={2} />
        <text x={0}        y={14} fontSize={8} fill="rgba(255,255,255,0.35)" fontFamily="inherit">Low</text>
        <text x={W - 16}  y={14} fontSize={8} fill="rgba(255,255,255,0.35)" textAnchor="end" fontFamily="inherit">High</text>
      </svg>
    </div>
  );
}
