// ─── Types ────────────────────────────────────────────────────────────────────

export type Tier = 'hot' | 'cold' | 'spicy' | 'tragic' | 'neutral' | 'lore'
export type Tone = 'family' | 'spicy' | 'profane'

export interface Caption {
  tier: Tier
  text: string
  emoji?: string
}

// ─── Seed Hashing ─────────────────────────────────────────────────────────────

function hashSeed(seed: number | string): number {
  if (typeof seed === 'number') return seed
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i)
    h |= 0
  }
  return h
}

function pick<T>(pool: T[], seed: number | string): T {
  const h = Math.abs(hashSeed(seed))
  return pool[h % pool.length]
}

type TonePool = { [K in Tone]?: Caption[] }

function resolve(pools: TonePool, tone: Tone, seed: number | string): Caption {
  const ordered: Tone[] = [tone, 'spicy', 'family']
  for (const t of ordered) {
    const pool = pools[t]
    if (pool && pool.length > 0) return pick(pool, seed)
  }
  return { tier: 'neutral', text: 'Something happened.', emoji: '⚾' }
}

// ─── captionForStreak ─────────────────────────────────────────────────────────

export function captionForStreak(opts: {
  wins: number
  losses: number
  currentStreakType: 'W' | 'L'
  currentStreakLength: number
  seed: number | string
  tone?: Tone
}): Caption[] {
  const { wins, losses, currentStreakType, currentStreakLength, seed, tone = 'spicy' } = opts
  const isWin = currentStreakType === 'W'

  if (isWin && currentStreakLength >= 5) {
    const pools: TonePool = {
      family: [
        { tier: 'hot', text: `${currentStreakLength}-game win streak. The boys are locked in.`, emoji: '🔥' },
        { tier: 'hot', text: `Won ${currentStreakLength} straight. Refuse to lose.`, emoji: '🏆' },
        { tier: 'hot', text: `${currentStreakLength} wins in a row. This team is for real.`, emoji: '✅' },
        { tier: 'hot', text: `Rolling right now. ${currentStreakLength} straight wins.`, emoji: '📈' },
        { tier: 'hot', text: `Hot streak energy. ${currentStreakLength} in a row.`, emoji: '🔥' },
      ],
      spicy: [
        { tier: 'hot', text: `${currentStreakLength} in a row. The Mariners are absolutely COOKING.`, emoji: '🔥' },
        { tier: 'hot', text: `Won ${currentStreakLength} straight. Refuse to lose. This is the team.`, emoji: '🏆' },
        { tier: 'hot', text: `${currentStreakLength}-game streak. Edgar approves.`, emoji: '⚾' },
        { tier: 'hot', text: `T-Mo magic is real. ${currentStreakLength} wins running.`, emoji: '🔥' },
        { tier: 'lore', text: `Refuse to lose. ${currentStreakLength} games and counting.`, emoji: '💪' },
      ],
      profane: [
        { tier: 'hot', text: `We're fucking ROLLING. ${currentStreakLength} straight wins.`, emoji: '🔥' },
        { tier: 'hot', text: `${currentStreakLength}-game win streak. Who said this team couldn't do it?`, emoji: '💪' },
        { tier: 'hot', text: `Edgar approves of this shit. ${currentStreakLength} in a row.`, emoji: '⚾' },
        { tier: 'lore', text: `Refuse to fucking lose. ${currentStreakLength} games running.`, emoji: '🏆' },
        { tier: 'hot', text: `${currentStreakLength} straight. The 21-year drought is dead. Go.`, emoji: '🔥' },
      ],
    }
    return [resolve(pools, tone, seed)]
  }

  if (isWin && currentStreakLength >= 2) {
    const pools: TonePool = {
      family: [
        { tier: 'hot', text: `Back-to-back wins. Building something here.`, emoji: '📈' },
        { tier: 'hot', text: `${currentStreakLength} in a row. Momentum is real.`, emoji: '✅' },
        { tier: 'hot', text: `Win streak alive at ${currentStreakLength}. Good baseball.`, emoji: '⚾' },
        { tier: 'hot', text: `Stacking wins. ${currentStreakLength} in a row.`, emoji: '🔥' },
        { tier: 'hot', text: `Now THAT'S baseball. ${currentStreakLength} straight.`, emoji: '🏆' },
      ],
      spicy: [
        { tier: 'hot', text: `${currentStreakLength} in a row. Don't look now.`, emoji: '👀' },
        { tier: 'hot', text: `Stacking wins like it's nothing. ${currentStreakLength} straight.`, emoji: '🔥' },
        { tier: 'hot', text: `Now THAT'S baseball. ${currentStreakLength} wins running.`, emoji: '⚾' },
        { tier: 'hot', text: `The bats and arms are clicking. ${currentStreakLength}-game streak.`, emoji: '📈' },
        { tier: 'hot', text: `${currentStreakLength} and rising. Good time to be a fan.`, emoji: '🙌' },
      ],
      profane: [
        { tier: 'hot', text: `${currentStreakLength} wins in a row. Don't fuck this up.`, emoji: '🔥' },
        { tier: 'hot', text: `Stacking wins like rent's due. ${currentStreakLength} straight.`, emoji: '💪' },
        { tier: 'hot', text: `${currentStreakLength} in a row. This is that shit.`, emoji: '🔥' },
        { tier: 'hot', text: `Good baseball happening. ${currentStreakLength} straight. Enjoy it.`, emoji: '⚾' },
        { tier: 'hot', text: `Now THAT'S baseball. Keep it going.`, emoji: '🏆' },
      ],
    }
    return [resolve(pools, tone, seed)]
  }

  if (!isWin && currentStreakLength >= 5) {
    const pools: TonePool = {
      family: [
        { tier: 'tragic', text: `${currentStreakLength}-game losing streak. Rough patch. We've been here before.`, emoji: '😓' },
        { tier: 'tragic', text: `Lost ${currentStreakLength} straight. Time to refocus.`, emoji: '📉' },
        { tier: 'tragic', text: `${currentStreakLength} losses in a row. Something has to change.`, emoji: '😤' },
        { tier: 'tragic', text: `Skid at ${currentStreakLength} games. The boys need to find it.`, emoji: '😔' },
        { tier: 'tragic', text: `${currentStreakLength}-game skid. Not the time to panic. Yet.`, emoji: '⚾' },
      ],
      spicy: [
        { tier: 'tragic', text: `${currentStreakLength} losses and counting. This is getting uncomfortable.`, emoji: '😬' },
        { tier: 'tragic', text: `Lost ${currentStreakLength} straight. The bullpen, the bats, just… no.`, emoji: '📉' },
        { tier: 'tragic', text: `${currentStreakLength}-game skid. We don't talk about this one.`, emoji: '🤐' },
        { tier: 'tragic', text: `${currentStreakLength} in a row the wrong way. Intervention needed.`, emoji: '😤' },
        { tier: 'tragic', text: `Rough stretch. ${currentStreakLength} straight losses.`, emoji: '📉' },
      ],
      profane: [
        { tier: 'tragic', text: `${currentStreakLength} straight losses. What the hell is happening.`, emoji: '🤦' },
        { tier: 'tragic', text: `Lost ${currentStreakLength} in a row. We don't talk about this shit.`, emoji: '😤' },
        { tier: 'tragic', text: `${currentStreakLength}-game skid. Someone wake the bats up.`, emoji: '📉' },
        { tier: 'tragic', text: `${currentStreakLength} losses. The 21-year drought is calling.`, emoji: '😩' },
        { tier: 'tragic', text: `Dropped ${currentStreakLength} straight. Fix something. Anything.`, emoji: '🔴' },
      ],
    }
    return [resolve(pools, tone, seed)]
  }

  // single game or short streak
  const pools: TonePool = {
    family: [
      { tier: 'neutral', text: isWin ? `Win. Record now ${wins}-${losses}.` : `Loss. Things happen.`, emoji: isWin ? '✅' : '📉' },
      { tier: 'neutral', text: isWin ? `Got the W. Moving on.` : `Tough one. Next game matters more.`, emoji: '⚾' },
      { tier: 'neutral', text: isWin ? `Win number ${wins}.` : `Loss number ${losses}.`, emoji: '⚾' },
    ],
    spicy: [
      { tier: 'neutral', text: isWin ? `W secured. ${wins}-${losses}.` : `L. ${wins}-${losses}. Bounce back time.`, emoji: isWin ? '✅' : '📉' },
      { tier: 'neutral', text: isWin ? `Got the dub.` : `Took an L. Next.`, emoji: '⚾' },
      { tier: 'neutral', text: isWin ? `Win it is. Carry on.` : `Lost. Not great, not catastrophic.`, emoji: '⚾' },
    ],
    profane: [
      { tier: 'neutral', text: isWin ? `Got the W. Let's go.` : `Lost. Move on.`, emoji: isWin ? '✅' : '📉' },
      { tier: 'neutral', text: isWin ? `Dub secured.` : `Dropped this one. Whatever, next game.`, emoji: '⚾' },
      { tier: 'neutral', text: isWin ? `Win. Good.` : `Brutal. Move.`, emoji: '⚾' },
    ],
  }
  return [resolve(pools, tone, seed)]
}

