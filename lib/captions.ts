// ─── Types ────────────────────────────────────────────────────────────────

export type Tier = 'hot' | 'cold' | 'spicy' | 'tragic' | 'neutral' | 'lore';
export type Tone = 'family' | 'spicy' | 'profane';

export interface Caption {
  tier: Tier;
  text: string;
  emoji?: string;
}

// ─── Internal Helpers ────────────────────────────────────────────────────

function hash(n: number): number {
  let h = (n ^ 0xdeadbeef) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  return (h ^ (h >>> 16)) >>> 0;
}

function pick<T>(pool: T[], seed: number): T {
  return pool[hash(seed) % pool.length];
}

type TonePool = { [K in Tone]?: string[] };

function fromPool(pools: TonePool, tone: Tone, seed: number): string {
  const order: Tone[] =
    tone === 'profane' ? ['profane', 'spicy', 'family'] :
    tone === 'spicy'   ? ['spicy', 'family'] :
                         ['family'];
  for (const k of order) {
    const p = pools[k];
    if (p?.length) return pick(p, seed);
  }
  return '';
}

function tmpl(s: string, v: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));
}

function one(tier: Tier, text: string, emoji?: string): Caption[] {
  return emoji ? [{ tier, text, emoji }] : [{ tier, text }];
}

// ─── Win Streak Captions ──────────────────────────────────────────────────

const STREAK_HOT: TonePool = {
  family: [
    "{n}-game win streak and this team is clicking on all cylinders.",
    "Refuse to lose. {n} straight wins and counting.",
    "{n} in a row. T-Mobile Park is absolutely rocking.",
    "{n} wins straight. Edgar would approve of this run.",
    "The M's are on a {n}-game tear. Nobody's stopping them.",
  ],
  spicy: [
    "{n} in a row. The bandwagon has a waiting list.",
    "King's Court energy radiating off this {n}-game streak.",
    "{n} straight. T-Mo magic is alive and well.",
    "Can't be stopped. {n} consecutive W's and the division knows it.",
    "Refuse to lose mentality, {n}-game edition.",
  ],
  profane: [
    "{n} straight wins. Fuck around and find out.",
    "This team is stupid good right now. {n}-game heater.",
    "{n} in a row and the haters are eating crow.",
    "Unstoppable. {n} straight, no mercy, no days off.",
    "{n} W's in a row. The rest of the AL can sit down.",
  ],
};

const STREAK_SPICY: TonePool = {
  family: [
    "{n} wins in a row — the momentum is real.",
    "Back-to-back wins and the M's are finding their stride.",
    "{n} straight. The bats and arms are clicking.",
    "Hot stretch of baseball — {n} in a row.",
    "Rolling. {n}-game win streak with more to come.",
  ],
  spicy: [
    "{n} straight W's. Somebody wake up the fanbase.",
    "Hot streak alert — {n} in a row and it feels good.",
    "Big Dumper energy. {n}-game win streak.",
    "{n} wins straight. The offense finally showed up.",
    "They're doing it. {n} straight, no days off.",
  ],
  profane: [
    "{n} wins straight. The M's said 'not today.'",
    "{n} in a row and the skeptics went quiet.",
    "Who said the season was cooked? {n} straight wins.",
    "Built different. {n} straight W's.",
    "{n}-game streak. Let them be mad.",
  ],
};

const STREAK_COLD: TonePool = {
  family: [
    "{n} straight losses. Every team hits rough patches — it'll turn.",
    "A {n}-game losing skid. Time to regroup.",
    "Dropped {n} in a row. A spark is needed.",
    "{n} losses straight. The reset button is right there.",
    "Tough stretch — {n} in a row. The season is long.",
  ],
  spicy: [
    "{n}-game losing streak. Not great, Bob.",
    "Dropping {n} in a row — the 2001 ghosts are weeping.",
    "{n} straight losses. The bullpen needs a door with a padlock.",
    "Skidding. {n} straight L's and the vibe is broken.",
    "{n} losses in a row. Even The Double couldn't fix this week.",
  ],
  profane: [
    "{n} losses in a row. What the actual hell.",
    "{n}-game skid. Disaster.",
    "Circling the drain. {n} straight L's.",
    "{n} straight losses. This roster owes the fanbase a refund.",
    "Everything is on fire and not in the good way. {n} in a row.",
  ],
};

