import { addDays, fromDayString, today } from "../../convex/recurrence";

export type DayStatus = "home" | "duty" | "base" | "discharged";

export interface ServicePeriod {
  _id: string;
  kind: string;
  startDate: string;
  endDate: string;
  label?: string;
}

export interface ServiceConfig {
  dischargeDate?: string;
  serviceStartDate?: string;
}

const daysBetween = (from: string, to: string) =>
  Math.round(
    (fromDayString(to).getTime() - fromDayString(from).getTime()) / 86_400_000
  );

/** Inclusive on both ends — a one-day leave has start === end. */
export const periodCovers = (p: ServicePeriod, day: string) =>
  day >= p.startDate && day <= p.endDate;

export function statusFor(
  day: string,
  periods: ServicePeriod[],
  config: ServiceConfig | null
): DayStatus {
  if (config?.dischargeDate && day > config.dischargeDate) return "discharged";
  const hit = periods.find((p) => periodCovers(p, day));
  if (hit) return hit.kind === "duty" ? "duty" : "home";
  return "base";
}

export const periodFor = (day: string, periods: ServicePeriod[]) =>
  periods.find((p) => periodCovers(p, day)) ?? null;

export interface Countdown {
  /** Days from today until discharge; negative once it has passed. */
  daysLeft: number | null;
  /** 0–100 across the whole service, when a start date is known. */
  percentServed: number | null;
  totalDays: number | null;
  daysServed: number | null;
  /** The next leave that has not finished yet. */
  nextLeave: ServicePeriod | null;
  daysUntilNextLeave: number | null;
  /** Set while a leave period is running. */
  currentLeave: ServicePeriod | null;
  daysLeftOfLeave: number | null;
}

export function computeCountdown(
  periods: ServicePeriod[],
  config: ServiceConfig | null,
  now = today()
): Countdown {
  const discharge = config?.dischargeDate;
  const start = config?.serviceStartDate;

  const daysLeft = discharge ? daysBetween(now, discharge) : null;

  let percentServed: number | null = null;
  let totalDays: number | null = null;
  let daysServed: number | null = null;
  if (discharge && start) {
    totalDays = daysBetween(start, discharge);
    daysServed = daysBetween(start, now);
    percentServed =
      totalDays > 0
        ? Math.min(100, Math.max(0, (daysServed / totalDays) * 100))
        : null;
  }

  const leaves = periods
    .filter((p) => p.kind !== "duty")
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const currentLeave = leaves.find((p) => periodCovers(p, now)) ?? null;
  const nextLeave = leaves.find((p) => p.startDate > now) ?? null;

  return {
    daysLeft,
    percentServed,
    totalDays,
    daysServed,
    nextLeave,
    daysUntilNextLeave: nextLeave ? daysBetween(now, nextLeave.startDate) : null,
    currentLeave,
    daysLeftOfLeave: currentLeave
      ? daysBetween(now, currentLeave.endDate) + 1
      : null,
  };
}

/** Every day in a period, for painting the grid. */
export function expandPeriod(p: ServicePeriod): string[] {
  const out: string[] = [];
  let d = p.startDate;
  // Guard against a malformed row spinning forever.
  for (let i = 0; i < 400 && d <= p.endDate; i++) {
    out.push(d);
    d = addDays(d, 1);
  }
  return out;
}

export const countLeaveDays = (periods: ServicePeriod[]) =>
  periods
    .filter((p) => p.kind !== "duty")
    .reduce((n, p) => n + daysBetween(p.startDate, p.endDate) + 1, 0);

// ---------------------------------------------------------------------------
// Fixed rotation
// ---------------------------------------------------------------------------

export interface CycleRule {
  /** A date on which `anchorPhase` begins. Everything is derived from here. */
  anchor: string;
  anchorPhase: "base" | "home";
  baseDays: number;
  homeDays: number;
}

/**
 * Expand a fixed rotation into the home periods inside [from, to].
 *
 * Only home stretches are returned — base is the default state, so storing it
 * would double the rows for no gain. The walk starts before `from` and steps
 * backwards to the true phase boundary first, otherwise a range beginning
 * mid-stretch would report a short period that never existed.
 */
export function generateCyclePeriods(
  rule: CycleRule,
  from: string,
  to: string
): { kind: "home"; startDate: string; endDate: string }[] {
  const { anchor, anchorPhase, baseDays, homeDays } = rule;
  if (baseDays < 1 || homeDays < 1) return [];

  const period = baseDays + homeDays;
  const offset = Math.round(
    (fromDayString(from).getTime() - fromDayString(anchor).getTime()) / 86_400_000
  );

  // Rewind to the boundary of the stretch that contains `from`.
  const intoCycle = ((offset % period) + period) % period;
  let cursor = addDays(from, -intoCycle);
  let phase: "base" | "home" = anchorPhase;

  const out: { kind: "home"; startDate: string; endDate: string }[] = [];
  // Guard: a year of 1-day phases is still under 800 iterations.
  for (let i = 0; i < 800 && cursor <= to; i++) {
    const length = phase === "base" ? baseDays : homeDays;
    const end = addDays(cursor, length - 1);

    if (phase === "home" && end >= from) {
      out.push({
        kind: "home",
        // Clip to the requested window so a stretch straddling the edge
        // does not spill outside it.
        startDate: cursor < from ? from : cursor,
        endDate: end > to ? to : end,
      });
    }

    cursor = addDays(cursor, length);
    phase = phase === "base" ? "home" : "base";
  }

  return out;
}