// ─── captionForRunDiff ────────────────────────────────────────────────────────

export function captionForRunDiff(opts: {
  totalRunDiff: number
  last10RunDiff: number
  gamesPlayed: number
  seed: number | string
  tone?: Tone
}): Caption[] {
  const { totalRunDiff, last10RunDiff, seed, tone = 'spicy' } = opts

  if (totalRunDiff > 40 && last10RunDiff > 10) {
    const pools: TonePool = {
      family: [
        { tier: 'hot', text: `Run differential is strong. Offense and pitching clicking together.`, emoji: '📈' },
        { tier: 'hot', text: `+${totalRunDiff} run diff. That's a real baseball team.`, emoji: '🔥' },
        { tier: 'hot', text: `Outscoring opponents by ${totalRunDiff} runs. This is good baseball.`, emoji: '✅' },
        { tier: 'hot', text: `Run diff says this team is legit. +${totalRunDiff}.`, emoji: '📊' },
        { tier: 'hot', text: `+${totalRunDiff} run differential. The numbers don't lie.`, emoji: '💪' },
      ],
      spicy: [
        { tier: 'hot', text: `+${totalRunDiff} run diff. This team is the real deal.`, emoji: '🔥' },
        { tier: 'hot', text: `Outscoring people by ${totalRunDiff} runs. Edgar approves.`, emoji: '⚾' },
        { tier: 'hot', text: `Run differential is elite. +${totalRunDiff}. Now THAT'S baseball.`, emoji: '📊' },
        { tier: 'hot', text: `+${totalRunDiff} runs better than opponents. The math is doing math.`, emoji: '📈' },
        { tier: 'hot', text: `Dominant run diff at +${totalRunDiff}. Pace yourselves, boys.`, emoji: '🏆' },
      ],
      profane: [
        { tier: 'hot', text: `+${totalRunDiff} run differential. We're fucking winning baseball games.`, emoji: '🔥' },
        { tier: 'hot', text: `Outscoring everybody by ${totalRunDiff} runs. Edgar approves of this shit.`, emoji: '⚾' },
        { tier: 'hot', text: `+${totalRunDiff} runs up on the league. Lock it in.`, emoji: '📊' },
        { tier: 'hot', text: `Run diff is absurd. +${totalRunDiff}. Keep cooking.`, emoji: '💪' },
        { tier: 'hot', text: `This team is dominating in runs. +${totalRunDiff} and counting.`, emoji: '🔥' },
      ],
    }
    return [resolve(pools, tone, seed)]
  }

  if (totalRunDiff < -20) {
    const pools: TonePool = {
      family: [
        { tier: 'tragic', text: `Run differential is rough at ${totalRunDiff}. Scoring is a problem.`, emoji: '📉' },
        { tier: 'tragic', text: `Getting outscored by ${Math.abs(totalRunDiff)} runs this season. That's the issue.`, emoji: '😔' },
        { tier: 'tragic', text: `${totalRunDiff} run diff. The offense needs to show up more.`, emoji: '📊' },
        { tier: 'tragic', text: `Negative run diff at ${totalRunDiff}. Something has to give.`, emoji: '😓' },
        { tier: 'tragic', text: `We're getting outscored. ${totalRunDiff} run differential is a concern.`, emoji: '🔴' },
      ],
      spicy: [
        { tier: 'tragic', text: `${totalRunDiff} run diff. The bats are not doing their part.`, emoji: '📉' },
        { tier: 'tragic', text: `Getting outscored by ${Math.abs(totalRunDiff)} runs. This is the problem.`, emoji: '😤' },
        { tier: 'tragic', text: `Run differential doesn't lie. ${totalRunDiff}. Wake up.`, emoji: '🔴' },
        { tier: 'tragic', text: `${totalRunDiff} runs in the hole for the season. Yikes.`, emoji: '📊' },
        { tier: 'tragic', text: `The math says: score more runs. ${totalRunDiff} run diff.`, emoji: '😬' },
      ],
      profane: [
        { tier: 'tragic', text: `${totalRunDiff} run differential. The offense is a disaster.`, emoji: '🤦' },
        { tier: 'tragic', text: `Getting blown out on run diff at ${totalRunDiff}. This is bad.`, emoji: '📉' },
        { tier: 'tragic', text: `${totalRunDiff} runs worse than opponents. Someone wake the bats up.`, emoji: '😤' },
        { tier: 'tragic', text: `Run diff is criminal: ${totalRunDiff}. Score some goddamn runs.`, emoji: '🔴' },
        { tier: 'tragic', text: `${totalRunDiff} runs in the hole. This team needs to find offense.`, emoji: '💀' },
      ],
    }
    return [resolve(pools, tone, seed)]
  }

  const pools: TonePool = {
    family: [
      { tier: 'neutral', text: `Run differential is ${totalRunDiff > 0 ? '+' : ''}${totalRunDiff}. Competitive.`, emoji: '📊' },
      { tier: 'neutral', text: `Even on run diff. Games are being decided late.`, emoji: '⚾' },
      { tier: 'neutral', text: `Run diff sitting at ${totalRunDiff}. Respectable.`, emoji: '📈' },
    ],
    spicy: [
      { tier: 'neutral', text: `Run diff at ${totalRunDiff > 0 ? '+' : ''}${totalRunDiff}. Right there.`, emoji: '📊' },
      { tier: 'neutral', text: `Basically breaking even on runs. Close games all around.`, emoji: '⚾' },
      { tier: 'neutral', text: `${totalRunDiff > 0 ? '+' : ''}${totalRunDiff} run diff. Could be worse. Could be better.`, emoji: '😐' },
    ],
    profane: [
      { tier: 'neutral', text: `Run diff is ${totalRunDiff > 0 ? '+' : ''}${totalRunDiff}. Whatever.`, emoji: '📊' },
      { tier: 'neutral', text: `Close games everywhere. Run diff is basically nothing.`, emoji: '⚾' },
      { tier: 'neutral', text: `${totalRunDiff > 0 ? '+' : ''}${totalRunDiff} run diff. Not great, not bad.`, emoji: '😐' },
    ],
  }
  return [resolve(pools, tone, seed)]
}

