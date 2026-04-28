"use client";

import { useEffect, useState } from "react";
import { currentSkin, isoDate, dismissKey } from "@/lib/skins-calendar";

type DecoKind = "edgars-arrow" | "pilots-flash" | null;

const SHOWN_KEY_PREFIX = "trident:skin-shown:";

/**
 * Renders one-shot decorative overlays for skins that have a "first load only"
 * effect:
 *   - edgars-double → a once-per-session double-arrow sweep across the screen
 *   - pilots-flash  → a once-per-session yellow flash overlay
 *
 * Suppressed if the user has dismissed the skin for the day, or if the
 * sessionStorage flag is already set.
 */
export function SkinDecorations() {
  const [kind, setKind] = useState<DecoKind>(null);

  useEffect(() => {
    const now = new Date();
    const { skin, fromUrl } = currentSkin(now);
    if (!skin) return;
    if (skin.id !== "edgars-double" && skin.id !== "pilots-flash") return;

    // URL preview always fires (lets you reload to retrigger). Otherwise:
    //   1. Respect the per-day dismissal.
    //   2. Show once per browser session.
    if (!fromUrl) {
      try {
        if (window.localStorage.getItem(dismissKey(isoDate(now))) === "1") return;
      } catch {}
      const sessionKey = `${SHOWN_KEY_PREFIX}${skin.id}:${isoDate(now)}`;
      try {
        if (window.sessionStorage.getItem(sessionKey)) return;
        window.sessionStorage.setItem(sessionKey, "1");
      } catch {}
    }

    setKind(skin.id === "edgars-double" ? "edgars-arrow" : "pilots-flash");

    // Auto-clear so the DOM node is removed after the animation finishes.
    const timeout = window.setTimeout(() => setKind(null), 4000);
    return () => window.clearTimeout(timeout);
  }, []);

  if (kind === "edgars-arrow") {
    return (
      <div className="edgars-arrow-once" aria-hidden>
        ▶▶
      </div>
    );
  }

  if (kind === "pilots-flash") {
    return <div className="pilots-flash-overlay" aria-hidden />;
  }

  return null;
}
