"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, BarChart2, Users, Zap, Swords, BookOpen, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { TridentLogo } from "./trident-logo";
import { ThemeToggle } from "./theme-toggle";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/stats", label: "Team Stats", icon: BarChart2 },
  { href: "/roster", label: "Roster", icon: Users },
  { href: "/power-rankings", label: "Power Rankings", icon: Zap },
  { href: "/compare", label: "Compare", icon: Swords },
  { href: "/history", label: "History", icon: BookOpen },
  { href: "/prospects", label: "Prospects", icon: Sprout },
];

const MOBILE_NAV = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/roster", label: "Roster", icon: Users },
  { href: "/prospects", label: "Prospects", icon: Sprout },
  { href: "/history", label: "History", icon: BookOpen },
];

export function Navigation({ mood }: { mood?: string }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop top nav */}
      <header className="hidden md:flex sticky top-0 z-50 h-14 items-center border-b border-border bg-bg-deep/80 backdrop-blur-xl">
        <div className="container-trident flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <TridentLogo
              size={28}
              className="text-teal transition-transform group-hover:scale-110 duration-200"
            />
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold tracking-widest uppercase text-primary">
                The Trident
              </span>
              <span className="text-[10px] text-muted tracking-wider">
                Seattle Mariners Portal
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                    active
                      ? "bg-teal/10 text-teal"
                      : "text-secondary hover:text-primary hover:bg-surface"
                  )}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {mood && (
              <span
                className="text-xl mood-emoji"
                title="Mariners Mood"
                aria-label="Mariners Mood indicator"
              >
                {mood}
              </span>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-card/95 backdrop-blur-xl border-t border-border safe-area-pb">
        <div className="flex items-center justify-around h-full px-2">
          {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors duration-150",
                  active ? "text-teal" : "text-muted"
                )}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
          {mood && (
            <div className="flex flex-col items-center gap-0.5 px-3 py-1">
              <span className="text-xl mood-emoji">{mood}</span>
              <span className="text-[10px] text-muted font-medium">Mood</span>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
