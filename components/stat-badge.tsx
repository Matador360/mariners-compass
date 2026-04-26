import { cn, getStatDecoration } from "@/lib/utils";

interface StatBadgeProps {
  value: string | number;
  label: string;
  percentile?: number;
  className?: string;
  large?: boolean;
}

export function StatBadge({ value, label, percentile, className, large = false }: StatBadgeProps) {
  const deco = percentile !== undefined ? getStatDecoration(percentile) : null;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-0.5",
        className
      )}
    >
      <div className="flex items-baseline gap-1">
        <span
          className={cn(
            "font-bold stat-number tabular-nums",
            large ? "text-2xl" : "text-lg",
            deco?.glow
          )}
        >
          {value}
        </span>
        {deco?.emoji && (
          <span className="text-sm" title={`${Math.round(percentile ?? 0)}th percentile`}>
            {deco.emoji}
          </span>
        )}
      </div>
      <span className={cn("uppercase tracking-widest", large ? "text-xs" : "text-[10px]", "text-secondary font-medium")}>
        {label}
      </span>
      {percentile !== undefined && (
        <span
          className={cn(
            "text-[9px] px-1.5 py-0.5 rounded-full border font-medium mt-0.5",
            deco?.badge
          )}
        >
          {Math.round(percentile)}th%ile
        </span>
      )}
    </div>
  );
}

interface StatRowProps {
  stats: Array<{
    value: string | number;
    label: string;
    percentile?: number;
  }>;
  className?: string;
}

export function StatRow({ stats, className }: StatRowProps) {
  return (
    <div className={cn("flex items-start justify-around gap-2", className)}>
      {stats.map((s) => (
        <StatBadge key={s.label} {...s} />
      ))}
    </div>
  );
}
