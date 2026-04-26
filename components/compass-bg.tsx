export function CompassBg() {
  const cardinalAngles = [0, 90, 180, 270];
  const ordinalAngles = [45, 135, 225, 315];
  const subAngles = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];
  const cx = 200;
  const cy = 200;

  const lineEnd = (angle: number, len: number) => ({
    x: cx + Math.cos(((angle - 90) * Math.PI) / 180) * len,
    y: cy + Math.sin(((angle - 90) * Math.PI) / 180) * len,
  });

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 400 400"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.025] text-teal"
        style={{ width: "min(100vh, 100vw)", height: "min(100vh, 100vw)" }}
      >
        {/* Cardinal lines — N/S/E/W, longest */}
        {cardinalAngles.map((a) => {
          const e = lineEnd(a, 185);
          return (
            <line
              key={`c-${a}`}
              x1={cx}
              y1={cy}
              x2={e.x}
              y2={e.y}
              stroke="currentColor"
              strokeWidth="1.5"
            />
          );
        })}
        {/* Ordinal lines — NE/SE/SW/NW */}
        {ordinalAngles.map((a) => {
          const e = lineEnd(a, 145);
          return (
            <line
              key={`o-${a}`}
              x1={cx}
              y1={cy}
              x2={e.x}
              y2={e.y}
              stroke="currentColor"
              strokeWidth="1"
            />
          );
        })}
        {/* Sub-ordinal lines */}
        {subAngles.map((a) => {
          const e = lineEnd(a, 105);
          return (
            <line
              key={`s-${a}`}
              x1={cx}
              y1={cy}
              x2={e.x}
              y2={e.y}
              stroke="currentColor"
              strokeWidth="0.5"
            />
          );
        })}
        {/* Concentric rings */}
        {[50, 100, 150, 185].map((r) => (
          <circle
            key={r}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={r === 185 ? 1.5 : 0.75}
          />
        ))}
        {/* Cardinal labels */}
        <text x={cx} y={8} textAnchor="middle" fontSize="14" fontWeight="700" fill="currentColor">N</text>
        <text x={cx} y={396} textAnchor="middle" fontSize="14" fontWeight="700" fill="currentColor">S</text>
        <text x={394} y={205} textAnchor="middle" fontSize="14" fontWeight="700" fill="currentColor">E</text>
        <text x={6} y={205} textAnchor="middle" fontSize="14" fontWeight="700" fill="currentColor">W</text>
        {/* Center dot */}
        <circle cx={cx} cy={cy} r={4} fill="currentColor" />
        <circle cx={cx} cy={cy} r={8} fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  );
}
