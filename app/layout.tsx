import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { CompassBg } from "@/components/compass-bg";
import { EasterEggController } from "@/components/easter-eggs";
import { fetchALWestStandings, fetchSchedule, computeMarinersMood } from "@/lib/mlb-api";

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

  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <CompassBg />
        <Navigation mood={moodEmoji} />
        <main className="flex-1 container-trident pt-6 pb-nav relative z-10">
          {children}
        </main>
        <EasterEggController winStreak={winStreak} />
        <footer className="hidden md:block py-6 relative z-10">
          <div className="container-trident flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted/50">
              <span className="text-teal/40">⚓</span>
              <span className="text-[10px] tracking-[0.1em] uppercase font-medium">The Trident</span>
            </div>
            <p className="text-[10px] text-muted/40 text-center">
              Fan project · Data from{" "}
              <a
                href="https://statsapi.mlb.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal/60 hover:text-teal transition-colors"
              >
                MLB Stats API
              </a>
              {" "}· Not affiliated with MLB or the Mariners
            </p>
            <div className="text-[10px] text-muted/30 tracking-wider uppercase">
              SEA · {new Date().getFullYear()}
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
