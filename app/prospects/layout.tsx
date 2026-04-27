import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Farm System",
  description: "Seattle Mariners farm system and top prospects — the pipeline building the next M's contender.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
