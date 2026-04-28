import { fetchRoster, fetchPlayerGameLog, fetchPlayerSeasonStats, fetchTeamPitchingStats } from "@/lib/mlb-api";
import {
  parseIP,
  computeFatigue,
  inferRole,
  last5Summary,
  summarizeBullpen,
  dreadScore,
  type RelieverGameLog,
  type SeasonPitchingStats,
  type RelieverProfile,
} from "@/lib/bullpen";
import { BullpenHeroCaption } from "@/components/bullpen-hero-caption";
import { RelieverCard } from "@/components/reliever-card";
import { cn } from "@/lib/utils";
import type { MLBPitchingStats } from "@/types/mlb";

export const revalidate = 900;

// ---- Workload bar component ----

function WorkloadBar({ reliever }: { reliever: RelieverProfile }) {
  const max = 80; // pitches over 3 days is our reference max
  const p = reliever.fatigue.pitches3d;
  const pct = Math.min(100, (p / max) * 100);
  const color =
    reliever.fatigue.status === "red"
      ? "bg-red-500"
      : reliever.fatigue.status === "yellow"
      ? "bg-amber-400"
      : "bg-teal/70";

  return (
    <div className="flex items-center gap-2">
      <span className="w-[140px] text-xs text-primary truncate text-right">
        {reliever.name.split(" ").slice(-1)[0]}
      </span>
      <div className="flex-1 h-2 rounded-full bg-white/5">
        <div
          className={cn("h-full rounded-full", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-[10px] text-muted tabular-nums text-right">
        {p}p
      </span>
    </div>
  );
}

// ---- Dread meter ----

function DreadMeter({ score }: { score: number }) {
  const label =
    score >= 70 ? "DREAD ZONE" : score >= 45 ? "Shaky" : score >= 25 ? "Watchable" : "Locked In";
  const color =
    score >= 70
      ? "text-red-400"
      : score >= 45
      ? "text-amber-400"
      : score >= 25
      ? "text-teal"
      : "text-green-400";

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">
        Bullpen Dread Meter
      </p>
      <div className="relative w-40 h-20 flex items-end justify-center overflow-visible">
        {/* Arc background */}
        <svg width="160" height="80" viewBox="0 0 160 80" className="absolute inset-0">
          <path
            d="M 10 75 A 70 70 0 0 1 150 75"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 10 75 A 70 70 0 0 1 150 75"
            fill="none"
            stroke="url(#dread-grad)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 220} 220`}
          />
          <defs>
            <linearGradient id="dread-grad" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        </svg>
        <div className="relative z-10 text-center pb-1">
          <p className={cn("text-3xl font-black tabular-nums", color)}>{score}</p>
          <p className={cn("text-[10px] font-bold uppercase tracking-wide", color)}>{label}</p>
        </div>
      </div>
    </div>
  );
}

// ---- Page ----

export default async function BullpenPage() {
  const [roster, teamPitching] = await Promise.allSettled([
    fetchRoster(),
    fetchTeamPitchingStats(),
  ]);

  const rosterList = roster.status === "fulfilled" ? roster.value : [];
  const teamStats = teamPitching.status === "fulfilled" ? teamPitching.value : null;

  const relievers = rosterList.filter(
    (p) =>
      p.position.type === "Pitcher" &&
      p.position.abbreviation !== "SP"
  );

  const profiles: RelieverProfile[] = [];

  await Promise.allSettled(
    relievers.map(async (player) => {
      const id = player.person.id;

      const [seasonRaw, gameLogRaw] = await Promise.allSettled([
        fetchPlayerSeasonStats(id, "pitching"),
        fetchPlayerGameLog(id, "pitching"),
      ]);

      const seasonStat =
        seasonRaw.status === "fulfilled"
          ? (seasonRaw.value as MLBPitchingStats | null)
          : null;

      const gameLogEntries =
        gameLogRaw.status === "fulfilled" ? gameLogRaw.value : [];

      const ip = seasonStat ? parseIP(seasonStat.inningsPitched) : 0;
      const g = seasonStat?.gamesPitched ?? 0;

      const season: SeasonPitchingStats = {
        era: seasonStat ? parseFloat(seasonStat.era) : 0,
        inningsPitched: ip,
        gamesAppeared: g,
        saves: seasonStat?.saves ?? 0,
        holds: seasonStat?.holds ?? 0,
        blownSaves: seasonStat?.blownSaves ?? 0,
        strikeOuts: seasonStat?.strikeOuts ?? 0,
        baseOnBalls: seasonStat?.baseOnBalls ?? 0,
        hits: seasonStat?.hits ?? 0,
        earnedRuns: seasonStat?.earnedRuns ?? 0,
        avgIP: g > 0 ? ip / g : 0,
      };

      const logs: RelieverGameLog[] = gameLogEntries.map((entry) => {
        const s = entry.stat as MLBPitchingStats;
        const gameIP = parseIP(s.inningsPitched);
        return {
          date: entry.date,
          inningsPitched: gameIP,
          pitches: Math.round(gameIP * 16),
          earnedRuns: s.earnedRuns,
          strikeOuts: s.strikeOuts,
          baseOnBalls: s.baseOnBalls,
        };
      });

      profiles.push({
        id,
        name: player.person.fullName,
        number: player.jerseyNumber,
        role: inferRole(season),
        season,
        fatigue: computeFatigue(logs),
        last5: last5Summary(logs),
      });
    })
  );

  const order: Record<string, number> = { red: 0, yellow: 1, green: 2, unknown: 3 };
  profiles.sort((a, b) => {
    const tierDiff = (order[a.fatigue.status] ?? 3) - (order[b.fatigue.status] ?? 3);
    return tierDiff !== 0 ? tierDiff : a.season.era - b.season.era;
  });

  const summary = summarizeBullpen(teamStats, profiles);

  const seed = Math.floor(Date.now() / 86400000); // stable per day

  const dread = dreadScore(summary.era, summary.redCount, profiles.length);

  const workloadRelievers = [...profiles]
    .filter((r) => r.fatigue.pitches3d > 0)
    .sort((a, b) => b.fatigue.pitches3d - a.fatigue.pitches3d)
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-surface">
      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Hero */}
        <div className="trident-card p-6 flex flex-col items-center text-center gap-4">
          <h1 className="text-2xl font-black text-primary uppercase tracking-tight">
            Mariners Bullpen
          </h1>
          <BullpenHeroCaption era={summary.era} seed={seed} />
          <DreadMeter score={dread} />
        </div>

        {/* Aggregate tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: "ERA", value: summary.era > 0 ? summary.era.toFixed(2) : "—" },
            { label: "WHIP", value: summary.whip > 0 ? summary.whip.toFixed(2) : "—" },
            { label: "K/9", value: summary.kPer9 > 0 ? summary.kPer9.toFixed(1) : "—" },
            { label: "SV", value: summary.saves.toString() },
            { label: "HLD", value: summary.holds.toString() },
            { label: "BSV", value: summary.blownSaves.toString() },
          ].map(({ label, value }) => (
            <div key={label} className="trident-card p-3 text-center">
              <p className="text-[9px] text-muted uppercase tracking-widest">{label}</p>
              <p className="text-xl font-black text-primary tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        {/* Fatigue summary bar */}
        {summary.redCount > 0 && (
          <div className="trident-card p-3 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <p className="text-xs text-muted">
              <span className="text-red-400 font-bold">{summary.redCount} reliever{summary.redCount !== 1 ? "s" : ""} flagged as fatigued</span>
              {" "}— may be unavailable or limited tonight.
            </p>
          </div>
        )}

        {/* Main grid */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted mb-3">
            Roster
          </h2>
          {profiles.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">No reliever data available</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {profiles.map((r) => (
                <RelieverCard key={r.id} reliever={r} />
              ))}
            </div>
          )}
        </div>

        {/* Workload bar chart */}
        {workloadRelievers.length > 0 && (
          <div className="trident-card p-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted mb-4">
              Workload (last 3 days)
            </h2>
            <div className="space-y-2">
              {workloadRelievers.map((r) => (
                <WorkloadBar key={r.id} reliever={r} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
