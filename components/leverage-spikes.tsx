'use client';

import { topLeverageMoments } from '@/lib/live-game';
import type { ParsedLiveGame } from '@/lib/live-game';

function halfLabel(half: string, inning: number) {
  return `${half === 'top' ? '▲' : '▼'}${inning}`;
}

interface LeverageSpikesProps {
  game: ParsedLiveGame;
  onSelectPlay?: (playIndex: number) => void;
}

export function LeverageSpikes({ game, onSelectPlay }: LeverageSpikesProps) {
  const moments = topLeverageMoments(game, 5);
  if (moments.length === 0) return null;

  const maxLev = Math.max(...moments.map(m => m.leverageIndex));

  return (
    <div className="trident-card p-4">
      <h3 className="text-sm font-semibold mb-3">High-Leverage Moments</h3>
      <div className="space-y-3">
        {moments.map(m => (
          <button
            key={m.playIndex}
            className="w-full text-left"
            onClick={() => onSelectPlay?.(m.playIndex)}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-500 w-7 tabular-nums flex-shrink-0">
                {halfLabel(m.halfInning, m.inning)}
              </span>
              <span className="text-xs text-gray-300 truncate flex-1">
                {m.description}
              </span>
              <span className="text-xs text-[#FFB700] tabular-nums font-mono flex-shrink-0">
                {m.leverageIndex.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-7 flex-shrink-0" />
              <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#FFB700]"
                  style={{ width: `${(m.leverageIndex / maxLev) * 100}%` }}
                />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
