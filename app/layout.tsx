import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { LiveGameBarServer } from "@/components/live-game-bar-server";
import { CompassBg } from "@/components/compass-bg";
import { EasterEggController } from "@/components/easter-eggs";
import { ThemeApplier } from "@/components/theme-applier";
import { SkinBanner } from "@/components/skin-banner";
import { SkinDecorations } from "@/components/skin-decorations";
import { SiteFooter } from "@/components/site-footer";
import { CommandPalette } from "@/components/command-palette";
import { statDefsForPalette } from "@/lib/command-index";
import { StatExplainerHost } from "@/components/stat-explainer";
import {
  fetchALWestStandings,
  fetchSchedule,
  computeMarinersMood,
  fetchRoster,
} from "@/lib/mlb-api";

const SEA_TEAM_ID = 136;

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mariners-compass.vercel.app"),
  title: {
    default: "The Trident — Seattle Mariners Stats Portal",
    template: "%s — The Trident",
  },
  description:
    "Live stats, power rankings, scouting reports, and salty commentary for Seattle Mariners fans. Built by fans, for fans.",
  keywords: ["Seattle Mariners", "MLB", "baseball", "stats", "The Trident", "M's", "power rankings", "roster"],
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    siteName: "The Trident",
    title: "The Trident — Seattle Mariners Stats Portal",
    description: "Live stats, power rankings, scouting reports, and salty commentary for Seattle Mariners fans.",
    type: "website",
    url: "https://mariners-compass.vercel.app",
  },
  twitter: {
    card: "summary",
    title: "The Trident — Seattle Mariners Stats Portal",
    description: "Live stats, power rankings, scouting reports, and salty commentary for Seattle Mariners fans.",
  },
  themeColor: "#0C2C56",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch mood for nav emoji — graceful fallback
  let moodEmoji: string | undefined;
  let winStreak = 0;

  try {
    const games = await fetchSchedule();
    const mood = await computeMarinersMood(games);
    moodEmoji = mood.emoji;
    winStreak = mood.streakCode.startsWith("W") ? (parseInt(mood.streakCode.slice(1)) || 0) : 0;
  } catch {
    // API down — no mood
  }

  // Standings → magic number + games behind wildcard. Drives auto-theme.
  let magicNumber: number | null = null;
  let gamesBehindWildcard: number | null = null;
  try {
    const div = await fetchALWestStandings();
    const sea = div?.teamRecords?.find((r) => r.team?.id === SEA_TEAM_ID);
    if (sea) {
      const m = sea.magicNumber;
      if (m && m !== "-" && m !== "E") {
        const parsed = parseInt(m, 10);
        if (!Number.isNaN(parsed)) magicNumber = parsed;
      }
      // gamesBehindWildcard: best-effort using division gamesBack as a proxy
      // when the team is not the leader. This degrades gracefully (null = skip).
      const gb = sea.gamesBack;
      if (gb && gb !== "-" && gb !== "+") {
        const parsedGb = parseFloat(gb);
        if (!Number.isNaN(parsedGb) && parsedGb > 0) {
          gamesBehindWildcard = parsedGb;
        }
      }
    }
  } catch {
    // standings unavailable — auto theme falls back to time/system
  }

  // Roster for command palette (active 26-man, may be empty if API down)
  let palettePlayers: Array<{
    id: number;
    fullName: string;
    primaryPosition?: { abbreviation?: string };
    jersey?: string;
  }> = [];
  try {
    const roster = await fetchRoster();
    palettePlayers = roster.map((r) => ({
      id: r.person.id,
      fullName: r.person.fullName,
      primaryPosition: r.position
        ? { abbreviation: r.position.abbreviation }
        : undefined,
      jersey: r.jerseyNumber,
    }));
  } catch {
    // roster unavailable — palette still works for pages/stats/themes
  }

  const statDefs = statDefsForPalette();

  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeApplier
          magicNumber={magicNumber}
          gamesBehindWildcard={gamesBehindWildcard}
        />
        <CompassBg />
        <div className="theme-overlay" aria-hidden />
        <Navigation mood={moodEmoji} />
        <SkinBanner />
        <LiveGameBarServer />
        <main className="flex-1 container-trident pt-6 pb-nav relative z-10">
          {children}
        </main>
        <EasterEggController winStreak={winStreak} />
        <CommandPalette players={palettePlayers} statDefs={statDefs} />
        <StatExplainerHost />
        <SkinDecorations />
        <SiteFooter />
      </body>
    </html>
  );
}
