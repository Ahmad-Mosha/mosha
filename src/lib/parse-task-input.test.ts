/**
 * Run with: node --experimental-strip-types src/lib/parse-task-input.test.ts
 *
 * Fixed "now" so the date cases stay stable: 2026-08-29 is a Saturday.
 */
import assert from "node:assert";
import { parseTaskInput } from "./parse-task-input.ts";

const NOW = new Date(2026, 7, 29, 9, 0, 0); // 29 Aug 2026, 09:00 local
const p = (s: string) => parseTaskInput(s, NOW);

// --- plain text is left alone ---------------------------------------------
assert.deepStrictEqual(p("buy milk").title, "buy milk");
assert.strictEqual(p("buy milk").dueDate, undefined);

// --- dates ----------------------------------------------------------------
assert.strictEqual(p("ship release tomorrow").dueDate, "2026-08-30");
assert.strictEqual(p("ship release tomorrow").title, "ship release");
assert.strictEqual(p("standup today").dueDate, "2026-08-29");

const withTime = p("email dana tomorrow 5pm");
assert.strictEqual(withTime.dueDate, "2026-08-30");
assert.strictEqual(withTime.dueTime, "17:00");
assert.strictEqual(withTime.title, "email dana");

// --- priority -------------------------------------------------------------
assert.strictEqual(p("fix prod !1").priority, "p1_urgent");
assert.strictEqual(p("fix prod !high").priority, "p1_urgent");
assert.strictEqual(p("tidy inbox !low").priority, "p3_low");
assert.strictEqual(p("fix prod !1").title, "fix prod", "priority token removed from title");

// --- module, including aliases --------------------------------------------
assert.strictEqual(p("two sum #leetcode").module, "problems");
assert.strictEqual(p("squats #gym").module, "gym");
assert.strictEqual(p("read paper #learning").module, "learning");
assert.strictEqual(p("two sum #leetcode").title, "two sum");
assert.strictEqual(p("note #notarealmodule").module, undefined, "unknown tag stays in title");
assert.ok(p("note #notarealmodule").title.includes("#notarealmodule"));

// --- recurrence -----------------------------------------------------------
assert.strictEqual(p("meditate *daily").recurrence, "daily");
assert.strictEqual(p("standup every weekday").recurrence, "weekdays");
assert.strictEqual(p("review budget every month").recurrence, "monthly");
assert.strictEqual(p("meditate *daily").title, "meditate");

// --- everything at once ---------------------------------------------------
const full = p("email dana tomorrow 5pm !1 #career");
assert.strictEqual(full.title, "email dana");
assert.strictEqual(full.dueDate, "2026-08-30");
assert.strictEqual(full.dueTime, "17:00");
assert.strictEqual(full.priority, "p1_urgent");
assert.strictEqual(full.module, "career");

// --- a line of pure metadata still yields a usable task -------------------
assert.ok(p("!1").title.length > 0, "never returns an empty title");

console.log("parse-task-input: all assertions passed");
