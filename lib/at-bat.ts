import type { ParsedLiveGame, ParsedPlay, ParsedPitch, PersonRef } from './live-game';

// ─── Pitch result classification ─────────────────────────────────────────────
//
// MLB Stats API result codes (`details.code`) we care about:
//   B, *B, I, P, H        → ball / intent / pitchout / HBP
//   C                     → called strike
//   S, W                  → swinging strike (whiff)
//   T, L, M, F, Q, R      → foul / foul tip / missed bunt / etc.
//   X, D, E               → in play (out / no-out / run scoring)
// We collapse these into 6 visual categories used everywhere in the live UI.

export type PitchCategory =
  | 'called-strike'
  | 'swinging-strike'
  | 'foul'
  | 'in-play'
  | 'ball'
  | 'hit-by-pitch';

export function categorizePitch(p: ParsedPitch): PitchCategory | undefined {
  if (p.isInPlay) return 'in-play';
  const code = p.result;
  if (!code) {
    if (p.isStrike) return 'called-strike';
    if (p.isBall) return 'ball';
    return undefined;
  }
  if (code === 'C') return 'called-strike';
  if (code === 'S' || code === 'W' || code === 'M' || code === 'Q') return 'swinging-strike';
  if (code === 'T' || code === 'L' || code === 'F' || code === 'R') return 'foul';
  if (code === 'X' || code === 'D' || code === 'E') return 'in-play';
  if (code === 'H') return 'hit-by-pitch';
  if (code === 'B' || code === '*B' || code === 'I' || code === 'P') return 'ball';
  return undefined;
}

export const PITCH_COLORS: Record<PitchCategory, string> = {
  'called-strike': '#ef4444',
  'swinging-strike': '#f59e0b',
  'foul': '#fbbf24',
  'in-play': '#22c55e',
  'ball': '#3b82f6',
  'hit-by-pitch': '#a855f7',
};

export const PITCH_LABELS: Record<PitchCategory, string> = {
  'called-strike': 'Called K',
  'swinging-strike': 'Whiff',
  'foul': 'Foul',
  'in-play': 'In play',
  'ball': 'Ball',
  'hit-by-pitch': 'HBP',
};

// ─── Strike zone bounds ──────────────────────────────────────────────────────
//
// Rule book strike zone: 17" wide (≈ -0.708 to 0.708 ft on the pX axis,
// catcher's view). Vertical bounds vary by batter, so we prefer the
// per-pitch sz_top / sz_bot from the feed. League average fallback is
// sz_top ≈ 3.4 ft, sz_bot ≈ 1.6 ft.

export const ZONE_HALF_WIDTH = 0.7083;
export const ZONE_DEFAULT_TOP = 3.4;
export const ZONE_DEFAULT_BOTTOM = 1.6;

export interface StrikeZone {
  top: number;
  bottom: number;
  halfWidth: number;
}

/** Average sz_top / sz_bot across the given pitches, falling back to defaults. */
export function inferStrikeZone(pitches: ParsedPitch[]): StrikeZone {
  let topSum = 0;
  let botSum = 0;
  let n = 0;
  for (const p of pitches) {
    if (typeof p.zoneTop === 'number' && typeof p.zoneBottom === 'number') {
      topSum += p.zoneTop;
      botSum += p.zoneBottom;
      n++;
    }
  }
  if (n === 0) return { top: ZONE_DEFAULT_TOP, bottom: ZONE_DEFAULT_BOTTOM, halfWidth: ZONE_HALF_WIDTH };
  return { top: topSum / n, bottom: botSum / n, halfWidth: ZONE_HALF_WIDTH };
}

export function isPitchInZone(p: ParsedPitch, zone: StrikeZone): boolean | undefined {
  if (p.coordinates?.pX == null || p.coordinates?.pZ == null) return undefined;
  const px = p.coordinates.pX;
  const pz = p.coordinates.pZ;
  return Math.abs(px) <= zone.halfWidth && pz >= zone.bottom && pz <= zone.top;
}

