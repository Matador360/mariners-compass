'use client';

import { useState, useMemo } from 'react';
import type { SavantPitch, SavantArsenalPitch, SavantExpected } from '@/lib/savant';
import {
  batterSprayChartData,
  batterZoneStats,
  pitcherSwingMetrics,
  computeBatterStatcastSummary,
} from '@/lib/savant';
import { SprayChart } from '@/components/charts/spray-chart';
import { ZoneHeatmap, type ZoneCell } from '@/components/charts/zone-heatmap';
import { RealPitchArsenal } from '@/components/charts/real-pitch-arsenal';
import { PlateDisciplineBars } from '@/components/plate-discipline-bars';
import { cn } from '@/lib/utils';

// ─── Pitch type abbreviation labels ─────────────────────────────────────────
const PITCH_NAMES: Record<string, string> = {
  FF: '4-Seam', SI: 'Sinker', FC: 'Cutter', SL: 'Slider', SW: 'Sweeper',
  CU: 'Curve', CH: 'Change', FS: 'Splitter', KN: 'Knuckle', ST: 'Sweeper',
  SV: 'Slurve', CS: 'Slow Curve', EP: 'Eephus',
};

// ─── League averages for key metric tiles ────────────────────────────────────
const HITTER_AVGS = { exitVelo: 88.6, barrelPct: 7.5, hardHitPct: 37.0, sprintSpeed: 27.0, xBA: 0.245, xwOBA: 0.315 };
const PITCHER_AVGS = { fbVelo: 93.8, fbSpin: 2300, whiffPct: 11.0, cswPct: 28.0, chasePct: 31.0 };

// ─── Helpers ─────────────────────────────────────────────────────────────────
const SWING_DESCS = new Set(['hit_into_play','hit_into_play_no_out','hit_into_play_score','swinging_strike','swinging_strike_blocked','foul','foul_tip']);
const WHIFF_DESCS = new Set(['swinging_strike','swinging_strike_blocked']);

function pctBar(val: number, avg: number, lo: number, hi: number) {
  const width = Math.max(2, Math.min(100, ((val - lo) / (hi - lo)) * 100));
  const avgW  = Math.max(0, Math.min(100, ((avg - lo) / (hi - lo)) * 100));
  return { width, avgW };
}

function PercentileBar({ val, avg, lo, hi }: { val: number; avg: number; lo: number; hi: number }) {
  const { width, avgW } = pctBar(val, avg, lo, hi);
  return (
    <div className="relative h-1 rounded-full bg-white/5 overflow-visible mt-1">
      <div className="absolute inset-y-0 left-0 rounded-full bg-teal/60" style={{ width: `${width}%` }} />
      <div className="absolute top-[-2px] bottom-[-2px] w-[2px] rounded bg-amber-400/70" style={{ left: `${avgW}%` }} />
    </div>
  );
}

function MetricTile({ label, value, unit, avg, lo, hi }: {
  label: string; value: string | undefined; unit?: string; avg: number; lo: number; hi: number;
}) {
  return (
    <div className="p-3 rounded-xl bg-surface-2/50 border border-border">
      <p className="text-[9px] text-muted uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-lg font-black tabular-nums text-primary leading-none">
        {value ?? '—'}<span className="text-[10px] font-normal text-muted ml-0.5">{unit}</span>
      </p>
      <PercentileBar val={Number(value) || 0} avg={avg} lo={lo} hi={hi} />
    </div>
  );
}

// ─── Pitcher zone computation ─────────────────────────────────────────────────
type PitcherZoneMetric = 'whiffPct' | 'chasePct' | 'strikePct';

function computePitcherZones(pitches: SavantPitch[], metric: PitcherZoneMetric) {
  type ZAcc = { total: number; swings: number; whiffs: number; cs: number };
  const by = new Map<number, ZAcc>();

  for (const p of pitches) {
    const z = p.zone;
    if (z == null || z < 1 || z > 14) continue;
    if (!by.has(z)) by.set(z, { total: 0, swings: 0, whiffs: 0, cs: 0 });
    const acc = by.get(z)!;
    acc.total++;
    const desc = p.description ?? '';
    if (SWING_DESCS.has(desc)) acc.swings++;
    if (WHIFF_DESCS.has(desc)) acc.whiffs++;
    if (desc === 'called_strike') acc.cs++;
  }

  const cells: ZoneCell[] = [];
  for (const [zone, z] of by.entries()) {
    if (z.total < 5) continue;
    let value = 0;
    if (metric === 'whiffPct')   value = z.swings  > 0 ? z.whiffs / z.swings : 0;
    if (metric === 'chasePct')   value = zone > 9 && z.total > 0 ? z.swings / z.total : 0;
    if (metric === 'strikePct')  value = z.total > 0 ? (z.swings + z.cs) / z.total : 0;
    cells.push({ zone, value, label: `${(value * 100).toFixed(0)}%` });
  }
  return cells;
}

