export function CompassBg() {
  const cx = 200;
  const cy = 200;
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const pt = (angle: number, r: number) => ({
    x: cx + Math.cos(toRad(angle)) * r,
    y: cy + Math.sin(toRad(angle)) * r,
  });

  // 8-pointed Mariners-style star: 4 long cardinal points + 4 short ordinal points
  // Alternating outer radii, shared inner waist radius
  const longR = 183;   // N/S/E/W tips
  const shortR = 108;  // NE/SE/SW/NW tips
  const waistR = 50;   // inner concave radius
  // 16 polygon vertices: outer(0°), inner(22.5°), outer(45°), inner(67.5°), ...
  const starPoints = Array.from({ length: 16 }, (_, i) => {
    const angle = i * 22.5;
    const isOuter = i % 2 === 0;
    const isCardinal = i % 4 === 0;
    const r = isOuter ? (isCardinal ? longR : shortR) : waistR;
    const p = pt(angle, r);
    return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
  }).join(" ");

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Aurora glow layers */}
      <div className="aurora-layer aurora-1" />
      <div className="aurora-layer aurora-2" />
      <div className="aurora-layer aurora-3" />

      {/* Topographic grid overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.028]"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color: "var(--accent-teal)" }}
      >
        <defs>
          <pattern id="topo-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#topo-grid)" />
      </svg>

      {/* Compass rose — slow 90s rotation, Mariners 8-pointed star */}
      <div
        className="absolute top-1/2 left-1/2"
        style={{
          transform: "translate(-50%, -50%)",
          width: "min(115vmin, 1100px)",
          height: "min(115vmin, 1100px)",
        }}
      >
        <div style={{ width: "100%", height: "100%", animation: "compass-slow-rotate 90s linear infinite" }}>
          <svg
            viewBox="0 0 400 400"
            width="100%"
            height="100%"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ opacity: 0.09, color: "var(--accent-teal)" }}
          >
            {/* Outer ring */}
            <circle cx={cx} cy={cy} r={192} stroke="currentColor" strokeWidth="1.2" />
            {/* Inner accent ring */}
            <circle cx={cx} cy={cy} r={155} stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 6" />

            {/* 8-pointed star — the Mariners compass rose */}
            <polygon
              points={starPoints}
              fill="currentColor"
              fillOpacity="0.7"
              stroke="currentColor"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />

            {/* Center — solid circle with cutout */}
            <circle cx={cx} cy={cy} r={14} fill="currentColor" fillOpacity="0.9" />
            <circle cx={cx} cy={cy} r={7} fill="var(--bg-deep)" />

            {/* Cardinal labels */}
            {[
              { label: "N", x: cx,       y: 7,       anchor: "middle" },
              { label: "S", x: cx,       y: 396,     anchor: "middle" },
              { label: "E", x: 397,      y: cy + 4,  anchor: "end"    },
              { label: "W", x: 3,        y: cy + 4,  anchor: "start"  },
            ].map(({ label, x, y, anchor }) => (
              <text
                key={label}
                x={x} y={y}
                textAnchor={anchor as "middle" | "end" | "start"}
                fontSize="12"
                fontWeight="800"
                fontFamily="var(--font-grotesk, sans-serif)"
                fill="currentColor"
                letterSpacing="2"
              >
                {label}
              </text>
            ))}

            {/* 32 degree tick marks on outer ring */}
            {Array.from({ length: 32 }, (_, i) => {
              const angle = i * (360 / 32);
              const isCardinal = i % 8 === 0;
              const isOrdinal = i % 4 === 0 && !isCardinal;
              const outerR = 192;
              const innerR = isCardinal ? 178 : isOrdinal ? 182 : 187;
              const s = pt(angle, outerR);
              const e = pt(angle, innerR);
              return (
                <line
                  key={i}
                  x1={s.x.toFixed(1)} y1={s.y.toFixed(1)}
                  x2={e.x.toFixed(1)} y2={e.y.toFixed(1)}
                  stroke="currentColor"
                  strokeWidth={isCardinal ? 1.4 : 0.7}
                />
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
