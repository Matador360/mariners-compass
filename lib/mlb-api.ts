import type {
  MLBGame,
  MLBRosterPlayer,
  MLBStandingsDivision,
  MLBHittingStats,
  MLBPitchingStats,
  MLBPerson,
  MLBTeamStatsEntry,
  MarinersMood,
} from "@/types/mlb";

const BASE = "https://statsapi.mlb.com/api/v1";
const TEAM_ID = 136;
const SEASON = new Date().getFullYear();

async function apiFetch<T>(path: string, revalidate: number): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) throw new Error(`MLB API error: ${res.status} ${url}`);
  return res.json();
}

// ---------- Schedule ----------

export async function fetchSchedule(
  startDate?: string,
  endDate?: string
): Promise<MLBGame[]> {
  const start = startDate ?? `${SEASON}-01-01`;
  const end = endDate ?? `${SEASON}-12-31`;
  const data = await apiFetch<{ dates: Array<{ games: MLBGame[] }> }>(
    `/schedule?teamId=${TEAM_ID}&sportId=1&season=${SEASON}&startDate=${start}&endDate=${end}&hydrate=probablePitcher,decisions,linescore,seriesStatus`,
    900 // 15 min
  );
  return data.dates.flatMap((d) => d.games ?? []);
}

export async function fetchTodayGame(): Promise<MLBGame | null> {
  const today = new Date().toISOString().split("T")[0];
  const data = await apiFetch<{ dates: Array<{ games: MLBGame[] }> }>(
    `/schedule?teamId=${TEAM_ID}&sportId=1&date=${today}&hydrate=probablePitcher,decisions,linescore,team`,
    30 // 30 sec — live game polling
  );
  return data.dates[0]?.games?.[0] ?? null;
}

export async function fetchNextGame(): Promise<MLBGame | null> {
  const today = new Date().toISOString().split("T")[0];
  const end = `${SEASON}-12-31`;
  const data = await apiFetch<{ dates: Array<{ games: MLBGame[] }> }>(
    `/schedule?teamId=${TEAM_ID}&sportId=1&startDate=${today}&endDate=${end}&sportId=1&hydrate=probablePitcher&limit=5`,
    900
  );
  const upcoming = data.dates.flatMap((d) => d.games ?? []).filter(
    (g) => g.status.abstractGameState === "Preview"
  );
  return upcoming[0] ?? null;
}

export async function fetchLiveGame(gamePk: number): Promise<unknown> {
  const res = await fetch(
    `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`,
    { next: { revalidate: 30 } }
  );
  if (!res.ok) return null;
  return res.json();
}

// ---------- Standings ----------

export async function fetchALWestStandings(): Promise<
  MLBStandingsDivision | null
> {
  const data = await apiFetch<{
    records: MLBStandingsDivision[];
  }>(
    `/standings?leagueId=103&season=${SEASON}&standingsTypes=regularSeason&hydrate=team,division`,
    900
  );
  // AL West division id = 200
  return (
    data.records.find((r) => r.division?.id === 200) ??
    data.records[0] ??
    null
  );
}

// ---------- Roster ----------

export async function fetchRoster(): Promise<MLBRosterPlayer[]> {
  const data = await apiFetch<{ roster: MLBRosterPlayer[] }>(
    `/teams/${TEAM_ID}/roster?rosterType=active&season=${SEASON}&hydrate=person(stats(type=season,group=hitting,season=${SEASON}))`,
    3600 // 1 hr
  );
  return data.roster ?? [];
}

// ---------- Team Stats ----------

export async function fetchTeamHittingStats(): Promise<MLBHittingStats | null> {
  const data = await apiFetch<{
    stats: Array<{ splits: Array<{ stat: MLBHittingStats }> }>;
  }>(
    `/teams/${TEAM_ID}/stats?season=${SEASON}&group=hitting&stats=season&sportId=1`,
    86400 // 24 hr
  );
  return data.stats?.[0]?.splits?.[0]?.stat ?? null;
}

export async function fetchTeamPitchingStats(): Promise<MLBPitchingStats | null> {
  const data = await apiFetch<{
    stats: Array<{ splits: Array<{ stat: MLBPitchingStats }> }>;
  }>(
    `/teams/${TEAM_ID}/stats?season=${SEASON}&group=pitching&stats=season&sportId=1`,
    86400
  );
  return data.stats?.[0]?.splits?.[0]?.stat ?? null;
}

export async function fetchTeamStatsByWeek(): Promise<
  Array<{ date: string; stat: MLBHittingStats }>
> {
  // Use season game-by-game and aggregate — simplified monthly rollup
  const games = await fetchSchedule();
  const finished = games
    .filter((g) => g.status.abstractGameState === "Final")
    .sort((a, b) => a.gameDate.localeCompare(b.gameDate));

  // Return last 30 finished games for sparkline use
  return finished.slice(-30).map((g) => ({
    date: g.gameDate.split("T")[0],
    stat: {} as MLBHittingStats,
  }));
}

// ---------- League Stats (for percentiles) ----------

