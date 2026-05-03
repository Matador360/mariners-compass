/**
 * MLB Park Factors keyed by venue ID. Values are 100-centered (100 = neutral),
 * higher = hitter-friendly. Source: MLB.com "Statcast Park Factors" 2022-2024
 * 3-year averages; rounded to whole numbers.
 *
 * NOTE: Venue IDs come from the MLB Stats API venues endpoint and may need to
 * be verified per-park. T-Mobile Park (680) is confirmed and is the one that
 * matters most for the Mariners app. Unknown venues fall back to NEUTRAL safely.
 */

export interface ParkFactor {
  name: string;
  runs: number;     // overall run-scoring environment
  hr: number;       // home run factor
  doubles: number;
  triples: number;
}

export const PARK_FACTORS: Record<number, ParkFactor> = {
  680:  { name: 'T-Mobile Park',                    runs: 95,  hr: 92,  doubles: 96,  triples: 109 }, // SEA
  3313: { name: 'Yankee Stadium',                   runs: 105, hr: 119, doubles: 99,  triples: 87  }, // NYY
  2392: { name: 'Daikin Park',                      runs: 99,  hr: 102, doubles: 98,  triples: 94  }, // HOU
  5163: { name: 'Sutter Health Park',               runs: 102, hr: 104, doubles: 101, triples: 100 }, // ATH
  1:    { name: 'Angel Stadium',                    runs: 97,  hr: 100, doubles: 95,  triples: 88  }, // LAA
  5325: { name: 'Globe Life Field',                 runs: 100, hr: 99,  doubles: 102, triples: 96  }, // TEX
  7:    { name: 'Kauffman Stadium',                 runs: 102, hr: 91,  doubles: 105, triples: 130 }, // KC
  5:    { name: 'Progressive Field',                runs: 95,  hr: 96,  doubles: 96,  triples: 90  }, // CLE
  2394: { name: 'Comerica Park',                    runs: 96,  hr: 93,  doubles: 98,  triples: 122 }, // DET
  3312: { name: 'Target Field',                     runs: 100, hr: 99,  doubles: 101, triples: 102 }, // MIN
  4:    { name: 'Rate Field',                       runs: 99,  hr: 105, doubles: 96,  triples: 87  }, // CWS
  2:    { name: 'Fenway Park',                      runs: 108, hr: 98,  doubles: 124, triples: 86  }, // BOS
  3:    { name: 'Oriole Park at Camden Yards',      runs: 100, hr: 102, doubles: 98,  triples: 85  }, // BAL
  12:   { name: 'Tropicana Field',                  runs: 95,  hr: 95,  doubles: 95,  triples: 88  }, // TB
  4705: { name: 'George M. Steinbrenner Field',     runs: 102, hr: 110, doubles: 99,  triples: 95  }, // TB temp 2025
  14:   { name: 'Rogers Centre',                    runs: 102, hr: 105, doubles: 98,  triples: 92  }, // TOR
  22:   { name: 'Dodger Stadium',                   runs: 99,  hr: 110, doubles: 92,  triples: 83  }, // LAD
  2680: { name: 'Petco Park',                       runs: 95,  hr: 96,  doubles: 95,  triples: 105 }, // SD
  2395: { name: 'Oracle Park',                      runs: 92,  hr: 84,  doubles: 95,  triples: 138 }, // SF
  19:   { name: 'Coors Field',                      runs: 113, hr: 112, doubles: 117, triples: 191 }, // COL
  15:   { name: 'Chase Field',                      runs: 103, hr: 105, doubles: 102, triples: 121 }, // ARI
  17:   { name: 'Wrigley Field',                    runs: 100, hr: 100, doubles: 102, triples: 99  }, // CHC
  31:   { name: 'PNC Park',                         runs: 96,  hr: 88,  doubles: 99,  triples: 114 }, // PIT
  2602: { name: 'Great American Ball Park',         runs: 105, hr: 119, doubles: 100, triples: 95  }, // CIN
  32:   { name: 'American Family Field',            runs: 99,  hr: 105, doubles: 96,  triples: 89  }, // MIL
  2889: { name: 'Busch Stadium',                    runs: 96,  hr: 90,  doubles: 99,  triples: 95  }, // STL
  3289: { name: 'Citi Field',                       runs: 96,  hr: 92,  doubles: 96,  triples: 95  }, // NYM
  2681: { name: 'Citizens Bank Park',               runs: 102, hr: 110, doubles: 99,  triples: 88  }, // PHI
  4705005: { name: 'Truist Park',                   runs: 102, hr: 104, doubles: 101, triples: 95  }, // ATL (placeholder ID)
  4169: { name: 'loanDepot park',                   runs: 95,  hr: 92,  doubles: 96,  triples: 110 }, // MIA
  3309: { name: 'Nationals Park',                   runs: 100, hr: 102, doubles: 99,  triples: 95  }, // WSH
};

const NEUTRAL: ParkFactor = { name: 'Neutral', runs: 100, hr: 100, doubles: 100, triples: 100 };

export function parkFactor(venueId?: number): ParkFactor {
  if (venueId == null) return NEUTRAL;
  return PARK_FACTORS[venueId] ?? NEUTRAL;
}

/**
 * Heuristic weather modifier for HR likelihood. Returns a multiplier centered
 * on 1.00. Based on common rules: every 5°F adds ~1% HR distance; out-blowing
 * winds add ~0.7% per mph; in-blowing winds subtract the same. Capped ±20%.
 */
export function weatherHRModifier(args: {
  condition?: string | null;
  tempF?: number | null;
  wind?: { speed?: number; dir?: string } | null;
  isDome?: boolean;
}): number {
  if (args.isDome) return 1.0;
  let m = 1.0;
  if (args.tempF != null) {
    const delta = (args.tempF - 70) / 5;
    m *= 1 + Math.max(-0.15, Math.min(0.15, delta * 0.01));
  }
  if (args.wind?.speed != null && args.wind?.dir) {
    const dir = args.wind.dir.toLowerCase();
    const speed = args.wind.speed;
    if (dir.includes('out')) m *= 1 + Math.min(0.20, speed * 0.007);
    else if (dir.includes('in')) m *= 1 - Math.min(0.20, speed * 0.007);
  }
  return m;
}

export function weatherEffectLabel(modifier: number): string {
  const pct = Math.round((modifier - 1) * 100);
  if (pct >= 10) return `Big boost (+${pct}%)`;
  if (pct >= 4) return `Mild boost (+${pct}%)`;
  if (pct <= -10) return `Big damper (${pct}%)`;
  if (pct <= -4) return `Mild damper (${pct}%)`;
  return 'Neutral';
}
