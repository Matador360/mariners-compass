"use client";

import { useMemo, useState } from "react";
import { cn, teamLogoUrl } from "@/lib/utils";
import { FRANCHISE_OPPONENTS, type H2HTeamMeta } from "@/lib/h2h-teams";

interface WLRecord {
  w: number;
  l: number;
}

type FilterKey = "All" | "AL West" | "AL" | "NL";

interface H2HMatrixProps {
  thisSeason: Record<string, WLRecord>;
  allTime?: Record<string, WLRecord>;
}

function recordTone(rec: WLRecord | undefined): string {
  if (!rec) return "text-muted";
  if (rec.w + rec.l === 0) return "text-muted";
  if (rec.w > rec.l) return "text-teal";
  if (rec.l > rec.w) return "text-red-400";
  return "text-secondary";
}

function teamMatches(team: H2HTeamMeta, filter: FilterKey): boolean {
  if (filter === "All") return true;
  if (filter === "AL West") return team.league === "AL" && team.division === "West";
  if (filter === "AL") return team.league === "AL";
  if (filter === "NL") return team.league === "NL";
  return true;
}

const DIVISION_RANK: Record<string, number> = {
  "AL-West": 0,
  "AL-East": 1,
  "AL-Central": 2,
  "NL-West": 3,
  "NL-East": 4,
  "NL-Central": 5,
};

function teamSortKey(team: H2HTeamMeta): number {
  return DIVISION_RANK[`${team.league}-${team.division}`] ?? 99;
}

export function H2HMatrix({ thisSeason, allTime }: H2HMatrixProps) {
  const [filter, setFilter] = useState<FilterKey>("All");

  const sorted = useMemo(
    () =>
      [...FRANCHISE_OPPONENTS].sort((a, b) => {
        const da = teamSortKey(a);
        const db = teamSortKey(b);
        if (da !== db) return da - db;
        return a.abbrev.localeCompare(b.abbrev);
      }),
    []
  );

  const filtered = useMemo(
    () => sorted.filter((t) => teamMatches(t, filter)),
    [sorted, filter]
  );

  const overSplitDivisions = useMemo(() => {
    const div = new Map<string, { w: number; l: number }>();
    for (const team of FRANCHISE_OPPONENTS) {
      const k = `${team.league} ${team.division}`;
      const rec = thisSeason[team.abbrev];
      if (!rec) continue;
      const cur = div.get(k) ?? { w: 0, l: 0 };
      cur.w += rec.w;
      cur.l += rec.l;
      div.set(k, cur);
    }
    let count = 0;
    for (const [, rec] of div) {
      if (rec.w > rec.l) count++;
    }
    return count;
  }, [thisSeason]);

  const filterChips: FilterKey[] = ["All", "AL West", "AL", "NL"];

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <p className="text-sm text-secondary">
          Above .500 in{" "}
          <span className="text-teal font-black stat-number">{overSplitDivisions}</span>{" "}
          {overSplitDivisions === 1 ? "division" : "divisions"} this season.
        </p>
        <div className="flex items-center gap-1.5 bg-surface-2/50 rounded-full p-1 border border-border">
          {filterChips.map((chip) => (
            <button
              key={chip}
              onClick={() => setFilter(chip)}
              className={cn(
                "text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full transition-colors",
                filter === chip
                  ? "bg-teal/20 text-teal"
                  : "text-muted hover:text-secondary"
              )}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {filtered.map((team) => {
          const rec = thisSeason[team.abbrev];
          const lifetime = allTime?.[team.abbrev];
          const total = (rec?.w ?? 0) + (rec?.l ?? 0);
          const pct = total > 0 ? (rec!.w / total) * 100 : 0;
          const tone = recordTone(rec);
          const barColor =
            pct > 50 ? "bg-teal" : pct < 50 && total > 0 ? "bg-red-500/70" : "bg-white/15";

          return (
            <div
              key={team.id}
              className="trident-card p-3 hover:border-teal/20 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={teamLogoUrl(team.id)}
                  alt={team.name}
                  className="w-6 h-6 object-contain shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-black text-primary leading-tight">
                    {team.abbrev}
                  </p>
                  <p className="text-[9px] text-muted truncate">
                    {team.league} {team.division}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[9px] uppercase tracking-widest text-muted font-bold">
                    This yr
                  </span>
                  <span
                    className={cn("text-xs font-black tabular-nums", tone)}
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {rec ? `${rec.w}–${rec.l}` : "—"}
                  </span>
                </div>
                <div className="h-[3px] bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className={cn("h-full transition-all", barColor)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {lifetime && (
                  <div className="flex items-baseline justify-between gap-2 pt-1">
                    <span className="text-[9px] uppercase tracking-widest text-muted/70 font-bold">
                      All-time
                    </span>
                    <span
                      className="text-[10px] tabular-nums text-muted"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {lifetime.w}–{lifetime.l}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
