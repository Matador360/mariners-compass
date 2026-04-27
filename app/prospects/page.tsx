"use client";

import { useEffect, useMemo, useState } from "react";
import { cn, playerHeadshotUrl } from "@/lib/utils";
import {
  PROSPECT_INTEL,
  PROSPECT_INTEL_SOURCE,
  intelByName,
  isPitcherPosition,
  etaToYear,
  type ProspectIntel,
} from "@/lib/prospects-intel";
import { computeHype } from "@/lib/hype";
import { computeGraduation, type PriorMLBService, type GraduationStatus } from "@/lib/graduation";
import { ProspectToolRadar } from "@/components/prospect-tool-radar";
import { AgeVsLevelScatter, type ScatterPoint } from "@/components/age-vs-level-scatter";
import { EtaTimeline, type ETAItem } from "@/components/eta-timeline";
import { HypeMeter } from "@/components/hype-meter";
import { GraduationCountdown } from "@/components/graduation-countdown";

const BASE = "https://statsapi.mlb.com/api/v1";
const TEAM_ID = 136;
const SEASON = new Date().getFullYear();

const LEVEL_CONFIG: Record<number, { label: string; abbr: string; color: string; roast: string; level: "Rookie" | "A" | "A+" | "AA" | "AAA" }> = {
  11: { label: "Triple-A",  abbr: "AAA", color: "#00A3A3", roast: "One good month from a September call-up and instant fan favorite status", level: "AAA" },
  12: { label: "Double-A",  abbr: "AA",  color: "#C9A800", roast: "The real proving ground. If they can't hit here, they can't hit anywhere", level: "AA" },
  13: { label: "High-A",    abbr: "A+",  color: "#22C55E", roast: "Crushing it against 22-year-olds, future is... probably fine?", level: "A+" },
  14: { label: "Single-A",  abbr: "A",   color: "#8B5CF6", roast: "Give this kid 4 years and a cup of coffee", level: "A" },
};

interface HittingStats { avg: string; ops: string; hr: number | string; rbi: number | string; sb: number | string; obp: string; slg: string; games: number | string; ab: number | string; }
interface PitchingStats { era: string; whip: string; k: number | string; ip: string; wins: number | string; losses: number | string; games: number | string; saves: number | string; }

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
  levelKey?: "Rookie" | "A" | "A+" | "AA" | "AAA";
  teamName: string;
  sportId: number;
  isPitcher: boolean;
  jerseyNumber?: string;
  intel?: ProspectIntel;
  hitting?: HittingStats;
  pitching?: PitchingStats;
  career?: PriorMLBService;
  synthetic?: boolean;
}

function genericTake(p: Prospect): string {
  if (p.isPitcher && p.pitching) {
    const era  = parseFloat(p.pitching.era  ?? "99");
    const whip = parseFloat(p.pitching.whip ?? "99");
    const k    = Number(p.pitching.k ?? 0);
    if (era < 2.5 && whip < 1.0) return "This dude is straight-up nasty. Lock him up before he knows how good he is.";
    if (era < 3.2) return "Legit starter stuff. Cross your fingers the front office doesn't screw this up.";
    if (era > 5.5) return "The ERA is... not great. But hey, we've rostered worse.";
    if (k > 50 && era < 4.5) return "Misses bats for fun. Just needs to stop putting runners on.";
    return "Solid minor league pitcher. Whether that translates is the million-dollar question.";
  }
  if (!p.isPitcher && p.hitting) {
    const ops = parseFloat(p.hitting.ops ?? "0");
    const avg = parseFloat(p.hitting.avg ?? "0");
    const hr  = Number(p.hitting.hr  ?? 0);
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
    11: [`${name} is one injury away from starting on Sunday. No pressure.`, `If ${name} keeps this up, he'll be getting booed in Seattle by August.`],
    12: [`Double-A: where prospects either prove themselves or quietly disappear.`, `${name} is passing the test. Now let's see if he passes the MLB test.`],
    13: [`High-A hitters see the same fastball, just 4 mph slower. Don't get too excited yet.`, `${name} has the tools. Whether he figures out the breaking ball is another story.`],
    14: [`Single-A. He's 20. Calm the hell down, it's fine.`, `Give ${name} three years and don't check these stats again until then.`],
  };
  const options = roasts[sportId] ?? [`${name} is grinding through the system.`];
  return options[Math.floor(Math.random() * options.length)];
}

