import Link from "next/link";

interface H2HRibbonProps {
  season: number;
  vsOpponentAbbrev: string;
  thisSeasonRecord: { wins: number; losses: number };
  lastMeeting?: {
    date: string;        // "YYYY-MM-DD"
    gamePk: number;
    result: "W" | "L";
    score: string;       // e.g. "4-2"
  };
  remainingGames: number;
}

export function H2HRibbon({
  vsOpponentAbbrev,
  thisSeasonRecord,
  lastMeeting,
  remainingGames,
}: H2HRibbonProps) {
  const hasHistory = thisSeasonRecord.wins > 0 || thisSeasonRecord.losses > 0 || lastMeeting;
  if (!hasHistory) return null;

  const { wins, losses } = thisSeasonRecord;
  const recordColor = wins > losses ? "text-win" : losses > wins ? "text-loss" : "text-muted";

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-surface-2/50 border border-border/50 text-[10px] flex-wrap">
      {/* Left: season record */}
      <p className="text-muted shrink-0">
        vs {vsOpponentAbbrev}:{" "}
        <span className={`font-black ${recordColor}`}>{wins}–{losses}</span>
        {" "}this season
      </p>

      {/* Center: last meeting */}
      {lastMeeting && (
        <Link
          href={`/game/${lastMeeting.gamePk}`}
          className="text-muted hover:text-primary transition-colors shrink-0"
        >
          Last:{" "}
          <span className={lastMeeting.result === "W" ? "font-bold text-win" : "font-bold text-loss"}>
            {lastMeeting.result}
          </span>{" "}
          {lastMeeting.score}{" "}
          <span className="text-muted/60">
            {new Date(lastMeeting.date).toLocaleDateString("en-US", { month: "numeric", day: "numeric", timeZone: "UTC" })}
          </span>
        </Link>
      )}

      {/* Right: remaining */}
      {remainingGames > 0 && (
        <p className="text-muted/70 shrink-0">{remainingGames}G left vs them</p>
      )}
    </div>
  );
}