// ─── captionForBullpen ────────────────────────────────────────────────────────

export function captionForBullpen(opts: {
  last10ERA: number
  seasonERA: number
  savesBlown: number
  seed: number | string
  tone?: Tone
}): Caption[] {
  const { last10ERA, seasonERA, savesBlown, seed, tone = 'spicy' } = opts

  if (last10ERA >= 6) {
    const pools: TonePool = {
      family: [
        { tier: 'tragic', text: `Bullpen ERA is ${last10ERA.toFixed(2)} over the last 10 games. Tough night for the bullpen.`, emoji: '🔥' },
        { tier: 'tragic', text: `The relief corps is struggling lately. ${last10ERA.toFixed(2)} ERA last 10.`, emoji: '📉' },
        { tier: 'tragic', text: `${last10ERA.toFixed(2)} ERA from the bullpen in the last 10. That's the story.`, emoji: '😔' },
        { tier: 'tragic', text: `Bullpen ERA spiked to ${last10ERA.toFixed(2)} last 10 games. Needs work.`, emoji: '🔴' },
        { tier: 'tragic', text: `The pen has given up a lot lately. ${last10ERA.toFixed(2)} recent ERA.`, emoji: '😓' },
      ],
      spicy: [
        { tier: 'tragic', text: `Bullpen is leaking like a Seattle roof. ${last10ERA.toFixed(2)} ERA last 10.`, emoji: '🔥' },
        { tier: 'tragic', text: `${last10ERA.toFixed(2)} bullpen ERA in the last 10. The pen is on fire. The bad kind.`, emoji: '💀' },
        { tier: 'tragic', text: `${savesBlown} blown saves. Bullpen ERA at ${last10ERA.toFixed(2)} last 10. Yikes.`, emoji: '😬' },
        { tier: 'tragic', text: `Relief pitching ERA: ${last10ERA.toFixed(2)} last 10. This is a problem.`, emoji: '📉' },
        { tier: 'tragic', text: `The bullpen is costing games. ${last10ERA.toFixed(2)} ERA recently.`, emoji: '🔴' },
      ],
      profane: [
        { tier: 'tragic', text: `Lock the fucking bullpen door. ${last10ERA.toFixed(2)} ERA last 10 games.`, emoji: '🚪' },
        { tier: 'tragic', text: `The bullpen is on fire. The bad kind. ${last10ERA.toFixed(2)} recent ERA.`, emoji: '🔥' },
        { tier: 'tragic', text: `${last10ERA.toFixed(2)} ERA from relief pitchers recently. What is happening.`, emoji: '🤦' },
        { tier: 'tragic', text: `Blown saves: ${savesBlown}. Bullpen ERA: ${last10ERA.toFixed(2)}. Fix this.`, emoji: '💀' },
        { tier: 'tragic', text: `The pen is leaking like a damn sieve. ${last10ERA.toFixed(2)} ERA last 10.`, emoji: '🔴' },
      ],
    }
    return [resolve(pools, tone, seed)]
  }

  if (last10ERA < 3.0 && seasonERA < 3.5) {
    const pools: TonePool = {
      family: [
        { tier: 'hot', text: `Bullpen has been outstanding. ${last10ERA.toFixed(2)} ERA last 10 games.`, emoji: '🔥' },
        { tier: 'hot', text: `Relief corps is lights out. ${seasonERA.toFixed(2)} season ERA.`, emoji: '🎯' },
        { tier: 'hot', text: `The bullpen is carrying its weight. ${last10ERA.toFixed(2)} recent ERA.`, emoji: '💪' },
        { tier: 'hot', text: `${last10ERA.toFixed(2)} bullpen ERA last 10. That's elite.`, emoji: '🏆' },
        { tier: 'hot', text: `Pen is shutdown mode. ${last10ERA.toFixed(2)} ERA last 10.`, emoji: '🔒' },
      ],
      spicy: [
        { tier: 'hot', text: `Bullpen is LOCKED IN. ${last10ERA.toFixed(2)} ERA last 10 games.`, emoji: '🔥' },
        { tier: 'hot', text: `Relief corps is elite right now. ${last10ERA.toFixed(2)} recent ERA.`, emoji: '🎯' },
        { tier: 'hot', text: `${last10ERA.toFixed(2)} bullpen ERA last 10. King's Court energy in that pen.`, emoji: '👑' },
        { tier: 'hot', text: `The pen is carrying. ${last10ERA.toFixed(2)} ERA, ${seasonERA.toFixed(2)} for the year.`, emoji: '💪' },
        { tier: 'lore', text: `King's Court energy. Bullpen ERA at ${last10ERA.toFixed(2)} last 10.`, emoji: '👑' },
      ],
      profane: [
        { tier: 'hot', text: `Bullpen is absolutely locked. ${last10ERA.toFixed(2)} ERA last 10 games.`, emoji: '🔒' },
        { tier: 'hot', text: `Relief pitching is filthy right now. ${last10ERA.toFixed(2)} ERA recently.`, emoji: '🔥' },
        { tier: 'hot', text: `The pen is balling out. ${last10ERA.toFixed(2)} ERA last 10. Opponents hate it.`, emoji: '🎯' },
        { tier: 'hot', text: `${last10ERA.toFixed(2)} ERA from the bullpen. The league can't touch them.`, emoji: '💪' },
        { tier: 'hot', text: `Lock the pen in. They're dealing. ${last10ERA.toFixed(2)} ERA last 10.`, emoji: '🔥' },
      ],
    }
    return [resolve(pools, tone, seed)]
  }

  const pools: TonePool = {
    family: [
      { tier: 'neutral', text: `Bullpen ERA sits at ${seasonERA.toFixed(2)} for the season. Serviceable.`, emoji: '📊' },
      { tier: 'neutral', text: `Relief pitching is holding. ${last10ERA.toFixed(2)} ERA last 10.`, emoji: '⚾' },
      { tier: 'neutral', text: `Bullpen getting the job done. ${seasonERA.toFixed(2)} ERA.`, emoji: '✅' },
    ],
    spicy: [
      { tier: 'neutral', text: `Pen ERA at ${seasonERA.toFixed(2)}. Not great, not killing us.`, emoji: '📊' },
      { tier: 'neutral', text: `Relief corps is average. ${last10ERA.toFixed(2)} ERA last 10.`, emoji: '😐' },
      { tier: 'neutral', text: `Bullpen is… fine. ${seasonERA.toFixed(2)} season ERA.`, emoji: '🤷' },
    ],
    profane: [
      { tier: 'neutral', text: `Pen ERA: ${seasonERA.toFixed(2)}. It's whatever.`, emoji: '📊' },
      { tier: 'neutral', text: `The bullpen exists. ${last10ERA.toFixed(2)} ERA last 10. Moving on.`, emoji: '⚾' },
      { tier: 'neutral', text: `${seasonERA.toFixed(2)} bullpen ERA. Not lighting the world on fire.`, emoji: '😐' },
    ],
  }
  return [resolve(pools, tone, seed)]
}

