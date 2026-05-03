'use client';

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
  type PitchCategory,
} from '@/lib/at-bat';
import { useBatterContext } from '@/lib/batter-context';
import { usePitcherContext } from '@/lib/pitcher-context';
import { teamLogoUrl, playerHeadshotUrl } from '@/lib/utils';
import { StrikeZoneLive } from './charts/strike-zone-live';

const TEAM_TEAL = '#00A3A3';
const TEAM_GOLD = '#FFB700';
const MARINERS_ID = 136;

// ─── Tiny helpers ────────────────────────────────────────────────────────────

function fmt3(n?: number): string {
  if (n == null || !isFinite(n)) return '—';
  return n.toFixed(3).replace(/^0/, '');
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
    <span
      className={`text-[9px] tabular-nums ${stale ? 'text-amber-400' : 'text-gray-500'}`}
    >
      {ageSec}s
    </span>
  );
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function CountDots({
  filled,
  total,
  color,
}: {
  filled: number;
  total: number;
  color: string;
}) {
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

function BasesGlyph({
  bases,
}: {
  bases?: { first: boolean; second: boolean; third: boolean };
}) {
  const on = (b?: boolean) => (b ? TEAM_GOLD : 'rgba(255,255,255,0.12)');
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-label="bases">
      <polygon
        points="12,1 16,5 12,9 8,5"
        fill={on(bases?.second)}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="0.5"
      />
      <polygon
        points="19,8 23,12 19,16 15,12"
        fill={on(bases?.first)}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="0.5"
      />
      <polygon
        points="5,8 9,12 5,16 1,12"
        fill={on(bases?.third)}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="0.5"
      />
    </svg>
  );
}

/** Stat tile — dense, label below value to save horizontal width. */
function Stat({
  label,
  value,
  accent,
  emphasize,
}: {
  label: string;
  value: React.ReactNode;
  accent?: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center leading-none rounded bg-white/[0.025] px-0.5 py-1">
      <span
        className={`tabular-nums font-semibold ${emphasize ? 'text-[12px]' : 'text-[11px]'}`}
        style={{ color: accent ?? '#e5e7eb' }}
      >
        {value}
      </span>
      <span className="mt-[3px] text-[8px] uppercase tracking-wider text-gray-500">
        {label}
      </span>
    </div>
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
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color, boxShadow: `0 0 4px ${color}90` }}
      />
      <span className="font-semibold text-gray-200">{code}</span>
      {speed != null && <span className="text-gray-400">{speed}</span>}
    </div>
  );
}

