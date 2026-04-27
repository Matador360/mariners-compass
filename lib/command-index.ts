import { THEMES } from "@/lib/theme-engine";
import type { ThemeId } from "@/lib/theme-engine";
import { STAT_DEFINITIONS } from "@/lib/stat-definitions";

export type CommandKind = "page" | "player" | "stat" | "game" | "action";

export interface CommandItem {
  id: string;
  kind: CommandKind;
  label: string;
  hint?: string;
  href?: string;
  action?: "set-theme" | "toggle-tone" | "open-easter-egg";
  payload?: unknown;
  keywords?: string[];
  icon?: string;
  score?: number;
}

const RECENTS_KEY = "trident:cmdk:recents";
const RECENTS_MAX = 12;

export const STATIC_PAGES: CommandItem[] = [
  {
    id: "page:dashboard",
    kind: "page",
    label: "Dashboard",
    hint: "Today's snapshot",
    href: "/",
    icon: "Activity",
    keywords: ["home", "today", "live"],
  },
  {
    id: "page:schedule",
    kind: "page",
    label: "Schedule",
    hint: "Upcoming + past games",
    href: "/schedule",
    icon: "Calendar",
    keywords: ["games", "calendar", "matchups"],
  },
  {
    id: "page:roster",
    kind: "page",
    label: "Roster",
    hint: "Active 26-man",
    href: "/roster",
    icon: "Users",
    keywords: ["players", "team", "lineup"],
  },
  {
    id: "page:stats",
    kind: "page",
    label: "Stats",
    hint: "Team & league",
    href: "/stats",
    icon: "BarChart3",
    keywords: ["statistics", "leaders", "numbers"],
  },
  {
    id: "page:compare",
    kind: "page",
    label: "Compare",
    hint: "Player head-to-head",
    href: "/compare",
    icon: "GitCompareArrows",
    keywords: ["versus", "vs", "matchup"],
  },
  {
    id: "page:power-rankings",
    kind: "page",
    label: "Power Rankings",
    hint: "MLB hierarchy",
    href: "/power-rankings",
    icon: "Crown",
    keywords: ["rankings", "league", "tiers"],
  },
  {
    id: "page:history",
    kind: "page",
    label: "History",
    hint: "All-time records",
    href: "/history",
    icon: "Scroll",
    keywords: ["records", "past", "franchise"],
  },
  {
    id: "page:prospects",
    kind: "page",
    label: "Prospects",
    hint: "Farm system",
    href: "/prospects",
    icon: "Sprout",
    keywords: ["minors", "minor league", "farm", "top 30"],
  },
  {
    id: "page:bullpen",
    kind: "page",
    label: "Bullpen",
    hint: "Reliever fatigue",
    href: "/bullpen",
    icon: "Zap",
    keywords: ["relievers", "pen", "fatigue"],
  },
];

export const THEME_COMMANDS: CommandItem[] = THEMES.map((t) => ({
  id: `theme:${t.id}`,
  kind: "action",
  label: `Theme: ${t.label}`,
  hint: t.description,
  action: "set-theme",
  payload: t.id as ThemeId,
  icon: "Palette",
  keywords: ["theme", "color", "mode", t.id, t.label.toLowerCase()],
}));

function lc(s: string): string {
  return s.toLowerCase();
}

export function fuzzyMatch(query: string, item: CommandItem): number {
  const q = lc(query.trim());
  if (!q) return 0;
  const label = lc(item.label);

  if (label.startsWith(q)) return 100;

  const words = label.split(/\s+|:/).filter(Boolean);
  if (words.some((w) => w.startsWith(q))) return 80;

  if (label.includes(q)) return 60;

  const hint = item.hint ? lc(item.hint) : "";
  if (hint.includes(q)) return 40;

  if (item.keywords) {
    for (const k of item.keywords) {
      const kw = lc(k);
      if (kw === q) return 70;
      if (kw.startsWith(q)) return 50;
      if (kw.includes(q)) return 30;
    }
  }

  // Subsequence fallback: every char of q appears in label in order
  if (subsequenceMatch(q, label)) return 15;

  return 0;
}

function subsequenceMatch(needle: string, haystack: string): boolean {
  let i = 0;
  for (let j = 0; j < haystack.length && i < needle.length; j++) {
    if (haystack[j] === needle[i]) i++;
  }
  return i === needle.length;
}

function readRecentIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function searchIndex(query: string, items: CommandItem[], limit = 8): CommandItem[] {
  const q = query.trim();
  if (!q) {
    const recentIds = readRecentIds();
    if (recentIds.length > 0) {
      const byId = new Map(items.map((i) => [i.id, i]));
      const found = recentIds
        .map((id) => byId.get(id))
        .filter((x): x is CommandItem => !!x)
        .slice(0, limit);
      if (found.length > 0) return found;
    }
    return items.filter((i) => i.kind === "page").slice(0, limit);
  }

  const scored: CommandItem[] = [];
  for (const item of items) {
    const score = fuzzyMatch(q, item);
    if (score > 0) scored.push({ ...item, score });
  }
  scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return scored.slice(0, limit);
}

export interface CommandPaletteStatDef {
  abbr: string;
  name: string;
  description: string;
  category: string;
}

export function statDefsForPalette(): CommandPaletteStatDef[] {
  return Object.values(STAT_DEFINITIONS).map((d) => ({
    abbr: d.abbr,
    name: d.name,
    description: d.description,
    category: d.category,
  }));
}

export function recordRecent(item: CommandItem): void {
  if (typeof window === "undefined") return;
  try {
    const existing = readRecentIds().filter((id) => id !== item.id);
    existing.unshift(item.id);
    const next = existing.slice(0, RECENTS_MAX);
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}
