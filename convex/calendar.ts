import { query } from "./_generated/server";
import { v } from "convex/values";
import { effectiveStatus, isRecurring } from "./recurrence";

/**
 * Everything in MOSHA that happens on a day, normalised into one shape.
 *
 * Six streams carry a date — tasks, workouts, money, journal entries, spaced
 * repetition reviews and goal deadlines — and the calendar is the only place
 * they meet. Each keeps its own kind so the grid can colour it, but the shape
 * is identical so the grid does not need to know about any of them.
 */
export type EventKind =
  | "task" | "gym" | "finance" | "journal" | "review" | "goal";

export interface CalendarEvent {
  id: string;
  kind: EventKind;
  title: string;
  date: string;
  /** Rendered as dim text after the title — amount, split, streak, etc. */
  detail?: string;
  done?: boolean;
  accent?: string;
}

export const inRange = query({
  args: { from: v.string(), to: v.string() },
  handler: async (ctx, { from, to }) => {
    const within = (d?: string) => Boolean(d && d >= from && d <= to);
    const events: CalendarEvent[] = [];

    // ponytail: whole-table scans. Personal-scale data (hundreds of rows), and
    // a month view touches every table anyway. Move to the by_date indexes with
    // range bounds if a table ever gets big enough to feel it.
    const [tasks, gym, finance, journal, problems, goals] = await Promise.all([
      ctx.db.query("tasks").collect(),
      ctx.db.query("gym_sessions").collect(),
      ctx.db.query("finance_records").collect(),
      ctx.db.query("journal_entries").collect(),
      ctx.db.query("problems").collect(),
      ctx.db.query("major_life_goals").collect(),
    ]);

    for (const t of tasks) {
      if (!within(t.dueDate)) continue;
      events.push({
        id: t._id,
        kind: "task",
        title: t.title,
        date: t.dueDate!,
        detail: t.dueTime,
        done: effectiveStatus(t) === "done",
        accent: isRecurring(t) ? "repeat" : t.priority,
      });
    }

    for (const g of gym) {
      if (!within(g.date)) continue;
      events.push({
        id: g._id,
        kind: "gym",
        title: g.title || g.split,
        date: g.date,
        detail: g.durationMinutes ? `${g.durationMinutes}m` : undefined,
      });
    }

    for (const f of finance) {
      if (!within(f.date)) continue;
      events.push({
        id: f._id,
        kind: "finance",
        title: f.title,
        date: f.date,
        detail: `${f.type === "expense" ? "−" : "+"}${f.amount}`,
        accent: f.type,
      });
    }

    for (const j of journal) {
      if (!within(j.date)) continue;
      events.push({ id: j._id, kind: "journal", title: j.title, date: j.date });
    }

    // Spaced repetition: the schema has always carried a review date, and this
    // is the first screen that surfaces it.
    for (const p of problems) {
      if (!within(p.nextReviewDate)) continue;
      events.push({
        id: p._id,
        kind: "review",
        title: p.title,
        date: p.nextReviewDate!,
        detail: p.pattern,
      });
    }

    for (const g of goals) {
      if (!within(g.targetDate)) continue;
      events.push({
        id: g._id,
        kind: "goal",
        title: g.title,
        date: g.targetDate!,
        detail: `${g.progress}%`,
        done: g.status === "completed",
      });
    }

    return events;
  },
});
