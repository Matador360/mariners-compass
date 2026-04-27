import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  HISTORY_HEADLINE_STATS,
  getHistoryStat,
} from "@/lib/history-constants";
import { MARINERS_FACTS } from "@/lib/calc-stats";

const ROOT = resolve(__dirname, "..");

describe("history headline constants", () => {
  // Bug 1 — Best Season (2001) tile must read 116 W, never 74.
  it("Best Season (2001) is 116 wins", () => {
    const stat = getHistoryStat("bestSeasonWins");
    expect(stat.value).toBe(116);
    expect(stat.suffix).toBe(" W");
    expect(stat.label).toMatch(/Best Season/);
  });

  // Bug 2 — Ichiro's 2004 hits record is 262, never 167.
  it("Ichiro's 2004 hits record is 262", () => {
    const stat = getHistoryStat("ichiro2004Hits");
    expect(stat.value).toBe(262);
    expect(stat.suffix).toBe(" H");
  });

  it("every headline stat carries a citation URL", () => {
    for (const stat of HISTORY_HEADLINE_STATS) {
      expect(stat.source, `${stat.key} missing source`).toMatch(/^https?:\/\//);
    }
  });

  it("getHistoryStat throws on unknown keys", () => {
    expect(() => getHistoryStat("notAKey")).toThrow();
  });
});

describe("ichiro 2004 hits — single source of truth", () => {
  // The bug report flagged that the tile showed 167 H while the
  // "Did You Know" carousel showed 262 — two sources of truth. Now both
  // should reference 262, and no content file should mention 167 hits.
  const CONTENT_FILES = [
    "components/history-static-content.tsx",
    "lib/calc-stats.ts",
    "lib/history-constants.ts",
  ];

  it("MARINERS_FACTS carousel says 262", () => {
    const ichiroFact = MARINERS_FACTS.find((f) => /Ichiro/.test(f.fact));
    expect(ichiroFact, "no Ichiro fact in MARINERS_FACTS").toBeDefined();
    expect(ichiroFact!.fact).toContain("262");
  });

  it("no content file mentions '167 hits' or '167 H' for Ichiro", () => {
    for (const rel of CONTENT_FILES) {
      const text = readFileSync(resolve(ROOT, rel), "utf8");
      expect(text, `${rel} contains '167 hits'`).not.toMatch(/\b167\s*hits?\b/i);
      expect(text, `${rel} contains '167 H'`).not.toMatch(/\b167\s*H\b/);
    }
  });
});
