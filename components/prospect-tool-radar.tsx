import type { ToolGrades } from "@/lib/prospects-intel";

interface Props {
  tools: ToolGrades;
  isPitcher: boolean;
  size?: number;
}

interface AxisDef {
  key: keyof ToolGrades | "breaking";
  label: string;
  value: number;
}

const TEAL = "#00A3A3";
const REF_GREY = "rgba(255,255,255,0.18)";
const LABEL_COLOR = "rgba(255,255,255,0.55)";

// Map a 20–80 grade to a 0..1 radial fraction, clamping to the visible range.
function gradeToRadial(grade: number): number {
  const clamped = Math.max(20, Math.min(80, grade));
  return (clamped - 20) / 60;
}

function pointAt(cx: number, cy: number, r: number, fraction: number, angle: number) {
  const rr = r * fraction;
  return {
    x: cx + Math.cos(angle) * rr,
    y: cy + Math.sin(angle) * rr,
  };
}

export function ProspectToolRadar({ tools, isPitcher, size = 200 }: Props) {
  const axes: AxisDef[] = isPitcher
    ? buildPitcherAxes(tools)
    : buildHitterAxes(tools);

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 28; // padding for labels

  // Pentagon — 5 axes evenly spaced, starting at 12 o'clock.
  const angleStep = (2 * Math.PI) / 5;
  const startAngle = -Math.PI / 2;

  const playerPoints = axes.map((a, i) => {
    const f = gradeToRadial(a.value);
    return pointAt(cx, cy, r, f, startAngle + i * angleStep);
  });
  const refPoints = axes.map((_, i) => pointAt(cx, cy, r, gradeToRadial(50), startAngle + i * angleStep));

  const playerPath = playerPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";
  const refPath = refPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";

  // Axis spokes & 80-grade outer pentagon
  const outerPoints = axes.map((_, i) => pointAt(cx, cy, r, 1, startAngle + i * angleStep));
  const outerPath = outerPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";

  const labelPositions = axes.map((_, i) => {
    const angle = startAngle + i * angleStep;
    const labelR = r + 16;
    const anchor: "start" | "end" | "middle" =
      Math.cos(angle) > 0.25 ? "start" : Math.cos(angle) < -0.25 ? "end" : "middle";
    return {
      x: cx + Math.cos(angle) * labelR,
      y: cy + Math.sin(angle) * labelR,
      anchor,
    };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="block"
      aria-label={`${isPitcher ? "Pitcher" : "Hitter"} tool grades radar`}
    >
      {/* Outer pentagon (80 grade) */}
      <path d={outerPath} fill="none" stroke={REF_GREY} strokeWidth="0.7" />

      {/* Spokes */}
      {outerPoints.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={REF_GREY} strokeWidth="0.5" />
      ))}

      {/* Reference pentagon (50 grade — average MLB prospect) */}
      <path d={refPath} fill="none" stroke={REF_GREY} strokeWidth="0.8" strokeDasharray="3 3" />

      {/* Player polygon */}
      <path d={playerPath} fill={TEAL} fillOpacity="0.25" stroke={TEAL} strokeWidth="1.5" strokeOpacity="0.9" strokeLinejoin="round" />

      {/* Player vertices */}
      {playerPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={TEAL} />
      ))}

      {/* Axis labels */}
      {axes.map((a, i) => {
        const pos = labelPositions[i];
        return (
          <g key={a.label}>
            <text
              x={pos.x}
              y={pos.y}
              textAnchor={pos.anchor}
              fontSize="9"
              fontWeight="700"
              fill={LABEL_COLOR}
              dominantBaseline="middle"
              fontFamily="inherit"
            >
              {a.label}
            </text>
            <text
              x={pos.x}
              y={pos.y + 10}
              textAnchor={pos.anchor}
              fontSize="9"
              fill={a.value >= 60 ? TEAL : LABEL_COLOR}
              dominantBaseline="middle"
              fontFamily="inherit"
              fontWeight={a.value >= 60 ? 700 : 400}
            >
              ({a.value})
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function buildHitterAxes(tools: ToolGrades): AxisDef[] {
  return [
    { key: "hit", label: "Hit", value: tools.hit ?? 50 },
    { key: "power", label: "Power", value: tools.power ?? 50 },
    { key: "speed", label: "Speed", value: tools.speed ?? 50 },
    { key: "arm", label: "Arm", value: tools.arm ?? 50 },
    { key: "glove", label: "Glove", value: tools.glove ?? 50 },
  ];
}

function buildPitcherAxes(tools: ToolGrades): AxisDef[] {
  const slider = tools.slider;
  const curve = tools.curve;
  let breakLabel = "Slider";
  let breakValue = 50;
  if (slider != null && curve != null) {
    breakLabel = "Breaking ball";
    breakValue = Math.max(slider, curve);
  } else if (slider != null) {
    breakLabel = "Slider";
    breakValue = slider;
  } else if (curve != null) {
    breakLabel = "Curve";
    breakValue = curve;
  }

  return [
    { key: "fastball", label: "Fastball", value: tools.fastball ?? 50 },
    { key: "breaking", label: breakLabel, value: breakValue },
    { key: "changeup", label: "Changeup", value: tools.changeup ?? 50 },
    { key: "control", label: "Control", value: tools.control ?? 50 },
    { key: "command", label: "Command", value: tools.command ?? 50 },
  ];
}
