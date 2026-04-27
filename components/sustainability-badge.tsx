import { cn } from "@/lib/utils";
import type { SustainabilityVerdict } from "@/lib/sustainability";

const STYLES: Record<
  SustainabilityVerdict["label"],
  { bg: string; text: string; border: string; label: string; emoji: string }
> = {
  real: {
    bg: "bg-teal/15",
    text: "text-teal",
    border: "border-teal/40",
    label: "Real",
    emoji: "✓",
  },
  lucky: {
    bg: "bg-amber-400/15",
    text: "text-amber-300",
    border: "border-amber-400/40",
    label: "Lucky",
    emoji: "🍀",
  },
  unlucky: {
    bg: "bg-purple-400/15",
    text: "text-purple-300",
    border: "border-purple-400/40",
    label: "Unlucky",
    emoji: "📉",
  },
  wait: {
    bg: "bg-surface-2",
    text: "text-secondary",
    border: "border-border",
    label: "Wait & See",
    emoji: "⏳",
  },
};

function ConfidenceDots({ confidence }: { confidence: number }) {
  const filled = Math.max(1, Math.min(5, Math.round(confidence * 5)));
  const dots = Array.from({ length: 5 }, (_, i) => (i < filled ? "●" : "○")).join("");
  return (
    <span className="text-[7px] tabular-nums tracking-tight opacity-80" aria-hidden="true">
      {dots}
    </span>
  );
}

export function SustainabilityBadge({ verdict }: { verdict: SustainabilityVerdict }) {
  const s = STYLES[verdict.label];
  const tooltip = `${verdict.reason} (${Math.round(verdict.confidence * 100)}% confidence)`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 h-6 rounded-full text-[10px] font-semibold border whitespace-nowrap",
        s.bg,
        s.text,
        s.border,
      )}
      title={tooltip}
      aria-label={`Sustainability: ${s.label}. ${verdict.reason}`}
    >
      <span className="text-[11px] leading-none">{s.emoji}</span>
      <span className="leading-none">{s.label}</span>
      <ConfidenceDots confidence={verdict.confidence} />
    </span>
  );
}