const STREAK_TRAGIC: TonePool = {
  family: [
    "Lost {n} in a row. Tough stretch — we'll get through it.",
    "{n} straight losses. Keep the faith.",
    "{n}-game slide. The season has more chapters.",
    "Dropped {n} straight. We've seen worse and survived.",
    "{n} losses in a row. Tomorrow is a new game.",
  ],
  spicy: [
    "{n} straight L's. Edgar is not impressed.",
    "Skid mode: {n} losses in a row.",
    "{n} losses straight — the offense ghosted again.",
    "{n} L's straight. Oof.",
    "Dropped {n} in a row. The vibes are: off.",
  ],
  profane: [
    "{n} straight losses. Cool cool cool.",
    "{n} L's in a row. Pure pain.",
    "Dropped {n} straight and nothing is fixable today.",
    "{n} losses in a row. Every game a fresh hell.",
    "Skidding into the abyss. {n} straight.",
  ],
};

const STREAK_NEUTRAL: TonePool = {
  family: [
    "Playing steady .500 ball. The season is long.",
    "Split the series. That's baseball.",
    "One game at a time — steady as she goes.",
    "No streak in either direction. Just playing ball.",
    "Treading water. Better days ahead.",
  ],
  spicy: [
    "It's fine. Everything is fine.",
    "One game at a time, I guess.",
    "Mediocre in the most baseball way possible.",
    "The vibes are: neutral. Could change.",
    "Baseball is happening.",
  ],
  profane: [
    "Meh.",
    "Just kind of existing right now.",
    "Neither cooked nor cooking.",
    "Fine.",
    "A perfectly average stretch of baseball.",
  ],
};

export function captionForStreak(streak: number, seed: number, tone: Tone = 'spicy'): Caption[] {
  const n = Math.abs(streak);
  if (streak >= 7)  return one('hot',     tmpl(fromPool(STREAK_HOT,     tone, seed), { n }), '🔥');
  if (streak >= 3)  return one('spicy',   tmpl(fromPool(STREAK_SPICY,   tone, seed), { n }), '⚡');
  if (streak <= -7) return one('cold',    tmpl(fromPool(STREAK_COLD,    tone, seed), { n }), '🥶');
  if (streak <= -3) return one('tragic',  tmpl(fromPool(STREAK_TRAGIC,  tone, seed), { n }), '😬');
  return one('neutral', fromPool(STREAK_NEUTRAL, tone, seed));
}

// ─── Run Differential Captions ────────────────────────────────────────────

const RUNDIFF_HOT: TonePool = {
  family: [
    "+{n} run differential. This team is outscoring the league.",
    "Outscoring opponents by {n} runs. The bats and arms are both clicking.",
    "+{n} run diff. True quality team.",
    "{n} more runs scored than allowed. The numbers back them up.",
    "Run differential of +{n}. This roster is for real.",
  ],
  spicy: [
    "+{n} run differential. Pythagorean record is smiling.",
    "Outscoring everyone by {n}. The underlying numbers love this team.",
    "Run diff: +{n}. Send it.",
    "{n} runs ahead of opponents. Built to win.",
    "+{n} and climbing. These aren't lucky wins.",
  ],
  profane: [
    "+{n} run differential. Legitimately dominant.",
    "Outscoring opponents by {n}. This team rips.",
    "{n} runs ahead and nobody can stop it.",
    "+{n} and the math doesn't lie.",
    "Run diff: +{n}. Filthy.",
  ],
};

