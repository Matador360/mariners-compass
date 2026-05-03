import { describe, it, expect } from 'vitest';
import {
  fatigueScore,
  velocityDecay,
  tunnelingScore,
  tridentScore,
  arsenalByCount,
  nextPitchOdds,
} from '@/lib/at-bat';
import type { ParsedLiveGame, ParsedPitch, ParsedPlay } from '@/lib/live-game';

const PITCHER = 100;

function pitch(o: Partial<ParsedPitch> = {}): ParsedPitch {
  return { index: 0, ...o };
}

function play(o: Partial<ParsedPlay> = {}): ParsedPlay {
  return {
    index: 0,
    description: '',
    halfInning: 'top',
    inning: 1,
    awayScore: 0,
    homeScore: 0,
    isComplete: false,
    isScoringPlay: false,
    rbi: 0,
    batter: { id: 1, fullName: 'Bat Test' },
    pitcher: { id: PITCHER, fullName: 'Pitcher Test' },
    pitches: [],
    ...o,
  };
}

function game(plays: ParsedPlay[]): ParsedLiveGame {
  return {
    gamePk: 1,
    state: 'Live',
    detailedState: 'In Progress',
    score: { home: 0, away: 0 },
    teams: {
      home: { id: 136, name: 'Mariners', abbrev: 'SEA' },
      away: { id: 117, name: 'Astros', abbrev: 'HOU' },
    },
    umpires: [],
    linescore: { innings: [], teams: { home: { runs: 0, hits: 0, errors: 0 }, away: { runs: 0, hits: 0, errors: 0 } } },
    allPlays: plays,
    scoringPlayIndices: [],
    wpaTimeline: [],
    leverageTimeline: [],
    fetchedAt: Date.now(),
  };
}

describe('fatigueScore', () => {
  it('classifies fresh when no pitches thrown', () => {
    const g = game([]);
    const f = fatigueScore(g, PITCHER, null);
    expect(f.tier).toBe('fresh');
    expect(f.pitchesToday).toBe(0);
  });

  it('classifies gassed when over usual', () => {
    const pitches = Array.from({ length: 100 }, () => pitch({ result: 'B' }));
    const p = play({ pitches });
    const g = game([p]);
    const f = fatigueScore(g, PITCHER, { gamesStarted: 20, gamesPitched: 20, pitchesPerInning: '15', inningsPitched: '120.0' });
    expect(f.tier).toBe('gassed');
    expect(f.pct).toBeGreaterThan(1);
  });
});

describe('velocityDecay', () => {
  it('returns zero deltas with too few pitches', () => {
    const p = play({ pitches: [pitch({ speed: 95 })] });
    const g = game([p]);
    expect(velocityDecay(g, PITCHER).deltaMph).toBe(0);
  });

  it('detects velo drop late in outing', () => {
    const speeds = [95, 95, 96, 96, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85];
    const pitches = speeds.map(s => pitch({ speed: s }));
    const p = play({ pitches });
    const g = game([p]);
    const v = velocityDecay(g, PITCHER);
    expect(v.deltaMph).toBeLessThan(0);
  });
});

describe('tunnelingScore', () => {
  it('returns 0 when coords missing', () => {
    expect(tunnelingScore(pitch({}), pitch({}))).toBe(0);
  });

  it('high score for nearby pitches with big velo gap and different types', () => {
    const ff = pitch({ coordinates: { pX: 0.1, pZ: 2.5 }, speed: 96, type: { code: 'FF', description: 'Four-Seam' } });
    const ch = pitch({ coordinates: { pX: 0.15, pZ: 2.4 }, speed: 84, type: { code: 'CH', description: 'Changeup' } });
    expect(tunnelingScore(ff, ch)).toBeGreaterThan(70);
  });

  it('low score for identical pitches', () => {
    const a = pitch({ coordinates: { pX: 0.1, pZ: 2.5 }, speed: 96, type: { code: 'FF', description: 'FB' } });
    const b = pitch({ coordinates: { pX: 0.1, pZ: 2.5 }, speed: 96, type: { code: 'FF', description: 'FB' } });
    expect(tunnelingScore(a, b)).toBeLessThan(60);
  });
});

describe('tridentScore', () => {
  it('returns higher score in high-leverage late close hot AB', () => {
    const high = tridentScore({
      batterHot: 90, pitcherHot: 30, leverageIdx: 2.5,
      balls: 3, strikes: 2, scoreMargin: 1, inning: 9,
    });
    const low = tridentScore({
      batterHot: 50, pitcherHot: 50, leverageIdx: 0.5,
      balls: 0, strikes: 0, scoreMargin: 8, inning: 2,
    });
    expect(high).toBeGreaterThan(low);
    expect(high).toBeGreaterThan(70);
  });
});

describe('arsenalByCount', () => {
  it('buckets pitches by ball-strike count', () => {
    const p = play({
      pitches: [
        pitch({ type: { code: 'FF', description: 'FB' }, result: 'C' }),    // 0-0 → strike (now 0-1)
        pitch({ type: { code: 'SL', description: 'SL' }, result: 'B' }),    // 0-1 → ball (now 1-1)
        pitch({ type: { code: 'FF', description: 'FB' }, result: 'X' }),    // 1-1
      ],
    });
    const g = game([p]);
    const buckets = arsenalByCount(g, PITCHER);
    expect(buckets.get('0-0')).toBeDefined();
    expect(buckets.get('0-1')).toBeDefined();
    expect(buckets.get('1-1')).toBeDefined();
  });
});

describe('nextPitchOdds', () => {
  it('returns season fallback when today sample is too small', () => {
    const g = game([]);
    const season = [
      { code: 'FF', name: 'FB', count: 0, pct: 0.6, putAways: 0 },
      { code: 'SL', name: 'SL', count: 0, pct: 0.4, putAways: 0 },
    ];
    const odds = nextPitchOdds(g, PITCHER, 1, 1, season);
    expect(odds[0].code).toBe('FF');
    expect(odds[0].pct).toBeCloseTo(0.6);
  });
});