// ─── Current at-bat ──────────────────────────────────────────────────────────

export interface CurrentAtBat {
  play: ParsedPlay;
  pitches: ParsedPitch[];
  zone: StrikeZone;
  isComplete: boolean;
}

export function currentAtBat(game: ParsedLiveGame): CurrentAtBat | null {
  if (game.allPlays.length === 0) return null;
  const idx = game.currentPlayIndex ?? game.allPlays.length - 1;
  const play = game.allPlays[idx];
  if (!play) return null;
  return {
    play,
    pitches: play.pitches,
    zone: inferStrikeZone(play.pitches),
    isComplete: play.isComplete,
  };
}

// ─── Pitcher arsenal today ───────────────────────────────────────────────────

export interface ArsenalRow {
  code: string;
  name: string;
  count: number;
  pct: number;
  avgVelo?: number;
  maxVelo?: number;
  avgSpin?: number;
  whiffPct?: number;       // whiffs / swings
  cswPct?: number;         // (called K + whiffs) / total
  zonePct?: number;        // pitches in zone / total
  putAways: number;        // strike-3 results on this pitch type
}

const SWING_CATS = new Set<PitchCategory>(['swinging-strike', 'foul', 'in-play']);

export function arsenalToday(game: ParsedLiveGame, pitcherId?: number): ArsenalRow[] {
  if (!pitcherId) return [];
  const accs = new Map<string, {
    name: string;
    count: number;
    veloSum: number;
    veloN: number;
    veloMax: number;
    spinSum: number;
    spinN: number;
    swings: number;
    whiffs: number;
    calledStrikes: number;
    inZone: number;
    inZoneN: number;
    putAways: number;
  }>();

  let total = 0;
  for (const play of game.allPlays) {
    if (play.pitcher.id !== pitcherId) continue;
    for (const p of play.pitches) {
      const code = p.type?.code ?? 'UN';
      const name = p.type?.description ?? 'Unknown';
      let acc = accs.get(code);
      if (!acc) {
        acc = {
          name, count: 0, veloSum: 0, veloN: 0, veloMax: 0, spinSum: 0, spinN: 0,
          swings: 0, whiffs: 0, calledStrikes: 0, inZone: 0, inZoneN: 0, putAways: 0,
        };
        accs.set(code, acc);
      }
      acc.count++;
      total++;
      if (typeof p.speed === 'number') {
        acc.veloSum += p.speed;
        acc.veloN++;
        if (p.speed > acc.veloMax) acc.veloMax = p.speed;
      }
      if (typeof p.spinRate === 'number') {
        acc.spinSum += p.spinRate;
        acc.spinN++;
      }
      const cat = categorizePitch(p);
      if (cat && SWING_CATS.has(cat)) acc.swings++;
      if (cat === 'swinging-strike') acc.whiffs++;
      if (cat === 'called-strike') acc.calledStrikes++;
      const zone = inferStrikeZone(play.pitches);
      const inZ = isPitchInZone(p, zone);
      if (inZ != null) {
        acc.inZoneN++;
        if (inZ) acc.inZone++;
      }
      // Put away: this pitch was the strike-3 of an AB ending in a strikeout.
      const isLastPitch = p === play.pitches[play.pitches.length - 1];
      const isK = (play.eventType ?? '').toLowerCase().includes('strikeout');
      if (isLastPitch && isK && (cat === 'swinging-strike' || cat === 'called-strike')) {
        acc.putAways++;
      }
    }
  }

  if (total === 0) return [];

  const rows: ArsenalRow[] = [];
  for (const [code, a] of accs) {
    rows.push({
      code,
      name: a.name,
      count: a.count,
      pct: a.count / total,
      avgVelo: a.veloN > 0 ? a.veloSum / a.veloN : undefined,
      maxVelo: a.veloMax > 0 ? a.veloMax : undefined,
      avgSpin: a.spinN > 0 ? a.spinSum / a.spinN : undefined,
      whiffPct: a.swings > 0 ? a.whiffs / a.swings : undefined,
      cswPct: a.count > 0 ? (a.calledStrikes + a.whiffs) / a.count : undefined,
      zonePct: a.inZoneN > 0 ? a.inZone / a.inZoneN : undefined,
      putAways: a.putAways,
    });
  }
  rows.sort((a, b) => b.count - a.count);
  return rows;
}

