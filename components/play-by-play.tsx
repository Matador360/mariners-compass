'use client';

import { useState } from 'react';
import { Trophy, Zap, ArrowRight, Circle, X, Minus } from 'lucide-react';
import type { ParsedLiveGame, ParsedPlay, ParsedPitch } from '@/lib/live-game';

function pitchDotColor(result?: string): string {
  if (!result) return '#6b7280';
  if (result === 'B') return '#3b82f6';
  if (['C', 'S', 'T', 'L', 'K'].includes(result)) return '#ef4444';
  if (result === 'F') return '#f97316';
  if (result === 'X') return '#22c55e';
  return '#6b7280';
}

function PitchZone({ pitches }: { pitches: ParsedPitch[] }) {
  const withCoords = pitches.filter(
    p => p.coordinates?.pX != null && p.coordinates?.pZ != null,
  );
  if (withCoords.length === 0) return null;

  return (
    <svg
      width="60"
      height="80"
      viewBox="0 0 60 80"
      className="flex-shrink-0"
      aria-label="pitch zone"
    >
      {/* outer border */}
      <rect
        x="1"
        y="1"
        width="58"
        height="78"
        fill="rgba(255,255,255,0.02)"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="0.5"
      />
      {/* strike zone */}
      <rect
        x="13"
        y="20"
        width="34"
        height="36"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="0.75"
      />
      {withCoords.map((p, i) => {
        const cx = ((p.coordinates!.pX! + 1.5) / 3.0) * 60;
        const cy = ((5 - (p.coordinates!.pZ ?? 2.5)) / 5.0) * 80;
        return (
          <circle
            key={i}
            cx={Math.max(3, Math.min(57, cx))}
            cy={Math.max(3, Math.min(77, cy))}
            r="3"
            fill={pitchDotColor(p.result)}
            opacity="0.85"
          />
        );
      })}
    </svg>
  );
}

function PlayIcon({ event }: { event?: string }) {
  const e = (event ?? '').toLowerCase();
  const cls = 'w-3.5 h-3.5 flex-shrink-0 mt-0.5';
  if (e.includes('home run')) return <Trophy className={`${cls} text-[#FFB700]`} />;
  if (e.includes('strikeout')) return <Zap className={`${cls} text-red-400`} />;
  if (e.includes('walk') || e.includes('hit by pitch'))
    return <ArrowRight className={`${cls} text-blue-400`} />;
  if (['single', 'double', 'triple'].some(h => e.includes(h)))
    return <Circle className={`${cls} text-green-400`} />;
  if (e.includes('out') || e.includes('grounded') || e.includes('flied') || e.includes('lined'))
    return <X className={`${cls} text-gray-500`} />;
  return <Minus className={`${cls} text-gray-600`} />;
}

function PlayRow({ play, id }: { play: ParsedPlay; id: string }) {
  const [open, setOpen] = useState(false);
  const hasPitches = play.pitches.length > 0;

  return (
    <div id={id} className="border-t border-white/5 pt-2 pb-1">
      <button
        className="w-full text-left flex items-start gap-2"
        onClick={() => hasPitches && setOpen(o => !o)}
      >
        <PlayIcon event={play.event} />
        <span className="text-xs text-gray-300 flex-1 leading-relaxed">
          {play.description}
        </span>
        {play.isScoringPlay && (
          <span className="text-xs text-[#FFB700] flex-shrink-0 ml-1">
            +{play.rbi ?? ''}
          </span>
        )}
        {hasPitches && (
          <span className="text-xs text-gray-600 flex-shrink-0 ml-1 select-none">
            {open ? '▲' : '▼'}
          </span>
        )}
      </button>
      {open && hasPitches && (
        <div className="mt-2 flex items-start gap-3 pl-5">
          <PitchZone pitches={play.pitches} />
          <div className="flex-1 space-y-0.5 pt-0.5">
            {play.pitches.map((p, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: pitchDotColor(p.result) }}
                />
                {p.speed != null && (
                  <span className="tabular-nums w-9 text-gray-400">
                    {p.speed.toFixed(0)} mph
                  </span>
                )}
                {p.type?.description && (
                  <span className="truncate">{p.type.description}</span>
                )}
                {p.callDescription && (
                  <span className="text-gray-600 truncate">— {p.callDescription}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function PlayByPlay({ game }: { game: ParsedLiveGame }) {
  const { allPlays } = game;

  // Group by half-inning preserving order
  const groups: Array<{
    key: string;
    label: string;
    plays: ParsedPlay[];
    lastScore: string;
  }> = [];
  const groupMap = new Map<string, (typeof groups)[0]>();

  for (const play of allPlays) {
    const key = `${play.halfInning}-${play.inning}`;
    if (!groupMap.has(key)) {
      const g = {
        key,
        label: `${play.halfInning === 'top' ? '▲ Top' : '▼ Bottom'} ${play.inning}`,
        plays: [] as ParsedPlay[],
        lastScore: '',
      };
      groupMap.set(key, g);
      groups.push(g);
    }
    groupMap.get(key)!.plays.push(play);
  }

  for (const g of groups) {
    const last = g.plays[g.plays.length - 1];
    g.lastScore = `${last.awayScore}–${last.homeScore}`;
  }

  if (groups.length === 0) {
    return (
      <div className="trident-card p-4">
        <h3 className="text-sm font-semibold mb-2">Play by Play</h3>
        <p className="text-xs text-gray-500 text-center py-4">No plays yet.</p>
      </div>
    );
  }

  const openKeys = new Set(groups.slice(-2).map(g => g.key));

  return (
    <div className="trident-card p-4">
      <h3 className="text-sm font-semibold mb-3">Play by Play</h3>
      <div className="space-y-1">
        {groups.map(g => (
          <details key={g.key} open={openKeys.has(g.key)}>
            <summary className="cursor-pointer select-none flex justify-between items-center py-1.5 text-xs font-semibold text-gray-400 hover:text-gray-200 transition-colors">
              <span>{g.label}</span>
              <span className="text-gray-600 font-normal tabular-nums">{g.lastScore}</span>
            </summary>
            <div className="pb-1">
              {g.plays.map(p => (
                <PlayRow key={p.index} play={p} id={`play-${p.index}`} />
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
