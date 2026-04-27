import { describe, it, expect } from "vitest";
import {
  FRANCHISE_RECORDS,
  computeChase,
} from "@/lib/franchise-records";
import type { MLBHittingStats, MLBPitchingStats } from "@/types/mlb";

function findRecord(statKey: string) {
  const r = FRANCHISE_RECORDS.find((rec) => rec.statKey === statKey);
  if (!r) throw new Error(`record ${statKey} not found`);
  return r;
}

function hitting(partial: Partial<MLBHittingStats>): MLBHittingStats {
  return partial as MLBHittingStats;
}

function pitching(partial: Partial<MLBPitchingStats>): MLBPitchingStats {
  return partial as MLBPitchingStats;
}

describe("computeChase — rate-stat min-PA / min-IP gate (bug 4)", () => {
  // The "Career AVG (min 1000 PA)" record (Ichiro, .322) was being shown as
  // "SHATTERED" by Will Wilson at .585 with ~50 PA. The label says min 1000
  // PA but the gate wasn't enforced. Same shape applies to Career OPS and
  // Career ERA (min 1000 IP).
  const avgRecord = findRecord("avg");

  it("AVG record has a 1000-PA threshold defined", () => {
    expect(avgRecord.threshold).toBeDefined();
    expect(avgRecord.threshold?.field).toBe("plateAppearances");
    expect(avgRecord.threshold?.min).toBe(1000);
  });

  it("Will-Wilson-style small-sample .585 does NOT qualify", () => {
    // MLB API returns rate stats as strings (".585"), counts as numbers.
    const chase = computeChase(avgRecord, {
      hitting: hitting({ avg: ".585", plateAppearances: 50 }),
    });
    expect(chase.qualifies).toBe(false);
  });

  it("a qualified .350 hitter with 1500 PA DOES qualify and shows shattered", () => {
    const chase = computeChase(avgRecord, {
      hitting: hitting({ avg: ".350", plateAppearances: 1500 }),
    });
    expect(chase.qualifies).toBe(true);
    expect(chase.current).toBeCloseTo(0.35, 5);
    expect(chase.pace).toBe("shattered");
  });

  it("a hitter at exactly 1000 PA qualifies (boundary case)", () => {
    const chase = computeChase(avgRecord, {
      hitting: hitting({ avg: ".310", plateAppearances: 1000 }),
    });
    expect(chase.qualifies).toBe(true);
  });

  it("counting-stat records (no threshold) always qualify", () => {
    const hitsRecord = findRecord("hits");
    expect(hitsRecord.threshold).toBeUndefined();
    const chase = computeChase(hitsRecord, {
      hitting: hitting({ hits: 100, plateAppearances: 200 }),
    });
    expect(chase.qualifies).toBe(true);
  });

  it("ERA record enforces 1000 IP threshold (parses fractional innings)", () => {
    const eraRecord = findRecord("era");
    expect(eraRecord.threshold).toBeDefined();
    expect(eraRecord.threshold?.field).toBe("inningsPitched");
    expect(eraRecord.threshold?.min).toBe(1000);

    // Pitcher with 30 IP and 2.50 ERA — does not qualify.
    const lowSample = computeChase(eraRecord, {
      pitching: pitching({ era: "2.50", inningsPitched: "30.0" }),
    });
    expect(lowSample.qualifies).toBe(false);

    // Pitcher with 1500 IP and 3.00 ERA — qualifies.
    const qualified = computeChase(eraRecord, {
      pitching: pitching({ era: "3.00", inningsPitched: "1500.0" }),
    });
    expect(qualified.qualifies).toBe(true);
  });
});
