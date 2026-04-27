export interface DisciplineMetrics {
  swstrPct: number;
  cswPct: number;
  contactPct: number;
  chasePct: number;
  zonePct: number;
}

interface PlateDisciplineBarsProps {
  metrics: DisciplineMetrics;
  perspective?: 'batter' | 'pitcher';
}

const LEAGUE_AVG: DisciplineMetrics = {
  swstrPct:  0.110,
  cswPct:    0.280,
  contactPct:0.780,
  chasePct:  0.310,
  zonePct:   0.450,
};

const ROWS = [
  { key: 'swstrPct'  as keyof DisciplineMetrics, label: 'SwStr%',   cap: 0.22  },
  { key: 'cswPct'    as keyof DisciplineMetrics, label: 'CSW%',     cap: 0.45  },
  { key: 'contactPct'as keyof DisciplineMetrics, label: 'Contact%', cap: 1.00  },
  { key: 'chasePct'  as keyof DisciplineMetrics, label: 'Chase%',   cap: 0.55  },
  { key: 'zonePct'   as keyof DisciplineMetrics, label: 'Zone%',    cap: 0.65  },
];

export function PlateDisciplineBars({ metrics }: PlateDisciplineBarsProps) {
  return (
    <div className="space-y-2.5">
      {ROWS.map(({ key, label, cap }) => {
        const val = metrics[key];
        const avg = LEAGUE_AVG[key];
        const pct    = Math.min(1, val / cap) * 100;
        const avgPct = Math.min(1, avg / cap) * 100;
        const display = `${(val * 100).toFixed(1)}%`;

        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted uppercase tracking-wider">{label}</span>
              <span className="text-xs font-bold text-primary tabular-nums">{display}</span>
            </div>
            <div className="relative h-2 rounded-full bg-white/5 overflow-visible">
              {/* Fill */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-teal/70"
                style={{ width: `${pct}%` }}
              />
              {/* League avg marker */}
              <div
                className="absolute top-[-2px] bottom-[-2px] w-[2px] rounded bg-amber-400/80"
                style={{ left: `${avgPct}%` }}
                title={`MLB avg: ${(avg * 100).toFixed(1)}%`}
              />
            </div>
          </div>
        );
      })}

      <p className="text-[9px] text-muted/50 pt-1">
        <span className="inline-block w-2 h-2 rounded-sm bg-amber-400/70 mr-1" />
        MLB avg marker
      </p>
    </div>
  );
}
