import { NextResponse } from 'next/server';
import { fetchLiveGame } from '@/lib/live-game';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ gamePk: string }> },
) {
  const { gamePk } = await params;
  const pk = Number(gamePk);
  if (!Number.isFinite(pk) || pk <= 0) {
    return NextResponse.json({ error: 'invalid gamePk' }, { status: 400 });
  }
  try {
    const game = await fetchLiveGame(pk);
    return NextResponse.json(game);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