const RUNDIFF_COLD: TonePool = {
  family: [
    "Down {n} runs on the season. The offense needs to wake up.",
    "Getting outscored by {n} all year. Something needs to give.",
    "Run differential of -{n}. The numbers want more.",
    "Outscored by {n} this season — the team has work to do.",
    "-{n} run diff. The wins are outpacing the underlying talent.",
  ],
  spicy: [
    "-{n} run differential. The Pythagorean record is not impressed.",
    "Getting outscored by {n} all season. The math is grim.",
    "Run diff: -{n}. Surviving on vibes and close wins.",
    "Outscored by {n} runs and the record is quietly lying.",
    "-{n} and counting. Regression is lurking.",
  ],
  profane: [
    "Run diff: -{n}. Getting cooked by the numbers.",
    "Outscored by {n} all year. The luck runs out eventually.",
    "-{n} run differential. Brutal.",
    "Down {n} runs season-wide. Something is not adding up.",
    "-{n} and somehow still in it. Peak chaos ball.",
  ],
};

const RUNDIFF_NEUTRAL: TonePool = {
  family: [
    "Run differential is close to even — right in the thick of it.",
    "About as many runs scored as allowed. Balanced team.",
    "Even run differential. Every game matters.",
    "Run diff hovering near zero. The season could swing either way.",
    "Roughly even on runs. It's anybody's year.",
  ],
  spicy: [
    "Run differential: basically a wash. Buckle up.",
    "Dead even on runs. Live in uncertainty.",
    "About even. A true .500 soul.",
    "Runs scored, runs allowed: same energy.",
    "Run diff is the definition of median.",
  ],
  profane: [
    "Run diff is whatever. Fine.",
    "Basically even. Chaos ball.",
    "Neutral run diff. Neither dominant nor cooked.",
    "Even steven. Baseball is happening.",
    "Meh run differential. Could be worse.",
  ],
};

export function captionForRunDiff(diff: number, seed: number, tone: Tone = 'spicy'): Caption[] {
  const n = Math.abs(Math.round(diff));
  if (diff > 50)  return one('hot',  tmpl(fromPool(RUNDIFF_HOT,  tone, seed), { n }), '📈');
  if (diff < -50) return one('cold', tmpl(fromPool(RUNDIFF_COLD, tone, seed), { n }), '📉');
  return one('neutral', fromPool(RUNDIFF_NEUTRAL, tone, seed));
}

// ─── Bullpen Captions ─────────────────────────────────────────────────────

const BULLPEN_HOT: TonePool = {
  family: [
    "The bullpen has been excellent — {era} ERA all season.",
    "A {era} ERA from the relief corps. Leads are safe.",
    "Shutdown inning after shutdown inning. Bullpen ERA: {era}.",
    "The relief corps is carrying its weight with a {era} ERA.",
    "Bullpen ERA of {era}. This is how it's supposed to work.",
  ],
  spicy: [
    "Bullpen ERA: {era}. The door is locked.",
    "{era} ERA from the pen. These arms are for real.",
    "Relief corps is cooking — {era} ERA.",
    "Lock the bullpen door and throw away the key. {era} ERA.",
    "Pen ERA: {era}. Built to hold leads.",
  ],
  profane: [
    "Bullpen ERA: {era}. Filthy.",
    "{era} bullpen ERA. Opponents are giving up.",
    "The pen is straight nasty. {era}.",
    "Lock the fucking bullpen door. {era} ERA.",
    "Relief arms at {era}. Unhittable.",
  ],
};

const BULLPEN_COLD: TonePool = {
  family: [
    "The bullpen is struggling — {era} ERA is a concern.",
    "A {era} ERA from the relief corps. Leads are not safe.",
    "Tough innings from the pen all season. {era} ERA.",
    "The relief pitching needs work — {era} ERA.",
    "Bullpen ERA of {era}. This is an area to address.",
  ],
  spicy: [
    "Bullpen ERA: {era}. The roof is leaking.",
    "{era} ERA. The seventh inning is a horror movie.",
    "Bullpen leaking like a Seattle roof. {era} ERA.",
    "Every lead is an adventure with a {era} pen ERA.",
    "Relief corps: {era} ERA and it shows every night.",
  ],
  profane: [
    "Bullpen ERA of {era}. What the hell is going on back there.",
    "Lock the fucking bullpen door. {era} ERA.",
    "{era} ERA. Disaster factory.",
    "The pen blows leads and has {era} ERA to show for it.",
    "Bullpen ERA: {era}. Criminal.",
  ],
};

