"use client";

import { useEffect, useState, useMemo } from "react";
import { cn, playerHeadshotUrl } from "@/lib/utils";

const BASE = "https://statsapi.mlb.com/api/v1";
const TEAM_ID = 136;
const SEASON = new Date().getFullYear();

// Level config: sportId → display info
const LEVEL_CONFIG: Record<number, { label: string; abbr: string; color: string; roast: string }> = {
  11: { label: "Triple-A", abbr: "AAA", color: "#00A3A3", roast: "One good month from a September call-up and instant fan favorite status" },
  12: { label: "Double-A", abbr: "AA", color: "#C9A800", roast: "The real proving ground. If they can't hit here, they can't hit anywhere" },
  13: { label: "High-A", abbr: "A+", color: "#22C55E", roast: "Crushing it against 22-year-olds, future is... probably fine?" },
  14: { label: "Single-A", abbr: "A", color: "#8B5CF6", roast: "Give this kid 4 years and a cup of coffee" },
};

interface Prospect {
  personId: number;
  name: string;
  firstName: string;
  lastName: string;
  position: string;
  age: number;
  level: string;
  levelAbbr: string;
  levelColor: string;
  teamName: string;
  sportId: number;
  isPitcher: boolean;
  jerseyNumber?: string;
  hitting?: {
    avg: string; ops: string; hr: number | string; rbi: number | string;
    sb: number | string; obp: string; slg: string; games: number | string;
  };
  pitching?: {
    era: string; whip: string; k: number | string; ip: string;
    wins: number | string; losses: number | string; games: number | string; saves: number | string;
  };
}

function tridentTake(p: Prospect): string {
  if (p.isPitcher && p.pitching) {
    const era = parseFloat(p.pitching.era ?? "99");
    const whip = parseFloat(p.pitching.whip ?? "99");
    const k = Number(p.pitching.k ?? 0);
    if (era < 2.5 && whip < 1.0) return "This dude is straight-up nasty. Lock him up before he knows he's good.";
    if (era < 3.2) return "Legit starter stuff. Cross your fingers the front office doesn't screw this up.";
    if (era > 5.5) return "The ERA is... not great. But hey, we've rostered worse.";
    if (k > 50 && era < 4.5) return "Misses bats for fun. Just needs to stop putting runners on.";
    return "Solid minor league pitcher. Whether that translates is the million-dollar question.";
  }
  if (!p.isPitcher && p.hitting) {
    const ops = parseFloat(p.hitting.ops ?? "0");
    const avg = parseFloat(p.hitting.avg ?? "0");
    const hr = Number(p.hitting.hr ?? 0);
    if (ops > 0.950) return "Holy shit, this kid can rake. Someone call up Dipoto.";
    if (ops > 0.850) return "Premium bat. If he stays healthy — and that's a big if — he's special.";
    if (ops > 0.750 && hr > 10) return "Pop with a decent average? The Mariners might actually promote him before he turns 30.";
    if (avg < 0.220 && ops < 0.650) return "Yikes. Still young though. Development arc! That's what we're calling this.";
    if (Number(p.hitting.sb ?? 0) > 15) return "Fast as hell. Legs don't slump. Love the profile.";
    return "Decent prospect. Nothing crazy, but the M's have made worse bets.";
  }
  return "Stats loading... or he just hasn't played yet. Either way, hope for the best.";
}

function levelRoast(sportId: number, name: string): string {
  const roasts: Record<number, string[]> = {
    11: [
      `${name} is one injury away from starting on Sunday. No pressure.`,
      `If ${name} keeps this up, he'll be getting booed in Seattle by August.`,
      `Triple-A means you're *almost* there. Almost.`,
    ],
    12: [
      `Double-A: where prospects go to either prove themselves or quietly disappear.`,
      `${name} is passing the test. Now let's see if he passes the MLB test.`,
    ],
    13: [
      `High-A hitters see the same fastball, just 4 mph slower. Don't get too excited yet.`,
      `${name} has the tools. Whether he figures out the breaking ball is another story.`,
    ],
    14: [
      `Single-A. He's 20. Calm the hell down, it's fine.`,
      `Give ${name} three years and don't look at these stats again until then.`,
    ],
  };
  const options = roasts[sportId] ?? [`${name} is grinding through the system.`];
  return options[Math.floor(Math.random() * options.length)];
}

