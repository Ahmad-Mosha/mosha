"use client";

import React from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { addDays, fromDayString, today, toDayString } from "../../../convex/recurrence";
import type { CalendarEvent } from "../../../convex/calendar";
import { EVENT_STYLE } from "./event-style";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Mon-first grid covering the whole month plus the days that pad the edges. */
export function monthMatrix(year: number, month: number): string[] {
  const first = new Date(year, month, 1);
  // getDay() is Sunday-first; shift so Monday starts the week.
  const lead = (first.getDay() + 6) % 7;
  const start = addDays(toDayString(first), -lead);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

function EventChip({ event }: { event: CalendarEvent }) {
  const style = EVENT_STYLE[event.kind];
  const draggable = event.kind === "task";

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.id,
    disabled: !draggable,
    data: { kind: event.kind },
  });

  return (
    <div
      ref={setNodeRef}
      {...(draggable ? { ...attributes, ...listeners } : {})}
      title={`${style.label}: ${event.title}`}
      className={`flex items-center gap-1 truncate rounded px-1 py-[1px] text-meta leading-tight
        ${style.chip} ${isDragging ? "opacity-30" : ""}
        ${draggable ? "cursor-grab touch-none active:cursor-grabbing" : ""}
        ${event.done ? "line-through opacity-55" : ""}`}
    >
      <span className={`h-1 w-1 shrink-0 rounded-full ${style.dot}`} />
      <span className="truncate">{event.title}</span>
    </div>
  );
}

interface DayCellProps {
  day: string;
  events: CalendarEvent[];
  inMonth: boolean;
  isSelected: boolean;
  onSelect: (day: string) => void;
}

function DayCell({ day, events, inMonth, isSelected, onSelect }: DayCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${day}` });
  const isToday = day === today();
  const date = fromDayString(day);
  const isWeekend = [0, 6].includes(date.getDay());

  const shown = events.slice(0, 3);
  const overflow = events.length - shown.length;

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onSelect(day)}
      aria-label={`${day}, ${events.length} items`}
      aria-current={isToday ? "date" : undefined}
      className={`group relative flex min-h-[104px] flex-col gap-1 rounded-lg border p-1.5 text-left
        transition-colors cursor-pointer
        ${isSelected ? "border-accent bg-accent-soft/50" : "border-line hover:border-line-2"}
        ${isOver ? "border-accent bg-accent-soft" : ""}
        ${!inMonth ? "opacity-40" : isWeekend ? "bg-subtle/50" : "bg-surface"}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`grid h-5 min-w-5 place-items-center rounded-full px-1 font-mono text-meta
            ${isToday
              ? "bg-accent font-bold text-accent-fg"
              : isSelected ? "font-semibold text-ink" : "text-faint"}`}
        >
          {date.getDate()}
        </span>
        {events.length > 0 && (
          <span className="font-mono text-meta text-ghost opacity-0 transition-opacity group-hover:opacity-100">
            {events.length}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-[2px] overflow-hidden">
        {shown.map((e) => (
          <EventChip key={`${e.kind}-${e.id}`} event={e} />
        ))}
        {overflow > 0 && (
          <span className="px-1 font-mono text-meta text-ghost">+{overflow} more</span>
        )}
      </div>
    </button>
  );
}

interface Props {
  year: number;
  month: number;
  eventsByDay: Record<string, CalendarEvent[]>;
  selected: string;
  onSelect: (day: string) => void;
}

export function MonthGrid({ year, month, eventsByDay, selected, onSelect }: Props) {
  const days = monthMatrix(year, month);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="px-1 font-mono text-meta font-semibold uppercase text-ghost"
          >
            {d}
          </div>
        ))}
      </div>

      <motion.div
        key={`${year}-${month}`}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-7 gap-1.5"
      >
        {days.map((day) => (
          <DayCell
            key={day}
            day={day}
            events={eventsByDay[day] || []}
            inMonth={fromDayString(day).getMonth() === month}
            isSelected={day === selected}
            onSelect={onSelect}
          />
        ))}
      </motion.div>
    </div>
  );
}
