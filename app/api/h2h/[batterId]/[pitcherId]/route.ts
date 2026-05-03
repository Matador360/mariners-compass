import { NextResponse } from 'next/server';

const BASE = 'https://statsapi.mlb.com/api/v1';

export interface H2HResponse {
  pa: number;
  ab: number;
  h: number;
  hr: number;
  doubles: number;
  triples: number;
  bb: number;
  so: number;
  rbi: number;
  avg: string;
  obp: string;
  slg: string;
  ops: string;
  /** Crude sample-size flag — true when PA < 8. */
  smallSample: boolean;
}

const EMPTY: H2HResponse = {
  pa: 0, ab: 0, h: 0, hr: 0, doubles: 0, triples: 0, bb: 0, so: 0, rbi: 0,
  avg: '.000', obp: '.000', slg: '.000', ops: '.000', smallSample: true,
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ batterId: string; pitcherId: string }> },
) {
  const { batterId, pitcherId } = await params;
  const b = Number(batterId);
  const p = Number(pitcherId);
  if (!Number.isFinite(b) || !Number.isFinite(p) || b <= 0 || p <= 0) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }

  try {
    const url = `${BASE}/people/${b}/stats?stats=vsPlayer&group=hitting&opposingPlayerId=${p}&sportId=1`;
    const r = await fetch(url, { next: { revalidate: 86400 } });
    if (!r.ok) {
      return NextResponse.json(EMPTY, {
        headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
      });
    }
    type SplitsRes = {
      stats?: Array<{
        splits?: Array<{
          stat?: Record<string, string | number | undefined>;
        }>;
      }>;
    };
    const data: SplitsRes = await r.json();
    // The "career" split aggregates all years.
    const splits = data.stats?.[0]?.splits ?? [];
    const careerStat =
      splits.find(s => (s as { season?: string }).season == null)?.stat ??
      splits[splits.length - 1]?.stat ??
      {};

    const num = (v: unknown): number => {
      const n = Number(v ?? 0);
      return Number.isFinite(n) ? n : 0;
    };
    const str = (v: unknown, fb = '.000'): string => (v == null ? fb : String(v));

    const pa = num(careerStat.plateAppearances);
    const out: H2HResponse = {
      pa,
      ab: num(careerStat.atBats),
      h: num(careerStat.hits),
      hr: num(careerStat.homeRuns),
      doubles: num(careerStat.doubles),
      triples: num(careerStat.triples),
      bb: num(careerStat.baseOnBalls),
      so: num(careerStat.strikeOuts),
      rbi: num(careerStat.rbi),
      avg: str(careerStat.avg),
      obp: str(careerStat.obp),
      slg: str(careerStat.slg),
      ops: str(careerStat.ops),
      smallSample: pa < 8,
    };
    return NextResponse.json(out, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
    });
  } catch (err) {
    console.error('[/api/h2h]', err);
    return NextResponse.json(EMPTY, {
      headers: { 'Cache-Control': 'public, s-maxage=300' },
    });
  }
}
