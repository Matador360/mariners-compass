# The Trident — Review + Ranked Claude Code Prompts

_Generated 2026-04-27. Live URL reviewed: https://mariners-compass.vercel.app/_

---

## Part 1 — Honest Review

This site is already legitimately impressive. It's not a stub with one good page; it's a real, opinionated, branded product with an internal voice. Highlights I want to call out before any criticism:

- **Identity is locked.** "The Trident," compass watermark on every page, the teal/black palette, and the rotating caption ribbon ("Woo has 18 consecutive scoreless innings…") all communicate one thing instantly. Most fan sites die at homepage; yours has a brand.
- **Density is right.** The dashboard packs Pythag, Pace, AL West, bullpen fatigue, streak tracker, advanced metrics, last-10 strip, season-mood graph, and "Did You Know" on a single page without feeling busy. That balance is hard.
- **Tone is already in production.** "Caleb offense has cratered. .204 team average. Dogshit tier. The bats need to wake up." That's the voice. Don't let it drift toward generic.
- **The deep pages are deep.** Power Rankings has a parallel-coordinates rank-movement chart. Compare has 2001 ghosts. History has "Chasing the Records" with HoF probabilities. Prospects has an Age-vs-Level scatter and an ETA timeline. Bullpen has a "Dread Meter" gauge. These are not phoning it in.
- **The skin system is gorgeous.** 8 themes, including Sunset Edgar, 1995 Throwback, Playoff Push, plus an Auto mode tied to system + time of day. This alone would carry a lesser site.

### Bugs / data accuracy issues I caught
These matter because the whole point is to be a credible stats portal. Catch them before adding more surface area.

