import type { GraduationStatus } from "@/lib/graduation";
import { thresholdLabel } from "@/lib/graduation";
import { cn } from "@/lib/utils";

interface Props {
  status: GraduationStatus;
  className?: string;
}

export function GraduationCountdown({ status, className }: Props) {
  if (status.status === "graduated") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-surface-2/40 text-muted/60",
          className
        )}
        title={status.reason}
      >
        🎓 Graduated
      </span>
    );
  }

  if (status.status === "graduating-soon" && status.nearestThreshold) {
    const key = status.nearestThreshold;
    const remaining = status.remaining[key === "ip" ? "ip" : key === "ab" ? "ab" : "days"];
    const label = thresholdLabel(key);
    const display = key === "ip" ? remaining.toFixed(1) : Math.round(remaining);
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30",
          className
        )}
        title={status.reason}
      >
        ⏳ {display} {label} until graduation
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-surface-2/40 text-muted/70",
        className
      )}
      title={status.reason}
    >
      Eligible — {status.reason}
    </span>
  );
}
