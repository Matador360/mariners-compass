"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

interface TrendPoint {
  date: string;
  value: number;
  rolling?: number;
}

interface PlayerTrendChartProps {
  data: TrendPoint[];
  statLabel: string;
  color?: string;
  seasonAvg?: number;
  height?: number;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const rolling = payload.find((p) => p.dataKey === "rolling");
  const raw = payload.find((p) => p.dataKey === "value");
  return (
    <div className="bg-elevated border border-border-accent rounded-xl p-3 shadow-xl">
      <p className="text-[10px] text-muted mb-1">{label}</p>
      {raw && (
        <p className="text-xs text-secondary">
          Game: <span className="text-primary font-bold">{raw.value.toFixed(3).replace(/^0/, "")}</span>
        </p>
      )}
      {rolling && (
        <p className="text-xs text-teal">
          15-game avg: <span className="font-bold">{rolling.value.toFixed(3).replace(/^0/, "")}</span>
        </p>
      )}
    </div>
  );
};

export function PlayerTrendChart({
  data,
  statLabel,
  color = "#00A3A3",
  seasonAvg,
  height = 180,
}: PlayerTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`grad-${statLabel}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(196,206,212,0.06)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "var(--text-muted)" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--text-muted)" }}
          tickLine={false}
          axisLine={false}
          width={36}
          tickFormatter={(v) =>
            typeof v === "number" && v < 1 && v > 0
              ? v.toFixed(3).replace(/^0/, "")
              : String(v)
          }
        />
        <Tooltip content={<CustomTooltip />} />
        {seasonAvg !== undefined && (
          <ReferenceLine
            y={seasonAvg}
            stroke="rgba(201,168,0,0.5)"
            strokeDasharray="4 2"
            label={{
              value: "Season avg",
              position: "right",
              fontSize: 9,
              fill: "var(--text-muted)",
            }}
          />
        )}
        <Area
          type="monotone"
          dataKey="value"
          stroke="rgba(196,206,212,0.2)"
          strokeWidth={1}
          fill="none"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="rolling"
          name={`15-game ${statLabel}`}
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${statLabel})`}
          dot={false}
          activeDot={{ r: 4, fill: color, stroke: "var(--bg-deep)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
