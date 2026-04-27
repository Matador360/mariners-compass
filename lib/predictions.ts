// ─── Predictions & Projections ───────────────────────────────────────────────
// Pure functions except simulatePlayoffOdds (Monte Carlo). No deps, no imports.

// ─── 1. Win Probability ───────────────────────────────────────────────────────

export function calcWinProb(
  seaWinPct: number,
  oppWinPct: number,
  seaIsHome: boolean,
): number {
  const base = 0.5 + (seaWinPct - oppWinPct) * 0.75 + (seaIsHome ? 0.04 : -0.04);
  return Math.max(0.15, Math.min(0.85, base));
}

// ─── 2. Pythagorean Wins ─────────────────────────────────────────────────────

const PYTHAG_EXP = 1.83; // Bill James exponent

export function pythagWins(
  runsScored: number,
  runsAllowed: number,
  gamesPlayed: number,
): { expectedW: number; expectedL: number; luckDelta: number } {
  if (runsScored <= 0 || runsAllowed <= 0 || gamesPlayed <= 0) {
    return { expectedW: 0, expectedL: 0, luckDelta: 0 };
  }
  const rs = Math.pow(runsScored, PYTHAG_EXP);
  const ra = Math.pow(runsAllowed, PYTHAG_EXP);
  const winPct = rs / (rs + ra);
  const expectedW = winPct * gamesPlayed;
  const expectedL = gamesPlayed - expectedW;
  return { expectedW, expectedL, luckDelta: 0 };
}

export function pythagLuck(
  actualW: number,
  expectedW: number,
): { delta: number; label: "lucky" | "unlucky" | "even" } {
  const delta = actualW - expectedW;
  const label = delta > 1.5 ? "lucky" : delta < -1.5 ? "unlucky" : "even";
  return { delta, label };
}

// ─── 3. Magic Number ─────────────────────────────────────────────────────────

export function magicNumber(
  teamWins: number,
  teamLosses: number,
  divLeaderLosses: number,
  gamesRemaining: number,
): number | null {
  if (gamesRemaining <= 0) return null;
  const totalGames = teamWins + teamLosses + gamesRemaining;
  const magic = totalGames - teamWins - divLeaderLosses + 1;
  if (magic <= 0) return null;
  if (magic > gamesRemaining + 1) return null;
  return magic;
}

// ─── 4. Tragic Number ────────────────────────────────────────────────────────

export function tragicNumber(
  teamWins: number,
  teamLosses: number,
  divLeaderWins: number,
  gamesRemaining: number,
): number | null {
  if (gamesRemaining <= 0) return null;
  const totalGames = teamWins + teamLosses + gamesRemaining;
  const tragic = totalGames - teamLosses - divLeaderWins + 1;
  if (tragic <= 0) return null;
  if (tragic > gamesRemaining + 1) return null;
  return tragic;
}

// ─── 5. Elimination Number ───────────────────────────────────────────────────

export function eliminationNumber(
  teamCurrentWins: number,
  gamesRemaining: number,
  contenderWins: number,
  contenderGamesRemaining: number,
): number {
  const maxTeamWins = teamCurrentWins + gamesRemaining;
  const maxContenderWins = contenderWins + contenderGamesRemaining;
  const elim = maxTeamWins - contenderWins + 1;
  if (maxTeamWins < contenderWins) return 0;
  if (elim > gamesRemaining) return gamesRemaining;
  if (maxContenderWins < teamCurrentWins) return gamesRemaining;
  return Math.max(0, elim);
}

// ─── 6. Monte Carlo Playoff Odds ─────────────────────────────────────────────

interface RivalTeam {
  teamId: string | number;
  wins: number;
  losses: number;
  remainingGames: Array<{ oppWinPct: number; isHome: boolean }>;
  teamWinPct: number;
}

interface SimulatePlayoffOptsGame {
  oppWinPct: number;
  isHome: boolean;
}

interface SimulatePlayoffOpts {
  teamWins: number;
  teamLosses: number;
  remainingGames: SimulatePlayoffOptsGame[];
  teamWinPct: number;
  divisionRivals: RivalTeam[];
  wildcardRivals: RivalTeam[];
  iterations?: number;
}

interface PlayoffOddsResult {
  divisionOdds: number;
  wildcardOdds: number;
  totalPlayoffOdds: number;
  projectedWins: number;
  projectedLosses: number;
  finishDistribution: Record<number, number>;
}

export function simulatePlayoffOdds(opts: SimulatePlayoffOpts): PlayoffOddsResult {
  const {
    teamWins,
    teamLosses,
    remainingGames,
    teamWinPct,
    divisionRivals,
    wildcardRivals,
    iterations = 10000,
  } = opts;

  let divWins = 0;
  let wcWins = 0;
  const finishDistribution: Record<number, number> = {};
  let totalSimWins = 0;

  for (let i = 0; i < iterations; i++) {
    let simW = teamWins;

    for (const game of remainingGames) {
      const prob = calcWinProb(teamWinPct, game.oppWinPct, game.isHome);
      if (Math.random() < prob) simW++;
    }

    totalSimWins += simW;
    const w = simW;
    finishDistribution[w] = (finishDistribution[w] ?? 0) + 1;

    const divFinalWins = divisionRivals.map((r) => {
      let rW = r.wins;
      for (const g of r.remainingGames) {
        if (Math.random() < calcWinProb(r.teamWinPct, g.oppWinPct, g.isHome)) rW++;
      }
      return rW;
    });

    const wonDiv = divFinalWins.every((rW) => simW >= rW);
    if (wonDiv) divWins++;

    const allWcWins = wildcardRivals.map((r) => {
      let rW = r.wins;
      for (const g of r.remainingGames) {
        if (Math.random() < calcWinProb(r.teamWinPct, g.oppWinPct, g.isHome)) rW++;
      }
      return rW;
    });

    const wcRanks = [simW, ...allWcWins].sort((a, b) => b - a);
    const seaRank = wcRanks.indexOf(simW) + 1;
    if (!wonDiv && seaRank <= 3) wcWins++;
  }

  const projectedWins = Math.round(totalSimWins / iterations);
  const gamesPlayed = teamWins + teamLosses;
  const projectedLosses = 162 - projectedWins - Math.max(0, 162 - gamesPlayed - remainingGames.length);

  return {
    divisionOdds: divWins / iterations,
    wildcardOdds: wcWins / iterations,
    totalPlayoffOdds: (divWins + wcWins) / iterations,
    projectedWins,
    projectedLosses: Math.max(0, projectedLosses),
    finishDistribution,
  };
}

// ─── 7. Pace Projection ───────────────────────────────────────────────────────

export function pace162(
  currentWins: number,
  currentLosses: number,
): { projectedWins: number; projectedLosses: number; pace: number } {
  const gamesPlayed = currentWins + currentLosses;
  if (gamesPlayed === 0) {
    return { projectedWins: 81, projectedLosses: 81, pace: 0.5 };
  }
  const pace = currentWins / gamesPlayed;
  const projectedWins = Math.round(pace * 162);
  const projectedLosses = 162 - projectedWins;
  return { projectedWins, projectedLosses, pace };
}
