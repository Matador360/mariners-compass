"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface DataPoint {
  date: string;
  mariners: number;
  alAvg?: number;
  [key: string]: string | number | undefined;
}

interface TeamStatsChartProps {
  data: DataPoint[];
  dataKey: string;
  label: string;
  color?: string;
  comparisonKey?: string;
  comparisonLabel?: string;
  domain?: [number | "auto", number | "auto"];
  referenceValue?: number;
  referenceLabel?: string;
  height?: number;
  higherIsBetter?: boolean;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-elevated border border-border-accent rounded-xl p-3 shadow-xl min-w-[120px]">
      <p className="text-[10px] text-muted mb-2 font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: p.color }}
            />
            <span className="text-xs text-secondary">{p.name}</span>
          </div>
          <span className="text-sm font-bold text-primary tabular-nums">
            {typeof p.value === "number" ? p.value.toFixed(3).replace(/^0/, "") : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function TeamStatsChart({
  data,
  dataKey,
  label,
  color = "#00A3A3",
  comparisonKey,
  comparisonLabel,
  domain = ["auto", "auto"],
  referenceValue,
  referenceLabel,
  height = 200,
  higherIsBetter = true,
}: TeamStatsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
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
          domain={domain}
          tick={{ fontSize: 10, fill: "var(--text-muted)" }}
          tickLine={false}
          axisLine={false}
          width={36}
          tickFormatter={(v) =>
            typeof v === "number"
              ? v < 1 && v > 0
                ? v.toFixed(3).replace(/^0/, "")
                : v.toFixed(2)
              : v
          }
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
        />
        {referenceValue !== undefined && (
          <ReferenceLine
            y={referenceValue}
            stroke="rgba(201,168,0,0.4)"
            strokeDasharray="4 2"
            label={{
              value: referenceLabel ?? `MLB Avg`,
              position: "right",
              fontSize: 9,
              fill: "var(--text-muted)",
            }}
          />
        )}
        {comparisonKey && (
          <Line
            type="monotone"
            dataKey={comparisonKey}
            name={comparisonLabel ?? "AL Avg"}
            stroke="rgba(196,206,212,0.35)"
            strokeWidth={1.5}
            strokeDasharray="4 2"
            dot={false}
            activeDot={{ r: 3 }}
          />
        )}
        <Line
          type="monotone"
          dataKey={dataKey}
          name={label}
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{
            r: 4,
            fill: color,
            stroke: "var(--bg-deep)",
            strokeWidth: 2,
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
