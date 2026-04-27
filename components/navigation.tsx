"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard, Calendar, BarChart2, Users,
  Zap, Swords, BookOpen, Sprout, ChevronDown, X, Activity, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TridentLogo } from "./trident-logo";
import { ThemePicker } from "./theme-picker";
import { loadTheme, saveTheme, type ThemeId } from "@/lib/theme-engine";

const PRIMARY_NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/roster", label: "Roster", icon: Users },
  { href: "/stats", label: "Team Stats", icon: BarChart2 },
];

const SECONDARY_NAV = [
  { href: "/power-rankings", label: "Power Rankings", icon: Zap },
  { href: "/compare", label: "Compare", icon: Swords },
  { href: "/bullpen", label: "Bullpen", icon: Activity },
  { href: "/history", label: "History", icon: BookOpen },
  { href: "/prospects", label: "Prospects", icon: Sprout },
];

const MOBILE_MAIN = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/roster", label: "Roster", icon: Users },
  { href: "/prospects", label: "Prospects", icon: Sprout },
];

export function Navigation({ mood }: { mood?: string }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [themeValue, setThemeValue] = useState<ThemeId>("auto");
  const [themeResolved, setThemeResolved] = useState<ThemeId | undefined>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  useEffect(() => { setSheetOpen(false); }, [pathname]);

  useEffect(() => {
    setThemeValue(loadTheme());
    const dt = document.documentElement.dataset.theme as ThemeId | undefined;
    if (dt) setThemeResolved(dt);

    function onResolved(e: Event) {
      const detail = (e as CustomEvent<{ id?: ThemeId }>).detail;
      if (detail?.id) setThemeResolved(detail.id);
    }
    function onChange() { setThemeValue(loadTheme()); }
    window.addEventListener("trident:theme-resolved", onResolved as EventListener);
    window.addEventListener("trident:theme-change", onChange as EventListener);
    return () => {
      window.removeEventListener("trident:theme-resolved", onResolved as EventListener);
      window.removeEventListener("trident:theme-change", onChange as EventListener);
    };
  }, []);

  function handleThemeChange(id: ThemeId) {
    saveTheme(id);
    setThemeValue(id);
    window.dispatchEvent(new CustomEvent("trident:theme-change", { detail: { id } }));
  }

  function openCmdK() {
    window.dispatchEvent(new Event("trident:open-cmdk"));
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const secondaryActive = SECONDARY_NAV.some((n) => isActive(n.href));

  return (
    <>
      {/* ── Desktop nav ──────────────────────────────────────────────── */}
      <header className="hidden md:flex sticky top-0 z-50 h-14 items-center border-b border-white/[0.06]"
        style={{
          background: "rgba(4, 12, 26, 0.72)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
        }}
      >
        <div className="container-trident flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative">
              <TridentLogo
                size={30}
                className="text-teal transition-all duration-300 group-hover:text-[#00CFCF]"
                glow={false}
              />
              {/* Glow on hover via pseudo-element approximated with a div */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg bg-teal/30 rounded-full pointer-events-none" />
            </div>
            <div className="flex flex-col leading-none gap-0.5">
              <span className="text-sm font-bold tracking-[0.12em] uppercase text-primary"
                style={{ fontFamily: "var(--font-grotesk)" }}>
                The Trident
              </span>
              <span className="text-[9px] text-muted tracking-[0.08em] uppercase">
                Seattle Mariners Portal
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-0.5">
            {PRIMARY_NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap",
                    active
                      ? "text-teal"
                      : "text-secondary hover:text-primary hover:bg-white/[0.04]"
                  )}
                >
                  <Icon size={14} />
                  {label}
                  {active && (
                    <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-gradient-to-r from-transparent via-teal to-transparent" />
                  )}
                </Link>
              );
            })}

            {/* More dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setMoreOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                  secondaryActive || moreOpen
                    ? "text-teal"
                    : "text-secondary hover:text-primary hover:bg-white/[0.04]"
                )}
              >
                More
                <ChevronDown
                  size={13}
                  className={cn("transition-transform duration-150", moreOpen && "rotate-180")}
                />
              </button>
              {moreOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-52 rounded-xl py-1.5 z-50"
                  style={{
                    background: "rgba(9, 24, 43, 0.92)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    border: "1px solid rgba(180,200,220,0.1)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,163,163,0.1)",
                  }}
                >
                  {SECONDARY_NAV.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive(href)
                          ? "text-teal bg-teal/5"
                          : "text-secondary hover:text-primary hover:bg-white/[0.04]"
                      )}
                    >
                      <Icon size={14} />
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2 shrink-0">
            {mood && (
              <span className="text-xl mood-emoji" title="Mariners Mood" aria-label="Mariners Mood">
                {mood}
              </span>
            )}
            <button
              type="button"
              onClick={openCmdK}
              aria-label="Open command palette"
              title="Search (⌘K)"
              className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-border hover:border-border-accent transition-colors text-secondary hover:text-primary"
            >
              <Search size={13} />
              <kbd className="font-mono text-[10px] tracking-wide">⌘K</kbd>
            </button>
            <ThemePicker
              value={themeValue}
              onChange={handleThemeChange}
              resolvedId={themeResolved}
            />
          </div>
        </div>
      </header>

      {/* ── Mobile bottom nav ────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-white/[0.06] safe-area-pb"
        style={{
          background: "rgba(4, 12, 26, 0.88)",
          backdropFilter: "blur(24px) saturate(160%)",
          WebkitBackdropFilter: "blur(24px) saturate(160%)",
        }}
      >
        <div className="flex items-center justify-around h-full px-1">
          {MOBILE_MAIN.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-150 min-w-[48px] relative",
                  active ? "text-teal" : "text-muted"
                )}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">{label}</span>
                {active && (
                  <span className="absolute -top-px left-2 right-2 h-[1.5px] rounded-full bg-gradient-to-r from-transparent via-teal to-transparent" />
                )}
              </Link>
            );
          })}

          {/* Search trigger (mobile) */}
          <button
            onClick={openCmdK}
            aria-label="Open command palette"
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors duration-150 min-w-[48px] text-muted hover:text-primary"
          >
            <Search size={20} />
            <span className="text-[10px] font-medium">Search</span>
          </button>

          {/* More */}
          <button
            onClick={() => setSheetOpen(true)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors duration-150 min-w-[48px]",
              secondaryActive ? "text-teal" : "text-muted"
            )}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="7" x2="21" y2="7" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="17" x2="21" y2="17" />
            </svg>
            <span className="text-[10px] font-medium">More</span>
          </button>

          {mood && (
            <div className="flex flex-col items-center gap-0.5 px-1 py-1 min-w-[36px]">
              <span className="text-lg mood-emoji">{mood}</span>
              <span className="text-[10px] text-muted font-medium">Mood</span>
            </div>
          )}
        </div>
      </nav>

      {/* ── Mobile "More" sheet ───────────────────────────────────────── */}
      {sheetOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
          />
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-[70] rounded-t-2xl border-t border-white/[0.08]"
            style={{
              background: "rgba(9, 24, 43, 0.96)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
            }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <TridentLogo size={18} className="text-teal" />
                <p className="text-sm font-bold text-primary" style={{ fontFamily: "var(--font-grotesk)" }}>
                  All Pages
                </p>
              </div>
              <button
                onClick={() => setSheetOpen(false)}
                className="text-muted hover:text-primary p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3 p-5 pb-12">
              {[...PRIMARY_NAV, ...SECONDARY_NAV].map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                      active
                        ? "bg-teal/10 border-teal/30 text-teal shadow-sm"
                        : "bg-white/[0.03] border-white/[0.07] text-muted hover:text-primary hover:border-white/[0.12]"
                    )}
                  >
                    <Icon size={22} />
                    <span className="text-[10px] font-semibold text-center leading-tight">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