export function pitchCountToday(game: ParsedLiveGame, pitcherId?: number): number {
  if (!pitcherId) return 0;
  let n = 0;
  for (const play of game.allPlays) {
    if (play.pitcher.id !== pitcherId) continue;
    n += play.pitches.length;
  }
  return n;
}

// ─── Today's stat lines ──────────────────────────────────────────────────────

export interface PitcherTodayStats {
  pitches: number;
  strikes: number;
  balls: number;
  /** Outs the pitcher recorded today; IP = outs/3 (formatted as MLB "x.y"). */
  outs: number;
  ip: string;
  hits: number;
  runs: number;
  earnedRuns: number;       // Approximation: same as runs (true ER requires reconstruction).
  walks: number;
  strikeouts: number;
  homeRuns: number;
  battersFaced: number;
}

const HIT_EVENTS = new Set(['single', 'double', 'triple', 'home_run']);

function formatIp(outs: number): string {
  const whole = Math.floor(outs / 3);
  const frac = outs % 3;
  return `${whole}.${frac}`;
}

export function pitcherStatsToday(
  game: ParsedLiveGame,
  pitcherId?: number,
): PitcherTodayStats {
  const empty: PitcherTodayStats = {
    pitches: 0, strikes: 0, balls: 0, outs: 0, ip: '0.0',
    hits: 0, runs: 0, earnedRuns: 0, walks: 0, strikeouts: 0,
    homeRuns: 0, battersFaced: 0,
  };
  if (!pitcherId) return empty;

  let pitches = 0, strikes = 0, balls = 0, outs = 0;
  let hits = 0, runs = 0, walks = 0, strikeouts = 0, homeRuns = 0, battersFaced = 0;

  let prevHome = 0;
  let prevAway = 0;
  for (const play of game.allPlays) {
    if (play.pitcher.id !== pitcherId) {
      prevHome = play.homeScore;
      prevAway = play.awayScore;
      continue;
    }
    battersFaced++;
    for (const p of play.pitches) {
      pitches++;
      const cat = categorizePitch(p);
      if (cat === 'ball' || cat === 'hit-by-pitch') balls++;
      else if (cat) strikes++;
    }
    if (play.isComplete) {
      const ev = (play.eventType ?? play.event ?? '').toLowerCase().replace(/\s+/g, '_');
      if (HIT_EVENTS.has(ev)) hits++;
      if (ev === 'home_run') homeRuns++;
      if (ev.includes('walk') || ev === 'hit_by_pitch') walks++;
      if (ev.includes('strikeout')) strikeouts++;
      // Outs recorded: scoreboard outs delta is most reliable, but allPlays
      // doesn't track outs at the play level. Use eventType heuristics.
      if (ev.includes('strikeout') || ev.endsWith('out') || ev.includes('groundout') ||
          ev.includes('flyout') || ev.includes('lineout') || ev.includes('forceout') ||
          ev.includes('field_out') || ev.includes('pop_out') || ev.includes('sac_fly') ||
          ev.includes('sac_bunt')) {
        outs++;
        if (ev === 'grounded_into_double_play' || ev === 'double_play') outs++;
        if (ev === 'triple_play') outs += 2;
      }
      const runsThisPlay = (play.homeScore - prevHome) + (play.awayScore - prevAway);
      if (runsThisPlay > 0) runs += runsThisPlay;
    }
    prevHome = play.homeScore;
    prevAway = play.awayScore;
  }

  return {
    pitches, strikes, balls, outs, ip: formatIp(outs),
    hits, runs, earnedRuns: runs, walks, strikeouts, homeRuns, battersFaced,
  };
}