function NextUpChip({ label, person }: { label: string; person: PersonRef }) {
  const last = person.fullName.split(' ').slice(-1)[0];
  return (
    <span className="inline-flex items-center gap-1 text-[10px] leading-none">
      <span className="text-[8px] uppercase tracking-wider text-gray-600">
        {label}
      </span>
      <span className="text-gray-300 truncate max-w-[110px]">{last}</span>
    </span>
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

  if (!ab) return null;
  if (game.state !== 'Live' && !ab.isComplete) return null;

  const { play, pitches, zone } = ab;
  const balls = game.count?.balls ?? 0;
  const strikes = game.count?.strikes ?? 0;
  const outs = game.count?.outs ?? 0;
  const halfLabel =
    game.inningHalf === 'top' ? 'TOP' : game.inningHalf === 'bottom' ? 'BOT' : '';

  const batSide =
    game.currentMatchup?.batSide ?? (play.batSide as 'L' | 'R' | undefined);
  const pitchHand =
    game.currentMatchup?.pitchHand ?? (play.pitchHand as 'L' | 'R' | undefined);

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

  // SEA accent on whichever team is currently at bat.
  const battingTeamId =
    game.inningHalf === 'top' ? game.teams.away.id : game.teams.home.id;
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

  return (
    <div
      className="trident-card trident-card-glow p-3 space-y-2"
      data-testid="live-at-bat"
    >
      {/* ─── Row 1: status strip ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 text-[11px] leading-none">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center gap-1 font-bold text-emerald-400 uppercase tracking-wider">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
            Live
          </span>
          {halfLabel && game.inning != null && (
            <span className="font-mono text-gray-200 tabular-nums">
              <span style={{ color: TEAM_GOLD }}>
                {game.inningHalf === 'top' ? '▲' : '▼'}
              </span>{' '}
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

      {/* ─── Row 2: scoreboard with team logos ──────────────────────── */}
      <div className="grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-2 rounded bg-black/30 px-2 py-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={teamLogoUrl(game.teams.away.id)}
          alt={game.teams.away.abbrev}
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
        />
        <div className="leading-tight">
          <div
            className={`text-[12px] font-bold ${
              game.inningHalf === 'top' ? 'text-white' : 'text-gray-400'
            }`}
          >
            {game.teams.away.abbrev}
            {game.inningHalf === 'top' && (
              <span className="ml-1" style={{ color: TEAM_GOLD }}>
                ●
              </span>
            )}
          </div>
          {game.teams.away.record && (
            <div className="text-[9px] text-gray-500 tabular-nums">
              {game.teams.away.record.wins}-{game.teams.away.record.losses}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-2xl font-bold tabular-nums">
          <span
            className={
              game.inningHalf === 'top' ? 'text-white' : 'text-gray-400'
            }
          >
            {game.score.away}
          </span>
          <span className="text-gray-700 text-base">—</span>
          <span
            className={
              game.inningHalf === 'bottom' ? 'text-white' : 'text-gray-400'
            }
          >
            {game.score.home}
          </span>
        </div>
        <div className="leading-tight text-right">
          <div
            className={`text-[12px] font-bold ${
              game.inningHalf === 'bottom' ? 'text-white' : 'text-gray-400'
            }`}
          >
            {game.inningHalf === 'bottom' && (
              <span className="mr-1" style={{ color: TEAM_GOLD }}>
                ●
              </span>
            )}
            {game.teams.home.abbrev}
          </div>
          {game.teams.home.record && (
            <div className="text-[9px] text-gray-500 tabular-nums">
              {game.teams.home.record.wins}-{game.teams.home.record.losses}
            </div>
          )}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={teamLogoUrl(game.teams.home.id)}
          alt={game.teams.home.abbrev}
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
        />
      </div>

      {/* ─── Row 3: slim matchup header w/ strike zone in middle ─── */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 items-center">
        {/* batter name block */}
        <div
          className="flex items-center gap-1.5 min-w-0 border-l-2 pl-1.5"
          style={{ borderColor: batterAccent }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={playerHeadshotUrl(play.batter.id)}
            alt={play.batter.fullName}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full border border-white/10 bg-white/5 object-cover flex-shrink-0"
            onError={e => {
              (e.target as HTMLImageElement).style.visibility = 'hidden';
            }}
          />
          <div className="min-w-0 leading-tight">
            <div className="text-[8px] uppercase tracking-wider text-gray-500">
              At bat
            </div>
            <div
              className="text-[12px] font-extrabold truncate"
              style={{ color: batterAccent }}
            >
              {play.batter.fullName}
            </div>
            <div className="text-[9px] text-gray-500 tabular-nums truncate">
              {batterMeta?.jerseyNumber && `#${batterMeta.jerseyNumber}`}
              {batterMeta?.position && ` · ${batterMeta.position}`}
              {batSide && ` · ${batSide}HH`}
            </div>
          </div>
        </div>

        {/* zone in the middle */}
        <div className="flex flex-col items-center gap-1 self-center">
          <StrikeZoneLive
            pitches={pitches}
            zone={zone}
            batSide={batSide}
            heatmap={batter.heatmap}
            compact
            maxWidth={108}
          />
          {lastPitch ? (
            <div
              className="flex items-center gap-1 text-[10px] tabular-nums leading-none rounded bg-black/30 px-1.5 py-0.5"
              style={{
                borderTop: `2px solid ${
                  lastCat ? PITCH_COLORS[lastCat] : 'transparent'
                }`,
              }}
            >
              <span
                className="font-bold"
                style={{ color: lastCat ? PITCH_COLORS[lastCat] : '#e5e7eb' }}
              >
                {lastPitch.type?.code ?? '?'}
              </span>
              {lastPitch.speed != null && (
                <span className="text-gray-200 font-semibold">
                  {Math.round(lastPitch.speed)}
                </span>
              )}
              {lastCat && (
                <span className="text-gray-500">{PITCH_LABELS[lastCat]}</span>
              )}
            </div>
          ) : (
            <div className="text-[9px] text-gray-600 italic">first pitch</div>
          )}
        </div>

        {/* pitcher name block */}
        <div
          className="flex items-center gap-1.5 min-w-0 border-r-2 pr-1.5 justify-end"
          style={{ borderColor: pitcherAccent }}
        >
          <div className="min-w-0 leading-tight text-right">
            <div className="text-[8px] uppercase tracking-wider text-gray-500">
              Pitching
            </div>
            <div
              className="text-[12px] font-extrabold truncate"
              style={{ color: pitcherAccent }}
            >
              {play.pitcher.fullName}
            </div>
            <div className="text-[9px] text-gray-500 tabular-nums truncate">
              {pitcherMeta?.jerseyNumber && `#${pitcherMeta.jerseyNumber}`}
              {pitcherMeta?.position && ` · ${pitcherMeta.position}`}
              {pitchHand && ` · ${pitchHand}HP`}
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={playerHeadshotUrl(play.pitcher.id)}
            alt={play.pitcher.fullName}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full border border-white/10 bg-white/5 object-cover flex-shrink-0"
            onError={e => {
              (e.target as HTMLImageElement).style.visibility = 'hidden';
            }}
          />
        </div>
      </div>

      {/* ─── Row 4: dense stat panels — full width per side ─────── */}
      <div className="grid grid-cols-2 gap-2">
        {/* BATTER */}
        <div className="space-y-1">
          {/* TODAY chip */}
          <div
            className="rounded text-[10.5px] font-semibold tabular-nums leading-tight px-1.5 py-1 truncate"
            style={{ background: 'rgba(255,183,0,0.10)', color: TEAM_GOLD }}
            title={todayLineBatter}
          >
            <span className="text-[8.5px] uppercase tracking-wider text-amber-300/70 mr-1">
              Today
            </span>
            {todayLineBatter}
          </div>

          <div
            className="text-[8.5px] uppercase tracking-wider font-semibold pt-0.5"
            style={{ color: batterAccent }}
          >
            Season
          </div>
          <div className="grid grid-cols-3 gap-1">
            <Stat label="AVG" value={strOr(bs?.avg)} />
            <Stat label="OBP" value={strOr(bs?.obp)} />
            <Stat label="OPS" value={strOr(bs?.ops)} emphasize />
          </div>
          <div className="grid grid-cols-3 gap-1">
            <Stat label="SLG" value={strOr(bs?.slg)} />
            <Stat label="HR" value={strOr(bs?.homeRuns)} />
            <Stat label="RBI" value={strOr(bs?.rbi)} />
          </div>
          <div className="grid grid-cols-3 gap-1">
            <Stat label="SB" value={strOr(bs?.stolenBases)} />
            <Stat label="BB" value={strOr(bs?.baseOnBalls)} />
            <Stat label="K" value={strOr(bs?.strikeOuts)} />
          </div>

          <div
            className="text-[8.5px] uppercase tracking-wider font-semibold pt-0.5"
            style={{ color: TEAM_GOLD }}
          >
            Statcast
          </div>
          <div className="grid grid-cols-3 gap-1">
            <Stat label="xBA" value={fmt3(batter.expected?.estBA)} accent={TEAM_GOLD} />
            <Stat label="xSLG" value={fmt3(batter.expected?.estSLG)} accent={TEAM_GOLD} />
            <Stat label="xwOBA" value={fmt3(batter.expected?.estWOBA)} accent={TEAM_GOLD} />
          </div>
          <div className="grid grid-cols-3 gap-1">
            <Stat
              label="EV"
              value={batter.summary ? batter.summary.avgExitVelo.toFixed(1) : '—'}
              accent={TEAM_GOLD}
            />
            <Stat
              label="HH%"
              value={batter.summary ? batter.summary.hardHitPct.toFixed(0) : '—'}
              accent={TEAM_GOLD}
            />
            <Stat
              label="BRL%"
              value={batter.summary ? batter.summary.brlPct.toFixed(1) : '—'}
              accent={TEAM_GOLD}
            />
          </div>
          {!bs && batter.loading && (
            <div className="text-[10px] italic text-gray-600 text-center">
              loading…
            </div>
          )}
        </div>

        {/* PITCHER */}
        <div className="space-y-1">
          <div
            className="rounded text-[10.5px] font-semibold tabular-nums leading-tight px-1.5 py-1 truncate"
            style={{ background: 'rgba(255,183,0,0.10)', color: TEAM_GOLD }}
            title={todayLinePitcher}
          >
            <span className="text-[8.5px] uppercase tracking-wider text-amber-300/70 mr-1">
              Today
            </span>
            {todayLinePitcher}
          </div>

          <div
            className="text-[8.5px] uppercase tracking-wider font-semibold pt-0.5"
            style={{ color: pitcherAccent }}
          >
            Season
          </div>
          <div className="grid grid-cols-3 gap-1">
            <Stat label="ERA" value={strOr(ps?.era)} emphasize />
            <Stat label="WHIP" value={strOr(ps?.whip)} />
            <Stat label="K/9" value={strOr(ps?.strikeoutsPer9Inn)} />
          </div>
          <div className="grid grid-cols-3 gap-1">
            <Stat label="BB/9" value={strOr(ps?.walksPer9Inn)} />
            <Stat label="H/9" value={strOr(ps?.hitsPer9Inn)} />
            <Stat label="W-L" value={ps ? `${ps.wins}-${ps.losses}` : '—'} />
          </div>
          <div className="grid grid-cols-3 gap-1">
            <Stat label="K" value={strOr(ps?.strikeOuts)} />
            <Stat label="BB" value={strOr(ps?.baseOnBalls)} />
            <Stat label="HR" value={strOr(ps?.homeRuns)} />
          </div>

          <div
            className="text-[8.5px] uppercase tracking-wider font-semibold pt-0.5"
            style={{ color: TEAM_GOLD }}
          >
            Detail · today
          </div>
          <div className="grid grid-cols-3 gap-1">
            <Stat
              label="PIT"
              value={pitchCountToday(game, play.pitcher.id)}
              accent={TEAM_GOLD}
              emphasize
            />
            <Stat
              label="STR%"
              value={
                pitcherLine.pitches > 0
                  ? Math.round(
                      (pitcherLine.strikes / pitcherLine.pitches) * 100,
                    )
                  : '—'
              }
              accent={TEAM_GOLD}
            />
            <Stat label="BF" value={pitcherLine.battersFaced} accent={TEAM_GOLD} />
          </div>
          <div className="grid grid-cols-3 gap-1">
            <Stat label="K" value={pitcherLine.strikeouts} accent={TEAM_GOLD} />
            <Stat label="BB" value={pitcherLine.walks} accent={TEAM_GOLD} />
            <Stat label="H" value={pitcherLine.hits} accent={TEAM_GOLD} />
          </div>
          {!ps && pitcher.loading && (
            <div className="text-[10px] italic text-gray-600 text-center">
              loading…
            </div>
          )}
        </div>
      </div>

      {/* ─── Row 4: pitch sequence + tally ─────────────────────────── */}
      {pitches.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[8.5px] uppercase tracking-wider text-gray-500 leading-none">
            <span>Sequence</span>
            <span className="flex flex-wrap gap-x-2 gap-y-0.5 normal-case tracking-normal">
              {(Object.keys(PITCH_LABELS) as PitchCategory[]).map(cat => {
                const n = dist[cat] ?? 0;
                if (n === 0) return null;
                return (
                  <span
                    key={cat}
                    className="flex items-center gap-1 tabular-nums text-[9px]"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: PITCH_COLORS[cat] }}
                    />
                    {n}
                  </span>
                );
              })}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {pitches.map((p, i) => (
              <PitchPip key={i} p={p} />
            ))}
          </div>
        </div>
      )}

      {/* ─── Row 5: result OR meta footer ─────────────────────────── */}
      {ab.isComplete && play.event ? (
        <div
          className="rounded border border-white/10 bg-black/30 px-2 py-1 text-[11px] leading-tight"
          style={{ borderLeft: `3px solid ${TEAM_GOLD}` }}
        >
          <span className="text-[9px] uppercase tracking-wider text-gray-500">
            Result
          </span>{' '}
          <span className="font-semibold text-gray-100">{play.event}</span>
          <span className="text-gray-400"> — {play.description}</span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/5 pt-1.5 text-[9.5px] text-gray-500 leading-none">
          {game.onDeck && <NextUpChip label="On deck" person={game.onDeck} />}
          {game.inHole && <NextUpChip label="In hole" person={game.inHole} />}
          {game.venue && (
            <span className="text-gray-600 truncate">{game.venue.name}</span>
          )}
          {game.weather?.condition && (
            <span className="text-gray-600 tabular-nums">
              {game.weather.condition}
              {game.weather.temp ? `, ${game.weather.temp}°` : ''}
            </span>
          )}
          {homeUmp && (
            <span className="text-gray-600 truncate">HP {homeUmp.fullName}</span>
          )}
        </div>
      )}
    </div>
  );
}
