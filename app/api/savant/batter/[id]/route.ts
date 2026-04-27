import { NextResponse } from 'next/server';
import {
  fetchBatterStatcast,
  fetchExpectedStatsLeaderboard,
  fetchSprintSpeed,
} from '@/lib/savant';

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

  const [pitchesRes, expectedRes, speedRes] = await Promise.allSettled([
    fetchBatterStatcast(playerId, year),
    fetchExpectedStatsLeaderboard(year),
    fetchSprintSpeed(playerId, year),
  ]);

  const pitches = pitchesRes.status === 'fulfilled' ? pitchesRes.value : [];
  const expectedAll = expectedRes.status === 'fulfilled' ? expectedRes.value : [];
  const expected = expectedAll.find(r => r.playerId === playerId) ?? null;
  const sprintSpeed = speedRes.status === 'fulfilled' ? speedRes.value : null;

  return NextResponse.json(
    { pitches, expected, sprintSpeed },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
  );
}
