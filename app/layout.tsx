import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { CompassBg } from "@/components/compass-bg";
import { EasterEggController } from "@/components/easter-eggs";
import { fetchALWestStandings, fetchSchedule, computeMarinersMood } from "@/lib/mlb-api";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "The Trident — Seattle Mariners Portal",
    template: "%s · The Trident",
  },
  description:
    "A premium Seattle Mariners stats portal. Live games, team stats, roster, and player analytics. Built for the true M's fan.",
  keywords: ["Seattle Mariners", "MLB", "baseball", "stats", "The Trident"],
  openGraph: {
    title: "The Trident — Seattle Mariners Portal",
    description: "Premium stats portal for Seattle Mariners fans.",
    type: "website",
  },
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

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" style={{ background: "var(--bg-deep)", color: "var(--text-primary)" }}>
        <CompassBg />
        <Navigation mood={moodEmoji} />
        <main className="flex-1 container-trident py-6 pb-32 md:pb-8 relative z-10">
          {children}
        </main>
        <EasterEggController winStreak={winStreak} />
        <footer className="hidden md:block border-t border-border py-4 relative z-10">
          <p className="container-trident text-[11px] text-muted text-center">
            The Trident · Seattle Mariners Stats Portal · Data from{" "}
            <a
              href="https://statsapi.mlb.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal hover:underline"
            >
              MLB Stats API
            </a>{" "}
            · Fan project, not affiliated with MLB or the Mariners
          </p>
        </footer>
      </body>
    </html>
  );
}
