/**
 * Recurrence rules, shared by the Convex mutations and the UI.
 *
 * Lives under convex/ because Convex only bundles this directory; the client
 * imports it by relative path so both sides agree on what "due again" means.
 * Everything here is pure date maths on YYYY-MM-DD strings — no Date-object
 * timezone surprises, since a due date is a calendar day, not an instant.
 */

export type Recurrence = "none" | "daily" | "weekdays" | "weekly" | "monthly";

export const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Every day" },
  { value: "weekdays", label: "Every weekday (Mon–Fri)" },
  { value: "weekly", label: "Every week" },
  { value: "monthly", label: "Every month" },
];

export const RECURRENCE_LABEL: Record<Recurrence, string> = {
  none: "",
  daily: "Daily",
  weekdays: "Weekdays",
  weekly: "Weekly",
  monthly: "Monthly",
};

/** YYYY-MM-DD for a Date, in local calendar terms. */
export function toDayString(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function today(): string {
  return toDayString(new Date());
}

/** Parse YYYY-MM-DD as a local date, avoiding the UTC shift `new Date(str)` applies. */
export function fromDayString(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(day: string, n: number): string {
  const d = fromDayString(day);
  d.setDate(d.getDate() + n);
  return toDayString(d);
}

/**
 * A task's rule. Old rows only have the `isDaily` boolean, so fall back to it
 * rather than migrating every document.
 */
export function recurrenceOf(task: {
  recurrence?: string;
  isDaily?: boolean;
}): Recurrence {
  const r = task.recurrence as Recurrence | undefined;
  if (r && r !== "none") return r;
  if (!r && task.isDaily) return "daily";
  return r ?? "none";
}

export const isRecurring = (task: { recurrence?: string; isDaily?: boolean }) =>
  recurrenceOf(task) !== "none";

/** The next date on or after `from` that satisfies the rule. */
export function nextOccurrence(rule: Recurrence, from: string): string {
  switch (rule) {
    case "daily":
      return addDays(from, 1);
    case "weekdays": {
      let next = addDays(from, 1);
      // 0 = Sunday, 6 = Saturday
      while ([0, 6].includes(fromDayString(next).getDay())) {
        next = addDays(next, 1);
      }
      return next;
    }
    case "weekly":
      return addDays(from, 7);
    case "monthly": {
      const d = fromDayString(from);
      const targetDay = d.getDate();
      d.setMonth(d.getMonth() + 1);
      // Clamp: the 31st rolls into the next month otherwise, so a task set for
      // the 31st would skip February entirely.
      if (d.getDate() !== targetDay) d.setDate(0);
      return toDayString(d);
    }
    default:
      return from;
  }
}

/**
 * Whether a recurring task has already been done for the current period.
 * Drives the checkbox: ticking a daily task should stay ticked until tomorrow,
 * not until the end of time.
 */
export function isDoneForPeriod(task: {
  recurrence?: string;
  isDaily?: boolean;
  lastCompletedDate?: string;
  status?: string;
}): boolean {
  const rule = recurrenceOf(task);
  if (rule === "none") return task.status === "done";
  if (!task.lastCompletedDate) return false;

  const now = today();
  switch (rule) {
    case "daily":
    case "weekdays":
      return task.lastCompletedDate === now;
    case "weekly":
      return fromDayString(task.lastCompletedDate) > fromDayString(addDays(now, -7));
    case "monthly":
      return fromDayString(task.lastCompletedDate) > fromDayString(addDays(now, -28));
    default:
      return false;
  }
}

/**
 * A streak survives only if the previous completion lands on the period
 * immediately before this one; otherwise the chain is broken and restarts.
 */
export function nextStreak(
  rule: Recurrence,
  lastCompletedDate: string | undefined,
  currentStreak: number,
  completedOn: string
): number {
  if (rule === "none") return 0;
  if (!lastCompletedDate) return 1;

  /** Largest gap that still counts as "the very next period". */
  const maxGap: Record<Recurrence, number> = {
    daily: 1,
    weekdays: 3, // Monday's predecessor is Friday
    weekly: 7,
    monthly: 31,
    none: 0,
  };

  const gapDays = Math.round(
    (fromDayString(completedOn).getTime() -
      fromDayString(lastCompletedDate).getTime()) /
      86_400_000
  );

  if (gapDays === 0) return currentStreak; // already counted today
  return gapDays <= maxGap[rule] ? currentStreak + 1 : 1;
}

/**
 * The status to render. A recurring task keeps status "done" from the day it
 * was ticked, but once the period rolls over it is pending again — so the
 * board and list ask for this rather than reading `status` directly.
 */
export function effectiveStatus(task: {
  recurrence?: string;
  isDaily?: boolean;
  status?: string;
  lastCompletedDate?: string;
}): string {
  if (!isRecurring(task)) return task.status || "todo";
  return isDoneForPeriod(task) ? "done" : "todo";
}
