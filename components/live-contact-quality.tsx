'use client';

import type { ParsedLiveGame } from '@/lib/live-game';
import { recentBattedBalls } from '@/lib/at-bat';

interface Props {
  game: ParsedLiveGame;
  limit?: number;
}

function evColor(ev?: number): string {
  if (ev == null) return '#6b7280';
  if (ev >= 105) return '#fb7185';
  if (ev >= 95) return '#f97316';
  if (ev >= 85) return '#fbbf24';
  return '#94a3b8';
}

export function LiveContactQuality({ game, limit = 6 }: Props) {
  const balls = recentBattedBalls(game, limit);
  if (balls.length === 0) return null;

  return (
    <div className="trident-card p-4 space-y-2">
      <h3 className="text-sm font-semibold">Contact Quality · Last {balls.length}</h3>

      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-xs tabular-nums">
          <thead>
            <tr className="text-gray-500 text-[10px] uppercase tracking-wider">
              <th className="text-left py-1 px-1">Batter</th>
              <th className="text-right">EV</th>
              <th className="text-right">LA</th>
              <th className="text-right">Dist</th>
              <th className="text-right">xBA</th>
              <th className="text-left pl-2">Result</th>
            </tr>
          </thead>
          <tbody>
            {balls.map((b, i) => (
              <tr
                key={`${b.playIndex}-${b.pitchIndex}-${i}`}
                className="border-t border-white/5 text-gray-300 hover:bg-white/[0.02]"
              >
                <td className="py-1 px-1 truncate max-w-[120px]">
                  <span className="text-gray-500 mr-1.5">
                    {b.halfInning === 'top' ? '▲' : '▼'}
                    {b.inning}
                  </span>
                  {b.batter.fullName.split(' ').slice(-1)[0]}
                </td>
                <td className="text-right font-semibold" style={{ color: evColor(b.exitVelo) }}>
                  {b.exitVelo != null ? b.exitVelo.toFixed(1) : '—'}
                </td>
                <td className="text-right text-gray-400">
                  {b.launchAngle != null ? `${b.launchAngle.toFixed(0)}°` : '—'}
                </td>
                <td className="text-right text-gray-500">
                  {b.distance != null ? `${b.distance}ft` : '—'}
                </td>
                <td className="text-right text-gray-300">{b.estBA.toFixed(2).replace(/^0/, '')}</td>
                <td className="pl-2 text-gray-400">
                  <span className="flex items-center gap-1">
                    {b.isBarrel && (
                      <span className="rounded bg-pink-500/20 text-pink-300 text-[9px] px-1 leading-tight font-bold">
                        BRL
                      </span>
                    )}
                    {!b.isBarrel && b.isHardHit && (
                      <span className="rounded bg-orange-500/20 text-orange-300 text-[9px] px-1 leading-tight font-bold">
                        HH
                      </span>
                    )}
                    <span className="truncate max-w-[140px]">{b.event ?? b.description}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-gray-600 leading-snug">
        BRL = barrel (EV ≥ 98 + LA 26°-30°) · HH = hard hit (EV ≥ 95) · xBA estimated from EV/LA bins
      </p>
    </div>
  );
}
