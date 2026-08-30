"use client";

import React, { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Home, Flag, Shield } from "lucide-react";
import { addDays, fromDayString, today, toDayString } from "../../../convex/recurrence";
import type { CalendarEvent } from "../../../convex/calendar";
import type { DayStatus } from "@/lib/service";
import { EVENT_STYLE } from "./event-style";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Mon-first grid covering the month plus the days that pad the edges. */
export function monthMatrix(year: number, month: number): string[] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7; // getDay() is Sunday-first
  const start = addDays(toDayString(first), -lead);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/**
 * Service status paints the cell; everything else sits on top of it. Home days
 * should be visible from across the room — that is the whole point of the
 * screen — so they get a filled tint rather than a marker.
 */
const STATUS_STYLE: Record<DayStatus, string> = {
  home: "bg-success-tint border-success/35",
  duty: "bg-warn-tint border-warn/35",
  base: "bg-surface border-line",
  discharged: "bg-accent-soft border-accent/30",
};

interface DayCellProps {
  day: string;
  events: CalendarEvent[];
  status: DayStatus;
  inMonth: boolean;
  isSelected: boolean;
  isRangeEnd: boolean;
  inRange: boolean;
  isDischarge: boolean;
  onSelect: (day: string, extend: boolean) => void;
}

const DayCell = memo(function DayCell({
  day, events, status, inMonth, isSelected, isRangeEnd, inRange, isDischarge, onSelect,
}: DayCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${day}` });
  const isToday = day === today();
  const date = fromDayString(day);

  // At most one dot per stream keeps a busy day readable at this size.
  const kinds = Array.from(new Set(events.map((e) => e.kind))).slice(0, 5);

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={(e) => onSelect(day, e.shiftKey)}
      aria-label={`${day}, ${status}, ${events.length} items`}
      aria-current={isToday ? "date" : undefined}
      className={`relative flex min-h-0 flex-col items-center justify-center gap-1 rounded-lg border
        transition-[background-color,border-color] duration-150 cursor-pointer
        ${STATUS_STYLE[status]}
        ${!inMonth ? "opacity-35" : ""}
        ${inRange ? "ring-1 ring-inset ring-accent/40" : ""}
        ${isSelected || isRangeEnd ? "ring-2 ring-inset ring-accent" : ""}
        ${isOver ? "ring-2 ring-inset ring-accent bg-accent-soft" : ""}
        hover:border-line-2`}
    >
      {status === "home" && (
        <Home className="absolute left-1 top-1 h-2.5 w-2.5 text-success opacity-70" />
      )}
      {status === "duty" && (
        <Shield className="absolute left-1 top-1 h-2.5 w-2.5 text-warn opacity-70" />
      )}
      {isDischarge && (
        <Flag className="absolute left-1 top-1 h-3 w-3 text-accent" />
      )}

      <span
        className={`grid h-6 w-6 place-items-center rounded-full font-mono text-label
          ${isToday
            ? "bg-accent font-bold text-accent-fg"
            : status === "home"
              ? "font-semibold text-success"
              : "text-ink-2"}`}
      >
        {date.getDate()}
      </span>

      <span className="flex h-1.5 items-center gap-[3px]">
        {kinds.map((k) => (
          <span key={k} className={`h-1.5 w-1.5 rounded-full ${EVENT_STYLE[k].dot}`} />
        ))}
      </span>
    </button>
  );
});

interface Props {
  year: number;
  month: number;
  eventsByDay: Record<string, CalendarEvent[]>;
  statusByDay: (day: string) => DayStatus;
  selected: string;
  rangeEnd: string | null;
  dischargeDate?: string;
  onSelect: (day: string, extend: boolean) => void;
}

export function MonthGrid({
  year, month, eventsByDay, statusByDay, selected, rangeEnd, dischargeDate, onSelect,
}: Props) {
  const days = monthMatrix(year, month);
  const lo = rangeEnd && rangeEnd < selected ? rangeEnd : selected;
  const hi = rangeEnd && rangeEnd < selected ? selected : rangeEnd;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1">
      <div className="grid shrink-0 grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center font-mono text-meta font-semibold uppercase text-ghost">
            {d}
          </div>
        ))}
      </div>

      {/*
        Six fixed rows filling the remaining height, so the month always fits
        the viewport without scrolling. The grid is never re-keyed on a month
        change — re-mounting 42 droppables was what made navigation stutter.
      */}
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 gap-1">
        {days.map((day) => (
          <DayCell
            key={day}
            day={day}
            events={eventsByDay[day] || []}
            status={statusByDay(day)}
            inMonth={fromDayString(day).getMonth() === month}
            isSelected={day === selected}
            isRangeEnd={day === rangeEnd}
            inRange={Boolean(hi && day > lo && day < hi)}
            isDischarge={day === dischargeDate}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
