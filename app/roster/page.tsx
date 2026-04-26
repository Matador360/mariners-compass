"use client";

import { useEffect, useState, useMemo } from "react";
import { Search } from "lucide-react";
import { PlayerCard } from "@/components/player-card";
import { PlayerCardSkeleton } from "@/components/skeleton-loader";
import { cn } from "@/lib/utils";
import type { MLBRosterPlayer, MLBHittingStats, MLBPitchingStats } from "@/types/mlb";

const TEAM_ID = 136;
const SEASON = new Date().getFullYear();

type PositionFilter = "all" | "SP" | "RP" | "C" | "IF" | "OF" | "DH";
type SortOption = "name" | "age" | "jersey";

interface PlayerWithStats extends MLBRosterPlayer {
  hittingStats?: MLBHittingStats;
  pitchingStats?: MLBPitchingStats;
  hotCold?: "hot" | "cold" | "neutral";
}

function matchesFilter(p: PlayerWithStats, filter: PositionFilter): boolean {
  if (filter === "all") return true;
  const abbr = p.position.abbreviation;  // "P","C","1B","2B","3B","SS","LF","CF","RF","DH","OF"
  const type = p.position.type;           // "Pitcher","Catcher","Infielder","Outfielder","Hitter","Two-Way Player"
  switch (filter) {
    case "SP":
      return type === "Pitcher" && Number(p.pitchingStats?.gamesStarted ?? 0) >= 3;
    case "RP":
      return type === "Pitcher" && Number(p.pitchingStats?.gamesStarted ?? 0) < 3;
    case "C":
      return abbr === "C" || type === "Catcher";
    case "IF":
      return type === "Infielder" || ["1B","2B","3B","SS","IF"].includes(abbr);
    case "OF":
      return type === "Outfielder" || ["LF","CF","RF","OF"].includes(abbr);
    case "DH":
      return abbr === "DH" || type === "Hitter" || type === "Two-Way Player";
    default:
      return true;
  }
}

