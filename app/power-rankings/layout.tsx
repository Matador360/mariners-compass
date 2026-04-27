import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Power Rankings",
  description: "Seattle Mariners internal power rankings — who's hot, who's cold, and who needs to get it together.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
