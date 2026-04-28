'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ParsedLiveGame } from '@/lib/live-game';
import { GameHeader } from '@/components/game-header';
import { WpCurve } from '@/components/charts/wp-curve';
import { LeverageSpikes } from '@/components/leverage-spikes';
import { PlayByPlay } from '@/components/play-by-play';
import { LiveAtBat } from '@/components/live-at-bat';
import { PitcherArsenalLive } from '@/components/pitcher-arsenal-live';
import { UmpireScorecard } from '@/components/umpire-scorecard';
import { LiveContactQuality } from '@/components/live-contact-quality';

const LIVE_POLL_MS = 7_000;

function FreshnessBadge({ fetchedAt }: { fetchedAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);
  const ageSec = Math.max(0, Math.round((now - fetchedAt) / 1000));
  const stale = ageSec >= LIVE_POLL_MS / 1000 + 4;
  return (
    <div className="flex items-center justify-end gap-1.5 text-[10px] text-gray-500">
      <span
        className={`h-1.5 w-1.5 rounded-full ${stale ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`}
      />
      <span className="tabular-nums">updated {ageSec}s ago</span>
    </div>
  );
}

export function GameClient({ initialData }: { initialData: ParsedLiveGame }) {
  const [game, setGame] = useState<ParsedLiveGame>(initialData);
  const inFlightRef = useRef(false);

  const poll = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const res = await fetch(`/api/game/${initialData.gamePk}`, { cache: 'no-store' });
      if (!res.ok) return;
      const next = (await res.json()) as ParsedLiveGame;
      setGame(next);
    } catch {
      // ignore transient poll errors
    } finally {
      inFlightRef.current = false;
    }
  }, [initialData.gamePk]);

  useEffect(() => {
    if (game.state !== 'Live') return;
    const id = setInterval(poll, LIVE_POLL_MS);
    // Poll immediately on tab focus too — common UX expectation.
    const onVis = () => {
      if (document.visibilityState === 'visible') poll();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [game.state, poll]);

  const handleSelectPlay = (playIndex: number) => {
    document
      .getElementById(`play-${playIndex}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const isLive = game.state === 'Live';

  return (
    <div className="space-y-4 pb-8">
      <GameHeader game={game} />
      {isLive && <FreshnessBadge fetchedAt={game.fetchedAt} />}
      {isLive && <LiveAtBat game={game} />}
      {isLive && (
        <PitcherArsenalLive
          game={game}
          pitcherId={game.currentPitcher?.id}
          pitcherName={game.currentPitcher?.fullName}
        />
      )}
      {isLive && <UmpireScorecard game={game} />}
      {isLive && <LiveContactQuality game={game} />}
      {game.wpaTimeline.length > 0 && <WpCurve data={game.wpaTimeline} />}
      <LeverageSpikes game={game} onSelectPlay={handleSelectPlay} />
      <PlayByPlay game={game} />
    </div>
  );
}
