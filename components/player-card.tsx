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
  const headshot = playerHeadshotUrl(person.id);

  const isHot  = hotCold === "hot";
  const isCold = hotCold === "cold";

  return (
    <Link href={`/players/${person.id}`} className="block group">
      <div
        className={cn(
          "trident-card relative overflow-hidden cursor-pointer",
          isHot  && "border-amber-500/25",
          isCold && "border-blue-400/20",
          className
        )}
      >
        {/* Hot/cold atmospheric bg */}
        {isHot && (
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/8 via-transparent to-transparent pointer-events-none rounded-[14px]" />
        )}
        {isCold && (
          <div className="absolute inset-0 bg-gradient-to-b from-blue-400/8 via-transparent to-transparent pointer-events-none rounded-[14px]" />
        )}

        {/* Jersey number as oversized watermark */}
        {jerseyNumber && (
          <div
            className="absolute top-0 right-2 text-[5rem] font-black leading-none select-none pointer-events-none"
            style={{
              color: posColor,
              opacity: 0.07,
              fontFamily: "var(--font-mono)",
              letterSpacing: "-0.06em",
            }}
          >
            {jerseyNumber}
          </div>
        )}

        <div className="relative p-4 text-center space-y-3">
          {/* Hot/cold badge */}
          {isHot && (
            <div className="absolute top-2 left-2">
              <span className="text-xs hot-indicator">🔥</span>
            </div>
          )}
          {isCold && (
            <div className="absolute top-2 left-2">
              <span className="text-xs">❄️</span>
            </div>
          )}

          {/* Headshot */}
          <div className="relative inline-block">
            <div
              className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-white/5 transition-transform duration-200 group-hover:scale-105"
              style={{
                border: `2px solid ${posColor}44`,
                boxShadow: isHot
                  ? `0 0 16px rgba(245,158,11,0.3), 0 0 0 2px ${posColor}33`
                  : isCold
                  ? `0 0 16px rgba(96,165,250,0.3), 0 0 0 2px ${posColor}33`
                  : `0 0 0 2px ${posColor}33`,
              }}
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
                    parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-xl font-bold" style="color:${posColor}">${person.firstName?.[0] ?? "?"}${person.lastName?.[0] ?? ""}</div>`;
                  }
                }}
              />
            </div>
            {/* Jersey number badge */}
            <span
              className="absolute -bottom-1 -right-1 text-[9px] font-black px-1 py-0.5 rounded-full text-white leading-none"
              style={{ background: posColor }}
            >
              #{jerseyNumber}
            </span>
          </div>

          {/* Name */}
          <div>
            <p
              className="text-sm font-bold text-primary leading-tight line-clamp-1 group-hover:text-teal transition-colors duration-150"
              style={{ fontFamily: "var(--font-grotesk)" }}
            >
              {person.fullName}
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide text-white"
                style={{ background: posColor }}
              >
                {position.abbreviation}
              </span>
              {person.batSide?.code && (
                <span className="text-[9px] text-muted">
                  B:{person.batSide.code} T:{person.pitchHand?.code ?? "?"}
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          {(primaryStat || secondaryStat || tertiaryStat) ? (
            <div className="flex items-start justify-around border-t border-white/[0.06] pt-3 gap-1">
              {[primaryStat, secondaryStat, tertiaryStat]
                .filter(Boolean)
                .map((s) => (
                  <div key={s!.label} className="flex flex-col items-center gap-0.5">
                    <span
                      className="text-base font-bold text-primary tabular-nums"
                      style={{ fontFamily: "var(--font-mono)", letterSpacing: "-0.04em" }}
                    >
                      {s!.value ?? "—"}
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.1em] text-muted font-semibold">
                      {s!.label}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="border-t border-white/[0.06] pt-3">
              <p className="text-[10px] text-muted text-center italic">No stats yet</p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
