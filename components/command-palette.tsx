"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, Calendar, Users, BarChart3, GitCompareArrows, Crown,
  Scroll, Sprout, Zap, User, Palette, Search,
} from "lucide-react";
import {
  STATIC_PAGES, THEME_COMMANDS, searchIndex, recordRecent,
  type CommandItem,
} from "@/lib/command-index";
import { saveTheme, type ThemeId } from "@/lib/theme-engine";

type IconCmp = (props: { size?: number; className?: string }) => React.ReactNode;

const ICONS: Record<string, IconCmp> = {
  Activity, Calendar, Users, BarChart3, GitCompareArrows, Crown,
  Scroll, Sprout, Zap, User, Palette, Search,
};

function Icon({ name, size = 14, className }: { name?: string; size?: number; className?: string }) {
  if (!name) return null;
  const Cmp = ICONS[name];
  if (!Cmp) return null;
  return <Cmp size={size} className={className} />;
}

interface PaletteProps {
  players: Array<{
    id: number;
    fullName: string;
    primaryPosition?: { abbreviation?: string };
    jersey?: string;
  }>;
  statDefs: Array<{
    abbr: string;
    name: string;
    description: string;
    category: string;
  }>;
}

const KIND_ORDER: Array<{ kind: CommandItem["kind"]; label: string }> = [
  { kind: "page", label: "Pages" },
  { kind: "player", label: "Players" },
  { kind: "stat", label: "Stats" },
  { kind: "action", label: "Themes" },
  { kind: "game", label: "Games" },
];

export function CommandPalette({ players, statDefs }: PaletteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allItems = useMemo<CommandItem[]>(() => {
    const playerItems: CommandItem[] = players.map((p) => {
      const pos = p.primaryPosition?.abbreviation ?? "";
      const jersey = p.jersey ?? "";
      const hint = [pos, jersey ? `#${jersey}` : ""].filter(Boolean).join(" · ") || undefined;
      return {
        id: `player:${p.id}`,
        kind: "player",
        label: p.fullName,
        hint,
        href: `/players/${p.id}`,
        icon: "User",
        keywords: [pos, jersey, "player", "roster"].filter(Boolean) as string[],
      };
    });

    const statItems: CommandItem[] = statDefs.map((s) => {
      const words = (s.description ?? "").split(/\W+/).filter((w) => w.length > 3).slice(0, 6);
      return {
        id: `stat:${s.abbr}`,
        kind: "stat",
        label: `${s.abbr} — ${s.name}`,
        hint: s.category,
        action: undefined,
        payload: s.abbr,
        icon: "BarChart3",
        keywords: [s.abbr, s.name, s.category, ...words],
      };
    });

    return [...STATIC_PAGES, ...playerItems, ...statItems, ...THEME_COMMANDS];
  }, [players, statDefs]);

  const results = useMemo(() => searchIndex(query, allItems, 24), [query, allItems]);

  const grouped = useMemo(() => {
    const map = new Map<CommandItem["kind"], CommandItem[]>();
    for (const r of results) {
      const list = map.get(r.kind) ?? [];
      list.push(r);
      map.set(r.kind, list);
    }
    return KIND_ORDER.map(({ kind, label }) => ({
      kind, label, items: map.get(kind) ?? [],
    })).filter((g) => g.items.length > 0);
  }, [results]);

  const flat = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query, open]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "/" && !open) {
        const t = e.target as HTMLElement | null;
        const tag = t?.tagName?.toLowerCase();
        const editable = tag === "input" || tag === "textarea" || (t?.isContentEditable ?? false);
        if (!editable) {
          e.preventDefault();
          setOpen(true);
        }
      }
    }
    function onTriggerOpen() {
      setOpen(true);
    }
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("trident:open-cmdk", onTriggerOpen);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("trident:open-cmdk", onTriggerOpen);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 10);
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(flat.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = flat[activeIdx];
        if (item) activate(item);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, flat, activeIdx]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-cmdk-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx, open]);

  function activate(item: CommandItem) {
    recordRecent(item);
    if (item.kind === "page" && item.href) {
      router.push(item.href);
      setOpen(false);
      return;
    }
    if (item.kind === "player" && item.href) {
      router.push(item.href);
      setOpen(false);
      return;
    }
    if (item.kind === "stat") {
      const statKey = String(item.payload ?? "");
      try {
        window.dispatchEvent(new CustomEvent("trident:open-stat", { detail: { statKey } }));
      } catch {
        router.push(`/stats?explain=${encodeURIComponent(statKey)}`);
      }
      setOpen(false);
      return;
    }
    if (item.kind === "action" && item.action === "set-theme") {
      const id = item.payload as ThemeId;
      saveTheme(id);
      window.dispatchEvent(new CustomEvent("trident:theme-change", { detail: { id } }));
      setOpen(false);
      return;
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-xl rounded-2xl overflow-hidden"
        style={{
          background: "rgba(9, 24, 43, 0.96)",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          border: "1px solid rgba(180,200,220,0.12)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,163,163,0.12)",
        }}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
          <Search size={16} className="text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search players, pages, stats…"
            className="flex-1 bg-transparent text-primary text-sm placeholder:text-muted focus:outline-none"
            aria-label="Search"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-white/10 text-[10px] text-muted font-mono">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-1.5">
          {grouped.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-muted">
              No results for &quot;{query}&quot;
            </div>
          )}
          {grouped.map((g) => (
            <GroupSection
              key={g.kind}
              label={query.trim() ? g.label : g.kind === "page" ? "Recent" : g.label}
              items={g.items}
              flat={flat}
              activeIdx={activeIdx}
              onHover={setActiveIdx}
              onActivate={activate}
            />
          ))}
        </div>

        <div className="px-4 py-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-muted">
          <span>↑↓ navigate · ↵ select · esc close · ⌘K toggle</span>
          <span className="hidden sm:inline">{flat.length} result{flat.length === 1 ? "" : "s"}</span>
        </div>
      </div>
    </div>
  );
}

function GroupSection({
  label, items, flat, activeIdx, onHover, onActivate,
}: {
  label: string;
  items: CommandItem[];
  flat: CommandItem[];
  activeIdx: number;
  onHover: (i: number) => void;
  onActivate: (item: CommandItem) => void;
}) {
  return (
    <div className="px-1.5 pb-1">
      <div className="px-3 py-1.5 text-[9px] uppercase tracking-[0.14em] text-muted font-semibold">
        {label}
      </div>
      {items.map((item) => {
        const idx = flat.indexOf(item);
        const active = idx === activeIdx;
        return (
          <button
            key={item.id}
            data-cmdk-idx={idx}
            onMouseEnter={() => onHover(idx)}
            onClick={() => onActivate(item)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
              active ? "bg-teal/10 text-primary" : "text-secondary hover:bg-white/[0.04]"
            }`}
          >
            <span className={`shrink-0 ${active ? "text-teal" : "text-muted"}`}>
              <Icon name={item.icon} size={14} />
            </span>
            <span className="flex-1 min-w-0">
              <span className={`text-sm font-medium truncate block ${active ? "text-primary" : "text-secondary"}`}>
                {item.label}
              </span>
              {item.hint && (
                <span className="text-[11px] text-muted truncate block">{item.hint}</span>
              )}
            </span>
            {active && (
              <span className="text-[10px] text-muted font-mono">↵</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

