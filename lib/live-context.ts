'use client';

import { useEffect, useState } from 'react';

// ─── Generic cached fetch hook factory ───────────────────────────────────────

function makeCachedFetcher<T>(buildUrl: (...args: number[]) => string) {
  const cache = new Map<string, Promise<T>>();
  return function load(...args: number[]): Promise<T> {
    const key = args.join('-');
    const existing = cache.get(key);
    if (existing) return existing;
    const url = buildUrl(...args);
    const promise = fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<T>;
      })
      .catch(err => {
        cache.delete(key);
        throw err;
      });
    cache.set(key, promise);
    return promise;
  };
}

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useAsyncOnIds<T>(
  loader: (...args: number[]) => Promise<T>,
  ids: Array<number | undefined>,
): UseAsyncState<T> {
  const [state, setState] = useState<UseAsyncState<T>>({ data: null, loading: false, error: null });
  const allDefined = ids.every(id => typeof id === 'number' && id > 0);

  useEffect(() => {
    if (!allDefined) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState(s => ({ ...s, loading: true, error: null }));
    loader(...(ids as number[]))
      .then(data => {
        if (cancelled) return;
        setState({ data, loading: false, error: null });
      })
      .catch(err => {
        if (cancelled) return;
        setState({ data: null, loading: false, error: String(err) });
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...ids]);

  return state;
}

// ─── Splits (vs LHP/RHP, home/away, RISP, etc.) ─────────────────────────────

import type { SplitsResponse } from '@/app/api/splits/[playerId]/route';

const loadSplits = makeCachedFetcher<SplitsResponse>((id) => `/api/splits/${id}`);

export function useSplits(playerId: number | undefined) {
  return useAsyncOnIds(loadSplits, [playerId]);
}

// ─── Career batter-vs-pitcher H2H ────────────────────────────────────────────

import type { H2HResponse } from '@/app/api/h2h/[batterId]/[pitcherId]/route';

const loadH2H = makeCachedFetcher<H2HResponse>(
  (batterId, pitcherId) => `/api/h2h/${batterId}/${pitcherId}`,
);

export function useH2H(batterId: number | undefined, pitcherId: number | undefined) {
  return useAsyncOnIds(loadH2H, [batterId, pitcherId]);
}

// ─── Career stats vs a team ──────────────────────────────────────────────────

import type { VsTeamResponse } from '@/app/api/vs-team/[playerId]/[teamId]/route';

const loadVsTeam = makeCachedFetcher<VsTeamResponse>(
  (playerId, teamId) => `/api/vs-team/${playerId}/${teamId}`,
);

export function useVsTeam(playerId: number | undefined, teamId: number | undefined) {
  return useAsyncOnIds(loadVsTeam, [playerId, teamId]);
}

// ─── Career stats at a venue ─────────────────────────────────────────────────

import type { AtVenueResponse } from '@/app/api/at-venue/[playerId]/[venueId]/route';

const loadAtVenue = makeCachedFetcher<AtVenueResponse>(
  (playerId, venueId) => `/api/at-venue/${playerId}/${venueId}`,
);

export function useAtVenue(playerId: number | undefined, venueId: number | undefined) {
  return useAsyncOnIds(loadAtVenue, [playerId, venueId]);
}

// ─── Catcher defense (pop time, framing) ────────────────────────────────────

import type { CatcherDefenseResponse } from '@/app/api/savant/catcher/[id]/route';

const loadCatcherDefense = makeCachedFetcher<CatcherDefenseResponse>(
  (id) => `/api/savant/catcher/${id}`,
);

export function useCatcherDefense(catcherId: number | undefined) {
  return useAsyncOnIds(loadCatcherDefense, [catcherId]);
}

// ─── Game log (rolling form) ─────────────────────────────────────────────────

import type { MLBHittingStats, MLBPitchingStats } from '@/types/mlb';

interface GameLogResponse<S> {
  log: Array<{ date: string; opponent?: string; isHome?: boolean; stat: S }>;
}

const loadHittingLog = makeCachedFetcher<GameLogResponse<MLBHittingStats>>(
  (id) => `/api/player-log/${id}/hitting`,
);

const loadPitchingLog = makeCachedFetcher<GameLogResponse<MLBPitchingStats>>(
  (id) => `/api/player-log/${id}/pitching`,
);

export function useHittingLog(playerId: number | undefined) {
  return useAsyncOnIds(loadHittingLog, [playerId]);
}

export function usePitchingLog(playerId: number | undefined) {
  return useAsyncOnIds(loadPitchingLog, [playerId]);
}
