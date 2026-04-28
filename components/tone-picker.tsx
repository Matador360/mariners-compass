"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { TONES, getToneMeta, type Tone } from "@/lib/tone";
import { cn } from "@/lib/utils";

interface Props {
  value: Tone;
  onChange: (id: Tone) => void;
  className?: string;
}

export function TonePicker({ value, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(() =>
    Math.max(0, TONES.findIndex((t) => t.id === value)),
  );
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const current = getToneMeta(value);

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
        setFocusIdx((i) => (i + 1) % TONES.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusIdx((i) => (i - 1 + TONES.length) % TONES.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const picked = TONES[focusIdx];
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
          setFocusIdx(Math.max(0, TONES.findIndex((t) => t.id === value)));
          setOpen((v) => !v);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Caption tone: ${current.label}`}
        title="Caption tone — your call. (Press T to cycle)"
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
          aria-label="Choose caption tone"
          className="absolute right-0 top-full mt-2 w-72 rounded-xl py-1.5 z-[80]"
          style={{
            background: "rgba(9, 24, 43, 0.96)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(180,200,220,0.12)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,163,163,0.1)",
          }}
        >
          <div className="px-3 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
            Caption tone
          </div>
          {TONES.map((t, idx) => {
            const selected = t.id === value;
            const focused = idx === focusIdx;
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
                  "w-full flex items-start gap-3 px-3 py-2 text-left transition-colors",
                  focused ? "bg-white/[0.06]" : "hover:bg-white/[0.04]",
                )}
              >
                <span aria-hidden className="text-lg leading-none w-6 text-center pt-0.5">
                  {t.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary truncate">{t.label}</span>
                  </div>
                  <div className="text-[11px] text-muted truncate">{t.description}</div>
                  <div className="text-[11px] text-secondary italic mt-0.5 truncate">
                    &ldquo;{t.preview}&rdquo;
                  </div>
                </div>
                {selected ? (
                  <Check size={14} className="text-teal shrink-0 mt-1" />
                ) : (
                  <span className="w-[14px] shrink-0" aria-hidden />
                )}
              </button>
            );
          })}
          <div className="px-3 pt-1.5 pb-2 text-[10px] text-muted/70 border-t border-white/[0.05] mt-1">
            Press <kbd className="font-mono px-1 py-px rounded bg-white/[0.06]">T</kbd> anywhere to cycle.
          </div>
        </div>
      )}
    </div>
  );
}
