import { NextResponse } from 'next/server';
import { fetchPitcherStatcast, fetchPitchArsenal } from '@/lib/savant';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const playerId = Number(id);
  if (!Number.isFinite(playerId) || playerId <= 0) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }

  const year = new Date().getFullYear();

  const [pitchesRes, arsenalRes] = await Promise.allSettled([
    fetchPitcherStatcast(playerId, year),
    fetchPitchArsenal(playerId, year),
  ]);

  const pitches = pitchesRes.status === 'fulfilled' ? pitchesRes.value : [];
  const arsenal = arsenalRes.status === 'fulfilled' ? arsenalRes.value : [];

  return NextResponse.json(
    { pitches, arsenal },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
  );
}
