import { NextResponse } from 'next/server';

const UA = 'Mozilla/5.0 (compatible; TheTrident/1.0; +https://thetrident.app)';

export interface CatcherDefenseResponse {
  popTime: number | null;       // seconds, lower is better
  framingRuns: number | null;   // strikes-above-avg converted to runs
  caughtStealingPct: number | null;
}

const EMPTY: CatcherDefenseResponse = {
  popTime: null,
  framingRuns: null,
  caughtStealingPct: null,
};

interface CsvRow {
  [key: string]: string | undefined;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const fields = line.split(',');
    const rec: CsvRow = {};
    headers.forEach((h, i) => { rec[h] = (fields[i] ?? '').trim(); });
    return rec;
  });
}

async function fetchCsv(url: string): Promise<CsvRow[]> {
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(12_000),
      headers: { 'User-Agent': UA },
      next: { revalidate: 86400 },
    } as RequestInit & { next: { revalidate: number } });
    if (!r.ok) return [];
    const text = await r.text();
    return parseCsv(text);
  } catch {
    return [];
  }
}

const num = (s: string | undefined): number | null => {
  if (s == null || s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

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
  const [popRows, frameRows] = await Promise.all([
    fetchCsv(`https://baseballsavant.mlb.com/leaderboard/poptime?year=${year}&team=&min2attempts=5&csv=true`),
    fetchCsv(`https://baseballsavant.mlb.com/leaderboard/catcher-framing?year=${year}&team=&min=q&csv=true`),
  ]);

  const popRow = popRows.find(r => num(r['player_id'] ?? r['playerid']) === playerId);
  const frameRow = frameRows.find(r => num(r['player_id'] ?? r['playerid']) === playerId);

  const out: CatcherDefenseResponse = {
    popTime: popRow ? num(popRow['pop_2b_sba'] ?? popRow['pop_2b_sba_count']) : null,
    framingRuns: frameRow ? num(frameRow['runs_extra_strikes'] ?? frameRow['framing_runs']) : null,
    caughtStealingPct: popRow ? num(popRow['caught_stealing_2b']) : null,
  };

  // If both are null (e.g. first call early in season), return EMPTY w/ short cache
  if (out.popTime == null && out.framingRuns == null) {
    return NextResponse.json(EMPTY, {
      headers: { 'Cache-Control': 'public, s-maxage=600' },
    });
  }
  return NextResponse.json(out, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
  });
}
