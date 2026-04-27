#!/usr/bin/env tsx
/**
 * Build-time sanity checks for franchise data.
 *
 * Run with: `npm run audit:records`
 * Wire as prebuild gate: add `"prebuild": "npm run audit:records"` to
 * package.json and CI will block deploys on rule violations.
 *
 * Rules enforced:
 *   1. Every FRANCHISE_RECORD has a positive `value`.
 *   2. Every FRANCHISE_RECORD has a non-empty holder name + years.
 *   3. Rate-stat records (unit === "rate") MUST declare a threshold so
 *      a 50-PA hitter at .585 can't shatter Ichiro's career AVG.
 *   4. No duplicate `statKey` values.
 *   5. Every HISTORY_HEADLINE_STAT has a citation URL.
 *   6. No duplicate `key` values in HISTORY_HEADLINE_STATS.
 */
import { FRANCHISE_RECORDS } from "../lib/franchise-records";
import { HISTORY_HEADLINE_STATS } from "../lib/history-constants";

export interface AuditViolation {
  rule: string;
  message: string;
}

export function auditFranchiseRecords(
  records: typeof FRANCHISE_RECORDS,
): AuditViolation[] {
  const violations: AuditViolation[] = [];
  const seen = new Set<string>();

  for (const r of records) {
    if (!(r.value > 0)) {
      violations.push({
        rule: "record.value > 0",
        message: `${r.statKey}: value is ${r.value}`,
      });
    }
    if (!r.holder?.name?.trim() || !r.holder?.years?.trim()) {
      violations.push({
        rule: "record.holder populated",
        message: `${r.statKey}: holder name or years missing`,
      });
    }
    if (r.unit === "rate" && !r.threshold) {
      violations.push({
        rule: "rate-stat record requires threshold",
        message: `${r.statKey}: rate stat ${r.label} ships without min PA/IP gate`,
      });
    }
    if (r.threshold && !(r.threshold.min > 0)) {
      violations.push({
        rule: "threshold.min > 0",
        message: `${r.statKey}: threshold min is ${r.threshold.min}`,
      });
    }
    if (seen.has(r.statKey)) {
      violations.push({
        rule: "unique statKey",
        message: `duplicate statKey: ${r.statKey}`,
      });
    }
    seen.add(r.statKey);
  }

  return violations;
}

export function auditHistoryHeadlines(
  stats: typeof HISTORY_HEADLINE_STATS,
): AuditViolation[] {
  const violations: AuditViolation[] = [];
  const seen = new Set<string>();

  for (const s of stats) {
    if (!s.source || !/^https?:\/\//.test(s.source)) {
      violations.push({
        rule: "headline stat carries citation URL",
        message: `${s.key}: source missing or invalid (${s.source})`,
      });
    }
    if (!s.label?.trim()) {
      violations.push({
        rule: "headline stat has label",
        message: `${s.key}: label is empty`,
      });
    }
    if (seen.has(s.key)) {
      violations.push({
        rule: "unique headline key",
        message: `duplicate headline key: ${s.key}`,
      });
    }
    seen.add(s.key);
  }

  return violations;
}

export function runAudit(): AuditViolation[] {
  return [
    ...auditFranchiseRecords(FRANCHISE_RECORDS),
    ...auditHistoryHeadlines(HISTORY_HEADLINE_STATS),
  ];
}

// Only execute as CLI when invoked directly (not when imported by tests).
const isMain =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  /scripts[\\/]audit\.[cm]?[jt]s$/.test(process.argv[1]);

if (isMain) {
  const violations = runAudit();
  if (violations.length > 0) {
    console.error(`\n[audit] ${violations.length} violation(s):\n`);
    for (const v of violations) {
      console.error(`  - [${v.rule}] ${v.message}`);
    }
    console.error(``);
    process.exit(1);
  }
  console.log(
    `[audit] ✓ ${FRANCHISE_RECORDS.length} franchise records and ` +
      `${HISTORY_HEADLINE_STATS.length} headline stats pass all rules.`,
  );
}
