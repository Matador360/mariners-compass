export interface MLBTeam {
  id: number;
  name: string;
  teamName: string;
  abbreviation: string;
  locationName: string;
  division?: { id: number; name: string };
  league?: { id: number; name: string };
}

export interface MLBPerson {
  id: number;
  fullName: string;
  firstName?: string;
  lastName?: string;
  primaryNumber?: string;
  birthDate?: string;
  currentAge?: number;
  height?: string;
  weight?: number;
  primaryPosition?: { code: string; name: string; type: string; abbreviation: string };
  batSide?: { code: string; description: string };
  pitchHand?: { code: string; description: string };
  currentTeam?: MLBTeam;
}

export interface MLBGameTeam {
  team: MLBTeam;
  score?: number;
  leagueRecord: { wins: number; losses: number; pct: string };
  isWinner?: boolean;
}

export interface MLBGame {
  gamePk: number;
  gameDate: string;
  status: {
    abstractGameState: "Final" | "Live" | "Preview" | "Postponed" | "Suspended";
    detailedState: string;
    statusCode?: string;
  };
  teams: {
    away: MLBGameTeam;
    home: MLBGameTeam;
  };
  venue: { id: number; name: string };
  probablePitchers?: {
    away?: MLBPerson;
    home?: MLBPerson;
  };
  linescore?: MLBLinescore;
  decisions?: {
    winner?: MLBPerson;
    loser?: MLBPerson;
    save?: MLBPerson;
  };
  seriesDescription?: string;
  seriesGameNumber?: number;
  gamesInSeries?: number;
}

export interface MLBLinescore {
  currentInning?: number;
  currentInningOrdinal?: string;
  inningState?: string;
  innings: Array<{
    num: number;
    home: { runs?: number; hits?: number; errors?: number };
    away: { runs?: number; hits?: number; errors?: number };
  }>;
  teams: {
    home: { runs: number; hits: number; errors: number; leftOnBase: number };
    away: { runs: number; hits: number; errors: number; leftOnBase: number };
  };
  balls?: number;
  strikes?: number;
  outs?: number;
}

export interface MLBHittingStats {
  gamesPlayed: number;
  atBats: number;
  runs: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbi: number;
  stolenBases: number;
  caughtStealing: number;
  avg: string;
  obp: string;
  slg: string;
  ops: string;
  strikeOuts: number;
  baseOnBalls: number;
  intentionalWalks: number;
  hitByPitch: number;
  sacBunts: number;
  sacFlies: number;
  totalBases: number;
  groundOuts: number;
  airOuts: number;
  babip?: string;
  plateAppearances?: number;
}

export interface MLBPitchingStats {
  wins: number;
  losses: number;
  era: string;
  gamesPitched: number;
  gamesStarted: number;
  completeGames: number;
  shutouts: number;
  saves: number;
  saveOpportunities: number;
  holds: number;
  blownSaves: number;
  inningsPitched: string;
  hits: number;
  runs: number;
  earnedRuns: number;
  homeRuns: number;
  baseOnBalls: number;
  intentionalWalks: number;
  strikeOuts: number;
  whip: string;
  strikeoutsPer9Inn: string;
  walksPer9Inn: string;
  hitsPer9Inn?: string;
  groundOutsToAirouts?: string;
  winPercentage?: string;
  pitchesPerInning?: string;
  hitByPitch?: number;
  battersFaced?: number;
}

export interface MLBRosterPlayer {
  person: MLBPerson;
  jerseyNumber: string;
  position: { code: string; name: string; type: string; abbreviation: string };
  status: { code: string; description: string };
}

export interface MLBStandingsTeamRecord {
  team: MLBTeam;
  wins: number;
  losses: number;
  pct: string;
  gamesBack: string;
  streak: { streakCode: string; streakNumber: number; streakType: string };
  magicNumber?: string;
  eliminationNumber?: string;
  runsScored: number;
  runsAllowed: number;
  runDifferential: number;
  clinched?: boolean;
  records: {
    splitRecords: MLBSplitRecord[];
    divisionRecords: MLBSplitRecord[];
    overallRecords?: MLBSplitRecord[];
  };
}

export interface MLBSplitRecord {
  wins: number;
  losses: number;
  pct: string;
  type: string;
  division?: { id: number; name: string };
  league?: { id: number; name: string };
}

export interface MLBStandingsDivision {
  division: { id: number; name: string };
  teamRecords: MLBStandingsTeamRecord[];
}

export interface MLBPlayerGameLogEntry {
  date: string;
  isHome: boolean;
  opponent?: MLBTeam;
  stat: MLBHittingStats | MLBPitchingStats;
  team: MLBTeam;
}

export interface MLBTeamStatsEntry {
  team: MLBTeam;
  stat: MLBHittingStats | MLBPitchingStats;
}

export interface MarinersMood {
  emoji: string;
  label: string;
  description: string;
  streakCode: string;
  last10W: number;
  last10L: number;
  runDiff10: number;
}
