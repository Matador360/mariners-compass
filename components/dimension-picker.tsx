"use client";

import { cn } from "@/lib/utils";
import type { DimensionDef } from "@/lib/compare";

interface DimensionPickerProps {
  all: DimensionDef[];
  selected: DimensionDef[];
  onChange: (dims: DimensionDef[]) => void;
  storageKey: string;
}

const MIN = 3;
const MAX = 6;

export function DimensionPicker({ all, selected, onChange }: DimensionPickerProps) {
  function toggle(dim: DimensionDef) {
    const isOn = selected.some((d) => d.key === dim.key);
    if (isOn) {
      if (selected.length <= MIN) return; // can't go below min
      onChange(selected.filter((d) => d.key !== dim.key));
    } else {
      if (selected.length >= MAX) return; // can't exceed max
      // Preserve insertion order from `all`
      const next = all.filter(
        (d) => selected.some((s) => s.key === d.key) || d.key === dim.key
      );
      onChange(next);
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[9px] uppercase tracking-widest text-muted font-semibold">
          Radar Axes
        </p>
        <p className="text-[9px] text-muted/60">
          {selected.length}/{MAX} selected
        </p>
      </div>
      <div className="flex flex-wrap gap-1">
        {all.map((dim) => {
          const isOn = selected.some((d) => d.key === dim.key);
          const disabled =
            (isOn && selected.length <= MIN) ||
            (!isOn && selected.length >= MAX);
          return (
            <button
              key={dim.key}
              onClick={() => toggle(dim)}
              disabled={disabled}
              className={cn(
                "text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all",
                isOn
                  ? "bg-teal text-white border-teal"
                  : "bg-transparent text-muted border-border hover:border-teal/40",
                disabled && "opacity-40 cursor-not-allowed"
              )}
            >
              {dim.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
