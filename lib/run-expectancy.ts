/**
 * MLB 24-state Run Expectancy matrix (RE24).
 *
 * Indexed by [base state][outs]. Base state is encoded as a 3-bit bitmask:
 *   bit 0 = runner on 1B
 *   bit 1 = runner on 2B
 *   bit 2 = runner on 3B
 * So 0 = bases empty, 1 = 1B only, 2 = 2B only, 3 = 1B+2B, 4 = 3B,
 * 5 = 1B+3B, 6 = 2B+3B, 7 = bases loaded.
 *
 * Values reflect the league-average expected runs scored from that base/out
 * state to the end of the inning. Source: Tom Tango / FanGraphs RE24 matrix
 * (recent 5-year averages, rounded to 2 decimals).
 */
export const RE24_MATRIX: number[][] = [
  // outs:    0     1     2
  /* 0 ___ */ [0.49, 0.26, 0.10],
  /* 1 1__ */ [0.86, 0.51, 0.22],
  /* 2 _2_ */ [1.10, 0.66, 0.32],
  /* 3 12_ */ [1.45, 0.89, 0.43],
  /* 4 __3 */ [1.32, 0.96, 0.36],
  /* 5 1_3 */ [1.79, 1.13, 0.49],
  /* 6 _23 */ [2.04, 1.41, 0.59],
  /* 7 123 */ [2.27, 1.55, 0.74],
];

export interface BaseState {
  first: boolean;
  second: boolean;
  third: boolean;
}

export function basesToBitmask(b: BaseState): number {
  return (b.first ? 1 : 0) | (b.second ? 2 : 0) | (b.third ? 4 : 0);
}

export function runExpectancy(b: BaseState, outs: number): number {
  const idx = basesToBitmask(b);
  const o = Math.max(0, Math.min(2, outs));
  return RE24_MATRIX[idx][o];
}

/** RE delta if the batter reaches base safely (treats it as "advance everyone one base"). */
export function reDeltaIfReaches(b: BaseState, outs: number): number {
  const current = runExpectancy(b, outs);
  // Approximate: walk-style runner advance pushes 1B→2B if 1B occupied, etc.
  let r3 = b.third || (b.first && b.second);
  let r2 = (b.first && !b.second) || b.second;
  // Batter takes 1B
  // (If 1B & 2B both occupied without 3B, now 3B is filled by the runner formerly at 2B.)
  if (b.first && b.second && !b.third) { r3 = true; r2 = true; }
  const next: BaseState = { first: true, second: r2, third: r3 };
  // No change in outs.
  const after = runExpectancy(next, outs);
  return Math.max(0, after - current);
}

/** RE delta if the batter strikes out / makes an out (treat as +1 out, runners hold). */
export function reDeltaIfOut(b: BaseState, outs: number): number {
  const current = runExpectancy(b, outs);
  if (outs >= 2) return -current; // inning ends → 0 future runs
  return runExpectancy(b, outs + 1) - current;
}

/** Pretty label for a base state, e.g. "1st & 3rd", "Bases loaded". */
export function baseStateLabel(b: BaseState): string {
  const idx = basesToBitmask(b);
  return [
    'Bases empty',
    'Runner on 1st',
    'Runner on 2nd',
    '1st & 2nd',
    'Runner on 3rd',
    '1st & 3rd',
    '2nd & 3rd',
    'Bases loaded',
  ][idx];
}

/** True if any runner is in scoring position. */
export function isRISP(b: BaseState): boolean {
  return b.second || b.third;
}