const BULLPEN_NEUTRAL: TonePool = {
  family: [
    "The bullpen is holding steady with a {era} ERA.",
    "Bullpen ERA of {era} — league average, serviceable.",
    "The relief corps is getting the job done at {era} ERA.",
    "A {era} ERA from the pen. Not dominant, not a disaster.",
    "Bullpen ERA: {era}. Some good nights, some rough ones.",
  ],
  spicy: [
    "Bullpen ERA: {era}. Fine enough.",
    "{era} ERA from the pen — mixed bag.",
    "Not dominant, not a disaster. {era} bullpen ERA.",
    "Relief corps at {era}: chaotic neutral.",
    "Bullpen {era} ERA. Sometimes they hold it, sometimes they don't.",
  ],
  profane: [
    "Bullpen ERA is {era}. Mediocre.",
    "{era} ERA pen. It is what it is.",
    "Not great, not terrible. {era} bullpen ERA.",
    "Chaotic neutral energy. {era} ERA.",
    "Meh. {era} pen ERA.",
  ],
};

export function captionForBullpen(era: number, seed: number, tone: Tone = 'spicy'): Caption[] {
  const eraStr = era.toFixed(2);
  if (era < 3.5) return one('hot',     tmpl(fromPool(BULLPEN_HOT,     tone, seed), { era: eraStr }), '🔒');
  if (era < 4.5) return one('neutral', tmpl(fromPool(BULLPEN_NEUTRAL, tone, seed), { era: eraStr }));
  if (era < 5.5) return one('tragic',  tmpl(fromPool(BULLPEN_COLD,    tone, seed), { era: eraStr }), '😰');
  return one('cold', tmpl(fromPool(BULLPEN_COLD, tone, seed), { era: eraStr }), '🚨');
}

// ─── RISP Captions ────────────────────────────────────────────────────────

const RISP_HOT: TonePool = {
  family: [
    "Delivering with runners in scoring position — {avg} average with RISP.",
    "Clutch hitting all year. {avg} with RISP.",
    "When it counts, the M's cash in. {avg} RISP average.",
    "Runners are scoring. {avg} average with men on.",
    "RISP avg of {avg}. The bats show up when it matters.",
  ],
  spicy: [
    "RISP avg: {avg}. Clutch is not random for these guys.",
    "Edgar-level composure with men in scoring position. {avg} RISP avg.",
    "{avg} with RISP. The offense has a pulse in big spots.",
    "Cashing in. {avg} RISP average and runs are scoring.",
    "Big spot, big swing. {avg} RISP average.",
  ],
  profane: [
    "RISP avg: {avg}. The offense doesn't choke.",
    "{avg} with RISP. Finally.",
    "Runners in scoring position? Scored. {avg} avg.",
    "Not leaving them stranded. {avg} RISP average.",
    "Clutch as hell. {avg} RISP avg.",
  ],
};

const RISP_COLD: TonePool = {
  family: [
    "Struggling with runners in scoring position — {avg} RISP average.",
    "Leaving too many runners on base. {avg} RISP avg.",
    "The hits aren't coming with men on. {avg} with RISP.",
    "RISP struggles continue — {avg} average in big spots.",
    "{avg} RISP average. The runs are being left on the bases.",
  ],
  spicy: [
    "RISP avg: {avg}. The bases are a parking lot.",
    "Leaving everyone stranded. {avg} with RISP.",
    "{avg} RISP average. The LOB column is embarrassing.",
    "Men on, no runs. {avg} RISP avg and it's killing the offense.",
    "Clutch? Not this week. {avg} RISP average.",
  ],
  profane: [
    "RISP avg: {avg}. Stranding runners like it's a hobby.",
    "{avg} with RISP. Embarrassing.",
    "Leaving runners on base all fucking day. {avg} RISP avg.",
    "Men on, no runs, {avg} RISP average. Classic.",
    "The bases are clogged and nobody's scoring. {avg} RISP avg.",
  ],
};

