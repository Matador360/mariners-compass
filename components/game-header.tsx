import type { ParsedLiveGame } from '@/lib/live-game';

function teamLogoUrl(teamId: number) {
  return `https://www.mlbstatic.com/team-logos/team-cap-on-light/${teamId}.svg`;
}

function BasesDiamond({
  bases,
}: {
  bases: { first: boolean; second: boolean; third: boolean };
}) {
  const fill = (on: boolean) =>
    on ? '#FFB700' : 'rgba(255,255,255,0.08)';
  const S = 7;
  return (
    <svg width="50" height="50" viewBox="0 0 50 50" aria-label="base diagram">
      {/* basepath lines */}
      <line x1="25" y1="13" x2="38" y2="25" stroke="rgba(255,255,255,0.12)" strokeWidth="0.75" />
      <line x1="38" y1="25" x2="25" y2="37" stroke="rgba(255,255,255,0.12)" strokeWidth="0.75" />
      <line x1="25" y1="37" x2="12" y2="25" stroke="rgba(255,255,255,0.12)" strokeWidth="0.75" />
      <line x1="12" y1="25" x2="25" y2="13" stroke="rgba(255,255,255,0.12)" strokeWidth="0.75" />
      {/* 2B top */}
      <polygon
        points={`25,${6 - S} ${25 + S},6 25,${6 + S} ${25 - S},6`}
        fill={fill(bases.second)}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="0.5"
      />
      {/* 1B right */}
      <polygon
        points={`38,${25 - S} ${38 + S},25 38,${25 + S} ${38 - S},25`}
        fill={fill(bases.first)}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="0.5"
      />
      {/* 3B left */}
      <polygon
        points={`12,${25 - S} ${12 + S},25 12,${25 + S} ${12 - S},25`}
        fill={fill(bases.third)}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="0.5"
      />
      {/* HP bottom — pentagon */}
      <polygon
        points={`25,${44 - S} ${25 + S},44 ${25 + 4},${44 + S} ${25 - 4},${44 + S} ${25 - S},44`}
        fill="rgba(255,255,255,0.18)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="0.5"
      />
    </svg>
  );
}

export function GameHeader({ game }: { game: ParsedLiveGame }) {
  const {
    state,
    detailedState,
    teams,
    score,
    inning,
    bases,
    count,
    weather,
    attendance,
    umpires,
    decisions,
    probablePitchers,
    venue,
    linescore,
    currentBatter,
    currentPitcher,
  } = game;

  const isLive = state === 'Live';
  const isFinal = state === 'Final';
  const isPreview = state === 'Preview';
  const homeUmpire = umpires.find(u => u.officialType === 'Home Plate');
  const currentInningOrdinal = linescore.innings.at(-1)?.ordinal ?? '';

  return (
    <div className="trident-card p-4 space-y-3">
      {/* Top row: state badge + venue */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          )}
          {isFinal && (
            <span className="text-xs font-semibold text-gray-400">FINAL</span>
          )}
          {isPreview && (
            <span className="text-xs font-semibold text-[#00A3A3]">UPCOMING</span>
          )}
          {!['Live', 'Final', 'Preview'].includes(state) && (
            <span className="text-xs text-gray-400">{detailedState}</span>
          )}
        </div>
        {venue && (
          <span className="text-xs text-gray-500">{venue.name}</span>
        )}
      </div>

      {/* Score line */}
      <div className="flex items-center justify-center gap-4">
        {/* Away */}
        <div className="flex flex-col items-center gap-1 w-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={teamLogoUrl(teams.away.id)}
            alt={teams.away.abbrev}
            width={44}
            height={44}
            className="object-contain"
          />
          <span className="text-sm font-semibold">{teams.away.abbrev}</span>
          {teams.away.record && (
            <span className="text-xs text-gray-500 tabular-nums">
              {teams.away.record.wins}–{teams.away.record.losses}
            </span>
          )}
        </div>

        {/* Scores + live info */}
        <div className="flex flex-col items-center gap-1 min-w-[100px]">
          <div className="flex items-center gap-3 tabular-nums">
            <span
              className={`text-4xl font-bold ${
                isFinal && score.away > score.home ? 'text-white' : 'text-gray-300'
              }`}
            >
              {score.away}
            </span>
            <span className="text-gray-600 text-xl">–</span>
            <span
              className={`text-4xl font-bold ${
                isFinal && score.home > score.away ? 'text-white' : 'text-gray-300'
              }`}
            >
              {score.home}
            </span>
          </div>
          {isLive && inning != null && (
            <span className="text-xs text-gray-400">{currentInningOrdinal} inning</span>
          )}
          {isLive && count != null && (
            <span className="text-xs text-gray-500 tabular-nums">
              {count.balls}–{count.strikes} · {count.outs} out{count.outs !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Home */}
        <div className="flex flex-col items-center gap-1 w-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={teamLogoUrl(teams.home.id)}
            alt={teams.home.abbrev}
            width={44}
            height={44}
            className="object-contain"
          />
          <span className="text-sm font-semibold">{teams.home.abbrev}</span>
          {teams.home.record && (
            <span className="text-xs text-gray-500 tabular-nums">
              {teams.home.record.wins}–{teams.home.record.losses}
            </span>
          )}
        </div>
      </div>

      {/* Bases + matchup for Live */}
      {isLive && bases && (
        <div className="flex flex-col items-center gap-2">
          <BasesDiamond bases={bases} />
          {currentBatter && currentPitcher && (
            <div className="flex justify-between w-full text-xs text-gray-500 border-t border-white/5 pt-2">
              <span>🏏 {currentBatter.fullName}</span>
              <span>⚾ {currentPitcher.fullName}</span>
            </div>
          )}
        </div>
      )}

      {/* Probable pitchers for Preview */}
      {isPreview && probablePitchers && (
        <div className="flex justify-between text-xs text-gray-500 border-t border-white/5 pt-2">
          <span>{teams.away.abbrev}: {probablePitchers.away?.fullName ?? 'TBD'}</span>
          <span>{teams.home.abbrev}: {probablePitchers.home?.fullName ?? 'TBD'}</span>
        </div>
      )}

      {/* Decisions for Final */}
      {isFinal && decisions && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 border-t border-white/5 pt-2">
          {decisions.winner && <span>W: {decisions.winner.fullName}</span>}
          {decisions.loser && <span>L: {decisions.loser.fullName}</span>}
          {decisions.save && <span>SV: {decisions.save.fullName}</span>}
        </div>
      )}

      {/* Meta: weather, attendance, umpire */}
      {(weather?.condition || attendance || homeUmpire) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 border-t border-white/5 pt-2">
          {weather?.condition && (
            <span>☁ {weather.condition}{weather.temp ? `, ${weather.temp}°` : ''}</span>
          )}
          {weather?.wind && <span>💨 {weather.wind}</span>}
          {attendance && <span>👥 {attendance.toLocaleString()}</span>}
          {homeUmpire && <span>⚖ HP: {homeUmpire.fullName}</span>}
        </div>
      )}
    </div>
  );
}
