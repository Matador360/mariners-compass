import { describe, it, expect } from "vitest";
import {
  auditFranchiseRecords,
  auditHistoryHeadlines,
  runAudit,
} from "../scripts/audit";
import type { FranchiseRecord } from "@/lib/franchise-records";
import type { HistoryHeadlineStat } from "@/lib/history-constants";

describe("scripts/audit (bug 7)", () => {
  it("real franchise records and headline stats pass all rules", () => {
    expect(runAudit()).toEqual([]);
  });

  it("flags a rate-stat record missing its threshold", () => {
    const broken: FranchiseRecord[] = [
      {
        statKey: "test_avg",
        label: "fake AVG",
        emoji: "📐",
        holder: { name: "Test", years: "2026" },
        value: 0.322,
        unit: "rate",
        tier: "hitting",
        betterDirection: "higher",
        // threshold intentionally omitted
      },
    ];
    const violations = auditFranchiseRecords(broken);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations.some((v) => /threshold/i.test(v.rule))).toBe(true);
  });

  it("flags a record with non-positive value", () => {
    const broken: FranchiseRecord[] = [
      {
        statKey: "zero",
        label: "Bad",
        emoji: "❌",
        holder: { name: "X", years: "Y" },
        value: 0,
        unit: "int",
        tier: "hitting",
        betterDirection: "higher",
      },
    ];
    expect(auditFranchiseRecords(broken).some((v) => /value/.test(v.rule))).toBe(
      true,
    );
  });

  it("flags duplicate statKey", () => {
    const broken: FranchiseRecord[] = [
      {
        statKey: "dup",
        label: "A",
        emoji: "1",
        holder: { name: "x", years: "y" },
        value: 1,
        unit: "int",
        tier: "hitting",
        betterDirection: "higher",
      },
      {
        statKey: "dup",
        label: "B",
        emoji: "2",
        holder: { name: "x", years: "y" },
        value: 1,
        unit: "int",
        tier: "hitting",
        betterDirection: "higher",
      },
    ];
    expect(
      auditFranchiseRecords(broken).some((v) => /unique/i.test(v.rule)),
    ).toBe(true);
  });

  it("flags a headline stat with no citation URL", () => {
    const broken: HistoryHeadlineStat[] = [
      {
        key: "k",
        value: 1,
        suffix: "",
        label: "L",
        decimals: 0,
        source: "",
      },
    ];
    expect(
      auditHistoryHeadlines(broken).some((v) => /citation/i.test(v.rule)),
    ).toBe(true);
  });
});
