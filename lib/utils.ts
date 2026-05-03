import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { MLBHittingStats, MLBPitchingStats, MLBTeamStatsEntry } from "@/types/mlb";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ordinal(n: number): string {
  const abs = Math.abs(Math.round(n));
  const mod100 = abs % 100;
  const mod10 = abs % 10;
  if (mod100 >= 11 && mod100 <= 13) return `${abs}th`;
  if (mod10 === 1) return `${abs}st`;
  if (mod10 === 2) return `${abs}nd`;
  if (mod10 === 3) return `${abs}rd`;
  return `${abs}th`;
}

export function formatDate(dateStr: string, opts?: Intl.DateTimeFormatOptions) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric",
    ...opts,
  });
}

export function formatGameTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function isToday(dateStr: string) {
  const today = new Date().toLocaleDateString("en-US", {
    timeZone: "America/Los_Angeles",
  });
  const gameDay = new Date(dateStr).toLocaleDateString("en-US", {
    timeZone: "America/Los_Angeles",
  });
  return today === gameDay;
}

export function getCountdown(dateStr: string): string {
  const now = Date.now();
  const target = new Date(dateStr).getTime();
  const diff = target - now;
  if (diff <= 0) return "In Progress";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h`;
  }
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function statAsNumber(val: string | number | undefined): number {
  if (val === undefined || val === null) return 0;
  return parseFloat(String(val)) || 0;
}

// Calculate percentile rank of value among all team stats
export function calculatePercentile(
  value: number,
  allValues: number[],
  higherIsBetter = true
): number {
  if (allValues.length === 0) return 50;
  const sorted = [...allValues].sort((a, b) => a - b);
  const rank = sorted.filter((v) => v < value).length;
  const raw = (rank / sorted.length) * 100;
  return higherIsBetter ? raw : 100 - raw;
}

export function getStatDecoration(percentile: number): {
  glow: string;
  badge: string;
  emoji: string;
  label: string;
} {
  if (percentile >= 90)
    return { glow: "stat-elite", badge: "bg-gold/20 text-gold border-gold/40", emoji: "🔥", label: "Elite" };
  if (percentile >= 75)
    return { glow: "stat-above", badge: "bg-green-500/20 text-green-400 border-green-500/40", emoji: "📈", label: "Above Avg" };
  if (percentile <= 25)
    return { glow: "stat-below", badge: "bg-red-500/20 text-red-400 border-red-500/40", emoji: "📉", label: "Below Avg" };
  return { glow: "", badge: "bg-surface-2 text-muted border-border", emoji: "", label: "Average" };
}

export function extractLeagueHittingValues(
  entries: MLBTeamStatsEntry[],
  key: keyof MLBHittingStats
): number[] {
  return entries
    .map((e) => statAsNumber((e.stat as MLBHittingStats)[key] as string | number))
    .filter((v) => v > 0);
}

export function extractLeaguePitchingValues(
  entries: MLBTeamStatsEntry[],
  key: keyof MLBPitchingStats
): number[] {
  return entries
    .map((e) => statAsNumber((e.stat as MLBPitchingStats)[key] as string | number))
    .filter((v) => v > 0);
}

export function rollingAverage(values: number[], window: number): number[] {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

export function getStatOfDay(hitting: MLBHittingStats | null, pitching: MLBPitchingStats | null): {
  title: string;
  value: string;
  context: string;
  emoji: string;
} {
  const day = new Date().getDate() % 8;

  type StatEntry = { title: string; value: string; context: string; emoji: string };
  const stats: StatEntry[] = [
    hitting && {
      title: "Team AVG",
      value: hitting.avg,
      context: `The M's are hitting ${hitting.avg} as a team this season.`,
      emoji: "⚾",
    },
    hitting && {
      title: "Home Runs",
      value: String(hitting.homeRuns),
      context: `${hitting.homeRuns} long balls — the M's keep the ball in the air.`,
      emoji: "💣",
    },
    hitting && {
      title: "Team OPS",
      value: hitting.ops,
      context: `An OPS of ${hitting.ops} ranks among the most complete offenses.`,
      emoji: "📊",
    },
    pitching && {
      title: "Team ERA",
      value: pitching.era,
      context: `Pitching staff ERA of ${pitching.era} — the rotation is holding.`,
      emoji: "🎯",
    },
    pitching && {
      title: "Team WHIP",
      value: pitching.whip,
      context: `WHIP of ${pitching.whip} — limiting baserunners per inning.`,
      emoji: "🚫",
    },
    pitching && {
      title: "Strikeouts",
      value: String(pitching.strikeOuts),
      context: `${pitching.strikeOuts} punchouts — the M's staff loves the K.`,
      emoji: "🔥",
    },
    hitting && {
      title: "Stolen Bases",
      value: String(hitting.stolenBases),
      context: `${hitting.stolenBases} bags swiped — speed on the basepaths.`,
      emoji: "💨",
    },
    pitching && {
      title: "K/9",
      value: pitching.strikeoutsPer9Inn,
      context: `${pitching.strikeoutsPer9Inn} strikeouts per 9 innings from the rotation.`,
      emoji: "🎳",
    },
  ].filter(Boolean) as NonNullable<(typeof stats)[number]>[];

  return stats[day % stats.length] ?? {
    title: "Team OBP",
    value: hitting?.obp ?? ".---",
    context: "Getting on base is how you win.",
    emoji: "👟",
  };
}

export function teamLogoUrl(teamId: number): string {
  return `https://www.mlbstatic.com/team-logos/team-cap-on-light/${teamId}.svg`;
}

export function playerHeadshotUrl(playerId: number, size: number = 120): string {
  return `https://midfield.mlbstatic.com/v1/people/${playerId}/spots/${size}`;
}

/** Higher-resolution face-centered headshot for hero displays.
 *  Uses Cloudinary's `c_thumb,g_face` to intelligently crop around the player's
 *  face — fixes the "face is too low / chin cut off" issue when a square circle
 *  is overlaid on a chest-up portrait. */
export function playerHeadshotLargeUrl(playerId: number, size: number = 320): string {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/c_thumb,g_face,w_${size},h_${size},q_auto:best,f_auto/v1/people/${playerId}/headshot/67/current`;
}

export function positionColor(pos: string): string {
  const map: Record<string, string> = {
    SP: "#005C5C",
    RP: "#00A3A3",
    CL: "#007A7A",
    C: "#C9A800",
    "1B": "#4A90D9",
    "2B": "#5BA85F",
    "3B": "#D97A4A",
    SS: "#A04AD9",
    LF: "#4AB8D9",
    CF: "#5BC882",
    RF: "#D94A7A",
    DH: "#D9C24A",
    OF: "#4AB8D9",
    IF: "#4A90D9",
  };
  return map[pos] ?? "#8BA4BA";
}