const RISP_NEUTRAL: TonePool = {
  family: [
    "RISP average sits at {avg} — about league average.",
    "Decent clutch hitting — {avg} with runners in scoring position.",
    "{avg} RISP average. The offense does enough.",
    "Average performance with runners on — {avg} RISP avg.",
    "Getting some runners home. {avg} RISP average.",
  ],
  spicy: [
    "RISP avg: {avg}. Could be better, could be worse.",
    "{avg} with RISP. Mediocre clutch is still clutch.",
    "Average in big spots. {avg} RISP avg.",
    "Not exactly Edgar, but {avg} RISP avg is passable.",
    "Some runs are scoring. {avg} RISP average.",
  ],
  profane: [
    "RISP avg: {avg}. Fine.",
    "{avg} with RISP. Whatever.",
    "Meh clutch hitting. {avg} RISP avg.",
    "Average. {avg} RISP average. Baseball.",
    "Not great, not terrible. {avg} RISP avg.",
  ],
};

export function captionForRISP(avg: number, seed: number, tone: Tone = 'spicy'): Caption[] {
  const avgStr = avg.toFixed(3).replace(/^0\./, '.');
  if (avg > 0.300) return one('hot',  tmpl(fromPool(RISP_HOT,     tone, seed), { avg: avgStr }), '💥');
  if (avg < 0.200) return one('cold', tmpl(fromPool(RISP_COLD,    tone, seed), { avg: avgStr }), '🥶');
  return one('neutral',               tmpl(fromPool(RISP_NEUTRAL, tone, seed), { avg: avgStr }));
}

// ─── Game Result Captions ─────────────────────────────────────────────────

const WIN_BIG: TonePool = {
  family: [
    "A dominant win — {margin} runs is a statement.",
    "The M's rolled. {margin}-run victory.",
    "{margin} runs on the board. Comfortable win.",
    "Blowout. {margin}-run margin, no drama needed.",
    "The offense erupted for a {margin}-run win.",
  ],
  spicy: [
    "{margin}-run win. The offense had a field day.",
    "Rolled right over them. {margin}-run margin.",
    "Statement game. {margin} runs and the starters went deep.",
    "Big Dumper was unlocked. {margin}-run W.",
    "T-Mo magic was strong tonight. {margin}-run blowout.",
  ],
  profane: [
    "{margin}-run win. The M's said 'here's your receipt.'",
    "Absolutely cooked them. {margin}-run margin.",
    "Rolled. {margin} runs. Put 'em to bed.",
    "{margin}-run W. No mercy.",
    "Offensive explosion. {margin} runs.",
  ],
};

const WIN_CLOSE: TonePool = {
  family: [
    "A hard-earned win. Every game counts.",
    "Close one, but a W is a W.",
    "Grind it out. That's winning baseball.",
    "Walked away with the win — the M's find a way.",
    "One-run win. The Refuse to Lose spirit is real.",
  ],
  spicy: [
    "Sweated it out but walked away with the W.",
    "One-run game, one-run win. The boys came through.",
    "Refuse to lose. That's the energy.",
    "Tight game, better team. M's win.",
    "Nailbiter. We don't care how, just W.",
  ],
  profane: [
    "Scraped out a win. We don't ask questions.",
    "Close but a W is a W. Let's go.",
    "Ugly win is still a win.",
    "Barely held on. Still counts.",
    "Refuse to lose. Every single game.",
  ],
};

const LOSS_CLOSE: TonePool = {
  family: [
    "A tough loss — one run made all the difference.",
    "Came up just short. The effort was there.",
    "Close game, wrong result. Reset and go again.",
    "One-run loss. Baseball is painful sometimes.",
    "Heartbreaker. This team will bounce back.",
  ],
  spicy: [
    "One run short. This is the worst.",
    "Walked away without the W. Brutal.",
    "Close but no cigar. The season is long.",
    "Tight loss. The offense had chances.",
    "One-run heartbreaker. Edgar is somewhere shaking his head.",
  ],
  profane: [
    "One run. One. Run.",
    "Walked away with nothing. Gut punch.",
    "Lost by one and it stings.",
    "So close. So damn close.",
    "One-run loss. This one's going to haunt us.",
  ],
};