function useRoster() {
  const [players, setPlayers] = useState<PlayerWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = "https://statsapi.mlb.com/api/v1";
    // hydrate=person gives us currentAge for sort
    fetch(`${base}/teams/${TEAM_ID}/roster?rosterType=active&season=${SEASON}&hydrate=person`)
      .then((r) => r.json())
      .then(async (data: { roster: MLBRosterPlayer[] }) => {
        const roster = data.roster ?? [];

        const withStats: PlayerWithStats[] = await Promise.all(
          roster.map(async (p) => {
            const posType = p.position.type;
            const isPitcher = posType === "Pitcher";
            const group = isPitcher ? "pitching" : "hitting";
            try {
              const statsRes = await fetch(
                `${base}/people/${p.person.id}/stats?stats=season,gameLog&group=${group}&season=${SEASON}`
              );
              const statsData = await statsRes.json();
              const seasonStats = statsData.stats?.find(
                (s: { type: { displayName: string } }) =>
                  ["season", "statsSingleSeason"].includes(s.type?.displayName)
              )?.splits?.[0]?.stat;
              const gameLogs: Array<{ stat: MLBHittingStats | MLBPitchingStats }> =
                statsData.stats?.find(
                  (s: { type: { displayName: string } }) => s.type?.displayName === "gameLog"
                )?.splits ?? [];

              let hotCold: "hot" | "cold" | "neutral" = "neutral";
              if (gameLogs.length >= 7 && !isPitcher) {
                const last7 = gameLogs.slice(0, 7) as Array<{ stat: MLBHittingStats }>;
                const seasonAvgOps = parseFloat((seasonStats as MLBHittingStats)?.ops ?? "0");
                const last7Ops = last7.reduce((s, g) => s + parseFloat(g.stat.ops ?? "0"), 0) / 7;
                if (last7Ops > seasonAvgOps * 1.15) hotCold = "hot";
                else if (last7Ops < seasonAvgOps * 0.85) hotCold = "cold";
              }

              return {
                ...p,
                hittingStats: isPitcher ? undefined : (seasonStats as MLBHittingStats),
                pitchingStats: isPitcher ? (seasonStats as MLBPitchingStats) : undefined,
                hotCold,
              };
            } catch {
              return { ...p, hotCold: "neutral" as const };
            }
          })
        );

        setPlayers(withStats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { players, loading };
}

export default function RosterPage() {
  const { players, loading } = useRoster();
  const [filter, setFilter] = useState<PositionFilter>("all");
  const [sort, setSort] = useState<SortOption>("name");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = [...players];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.person.fullName.toLowerCase().includes(q));
    }

    result = result.filter((p) => matchesFilter(p, filter));

    result.sort((a, b) => {
      if (sort === "name") return a.person.fullName.localeCompare(b.person.fullName);
      if (sort === "jersey") {
        const an = parseInt(a.jerseyNumber || "999");
        const bn = parseInt(b.jerseyNumber || "999");
        return an - bn;
      }
      if (sort === "age") {
        const aAge = a.person.currentAge ?? 0;
        const bAge = b.person.currentAge ?? 0;
        return bAge - aAge; // oldest first
      }
      return 0;
    });

    return result;
  }, [players, filter, sort, search]);

  // Count per category for filter badges
  const counts = useMemo(() => {
    if (!players.length) return {} as Record<PositionFilter, number>;
    return {
      all: players.length,
      SP: players.filter((p) => matchesFilter(p, "SP")).length,
      RP: players.filter((p) => matchesFilter(p, "RP")).length,
      C: players.filter((p) => matchesFilter(p, "C")).length,
      IF: players.filter((p) => matchesFilter(p, "IF")).length,
      OF: players.filter((p) => matchesFilter(p, "OF")).length,
      DH: players.filter((p) => matchesFilter(p, "DH")).length,
    } as Record<PositionFilter, number>;
  }, [players]);

  const filters: { key: PositionFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "SP", label: "Starters" },
    { key: "RP", label: "Bullpen" },
    { key: "C", label: "Catcher" },
    { key: "IF", label: "Infield" },
    { key: "OF", label: "Outfield" },
    { key: "DH", label: "DH" },
  ];

  function getPlayerStats(p: PlayerWithStats) {
    if (p.pitchingStats) {
      return {
        primary: { label: "ERA", value: p.pitchingStats.era },
        secondary: { label: "K", value: p.pitchingStats.strikeOuts },
        tertiary: { label: "WHIP", value: p.pitchingStats.whip },
      };
    }
    if (p.hittingStats) {
      return {
        primary: { label: "AVG", value: p.hittingStats.avg },
        secondary: { label: "HR", value: p.hittingStats.homeRuns },
        tertiary: { label: "OPS", value: p.hittingStats.ops },
      };
    }
    return { primary: undefined, secondary: undefined, tertiary: undefined };
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-black text-primary tracking-tight">Active Roster</h1>
        <p className="text-sm text-muted">
          {players.length} players
          {filtered.length !== players.length ? ` · ${filtered.length} shown` : ""}
        </p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search player..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-8 pr-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-teal/50 transition-colors"
          />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border font-medium transition-colors flex items-center gap-1",
                filter === key
                  ? "bg-teal text-white border-teal"
                  : "border-border text-muted hover:text-primary hover:border-border-accent"
              )}
            >
              {label}
              {!loading && counts[key] !== undefined && (
                <span className={cn("text-[10px]", filter === key ? "text-white/70" : "text-muted")}>
                  {counts[key]}
                </span>
              )}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[10px] text-muted uppercase tracking-widest">Sort:</span>
            {(["name", "jersey", "age"] as SortOption[]).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={cn(
                  "text-xs px-2 py-1 rounded border transition-colors capitalize",
                  sort === s
                    ? "border-teal/30 text-teal bg-teal/5"
                    : "border-border text-muted hover:text-primary"
                )}
              >
                {s === "jersey" ? "#" : s === "age" ? "age ↓" : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {[...Array(18)].map((_, i) => <PlayerCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="trident-card p-10 text-center text-muted">
          No players found{search ? ` for "${search}"` : filter !== "all" ? ` in this position group` : ""}.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((p) => {
            const stats = getPlayerStats(p);
            return (
              <PlayerCard
                key={p.person.id}
                player={p}
                primaryStat={stats.primary}
                secondaryStat={stats.secondary}
                tertiaryStat={stats.tertiary}
                hotCold={p.hotCold}
                className="fade-up"
              />
            );
          })}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted pt-2">
          <span>🔥 Hot last 7 (OPS &gt; 115% season avg)</span>
          <span>❄️ Cold last 7 (OPS &lt; 85% season avg)</span>
        </div>
      )}
    </div>
  );
}
