"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { RelieverProfile, FatigueStatus } from "@/lib/bullpen";

const FATIGUE_DOT: Record<FatigueStatus, string> = {
  red: "bg-red-500",
  yellow: "bg-amber-400",
  green: "bg-green-500",
  unknown: "bg-white/20",
};

const FATIGUE_BORDER: Record<FatigueStatus, string> = {
  red: "border-red-500/40",
  yellow: "border-amber-400/40",
  green: "border-green-500/20",
  unknown: "border-white/10",
};

function MiniCard({ reliever }: { reliever: RelieverProfile }) {
  const { fatigue, name, season } = reliever;
  const firstName = name.split(" ")[0];
  const lastName = name.split(" ").slice(1).join(" ");
  const headshotUrl = `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_56,q_auto:best/v1/people/${reliever.id}/headshot/67/current`;

  return (
    <div
      className={cn(
        "trident-card border p-2 flex flex-col items-center gap-1.5",
        "w-[112px] shrink-0 text-center",
        FATIGUE_BORDER[fatigue.status]
      )}
    >
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={headshotUrl}
          alt={name}
          width={48}
          height={48}
          className="rounded-full object-cover bg-white/5 w-12 h-12"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_56,q_auto:best/v1/people/generic/headshot/67/current";
          }}
        />
        <span
          className={cn(
            "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-surface",
            FATIGUE_DOT[fatigue.status]
          )}
        />
      </div>
      <div>
        <p className="text-[10px] font-bold text-primary leading-tight">{lastName}</p>
        <p className="text-[9px] text-muted leading-none">{firstName}</p>
      </div>
      <p className="text-[9px] font-bold tabular-nums text-primary">
        {season.era > 0 ? `${season.era.toFixed(2)} ERA` : "—"}
      </p>
    </div>
  );
}

export function BullpenFatigueStrip() {
  const [relievers, setRelievers] = useState<RelieverProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bullpen")
      .then((r) => r.json())
      .then((data: RelieverProfile[]) => {
        setRelievers(data.slice(0, 10));
      })
      .catch(() => setRelievers([]))
      .finally(() => setLoading(false));
  }, []);

  const redCount = relievers.filter((r) => r.fatigue.status === "red").length;
  const yellowCount = relievers.filter((r) => r.fatigue.status === "yellow").length;

  return (
    <div className="trident-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
            Bullpen Fatigue
          </h3>
          {!loading && relievers.length > 0 && (
            <p className="text-[9px] text-muted mt-0.5">
              {redCount > 0 && (
                <span className="text-red-400 font-bold">{redCount} fatigued</span>
              )}
              {redCount > 0 && yellowCount > 0 && " · "}
              {yellowCount > 0 && (
                <span className="text-amber-400">{yellowCount} stretched</span>
              )}
              {redCount === 0 && yellowCount === 0 && (
                <span className="text-green-400">Arms fresh</span>
              )}
            </p>
          )}
        </div>
        <Link
          href="/bullpen"
          className="text-[10px] text-teal hover:text-teal/80 font-semibold uppercase tracking-wider transition-colors"
        >
          Full report →
        </Link>
      </div>

      {/* Cards row */}
      {loading ? (
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-[112px] h-[120px] shrink-0 rounded-lg bg-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : relievers.length === 0 ? (
        <p className="text-xs text-muted py-4 text-center">No bullpen data available</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {relievers.map((r) => (
            <MiniCard key={r.id} reliever={r} />
          ))}
        </div>
      )}
    </div>
  );
}
