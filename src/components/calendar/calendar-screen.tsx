"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useMoshaStore, type ModuleId } from "@/lib/store";
import { addDays, fromDayString, today, toDayString } from "../../../convex/recurrence";
import type { CalendarEvent } from "../../../convex/calendar";
import { MonthGrid, monthMatrix } from "./month-grid";
import { DayPanel } from "./day-panel";
import { EVENT_ORDER, EVENT_STYLE } from "./event-style";

const MONTH_LABEL = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });

/** Which module a stream belongs to, for the day panel's jump links. */
const KIND_TO_MODULE: Record<string, ModuleId> = {
  task: "tasks", gym: "gym", finance: "finance",
  journal: "journal", review: "problems", goal: "goals",
};

export function CalendarScreen() {
  const setActiveModule = useMoshaStore((s) => s.setActiveModule);
  const updateTask = useMutation(api.tasks.update);

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selected, setSelected] = useState(today());
  const [dragging, setDragging] = useState<CalendarEvent | null>(null);

  // The grid always paints six weeks, so ask for exactly that span.
  const days = useMemo(() => monthMatrix(cursor.year, cursor.month), [cursor]);
  const events = useQuery(api.calendar.inRange, {
    from: days[0],
    to: days[days.length - 1],
  });

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of events ?? []) (map[e.date] ||= []).push(e);
    return map;
  }, [events]);

  const monthEvents = useMemo(
    () => (events ?? []).filter((e) => fromDayString(e.date).getMonth() === cursor.month),
    [events, cursor.month]
  );

  const shift = (delta: number) => {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };

  const goToday = () => {
    const d = new Date();
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
    setSelected(today());
  };

  // Arrow keys walk days, so a month can be scanned without the mouse.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const step =
        e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1
        : e.key === "ArrowUp" ? -7 : e.key === "ArrowDown" ? 7 : 0;

      if (step) {
        e.preventDefault();
        const next = addDays(selected, step);
        setSelected(next);
        const d = fromDayString(next);
        if (d.getMonth() !== cursor.month) {
          setCursor({ year: d.getFullYear(), month: d.getMonth() });
        }
      } else if (e.key === "t") {
        e.preventDefault();
        goToday();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, cursor.month]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setDragging(null);
    if (!over) return;

    const overId = String(over.id);
    if (!overId.startsWith("day:")) return;
    const target = overId.slice(4);

    const moved = (events ?? []).find((e) => e.id === active.id);
    if (!moved || moved.date === target) return;

    try {
      await updateTask({ id: active.id as any, dueDate: target });
      toast.success(`Moved to ${target}`);
    } catch {
      toast.error("Could not reschedule");
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) =>
        setDragging((events ?? []).find((e) => e.id === active.id) ?? null)
      }
      onDragCancel={() => setDragging(null)}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <h1 className="font-serif text-title sm:text-display font-bold text-ink">
              {MONTH_LABEL.format(new Date(cursor.year, cursor.month, 1))}
            </h1>
            <p className="text-label text-faint mt-0.5">
              Every dated thing in the system, on one grid. Drag a task to move it.
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => shift(-1)}
              title="Previous month"
              className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted
                         transition-colors hover:bg-subtle hover:text-ink cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goToday}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5
                         text-label font-medium text-muted transition-colors
                         hover:bg-subtle hover:text-ink cursor-pointer"
              title="Jump to today (t)"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Today
            </button>
            <button
              onClick={() => shift(1)}
              title="Next month"
              className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted
                         transition-colors hover:bg-subtle hover:text-ink cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* A legend doubling as this month's tally per stream. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {EVENT_ORDER.map((kind) => {
            const count = monthEvents.filter((e) => e.kind === kind).length;
            const style = EVENT_STYLE[kind];
            return (
              <span
                key={kind}
                className={`flex items-center gap-1.5 font-mono text-meta ${
                  count ? "text-muted" : "text-ghost"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${style.dot} ${count ? "" : "opacity-30"}`} />
                {style.label}
                <span className="text-ghost">{count}</span>
              </span>
            );
          })}
        </div>

        <div className="flex flex-col gap-5 lg:flex-row">
          <div className="min-w-0 flex-1">
            <MonthGrid
              year={cursor.year}
              month={cursor.month}
              eventsByDay={eventsByDay}
              selected={selected}
              onSelect={setSelected}
            />
          </div>

          <DayPanel
            day={selected}
            events={eventsByDay[selected] || []}
            onJump={(kind) => setActiveModule(KIND_TO_MODULE[kind] ?? "tasks")}
          />
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.22,1,0.36,1)" }}>
        {dragging && (
          <div className="rotate-2 rounded-md border border-accent bg-surface-2 px-2 py-1 shadow-lg">
            <span className="text-meta text-ink">{dragging.title}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
