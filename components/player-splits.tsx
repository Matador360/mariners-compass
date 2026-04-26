import { cn } from "@/lib/utils";

export interface SplitRow {
  label: string;
  avg: string;
  ops: string;
  hr: number;
  rbi: number;
  ab: number;
  h: number;
  highlight?: boolean;
}

export interface SplitGroup {
  title: string;
  rows: SplitRow[];
}

interface PlayerSplitsProps {
  groups: SplitGroup[];
  isPitcher?: boolean;
  className?: string;
}

export interface PitcherSplitRow {
  label: string;
  era: string;
  whip: string;
  k9: string;
  ip: number;
  highlight?: boolean;
}

interface PitcherSplitsProps {
  groups: Array<{ title: string; rows: PitcherSplitRow[] }>;
  className?: string;
}

function deltaClass(val: string, base: string, higherBetter = true): string {
  const v = parseFloat(val);
  const b = parseFloat(base);
  if (isNaN(v) || isNaN(b)) return "text-secondary";
  const diff = v - b;
  if (Math.abs(diff) < 0.005) return "text-secondary";
  const better = higherBetter ? diff > 0 : diff < 0;
  return better ? "text-green-400" : "text-red-400";
}

function SplitTable({ rows, opsBase }: { rows: SplitRow[]; opsBase?: string }) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-border">
          <th className="text-left py-1 pr-2 text-[10px] text-muted font-semibold">Split</th>
          <th className="text-right py-1 px-1 text-[10px] text-muted font-semibold">AB</th>
          <th className="text-right py-1 px-1 text-[10px] text-muted font-semibold">AVG</th>
          <th className="text-right py-1 px-1 text-[10px] text-muted font-semibold">OPS</th>
          <th className="text-right py-1 px-1 text-[10px] text-muted font-semibold">HR</th>
          <th className="text-right py-1 pl-1 text-[10px] text-muted font-semibold">RBI</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr
            key={i}
            className={cn(
              "border-b border-border/30 last:border-0",
              row.highlight && "bg-teal/5"
            )}
          >
            <td className={cn("py-1.5 pr-2 font-medium", row.highlight ? "text-teal" : "text-secondary")}>
              {row.label}
            </td>
            <td className="text-right py-1.5 px-1 tabular-nums text-muted">{row.ab}</td>
            <td className="text-right py-1.5 px-1 tabular-nums font-bold text-primary">{row.avg}</td>
            <td className={cn(
              "text-right py-1.5 px-1 tabular-nums font-bold",
              opsBase ? deltaClass(row.ops, opsBase) : "text-primary"
            )}>
              {row.ops}
            </td>
            <td className="text-right py-1.5 px-1 tabular-nums text-secondary">{row.hr}</td>
            <td className="text-right py-1.5 pl-1 tabular-nums text-secondary">{row.rbi}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PitcherSplitTable({ rows }: { rows: PitcherSplitRow[] }) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-border">
          <th className="text-left py-1 pr-2 text-[10px] text-muted font-semibold">Split</th>
          <th className="text-right py-1 px-1 text-[10px] text-muted font-semibold">IP</th>
          <th className="text-right py-1 px-1 text-[10px] text-muted font-semibold">ERA</th>
          <th className="text-right py-1 px-1 text-[10px] text-muted font-semibold">WHIP</th>
          <th className="text-right py-1 pl-1 text-[10px] text-muted font-semibold">K/9</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className={cn("border-b border-border/30 last:border-0", row.highlight && "bg-teal/5")}>
            <td className={cn("py-1.5 pr-2 font-medium", row.highlight ? "text-teal" : "text-secondary")}>
              {row.label}
            </td>
            <td className="text-right py-1.5 px-1 tabular-nums text-muted">{row.ip.toFixed(1)}</td>
            <td className="text-right py-1.5 px-1 tabular-nums font-bold text-primary">{row.era}</td>
            <td className="text-right py-1.5 px-1 tabular-nums font-bold text-primary">{row.whip}</td>
            <td className="text-right py-1.5 pl-1 tabular-nums text-green-400 font-bold">{row.k9}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function PlayerSplits({ groups, isPitcher, className }: PlayerSplitsProps) {
  if (!groups.length) return null;

  return (
    <div className={cn("trident-card p-5", className)}>
      <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-4">
        📊 Situational Splits
      </p>
      <div className="space-y-5">
        {groups.map((group, gi) => (
          <div key={gi}>
            <p className="text-[10px] font-bold text-teal uppercase tracking-wider mb-2">
              {group.title}
            </p>
            <SplitTable
              rows={group.rows}
              opsBase={group.rows.find((r) => r.highlight)?.ops}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PitcherSplits({ groups, className }: PitcherSplitsProps) {
  if (!groups.length) return null;

  return (
    <div className={cn("trident-card p-5", className)}>
      <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-4">
        📊 Situational Splits
      </p>
      <div className="space-y-5">
        {groups.map((group, gi) => (
          <div key={gi}>
            <p className="text-[10px] font-bold text-teal uppercase tracking-wider mb-2">
              {group.title}
            </p>
            <PitcherSplitTable rows={group.rows} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Build splits from player season stats (hitter)
export function buildHitterSplits(stats: {
  vsLeft?: { avg?: string; ops?: string; hr?: number; rbi?: number; atBats?: number; hits?: number };
  vsRight?: { avg?: string; ops?: string; hr?: number; rbi?: number; atBats?: number; hits?: number };
  home?: { avg?: string; ops?: string; hr?: number; rbi?: number; atBats?: number; hits?: number };
  away?: { avg?: string; ops?: string; hr?: number; rbi?: number; atBats?: number; hits?: number };
  risp?: { avg?: string; ops?: string; hr?: number; rbi?: number; atBats?: number; hits?: number };
  runnersOn?: { avg?: string; ops?: string; hr?: number; rbi?: number; atBats?: number; hits?: number };
  day?: { avg?: string; ops?: string; hr?: number; rbi?: number; atBats?: number; hits?: number };
  night?: { avg?: string; ops?: string; hr?: number; rbi?: number; atBats?: number; hits?: number };
}): SplitGroup[] {
  const groups: SplitGroup[] = [];

  const toRow = (
    label: string,
    s?: { avg?: string; ops?: string; hr?: number; rbi?: number; atBats?: number; hits?: number },
    highlight = false
  ): SplitRow | null => {
    if (!s) return null;
    return {
      label,
      avg: s.avg ?? ".000",
      ops: s.ops ?? ".000",
      hr: s.hr ?? 0,
      rbi: s.rbi ?? 0,
      ab: s.atBats ?? 0,
      h: s.hits ?? 0,
      highlight,
    };
  };

  if (stats.vsLeft || stats.vsRight) {
    const rows = [
      toRow("vs LHP", stats.vsLeft),
      toRow("vs RHP", stats.vsRight),
    ].filter(Boolean) as SplitRow[];
    if (rows.length) groups.push({ title: "By Handedness", rows });
  }

  if (stats.home || stats.away) {
    const rows = [
      toRow("Home", stats.home),
      toRow("Away", stats.away),
    ].filter(Boolean) as SplitRow[];
    if (rows.length) groups.push({ title: "Home / Away", rows });
  }

  if (stats.risp || stats.runnersOn) {
    const rows = [
      toRow("RISP", stats.risp, true),
      toRow("Runners On", stats.runnersOn),
    ].filter(Boolean) as SplitRow[];
    if (rows.length) groups.push({ title: "Runners On Base", rows });
  }

  if (stats.day || stats.night) {
    const rows = [
      toRow("Day", stats.day),
      toRow("Night", stats.night),
    ].filter(Boolean) as SplitRow[];
    if (rows.length) groups.push({ title: "Day / Night", rows });
  }

  return groups;
}
