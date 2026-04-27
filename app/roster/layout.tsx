import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Active Roster",
  description: "Seattle Mariners active 26-man roster with stats, hot/cold ratings, and position breakdowns.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
