import { describe, it, expect } from 'vitest';
import {
  categorizePitch,
  inferStrikeZone,
  isPitchInZone,
  arsenalToday,
  umpireScorecard,
  recentBattedBalls,
  pitchCountToday,
  ZONE_DEFAULT_TOP,
  ZONE_DEFAULT_BOTTOM,
  ZONE_HALF_WIDTH,
} from '@/lib/at-bat';
import type { ParsedLiveGame, ParsedPitch, ParsedPlay } from '@/lib/live-game';

function pitch(overrides: Partial<ParsedPitch>): ParsedPitch {
  return {
    index: 0,
    ...overrides,
  };
}

function play(overrides: Partial<ParsedPlay> = {}): ParsedPlay {
  return {
    index: 0,
    description: '',
    halfInning: 'top',
    inning: 1,
    awayScore: 0,
    homeScore: 0,
    batter: { id: 100, fullName: 'Batter' },
    pitcher: { id: 200, fullName: 'Pitcher' },
    pitches: [],
    isScoringPlay: false,
    isComplete: false,
    leverageIndex: 1,
    ...overrides,
  };
}

function game(plays: ParsedPlay[]): ParsedLiveGame {
  return {
    gamePk: 1,
    state: 'Live',
    detailedState: 'In Progress',
    score: { home: 0, away: 0 },
    teams: {
      home: { id: 1, name: 'H', abbrev: 'H' },
      away: { id: 2, name: 'A', abbrev: 'A' },
    },
    umpires: [],
    linescore: { innings: [], totals: { home: { runs: 0, hits: 0, errors: 0 }, away: { runs: 0, hits: 0, errors: 0 } } },
    allPlays: plays,
    scoringPlayIndices: [],
    wpaTimeline: [],
    leverageTimeline: [],
    fetchedAt: 0,
  };
}

describe('categorizePitch', () => {
  it('classifies called strike, swinging strike, foul, in play, ball, HBP', () => {
    expect(categorizePitch(pitch({ result: 'C' }))).toBe('called-strike');
    expect(categorizePitch(pitch({ result: 'S' }))).toBe('swinging-strike');
    expect(categorizePitch(pitch({ result: 'W' }))).toBe('swinging-strike');
    expect(categorizePitch(pitch({ result: 'F' }))).toBe('foul');
    expect(categorizePitch(pitch({ result: 'X' }))).toBe('in-play');
    expect(categorizePitch(pitch({ result: 'B' }))).toBe('ball');
    expect(categorizePitch(pitch({ result: 'H' }))).toBe('hit-by-pitch');
  });

  it('uses isInPlay flag when result code missing', () => {
    expect(categorizePitch(pitch({ isInPlay: true }))).toBe('in-play');
  });
});

describe('inferStrikeZone', () => {
  it('returns league-average defaults when no per-pitch zone data', () => {
    const zone = inferStrikeZone([pitch({}), pitch({})]);
    expect(zone.top).toBe(ZONE_DEFAULT_TOP);
    expect(zone.bottom).toBe(ZONE_DEFAULT_BOTTOM);
    expect(zone.halfWidth).toBe(ZONE_HALF_WIDTH);
  });

  it('averages per-pitch sz_top / sz_bot', () => {
    const zone = inferStrikeZone([
      pitch({ zoneTop: 3.5, zoneBottom: 1.5 }),
      pitch({ zoneTop: 3.7, zoneBottom: 1.7 }),
    ]);
    expect(zone.top).toBeCloseTo(3.6);
    expect(zone.bottom).toBeCloseTo(1.6);
  });
});

describe('isPitchInZone', () => {
  const zone = { top: 3.4, bottom: 1.6, halfWidth: 0.7083 };

  it('returns undefined when coordinates missing', () => {
    expect(isPitchInZone(pitch({}), zone)).toBeUndefined();
  });

  it('detects in-zone pitch', () => {
    const p = pitch({ coordinates: { pX: 0, pZ: 2.5 } });
    expect(isPitchInZone(p, zone)).toBe(true);
  });

  it('detects out-of-zone pitch (wide)', () => {
    const p = pitch({ coordinates: { pX: 1.0, pZ: 2.5 } });
    expect(isPitchInZone(p, zone)).toBe(false);
  });

  it('detects out-of-zone pitch (low)', () => {
    const p = pitch({ coordinates: { pX: 0, pZ: 1.0 } });
    expect(isPitchInZone(p, zone)).toBe(false);
  });
});

