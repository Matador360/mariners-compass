import type { SavantArsenalPitch } from '@/lib/savant';
import { cn } from '@/lib/utils';

interface RealPitchArsenalProps {
  pitches: SavantArsenalPitch[];
}

function RunValueChip({ rv }: { rv: number | undefined }) {
  if (rv == null) return null;
  const good = rv < 0;
  return (
    <span
      className={cn(
        'text-[9px] font-bold px-1.5 py-0.5 rounded tabular-nums',
        good ? 'bg-green-500/15 text-green-400 border border-green-500/20'
             : 'bg-red-500/15 text-red-400 border border-red-500/20',
      )}
    >
      {rv > 0 ? '+' : ''}{rv.toFixed(1)} RV/100
    </span>
  );
}

export function RealPitchArsenal({ pitches }: RealPitchArsenalProps) {
  if (pitches.length === 0) return null;

  const sorted = [...pitches].sort((a, b) => (b.usagePct ?? 0) - (a.usagePct ?? 0));
  const maxUsage = sorted[0]?.usagePct ?? 1;

  return (
    <div className="space-y-2">
      {sorted.map((p) => {
        const name = p.pitchName ?? p.pitchType ?? 'Unknown';
        const usage = p.usagePct ?? 0;
        return (
          <div key={name} className="trident-card p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary">{name}</span>
                <RunValueChip rv={p.runValuePer100} />
              </div>
              <span className="text-xs font-bold text-teal tabular-nums">{usage.toFixed(1)}%</span>
            </div>

            {/* Usage bar */}
            <div className="h-1.5 rounded-full bg-white/5 mb-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-teal/70"
                style={{ width: `${(usage / maxUsage) * 100}%` }}
              />
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-4 gap-2">
              {([
                { label: 'Velo', value: p.velocity != null ? `${p.velocity.toFixed(1)}` : '—', unit: 'mph' },
                { label: 'Spin', value: p.spin != null ? `${Math.round(p.spin)}` : '—', unit: 'rpm' },
                { label: 'Whiff%', value: p.whiffPct != null ? `${p.whiffPct.toFixed(1)}%` : '—', unit: '' },
                { label: 'PutAway%', value: p.putAwayPct != null ? `${p.putAwayPct.toFixed(1)}%` : '—', unit: '' },
              ] as const).map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-[9px] text-muted uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-bold text-primary tabular-nums">{value}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
