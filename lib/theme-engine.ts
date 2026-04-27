export type ThemeId =
  | "dark"
  | "light"
  | "twilight"
  | "sunset-edgar"
  | "teal-classic"
  | "throwback-1995"
  | "playoff-push"
  | "auto";

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  description: string;
  emoji: string;
  swatch: string;
}

export const THEMES: ThemeMeta[] = [
  {
    id: "dark",
    label: "Dark",
    description: "The default. Trident teal + black.",
    emoji: "🌑",
    swatch: "#0b0f15",
  },
  {
    id: "light",
    label: "Light",
    description: "Clean and pale.",
    emoji: "☀️",
    swatch: "#f8fafc",
  },
  {
    id: "twilight",
    label: "Pacific NW Twilight",
    description: "Purples + teals. Drizzle vibes.",
    emoji: "🌌",
    swatch: "#1a1330",
  },
  {
    id: "sunset-edgar",
    label: "Sunset Edgar",
    description: "Gold + navy, the man, the myth.",
    emoji: "🌅",
    swatch: "#1a1a2e",
  },
  {
    id: "teal-classic",
    label: "Teal Classic",
    description: "90s Mariners colors.",
    emoji: "🐟",
    swatch: "#00553a",
  },
  {
    id: "throwback-1995",
    label: "1995 Throwback",
    description: "Pixelated. Refuse to lose.",
    emoji: "📼",
    swatch: "#006633",
  },
  {
    id: "playoff-push",
    label: "Playoff Push",
    description: "All gold, all the time.",
    emoji: "🏆",
    swatch: "#c79b00",
  },
  {
    id: "auto",
    label: "Auto",
    description: "Follow system + time of day.",
    emoji: "🪞",
    swatch: "transparent",
  },
];

const STORAGE_KEY = "trident:theme";
const VALID_IDS: Set<ThemeId> = new Set(THEMES.map((t) => t.id));

export interface ResolveContext {
  hour: number;
  systemDark: boolean;
  magicNumber: number | null;
  gamesBehindWildcard: number | null;
}

export function resolveTheme(id: ThemeId, ctx: ResolveContext): ThemeId {
  if (id !== "auto") return id;

  if (ctx.magicNumber != null && ctx.magicNumber <= 10) return "playoff-push";
  if (ctx.gamesBehindWildcard != null && ctx.gamesBehindWildcard <= 3) return "playoff-push";
  if (ctx.hour >= 19 || ctx.hour < 6) return "twilight";
  if (!ctx.systemDark) return "light";
  return "dark";
}

export function saveTheme(id: ThemeId): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // ignore storage failures
  }
}

export function loadTheme(): ThemeId {
  if (typeof window === "undefined") return "auto";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw && VALID_IDS.has(raw as ThemeId)) return raw as ThemeId;
  } catch {
    // ignore
  }
  return "auto";
}

export function getThemeMeta(id: ThemeId): ThemeMeta {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
