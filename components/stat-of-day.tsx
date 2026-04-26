import { cn } from "@/lib/utils";

interface StatOfDayProps {
  title: string;
  value: string;
  context: string;
  emoji: string;
  className?: string;
}

export function StatOfDay({ title, value, context, emoji, className }: StatOfDayProps) {
  return (
    <div
      className={cn(
        "trident-card p-5 relative overflow-hidden flex items-center gap-4",
        className
      )}
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal to-teal/20 rounded-l-xl" />

      {/* Emoji */}
      <div className="text-3xl shrink-0 pl-2">{emoji}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-[10px] uppercase tracking-widest text-muted font-semibold">
            Stat of the Day
          </span>
          <span className="text-[10px] text-teal font-medium">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-2xl font-black text-primary stat-number">
            {value}
          </span>
          <p className="text-sm text-secondary leading-snug">{context}</p>
        </div>
      </div>
    </div>
  );
}
