"use client";

import { useEffect, useState, useCallback } from "react";
import { ComparisonTool, buildComparePlayers, type ComparePlayer } from "@/components/comparison-tool";
import { calcAdvancedHitting, calcAdvancedPitching } from "@/lib/calc-stats";
import { GHOST_ROSTER_2001 } from "@/lib/ghost-teams";
import type { MLBHittingStats, MLBPitchingStats } from "@/types/mlb";
import { playerHeadshotUrl } from "@/lib/utils";

interface RosterEntry {
  person: { id: number; fullName: string };
  position: { abbreviation: string };
}

async function loadPlayers(): Promise<ComparePlayer[]> {
  const SEASON = new Date().getFullYear();
  const rosterRes = await fetch(
    `https://statsapi.mlb.com/api/v1/teams/136/roster?rosterType=active&season=${SEASON}`
  );
  const rosterData = await rosterRes.json();
  const roster: RosterEntry[] = rosterData.roster ?? [];

  const players = await Promise.allSettled(
    roster.slice(0, 30).map(async (p) => {
      const isPitcher =
        p.position.abbreviation === "SP" ||
        p.position.abbreviation === "RP" ||
        p.position.abbreviation === "P";

      const statsRes = await fetch(
        `https://statsapi.mlb.com/api/v1/people/${p.person.id}/stats?stats=season&group=${isPitcher ? "pitching" : "hitting"}&season=${SEASON}`
      );
      const statsData = await statsRes.json();
      const splits = statsData.stats?.[0]?.splits ?? [];
      const seasonStats = splits[0]?.stat ?? {};

      let advancedStats: Record<string, number> = {};
      try {
        if (isPitcher) {
          const adv = calcAdvancedPitching(seasonStats as MLBPitchingStats);
          advancedStats = adv as unknown as Record<string, number>;
        } else {
          const adv = calcAdvancedHitting(seasonStats as MLBHittingStats);
          advancedStats = adv as unknown as Record<string, number>;
        }
      } catch {
        // use empty advanced stats
      }

      return {
        id: p.person.id,
        name: p.person.fullName,
        position: p.position.abbreviation,
        isPitcher,
        headshot: playerHeadshotUrl(p.person.id),
        seasonStats,
        advancedStats,
      };
    })
  );

  const valid = players
    .filter((r) => r.status === "fulfilled")
    .map(
      (r) =>
        (
          r as PromiseFulfilledResult<{
            id: number;
            name: string;
            position: string;
            isPitcher: boolean;
            headshot: string;
            seasonStats: Record<string, number | string>;
            advancedStats: Record<string, number>;
          }>
        ).value
    );

  return buildComparePlayers(valid);
}

export default function ComparePage() {
  const [players, setPlayers] = useState<ComparePlayer[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [active, ghosts] = await Promise.all([
        loadPlayers(),
        Promise.resolve(buildComparePlayers(GHOST_ROSTER_2001)),
      ]);
      setPlayers([...active, ...ghosts]);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-primary tracking-tight">
          ⚔️ Player Comparison
        </h1>
        <p className="text-sm text-secondary mt-0.5">
          Compare up to 5 Mariners — current roster + 👻 2001 ghosts.
        </p>
      </div>

      {loading && (
        <div className="trident-card p-8 text-center">
          <div className="w-6 h-6 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-secondary text-sm">Loading roster stats…</p>
        </div>
      )}

      {!loading && players.length >= 2 && (
        <ComparisonTool players={players} />
      )}

      {!loading && players.length < 2 && (
        <div className="trident-card p-8 text-center">
          <p className="text-secondary">Not enough players with stats to compare yet.</p>
        </div>
      )}
    </div>
  );
}
