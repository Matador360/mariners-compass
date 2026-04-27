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
};
