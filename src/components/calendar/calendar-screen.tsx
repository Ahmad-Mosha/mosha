"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useMoshaStore, type ModuleId } from "@/lib/store";
import { addDays, fromDayString, today } from "../../../convex/recurrence";
import type { CalendarEvent } from "../../../convex/calendar";
import { computeCountdown, statusFor, type ServicePeriod } from "@/lib/service";
import { MonthGrid, monthMatrix } from "./month-grid";
import { DayPanel } from "./day-panel";
import { ServiceHeader } from "./service-header";

const MONTH_LABEL = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });

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
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [dragging, setDragging] = useState<CalendarEvent | null>(null);

  const days = useMemo(() => monthMatrix(cursor.year, cursor.month), [cursor]);
  const events = useQuery(api.calendar.inRange, { from: days[0], to: days[days.length - 1] });
  const periods = (useQuery(api.service.listPeriods) ?? []) as unknown as ServicePeriod[];
  const config = useQuery(api.service.getConfig) ?? null;

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of events ?? []) (map[e.date] ||= []).push(e);
    return map;
  }, [events]);

  // Recomputed per cell, so keep it cheap and stable across renders.
  const statusByDay = useCallback(
    (day: string) => statusFor(day, periods, config),
    [periods, config]
  );

  const countdown = useMemo(
    () => computeCountdown(periods, config),
    [periods, config]
  );

  const shift = useCallback((delta: number) => {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }, []);

  const goToday = useCallback(() => {
    const d = new Date();
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
    setSelected(today());
    setRangeEnd(null);
  }, []);

  const handleSelect = useCallback((day: string, extend: boolean) => {
    if (extend) setRangeEnd(day);
    else {
      setSelected(day);
      setRangeEnd(null);
    }
  }, []);

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
        setRangeEnd(null);
        const d = fromDayString(next);
        if (d.getMonth() !== cursor.month) {
          setCursor({ year: d.getFullYear(), month: d.getMonth() });
        }
      } else if (e.key === "t") {
        e.preventDefault();
        goToday();
      } else if (e.key === "Escape") {
        setRangeEnd(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, cursor.month, goToday]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

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
      {/* Fills the viewport exactly — a calendar you have to scroll is a
          calendar you cannot read at a glance. */}
      <div className="flex h-full min-h-0 flex-col gap-3 px-6 py-4">
        <ServiceHeader
          countdown={countdown}
          dischargeDate={config?.dischargeDate}
          serviceStartDate={config?.serviceStartDate}
        />

        <div className="flex shrink-0 items-center justify-between gap-3">
          <h1 className="font-serif text-title text-ink">
            {MONTH_LABEL.format(new Date(cursor.year, cursor.month, 1))}
          </h1>

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
              title="Jump to today (t)"
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5
                         text-label font-medium text-muted transition-colors
                         hover:bg-subtle hover:text-ink cursor-pointer"
            >
              <CalendarDays className="h-3.5 w-3.5" /> Today
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

        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
          <MonthGrid
            year={cursor.year}
            month={cursor.month}
            eventsByDay={eventsByDay}
            statusByDay={statusByDay}
            selected={selected}
            rangeEnd={rangeEnd}
            dischargeDate={config?.dischargeDate}
            onSelect={handleSelect}
          />

          <DayPanel
            day={selected}
            rangeEnd={rangeEnd}
            events={eventsByDay[selected] || []}
            periods={periods}
            onJump={(kind) => setActiveModule(KIND_TO_MODULE[kind] ?? "tasks")}
            onClearRange={() => setRangeEnd(null)}
          />
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 160, easing: "cubic-bezier(0.22,1,0.36,1)" }}>
        {dragging && (
          <div className="rotate-2 rounded-md border border-accent bg-surface-2 px-2 py-1 shadow-lg">
            <span className="text-meta text-ink">{dragging.title}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