async function fetchProspects(): Promise<Prospect[]> {
  const teamsRes  = await fetch(`${BASE}/teams?parentOrgPk=${TEAM_ID}&season=${SEASON}&sportIds=11,12,13,14`);
  const teamsData = await teamsRes.json();
  const affiliateTeams: Array<{ id: number; name: string; sport: { id: number; abbreviation: string } }> = teamsData.teams ?? [];
  const targetTeams = affiliateTeams.filter((t) => [11, 12, 13, 14].includes(t.sport?.id));

  const allProspects: Prospect[] = [];

  await Promise.allSettled(
    targetTeams.map(async (team) => {
      const cfg = LEVEL_CONFIG[team.sport.id] ?? { label: "MiLB", abbr: "MiLB", color: "#8BA4BA", roast: "", level: undefined };
      const rosterRes  = await fetch(`${BASE}/teams/${team.id}/roster?rosterType=active&season=${SEASON}&hydrate=person`);
      const rosterData = await rosterRes.json();
      const roster: Array<{
        person: { id: number; fullName: string; firstName: string; lastName: string; currentAge: number };
        position: { abbreviation: string; type: string };
        jerseyNumber?: string;
      }> = rosterData.roster ?? [];

      await Promise.allSettled(
        roster.slice(0, 35).map(async (player) => {
          const isPitcher = player.position.type === "Pitcher";
          const group = isPitcher ? "pitching" : "hitting";
          try {
            const intel = intelByName(player.person.fullName);
            const hasIntel = !!intel;

            const seasonReq = fetch(`${BASE}/people/${player.person.id}/stats?stats=season&group=${group}&season=${SEASON}`);
            const careerReq = hasIntel
              ? fetch(`${BASE}/people/${player.person.id}/stats?stats=career&group=${group}&sportId=1`)
              : Promise.resolve(null);
            const [statsRes, careerRes] = await Promise.all([seasonReq, careerReq]);
            const statsData = await statsRes.json();
            const stat = statsData.stats?.[0]?.splits?.[0]?.stat;

            let career: PriorMLBService | undefined;
            if (careerRes) {
              try {
                const careerData = await careerRes.json();
                const cstat = careerData.stats?.[0]?.splits?.[0]?.stat;
                if (cstat) {
                  const ab = Number(cstat.atBats ?? 0);
                  const ipStr = cstat.inningsPitched ?? "0.0";
                  const ip = parseFloat(String(ipStr).replace(/(\d+)\.([12])/, (_m, w, p) => `${w}.${(parseInt(p, 10) / 3).toFixed(2).slice(2)}`));
                  const games = Number(cstat.gamesPlayed ?? 0);
                  if (ab > 0 || ip > 0 || games > 0) {
                    career = { ab, ip: isNaN(ip) ? 0 : ip, activeRosterDays: 0 };
                  }
                }
              } catch { /* ignore */ }
            }

            const prospect: Prospect = {
              personId:   player.person.id,
              name:       player.person.fullName,
              firstName:  player.person.firstName ?? player.person.fullName.split(" ")[0],
              lastName:   player.person.lastName  ?? player.person.fullName.split(" ").slice(1).join(" "),
              position:   player.position.abbreviation,
              age:        player.person.currentAge ?? 0,
              level:      cfg.label,
              levelAbbr:  cfg.abbr,
              levelColor: cfg.color,
              levelKey:   cfg.level,
              teamName:   team.name,
              sportId:    team.sport.id,
              isPitcher,
              jerseyNumber: player.jerseyNumber,
              intel,
              career,
              hitting: !isPitcher && stat ? {
                avg: stat.avg ?? ".---", ops: stat.ops ?? ".---", obp: stat.obp ?? ".---",
                slg: stat.slg ?? ".---", hr: stat.homeRuns ?? 0, rbi: stat.rbi ?? 0,
                sb: stat.stolenBases ?? 0, games: stat.gamesPlayed ?? 0, ab: stat.atBats ?? 0,
              } : undefined,
              pitching: isPitcher && stat ? {
                era: stat.era ?? "-.--", whip: stat.whip ?? "-.--", k: stat.strikeOuts ?? 0,
                ip: stat.inningsPitched ?? "0.0", wins: stat.wins ?? 0, losses: stat.losses ?? 0,
                games: stat.gamesPitched ?? 0, saves: stat.saves ?? 0,
              } : undefined,
            };
            allProspects.push(prospect);
          } catch { /* skip */ }
        })
      );
    })
  );

  return allProspects;
}