describe('arsenalToday', () => {
  it('aggregates pitches by type for the given pitcher only', () => {
    const plays = [
      play({
        pitcher: { id: 200, fullName: 'P1' },
        pitches: [
          pitch({ type: { code: 'FF', description: '4-Seam' }, speed: 96, result: 'C', coordinates: { pX: 0, pZ: 2.5 } }),
          pitch({ type: { code: 'FF', description: '4-Seam' }, speed: 97, result: 'S', coordinates: { pX: 0, pZ: 2.5 } }),
          pitch({ type: { code: 'SL', description: 'Slider' }, speed: 87, result: 'X', coordinates: { pX: 0.3, pZ: 2.5 } }),
        ],
      }),
      play({
        pitcher: { id: 999, fullName: 'Other' },
        pitches: [pitch({ type: { code: 'CH', description: 'Change' }, speed: 88, result: 'B' })],
      }),
    ];
    const arsenal = arsenalToday(game(plays), 200);
    expect(arsenal).toHaveLength(2);
    const ff = arsenal.find(r => r.code === 'FF');
    const sl = arsenal.find(r => r.code === 'SL');
    expect(ff!.count).toBe(2);
    expect(ff!.avgVelo).toBeCloseTo(96.5);
    expect(ff!.maxVelo).toBe(97);
    // FF had one whiff (S) on one swing → 100%
    expect(ff!.whiffPct).toBeCloseTo(1.0);
    expect(sl!.count).toBe(1);
  });

  it('returns empty when no pitcher specified or no matching pitches', () => {
    expect(arsenalToday(game([]), undefined)).toEqual([]);
    expect(arsenalToday(game([]), 200)).toEqual([]);
  });
});

describe('pitchCountToday', () => {
  it('counts every pitch by the given pitcher across all plays', () => {
    const plays = [
      play({ pitcher: { id: 200, fullName: 'P' }, pitches: [pitch({}), pitch({}), pitch({})] }),
      play({ pitcher: { id: 200, fullName: 'P' }, pitches: [pitch({})] }),
      play({ pitcher: { id: 999, fullName: 'O' }, pitches: [pitch({})] }),
    ];
    expect(pitchCountToday(game(plays), 200)).toBe(4);
  });
});

describe('umpireScorecard', () => {
  it('counts missed strikes (called ball in zone) and missed balls (called strike out of zone)', () => {
    const plays = [
      play({
        pitches: [
          // called strike, in zone — correct
          pitch({ result: 'C', coordinates: { pX: 0, pZ: 2.5 } }),
          // called ball, out of zone — correct
          pitch({ result: 'B', coordinates: { pX: 1.5, pZ: 2.5 } }),
          // called ball, in zone — missed strike (favors hitter)
          pitch({ result: 'B', coordinates: { pX: 0, pZ: 2.5 } }),
          // called strike, out of zone — missed ball (favors pitcher)
          pitch({ result: 'C', coordinates: { pX: 1.0, pZ: 2.5 } }),
          // swing — excluded
          pitch({ result: 'S', coordinates: { pX: 0, pZ: 2.5 } }),
        ],
      }),
    ];
    const card = umpireScorecard(game(plays));
    expect(card.totalCalled).toBe(4);
    expect(card.correct).toBe(2);
    expect(card.missedStrikes).toBe(1);
    expect(card.missedBalls).toBe(1);
    expect(card.accuracy).toBeCloseTo(0.5);
    // 1 missed ball − 1 missed strike = 0
    expect(card.netFavorPitchers).toBe(0);
  });

  it('returns zeroed totals when no called pitches', () => {
    const card = umpireScorecard(game([]));
    expect(card.totalCalled).toBe(0);
    expect(card.accuracy).toBe(0);
  });
});

describe('recentBattedBalls', () => {
  it('returns batted balls in reverse chronological order with hard-hit / barrel flags', () => {
    const plays = [
      play({
        index: 0,
        event: 'Single',
        description: 'singled to left',
        pitches: [
          pitch({ result: 'B' }),
          pitch({
            result: 'X',
            isInPlay: true,
            type: { code: 'FF', description: '4-Seam' },
            speed: 95,
            hit: { launchSpeed: 99, launchAngle: 28, totalDistance: 320, trajectory: 'line_drive' },
          }),
        ],
      }),
      play({
        index: 1,
        event: 'Groundout',
        description: 'grounded out',
        pitches: [
          pitch({
            result: 'X',
            isInPlay: true,
            hit: { launchSpeed: 78, launchAngle: -10 },
          }),
        ],
      }),
    ];
    const balls = recentBattedBalls(game(plays));
    expect(balls).toHaveLength(2);
    // Most recent first
    expect(balls[0].playIndex).toBe(1);
    expect(balls[0].isHardHit).toBe(false);
    expect(balls[0].isBarrel).toBe(false);
    expect(balls[1].playIndex).toBe(0);
    expect(balls[1].isHardHit).toBe(true);
    expect(balls[1].isBarrel).toBe(true);
    expect(balls[1].estBA).toBeGreaterThan(0.5);
  });

  it('respects the limit parameter', () => {
    const plays = Array.from({ length: 12 }).map((_, i) =>
      play({
        index: i,
        pitches: [pitch({ result: 'X', isInPlay: true, hit: { launchSpeed: 90, launchAngle: 15 } })],
      }),
    );
    expect(recentBattedBalls(game(plays), 5)).toHaveLength(5);
  });
});
