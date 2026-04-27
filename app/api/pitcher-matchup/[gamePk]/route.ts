import { NextResponse } from "next/server";
import { fetchPlayerSeasonStats, fetchPlayerGameLog } from "@/lib/mlb-api";
import { calcAdvancedPitching } from "@/lib/calc-stats";
import { parseIP } from "@/lib/bullpen";
import type { MLBPitchingStats } from "@/types/mlb";

const BASE = "https://statsapi.mlb.com/api/v1";

export interface PitcherMatchupSide {
  playerId: number;
  fullName: string;
  jersey: string;
  throws: string;
  headshotUrl: string;
  seasonERA: string;
  seasonFIP: string;
  seasonWHIP: string;
  seasonK9: string;
  seasonBB9: string;
  seasonHR9: string;
  seasonIP: string;
  record: string;         // "W-L"
  last3ERA: string | null;
  last5ERA: string | null;
  last5Sparkline: number[];
  lastOuting: { date: string; ip: string; er: number; gamePk?: number } | null;
}

export interface PitcherMatchupData {
  gamePk: number;
  away: PitcherMatchupSide | null;
  home: PitcherMatchupSide | null;
}

async function buildSide(
  playerId: number,
  fallbackName: string,
  jersey: string,
  throws: string
): Promise<PitcherMatchupSide> {
  const [seasonRaw, gameLogRaw] = await Promise.allSettled([
    fetchPlayerSeasonStats(playerId, "pitching"),
    fetchPlayerGameLog(playerId, "pitching"),
  ]);

  const season =
    seasonRaw.status === "fulfilled"
      ? (seasonRaw.value as MLBPitchingStats | null)
      : null;

  const logs =
    gameLogRaw.status === "fulfilled" ? gameLogRaw.value : [];

  // Most-recent first (fetchPlayerGameLog reverses to newest-first)
  const recentLogs = logs
    .slice(0, 5)
    .map((e) => ({ ...e, stat: e.stat as MLBPitchingStats }));

  function logERA(entries: typeof recentLogs): string | null {
    if (entries.length === 0) return null;
    const totalIP = entries.reduce((s, e) => s + parseIP(e.stat.inningsPitched), 0);
    const totalER = entries.reduce((s, e) => s + (e.stat.earnedRuns ?? 0), 0);
    if (totalIP <= 0) return null;
    return ((totalER * 9) / totalIP).toFixed(2);
  }

  const last3ERA = logERA(recentLogs.slice(0, 3));
  const last5ERA = logERA(recentLogs);

  // Sparkline: ERA per outing (last 5, oldest→newest)
  const last5Sparkline = [...recentLogs]
    .reverse()
    .map((e) => {
      const ip = parseIP(e.stat.inningsPitched);
      const er = e.stat.earnedRuns ?? 0;
      return ip > 0 ? parseFloat(((er * 9) / ip).toFixed(2)) : 0;
    });

  const lastEntry = recentLogs[0] ?? null;
  const lastOuting = lastEntry
    ? {
        date: lastEntry.date,
        ip: lastEntry.stat.inningsPitched,
        er: lastEntry.stat.earnedRuns ?? 0,
      }
    : null;

  // Season stats
  const adv = season ? calcAdvancedPitching(season) : null;
  const ip = season ? parseIP(season.inningsPitched) : 0;

  return {
    playerId,
    fullName: fallbackName,
    jersey,
    throws,
    headshotUrl: `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_120,q_auto:best/v1/people/${playerId}/headshot/67/current`,
    seasonERA: season?.era ?? "—",
    seasonFIP: adv ? adv.fip.toFixed(2) : "—",
    seasonWHIP: season?.whip ?? "—",
    seasonK9: season?.strikeoutsPer9Inn ?? (adv ? (adv.kPct > 0 && ip > 0 ? ((season?.strikeOuts ?? 0) * 9 / ip).toFixed(1) : "—") : "—"),
    seasonBB9: season?.walksPer9Inn ?? "—",
    seasonHR9: adv ? adv.hr9.toFixed(2) : "—",
    seasonIP: ip > 0 ? ip.toFixed(1) : "—",
    record: season ? `${season.wins}-${season.losses}` : "0-0",
    last3ERA,
    last5ERA,
    last5Sparkline,
    lastOuting,
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ gamePk: string }> }
) {
  const { gamePk: gamePkStr } = await params;
  const gamePk = Number(gamePkStr);

  if (!Number.isFinite(gamePk) || gamePk <= 0) {
    return NextResponse.json({ gamePk, away: null, home: null });
  }

  try {
    // Fetch game feed for probable pitcher IDs
    const feedUrl = `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`;
    const feedRes = await fetch(feedUrl, { next: { revalidate: 600 } });
    if (!feedRes.ok) {
      return NextResponse.json({ gamePk, away: null, home: null });
    }

    const feed = await feedRes.json() as {
      gameData?: {
        probablePitchers?: {
          away?: { id: number; fullName: string; primaryNumber?: string; pitchHand?: { code: string } };
          home?: { id: number; fullName: string; primaryNumber?: string; pitchHand?: { code: string } };
        };
        // Fallback: players map
        players?: Record<string, { id: number; fullName: string; primaryNumber?: string; pitchHand?: { code: string } }>;
        // Also check boxscore
        teams?: {
          away?: { probablePitcher?: { id: number; fullName: string } };
          home?: { probablePitcher?: { id: number; fullName: string } };
        };
      };
    };

    const prob = feed.gameData?.probablePitchers;
    const awayPitcher = prob?.away;
    const homePitcher = prob?.home;

    // Fetch player bio to get jersey and throws
    async function getPlayerMeta(id: number): Promise<{ jersey: string; throws: string }> {
      try {
        const r = await fetch(`${BASE}/people/${id}`, { next: { revalidate: 86400 } });
        if (!r.ok) return { jersey: "—", throws: "R" };
        const d = await r.json() as { people?: Array<{ primaryNumber?: string; pitchHand?: { code: string } }> };
        const p = d.people?.[0];
        return { jersey: p?.primaryNumber ?? "—", throws: p?.pitchHand?.code ?? "R" };
      } catch {
        return { jersey: "—", throws: "R" };
      }
    }

    const [awaySide, homeSide] = await Promise.all([
      awayPitcher
        ? getPlayerMeta(awayPitcher.id).then((meta) =>
            buildSide(awayPitcher.id, awayPitcher.fullName, meta.jersey, meta.throws)
          )
        : Promise.resolve(null),
      homePitcher
        ? getPlayerMeta(homePitcher.id).then((meta) =>
            buildSide(homePitcher.id, homePitcher.fullName, meta.jersey, meta.throws)
          )
        : Promise.resolve(null),
    ]);

    const result: PitcherMatchupData = { gamePk, away: awaySide, home: homeSide };

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=600" },
    });
  } catch (err) {
    console.error("[/api/pitcher-matchup]", err);
    return NextResponse.json({ gamePk, away: null, home: null });
  }
}