// ─── captionForRISP ───────────────────────────────────────────────────────────

export function captionForRISP(opts: {
  avgWithRisp: number
  avgOverall: number
  runnersLeftOnBaseLast7: number
  seed: number | string
  tone?: Tone
}): Caption[] {
  const { avgWithRisp, avgOverall, runnersLeftOnBaseLast7, seed, tone = 'spicy' } = opts
  const delta = avgWithRisp - avgOverall

  if (delta < -0.050 || runnersLeftOnBaseLast7 >= 20) {
    const pools: TonePool = {
      family: [
        { tier: 'cold', text: `Stranding runners is a real issue. ${runnersLeftOnBaseLast7} left on base last 7 games.`, emoji: '😔' },
        { tier: 'cold', text: `${(avgWithRisp).toFixed(3)} average with RISP. The opportunities are there, the hits aren't.`, emoji: '📉' },
        { tier: 'cold', text: `Left ${runnersLeftOnBaseLast7} runners on base in the last 7 games. That's the box score story.`, emoji: '😓' },
        { tier: 'cold', text: `With runners in scoring position, the bats go quiet. ${(avgWithRisp).toFixed(3)} avg.`, emoji: '🥶' },
        { tier: 'cold', text: `Clutch hitting is a problem. RISP average at ${(avgWithRisp).toFixed(3)}.`, emoji: '📉' },
      ],
      spicy: [
        { tier: 'cold', text: `We just left a Costco's worth of runners on base. ${runnersLeftOnBaseLast7} last 7 games.`, emoji: '🤦' },
        { tier: 'cold', text: `${(avgWithRisp).toFixed(3)} average with RISP. The bats disappear when it matters most.`, emoji: '😬' },
        { tier: 'cold', text: `Left ${runnersLeftOnBaseLast7} runners stranded in the last 7. That's a lot of wasted baseball.`, emoji: '📉' },
        { tier: 'cold', text: `RISP average is ${(avgWithRisp).toFixed(3)}. Get some clutch hits, guys.`, emoji: '🥶' },
        { tier: 'cold', text: `Runners on base, hits don't come. ${(avgWithRisp).toFixed(3)} with RISP is rough.`, emoji: '😤' },
      ],
      profane: [
        { tier: 'cold', text: `We just left a Costco's worth of runners on base. ${runnersLeftOnBaseLast7} last 7 games. What the hell.`, emoji: '🤦' },
        { tier: 'cold', text: `${(avgWithRisp).toFixed(3)} average with RISP. Hit the fucking ball when it matters.`, emoji: '😤' },
        { tier: 'cold', text: `Left ${runnersLeftOnBaseLast7} runners on in 7 games. Criminal. Disgraceful.`, emoji: '💀' },
        { tier: 'cold', text: `RISP avg: ${(avgWithRisp).toFixed(3)}. Score the damn runners.`, emoji: '🔴' },
        { tier: 'cold', text: `0-fer with RISP × ${Math.min(runnersLeftOnBaseLast7, 4)}. We just left the bases loaded again.`, emoji: '😩' },
      ],
    }
    return [resolve(pools, tone, seed)]
  }

  if (delta > 0.040) {
    const pools: TonePool = {
      family: [
        { tier: 'hot', text: `Clutch hitting is the story. ${(avgWithRisp).toFixed(3)} average with RISP.`, emoji: '🔥' },
        { tier: 'hot', text: `Runners in scoring position? These guys deliver. ${(avgWithRisp).toFixed(3)} RISP avg.`, emoji: '💪' },
        { tier: 'hot', text: `Big hits when they count. ${(avgWithRisp).toFixed(3)} with RISP.`, emoji: '✅' },
        { tier: 'hot', text: `This lineup converts. ${(avgWithRisp).toFixed(3)} average with runners on.`, emoji: '📈' },
        { tier: 'hot', text: `Clutch factor is high. ${(avgWithRisp).toFixed(3)} RISP average.`, emoji: '🎯' },
      ],
      spicy: [
        { tier: 'hot', text: `Clutch city. ${(avgWithRisp).toFixed(3)} average with RISP. These bats show up when it matters.`, emoji: '🔥' },
        { tier: 'hot', text: `Runners on base? Time to hit. ${(avgWithRisp).toFixed(3)} RISP avg.`, emoji: '💪' },
        { tier: 'hot', text: `${(avgWithRisp).toFixed(3)} with RISP. This lineup does NOT waste opportunities.`, emoji: '🎯' },
        { tier: 'hot', text: `Big hits when they count. ${(avgWithRisp).toFixed(3)} RISP. Edgar approves.`, emoji: '⚾' },
        { tier: 'lore', text: `Edgar approves. ${(avgWithRisp).toFixed(3)} average with runners in scoring position.`, emoji: '👑' },
      ],
      profane: [
        { tier: 'hot', text: `Clutch as hell. ${(avgWithRisp).toFixed(3)} average with RISP. Don't waste it.`, emoji: '🔥' },
        { tier: 'hot', text: `Big hits, big moments. ${(avgWithRisp).toFixed(3)} with RISP. This is how you win games.`, emoji: '💪' },
        { tier: 'hot', text: `${(avgWithRisp).toFixed(3)} RISP average. These fuckers can hit when it counts.`, emoji: '🎯' },
        { tier: 'hot', text: `Runners on? Buckle up. ${(avgWithRisp).toFixed(3)} with RISP is elite.`, emoji: '🔥' },
        { tier: 'hot', text: `Clutch hitting is on. ${(avgWithRisp).toFixed(3)} RISP avg. Edgar fucking approves.`, emoji: '⚾' },
      ],
    }
    return [resolve(pools, tone, seed)]
  }

  const pools: TonePool = {
    family: [
      { tier: 'neutral', text: `RISP average at ${(avgWithRisp).toFixed(3)}. About what you'd expect.`, emoji: '📊' },
      { tier: 'neutral', text: `Hitting with runners on is league average. ${(avgWithRisp).toFixed(3)}.`, emoji: '⚾' },
      { tier: 'neutral', text: `${(avgWithRisp).toFixed(3)} with RISP. Room to improve, but not a crisis.`, emoji: '😐' },
    ],
    spicy: [
      { tier: 'neutral', text: `RISP average is ${(avgWithRisp).toFixed(3)}. Average. Which is fine. For now.`, emoji: '📊' },
      { tier: 'neutral', text: `${(avgWithRisp).toFixed(3)} with runners in scoring position. Could clutch harder.`, emoji: '😐' },
      { tier: 'neutral', text: `Hitting with RISP: ${(avgWithRisp).toFixed(3)}. Not stranding everyone, at least.`, emoji: '⚾' },
    ],
    profane: [
      { tier: 'neutral', text: `RISP avg at ${(avgWithRisp).toFixed(3)}. It's whatever.`, emoji: '📊' },
      { tier: 'neutral', text: `${(avgWithRisp).toFixed(3)} with runners on. Not great, not a disaster.`, emoji: '😐' },
      { tier: 'neutral', text: `Middling RISP numbers. ${(avgWithRisp).toFixed(3)}. We need more.`, emoji: '⚾' },
    ],
  }
  return [resolve(pools, tone, seed)]
}

// ─── captionForGameResult ─────────────────────────────────────────────────────

