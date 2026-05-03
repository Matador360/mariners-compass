import { NextResponse } from 'next/server';

const BASE = 'https://statsapi.mlb.com/api/v1';
const SPLIT_SIT_CODES = 'vl,vr,h,a,d,n,risp,rispt2,2sk,1sk,empty,7i,sp';
const SEASON = new Date().getFullYear();

export interface SplitsResponse {
  hitting?: Record<string, Record<string, string | number>>;
  pitching?: Record<string, Record<string, string | number>>;
}

interface ApiSplit {
  split?: { code?: string; description?: string };
  stat?: Record<string, string | number>;
}

async function fetchGroup(
  playerId: number,
  group: 'hitting' | 'pitching',
): Promise<Record<string, Record<string, string | number>> | null> {
  const url = `${BASE}/people/${playerId}/stats?stats=statSplits&group=${group}&season=${SEASON}&sitCodes=${SPLIT_SIT_CODES}`;
  const r = await fetch(url, { next: { revalidate: 3600 } });
  if (!r.ok) return null;
  type Res = { stats?: Array<{ splits?: ApiSplit[] }> };
  const data: Res = await r.json();
  const splits = data.stats?.[0]?.splits ?? [];
  const out: Record<string, Record<string, string | number>> = {};
  for (const s of splits) {
    const code = s.split?.code;
    if (code && s.stat) {
      out[code] = s.stat;
    }
  }
  return Object.keys(out).length > 0 ? out : null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ playerId: string }> },
) {
  const { playerId } = await params;
  const id = Number(playerId);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }

  const [hittingRes, pitchingRes] = await Promise.allSettled([
    fetchGroup(id, 'hitting'),
    fetchGroup(id, 'pitching'),
  ]);

  const out: SplitsResponse = {
    hitting: hittingRes.status === 'fulfilled' ? hittingRes.value ?? undefined : undefined,
    pitching: pitchingRes.status === 'fulfilled' ? pitchingRes.value ?? undefined : undefined,
  };

  return NextResponse.json(out, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
}
