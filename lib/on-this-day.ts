export interface OnThisDayEntry {
  monthDay: string; // 'MM-DD'
  year: number;
  title: string;
  blurb: string;
  emoji: string;
  link?: string;
}

export interface HistoricalGameOnDate {
  year: number;
  gamePk: number;
  opponent: string;
  result: "W" | "L";
  score: { sea: number; opp: number };
  homeAway: "home" | "away";
}

const MARINERS_TEAM_ID = 136;

export const CURATED_ENTRIES: OnThisDayEntry[] = [
  {
    monthDay: "08-15",
    year: 2012,
    title: "Felix's Perfect Game",
    blurb:
      "27 up, 27 down against the Rays in front of a Wednesday afternoon crowd. Felix collapsed to his knees on the final out. The 23rd perfect game in MLB history.",
    emoji: "✨",
    link: "/players/433587",
  },
  {
    monthDay: "10-08",
    year: 1995,
    title: "The Double",
    blurb:
      "Game 5 ALDS, 11th inning, two on, two out. Edgar Martinez doubles down the left field line. Joey Cora scores. Griffey rounds third and scores standing up. Baseball is saved in Seattle.",
    emoji: "🎯",
    link: "/players/118800",
  },
  {
    monthDay: "04-02",
    year: 2001,
    title: "Ichiro's MLB Debut",
    blurb:
      "First Japanese position player to play in the majors steps up against Oakland. Goes 2-for-5 with a stolen base. The Ichiro Era begins.",
    emoji: "🇯🇵",
    link: "/players/400085",
  },
  {
    monthDay: "09-30",
    year: 2022,
    title: "Cal Ends the Drought",
    blurb:
      "Cal Raleigh's pinch-hit, walk-off home run off Domingo Acevedo clinches a playoff berth. 21 years of suffering — gone in one swing. Julio sprinting out of the dugout in tears.",
    emoji: "🎆",
    link: "/players/663728",
  },
  {
    monthDay: "09-19",
    year: 2001,
    title: "116th Win",
    blurb:
      "The M's clinch their record-tying 116th win, matching the 1906 Cubs for the all-time MLB single-season wins record. The team that ran into a Yankees buzzsaw.",
    emoji: "💯",
  },
  {
    monthDay: "08-16",
    year: 2009,
    title: "Ichiro's 2,000th MLB Hit",
    blurb:
      "Ichiro reaches 2,000 hits faster than any player in MLB history — in 1,402 games. Add 1,278 NPB hits and you get a number nobody touches.",
    emoji: "📊",
    link: "/players/400085",
  },
  {
    monthDay: "10-01",
    year: 2004,
    title: "Ichiro Breaks Sisler",
    blurb:
      "Hit #258 ties George Sisler's 84-year-old single-season hits record. #259 breaks it. Ichiro finishes with 262. The opposing dugout stood and clapped.",
    emoji: "📝",
    link: "/players/400085",
  },
  {
    monthDay: "09-25",
    year: 1995,
    title: "Junior Ends It in the 9th",
    blurb:
      "Walk-off home run off the Rangers in the bottom of the 9th. Mariners refuse to die down the stretch. The miracle 1995 push — the year baseball stayed in Seattle — keeps rolling.",
    emoji: "👑",
    link: "/players/116338",
  },
  {
    monthDay: "07-27",
    year: 2025,
    title: "Ichiro's Hall of Fame Induction",
    blurb:
      "Cooperstown welcomes Ichiro Suzuki on the first ballot — 99.7% of the vote, one of the highest percentages in BBWAA history. The first Japanese player ever inducted.",
    emoji: "🏛️",
    link: "/players/400085",
  },
  {
    monthDay: "08-31",
    year: 1990,
    title: "Griffeys Go Back-to-Back",
    blurb:
      "Ken Griffey Sr. and Ken Griffey Jr. hit back-to-back home runs in the same inning vs Anaheim. The first and only father-son tandem to do it in MLB history.",
    emoji: "👨‍👦",
    link: "/players/116338",
  },
  {
    monthDay: "05-02",
    year: 2012,
    title: "The Combined No-Hitter",
    blurb:
      "Kevin Millwood, Charlie Furbush, Stephen Pryor, Lucas Luetge, Brandon League and Tom Wilhelmsen combine on a no-hitter against the Dodgers — six pitchers, zero hits.",
    emoji: "🚫",
  },
  {
    monthDay: "06-08",
    year: 2012,
    title: "Iwakuma's Six-Pitcher Continuation",
    blurb:
      "Hisashi Iwakuma turns in a vintage start. Long before his solo no-no, the rotation shows what it can do on a quiet June night.",
    emoji: "🎌",
  },
  {
    monthDay: "08-12",
    year: 2015,
    title: "Iwakuma's No-Hitter",
    blurb:
      "Hisashi Iwakuma throws a solo no-hitter against the Orioles at Safeco. 116 pitches, 7 strikeouts, masterclass in command. The first by a Japanese-born pitcher in the AL.",
    emoji: "🎯",
  },
  {
    monthDay: "09-26",
    year: 1990,
    title: "Randy Johnson No-Hits the Tigers",
    blurb:
      "The Big Unit's first career no-hitter — and the first in Mariners franchise history. 6 walks, 8 strikeouts, mostly fastballs. Detroit had no chance.",
    emoji: "🦒",
    link: "/players/122493",
  },
  {
    monthDay: "06-02",
    year: 1990,
    title: "Big Unit Joins the No-Hitter Club",
    blurb:
      "Randy Johnson's first no-no later in 1990 was the franchise's first. This date marks the early-season tune-up where the command finally clicked.",
    emoji: "⚙️",
  },
  {
    monthDay: "10-06",
    year: 2022,
    title: "Julio's Wild Card Magic",
    blurb:
      "Game 1 of the AL Wild Card Series at Toronto. The Mariners blow a 7-run lead. Then storm back. Adam Frazier and Cal Raleigh deliver. 21-year-old Julio is on the biggest stage.",
    emoji: "🌪️",
    link: "/players/677594",
  },
  {
    monthDay: "10-15",
    year: 2001,
    title: "Game 5 ALCS — Done",
    blurb:
      "The 116-win Mariners fall to the Yankees 4 games to 1 in the ALCS. The greatest regular season in franchise history ends without a World Series berth. Still hurts.",
    emoji: "💔",
  },
  {
    monthDay: "07-08",
    year: 1979,
    title: "First Mariners All-Star",
    blurb:
      "Bruce Bochte represents the Mariners in the All-Star Game in Seattle, the first M's player so honored. The Kingdome is the host stadium. AL wins 7-6.",
    emoji: "⭐",
  },
  {
    monthDay: "11-08",
    year: 2010,
    title: "Felix Wins the Cy Young",
    blurb:
      "Felix Hernández wins the AL Cy Young with a 13-12 record — the worst W-L for any Cy Young winner in history. The voters finally accept that wins are a garbage stat.",
    emoji: "👑",
    link: "/players/433587",
  },
  {
    monthDay: "07-23",
    year: 2025,
    title: "Cal Raleigh Home Run Derby Champion",
    blurb:
      "Big Dumper wins the Home Run Derby — the first switch-hitter and the first catcher to ever do it. Atlanta watches the ball fly into the Georgia night.",
    emoji: "🏆",
    link: "/players/663728",
  },
  {
    monthDay: "04-11",
    year: 2001,
    title: "Ichiro's Throw",
    blurb:
      "Opening Day. Terrence Long tries to go first-to-third on a single. Ichiro plants from the warning track and fires a frozen rope to third. Out by ten feet. 'The Throw.'",
    emoji: "🚀",
    link: "/players/400085",
  },
  {
    monthDay: "07-15",
    year: 1997,
    title: "Junior MVPs the All-Star Game",
    blurb:
      "Ken Griffey Jr. wins All-Star Game MVP at Jacobs Field — going 1-for-2 with a home run, putting on a show in the city he grew up watching his dad play in.",
    emoji: "🌟",
    link: "/players/116338",
  },
  {
    monthDay: "11-19",
    year: 1997,
    title: "Junior Wins the AL MVP",
    blurb:
      "Griffey wins the 1997 AL MVP unanimously — 56 home runs, 147 RBI. He posts the first 50-HR season in Mariners history and the first unanimous AL MVP since Reggie Jackson.",
    emoji: "🏆",
    link: "/players/116338",
  },
  {
    monthDay: "12-07",
    year: 1995,
    title: "Lou Piniella Re-Ups",
    blurb:
      "After 'Refuse to Lose,' Sweet Lou agrees to stay. He'll manage the team through the Big Unit, Junior, A-Rod, and the 116-win year.",
    emoji: "💼",
  },
  {
    monthDay: "07-31",
    year: 1998,
    title: "Randy Johnson Traded",
    blurb:
      "The Big Unit is shipped to Houston for Freddy Garcia, Carlos Guillen, and John Halama. He goes on to win 4 Cy Youngs and the 2001 World Series with Arizona.",
    emoji: "✈️",
    link: "/players/122493",
  },
  {
    monthDay: "02-10",
    year: 2000,
    title: "Trading Junior to Cincinnati",
    blurb:
      "Ken Griffey Jr. is traded to the Reds for Mike Cameron, Brett Tomko, Antonio Perez, and Jake Meyer. Junior wanted home. The city never quite recovered.",
    emoji: "💔",
    link: "/players/116338",
  },
  {
    monthDay: "07-29",
    year: 1997,
    title: "The Slocumb Disaster",
    blurb:
      "Mariners trade Derek Lowe and Jason Varitek to Boston for Heathcliff Slocumb. Lowe wins Game 7 of the 2004 World Series. Tek captains a dynasty. Slocumb posts a 5.32 ERA in Seattle.",
    emoji: "🤡",
  },
  {
    monthDay: "12-12",
    year: 2013,
    title: "The Cano Signing",
    blurb:
      "Robinson Canó signs a 10-year, $240M contract. The franchise's biggest swing of the drought era. The deal does not, in fact, end the drought.",
    emoji: "💵",
  },
  {
    monthDay: "01-08",
    year: 2025,
    title: "Ichiro Inducted (Vote Day)",
    blurb:
      "BBWAA results announced — Ichiro elected to Cooperstown on the first ballot with 99.7% of the vote. One voter's blank ballot kept it from being unanimous.",
    emoji: "🗳️",
    link: "/players/400085",
  },
  {
    monthDay: "01-22",
    year: 2019,
    title: "Edgar Inducted",
    blurb:
      "Edgar Martinez is elected to the Hall of Fame on his 10th and final ballot, with 85.4% of the vote. The greatest DH ever finally gets the nod.",
    emoji: "🏛️",
    link: "/players/118800",
  },
  {
    monthDay: "01-06",
    year: 2016,
    title: "Junior Cooperstown-Bound",
    blurb:
      "Ken Griffey Jr. is elected on the first ballot with 99.3% of the vote — at the time, the highest percentage in Hall of Fame history.",
    emoji: "🏛️",
    link: "/players/116338",
  },
  {
    monthDay: "05-23",
    year: 1982,
    title: "Gaylord Perry's 300th Win",
    blurb:
      "Gaylord Perry wins his 300th career game wearing a Mariners cap — making him the first 300-game winner in 19 years. He was also, almost certainly, cheating.",
    emoji: "🏛️",
  },
  {
    monthDay: "09-02",
    year: 2022,
    title: "Big Dumper Walks It Off",
    blurb:
      "Cal Raleigh sends a 1-0 fastball over the right field wall in the 9th inning to clinch the franchise's first playoff appearance since 2001. Ends the longest drought in North American pro sports.",
    emoji: "🎆",
    link: "/players/663728",
  },
  {
    monthDay: "06-13",
    year: 2008,
    title: "Felix's Grand Slam",
    blurb:
      "King Felix becomes the first AL pitcher in 37 years to hit a grand slam — taking Johan Santana deep at Shea Stadium during interleague play.",
    emoji: "💥",
    link: "/players/433587",
  },
  {
    monthDay: "04-15",
    year: 2007,
    title: "Felix's First No-No Bid",
    blurb:
      "King Felix throws 8 no-hit innings in the 1-hitter against the Red Sox. Drops the no-no in the 9th but stamps himself as the future ace of the franchise.",
    emoji: "🛡️",
    link: "/players/433587",
  },
  {
    monthDay: "10-04",
    year: 1995,
    title: "ALDS Game 1 vs Yankees",
    blurb:
      "Game 1 of the franchise's first-ever playoff series. The Yankees take it 9-6 at Yankee Stadium. The Mariners would dig out of an 0-2 hole to win the series.",
    emoji: "⚔️",
  },
  {
    monthDay: "03-18",
    year: 2001,
    title: "Randy's Bird",
    blurb:
      "Spring training game vs the Giants. Randy Johnson throws a fastball that strikes a dove mid-flight. Feathers explode. Pitch ruled a no-pitch. Truly happened.",
    emoji: "🕊️",
    link: "/players/122493",
  },
];

