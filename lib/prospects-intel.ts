// Mariners Top-30 prospect intel.
// Tool grades sourced from MLB Pipeline (20–80 scouting scale). When a published
// grade is unavailable, the value defaults to 50 (average) — placeholders, not
// invented numbers.

export interface ToolGrades {
  // hitters
  hit?: number;
  power?: number;
  speed?: number;
  arm?: number;
  glove?: number;
  // pitchers
  fastball?: number;
  slider?: number;
  curve?: number;
  changeup?: number;
  control?: number;
  command?: number;
}

export interface ProspectIntel {
  name: string;
  rank: number;
  position: string;
  ceiling: string;
  eta: string;
  tools: ToolGrades;
  scoutNote: string;
  tridentTake: string;
  birthYear?: number;
  signingYear?: number;
  injuryNote?: string;
  mlbId?: number;
}

export const PROSPECT_INTEL_SOURCE = "MLB Pipeline";

export const PROSPECT_INTEL: ProspectIntel[] = [
  {
    name: "Harry Ford",
    rank: 1,
    position: "C",
    ceiling: "All-Star catcher",
    eta: "2025",
    tools: { hit: 55, power: 50, speed: 40, arm: 55, glove: 65 },
    scoutNote:
      "Elite pitch framing and receiving behind the plate. Advanced plate discipline, above-average arm strength. The complete catching package — rare for a prospect this age.",
    tridentTake:
      "This might be the guy. Elite catch-and-throw skills, hits for average, and the Mariners desperately need a catcher of the future. Lock him up before he figures out how good he is.",
    birthYear: 2003,
    signingYear: 2021,
  },
  {
    name: "Colt Emerson",
    rank: 2,
    position: "SS",
    ceiling: "Everyday SS",
    eta: "2026",
    tools: { hit: 60, power: 45, speed: 50, arm: 55, glove: 55 },
    scoutNote:
      "2023 first-rounder (12th overall) out of HS. Advanced bat-to-ball ability, controlled swing, projects for doubles power. Solid defender who should stick at short.",
    tridentTake:
      "2023 first-rounder who actually looks like a first-rounder. Advanced approach for his age, solid glove, doubles machine. Give him two more years and don't blink.",
    birthYear: 2005,
    signingYear: 2023,
  },
  {
    name: "Jonatan Clase",
    rank: 3,
    position: "CF",
    ceiling: "Starting CF",
    eta: "2025",
    tools: { hit: 45, power: 45, speed: 70, arm: 50, glove: 65 },
    scoutNote:
      "70-grade speed and CF defense that's already MLB-ready. Legitimate top-of-order talent if the hit tool develops. The bat is the one question mark — and it's a significant one.",
    tridentTake:
      "The legs don't lie. 70-grade speed, gold glove defense, legitimate threat on the bases. If the hit tool clicks, he's special. If not... he's still fast as hell.",
    birthYear: 2002,
    signingYear: 2018,
  },
  {
    name: "Cole Young",
    rank: 4,
    position: "SS",
    ceiling: "Solid regular SS/2B",
    eta: "2026",
    tools: { hit: 60, power: 45, speed: 50, arm: 55, glove: 55 },
    scoutNote:
      "2022 first-rounder (21st overall). Advanced approach, makes elite contact, takes walks. Developing power as he physically matures. Patient bat in a system that desperately needs one.",
    tridentTake:
      "Patient hitter in a system full of aggressive hackers — refreshing. Won't light up the radar gun but will wear out pitchers. High-floor type. Smart bet for a future regular.",
    birthYear: 2003,
    signingYear: 2022,
  },
  {
    name: "Felnin Celesten",
    rank: 5,
    position: "SS",
    ceiling: "Impact OF / SS",
    eta: "2027",
    tools: { hit: 40, power: 55, speed: 65, arm: 60, glove: 55 },
    scoutNote:
      "Venezuelan signee with electric tools across the board. 65-grade speed, raw power potential that could play anywhere in the outfield. The ceiling is massive — the floor is still being constructed.",
    tridentTake:
      "Probably too young to stress over. But the tools are REAL. 65-grade speed, plus arm, power upside that scares you. Get attached now so the eventual trade hurts more.",
    birthYear: 2005,
    signingYear: 2023,
  },
  {
    name: "Emerson Hancock",
    rank: 6,
    position: "SP",
    ceiling: "Mid-rotation starter",
    eta: "2025",
    tools: { fastball: 55, slider: 55, changeup: 55, command: 55 },
    scoutNote:
      "2020 first-rounder spent too much time on the IL. When healthy: three quality pitches, clean mechanics, real strikeout upside. 'When healthy' is doing a lot of heavy lifting in that sentence.",
    tridentTake:
      "The talent is undeniable. The injury history is also undeniable. Cautious optimism is the only rational response. He stays healthy for a full year, he's a rotation piece. Fingers crossed.",
    birthYear: 1999,
    signingYear: 2020,
    injuryNote: "Recurring shoulder/lat issues",
  },
  {
    name: "Victor Labrada",
    rank: 7,
    position: "OF",
    ceiling: "4th OF / bench bat",
    eta: "2025",
    tools: { hit: 60, power: 35, speed: 55, arm: 45, glove: 55 },
    scoutNote:
      "Contact machine who uses the whole field. Won't launch homers. Won't miss pitches either. High floor, limited ceiling — the kind of guy who plays 10 quiet MLB years and you never notice until he's gone.",
    tridentTake:
      "Makes elite contact, never looks bad at the plate, speeds gaps. The homer power isn't there but honestly, who cares. High floor player. Every contender needs one of these.",
    birthYear: 2002,
    signingYear: 2018,
  },
  {
    name: "Bryan Woo",
    rank: 8,
    position: "SP",
    ceiling: "No. 3–4 starter",
    eta: "Already MLB",
    tools: { fastball: 60, slider: 65, changeup: 50, command: 55 },
    scoutNote:
      "Already logging MLB innings. High-spin fastball, plus slider, clean deception. Health has been the recurring concern. If he stays on the field, he's a key rotation piece for the next 5+ years.",
    tridentTake:
      "The slider is nasty. The fastball spin rate is legitimately elite. Now just stay healthy. Please. That's all we're asking. Just. Stay. Healthy.",
    birthYear: 2000,
    signingYear: 2021,
    injuryNote: "Forearm/elbow flare-ups",
  },
  {
    name: "Tyler Locklear",
    rank: 9,
    position: "1B",
    ceiling: "Everyday 1B/DH",
    eta: "2025",
    tools: { hit: 50, power: 60, speed: 40, arm: 50, glove: 50 },
    scoutNote:
      "Raw power grades out at 60+. Can hit the ball out of any park to any field. Hit tool development is the key — if it comes, he's a 30-HR type annually.",
    tridentTake:
      "Pure masher. The power is real and it plays anywhere. If he can cut the strikeouts enough to stick in a lineup, watch out. The M's need a middle-of-the-order bat badly.",
    birthYear: 2000,
    signingYear: 2022,
  },
  {
    name: "Gabriel Gonzalez",
    rank: 10,
    position: "OF",
    ceiling: "Starting OF",
    eta: "2026",
    tools: { hit: 50, power: 55, speed: 55, arm: 55, glove: 55 },
    scoutNote:
      "Well-rounded profile with no obvious weakness. All five tools grade average or better. Doesn't profile as a star but projects as a solid everyday outfielder — and that has real value.",
    tridentTake:
      "No glaring holes in the profile. Hits, runs, fields, throws. The ceiling isn't star-level but the floor is high. A solid everyday right fielder is nothing to sneeze at.",
    birthYear: 2003,
    signingYear: 2019,
  },
  {
    name: "Lazaro Montes",
    rank: 11,
    position: "OF",
    ceiling: "Middle-of-order slugger",
    eta: "2026",
    tools: { hit: 45, power: 65, speed: 40, arm: 55, glove: 45 },
    scoutNote:
      "Massive 6'4\" Cuban signee with 70-grade raw power. Long levers, big swing, prone to swing-and-miss. If he tames the strikeouts, the upside is a 30+ HR corner bat with thunder in the lumber.",
    tridentTake:
      "He hits the ball a country mile. Sometimes he doesn't hit it at all. The strikeouts will scare you, the homers will save the relationship. Worth the ride either way.",
    birthYear: 2004,
    signingYear: 2022,
  },
  {
    name: "Tai Peete",
    rank: 12,
    position: "SS",
    ceiling: "Everyday IF",
    eta: "2027",
    tools: { hit: 50, power: 50, speed: 55, arm: 55, glove: 50 },
    scoutNote:
      "Switch-hitting middle infielder taken in the 2023 first round. Tools across the board, no obvious weakness, but also no signature carrying tool yet.",
    tridentTake:
      "Switch-hitter with real wheels and a solid frame. Boring profile in the best way — keep checking back, the breakout is coming.",
    birthYear: 2005,
    signingYear: 2023,
  },
  {
    name: "Jonny Farmelo",
    rank: 13,
    position: "CF",
    ceiling: "Starting CF",
    eta: "2027",
    tools: { hit: 50, power: 50, speed: 60, arm: 55, glove: 55 },
    scoutNote:
      "2023 first-rounder (29th overall). Plus runner with a smooth swing and gap-to-gap pop. Athletic enough to stick in center long-term.",
    tridentTake:
      "Center fielder who can run, throw, and barrel a baseball. The Mariners drafted athleticism — let's see if the bat catches up.",
    birthYear: 2004,
    signingYear: 2023,
  },
  {
    name: "Michael Arroyo",
    rank: 14,
    position: "2B",
    ceiling: "Everyday 2B",
    eta: "2026",
    tools: { hit: 55, power: 50, speed: 45, arm: 50, glove: 50 },
    scoutNote:
      "Compact infielder with a quiet, professional approach. Walks more than he strikes out. Power is fringy but the on-base skills are advanced.",
    tridentTake:
      "Doesn't look like much until you check the OBP. Then you can't stop checking the OBP. Future leadoff guy if the bat keeps playing.",
    birthYear: 2004,
    signingYear: 2021,
  },
  {
    name: "Ryan Sloan",
    rank: 15,
    position: "SP",
    ceiling: "Mid-rotation starter",
    eta: "2028",
    tools: { fastball: 60, slider: 55, curve: 50, changeup: 50, control: 50 },
    scoutNote:
      "2024 second-round prep arm with a fastball that already lives 94–96. Projectable frame, three-pitch mix, will need reps to refine command.",
    tridentTake:
      "High-school pitcher with a fastball that's already big-league average. The dev curve is long but the ceiling is real.",
    birthYear: 2005,
    signingYear: 2024,
  },
  {
    name: "Jurrangelo Cijntje",
    rank: 16,
    position: "SP",
    ceiling: "Mid-rotation starter",
    eta: "2027",
    tools: { fastball: 55, slider: 55, changeup: 50, control: 50 },
    scoutNote:
      "2024 first-rounder (15th overall). Switch-pitcher who can attack from either side. The novelty is fun; the right-handed stuff is the real ticket.",
    tridentTake:
      "Throws with both hands. We are not making this up. Whether he stays a switch-pitcher or sticks to one side, the arm talent is legit.",
    birthYear: 2002,
    signingYear: 2024,
  },
  {
    name: "Brandyn Garcia",
    rank: 17,
    position: "SP",
    ceiling: "Back-end starter / swing man",
    eta: "2026",
    tools: { fastball: 55, slider: 55, changeup: 50, control: 50 },
    scoutNote:
      "Lefty with a low-90s fastball, deceptive delivery, and a slider that flashes plus. Profile fits as a No. 4–5 starter or a multi-inning reliever.",
    tridentTake:
      "Lefty depth. Not flashy, but the M's bullpen is going to thank somebody and it might as well be him.",
    birthYear: 2000,
    signingYear: 2022,
  },
  {
    name: "Logan Evans",
    rank: 18,
    position: "SP",
    ceiling: "Back-end starter",
    eta: "2025",
    tools: { fastball: 50, slider: 55, changeup: 50, control: 55 },
    scoutNote:
      "Strike-thrower with average velocity and four pitches. Earned a fast track through the system on command and competitiveness.",
    tridentTake:
      "Doesn't blow you away — just gets outs. The kind of guy you don't notice until he's eating innings in August.",
    birthYear: 2001,
    signingYear: 2023,
  },
  {
    name: "Ben Williamson",
    rank: 19,
    position: "3B",
    ceiling: "Glove-first 3B",
    eta: "2026",
    tools: { hit: 50, power: 45, speed: 45, arm: 60, glove: 60 },
    scoutNote:
      "Plus-defending third baseman with a strong arm and steady hands. The glove is the carrying tool; the bat needs to find more impact.",
    tridentTake:
      "Glove guys live forever in the bigs. If the bat ever clicks even a little, he's a regular. If it doesn't, he's a really nice late-inning defender.",
    birthYear: 2001,
    signingYear: 2023,
  },
  {
    name: "Walter Ford",
    rank: 20,
    position: "SP",
    ceiling: "Mid-rotation starter",
    eta: "2027",
    tools: { fastball: 55, slider: 50, curve: 50, changeup: 50, control: 50 },
    scoutNote:
      "Projectable righty with a fastball that's gradually ticked up. Curveball is the secondary, with a developing changeup.",
    tridentTake:
      "Tall, lean righty who's still filling out. The velo is climbing. Patience required, payoff possible.",
    birthYear: 2004,
    signingYear: 2022,
  },
  {
    name: "Aidan Smith",
    rank: 21,
    position: "OF",
    ceiling: "4th OF",
    eta: "2027",
    tools: { hit: 50, power: 50, speed: 55, arm: 50, glove: 50 },
    scoutNote:
      "Athletic outfielder with a balanced toolset. Pitch recognition has come a long way; the power is gap-to-gap.",
    tridentTake:
      "Future tweener who plays all three OF spots and runs into 12 homers a year. Useful, just not flashy.",
    birthYear: 2004,
    signingYear: 2022,
  },
  {
    name: "Tyler Gough",
    rank: 22,
    position: "SP",
    ceiling: "Back-end starter",
    eta: "2028",
    tools: { fastball: 50, slider: 50, changeup: 50, control: 50 },
    scoutNote:
      "Polished college arm with average stuff and above-average pitchability. Not a velocity guy — wins with sequencing.",
    tridentTake:
      "He's not going to wow scouts on a radar gun. He's going to wow them on a stat sheet eight starts in a row.",
    birthYear: 2003,
    signingYear: 2024,
  },
  {
    name: "Hunter Cranton",
    rank: 23,
    position: "RP",
    ceiling: "Setup arm",
    eta: "2026",
    tools: { fastball: 60, slider: 55, control: 50 },
    scoutNote:
      "Heavy fastball, hard slider, lives up in the zone. Profiles as a high-leverage reliever once the command stabilizes.",
    tridentTake:
      "Big arm in a small role. If the command snaps into place, he's a 7th-inning option in a hurry.",
    birthYear: 1999,
    signingYear: 2022,
  },
  {
    name: "Caden Bogenschutz",
    rank: 24,
    position: "SP",
    ceiling: "Back-end starter",
    eta: "2028",
    tools: { fastball: 50, slider: 50, curve: 50, changeup: 50, control: 50 },
    scoutNote:
      "Recent draftee with a four-pitch mix and clean delivery. Stuff is average across the board; profile is durability and strikes.",
    tridentTake:
      "No standout pitch yet. Lots of strikes. Could quietly climb if one of the secondaries jumps.",
    birthYear: 2003,
    signingYear: 2024,
  },
  {
    name: "Luis Suisbel",
    rank: 25,
    position: "3B",
    ceiling: "Bench corner IF",
    eta: "2027",
    tools: { hit: 50, power: 55, speed: 40, arm: 55, glove: 50 },
    scoutNote:
      "International signing with corner-IF profile. Power is the calling card; the glove is fine, not flashy.",
    tridentTake:
      "Power-first profile with a usable glove at third. Needs to keep hitting his way up — the system is deep at corners.",
    birthYear: 2004,
    signingYear: 2021,
  },
  {
    name: "Marcelo Perez",
    rank: 26,
    position: "C",
    ceiling: "Backup C",
    eta: "2027",
    tools: { hit: 45, power: 45, arm: 55, glove: 55 },
    scoutNote:
      "Defensive-minded catcher with quiet hands and a solid arm. Bat is the question; framing is the answer.",
    tridentTake:
      "Catchers who can catch always find a job. The bat just needs to be passable.",
    birthYear: 2003,
    signingYear: 2020,
  },
  {
    name: "Reid VanScoter",
    rank: 27,
    position: "SP",
    ceiling: "Lefty depth",
    eta: "2026",
    tools: { fastball: 50, slider: 50, changeup: 50, control: 55 },
    scoutNote:
      "Strike-throwing lefty with average stuff and a feel for sequencing. Profile is depth starter or long reliever.",
    tridentTake:
      "Lefty who throws strikes — there's a job somewhere in MLB for that, even if it's the seventh starter slot.",
    birthYear: 2001,
    signingYear: 2023,
  },
  {
    name: "Carlos Jorge",
    rank: 28,
    position: "2B",
    ceiling: "Utility IF",
    eta: "2027",
    tools: { hit: 50, power: 45, speed: 55, arm: 50, glove: 50 },
    scoutNote:
      "Compact, athletic infielder with feel to hit. Doesn't have one carrying tool but does several things adequately.",
    tridentTake:
      "Utility-bench profile. Never going to be a star, but every roster needs the guy who can play three spots without embarrassing himself.",
    birthYear: 2003,
    signingYear: 2020,
  },
  {
    name: "Robert Garcia",
    rank: 29,
    position: "RP",
    ceiling: "Middle reliever",
    eta: "2026",
    tools: { fastball: 55, slider: 55, control: 50 },
    scoutNote:
      "Two-pitch reliever with a power fastball and hard breaker. Limited to short bursts; the role is clear.",
    tridentTake:
      "He throws cheese, he throws gas. He gets two innings, he goes home. Useful piece if the command tightens.",
    birthYear: 2002,
    signingYear: 2023,
  },
  {
    name: "Tyler Cleveland",
    rank: 30,
    position: "SP",
    ceiling: "Depth starter",
    eta: "2028",
    tools: { fastball: 50, slider: 50, changeup: 50, control: 50 },
    scoutNote:
      "College arm taken with future depth in mind. Average stuff across the board, with command as the developing skill.",
    tridentTake:
      "Org depth pitcher today, dark-horse breakout candidate tomorrow. The system needs guys like him.",
    birthYear: 2002,
    signingYear: 2024,
  },
];

export function intelByName(name: string): ProspectIntel | undefined {
  return PROSPECT_INTEL.find((p) => p.name === name);
}

export function intelByRank(rank: number): ProspectIntel | undefined {
  return PROSPECT_INTEL.find((p) => p.rank === rank);
}

export function isPitcherPosition(position: string): boolean {
  return ["SP", "RP", "P", "CL"].includes(position.toUpperCase());
}

// Parse the human-readable ETA into a numeric year. "Already MLB" → thisYear.
// "2026", "2026-27", "2027+" → first number found. Falls back to thisYear + 4.
export function etaToYear(eta: string, thisYear: number): number {
  if (/already/i.test(eta)) return thisYear;
  const match = eta.match(/\d{4}/);
  if (match) return parseInt(match[0], 10);
  return thisYear + 4;
}
