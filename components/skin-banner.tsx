"use client";

import { useEffect, useState } from "react";
import { currentSkin, isoDate, dismissKey, type SkinMeta } from "@/lib/skins-calendar";

export function SkinBanner() {
  const [skin, setSkin] = useState<SkinMeta | null>(null);
  const [dismissed, setDismissed] = useState(true); // start hidden until mount
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    const now = new Date();
    const { skin: active, fromUrl } = currentSkin(now);
    if (!active) return;

    let isDismissed = false;
    if (!fromUrl) {
      try { isDismissed = window.localStorage.getItem(dismissKey(isoDate(now))) === "1"; } catch {}
    }
    setSkin(active);
    setDismissed(isDismissed);
    setPreviewing(fromUrl);
  }, []);

  if (!skin || dismissed) return null;

  function handleDismiss() {
    if (!skin) return;
    if (!previewing) {
      try {
        window.localStorage.setItem(dismissKey(isoDate(new Date())), "1");
      } catch {}
    }
    setDismissed(true);
    window.dispatchEvent(new CustomEvent("trident:skin-dismiss", { detail: { id: skin.id } }));
  }

  return (
    <div className="skin-banner" role="status">
      <span aria-hidden>{skin.emoji}</span>
      <span>
        <strong className="font-semibold">{skin.title}</strong>{" "}
        <span className="opacity-90">{skin.blurb}</span>{" "}
        <span className="opacity-60 text-[11px]">{skin.origin}</span>
      </span>
      <button
        type="button"
        onClick={handleDismiss}
        className="ml-2 px-2 py-0.5 text-[11px] font-semibold rounded border border-current/30 hover:bg-white/10 transition-colors"
        aria-label="Dismiss skin and revert to your theme for the rest of the day"
      >
        Reset →
      </button>
    </div>
  );
}