export function entriesForToday(today: Date = new Date()): OnThisDayEntry[] {
  const tz = "America/Los_Angeles";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(today);
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const monthDay = `${month}-${day}`;

  return CURATED_ENTRIES.filter((e) => e.monthDay === monthDay).sort(
    (a, b) => b.year - a.year
  );
}

export async function fetchHistoricalGamesOnDate(
  monthDay: string,
  currentYear: number,
  yearsBack = 10
): Promise<HistoricalGameOnDate[]> {
  const games: HistoricalGameOnDate[] = [];

  const tasks: Promise<HistoricalGameOnDate | null>[] = [];
  for (let y = currentYear - 1; y >= currentYear - yearsBack; y--) {
    tasks.push(fetchOneYear(`${y}-${monthDay}`));
  }

  const results = await Promise.allSettled(tasks);
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) {
      games.push(r.value);
    }
  }

  return games.sort((a, b) => b.year - a.year);
}

async function fetchOneYear(date: string): Promise<HistoricalGameOnDate | null> {
  try {
    const url = `https://statsapi.mlb.com/api/v1/schedule?teamId=${MARINERS_TEAM_ID}&sportId=1&date=${date}&hydrate=team`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      dates: Array<{
        games: Array<{
          gamePk: number;
          gameDate: string;
          status: { abstractGameState: string };
          teams: {
            home: {
              team: { id: number; abbreviation?: string; name: string; teamName?: string };
              score?: number;
              isWinner?: boolean;
            };
            away: {
              team: { id: number; abbreviation?: string; name: string; teamName?: string };
              score?: number;
              isWinner?: boolean;
            };
          };
        }>;
      }>;
    };

    const game = data.dates?.[0]?.games?.[0];
    if (!game) return null;
    if (game.status.abstractGameState !== "Final") return null;

    const isHome = game.teams.home.team.id === MARINERS_TEAM_ID;
    const us = isHome ? game.teams.home : game.teams.away;
    const them = isHome ? game.teams.away : game.teams.home;

    const seaScore = us.score ?? 0;
    const oppScore = them.score ?? 0;
    const result: "W" | "L" =
      us.isWinner === true
        ? "W"
        : us.isWinner === false
          ? "L"
          : seaScore > oppScore
            ? "W"
            : "L";

    return {
      year: parseInt(date.split("-")[0]),
      gamePk: game.gamePk,
      opponent:
        them.team.abbreviation ||
        them.team.teamName ||
        them.team.name ||
        "Opponent",
      result,
      score: { sea: seaScore, opp: oppScore },
      homeAway: isHome ? "home" : "away",
    };
  } catch {
    return null;
  }
}
