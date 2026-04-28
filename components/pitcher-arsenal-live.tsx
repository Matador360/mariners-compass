'use client';

import type { ParsedLiveGame } from '@/lib/live-game';
import { arsenalToday, pitchCountToday } from '@/lib/at-bat';

const PITCH_TYPE_COLORS: Record<string, string> = {
  FF: '#ef4444', // 4-seam
  SI: '#f97316', // sinker
  FC: '#eab308', // cutter
  FS: '#84cc16', // splitter
  FA: '#ef4444', // generic fastball
  SL: '#22d3ee', // slider
  ST: '#06b6d4', // sweeper
  SV: '#3b82f6', // slurve
  CU: '#8b5cf6', // curve
  KC: '#a855f7', // knuckle curve
  CH: '#ec4899', // changeup
  EP: '#94a3b8', // eephus
  KN: '#fbbf24', // knuckler
  SC: '#94a3b8',
};
function colorFor(code: string): string {
  return PITCH_TYPE_COLORS[code] ?? '#6b7280';
}

function pct(n?: number, digits = 0): string {
  if (n == null || isNaN(n)) return '—';
  return `${(n * 100).toFixed(digits)}%`;
}

interface Props {
  game: ParsedLiveGame;
  pitcherId?: number;
  pitcherName?: string;
}

export function PitcherArsenalLive({ game, pitcherId, pitcherName }: Props) {
  if (!pitcherId) return null;
  const rows = arsenalToday(game, pitcherId);
  const total = pitchCountToday(game, pitcherId);
  if (rows.length === 0 || total === 0) return null;

  // Build a single horizontal usage strip.
  return (
    <div className="trident-card p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">
          Pitcher Arsenal · Today
          {pitcherName && <span className="text-gray-500 font-normal ml-1.5">{pitcherName}</span>}
        </h3>
        <span className="text-xs text-gray-500 tabular-nums">{total} pitches</span>
      </div>

      {/* usage strip */}
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/5">
        {rows.map(r => (
          <div
            key={`bar-${r.code}`}
            title={`${r.code} ${(r.pct * 100).toFixed(0)}%`}
            style={{ width: `${r.pct * 100}%`, background: colorFor(r.code) }}
          />
        ))}
      </div>

      {/* table */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-xs tabular-nums">
          <thead>
            <tr className="text-gray-500 text-[10px] uppercase tracking-wider">
              <th className="text-left py-1 px-1">Pitch</th>
              <th className="text-right">#</th>
              <th className="text-right">%</th>
              <th className="text-right">Velo</th>
              <th className="text-right">Max</th>
              <th className="text-right">Spin</th>
              <th className="text-right">Whiff</th>
              <th className="text-right">CSW</th>
              <th className="text-right">Zone</th>
              <th className="text-right">K</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr
                key={r.code}
                className="border-t border-white/5 text-gray-300 hover:bg-white/[0.02]"
              >
                <td className="py-1 px-1">
                  <span
                    className="inline-block h-2 w-2 rounded-full mr-1.5 align-middle"
                    style={{ background: colorFor(r.code) }}
                  />
                  <span className="font-semibold text-gray-200">{r.code}</span>
                  <span className="text-gray-500 ml-1 hidden sm:inline">{r.name}</span>
                </td>
                <td className="text-right">{r.count}</td>
                <td className="text-right">{(r.pct * 100).toFixed(0)}%</td>
                <td className="text-right">{r.avgVelo != null ? r.avgVelo.toFixed(1) : '—'}</td>
                <td className="text-right text-gray-500">{r.maxVelo != null ? r.maxVelo.toFixed(0) : '—'}</td>
                <td className="text-right text-gray-500">{r.avgSpin != null ? Math.round(r.avgSpin) : '—'}</td>
                <td className="text-right">{pct(r.whiffPct)}</td>
                <td className="text-right">{pct(r.cswPct)}</td>
                <td className="text-right text-gray-500">{pct(r.zonePct)}</td>
                <td className="text-right">{r.putAways || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-gray-600 leading-snug">
        Whiff = swings &amp; misses / swings · CSW = (called K + whiff) / total · K = pitches that ended an AB in strikeout
      </p>
    </div>
  );
}
