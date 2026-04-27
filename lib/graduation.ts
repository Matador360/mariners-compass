// Pure helpers for MLB rookie/prospect-status graduation rules.
//
// A player loses prospect status when ANY of:
//   - hitter accumulates > 130 AB at the MLB level
//   - pitcher accumulates > 50 IP at the MLB level
//   - any role accumulates > 45 days of MLB active-roster service
//     (September call-ups don't count — caller is responsible for that subtraction)

export interface PriorMLBService {
  ab: number;
  ip: number;
  activeRosterDays: number;
}

export interface GraduationStatus {
  status: "eligible" | "graduating-soon" | "graduated";
  remaining: { ab: number; ip: number; days: number };
  nearestThreshold: "ab" | "ip" | "days" | null;
  reason: string;
}

const AB_THRESHOLD = 130;
const IP_THRESHOLD = 50;
const DAYS_THRESHOLD = 45;

export function computeGraduation(
  service: PriorMLBService,
  isPitcher: boolean
): GraduationStatus {
  const { ab, ip, activeRosterDays } = service;

  const remainingAb = Math.max(0, AB_THRESHOLD - ab);
  const remainingIp = Math.max(0, IP_THRESHOLD - ip);
  const remainingDays = Math.max(0, DAYS_THRESHOLD - activeRosterDays);

  if (
    (!isPitcher && ab > AB_THRESHOLD) ||
    (isPitcher && ip > IP_THRESHOLD) ||
    activeRosterDays > DAYS_THRESHOLD
  ) {
    return {
      status: "graduated",
      remaining: { ab: 0, ip: 0, days: 0 },
      nearestThreshold: null,
      reason: isPitcher
        ? `${ip.toFixed(1)} IP — graduated`
        : `${ab} AB — graduated`,
    };
  }

  // Pick the most-relevant remaining axis for the player's role.
  const candidates: { key: "ab" | "ip" | "days"; remaining: number; threshold: number }[] = [];
  if (!isPitcher) candidates.push({ key: "ab", remaining: remainingAb, threshold: AB_THRESHOLD });
  if (isPitcher) candidates.push({ key: "ip", remaining: remainingIp, threshold: IP_THRESHOLD });
  candidates.push({ key: "days", remaining: remainingDays, threshold: DAYS_THRESHOLD });

  const nearest = candidates.reduce((a, b) =>
    a.remaining / a.threshold <= b.remaining / b.threshold ? a : b
  );

  const noServiceYet = ab === 0 && ip === 0 && activeRosterDays === 0;
  if (noServiceYet) {
    return {
      status: "eligible",
      remaining: { ab: remainingAb, ip: remainingIp, days: remainingDays },
      nearestThreshold: nearest.key,
      reason: "Hasn't reached MLB yet",
    };
  }

  const close = nearest.remaining / nearest.threshold < 0.25;
  if (close) {
    const used = nearest.threshold - nearest.remaining;
    const label = nearest.key === "ip" ? "IP" : nearest.key === "ab" ? "AB" : "days";
    const reason =
      nearest.key === "ip"
        ? `${used.toFixed(1)} of ${IP_THRESHOLD} IP — ${nearest.remaining.toFixed(1)} to graduation`
        : nearest.key === "ab"
        ? `${used} of ${AB_THRESHOLD} AB — ${nearest.remaining} to graduation`
        : `${used} of ${DAYS_THRESHOLD} days — ${nearest.remaining} to graduation`;
    void label;
    return {
      status: "graduating-soon",
      remaining: { ab: remainingAb, ip: remainingIp, days: remainingDays },
      nearestThreshold: nearest.key,
      reason,
    };
  }

  const used = nearest.threshold - nearest.remaining;
  const reason =
    nearest.key === "ip"
      ? `${used.toFixed(1)} of ${IP_THRESHOLD} IP at MLB level`
      : nearest.key === "ab"
      ? `${used} of ${AB_THRESHOLD} AB at MLB level`
      : `${used} of ${DAYS_THRESHOLD} active-roster days`;
  return {
    status: "eligible",
    remaining: { ab: remainingAb, ip: remainingIp, days: remainingDays },
    nearestThreshold: nearest.key,
    reason,
  };
}

export function thresholdLabel(key: "ab" | "ip" | "days"): string {
  return key === "ab" ? "AB" : key === "ip" ? "IP" : "days";
}
