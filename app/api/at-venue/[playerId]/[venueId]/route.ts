import { NextResponse } from 'next/server';

const BASE = 'https://statsapi.mlb.com/api/v1';

export interface AtVenueResponse {
  group: 'hitting' | 'pitching' | null;
  pa: number;
  ab: number;
  h: number;
  hr: number;
  avg: string;
  ops: string;
}

const EMPTY: AtVenueResponse = {
  group: null, pa: 0, ab: 0, h: 0, hr: 0, avg: '.000', ops: '.000',
};

async function fetchByVenue(playerId: number, venueId: number, group: 'hitting' | 'pitching') {
  const url = `${BASE}/people/${playerId}/stats?stats=byVenue&group=${group}&venueIds=${venueId}&sportId=1`;
  const r = await fetch(url, { next: { revalidate: 86400 } });
  if (!r.ok) return null;
  type Res = { stats?: Array<{ splits?: Array<{ stat?: Record<string, string | number> }> }> };
  const d: Res = await r.json();
  return d.stats?.[0]?.splits?.[0]?.stat ?? null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ playerId: string; venueId: string }> },
) {
  const { playerId, venueId } = await params;
  const p = Number(playerId);
  const v = Number(venueId);
  if (!Number.isFinite(p) || !Number.isFinite(v) || p <= 0 || v <= 0) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }

  const [hRes, pRes] = await Promise.allSettled([
    fetchByVenue(p, v, 'hitting'),
    fetchByVenue(p, v, 'pitching'),
  ]);

  const num = (x: unknown): number => {
    const n = Number(x ?? 0);
    return Number.isFinite(n) ? n : 0;
  };
  const str = (x: unknown, fb = '.000'): string => (x == null ? fb : String(x));

  let out: AtVenueResponse = EMPTY;
  const h = hRes.status === 'fulfilled' ? (hRes.value as Record<string, string | number> | null) : null;
  if (h && num(h.plateAppearances) > 0) {
    out = {
      group: 'hitting',
      pa: num(h.plateAppearances),
      ab: num(h.atBats),
      h: num(h.hits),
      hr: num(h.homeRuns),
      avg: str(h.avg),
      ops: str(h.ops),
    };
  } else {
    const pi = pRes.status === 'fulfilled' ? (pRes.value as Record<string, string | number> | null) : null;
    if (pi) {
      out = {
        group: 'pitching',
        pa: num(pi.battersFaced),
        ab: num(pi.atBats),
        h: num(pi.hits),
        hr: num(pi.homeRuns),
        avg: str(pi.avg),
        ops: str(pi.ops),
      };
    }
  }
  return NextResponse.json(out, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
  });
}
