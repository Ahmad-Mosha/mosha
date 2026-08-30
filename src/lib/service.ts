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
