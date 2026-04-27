"use client";

import { useEffect } from "react";
import { loadTheme, resolveTheme } from "@/lib/theme-engine";

interface Props {
  magicNumber: number | null;
  gamesBehindWildcard: number | null;
}

export function ThemeApplier({ magicNumber, gamesBehindWildcard }: Props) {
  useEffect(() => {
    function applyNow() {
      const id = loadTheme();
      const hour = new Date().getHours();
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const resolved = resolveTheme(id, {
        hour,
        systemDark,
        magicNumber,
        gamesBehindWildcard,
      });
      document.documentElement.dataset.theme = resolved;
      window.dispatchEvent(
        new CustomEvent("trident:theme-resolved", { detail: { id: resolved, source: id } }),
      );
    }

    applyNow();

    function onStorage(e: StorageEvent) {
      if (e.key === "trident:theme") applyNow();
    }
    function onChange() { applyNow(); }
    function onMediaChange() { applyNow(); }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("storage", onStorage);
    window.addEventListener("trident:theme-change", onChange as EventListener);
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onMediaChange);
    }
    const interval = window.setInterval(applyNow, 30 * 60 * 1000);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("trident:theme-change", onChange as EventListener);
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", onMediaChange);
      }
      window.clearInterval(interval);
    };
  }, [magicNumber, gamesBehindWildcard]);

  return null;
}
