// ─── Types ───────────────────────────────────────────────────────────────────

export interface TeamSide {
  id: number;
  name: string;
  abbrev: string;
  record?: { wins: number; losses: number };
}

export interface PersonRef {
  id: number;
  fullName: string;
}

export interface ParsedPitch {
  index: number;
  pitchNumber?: number;
  type?: { code: string; description: string };
  speed?: number;
  spinRate?: number;
  break?: { angle?: number; length?: number; spinDirection?: number };
  coordinates?: { pX?: number; pZ?: number };
  zone?: number;
  result?: string;
  description?: string;
  callDescription?: string;
  hit?: {
    launchSpeed?: number;
    launchAngle?: number;
    totalDistance?: number;
    trajectory?: string;
    coordinates?: { x?: number; y?: number };
  };
  isStrike?: boolean;
  isBall?: boolean;
  isInPlay?: boolean;
}

export interface PlaySummary {
  description: string;
  halfInning: string;
  inning: number;
  awayScore: number;
  homeScore: number;
  rbi?: number;
}

export interface ParsedPlay extends PlaySummary {
  index: number;
  event?: string;
  eventType?: string;
  batter: PersonRef;
  pitcher: PersonRef;
  batSide?: string;
  pitchHand?: string;
  captivatingIndex?: number;
  leverageIndex?: number;
  wpa?: number;
  pitches: ParsedPitch[];
  isScoringPlay: boolean;
  isComplete: boolean;
}

export interface LinescoreInning {
  num: number;
  ordinal: string;
  home: { runs?: number; hits?: number; errors?: number };
  away: { runs?: number; hits?: number; errors?: number };
}

export interface Linescore {
  innings: LinescoreInning[];
  totals: {
    home: { runs: number; hits: number; errors: number };
    away: { runs: number; hits: number; errors: number };
  };
}

export interface WpaPoint {
  playIndex: number;
  halfInning: string;
  inning: number;
  homeWinProb: number;
  awayWinProb: number;
  wpa: number;
}

export interface LeveragePoint {
  playIndex: number;
  halfInning: string;
  inning: number;
  leverageIndex: number;
  description: string;
}

export interface ParsedLiveGame {
  gamePk: number;
  state: 'Preview' | 'Live' | 'Final' | 'Postponed' | 'Other';
  detailedState: string;
  score: { home: number; away: number };
  teams: { home: TeamSide; away: TeamSide };
  inning?: number;
  bases?: { first: boolean; second: boolean; third: boolean };
  count?: { balls: number; strikes: number; outs: number };
  currentBatter?: PersonRef;
  currentPitcher?: PersonRef;
  lastPlay?: PlaySummary;
  weather?: { condition: string; temp: string; wind: string };
  attendance?: number;
  umpires: Array<{ id: number; fullName: string; officialType: string }>;
  decisions?: { winner?: PersonRef; loser?: PersonRef; save?: PersonRef };
  venue?: { id: number; name: string };
  probablePitchers?: { home?: PersonRef; away?: PersonRef };
  linescore: Linescore;
  allPlays: ParsedPlay[];
  scoringPlayIndices: number[];
  wpaTimeline: WpaPoint[];
  leverageTimeline: LeveragePoint[];
}

// ─── 24-State Leverage Table ──────────────────────────────────────────────────
// Index: baseBitmask (bit0=1B, bit1=2B, bit2=3B) * 3 + outs
// Rows: empty, 1B, 2B, 1B+2B, 3B, 1B+3B, 2B+3B, loaded
const BASE_LEVERAGE_TABLE: number[] = [
  0.9, 0.9, 0.8,  // 0b000 empty
  0.9, 1.1, 1.2,  // 0b001 1B
  1.2, 1.3, 1.4,  // 0b010 2B
  1.4, 1.6, 1.8,  // 0b011 1B+2B
  1.2, 1.2, 1.1,  // 0b100 3B
  1.5, 1.7, 1.9,  // 0b101 1B+3B
  1.9, 2.0, 1.9,  // 0b110 2B+3B
  2.2, 2.4, 2.2,  // 0b111 loaded
];

