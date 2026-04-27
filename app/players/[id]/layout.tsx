import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`https://statsapi.mlb.com/api/v1/people/${id}`, { next: { revalidate: 3600 } });
    const data = await res.json();
    const name: string = data?.people?.[0]?.fullName ?? "Player";
    return {
      title: name,
      description: `${name} stats, performance trends, and scouting breakdown — Seattle Mariners.`,
    };
  } catch {
    return { title: "Player Profile" };
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
