import { NextResponse } from "next/server";
import { fetchRoster, fetchPlayerGameLog, fetchPlayerSeasonStats } from "@/lib/mlb-api";
import {
  parseIP,
  computeFatigue,
  inferRole,
  last5Summary,
  type RelieverGameLog,
  type SeasonPitchingStats,
  type RelieverProfile,
} from "@/lib/bullpen";
import type { MLBPitchingStats } from "@/types/mlb";

export const revalidate = 900; // 15 min

export async function GET() {
  try {
    const roster = await fetchRoster();

    // Filter to relief pitchers (position code "1" = pitcher, not starters by role)
    const relievers = roster.filter(
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
          const estimatedPitches = Math.round(gameIP * 16);
          return {
            date: entry.date,
            inningsPitched: gameIP,
            pitches: estimatedPitches,
            earnedRuns: s.earnedRuns,
            strikeOuts: s.strikeOuts,
            baseOnBalls: s.baseOnBalls,
          };
        });

        const fatigue = computeFatigue(logs);
        const role = inferRole(season);
        const last5 = last5Summary(logs);

        profiles.push({
          id,
          name: player.person.fullName,
          number: player.jerseyNumber,
          role,
          season,
          fatigue,
          last5,
        });
      })
    );

    // Sort: red first, then yellow, then green, then unknown; within tier by ERA asc
    const order: Record<string, number> = { red: 0, yellow: 1, green: 2, unknown: 3 };
    profiles.sort((a, b) => {
      const tierDiff = (order[a.fatigue.status] ?? 3) - (order[b.fatigue.status] ?? 3);
      if (tierDiff !== 0) return tierDiff;
      return a.season.era - b.season.era;
    });

    return NextResponse.json(profiles, {
      headers: { "Cache-Control": "public, s-maxage=900" },
    });
  } catch (err) {
    console.error("[/api/bullpen]", err);
    return NextResponse.json([], { status: 500 });
  }
}
