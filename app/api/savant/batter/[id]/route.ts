import { NextResponse } from 'next/server';
import {
  fetchBatterStatcast,
  fetchExpectedStatsLeaderboard,
  fetchSprintSpeed,
} from '@/lib/savant';
import { fetchPlayerSeasonStats } from '@/lib/mlb-api';
import type { MLBHittingStats } from '@/types/mlb';

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

  const [pitchesRes, expectedRes, speedRes, seasonRes] = await Promise.allSettled([
    fetchBatterStatcast(playerId, year),
    fetchExpectedStatsLeaderboard(year),
    fetchSprintSpeed(playerId, year),
    fetchPlayerSeasonStats(playerId, 'hitting'),
  ]);

  const pitches = pitchesRes.status === 'fulfilled' ? pitchesRes.value : [];
  const expectedAll = expectedRes.status === 'fulfilled' ? expectedRes.value : [];
  const expected = expectedAll.find(r => r.playerId === playerId) ?? null;
  const sprintSpeed = speedRes.status === 'fulfilled' ? speedRes.value : null;
  const seasonStats = seasonRes.status === 'fulfilled'
    ? (seasonRes.value as MLBHittingStats | null)
    : null;

  return NextResponse.json(
    { pitches, expected, sprintSpeed, seasonStats },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
  );
}
