'use client';

import { useEffect, useState } from 'react';
import type { MLBPitchingStats } from '@/types/mlb';
import type { SavantArsenalPitch } from './savant';

interface SavantPitcherResponse {
  arsenal: SavantArsenalPitch[];
  seasonStats: MLBPitchingStats | null;
}

export interface PitcherContext {
  loading: boolean;
  error: string | null;
  arsenal: SavantArsenalPitch[];
  seasonStats: MLBPitchingStats | null;
}

const cache = new Map<number, Promise<SavantPitcherResponse>>();

function loadPitcher(id: number): Promise<SavantPitcherResponse> {
  const existing = cache.get(id);
  if (existing) return existing;
  const promise = fetch(`/api/savant/pitcher/${id}`)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<SavantPitcherResponse>;
    })
    .catch(err => {
      cache.delete(id);
      throw err;
    });
  cache.set(id, promise);
  return promise;
}

const EMPTY: PitcherContext = {
  loading: false,
  error: null,
  arsenal: [],
  seasonStats: null,
};

export function usePitcherContext(pitcherId: number | undefined): PitcherContext {
  const [state, setState] = useState<PitcherContext>(EMPTY);

  useEffect(() => {
    if (!pitcherId) {
      setState(EMPTY);
      return;
    }
    let cancelled = false;
    setState(s => ({ ...s, loading: true, error: null }));
    loadPitcher(pitcherId)
      .then(data => {
        if (cancelled) return;
        setState({
          loading: false,
          error: null,
          arsenal: data.arsenal ?? [],
          seasonStats: data.seasonStats ?? null,
        });
      })
      .catch(err => {
        if (cancelled) return;
        setState({ ...EMPTY, error: String(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [pitcherId]);

  return state;
}
