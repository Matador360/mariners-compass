import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Player Compare",
  description: "Compare any two Seattle Mariners players head-to-head across batting, pitching, and advanced metrics.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
