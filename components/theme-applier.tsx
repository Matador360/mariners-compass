"use client";

import { useEffect } from "react";
import { loadTheme, resolveTheme } from "@/lib/theme-engine";
import { currentSkin, isoDate, dismissKey } from "@/lib/skins-calendar";

interface Props {
  magicNumber: number | null;
  gamesBehindWildcard: number | null;
}

export function ThemeApplier({ magicNumber, gamesBehindWildcard }: Props) {
  useEffect(() => {
    function applyNow() {
      const id = loadTheme();
      const now = new Date();
      const hour = now.getHours();
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const resolved = resolveTheme(id, {
        hour,
        systemDark,
        magicNumber,
        gamesBehindWildcard,
      });

      // Skin precedence:
      //   1. ?skin=<id> URL override (dev preview, ignores dismissal)
      //   2. Today's calendar skin, unless dismissed for this date
      //   3. Resolved user theme
      const { skin, fromUrl } = currentSkin(now);
      let active = resolved;
      let activeSkin: string | null = null;
      if (skin) {
        const dismissed = !fromUrl && (() => {
          try { return window.localStorage.getItem(dismissKey(isoDate(now))) === "1"; }
          catch { return false; }
        })();
        if (!dismissed) {
          active = skin.themeId;
          activeSkin = skin.id;
        }
      }

      document.documentElement.dataset.theme = active;
      if (activeSkin) {
        document.documentElement.dataset.skin = activeSkin;
      } else {
        delete document.documentElement.dataset.skin;
      }
      window.dispatchEvent(
        new CustomEvent("trident:theme-resolved", {
          detail: { id: active, source: id, skin: activeSkin },
        }),
      );
    }

    applyNow();

    function onStorage(e: StorageEvent) {
      if (e.key === "trident:theme") applyNow();
      if (e.key && e.key.startsWith("trident:skin-dismissed:")) applyNow();
    }
    function onChange() { applyNow(); }
    function onMediaChange() { applyNow(); }
    function onSkinDismiss() { applyNow(); }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("storage", onStorage);
    window.addEventListener("trident:theme-change", onChange as EventListener);
    window.addEventListener("trident:skin-dismiss", onSkinDismiss as EventListener);
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onMediaChange);
    }
    const interval = window.setInterval(applyNow, 30 * 60 * 1000);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("trident:theme-change", onChange as EventListener);
      window.removeEventListener("trident:skin-dismiss", onSkinDismiss as EventListener);
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", onMediaChange);
      }
      window.clearInterval(interval);
    };
  }, [magicNumber, gamesBehindWildcard]);

  return null;
}
