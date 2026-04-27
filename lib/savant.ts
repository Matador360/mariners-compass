// ─── Inline CSV Parser ───────────────────────────────────────────────────────

function parseCsvRow(row: string): string[] {
  const fields: string[] = [];
  let cur = '';
  let inQ = false;
  let i = 0;
  while (i < row.length) {
    const c = row[i];
    if (inQ) {
      if (c === '"') {
        if (row[i + 1] === '"') { cur += '"'; i += 2; }
        else { inQ = false; i++; }
      } else { cur += c; i++; }
    } else {
      if (c === '"') { inQ = true; i++; }
      else if (c === ',') { fields.push(cur); cur = ''; i++; }
      else { cur += c; i++; }
    }
  }
  fields.push(cur);
  return fields;
}

function coerceField(raw: string): string | number | undefined {
  const s = raw.trim();
  if (s === '' || s === 'null' || s === 'NA' || s === 'N/A' || s === 'NaN') return undefined;
  const n = Number(s);
  return isNaN(n) ? s : n;
}

type CsvRow = Record<string, string | number | undefined>;

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.length > 0);
  if (lines.length < 2) return [];
  const headers = parseCsvRow(lines[0]).map(h => h.trim());
  const out: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvRow(lines[i]);
    const rec: CsvRow = {};
    for (let j = 0; j < headers.length; j++) {
      if (headers[j]) rec[headers[j]] = coerceField(fields[j] ?? '');
    }
    out.push(rec);
  }
  return out;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SavantPitch {
  batterId: number;
  pitcherId: number;
  pitchType?: string;
  pitchName?: string;
  releaseSpeed?: number;
  releaseSpinRate?: number;
  plateX?: number;
  plateZ?: number;
  zone?: number;
  pfxX?: number;
  pfxZ?: number;
  description?: string;
  events?: string;
  type?: 'B' | 'S' | 'X';
  hitDistance?: number;
  launchSpeed?: number;
  launchAngle?: number;
  hcX?: number;
  hcY?: number;
  balls?: number;
  strikes?: number;
  outsWhenUp?: number;
  inning?: number;
  inningTopBot?: 'Top' | 'Bot';
  gameDate?: string;
  batterStand?: 'L' | 'R';
  pitcherHand?: 'L' | 'R';
}

export interface SavantExpected {
  playerId: number;
  playerName?: string;
  year: number;
  estBA?: number;
  estSLG?: number;
  estWOBA?: number;
  brlPct?: number;
  hardHitPct?: number;
  avgExitVelo?: number;
}

export interface SavantArsenalPitch {
  pitcherId: number;
  year: number;
  pitchType?: string;
  pitchName?: string;
  usagePct?: number;
  velocity?: number;
  spin?: number;
  whiffPct?: number;
  putAwayPct?: number;
  runValuePer100?: number;
}

export interface SavantSprintSpeed {
  playerId: number;
  year: number;
  sprintSpeed?: number;
}

// ─── Fetch infrastructure ─────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const UA = 'Mozilla/5.0 (compatible; TheTrident/1.0; +https://thetrident.app)';

function ttl(year: number): number {
  return year >= CURRENT_YEAR ? 3600 : 604800;
}

async function fetchCsv(url: string, year: number): Promise<CsvRow[]> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      headers: { 'User-Agent': UA },
      next: { revalidate: ttl(year) },
    } as RequestInit & { next: { revalidate: number } });

    if (!res.ok) {
      console.warn(`[savant] HTTP ${res.status} for ${url}`);
      return [];
    }
    const text = await res.text();
    if (!text.trim()) {
      console.warn(`[savant] empty response for ${url}`);
      return [];
    }
    return parseCsv(text);
  } catch (err) {
    console.warn(`[savant] fetch failed for ${url}:`, (err as Error).message);
    return [];
  }
}

// ─── Field coercers ───────────────────────────────────────────────────────────

function n(v: string | number | undefined): number | undefined {
  if (v == null) return undefined;
  const num = Number(v);
  return isNaN(num) ? undefined : num;
}

function str(v: string | number | undefined): string | undefined {
  if (v == null || v === '') return undefined;
  return String(v);
}

