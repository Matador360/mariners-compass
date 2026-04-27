"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { THEMES, getThemeMeta, type ThemeId } from "@/lib/theme-engine";
import { cn } from "@/lib/utils";

interface Props {
  value: ThemeId;
  onChange: (id: ThemeId) => void;
  resolvedId?: ThemeId;
  className?: string;
}

export function ThemePicker({ value, onChange, resolvedId, className }: Props) {
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(() =>
    Math.max(0, THEMES.findIndex((t) => t.id === value)),
  );
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const current = getThemeMeta(value);
  const resolved = resolvedId ? getThemeMeta(resolvedId) : null;

  useEffect(() => {
    if (!open) return;
    function onOutsideClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusIdx((i) => (i + 1) % THEMES.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusIdx((i) => (i - 1 + THEMES.length) % THEMES.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const picked = THEMES[focusIdx];
        if (picked) {
          onChange(picked.id);
          setOpen(false);
          buttonRef.current?.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, focusIdx, onChange]);

  return (
    <div className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setFocusIdx(Math.max(0, THEMES.findIndex((t) => t.id === value)));
          setOpen((v) => !v);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Theme: ${current.label}`}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:border-border-accent transition-colors text-secondary hover:text-primary text-sm"
      >
        <span aria-hidden className="text-base leading-none">
          {current.emoji}
        </span>
        <span className="hidden sm:inline font-medium">{current.label}</span>
        <ChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          ref={popoverRef}
          role="listbox"
          aria-label="Choose theme"
          className="absolute right-0 top-full mt-2 w-72 rounded-xl py-1.5 z-[80]"
          style={{
            background: "rgba(9, 24, 43, 0.96)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(180,200,220,0.12)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,163,163,0.1)",
          }}
        >
          {THEMES.map((t, idx) => {
            const selected = t.id === value;
            const focused = idx === focusIdx;
            const showResolved = t.id === "auto" && resolved && resolved.id !== "auto";
            return (
              <button
                key={t.id}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setFocusIdx(idx)}
                onClick={() => {
                  onChange(t.id);
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                  focused ? "bg-white/[0.06]" : "hover:bg-white/[0.04]",
                )}
              >
                <span aria-hidden className="text-lg leading-none w-6 text-center">
                  {t.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary truncate">{t.label}</span>
                    {showResolved && (
                      <span className="text-[10px] text-muted">
                        (currently {resolved!.label})
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted truncate">{t.description}</div>
                </div>
                <span
                  aria-hidden
                  className="w-4 h-4 rounded-md border border-white/10 shrink-0"
                  style={{
                    background:
                      t.swatch === "transparent"
                        ? "repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0 3px, transparent 3px 6px)"
                        : t.swatch,
                  }}
                />
                {selected ? (
                  <Check size={14} className="text-teal shrink-0" />
                ) : (
                  <span className="w-[14px] shrink-0" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
