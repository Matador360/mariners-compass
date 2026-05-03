import { NextResponse } from 'next/server';

const BASE = 'https://statsapi.mlb.com/api/v1';

export interface VsTeamResponse {
  group: 'hitting' | 'pitching' | null;
  pa: number;
  ab: number;
  h: number;
  hr: number;
  bb: number;
  so: number;
  avg: string;
  ops: string;
  era?: string;
  whip?: string;
}

const EMPTY: VsTeamResponse = {
  group: null, pa: 0, ab: 0, h: 0, hr: 0, bb: 0, so: 0, avg: '.000', ops: '.000',
};

async function fetchVsTeam(playerId: number, teamId: number, group: 'hitting' | 'pitching') {
  const url = `${BASE}/people/${playerId}/stats?stats=vsTeam&group=${group}&opposingTeamId=${teamId}&sportId=1`;
  const r = await fetch(url, { next: { revalidate: 86400 } });
  if (!r.ok) return null;
  type Res = { stats?: Array<{ splits?: Array<{ stat?: Record<string, string | number> }> }> };
  const d: Res = await r.json();
  const splits = d.stats?.[0]?.splits ?? [];
  const careerStat = splits[splits.length - 1]?.stat;
  return careerStat ?? null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ playerId: string; teamId: string }> },
) {
  const { playerId, teamId } = await params;
  const p = Number(playerId);
  const t = Number(teamId);
  if (!Number.isFinite(p) || !Number.isFinite(t) || p <= 0 || t <= 0) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }

  const [hRes, pRes] = await Promise.allSettled([
    fetchVsTeam(p, t, 'hitting'),
    fetchVsTeam(p, t, 'pitching'),
  ]);

  const num = (v: unknown): number => {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
  };
  const str = (v: unknown, fb = '.000'): string => (v == null ? fb : String(v));

  let out: VsTeamResponse = EMPTY;
  const h = hRes.status === 'fulfilled' ? hRes.value : null;
  if (h && num((h as Record<string, string | number>).plateAppearances) > 0) {
    out = {
      group: 'hitting',
      pa: num((h as Record<string, string | number>).plateAppearances),
      ab: num((h as Record<string, string | number>).atBats),
      h: num((h as Record<string, string | number>).hits),
      hr: num((h as Record<string, string | number>).homeRuns),
      bb: num((h as Record<string, string | number>).baseOnBalls),
      so: num((h as Record<string, string | number>).strikeOuts),
      avg: str((h as Record<string, string | number>).avg),
      ops: str((h as Record<string, string | number>).ops),
    };
  } else {
    const pi = pRes.status === 'fulfilled' ? pRes.value : null;
    if (pi) {
      out = {
        group: 'pitching',
        pa: num((pi as Record<string, string | number>).battersFaced),
        ab: num((pi as Record<string, string | number>).atBats),
        h: num((pi as Record<string, string | number>).hits),
        hr: num((pi as Record<string, string | number>).homeRuns),
        bb: num((pi as Record<string, string | number>).baseOnBalls),
        so: num((pi as Record<string, string | number>).strikeOuts),
        avg: str((pi as Record<string, string | number>).avg),
        ops: str((pi as Record<string, string | number>).ops),
        era: str((pi as Record<string, string | number>).era, '—'),
        whip: str((pi as Record<string, string | number>).whip, '—'),
      };
    }
  }

  return NextResponse.json(out, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
  });
}