async function fetchProspects(): Promise<Prospect[]> {
  // Get affiliate teams (AAA + AA + A+ + A)
  const teamsRes = await fetch(
    `${BASE}/teams?parentOrgPk=${TEAM_ID}&season=${SEASON}&sportIds=11,12,13,14`
  );
  const teamsData = await teamsRes.json();
  const affiliateTeams: Array<{ id: number; name: string; sport: { id: number; abbreviation: string } }> =
    teamsData.teams ?? [];

  // Focus on AAA and AA only to keep API calls reasonable
  const targetTeams = affiliateTeams.filter((t) => [11, 12].includes(t.sport?.id));

  const allProspects: Prospect[] = [];

  await Promise.allSettled(
    targetTeams.map(async (team) => {
      const cfg = LEVEL_CONFIG[team.sport.id] ?? { label: "MiLB", abbr: "MiLB", color: "#8BA4BA", roast: "" };

      // Get roster
      const rosterRes = await fetch(
        `${BASE}/teams/${team.id}/roster?rosterType=active&season=${SEASON}&hydrate=person`
      );
      const rosterData = await rosterRes.json();
      const roster: Array<{
        person: { id: number; fullName: string; firstName: string; lastName: string; currentAge: number };
        position: { abbreviation: string; type: string };
        jerseyNumber?: string;
      }> = rosterData.roster ?? [];

      // Batch stats for each player
      await Promise.allSettled(
        roster.slice(0, 30).map(async (player) => {
          const isPitcher = player.position.type === "Pitcher";
          const group = isPitcher ? "pitching" : "hitting";
          try {
            const statsRes = await fetch(
              `${BASE}/people/${player.person.id}/stats?stats=season&group=${group}&season=${SEASON}`
            );
            const statsData = await statsRes.json();
            const stat = statsData.stats?.[0]?.splits?.[0]?.stat;

            const prospect: Prospect = {
              personId: player.person.id,
              name: player.person.fullName,
              firstName: player.person.firstName ?? player.person.fullName.split(" ")[0],
              lastName: player.person.lastName ?? player.person.fullName.split(" ").slice(1).join(" "),
              position: player.position.abbreviation,
              age: player.person.currentAge ?? 0,
              level: cfg.label,
              levelAbbr: cfg.abbr,
              levelColor: cfg.color,
              teamName: team.name,
              sportId: team.sport.id,
              isPitcher,
              jerseyNumber: player.jerseyNumber,
              hitting: !isPitcher && stat ? {
                avg: stat.avg ?? ".---",
                ops: stat.ops ?? ".---",
                obp: stat.obp ?? ".---",
                slg: stat.slg ?? ".---",
                hr: stat.homeRuns ?? 0,
                rbi: stat.rbi ?? 0,
                sb: stat.stolenBases ?? 0,
                games: stat.gamesPlayed ?? 0,
              } : undefined,
              pitching: isPitcher && stat ? {
                era: stat.era ?? "-.--",
                whip: stat.whip ?? "-.--",
                k: stat.strikeOuts ?? 0,
                ip: stat.inningsPitched ?? "0.0",
                wins: stat.wins ?? 0,
                losses: stat.losses ?? 0,
                games: stat.gamesPitched ?? 0,
                saves: stat.saves ?? 0,
              } : undefined,
            };

            allProspects.push(prospect);
          } catch {
            // skip
          }
        })
      );
    })
  );

  // Sort: AAA first, then AA; within level sort by OPS desc (hitters) or ERA asc (pitchers)
  return allProspects.sort((a, b) => {
    if (a.sportId !== b.sportId) return a.sportId - b.sportId;
    if (a.isPitcher !== b.isPitcher) return a.isPitcher ? 1 : -1;
    if (!a.isPitcher && a.hitting && b.hitting) {
      return parseFloat(b.hitting.ops ?? "0") - parseFloat(a.hitting.ops ?? "0");
    }
    if (a.isPitcher && a.pitching && b.pitching) {
      return parseFloat(a.pitching.era ?? "99") - parseFloat(b.pitching.era ?? "99");
    }
    return 0;
  });
}

