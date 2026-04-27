"use client";

import { cn } from "@/lib/utils";

export type PositionGroupMode = "list" | "grouped" | "best-at-each";

const OPTIONS: { key: PositionGroupMode; label: string }[] = [
  { key: "list", label: "List" },
  { key: "grouped", label: "By Position" },
  { key: "best-at-each", label: "Best at Each" },
];

export function PositionGroupToggle({
  mode,
  onChange,
}: {
  mode: PositionGroupMode;
  onChange: (m: PositionGroupMode) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {OPTIONS.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
            mode === o.key
              ? "bg-teal text-black border-teal"
              : "bg-surface-2 border-border text-secondary hover:border-border-accent",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
