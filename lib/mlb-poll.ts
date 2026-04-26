"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export interface PollState<T> {
  data: T | null;
  lastUpdated: Date | null;
  isStale: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function usePoll<T>(
  fetcher: () => Promise<T>,
  intervalMs: number
): PollState<T> {
  const [data, setData] = useState<T | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      setData(result);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fetch failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  const staleCutoff = intervalMs * 2;
  const isStale = lastUpdated
    ? Date.now() - lastUpdated.getTime() > staleCutoff
    : false;

  return { data, lastUpdated, isStale, loading, error, refresh };
}

export function useLastUpdatedLabel(date: Date | null): string {
  const [label, setLabel] = useState("—");

  useEffect(() => {
    if (!date) return;
    const update = () => {
      const secs = Math.floor((Date.now() - date.getTime()) / 1000);
      if (secs < 10) setLabel("just now");
      else if (secs < 60) setLabel(`${secs}s ago`);
      else if (secs < 3600) setLabel(`${Math.floor(secs / 60)}m ago`);
      else setLabel(date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
    };
    update();
    const id = setInterval(update, 5000);
    return () => clearInterval(id);
  }, [date]);

  return label;
}