function inningMul(inning: number): number {
  if (inning <= 3) return 0.5;
  if (inning <= 6) return 1.0;
  if (inning <= 8) return 1.5;
  return 2.0;
}

function leverageFromTable(
  basesBitmask: number,
  outs: number,
  inning: number,
  scoreDiff: number,
): number {
  const base = BASE_LEVERAGE_TABLE[(basesBitmask & 7) * 3 + Math.min(2, Math.max(0, outs))] ?? 1.0;
  return base * inningMul(inning) * (Math.abs(scoreDiff) <= 1 ? 1.5 : 1.0);
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

type RawObj = Record<string, unknown>;

function ro(v: unknown): RawObj {
  return (v != null && typeof v === 'object' && !Array.isArray(v)) ? (v as RawObj) : {};
}

function parsePersonRef(p: unknown): PersonRef | undefined {
  const pr = ro(p);
  if (!pr.id) return undefined;
  return { id: Number(pr.id), fullName: String(pr.fullName ?? '') };
}

function parseTeamSide(t: unknown): TeamSide {
  const tr = ro(t);
  const rec = ro(tr.record);
  return {
    id: Number(tr.id ?? 0),
    name: String(tr.name ?? ''),
    abbrev: String(tr.abbreviation ?? ''),
    record: rec.wins != null ? { wins: Number(rec.wins), losses: Number(rec.losses ?? 0) } : undefined,
  };
}

function parsePitchEvent(e: RawObj, idx: number): ParsedPitch {
  const det = ro(e.details);
  const pd = ro(e.pitchData);
  const coords = ro(pd.coordinates);
  const brk = ro(pd.breaks);
  const callObj = ro(det.call);
  const typeObj = ro(det.type);
  const hitD = e.hitData != null ? ro(e.hitData) : null;
  const hitC = hitD ? ro(hitD.coordinates) : null;

  return {
    index: idx,
    pitchNumber: e.pitchNumber != null ? Number(e.pitchNumber) : undefined,
    type: typeObj.code ? { code: String(typeObj.code), description: String(typeObj.description ?? '') } : undefined,
    speed: pd.startSpeed != null ? Number(pd.startSpeed) : undefined,
    spinRate: brk.spinRate != null ? Number(brk.spinRate) : undefined,
    break: brk.breakAngle != null ? {
      angle: Number(brk.breakAngle),
      length: brk.breakLength != null ? Number(brk.breakLength) : undefined,
      spinDirection: brk.spinDirection != null ? Number(brk.spinDirection) : undefined,
    } : undefined,
    coordinates: coords.pX != null ? { pX: Number(coords.pX), pZ: coords.pZ != null ? Number(coords.pZ) : undefined } : undefined,
    zone: pd.zone != null ? Number(pd.zone) : undefined,
    result: det.code ? String(det.code) : undefined,
    description: det.description ? String(det.description) : undefined,
    callDescription: callObj.description ? String(callObj.description) : undefined,
    hit: hitD ? {
      launchSpeed: hitD.launchSpeed != null ? Number(hitD.launchSpeed) : undefined,
      launchAngle: hitD.launchAngle != null ? Number(hitD.launchAngle) : undefined,
      totalDistance: hitD.totalDistance != null ? Number(hitD.totalDistance) : undefined,
      trajectory: hitD.trajectory ? String(hitD.trajectory) : undefined,
      coordinates: hitC?.coordX != null ? { x: Number(hitC.coordX), y: hitC.coordY != null ? Number(hitC.coordY) : undefined } : undefined,
    } : undefined,
    isStrike: det.isStrike != null ? Boolean(det.isStrike) : undefined,
    isBall: det.isBall != null ? Boolean(det.isBall) : undefined,
    isInPlay: det.isInPlay != null ? Boolean(det.isInPlay) : undefined,
  };
}

// ─── parseLiveGame ────────────────────────────────────────────────────────────

export function parseLiveGame(raw: unknown, gamePk: number): ParsedLiveGame {
  const r = ro(raw);
  const gd = ro(r.gameData);
  const ld = ro(r.liveData);

  // State
  const statusRaw = ro(gd.status);
  const abstractState = String(statusRaw.abstractGameState ?? '');
  const detailedState = String(statusRaw.detailedState ?? '');
  let state: ParsedLiveGame['state'];
  if (abstractState === 'Final') state = 'Final';
  else if (abstractState === 'Live') state = 'Live';
  else if (abstractState === 'Preview') state = 'Preview';
  else if (detailedState.toLowerCase().includes('postponed')) state = 'Postponed';
  else state = 'Other';

  // Teams
  const teamsRaw = ro(gd.teams);

  // Weather
  const weatherRaw = gd.weather != null ? ro(gd.weather) : null;
  const weather = weatherRaw ? {
    condition: String(weatherRaw.condition ?? ''),
    temp: String(weatherRaw.temp ?? ''),
    wind: String(weatherRaw.wind ?? ''),
  } : undefined;

  // Attendance
  const gameInfo = ro(gd.gameInfo);
  const attendance = gameInfo.attendance != null ? Number(gameInfo.attendance) : undefined;

  // Venue
  const venueRaw = gd.venue != null ? ro(gd.venue) : null;
  const venue = venueRaw?.id != null ? { id: Number(venueRaw.id), name: String(venueRaw.name ?? '') } : undefined;

  // Probable pitchers
  const ppRaw = gd.probablePitchers != null ? ro(gd.probablePitchers) : null;
  const probablePitchers = ppRaw ? {
    home: parsePersonRef(ppRaw.home),
    away: parsePersonRef(ppRaw.away),
  } : undefined;

  // Umpires
  const bs = ro(ld.boxscore);
  const officialsRaw = Array.isArray(bs.officials) ? bs.officials as unknown[] : [];
  const umpires = officialsRaw.map(o => {
    const ou = ro(o);
    const off = ro(ou.official);
    return { id: Number(off.id ?? 0), fullName: String(off.fullName ?? ''), officialType: String(ou.officialType ?? '') };
  });

  // Decisions
  const decisionsRaw = ld.decisions != null ? ro(ld.decisions) : null;
  const decisions = decisionsRaw ? {
    winner: parsePersonRef(decisionsRaw.winner),
    loser: parsePersonRef(decisionsRaw.loser),
    save: parsePersonRef(decisionsRaw.save),
  } : undefined;

  // Linescore
  const lsRaw = ro(ld.linescore);
  const lsTeams = ro(lsRaw.teams);
  const lsHome = ro(lsTeams.home);
  const lsAway = ro(lsTeams.away);
  const lsInningsRaw = Array.isArray(lsRaw.innings) ? lsRaw.innings as unknown[] : [];

  const linescore: Linescore = {
    innings: lsInningsRaw.map(inn => {
      const i = ro(inn);
      const parseSide = (side: unknown) => {
        const s = ro(side);
        return {
          runs: s.runs != null ? Number(s.runs) : undefined,
          hits: s.hits != null ? Number(s.hits) : undefined,
          errors: s.errors != null ? Number(s.errors) : undefined,
        };
      };
      return { num: Number(i.num ?? 0), ordinal: String(i.ordinalNum ?? ''), home: parseSide(i.home), away: parseSide(i.away) };
    }),
    totals: {
      home: { runs: Number(lsHome.runs ?? 0), hits: Number(lsHome.hits ?? 0), errors: Number(lsHome.errors ?? 0) },
      away: { runs: Number(lsAway.runs ?? 0), hits: Number(lsAway.hits ?? 0), errors: Number(lsAway.errors ?? 0) },
    },
  };

  const score = { home: linescore.totals.home.runs, away: linescore.totals.away.runs };

  // Live state from linescore
  const offense = ro(lsRaw.offense);
  const inning = lsRaw.currentInning != null ? Number(lsRaw.currentInning) : undefined;
  const bases = inning != null ? {
    first: offense.first != null,
    second: offense.second != null,
    third: offense.third != null,
  } : undefined;
  const count = lsRaw.balls != null ? {
    balls: Number(lsRaw.balls),
    strikes: Number(lsRaw.strikes ?? 0),
    outs: Number(lsRaw.outs ?? 0),
  } : undefined;
  const currentBatter = parsePersonRef(offense.batter);
  const currentPitcher = parsePersonRef(offense.pitcher);

  // Plays
  const playsRaw = ro(ld.plays);
  const allPlaysRaw = Array.isArray(playsRaw.allPlays) ? playsRaw.allPlays as unknown[] : [];
  const scoringPlayIndices = Array.isArray(playsRaw.scoringPlays)
    ? (playsRaw.scoringPlays as unknown[]).map(Number)
    : [];

  const allPlays: ParsedPlay[] = [];
  const wpaTimeline: WpaPoint[] = [];
  let prevHomeWP: number | null = null;

  // Base/out state tracking for 24-state leverage fallback
  let currentBases = 0;
  let currentOuts = 0;
  let lastHalfKey = '';

  for (const playRaw of allPlaysRaw) {
    const p = ro(playRaw);
    const about = ro(p.about);
    const result = ro(p.result);
    const matchup = ro(p.matchup);
    const batSideRaw = ro(matchup.batSide);
    const pitchHandRaw = ro(matchup.pitchHand);
    const matchupBatter = ro(matchup.batter);
    const matchupPitcher = ro(matchup.pitcher);

    const playInning = Number(about.inning ?? 1);
    const halfInning = String(about.halfInning ?? '');
    const halfKey = `${halfInning}-${playInning}`;

    if (halfKey !== lastHalfKey) {
      currentBases = 0;
      currentOuts = 0;
      lastHalfKey = halfKey;
    }

    const basesAtStart = currentBases;
    const outsAtStart = currentOuts;

    const playEvents = Array.isArray(p.playEvents) ? p.playEvents as unknown[] : [];
    const pitches = playEvents
      .filter(e => ro(e).isPitch === true)
      .map((e, i) => parsePitchEvent(ro(e), i));

    const captivatingIndex = about.captivatingIndex != null ? Number(about.captivatingIndex) : undefined;

    // WPA
    const homeWP = about.homeTeamWinProbability != null ? Number(about.homeTeamWinProbability) : null;
    const awayWP = about.awayTeamWinProbability != null ? Number(about.awayTeamWinProbability) : null;
    let wpa: number | undefined;
    if (homeWP != null) {
      wpa = prevHomeWP != null ? homeWP - prevHomeWP : 0;
      wpaTimeline.push({
        playIndex: Number(about.atBatIndex ?? 0),
        halfInning,
        inning: playInning,
        homeWinProb: homeWP,
        awayWinProb: awayWP ?? (1 - homeWP),
        wpa,
      });
      prevHomeWP = homeWP;
    } else {
      prevHomeWP = null;
    }

    // Leverage: leverageIndex → captivatingIndex/10 → 24-state table
    const scoreDiff = Number(result.homeScore ?? 0) - Number(result.awayScore ?? 0);
    let leverageIndex: number;
    if (about.leverageIndex != null) {
      leverageIndex = Number(about.leverageIndex);
    } else if (captivatingIndex != null) {
      leverageIndex = captivatingIndex / 10;
    } else {
      leverageIndex = leverageFromTable(basesAtStart, outsAtStart, playInning, scoreDiff);
    }

    allPlays.push({
      index: Number(about.atBatIndex ?? 0),
      description: String(result.description ?? ''),
      halfInning,
      inning: playInning,
      awayScore: Number(result.awayScore ?? 0),
      homeScore: Number(result.homeScore ?? 0),
      rbi: result.rbi != null ? Number(result.rbi) : undefined,
      event: result.event ? String(result.event) : undefined,
      eventType: result.eventType ? String(result.eventType) : undefined,
      batter: { id: Number(matchupBatter.id ?? 0), fullName: String(matchupBatter.fullName ?? '') },
      pitcher: { id: Number(matchupPitcher.id ?? 0), fullName: String(matchupPitcher.fullName ?? '') },
      batSide: batSideRaw.code ? String(batSideRaw.code) : undefined,
      pitchHand: pitchHandRaw.code ? String(pitchHandRaw.code) : undefined,
      captivatingIndex,
      leverageIndex,
      wpa,
      pitches,
      isScoringPlay: Boolean(about.isScoringPlay),
      isComplete: Boolean(about.isComplete),
    });

    // Update base/out state from runners for next play
    const runnersRaw = Array.isArray(p.runners) ? p.runners as unknown[] : [];
    let newBases = 0;
    let outsAdded = 0;
    for (const runnerRaw of runnersRaw) {
      const runner = ro(runnerRaw);
      const movement = ro(runner.movement);
      if (movement.isOut) {
        outsAdded++;
      } else {
        const end = movement.end;
        if (end === '1B') newBases |= 0b001;
        else if (end === '2B') newBases |= 0b010;
        else if (end === '3B') newBases |= 0b100;
      }
    }
    currentBases = newBases;
    currentOuts = Math.min(3, currentOuts + outsAdded);
    if (currentOuts >= 3) {
      currentBases = 0;
      currentOuts = 0;
    }
  }

  const lastPlayParsed = allPlays.length > 0 ? allPlays[allPlays.length - 1] : null;
  const lastPlay: PlaySummary | undefined = lastPlayParsed ? {
    description: lastPlayParsed.description,
    halfInning: lastPlayParsed.halfInning,
    inning: lastPlayParsed.inning,
    awayScore: lastPlayParsed.awayScore,
    homeScore: lastPlayParsed.homeScore,
    rbi: lastPlayParsed.rbi,
  } : undefined;

  const leverageTimeline: LeveragePoint[] = allPlays
    .filter(p => p.leverageIndex != null)
    .map(p => ({
      playIndex: p.index,
      halfInning: p.halfInning,
      inning: p.inning,
      leverageIndex: p.leverageIndex as number,
      description: p.description,
    }));

  const gamePkResolved = Number(ro(gd.game).pk ?? gamePk);

  return {
    gamePk: gamePkResolved,
    state,
    detailedState,
    score,
    teams: { home: parseTeamSide(teamsRaw.home), away: parseTeamSide(teamsRaw.away) },
    inning,
    bases,
    count,
    currentBatter,
    currentPitcher,
    lastPlay,
    weather,
    attendance,
    umpires,
    decisions,
    venue,
    probablePitchers,
    linescore,
    allPlays,
    scoringPlayIndices,
    wpaTimeline,
    leverageTimeline,
  };
}

// ─── fetchLiveGame ────────────────────────────────────────────────────────────

export async function fetchLiveGame(gamePk: number): Promise<ParsedLiveGame> {
  const url = `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`;

  // Initial fetch — use 15s so Live games stay fresh; we warm the correct cache below.
  const res = await fetch(url, { next: { revalidate: 15 } });
  if (!res.ok) throw new Error(`fetchLiveGame: HTTP ${res.status} for gamePk ${gamePk}`);
  const raw: unknown = await res.json();
  const parsed = parseLiveGame(raw, gamePk);

  // Warm the long-term cache with the correct TTL for this game state.
  const revalidate = parsed.state === 'Final' ? 86400 : parsed.state === 'Preview' ? 60 : 15;
  if (revalidate !== 15) {
    void fetch(url, { next: { revalidate } }).then(r => r.json()).catch(() => undefined);
  }

  return parsed;
}

// ─── Derived utilities ────────────────────────────────────────────────────────

export function extractWpCurve(parsed: ParsedLiveGame): WpaPoint[] {
  return parsed.wpaTimeline;
}

export function topLeverageMoments(parsed: ParsedLiveGame, n = 5): LeveragePoint[] {
  return [...parsed.leverageTimeline]
    .sort((a, b) => b.leverageIndex - a.leverageIndex)
    .slice(0, n);
}

export function isLive(parsed: ParsedLiveGame): boolean {
  return parsed.state === 'Live';
}

export function isFinal(parsed: ParsedLiveGame): boolean {
  return parsed.state === 'Final';
}