export interface BatterTodayLine {
  ab: number;
  hits: number;
  homeRuns: number;
  walks: number;
  strikeouts: number;
  rbi: number;
  /** Convenience formatted "H-AB" string. */
  hab: string;
}

const ON_BASE_NON_AB = new Set(['walk', 'hit_by_pitch', 'sac_fly', 'sac_bunt', 'catcher_interf', 'intent_walk']);

export function batterLineToday(
  game: ParsedLiveGame,
  batterId?: number,
): BatterTodayLine {
  const empty: BatterTodayLine = { ab: 0, hits: 0, homeRuns: 0, walks: 0, strikeouts: 0, rbi: 0, hab: '0-0' };
  if (!batterId) return empty;

  let ab = 0, hits = 0, homeRuns = 0, walks = 0, strikeouts = 0, rbi = 0;

  for (const play of game.allPlays) {
    if (play.batter.id !== batterId) continue;
    if (!play.isComplete) continue;
    const ev = (play.eventType ?? play.event ?? '').toLowerCase().replace(/\s+/g, '_');
    if (ev.includes('walk')) walks++;
    if (ev.includes('strikeout')) strikeouts++;
    if (ev === 'home_run') homeRuns++;
    if (HIT_EVENTS.has(ev)) hits++;
    if (!ON_BASE_NON_AB.has(ev) && ev !== '') ab++;
    rbi += play.rbi ?? 0;
  }

  return { ab, hits, homeRuns, walks, strikeouts, rbi, hab: `${hits}-${ab}` };
}

// ─── Umpire scorecard ────────────────────────────────────────────────────────

export interface UmpireScorecard {
  totalCalled: number;
  correct: number;
  missedStrikes: number;       // called ball, was actually in zone (favors hitter)
  missedBalls: number;         // called strike, was actually out of zone (favors pitcher)
  accuracy: number;            // 0..1
  /** Net direction of bad calls — negative favors hitters, positive favors pitchers. */
  netFavorPitchers: number;
}

export function umpireScorecard(game: ParsedLiveGame): UmpireScorecard {
  let total = 0;
  let correct = 0;
  let missedStrikes = 0;
  let missedBalls = 0;
  for (const play of game.allPlays) {
    const zone = inferStrikeZone(play.pitches);
    for (const p of play.pitches) {
      const cat = categorizePitch(p);
      if (cat !== 'called-strike' && cat !== 'ball') continue;
      const inZ = isPitchInZone(p, zone);
      if (inZ == null) continue;
      total++;
      if (cat === 'called-strike' && inZ) correct++;
      else if (cat === 'ball' && !inZ) correct++;
      else if (cat === 'ball' && inZ) missedStrikes++;
      else if (cat === 'called-strike' && !inZ) missedBalls++;
    }
  }
  return {
    totalCalled: total,
    correct,
    missedStrikes,
    missedBalls,
    accuracy: total > 0 ? correct / total : 0,
    netFavorPitchers: missedBalls - missedStrikes,
  };
}

// ─── Recent batted balls ─────────────────────────────────────────────────────

export interface BattedBall {
  playIndex: number;
  pitchIndex: number;
  inning: number;
  halfInning: string;
  batter: PersonRef;
  pitcher: PersonRef;
  pitchType?: string;
  pitchSpeed?: number;
  exitVelo?: number;
  launchAngle?: number;
  distance?: number;
  trajectory?: string;
  event?: string;
  description: string;
  isHardHit: boolean;       // EV >= 95
  isBarrel: boolean;        // simplified barrel
  estBA: number;            // crude xBA estimate
}

/** Crude xBA estimate using EV/LA bins. Good enough for a live "expected hit"
 * badge — not a replacement for Statcast's full model. */
function estimateBA(ev?: number, la?: number): number {
  if (ev == null || la == null) return 0;
  // Sweet spot
  if (ev >= 100 && la >= 22 && la <= 32) return 0.85;
  if (ev >= 95 && la >= 18 && la <= 32) return 0.65;
  if (ev >= 95 && la >= 8 && la <= 35) return 0.50;
  if (ev >= 90 && la >= 8 && la <= 25) return 0.35;
  if (ev >= 80 && la >= -10 && la <= 10) return 0.30;     // grounders
  if (ev < 80) return 0.15;
  return 0.20;
}

