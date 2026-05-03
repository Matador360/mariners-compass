'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { ParsedLiveGame, ParsedPitch, PersonRef } from '@/lib/live-game';
import {
  currentAtBat,
  categorizePitch,
  PITCH_COLORS,
  PITCH_LABELS,
  pitchCountToday,
  pitcherStatsToday,
  batterLineToday,
  nextPitchOdds,
  fatigueScore,
  velocityDecay,
  tunnelingScore,
  tridentScore,
  batterKpct,
  batterBBpct,
  pitcherKpct,
  pitcherBBpct,
  umpireScorecard,
  type PitchCategory,
} from '@/lib/at-bat';
import { useBatterContext } from '@/lib/batter-context';
import { usePitcherContext } from '@/lib/pitcher-context';
import { useSplits, useH2H, useVsTeam, useAtVenue, useHittingLog, usePitchingLog } from '@/lib/live-context';
import { teamLogoUrl, playerHeadshotLargeUrl, cn } from '@/lib/utils';
import { StatClickable } from '@/components/stat-explainer';
import { liveOnBaseOdds, liveHitProb, liveKRisk, liveBBProb, countLean } from '@/lib/live-odds';
import { runExpectancy, reDeltaIfReaches, isRISP, baseStateLabel } from '@/lib/run-expectancy';
import { parkFactor, weatherHRModifier, weatherEffectLabel } from '@/lib/park-factors';
import { computeHotScore, computePitcherHotScore, rollingHitting, rollingPitching, hitStreak, multiHitGames } from '@/lib/calc-stats';
import type { MLBHittingStats, MLBPitchingStats } from '@/types/mlb';
import { StrikeZoneLive } from './charts/strike-zone-live';

const TEAM_TEAL = '#00A3A3';
const TEAM_GOLD = '#FFB700';
const MARINERS_ID = 136;

// ─── Tiny helpers ────────────────────────────────────────────────────────────

function fmt3(n?: number | null): string {
  if (n == null || !isFinite(n)) return '—';
  return n.toFixed(3).replace(/^0/, '');
}

function fmtPct(n?: number | null, digits = 0): string {
  if (n == null || !isFinite(n)) return '—';
  return `${(n * 100).toFixed(digits)}%`;
}

function strOr(v: string | number | undefined | null, fb = '—'): string {
  if (v == null || v === '') return fb;
  return String(v);
}

function FreshnessAge({ fetchedAt }: { fetchedAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const ageSec = Math.max(0, Math.round((now - fetchedAt) / 1000));
  const stale = ageSec >= 11;
  return (
    <span className={`text-[9px] tabular-nums ${stale ? 'text-amber-400' : 'text-gray-500'}`}>
      {ageSec}s
    </span>
  );
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function CountDots({ filled, total, color }: { filled: number; total: number; color: string }) {
  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="h-[7px] w-[7px] rounded-full"
          style={{
            background: i < filled ? color : 'rgba(255,255,255,0.10)',
            boxShadow: i < filled ? `0 0 6px ${color}80` : 'none',
          }}
        />
      ))}
    </div>
  );
}

function BasesGlyph({ bases }: { bases?: { first: boolean; second: boolean; third: boolean } }) {
  const on = (b?: boolean) => (b ? TEAM_GOLD : 'rgba(255,255,255,0.12)');
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-label="bases">
      <polygon points="12,1 16,5 12,9 8,5" fill={on(bases?.second)} stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
      <polygon points="19,8 23,12 19,16 15,12" fill={on(bases?.first)} stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
      <polygon points="5,8 9,12 5,16 1,12" fill={on(bases?.third)} stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
    </svg>
  );
}

/** Clickable stat tile that opens the StatExplainer on tap. */
function LiveStat({
  statKey, label, value, accent, emphasize, sub, tone,
}: {
  statKey: string;
  label: string;
  value: React.ReactNode;
  accent?: string;
  emphasize?: boolean;
  sub?: React.ReactNode;
  tone?: 'good' | 'bad' | 'neutral';
}) {
  const valueStr = typeof value === 'number' ? String(value) : (typeof value === 'string' ? value : '—');
  const color = tone === 'good' ? '#4ade80' : tone === 'bad' ? '#f87171' : (accent ?? '#e5e7eb');
  return (
    <StatClickable statKey={statKey} value={valueStr}>
      <div className="flex flex-col items-center justify-center leading-none rounded bg-white/[0.025] px-0.5 py-1.5 min-h-[42px]">
        <span
          className={`tabular-nums font-semibold ${emphasize ? 'text-[13px]' : 'text-[11px]'}`}
          style={{ color }}
        >
          {value}
        </span>
        <span className="mt-[3px] text-[8px] uppercase tracking-wider text-gray-500">{label}</span>
        {sub && <span className="mt-0.5 text-[8.5px] text-gray-500 tabular-nums">{sub}</span>}
      </div>
    </StatClickable>
  );
}

