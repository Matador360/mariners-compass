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
