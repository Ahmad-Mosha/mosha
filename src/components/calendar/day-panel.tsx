"use client";

import React, { useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { parseTaskInput } from "@/lib/parse-task-input";
import { fromDayString, today } from "../../../convex/recurrence";
import type { CalendarEvent, EventKind } from "../../../convex/calendar";
import { EVENT_ORDER, EVENT_STYLE } from "./event-style";
import { listContainer, listItem } from "@/lib/motion";

const LONG_DATE = new Intl.DateTimeFormat(undefined, {
  weekday: "long", day: "numeric", month: "long",
});

interface Props {
  day: string;
  events: CalendarEvent[];
  onJump: (module: string) => void;
}

/**
 * The right-hand rail: everything on the selected day, grouped by stream, with
 * a quick-add that files a task onto that exact date. This is what makes the
 * calendar a place you *do* things rather than only look at them.
 */
export function DayPanel({ day, events, onJump }: Props) {
  const createTask = useMutation(api.tasks.create);
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

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || saving) return;
    setSaving(true);
    try {
      // The typed line can still carry !priority and #module; the date comes
      // from the day you clicked, which is the whole point of adding here.
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
  const relative = (() => {
    const diff = Math.round(
      (date.getTime() - fromDayString(today()).getTime()) / 86_400_000
    );
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff === -1) return "Yesterday";
    return diff > 0 ? `in ${diff} days` : `${-diff} days ago`;
  })();

  return (
    <aside className="flex h-full w-full flex-col gap-3 lg:w-80">
      <header className="space-y-0.5">
        <div className="flex items-baseline gap-2">
          <h2 className="font-serif text-title text-ink">{date.getDate()}</h2>
          <span className="text-label text-muted">{LONG_DATE.format(date)}</span>
        </div>
        <span
          className={`font-mono text-meta uppercase ${
            isToday ? "text-accent font-semibold" : "text-ghost"
          }`}
        >
          {relative}
        </span>
      </header>

      <form onSubmit={add} className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <Plus className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ghost" />
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add to this day…"
            className="w-full rounded-lg border border-line bg-surface py-1.5 pl-8 pr-2
                       text-label text-ink outline-none transition-colors
                       placeholder:text-ghost focus:border-accent focus:bg-surface-2"
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

      <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
        {events.length === 0 ? (
          <p className="py-10 text-center text-label text-ghost">
            Nothing on this day.
          </p>
        ) : (
          <motion.div
            className="space-y-4"
            variants={listContainer}
            initial="initial"
            animate="animate"
          >
            <AnimatePresence initial={false}>
              {grouped.map(([kind, list]) => {
                const style = EVENT_STYLE[kind];
                const Icon = style.icon;
                return (
                  <motion.section key={kind} layout variants={listItem} className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => onJump(kind)}
                      className="flex w-full items-center gap-1.5 text-left cursor-pointer group/head"
                    >
                      <Icon className={`h-3 w-3 ${style.text}`} />
                      <span className="font-mono text-meta font-semibold uppercase text-faint
                                       group-hover/head:text-ink transition-colors">
                        {style.label}
                      </span>
                      <span className="font-mono text-meta text-ghost">{list.length}</span>
                      <span className="h-px flex-1 bg-line" />
                    </button>

                    {list.map((e) => (
                      <div
                        key={`${e.kind}-${e.id}`}
                        className="flex items-start gap-2 rounded-lg border border-line
                                   bg-surface px-2.5 py-1.5"
                      >
                        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-label ${
                              e.done ? "text-ghost line-through" : "text-ink"
                            }`}
                          >
                            {e.title}
                          </p>
                          {e.detail && (
                            <p className="font-mono text-meta text-faint">{e.detail}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </motion.section>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </aside>
  );
}
