import { describe, it, expect } from 'vitest';
import { liveOnBaseOdds, liveHitProb, liveKRisk, liveBBProb, countLean, COUNT_LEAGUE, LEAGUE_OBP_BASELINE } from '@/lib/live-odds';

describe('liveOnBaseOdds', () => {
  it('boosts OBP on hitter counts', () => {
    const seasonOBP = 0.350;
    const obp30 = liveOnBaseOdds(seasonOBP, 3, 0);
    const obp31 = liveOnBaseOdds(seasonOBP, 3, 1);
    expect(obp30).toBeGreaterThan(seasonOBP * 1.5);
    expect(obp31).toBeGreaterThan(seasonOBP);
  });

  it('crushes OBP on pitcher counts', () => {
    const seasonOBP = 0.350;
    const obp02 = liveOnBaseOdds(seasonOBP, 0, 2);
    expect(obp02).toBeLessThan(seasonOBP * 0.6);
  });

  it('returns season OBP exactly on 1-1 (essentially neutral)', () => {
    const seasonOBP = 0.350;
    const obp11 = liveOnBaseOdds(seasonOBP, 1, 1);
    expect(Math.abs(obp11 - seasonOBP)).toBeLessThan(0.005);
  });

  it('clamps to safe bounds', () => {
    expect(liveOnBaseOdds(0.001, 0, 2)).toBeGreaterThanOrEqual(0.04);
    expect(liveOnBaseOdds(0.99, 3, 0)).toBeLessThanOrEqual(0.85);
  });
});

describe('liveHitProb', () => {
  it('scales hit probability with count slugging context', () => {
    const xba = 0.250;
    const p30 = liveHitProb(xba, 3, 0);
    const p02 = liveHitProb(xba, 0, 2);
    expect(p30).toBeGreaterThan(p02);
  });
});

describe('liveKRisk', () => {
  it('soars on 0-2 and is low on 3-0', () => {
    const k02 = liveKRisk(0.25, 0.25, 0, 2);
    const k30 = liveKRisk(0.25, 0.25, 3, 0);
    expect(k02).toBeGreaterThan(0.4);
    expect(k30).toBeLessThan(0.1);
  });
});

describe('liveBBProb', () => {
  it('explodes on 3-0', () => {
    const bb30 = liveBBProb(0.085, 0.085, 3, 0);
    expect(bb30).toBeGreaterThan(0.5);
  });
});

describe('countLean', () => {
  it('classifies counts correctly', () => {
    expect(countLean(3, 0)).toBe('hitter');
    expect(countLean(0, 2)).toBe('pitcher');
    expect(countLean(1, 1)).toBe('neutral');
  });
});

describe('COUNT_LEAGUE table', () => {
  it('has all 12 counts', () => {
    const counts = ['0-0', '0-1', '0-2', '1-0', '1-1', '1-2', '2-0', '2-1', '2-2', '3-0', '3-1', '3-2'];
    counts.forEach(c => expect(COUNT_LEAGUE[c]).toBeDefined());
  });

  it('0-0 OBP equals baseline', () => {
    expect(COUNT_LEAGUE['0-0'].obp).toBeCloseTo(LEAGUE_OBP_BASELINE, 2);
  });
});
