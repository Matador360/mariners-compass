import { describe, it, expect } from "vitest";
import {
  HISTORY_HEADLINE_STATS,
  getHistoryStat,
} from "@/lib/history-constants";

describe("history headline constants", () => {
  // Bug 1 — Best Season (2001) tile must read 116 W, never 74.
  it("Best Season (2001) is 116 wins", () => {
    const stat = getHistoryStat("bestSeasonWins");
    expect(stat.value).toBe(116);
    expect(stat.suffix).toBe(" W");
    expect(stat.label).toMatch(/Best Season/);
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