function ProspectCard({ prospect }: { prospect: Prospect }) {
  const take = tridentTake(prospect);
  const roast = levelRoast(prospect.sportId, prospect.firstName);

  return (
    <div className="trident-card p-4 space-y-3 hover:border-border-accent transition-all hover:-translate-y-0.5">
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Headshot */}
        <div
          className="w-12 h-12 rounded-full overflow-hidden bg-surface-2 border-2 shrink-0 flex items-center justify-center"
          style={{ borderColor: prospect.levelColor }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={playerHeadshotUrl(prospect.personId)}
            alt={prospect.name}
            width={48}
            height={48}
            className="w-full h-full object-cover object-top"
            onError={(e) => {
              const t = e.target as HTMLImageElement;
              t.style.display = "none";
              const p = t.parentElement;
              if (p) p.innerHTML = `<span class="text-lg font-black text-muted">${prospect.firstName[0]}${prospect.lastName[0]}</span>`;
            }}
          />
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-primary leading-tight truncate">{prospect.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide text-white"
              style={{ background: prospect.levelColor }}
            >
              {prospect.levelAbbr}
            </span>
            <span className="text-[9px] text-muted font-medium uppercase tracking-wide">{prospect.position}</span>
            {prospect.age > 0 && (
              <span className="text-[9px] text-muted">· Age {prospect.age}</span>
            )}
          </div>
          <p className="text-[9px] text-muted/60 mt-0.5 truncate">{prospect.teamName}</p>
        </div>
      </div>

      {/* Stats */}
      {prospect.hitting && (
        <div className="grid grid-cols-4 gap-1 bg-surface-2/40 rounded-lg p-2">
          {[
            { l: "AVG", v: prospect.hitting.avg },
            { l: "OPS", v: prospect.hitting.ops },
            { l: "HR", v: String(prospect.hitting.hr) },
            { l: "SB", v: String(prospect.hitting.sb) },
          ].map(({ l, v }) => (
            <div key={l} className="text-center">
              <p className="text-xs font-black tabular-nums text-primary">{v}</p>
              <p className="text-[8px] uppercase tracking-widest text-muted font-semibold">{l}</p>
            </div>
          ))}
        </div>
      )}
      {prospect.pitching && (
        <div className="grid grid-cols-4 gap-1 bg-surface-2/40 rounded-lg p-2">
          {[
            { l: "ERA", v: prospect.pitching.era },
            { l: "WHIP", v: prospect.pitching.whip },
            { l: "K", v: String(prospect.pitching.k) },
            { l: "IP", v: String(prospect.pitching.ip) },
          ].map(({ l, v }) => (
            <div key={l} className="text-center">
              <p className="text-xs font-black tabular-nums text-primary">{v}</p>
              <p className="text-[8px] uppercase tracking-widest text-muted font-semibold">{l}</p>
            </div>
          ))}
        </div>
      )}
      {!prospect.hitting && !prospect.pitching && (
        <p className="text-[10px] text-muted italic text-center py-2">No stats yet this season</p>
      )}

      {/* Trident Take */}
      <div className="border-t border-border/30 pt-2 space-y-1">
        <p className="text-[9px] text-teal uppercase tracking-widest font-bold">Trident Take</p>
        <p className="text-[10px] text-secondary leading-snug">{take}</p>
      </div>

      {/* Level roast — hidden on small */}
      <p className="text-[9px] text-muted/50 italic leading-snug hidden sm:block">{roast}</p>
    </div>
  );
}