export function captionForGameResult(opts: {
  won: boolean
  scoreDiff: number
  runsScored: number
  runsAllowed: number
  opp: string
  isWalkoff: boolean
  isComeback: boolean
  seed: number | string
  tone?: Tone
}): Caption[] {
  const { won, scoreDiff, runsScored, runsAllowed, opp, isWalkoff, isComeback, seed, tone = 'spicy' } = opts

  if (won && isWalkoff) {
    const pools: TonePool = {
      family: [
        { tier: 'lore', text: `Walk-off win over ${opp}. Refuse to lose.`, emoji: '🎉' },
        { tier: 'hot', text: `Walk-off ${runsScored}-${runsAllowed}. The most beautiful way to win.`, emoji: '🎊' },
        { tier: 'hot', text: `Walk-off victory. The crowd goes absolutely wild.`, emoji: '🙌' },
        { tier: 'hot', text: `Walk-off W over ${opp}. Now THAT'S baseball.`, emoji: '⚾' },
        { tier: 'lore', text: `Now THAT'S baseball. Walk-off over ${opp}.`, emoji: '🏆' },
      ],
      spicy: [
        { tier: 'lore', text: `Refuse to lose. Walk-off over ${opp}, ${runsScored}-${runsAllowed}.`, emoji: '💪' },
        { tier: 'hot', text: `Walk-off win. Get the popcorn — or the antacids, your call.`, emoji: '🎉' },
        { tier: 'hot', text: `Walk-off over ${opp}. This team refuses to be denied.`, emoji: '🔥' },
        { tier: 'lore', text: `Now THAT'S baseball. Walk-off W over ${opp}.`, emoji: '⚾' },
        { tier: 'hot', text: `${runsScored}-${runsAllowed} walk-off over ${opp}. Pure chaos, beautiful chaos.`, emoji: '🎊' },
      ],
      profane: [
        { tier: 'lore', text: `Refuse to fucking lose. Walk-off over ${opp}, ${runsScored}-${runsAllowed}.`, emoji: '💪' },
        { tier: 'hot', text: `Walk-off W. Get the goddamn popcorn.`, emoji: '🎉' },
        { tier: 'hot', text: `Walked it off on ${opp}. Pure chaos. Perfect baseball.`, emoji: '🔥' },
        { tier: 'hot', text: `${runsScored}-${runsAllowed} walk-off. They were down and they walked it off. WALK. OFF.`, emoji: '🎊' },
        { tier: 'lore', text: `Walk-off win. Refuse to fucking lose. Edgar's smiling somewhere.`, emoji: '⚾' },
      ],
    }
    return [resolve(pools, tone, seed)]
  }

  if (won && isComeback) {
    const pools: TonePool = {
      family: [
        { tier: 'hot', text: `Comeback win over ${opp}, ${runsScored}-${runsAllowed}. Never out of it.`, emoji: '💪' },
        { tier: 'hot', text: `Down and came back. That's a tough team, ${runsScored}-${runsAllowed}.`, emoji: '🔥' },
        { tier: 'hot', text: `Refused to fold. Comeback W over ${opp}.`, emoji: '🙌' },
        { tier: 'lore', text: `Refuse to lose. Came back to beat ${opp}, ${runsScored}-${runsAllowed}.`, emoji: '💪' },
        { tier: 'hot', text: `Comeback city. ${runsScored}-${runsAllowed} over ${opp}.`, emoji: '🎉' },
      ],
      spicy: [
        { tier: 'hot', text: `Get the popcorn or the antacids, your call. Comeback W over ${opp}.`, emoji: '😅' },
        { tier: 'hot', text: `Down going to the 8th. Came back. ${runsScored}-${runsAllowed}. Drama queens.`, emoji: '🎭' },
        { tier: 'lore', text: `Refuse to lose. Comeback win, ${runsScored}-${runsAllowed} over ${opp}.`, emoji: '💪' },
        { tier: 'hot', text: `This team does not know when it's beaten. Comeback W.`, emoji: '🔥' },
        { tier: 'hot', text: `Comeback W. The heart attack special, courtesy of ${opp}.`, emoji: '😅' },
      ],
      profane: [
        { tier: 'hot', text: `Get the popcorn or the antacids, your call. Comeback over ${opp}, ${runsScored}-${runsAllowed}.`, emoji: '😅' },
        { tier: 'hot', text: `Down 3 going to 8. Came back. Of course they did. ${runsScored}-${runsAllowed}.`, emoji: '🎭' },
        { tier: 'lore', text: `Refuse to fucking lose. Comeback W over ${opp}.`, emoji: '💪' },
        { tier: 'hot', text: `This team is going to give fans an ulcer. Comeback W.`, emoji: '🔥' },
        { tier: 'hot', text: `Came back to win ${runsScored}-${runsAllowed}. Brilliant and nerve-wracking.`, emoji: '😤' },
      ],
    }
    return [resolve(pools, tone, seed)]
  }

  if (won && scoreDiff >= 5) {
    const pools: TonePool = {
      family: [
        { tier: 'hot', text: `Blowout W over ${opp}, ${runsScored}-${runsAllowed}. Statement game.`, emoji: '💪' },
        { tier: 'hot', text: `Dominant win. ${runsScored}-${runsAllowed} over ${opp}.`, emoji: '🔥' },
        { tier: 'hot', text: `Ran away with this one. ${runsScored}-${runsAllowed}.`, emoji: '🏆' },
        { tier: 'hot', text: `${opp} never stood a chance tonight. ${runsScored}-${runsAllowed}.`, emoji: '💪' },
        { tier: 'hot', text: `Blowout win. ${runsScored} runs on the board.`, emoji: '📈' },
      ],
      spicy: [
        { tier: 'hot', text: `Blowout over ${opp}, ${runsScored}-${runsAllowed}. Ruthless.`, emoji: '💪' },
        { tier: 'hot', text: `${opp} got smoked. ${runsScored}-${runsAllowed}. Move on.`, emoji: '🔥' },
        { tier: 'hot', text: `Dominant. ${runsScored}-${runsAllowed}. Edgar approves of this kind of offense.`, emoji: '⚾' },
        { tier: 'hot', text: `${runsScored} runs. Yeah, ${opp} had no chance.`, emoji: '💪' },
        { tier: 'hot', text: `Put up ${runsScored} and never looked back. ${runsScored}-${runsAllowed}.`, emoji: '📈' },
      ],
      profane: [
        { tier: 'hot', text: `Dominated ${opp}. ${runsScored}-${runsAllowed}. Absolutely ran away with it.`, emoji: '💪' },
        { tier: 'hot', text: `${opp} got embarrassed. ${runsScored}-${runsAllowed}. Outstanding.`, emoji: '🔥' },
        { tier: 'hot', text: `${runsScored} fucking runs. ${opp} never had a prayer.`, emoji: '💪' },
        { tier: 'hot', text: `Blowout. ${runsScored}-${runsAllowed}. This is what it looks like.`, emoji: '🏆' },
        { tier: 'hot', text: `Put ${runsScored} up on the board. BIG Dumper spotted.`, emoji: '💣' },
      ],
    }
    return [resolve(pools, tone, seed)]
  }

  if (!won && scoreDiff >= 5) {
    const pools: TonePool = {
      family: [
        { tier: 'tragic', text: `Rough loss to ${opp}, ${runsScored}-${runsAllowed}. Long night.`, emoji: '😔' },
        { tier: 'tragic', text: `Got blown out, ${runsScored}-${runsAllowed}. We don't talk about this one.`, emoji: '🤐' },
        { tier: 'tragic', text: `${runsAllowed} runs allowed. That's the story. ${runsScored}-${runsAllowed} final.`, emoji: '📉' },
        { tier: 'tragic', text: `Blowout loss to ${opp}. Tomorrow is a new game.`, emoji: '😓' },
        { tier: 'tragic', text: `${runsScored}-${runsAllowed}. Not what we wanted.`, emoji: '😤' },
      ],
      spicy: [
        { tier: 'tragic', text: `We don't talk about this one. ${runsScored}-${runsAllowed} to ${opp}.`, emoji: '🤐' },
        { tier: 'tragic', text: `Got blown out by ${opp}. ${runsScored}-${runsAllowed}. Turn the page.`, emoji: '📉' },
        { tier: 'tragic', text: `${runsAllowed} runs allowed. ${opp} went off. Move on.`, emoji: '😬' },
        { tier: 'tragic', text: `Tough loss tonight. ${runsScored}-${runsAllowed}. Let's not revisit.`, emoji: '😔' },
        { tier: 'tragic', text: `${runsScored}-${runsAllowed}. Ugly. Next game.`, emoji: '📉' },
      ],
      profane: [
        { tier: 'tragic', text: `We don't talk about this one. ${runsScored}-${runsAllowed} loss to ${opp}.`, emoji: '🤐' },
        { tier: 'tragic', text: `Got cooked by ${opp}. ${runsScored}-${runsAllowed}. Brutal.`, emoji: '💀' },
        { tier: 'tragic', text: `Gave up ${runsAllowed} runs. ${opp} had their way tonight. Embarrassing.`, emoji: '😤' },
        { tier: 'tragic', text: `${runsAllowed} allowed. ${runsScored}-${runsAllowed}. This is rough.`, emoji: '🔴' },
        { tier: 'tragic', text: `Got blown the fuck out. ${runsScored}-${runsAllowed}. Moving on.`, emoji: '📉' },
      ],
    }
    return [resolve(pools, tone, seed)]
  }

  // close game
  const pools: TonePool = {
    family: [
      { tier: won ? 'hot' : 'cold', text: won ? `Close win over ${opp}, ${runsScored}-${runsAllowed}.` : `Tight loss to ${opp}, ${runsScored}-${runsAllowed}.`, emoji: won ? '✅' : '📉' },
      { tier: 'neutral', text: `${runsScored}-${runsAllowed} ${won ? 'win' : 'loss'}. Close game.`, emoji: '⚾' },
      { tier: 'neutral', text: `${won ? 'Scraped out a win' : 'Came up short'}, ${runsScored}-${runsAllowed}.`, emoji: won ? '✅' : '😔' },
    ],
    spicy: [
      { tier: won ? 'hot' : 'cold', text: won ? `Eked out a win over ${opp}, ${runsScored}-${runsAllowed}.` : `Dropped a close one to ${opp}, ${runsScored}-${runsAllowed}.`, emoji: won ? '✅' : '📉' },
      { tier: 'neutral', text: `${runsScored}-${runsAllowed}. ${won ? 'Survived.' : 'Didn\'t survive.'}`, emoji: '⚾' },
      { tier: 'neutral', text: `Close game, ${won ? 'got the W' : 'took the L'}.`, emoji: won ? '✅' : '😐' },
    ],
    profane: [
      { tier: won ? 'hot' : 'cold', text: won ? `Scraped out the W over ${opp}, ${runsScored}-${runsAllowed}.` : `Lost a close one to ${opp}, ${runsScored}-${runsAllowed}.`, emoji: won ? '✅' : '📉' },
      { tier: 'neutral', text: `${runsScored}-${runsAllowed}. ${won ? 'Took it.' : 'Didn\'t.'}`, emoji: '⚾' },
      { tier: 'neutral', text: `${won ? 'Close W. Fine.' : 'Close L. Not fine.'}`, emoji: won ? '✅' : '😤' },
    ],
  }
  return [resolve(pools, tone, seed)]
}

