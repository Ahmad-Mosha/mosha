/** Run: node --experimental-strip-types src/lib/service.test.ts */
import assert from "node:assert";
import { computeCountdown, expandPeriod, statusFor, countLeaveDays } from "./service.ts";

const NOW = "2026-08-30";
const leave = (id: string, s: string, e: string, kind = "home") =>
  ({ _id: id, kind, startDate: s, endDate: e });

const periods = [
  leave("a", "2026-08-10", "2026-08-14"),          // past
  leave("b", "2026-09-12", "2026-09-19"),          // upcoming
  leave("c", "2026-10-02", "2026-10-04"),          // later
];
const config = { dischargeDate: "2026-10-29", serviceStartDate: "2025-10-29" };

// --- day status -----------------------------------------------------------
assert.strictEqual(statusFor("2026-08-30", periods, config), "base", "default is base");
assert.strictEqual(statusFor("2026-08-12", periods, config), "home", "inside a leave");
assert.strictEqual(statusFor("2026-08-10", periods, config), "home", "start is inclusive");
assert.strictEqual(statusFor("2026-08-14", periods, config), "home", "end is inclusive");
assert.strictEqual(statusFor("2026-08-15", periods, config), "base", "day after leave");
assert.strictEqual(statusFor("2026-11-01", periods, config), "discharged", "after discharge");

// --- countdown ------------------------------------------------------------
const c = computeCountdown(periods, config, NOW);
assert.strictEqual(c.daysLeft, 60, "60 days until discharge");
assert.strictEqual(c.totalDays, 365, "one year of service");
assert.strictEqual(c.daysServed, 305);
assert.ok(c.percentServed !== null && Math.abs(c.percentServed - 83.56) < 0.1, "~84% served");
assert.strictEqual(c.nextLeave?._id, "b", "next leave is the soonest future one");
assert.strictEqual(c.daysUntilNextLeave, 13);
assert.strictEqual(c.currentLeave, null, "not on leave today");

// --- while actually on leave ---------------------------------------------
const onLeave = computeCountdown(periods, config, "2026-09-14");
assert.strictEqual(onLeave.currentLeave?._id, "b");
assert.strictEqual(onLeave.daysLeftOfLeave, 6, "inclusive of the last day");
assert.strictEqual(onLeave.nextLeave?._id, "c", "next skips the one in progress");

// --- no config yet, nothing should throw ---------------------------------
const empty = computeCountdown([], null, NOW);
assert.strictEqual(empty.daysLeft, null);
assert.strictEqual(empty.percentServed, null);
assert.strictEqual(empty.nextLeave, null);

// --- expansion and totals -------------------------------------------------
assert.deepStrictEqual(expandPeriod(leave("x", "2026-08-10", "2026-08-12")),
  ["2026-08-10", "2026-08-11", "2026-08-12"]);
assert.strictEqual(expandPeriod(leave("x", "2026-08-10", "2026-08-10")).length, 1, "single day");
assert.strictEqual(countLeaveDays(periods), 5 + 8 + 3, "leave days are inclusive");

// --- duty days are not leave ---------------------------------------------
const withDuty = [...periods, leave("d", "2026-08-20", "2026-08-21", "duty")];
assert.strictEqual(statusFor("2026-08-20", withDuty, config), "duty");
assert.strictEqual(countLeaveDays(withDuty), 16, "duty excluded from leave total");
assert.strictEqual(computeCountdown(withDuty, config, NOW).nextLeave?._id, "b", "duty is not a leave");

console.log("service: all assertions passed");