export function recentBattedBalls(game: ParsedLiveGame, limit = 8): BattedBall[] {
  const out: BattedBall[] = [];
  for (let i = game.allPlays.length - 1; i >= 0 && out.length < limit; i--) {
    const play = game.allPlays[i];
    for (let j = play.pitches.length - 1; j >= 0; j--) {
      const p = play.pitches[j];
      if (categorizePitch(p) !== 'in-play') continue;
      const ev = p.hit?.launchSpeed;
      const la = p.hit?.launchAngle;
      out.push({
        playIndex: play.index,
        pitchIndex: j,
        inning: play.inning,
        halfInning: play.halfInning,
        batter: play.batter,
        pitcher: play.pitcher,
        pitchType: p.type?.description,
        pitchSpeed: p.speed,
        exitVelo: ev,
        launchAngle: la,
        distance: p.hit?.totalDistance,
        trajectory: p.hit?.trajectory,
        event: play.event,
        description: play.description,
        isHardHit: ev != null && ev >= 95,
        isBarrel: ev != null && la != null && ev >= 98 && la >= 26 && la <= 30,
        estBA: estimateBA(ev, la),
      });
    }
  }
  return out;
}

// ─── Sequence summary ────────────────────────────────────────────────────────
//
// A short text describing the last few pitches for narrative use,
// e.g. "FF 96 high · SL 84 chase · CH 88 whiff".

export function sequenceSummary(pitches: ParsedPitch[]): string {
  return pitches
    .filter(p => p.type?.code)
    .slice(-6)
    .map(p => {
      const code = p.type!.code;
      const speed = p.speed != null ? ` ${Math.round(p.speed)}` : '';
      const cat = categorizePitch(p);
      let tag = '';
      if (cat === 'swinging-strike') tag = ' whiff';
      else if (cat === 'called-strike') tag = ' called';
      else if (cat === 'in-play') tag = ' BIP';
      else if (cat === 'foul') tag = ' foul';
      return `${code}${speed}${tag}`;
    })
    .join(' · ');
}

// ─── Live-game advanced helpers ──────────────────────────────────────────────

/** Bucket pitcher's pitches today by ball-strike count → arsenal usage. */
export function arsenalByCount(
  game: ParsedLiveGame,
  pitcherId?: number,
): Map<string, ArsenalRow[]> {
  const out = new Map<string, ArsenalRow[]>();
  if (!pitcherId) return out;

  // For each count, gather all pitches that occurred AT that count.
  // ParsedPitch carries balls/strikes pre-pitch on `count` (verify shape),
  // but to be safe we walk plays and reconstruct count state per pitch.
  const buckets = new Map<string, ParsedPitch[]>();

  for (const play of game.allPlays) {
    if (play.pitcher.id !== pitcherId) continue;
    let b = 0, s = 0;
    for (const p of play.pitches) {
      const k = `${b}-${s}`;
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k)!.push(p);
      const cat = categorizePitch(p);
      if (cat === 'ball') b = Math.min(3, b + 1);
      else if (cat === 'called-strike' || cat === 'swinging-strike') s = Math.min(2, s + 1);
      else if (cat === 'foul') {
        if (s < 2) s++;
      }
    }
  }

  for (const [count, pitches] of buckets) {
    const accs = new Map<string, { name: string; n: number; whiffs: number; swings: number; }>();
    for (const p of pitches) {
      const code = p.type?.code ?? 'UN';
      const name = p.type?.description ?? 'Unknown';
      let acc = accs.get(code);
      if (!acc) { acc = { name, n: 0, whiffs: 0, swings: 0 }; accs.set(code, acc); }
      acc.n++;
      const cat = categorizePitch(p);
      if (cat === 'swinging-strike') { acc.swings++; acc.whiffs++; }
      else if (cat === 'foul' || cat === 'in-play') acc.swings++;
    }
    const total = pitches.length || 1;
    const rows: ArsenalRow[] = [...accs.entries()].map(([code, a]) => ({
      code,
      name: a.name,
      count: a.n,
      pct: a.n / total,
      whiffPct: a.swings > 0 ? a.whiffs / a.swings : undefined,
      putAways: 0,
    })).sort((a, b) => b.count - a.count);
    out.set(count, rows);
  }
  return out;
}