// ─── captionForPlayerHotStreak ────────────────────────────────────────────────

export function captionForPlayerHotStreak(opts: {
  name: string
  statName: string
  statValue: number | string
  gamesInStreak: number
  seed: number | string
  tone?: Tone
}): Caption[] {
  const { name, statName, statValue, gamesInStreak, seed, tone = 'spicy' } = opts

  const isCalRaleigh = name.toLowerCase().includes('raleigh') || name.toLowerCase().includes('cal')
  const isKing = name.toLowerCase().includes('hernandez') || name.toLowerCase().includes('felix')

  if (isCalRaleigh) {
    const pools: TonePool = {
      family: [
        { tier: 'lore', text: `BIG DUMPER SPOTTED. ${name} is absolutely on fire — ${statValue} ${statName} in ${gamesInStreak} games.`, emoji: '💣' },
        { tier: 'hot', text: `${name} is doing Big Dumper things. ${statValue} ${statName} in ${gamesInStreak} games.`, emoji: '🔥' },
        { tier: 'lore', text: `The Big Dumper is carrying. ${name} with ${statValue} ${statName}.`, emoji: '💣' },
        { tier: 'hot', text: `${name} is locked in. ${statValue} ${statName} over ${gamesInStreak} games.`, emoji: '💪' },
        { tier: 'lore', text: `BIG DUMPER is hot. ${name}: ${statValue} ${statName} in ${gamesInStreak} games.`, emoji: '💣' },
      ],
      spicy: [
        { tier: 'lore', text: `BIG DUMPER SPOTTED. ${name}: ${statValue} ${statName} in ${gamesInStreak} games.`, emoji: '💣' },
        { tier: 'lore', text: `The Big Dumper is COOKING. ${name} is on a tear — ${statValue} ${statName}.`, emoji: '🔥' },
        { tier: 'hot', text: `${name} is going off. ${statValue} ${statName} over ${gamesInStreak} games.`, emoji: '💪' },
        { tier: 'lore', text: `BIG DUMPER energy. ${name}: ${statValue} ${statName}.`, emoji: '💣' },
        { tier: 'hot', text: `${name} is the hottest hitter in baseball right now. ${statValue} ${statName}.`, emoji: '🔥' },
      ],
      profane: [
        { tier: 'lore', text: `BIG DUMPER SPOTTED. ${name}: ${statValue} ${statName} in ${gamesInStreak} games. Holy shit.`, emoji: '💣' },
        { tier: 'lore', text: `The Big Dumper is in HEAT. ${name}: ${statValue} ${statName}. Opponents are terrified.`, emoji: '🔥' },
        { tier: 'hot', text: `${name} is absolutely mashing. ${statValue} ${statName} over ${gamesInStreak} games.`, emoji: '💪' },
        { tier: 'lore', text: `BIG DUMPER doing BIG DUMPER things. ${name}: ${statValue} ${statName}.`, emoji: '💣' },
        { tier: 'hot', text: `${name} is on fire and he will not stop. ${statValue} ${statName}.`, emoji: '🔥' },
      ],
    }
    return [resolve(pools, tone, seed)]
  }

  if (isKing) {
    const pools: TonePool = {
      family: [
        { tier: 'lore', text: `King's Court is in session. ${name} with ${statValue} ${statName} in ${gamesInStreak} games.`, emoji: '👑' },
        { tier: 'hot', text: `${name} is dealing. ${statValue} ${statName} over ${gamesInStreak} games.`, emoji: '🎯' },
        { tier: 'lore', text: `King Felix energy. ${name}: ${statValue} ${statName}.`, emoji: '👑' },
        { tier: 'hot', text: `${name} is in full King's Court mode. ${statValue} ${statName}.`, emoji: '🎯' },
        { tier: 'lore', text: `K-zone domination. ${name}: ${statValue} ${statName} last ${gamesInStreak} games.`, emoji: '👑' },
      ],
      spicy: [
        { tier: 'lore', text: `King's Court is OPEN. ${name}: ${statValue} ${statName} last ${gamesInStreak} games.`, emoji: '👑' },
        { tier: 'hot', text: `${name} is absolutely dealing. ${statValue} ${statName} over ${gamesInStreak}.`, emoji: '🎯' },
        { tier: 'lore', text: `K's for everyone. King's Court energy from ${name}. ${statValue} ${statName}.`, emoji: '👑' },
        { tier: 'hot', text: `${name} is nasty right now. ${statValue} ${statName}.`, emoji: '🔥' },
        { tier: 'lore', text: `King Felix would nod. ${name}: ${statValue} ${statName}.`, emoji: '👑' },
      ],
      profane: [
        { tier: 'lore', text: `King's Court is open and nobody can touch him. ${name}: ${statValue} ${statName}.`, emoji: '👑' },
        { tier: 'hot', text: `${name} is fucking dominant. ${statValue} ${statName} in ${gamesInStreak} games.`, emoji: '🎯' },
        { tier: 'lore', text: `King's Court, baby. ${name} is dealing. ${statValue} ${statName}.`, emoji: '👑' },
        { tier: 'hot', text: `${name} is unhittable right now. ${statValue} ${statName}.`, emoji: '🔥' },
        { tier: 'lore', text: `Bow to the King. ${name}: ${statValue} ${statName} last ${gamesInStreak} games.`, emoji: '👑' },
      ],
    }
    return [resolve(pools, tone, seed)]
  }

  const pools: TonePool = {
    family: [
      { tier: 'hot', text: `${name} is on a tear — ${statValue} ${statName} in ${gamesInStreak} games.`, emoji: '🔥' },
      { tier: 'hot', text: `Hot streak for ${name}: ${statValue} ${statName} over ${gamesInStreak} games.`, emoji: '📈' },
      { tier: 'hot', text: `${name} is carrying right now. ${statValue} ${statName} this stretch.`, emoji: '💪' },
      { tier: 'hot', text: `${gamesInStreak}-game tear from ${name}. ${statValue} ${statName}.`, emoji: '🔥' },
      { tier: 'hot', text: `${name} is locked in. ${statValue} ${statName} in ${gamesInStreak} games.`, emoji: '✅' },
    ],
    spicy: [
      { tier: 'hot', text: `${name} is RAKING right now. ${statValue} ${statName} in ${gamesInStreak} games.`, emoji: '🔥' },
      { tier: 'hot', text: `Hot streak: ${name} with ${statValue} ${statName} over the last ${gamesInStreak}.`, emoji: '📈' },
      { tier: 'hot', text: `Put some respect on ${name}'s name. ${statValue} ${statName} this stretch.`, emoji: '💪' },
      { tier: 'hot', text: `${name} is the hottest bat on the team. ${statValue} ${statName} last ${gamesInStreak}.`, emoji: '🔥' },
      { tier: 'hot', text: `${name} doing damage. ${statValue} ${statName} in ${gamesInStreak} games.`, emoji: '🎯' },
    ],
    profane: [
      { tier: 'hot', text: `${name} is absolutely raking. ${statValue} ${statName} in ${gamesInStreak} games.`, emoji: '🔥' },
      { tier: 'hot', text: `${name} is on fire and the league hates it. ${statValue} ${statName}.`, emoji: '💪' },
      { tier: 'hot', text: `Put some respect on ${name}. ${statValue} ${statName} this hot streak.`, emoji: '🎯' },
      { tier: 'hot', text: `${name} is going off. ${statValue} ${statName} in ${gamesInStreak} games. Don't stop.`, emoji: '🔥' },
      { tier: 'hot', text: `${gamesInStreak} games, ${statValue} ${statName}. ${name} is the guy right now.`, emoji: '💪' },
    ],
  }
  return [resolve(pools, tone, seed)]
}

