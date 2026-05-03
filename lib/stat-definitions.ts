export interface StatDef {
  abbr: string;
  name: string;
  description: string;
  formula?: string;
  leagueAvg?: string;
  leagueBest?: string;
  leagueWorst?: string;
  higherIsBetter: boolean;
  category: "hitting" | "pitching" | "advanced";
  tip?: string;
}

export const STAT_DEFINITIONS: Record<string, StatDef> = {
  AVG: {
    abbr: "AVG", name: "Batting Average", higherIsBetter: true, category: "hitting",
    description: "Measures how often a batter gets a hit per at-bat. The classic measure of hitting ability.",
    formula: "H ÷ AB",
    leagueAvg: ".250", leagueBest: ".330+", leagueWorst: ".200–",
    tip: "A .300 average is considered excellent. .270 is solid.",
  },
  OBP: {
    abbr: "OBP", name: "On-Base Percentage", higherIsBetter: true, category: "hitting",
    description: "How often a batter reaches base — via hit, walk, or hit-by-pitch. Better than AVG for predicting run-scoring.",
    formula: "(H + BB + HBP) ÷ (AB + BB + HBP + SF)",
    leagueAvg: ".317", leagueBest: ".420+", leagueWorst: ".280–",
    tip: ".340+ is very good. Getting on base is more valuable than batting average alone.",
  },
  SLG: {
    abbr: "SLG", name: "Slugging Percentage", higherIsBetter: true, category: "hitting",
    description: "Measures raw power by counting total bases per at-bat. A home run counts 4x more than a single.",
    formula: "Total Bases ÷ AB",
    leagueAvg: ".408", leagueBest: ".600+", leagueWorst: ".330–",
    tip: ".500+ is elite slugging. .450 is a solid power bat.",
  },
  OPS: {
    abbr: "OPS", name: "On-Base Plus Slugging", higherIsBetter: true, category: "hitting",
    description: "The most common single-number offensive stat. Combines plate discipline (OBP) with power (SLG) into one number.",
    formula: "OBP + SLG",
    leagueAvg: ".725", leagueBest: "1.000+", leagueWorst: ".600–",
    tip: ".900+ is MVP-level. .800 is All-Star quality. .700 is league average.",
  },
  HR: {
    abbr: "HR", name: "Home Runs", higherIsBetter: true, category: "hitting",
    description: "Times a batter hit a ball over the outfield fence (or cleared the bases by rounding all bases). The most exciting play in baseball.",
    leagueAvg: "~17/season", leagueBest: "50+/season", leagueWorst: "Under 5/season",
    tip: "30+ HR/season = power hitter. 40+ = elite.",
  },
  RBI: {
    abbr: "RBI", name: "Runs Batted In", higherIsBetter: true, category: "hitting",
    description: "Number of runners who score as a result of a batter's plate appearance. Partially dependent on teammates getting on base.",
    leagueAvg: "~55/season", leagueBest: "130+/season",
    leagueWorst: "Under 30/season",
    tip: "100+ RBI is an excellent season. Depends heavily on lineup protection.",
  },
  SB: {
    abbr: "SB", name: "Stolen Bases", higherIsBetter: true, category: "hitting",
    description: "Number of bases stolen by running without the ball being put in play. Requires elite speed and base-running instincts.",
    leagueAvg: "~15/season", leagueBest: "50+/season",
    tip: "30+ SB is a base-stealing threat. 20+ is solid speed.",
  },
  BB: {
    abbr: "BB", name: "Walks (Base on Balls)", higherIsBetter: true, category: "hitting",
    description: "Times a batter reached first base by drawing four balls. A sign of elite plate discipline — you can't walk your way into bad at-bats.",
    leagueAvg: "~48/season", leagueBest: "100+/season",
    tip: "80+ walks = elite plate discipline. Walks boost OBP significantly.",
  },
  K: {
    abbr: "K", name: "Strikeouts", higherIsBetter: false, category: "hitting",
    description: "Times a batter is retired by striking out. Modern power hitters trade strikeouts for home runs — context matters.",
    leagueAvg: "~120/season", leagueWorst: "180+/season",
    tip: "Under 100 K/season = excellent contact. Context vs HR total matters.",
  },
  ERA: {
    abbr: "ERA", name: "Earned Run Average", higherIsBetter: false, category: "pitching",
    description: "Average earned runs a pitcher allows per 9 innings pitched. The fundamental measure of pitching effectiveness.",
    formula: "(Earned Runs × 9) ÷ Innings Pitched",
    leagueAvg: "4.20", leagueBest: "Sub-2.00", leagueWorst: "6.00+",
    tip: "Under 3.00 = ace. 3.00–4.00 = solid starter. 4.00–5.00 = average.",
  },
  WHIP: {
    abbr: "WHIP", name: "Walks + Hits per Inning Pitched", higherIsBetter: false, category: "pitching",
    description: "Measures how many baserunners a pitcher allows per inning. Best measure of command combined with effectiveness.",
    formula: "(BB + H) ÷ IP",
    leagueAvg: "1.30", leagueBest: "Sub-1.00", leagueWorst: "1.60+",
    tip: "Under 1.10 is elite. Under 1.20 is very good.",
  },
  "K/9": {
    abbr: "K/9", name: "Strikeouts per 9 Innings", higherIsBetter: true, category: "pitching",
    description: "How many batters a pitcher fans per 9 innings. The purest measure of strikeout stuff.",
    formula: "(K × 9) ÷ IP",
    leagueAvg: "8.5", leagueBest: "12.0+", leagueWorst: "Under 5.0",
    tip: "10+ K/9 is elite swing-and-miss stuff. 8+ is above average.",
  },
  "BB/9": {
    abbr: "BB/9", name: "Walks per 9 Innings", higherIsBetter: false, category: "pitching",
    description: "How many free passes a pitcher issues per 9 innings. Command issues show up here first.",
    formula: "(BB × 9) ÷ IP",
    leagueAvg: "3.2", leagueBest: "Under 1.5", leagueWorst: "5.0+",
    tip: "Under 2.0 = elite command. Under 3.0 is solid control.",
  },
  FIP: {
    abbr: "FIP", name: "Fielding Independent Pitching", higherIsBetter: false, category: "advanced",
    description: "Like ERA, but strips out defense and luck — only counts home runs, walks, and strikeouts. Better predictor of future ERA than ERA itself.",
    formula: "(13×HR + 3×BB − 2×K) ÷ IP + 3.15",
    leagueAvg: "4.20", leagueBest: "Sub-2.50", leagueWorst: "6.00+",
    tip: "FIP significantly below ERA = pitcher outperforming luck. Expect regression. Significantly above = pitching better than ERA suggests.",
  },
  BABIP: {
    abbr: "BABIP", name: "Batting Avg on Balls in Play", higherIsBetter: true, category: "advanced",
    description: "For hitters: how often balls in play become hits. High BABIP suggests great contact quality or luck. Helps identify if a slump or hot streak is sustainable.",
    formula: "(H − HR) ÷ (AB − K − HR + SF)",
    leagueAvg: ".300", leagueBest: ".380+", leagueWorst: ".240–",
    tip: "Much above .330 for a hitter suggests positive luck and possible regression. Well below .270 with solid contact is often bad luck.",
  },
  ISO: {
    abbr: "ISO", name: "Isolated Power", higherIsBetter: true, category: "advanced",
    description: "Measures raw extra-base power by subtracting AVG from SLG. Singles are stripped out — this is PURE power.",
    formula: "SLG − AVG",
    leagueAvg: ".158", leagueBest: ".300+", leagueWorst: "Under .080",
    tip: ".200+ = legitimate power threat. .250+ = elite slugger.",
  },
  "K%": {
    abbr: "K%", name: "Strikeout Rate", higherIsBetter: false, category: "advanced",
    description: "For hitters: percentage of plate appearances ending in a strikeout. Better than raw K because it accounts for PA volume. For pitchers: percentage of batters faced who strike out.",
    formula: "K ÷ PA (hitters) | K ÷ TBF (pitchers)",
    leagueAvg: "22%", leagueBest: "Under 10% (hitters)", leagueWorst: "35%+ (hitters)",
    tip: "For hitters: under 15% = elite contact. For pitchers: 28%+ = swing-and-miss starter.",
  },
  "BB%": {
    abbr: "BB%", name: "Walk Rate", higherIsBetter: true, category: "advanced",
    description: "For hitters: percentage of plate appearances ending in a walk. Elite plate discipline shows up here.",
    formula: "BB ÷ PA",
    leagueAvg: "8.5%", leagueBest: "15%+", leagueWorst: "Under 4%",
    tip: "12%+ is elite plate discipline. Under 6% is below average.",
  },
  "HR/600": {
    abbr: "HR/600", name: "Home Runs per 600 PA", higherIsBetter: true, category: "advanced",
    description: "Home run rate normalized to 600 plate appearances — makes comparing players with different amounts of playing time fair.",
    formula: "(HR ÷ PA) × 600",
    leagueAvg: "~17", leagueBest: "45+", leagueWorst: "Under 5",
    tip: "30+ is a legitimate power threat. 40+ is elite slugger territory.",
  },
  "K/BB": {
    abbr: "K/BB", name: "Strikeout-to-Walk Ratio", higherIsBetter: true, category: "pitching",
    description: "Ratio of strikeouts to walks. The best command-and-stuff pitchers have high K/BB — they miss bats AND the zone.",
    formula: "K ÷ BB",
    leagueAvg: "2.6", leagueBest: "5.0+", leagueWorst: "Under 1.5",
    tip: "4.0+ is elite. 3.0+ is very good command. Under 2.0 is a command concern.",
  },
  "HR/9": {
    abbr: "HR/9", name: "Home Runs per 9 Innings", higherIsBetter: false, category: "pitching",
    description: "Rate of home runs allowed per 9 innings. Pitchers who live in the zone and lack overpowering stuff tend to give up more HR.",
    formula: "(HR × 9) ÷ IP",
    leagueAvg: "1.25", leagueBest: "Under 0.6", leagueWorst: "2.0+",
    tip: "Under 0.8 is elite. Over 1.5 is a concern.",
  },
  WINS: {
    abbr: "W", name: "Wins", higherIsBetter: true, category: "pitching",
    description: "Credited when a starting pitcher leaves with the lead after 5+ innings and the team holds on to win. Heavily influenced by run support.",
    leagueAvg: "10/season", leagueBest: "20+/season",
    tip: "15+ wins is a strong season. 20 wins is rare and celebrated. Wins are run-support dependent.",
  },
  SAVES: {
    abbr: "SV", name: "Saves", higherIsBetter: true, category: "pitching",
    description: "When a closer enters with a lead of 3 or fewer runs (or bases loaded) and finishes the game. The primary closer stat.",
    leagueAvg: "30/season (for closers)", leagueBest: "45+",
    tip: "35+ saves = elite closer. 40+ is dominant.",
  },
  IP: {
    abbr: "IP", name: "Innings Pitched", higherIsBetter: true, category: "pitching",
    description: "Total innings pitched. Durability matters — starters who eat innings give the bullpen rest. 6+ IP per start is a quality start goal.",
    tip: "200+ IP/season = workhorse starter. 180+ is solid durability.",
  },
  "XBH%": {
    abbr: "XBH%", name: "Extra-Base Hit Rate", higherIsBetter: true, category: "advanced",
    description: "Percentage of hits that go for extra bases (doubles, triples, home runs). Measures a hitter's ability to get around the bases on contact.",
    formula: "(2B + 3B + HR) ÷ H",
    leagueAvg: "39%", leagueBest: "55%+", leagueWorst: "Under 25%",
    tip: "50%+ is elite power on contact. Under 30% is a singles hitter profile.",
  },
  "SB%": {
    abbr: "SB%", name: "Stolen Base Success Rate", higherIsBetter: true, category: "advanced",
    description: "Percentage of stolen base attempts that succeed. Anything below 67% actually hurts your team — you need to succeed 70%+ just to break even on the out you risk.",
    formula: "SB ÷ (SB + CS)",
    leagueAvg: "79%", leagueBest: "95%+", leagueWorst: "Under 65%",
    tip: "Under 70% is actively hurting the team. Elite base stealers run at 85%+.",
  },
  "GB%": {
    abbr: "GB%", name: "Ground Ball Rate", higherIsBetter: false, category: "advanced",
    description: "Percentage of balls in play that are ground balls. Pitchers with high GB% induce double plays and keep the ball in the park — the MLB Stats API doesn't expose raw batted ball data so we use the league-average estimate.",
    leagueAvg: "44%", leagueBest: "55%+", leagueWorst: "Under 35%",
    tip: "45%+ GB rate = ground-ball pitcher profile. Keeps the ball in the park and generates DPs.",
  },
  "LOB%": {
    abbr: "LOB%", name: "Left on Base % (Strand Rate)", higherIsBetter: true, category: "advanced",
    description: "Percentage of baserunners a pitcher strands without scoring. League average hovers around 72-74%. Unusually high or low LOB% tends to regress to the mean — luck runs out.",
    formula: "(H + BB + HBP − R) ÷ (H + BB + HBP − 1.4×HR)",
    leagueAvg: "73%", leagueBest: "82%+", leagueWorst: "Under 65%",
    tip: "80%+ LOB% is often luck — expect regression. Under 65% usually bounces back. Middle is sustainable.",
  },
  PYTHAG_W: {
    abbr: "xW", name: "Pythagorean Wins", higherIsBetter: true, category: "advanced",
    description: "Expected wins based on runs scored vs runs allowed using Bill James' formula (exponent 1.83). Shows how many wins the team 'deserves' based on run production — actual wins above this = lucky, below = unlucky.",
    formula: "RS^1.83 ÷ (RS^1.83 + RA^1.83) × G",
    leagueAvg: "81", leagueBest: "100+", leagueWorst: "Under 65",
    tip: "Actual wins > Pythagorean wins means the team is winning close games. Regression is real. Below means they've been snake-bitten — better days ahead.",
  },
  MAGIC_NUM: {
    abbr: "M#", name: "Magic Number", higherIsBetter: false, category: "advanced",
    description: "The combination of Mariners wins needed plus second-place team losses needed to clinch the division. When it hits zero, the M's win the AL West.",
    formula: "(G + 1) − W_SEA − L_2nd",
    tip: "Drops by 1 for every M's win AND every second-place loss. Two things working for us at once. Root for double dips.",
  },
  TRAGIC_NUM: {
    abbr: "T#", name: "Tragic Number", higherIsBetter: true, category: "advanced",
    description: "The combination of Mariners losses that can occur plus division-leader wins before the M's are mathematically eliminated from the division race.",
    formula: "(G + 1) − L_SEA − W_1st",
    tip: "Drops by 1 for every M's loss OR every first-place team win. The math gets dark fast when both happen on the same day.",
  },

  // ─── Statcast batter ──────────────────────────────────────────────────────
  XBA: {
    abbr: "xBA", name: "Expected Batting Average", higherIsBetter: true, category: "advanced",
    description: "What the batter SHOULD be hitting based on the exit velocity and launch angle of every batted ball this season. Strips out luck, defense, and ballpark.",
    formula: "Σ hit-probability of every batted ball ÷ AB",
    leagueAvg: ".245", leagueBest: ".310+", leagueWorst: ".210−",
    tip: "AVG well above xBA → hitter is getting lucky on weak contact. Below xBA → due for positive regression.",
  },
  XSLG: {
    abbr: "xSLG", name: "Expected Slugging", higherIsBetter: true, category: "advanced",
    description: "Like xBA, but for slugging. Aggregates expected total bases on every batted ball. Best Statcast stat for power-hitter sustainability.",
    leagueAvg: ".410", leagueBest: ".600+", leagueWorst: ".330−",
    tip: "xSLG far below SLG = power surge is luck-driven. Far above = a power breakout is brewing.",
  },
  XWOBA: {
    abbr: "xwOBA", name: "Expected Weighted On-Base", higherIsBetter: true, category: "advanced",
    description: "The single best Statcast number — combines walks plus expected outcomes on every batted ball into one OBP-scaled value. Best predictor of future production.",
    leagueAvg: ".320", leagueBest: ".400+", leagueWorst: ".280−",
    tip: "xwOBA > .380 = elite hitter regardless of slash line. Sticks around year-over-year.",
  },
  EV: {
    abbr: "EV", name: "Average Exit Velocity", higherIsBetter: true, category: "advanced",
    description: "Average mph the ball leaves the bat. Bigger EV → more damage. Foundation of every other Statcast metric.",
    leagueAvg: "88.5", leagueBest: "94+", leagueWorst: "Under 84",
    tip: "92+ mph average is power-hitter territory. Aaron Judge sits around 95.",
  },
  "HH%": {
    abbr: "HH%", name: "Hard-Hit Rate", higherIsBetter: true, category: "advanced",
    description: "Percentage of batted balls hit ≥ 95 mph. Hard-hit balls become hits at 4× the rate of softly-hit ones.",
    formula: "Batted balls ≥ 95 mph ÷ Total batted balls",
    leagueAvg: "37%", leagueBest: "55%+", leagueWorst: "Under 28%",
    tip: "45%+ HH% = sustainable hitter even when AVG dips. Trust the underlying contact.",
  },
  "BRL%": {
    abbr: "BRL%", name: "Barrel Rate", higherIsBetter: true, category: "advanced",
    description: "Percentage of batted balls in the optimal exit-velo + launch-angle combo zone where the league hits .500+ with .800+ slugging. The home-run sweet spot.",
    leagueAvg: "8%", leagueBest: "18%+", leagueWorst: "Under 4%",
    tip: "12%+ Barrel rate = legitimate power threat. 18%+ is MVP-caliber slugger.",
  },
  "SWEET_SPOT%": {
    abbr: "SS%", name: "Sweet-Spot %", higherIsBetter: true, category: "advanced",
    description: "Percentage of batted balls with launch angle 8°–32° — the optimal range for damage. Hitters above 35% find barrels regularly.",
    leagueAvg: "33%", leagueBest: "42%+", leagueWorst: "Under 25%",
    tip: "Trust hitters with high SS% in slumps — the launch profile says hits are coming.",
  },
  BAT_SPEED: {
    abbr: "Bat", name: "Bat Speed", higherIsBetter: true, category: "advanced",
    description: "Average mph of the bat through the strike zone (Statcast 2024+). Faster bats produce more exit velo at the same contact quality.",
    leagueAvg: "71.5", leagueBest: "76+", leagueWorst: "Under 68",
    tip: "75+ mph bat speed = elite. Aaron Judge sits ~75.4. Older hitters often lose 1-2 mph as they age.",
  },
  SWING_LENGTH: {
    abbr: "Swing", name: "Swing Length", higherIsBetter: false, category: "advanced",
    description: "Total feet the bat travels during the swing (Statcast 2024+). Longer swings = more power potential, but also more vulnerability to high velo.",
    leagueAvg: "7.3 ft", leagueBest: "Under 6.5 ft (contact)", leagueWorst: "8.5+ (whiff-prone)",
    tip: "Short, fast swings = contact hitters. Long, slow = whiff machines. Long, fast = unicorns (Judge).",
  },
  "SQUARED_UP%": {
    abbr: "SqU%", name: "Squared-Up %", higherIsBetter: true, category: "advanced",
    description: "How often the batter transfers maximum bat speed into exit velo. Measures pure barrel-on-ball efficiency.",
    leagueAvg: "33%", leagueBest: "45%+", leagueWorst: "Under 25%",
    tip: "High SqU% with high bat speed = devastating. Low SqU% with high bat speed = swing-and-miss problem.",
  },
  SPRINT_SPEED: {
    abbr: "Sprint", name: "Sprint Speed (ft/sec)", higherIsBetter: true, category: "advanced",
    description: "Average feet per second on competitive runs. The base measure of speed on the field.",
    leagueAvg: "27.0", leagueBest: "30+", leagueWorst: "Under 25",
    tip: "30+ ft/s = elite (top 5% of MLB). 28+ is plus speed. Below 26 is well-below-average.",
  },

  // ─── Advanced stats not yet defined ──────────────────────────────────────
  WRC_PLUS: {
    abbr: "wRC+", name: "Weighted Runs Created Plus", higherIsBetter: true, category: "advanced",
    description: "Park-adjusted offensive value where 100 = league average. A 130 wRC+ means 30% better than the average MLB hitter.",
    leagueAvg: "100", leagueBest: "150+", leagueWorst: "Under 70",
    tip: "120+ = All-Star. 140+ = MVP candidate. 100 is league average.",
  },
  WOBA: {
    abbr: "wOBA", name: "Weighted On-Base Average", higherIsBetter: true, category: "advanced",
    description: "Like OBP, but weights each event by its actual run value (HR > triple > double > BB > etc.). Better single-number offensive metric than OPS.",
    leagueAvg: ".320", leagueBest: ".400+", leagueWorst: ".280−",
    tip: ".370+ is All-Star quality. .400+ is MVP territory.",
  },
  OPS_PLUS: {
    abbr: "OPS+", name: "OPS Plus", higherIsBetter: true, category: "advanced",
    description: "Park- and league-adjusted OPS where 100 = league average. 150 = 50% better.",
    leagueAvg: "100", leagueBest: "150+", leagueWorst: "Under 70",
    tip: "Useful for cross-era comparisons. 130+ is excellent.",
  },

  // ─── Pitcher today / quality ─────────────────────────────────────────────
  "STR%": {
    abbr: "STR%", name: "Strike Rate (today)", higherIsBetter: true, category: "pitching",
    description: "Percentage of pitches today thrown for strikes (called, swinging, or in play).",
    leagueAvg: "63%", leagueBest: "70%+", leagueWorst: "Under 55%",
    tip: "65%+ = command in working order. Under 60% = pitcher fighting himself.",
  },
  BF: {
    abbr: "BF", name: "Batters Faced (today)", higherIsBetter: true, category: "pitching",
    description: "Number of opposing batters the pitcher has faced in today's outing.",
    tip: "Every BF beyond ~25 in a start raises the third-time-through-the-order penalty.",
  },
  PIT: {
    abbr: "PIT", name: "Pitch Count (today)", higherIsBetter: false, category: "pitching",
    description: "Total pitches thrown today. Manager pulls most starters at 100, elite arms ride to 110+.",
    tip: "100+ pitches = approaching the limit. 90 pitches in 5 innings = inefficient outing.",
  },
  "CSW%": {
    abbr: "CSW%", name: "Called + Swinging Strike Rate", higherIsBetter: true, category: "advanced",
    description: "Pitch-quality stat: percentage of pitches that produce a called strike OR a whiff. Single best measure of nasty stuff.",
    formula: "(Called Strikes + Whiffs) ÷ Total Pitches",
    leagueAvg: "29%", leagueBest: "33%+", leagueWorst: "Under 26%",
    tip: "32%+ CSW% = ace-quality stuff. Sustains over time.",
  },
  "SWSTR%": {
    abbr: "SwStr%", name: "Swinging Strike Rate", higherIsBetter: true, category: "advanced",
    description: "Percentage of all pitches that result in a swing-and-miss. Pure swing-and-miss stuff.",
    leagueAvg: "11%", leagueBest: "15%+", leagueWorst: "Under 8%",
    tip: "13%+ = power pitcher. Closer-level swinging-strike stuff sits 16%+.",
  },
  "CHASE%": {
    abbr: "Chase%", name: "Chase Rate", higherIsBetter: true, category: "advanced",
    description: "For pitchers: % of out-of-zone pitches batters swing at. For batters: same number — but lower is better (plate discipline).",
    leagueAvg: "29%", leagueBest: "35%+ (pitcher)", leagueWorst: "Under 24% (pitcher)",
    tip: "Pitchers want hitters chasing. Hitters want to lay off — a 22% chase rate is elite discipline.",
  },
  "ZONE%": {
    abbr: "Zone%", name: "Zone Rate", higherIsBetter: true, category: "advanced",
    description: "Percentage of pitches thrown inside the strike zone. Aggressive pitchers attack the zone; nibblers don't.",
    leagueAvg: "48%", leagueBest: "55%+", leagueWorst: "Under 42%",
    tip: "High zone% + high CSW% = elite (commands AND misses bats).",
  },
  EXTENSION: {
    abbr: "Ext", name: "Release Extension (ft)", higherIsBetter: true, category: "advanced",
    description: "How far in front of the rubber the pitcher releases the ball. Longer extension = ball gets to the hitter faster (effective velo bump).",
    leagueAvg: "6.4 ft", leagueBest: "7+", leagueWorst: "Under 5.7",
    tip: "Each extra foot of extension adds ~1 mph of perceived velocity. Tyler Glasnow gets ~7.0.",
  },
  EFF_VELO: {
    abbr: "EffV", name: "Effective Velocity (mph)", higherIsBetter: true, category: "advanced",
    description: "Perceived velocity from the batter's perspective, accounting for release extension. A 95 mph fastball with 7-ft extension plays like 97.",
    leagueAvg: "Same as release velo", leagueBest: "+2 mph perceived", leagueWorst: "−2 mph",
    tip: "Watch effective velo on flame-thrower starters — it's why some 'only 94' fastballs miss bats like 97s.",
  },
  VAA: {
    abbr: "VAA", name: "Vertical Approach Angle (°)", higherIsBetter: false, category: "advanced",
    description: "Angle the pitch enters the zone, vertically. Flatter (less negative) approach angle on high fastballs is harder to hit — they 'rise' to the eye.",
    leagueAvg: "−5.5° (FB)", leagueBest: "−4° (flatter, better)", leagueWorst: "Under −6.5°",
    tip: "Flat-VAA fastballs in the upper third = whiff machines. Spencer Strider lives here.",
  },
  H_BREAK: {
    abbr: "HBrk", name: "Horizontal Break (in)", higherIsBetter: true, category: "advanced",
    description: "Inches of horizontal movement at the plate. Sliders and sweepers live for big horizontal break.",
    tip: "15+ in of sweep on a slider = nasty sweeper. Big righty sliders against righties become unfair.",
  },
  V_BREAK: {
    abbr: "VBrk", name: "Vertical Break (in)", higherIsBetter: true, category: "advanced",
    description: "Inches of induced vertical movement (relative to gravity). 'Rising' four-seamers can have 18+ in of induced VB.",
    tip: "20+ in of induced vertical break on a fastball = ride. That's the high-velo, high-VB combo MLB models love.",
  },
  SPIN_AXIS: {
    abbr: "Axis", name: "Spin Axis", higherIsBetter: true, category: "advanced",
    description: "The clock orientation of pitch spin (e.g., 12:00 = pure backspin/rise). Tells you what kind of break to expect.",
    tip: "1:00 axis on a four-seam = good ride. 9:00 axis on a slider = sweeping break.",
  },
  STUFF_PLUS: {
    abbr: "Stf+", name: "Stuff+ (approx.)", higherIsBetter: true, category: "advanced",
    description: "Composite pitch-quality model. 100 = league avg, 110+ = elite. This is an in-app approximation; FanGraphs publishes the canonical version.",
    leagueAvg: "100", leagueBest: "115+", leagueWorst: "Under 90",
    tip: "Stuff+ measures the pitch on its own merits (velo + spin + movement) — independent of command.",
  },
  LOC_PLUS: {
    abbr: "Loc+", name: "Location+ (approx.)", higherIsBetter: true, category: "advanced",
    description: "Composite of how well a pitcher locates pitches. 100 = league avg.",
    leagueAvg: "100", leagueBest: "108+", leagueWorst: "Under 92",
    tip: "Stuff+ tells you the pitch quality. Loc+ tells you the command. Both matter.",
  },
  "PUT_AWAY%": {
    abbr: "PA%", name: "Put-Away Rate", higherIsBetter: true, category: "advanced",
    description: "Percentage of 2-strike counts that end in a strikeout. The pitcher's 'finishing pitch' efficiency.",
    leagueAvg: "20%", leagueBest: "27%+", leagueWorst: "Under 15%",
    tip: "Closers with a true out-pitch sit 25%+ on their put-away pitch.",
  },
  TUNNEL: {
    abbr: "Tnl", name: "Tunneling Score (approx.)", higherIsBetter: true, category: "advanced",
    description: "How well consecutive pitches share an early flight path before breaking apart. High tunneling = hitter can't recognize what's coming.",
    leagueAvg: "50", leagueBest: "75+", leagueWorst: "Under 30",
    tip: "Effective tunneling depends on velocity gap AND late break separation.",
  },
  VELO_DECAY: {
    abbr: "ΔV", name: "Velocity Decay (mph)", higherIsBetter: true, category: "pitching",
    description: "Drop from average velo on first 10 pitches vs last 10. Negative numbers (a drop) signal fatigue.",
    tip: "Drop ≥ 1.5 mph late in a start → bullpen should be warming. Some pitchers gain velo with adrenaline late.",
  },
  FATIGUE: {
    abbr: "Fatigue", name: "Pitcher Fatigue Tier", higherIsBetter: false, category: "pitching",
    description: "Fresh / Normal / Tiring / Gassed — based on today's pitch count vs the pitcher's typical per-outing usage.",
    tip: "Reach 'Gassed' tier and the manager has a decision to make. The 27th batter has historically owned the tired starter.",
  },
  DAYS_REST: {
    abbr: "Rest", name: "Days Rest", higherIsBetter: true, category: "pitching",
    description: "Days since the pitcher's last appearance.",
    tip: "Starters need 4-5 days. Relievers used 3 days in a row are at risk of velo decline.",
  },
  L3_ERA: {
    abbr: "L3 ERA", name: "Last 3 Outings ERA", higherIsBetter: false, category: "pitching",
    description: "ERA across the pitcher's most recent 3 appearances.",
    tip: "Hot pitchers run with low L3 ERA for weeks. Big spike = either bad luck or warning sign.",
  },
  L5_ERA: {
    abbr: "L5 ERA", name: "Last 5 Outings ERA", higherIsBetter: false, category: "pitching",
    description: "ERA across the pitcher's most recent 5 appearances. Less noisy than L3.",
    tip: "Larger sample than L3 but still recent — best 'how is he throwing right now' number.",
  },

  // ─── Live count-aware odds ───────────────────────────────────────────────
  OBP_LIVE: {
    abbr: "OBP@", name: "Live On-Base Odds", higherIsBetter: true, category: "advanced",
    description: "Projected on-base probability for the rest of THIS at-bat given the current ball-strike count. League-wide OBP swings from ~.150 (after 0-2) to ~.640 (after 3-0) — your batter's number is shifted by the same factor.",
    formula: "seasonOBP × (countLeagueOBP ÷ league baseline)",
    tip: "This number should rocket up on 3-0 and crater on 0-2. Watch it move with every pitch.",
  },
  HIT_PROB: {
    abbr: "Hit%", name: "Hit Probability", higherIsBetter: true, category: "advanced",
    description: "Projected probability the next batted ball becomes a hit, weighted by the count's slugging environment.",
    tip: "Pitcher counts produce weak contact → low hit probability. Hitter counts → loud contact.",
  },
  K_RISK: {
    abbr: "K Risk", name: "Strikeout Risk", higherIsBetter: false, category: "advanced",
    description: "Probability the at-bat ends in a strikeout, blending the pitcher's K rate, batter's K rate, and the count's K-tendency.",
    tip: "Anything above 50% in 2-strike counts = punchout coming.",
  },
  BB_PROB: {
    abbr: "BB Prob", name: "Walk Probability", higherIsBetter: true, category: "advanced",
    description: "Probability the at-bat ends in a walk, given count + pitcher BB% + batter BB%.",
    tip: "On 3-1, free passes happen at 40%+ rates league-wide. Disciplined hitters push higher.",
  },

  // ─── Game state / situational ─────────────────────────────────────────────
  LEV: {
    abbr: "LI", name: "Leverage Index", higherIsBetter: true, category: "advanced",
    description: "How much the next play affects win probability. 1.0 = average leverage. Above 2.0 = high-pressure spot. Above 4.0 = dramatic.",
    leagueAvg: "1.0",
    tip: "LI above 2 in late innings is when reputations are made.",
  },
  WPA: {
    abbr: "WPA", name: "Win Probability Added", higherIsBetter: true, category: "advanced",
    description: "Sum of win-probability changes a player has produced. The 'how many wins did your moments earn us' stat.",
    tip: "A walk-off HR can add +0.50 WPA in a single swing. Most hitters end the year between -3 and +3.",
  },
  WPA_AB: {
    abbr: "WPA AB", name: "WPA This At-Bat", higherIsBetter: true, category: "advanced",
    description: "Cumulative win-probability change since this at-bat began.",
    tip: "Watch this in tight games — a single can be worth 10x a single from a 9-0 game.",
  },
  RE24: {
    abbr: "RE24", name: "Run Expectancy (Bases/Outs)", higherIsBetter: true, category: "advanced",
    description: "League-average runs expected to score in the rest of the inning given the current bases/outs state. Bases empty / 2 outs ≈ 0.10. Bases loaded / no outs ≈ 2.27.",
    tip: "When RE24 is high, this AB matters — even a single advances the conversation toward big innings.",
  },
  RE_DELTA: {
    abbr: "RE Δ", name: "RE Gain if Reaches", higherIsBetter: true, category: "advanced",
    description: "How many additional expected runs the inning gains if this batter reaches base safely.",
    tip: "Highest RE_DELTA shows up with runners on and < 2 outs — the AB where 'just put it in play' matters most.",
  },
  PRESSURE: {
    abbr: "Pressure", name: "Pressure Index (0-100)", higherIsBetter: false, category: "advanced",
    description: "Composite of leverage + score margin + inning + baserunners — how high-stakes is this AB.",
    tip: "A 100 means the entire game is riding on this swing.",
  },

  // ─── Park / weather / context ────────────────────────────────────────────
  PARK_HR_FACTOR: {
    abbr: "Park HR", name: "Park Home Run Factor", higherIsBetter: true, category: "advanced",
    description: "Park-adjusted HR environment where 100 = neutral. T-Mobile sits ~92 (suppresses HRs). Coors Field ~112 (boosts).",
    leagueAvg: "100",
    tip: "T-Mobile is one of the toughest places to hit a HR. Adjust your expectations for power numbers here.",
  },
  PARK_RUN_FACTOR: {
    abbr: "Park R", name: "Park Run Factor", higherIsBetter: true, category: "advanced",
    description: "Park-adjusted run environment. Coors ~113, Petco ~95.",
    leagueAvg: "100",
    tip: "Use to evaluate whether a hitter's rate stats are inflated or suppressed by their park.",
  },
  WIND_EFFECT: {
    abbr: "Wind", name: "Wind Effect on HRs", higherIsBetter: true, category: "advanced",
    description: "Approximate HR-distance modifier from current wind. Out-blowing wind boosts HRs ~7% per 10 mph. In-blowing suppresses.",
    tip: "Wrigley with 15 mph out = HR Derby. Coors with the wind in = surprise pitcher's park.",
  },
  TEMP_FACTOR: {
    abbr: "Temp", name: "Temperature HR Factor", higherIsBetter: true, category: "advanced",
    description: "Hot air carries the ball further. Roughly +1% HR distance per 5°F above 70.",
    tip: "Hot summer afternoon games are HR-friendly. Cold April nights crush carry.",
  },
  UMP_NET: {
    abbr: "Ump", name: "Umpire Pitcher Favor (today)", higherIsBetter: true, category: "advanced",
    description: "Net strikes gained or lost so far due to ump's bad calls. Positive = favors pitcher, negative = favors hitter.",
    tip: "Some umps consistently extend the zone. Tip the matchup.",
  },
  UMP_ACC: {
    abbr: "Ump Acc", name: "Umpire Accuracy", higherIsBetter: true, category: "advanced",
    description: "Percentage of called pitches the home-plate umpire has gotten right today.",
    leagueAvg: "94%",
    tip: "Anything below 90% on 100+ pitches = bad night behind the plate.",
  },

  // ─── Form / streaks ──────────────────────────────────────────────────────
  HOT: {
    abbr: "Hot", name: "Hot Streak Score (0-100)", higherIsBetter: true, category: "advanced",
    description: "How much better the player has performed lately vs their season baseline. 50 = neutral, 80+ = blazing hot, 20- = ice cold.",
    tip: "Use to spot regression — players don't sustain 90s for long, and 20s are due to bounce back.",
  },
  HIT_STREAK: {
    abbr: "Streak", name: "Hit Streak (games)", higherIsBetter: true, category: "hitting",
    description: "Consecutive games with at least one hit.",
    tip: "20+ games is rare. 30+ is a national story. DiMaggio's 56 may never be touched.",
  },
  MULTI_HIT_L10: {
    abbr: "MH/10", name: "Multi-Hit Games (last 10)", higherIsBetter: true, category: "hitting",
    description: "Number of games in the last 10 with 2+ hits. A 'how often is this guy carrying us' stat.",
    tip: "5+ multi-hit games in 10 = locked in.",
  },
  L7_OPS: {
    abbr: "L7 OPS", name: "Last 7 Days OPS", higherIsBetter: true, category: "hitting",
    description: "OPS aggregated over the player's most recent 7 calendar days.",
    tip: "Hot stretches show up here first.",
  },
  L15_OPS: {
    abbr: "L15 OPS", name: "Last 15 Days OPS", higherIsBetter: true, category: "hitting",
    description: "OPS over the player's most recent 15 days. Less noisy than L7.",
    tip: "L15 > season OPS = trending up. L15 < season OPS = slumping.",
  },

  // ─── Splits ──────────────────────────────────────────────────────────────
  VS_LHP: {
    abbr: "vs LHP", name: "OPS vs Left-Handed Pitching", higherIsBetter: true, category: "hitting",
    description: "Slash line against lefty starters and relievers this season.",
    tip: "Big platoon splits matter for matchup decisions late in games.",
  },
  VS_RHP: {
    abbr: "vs RHP", name: "OPS vs Right-Handed Pitching", higherIsBetter: true, category: "hitting",
    description: "Slash line against righty pitching.",
    tip: "Most hitters fare better vs opposite-handed pitching.",
  },
  VS_LHB_OPS: {
    abbr: "vs LHB", name: "OPS Allowed vs LHB", higherIsBetter: false, category: "pitching",
    description: "OPS this pitcher allows to left-handed batters this season.",
  },
  VS_RHB_OPS: {
    abbr: "vs RHB", name: "OPS Allowed vs RHB", higherIsBetter: false, category: "pitching",
    description: "OPS this pitcher allows to right-handed batters.",
  },
  RISP_OPS: {
    abbr: "RISP", name: "OPS with RISP", higherIsBetter: true, category: "hitting",
    description: "OPS in plate appearances with runners in scoring position (2B or 3B).",
    tip: "Large gaps from season OPS are usually noise — RISP performance regresses to overall ability.",
  },
  LATE_CLOSE_OPS: {
    abbr: "L&C", name: "Late & Close OPS", higherIsBetter: true, category: "hitting",
    description: "OPS in the 7th inning or later in games tied or within 2 runs.",
    tip: "Best 'clutch' marker we've got. True clutch hitters do exist — even if it's smaller than fans assume.",
  },
  VS_TEAM_OPS: {
    abbr: "vs Team", name: "OPS vs Opposing Team", higherIsBetter: true, category: "hitting",
    description: "Career slash line against the team in the box today.",
    tip: "Some hitters genuinely own a particular franchise. Mostly noise, but watch for big sample sizes (100+ PA).",
  },
  AT_VENUE_OPS: {
    abbr: "@Venue", name: "OPS at this Venue", higherIsBetter: true, category: "hitting",
    description: "Career slash line at the current ballpark.",
    tip: "Some hitters love specific dimensions — Edgar at Yankee Stadium, etc.",
  },
  VS_FB: {
    abbr: "vs FB", name: "OPS vs Fastballs", higherIsBetter: true, category: "hitting",
    description: "Performance vs fastball-family pitches (4-seam, sinker, cutter).",
  },
  VS_BREAKING: {
    abbr: "vs Brk", name: "OPS vs Breaking Balls", higherIsBetter: true, category: "hitting",
    description: "Performance vs breaking pitches (sliders, curves, sweepers).",
  },
  VS_OFFSPEED: {
    abbr: "vs Off", name: "OPS vs Offspeed", higherIsBetter: true, category: "hitting",
    description: "Performance vs offspeed pitches (changeups, splitters).",
  },

  // ─── H2H ─────────────────────────────────────────────────────────────────
  H2H: {
    abbr: "H2H", name: "Career vs This Pitcher", higherIsBetter: true, category: "hitting",
    description: "Career stat line of the batter against the pitcher he's facing right now.",
    tip: "Anything under 8 PA is a tiny sample — broadcasters love to cite 'he's 0-for-3 vs him' but those numbers are largely noise.",
  },

  // ─── Defense / catcher ──────────────────────────────────────────────────
  POP_TIME: {
    abbr: "Pop", name: "Catcher Pop Time", higherIsBetter: false, category: "advanced",
    description: "Seconds from catcher receiving the pitch to the ball arriving at second base on a steal attempt.",
    leagueAvg: "1.99 s", leagueBest: "Under 1.85", leagueWorst: "Over 2.10",
    tip: "Sub-1.90 = elite throw. Affects every steal calculation.",
  },
  FRAMING_RUNS: {
    abbr: "Frame", name: "Catcher Framing Runs", higherIsBetter: true, category: "advanced",
    description: "Strikes gained above league average from catcher pitch presentation. Worth ~0.13 runs per added strike.",
    leagueAvg: "0", leagueBest: "+15+", leagueWorst: "−15",
    tip: "Elite framers gain pitchers a half-run per game. Has changed catcher valuation in modern MLB.",
  },

  // ─── Mariners-themed ─────────────────────────────────────────────────────
  TRIDENT_SCORE: {
    abbr: "Trident", name: "Trident Score™ (Drama 0-100)", higherIsBetter: true, category: "advanced",
    description: "Mariners-themed composite of how dramatic this at-bat is. Combines leverage, batter hot/cold, pitcher hot/cold, count drama, late-inning bonus, and close-game bonus.",
    formula: "weighted blend of LI + Hot scores + count + late+close",
    tip: "90+ is a moment. 100 is the kind of swing you'll be talking about in the bar tonight.",
  },
};