/** Most likely next pitch given current count, blending today's history with season usage. */
export function nextPitchOdds(
  game: ParsedLiveGame,
  pitcherId: number | undefined,
  balls: number,
  strikes: number,
  seasonArsenal?: ArsenalRow[],
): Array<{ code: string; name: string; pct: number; whiffPct?: number }> {
  if (!pitcherId) return [];
  const byCount = arsenalByCount(game, pitcherId);
  const k = `${balls}-${strikes}`;
  const today = byCount.get(k) ?? [];
  // If today's sample is too small, fall back to season arsenal
  const totalToday = today.reduce((s, r) => s + r.count, 0);
  if (totalToday < 4 && seasonArsenal && seasonArsenal.length > 0) {
    return seasonArsenal.map(a => ({
      code: a.code, name: a.name, pct: a.pct, whiffPct: a.whiffPct,
    })).sort((x, y) => y.pct - x.pct);
  }
  return today.map(r => ({
    code: r.code, name: r.name, pct: r.pct, whiffPct: r.whiffPct,
  }));
}

/** Pitcher fatigue tier based on today's pitch count vs season per-outing estimate. */
export function fatigueScore(
  game: ParsedLiveGame,
  pitcherId: number | undefined,
  seasonStats: {
    gamesStarted?: number;
    gamesPitched?: number;
    pitchesPerInning?: string;
    inningsPitched?: string;
  } | null | undefined,
): { pitchesToday: number; usualPitchesPerOuting: number; pct: number; tier: 'fresh' | 'normal' | 'tiring' | 'gassed' } {
  const todayCount = pitchCountToday(game, pitcherId);
  // Estimate usual: pitchesPerInning × (IP / games).
  // Falls back to: 90 for starters, 16 for relievers, 80 generic.
  let usual = 80;
  if (seasonStats) {
    const ppi = seasonStats.pitchesPerInning ? parseFloat(seasonStats.pitchesPerInning) : NaN;
    const ip = seasonStats.inningsPitched ? parseFloat(seasonStats.inningsPitched) : NaN;
    const games = Math.max(1, seasonStats.gamesPitched ?? 1);
    if (Number.isFinite(ppi) && Number.isFinite(ip) && games > 0) {
      const ipPerGame = ip / games;
      usual = ppi * ipPerGame;
    } else if ((seasonStats.gamesStarted ?? 0) > games / 2) {
      usual = 90; // mostly a starter
    } else {
      usual = 18; // mostly a reliever
    }
  }
  const pct = usual > 0 ? todayCount / usual : 0;
  let tier: 'fresh' | 'normal' | 'tiring' | 'gassed' = 'normal';
  if (pct < 0.3) tier = 'fresh';
  else if (pct < 0.75) tier = 'normal';
  else if (pct < 1.05) tier = 'tiring';
  else tier = 'gassed';
  return { pitchesToday: todayCount, usualPitchesPerOuting: Math.round(usual), pct, tier };
}

/** Velocity decay across the outing: avg of first 10 pitches vs avg of last 10. */
export function velocityDecay(
  game: ParsedLiveGame,
  pitcherId?: number,
): { earlyAvg: number; recentAvg: number; deltaMph: number } {
  if (!pitcherId) return { earlyAvg: 0, recentAvg: 0, deltaMph: 0 };
  const speeds: number[] = [];
  for (const play of game.allPlays) {
    if (play.pitcher.id !== pitcherId) continue;
    for (const p of play.pitches) {
      if (p.speed != null) speeds.push(p.speed);
    }
  }
  if (speeds.length < 6) return { earlyAvg: 0, recentAvg: 0, deltaMph: 0 };
  const early = speeds.slice(0, Math.min(10, Math.floor(speeds.length / 2)));
  const recent = speeds.slice(-Math.min(10, Math.floor(speeds.length / 2)));
  const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const earlyAvg = avg(early);
  const recentAvg = avg(recent);
  return { earlyAvg, recentAvg, deltaMph: recentAvg - earlyAvg };
}

