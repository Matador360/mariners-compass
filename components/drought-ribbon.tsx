interface DroughtRibbonProps {
  startYear?: number;
  endYear?: number;
  reduceMotion?: boolean;
}

const WS_WINNERS: Record<number, string> = {
  2001: "ARI",
  2002: "LAA",
  2003: "FLA",
  2004: "BOS",
  2005: "CWS",
  2006: "STL",
  2007: "BOS",
  2008: "PHI",
  2009: "NYY",
  2010: "SF",
  2011: "STL",
  2012: "SF",
  2013: "BOS",
  2014: "SF",
  2015: "KC",
  2016: "CHC",
  2017: "HOU",
  2018: "BOS",
  2019: "WSH",
  2020: "LAD",
  2021: "ATL",
};

export function DroughtRibbon({
  startYear = 2001,
  endYear = 2022,
  reduceMotion = false,
}: DroughtRibbonProps) {
  const years = endYear - startYear;
  const width = 960;
  const height = 120;
  const padX = 40;
  const ribbonY = 56;
  const ribbonH = 16;
  const usableW = width - padX * 2;
  const xFor = (year: number) =>
    padX + ((year - startYear) / years) * usableW;

  const tickYears: number[] = [];
  for (let y = startYear; y <= endYear; y += 2) tickYears.push(y);
  if (tickYears[tickYears.length - 1] !== endYear) tickYears.push(endYear);

  const winnerYears = Object.keys(WS_WINNERS)
    .map((y) => parseInt(y))
    .filter((y) => y >= startYear && y <= endYear)
    .sort((a, b) => a - b);

  const snapX = xFor(endYear);
  const confettiDots = Array.from({ length: 22 }).map((_, i) => {
    const angle = (Math.PI * (i + 1)) / 24;
    const dist = 18 + ((i * 13) % 40);
    return {
      id: i,
      dx: Math.cos(angle - Math.PI / 2) * dist + (i % 3 === 0 ? -8 : 8),
      dy: -Math.sin(angle) * dist - 4,
      delay: (i * 53) % 800,
      hue: i % 4 === 0 ? "var(--accent-gold)" : i % 3 === 0 ? "var(--accent-teal)" : "#ffffff",
    };
  });

  return (
    <div className="relative w-full overflow-hidden">
      <style>{`
        .drought-confetti-dot {
          opacity: 0;
          transform-origin: 0 0;
          animation: drought-confetti-pop 3s ease-out forwards;
        }
        @keyframes drought-confetti-pop {
          0% { opacity: 0; transform: translate(0, 0) scale(0.4); }
          15% { opacity: 1; transform: translate(var(--dx-half), var(--dy-up)) scale(1); }
          100% { opacity: 0; transform: translate(var(--dx), 90px) scale(0.7); }
        }
        .drought-snap-flash {
          animation: drought-snap-flash 1.4s ease-out forwards;
        }
        @keyframes drought-snap-flash {
          0% { opacity: 0; transform: scale(0.6); }
          25% { opacity: 1; transform: scale(1.5); }
          100% { opacity: 0.85; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .drought-confetti-dot, .drought-snap-flash {
            animation: none !important;
            opacity: 1;
          }
        }
      `}</style>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        className="block"
        aria-label={`Mariners playoff drought, ${startYear}-${endYear}`}
      >
        <defs>
          <linearGradient id="drought-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5b3992" stopOpacity="0.45" />
            <stop offset="92%" stopColor="#7a5cb6" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#00a3a3" stopOpacity="0.95" />
          </linearGradient>
          <radialGradient id="drought-snap" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
            <stop offset="60%" stopColor="#fbbf24" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
        </defs>

        {tickYears.map((y) => (
          <g key={y}>
            <line
              x1={xFor(y)}
              x2={xFor(y)}
              y1={ribbonY - 8}
              y2={ribbonY - 2}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="1"
            />
            <text
              x={xFor(y)}
              y={ribbonY - 12}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill="rgba(255,255,255,0.55)"
              style={{ fontFamily: "var(--font-mono, monospace)" }}
            >
              {y}
            </text>
          </g>
        ))}

        <rect
          x={padX}
          y={ribbonY}
          width={usableW}
          height={ribbonH}
          rx={ribbonH / 2}
          fill="url(#drought-grad)"
        />

        {winnerYears.map((y) => {
          const cx = xFor(y);
          const isHou = WS_WINNERS[y] === "HOU";
          return (
            <g key={`winner-${y}`}>
              <circle
                cx={cx}
                cy={ribbonY + ribbonH + 18}
                r={11}
                fill="rgba(255,255,255,0.05)"
                stroke={isHou ? "rgba(235,97,32,0.8)" : "rgba(255,255,255,0.25)"}
                strokeWidth="1"
              />
              <text
                x={cx}
                y={ribbonY + ribbonH + 22}
                textAnchor="middle"
                fontSize="8"
                fontWeight="800"
                fill={isHou ? "#eb6120" : "rgba(255,255,255,0.7)"}
                style={{ fontFamily: "var(--font-mono, monospace)" }}
              >
                {WS_WINNERS[y]}
              </text>
            </g>
          );
        })}

        <text
          x={padX}
          y={height - 8}
          fontSize="10"
          fontWeight="700"
          fill="rgba(255,255,255,0.45)"
          style={{ fontFamily: "var(--font-grotesk, sans-serif)" }}
        >
          ↑ World Series winners we watched on TV
        </text>

        {reduceMotion ? (
          <text
            x={snapX}
            y={ribbonY + ribbonH / 2 + 4}
            textAnchor="middle"
            fontSize="20"
          >
            💥
          </text>
        ) : (
          <>
            <circle
              cx={snapX}
              cy={ribbonY + ribbonH / 2}
              r="22"
              fill="url(#drought-snap)"
              className="drought-snap-flash"
            />
            <circle
              cx={snapX}
              cy={ribbonY + ribbonH / 2}
              r="5"
              fill="#fbbf24"
            />
            {confettiDots.map((d) => (
              <circle
                key={d.id}
                cx={snapX}
                cy={ribbonY + ribbonH / 2}
                r="2"
                fill={d.hue}
                className="drought-confetti-dot"
                style={
                  {
                    animationDelay: `${d.delay}ms`,
                    "--dx": `${d.dx}px`,
                    "--dx-half": `${d.dx * 0.4}px`,
                    "--dy-up": `${d.dy}px`,
                  } as React.CSSProperties
                }
              />
            ))}
          </>
        )}
      </svg>

      <p className="mt-3 text-center text-sm text-secondary leading-relaxed max-w-2xl mx-auto">
        21 years. Eight World Series winners we watched on TV. Then Cal Raleigh hit the ball over the fence.
      </p>
    </div>
  );
}
