import { describe, it, expect } from 'vitest';
import { parkFactor, weatherHRModifier, weatherEffectLabel, PARK_FACTORS } from '@/lib/park-factors';

describe('parkFactor', () => {
  it('returns T-Mobile Park as pitcher-friendly', () => {
    const tmobile = parkFactor(680);
    expect(tmobile.name).toBe('T-Mobile Park');
    expect(tmobile.hr).toBeLessThan(100);
  });

  it('returns Coors Field as the most hitter-friendly park', () => {
    const coors = parkFactor(19);
    expect(coors.runs).toBeGreaterThan(110);
    expect(coors.hr).toBeGreaterThan(110);
  });

  it('falls back to neutral for unknown venues', () => {
    const neutral = parkFactor(999999);
    expect(neutral.hr).toBe(100);
    expect(neutral.runs).toBe(100);
  });

  it('falls back to neutral when venueId is undefined', () => {
    const neutral = parkFactor(undefined);
    expect(neutral.hr).toBe(100);
  });

  it('has at least 25 unique parks defined', () => {
    expect(Object.keys(PARK_FACTORS).length).toBeGreaterThanOrEqual(25);
  });
});

describe('weatherHRModifier', () => {
  it('returns 1.0 for domes', () => {
    expect(weatherHRModifier({ isDome: true })).toBe(1.0);
  });

  it('boosts HR distance in hot weather', () => {
    const hot = weatherHRModifier({ tempF: 95 });
    const cool = weatherHRModifier({ tempF: 60 });
    expect(hot).toBeGreaterThan(cool);
  });

  it('out-blowing wind boosts modifier', () => {
    const out = weatherHRModifier({ wind: { speed: 15, dir: '15 mph, Out To CF' } });
    expect(out).toBeGreaterThan(1.0);
  });

  it('in-blowing wind suppresses modifier', () => {
    const inWind = weatherHRModifier({ wind: { speed: 15, dir: '15 mph, In From RF' } });
    expect(inWind).toBeLessThan(1.0);
  });
});

describe('weatherEffectLabel', () => {
  it('labels big boost for high modifiers', () => {
    expect(weatherEffectLabel(1.15)).toMatch(/Big boost/);
  });
  it('labels big damper for low modifiers', () => {
    expect(weatherEffectLabel(0.85)).toMatch(/Big damper/);
  });
  it('labels neutral for modifiers near 1.0', () => {
    expect(weatherEffectLabel(1.01)).toBe('Neutral');
  });
});
