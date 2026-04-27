import { calcAdvancedHitting, calcAdvancedPitching } from "@/lib/calc-stats";
import type { MLBHittingStats, MLBPitchingStats } from "@/types/mlb";

// 2001 Seattle Mariners — 116 wins (real season stats)
// Used as ghost overlay in the comparison tool

interface GhostRawPlayer {
  id: number;
  name: string;
  position: string;
  isPitcher: boolean;
  headshot: string;
  isGhost: true;
  ghostYear: 2001;
  seasonStats: Record<string, number | string>;
  advancedStats: Record<string, number>;
}

function mkHeadshot(id: number) {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_120,q_auto:best/v1/people/${id}/headshot/67/current`;
}

function hitterEntry(
  id: number,
  name: string,
  position: string,
  raw: MLBHittingStats
): GhostRawPlayer {
  const adv = calcAdvancedHitting(raw);
  return {
    id,
    name,
    position,
    isPitcher: false,
    headshot: mkHeadshot(id),
    isGhost: true,
    ghostYear: 2001,
    seasonStats: {
      avg: raw.avg,
      obp: raw.obp,
      slg: raw.slg,
      ops: raw.ops,
      gamesPlayed: raw.gamesPlayed,
      atBats: raw.atBats,
      runs: raw.runs,
      hits: raw.hits,
      doubles: raw.doubles,
      triples: raw.triples,
      homeRuns: raw.homeRuns,
      rbi: raw.rbi,
      stolenBases: raw.stolenBases,
      caughtStealing: raw.caughtStealing,
      strikeOuts: raw.strikeOuts,
      baseOnBalls: raw.baseOnBalls,
      intentionalWalks: raw.intentionalWalks,
      hitByPitch: raw.hitByPitch,
      sacFlies: raw.sacFlies,
      sacBunts: raw.sacBunts,
      totalBases: raw.totalBases,
      plateAppearances: raw.plateAppearances ?? 0,
    },
    advancedStats: adv as unknown as Record<string, number>,
  };
}

function pitcherEntry(
  id: number,
  name: string,
  position: string,
  raw: MLBPitchingStats
): GhostRawPlayer {
  const adv = calcAdvancedPitching(raw);
  return {
    id,
    name,
    position,
    isPitcher: true,
    headshot: mkHeadshot(id),
    isGhost: true,
    ghostYear: 2001,
    seasonStats: {
      era: raw.era,
      whip: raw.whip,
      wins: raw.wins,
      losses: raw.losses,
      gamesPitched: raw.gamesPitched,
      gamesStarted: raw.gamesStarted,
      saves: raw.saves,
      inningsPitched: raw.inningsPitched,
      hits: raw.hits,
      runs: raw.runs,
      earnedRuns: raw.earnedRuns,
      homeRuns: raw.homeRuns,
      baseOnBalls: raw.baseOnBalls,
      intentionalWalks: raw.intentionalWalks,
      strikeOuts: raw.strikeOuts,
      strikeoutsPer9Inn: raw.strikeoutsPer9Inn,
      walksPer9Inn: raw.walksPer9Inn,
      battersFaced: raw.battersFaced ?? 0,
    },
    advancedStats: adv as unknown as Record<string, number>,
  };
}

// ─── Hitters ──────────────────────────────────────────────────────────────────

const ichiro = hitterEntry(400085, "Ichiro Suzuki '01", "RF", {
  gamesPlayed: 157, atBats: 692, runs: 127, hits: 242, doubles: 34, triples: 8,
  homeRuns: 8, rbi: 69, stolenBases: 56, caughtStealing: 14,
  avg: ".350", obp: ".381", slg: ".457", ops: ".838",
  strikeOuts: 53, baseOnBalls: 30, intentionalWalks: 5, hitByPitch: 8,
  sacBunts: 3, sacFlies: 5, totalBases: 316, groundOuts: 176, airOuts: 118,
  plateAppearances: 738,
});

const edgar = hitterEntry(120074, "Edgar Martínez '01", "DH", {
  gamesPlayed: 132, atBats: 470, runs: 100, hits: 144, doubles: 40, triples: 1,
  homeRuns: 23, rbi: 116, stolenBases: 1, caughtStealing: 0,
  avg: ".306", obp: ".423", slg: ".543", ops: ".966",
  strikeOuts: 73, baseOnBalls: 93, intentionalWalks: 16, hitByPitch: 4,
  sacBunts: 0, sacFlies: 9, totalBases: 255, groundOuts: 82, airOuts: 96,
  plateAppearances: 576,
});

const boone = hitterEntry(115174, "Bret Boone '01", "2B", {
  gamesPlayed: 158, atBats: 623, runs: 118, hits: 206, doubles: 37, triples: 3,
  homeRuns: 37, rbi: 141, stolenBases: 5, caughtStealing: 6,
  avg: ".331", obp: ".372", slg: ".578", ops: ".950",
  strikeOuts: 110, baseOnBalls: 40, intentionalWalks: 3, hitByPitch: 5,
  sacBunts: 3, sacFlies: 6, totalBases: 360, groundOuts: 148, airOuts: 130,
  plateAppearances: 677,
});

const olerud = hitterEntry(120952, "John Olerud '01", "1B", {
  gamesPlayed: 157, atBats: 572, runs: 95, hits: 173, doubles: 32, triples: 0,
  homeRuns: 21, rbi: 95, stolenBases: 0, caughtStealing: 0,
  avg: ".302", obp: ".401", slg: ".472", ops: ".873",
  strikeOuts: 72, baseOnBalls: 82, intentionalWalks: 19, hitByPitch: 3,
  sacBunts: 0, sacFlies: 8, totalBases: 270, groundOuts: 124, airOuts: 105,
  plateAppearances: 665,
});

const cameron = hitterEntry(150261, "Mike Cameron '01", "CF", {
  gamesPlayed: 157, atBats: 540, runs: 99, hits: 144, doubles: 30, triples: 5,
  homeRuns: 25, rbi: 110, stolenBases: 34, caughtStealing: 9,
  avg: ".267", obp: ".353", slg: ".480", ops: ".833",
  strikeOuts: 155, baseOnBalls: 69, intentionalWalks: 3, hitByPitch: 10,
  sacBunts: 0, sacFlies: 4, totalBases: 259, groundOuts: 96, airOuts: 148,
  plateAppearances: 623,
});

const bell = hitterEntry(116538, "David Bell '01", "3B", {
  gamesPlayed: 158, atBats: 527, runs: 65, hits: 137, doubles: 21, triples: 2,
  homeRuns: 15, rbi: 64, stolenBases: 2, caughtStealing: 4,
  avg: ".260", obp: ".325", slg: ".408", ops: ".733",
  strikeOuts: 82, baseOnBalls: 43, intentionalWalks: 2, hitByPitch: 8,
  sacBunts: 4, sacFlies: 6, totalBases: 215, groundOuts: 138, airOuts: 100,
  plateAppearances: 588,
});

const guillen = hitterEntry(424825, "Carlos Guillén '01", "SS", {
  gamesPlayed: 98, atBats: 290, runs: 40, hits: 75, doubles: 16, triples: 2,
  homeRuns: 5, rbi: 53, stolenBases: 4, caughtStealing: 2,
  avg: ".259", obp: ".347", slg: ".383", ops: ".730",
  strikeOuts: 57, baseOnBalls: 39, intentionalWalks: 2, hitByPitch: 2,
  sacBunts: 5, sacFlies: 2, totalBases: 111, groundOuts: 74, airOuts: 64,
  plateAppearances: 338,
});

const wilson = hitterEntry(121661, "Dan Wilson '01", "C", {
  gamesPlayed: 126, atBats: 389, runs: 45, hits: 103, doubles: 21, triples: 0,
  homeRuns: 10, rbi: 44, stolenBases: 1, caughtStealing: 1,
  avg: ".265", obp: ".311", slg: ".388", ops: ".699",
  strikeOuts: 75, baseOnBalls: 25, intentionalWalks: 1, hitByPitch: 4,
  sacBunts: 0, sacFlies: 3, totalBases: 151, groundOuts: 96, airOuts: 89,
  plateAppearances: 421,
});

const mclemore = hitterEntry(120965, "Mark McLemore '01", "UT", {
  gamesPlayed: 149, atBats: 441, runs: 75, hits: 126, doubles: 16, triples: 3,
  homeRuns: 5, rbi: 57, stolenBases: 39, caughtStealing: 11,
  avg: ".286", obp: ".369", slg: ".381", ops: ".750",
  strikeOuts: 67, baseOnBalls: 66, intentionalWalks: 3, hitByPitch: 4,
  sacBunts: 5, sacFlies: 4, totalBases: 168, groundOuts: 112, airOuts: 104,
  plateAppearances: 520,
});

// ─── Pitchers ─────────────────────────────────────────────────────────────────

const garcia = pitcherEntry(276634, "Freddy Garcia '01", "SP", {
  wins: 18, losses: 6, era: "3.05",
  gamesPitched: 34, gamesStarted: 34, completeGames: 4, shutouts: 1,
  saves: 0, saveOpportunities: 0, holds: 0, blownSaves: 0,
  inningsPitched: "238.2",
  hits: 222, runs: 86, earnedRuns: 81, homeRuns: 17,
  baseOnBalls: 69, intentionalWalks: 4, strikeOuts: 163,
  whip: "1.22", strikeoutsPer9Inn: "6.15", walksPer9Inn: "2.60",
  hitByPitch: 5, battersFaced: 998,
});

const moyer = pitcherEntry(121219, "Jamie Moyer '01", "SP", {
  wins: 20, losses: 6, era: "3.43",
  gamesPitched: 33, gamesStarted: 33, completeGames: 2, shutouts: 1,
  saves: 0, saveOpportunities: 0, holds: 0, blownSaves: 0,
  inningsPitched: "209.2",
  hits: 200, runs: 84, earnedRuns: 80, homeRuns: 16,
  baseOnBalls: 44, intentionalWalks: 6, strikeOuts: 119,
  whip: "1.16", strikeoutsPer9Inn: "5.11", walksPer9Inn: "1.89",
  hitByPitch: 5, battersFaced: 864,
});

const sele = pitcherEntry(121649, "Aaron Sele '01", "SP", {
  wins: 15, losses: 5, era: "3.60",
  gamesPitched: 31, gamesStarted: 31, completeGames: 1, shutouts: 0,
  saves: 0, saveOpportunities: 0, holds: 0, blownSaves: 0,
  inningsPitched: "187.1",
  hits: 191, runs: 76, earnedRuns: 75, homeRuns: 15,
  baseOnBalls: 62, intentionalWalks: 2, strikeOuts: 114,
  whip: "1.35", strikeoutsPer9Inn: "5.48", walksPer9Inn: "2.98",
  hitByPitch: 7, battersFaced: 796,
});

const abbott = pitcherEntry(113767, "Paul Abbott '01", "SP", {
  wins: 17, losses: 4, era: "4.25",
  gamesPitched: 27, gamesStarted: 27, completeGames: 0, shutouts: 0,
  saves: 0, saveOpportunities: 0, holds: 0, blownSaves: 0,
  inningsPitched: "163.0",
  hits: 164, runs: 78, earnedRuns: 77, homeRuns: 18,
  baseOnBalls: 87, intentionalWalks: 6, strikeOuts: 118,
  whip: "1.54", strikeoutsPer9Inn: "6.52", walksPer9Inn: "4.80",
  hitByPitch: 7, battersFaced: 715,
});

const sasaki = pitcherEntry(425784, "Kazuhiro Sasaki '01", "CL", {
  wins: 0, losses: 3, era: "3.24",
  gamesPitched: 69, gamesStarted: 0, completeGames: 0, shutouts: 0,
  saves: 45, saveOpportunities: 49, holds: 0, blownSaves: 4,
  inningsPitched: "66.2",
  hits: 42, runs: 25, earnedRuns: 24, homeRuns: 5,
  baseOnBalls: 20, intentionalWalks: 5, strikeOuts: 62,
  whip: "0.93", strikeoutsPer9Inn: "8.37", walksPer9Inn: "2.70",
  hitByPitch: 1, battersFaced: 264,
});

const rhodes = pitcherEntry(119375, "Arthur Rhodes '01", "RP", {
  wins: 8, losses: 0, era: "1.72",
  gamesPitched: 72, gamesStarted: 0, completeGames: 0, shutouts: 0,
  saves: 3, saveOpportunities: 5, holds: 22, blownSaves: 2,
  inningsPitched: "68.1",
  hits: 41, runs: 14, earnedRuns: 13, homeRuns: 3,
  baseOnBalls: 19, intentionalWalks: 6, strikeOuts: 83,
  whip: "0.88", strikeoutsPer9Inn: "10.93", walksPer9Inn: "2.50",
  hitByPitch: 3, battersFaced: 263,
});

export const GHOST_ROSTER_2001: GhostRawPlayer[] = [
  ichiro, edgar, boone, olerud, cameron, bell, guillen, wilson, mclemore,
  garcia, moyer, sele, abbott, sasaki, rhodes,
];
