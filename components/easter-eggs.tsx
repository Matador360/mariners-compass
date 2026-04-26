"use client";

import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";

const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

interface EasterEggState {
  active1995: boolean;
  refuseToLose: boolean;
}

export function EasterEggController({ winStreak = 0 }: { winStreak?: number }) {
  const [state, setState] = useState<EasterEggState>({
    active1995: false,
    refuseToLose: winStreak >= 3,
  });
  const [showRefuse, setShowRefuse] = useState(winStreak >= 3);
  const [konamiBuffer, setKonamiBuffer] = useState<string[]>([]);

  const activate1995 = useCallback(() => {
    setState((s) => ({ ...s, active1995: true }));
    document.documentElement.classList.add("theme-1995");
  }, []);

  const deactivate1995 = useCallback(() => {
    setState((s) => ({ ...s, active1995: false }));
    document.documentElement.classList.remove("theme-1995");
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      setKonamiBuffer((prev) => {
        const next = [...prev, e.key].slice(-KONAMI.length);
        if (next.join(",") === KONAMI.join(",")) {
          activate1995();
        }
        return next;
      });
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activate1995]);

  useEffect(() => {
    if (winStreak >= 3) {
      setShowRefuse(true);
      const t = setTimeout(() => setShowRefuse(false), 4000);
      return () => clearTimeout(t);
    }
  }, [winStreak]);

  return (
    <>
      {/* 1995 Mode Overlay */}
      {state.active1995 && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          {/* Retro header banner */}
          <div className="pointer-events-auto absolute top-0 left-0 right-0 bg-gradient-to-r from-[#005C5C] via-[#00B3B3] to-[#005C5C] text-white py-2 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚾</span>
              <div>
                <p className="text-sm font-black tracking-widest uppercase">1995 Mode Activated!</p>
                <p className="text-[10px] opacity-80">
                  Junior. The Double. Refuse to Lose. Best October ever.
                </p>
              </div>
            </div>
            <div className="text-xs text-right opacity-70">
              <p className="font-bold">Ken Griffey Jr.</p>
              <p>.258 / 17 HR / 42 RBI</p>
              <p>in the ALDS</p>
            </div>
            <button
              onClick={deactivate1995}
              className="ml-4 p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Close 1995 mode"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Refuse to Lose banner */}
      {showRefuse && (
        <div
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9998] pointer-events-none text-center"
          aria-hidden="true"
        >
          <p
            className="refuse-to-lose text-4xl md:text-7xl font-black tracking-[0.15em] uppercase"
            style={{
              color: "#FFB700",
              textShadow: "0 0 40px rgba(255,183,0,0.8), 0 0 80px rgba(255,183,0,0.4)",
            }}
          >
            Refuse to Lose
          </p>
          <p className="text-sm text-teal mt-2 opacity-80 tracking-widest">
            {winStreak}-game win streak 🔥
          </p>
        </div>
      )}
    </>
  );
}
