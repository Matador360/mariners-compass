'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { WpaPoint } from '@/lib/live-game';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as WpaPoint;
  return (
    <div className="bg-[#0d1f2d] border border-white/10 rounded px-2 py-1 text-xs">
      <div className="text-gray-400">
        {d.halfInning === 'top' ? 'Top' : 'Bot'} {d.inning}
      </div>
      <div className="text-[#00A3A3] font-mono">
        {(d.homeWinProb * 100).toFixed(1)}% home win
      </div>
    </div>
  );
};

export function WpCurve({ data }: { data: WpaPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="trident-card p-4">
        <h3 className="text-sm font-semibold mb-2">Win Probability</h3>
        <p className="text-xs text-gray-500 text-center py-6">
          Win probability data not available for this game.
        </p>
      </div>
    );
  }

  return (
    <div className="trident-card p-4">
      <h3 className="text-sm font-semibold mb-3">Win Probability</h3>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <defs>
            <linearGradient id="wpGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00A3A3" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#00A3A3" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="playIndex"
            tick={false}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 1]}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
          />
          <ReferenceLine
            y={0.5}
            stroke="rgba(255,255,255,0.2)"
            strokeDasharray="4 4"
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="homeWinProb"
            stroke="#00A3A3"
            strokeWidth={2}
            fill="url(#wpGradient)"
            dot={false}
            activeDot={{ r: 3, fill: '#00A3A3' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