const LOSS_BAD: TonePool = {
  family: [
    "A rough night — {margin}-run loss. Time to regroup.",
    "Got beat by {margin} runs. This happens in baseball.",
    "{margin}-run defeat. Everyone flush it and move on.",
    "A tough one — lost by {margin} runs.",
    "Down {margin} tonight. Better days ahead.",
  ],
  spicy: [
    "{margin}-run loss. The offense was nowhere.",
    "Got handled tonight. Lost by {margin}.",
    "{margin} runs. Just cooked.",
    "Dropped by {margin}. The 2001 ghosts wouldn't stand for this.",
    "Lost by {margin}. The vibes were: awful.",
  ],
  profane: [
    "{margin}-run loss. What a disaster.",
    "Got smoked by {margin} runs.",
    "Absolutely cooked. {margin}-run L.",
    "Embarrassing. Lost by {margin}.",
    "{margin}-run loss. Everybody take the night.",
  ],
};

export function captionForGameResult(win: boolean, margin: number, seed: number, tone: Tone = 'spicy'): Caption[] {
  const m = Math.abs(margin);
  if (win  && m >= 5) return one('hot',    tmpl(fromPool(WIN_BIG,    tone, seed), { margin: m }), '🔥');
  if (win)            return one('spicy',  fromPool(WIN_CLOSE,        tone, seed),                '✅');
  if (m >= 5)         return one('cold',   tmpl(fromPool(LOSS_BAD,   tone, seed), { margin: m }), '💀');
  return one('tragic', fromPool(LOSS_CLOSE, tone, seed), '😩');
}

// ─── Player Hot Streak Captions ───────────────────────────────────────────

const PLAYER_HOT: TonePool = {
  family: [
    "{name} is locked in — {ops} OPS in this stretch.",
    "Can't get {name} out right now. {ops} OPS.",
    "{name} is carrying the offense. {ops} OPS.",
    "Peak {name}. {ops} OPS speaks for itself.",
    "{name} is on fire — {ops} OPS and every at-bat matters.",
  ],
  spicy: [
    "{name} with a {ops} OPS stretch. Edgar-level composure.",
    "{name} said 'I'm the guy' and backed it up. {ops} OPS.",
    "J-Rod energy from {name}. {ops} OPS.",
    "{name} is on a different planet right now. {ops} OPS.",
    "{name} is making exits. {ops} OPS this stretch.",
  ],
  profane: [
    "{name} is absolutely ripping. {ops} OPS.",
    "Nobody's getting {name} out. {ops} OPS.",
    "{name} with a {ops} OPS stretch. Unreal.",
    "{name} is a menace. {ops} OPS.",
    "Can't stop {name}. {ops} OPS and the pitchers know it.",
  ],
};

const PLAYER_WARM: TonePool = {
  family: [
    "{name} is hitting well — {ops} OPS in this stretch.",
    "{name} is making solid contact. {ops} OPS.",
    "A good run for {name} — {ops} OPS and counting.",
    "{name} is contributing. {ops} OPS in the lineup.",
    "Steady stretch for {name}. {ops} OPS.",
  ],
  spicy: [
    "{name} with a solid {ops} OPS stretch.",
    "Heating up. {name} at {ops} OPS.",
    "{name} is finding a groove — {ops} OPS.",
    "The bat is alive. {name} at {ops} OPS.",
    "{name} is making noise. {ops} OPS.",
  ],
  profane: [
    "{name} is playing well. {ops} OPS.",
    "Locked in. {name} at {ops} OPS.",
    "{name} at {ops} OPS. Not bad at all.",
    "The bat is awake. {name} at {ops} OPS.",
    "{name} with {ops} OPS. Built different lately.",
  ],
};

export function captionForPlayerHotStreak(ops: number, name: string, seed: number, tone: Tone = 'spicy'): Caption[] {
  const opsStr = ops.toFixed(3).replace(/^0\./, '.');
  if (ops > 1.000) return one('hot',   tmpl(fromPool(PLAYER_HOT,  tone, seed), { name, ops: opsStr }), '🔥');
  if (ops > 0.850) return one('spicy', tmpl(fromPool(PLAYER_WARM, tone, seed), { name, ops: opsStr }), '⚡');
  return one('neutral',                tmpl(fromPool(PLAYER_WARM, tone, seed), { name, ops: opsStr }));
}

