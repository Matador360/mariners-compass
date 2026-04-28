import type { ParsedLiveGame } from '@/lib/live-game';

function teamLogoUrl(teamId: number) {
  return `https://www.mlbstatic.com/team-logos/team-cap-on-light/${teamId}.svg`;
}

function cellText(v: number | undefined): string {
  return v != null ? String(v) : '';
}

interface Props {
  game: ParsedLiveGame;
  /** When true, only render if there's at least one inning (avoids empty box for Preview). */
  liveOnly?: boolean;
}

export function Linescore({ game, liveOnly }: Props) {
  const { linescore, teams, state, inning, inningHalf } = game;
  if (liveOnly && linescore.innings.length === 0) return null;
  if (state === 'Preview' && linescore.innings.length === 0) return null;

  // Always show 9 inning columns; pad if game is short, extend for extras.
  const minInnings = 9;
  const maxInning = Math.max(minInnings, ...linescore.innings.map(i => i.num));
  const cols = Array.from({ length: maxInning }, (_, i) => i + 1);
  const innByNum = new Map(linescore.innings.map(i => [i.num, i]));

  const isCurrentInning = (n: number, side: 'home' | 'away') => {
    if (state !== 'Live' || inning !== n) return false;
    if (side === 'home') return inningHalf === 'bottom';
    return inningHalf === 'top';
  };

  return (
    <div className="trident-card p-3 overflow-x-auto">
      <table className="w-full text-xs tabular-nums">
        <thead>
          <tr className="text-gray-500">
            <th className="w-8" />
            {cols.map(n => (
              <th key={n} className="px-1 text-center font-semibold">
                {n}
              </th>
            ))}
            <th className="w-1" />
            <th className="px-1.5 text-center font-bold text-gray-300">R</th>
            <th className="px-1.5 text-center font-bold text-gray-300">H</th>
            <th className="px-1.5 text-center font-bold text-gray-300">E</th>
          </tr>
        </thead>
        <tbody>
          {(['away', 'home'] as const).map(side => {
            const team = teams[side];
            const totals = linescore.totals[side];
            return (
              <tr key={side} className="border-t border-white/5">
                <td className="py-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={teamLogoUrl(team.id)}
                    alt={team.abbrev}
                    width={20}
                    height={20}
                    className="h-5 w-5 object-contain"
                  />
                </td>
                {cols.map(n => {
                  const inn = innByNum.get(n);
                  const sideRuns = inn?.[side]?.runs;
                  const current = isCurrentInning(n, side);
                  return (
                    <td
                      key={n}
                      className={`px-1 py-1 text-center ${
                        current
                          ? 'bg-emerald-400/10 text-emerald-300 font-semibold'
                          : 'text-gray-300'
                      }`}
                    >
                      {cellText(sideRuns)}
                    </td>
                  );
                })}
                <td />
                <td className="px-1.5 py-1 text-center font-bold text-white">
                  {totals.runs}
                </td>
                <td className="px-1.5 py-1 text-center text-gray-300">
                  {totals.hits}
                </td>
                <td className="px-1.5 py-1 text-center text-gray-300">
                  {totals.errors}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
