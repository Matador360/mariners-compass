'use client';

import { useMemo } from 'react';
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
import { StrikeZoneLive } from './charts/strike-zone-live';

const TEAM_TEAL = '#00A3A3';
const TEAM_GOLD = '#FFB700';
const MARINERS_ID = 136;

function playerImg(id: number) {
  return `https://midfield.mlbstatic.com/v1/people/${id}/spots/120`;
}

function fmt3(n?: number): string {
  if (n == null || !isFinite(n)) return '—';
  return n.toFixed(3).replace(/^0/, '');
}

// ─── Tiny atoms ────────────────────────────────────────────────────────────

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
    <svg width="22" height="22" viewBox="0 0 24 24" aria-label="bases">
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

/** Compact stat tile — label on top, value beneath, tabular nums. */
function Tile({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded bg-white/[0.025] px-1 py-1 leading-none">
      <span className="text-[8.5px] uppercase tracking-wider text-gray-500">
        {label}
      </span>
      <span
        className="mt-0.5 text-[12px] font-semibold tabular-nums"
        style={{ color: accent ?? '#e5e7eb' }}
      >
        {value}
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
      className="flex items-center gap-1 rounded border border-white/10 bg-white/[0.03] px-1.5 py-[3px] text-[10px] tabular-nums"
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
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] text-gray-500 leading-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={playerImg(person.id)}
        alt=""
        width={18}
        height={18}
        className="h-[18px] w-[18px] rounded-full border border-white/10 bg-white/5 object-cover"
        onError={e => {
          (e.target as HTMLImageElement).style.visibility = 'hidden';
        }}
      />
      <span className="uppercase tracking-wider text-gray-600">{label}</span>
      <span className="text-gray-300 truncate max-w-[110px]">
        {person.fullName.split(' ').slice(-1)[0]}
      </span>
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
  const pitcherSeason = pitcher.seasonStats;
  const batterSeason = batter.seasonStats;

  // Pitch type distribution within this AB.
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

  // SEA accent on whichever team is at bat.
  const battingTeamId =
    game.inningHalf === 'top' ? game.teams.away.id : game.teams.home.id;
  const seaAtBat = battingTeamId === MARINERS_ID;
  const batterAccent = seaAtBat ? TEAM_TEAL : '#cbd5e1';
  const pitcherAccent = !seaAtBat ? TEAM_TEAL : '#cbd5e1';

  return (
    <div
      className="trident-card trident-card-glow p-3 sm:p-4 space-y-2.5"
      data-testid="live-at-bat"
    >
      {/* ─── Status strip: live + inning + count + bases + score ─────── */}
      <div className="flex items-center justify-between gap-2 text-[11px] leading-none">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center gap-1 font-semibold text-emerald-400 uppercase tracking-wider">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live
          </span>
          {halfLabel && game.inning != null && (
            <span className="font-mono text-gray-300 tabular-nums">
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
        </div>
      </div>

      {/* ─── Score bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3 rounded bg-black/25 px-2 py-1.5 text-sm font-semibold tabular-nums">
        <span
          className={`flex items-center gap-1.5 ${
            game.inningHalf === 'top' ? 'text-white' : 'text-gray-400'
          }`}
        >
          {game.inningHalf === 'top' && (
            <span style={{ color: TEAM_GOLD }}>▸</span>
          )}
          {game.teams.away.abbrev}
          <span className="text-lg">{game.score.away}</span>
        </span>
        <span className="text-gray-600">·</span>
        <span
          className={`flex items-center gap-1.5 ${
            game.inningHalf === 'bottom' ? 'text-white' : 'text-gray-400'
          }`}
        >
          <span className="text-lg">{game.score.home}</span>
          {game.teams.home.abbrev}
          {game.inningHalf === 'bottom' && (
            <span style={{ color: TEAM_GOLD }}>◂</span>
          )}
        </span>
      </div>

      {/* ─── Matchup row: batter | zone | pitcher ────────────────────── */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 sm:gap-4 items-center">
        {/* Batter column */}
        <div
          className="flex flex-col items-start gap-1 min-w-0 border-l-2 pl-2"
          style={{ borderColor: batterAccent }}
        >
          <span className="text-[9px] uppercase tracking-wider text-gray-500">
            At bat
          </span>
          <div className="flex items-center gap-2 min-w-0 w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={playerImg(play.batter.id)}
              alt={play.batter.fullName}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full border border-white/10 bg-white/5 object-cover flex-shrink-0"
              onError={e => {
                (e.target as HTMLImageElement).style.visibility = 'hidden';
              }}
            />
            <div className="min-w-0">
              <div
                className="text-[13px] sm:text-sm font-bold leading-tight truncate"
                style={{ color: batterAccent }}
              >
                {play.batter.fullName}
              </div>
              <div className="text-[10px] text-gray-500 tabular-nums leading-tight">
                {batterMeta?.jerseyNumber && `#${batterMeta.jerseyNumber}`}
                {batterMeta?.position && ` · ${batterMeta.position}`}
                {batSide && ` · ${batSide}HH`}
              </div>
            </div>
          </div>
          {/* Today line — front and center */}
          <div
            className="text-[11px] font-semibold tabular-nums leading-tight"
            style={{ color: TEAM_GOLD }}
          >
            {batterLine.hab}
            <span className="text-gray-500 font-normal">
              {batterLine.homeRuns > 0 && `, ${batterLine.homeRuns} HR`}
              {batterLine.rbi > 0 && `, ${batterLine.rbi} RBI`}
              {batterLine.walks > 0 && `, ${batterLine.walks} BB`}
              {batterLine.strikeouts > 0 && `, ${batterLine.strikeouts} K`}
              <span className="ml-1 text-gray-600">today</span>
            </span>
          </div>
        </div>

        {/* Strike zone */}
        <div className="flex flex-col items-center gap-0.5">
          <StrikeZoneLive
            pitches={pitches}
            zone={zone}
            batSide={batSide}
            heatmap={batter.heatmap}
            compact
            maxWidth={130}
          />
          {/* Last pitch summary — broadcast-style readout under the zone */}
          {lastPitch && (
            <div
              className="flex items-center gap-1 text-[10px] tabular-nums leading-none"
              style={{
                color: lastCat ? PITCH_COLORS[lastCat] : '#9ca3af',
              }}
            >
              <span className="font-bold">{lastPitch.type?.code ?? '?'}</span>
              {lastPitch.speed != null && (
                <span className="font-semibold">
                  {lastPitch.speed.toFixed(1)}
                </span>
              )}
              {lastCat && (
                <span className="text-gray-500">{PITCH_LABELS[lastCat]}</span>
              )}
            </div>
          )}
        </div>

        {/* Pitcher column */}
        <div
          className="flex flex-col items-end gap-1 min-w-0 border-r-2 pr-2 text-right"
          style={{ borderColor: pitcherAccent }}
        >
          <span className="text-[9px] uppercase tracking-wider text-gray-500">
            Pitching
          </span>
          <div className="flex items-center gap-2 min-w-0 w-full justify-end">
            <div className="min-w-0">
              <div
                className="text-[13px] sm:text-sm font-bold leading-tight truncate"
                style={{ color: pitcherAccent }}
              >
                {play.pitcher.fullName}
              </div>
              <div className="text-[10px] text-gray-500 tabular-nums leading-tight">
                {pitcherMeta?.jerseyNumber && `#${pitcherMeta.jerseyNumber}`}
                {pitcherMeta?.position && ` · ${pitcherMeta.position}`}
                {pitchHand && ` · ${pitchHand}HP`}
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={playerImg(play.pitcher.id)}
              alt={play.pitcher.fullName}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full border border-white/10 bg-white/5 object-cover flex-shrink-0"
              onError={e => {
                (e.target as HTMLImageElement).style.visibility = 'hidden';
              }}
            />
          </div>
          <div
            className="text-[11px] font-semibold tabular-nums leading-tight"
            style={{ color: TEAM_GOLD }}
          >
            {pitcherLine.ip} IP
            <span className="text-gray-500 font-normal">
              , {pitcherLine.pitches}P/{pitcherLine.strikes}S
              {pitcherLine.strikeouts > 0 && `, ${pitcherLine.strikeouts} K`}
              {pitcherLine.walks > 0 && `, ${pitcherLine.walks} BB`}
              {pitcherLine.hits > 0 && `, ${pitcherLine.hits} H`}
              <span className="ml-1 text-gray-600">today</span>
            </span>
          </div>
        </div>
      </div>

      {/* ─── Stat ribbon ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        {/* Batter side */}
        <div
          className="rounded border border-white/5 bg-white/[0.015] p-1.5"
          style={{ borderTopColor: `${batterAccent}55` }}
        >
          <div
            className="mb-1 text-[8.5px] uppercase tracking-wider font-semibold"
            style={{ color: batterAccent }}
          >
            Batter · season
          </div>
          <div className="grid grid-cols-3 gap-1">
            <Tile label="AVG" value={batterSeason?.avg ?? '—'} />
            <Tile label="OPS" value={batterSeason?.ops ?? '—'} />
            <Tile label="HR" value={batterSeason?.homeRuns ?? '—'} />
          </div>
          <div className="mt-1 grid grid-cols-3 gap-1">
            <Tile
              label="xBA"
              value={fmt3(batter.expected?.estBA)}
              accent={TEAM_GOLD}
            />
            <Tile
              label="xSLG"
              value={fmt3(batter.expected?.estSLG)}
              accent={TEAM_GOLD}
            />
            <Tile
              label="xwOBA"
              value={fmt3(batter.expected?.estWOBA)}
              accent={TEAM_GOLD}
            />
          </div>
          {batter.summary && (
            <div className="mt-1 grid grid-cols-3 gap-1">
              <Tile
                label="EV"
                value={batter.summary.avgExitVelo.toFixed(1)}
              />
              <Tile
                label="HH%"
                value={`${batter.summary.hardHitPct.toFixed(0)}`}
              />
              <Tile
                label="BRL%"
                value={`${batter.summary.brlPct.toFixed(1)}`}
              />
            </div>
          )}
          {!batterSeason && batter.loading && (
            <div className="mt-1 text-[10px] italic text-gray-600 text-center">
              loading…
            </div>
          )}
        </div>

        {/* Pitcher side */}
        <div
          className="rounded border border-white/5 bg-white/[0.015] p-1.5"
          style={{ borderTopColor: `${pitcherAccent}55` }}
        >
          <div
            className="mb-1 text-[8.5px] uppercase tracking-wider font-semibold text-right"
            style={{ color: pitcherAccent }}
          >
            Pitcher · season
          </div>
          <div className="grid grid-cols-3 gap-1">
            <Tile label="ERA" value={pitcherSeason?.era ?? '—'} />
            <Tile label="WHIP" value={pitcherSeason?.whip ?? '—'} />
            <Tile
              label="K/9"
              value={pitcherSeason?.strikeoutsPer9Inn ?? '—'}
            />
          </div>
          <div className="mt-1 grid grid-cols-3 gap-1">
            <Tile
              label="W-L"
              value={
                pitcherSeason
                  ? `${pitcherSeason.wins}-${pitcherSeason.losses}`
                  : '—'
              }
            />
            <Tile
              label="K"
              value={pitcherSeason?.strikeOuts ?? '—'}
            />
            <Tile
              label="BB"
              value={pitcherSeason?.baseOnBalls ?? '—'}
            />
          </div>
          <div className="mt-1 grid grid-cols-3 gap-1">
            <Tile
              label="HR"
              value={pitcherSeason?.homeRuns ?? '—'}
            />
            <Tile
              label="IP"
              value={pitcherSeason?.inningsPitched ?? '—'}
            />
            <Tile
              label="P"
              value={pitchCountToday(game, play.pitcher.id)}
              accent={TEAM_GOLD}
            />
          </div>
          {!pitcherSeason && pitcher.loading && (
            <div className="mt-1 text-[10px] italic text-gray-600 text-center">
              loading…
            </div>
          )}
        </div>
      </div>

      {/* ─── Pitch sequence (this AB) ───────────────────────────────── */}
      {pitches.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-gray-500">
            <span>This AB · {pitches.length} pitch{pitches.length === 1 ? '' : 'es'}</span>
            <span className="flex flex-wrap gap-x-2 gap-y-0.5 normal-case tracking-normal">
              {(Object.keys(PITCH_LABELS) as PitchCategory[]).map(cat => {
                const n = dist[cat] ?? 0;
                if (n === 0) return null;
                return (
                  <span key={cat} className="flex items-center gap-1 tabular-nums">
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

      {/* ─── Footer: result OR on-deck row ──────────────────────────── */}
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
        (game.onDeck || game.inHole) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/5 pt-1.5">
            {game.onDeck && <NextUpChip label="On deck" person={game.onDeck} />}
            {game.inHole && <NextUpChip label="In hole" person={game.inHole} />}
          </div>
        )
      )}
    </div>
  );
}