// ─── Player Slump Captions ────────────────────────────────────────────────

const SLUMP_COLD: TonePool = {
  family: [
    "{name} is in a rough patch — {avg} average this stretch.",
    "A difficult spell for {name}. {avg} average and counting.",
    "{name} hasn't been able to find it lately — {avg} this stretch.",
    "Tough run for {name}. {avg} average, time to make adjustments.",
    "{name} is grinding through a slump — {avg} average.",
  ],
  spicy: [
    "{name} at {avg}. The bats are asleep.",
    "Slump mode: {name} at {avg} this stretch.",
    "{name} is stuck in a rut. {avg} average.",
    "Can't buy a hit right now — {name} at {avg}.",
    "{name} at {avg}. The pitchers have it figured out.",
  ],
  profane: [
    "{name} at {avg} and it's ugly.",
    "What happened to {name}? {avg} this stretch.",
    "{name} is getting cooked. {avg} average.",
    "Pitchers are living rent-free in {name}'s head. {avg}.",
    "{name} at {avg}. Something has to change.",
  ],
};

const SLUMP_TRAGIC: TonePool = {
  family: [
    "{name} is going through a tough stretch — {avg} average.",
    "A few rough games for {name}. {avg} this stretch.",
    "{name} has been struggling at the plate. {avg} average.",
    "Not {name}'s best run — {avg} average and looking for answers.",
    "Tough at-bats for {name} lately — {avg} average.",
  ],
  spicy: [
    "{name} at {avg} lately. Not great.",
    "Cold spell for {name}. {avg} this stretch.",
    "{name} at {avg}. The swing is off.",
    "Rough patch for {name} — {avg} average.",
    "{name} needs a spark. {avg} this stretch.",
  ],
  profane: [
    "{name} at {avg} lately. What's going on.",
    "Cold as hell. {name} at {avg}.",
    "{name} at {avg}. Just not clicking.",
    "Rough stretch for {name}. {avg} average.",
    "{name} is a mess right now. {avg} avg.",
  ],
};

export function captionForPlayerSlump(avg: number, name: string, seed: number, tone: Tone = 'spicy'): Caption[] {
  const avgStr = avg.toFixed(3).replace(/^0\./, '.');
  if (avg < 0.150) return one('cold',    tmpl(fromPool(SLUMP_COLD,    tone, seed), { name, avg: avgStr }), '🥶');
  if (avg < 0.220) return one('tragic',  tmpl(fromPool(SLUMP_TRAGIC,  tone, seed), { name, avg: avgStr }), '📉');
  return one('neutral',                  tmpl(fromPool(SLUMP_TRAGIC,  tone, seed), { name, avg: avgStr }));
}

// ─── League Rank Captions ─────────────────────────────────────────────────

const RANK_ELITE: TonePool = {
  family: [
    "Best in baseball — {stat} ranked #{rank} in MLB.",
    "#{rank} in MLB for {stat}. The best.",
    "Top of the league in {stat}. #{rank} overall.",
    "MLB-best {stat}. #{rank} in the league.",
    "{stat} ranked #{rank} in all of baseball. Dominant.",
  ],
  spicy: [
    "#{rank} in MLB for {stat}. That's the kind of number Edgar would put up.",
    "{stat} at #{rank} in baseball. Built different.",
    "Legitimately elite. #{rank} MLB in {stat}.",
    "{stat}: #{rank} in all of baseball. King's Court worthy.",
    "Top of the mountain. #{rank} in MLB for {stat}.",
  ],
  profane: [
    "#{rank} in MLB for {stat}. Absolutely dominant.",
    "{stat} at #{rank}. Filthy.",
    "Best in the game. #{rank} for {stat}.",
    "#{rank} in baseball for {stat}. Other teams can cry about it.",
    "{stat}: #{rank} in MLB. This is just unfair.",
  ],
};