// ─── Batter zone computation ──────────────────────────────────────────────────
type BatterZoneMetric = 'ba' | 'slg' | 'whiffPct';

function buildBatterZoneCells(pitches: SavantPitch[], metric: BatterZoneMetric): ZoneCell[] {
  const raw = batterZoneStats(pitches).map(z => ({
    ...z,
    whiffPct: z.swings > 0 ? z.whiffs / z.swings : 0,
  }));
  return raw.map(z => {
    const v = z[metric];
    const label = metric === 'ba' || metric === 'slg'
      ? v.toFixed(3).replace(/^0\./, '.')
      : `${(v * 100).toFixed(0)}%`;
    return { zone: z.zone, value: v, label };
  });
}

// ─── Filter toggle button ─────────────────────────────────────────────────────
function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 rounded text-[10px] font-semibold transition-colors',
        active ? 'bg-teal text-white' : 'bg-surface-2 text-muted hover:text-primary',
      )}
    >
      {children}
    </button>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="trident-card p-10 text-center">
      <p className="text-2xl mb-2">📡</p>
      <p className="font-semibold text-primary mb-1">No Statcast Data</p>
      <p className="text-sm text-muted max-w-xs mx-auto">
        Statcast data may not be available yet for this player or season. Check back after the first pitch.
      </p>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface PlayerStatcastTabProps {
  pitches: SavantPitch[];
  arsenal: SavantArsenalPitch[];
  expected: SavantExpected | null;
  sprintSpeed: number | null;
  isPitcher: boolean;
  year: number;
}

