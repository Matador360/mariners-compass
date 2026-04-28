import type { ThemeId } from "./theme-engine";

export type SkinId =
  | "felix-perfect"
  | "edgars-double"
  | "griffey-birthday"
  | "ichiro-hof"
  | "pilots-flash";

export interface SkinMeta {
  id: SkinId;
  /** ThemeId written to <html data-theme=...> when this skin is active. */
  themeId: ThemeId;
  /** Banner headline. */
  title: string;
  /** Banner sub-copy. */
  blurb: string;
  /** Emoji prefix. */
  emoji: string;
  /** ISO month-day, "MM-DD". */
  date: string;
  /** Origin date (year + month + day) for context blurbs. */
  origin: string;
}

export const SKINS: SkinMeta[] = [
  {
    id: "felix-perfect",
    themeId: "felix-perfect",
    title: "It's Felix Day.",
    blurb: "We made the site gold for you.",
    emoji: "👑",
    date: "08-15",
    origin: "Aug 15, 2012 — Felix's perfect game vs Tampa Bay.",
  },
  {
    id: "edgars-double",
    themeId: "edgars-double",
    title: "And the throw to the plate...",
    blurb: "It's Edgar Day. Navy + amber, in honor of The Double.",
    emoji: "🏃",
    date: "10-08",
    origin: "Oct 8, 1995 — ALDS Game 5, Edgar doubles, Junior scores from first.",
  },
  {
    id: "griffey-birthday",
    themeId: "griffey-birthday",
    title: "Happy birthday, Junior.",
    blurb: "The Kid would've been your age once. Today we wear 24.",
    emoji: "🎂",
    date: "11-21",
    origin: "Nov 21, 1969 — Ken Griffey Jr. born in Donora, PA.",
  },
  {
    id: "ichiro-hof",
    themeId: "ichiro-hof",
    title: "Ichiro Day.",
    blurb: "Cooperstown welcomed him today. So do we.",
    emoji: "🌅",
    date: "07-27",
    origin: "Jul 27, 2025 — Ichiro inducted into the Baseball Hall of Fame.",
  },
  {
    id: "pilots-flash",
    themeId: "pilots-flash",
    title: "Seattle Pilots, est. 1969.",
    blurb: "One season. Bankrupt. Moved to Milwaukee. We don't talk about it.",
    emoji: "✈️",
    date: "04-01",
    origin: "Apr 1, 1969 — Seattle Pilots' first Opening Day. Also, April Fools'.",
  },
];

const BY_DATE = new Map(SKINS.map((s) => [s.date, s]));

/** Return the skin scheduled for the given local date, or null. */
export function skinForDate(d: Date = new Date()): SkinMeta | null {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return BY_DATE.get(`${mm}-${dd}`) ?? null;
}

/** Look up a skin by id. Used by the dev `?skin=<id>` URL preview override. */
export function skinById(id: string): SkinMeta | null {
  return SKINS.find((s) => s.id === id) ?? null;
}

/**
 * Resolve the skin currently in effect, applying:
 *   1. `?skin=<id>` URL override (dev preview)
 *   2. Today's calendar skin
 * Components share this so the banner, decorations, and theme override stay
 * in lockstep. Returns `{ skin, fromUrl }` so callers can adjust behavior
 * (e.g. ignore dismissal when previewing).
 */
export function currentSkin(d: Date = new Date()): { skin: SkinMeta | null; fromUrl: boolean } {
  if (typeof window !== "undefined") {
    const param = new URLSearchParams(window.location.search).get("skin");
    if (param) {
      const s = skinById(param);
      if (s) return { skin: s, fromUrl: true };
    }
  }
  return { skin: skinForDate(d), fromUrl: false };
}

/** YYYY-MM-DD in local time, used for the dismissal localStorage key. */
export function isoDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

/** Day of year, 1..366. Stable seed for daily rotations. */
export function dayOfYear(d: Date = new Date()): number {
  const start = Date.UTC(d.getFullYear(), 0, 0);
  const now = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor((now - start) / 86_400_000);
}

export function dismissKey(date: string): string {
  return `trident:skin-dismissed:${date}`;
}