const RANK_GOOD: TonePool = {
  family: [
    "#{rank} in MLB for {stat} — top tier.",
    "Top {pct}% in {stat}. This team can play.",
    "{stat} ranked #{rank}/{total} in baseball. Strong showing.",
    "#{rank} out of {total} in {stat}. Solid.",
    "Top of the league in {stat} — #{rank}/{total}.",
  ],
  spicy: [
    "#{rank}/{total} in {stat}. Quietly elite.",
    "Top {pct}% for {stat}. T-Mo magic is showing up in the numbers.",
    "{stat} at #{rank} in MLB. These guys can play.",
    "Not many teams better in {stat}. #{rank}/{total}.",
    "#{rank} in the league for {stat}. That's real.",
  ],
  profane: [
    "#{rank}/{total} in {stat}. Nobody's sleeping on this.",
    "Top {pct}% in {stat}. Built for this.",
    "{stat} at #{rank}/{total}. Legitimately good.",
    "#{rank} in baseball for {stat}. Send it.",
    "Top tier {stat}. #{rank}/{total} in MLB.",
  ],
};

const RANK_BAD: TonePool = {
  family: [
    "{stat} ranked #{rank}/{total} — room to improve.",
    "#{rank} in MLB for {stat}. Below average — something to work on.",
    "Bottom half for {stat}: #{rank}/{total}.",
    "{stat} is an area to address — #{rank}/{total} in MLB.",
    "#{rank} out of {total} in {stat}. Not where you want to be.",
  ],
  spicy: [
    "#{rank}/{total} in {stat}. Not exactly Félix-era numbers.",
    "{stat} at #{rank} in MLB. The work isn't done.",
    "Below average in {stat}: #{rank}/{total}.",
    "#{rank} in the league for {stat}. Below expectations.",
    "{stat}: #{rank}/{total}. Fixable, but it has to be a priority.",
  ],
  profane: [
    "#{rank}/{total} in {stat}. Not good.",
    "{stat} at #{rank} in MLB. Rough.",
    "Below average in {stat}: #{rank}/{total}. Someone notice this.",
    "#{rank} in the league for {stat}. Yikes.",
    "{stat}: #{rank}/{total}. This needs to change.",
  ],
};

const RANK_WORST: TonePool = {
  family: [
    "{stat} ranked #{rank}/{total} in the league — this is an area of concern.",
    "Bottom of MLB in {stat}: #{rank}/{total}.",
    "#{rank} in all of baseball for {stat}. The work starts now.",
    "{stat} is a liability at #{rank}/{total}.",
    "#{rank}/{total} in the league for {stat}. Significant improvement needed.",
  ],
  spicy: [
    "#{rank}/{total} in {stat}. The 2001 Mariners are rolling in their legacy.",
    "Bottom of the barrel in {stat}: #{rank}/{total}.",
    "{stat} at #{rank} in MLB. Something is broken.",
    "#{rank} in the league for {stat}. Not a coincidence.",
    "{stat}: #{rank}/{total}. Whoever is responsible knows.",
  ],
  profane: [
    "#{rank}/{total} in {stat}. This is a crime.",
    "Dead last zone for {stat}: #{rank}/{total}. Fix it.",
    "{stat} at #{rank}/{total} in MLB. Embarrassing.",
    "#{rank} in the whole damn league for {stat}. How.",
    "{stat}: #{rank}/{total}. Someone's gotta answer for this.",
  ],
};

export function captionForLeagueRank(
  rank: number,
  total: number,
  stat: string,
  seed: number,
  tone: Tone = 'spicy',
): Caption[] {
  const pct = Math.round((rank / total) * 100);
  const v = { rank, total, stat, pct };
  if (rank <= 3)              return one('hot',     tmpl(fromPool(RANK_ELITE, tone, seed), v), rank === 1 ? '🥇' : '🏆');
  if (rank / total <= 0.25)   return one('spicy',   tmpl(fromPool(RANK_GOOD,  tone, seed), v), '⭐');
  if (rank / total >= 0.90)   return one('cold',    tmpl(fromPool(RANK_WORST, tone, seed), v), '🚨');
  if (rank / total >= 0.75)   return one('tragic',  tmpl(fromPool(RANK_BAD,   tone, seed), v), '📉');
  return one('neutral', tmpl(fromPool(RANK_GOOD, tone, seed), v));
}
