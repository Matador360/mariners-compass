import { computeHotScore, computePitcherHotScore } from "./calc-stats";

export interface GameLogEntry {
  date: string;
  stat: Record<string, unknown>;
}

export interface PlayerWithGameLog {
  playerId: number;
  name: string;
  position: string;
  isPitcher: boolean;
  seasonOPS?: number;
  seasonERA?: number;
  log: GameLogEntry[];
}

export interface PlayerRankSnapshot {
  playerId: number;
  name: string;
  hotScore: number;
  primaryStat: number;
  position: string;
  isPitcher: boolean;
}

export interface RankSnapshotSet {
  date: string;
  players: PlayerRankSnapshot[];
}

export interface BumpSeriesPoint {
  date: string;
  rank: number | null;
  hotScore: number | null;
}

export interface BumpSeries {
  playerId: number;
  name: string;
  series: BumpSeriesPoint[];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function asDate(s: string): number {
  const t = new Date(s).getTime();
  return Number.isFinite(t) ? t : 0;
}

function formatDate(d: Date): string {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const dy = String(d.getDate()).padStart(2, "0");
  return `${yr}-${mo}-${dy}`;
}

function recentOPSFromLog(games: GameLogEntry[]): number | null {
  if (!games.length) return null;
  let ab = 0, h = 0, bb = 0, hbp = 0, sf = 0, tb = 0;
  for (const g of games) {
    ab += num(g.stat.atBats);
    h += num(g.stat.hits);
    bb += num(g.stat.baseOnBalls);
    hbp += num(g.stat.hitByPitch);
    sf += num(g.stat.sacFlies);
    tb += num(g.stat.totalBases);
  }
  const pa = ab + bb + hbp + sf;
  if (pa === 0 || ab === 0) return null;
  const obp = (h + bb + hbp) / pa;
  const slg = tb / ab;
  return obp + slg;
}

function recentERAFromLog(games: GameLogEntry[]): { era: number; innings: number } | null {
  if (!games.length) return null;
  let er = 0, ip = 0;
  for (const g of games) {
    er += num(g.stat.earnedRuns);
    ip += parseFloat(String(g.stat.inningsPitched ?? "0")) || 0;
  }
  if (ip === 0) return null;
  return { era: (er * 9) / ip, innings: ip };
}

export function computeSnapshotAt(
  asOf: Date,
  players: PlayerWithGameLog[],
  _teamRecentGameCount = 7,
): RankSnapshotSet {
  const cutoff = asOf.getTime();
  const snap: PlayerRankSnapshot[] = [];

  for (const p of players) {
    const eligible = p.log.filter((e) => asDate(e.date) <= cutoff);
    if (!eligible.length) continue;
    const window = p.isPitcher ? eligible.slice(0, 5) : eligible.slice(0, 7);
    if (!window.length) continue;

    let hotScore = 50;
    let primary = 0;

    if (p.isPitcher) {
      const recent = recentERAFromLog(window);
      if (!recent) continue;
      const seasonERA = p.seasonERA ?? recent.era;
      hotScore = computePitcherHotScore(recent.era, seasonERA, recent.innings);
      primary = recent.era;
    } else {
      const recentOPS = recentOPSFromLog(window);
      if (recentOPS == null) continue;
      const seasonOPS = p.seasonOPS ?? recentOPS;
      hotScore = computeHotScore(recentOPS, seasonOPS, window.length);
      primary = recentOPS;
    }

    snap.push({
      playerId: p.playerId,
      name: p.name,
      hotScore,
      primaryStat: primary,
      position: p.position,
      isPitcher: p.isPitcher,
    });
  }

  snap.sort((a, b) => b.hotScore - a.hotScore);
  return { date: formatDate(asOf), players: snap };
}

export function computeMultiSnapshot(
  players: PlayerWithGameLog[],
  offsets: number[] = [0, 7, 14, 28],
): RankSnapshotSet[] {
  const now = Date.now();
  return offsets.map((off) => {
    const asOf = new Date(now - off * MS_PER_DAY);
    return computeSnapshotAt(asOf, players);
  });
}

export function buildBumpSeries(snapshots: RankSnapshotSet[]): BumpSeries[] {
  const ordered = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const idToName = new Map<number, string>();
  for (const s of ordered) {
    for (const p of s.players) {
      if (!idToName.has(p.playerId)) idToName.set(p.playerId, p.name);
    }
  }

  const out: BumpSeries[] = [];
  for (const [id, name] of idToName) {
    const series: BumpSeriesPoint[] = ordered.map((s) => {
      const idx = s.players.findIndex((pp) => pp.playerId === id);
      if (idx < 0) return { date: s.date, rank: null, hotScore: null };
      return { date: s.date, rank: idx + 1, hotScore: s.players[idx].hotScore };
    });
    out.push({ playerId: id, name, series });
  }
  return out;
}
