import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchLiveGame } from '@/lib/live-game';
import { GameClient } from './game-client';

interface Props {
  params: Promise<{ gamePk: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { gamePk } = await params;
    const game = await fetchLiveGame(Number(gamePk));
    const { teams, score, state } = game;
    const status =
      state === 'Preview' ? 'Upcoming' : `${score.away}–${score.home}`;
    return {
      title: `${teams.away.abbrev} vs ${teams.home.abbrev} · ${status} — The Trident`,
      description: `${teams.away.name} vs ${teams.home.name} · ${state}`,
    };
  } catch {
    return { title: 'Game — The Trident' };
  }
}

export default async function GamePage({ params }: Props) {
  const { gamePk } = await params;
  const pk = Number(gamePk);
  if (!Number.isFinite(pk) || pk <= 0) notFound();

  let game;
  try {
    game = await fetchLiveGame(pk);
  } catch {
    notFound();
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <GameClient initialData={game} />
    </main>
  );
}
