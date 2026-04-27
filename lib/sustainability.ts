export interface SustainabilityVerdict {
  label: 'real' | 'lucky' | 'unlucky' | 'wait';
  reason: string;
  confidence: number;
}

export interface HitterSustainabilityInput {
  recentPA: number;
  babipRecent: number;
  babipSeason: number;
  babipCareer?: number;
  hardHitPctSavant?: number;
  barrelPctSavant?: number;
  kPctRecent: number;
  kPctSeason: number;
  isoRecent: number;
  isoSeason: number;
}

export interface PitcherSustainabilityInput {
  recentIP: number;
  fipSeason: number;
  eraSeason: number;
  lobPct: number;
  babipAgainst?: number;
  k9Recent: number;
  k9Season: number;
}

export interface AttendanceInput {
  lastNGamesPlayed: number;
  teamLastNGames: number;
}

function rate3(n: number): string {
  return n.toFixed(3).replace(/^0\./, ".").replace(/^-0\./, "-.");
}

export function scoreHitter(input: HitterSustainabilityInput): SustainabilityVerdict {
  const {
    recentPA,
    babipRecent,
    babipSeason,
    hardHitPctSavant,
    kPctRecent,
    kPctSeason,
    isoRecent,
    isoSeason,
  } = input;

  if (recentPA < 25) {
    return { label: 'wait', reason: 'Small sample, ride it out.', confidence: 0.4 };
  }

  const hasSavant = hardHitPctSavant != null;

  if (
    babipRecent > 0.360 &&
    babipRecent - babipSeason > 0.045 &&
    (hardHitPctSavant ?? 100) < 40
  ) {
    const reason = hasSavant
      ? `BABIP ${rate3(babipRecent)}, hard-hit only ${Math.round(hardHitPctSavant!)}% — regression coming.`
      : `BABIP ${rate3(babipRecent)} (+${rate3(babipRecent - babipSeason)} vs season) — regression coming.`;
    return { label: 'lucky', reason, confidence: hasSavant ? 0.85 : 0.55 };
  }

  if (
    (hardHitPctSavant != null && hardHitPctSavant >= 42) ||
    (kPctRecent < kPctSeason - 0.04 && isoRecent > isoSeason)
  ) {
    return {
      label: 'real',
      reason: 'Hitting it harder, striking out less. This is the new baseline.',
      confidence: hasSavant ? 0.85 : 0.55,
    };
  }

  if (babipRecent < 0.260 && (hardHitPctSavant ?? 0) >= 40) {
    return {
      label: 'unlucky',
      reason: 'Squaring it up, getting nothing — luck due to flip.',
      confidence: hasSavant ? 0.85 : 0.55,
    };
  }

  return { label: 'real', reason: 'On a real run.', confidence: 0.5 };
}

export function scorePitcher(input: PitcherSustainabilityInput): SustainabilityVerdict {
  const { recentIP, fipSeason, eraSeason, lobPct, k9Recent, k9Season } = input;

  if (recentIP < 5) {
    return { label: 'wait', reason: 'Small sample, give it another start or two.', confidence: 0.4 };
  }

  const fipMinusEra = fipSeason - eraSeason;

  if (lobPct > 0.82 && fipMinusEra > 0.5) {
    return {
      label: 'lucky',
      reason: `Stranding everyone — FIP ahead by ${fipMinusEra.toFixed(2)} points. Watch the regression.`,
      confidence: 0.7,
    };
  }

  if (k9Recent > k9Season + 1.5 || fipMinusEra < -0.3) {
    return {
      label: 'real',
      reason: 'Stuff is real. Missing more bats, FIP backs it.',
      confidence: 0.7,
    };
  }

  if (lobPct < 0.66 && fipMinusEra < -0.6) {
    return {
      label: 'unlucky',
      reason: "FIP says ace, ERA says no — sequence luck. He's better than the line.",
      confidence: 0.7,
    };
  }

  return { label: 'real', reason: 'On a real run.', confidence: 0.5 };
}

export function attendanceFlag(player: AttendanceInput, threshold = 5): boolean {
  return player.lastNGamesPlayed < threshold && player.teamLastNGames >= 7;
}