/** 0-100 deception score for a pitch following its predecessor. */
export function tunnelingScore(prev: ParsedPitch, curr: ParsedPitch): number {
  const prevX = prev.coordinates?.pX;
  const prevZ = prev.coordinates?.pZ;
  const currX = curr.coordinates?.pX;
  const currZ = curr.coordinates?.pZ;
  if (prevX == null || prevZ == null || currX == null || currZ == null) return 0;
  // Closer plate locations + bigger velo gap = better tunneling
  const dist = Math.hypot(currX - prevX, currZ - prevZ); // ft
  const veloGap = Math.abs((prev.speed ?? 0) - (curr.speed ?? 0)); // mph
  // Different pitch types boost score.
  const sameType = prev.type?.code === curr.type?.code ? 0 : 1;
  const proxScore = Math.max(0, 1 - dist / 1.5); // 1.5ft → 0
  const veloScore = Math.min(1, veloGap / 12);   // 12mph delta = max
  return Math.round(((proxScore * 0.5) + (veloScore * 0.3) + (sameType * 0.2)) * 100);
}

/** 0-100 "how dramatic is this AB" composite. Mariners-themed branding. */
export function tridentScore(args: {
  batterHot?: number;        // 0-100
  pitcherHot?: number;       // 0-100 (higher = pitcher hot, BAD for batter drama)
  leverageIdx?: number;      // 0-5 typical, 1.0 = avg
  balls: number;
  strikes: number;
  scoreMargin?: number;      // |home - away|
  inning?: number;
}): number {
  const lev = Math.min(2.5, Math.max(0, args.leverageIdx ?? 1));
  const bh = (args.batterHot ?? 50) / 100;
  const ph = 1 - (args.pitcherHot ?? 50) / 100;
  // Count drama: full count = max
  const countSum = args.balls + args.strikes;
  const countDrama = Math.min(1, countSum / 5);
  const lateBonus = args.inning && args.inning >= 7 ? 0.15 : 0;
  const closeBonus = args.scoreMargin != null && args.scoreMargin <= 2 ? 0.15 : 0;
  const composite =
    (lev / 2.5) * 0.40 +
    bh * 0.20 +
    ph * 0.10 +
    countDrama * 0.15 +
    lateBonus +
    closeBonus;
  return Math.round(Math.min(1, composite) * 100);
}

/** Count K-rate for a player from raw season stats. Returns decimal (0..1). */
export function batterKpct(s: { strikeOuts?: number | string; plateAppearances?: number | string }): number {
  const k = Number(s.strikeOuts ?? 0);
  const pa = Number(s.plateAppearances ?? 0);
  return pa > 0 ? k / pa : 0.22;
}

export function batterBBpct(s: { baseOnBalls?: number | string; plateAppearances?: number | string }): number {
  const bb = Number(s.baseOnBalls ?? 0);
  const pa = Number(s.plateAppearances ?? 0);
  return pa > 0 ? bb / pa : 0.085;
}

export function pitcherKpct(s: { strikeOuts?: number | string; battersFaced?: number | string }): number {
  const k = Number(s.strikeOuts ?? 0);
  const bf = Number(s.battersFaced ?? 0);
  return bf > 0 ? k / bf : 0.22;
}

export function pitcherBBpct(s: { baseOnBalls?: number | string; battersFaced?: number | string }): number {
  const bb = Number(s.baseOnBalls ?? 0);
  const bf = Number(s.battersFaced ?? 0);
  return bf > 0 ? bb / bf : 0.085;
}
