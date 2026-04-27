'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { X, Clock } from 'lucide-react';
import { teamLogoUrl } from '@/lib/utils';
import type { ParsedLiveGame, WpaPoint } from '@/lib/live-game';
import { captionForGameResult, type Tone } from '@/lib/captions';

const DISMISS_KEY = (pk: number) => `trident:bar-dismissed:${pk}`;
const SEA_ID = 136;

function getCountdown(gameDate: string): string {
  const diff = new Date(gameDate).getTime() - Date.now();
  if (diff <= 0) return 'Starting soon';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function WpSparkline({ timeline }: { timeline: WpaPoint[] }) {
  const pts = timeline.slice(-8);
  if (pts.length < 2) return null;
  const coords = pts
    .map((p, i) => {
      const x = ((i / (pts.length - 1)) * 22 + 1).toFixed(1);
      const y = ((1 - p.homeWinProb) * 6 + 1).toFixed(1);
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg
      width="24"
      height="8"
      viewBox="0 0 24 8"
      className="flex-shrink-0 opacity-70"
      aria-hidden="true"
    >
      <polyline
        points={coords}
        fill="none"
        stroke="#00A3A3"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MiniDiamond({
  bases,
  outs,
}: {
  bases: { first: boolean; second: boolean; third: boolean };
  outs: number;
}) {
  const f = (on: boolean) => (on ? '#FFB700' : 'rgba(255,255,255,0.1)');
  return (
    <div
      className="hidden md:flex items-center gap-1.5 flex-shrink-0"
      aria-hidden="true"
    >
      <svg width="18" height="18" viewBox="0 0 20 20">
        {/* 2B top */}
        <polygon points="10,1 13,4.5 10,8 7,4.5" fill={f(bases.second)} />
        {/* 1B right */}
        <polygon points="13,4.5 16,8 13,11.5 10,8" fill={f(bases.first)} />
        {/* 3B left */}
        <polygon points="7,4.5 10,8 7,11.5 4,8" fill={f(bases.third)} />
        {/* HP */}
        <polygon
          points="10,12 12.5,14.5 11,17.5 9,17.5 7.5,14.5"
          fill="rgba(255,255,255,0.15)"
        />
      </svg>
      <div className="flex gap-0.5">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${
              i < outs ? 'bg-red-400/80' : 'bg-white/10'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

interface LiveGameBarProps {
  initialData: ParsedLiveGame;
  gameDate: string;
}

export function LiveGameBar({ initialData, gameDate }: LiveGameBarProps) {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [game, setGame] = useState<ParsedLiveGame>(initialData);
  const [tone, setTone] = useState<Tone>('spicy');
  const [flashClass, setFlashClass] = useState('');
  const [countdownText, setCountdownText] = useState(() => getCountdown(gameDate));

  const prevRef = useRef<ParsedLiveGame | null>(null);
  const isFirstRef = useRef(true);

  // Mount: read sessionStorage + tone preference
  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY(initialData.gamePk))) {
      setDismissed(true);
    }
    const saved = localStorage.getItem('trident:tone');
    if (saved === 'family' || saved === 'spicy' || saved === 'profane') {
      setTone(saved as Tone);
    }
    setMounted(true);
  }, [initialData.gamePk]);

  // Poll when live
  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/game/${initialData.gamePk}`);
      if (!res.ok) return;
      setGame((await res.json()) as ParsedLiveGame);
    } catch {
      // ignore transient errors
    }
  }, [initialData.gamePk]);

  useEffect(() => {
    if (game.state !== 'Live') return;
    const id = setInterval(poll, 15_000);
    return () => clearInterval(id);
  }, [game.state, poll]);

  // Countdown tick for Preview
  useEffect(() => {
    if (game.state !== 'Preview') return;
    const id = setInterval(() => setCountdownText(getCountdown(gameDate)), 60_000);
    return () => clearInterval(id);
  }, [game.state, gameDate]);

  // Flash on HR or lead change (skip first render)
  useEffect(() => {
    if (isFirstRef.current) {
      isFirstRef.current = false;
      prevRef.current = game;
      return;
    }
    const prev = prevRef.current;
    prevRef.current = game;
    if (!prev) return;

    const lastPlay = game.allPlays.at(-1);
    const prevLastIdx = prev.allPlays.at(-1)?.index ?? -1;
    if (!lastPlay || lastPlay.index === prevLastIdx) return;

    if (lastPlay.event === 'Home Run') {
      setFlashClass('flash-gold');
    } else {
      const lead = (g: ParsedLiveGame) =>
        g.score.home > g.score.away
          ? 'home'
          : g.score.away > g.score.home
          ? 'away'
          : 'tied';
      if (lead(prev) !== lead(game)) setFlashClass('flash-teal');
    }
  }, [game]);

  // Clear flash after animation completes
  useEffect(() => {
    if (!flashClass) return;
    const id = setTimeout(() => setFlashClass(''), 2_600);
    return () => clearTimeout(id);
  }, [flashClass]);

  // Don't render until mounted (avoids sessionStorage hydration mismatch)
  if (!mounted || dismissed) return null;

  const { state, teams, score, inning, bases, count, allPlays, wpaTimeline, linescore } =
    game;
  const isLive = state === 'Live';
  const isFinal = state === 'Final';
  const isPreview = state === 'Preview';

  const lastPlay = allPlays.at(-1);
  const inningOrdinal = linescore.innings.at(-1)?.ordinal ?? (inning ? `${inning}` : '');

  // Caption for Final
  let caption = '';
  if (isFinal) {
    const seaIsHome = teams.home.id === SEA_ID;
    const seaScore = seaIsHome ? score.home : score.away;
    const oppScore = seaIsHome ? score.away : score.home;
    const won = seaScore > oppScore;
    const caps = captionForGameResult(
      won,
      Math.abs(seaScore - oppScore),
      initialData.gamePk % 7,
      tone,
    );
    caption = caps[0]?.text ?? '';
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    sessionStorage.setItem(DISMISS_KEY(initialData.gamePk), '1');
    setDismissed(true);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`sticky top-0 md:top-14 z-40 w-full border-b border-white/[0.06] ${flashClass}`}
      style={{
        background: 'rgba(9,24,43,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="relative">
        <Link
          href={`/game/${initialData.gamePk}`}
          className="flex items-center gap-2 md:gap-3 px-3 md:px-4 h-11 md:h-[52px] pr-9 min-w-0"
        >
          {/* State pill */}
          {isLive && (
            <span className="flex items-center gap-1.5 flex-shrink-0">
              <span
                className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"
                aria-hidden="true"
              />
              <span className="text-[10px] font-bold text-emerald-400 hidden sm:inline">
                LIVE
              </span>
            </span>
          )}
          {isFinal && (
            <span className="text-[10px] font-semibold text-gray-500 flex-shrink-0">
              FINAL
            </span>
          )}
          {isPreview && (
            <span className="flex items-center gap-1 text-[10px] text-[#00A3A3] flex-shrink-0">
              <Clock size={10} aria-hidden="true" />
              <span className="hidden sm:inline">First pitch in </span>
              <span>{countdownText}</span>
            </span>
          )}

          {/* Away score */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={teamLogoUrl(teams.away.id)}
              alt={teams.away.abbrev}
              width={16}
              height={16}
              className="w-4 h-4 object-contain"
            />
            <span className="text-[11px] font-medium text-gray-400 hidden sm:inline">
              {teams.away.abbrev}
            </span>
            <span className="text-sm font-bold tabular-nums">{score.away}</span>
          </div>

          <span className="text-gray-600 text-xs flex-shrink-0">–</span>

          {/* Home score */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-sm font-bold tabular-nums">{score.home}</span>
            <span className="text-[11px] font-medium text-gray-400 hidden sm:inline">
              {teams.home.abbrev}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={teamLogoUrl(teams.home.id)}
              alt={teams.home.abbrev}
              width={16}
              height={16}
              className="w-4 h-4 object-contain"
            />
          </div>

          {/* Inning (live + final) */}
          {isLive && inning != null && (
            <span className="text-[10px] text-gray-500 flex-shrink-0">
              {inningOrdinal}
            </span>
          )}

          {/* Live-only: bases diamond, batter, last play, sparkline */}
          {isLive && (
            <>
              {bases && count != null && (
                <MiniDiamond bases={bases} outs={count.outs} />
              )}
              {game.currentBatter && (
                <span className="text-[10px] text-gray-500 hidden md:inline flex-shrink-0 truncate max-w-[110px]">
                  AB: {game.currentBatter.fullName}
                </span>
              )}
              {lastPlay && (
                <span className="text-[10px] text-gray-600 hidden lg:inline flex-1 truncate">
                  {lastPlay.description.slice(0, 55)}
                </span>
              )}
              {wpaTimeline.length >= 2 && (
                <div className="hidden md:block flex-shrink-0">
                  <WpSparkline timeline={wpaTimeline} />
                </div>
              )}
            </>
          )}

          {/* Caption for Final (desktop) */}
          {isFinal && caption && (
            <span className="text-[10px] text-gray-600 italic hidden md:inline flex-1 truncate">
              {caption}
            </span>
          )}
        </Link>

        {/* Dismiss — outside Link, absolutely positioned */}
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-gray-600 hover:text-gray-300 transition-colors"
          aria-label="Dismiss live game bar"
          onClick={handleDismiss}
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