export async function fetchLeagueHittingStats(): Promise<MLBTeamStatsEntry[]> {
  const data = await apiFetch<{
    stats: Array<{ splits: Array<MLBTeamStatsEntry> }>;
  }>(
    `/teams/stats?sportId=1&season=${SEASON}&group=hitting&stats=season`,
    86400
  );
  return data.stats?.[0]?.splits ?? [];
}

export async function fetchLeaguePitchingStats(): Promise<
  MLBTeamStatsEntry[]
> {
  const data = await apiFetch<{
    stats: Array<{ splits: Array<MLBTeamStatsEntry> }>;
  }>(
    `/teams/stats?sportId=1&season=${SEASON}&group=pitching&stats=season`,
    86400
  );
  return data.stats?.[0]?.splits ?? [];
}

// ---------- Player ----------

export async function fetchPlayerBio(id: number): Promise<MLBPerson | null> {
  const data = await apiFetch<{ people: MLBPerson[] }>(
    `/people/${id}`,
    86400
  );
  return data.people?.[0] ?? null;
}

export async function fetchPlayerSeasonStats(
  id: number,
  group: "hitting" | "pitching"
): Promise<MLBHittingStats | MLBPitchingStats | null> {
  const data = await apiFetch<{
    stats: Array<{ splits: Array<{ stat: MLBHittingStats | MLBPitchingStats }> }>;
  }>(
    `/people/${id}/stats?stats=season&group=${group}&season=${SEASON}`,
    3600
  );
  return data.stats?.[0]?.splits?.[0]?.stat ?? null;
}

export async function fetchPlayerCareerStats(
  id: number,
  group: "hitting" | "pitching"
): Promise<Array<{ season: string; stat: MLBHittingStats | MLBPitchingStats }>> {
  const data = await apiFetch<{
    stats: Array<{ splits: Array<{ season: string; stat: MLBHittingStats | MLBPitchingStats }> }>;
  }>(
    `/people/${id}/stats?stats=yearByYear&group=${group}`,
    86400
  );
  return data.stats?.[0]?.splits ?? [];
}

export async function fetchPlayerGameLog(
  id: number,
  group: "hitting" | "pitching"
): Promise<
  Array<{
    date: string;
    opponent?: { id: number; name: string };
    isHome: boolean;
    stat: MLBHittingStats | MLBPitchingStats;
  }>
> {
  const data = await apiFetch<{
    stats: Array<{
      splits: Array<{
        date: string;
        isHome: boolean;
        opponent?: { id: number; name: string };
        stat: MLBHittingStats | MLBPitchingStats;
      }>;
    }>;
  }>(
    `/people/${id}/stats?stats=gameLog&group=${group}&season=${SEASON}`,
    900
  );
  return data.stats?.[0]?.splits?.reverse() ?? [];
}

// ---------- Mariners Mood ----------

export async function computeMarinersMood(
  games: MLBGame[]
): Promise<MarinersMood> {
  const finished = games
    .filter((g) => g.status.abstractGameState === "Final")
    .sort((a, b) => b.gameDate.localeCompare(a.gameDate));

  const last10 = finished.slice(0, 10);

  let wins = 0;
  let losses = 0;
  let runDiff = 0;

  for (const g of last10) {
    const isMariners = g.teams.home.team.id === TEAM_ID;
    const us = isMariners ? g.teams.home : g.teams.away;
    const them = isMariners ? g.teams.away : g.teams.home;
    const ourScore = us.score ?? 0;
    const theirScore = them.score ?? 0;
    runDiff += ourScore - theirScore;
    if (us.isWinner) wins++;
    else losses++;
  }

  // Compute actual consecutive win/loss streak from most recent game backwards
  let streakCount = 0;
  let streakDir: "W" | "L" | null = null;
  for (const g of finished) {
    const isMariners = g.teams.home.team.id === TEAM_ID;
    const us = isMariners ? g.teams.home : g.teams.away;
    const dir = us.isWinner ? "W" : "L";
    if (streakDir === null) { streakDir = dir; streakCount = 1; }
    else if (dir === streakDir) { streakCount++; }
    else break;
  }
  const streakCode = streakDir ? `${streakDir}${streakCount}` : "—";

  let emoji: MarinersMood["emoji"];
  let label: string;
  let description: string;

  if (wins >= 7 && runDiff >= 15) {
    emoji = "🔥";
    label = "On Fire";
    description = "The M's are absolutely cooking right now.";
  } else if (wins >= 6 || runDiff >= 5) {
    emoji = "😎";
    label = "Vibing";
    description = "Solid stretch — things are looking up in the PNW.";
  } else if (wins <= 3 || runDiff <= -10) {
    emoji = "😬";
    label = "Rough Patch";
    description = "It's a rebuilding moment. We believe.";
  } else {
    emoji = "😐";
    label = "Steady";
    description = "Neither too hot nor too cold. A .500 kind of week.";
  }

  return { emoji, label, description, streakCode, last10W: wins, last10L: losses, runDiff10: runDiff };
}
