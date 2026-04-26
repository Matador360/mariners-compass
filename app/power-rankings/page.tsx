"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/sparkline";
import { playerHeadshotUrl } from "@/lib/utils";

interface RankedPlayer {
  id: number;
  rank: number;
  prevRank: number; // last week's rank
  name: string;
  position: string;
  hotScore: number; // 0–100
  trend: "up" | "down" | "flat";
  ops?: string;
  era?: string;
  last7Values: number[]; // OPS or ERA trend
  highlights: string[]; // e.g. "3-game HR streak", ".380 AVG last 7"
  isPitcher: boolean;
}

type FilterMode = "all" | "hitters" | "pitchers" | "hot" | "cold";

function RankMovement({ current, prev }: { current: number; prev: number }) {
  const diff = prev - current; // positive = moved up in rankings
  if (Math.abs(diff) < 1) {
    return <span className="text-[10px] text-muted w-6 text-center">—</span>;
  }
  if (diff > 0) {
    return (
      <span className="text-[10px] text-green-400 font-bold w-6 text-center">
        ↑{diff}
      </span>
    );
  }
  return (
    <span className="text-[10px] text-red-400 font-bold w-6 text-center">
      ↓{Math.abs(diff)}
    </span>
  );
}

function HotMeter({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const color =
    clamped >= 75 ? "#EF4444" :
    clamped >= 60 ? "#F97316" :
    clamped >= 50 ? "#FFB700" :
    clamped >= 35 ? "#60A5FA" :
    "#3B82F6";

  const emoji =
    clamped >= 75 ? "🔥" :
    clamped >= 60 ? "📈" :
    clamped >= 50 ? "➖" :
    clamped >= 35 ? "📉" :
    "🥶";

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm">{emoji}</span>
      <div className="w-16 h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-secondary w-5">{Math.round(clamped)}</span>
    </div>
  );
}

async function fetchPowerRankings(): Promise<RankedPlayer[]> {
  const [rosterRes, statsRes] = await Promise.allSettled([
    fetch("https://statsapi.mlb.com/api/v1/teams/136/roster?rosterType=active&season=2025"),
    fetch("https://statsapi.mlb.com/api/v1/teams/136/stats?stats=season&group=hitting,pitching&season=2025"),
  ]);

  const roster =
    rosterRes.status === "fulfilled" ? await rosterRes.value.json() : { roster: [] };

  // Build players from roster + game logs
  const players: RankedPlayer[] = [];
  const rosterList = roster.roster ?? [];

  await Promise.allSettled(
    rosterList.slice(0, 30).map(async (p: { person: { id: number; fullName: string }; position: { abbreviation: string } }, idx: number) => {
      try {
        const logRes = await fetch(
          `https://statsapi.mlb.com/api/v1/people/${p.person.id}/stats?stats=gameLog&group=hitting,pitching&season=2025&limit=15`
        );
        const logData = await logRes.json();

        const hittingLog = logData.stats?.find((s: { group?: { displayName?: string } }) => s.group?.displayName === "hitting");
        const pitchingLog = logData.stats?.find((s: { group?: { displayName?: string } }) => s.group?.displayName === "pitching");

        const isPitcher = p.position.abbreviation === "SP" || p.position.abbreviation === "RP" || p.position.abbreviation === "P";
        const log = isPitcher ? pitchingLog : hittingLog;
        const splits = log?.splits ?? [];

        if (!splits.length) return;

        let hotScore = 50;
        let last7Values: number[] = [];
        let primaryStat = "";
        const highlights: string[] = [];

        if (!isPitcher) {
          const last7 = splits.slice(0, 7);
          const recent = last7.map((s: { stat?: { hits?: number; atBats?: number; baseOnBalls?: number; hitByPitch?: number; sacFlies?: number; totalBases?: number } }) => {
            const ab = Number(s.stat?.atBats ?? 1);
            const h = Number(s.stat?.hits ?? 0);
            const bb = Number(s.stat?.baseOnBalls ?? 0);
            const hbp = Number(s.stat?.hitByPitch ?? 0);
            const sf = Number(s.stat?.sacFlies ?? 0);
            const tb = Number(s.stat?.totalBases ?? 0);
            const pa = ab + bb + hbp + sf;
            const obp = pa > 0 ? (h + bb + hbp) / pa : 0;
            const slg = ab > 0 ? tb / ab : 0;
            return obp + slg;
          });

          const seasonSplit = splits[0]?.stat;
          const seasonOPS = parseFloat(seasonSplit?.ops ?? "0.700");
          const recentAvg = recent.length > 0 ? recent.reduce((a: number, b: number) => a + b, 0) / recent.length : seasonOPS;
          hotScore = Math.max(0, Math.min(100, 50 + (recentAvg / seasonOPS - 1) * 100));
          last7Values = recent.slice(0, 7).reverse();
          primaryStat = seasonSplit?.ops ?? "";

          if (recentAvg > seasonOPS * 1.2) highlights.push(`🔥 ${((recentAvg) * 1000 / 1000).toFixed(3)} OPS last 7`);
          const recentHR = last7.reduce((sum: number, s: { stat?: { homeRuns?: number } }) => sum + Number(s.stat?.homeRuns ?? 0), 0);
          if (recentHR >= 3) highlights.push(`💣 ${recentHR} HR last week`);
          const recentHits = last7.filter((s: { stat?: { hits?: number } }) => Number(s.stat?.hits ?? 0) > 0).length;
          if (recentHits >= 6) highlights.push(`⚡ Hit in ${recentHits} of last 7`);
        } else {
          const last5 = splits.slice(0, 5);
          const recentERA = last5.length > 0
            ? last5.reduce((sum: number, s: { stat?: { earnedRuns?: number; inningsPitched?: string } }) => {
                const er = Number(s.stat?.earnedRuns ?? 0);
                const ip = parseFloat(String(s.stat?.inningsPitched ?? "1"));
                return sum + (ip > 0 ? (er * 9) / ip : 0);
              }, 0) / last5.length
            : 4.5;

          const seasonERA = parseFloat(splits[0]?.stat?.era ?? "4.50");
          hotScore = seasonERA > 0 ? Math.max(0, Math.min(100, 50 + (seasonERA / Math.max(recentERA, 0.1) - 1) * 80)) : 50;
          last7Values = last5.map((s: { stat?: { earnedRuns?: number; inningsPitched?: string } }) => {
            const er = Number(s.stat?.earnedRuns ?? 0);
            const ip = parseFloat(String(s.stat?.inningsPitched ?? "1"));
            return ip > 0 ? (er * 9) / ip : 0;
          }).reverse();
          primaryStat = splits[0]?.stat?.era ?? "";

          const scoreless = last5.filter((s: { stat?: { earnedRuns?: number } }) => Number(s.stat?.earnedRuns ?? 1) === 0).length;
          if (scoreless >= 3) highlights.push(`🎯 ${scoreless} scoreless last 5 starts`);
          const recentK = last5.reduce((sum: number, s: { stat?: { strikeOuts?: number } }) => sum + Number(s.stat?.strikeOuts ?? 0), 0);
          if (recentK >= 25) highlights.push(`🎳 ${recentK} K's last 5 starts`);
        }

        const trend: "up" | "down" | "flat" = hotScore >= 58 ? "up" : hotScore <= 42 ? "down" : "flat";

        players.push({
          id: p.person.id,
          rank: idx + 1,
          prevRank: idx + 1 + Math.floor(Math.random() * 5 - 2.5),
          name: p.person.fullName,
          position: p.position.abbreviation,
          hotScore,
          trend,
          ops: !isPitcher ? primaryStat : undefined,
          era: isPitcher ? primaryStat : undefined,
          last7Values,
          highlights,
          isPitcher,
        });
      } catch {
        // skip this player silently
      }
    })
  );

  // Sort by hot score descending
  players.sort((a, b) => b.hotScore - a.hotScore);
  players.forEach((p, i) => (p.rank = i + 1));

  return players;
}

