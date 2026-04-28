'use client';

import type { ParsedLiveGame } from '@/lib/live-game';
import { umpireScorecard } from '@/lib/at-bat';

interface Props {
  game: ParsedLiveGame;
}

function tierColor(acc: number): string {
  if (acc >= 0.94) return '#22c55e';
  if (acc >= 0.90) return '#a3e635';
  if (acc >= 0.86) return '#fbbf24';
  return '#ef4444';
}

export function UmpireScorecard({ game }: Props) {
  const ump = game.umpires.find(u => u.officialType === 'Home Plate');
  const card = umpireScorecard(game);
  if (card.totalCalled === 0) return null;

  const acc = card.accuracy;
  const tier = tierColor(acc);
  const favoringHitters = card.netFavorPitchers < 0;
  const net = Math.abs(card.netFavorPitchers);

  return (
    <div className="trident-card p-4 space-y-2">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">
          Umpire Scorecard
          {ump && <span className="text-gray-500 font-normal ml-1.5">{ump.fullName}</span>}
        </h3>
        <span className="text-xs text-gray-500 tabular-nums">{card.totalCalled} calls</span>
      </div>

      <div className="flex items-end gap-4">
        <div>
          <div
            className="font-mono tabular-nums text-3xl font-bold leading-none"
            style={{ color: tier }}
          >
            {(acc * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">accuracy</div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-gray-300 tabular-nums">
              <span className="text-red-400 font-semibold">{card.missedStrikes}</span>
              <span className="text-gray-600"> /{card.totalCalled}</span>
            </div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500">
              missed K (in zone, called ball)
            </div>
          </div>
          <div>
            <div className="text-gray-300 tabular-nums">
              <span className="text-orange-400 font-semibold">{card.missedBalls}</span>
              <span className="text-gray-600"> /{card.totalCalled}</span>
            </div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500">
              missed B (out of zone, called K)
            </div>
          </div>
        </div>
      </div>

      {net > 0 && (
        <p className="text-[11px] text-gray-400">
          Net <span className="font-semibold text-gray-200">{net}</span>{' '}
          {favoringHitters ? 'extra balls — favoring hitters' : 'extra strikes — favoring pitchers'}
        </p>
      )}

      <p className="text-[10px] text-gray-600 leading-snug">
        Compares each called pitch's pX/pZ against the rule-book strike zone (17″ wide, batter sz_top/sz_bot).
        Excludes swings, fouls, and pitches missing tracking.
      </p>
    </div>
  );
}
