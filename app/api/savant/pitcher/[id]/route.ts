import { NextResponse } from 'next/server';
import { fetchPitcherStatcast, fetchPitchArsenal } from '@/lib/savant';
import { fetchPlayerSeasonStats } from '@/lib/mlb-api';
import type { MLBPitchingStats } from '@/types/mlb';

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

  const [pitchesRes, arsenalRes, seasonRes] = await Promise.allSettled([
    fetchPitcherStatcast(playerId, year),
    fetchPitchArsenal(playerId, year),
    fetchPlayerSeasonStats(playerId, 'pitching'),
  ]);

  const pitches = pitchesRes.status === 'fulfilled' ? pitchesRes.value : [];
  const arsenal = arsenalRes.status === 'fulfilled' ? arsenalRes.value : [];
  const seasonStats = seasonRes.status === 'fulfilled'
    ? (seasonRes.value as MLBPitchingStats | null)
    : null;

  return NextResponse.json(
    { pitches, arsenal, seasonStats },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
  );
}
