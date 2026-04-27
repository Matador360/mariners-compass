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

describe("playoff drought tile (bug 3)", () => {
  // Bug report described two drought renderings: 13 yrs in one tile, 21 yrs
  // in another. Local source already has only 21 yrs. Guard against any
  // duplicate or leftover "13 yrs" drought tile re-appearing.

  it("HISTORY_HEADLINE_STATS has exactly one Playoff Drought entry of 21 yrs", () => {
    const droughts = HISTORY_HEADLINE_STATS.filter((s) =>
      /Playoff Drought/i.test(s.label)
    );
    expect(droughts).toHaveLength(1);
    expect(droughts[0].value).toBe(21);
    expect(droughts[0].suffix).toBe(" yrs");
  });

  it("no headline stat carries a stale '13 yrs' drought value", () => {
    const stale = HISTORY_HEADLINE_STATS.find(
      (s) => /Drought/i.test(s.label) && s.value === 13
    );
    expect(stale).toBeUndefined();
  });

  it("history-static-content.tsx does not render a hardcoded '13 yrs' drought", () => {
    const text = readFileSync(
      resolve(ROOT, "components/history-static-content.tsx"),
      "utf8"
    );
    // Look for "13 yrs" or "13 years" near the word "drought" (case-insensitive,
    // multiline, within 80 chars).
    const droughtNear13 = /drought[\s\S]{0,80}\b13\s*(?:yrs|years)\b/i.test(text);
    const thirteenNearDrought = /\b13\s*(?:yrs|years)[\s\S]{0,80}drought/i.test(text);
    expect(droughtNear13 || thirteenNearDrought).toBe(false);
  });
});