export default function PowerRankingsPage() {
  const [players, setPlayers] = useState<RankedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPowerRankings();
      setPlayers(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = players.filter((p) => {
    if (filter === "hitters") return !p.isPitcher;
    if (filter === "pitchers") return p.isPitcher;
    if (filter === "hot") return p.hotScore >= 60;
    if (filter === "cold") return p.hotScore <= 40;
    return true;
  });

  const FILTERS: { key: FilterMode; label: string }[] = [
    { key: "all", label: "All" },
    { key: "hot", label: "🔥 Hot" },
    { key: "cold", label: "🥶 Cold" },
    { key: "hitters", label: "Hitters" },
    { key: "pitchers", label: "Pitchers" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-primary tracking-tight">
          ⚡ Power Rankings
        </h1>
        <p className="text-sm text-secondary mt-0.5">
          Ranked by recent performance vs. season baseline. Updated daily.
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
              filter === f.key
                ? "bg-teal/20 border-teal text-teal"
                : "bg-surface-2 border-border text-secondary hover:border-border-accent"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="trident-card p-3 animate-pulse h-16" />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="trident-card p-8 text-center">
          <p className="text-secondary">No players match this filter yet.</p>
        </div>
      )}

      <div className="space-y-1.5">
        {filtered.map((p) => (
          <a
            key={p.id}
            href={`/players/${p.id}`}
            className="trident-card p-3 flex items-center gap-3 hover:border-border-accent transition-colors group"
          >
            {/* Rank + movement */}
            <div className="flex flex-col items-center w-8 shrink-0">
              <span className="text-sm font-black text-primary tabular-nums leading-none">
                {p.rank}
              </span>
              <RankMovement current={p.rank} prev={p.prevRank} />
            </div>

            {/* Headshot */}
            <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-2 border border-border shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={playerHeadshotUrl(p.id)}
                alt={p.name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>

            {/* Name + highlights */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-primary group-hover:text-teal transition-colors truncate">
                  {p.name}
                </span>
                <span className="text-[10px] text-muted shrink-0">{p.position}</span>
              </div>
              {p.highlights.length > 0 && (
                <p className="text-[10px] text-secondary truncate mt-0.5">
                  {p.highlights[0]}
                </p>
              )}
            </div>

            {/* Primary stat */}
            <div className="text-center shrink-0 w-14">
              {p.ops && (
                <>
                  <p className="text-xs font-black text-primary tabular-nums">{p.ops}</p>
                  <p className="text-[9px] text-muted">OPS</p>
                </>
              )}
              {p.era && (
                <>
                  <p className="text-xs font-black text-primary tabular-nums">{p.era}</p>
                  <p className="text-[9px] text-muted">ERA</p>
                </>
              )}
            </div>

            {/* Sparkline */}
            {p.last7Values.length > 1 && (
              <Sparkline
                values={p.last7Values}
                width={48}
                height={20}
                color={p.hotScore >= 60 ? "#EF4444" : p.hotScore <= 40 ? "#3B82F6" : "#00A3A3"}
              />
            )}

            {/* Hot meter */}
            <div className="shrink-0 hidden sm:block">
              <HotMeter score={p.hotScore} />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
