import { describe, it, expect } from "vitest";
import { computeBatterStatcastSummary } from "@/lib/savant";
import type { SavantPitch } from "@/lib/savant";

function batted(launchSpeed: number, launchAngle = 15): SavantPitch {
  return {
    batterId: 1,
    pitcherId: 0,
    type: "X",
    launchSpeed,
    launchAngle,
  } as SavantPitch;
}

describe("computeBatterStatcastSummary (bug 6 fallback)", () => {
  // The Savant expected_statistics leaderboard only includes qualified
  // batters. When `expected` is null we still have per-batter pitches —
  // compute Avg EV / Hard Hit% / Barrel% directly from launchSpeed +
  // launchAngle so the tiles aren't stuck on "—".

  it("returns null when there are no batted balls", () => {
    expect(computeBatterStatcastSummary([])).toBeNull();
  });

  it("ignores non-in-play pitches when computing EV", () => {
    const pitches = [
      { batterId: 1, pitcherId: 0, type: "S", launchSpeed: 999 } as SavantPitch,
      batted(95, 12),
      batted(100, 25),
    ];
    const summary = computeBatterStatcastSummary(pitches);
    expect(summary).not.toBeNull();
    // (95 + 100) / 2 = 97.5 — the "S" pitch's bogus value is excluded
    expect(summary!.avgExitVelo).toBeCloseTo(97.5, 5);
    expect(summary!.battedBalls).toBe(2);
  });

  it("computes Hard Hit% as fraction of EV >= 95", () => {
    const summary = computeBatterStatcastSummary([
      batted(80),
      batted(90),
      batted(95), // hard hit (boundary)
      batted(105), // hard hit
    ]);
    expect(summary!.hardHitPct).toBeCloseTo(50, 5);
  });

  it("computes Barrel% as EV >= 98 and 26 <= LA <= 30", () => {
    const summary = computeBatterStatcastSummary([
      batted(110, 28), // barrel
      batted(110, 35), // launch angle out of band
      batted(95, 28), // EV too low
      batted(98, 30), // barrel (boundary)
    ]);
    // 2 / 4 = 50%
    expect(summary!.brlPct).toBeCloseTo(50, 5);
  });

  it("returns percentages as 0-100 numbers (not 0-1 fractions)", () => {
    const summary = computeBatterStatcastSummary([
      batted(96),
      batted(96),
    ]);
    expect(summary!.hardHitPct).toBeGreaterThan(1);
    expect(summary!.hardHitPct).toBeLessThanOrEqual(100);
  });
});