// ─── captionForPlayerSlump ────────────────────────────────────────────────────

export function captionForPlayerSlump(opts: {
  name: string
  statName: string
  statValue: number | string
  gamesInSlump: number
  seed: number | string
  tone?: Tone
}): Caption[] {
  const { name, statName, statValue, gamesInSlump, seed, tone = 'spicy' } = opts

  const pools: TonePool = {
    family: [
      { tier: 'cold', text: `${name} is going through a tough stretch — ${statValue} ${statName} over ${gamesInSlump} games.`, emoji: '🥶' },
      { tier: 'cold', text: `Rough ${gamesInSlump}-game run for ${name}. ${statValue} ${statName}.`, emoji: '📉' },
      { tier: 'cold', text: `${name} needs to find it. ${statValue} ${statName} in ${gamesInSlump} games.`, emoji: '😔' },
      { tier: 'cold', text: `${name} is in a slump. ${statValue} ${statName} last ${gamesInSlump} games.`, emoji: '🥶' },
      { tier: 'cold', text: `${gamesInSlump}-game cold stretch for ${name}. ${statValue} ${statName}.`, emoji: '❄️' },
    ],
    spicy: [
      { tier: 'cold', text: `${name} is in a cold spell — ${statValue} ${statName} over ${gamesInSlump} games.`, emoji: '🥶' },
      { tier: 'cold', text: `${name} is not doing it right now. ${statValue} ${statName} in ${gamesInSlump} games.`, emoji: '📉' },
      { tier: 'cold', text: `Wake up, ${name}. ${statValue} ${statName} over ${gamesInSlump} games is rough.`, emoji: '😬' },
      { tier: 'cold', text: `${gamesInSlump}-game slump for ${name}. ${statValue} ${statName}. The numbers don't lie.`, emoji: '🥶' },
      { tier: 'cold', text: `${name} is struggling to contribute. ${statValue} ${statName} this stretch.`, emoji: '📉' },
    ],
    profane: [
      { tier: 'cold', text: `${name} is ice cold. ${statValue} ${statName} in ${gamesInSlump} games. Wake up.`, emoji: '🥶' },
      { tier: 'cold', text: `${gamesInSlump} games, ${statValue} ${statName}. ${name} needs to snap out of this.`, emoji: '📉' },
      { tier: 'cold', text: `${name} is in the tank. ${statValue} ${statName} over ${gamesInSlump} games.`, emoji: '😤' },
      { tier: 'cold', text: `Wake the fuck up, ${name}. ${statValue} ${statName} isn't good enough.`, emoji: '🥶' },
      { tier: 'cold', text: `${name} slump is real. ${statValue} ${statName} last ${gamesInSlump} games. Find it.`, emoji: '📉' },
    ],
  }
  return [resolve(pools, tone, seed)]
}

// ─── captionForLeagueRank ─────────────────────────────────────────────────────

