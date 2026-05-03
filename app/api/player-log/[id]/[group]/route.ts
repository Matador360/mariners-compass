import { NextResponse } from 'next/server';
import { fetchPlayerGameLog } from '@/lib/mlb-api';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; group: string }> },
) {
  const { id, group } = await params;
  const playerId = Number(id);
  if (!Number.isFinite(playerId) || playerId <= 0) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }
  if (group !== 'hitting' && group !== 'pitching') {
    return NextResponse.json({ error: 'invalid group' }, { status: 400 });
  }

  try {
    const log = await fetchPlayerGameLog(playerId, group);
    return NextResponse.json(
      { log },
      { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600' } },
    );
  } catch (err) {
    console.error('[/api/player-log]', err);
    return NextResponse.json({ log: [] }, { headers: { 'Cache-Control': 'public, s-maxage=60' } });
  }
}
