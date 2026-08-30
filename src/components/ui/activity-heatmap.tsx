"use client";

import React, { useMemo } from "react";
import { addDays, fromDayString, today, toDayString } from "../../../convex/recurrence";

/**
 * A GitHub-style contribution grid, deliberately generic.
 *
 * Every subsystem has something worth counting per day — problems solved,
 * sessions trained, notes written, tasks finished — and they are all the same
 * shape: a map of day to count. So this is one shared component each screen
 * feeds, not six near-identical ones. Give it `counts` and a colour ramp; it
 * knows nothing about what it is showing.
 */

export type HeatLevel = 0 | 1 | 2 | 3 | 4;

/** Tailwind classes per level. Index 0 is the empty cell. */
export const HEAT_RAMPS = {
  accent: ["bg-subtle-2", "bg-accent/25", "bg-accent/45", "bg-accent/70", "bg-accent"],
  success: ["bg-subtle-2", "bg-success/25", "bg-success/45", "bg-success/70", "bg-success"],
  info: ["bg-subtle-2", "bg-info/25", "bg-info/45", "bg-info/70", "bg-info"],
  warn: ["bg-subtle-2", "bg-warn/25", "bg-warn/45", "bg-warn/70", "bg-warn"],
  shipped: ["bg-subtle-2", "bg-shipped/25", "bg-shipped/45", "bg-shipped/70", "bg-shipped"],
} as const;

export type RampName = keyof typeof HEAT_RAMPS;

/**
 * Bucket a count into a level. Thresholds scale with the busiest day so the
 * grid stays readable whether the peak is 3 or 300 — a fixed scale washes out
 * for heavy users and saturates for light ones.
 */
function levelFor(count: number, max: number): HeatLevel {
  if (count <= 0) return 0;
  if (max <= 1) return 4;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

/** Longest run of consecutive days with any activity, ending today or yesterday. */
export function currentStreak(counts: Record<string, number>, from = today()): number {
  let streak = 0;
  let cursor = from;
  // Today not being logged yet should not break a run, so allow one day of slack.
  if (!counts[cursor]) cursor = addDays(cursor, -1);
  while (counts[cursor] > 0) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function longestStreak(counts: Record<string, number>): number {
  const days = Object.keys(counts).filter((d) => counts[d] > 0).sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of days) {
    run = previous && addDays(previous, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return best;
}

interface Props {
  /** Day (YYYY-MM-DD) to count. Days absent are treated as zero. */
  counts: Record<string, number>;
  /** How many weeks back to show. */
  weeks?: number;
  ramp?: RampName;
  /** Rendered in the tooltip: "3 problems". */
  unit?: string;
  onSelectDay?: (day: string) => void;
  className?: string;
}

const MONTH = new Intl.DateTimeFormat(undefined, { month: "short" });

export function ActivityHeatmap({
  counts,
  weeks = 26,
  ramp = "accent",
  unit = "",
  onSelectDay,
  className = "",
}: Props) {
  const { columns, max, monthMarks } = useMemo(() => {
    const end = today();
    // Wind back to the Monday that starts the earliest visible week, so every
    // column is a whole week and the weekday rows line up.
    const endDow = (fromDayString(end).getDay() + 6) % 7;
    const lastMonday = addDays(end, -endDow);
    const start = addDays(lastMonday, -(weeks - 1) * 7);

    const cols: string[][] = [];
    const marks: { col: number; label: string }[] = [];
    let seenMonth = -1;

    for (let w = 0; w < weeks; w++) {
      const week: string[] = [];
      for (let d = 0; d < 7; d++) week.push(addDays(start, w * 7 + d));
      cols.push(week);

      const m = fromDayString(week[0]).getMonth();
      if (m !== seenMonth) {
        seenMonth = m;
        marks.push({ col: w, label: MONTH.format(fromDayString(week[0])) });
      }
    }

    const peak = Math.max(0, ...Object.values(counts));
    return { columns: cols, max: peak, monthMarks: marks };
  }, [counts, weeks]);

  const ramps = HEAT_RAMPS[ramp];
  const now = today();

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <div className="inline-flex min-w-full flex-col gap-1">
        <div className="flex gap-[3px] pl-0.5">
          {columns.map((_, i) => {
            const mark = monthMarks.find((m) => m.col === i);
            return (
              <span key={i} className="w-[11px] font-mono text-meta text-ghost">
                {mark ? mark.label : ""}
              </span>
            );
          })}
        </div>

        <div className="flex gap-[3px]">
          {columns.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => {
                const count = counts[day] ?? 0;
                const future = day > now;
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={future || !onSelectDay}
                    onClick={() => onSelectDay?.(day)}
                    title={
                      future
                        ? day
                        : `${count} ${unit}${count === 1 ? "" : unit ? "s" : ""} · ${day}`
                    }
                    aria-label={`${day}: ${count} ${unit}`}
                    className={`h-[11px] w-[11px] rounded-[3px] transition-transform
                      ${future ? "bg-subtle opacity-40" : ramps[levelFor(count, max)]}
                      ${day === now ? "ring-1 ring-accent ring-offset-1 ring-offset-canvas" : ""}
                      ${onSelectDay && !future ? "cursor-pointer hover:scale-125" : ""}`}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1.5 pt-0.5">
          <span className="font-mono text-meta text-ghost">Less</span>
          {ramps.map((cls, i) => (
            <span key={i} className={`h-[11px] w-[11px] rounded-[3px] ${cls}`} />
          ))}
          <span className="font-mono text-meta text-ghost">More</span>
        </div>
      </div>
    </div>
  );
}
