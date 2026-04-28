'use client';

import { useEffect, useState } from 'react';
import type { SavantPitch, BatterStatcastSummary } from './savant';
import { computeBatterStatcastSummary, batterZoneStats } from './savant';

interface SavantBatterResponse {
  pitches: SavantPitch[];
  expected: {
    estBA?: number;
    estSLG?: number;
    estWOBA?: number;
    brlPct?: number;
    hardHitPct?: number;
    avgExitVelo?: number;
  } | null;
  sprintSpeed: number | null;
}

export interface BatterContext {
  loading: boolean;
  error: string | null;
  /** Heatmap rows in the format StrikeZoneLive expects (zone 1..9, intensity 0..1). */
  heatmap: { zone: number; intensity: number }[];
  /** Per-zone batting average for display in tooltip / legend. */
  zoneStats: ReturnType<typeof batterZoneStats>;
  summary: BatterStatcastSummary | null;
  expected: SavantBatterResponse['expected'];
  totalPitches: number;
}

const cache = new Map<number, Promise<SavantBatterResponse>>();

function loadBatter(id: number): Promise<SavantBatterResponse> {
  const existing = cache.get(id);
  if (existing) return existing;
  const promise = fetch(`/api/savant/batter/${id}`)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<SavantBatterResponse>;
    })
    .catch(err => {
      cache.delete(id);
      throw err;
    });
  cache.set(id, promise);
  return promise;
}

const EMPTY: BatterContext = {
  loading: false,
  error: null,
  heatmap: [],
  zoneStats: [],
  summary: null,
  expected: null,
  totalPitches: 0,
};

export function useBatterContext(batterId: number | undefined): BatterContext {
  const [state, setState] = useState<BatterContext>(EMPTY);

  useEffect(() => {
    if (!batterId) {
      setState(EMPTY);
      return;
    }
    let cancelled = false;
    setState(s => ({ ...s, loading: true, error: null }));
    loadBatter(batterId)
      .then(data => {
        if (cancelled) return;
        const zoneStats = batterZoneStats(data.pitches);
        // Build a heatmap by SLG (better signal than BA) — fall back to swing rate.
        const slgs = zoneStats.filter(z => z.zone >= 1 && z.zone <= 9).map(z => z.slg);
        const maxSlg = Math.max(0.001, ...slgs);
        const heatmap = zoneStats
          .filter(z => z.zone >= 1 && z.zone <= 9)
          .map(z => ({ zone: z.zone, intensity: z.slg / maxSlg }));
        const summary = computeBatterStatcastSummary(data.pitches);
        setState({
          loading: false,
          error: null,
          heatmap,
          zoneStats,
          summary,
          expected: data.expected,
          totalPitches: data.pitches.length,
        });
      })
      .catch(err => {
        if (cancelled) return;
        setState({ ...EMPTY, error: String(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [batterId]);

  return state;
}
