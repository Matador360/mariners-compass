import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");

describe("/stats Run Diff games-played (bug 5)", () => {
  // The Run Diff tab counts `runDiffByGame.length` as "Games Played".
  // Without `gameType=R` the schedule API returns Spring Training + Reg
  // Season, inflating the count (~30 ST + ~29 RS = ~60 vs the team's
  // actual 14-15 record).
  const PAGE = readFileSync(resolve(ROOT, "app/stats/page.tsx"), "utf8");

  it("the schedule fetch URL includes gameType=R", () => {
    const scheduleFetches = PAGE.match(/\/schedule\?[^`'"]+/g) ?? [];
    expect(scheduleFetches.length).toBeGreaterThan(0);
    for (const url of scheduleFetches) {
      expect(url, `schedule URL missing gameType=R: ${url}`).toMatch(/[?&]gameType=R\b/);
    }
  });
});
