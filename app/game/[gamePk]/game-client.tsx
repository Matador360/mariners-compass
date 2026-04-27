'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ParsedLiveGame } from '@/lib/live-game';
import { GameHeader } from '@/components/game-header';
import { WpCurve } from '@/components/charts/wp-curve';
import { LeverageSpikes } from '@/components/leverage-spikes';
import { PlayByPlay } from '@/components/play-by-play';

export function GameClient({ initialData }: { initialData: ParsedLiveGame }) {
  const [game, setGame] = useState<ParsedLiveGame>(initialData);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/game/${initialData.gamePk}`);
      if (!res.ok) return;
      const next = (await res.json()) as ParsedLiveGame;
      setGame(next);
    } catch {
      // ignore transient poll errors
    }
  }, [initialData.gamePk]);

  useEffect(() => {
    if (game.state !== 'Live') return;
    const id = setInterval(poll, 15_000);
    return () => clearInterval(id);
  }, [game.state, poll]);

  const handleSelectPlay = (playIndex: number) => {
    document
      .getElementById(`play-${playIndex}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="space-y-4 pb-8">
      <GameHeader game={game} />
      {game.wpaTimeline.length > 0 && <WpCurve data={game.wpaTimeline} />}
      <LeverageSpikes game={game} onSelectPlay={handleSelectPlay} />
      <PlayByPlay game={game} />
    </div>
  );
}
