import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "History",
  description: "Seattle Mariners franchise history — iconic moments, legendary players, and the seasons that defined the M's.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
