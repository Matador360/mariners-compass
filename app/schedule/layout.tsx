import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Schedule",
  description: "Full 2026 Seattle Mariners schedule — past results, upcoming games, win/loss streaks, and Trident predictions.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
