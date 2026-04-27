import {
  fetchRoster,
  fetchSchedule,
  fetchPlayerCareerAsMariner,
} from "@/lib/mlb-api";
import {
  FRANCHISE_RECORDS,
  computeChase,
  type ChaseResult,
} from "@/lib/franchise-records";
import {
  entriesForToday,
  fetchHistoricalGamesOnDate,
  type OnThisDayEntry,
  type HistoricalGameOnDate,
} from "@/lib/on-this-day";
import { ChaseBars, type ChaseRow } from "@/components/chase-bars";
import { OnThisDayCard } from "@/components/on-this-day-card";
import { DroughtRibbon } from "@/components/drought-ribbon";
import { H2HMatrix } from "@/components/h2h-matrix";
import { FRANCHISE_OPPONENTS } from "@/lib/h2h-teams";
import { HistoryStaticContent } from "@/components/history-static-content";
import type { MLBHittingStats, MLBPitchingStats, MLBRosterPlayer } from "@/types/mlb";

const MARINERS_ID = 136;

interface PlayerCareerSnapshot {
  playerId: number;
  name: string;
  hitting: MLBHittingStats | null;
  pitching: MLBPitchingStats | null;
  marinerSeasons: number;
}

async function loadActiveCareerSnapshots(
  roster: MLBRosterPlayer[]
): Promise<PlayerCareerSnapshot[]> {
  const snapshots = await Promise.allSettled(
    roster.map(async (p) => {
      const isPitcher = p.position.type === "Pitcher";
      const groupsToFetch: Array<"hitting" | "pitching"> = isPitcher
        ? ["pitching", "hitting"]
        : ["hitting"];

      const fetched = await Promise.all(
        groupsToFetch.map((g) => fetchPlayerCareerAsMariner(p.person.id, g))
      );

      let hitting: MLBHittingStats | null = null;
      let pitching: MLBPitchingStats | null = null;
      let seasons = 0;
      for (let i = 0; i < groupsToFetch.length; i++) {
        const { aggregated, seasons: s } = fetched[i];
        seasons = Math.max(seasons, s);
        if (groupsToFetch[i] === "hitting") {
          hitting = aggregated as MLBHittingStats | null;
        } else {
          pitching = aggregated as MLBPitchingStats | null;
        }
      }

      return {
        playerId: p.person.id,
        name: p.person.fullName,
        hitting,
        pitching,
        marinerSeasons: seasons,
      };
    })
  );

  return snapshots
    .filter((r): r is PromiseFulfilledResult<PlayerCareerSnapshot> => r.status === "fulfilled")
    .map((r) => r.value);
}

function buildChaseRows(snapshots: PlayerCareerSnapshot[]): ChaseRow[] {
  return FRANCHISE_RECORDS.map((record) => {
    let bestPlayer: PlayerCareerSnapshot | null = null;
    let bestChase: ChaseResult | null = null;

    for (const snap of snapshots) {
      const chase = computeChase(
        record,
        { hitting: snap.hitting, pitching: snap.pitching },
        snap.marinerSeasons
      );
      if (chase.current <= 0) continue;

      const isFirst = bestChase === null;
      const better =
        record.betterDirection === "lower"
          ? chase.current < (bestChase?.current ?? Infinity)
          : chase.current > (bestChase?.current ?? -Infinity);

      if (isFirst || better) {
        bestPlayer = snap;
        bestChase = chase;
      }
    }

    return {
      record,
      chaser:
        bestPlayer && bestChase
          ? {
              playerId: bestPlayer.playerId,
              name: bestPlayer.name,
              current: bestChase.current,
              pct: bestChase.pct,
              pace: bestChase.pace,
            }
          : null,
    };
  });
}

interface OnThisDayData {
  todayLabel: string;
  monthDay: string;
  curated: OnThisDayEntry[];
  historicalGames: HistoricalGameOnDate[];
}

async function loadOnThisDay(): Promise<OnThisDayData> {
  const today = new Date();
  const tz = "America/Los_Angeles";
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(today);
  const month = dateParts.find((p) => p.type === "month")?.value ?? "01";
  const day = dateParts.find((p) => p.type === "day")?.value ?? "01";
  const year = parseInt(dateParts.find((p) => p.type === "year")?.value ?? "2026");
  const monthDay = `${month}-${day}`;

  const todayLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    month: "long",
    day: "numeric",
  }).format(today);

  const curated = entriesForToday(today);

  let historicalGames: HistoricalGameOnDate[] = [];
  try {
    historicalGames = await fetchHistoricalGamesOnDate(monthDay, year, 10);
  } catch {
    historicalGames = [];
  }

  return { todayLabel, monthDay, curated, historicalGames };
}

function buildThisSeasonH2H(
  games: Array<{
    status: { abstractGameState: string };
    teams: {
      home: { team: { id: number }; score?: number; isWinner?: boolean };
      away: { team: { id: number }; score?: number; isWinner?: boolean };
    };
  }>
): Record<string, { w: number; l: number }> {
  const idToAbbrev = new Map<number, string>();
  for (const t of FRANCHISE_OPPONENTS) idToAbbrev.set(t.id, t.abbrev);

  const out: Record<string, { w: number; l: number }> = {};
  for (const g of games) {
    if (g.status.abstractGameState !== "Final") continue;
    const isHome = g.teams.home.team.id === MARINERS_ID;
    const us = isHome ? g.teams.home : g.teams.away;
    const them = isHome ? g.teams.away : g.teams.home;
    const oppId = them.team.id;
    const abbrev = idToAbbrev.get(oppId);
    if (!abbrev) continue;

    out[abbrev] ??= { w: 0, l: 0 };
    const win =
      us.isWinner === true
        ? true
        : us.isWinner === false
          ? false
          : (us.score ?? 0) > (them.score ?? 0);
    if (win) out[abbrev].w++;
    else out[abbrev].l++;
  }
  return out;
}

export const revalidate = 3600;

export default async function HistoryPage() {
  const [rosterRes, scheduleRes, otdRes] = await Promise.allSettled([
    fetchRoster(),
    fetchSchedule(),
    loadOnThisDay(),
  ]);

  const roster = rosterRes.status === "fulfilled" ? rosterRes.value : [];
  const schedule = scheduleRes.status === "fulfilled" ? scheduleRes.value : [];
  const onThisDayData: OnThisDayData =
    otdRes.status === "fulfilled"
      ? otdRes.value
      : {
          todayLabel: new Date().toLocaleDateString("en-US", {
            timeZone: "America/Los_Angeles",
            month: "long",
            day: "numeric",
          }),
          monthDay: "",
          curated: [],
          historicalGames: [],
        };

  const snapshots = roster.length > 0 ? await loadActiveCareerSnapshots(roster) : [];
  const chaseRows = buildChaseRows(snapshots);
  const h2hThisSeason = buildThisSeasonH2H(schedule);

  return (
    <HistoryStaticContent
      chaseBarsSlot={<ChaseBars rows={chaseRows} />}
      onThisDaySlot={
        <OnThisDayCard
          todayLabel={onThisDayData.todayLabel}
          monthDay={onThisDayData.monthDay}
          curated={onThisDayData.curated}
          historicalGames={onThisDayData.historicalGames}
        />
      }
      droughtRibbonSlot={<DroughtRibbon />}
      h2hMatrixSlot={<H2HMatrix thisSeason={h2hThisSeason} />}
    />
  );
}