// ─── Main tab ────────────────────────────────────────────────────────────────
export function PlayerStatcastTab({ pitches, arsenal, expected, sprintSpeed, isPitcher }: PlayerStatcastTabProps) {
  // Filter state
  const [pitchTypeFilter, setPitchTypeFilter] = useState<string>('All');
  const [handFilter, setHandFilter]           = useState<'All' | 'L' | 'R'>('All');
  const [strikesFilter, setStrikesFilter]     = useState<'All' | '0' | '1' | '2'>('All');
  const [zoneMetric, setZoneMetric]           = useState<BatterZoneMetric | PitcherZoneMetric>('ba');

  // Unique pitch types
  const pitchTypes = useMemo(() => {
    const types = [...new Set(pitches.map(p => p.pitchType).filter(Boolean) as string[])].sort();
    return types;
  }, [pitches]);

  // Filtered pitches
  const filtered = useMemo(() => {
    return pitches.filter(p => {
      if (pitchTypeFilter !== 'All' && p.pitchType !== pitchTypeFilter) return false;
      if (isPitcher) {
        if (handFilter !== 'All' && p.batterStand !== handFilter) return false;
      } else {
        if (handFilter !== 'All' && p.pitcherHand !== handFilter) return false;
      }
      if (!isPitcher && strikesFilter !== 'All' && String(p.strikes) !== strikesFilter) return false;
      return true;
    });
  }, [pitches, pitchTypeFilter, handFilter, strikesFilter, isPitcher]);

  const isEmpty = pitches.length === 0 && arsenal.length === 0 && !expected;
  if (isEmpty) return <EmptyState />;

  const handLabel = isPitcher ? 'vs LHH' : 'vs LHP';
  const handRLabel = isPitcher ? 'vs RHH' : 'vs RHP';

  return (
    <div className="space-y-6 fade-up">

      {/* ─── Filters ─────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">
        {pitchTypes.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            <FilterBtn active={pitchTypeFilter === 'All'} onClick={() => setPitchTypeFilter('All')}>All pitches</FilterBtn>
            {pitchTypes.map(t => (
              <FilterBtn key={t} active={pitchTypeFilter === t} onClick={() => setPitchTypeFilter(t)}>
                {PITCH_NAMES[t] ?? t}
              </FilterBtn>
            ))}
          </div>
        )}
        <div className="flex gap-1">
          <FilterBtn active={handFilter === 'All'} onClick={() => setHandFilter('All')}>All</FilterBtn>
          <FilterBtn active={handFilter === 'L'}   onClick={() => setHandFilter('L')}>{handLabel}</FilterBtn>
          <FilterBtn active={handFilter === 'R'}   onClick={() => setHandFilter('R')}>{handRLabel}</FilterBtn>
        </div>
        {!isPitcher && (
          <div className="flex gap-1">
            {(['All','0','1','2'] as const).map(s => (
              <FilterBtn key={s} active={strikesFilter === s} onClick={() => setStrikesFilter(s)}>
                {s === 'All' ? 'All K' : `${s}K`}
              </FilterBtn>
            ))}
          </div>
        )}
      </div>

      {isPitcher ? (
        <PitcherStatcastContent
          pitches={filtered}
          arsenal={arsenal}
          zoneMetric={zoneMetric as PitcherZoneMetric}
          setZoneMetric={m => setZoneMetric(m)}
          handFilter={handFilter}
        />
      ) : (
        <HitterStatcastContent
          pitches={filtered}
          expected={expected}
          sprintSpeed={sprintSpeed}
          zoneMetric={zoneMetric as BatterZoneMetric}
          setZoneMetric={m => setZoneMetric(m)}
        />
      )}

      <p className="text-[9px] text-muted/40 text-center">
        Statcast data from Baseball Savant · MLB · {new Date().getFullYear()}
      </p>
    </div>
  );
}

// ─── Hitter content ───────────────────────────────────────────────────────────
function HitterStatcastContent({
  pitches, expected, sprintSpeed, zoneMetric, setZoneMetric,
}: {
  pitches: SavantPitch[];
  expected: SavantExpected | null;
  sprintSpeed: number | null;
  zoneMetric: BatterZoneMetric;
  setZoneMetric: (m: BatterZoneMetric) => void;
}) {
  const sprayData = useMemo(() => batterSprayChartData(pitches), [pitches]);
  const discipline = useMemo(() => pitcherSwingMetrics(pitches), [pitches]);
  const zoneCells  = useMemo(() => buildBatterZoneCells(pitches, zoneMetric), [pitches, zoneMetric]);
  // Bug 6: when Savant's qualified-batter leaderboard hasn't picked up this
  // player yet (`expected` is null), fall back to per-pitch computed values
  // so EV / Hard Hit% / Barrel% show real numbers instead of "—".
  const fallback = useMemo(() => computeBatterStatcastSummary(pitches), [pitches]);
  const avgEV     = expected?.avgExitVelo ?? fallback?.avgExitVelo;
  const brlPct    = expected?.brlPct      ?? fallback?.brlPct;
  const hardHit   = expected?.hardHitPct  ?? fallback?.hardHitPct;

  return (
    <>
      {/* Key metrics */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-3">Key Metrics</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          <MetricTile label="Avg EV"       value={avgEV?.toFixed(1)}                 unit="mph" avg={HITTER_AVGS.exitVelo}  lo={80} hi={96} />
          <MetricTile label="Barrel%"      value={brlPct?.toFixed(1)}                unit="%"   avg={HITTER_AVGS.barrelPct} lo={0} hi={20} />
          <MetricTile label="Hard Hit%"    value={hardHit?.toFixed(1)}               unit="%"   avg={HITTER_AVGS.hardHitPct} lo={20} hi={55} />
          <MetricTile label="Sprint Speed" value={sprintSpeed?.toFixed(1)}           unit="ft/s" avg={HITTER_AVGS.sprintSpeed} lo={23} hi={31} />
          <MetricTile label="xBA"          value={expected?.estBA?.toFixed(3)?.replace(/^0\./,'.')} unit="" avg={HITTER_AVGS.xBA}   lo={0.18} hi={0.34} />
          <MetricTile label="xwOBA"        value={expected?.estWOBA?.toFixed(3)?.replace(/^0\./,'.')} unit="" avg={HITTER_AVGS.xwOBA} lo={0.25} hi={0.42} />
        </div>
      </div>

      {/* Spray chart */}
      <div className="trident-card p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">Spray Chart</p>
          <p className="text-[10px] text-muted">{sprayData.length} batted balls</p>
        </div>
        <SprayChart data={sprayData} />
      </div>

      {/* Zone heatmap */}
      <div className="trident-card p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">Zone Heatmap</p>
          <div className="flex gap-1">
            {(['ba','slg','whiffPct'] as const).map(m => (
              <FilterBtn key={m} active={zoneMetric === m} onClick={() => setZoneMetric(m)}>
                {m === 'ba' ? 'BA' : m === 'slg' ? 'SLG' : 'Whiff%'}
              </FilterBtn>
            ))}
          </div>
        </div>
        <div className="flex justify-center">
          <ZoneHeatmap cells={zoneCells} title={zoneMetric === 'ba' ? 'BA' : zoneMetric === 'slg' ? 'SLG' : 'Whiff%'} />
        </div>
      </div>

      {/* Plate discipline */}
      <div className="trident-card p-4">
        <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-4">Plate Discipline</p>
        <PlateDisciplineBars metrics={discipline} />
      </div>
    </>
  );
}

// ─── Pitcher content ──────────────────────────────────────────────────────────
function PitcherStatcastContent({
  pitches, arsenal, zoneMetric, setZoneMetric, handFilter,
}: {
  pitches: SavantPitch[];
  arsenal: SavantArsenalPitch[];
  zoneMetric: PitcherZoneMetric;
  setZoneMetric: (m: PitcherZoneMetric) => void;
  handFilter: 'All' | 'L' | 'R';
}) {
  const discipline = useMemo(() => pitcherSwingMetrics(pitches), [pitches]);
  const zoneCells  = useMemo(() => computePitcherZones(pitches, zoneMetric), [pitches, zoneMetric]);

  // FB metrics from arsenal
  const fbPitch = arsenal.find(p => p.pitchType === 'FF' || p.pitchType === 'SI');

  return (
    <>
      {/* Key metrics */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-3">Key Metrics</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <MetricTile label="Avg FB Velo"  value={fbPitch?.velocity?.toFixed(1)}    unit="mph" avg={PITCHER_AVGS.fbVelo}   lo={87} hi={100} />
          <MetricTile label="Avg FB Spin"  value={fbPitch?.spin != null ? String(Math.round(fbPitch.spin)) : undefined}  unit="rpm" avg={PITCHER_AVGS.fbSpin}   lo={1800} hi={2800} />
          <MetricTile label="SwStr%"       value={(discipline.swstrPct * 100).toFixed(1)} unit="%" avg={PITCHER_AVGS.whiffPct} lo={6} hi={18} />
          <MetricTile label="CSW%"         value={(discipline.cswPct  * 100).toFixed(1)}  unit="%" avg={PITCHER_AVGS.cswPct}   lo={18} hi={38} />
          <MetricTile label="Chase%"       value={(discipline.chasePct * 100).toFixed(1)} unit="%" avg={PITCHER_AVGS.chasePct} lo={22} hi={42} />
        </div>
      </div>

      {/* Pitch arsenal */}
      {arsenal.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-3">Pitch Arsenal</p>
          <RealPitchArsenal pitches={arsenal} />
        </div>
      )}

      {/* Zone heatmap */}
      <div className="trident-card p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">Zone Heatmap (Induced)</p>
          <div className="flex gap-1">
            {(['whiffPct','chasePct','strikePct'] as const).map(m => (
              <FilterBtn key={m} active={zoneMetric === m} onClick={() => setZoneMetric(m)}>
                {m === 'whiffPct' ? 'Whiff%' : m === 'chasePct' ? 'Chase%' : 'Strike%'}
              </FilterBtn>
            ))}
          </div>
        </div>
        <div className="flex justify-center">
          <ZoneHeatmap
            cells={zoneCells}
            handedness={handFilter}
            title={zoneMetric === 'whiffPct' ? 'Whiff%' : zoneMetric === 'chasePct' ? 'Chase%' : 'Strike%'}
          />
        </div>
      </div>

      {/* Plate discipline (induced) */}
      <div className="trident-card p-4">
        <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-4">Induced Discipline</p>
        <PlateDisciplineBars metrics={discipline} perspective="pitcher" />
      </div>
    </>
  );
}
