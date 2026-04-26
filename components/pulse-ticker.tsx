"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface PulseItem {
  id: string;
  emoji: string;
  text: string;
  hot?: boolean;
}

interface PulseTickerProps {
  items: PulseItem[];
  speed?: number; // px per second
  className?: string;
}

export function PulseTicker({ items, speed = 60, className }: PulseTickerProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [offset, setOffset] = useState(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!trackRef.current) return;
    setTrackWidth(trackRef.current.scrollWidth / 2);
  }, [items]);

  useEffect(() => {
    if (!trackWidth) return;
    let currentOffset = offset;

    const animate = (time: number) => {
      if (lastTimeRef.current) {
        const delta = (time - lastTimeRef.current) / 1000;
        currentOffset += speed * delta;
        if (currentOffset >= trackWidth) currentOffset -= trackWidth;
        setOffset(currentOffset);
      }
      lastTimeRef.current = time;
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackWidth, speed]);

  if (!items.length) return null;

  const doubled = [...items, ...items];

  return (
    <div
      className={cn(
        "relative overflow-hidden border-y border-border bg-surface/80 backdrop-blur-sm",
        className
      )}
      aria-label="Live updates ticker"
    >
      {/* Gradient fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-surface to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface to-transparent z-10 pointer-events-none" />

      {/* THE PULSE label */}
      <div className="absolute left-0 top-0 bottom-0 flex items-center px-3 z-20 bg-teal/10 border-r border-teal/20">
        <span className="text-[9px] font-black uppercase tracking-widest text-teal whitespace-nowrap">
          THE PULSE
        </span>
      </div>

      <div className="pl-20 py-2 overflow-hidden">
        <div
          ref={trackRef}
          className="flex items-center gap-8 whitespace-nowrap"
          style={{ transform: `translateX(-${offset}px)`, willChange: "transform" }}
        >
          {doubled.map((item, i) => (
            <div key={`${item.id}-${i}`} className="flex items-center gap-2 shrink-0">
              <span className="text-base">{item.emoji}</span>
              <span className={cn("text-xs", item.hot ? "text-gold font-bold" : "text-secondary")}>
                {item.text}
              </span>
              <span className="text-border mx-1">·</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Build pulse items from live data
export function buildPulseItems(params: {
  teamRecord?: { wins: number; losses: number };
  streaks?: Array<{ name: string; type: "hit" | "scoreless" | "saves"; count: number }>;
  recentFact?: { emoji: string; text: string };
  teamHR?: number;
  teamERA?: string;
  lastResult?: { won: boolean; opponent: string; score: string };
}): PulseItem[] {
  const items: PulseItem[] = [];

  if (params.lastResult) {
    const r = params.lastResult;
    items.push({
      id: "last-result",
      emoji: r.won ? "✅" : "❌",
      text: `${r.won ? "W" : "L"} ${r.score} vs ${r.opponent}`,
      hot: r.won,
    });
  }

  if (params.teamRecord) {
    items.push({
      id: "record",
      emoji: "📊",
      text: `M's are ${params.teamRecord.wins}–${params.teamRecord.losses} on the season`,
    });
  }

  for (const s of params.streaks ?? []) {
    if (s.type === "hit" && s.count >= 5) {
      items.push({
        id: `streak-${s.name}`,
        emoji: "🔥",
        text: `${s.name} has hit safely in ${s.count} straight games`,
        hot: s.count >= 10,
      });
    }
    if (s.type === "scoreless" && s.count >= 10) {
      items.push({
        id: `scoreless-${s.name}`,
        emoji: "🎯",
        text: `${s.name} has ${s.count} consecutive scoreless innings`,
        hot: true,
      });
    }
  }

  if (params.teamHR) {
    items.push({
      id: "team-hr",
      emoji: "💣",
      text: `M's have hit ${params.teamHR} home runs this season`,
    });
  }

  if (params.teamERA) {
    items.push({
      id: "team-era",
      emoji: "🎳",
      text: `Team ERA sits at ${params.teamERA} — watch the rotation`,
    });
  }

  if (params.recentFact) {
    items.push({
      id: "fact",
      emoji: params.recentFact.emoji,
      text: params.recentFact.text,
    });
  }

  // Always have at least some items
  if (items.length < 3) {
    items.push(
      { id: "default-1", emoji: "⚾", text: "Refuse to Lose — Seattle Mariners baseball", hot: false },
      { id: "default-2", emoji: "🔱", text: "The Trident — real-time M's stats portal", hot: false },
      { id: "default-3", emoji: "🏟️", text: "T-Mobile Park, Seattle WA", hot: false }
    );
  }

  return items;
}