function syntheticFromIntel(intel: ProspectIntel): Prospect {
  const isPitcher = isPitcherPosition(intel.position);
  const age = intel.birthYear ? SEASON - intel.birthYear : 0;
  return {
    personId: intel.mlbId ?? 0,
    name: intel.name,
    firstName: intel.name.split(" ")[0],
    lastName: intel.name.split(" ").slice(1).join(" "),
    position: intel.position,
    age,
    level: "MiLB",
    levelAbbr: "MiLB",
    levelColor: "#8BA4BA",
    teamName: "—",
    sportId: 0,
    isPitcher,
    intel,
    synthetic: true,
  };
}

function ProspectCard({ prospect, currentSeason }: { prospect: Prospect; currentSeason: number }) {
  const [expanded, setExpanded] = useState(false);

  const intel = prospect.intel;
  const take  = intel?.tridentTake ?? genericTake(prospect);
  const roast = levelRoast(prospect.sportId, prospect.firstName);

  const hype = useMemo(() => {
    if (!intel) return null;
    const stats = !prospect.isPitcher && prospect.hitting
      ? { hitting: { avg: parseFloat(prospect.hitting.avg) || undefined, ops: parseFloat(prospect.hitting.ops) || undefined, ab: Number(prospect.hitting.ab) || undefined } }
      : prospect.isPitcher && prospect.pitching
      ? { pitching: { era: parseFloat(prospect.pitching.era) || undefined, whip: parseFloat(prospect.pitching.whip) || undefined, ip: parseFloat(prospect.pitching.ip) || undefined } }
      : undefined;
    return computeHype(intel, stats, prospect.age || undefined, prospect.levelKey);
  }, [intel, prospect]);

  const grad: GraduationStatus | null = prospect.career
    ? computeGraduation(prospect.career, prospect.isPitcher)
    : null;

  void currentSeason;

  return (
    <div className="trident-card p-4 space-y-3 hover:border-border-accent transition-all hover:-translate-y-0.5">
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-full overflow-hidden bg-surface-2 border-2 shrink-0 flex items-center justify-center"
          style={{ borderColor: prospect.levelColor }}
        >
          {prospect.personId > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={playerHeadshotUrl(prospect.personId)}
              alt={prospect.name}
              width={48} height={48}
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                const t = e.target as HTMLImageElement;
                t.style.display = "none";
                const p = t.parentElement;
                if (p) p.innerHTML = `<span class="text-lg font-black text-muted">${prospect.firstName[0]}${prospect.lastName?.[0] ?? ""}</span>`;
              }}
            />
          ) : (
            <span className="text-lg font-black text-muted">{prospect.firstName[0]}{prospect.lastName?.[0] ?? ""}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-black text-primary leading-tight">{prospect.name}</p>
            {intel?.rank !== undefined && (
              <span
                className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white shrink-0"
                style={{ background: prospect.levelColor }}
              >
                #{intel.rank}
              </span>
            )}
            {hype && (
              <HypeMeter compact score={hype.score} band={hype.band} />
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide text-white" style={{ background: prospect.levelColor }}>
              {prospect.levelAbbr}
            </span>
            <span className="text-[9px] text-muted font-medium uppercase tracking-wide">{prospect.position}</span>
            {prospect.age > 0 && <span className="text-[9px] text-muted">· Age {prospect.age}</span>}
            {grad && <GraduationCountdown status={grad} />}
          </div>
          <p className="text-[9px] text-muted/60 mt-0.5 truncate">{prospect.teamName}</p>
        </div>
      </div>

      {intel && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-surface-2/60 rounded-lg px-2 py-1">
            <span className="text-[8px] text-muted uppercase tracking-widest font-semibold">Ceiling</span>
            <span className="text-[10px] font-bold text-primary">{intel.ceiling}</span>
          </div>
          <div className="flex items-center gap-1 bg-surface-2/60 rounded-lg px-2 py-1">
            <span className="text-[8px] text-muted uppercase tracking-widest font-semibold">ETA</span>
            <span className="text-[10px] font-bold text-teal">{intel.eta}</span>
          </div>
        </div>
      )}

      {prospect.hitting && (
        <div className="grid grid-cols-4 gap-1 bg-surface-2/40 rounded-lg p-2">
          {[
            { l: "AVG", v: prospect.hitting.avg },
            { l: "OPS", v: prospect.hitting.ops },
            { l: "HR",  v: String(prospect.hitting.hr) },
            { l: "SB",  v: String(prospect.hitting.sb) },
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
            { l: "ERA",  v: prospect.pitching.era  },
            { l: "WHIP", v: prospect.pitching.whip },
            { l: "K",    v: String(prospect.pitching.k) },
            { l: "IP",   v: String(prospect.pitching.ip) },
          ].map(({ l, v }) => (
            <div key={l} className="text-center">
              <p className="text-xs font-black tabular-nums text-primary">{v}</p>
              <p className="text-[8px] uppercase tracking-widest text-muted font-semibold">{l}</p>
            </div>
          ))}
        </div>
      )}
      {!prospect.hitting && !prospect.pitching && (
        <p className="text-[10px] text-muted italic text-center py-2">
          {prospect.synthetic ? "Lower-minors prospect — stats hidden until promotion" : "No stats yet this season"}
        </p>
      )}

      {intel && (
        <div className="border-t border-border/30 pt-2 space-y-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[9px] font-bold uppercase tracking-widest text-teal hover:text-teal/80 flex items-center gap-1"
            aria-expanded={expanded}
          >
            <span>{expanded ? "▾" : "▸"}</span> Tools
            <span className="text-muted/60 font-normal normal-case tracking-normal">
              · {prospect.isPitcher ? "FB / breaking / change / control / command" : "hit / pwr / spd / arm / glove"}
            </span>
          </button>
          {expanded && (
            <div className="flex justify-center pt-1">
              <ProspectToolRadar tools={intel.tools} isPitcher={prospect.isPitcher} size={200} />
            </div>
          )}
          {hype && expanded && (
            <p className="text-[9px] text-muted/70 text-center italic">Hype driver: {hype.reason}</p>
          )}
        </div>
      )}

      {intel?.scoutNote && (
        <div className="border-t border-border/30 pt-2">
          <p className="text-[9px] text-teal/80 uppercase tracking-widest font-bold mb-1">Scouting Report</p>
          <p className="text-[10px] text-secondary leading-snug">{intel.scoutNote}</p>
        </div>
      )}

      <div className={cn("pt-2 space-y-1", intel?.scoutNote ? "" : "border-t border-border/30")}>
        <p className="text-[9px] text-teal uppercase tracking-widest font-bold">Trident Take</p>
        <p className="text-[10px] text-secondary leading-snug">{take}</p>
      </div>

      {prospect.sportId > 0 && (
        <p className="text-[9px] text-muted/50 italic leading-snug hidden sm:block">{roast}</p>
      )}
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
        <div className="h-2.5 bg-surface-2 rounded w-4/5" />
      </div>
    </div>
  );
}

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "AAA" | "AA" | "hitters" | "pitchers">("all");

  useEffect(() => {
    fetchProspects().then(setProspects).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Build the canonical top-30 list — intel-first, enriched with roster data when matched.
  const ranked: Prospect[] = useMemo(() => {
    return PROSPECT_INTEL.map((intel) => {
      const matched = prospects.find((p) => p.name === intel.name);
      if (matched) return matched;
      return syntheticFromIntel(intel);
    }).sort((a, b) => (a.intel?.rank ?? 999) - (b.intel?.rank ?? 999));
  }, [prospects]);

  const otherProspects = useMemo(() => {
    return prospects.filter((p) => !p.intel);
  }, [prospects]);

  const filtered = useMemo(() => {
    const all = [...ranked, ...otherProspects];
    return all.filter((p) => {
      if (filter === "AAA")     return p.levelAbbr === "AAA";
      if (filter === "AA")      return p.levelAbbr === "AA";
      if (filter === "hitters") return !p.isPitcher;
      if (filter === "pitchers") return p.isPitcher;
      return true;
    });
  }, [ranked, otherProspects, filter]);

  const aaaCnt    = filtered.filter((p) => p.levelAbbr === "AAA").length;
  const aaCnt     = filtered.filter((p) => p.levelAbbr === "AA").length;
  const hitterCnt = filtered.filter((p) => !p.isPitcher).length;
  const pitcherCnt = filtered.filter((p) => p.isPitcher).length;
  const totalCnt = filtered.length;

  const counts = useMemo(() => {
    const all = [...ranked, ...otherProspects];
    return {
      total: all.length,
      AAA: all.filter((p) => p.levelAbbr === "AAA").length,
      AA: all.filter((p) => p.levelAbbr === "AA").length,
      hitters: all.filter((p) => !p.isPitcher).length,
      pitchers: all.filter((p) => p.isPitcher).length,
    };
  }, [ranked, otherProspects]);
  void aaaCnt; void aaCnt; void hitterCnt; void pitcherCnt; void totalCnt;

  const filters: { key: typeof filter; label: string; count?: number }[] = [
    { key: "all",      label: "All",      count: counts.total },
    { key: "AAA",      label: "AAA",      count: counts.AAA },
    { key: "AA",       label: "AA",       count: counts.AA },
    { key: "hitters",  label: "Hitters",  count: counts.hitters },
    { key: "pitchers", label: "Pitchers", count: counts.pitchers },
  ];

  const topProspects = useMemo(() => filtered.filter((p) => p.intel?.rank !== undefined), [filtered]);
  const otherFiltered = useMemo(() => filtered.filter((p) => !p.intel), [filtered]);

  // System overview metrics
  const overview = useMemo(() => {
    const top10InHigherMinors = ranked.filter((p) => {
      if (!p.intel || p.intel.rank > 10) return false;
      return p.levelAbbr === "AAA" || p.levelAbbr === "AA" || /already/i.test(p.intel.eta);
    }).length;

    const etaYears = ranked
      .filter((p) => p.intel)
      .map((p) => etaToYear(p.intel!.eta, SEASON))
      .sort((a, b) => a - b);
    const medianEta = etaYears.length ? etaYears[Math.floor(etaYears.length / 2)] : SEASON;

    let topHype: { prospect: Prospect; score: number; band: ReturnType<typeof computeHype>["band"] } | null = null;
    for (const p of ranked) {
      if (!p.intel) continue;
      const stats = !p.isPitcher && p.hitting
        ? { hitting: { avg: parseFloat(p.hitting.avg) || undefined, ops: parseFloat(p.hitting.ops) || undefined, ab: Number(p.hitting.ab) || undefined } }
        : p.isPitcher && p.pitching
        ? { pitching: { era: parseFloat(p.pitching.era) || undefined, whip: parseFloat(p.pitching.whip) || undefined, ip: parseFloat(p.pitching.ip) || undefined } }
        : undefined;
      const h = computeHype(p.intel, stats, p.age || undefined, p.levelKey);
      if (!topHype || h.score > topHype.score) topHype = { prospect: p, score: h.score, band: h.band };
    }

    return { top10InHigherMinors, medianEta, topHype };
  }, [ranked]);

  const scatterPoints: ScatterPoint[] = useMemo(() => {
    return ranked
      .filter((p) => p.levelKey && p.age > 0)
      .map((p) => ({
        name: p.name,
        rank: p.intel?.rank,
        age: p.age,
        level: p.levelKey!,
        ops: p.hitting ? parseFloat(p.hitting.ops) || undefined : undefined,
        era: p.pitching ? parseFloat(p.pitching.era) || undefined : undefined,
        position: p.position,
        isPitcher: p.isPitcher,
      }));
  }, [ranked]);

  const etaItems: ETAItem[] = useMemo(() => {
    return ranked
      .filter((p) => p.intel)
      .map((p) => ({
        name: p.name,
        rank: p.intel!.rank,
        position: p.position,
        etaYear: etaToYear(p.intel!.eta, SEASON),
        isPitcher: p.isPitcher,
      }));
  }, [ranked]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-2xl font-black text-primary tracking-tight">Farm System</h1>
          <span className="text-sm text-muted">{SEASON} Season · Top {PROSPECT_INTEL.length}</span>
        </div>
        <div className="trident-card p-4 border-teal/20 bg-gradient-to-r from-teal/5 to-transparent">
          <p className="text-sm text-secondary leading-relaxed">
            <span className="text-teal font-bold">Your next heartbreak is currently batting .280 in Tacoma.</span>
            {" "}These are the Mariners&apos; top minor leaguers — the kids the front office is either grooming for stardom or quietly hiding from playoff contenders.
            Scroll through. Pick your favorites. Get attached. They&apos;ll be traded in 18 months.
          </p>
        </div>
      </div>

      {/* System overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="trident-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Top-10 talent in upper minors</p>
          <p className="text-2xl font-black text-primary tabular-nums">{overview.top10InHigherMinors}<span className="text-base text-muted">/10</span></p>
          <p className="text-[10px] text-muted mt-1">Already at AA, AAA, or MLB</p>
        </div>
        <div className="trident-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Average ETA</p>
          <p className="text-2xl font-black text-teal tabular-nums">{overview.medianEta}</p>
          <p className="text-[10px] text-muted mt-1">Median expected MLB debut</p>
        </div>
        <div className="trident-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Highest hype</p>
          {overview.topHype ? (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-surface-2 border border-teal/40 shrink-0 flex items-center justify-center">
                {overview.topHype.prospect.personId > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={playerHeadshotUrl(overview.topHype.prospect.personId)} alt={overview.topHype.prospect.name} className="w-full h-full object-cover object-top" />
                ) : (
                  <span className="text-xs font-black text-muted">{overview.topHype.prospect.firstName[0]}{overview.topHype.prospect.lastName?.[0] ?? ""}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-primary truncate">{overview.topHype.prospect.name}</p>
                <HypeMeter compact score={overview.topHype.score} band={overview.topHype.band} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">—</p>
          )}
        </div>
      </div>

      {/* Age vs Level scatter */}
      {scatterPoints.length > 0 && (
        <div className="trident-card p-4 space-y-2">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <h2 className="text-sm font-black text-primary uppercase tracking-wider">Age vs Level</h2>
            <p className="text-[10px] text-muted">Left of the dashed line = ahead of the curve. Bigger dots = better current performance.</p>
          </div>
          <AgeVsLevelScatter points={scatterPoints} />
        </div>
      )}

      {/* ETA timeline */}
      {etaItems.length > 0 && (
        <div className="trident-card p-4 space-y-2">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <h2 className="text-sm font-black text-primary uppercase tracking-wider">ETA Timeline</h2>
            <p className="text-[10px] text-muted">When the front office expects each prospect to actually show up.</p>
          </div>
          <EtaTimeline items={etaItems} thisYear={SEASON} />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-1.5 flex-wrap">
        {filters.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border font-medium transition-colors flex items-center gap-1",
              filter === key ? "bg-teal text-white border-teal" : "border-border text-muted hover:text-primary hover:border-border-accent"
            )}
          >
            {label}
            {!loading && count !== undefined && (
              <span className={cn("text-[10px]", filter === key ? "text-white/70" : "text-muted")}>{count}</span>
            )}
          </button>
        ))}
      </div>

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
          {topProspects.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-black px-2.5 py-1 rounded-full text-white bg-gradient-to-r from-teal to-amber-500">
                  ⭐ Top Prospects
                </span>
                <span className="text-xs text-muted">Ranked by Trident Intelligence Bureau™</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {topProspects.map((p) => <ProspectCard key={`${p.name}-${p.personId}`} prospect={p} currentSeason={SEASON} />)}
              </div>
            </div>
          )}

          {otherFiltered.length > 0 && (
            <>
              {(["AAA", "AA"] as const).map((lvl) => {
                const lvlProspects = otherFiltered.filter((p) => p.levelAbbr === lvl);
                if (lvlProspects.length === 0) return null;
                const cfg = Object.values(LEVEL_CONFIG).find((c) => c.abbr === lvl)!;
                return (
                  <div key={lvl}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-black px-2.5 py-1 rounded-full text-white" style={{ background: cfg.color }}>{lvl}</span>
                      <span className="text-xs text-muted">{cfg.label} · {cfg.roast}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {lvlProspects.map((p) => <ProspectCard key={`${p.name}-${p.personId}`} prospect={p} currentSeason={SEASON} />)}
                    </div>
                  </div>
                );
              })}

              {otherFiltered.filter((p) => !["AAA", "AA"].includes(p.levelAbbr)).length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-black px-2.5 py-1 rounded-full text-white bg-purple-600">Lower Minors</span>
                    <span className="text-xs text-muted">The kids. Be patient with them.</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {otherFiltered.filter((p) => !["AAA", "AA"].includes(p.levelAbbr)).map((p) => <ProspectCard key={`${p.name}-${p.personId}`} prospect={p} currentSeason={SEASON} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!loading && (ranked.length > 0 || prospects.length > 0) && (
        <div className="trident-card p-4 space-y-1.5 mt-4">
          <p className="text-[10px] uppercase tracking-widest text-teal font-bold">Methodology</p>
          <p className="text-[11px] text-secondary leading-relaxed">
            Tool grades sourced from {PROSPECT_INTEL_SOURCE} (20–80 scouting scale). Hype score is computed locally from rank,
            tools, age-vs-level fit, current performance, and health. Graduation rules: 130 AB / 50 IP / 45 active-roster days
            (September call-ups excluded). Stats from MLB Stats API. Minor league stats lie. Frequently.
          </p>
        </div>
      )}
    </div>
  );
}