// ─── Record mappers ───────────────────────────────────────────────────────────

function mapPitch(r: CsvRow): SavantPitch {
  const rawType = str(r['type']);
  const rawTop = str(r['inning_topbot']);
  const rawStand = str(r['stand']);
  const rawHand = str(r['p_throws']);
  return {
    batterId: n(r['batter']) ?? 0,
    pitcherId: n(r['pitcher']) ?? 0,
    pitchType: str(r['pitch_type']),
    pitchName: str(r['pitch_name']),
    releaseSpeed: n(r['release_speed']),
    releaseSpinRate: n(r['release_spin_rate']),
    plateX: n(r['plate_x']),
    plateZ: n(r['plate_z']),
    zone: n(r['zone']),
    pfxX: n(r['pfx_x']),
    pfxZ: n(r['pfx_z']),
    description: str(r['description']),
    events: str(r['events']),
    type: (rawType === 'B' || rawType === 'S' || rawType === 'X') ? rawType : undefined,
    hitDistance: n(r['hit_distance_sc']),
    launchSpeed: n(r['launch_speed']),
    launchAngle: n(r['launch_angle']),
    hcX: n(r['hc_x']),
    hcY: n(r['hc_y']),
    balls: n(r['balls']),
    strikes: n(r['strikes']),
    outsWhenUp: n(r['outs_when_up']),
    inning: n(r['inning']),
    inningTopBot: (rawTop === 'Top' || rawTop === 'Bot') ? rawTop : undefined,
    gameDate: str(r['game_date']),
    batterStand: (rawStand === 'L' || rawStand === 'R') ? rawStand : undefined,
    pitcherHand: (rawHand === 'L' || rawHand === 'R') ? rawHand : undefined,
  };
}

function mapExpected(r: CsvRow): SavantExpected {
  const last = str(r['last_name']);
  const first = str(r['first_name']);
  const combined = str(r['last_name, first_name']);
  const playerName = first && last ? `${first} ${last}` : (combined ?? last);
  return {
    playerId: n(r['player_id']) ?? 0,
    playerName,
    year: n(r['year']) ?? CURRENT_YEAR,
    estBA: n(r['est_ba']),
    estSLG: n(r['est_slg']),
    estWOBA: n(r['est_woba']),
    brlPct: n(r['brl_percent']),
    hardHitPct: n(r['hard_hit_percent']),
    avgExitVelo: n(r['avg_exit_velocity']),
  };
}

function mapArsenal(r: CsvRow): SavantArsenalPitch {
  return {
    pitcherId: n(r['pitcher_id']) ?? n(r['player_id']) ?? 0,
    year: n(r['year']) ?? CURRENT_YEAR,
    pitchType: str(r['pitch_type']),
    pitchName: str(r['pitch_name']),
    usagePct: n(r['pitch_percent']) ?? n(r['count_percent']),
    velocity: n(r['avg_speed']) ?? n(r['release_speed']),
    spin: n(r['avg_spin']) ?? n(r['release_spin_rate']),
    whiffPct: n(r['whiff_percent']) ?? n(r['swing_and_miss_percent']),
    putAwayPct: n(r['put_away']),
    runValuePer100: n(r['run_value_per100']),
  };
}

