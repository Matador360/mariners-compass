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
  sequenceSummary,
  type PitchCategory,
} from '@/lib/at-bat';
import { useBatterContext } from '@/lib/batter-context';
import { usePitcherContext } from '@/lib/pitcher-context';
import { StrikeZoneLive } from './charts/strike-zone-live';

function playerImg(id: number) {
  return `https://midfield.mlbstatic.com/v1/people/${id}/spots/120`;
}

function CountDots({ filled, total, color }: { filled: number; total: number; color: string }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: i < filled ? color : 'rgba(255,255,255,0.10)' }}
        />
      ))}
    </div>
  );
}

function PitchPill({ p, idx }: { p: ParsedPitch; idx: number }) {
  const cat = categorizePitch(p);
  const color = cat ? PITCH_COLORS[cat] : '#6b7280';
  const code = p.type?.code ?? '?';
  const speed = p.speed != null ? Math.round(p.speed) : null;
  return (
    <div
      className="flex items-center gap-1 rounded border border-white/5 bg-white/[0.02] px-1.5 py-0.5 text-[10px] tabular-nums"
      title={`${p.type?.description ?? code}${speed ? ` · ${speed} mph` : ''} · ${cat ? PITCH_LABELS[cat] : ''}`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      <span className="text-gray-500">#{p.pitchNumber ?? idx + 1}</span>
      <span className="font-semibold text-gray-200">{code}</span>
      {speed != null && <span className="text-gray-400">{speed}</span>}
    </div>
  );
}

function NextUpRow({
  label,
  person,
  jersey,
  position,
}: {
  label: string;
  person: PersonRef;
  jersey?: string;
  position?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={playerImg(person.id)}
        alt={person.fullName}
        width={32}
        height={32}
        className="h-8 w-8 rounded-full border border-white/10 bg-white/5 object-cover flex-shrink-0"
        onError={e => {
          (e.target as HTMLImageElement).style.visibility = 'hidden';
        }}
      />
      <div className="min-w-0">
        <div className="text-[9px] uppercase tracking-wider text-gray-500">{label}</div>
        <div className="text-xs font-semibold text-gray-200 truncate leading-tight">
          {person.fullName}
        </div>
        {(jersey || position) && (
          <div className="text-[10px] text-gray-500 leading-tight">
            {jersey && `#${jersey}`}
            {jersey && position && ' · '}
            {position}
          </div>
        )}
      </div>
    </div>
  );
}

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
  const halfLabel = game.inningHalf === 'top' ? 'Top' : game.inningHalf === 'bottom' ? 'Bot' : '';

  const dist = pitches.reduce<Record<PitchCategory, number>>(
    (acc, p) => {
      const c = categorizePitch(p);
      if (c) acc[c] = (acc[c] ?? 0) + 1;
      return acc;
    },
    {} as Record<PitchCategory, number>,
  );

  const batSide = game.currentMatchup?.batSide ?? (play.batSide as 'L' | 'R' | undefined);
  const pitchHand = game.currentMatchup?.pitchHand ?? (play.pitchHand as 'L' | 'R' | undefined);

  const batterMeta = game.players?.[play.batter.id];
  const pitcherMeta = game.players?.[play.pitcher.id];
  const onDeckMeta = game.onDeck ? game.players?.[game.onDeck.id] : undefined;
  const inHoleMeta = game.inHole ? game.players?.[game.inHole.id] : undefined;

  const batterLine = batterLineToday(game, play.batter.id);
  const pitcherLine = pitcherStatsToday(game, play.pitcher.id);
  const pitcherSeason = pitcher.seasonStats;
  const batterSeason = batter.seasonStats;

  return (
    <div className="trident-card trident-card-glow p-4 space-y-3">
      {/* header: inning, count, outs */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            AT BAT
          </span>
          {halfLabel && game.inning != null && (
            <span className="tabular-nums">
              {halfLabel} {game.inning}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 text-[10px] uppercase tracking-wider">B</span>
            <CountDots filled={balls} total={3} color="#3b82f6" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 text-[10px] uppercase tracking-wider">S</span>
            <CountDots filled={strikes} total={2} color="#ef4444" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 text-[10px] uppercase tracking-wider">O</span>
            <CountDots filled={outs} total={2} color="#fbbf24" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto] gap-4 items-start">
        {/* Batter card */}
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={playerImg(play.batter.id)}
            alt={play.batter.fullName}
            width={64}
            height={64}
            className="h-16 w-16 rounded-full border border-white/10 bg-white/5 object-cover flex-shrink-0"
            onError={e => {
              (e.target as HTMLImageElement).style.visibility = 'hidden';
            }}
          />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-gray-500">At bat</div>
            <div className="font-semibold text-sm leading-tight">
              <span className="truncate">{play.batter.fullName}</span>
              {batterMeta?.jerseyNumber && (
                <span className="text-gray-500 ml-1.5 font-normal">
                  #{batterMeta.jerseyNumber}
                </span>
              )}
              {batterMeta?.position && (
                <span className="text-gray-500 ml-1 font-normal">{batterMeta.position}</span>
              )}
              {batSide && <span className="text-gray-500 ml-1.5 font-normal">{batSide}HH</span>}
            </div>
            <div className="mt-1 text-xs text-gray-300 tabular-nums">
              <span className="font-semibold text-gray-100">{batterLine.hab}</span>
              {batterSeason && (
                <span className="text-gray-400">
                  {batterSeason.avg && `, ${batterSeason.avg} AVG`}
                  {batterSeason.ops && `, ${batterSeason.ops} OPS`}
                  {batterSeason.homeRuns != null && `, ${batterSeason.homeRuns} HR`}
                </span>
              )}
              {!batterSeason && batter.loading && (
                <span className="text-gray-600 italic ml-1">loading…</span>
              )}
            </div>
            {/* Statcast expected line */}
            {batter.expected && (
              <div className="mt-1 grid grid-cols-3 gap-x-2 text-[11px] tabular-nums max-w-[200px]">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-gray-500">xBA</div>
                  <div className="font-semibold text-gray-200">
                    {batter.expected.estBA != null ? batter.expected.estBA.toFixed(3).replace(/^0/, '') : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-gray-500">xSLG</div>
                  <div className="font-semibold text-gray-200">
                    {batter.expected.estSLG != null ? batter.expected.estSLG.toFixed(3).replace(/^0/, '') : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-gray-500">xwOBA</div>
                  <div className="font-semibold text-gray-200">
                    {batter.expected.estWOBA != null ? batter.expected.estWOBA.toFixed(3).replace(/^0/, '') : '—'}
                  </div>
                </div>
              </div>
            )}
            {batter.summary && (
              <div className="mt-1 flex flex-wrap gap-x-2 text-[10px] text-gray-500 tabular-nums">
                <span>EV {batter.summary.avgExitVelo.toFixed(1)}</span>
                <span>HH {batter.summary.hardHitPct.toFixed(0)}%</span>
                <span>BRL {batter.summary.brlPct.toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Strike zone */}
        <div className="justify-self-center">
          <StrikeZoneLive
            pitches={pitches}
            zone={zone}
            batSide={batSide}
            heatmap={batter.heatmap}
            caption={`AB · ${pitches.length} pitch${pitches.length === 1 ? '' : 'es'}`}
          />
        </div>

        {/* Pitcher card */}
        <div className="flex items-start gap-3 lg:flex-row-reverse lg:text-right">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={playerImg(play.pitcher.id)}
            alt={play.pitcher.fullName}
            width={64}
            height={64}
            className="h-16 w-16 rounded-full border border-white/10 bg-white/5 object-cover flex-shrink-0"
            onError={e => {
              (e.target as HTMLImageElement).style.visibility = 'hidden';
            }}
          />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-gray-500">Pitching</div>
            <div className="font-semibold text-sm leading-tight">
              <span className="truncate">{play.pitcher.fullName}</span>
              {pitcherMeta?.jerseyNumber && (
                <span className="text-gray-500 ml-1.5 font-normal">
                  #{pitcherMeta.jerseyNumber}
                </span>
              )}
              {pitcherMeta?.position && (
                <span className="text-gray-500 ml-1 font-normal">{pitcherMeta.position}</span>
              )}
              {pitchHand && (
                <span className="text-gray-500 ml-1.5 font-normal">{pitchHand}HP</span>
              )}
            </div>
            <div className="mt-1 text-xs text-gray-300 tabular-nums">
              <span className="font-semibold text-gray-100">{pitcherLine.ip} IP</span>
              <span className="text-gray-400">
                {' '}({pitcherLine.pitches}P {pitcherLine.strikes}S)
              </span>
              {pitcherSeason && (
                <span className="text-gray-400">, {pitcherSeason.era} ERA</span>
              )}
              {!pitcherSeason && pitcher.loading && (
                <span className="text-gray-600 italic ml-1">loading…</span>
              )}
            </div>
            <div className="mt-1 grid grid-cols-3 gap-x-2 text-[11px] tabular-nums max-w-[200px] lg:ml-auto">
              <div>
                <div className="text-[9px] uppercase tracking-wider text-gray-500">K</div>
                <div className="font-semibold text-gray-200">{pitcherLine.strikeouts}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wider text-gray-500">BB</div>
                <div className="font-semibold text-gray-200">{pitcherLine.walks}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wider text-gray-500">H</div>
                <div className="font-semibold text-gray-200">{pitcherLine.hits}</div>
              </div>
            </div>
            {pitcherSeason && (
              <div className="mt-1 flex flex-wrap gap-x-2 text-[10px] text-gray-500 tabular-nums lg:justify-end">
                <span>{pitcherSeason.whip} WHIP</span>
                <span>{pitcherSeason.strikeoutsPer9Inn} K/9</span>
                <span>{pitcherSeason.wins}-{pitcherSeason.losses}</span>
              </div>
            )}
          </div>
        </div>

        {/* On-deck / in-hole sidebar */}
        {(game.onDeck || game.inHole) && (
          <div className="flex flex-row lg:flex-col gap-3 lg:gap-2 lg:border-l lg:border-white/5 lg:pl-3">
            {game.onDeck && (
              <NextUpRow
                label="On Deck"
                person={game.onDeck}
                jersey={onDeckMeta?.jerseyNumber}
                position={onDeckMeta?.position}
              />
            )}
            {game.inHole && (
              <NextUpRow
                label="In The Hole"
                person={game.inHole}
                jersey={inHoleMeta?.jerseyNumber}
                position={inHoleMeta?.position}
              />
            )}
          </div>
        )}
      </div>

      {/* Pitch sequence strip */}
      {pitches.length > 0 && (
        <div className="border-t border-white/5 pt-2">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">Sequence</div>
          <div className="flex flex-wrap gap-1">
            {pitches.map((p, i) => (
              <PitchPill key={i} p={p} idx={i} />
            ))}
          </div>
          {pitches.length >= 2 && (
            <p className="mt-2 text-[11px] text-gray-500 italic font-mono">
              {sequenceSummary(pitches)}
            </p>
          )}
        </div>
      )}

      {/* Pitch category legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-500 border-t border-white/5 pt-2">
        {(Object.keys(PITCH_LABELS) as PitchCategory[]).map(cat => {
          const n = dist[cat] ?? 0;
          if (n === 0) return null;
          return (
            <span key={cat} className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: PITCH_COLORS[cat] }} />
              {PITCH_LABELS[cat]} <span className="text-gray-600 tabular-nums">{n}</span>
            </span>
          );
        })}
        <span className="ml-auto text-gray-600 tabular-nums">
          {pitchCountToday(game, play.pitcher.id)} pitches today
        </span>
      </div>

      {/* If the AB just ended, surface the result. */}
      {ab.isComplete && play.event && (
        <div className="rounded bg-white/[0.04] px-2 py-1.5 text-xs">
          <span className="text-gray-500 mr-1.5">Result:</span>
          <span className="font-semibold text-gray-200">{play.event}</span>
          <span className="text-gray-400 ml-1.5">— {play.description}</span>
        </div>
      )}
    </div>
  );
}