1. **History → "By The Numbers" → "74 W Best Season (2001)"** — the 2001 Mariners won **116** games. 74 looks like a totally wrong constant.
2. **History → "By The Numbers" → "167 H — Ichiro's 2004 Record"** — Ichiro had **262** hits in 2004. (You also state this correctly in the "Did You Know" carousel, so it's an inconsistency.)
3. **History → "Playoff Drought"** appears twice on the same page with two different numbers (13 yrs and 21 yrs). One is right, the other is leftover.
4. **History → "Career AVG (min 1000 PA)"** — Will Wilson .585 marked **SHATTERED** at 185% of Ichiro's .322. Either the min-PA filter isn't being enforced or the % math is inverted.
5. **Run Diff page → "Games Played: 60"** while the team is 14–15 (29 games). Likely double-counting or summing per-batter game logs.
6. **Cal Raleigh → Statcast tab** — AVG EV, Barrels, Hard Hit % render as `—` despite a populated spray chart with 77 batted balls. Either the parser doesn't run on initial render or the field paths drifted.
7. **Cmd+K palette** does not respond to type-codes (`GRIFFEY`, `ICHIRO`, `FELIX`, `BIG DUMPER`) — they all return "No results." Easter eggs you've documented aren't wired.
8. **Triple-click Trident logo** does nothing visible. Documented easter egg, not implemented.

### My honest take on your priority list

Your tier ordering is mostly right. Here's where I'd nudge:

**ELEVATE:**
- **Bug sweep** to Tier 0. A site that brags about 74 wins in 2001 doesn't survive the first Reddit post.
- **Date-triggered auto-skins** to Tier 1. Highest delight-per-line-of-code in the entire backlog. Aug 15 (Felix Perfect Game) and Oct 8 (Edgar's Double) are essentially free wins.
- **Tone toggle UI** to Tier 1. The plumbing already exists in localStorage. Surfacing it is a 30-minute change.

**DEMOTE / SKIP:** Agree with everything in your "Skip unless you really want them" bucket. /lineup-builder, /trade-machine, /draft are content treadmills with low reuse.

**DON'T BUILD /quiz UNTIL YOU HAVE 50+ QUESTIONS WRITTEN.** It's not a code problem; it's a content problem. Same trap as /awards — both eat ongoing maintenance.

**MY ADDITIONS (you opted into 3 of these):**
- **Player DNA radar** — six-axis percentile fingerprint on every player page. Becomes the visual ID that propagates everywhere.
- **Vibe Index** — composite 0–100 per-game vibe score. A timeline of vibes is the season as a feeling. New lens, no new data.
- **Live ticker rotation** — the top "First pitch in 26m" line is a wasted billboard 80% of the time. Rotate it across pre-game / live / post-game / off-day states.

I left **universal hover trading-card** on the cutting-room floor because it's heavier and your existing player pages are good — you don't need a hover preview yet.

---

## Part 2 — Ranked Prompts for Claude Code CLI

Twelve atomic prompts, ordered to ship in sequence. Each is paste-ready. File hints are based on inference from the live site — Claude Code will reconcile against your actual repo.

### Ordering rationale
1. Bug sweep (credibility before flash)
2. Tone toggle (cheap, unlocks voice)
3. Date-triggered skins + Quote of Day (cheap, big delight)
4. /standings (completes "where are we" loop)
5. /predictions (completes "where are we going" loop)
6. /transactions (completes "what just happened" loop)
7. Home upgrades (pre-game + heatmap + why-callout)
8. Stats upgrades (splits + pitching chart + 30-team scatter)
9. Player Story tab + DNA radar + Clutch card
10. Vibe Index engine + game badges + season timeline
11. Live ticker rotation + auto-recap
12. Easter egg pass (type-codes, trident states, /secret, Konami)

OG share cards + PWA + push notifications are deliberately deferred — they're cross-cutting infra and you'll want feature stability first.

---

### Prompt 1 — Data accuracy audit & bug fix sweep

```
You're auditing the Trident (Mariners stats portal) for data accuracy bugs before
we ship new features. Treat this as a numbered fix pass — one PR, one commit per
fix, all in branches under fix/audit-*.

Known bugs to fix (verify each in source before changing):

1. History page "By The Numbers" tile: "Best Season (2001)" shows 74 W. Should be
   116 W (the 2001 Mariners went 116-46). Find the constant or computed value
   feeding this tile and correct it. Add a unit test that asserts 116.

2. History page "By The Numbers" tile: "Ichiro's 2004 Record" shows 167 H. Should
   be 262. The same value renders correctly in the "Did You Know" carousel — the
   discrepancy means there are two sources of truth. Consolidate to one constant
   in /lib/history-constants.ts (or equivalent).

3. History page shows "Playoff Drought" twice on the same page with different
   numbers (13 yrs in one tile, 21 yrs in another). Only one is right — figure
   out which (it depends on whether you count from 2001 or 2022, the Mariners'
   2022 playoff appearance ended the longest streak in MLB). Fix the wrong one.

4. History "Career AVG (min 1000 PA)" record-chase row: Will Wilson at .585 is
   marked SHATTERED at 185% of Ichiro's .322. Either the min-PA filter isn't
   being enforced or the percentage math is inverted (he should be hidden if
   under 1000 PA, and even at 1000+ PA, .585 wouldn't shatter .322 — it's not
   real). Fix the filter, fix any inverted % math, and add a unit test.

5. /stats Run Diff tab: "Games Played: 60" while team is 14-15 (29 games). The
   number is being computed by summing per-batter or per-pitcher game logs.
   Replace with team-game-count from the schedule API.

6. Player Statcast tab (visible on Cal Raleigh): AVG EV, Barrels, and Hard Hit %
   render as "—" while the spray chart correctly renders 77 batted balls. The
   parser likely fails on the first render before the data resolves. Wire a
   loading state, then verify the field paths against the actual Savant payload.

7. Add a `/scripts/audit.ts` (or extend existing) that runs a sanity check on
   load: every "record" stat must have its current-leader value <= record value
   unless the season-active-player flag is set AND PA/IP threshold is met. Fail
   the build if any rule violates.

8. Grep the codebase for hardcoded numbers in tiles (e.g., 74, 167, 13, 21) and
   move all such constants to /lib/franchise-records.ts, sourced from a single
   authoritative table. Document the source for each (Baseball Reference URL
   in a comment).

For each fix: write the test first, watch it fail, then fix. Report a final
summary with all 7 fixes confirmed and any other issues you found while in
there.
```

---

### Prompt 2 — Surface the tone toggle UI

```
The site already persists a tone preference (family / spicy / profane) in
localStorage and the captioning engine reads it, but there's no UI to change it.
Surface a Tone toggle in the top-right header, next to the theme switcher.

Spec:
- Three modes: Family, Spicy, Profane
- Default for new visitors: Spicy (matches current site voice)
- Persist selection to localStorage under key `trident.tone`
- The control should be a chip-style button group identical in visual weight to
  the theme switcher. Place it immediately to the LEFT of the theme switcher in
  the header. Mobile: collapse into the existing overflow menu.
- When user changes tone, broadcast a custom event `trident:tone-changed` so
  any caption-rendering component can re-render without a page reload.
- Add a one-line preview under each option in the dropdown: e.g.
  Family: "The bats need to wake up."
  Spicy: "The bats are dogshit."
  Profane: [user-defined; keep current strings if present]

Files likely involved (verify):
- /components/header/* (theme switcher lives here)
- /lib/captions/* (already reads tone)
- /lib/tone.ts (create if not present, encapsulates get/set/subscribe)

Acceptance:
- Toggle is visible in the header on every page.
- Switching tone updates a sample caption on screen within 100ms (no reload).
- A keyboard shortcut works: `T` cycles modes when the user is not in an input.
- Selection survives page reload.
- A short "?" tooltip on the toggle explains "Caption tone — your call."
```

---

### Prompt 3 — Date-triggered auto-skins + footer Quote of the Day

```
Add date-triggered automatic theme overrides plus a rotating Quote of the Day in
the footer. Both share the same date-utility.

Spec — Auto-skins:
- Aug 15 → "Felix Perfect Game" skin (gold accents, subtle baseball-stitch
  background pattern, K-card stack icon by streak counter)
- Oct 8 → "Edgar's Double" skin (deep navy + warm amber, animated double-arrow
  motif on hero on first load, never repeating)
- Nov 21 → "Griffey's Birthday" skin (Reds-tinged gradient, "24" floating in
  hero background, swing silhouette in the corner)
- Jul 25 → "Ichiro HoF" skin (Japanese sun motif accent, samurai-stripe border
  on the streak tracker)
- Apr 1 → "Pilots Flash" skin (3-second Pilots-yellow flash on first load, then
  reverts to default — the joke is the team's expansion-year shame)

These override the user's selected theme ONLY on those dates, with a small
dismissible banner ("It's Felix Day. We made the site gold for you. Reset →").
Save a localStorage flag `trident.skin-dismissed-{date}` so we don't nag.

Spec — Quote of the Day footer:
- Replace the static footer attribution with a rotating quote
- Sources: Edgar, Felix, Griffey, Ichiro, Cal Raleigh (one per day, same quote
  for all visitors that day; seed by day-of-year)
- Include attribution and year
- Keep the small "Fan project. Data from MLB Stats API. Not affiliated…"
  disclaimer below the quote in lighter weight.

Quotes file: /lib/quotes.ts — array of ~30 quotes minimum, each with
{quote, attribution, year, source_url}. Verify each before commit.

Files:
- /lib/skins-calendar.ts (new) — date → skin override map
- /lib/quotes.ts (new)
- /components/skin-provider.tsx — extend to honor calendar override
- /components/footer.tsx — quote rotation

Acceptance:
- Setting `Date.now()` to Aug 15 in dev tools triggers the Felix skin.
- The quote in the footer is identical across two browsers visiting on the same
  day.
- Banner can be dismissed and stays dismissed for that calendar day.
```

---

### Prompt 4 — /standings page

```
Build /standings — the full league snapshot the site is currently missing.

Three sections, in order:

1. AL West (default focus) — 5-team table with W, L, PCT, GB, L10, STRK, HOME,
   AWAY, RS, RA, DIFF, plus magic / tragic number for the M's relative to each
   team. Highlight Mariners row.

2. AL + MLB (collapsed by default, accordion) — full standings with sortable
   columns. Same columns + Pythag W-L (calculated) and "Pythag Luck" delta
   (actual W - Pythag W). Conditional formatting: green > +2, red < -2.

3. H2H Matrix overlay — a 30x30 grid (or 5x5 for AL West only by default) where
   each cell shows the season series record. Diagonal is grayed out. Hover a
   cell to see remaining games + last meeting result. Click to filter the
   schedule.

Magic / tragic numbers:
- Magic = (games left for #1) - (games behind for team) + 1
- Tragic = same formula from the bottom
- Show next to standings rank with a small "M:7 / T:14" chip

Data:
- Use existing schedule + standings endpoints; if not present, MLB Stats API
  /api/v1/standings?leagueId=103,104&season={year}
- Cache server-side, ISR every 10 minutes during season
- Add to nav: under "More" dropdown, between Schedule and Power Rankings

Acceptance:
- All 30 teams renderable in <1.5s on cold load.
- AL West collapses/expands smoothly.
- Pythag column shows the calculation in a tooltip on hover.
- Mobile: AL West only, full league as a tabbed view.
- Edge runtime where possible.
```

---

### Prompt 5 — /predictions page (Monte Carlo + scenario simulator)

```
Build /predictions. Three modules.

1. Playoff Odds Gauge (top hero)
   - Run a 10,000-iteration Monte Carlo simulation of the rest of the season
   - Inputs: current standings, remaining schedule, each team's true talent
     estimate (use season-to-date Pythag W%, regressed 30% toward .500)
   - Output: % chance Mariners make playoffs, % win division, % win WS
   - Render as three semi-circular gauges with confidence bands
   - Include "Last updated" + "Methodology" link → modal with the math

2. Pace Projection (middle band)
   - Linear projection of current 162-game pace
   - Comparison strip: "If we held this pace: 78W. We needed: 88W to clinch."
   - Show monthly pace breakdown: April pace, May pace, etc.

3. "If We Go X-Y" Slider Scenario Sim
   - Sliders for next 10 / 30 / 60 / rest-of-season win pct
   - Re-runs the Monte Carlo on each drag (debounced 200ms)
   - Outputs: updated playoff %, updated final record, updated divisional ranking
   - Add 3 preset buttons: "Disaster mode (.400 ROS)", "Steady (.520 ROS)",
     "On fire (.620 ROS)"

Existing infra (verify): /lib/predictions/* — there are references in your
backlog suggesting a predictions library is partially built. Use what's there;
don't rewrite if it works.

Files likely:
- /app/predictions/page.tsx
- /lib/predictions/monte-carlo.ts
- /components/predictions/odds-gauge.tsx
- /components/predictions/pace-projection.tsx
- /components/predictions/scenario-slider.tsx

Acceptance:
- Initial load < 2s with 10k iterations precomputed server-side
- Slider re-sim takes < 300ms per drag
- Methodology modal explains: regression amount, schedule strength, simulation
  count, confidence interval
- Add to nav under "More"
- Cache the precomputed result for 6 hours
```

---

### Prompt 6 — /transactions page

```
Build /transactions — the running ledger of every Mariners roster move this
season.

Spec:
- Reverse-chrono feed (newest first) with infinite scroll
- Categories with color-coded chips: TRADE / SIGNING / CALLUP / DFA / IL / OPTION /
  RECALL / WAIVER
- Each row: date, category chip, player headshot (lazy-loaded), short headline,
  expandable detail
  Example: "📈 CALLUP — Cole Young recalled from AAA Tacoma" → expand for full
  details (taking spot of X, who was optioned)
- Filters: All / This week / This month / Trades only / IL only
- Sticky search bar that searches across player names

Data source: MLB Stats API /api/v1/transactions endpoint, scoped to teamId 136
(SEA), seasonal. Cache server-side daily.

Bonus features:
- "Hot moves" — the 3 most recent moves get a glow border
- "Net WAR moved" tally at the top: cumulative WAR added/removed via trades and
  signings this season (fun joke if it's negative)
- A small "Compare to last year" link that pivots to the same view for 2025

Files:
- /app/transactions/page.tsx
- /lib/transactions/fetch.ts
- /components/transactions/feed.tsx
- /components/transactions/transaction-row.tsx

Add to nav under "More". Acceptance: page loads with last 50 moves in <1s,
filtering is client-side and instant, headshots have a graceful fallback to a
silhouette if missing.
```

---

### Prompt 7 — Home upgrades: pre-game card, inning-by-inning heatmap, "Why" auto-callout

```
Three additions to the dashboard, all above the fold or just below it.

1. Pre-Game Card (top of page when no live game is in progress)
   - Replace the existing "REGULAR SEASON · GAME 1 OF 3" card with an upgraded
     version that shows: probable pitchers (with this-season line + last-3 lines
     side-by-side), weather forecast (temp, wind dir/speed, precip %), countdown
     to first pitch (live), opponent's recent form (last 10), and a one-sentence
     "Trident's Take" auto-generated from the matchup edge.

2. Inning-by-Inning Heatmap
   - 14 days × 9 innings grid (so 126 cells)
   - Each cell colored by run-differential in that inning across that day's games
   - Add a small overlay strip showing what inning we typically score / give up
     in (the "we're a 7th-inning team" insight)
   - Hover any cell → tooltip with the actual game and result
   - Place this between the season-mood graph and "Did You Know"
   - Must be performant — pre-aggregate server-side

3. "Why" Auto-Callout Band
   - One generated sentence under the streak counter explaining the current state
   - Examples:
     "We're 14-15 because the bullpen ranks 12th in MLB but we slug .378 (29th)."
     "On a 4-game streak fueled by Refsnyder hitting 1.155 OPS over his last 7."
     "Pythag says we should be 16-13 — we've underperformed in 1-run games."
   - Engine: /lib/why-engine.ts that takes a team-state object and returns a
     ranked list of explanatory facts, picks the highest-impact one
   - Refresh daily; cache the sentence

Files:
- /components/home/pre-game-card.tsx
- /components/home/inning-heatmap.tsx
- /components/home/why-callout.tsx
- /lib/why-engine.ts (new)

Acceptance:
- Pre-game card replaces existing card 4+ hours before first pitch and reverts
  to a "live game" or "post-game recap" state automatically.
- Heatmap renders without layout shift.
- "Why" sentence is grammatical and never wrong (test the 5 most common
  scenarios).
```

---

### Prompt 8 — Splits dashboard on /stats, chart on Pitching tab, 30-team scatter constellation

```
Three upgrades to /stats. The Pitching tab currently has zero charts and there's
a SPLITS array in the codebase that's defined but unrendered.

1. Splits Dashboard (new tab on /stats, named "Splits")
   - Surface team-level splits: Home/Away, Day/Night, vs LHP/vs RHP, vs Above
     .500/Below .500, by month, by inning bucket (1-3 / 4-6 / 7+), with RISP /
     bases empty / 2-out RISP, after a win / after a loss
   - Each split = one card with: AVG, OBP, SLG, OPS, HR, K%, BB%
   - Color-code OPS cells against league avg (green > +30, red < -30)
   - Sortable by any metric

2. Pitching Tab — Add a Chart
   - 30-day rolling ERA + FIP overlay line chart (replace the current empty
     space below the percentile tiles)
   - Highlight any 3+ game streak of sub-2.00 ERA
   - Shaded confidence band

3. 30-Team Scatter Constellation (cross-tab visual at the very bottom of /stats)
   - X-axis: Team OPS
   - Y-axis: Team ERA (inverted so up = better)
   - Each team plotted as a dot using their primary color, with logo on hover
   - Mariners highlighted with a teal ring + label always visible
   - Quadrants labeled: "Contender" (high OPS, low ERA), "Power Outage" (low OPS,
     low ERA), "Pitcher's Nightmare" (high OPS, high ERA), "Rebuilding" (low OPS,
     high ERA)

Files:
- /app/stats/components/splits-tab.tsx
- /app/stats/components/pitching-chart.tsx
- /app/stats/components/team-scatter.tsx
- /lib/stats/team-splits.ts

Acceptance:
- Splits tab loads with all 8+ split categories, no empty states.
- Pitching chart is interactive (hover + crosshair).
- Scatter shows all 30 teams; clicking a team jumps to /standings filtered to
  them.
```

---

### Prompt 9 — Player Story tab + DNA Radar + Clutch Index card

```
Major upgrade to the player detail page. Three additions.

1. Story Tab (new, between Career and Game Log)
   - Career arc summary: short paragraph generated from career stats — "Has gone
     from 2 HR rookie season to 60-HR All-Star in 4 years" etc.
   - Comp Finder: 3 most-similar historical players by current pace (use age +
     position + production rate vector). Show as small cards with comparison
     stats.
   - BABIP Luck Gauge: where their current BABIP falls vs career — "running
     hot / running cold" indicator
   - Contract Sticker: years left, AAV, FA year (use a static contract data
     file at /lib/contracts.ts; scrape Spotrac and commit if missing)
   - Jersey History: numbers worn across years
   - Walk-up Music: embedded Spotify preview if available, otherwise placeholder
     "No walk-up music on file — DM us yours"

2. Player DNA Radar (on the hero, above the tabs, opposite the headshot)
   - Six axes, each scored 0-99 percentile vs MLB qualified players at that
     position:
     - CONTACT (xBA-driven for hitters; K% for pitchers)
     - POWER (xSLG / Barrel% for hitters; FB% allowed for pitchers, inverted)
     - DISCIPLINE (BB-K spread / Chase% for hitters; Zone% for pitchers)
     - SPEED (Sprint Speed / BSR for hitters; Pickoff% for pitchers)
     - DEFENSE (OAA / DRS for fielders; Strand% for pitchers)
     - DURABILITY (% of team games played for hitters; IL stints for pitchers,
       inverted)
   - Render as a six-pointed radar with a soft fill, mariners-teal stroke
   - Below: one-sentence shape description ("Power-and-power player. Contact is
     a known weakness.")
   - Computed in /lib/player-dna.ts; precompute nightly

3. Clutch Index Card (small card below the captions, above the tabs)
   - High-leverage OPS vs season OPS
   - Display: "Clutch +.142 OPS" or "Clutch -.087 OPS"
   - Color-coded chip: GOAT / Solid / Even / Cold / Choke
   - Tooltip explains "High-leverage situations only (LI ≥ 1.5)"

Files:
- /app/players/[id]/components/story-tab.tsx (new)
- /app/players/[id]/components/dna-radar.tsx (new)
- /app/players/[id]/components/clutch-card.tsx (new)
- /lib/player-dna.ts
- /lib/comp-finder.ts
- /lib/contracts.ts

Acceptance:
- DNA radar renders for all 26 active players without errors (data shape is
  consistent for hitters and pitchers).
- Story tab has actual content for at least 5 players (Cal, Julio, Logan
  Gilbert, JP Crawford, George Kirby) — others can be partially populated.
- Clutch card handles small-sample edge cases gracefully (< 30 PA in high lev →
  show "TBD — sample too small").
```

---

### Prompt 10 — Vibe Index engine + per-game vibe badges + season vibe timeline

```
Build a "Vibe Index" — a single 0-100 score per game capturing how it FELT to be
a Mariners fan that day. Then surface vibes everywhere.

Vibe formula (start here, tune with playtesting):
- Base: +50 if W, -50 if L
- Run differential: ± min(|RD|, 5) × 2
- Leverage: + (max LI in game) × 3 if W, - (max LI in game) × 3 if L
- Comeback factor: + 15 if won after trailing by 3+
- Walk-off bonus: + 20 if walk-off W; -20 if walk-off L
- Streak context: + (current win streak length) × 1.5; - (current loss streak
  length) × 1.5
- Blowout penalty: -10 if W by 8+ (anticlimactic); -15 if L by 8+ (humiliating)
- Shutout/no-hit toppings: + 25 if M's threw a shutout; -40 if M's were no-hit
- Clamp to 0-100

Vibe labels:
  90-100: ASCENSION
  75-89:  ELECTRIC
  60-74:  GOOD VIBES
  45-59:  WATCHABLE
  30-44:  MEH
  15-29:  DARK
  0-14:   DEPRESSION ARC

Surfaces:
1. Per-game vibe badge — show on every game row in /schedule and on /game/[id]
2. Vibe Tile on home — "Last night's vibe: 87 ELECTRIC" with the W/L
3. Season Vibe Timeline — new component on dashboard, line chart of vibes
   across the season. Hover any point shows date + opponent + score + vibe
4. Add to /stats as a bonus tab "Mariners Math" with leaderboards: Best vibe
   game, worst vibe game, longest stretch above 60, longest below 30

Files:
- /lib/vibe-index.ts (engine + labels)
- /components/vibe-badge.tsx
- /components/vibe-timeline.tsx (line chart)
- /app/stats/components/mariners-math-tab.tsx

Acceptance:
- Every completed game has a vibe score, no null/undefined.
- Engine is unit-tested with the canonical games: 2001 ALDS Game 5 (vibe ~95),
  any blowout loss (~10), a walk-off win (~85).
- Timeline supports zoom/pan.
- Performance: 162-game timeline renders in <100ms.
```

---

### Prompt 11 — Live ticker rotation + post-game auto-recap

```
The top-of-page ticker currently shows "First pitch in 26m | SEA 0 | MIN 0" 24
hours a day. Make it state-aware.

States and content:
- PRE-GAME (>4 hours before first pitch): "Tonight: SEA vs MIN · 4:40 PM ·
  T-Mobile Park · Probable: Castillo (3.10 ERA) vs López (4.22 ERA)" + countdown
- WARMUP (<4 hours before first pitch): switch to "First pitch in {countdown}"
- LIVE: "B5 · 2 outs · runner on 2nd · SEA 3, MIN 1 · Castillo (78 P, 6 K)" with
  pulsing red LIVE dot. Update every 8 seconds.
- POST-GAME (within 24h of final): "FINAL: SEA 4, MIN 1 · W: Castillo (3-1) ·
  Recap → /game/{id}" with a confetti emoji on W or sad-trombone on L
- OFF-DAY: "Off day. Next: Tomorrow vs HOU at 7:10 PM · Watch on ROOT"

Auto-Recap:
- On post-game state, the "Recap →" link should open a modal (or navigate to
  /game/{id}) that shows: final score, game's vibe score and label, top 3
  high-leverage moments, the "hero" (highest WPA contributor) and "goat" (lowest
  WPA), and a 1-sentence auto-generated summary.

Files:
- /components/live-ticker.tsx (extend existing)
- /lib/game-state-machine.ts (new — owns the state transitions)
- /components/recap-modal.tsx (new)
- /lib/recap-generator.ts (new)

Acceptance:
- State transitions are visible in dev tools by stubbing time.
- LIVE state polls the game feed every 8s with proper cleanup on unmount.
- POST-GAME state expires 24 hours after the final and reverts to PRE-GAME or
  OFF-DAY.
- Recap modal closes on Esc and does not break ticker animation.
```

---

### Prompt 12 — Easter egg pass: type-codes, trident states, /secret index, Konami extension

```
Wire up the easter eggs already documented but not implemented, plus a few new
ones.

1. Type-Codes (in Cmd+K palette OR anywhere typing on the body)
   Currently typing GRIFFEY in the palette returns "No results" — fix this.
   Add a special-string handler that intercepts before the regular search:
   - GRIFFEY → trigger a brief swing-silhouette animation across the screen,
     play a single bat-crack sound (opt-in, see Tone toggle), unlock badge
   - ICHIRO → cursor briefly becomes a katana for 30s, unlock badge
   - EDGAR → snap to "Sunset Edgar" theme for the rest of the session
   - FELIX → King's Court yellow K-cards stack briefly in the corner
   - BIG DUMPER → scoreboard digit flair on every numeric tile for 60s
   - REFUSE TO LOSE → expand the existing toast into a full-screen takeover
   - TRIDENT → unlock /secret page

2. Trident Logo States (header logo)
   - Triple-click → "stab" animation: trident lunges forward, bounces back
   - On a 5+ game losing streak → trident visibly droops (3 deg rotation, slight
     desaturation)
   - On a Cal Raleigh HR in the last 24h → trident pulses gold, header gets a
     subtle gold border

3. /secret page
   - Hidden index of all known easter eggs, only revealed AFTER user has triggered
     at least one
   - Lists the eggs with checkmarks for ones found, "?" for ones still hidden
   - Includes the Konami code, the cardinal-points compass click sequence
     (N → E → S → W on the compass watermark), and any others

4. Cardinal compass click sequence
   - The compass watermark on most pages — clicking the 4 cardinal points in
     order (N → E → S → W) within 5 seconds reveals /secret

5. "Trident Initiate" badge
   - Visit all 8 nav pages once → unlock a small persistent badge in the footer
   - Track in localStorage `trident.pages-visited`

6. Konami code (existing if present, extend)
   - ↑↑↓↓←→←→BA → toggle a "Cheat Mode" overlay that prints all internal
     captions for the current page state (debug-ish, fun)

Files:
- /lib/easter-eggs.ts (new — central registry)
- /lib/type-code-listener.ts (new)
- /app/secret/page.tsx (new)
- /components/trident-logo.tsx (extend)

Acceptance:
- All 7 type-codes work whether typed in the Cmd+K palette OR with the body
  focused.
- /secret returns 404 unless at least one egg has been triggered (then 200).
- Trident state changes visibly within 1s of the trigger condition becoming
  true.
- Add a dev-mode flag `?eggs=debug` that lists all eggs and their status for
  testing.
- All audio is opt-in, gated by the Tone toggle's "soundpack" sub-setting (you
  may need to add it).
```

---

## Part 3 — What I deliberately did NOT write a prompt for (yet)

These are real ideas, but you'll get more value once the 12 above are landed:

- **OG share cards + PWA + push notifications** — cross-cutting infra. Build after the new pages are stable so you don't have to revise the share artwork three times.
- **/park, /scoreboard TV mode, /awards, /draft, /lineup-builder, /trade-machine, /quiz** — all eat content treadmills. Pick at most one and only after you have a content pipeline.
- **Universal hover trading-card** — defer until your player-DNA radar exists; the radar is the right thing to put inside the hover card later.
- **Sound pack** — most users mute audio sites. Tied to opt-in sound flag inside the Tone toggle if you ever want it.
- **A11y full pass** — bake into each prompt above by adding "color contrast WCAG AA, prefers-reduced-motion respected" rather than treating as a separate sweep.

---

## Part 4 — Quick wins not worth a full prompt

If you have 15 spare minutes:

1. The "Caleb" naming on Cal's player page reads like a bug to outsiders even if it's intentional. Add the nickname to the captions (e.g., "Big Dumper struck out too damn much") — punchier, less confusing.
2. The "Did You Know" carousel auto-advances. Add a small "Next →" affordance for control freaks.
3. The "Refuse to Lose" toast doesn't dismiss across sessions. Persist the dismissal for 24h.
4. The compass watermark could rotate 360° once on first page load — small detail, signature element.
5. Footer needs a tiny `v0.X.Y` build tag — useful when you're debugging old screenshots.

---

_End of doc. Run prompts 1 → 12 in order. Stop after any of them to validate before the next._
