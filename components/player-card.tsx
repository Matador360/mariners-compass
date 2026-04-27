"use client";

import Link from "next/link";
import { cn, playerHeadshotUrl, positionColor } from "@/lib/utils";
import type { MLBRosterPlayer } from "@/types/mlb";

interface PlayerCardProps {
  player: MLBRosterPlayer;
  primaryStat?: { label: string; value: string | number };
  secondaryStat?: { label: string; value: string | number };
  tertiaryStat?: { label: string; value: string | number };
  hotCold?: "hot" | "cold" | "neutral";
  className?: string;
}

const HOT_COLD_CONFIG = {
  hot: { emoji: "🔥", label: "Hot", class: "border-amber-500/30 bg-amber-500/5" },
  cold: { emoji: "❄️", label: "Cold", class: "border-blue-400/30 bg-blue-400/5" },
  neutral: { emoji: "", label: "", class: "" },
};

export function PlayerCard({
  player,
  primaryStat,
  secondaryStat,
  tertiaryStat,
  hotCold = "neutral",
  className,
}: PlayerCardProps) {
  const { person, position, jerseyNumber } = player;
  const posColor = positionColor(position.abbreviation);
  const hc = HOT_COLD_CONFIG[hotCold];
  const headshot = playerHeadshotUrl(person.id);

  return (
    <Link href={`/players/${person.id}`} className="block">
      <div
        className={cn(
          "trident-card p-4 text-center space-y-3 cursor-pointer",
          hc.class || "",
          className
        )}
      >
        {/* Headshot */}
        <div className="relative inline-block">
          <div
            className="w-16 h-16 mx-auto rounded-full overflow-hidden border-2 bg-surface-2"
            style={{ borderColor: posColor }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={headshot}
              alt={person.fullName}
              width={64}
              height={64}
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-xl font-bold text-muted">${person.firstName?.[0] ?? "?"}${person.lastName?.[0] ?? ""}</div>`;
                }
              }}
            />
          </div>
          {/* Jersey number */}
          <span
            className="absolute -bottom-1 -right-1 text-[10px] font-black px-1.5 py-0.5 rounded-full text-white leading-none"
            style={{ background: posColor }}
          >
            #{jerseyNumber}
          </span>
          {/* Hot/cold indicator */}
          {hotCold !== "neutral" && (
            <span className="absolute -top-1 -left-1 text-sm leading-none">
              {hc.emoji}
            </span>
          )}
        </div>

        {/* Name */}
        <div>
          <p className="text-sm font-bold text-primary leading-tight line-clamp-1">
            {person.fullName}
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide text-white"
              style={{ background: posColor }}
            >
              {position.abbreviation}
            </span>
            {person.batSide?.code ? (
              <span className="text-[10px] text-muted">
                B:{person.batSide?.code ?? "?"} T:{person.pitchHand?.code ?? "?"}
              </span>
            ) : null}
          </div>
        </div>

        {/* Stats */}
        {(primaryStat || secondaryStat || tertiaryStat) ? (
          <div className="flex items-start justify-around border-t border-border pt-3 gap-1">
            {[primaryStat, secondaryStat, tertiaryStat]
              .filter(Boolean)
              .map((s) => (
                <div key={s!.label} className="flex flex-col items-center gap-0.5">
                  <span className="text-base font-bold stat-number text-primary tabular-nums">
                    {s!.value ?? "—"}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-muted font-medium">
                    {s!.label}
                  </span>
                </div>
              ))}
          </div>
        ) : (
          <div className="border-t border-border pt-3">
            <p className="text-[10px] text-muted text-center italic">No stats yet</p>
          </div>
        )}
      </div>
    </Link>
  );
}
