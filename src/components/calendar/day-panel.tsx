"use client";

import React, { useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Home, Plus, Shield, Trash2 } from "lucide-react";
import { parseTaskInput } from "@/lib/parse-task-input";
import { fromDayString, today } from "../../../convex/recurrence";
import type { CalendarEvent, EventKind } from "../../../convex/calendar";
import { periodFor, type ServicePeriod } from "@/lib/service";
import { EVENT_ORDER, EVENT_STYLE } from "./event-style";

const LONG = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" });
const SHORT = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

interface Props {
  day: string;
  rangeEnd: string | null;
  events: CalendarEvent[];
  periods: ServicePeriod[];
  onJump: (kind: string) => void;
  onClearRange: () => void;
}

export function DayPanel({
  day, rangeEnd, events, periods, onJump, onClearRange,
}: Props) {
  const createTask = useMutation(api.tasks.create);
  const addPeriod = useMutation(api.service.addPeriod);
  const removePeriod = useMutation(api.service.removePeriod);

  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const grouped = useMemo(() => {
    const map = new Map<EventKind, CalendarEvent[]>();
    for (const e of events) {
      if (!map.has(e.kind)) map.set(e.kind, []);
      map.get(e.kind)!.push(e);
    }
    return EVENT_ORDER.filter((k) => map.has(k)).map((k) => [k, map.get(k)!] as const);
  }, [events]);

  const covering = periodFor(day, periods);
  const [lo, hi] = rangeEnd
    ? rangeEnd < day ? [rangeEnd, day] : [day, rangeEnd]
    : [day, day];
  const spanDays =
    Math.round((fromDayString(hi).getTime() - fromDayString(lo).getTime()) / 86_400_000) + 1;

  const mark = async (kind: "home" | "duty") => {
    try {
      await addPeriod({ kind, startDate: lo, endDate: hi });
      toast.success(
        kind === "home"
          ? `Marked ${spanDays} ${spanDays === 1 ? "day" : "days"} home`
          : `Marked ${spanDays} ${spanDays === 1 ? "day" : "days"} on duty`
      );
      onClearRange();
    } catch {
      toast.error("Could not save that period");
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || saving) return;
    setSaving(true);
    try {
      const parsed = parseTaskInput(draft);
      await createTask({
        title: parsed.title,
        priority: parsed.priority ?? "p2_medium",
        module: parsed.module ?? "general",
        dueDate: day,
        dueTime: parsed.dueTime,
        recurrence: parsed.recurrence ?? "none",
      });
      setDraft("");
      inputRef.current?.focus();
    } catch {
      toast.error("Could not add task");
    } finally {
      setSaving(false);
    }
  };

  const date = fromDayString(day);
  const isToday = day === today();
  const diff = Math.round((date.getTime() - fromDayString(today()).getTime()) / 86_400_000);
  const relative =
    diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : diff === -1 ? "Yesterday"
    : diff > 0 ? `in ${diff} days` : `${-diff} days ago`;

  return (
    <aside className="flex min-h-0 w-full flex-col gap-3 lg:w-72">
      <header className="shrink-0 space-y-0.5">
        <div className="flex items-baseline gap-2">
          <h2 className="font-serif text-title text-ink">{date.getDate()}</h2>
          <span className="truncate text-label text-muted">{LONG.format(date)}</span>
        </div>
        <span className={`font-mono text-meta uppercase ${isToday ? "font-semibold text-accent" : "text-ghost"}`}>
          {relative}
        </span>
      </header>

      {/* --- Service marking ------------------------------------------------ */}
      <div className="shrink-0 space-y-1.5 rounded-xl border border-line bg-surface p-2.5">
        {covering ? (
          <div className="flex items-center justify-between gap-2">
            <span
              className={`flex items-center gap-1.5 text-label font-medium ${
                covering.kind === "duty" ? "text-warn" : "text-success"
              }`}
            >
              {covering.kind === "duty" ? <Shield className="h-3.5 w-3.5" /> : <Home className="h-3.5 w-3.5" />}
              {covering.kind === "duty" ? "On duty" : "Home"}
              <span className="font-mono text-meta text-ghost">
                {SHORT.format(fromDayString(covering.startDate))}–
                {SHORT.format(fromDayString(covering.endDate))}
              </span>
            </span>
            <button
              onClick={async () => {
                await removePeriod({ id: covering._id as any });
                toast.success("Period removed");
              }}
              title="Remove this period"
              className="grid h-6 w-6 place-items-center rounded text-ghost hover:bg-danger-tint hover:text-danger cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <>
            <p className="font-mono text-meta uppercase text-ghost">
              {rangeEnd
                ? `${spanDays} ${spanDays === 1 ? "day" : "days"} selected`
                : "At base · shift-click to pick a range"}
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={() => mark("home")}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-success-tint
                           px-2 py-1.5 text-label font-semibold text-success
                           transition-opacity hover:opacity-80 cursor-pointer"
              >
                <Home className="h-3.5 w-3.5" /> Home
              </button>
              <button
                onClick={() => mark("duty")}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-warn-tint px-2 py-1.5
                           text-label font-semibold text-warn transition-opacity hover:opacity-80 cursor-pointer"
                title="Mark as duty"
              >
                <Shield className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        )}
      </div>

      <form onSubmit={add} className="flex shrink-0 items-center gap-1.5">
        <div className="relative flex-1">
          <Plus className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ghost" />
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add to this day…"
            className="w-full rounded-lg border border-line bg-surface py-1.5 pl-8 pr-2 text-label
                       text-ink outline-none transition-colors placeholder:text-ghost
                       focus:border-accent focus:bg-surface-2"
          />
        </div>
        <button
          type="submit"
          disabled={!draft.trim() || saving}
          className="rounded-lg bg-accent px-3 py-1.5 text-label font-semibold text-accent-fg
                     transition-colors hover:bg-accent-hover disabled:opacity-40 cursor-pointer"
        >
          Add
        </button>
      </form>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-0.5">
        {events.length === 0 ? (
          <p className="py-8 text-center text-label text-ghost">Nothing scheduled.</p>
        ) : (
          grouped.map(([kind, list]) => {
            const style = EVENT_STYLE[kind];
            const Icon = style.icon;
            return (
              <section key={kind} className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => onJump(kind)}
                  className="group/head flex w-full items-center gap-1.5 text-left cursor-pointer"
                >
                  <Icon className={`h-3 w-3 ${style.text}`} />
                  <span className="font-mono text-meta font-semibold uppercase text-faint transition-colors group-hover/head:text-ink">
                    {style.label}
                  </span>
                  <span className="font-mono text-meta text-ghost">{list.length}</span>
                  <span className="h-px flex-1 bg-line" />
                </button>

                {list.map((e) => (
                  <div
                    key={`${e.kind}-${e.id}`}
                    className="flex items-start gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5"
                  >
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-label ${e.done ? "text-ghost line-through" : "text-ink"}`}>
                        {e.title}
                      </p>
                      {e.detail && <p className="font-mono text-meta text-faint">{e.detail}</p>}
                    </div>
                  </div>
                ))}
              </section>
            );
          })
        )}
      </div>
    </aside>
  );
}
