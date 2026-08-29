/**
 * Run with: node --experimental-strip-types convex/recurrence.test.ts
 *
 * Date maths is where naive code quietly rots — month-end clamping and
 * weekend skipping are the two that bite. No framework on purpose.
 */
import assert from "node:assert";
import {
  addDays, nextOccurrence, nextStreak, recurrenceOf, isDoneForPeriod, today,
} from "./recurrence.ts";

// --- weekdays skips the weekend -------------------------------------------
// 2026-08-28 is a Friday.
assert.strictEqual(nextOccurrence("weekdays", "2026-08-28"), "2026-08-31", "Fri -> Mon");
assert.strictEqual(nextOccurrence("weekdays", "2026-08-31"), "2026-09-01", "Mon -> Tue");
assert.strictEqual(nextOccurrence("daily", "2026-08-28"), "2026-08-29", "daily crosses into Sat");

// --- monthly clamps instead of overflowing --------------------------------
assert.strictEqual(nextOccurrence("monthly", "2026-01-31"), "2026-02-28", "Jan 31 -> Feb 28");
assert.strictEqual(nextOccurrence("monthly", "2026-03-15"), "2026-04-15", "mid-month is stable");
assert.strictEqual(nextOccurrence("monthly", "2024-01-31"), "2024-02-29", "leap year");

// --- crossing a month and a year boundary ---------------------------------
assert.strictEqual(addDays("2026-12-31", 1), "2027-01-01", "year rollover");
assert.strictEqual(addDays("2026-03-01", -1), "2026-02-28", "backwards over month start");

// --- streaks continue or reset --------------------------------------------
assert.strictEqual(nextStreak("daily", undefined, 0, "2026-08-29"), 1, "first completion");
assert.strictEqual(nextStreak("daily", "2026-08-28", 5, "2026-08-29"), 6, "consecutive day");
assert.strictEqual(nextStreak("daily", "2026-08-26", 5, "2026-08-29"), 1, "gap resets");
assert.strictEqual(nextStreak("daily", "2026-08-29", 5, "2026-08-29"), 5, "same day is idempotent");
assert.strictEqual(nextStreak("weekdays", "2026-08-28", 9, "2026-08-31"), 10, "Fri -> Mon keeps streak");
assert.strictEqual(nextStreak("weekly", "2026-08-22", 3, "2026-08-29"), 4, "a week later");

// --- legacy rows only carry isDaily ---------------------------------------
assert.strictEqual(recurrenceOf({ isDaily: true }), "daily", "legacy daily row");
assert.strictEqual(recurrenceOf({ isDaily: false }), "none", "legacy one-off row");
assert.strictEqual(recurrenceOf({ recurrence: "weekly", isDaily: true }), "weekly", "explicit rule wins");

// --- done-for-period drives the checkbox ----------------------------------
assert.strictEqual(isDoneForPeriod({ recurrence: "daily", lastCompletedDate: today() }), true);
assert.strictEqual(isDoneForPeriod({ recurrence: "daily", lastCompletedDate: addDays(today(), -1) }), false);
assert.strictEqual(isDoneForPeriod({ recurrence: "none", status: "done" }), true);
assert.strictEqual(isDoneForPeriod({ recurrence: "none", status: "todo" }), false);

console.log("recurrence: all assertions passed");
