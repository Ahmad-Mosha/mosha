import * as chrono from "chrono-node";
import { toDayString, type Recurrence } from "../../convex/recurrence";

/**
 * Pull structure out of a single line of typing, the way Todoist does.
 *
 *   "email dana tomorrow 5pm !1 #career *daily"
 *     -> title "email dana", due tomorrow at 17:00, urgent, career, repeats daily
 *
 * Everything is optional and unrecognised text stays in the title, so the box
 * never refuses input — the worst case is a task named exactly what you typed.
 */

export interface ParsedTask {
  title: string;
  dueDate?: string;
  dueTime?: string;
  priority?: string;
  module?: string;
  recurrence?: Recurrence;
  /** Spans consumed from the raw input, for highlighting what was understood. */
  matched: string[];
}

const PRIORITY_TOKENS: Record<string, string> = {
  "1": "p1_urgent",
  high: "p1_urgent",
  urgent: "p1_urgent",
  "2": "p2_medium",
  med: "p2_medium",
  medium: "p2_medium",
  "3": "p3_low",
  low: "p3_low",
};

const MODULES = [
  "general", "problems", "learning", "gym", "career",
  "goals", "finance", "personal", "projects",
];

/** Aliases worth accepting because they are what you would actually type. */
const MODULE_ALIASES: Record<string, string> = {
  leetcode: "problems",
  dsa: "problems",
  algo: "problems",
  cs: "learning",
  study: "learning",
  work: "career",
  job: "career",
  money: "finance",
  workout: "gym",
  lift: "gym",
  life: "personal",
};

const RECURRENCE_TOKENS: Record<string, Recurrence> = {
  daily: "daily",
  everyday: "daily",
  day: "daily",
  weekdays: "weekdays",
  weekday: "weekdays",
  weekly: "weekly",
  week: "weekly",
  monthly: "monthly",
  month: "monthly",
};

export function parseTaskInput(raw: string, now = new Date()): ParsedTask {
  let text = raw;
  const matched: string[] = [];
  const out: ParsedTask = { title: "", matched };

  const take = (token: string) => {
    matched.push(token);
    text = text.replace(token, " ");
  };

  // !1 / !high  — priority
  const priority = text.match(/(^|\s)!([a-z0-9]+)/i);
  if (priority && PRIORITY_TOKENS[priority[2].toLowerCase()]) {
    out.priority = PRIORITY_TOKENS[priority[2].toLowerCase()];
    take(priority[0]);
  }

  // #career — module
  const mod = text.match(/(^|\s)#([a-z]+)/i);
  if (mod) {
    const key = mod[2].toLowerCase();
    const resolved = MODULES.includes(key) ? key : MODULE_ALIASES[key];
    if (resolved) {
      out.module = resolved;
      take(mod[0]);
    }
  }

  // *daily / every week — recurrence
  const star = text.match(/(^|\s)\*([a-z]+)/i);
  if (star && RECURRENCE_TOKENS[star[2].toLowerCase()]) {
    out.recurrence = RECURRENCE_TOKENS[star[2].toLowerCase()];
    take(star[0]);
  } else {
    const every = text.match(/(^|\s)every\s+(day|weekday|weekdays|week|month)\b/i);
    if (every) {
      out.recurrence = RECURRENCE_TOKENS[every[2].toLowerCase()];
      take(every[0]);
    }
  }

  // Dates last: chrono is greedy and would otherwise swallow "1" from "!1".
  const results = chrono.parse(text, now, { forwardDate: true });
  if (results.length > 0) {
    const r = results[0];
    const d = r.start.date();
    out.dueDate = toDayString(d);
    if (r.start.isCertain("hour")) {
      out.dueTime = `${`${d.getHours()}`.padStart(2, "0")}:${`${d.getMinutes()}`.padStart(2, "0")}`;
    }
    take(r.text);
  }

  out.title = text.replace(/\s+/g, " ").trim();

  // Never hand back an empty task just because the line was only metadata.
  if (!out.title) out.title = raw.trim();

  return out;
}
