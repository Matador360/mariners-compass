export interface Quote {
  /** Quote text, no surrounding quotation marks. */
  text: string;
  /** Speaker or cultural source. */
  attribution: string;
  /** Year. For broadcasters / fan chants, the year the line entered the lexicon. */
  year: number;
  /** Where it came from. Flagged "Paraphrased" when not verbatim. */
  context: string;
  /** URL backing the attribution. Optional for slogans / fan chants. */
  source_url?: string;
}

// Hand-curated and source-checked. URLs back specific quotes; slogans and
// fan chants cite the cultural artifact rather than a person.
// If you spot one you can't verify, open a PR — better to drop than ship shaky.
export const QUOTES: Quote[] = [
  // ── Edgar Martinez — 2019 Hall of Fame induction speech ─────────────────
  {
    text: "I am so fortunate to have two homes: Puerto Rico and Seattle. Seattle fans, thank you for always being there for me.",
    attribution: "Edgar Martinez",
    year: 2019,
    context: "Hall of Fame induction speech, Cooperstown, July 21, 2019.",
    source_url: "https://www.seattletimes.com/sports/mariners/watch-edgar-martinezs-entire-baseball-hall-of-fame-induction-speech/",
  },
  {
    text: "What a great example Roberto Clemente was to all of us in Puerto Rico. What an honor to have my plaque in the Hall alongside with his.",
    attribution: "Edgar Martinez",
    year: 2019,
    context: "Hall of Fame induction speech, Cooperstown.",
    source_url: "https://www.seattletimes.com/sports/mariners/watch-edgar-martinezs-entire-baseball-hall-of-fame-induction-speech/",
  },
  {
    text: "This is a day I never could have imagined happening when I was growing up in Puerto Rico.",
    attribution: "Edgar Martinez",
    year: 2019,
    context: "Hall of Fame induction speech, Cooperstown.",
    source_url: "https://www.seattletimes.com/sports/mariners/watch-edgar-martinezs-entire-baseball-hall-of-fame-induction-speech/",
  },
  {
    text: "Now I can breathe 100 percent.",
    attribution: "Edgar Martinez",
    year: 2019,
    context: "After his Hall of Fame induction. The waiting was over.",
    source_url: "https://www.seattletimes.com/sports/mariners/weight-lifted-edgar-martinezs-emotional-day-ends-with-enshrinement-into-storied-hall-of-fame/",
  },

  // ── Felix Hernandez — Aug 15, 2012 perfect game ─────────────────────────
  {
    text: "I don't have any words to explain this. This is pretty amazing. It doesn't happen every day.",
    attribution: "Felix Hernandez",
    year: 2012,
    context: "Post-game press conference after his perfect game vs Tampa Bay, Aug 15, 2012.",
    source_url: "https://en.wikipedia.org/wiki/F%C3%A9lix_Hern%C3%A1ndez%27s_perfect_game",
  },
  {
    text: "It's always on my mind in every game — I need to throw a perfect game.",
    attribution: "Felix Hernandez",
    year: 2012,
    context: "Post-perfect-game press conference, Aug 15, 2012.",
    source_url: "https://en.wikipedia.org/wiki/F%C3%A9lix_Hern%C3%A1ndez%27s_perfect_game",
  },
  {
    text: "My whole family is in Venezuela so nobody is here. So I celebrate with all of you.",
    attribution: "Felix Hernandez",
    year: 2012,
    context: "Pointing to the fans after his perfect game, Aug 15, 2012.",
    source_url: "https://en.wikipedia.org/wiki/F%C3%A9lix_Hern%C3%A1ndez%27s_perfect_game",
  },

  // ── Ken Griffey Jr. — 2016 Hall of Fame induction speech ────────────────
  {
    text: "Out of my 22 years, I learned that one team will treat you the best — and that's your first team. I'm very proud to be a Seattle Mariner.",
    attribution: "Ken Griffey Jr.",
    year: 2016,
    context: "Hall of Fame induction speech, Cooperstown, July 24, 2016.",
    source_url: "https://www.seattletimes.com/sports/mariners/transcript-of-ken-griffey-jr-s-hall-of-fame-induction-speech/",
  },
  {
    text: "He taught me how to play, but more importantly how to be a man.",
    attribution: "Ken Griffey Jr.",
    year: 2016,
    context: "On his father, Ken Griffey Sr. From his Hall of Fame induction speech.",
    source_url: "https://www.seattletimes.com/sports/mariners/transcript-of-ken-griffey-jr-s-hall-of-fame-induction-speech/",
  },
  {
    text: "I stand up here humbled and overwhelmed.",
    attribution: "Ken Griffey Jr.",
    year: 2016,
    context: "Opening line of his Hall of Fame induction speech.",
    source_url: "https://www.seattletimes.com/sports/mariners/transcript-of-ken-griffey-jr-s-hall-of-fame-induction-speech/",
  },
  {
    text: "Greatest teammate I ever had. He spoke the truth — even when you didn't want to hear it.",
    attribution: "Ken Griffey Jr., on Jay Buhner",
    year: 2016,
    context: "Hall of Fame induction speech, Cooperstown.",
    source_url: "https://www.seattletimes.com/sports/mariners/transcript-of-ken-griffey-jr-s-hall-of-fame-induction-speech/",
  },
  {
    text: "Just because I made it look easy doesn't mean that it was. You don't work hard and become a Hall of Famer without working day in and day out.",
    attribution: "Ken Griffey Jr.",
    year: 2016,
    context: "Hall of Fame induction speech, on the misconception that he didn't work hard.",
    source_url: "https://www.seattletimes.com/sports/mariners/transcript-of-ken-griffey-jr-s-hall-of-fame-induction-speech/",
  },

  // ── Ichiro Suzuki — 2025 Hall of Fame + earlier ─────────────────────────
  {
    text: "Going into the Baseball Hall of Fame was not my goal. I didn't even know there was one until I visited Cooperstown for the first time in 2001. But being here today is like a fantastic dream.",
    attribution: "Ichiro Suzuki",
    year: 2025,
    context: "Hall of Fame induction speech, Cooperstown, July 27, 2025.",
    source_url: "https://www.mlb.com/news/ichiro-suzuki-hall-of-fame-induction-2025",
  },
  {
    text: "Dreams are not always realistic, but goals can be possible if you think deeply about how to reach them.",
    attribution: "Ichiro Suzuki",
    year: 2025,
    context: "Hall of Fame induction speech, Cooperstown, July 27, 2025.",
    source_url: "https://www.mlb.com/news/ichiro-suzuki-hall-of-fame-induction-2025",
  },
  {
    text: "The person who supported me the most was my wife, Yumiko. It would only be natural if she had doubts too. But she never made me feel them.",
    attribution: "Ichiro Suzuki",
    year: 2025,
    context: "Hall of Fame induction speech, Cooperstown.",
    source_url: "https://www.mlb.com/news/ichiro-suzuki-hall-of-fame-induction-2025",
  },
  {
    text: "Honestly, when you guys called to offer me a contract for 2015, I had never heard of your team.",
    attribution: "Ichiro Suzuki",
    year: 2025,
    context: "Roasting the Miami Marlins in his Hall of Fame induction speech.",
    source_url: "https://sports.yahoo.com/mlb/article/ichiro-cracks-jokes-shares-wisdom-and-calls-out-lone-voter-in-national-baseball-hall-of-fame-speech-225932752.html",
  },
  {
    text: "If I'm in a slump, I ask myself for advice.",
    attribution: "Ichiro Suzuki",
    year: 2007,
    context: "Long-attested Ichiroism, collected in baseball-quote anthologies.",
    source_url: "https://www.baseball-almanac.com/quotes/ichiro_suzuki_quotes.shtml",
  },
  {
    text: "There's a big risk you take without an interpreter, because as professional baseball players we are here to perform baseball, not to learn a language.",
    attribution: "Ichiro Suzuki",
    year: 2007,
    context: "On why he speaks through a translator. Slate, 2007.",
    source_url: "https://slate.com/culture/2007/08/parsing-the-increasingly-bizarre-sayings-of-ichiro-suzuki.html",
  },
  {
    text: "When you retire from baseball, you have until the day you die to rest.",
    attribution: "Ichiro Suzuki",
    year: 2009,
    context: "On why he kept playing into his 40s. Long-attested.",
    source_url: "https://www.baseball-almanac.com/quotes/ichiro_suzuki_quotes.shtml",
  },

  // ── Dave Niehaus — voice of the Mariners, 1977-2010 ─────────────────────
  {
    text: "My oh my!",
    attribution: "Dave Niehaus",
    year: 1977,
    context: "His signature call. On the Hall of Fame plaque, in every Mariners highlight reel.",
    source_url: "https://en.wikipedia.org/wiki/Dave_Niehaus",
  },
  {
    text: "Get out the rye bread and mustard, grandma — it is grand salami time!",
    attribution: "Dave Niehaus",
    year: 1995,
    context: "His signature grand-slam call. Earworm forever.",
    source_url: "https://en.wikipedia.org/wiki/Dave_Niehaus",
  },
  {
    text: "It will fly away!",
    attribution: "Dave Niehaus",
    year: 1977,
    context: "His home-run call. Sometimes 'Fly, fly away!'",
    source_url: "https://en.wikipedia.org/wiki/Dave_Niehaus",
  },
  {
    text: "Swung on and belted, deep to left field, Junior on his way... here comes Joey, the throw to the plate will be late, the Mariners are going to play for the American League championship!",
    attribution: "Dave Niehaus",
    year: 1995,
    context: "Calling The Double — ALDS Game 5 vs the Yankees, Oct 8, 1995.",
    source_url: "https://www.seattletimes.com/sports/mariners/listen-famous-dave-niehaus-calls-of-famed-ken-griffey-jr-moments-with-the-mariners/",
  },

  // ── Cal Raleigh ─────────────────────────────────────────────────────────
  {
    text: "Big Dumper.",
    attribution: "Jarred Kelenic, on Cal Raleigh",
    year: 2021,
    context: "Origin of the nickname. Kelenic started using it in 2020, tweeted it on Cal's call-up in 2021.",
    source_url: "https://en.wikipedia.org/wiki/Cal_Raleigh",
  },

  // ── Slogans, chants, fan culture ────────────────────────────────────────
  {
    text: "Refuse to lose.",
    attribution: "1995 Seattle Mariners",
    year: 1995,
    context: "Origin: fan signs at the Kingdome that Lou Piniella and the team adopted during the 13-game comeback.",
    source_url: "https://www.seattletimes.com/sports/mariners/top-moments-from-an-unforgettable-1995-mariners-season/",
  },
  {
    text: "I am Edgar Martinez.",
    attribution: "Mariners fanbase",
    year: 2019,
    context: "Fan chant heard on Edgar's Hall of Fame induction night and ever since.",
  },
  {
    text: "King's Court.",
    attribution: "Felix Hernandez & Mariners fans",
    year: 2011,
    context: "The yellow-shirt, K-card section born for Felix's home starts. Started May 2011.",
    source_url: "https://en.wikipedia.org/wiki/F%C3%A9lix_Hern%C3%A1ndez",
  },
  {
    text: "True to the Blue.",
    attribution: "Mariners fans",
    year: 2018,
    context: "Spirit slogan that stuck. Opening Day to October.",
  },
  {
    text: "Sodo Mojo.",
    attribution: "Mariners fans",
    year: 2001,
    context: "T-Mobile Park sits in SoDo. Mojo comes and goes. The phrase doesn't.",
  },
  {
    text: "I want to be the first Mariner in the World Series.",
    attribution: "Mariners fans, every season",
    year: 1977,
    context: "Said quietly. Said loudly. Said annually since the dawn of the franchise.",
  },

  // ── Closer ──────────────────────────────────────────────────────────────
  {
    text: "Trust me, this is the team.",
    attribution: "Mariners fans, every spring",
    year: 1977,
    context: "Hope is a hell of a thing. So is March.",
  },
];

/** Stable per local-day. Same quote for every visitor on the same calendar day. */
export function quoteOfTheDay(d: Date = new Date()): Quote {
  const start = Date.UTC(d.getFullYear(), 0, 0);
  const now = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const day = Math.floor((now - start) / 86_400_000);
  // Multiply day by a coprime stride so consecutive days don't always go +1
  // through the array — feels less monotonic.
  const stride = QUOTES.length > 0 && QUOTES.length % 7 !== 0 ? 7 : 11;
  return QUOTES[(day * stride) % QUOTES.length];
}