function PitchPip({ p }: { p: ParsedPitch }) {
  const cat = categorizePitch(p);
  const color = cat ? PITCH_COLORS[cat] : '#6b7280';
  const code = p.type?.code ?? '?';
  const speed = p.speed != null ? Math.round(p.speed) : null;
  return (
    <div
      className="flex items-center gap-1 rounded border border-white/10 bg-white/[0.03] px-1.5 py-[3px] text-[10px] tabular-nums leading-none"
      title={`${p.type?.description ?? code}${speed ? ` · ${speed} mph` : ''} · ${cat ? PITCH_LABELS[cat] : ''}`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 4px ${color}90` }} />
      <span className="font-semibold text-gray-200">{code}</span>
      {speed != null && <span className="text-gray-400">{speed}</span>}
    </div>
  );
}

function NextUpChip({ label, person }: { label: string; person: PersonRef }) {
  const last = person.fullName.split(' ').slice(-1)[0];
  return (
    <Link
      href={`/players/${person.id}`}
      className="inline-flex items-center gap-1 text-[10px] leading-none hover:text-teal-300 transition-colors"
    >
      <span className="text-[8px] uppercase tracking-wider text-gray-600">{label}</span>
      <span className="text-gray-300 truncate max-w-[110px]">{last}</span>
    </Link>
  );
}

function SectionHeading({ title, accent = TEAM_GOLD, sub }: { title: string; accent?: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between mt-3 mb-1.5 first:mt-1">
      <div className="flex items-center gap-1.5">
        <span className="h-[10px] w-[3px] rounded-full" style={{ background: accent }} />
        <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: accent }}>{title}</span>
      </div>
      {sub && <span className="text-[9px] text-gray-500 tabular-nums">{sub}</span>}
    </div>
  );
}

/** A single highlightable split row tile. */
function SplitTile({
  statKey, label, ops, ab, highlight,
}: { statKey: string; label: string; ops: string; ab: string | number; highlight?: boolean }) {
  return (
    <StatClickable statKey={statKey} value={ops}>
      <div className={cn(
        'flex flex-col items-center rounded border px-1 py-1.5 leading-none transition-colors',
        highlight ? 'border-teal-400/60 bg-teal-400/[0.07]' : 'border-white/5 bg-white/[0.02]',
      )}>
        <span className="text-[8px] uppercase tracking-wider text-gray-500">{label}</span>
        <span className={cn('mt-1 text-[12px] font-bold tabular-nums', highlight ? 'text-teal-300' : 'text-gray-200')}>
          {ops}
        </span>
        <span className="text-[8.5px] text-gray-500 tabular-nums mt-0.5">{ab}</span>
      </div>
    </StatClickable>
  );
}

/** Last 10 PA outcome dots — colored by event type. */
function PaSequenceDots({ events }: { events: string[] }) {
  if (events.length === 0) return null;
  return (
    <div className="flex gap-1 items-center">
      {events.slice(-10).map((e, i) => {
        const ev = e.toLowerCase();
        let color = '#6b7280';
        let title = e;
        if (ev.includes('home_run')) { color = TEAM_GOLD; title = 'HR'; }
        else if (ev === 'single' || ev.includes('1b')) { color = '#22c55e'; title = '1B'; }
        else if (ev === 'double' || ev.includes('2b')) { color = '#15803d'; title = '2B'; }
        else if (ev === 'triple' || ev.includes('3b')) { color = '#65a30d'; title = '3B'; }
        else if (ev.includes('walk')) { color = '#3b82f6'; title = 'BB'; }
        else if (ev.includes('strikeout')) { color = '#ef4444'; title = 'K'; }
        return (
          <span
            key={i}
            className="h-2 w-2 rounded-full"
            style={{ background: color, boxShadow: `0 0 4px ${color}80` }}
            title={title}
          />
        );
      })}
    </div>
  );
}

/** Horizontal stacked bar of pitch arsenal usage. */
function ArsenalBar({ rows }: { rows: Array<{ code: string; pct: number }> }) {
  if (rows.length === 0) return null;
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/[0.03] border border-white/5">
      {rows.map((r) => {
        // Map raw pitch code to category for color
        const lookup: Record<string, PitchCategory> = {
          FF: 'in-play', SI: 'in-play', FT: 'in-play', FC: 'foul',
          SL: 'swinging-strike', CU: 'swinging-strike', KC: 'swinging-strike', SV: 'swinging-strike',
          CH: 'ball', FS: 'ball', SC: 'ball',
        };
        const cat = lookup[r.code];
        const color = cat ? PITCH_COLORS[cat] : '#6b7280';
        return (
          <div
            key={r.code}
            className="h-full"
            style={{ width: `${r.pct * 100}%`, background: color }}
            title={`${r.code} ${(r.pct * 100).toFixed(0)}%`}
          />
        );
      })}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

interface Props {
  game: ParsedLiveGame;
}

export function LiveAtBat({ game }: Props) {
  const ab = useMemo(() => currentAtBat(game), [game]);
  const batterId = ab?.play.batter.id ?? game.currentBatter?.id;
  const pitcherId = ab?.play.pitcher.id ?? game.currentPitcher?.id;
  const batter = useBatterContext(batterId);
  const pitcher = usePitcherContext(pitcherId);
  const splits = useSplits(batterId);
  const pitcherSplits = useSplits(pitcherId);
  const h2h = useH2H(batterId, pitcherId);

  // Determine which team this batter plays for to look up vs-team for him.
  const battingTeamId = game.inningHalf === 'top' ? game.teams.away.id : game.teams.home.id;
  const pitchingTeamId = game.inningHalf === 'top' ? game.teams.home.id : game.teams.away.id;
  const venueId = game.venue?.id;

  const vsTeamBatter = useVsTeam(batterId, pitchingTeamId);
  const atVenueBatter = useAtVenue(batterId, venueId);
  const vsTeamPitcher = useVsTeam(pitcherId, battingTeamId);

  const batterLog = useHittingLog(batterId);
  const pitcherLog = usePitchingLog(pitcherId);

  if (!ab) return null;
  if (game.state !== 'Live' && !ab.isComplete) return null;

  const { play, pitches, zone } = ab;
  const balls = game.count?.balls ?? 0;
  const strikes = game.count?.strikes ?? 0;
  const outs = game.count?.outs ?? 0;
  const halfLabel = game.inningHalf === 'top' ? 'TOP' : game.inningHalf === 'bottom' ? 'BOT' : '';

  const batSide = game.currentMatchup?.batSide ?? (play.batSide as 'L' | 'R' | undefined);
  const pitchHand = game.currentMatchup?.pitchHand ?? (play.pitchHand as 'L' | 'R' | undefined);

  const batterMeta = game.players?.[play.batter.id];
  const pitcherMeta = game.players?.[play.pitcher.id];

  const batterLine = batterLineToday(game, play.batter.id);
  const pitcherLine = pitcherStatsToday(game, play.pitcher.id);
  const bs = batter.seasonStats;
  const ps = pitcher.seasonStats;

  const dist = pitches.reduce<Record<PitchCategory, number>>(
    (acc, p) => {
      const c = categorizePitch(p);
      if (c) acc[c] = (acc[c] ?? 0) + 1;
      return acc;
    },
    {} as Record<PitchCategory, number>,
  );

  const lastPitch = pitches[pitches.length - 1];
  const lastCat = lastPitch ? categorizePitch(lastPitch) : undefined;
  const prevPitch = pitches.length >= 2 ? pitches[pitches.length - 2] : null;
  const tnl = prevPitch && lastPitch ? tunnelingScore(prevPitch, lastPitch) : null;

  // Mariners team accent on whichever team is currently at bat.
  const seaAtBat = battingTeamId === MARINERS_ID;
  const batterAccent = seaAtBat ? TEAM_TEAL : '#cbd5e1';
  const pitcherAccent = !seaAtBat ? TEAM_TEAL : '#cbd5e1';

  const todayLineBatter = (() => {
    const parts: string[] = [batterLine.hab];
    if (batterLine.homeRuns) parts.push(`${batterLine.homeRuns} HR`);
    if (batterLine.rbi) parts.push(`${batterLine.rbi} RBI`);
    if (batterLine.walks) parts.push(`${batterLine.walks} BB`);
    if (batterLine.strikeouts) parts.push(`${batterLine.strikeouts} K`);
    return parts.join(', ');
  })();

  const todayLinePitcher = (() => {
    const parts: string[] = [`${pitcherLine.ip} IP`];
    parts.push(`${pitcherLine.pitches}P/${pitcherLine.strikes}S`);
    if (pitcherLine.strikeouts) parts.push(`${pitcherLine.strikeouts} K`);
    if (pitcherLine.walks) parts.push(`${pitcherLine.walks} BB`);
    if (pitcherLine.hits) parts.push(`${pitcherLine.hits} H`);
    if (pitcherLine.runs) parts.push(`${pitcherLine.runs} R`);
    return parts.join(', ');
  })();

  const homeUmp = game.umpires.find(u => u.officialType === 'Home Plate');

  // ─── Live odds ──────────────────────────────────────────────────────────
  const seasonOBP = bs?.obp ? parseFloat(bs.obp) : 0.317;
  const seasonXBA = batter.expected?.estBA ?? 0.245;
  const obpLive = liveOnBaseOdds(seasonOBP, balls, strikes);
  const obpDelta = obpLive - seasonOBP;
  const hitProb = liveHitProb(seasonXBA, balls, strikes);
  const lean = countLean(balls, strikes);

  const pK = ps ? pitcherKpct({ strikeOuts: ps.strikeOuts, battersFaced: ps.battersFaced }) : 0.22;
  const bK = bs ? batterKpct({ strikeOuts: bs.strikeOuts, plateAppearances: bs.plateAppearances }) : 0.22;
  const pBB = ps ? pitcherBBpct({ baseOnBalls: ps.baseOnBalls, battersFaced: ps.battersFaced }) : 0.085;
  const bBB = bs ? batterBBpct({ baseOnBalls: bs.baseOnBalls, plateAppearances: bs.plateAppearances }) : 0.085;
  const kRisk = liveKRisk(pK, bK, balls, strikes);
  const bbProbReal = liveBBProb(pBB, bBB, balls, strikes);

  const lev = game.leverageTimeline.length > 0 ? game.leverageTimeline[game.leverageTimeline.length - 1].leverageIndex : 1.0;
  const re = game.bases ? runExpectancy(game.bases, outs) : 0;
  const reDelta = game.bases ? reDeltaIfReaches(game.bases, outs) : 0;

  // ─── Recent form ────────────────────────────────────────────────────────
  const hitLog = (batterLog.data?.log ?? []) as Array<{ date: string; stat: MLBHittingStats }>;
  const pitLog = (pitcherLog.data?.log ?? []) as Array<{ date: string; stat: MLBPitchingStats }>;
  const l7 = rollingHitting(hitLog, 7);
  const l15 = rollingHitting(hitLog, 15);
  const seasonOPS = bs?.ops ? parseFloat(bs.ops) : 0;
  const recentOPS = l7.ops || l15.ops;
  const hot = computeHotScore(recentOPS, seasonOPS, l7.games || l15.games);
  const hitStrk = hitStreak(hitLog);
  const mh10 = multiHitGames(hitLog, 10);

  const pL3 = rollingPitching(pitLog, 3);
  const pL5 = rollingPitching(pitLog, 5);
  const pHot = ps?.era ? computePitcherHotScore(pL5.era, parseFloat(ps.era), pL5.ip) : 50;

  // ─── Splits highlight selection ─────────────────────────────────────────
  const hSp = splits.data?.hitting ?? {};
  const pSp = pitcherSplits.data?.pitching ?? {};

  const isHome = battingTeamId !== MARINERS_ID
    ? game.inningHalf === 'top'
    : game.inningHalf === 'bottom';
  // Active splits to highlight
  const activeBatVsHand = pitchHand === 'L' ? 'vl' : 'vr';
  const activeBatLoc = isHome ? 'h' : 'a';

  // Pitcher splits keyed by batter-hand
  const activePitchVsHand = batSide === 'L' ? 'vl' : 'vr';
  const activePitchLoc = pitchingTeamId !== MARINERS_ID
    ? game.inningHalf === 'top'
      ? 'h'
      : 'a'
    : game.inningHalf === 'bottom'
      ? 'h'
      : 'a';

  // ─── Pressure / Trident ────────────────────────────────────────────────
  const scoreMargin = Math.abs(game.score.home - game.score.away);
  const trident = tridentScore({
    batterHot: hot,
    pitcherHot: pHot,
    leverageIdx: lev,
    balls, strikes,
    scoreMargin,
    inning: game.inning,
  });

  // ─── Park & weather ─────────────────────────────────────────────────────
  const park = parkFactor(venueId);
  const tempNum = game.weather?.temp ? parseFloat(game.weather.temp) : null;
  const windSpeed = game.weather?.wind ? parseFloat(game.weather.wind) : null;
  const windDir = game.weather?.wind ?? '';
  const wMod = weatherHRModifier({
    condition: game.weather?.condition,
    tempF: tempNum,
    wind: windSpeed != null ? { speed: windSpeed, dir: windDir } : null,
    isDome: false,
  });

  // ─── Umpire ─────────────────────────────────────────────────────────────
  const ump = umpireScorecard(game);

  // ─── Pitcher arsenal — usage and next-pitch prediction ─────────────────
  const arsenalSeasonRows = (pitcher.arsenal ?? []).map(a => ({
    code: a.pitchType ?? 'UN',
    name: a.pitchName ?? a.pitchType ?? 'Unknown',
    pct: (a.usagePct ?? 0) / 100,
    velo: a.velocity,
    spin: a.spin,
    whiffPct: a.whiffPct ? a.whiffPct / 100 : undefined,
    putAwayPct: a.putAwayPct ? a.putAwayPct / 100 : undefined,
  })).sort((a, b) => b.pct - a.pct);
  const nextOdds = nextPitchOdds(game, play.pitcher.id, balls, strikes,
    arsenalSeasonRows.map(r => ({ code: r.code, name: r.name, count: 0, pct: r.pct, whiffPct: r.whiffPct, putAways: 0 })));
  const topPitch = nextOdds[0];

  // ─── Fatigue ────────────────────────────────────────────────────────────
  const fatigue = fatigueScore(game, play.pitcher.id, ps);
  const veloDecay = velocityDecay(game, play.pitcher.id);

  // ─── PA outcome events for last-10 dots ────────────────────────────────
  const recentPaEvents = useMemo(() => {
    const evs: string[] = [];
    for (const p of game.allPlays) {
      if (p.batter.id !== play.batter.id) continue;
      if (!p.isComplete) continue;
      const ev = (p.eventType ?? p.event ?? '').toLowerCase().replace(/\s+/g, '_');
      if (ev) evs.push(ev);
    }
    // Also append from gameLog if very few in-game events.
    return evs;
  }, [game.allPlays, play.batter.id]);

  return (
    <div className="trident-card trident-card-glow p-3 space-y-2" data-testid="live-at-bat">
      {/* ─── Row 1: status strip ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 text-[11px] leading-none">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center gap-1 font-bold text-emerald-400 uppercase tracking-wider">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
            Live
          </span>
          {halfLabel && game.inning != null && (
            <span className="font-mono text-gray-200 tabular-nums">
              <span style={{ color: TEAM_GOLD }}>{game.inningHalf === 'top' ? '▲' : '▼'}</span>{' '}
              {halfLabel} {game.inning}
            </span>
          )}
          <BasesGlyph bases={game.bases} />
        </div>

        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1">
            <span className="text-[9px] font-bold uppercase text-gray-500">B</span>
            <CountDots filled={balls} total={3} color="#3b82f6" />
          </span>
          <span className="flex items-center gap-1">
            <span className="text-[9px] font-bold uppercase text-gray-500">S</span>
            <CountDots filled={strikes} total={2} color="#ef4444" />
          </span>
          <span className="flex items-center gap-1">
            <span className="text-[9px] font-bold uppercase text-gray-500">O</span>
            <CountDots filled={outs} total={2} color={TEAM_GOLD} />
          </span>
          <FreshnessAge fetchedAt={game.fetchedAt} />
        </div>
      </div>

      {/* ─── Row 2: scoreboard ──────────────────────── */}
      <div className="grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-2 rounded bg-black/30 px-2 py-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={teamLogoUrl(game.teams.away.id)} alt={game.teams.away.abbrev} width={28} height={28} className="h-7 w-7 object-contain" />
        <div className="leading-tight">
          <div className={`text-[12px] font-bold ${game.inningHalf === 'top' ? 'text-white' : 'text-gray-400'}`}>
            {game.teams.away.abbrev}
            {game.inningHalf === 'top' && <span className="ml-1" style={{ color: TEAM_GOLD }}>●</span>}
          </div>
          {game.teams.away.record && (
            <div className="text-[9px] text-gray-500 tabular-nums">{game.teams.away.record.wins}-{game.teams.away.record.losses}</div>
          )}
        </div>
        <div className="flex items-center gap-2 text-2xl font-bold tabular-nums">
          <span className={game.inningHalf === 'top' ? 'text-white' : 'text-gray-400'}>{game.score.away}</span>
          <span className="text-gray-700 text-base">—</span>
          <span className={game.inningHalf === 'bottom' ? 'text-white' : 'text-gray-400'}>{game.score.home}</span>
        </div>
        <div className="leading-tight text-right">
          <div className={`text-[12px] font-bold ${game.inningHalf === 'bottom' ? 'text-white' : 'text-gray-400'}`}>
            {game.inningHalf === 'bottom' && <span className="mr-1" style={{ color: TEAM_GOLD }}>●</span>}
            {game.teams.home.abbrev}
          </div>
          {game.teams.home.record && (
            <div className="text-[9px] text-gray-500 tabular-nums">{game.teams.home.record.wins}-{game.teams.home.record.losses}</div>
          )}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={teamLogoUrl(game.teams.home.id)} alt={game.teams.home.abbrev} width={28} height={28} className="h-7 w-7 object-contain" />
      </div>

      {/* ─── Row 3: matchup hero — big linked player cards ──────────── */}
      <div className="grid grid-cols-2 gap-2">
        {/* BATTER CARD */}
        <Link
          href={`/players/${play.batter.id}`}
          className="group flex flex-col items-center gap-1 rounded-lg border-l-2 bg-white/[0.02] p-2 hover:bg-white/[0.06] hover:scale-[1.01] transition-all"
          style={{ borderColor: batterAccent }}
          aria-label={`View ${play.batter.fullName} player profile`}
        >
          <div className="text-[8px] uppercase tracking-widest text-gray-500 self-start">At bat</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={playerHeadshotLargeUrl(play.batter.id, 240)}
            alt={play.batter.fullName}
            width={80}
            height={80}
            className="h-20 w-20 rounded-full border-2 border-white/15 bg-white/5 object-cover object-top shadow-md group-hover:border-white/40 transition-colors"
            onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
          />
          <div className="text-center mt-1 leading-tight">
            <div className="text-[14px] font-extrabold text-balance" style={{ color: batterAccent }}>
              {play.batter.fullName}
            </div>
            <div className="text-[10px] text-gray-400 tabular-nums">
              {batterMeta?.jerseyNumber && `#${batterMeta.jerseyNumber}`}
              {batterMeta?.position && ` · ${batterMeta.position}`}
              {batSide && ` · ${batSide}HH`}
            </div>
          </div>
        </Link>

        {/* PITCHER CARD */}
        <Link
          href={`/players/${play.pitcher.id}`}
          className="group flex flex-col items-center gap-1 rounded-lg border-r-2 bg-white/[0.02] p-2 hover:bg-white/[0.06] hover:scale-[1.01] transition-all"
          style={{ borderColor: pitcherAccent }}
          aria-label={`View ${play.pitcher.fullName} player profile`}
        >
          <div className="text-[8px] uppercase tracking-widest text-gray-500 self-end">Pitching</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={playerHeadshotLargeUrl(play.pitcher.id, 240)}
            alt={play.pitcher.fullName}
            width={80}
            height={80}
            className="h-20 w-20 rounded-full border-2 border-white/15 bg-white/5 object-cover object-top shadow-md group-hover:border-white/40 transition-colors"
            onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
          />
          <div className="text-center mt-1 leading-tight">
            <div className="text-[14px] font-extrabold text-balance" style={{ color: pitcherAccent }}>
              {play.pitcher.fullName}
            </div>
            <div className="text-[10px] text-gray-400 tabular-nums">
              {pitcherMeta?.jerseyNumber && `#${pitcherMeta.jerseyNumber}`}
              {pitcherMeta?.position && ` · ${pitcherMeta.position}`}
              {pitchHand && ` · ${pitchHand}HP`}
            </div>
          </div>
        </Link>
      </div>

      {/* ─── Strike zone — full width ─────────────────────────────────── */}
      <div className="flex flex-col items-center gap-1 pt-1">
        <StrikeZoneLive
          pitches={pitches}
          zone={zone}
          batSide={batSide}
          heatmap={batter.heatmap}
          maxWidth={150}
        />
        {lastPitch ? (
          <div className="flex items-center gap-2 text-[11px] tabular-nums leading-none rounded bg-black/40 px-2 py-1 mt-1"
               style={{ borderTop: `2px solid ${lastCat ? PITCH_COLORS[lastCat] : 'transparent'}` }}>
            <span className="font-bold" style={{ color: lastCat ? PITCH_COLORS[lastCat] : '#e5e7eb' }}>
              {lastPitch.type?.code ?? '?'}
            </span>
            {lastPitch.speed != null && <span className="text-gray-200 font-semibold">{Math.round(lastPitch.speed)} mph</span>}
            {lastPitch.spinRate != null && <span className="text-gray-400">{Math.round(lastPitch.spinRate)} rpm</span>}
            {lastCat && <span className="text-gray-500">{PITCH_LABELS[lastCat]}</span>}
            {tnl != null && tnl >= 70 && (
              <span className="ml-1 text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded"
                    style={{ background: TEAM_GOLD, color: '#000' }}>
                Tunnel {tnl}
              </span>
            )}
          </div>
        ) : (
          <div className="text-[10px] text-gray-600 italic mt-1">first pitch</div>
        )}
      </div>

      {/* ─── § Live Odds ─────────────────────────────────────────────── */}
      <SectionHeading title="Live Odds — This At Bat" accent={TEAM_GOLD}
        sub={lean === 'hitter' ? "Count favors hitter" : lean === 'pitcher' ? "Count favors pitcher" : "Even count"} />
      <div className="grid grid-cols-4 gap-1">
        <LiveStat statKey="OBP_LIVE" label="OBP@" value={fmt3(obpLive)} accent={TEAM_GOLD} emphasize
          sub={obpDelta >= 0 ? `+${fmt3(obpDelta)}` : fmt3(obpDelta)}
          tone={obpDelta >= 0 ? 'good' : 'bad'} />
        <LiveStat statKey="HIT_PROB" label="Hit%" value={fmtPct(hitProb)} accent={TEAM_GOLD} />
        <LiveStat statKey="K_RISK" label="K Risk" value={fmtPct(kRisk)} tone={kRisk > 0.40 ? 'bad' : 'neutral'} />
        <LiveStat statKey="BB_PROB" label="BB%" value={fmtPct(bbProbReal)} tone="neutral" />
      </div>
      <div className="grid grid-cols-4 gap-1">
        <LiveStat statKey="LEV" label="LI" value={lev.toFixed(2)} accent={TEAM_GOLD}
          tone={lev >= 1.5 ? 'good' : 'neutral'} />
        <LiveStat statKey="RE24" label="RE24" value={re.toFixed(2)} sub={game.bases ? baseStateLabel(game.bases) : undefined} />
        <LiveStat statKey="RE_DELTA" label="RE Δ" value={`+${reDelta.toFixed(2)}`} tone="good" />
        <LiveStat statKey="TRIDENT_SCORE" label="Trident" value={trident}
          sub={trident >= 80 ? '🔥 Drama' : trident >= 60 ? '↑ Hot spot' : 'Routine'}
          tone={trident >= 80 ? 'good' : 'neutral'} accent={TEAM_GOLD} emphasize />
      </div>

      {/* ─── Today line + season + statcast — Batter | Pitcher ────────── */}
      <div className="grid grid-cols-2 gap-2 mt-1">
        {/* BATTER stats column */}
        <div className="space-y-1">
          <div className="rounded text-[10.5px] font-semibold tabular-nums leading-tight px-1.5 py-1 truncate"
               style={{ background: 'rgba(255,183,0,0.10)', color: TEAM_GOLD }} title={todayLineBatter}>
            <span className="text-[8.5px] uppercase tracking-wider text-amber-300/70 mr-1">Today</span>
            {todayLineBatter}
          </div>

          <SectionHeading title="Season" accent={batterAccent} />
          <div className="grid grid-cols-3 gap-1">
            <LiveStat statKey="AVG" label="AVG" value={strOr(bs?.avg)} />
            <LiveStat statKey="OBP" label="OBP" value={strOr(bs?.obp)} />
            <LiveStat statKey="OPS" label="OPS" value={strOr(bs?.ops)} emphasize />
          </div>
          <div className="grid grid-cols-3 gap-1">
            <LiveStat statKey="SLG" label="SLG" value={strOr(bs?.slg)} />
            <LiveStat statKey="HR" label="HR" value={strOr(bs?.homeRuns)} />
            <LiveStat statKey="RBI" label="RBI" value={strOr(bs?.rbi)} />
          </div>
          <div className="grid grid-cols-3 gap-1">
            <LiveStat statKey="SB" label="SB" value={strOr(bs?.stolenBases)} />
            <LiveStat statKey="BB" label="BB" value={strOr(bs?.baseOnBalls)} />
            <LiveStat statKey="K" label="K" value={strOr(bs?.strikeOuts)} />
          </div>

          <SectionHeading title="Statcast" accent={TEAM_GOLD} />
          <div className="grid grid-cols-3 gap-1">
            <LiveStat statKey="XBA" label="xBA" value={fmt3(batter.expected?.estBA)} accent={TEAM_GOLD} />
            <LiveStat statKey="XSLG" label="xSLG" value={fmt3(batter.expected?.estSLG)} accent={TEAM_GOLD} />
            <LiveStat statKey="XWOBA" label="xwOBA" value={fmt3(batter.expected?.estWOBA)} accent={TEAM_GOLD} />
          </div>
          <div className="grid grid-cols-3 gap-1">
            <LiveStat statKey="EV" label="EV" value={batter.summary ? batter.summary.avgExitVelo.toFixed(1) : '—'} accent={TEAM_GOLD} />
            <LiveStat statKey="HH%" label="HH%" value={batter.summary ? batter.summary.hardHitPct.toFixed(0) : '—'} accent={TEAM_GOLD} />
            <LiveStat statKey="BRL%" label="BRL%" value={batter.summary ? batter.summary.brlPct.toFixed(1) : '—'} accent={TEAM_GOLD} />
          </div>
          {!bs && batter.loading && <div className="text-[10px] italic text-gray-600 text-center">loading…</div>}
        </div>

        {/* PITCHER stats column */}
        <div className="space-y-1">
          <div className="rounded text-[10.5px] font-semibold tabular-nums leading-tight px-1.5 py-1 truncate"
               style={{ background: 'rgba(255,183,0,0.10)', color: TEAM_GOLD }} title={todayLinePitcher}>
            <span className="text-[8.5px] uppercase tracking-wider text-amber-300/70 mr-1">Today</span>
            {todayLinePitcher}
          </div>

          <SectionHeading title="Season" accent={pitcherAccent} />
          <div className="grid grid-cols-3 gap-1">
            <LiveStat statKey="ERA" label="ERA" value={strOr(ps?.era)} emphasize />
            <LiveStat statKey="WHIP" label="WHIP" value={strOr(ps?.whip)} />
            <LiveStat statKey="K/9" label="K/9" value={strOr(ps?.strikeoutsPer9Inn)} />
          </div>
          <div className="grid grid-cols-3 gap-1">
            <LiveStat statKey="BB/9" label="BB/9" value={strOr(ps?.walksPer9Inn)} />
            <LiveStat statKey="HR/9" label="HR/9" value={ps && parseFloat(ps.inningsPitched) > 0
              ? ((ps.homeRuns * 9) / parseFloat(ps.inningsPitched)).toFixed(2)
              : '—'} />
            <LiveStat statKey="WINS" label="W-L" value={ps ? `${ps.wins}-${ps.losses}` : '—'} />
          </div>
          <div className="grid grid-cols-3 gap-1">
            <LiveStat statKey="K" label="K" value={strOr(ps?.strikeOuts)} />
            <LiveStat statKey="BB" label="BB" value={strOr(ps?.baseOnBalls)} />
            <LiveStat statKey="HR" label="HR" value={strOr(ps?.homeRuns)} />
          </div>

          <SectionHeading title="Today Detail" accent={TEAM_GOLD} />
          <div className="grid grid-cols-3 gap-1">
            <LiveStat statKey="PIT" label="PIT" value={pitchCountToday(game, play.pitcher.id)} accent={TEAM_GOLD} emphasize />
            <LiveStat statKey="STR%" label="STR%"
              value={pitcherLine.pitches > 0 ? Math.round((pitcherLine.strikes / pitcherLine.pitches) * 100) : '—'}
              accent={TEAM_GOLD} />
            <LiveStat statKey="BF" label="BF" value={pitcherLine.battersFaced} accent={TEAM_GOLD} />
          </div>
          <div className="grid grid-cols-3 gap-1">
            <LiveStat statKey="K" label="K" value={pitcherLine.strikeouts} accent={TEAM_GOLD} />
            <LiveStat statKey="BB" label="BB" value={pitcherLine.walks} accent={TEAM_GOLD} />
            <LiveStat statKey="H" label="H" value={pitcherLine.hits} accent={TEAM_GOLD} />
          </div>
          {!ps && pitcher.loading && <div className="text-[10px] italic text-gray-600 text-center">loading…</div>}
        </div>
      </div>

      {/* ─── § Splits — Batter ─────────────────────────────────────── */}
      {(splits.data || splits.loading) && (
        <>
          <SectionHeading title="Batter Splits" accent={batterAccent}
            sub={splits.loading ? 'loading…' : `vs ${pitchHand ?? '?'}HP highlighted`} />
          <div className="grid grid-cols-4 gap-1">
            <SplitTile statKey="VS_LHP" label="vs LHP"
              ops={hSp['vl']?.ops ? String(hSp['vl'].ops) : '—'}
              ab={`${hSp['vl']?.atBats ?? 0} AB`}
              highlight={activeBatVsHand === 'vl'} />
            <SplitTile statKey="VS_RHP" label="vs RHP"
              ops={hSp['vr']?.ops ? String(hSp['vr'].ops) : '—'}
              ab={`${hSp['vr']?.atBats ?? 0} AB`}
              highlight={activeBatVsHand === 'vr'} />
            <SplitTile statKey="OPS" label="Home"
              ops={hSp['h']?.ops ? String(hSp['h'].ops) : '—'}
              ab={`${hSp['h']?.atBats ?? 0} AB`}
              highlight={activeBatLoc === 'h'} />
            <SplitTile statKey="OPS" label="Away"
              ops={hSp['a']?.ops ? String(hSp['a'].ops) : '—'}
              ab={`${hSp['a']?.atBats ?? 0} AB`}
              highlight={activeBatLoc === 'a'} />
          </div>
          <div className="grid grid-cols-4 gap-1">
            <SplitTile statKey="RISP_OPS" label="RISP"
              ops={hSp['risp']?.ops ? String(hSp['risp'].ops) : '—'}
              ab={`${hSp['risp']?.atBats ?? 0} AB`}
              highlight={!!game.bases && isRISP(game.bases)} />
            <SplitTile statKey="RISP_OPS" label="RISP 2o"
              ops={hSp['rispt2']?.ops ? String(hSp['rispt2'].ops) : '—'}
              ab={`${hSp['rispt2']?.atBats ?? 0} AB`}
              highlight={!!game.bases && isRISP(game.bases) && outs === 2} />
            <SplitTile statKey="LATE_CLOSE_OPS" label="Late&Close"
              ops={hSp['7i']?.ops ? String(hSp['7i'].ops) : '—'}
              ab={`${hSp['7i']?.atBats ?? 0} AB`}
              highlight={(game.inning ?? 0) >= 7 && scoreMargin <= 2} />
            <SplitTile statKey="OPS" label="Empty"
              ops={hSp['empty']?.ops ? String(hSp['empty'].ops) : '—'}
              ab={`${hSp['empty']?.atBats ?? 0} AB`}
              highlight={!!game.bases && !game.bases.first && !game.bases.second && !game.bases.third} />
          </div>
          {(vsTeamBatter.data || atVenueBatter.data) && (
            <div className="grid grid-cols-2 gap-1 mt-1">
              <SplitTile statKey="VS_TEAM_OPS" label="vs Team (career)"
                ops={vsTeamBatter.data?.ops ?? '—'}
                ab={`${vsTeamBatter.data?.pa ?? 0} PA`} />
              <SplitTile statKey="AT_VENUE_OPS" label="At Venue (career)"
                ops={atVenueBatter.data?.ops ?? '—'}
                ab={`${atVenueBatter.data?.pa ?? 0} PA`} />
            </div>
          )}
        </>
      )}

      {/* ─── § Recent Form — Batter ─────────────────────────────────── */}
      {hitLog.length > 0 && (
        <>
          <SectionHeading title="Batter Form" accent={batterAccent}
            sub={`L7: ${l7.games}g · L15: ${l15.games}g`} />
          <div className="grid grid-cols-4 gap-1">
            <LiveStat statKey="L7_OPS" label="L7 OPS" value={fmt3(l7.ops)}
              tone={l7.ops > seasonOPS ? 'good' : l7.ops < seasonOPS - 0.05 ? 'bad' : 'neutral'} />
            <LiveStat statKey="L15_OPS" label="L15 OPS" value={fmt3(l15.ops)}
              tone={l15.ops > seasonOPS ? 'good' : l15.ops < seasonOPS - 0.05 ? 'bad' : 'neutral'} />
            <LiveStat statKey="HOT" label="Hot" value={Math.round(hot)}
              tone={hot >= 70 ? 'good' : hot <= 30 ? 'bad' : 'neutral'} accent={TEAM_GOLD} />
            <LiveStat statKey="HIT_STREAK" label="Streak" value={hitStrk > 0 ? `${hitStrk}g` : '—'} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1 items-center">
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-white/[0.02] border border-white/5">
              <span className="text-[9px] uppercase tracking-wider text-gray-500">Last PAs</span>
              <PaSequenceDots events={recentPaEvents} />
            </div>
            <LiveStat statKey="MULTI_HIT_L10" label="Multi-Hit L10" value={mh10} />
          </div>
        </>
      )}

      {/* ─── § Career H2H ─────────────────────────────────────────── */}
      {h2h.data && h2h.data.pa > 0 && (
        <>
          <SectionHeading title="Career vs This Pitcher" accent={TEAM_GOLD}
            sub={h2h.data.smallSample ? `Small sample · ${h2h.data.pa} PA` : `${h2h.data.pa} PA`} />
          <div className="grid grid-cols-5 gap-1">
            <LiveStat statKey="H2H" label="AB" value={h2h.data.ab} accent={TEAM_GOLD} />
            <LiveStat statKey="AVG" label="AVG" value={h2h.data.avg} />
            <LiveStat statKey="OPS" label="OPS" value={h2h.data.ops} emphasize />
            <LiveStat statKey="HR" label="HR" value={h2h.data.hr} accent={h2h.data.hr > 0 ? TEAM_GOLD : undefined} />
            <LiveStat statKey="K" label="K" value={h2h.data.so} />
          </div>
        </>
      )}

      {/* ─── § Pitcher Splits ───────────────────────────────────────── */}
      {(pitcherSplits.data || pitcherSplits.loading) && (
        <>
          <SectionHeading title="Pitcher Splits" accent={pitcherAccent}
            sub={pitcherSplits.loading ? 'loading…' : `vs ${batSide ?? '?'}HB highlighted`} />
          <div className="grid grid-cols-4 gap-1">
            <SplitTile statKey="VS_LHB_OPS" label="vs LHB"
              ops={pSp['vl']?.ops ? String(pSp['vl'].ops) : '—'}
              ab={`${pSp['vl']?.battersFaced ?? 0} BF`}
              highlight={activePitchVsHand === 'vl'} />
            <SplitTile statKey="VS_RHB_OPS" label="vs RHB"
              ops={pSp['vr']?.ops ? String(pSp['vr'].ops) : '—'}
              ab={`${pSp['vr']?.battersFaced ?? 0} BF`}
              highlight={activePitchVsHand === 'vr'} />
            <SplitTile statKey="ERA" label="Home"
              ops={pSp['h']?.era ? String(pSp['h'].era) : '—'}
              ab={`${pSp['h']?.inningsPitched ?? '0'} IP`}
              highlight={activePitchLoc === 'h'} />
            <SplitTile statKey="ERA" label="Away"
              ops={pSp['a']?.era ? String(pSp['a'].era) : '—'}
              ab={`${pSp['a']?.inningsPitched ?? '0'} IP`}
              highlight={activePitchLoc === 'a'} />
          </div>
          {vsTeamPitcher.data && vsTeamPitcher.data.pa > 0 && (
            <div className="grid grid-cols-2 gap-1 mt-1">
              <SplitTile statKey="VS_TEAM_OPS" label="vs Team (career)"
                ops={vsTeamPitcher.data.ops ?? '—'}
                ab={`${vsTeamPitcher.data.pa ?? 0} BF`} />
              {vsTeamPitcher.data.era && (
                <SplitTile statKey="ERA" label="vs Team ERA"
                  ops={vsTeamPitcher.data.era}
                  ab={`${vsTeamPitcher.data.pa} BF`} />
              )}
            </div>
          )}
        </>
      )}

      {/* ─── § Pitcher Arsenal — Live ────────────────────────────────── */}
      {arsenalSeasonRows.length > 0 && (
        <>
          <SectionHeading title="Pitcher Arsenal" accent={pitcherAccent}
            sub={topPitch ? `Most likely: ${topPitch.code} ${(topPitch.pct * 100).toFixed(0)}%` : undefined} />
          <ArsenalBar rows={arsenalSeasonRows} />
          <div className="grid grid-cols-3 gap-1 mt-1.5">
            {arsenalSeasonRows.slice(0, 6).map(p => (
              <div key={p.code} className="rounded border border-white/5 bg-white/[0.02] px-1.5 py-1 text-center leading-tight">
                <div className="flex items-center justify-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full" style={{
                    background: PITCH_COLORS[
                      p.code === 'FF' || p.code === 'SI' || p.code === 'FT' ? 'in-play' :
                      p.code === 'SL' || p.code === 'CU' || p.code === 'KC' || p.code === 'SV' ? 'swinging-strike' :
                      'ball'
                    ]
                  }} />
                  <span className="text-[10px] font-bold text-gray-100">{p.code}</span>
                </div>
                <div className="text-[8px] text-gray-500 uppercase tracking-wider">{(p.pct * 100).toFixed(0)}% usage</div>
                {p.velo != null && <div className="text-[10px] tabular-nums text-gray-300">{p.velo.toFixed(1)} mph</div>}
                {p.whiffPct != null && (
                  <div className="text-[8.5px] tabular-nums text-amber-400">whiff {(p.whiffPct * 100).toFixed(0)}%</div>
                )}
              </div>
            ))}
          </div>
          {topPitch && (
            <div className="mt-1 px-2 py-1.5 rounded bg-amber-500/[0.06] border border-amber-500/20 text-[10.5px] tabular-nums text-amber-200 leading-tight">
              <span className="text-[8.5px] uppercase tracking-wider text-amber-300/70 mr-1">
                On {balls}-{strikes}:
              </span>
              {topPitch.code} {(topPitch.pct * 100).toFixed(0)}%
              {topPitch.whiffPct != null && ` · ${(topPitch.whiffPct * 100).toFixed(0)}% whiff`}
            </div>
          )}
        </>
      )}

      {/* ─── § Pitcher Form & Fatigue ──────────────────────────────── */}
      {(pitLog.length > 0 || fatigue.pitchesToday > 0) && (
        <>
          <SectionHeading title="Pitcher Form" accent={pitcherAccent}
            sub={`Tier: ${fatigue.tier}`} />
          <div className="grid grid-cols-4 gap-1">
            <LiveStat statKey="L3_ERA" label="L3 ERA" value={pL3.ip > 0 ? pL3.era.toFixed(2) : '—'}
              tone={ps?.era && pL3.ip > 0 ? (pL3.era < parseFloat(ps.era) ? 'good' : 'bad') : 'neutral'} />
            <LiveStat statKey="L5_ERA" label="L5 ERA" value={pL5.ip > 0 ? pL5.era.toFixed(2) : '—'}
              tone={ps?.era && pL5.ip > 0 ? (pL5.era < parseFloat(ps.era) ? 'good' : 'bad') : 'neutral'} />
            <LiveStat statKey="HOT" label="Pitcher Hot" value={Math.round(pHot)}
              tone={pHot >= 70 ? 'good' : pHot <= 30 ? 'bad' : 'neutral'} accent={TEAM_GOLD} />
            <LiveStat statKey="VELO_DECAY" label="ΔVelo"
              value={veloDecay.deltaMph !== 0 ? `${veloDecay.deltaMph >= 0 ? '+' : ''}${veloDecay.deltaMph.toFixed(1)}` : '—'}
              tone={veloDecay.deltaMph < -1 ? 'bad' : 'neutral'} />
          </div>
          <div className="grid grid-cols-3 gap-1">
            <LiveStat statKey="FATIGUE" label="Fatigue" value={fatigue.tier.toUpperCase()}
              sub={`${fatigue.pitchesToday}/${fatigue.usualPitchesPerOuting}`}
              tone={fatigue.tier === 'gassed' ? 'bad' : fatigue.tier === 'tiring' ? 'neutral' : 'good'} />
            <LiveStat statKey="PIT" label="Pitches" value={fatigue.pitchesToday} />
            <LiveStat statKey="EV" label="vs Pen?" value={fatigue.tier === 'gassed' ? 'YES' : '—'}
              tone={fatigue.tier === 'gassed' ? 'bad' : 'neutral'} />
          </div>
        </>
      )}

      {/* ─── § Game Context (park, weather, ump) ───────────────────── */}
      <SectionHeading title="Game Context" accent={TEAM_GOLD} />
      <div className="grid grid-cols-4 gap-1">
        <LiveStat statKey="PARK_HR_FACTOR" label="Park HR" value={park.hr}
          sub={park.name.split(' ').slice(0, 2).join(' ')}
          tone={park.hr > 105 ? 'good' : park.hr < 95 ? 'bad' : 'neutral'} />
        <LiveStat statKey="PARK_RUN_FACTOR" label="Park R" value={park.runs}
          tone={park.runs > 105 ? 'good' : park.runs < 95 ? 'bad' : 'neutral'} />
        <LiveStat statKey="WIND_EFFECT" label="Wind"
          value={wMod !== 1 ? `${wMod >= 1 ? '+' : ''}${Math.round((wMod - 1) * 100)}%` : '—'}
          sub={weatherEffectLabel(wMod).split(' (')[0]}
          tone={wMod > 1.04 ? 'good' : wMod < 0.96 ? 'bad' : 'neutral'} />
        <LiveStat statKey="TEMP_FACTOR" label="Temp"
          value={tempNum != null ? `${tempNum}°` : '—'}
          tone={tempNum != null ? (tempNum > 80 ? 'good' : tempNum < 60 ? 'bad' : 'neutral') : 'neutral'} />
      </div>
      {ump.totalCalled >= 5 && (
        <div className="grid grid-cols-3 gap-1">
          <LiveStat statKey="UMP_NET" label="Ump Net"
            value={ump.netFavorPitchers > 0 ? `+${ump.netFavorPitchers}` : `${ump.netFavorPitchers}`}
            sub={ump.netFavorPitchers > 0 ? 'favors P' : ump.netFavorPitchers < 0 ? 'favors H' : 'neutral'} />
          <LiveStat statKey="UMP_ACC" label="Ump Acc" value={fmtPct(ump.accuracy)} />
          <LiveStat statKey="UMP_NET" label="HP Ump"
            value={homeUmp ? homeUmp.fullName.split(' ').slice(-1)[0] : '—'} />
        </div>
      )}

      {/* ─── Pitch sequence ─────────────────────────────────────────── */}
      {pitches.length > 0 && (
        <div className="space-y-1 mt-2">
          <div className="flex items-center justify-between text-[8.5px] uppercase tracking-wider text-gray-500 leading-none">
            <span>Sequence</span>
            <span className="flex flex-wrap gap-x-2 gap-y-0.5 normal-case tracking-normal">
              {(Object.keys(PITCH_LABELS) as PitchCategory[]).map(cat => {
                const n = dist[cat] ?? 0;
                if (n === 0) return null;
                return (
                  <span key={cat} className="flex items-center gap-1 tabular-nums text-[9px]">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: PITCH_COLORS[cat] }} />
                    {n}
                  </span>
                );
              })}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {pitches.map((p, i) => <PitchPip key={i} p={p} />)}
          </div>
        </div>
      )}

      {/* ─── Result / footer ─────────────────────────────────────── */}
      {ab.isComplete && play.event ? (
        <div className="rounded border border-white/10 bg-black/30 px-2 py-1 text-[11px] leading-tight"
             style={{ borderLeft: `3px solid ${TEAM_GOLD}` }}>
          <span className="text-[9px] uppercase tracking-wider text-gray-500">Result</span>{' '}
          <span className="font-semibold text-gray-100">{play.event}</span>
          <span className="text-gray-400"> — {play.description}</span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/5 pt-1.5 text-[9.5px] text-gray-500 leading-none">
          {game.onDeck && <NextUpChip label="On deck" person={game.onDeck} />}
          {game.inHole && <NextUpChip label="In hole" person={game.inHole} />}
          {game.venue && <span className="text-gray-600 truncate">{game.venue.name}</span>}
          {game.weather?.condition && (
            <span className="text-gray-600 tabular-nums">
              {game.weather.condition}{game.weather.temp ? `, ${game.weather.temp}°` : ''}
            </span>
          )}
          {homeUmp && <span className="text-gray-600 truncate">HP {homeUmp.fullName}</span>}
        </div>
      )}
    </div>
  );
}