function mapSprintSpeed(r: CsvRow): SavantSprintSpeed {
  return {
    playerId: n(r['player_id']) ?? 0,
    year: n(r['year']) ?? CURRENT_YEAR,
    sprintSpeed: n(r['sprint_speed']),
  };
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

export async function fetchBatterStatcast(
  playerId: number,
  year: number,
): Promise<SavantPitch[]> {
  const url =
    `https://baseballsavant.mlb.com/statcast_search/csv?all=true&type=details` +
    `&hfGT=R%7C&hfSea=${year}%7C&player_type=batter` +
    `&batters_lookup%5B%5D=${playerId}&min_results=0&min_pitches=0&min_pas=0&group_by=name`;
  const rows = await fetchCsv(url, year);
  return rows.map(mapPitch).filter(p => p.batterId > 0 || p.pitcherId > 0);
}

export async function fetchPitcherStatcast(
  playerId: number,
  year: number,
): Promise<SavantPitch[]> {
  const url =
    `https://baseballsavant.mlb.com/statcast_search/csv?all=true&type=details` +
    `&hfGT=R%7C&hfSea=${year}%7C&player_type=pitcher` +
    `&pitchers_lookup%5B%5D=${playerId}&min_results=0&min_pitches=0&min_pas=0&group_by=name`;
  const rows = await fetchCsv(url, year);
  return rows.map(mapPitch).filter(p => p.batterId > 0 || p.pitcherId > 0);
}

export async function fetchExpectedStatsLeaderboard(
  year: number,
): Promise<SavantExpected[]> {
  const url = `https://baseballsavant.mlb.com/leaderboard/expected_statistics?type=batter&year=${year}&csv=true`;
  const rows = await fetchCsv(url, year);
  return rows.map(mapExpected).filter(r => r.playerId > 0);
}

export async function fetchPitchArsenal(
  pitcherId: number,
  year: number,
): Promise<SavantArsenalPitch[]> {
  const url = `https://baseballsavant.mlb.com/leaderboard/pitch-arsenal?year=${year}&min=10&type=&pitchType=&csv=true`;
  const rows = await fetchCsv(url, year);
  const all = rows.map(mapArsenal).filter(r => r.pitcherId > 0);
  return all.filter(r => r.pitcherId === pitcherId);
}

export async function fetchSprintSpeedLeaderboard(
  year: number,
): Promise<SavantSprintSpeed[]> {
  const url =
    `https://baseballsavant.mlb.com/sprint_speed_leaderboard` +
    `?year=${year}&min_year=${year}&max_year=${year}&min_attempts=10&csv=true`;
  const rows = await fetchCsv(url, year);
  return rows.map(mapSprintSpeed).filter(r => r.playerId > 0);
}

export async function fetchSprintSpeed(
  playerId: number,
  year: number,
): Promise<number | null> {
  const board = await fetchSprintSpeedLeaderboard(year);
  return board.find(r => r.playerId === playerId)?.sprintSpeed ?? null;
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/**
 * Per-batter Statcast summary computed directly from in-play pitches.
 *
 * Rationale: Savant's expected_statistics leaderboard only includes
 * qualified batters, so early-season or part-time players resolve to
 * `expected = null` even though their per-batter pitch CSV is full. The
 * Statcast tab used to render those tiles as "—". This helper provides
 * a fallback so we can show real numbers from the same data the spray
 * chart already uses.
 *
 * Definitions match Statcast's published thresholds:
 * - Hard Hit: launchSpeed >= 95 mph
 * - Barrel (approximation): launchSpeed >= 98 mph AND 26° <= launchAngle <= 30°
 *   (Real definition is a curve that widens with EV — this simple form
 *    matches at the threshold and is good enough for fallback display.)
 */
export interface BatterStatcastSummary {
  avgExitVelo: number;
  hardHitPct: number;
  brlPct: number;
  battedBalls: number;
}

export function computeBatterStatcastSummary(
  pitches: SavantPitch[],
): BatterStatcastSummary | null {
  const inPlay = pitches.filter(
    (p): p is SavantPitch & { launchSpeed: number } =>
      p.type === 'X' && typeof p.launchSpeed === 'number',
  );
  if (inPlay.length === 0) return null;

  const sumEV = inPlay.reduce((s, p) => s + p.launchSpeed, 0);
  const avgExitVelo = sumEV / inPlay.length;
  const hardHits = inPlay.filter(p => p.launchSpeed >= 95).length;
  const barrels = inPlay.filter(
    p =>
      p.launchSpeed >= 98 &&
      typeof p.launchAngle === 'number' &&
      p.launchAngle >= 26 &&
      p.launchAngle <= 30,
  ).length;

  return {
    avgExitVelo,
    hardHitPct: (hardHits / inPlay.length) * 100,
    brlPct: (barrels / inPlay.length) * 100,
    battedBalls: inPlay.length,
  };
}

export function batterSprayChartData(pitches: SavantPitch[]): Array<{
  hcX: number;
  hcY: number;
  event: string | undefined;
  launchSpeed?: number;
  launchAngle?: number;
  pitchType?: string;
}> {
  return pitches
    .filter((p): p is SavantPitch & { hcX: number; hcY: number } =>
      p.type === 'X' && p.hcX != null && p.hcY != null,
    )
    .map(p => ({
      hcX: p.hcX,
      hcY: p.hcY,
      event: p.events,
      launchSpeed: p.launchSpeed,
      launchAngle: p.launchAngle,
      pitchType: p.pitchType,
    }));
}

const SWING_DESCS = new Set([
  'hit_into_play', 'hit_into_play_no_out', 'hit_into_play_score',
  'swinging_strike', 'swinging_strike_blocked',
  'foul', 'foul_tip', 'foul_bunt', 'missed_bunt',
]);
const WHIFF_DESCS = new Set([
  'swinging_strike', 'swinging_strike_blocked', 'missed_bunt',
]);
const IN_ZONE = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);

export function batterZoneStats(pitches: SavantPitch[]): Array<{
  zone: number;
  swings: number;
  whiffs: number;
  takes: number;
  ba: number;
  slg: number;
}> {
  type ZAcc = { swings: number; whiffs: number; takes: number; ab: number; hits: number; tb: number };
  const byZone = new Map<number, ZAcc>();

  for (const p of pitches) {
    const z = p.zone;
    if (z == null || z < 1 || z > 14) continue;
    if (!byZone.has(z)) byZone.set(z, { swings: 0, whiffs: 0, takes: 0, ab: 0, hits: 0, tb: 0 });
    const acc = byZone.get(z)!;
    const desc = p.description ?? '';
    if (SWING_DESCS.has(desc)) acc.swings++;
    else acc.takes++;
    if (WHIFF_DESCS.has(desc)) acc.whiffs++;
    if (p.events) {
      const ev = p.events;
      if (['single', 'double', 'triple', 'home_run'].includes(ev)) {
        acc.ab++; acc.hits++;
        acc.tb += ev === 'single' ? 1 : ev === 'double' ? 2 : ev === 'triple' ? 3 : 4;
      } else if (!['walk', 'hit_by_pitch', 'sac_fly', 'sac_bunt', 'catcher_interf'].includes(ev)) {
        acc.ab++;
      }
    }
  }

  return [...byZone.entries()]
    .sort(([a], [b]) => a - b)
    .map(([zone, z]) => ({
      zone,
      swings: z.swings,
      whiffs: z.whiffs,
      takes: z.takes,
      ba: z.ab > 0 ? z.hits / z.ab : 0,
      slg: z.ab > 0 ? z.tb / z.ab : 0,
    }));
}

export function pitcherSwingMetrics(pitches: SavantPitch[]): {
  swstrPct: number;
  cswPct: number;
  contactPct: number;
  chasePct: number;
  zonePct: number;
} {
  let total = 0, swings = 0, whiffs = 0, calledStrikes = 0;
  let inZone = 0, outOfZone = 0, chaseSwings = 0;

  for (const p of pitches) {
    total++;
    const zInZone = p.zone != null && IN_ZONE.has(p.zone);
    const zOut = p.zone != null && !zInZone;
    if (zInZone) inZone++;
    if (zOut) outOfZone++;

    const desc = p.description ?? '';
    const isSwing = ['hit_into_play', 'hit_into_play_no_out', 'hit_into_play_score',
      'swinging_strike', 'swinging_strike_blocked', 'foul', 'foul_tip'].includes(desc);
    const isWhiff = ['swinging_strike', 'swinging_strike_blocked'].includes(desc);

    if (isSwing) { swings++; if (zOut) chaseSwings++; }
    if (isWhiff) whiffs++;
    if (desc === 'called_strike') calledStrikes++;
  }

  return {
    swstrPct: total > 0 ? whiffs / total : 0,
    cswPct: total > 0 ? (calledStrikes + whiffs) / total : 0,
    contactPct: swings > 0 ? (swings - whiffs) / swings : 0,
    chasePct: outOfZone > 0 ? chaseSwings / outOfZone : 0,
    zonePct: total > 0 ? inZone / total : 0,
  };
}