export function captionForLeagueRank(opts: {
  statName: string
  rank: number
  total: number
  seed: number | string
  tone?: Tone
}): Caption[] {
  const { statName, rank, total, seed, tone = 'spicy' } = opts
  const isTop3 = rank <= 3
  const isTop10 = rank <= 10
  const isBottom5 = rank >= total - 4
  const pct = rank / total

  if (isTop3) {
    const pools: TonePool = {
      family: [
        { tier: 'hot', text: `Ranked #${rank} in ${statName} league-wide. Elite company.`, emoji: '🏆' },
        { tier: 'hot', text: `Top ${rank} in all of baseball for ${statName}. That's the good stuff.`, emoji: '🔥' },
        { tier: 'hot', text: `#${rank} in ${statName} out of ${total} teams. Legitimately elite.`, emoji: '📊' },
        { tier: 'hot', text: `${statName}: #${rank} in baseball. Put some respect on it.`, emoji: '💪' },
        { tier: 'hot', text: `Top of the league in ${statName}. #${rank} out of ${total}.`, emoji: '🏆' },
      ],
      spicy: [
        { tier: 'hot', text: `#${rank} in ${statName} league-wide. Put some respect on it.`, emoji: '🏆' },
        { tier: 'hot', text: `Top ${rank} in baseball for ${statName}. Elite. Full stop.`, emoji: '🔥' },
        { tier: 'hot', text: `${statName}: #${rank} out of ${total} MLB teams. This team is legit.`, emoji: '💪' },
        { tier: 'hot', text: `Edgar approves. #${rank} in ${statName} in all of baseball.`, emoji: '⚾' },
        { tier: 'lore', text: `Put some respect on it. #${rank} in ${statName} out of ${total} teams.`, emoji: '🏆' },
      ],
      profane: [
        { tier: 'hot', text: `#${rank} in ${statName} in all of baseball. Put some fucking respect on it.`, emoji: '🏆' },
        { tier: 'hot', text: `Top ${rank} in ${statName}. This team belongs.`, emoji: '🔥' },
        { tier: 'hot', text: `${statName}: #${rank} out of ${total}. Elite as hell.`, emoji: '💪' },
        { tier: 'hot', text: `Edgar approves. #${rank} in ${statName} league-wide.`, emoji: '⚾' },
        { tier: 'hot', text: `Ranked #${rank} in ${statName}. The league knows it.`, emoji: '🏆' },
      ],
    }
    return [resolve(pools, tone, seed)]
  }

  if (isTop10) {
    const pools: TonePool = {
      family: [
        { tier: 'hot', text: `Top 10 in ${statName} across all of baseball. #${rank} out of ${total}.`, emoji: '📈' },
        { tier: 'hot', text: `#${rank} in ${statName}. Solid position in the league.`, emoji: '✅' },
        { tier: 'hot', text: `Sitting at #${rank} in ${statName} out of ${total} teams. Good spot.`, emoji: '📊' },
        { tier: 'hot', text: `${statName}: #${rank} in baseball. That's top 10.`, emoji: '💪' },
        { tier: 'hot', text: `Top 10 ranking in ${statName}. #${rank} of ${total}.`, emoji: '🔥' },
      ],
      spicy: [
        { tier: 'hot', text: `#${rank} in ${statName} league-wide. Top 10 is real.`, emoji: '📈' },
        { tier: 'hot', text: `Top 10 in ${statName}. #${rank} of ${total}. Respect.`, emoji: '✅' },
        { tier: 'hot', text: `${statName}: #${rank}. Top 10 doesn't lie.`, emoji: '📊' },
        { tier: 'hot', text: `Sitting top 10 in ${statName} (#${rank}). This is a good team.`, emoji: '💪' },
        { tier: 'hot', text: `#${rank} in ${statName} out of ${total}. Top 10 club.`, emoji: '🏆' },
      ],
      profane: [
        { tier: 'hot', text: `Top 10 in ${statName}. #${rank} of ${total}. Don't sleep on this team.`, emoji: '📈' },
        { tier: 'hot', text: `#${rank} in ${statName}. Top fucking 10.`, emoji: '💪' },
        { tier: 'hot', text: `${statName}: #${rank} out of ${total}. Top 10 in baseball. Yes.`, emoji: '🔥' },
        { tier: 'hot', text: `Ranked #${rank} in ${statName}. Top 10. Respect it.`, emoji: '✅' },
        { tier: 'hot', text: `Top 10 in ${statName}. #${rank}. This team is doing it.`, emoji: '🏆' },
      ],
    }
    return [resolve(pools, tone, seed)]
  }

  if (isBottom5) {
    const pools: TonePool = {
      family: [
        { tier: 'tragic', text: `Ranked #${rank} in ${statName} out of ${total} teams. Near the bottom.`, emoji: '📉' },
        { tier: 'tragic', text: `${statName} ranking: #${rank} of ${total}. This is the concern.`, emoji: '😔' },
        { tier: 'tragic', text: `Near the bottom in ${statName}. #${rank} of ${total}. Work to do.`, emoji: '🔴' },
        { tier: 'tragic', text: `#${rank} of ${total} in ${statName}. That ranking needs to improve.`, emoji: '📊' },
        { tier: 'tragic', text: `Last-tier ranking in ${statName}. #${rank} out of ${total}.`, emoji: '😓' },
      ],
      spicy: [
        { tier: 'tragic', text: `#${rank} of ${total} in ${statName}. Bottom of the barrel.`, emoji: '📉' },
        { tier: 'tragic', text: `${statName}: #${rank} league-wide. That's not good.`, emoji: '😬' },
        { tier: 'tragic', text: `Near last in ${statName}. #${rank} of ${total}. Something has to change.`, emoji: '🔴' },
        { tier: 'tragic', text: `Dogshit tier ranking in ${statName}. #${rank} out of ${total}.`, emoji: '📊' },
        { tier: 'tragic', text: `${statName}: #${rank} of ${total}. Not where you want to be.`, emoji: '😤' },
      ],
      profane: [
        { tier: 'tragic', text: `#${rank} of ${total} in ${statName}. Dogshit tier. Fix it.`, emoji: '💀' },
        { tier: 'tragic', text: `${statName}: #${rank} in all of baseball. That's embarrassing.`, emoji: '📉' },
        { tier: 'tragic', text: `Near last in ${statName}. #${rank} of ${total}. Someone needs to fix this.`, emoji: '🔴' },
        { tier: 'tragic', text: `Bottom of the league in ${statName}. #${rank} of ${total}. Not acceptable.`, emoji: '😤' },
        { tier: 'tragic', text: `${statName} ranking is criminal: #${rank} of ${total}. Unacceptable.`, emoji: '🤦' },
      ],
    }
    return [resolve(pools, tone, seed)]
  }

  const pools: TonePool = {
    family: [
      { tier: 'neutral', text: `#${rank} in ${statName} out of ${total} teams. Middle of the pack.`, emoji: '📊' },
      { tier: 'neutral', text: `${statName} ranking: #${rank} of ${total}. Average.`, emoji: '😐' },
      { tier: 'neutral', text: `Sitting at #${rank} in ${statName}. Room to climb.`, emoji: '📈' },
    ],
    spicy: [
      { tier: 'neutral', text: `#${rank} in ${statName} out of ${total}. League average territory.`, emoji: '📊' },
      { tier: 'neutral', text: `${statName}: #${rank} of ${total}. Could be better, could be worse.`, emoji: '😐' },
      { tier: 'neutral', text: `Mid-pack at #${rank} in ${statName}. Move the needle.`, emoji: '📈' },
    ],
    profane: [
      { tier: 'neutral', text: `#${rank} in ${statName}. Mid-pack. Fine, I guess.`, emoji: '📊' },
      { tier: 'neutral', text: `${statName}: #${rank} of ${total}. Aggressively average.`, emoji: '😐' },
      { tier: 'neutral', text: `Middle of the league in ${statName}. #${rank}. Get it together.`, emoji: '📈' },
    ],
  }
  return [resolve(pools, tone, seed)]
}
