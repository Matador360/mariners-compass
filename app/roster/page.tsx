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

const POSITION_GROUPS: Record<PositionFilter, string[]> = {
  all: [],
  SP: ["SP"],
  RP: ["RP", "CL"],
  C: ["C"],
  IF: ["1B", "2B", "3B", "SS"],
  OF: ["LF", "CF", "RF", "OF"],
  DH: ["DH"],
};

interface PlayerWithStats extends MLBRosterPlayer {
  hittingStats?: MLBHittingStats;
  pitchingStats?: MLBPitchingStats;
  hotCold?: "hot" | "cold" | "neutral";
}

function useRoster() {
  const [players, setPlayers] = useState<PlayerWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = "https://statsapi.mlb.com/api/v1";
    fetch(`${base}/teams/${TEAM_ID}/roster?rosterType=active&season=${SEASON}`)
      .then((r) => r.json())
      .then(async (data: { roster: MLBRosterPlayer[] }) => {
        const roster = data.roster ?? [];

        // Fetch stats for all players in parallel (batched)
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
              const seasonStats = statsData.stats?.find((s: { type: { displayName: string } }) => s.type?.displayName === "statsSingleSeason")?.splits?.[0]?.stat;
              const gameLogs: Array<{ stat: MLBHittingStats | MLBPitchingStats }> = statsData.stats?.find((s: { type: { displayName: string } }) => s.type?.displayName === "gameLog")?.splits ?? [];

              // Hot/cold: compare last 7 game stats to season avg
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
              return p;
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

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.person.fullName.toLowerCase().includes(q));
    }

    // Position filter
    if (filter !== "all") {
      const allowed = POSITION_GROUPS[filter];
      result = result.filter((p) => allowed.includes(p.position.abbreviation));
    }

    // Sort
    result.sort((a, b) => {
      if (sort === "name") return a.person.fullName.localeCompare(b.person.fullName);
      if (sort === "jersey") return parseInt(a.jerseyNumber || "99") - parseInt(b.jerseyNumber || "99");
      if (sort === "age") return (a.person.currentAge ?? 99) - (b.person.currentAge ?? 99);
      return 0;
    });

    return result;
  }, [players, filter, sort, search]);

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
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-black text-primary tracking-tight">Active Roster</h1>
        <p className="text-sm text-muted">
          {players.length} players
          {filtered.length !== players.length ? ` · ${filtered.length} shown` : ""}
        </p>
      </div>

      {/* Search + filters */}
      <div className="space-y-3">
        {/* Search */}
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

        {/* Position filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border font-medium transition-colors",
                filter === key
                  ? "bg-teal text-white border-teal"
                  : "border-border text-muted hover:text-primary hover:border-border-accent"
              )}
            >
              {label}
            </button>
          ))}

          {/* Sort */}
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
                {s === "jersey" ? "#" : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {[...Array(18)].map((_, i) => <PlayerCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="trident-card p-10 text-center text-muted">
          No players found{search ? ` for "${search}"` : ""}.
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

      {/* Hot/cold legend */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted pt-2">
          <span>🔥 Hot last 7 (OPS &gt; 115% season avg)</span>
          <span>❄️ Cold last 7 (OPS &lt; 85% season avg)</span>
        </div>
      )}
    </div>
  );
}