function ProspectSkeleton() {
  return (
    <div className="trident-card p-4 space-y-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-surface-2" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-surface-2 rounded w-3/4" />
          <div className="h-2.5 bg-surface-2 rounded w-1/2" />
        </div>
      </div>
      <div className="h-10 bg-surface-2 rounded-lg" />
      <div className="space-y-1">
        <div className="h-2 bg-surface-2 rounded w-1/4" />
        <div className="h-2.5 bg-surface-2 rounded w-full" />
      </div>
    </div>
  );
}

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "AAA" | "AA" | "hitters" | "pitchers">("all");

  useEffect(() => {
    fetchProspects()
      .then(setProspects)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return prospects.filter((p) => {
      if (filter === "AAA") return p.levelAbbr === "AAA";
      if (filter === "AA") return p.levelAbbr === "AA";
      if (filter === "hitters") return !p.isPitcher;
      if (filter === "pitchers") return p.isPitcher;
      return true;
    });
  }, [prospects, filter]);

  const aaaCnt = prospects.filter((p) => p.levelAbbr === "AAA").length;
  const aaCnt = prospects.filter((p) => p.levelAbbr === "AA").length;
  const hitterCnt = prospects.filter((p) => !p.isPitcher).length;
  const pitcherCnt = prospects.filter((p) => p.isPitcher).length;

  const filters: { key: typeof filter; label: string; count?: number }[] = [
    { key: "all", label: "All", count: prospects.length },
    { key: "AAA", label: "AAA", count: aaaCnt },
    { key: "AA", label: "AA", count: aaCnt },
    { key: "hitters", label: "Hitters", count: hitterCnt },
    { key: "pitchers", label: "Pitchers", count: pitcherCnt },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-2xl font-black text-primary tracking-tight">Farm System</h1>
          <span className="text-sm text-muted">{SEASON} Season</span>
        </div>
        <div className="trident-card p-4 border-teal/20 bg-gradient-to-r from-teal/5 to-transparent">
          <p className="text-sm text-secondary leading-relaxed">
            <span className="text-teal font-bold">Your next heartbreak is currently batting .280 in Tacoma.</span>
            {" "}These are the Mariners&apos; top minor leaguers — the kids the front office is either grooming for stardom or quietly hiding from playoff contenders.
            Scroll through. Pick your favorites. Get attached. They&apos;ll be traded in 18 months.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 flex-wrap">
        {filters.map(({ key, label, count }) => (
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
            {!loading && count !== undefined && (
              <span className={cn("text-[10px]", filter === key ? "text-white/70" : "text-muted")}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-6">
          <div>
            <div className="h-3 w-20 bg-surface-2 rounded mb-3 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => <ProspectSkeleton key={i} />)}
            </div>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="trident-card p-10 text-center text-muted">
          No prospects found. Either the API is being difficult or Jerry Dipoto traded them all.
        </div>
      ) : (
        <div className="space-y-8">
          {/* Group by level */}
          {(["AAA", "AA"] as const).map((lvl) => {
            const lvlProspects = filtered.filter((p) => p.levelAbbr === lvl);
            if (lvlProspects.length === 0) return null;
            const cfg = Object.values(LEVEL_CONFIG).find((c) => c.abbr === lvl)!;
            return (
              <div key={lvl}>
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="text-xs font-black px-2.5 py-1 rounded-full text-white"
                    style={{ background: cfg.color }}
                  >
                    {lvl}
                  </span>
                  <span className="text-xs text-muted">{cfg.label} · {cfg.roast}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {lvlProspects.map((p) => (
                    <ProspectCard key={p.personId} prospect={p} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Catch-all for any non-AAA/AA that sneak through */}
          {filtered.filter((p) => !["AAA", "AA"].includes(p.levelAbbr)).length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-black px-2.5 py-1 rounded-full text-white bg-purple-600">
                  Lower Minors
                </span>
                <span className="text-xs text-muted">The kids. Be patient with them.</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filtered
                  .filter((p) => !["AAA", "AA"].includes(p.levelAbbr))
                  .map((p) => <ProspectCard key={p.personId} prospect={p} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && prospects.length > 0 && (
        <p className="text-[11px] text-muted text-center pt-2">
          Showing AAA &amp; AA affiliates · Stats from MLB Stats API · Remember: minor league stats lie
        </p>
      )}
    </div>
  );
}
