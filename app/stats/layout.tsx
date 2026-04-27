import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Stats",
  description: "2026 Seattle Mariners team stats — batting, pitching, advanced metrics, and league percentiles.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
