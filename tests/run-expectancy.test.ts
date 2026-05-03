import { describe, it, expect } from 'vitest';
import {
  runExpectancy,
  reDeltaIfReaches,
  reDeltaIfOut,
  basesToBitmask,
  baseStateLabel,
  isRISP,
  RE24_MATRIX,
} from '@/lib/run-expectancy';

describe('basesToBitmask', () => {
  it('encodes base states correctly', () => {
    expect(basesToBitmask({ first: false, second: false, third: false })).toBe(0);
    expect(basesToBitmask({ first: true, second: false, third: false })).toBe(1);
    expect(basesToBitmask({ first: false, second: true, third: false })).toBe(2);
    expect(basesToBitmask({ first: true, second: true, third: false })).toBe(3);
    expect(basesToBitmask({ first: false, second: false, third: true })).toBe(4);
    expect(basesToBitmask({ first: true, second: true, third: true })).toBe(7);
  });
});

describe('runExpectancy', () => {
  it('matches the standard RE24 matrix corners', () => {
    expect(runExpectancy({ first: false, second: false, third: false }, 0)).toBeCloseTo(0.49, 2);
    expect(runExpectancy({ first: true, second: true, third: true }, 0)).toBeCloseTo(2.27, 2);
    expect(runExpectancy({ first: false, second: false, third: false }, 2)).toBeCloseTo(0.10, 2);
  });

  it('clamps outs to 0-2', () => {
    expect(runExpectancy({ first: false, second: false, third: false }, 5)).toBe(RE24_MATRIX[0][2]);
    expect(runExpectancy({ first: false, second: false, third: false }, -1)).toBe(RE24_MATRIX[0][0]);
  });
});

describe('reDeltaIfReaches', () => {
  it('returns positive delta when batter reaches base from empty/0 outs', () => {
    const delta = reDeltaIfReaches({ first: false, second: false, third: false }, 0);
    expect(delta).toBeGreaterThan(0);
  });
});

describe('reDeltaIfOut', () => {
  it('returns negative delta when out is recorded', () => {
    const delta = reDeltaIfOut({ first: true, second: false, third: false }, 0);
    expect(delta).toBeLessThan(0);
  });

  it('zeroes the inning when 3rd out recorded', () => {
    const re = runExpectancy({ first: true, second: false, third: false }, 2);
    const delta = reDeltaIfOut({ first: true, second: false, third: false }, 2);
    expect(delta).toBeCloseTo(-re, 2);
  });
});

describe('baseStateLabel', () => {
  it('labels common states', () => {
    expect(baseStateLabel({ first: false, second: false, third: false })).toBe('Bases empty');
    expect(baseStateLabel({ first: true, second: true, third: true })).toBe('Bases loaded');
    expect(baseStateLabel({ first: true, second: false, third: true })).toBe('1st & 3rd');
  });
});

describe('isRISP', () => {
  it('detects scoring position', () => {
    expect(isRISP({ first: false, second: true, third: false })).toBe(true);
    expect(isRISP({ first: false, second: false, third: true })).toBe(true);
    expect(isRISP({ first: true, second: false, third: false })).toBe(false);
  });
});
