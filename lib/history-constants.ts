// Single source of truth for hardcoded history-page tile values.
// Each entry has a `source` URL so future contributors can verify the number.
//
// Keep this list narrow: it is for *headline / by-the-numbers tiles*, not
// franchise leaderboards (those live in `lib/franchise-records.ts`).

export interface HistoryHeadlineStat {
  /** Stable identifier — referenced in regression tests. */
  key: string;
  /** The number rendered in the tile. */
  value: number;
  /** Suffix appended after the value (e.g. " W", " H", " yrs"). */
  suffix: string;
  /** Tile label. */
  label: string;
  /** Decimals to display via CountingNumber. */
  decimals: number;
  /** Citation URL — Baseball Reference / official record book. */
  source: string;
}

/** "By The Numbers" tile values shown on /history. */
export const HISTORY_HEADLINE_STATS: HistoryHeadlineStat[] = [
  {
    key: "yearsOfSuffering",
    value: 49,
    suffix: " yrs",
    label: "Years of Suffering",
    decimals: 0,
    // Mariners founded in 1977; 2026 - 1977 = 49.
    source: "https://www.baseball-reference.com/teams/SEA/",
  },
  {
    key: "worldSeriesAppearances",
    value: 0,
    suffix: "",
    label: "World Series Appearances",
    decimals: 0,
    source: "https://www.baseball-reference.com/postseason/world_series.shtml",
  },
  {
    key: "bestSeasonWins",
    value: 116,
    suffix: " W",
    label: "Best Season (2001)",
    decimals: 0,
    // 2001 Mariners went 116-46, tying the 1906 Cubs' AL/NL record.
    source: "https://www.baseball-reference.com/teams/SEA/2001.shtml",
  },
  {
    key: "ichiro2004Hits",
    value: 262,
    suffix: " H",
    label: "Ichiro's 2004 Record",
    decimals: 0,
    // Single-season MLB hits record, broke George Sisler's 257 from 1920.
    source: "https://www.baseball-reference.com/players/s/suzukic01.shtml",
  },
  {
    key: "playoffDroughtYears",
    value: 21,
    suffix: " yrs",
    label: "Playoff Drought",
    decimals: 0,
    // 2001 (last appearance pre-2022) → 2022 (Cal Raleigh walk-off, Sept 2 2022).
    // 2002–2021 inclusive = 21 missed seasons.
    source: "https://www.baseball-reference.com/teams/SEA/",
  },
  {
    key: "hallOfFamers",
    value: 4,
    suffix: "",
    label: "Hall of Famers",
    decimals: 0,
    // Griffey (2016), Randy Johnson (2015), Edgar (2019), Ichiro (2025).
    // Gaylord Perry is excluded — wore the cap but inducted as a Giant/Indian.
    source: "https://baseballhall.org/hall-of-famers",
  },
  {
    key: "griffeyCareerHomers",
    value: 630,
    suffix: " HR",
    label: "Griffey Career Homers",
    decimals: 0,
    source: "https://www.baseball-reference.com/players/g/griffke02.shtml",
  },
  {
    key: "felixPerfectGames",
    value: 1,
    suffix: "",
    label: "Perfect Games (Felix)",
    decimals: 0,
    // Aug 15 2012 vs TB. 27 up, 27 down. The only one in franchise history.
    source: "https://www.baseball-reference.com/boxes/SEA/SEA201208150.shtml",
  },
];

/** Convenience lookup. Throws if the key is unknown — fail loud at boot. */
export function getHistoryStat(key: string): HistoryHeadlineStat {
  const stat = HISTORY_HEADLINE_STATS.find((s) => s.key === key);
  if (!stat) throw new Error(`Unknown history headline stat: ${key}`);
  return stat;
}
