"use client";

import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";

const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

export function EasterEggController({ winStreak = 0 }: { winStreak?: number }) {
  const [show1995, setShow1995] = useState(false);
  const [showRefuse, setShowRefuse] = useState(false);
  const [konamiBuffer, setKonamiBuffer] = useState<string[]>([]);

  const activate1995 = useCallback(() => {
    setShow1995(true);
    document.documentElement.classList.add("theme-1995");
  }, []);

  const deactivate1995 = useCallback(() => {
    setShow1995(false);
    document.documentElement.classList.remove("theme-1995");
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      setKonamiBuffer((prev) => {
        const next = [...prev, e.key].slice(-KONAMI.length);
        if (next.join(",") === KONAMI.join(",")) activate1995();
        return next;
      });
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activate1995]);

  useEffect(() => {
    if (winStreak >= 3) {
      const dismissed = sessionStorage.getItem("rtl-dismissed");
      if (!dismissed) setShowRefuse(true);
    }
  }, [winStreak]);

  const dismissRefuse = () => {
    setShowRefuse(false);
    sessionStorage.setItem("rtl-dismissed", "1");
  };

  return (
    <>
      {/* ── 1995 Mode ───────────────────────────────────────────────── */}
      {show1995 && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          <div className="pointer-events-auto absolute top-0 left-0 right-0 bg-gradient-to-r from-[#005C5C] via-[#00B3B3] to-[#005C5C] text-white py-2 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚾</span>
              <div>
                <p className="text-sm font-black tracking-widest uppercase">1995 Mode Activated!</p>
                <p className="text-[10px] opacity-80">Junior. The Double. Refuse to Lose. Best October ever.</p>
              </div>
            </div>
            <div className="text-xs text-right opacity-70">
              <p className="font-bold">Ken Griffey Jr.</p>
              <p>.258 / 17 HR / 42 RBI in the ALDS</p>
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

      {/* ── Refuse to Lose — premium broadcast lower-third ──────────── */}
      {showRefuse && (
        <div
          className="fixed left-0 right-0 z-[9990] flex justify-center px-4"
          style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <div
            className="flex items-center gap-4 px-5 py-3 rounded-2xl"
            style={{
              background:
                "linear-gradient(rgba(4,12,26,0.94), rgba(4,12,26,0.94)) padding-box," +
                "linear-gradient(135deg, rgba(0,163,163,0.55) 0%, rgba(255,183,0,0.5) 100%) border-box",
              border: "1px solid transparent",
              backdropFilter: "blur(28px) saturate(180%)",
              WebkitBackdropFilter: "blur(28px) saturate(180%)",
              boxShadow:
                "0 8px 40px rgba(0,0,0,0.6), 0 0 50px rgba(255,183,0,0.07), inset 0 1px 0 rgba(255,255,255,0.06)",
              animation: "slide-up-banner 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
            }}
          >
            {/* Teal-to-gold accent bar */}
            <div
              className="shrink-0 w-[3px] h-10 rounded-full"
              style={{ background: "linear-gradient(180deg, #00A3A3 0%, #FFB700 100%)" }}
            />

            <div className="min-w-0">
              <p
                className="font-black uppercase leading-none"
                style={{
                  whiteSpace: "nowrap",
                  color: "#FFB700",
                  fontFamily: "var(--font-grotesk)",
                  fontSize: "clamp(1rem, 4vw, 1.35rem)",
                  letterSpacing: "0.22em",
                  animation: "glow-pulse-gold 2.5s ease-in-out infinite",
                }}
              >
                REFUSE TO LOSE
              </p>
              <p
                className="text-[10px] tracking-[0.15em] uppercase mt-1.5"
                style={{ color: "var(--accent-teal)", whiteSpace: "nowrap" }}
              >
                {winStreak}-game win streak 🔥
              </p>
            </div>

            <button
              onClick={dismissRefuse}
              className="shrink-0 ml-1 p-1.5 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: "var(--text-muted)" }}
              aria-label="Dismiss"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
