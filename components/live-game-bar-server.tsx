import { Suspense } from 'react';
import { getTodayGameContext, fetchLiveGame } from '@/lib/live-game';
import { LiveGameBar } from './live-game-bar';

async function LiveGameBarInner() {
  const ctx = await getTodayGameContext();
  if (!ctx) return null;

  let game;
  try {
    game = await fetchLiveGame(ctx.gamePk);
  } catch {
    return null;
  }

  return <LiveGameBar initialData={game} gameDate={ctx.gameDate} />;
}

export function LiveGameBarServer() {
  return (
    <Suspense fallback={null}>
      <LiveGameBarInner />
    </Suspense>
  );
}
