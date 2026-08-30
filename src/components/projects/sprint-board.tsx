"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import {
  Check, ChevronRight, CircleDot, Inbox, Play, Plus, Target, Trash2,
} from "lucide-react";
import { Select } from "@/components/ui/select";
import { LabelChips } from "./task-composer";
import { today } from "../../../convex/recurrence";

const SHORT = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });
const fmt = (d?: string) => (d ? SHORT.format(new Date(d)) : null);

const STATE: Record<string, { label: string; chip: string }> = {
  active: { label: "Running", chip: "bg-success-tint text-success" },
  planned: { label: "Planned", chip: "bg-subtle-2 text-muted" },
  done: { label: "Done", chip: "bg-shipped-tint text-shipped" },
};

export interface Sprint {
  _id: string;
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  taskCount: number;
  doneCount: number;
  progress: number;
  daysLeft: number | null;
}

/**
 * Sprints as full-width stacked bands, the way a backlog actually reads.
 *
 * They were a narrow column pinned beside the board, which left both cramped
 * and made a sprint's own tasks invisible. Each sprint now owns a full row it
 * expands into, with the backlog as the last band — so planning is one
 * vertical scan and moving work is a dropdown, not a hunt.
 */
export function SprintSections({
  projectId, sprints, tasks,
}: {
  projectId: string;
  sprints: Sprint[];
  tasks: any[];
}) {
  const createSprint = useMutation(api.sprints.createSprint);
  const updateSprint = useMutation(api.sprints.updateSprint);
  const removeSprint = useMutation(api.sprints.removeSprint);

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [ends, setEnds] = useState("");

  // The running sprint opens by default; nothing else does.
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sprints.filter((s) => s.status === "active").map((s) => [s._id, true]))
  );

  const backlog = tasks.filter((t) => !t.sprintId);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSprint({
        projectId: projectId as any,
        name: name.trim(),
        goal: goal.trim() || undefined,
        startDate: today(),
        endDate: ends || undefined,
      });
      setName(""); setGoal(""); setEnds(""); setAdding(false);
      toast.success("Sprint created");
    } catch {
      toast.error("Could not create the sprint");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-meta font-semibold uppercase text-faint">
          Sprints & backlog
        </h2>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5
                     text-label text-muted transition-colors hover:bg-subtle hover:text-ink cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> New sprint
        </button>
      </div>

      {adding && (
        <form onSubmit={add} className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-3">
          <label className="min-w-36 flex-1 space-y-1">
            <span className="block font-mono text-meta uppercase text-faint">Name</span>
            <input
              autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Sprint 1"
              className="w-full rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-label text-ink outline-none focus:border-accent"
            />
          </label>
          <label className="min-w-56 flex-[2] space-y-1">
            <span className="block font-mono text-meta uppercase text-faint">Goal</span>
            <input
              value={goal} onChange={(e) => setGoal(e.target.value)}
              placeholder="What has to be true when it ends"
              className="w-full rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-label text-ink outline-none focus:border-accent"
            />
          </label>
          <label className="space-y-1">
            <span className="block font-mono text-meta uppercase text-faint">Ends</span>
            <input
              type="date" value={ends} onChange={(e) => setEnds(e.target.value)}
              className="rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-label text-ink outline-none focus:border-accent"
            />
          </label>
          <button type="submit" className="rounded-lg bg-accent px-3 py-1.5 text-label font-semibold text-accent-fg hover:bg-accent-hover cursor-pointer">
            Create
          </button>
        </form>
      )}

      <div className="space-y-2">
        {sprints.map((s) => {
          const state = STATE[s.status] ?? STATE.planned;
          const own = tasks.filter((t) => t.sprintId === s._id);
          const isOpen = open[s._id] ?? false;
          const overdue = s.daysLeft !== null && s.daysLeft < 0;

          return (
            <section
              key={s._id}
              className={`overflow-hidden rounded-xl border ${
                s.status === "active" ? "border-success/35 bg-success-tint/15" : "border-line bg-surface"
              }`}
            >
              <div
                onClick={() => setOpen((o) => ({ ...o, [s._id]: !isOpen }))}
                className="group flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-subtle/40"
              >
                <ChevronRight
                  className={`h-4 w-4 shrink-0 text-ghost transition-transform ${isOpen ? "rotate-90" : ""}`}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-serif text-heading text-ink">{s.name}</span>
                    <span className={`rounded px-1.5 py-0.5 font-mono text-meta ${state.chip}`}>
                      {state.label}
                    </span>
                    {s.endDate && s.status !== "done" && (
                      <span className={`font-mono text-meta ${overdue ? "text-danger" : "text-ghost"}`}>
                        {overdue ? `${-s.daysLeft!}d over` : `${s.daysLeft}d left`} · ends {fmt(s.endDate)}
                      </span>
                    )}
                  </div>
                  {s.goal && (
                    <p className="mt-0.5 flex items-start gap-1.5 text-label text-muted">
                      <Target className="mt-0.5 h-3 w-3 shrink-0 text-ghost" />
                      <span className="line-clamp-1">{s.goal}</span>
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span className="hidden w-28 sm:block">
                    <span className="block h-1.5 overflow-hidden rounded-full bg-subtle-2">
                      <span
                        className={`block h-full rounded-full transition-[width] duration-500 ${
                          s.progress === 100 ? "bg-success" : "bg-accent"
                        }`}
                        style={{ width: `${s.progress}%` }}
                      />
                    </span>
                  </span>
                  <span className="w-12 text-right font-mono text-meta text-ghost">
                    {s.doneCount}/{s.taskCount}
                  </span>

                  <span className="flex items-center gap-0.5">
                    {s.status === "planned" && (
                      <IconAction
                        title="Start this sprint"
                        onClick={() => updateSprint({ id: s._id as any, status: "active" })}
                        icon={<Play className="h-3 w-3" />}
                        hover="hover:text-success"
                      />
                    )}
                    {s.status === "active" && (
                      <IconAction
                        title="Close this sprint"
                        onClick={() => updateSprint({ id: s._id as any, status: "done" })}
                        icon={<Check className="h-3 w-3" />}
                        hover="hover:text-shipped"
                      />
                    )}
                    <IconAction
                      title="Delete sprint"
                      onClick={async () => {
                        await removeSprint({ id: s._id as any });
                        toast.success("Sprint removed — its tasks went back to the backlog");
                      }}
                      icon={<Trash2 className="h-3 w-3" />}
                      hover="hover:bg-danger-tint hover:text-danger"
                    />
                  </span>
                </div>
              </div>

              {isOpen && (
                <TaskList tasks={own} sprints={sprints} emptyLabel="Nothing in this sprint yet." />
              )}
            </section>
          );
        })}

        {/* Backlog reads as the last band, not a separate concept. */}
        <section className="overflow-hidden rounded-xl border border-line bg-surface">
          <div
            onClick={() => setOpen((o) => ({ ...o, __backlog: !o.__backlog }))}
            className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-subtle/40"
          >
            <ChevronRight
              className={`h-4 w-4 shrink-0 text-ghost transition-transform ${open.__backlog ? "rotate-90" : ""}`}
            />
            <Inbox className="h-3.5 w-3.5 shrink-0 text-ghost" />
            <span className="flex-1 font-serif text-heading text-ink">Backlog</span>
            <span className="font-mono text-meta text-ghost">{backlog.length}</span>
          </div>

          {open.__backlog && (
            <TaskList tasks={backlog} sprints={sprints} emptyLabel="Backlog is empty." />
          )}
        </section>
      </div>
    </div>
  );
}

function IconAction({
  title, onClick, icon, hover,
}: {
  title: string; onClick: () => void; icon: React.ReactNode; hover: string;
}) {
  return (
    <button
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`grid h-6 w-6 place-items-center rounded text-ghost opacity-0 transition
                  group-hover:opacity-100 hover:bg-subtle-2 cursor-pointer ${hover}`}
    >
      {icon}
    </button>
  );
}

/** Rows inside an expanded band. Moving work is a dropdown on the row. */
function TaskList({
  tasks, sprints, emptyLabel,
}: {
  tasks: any[];
  sprints: Sprint[];
  emptyLabel: string;
}) {
  const updateStatus = useMutation(api.tasks.updateStatus);
  const removeTask = useMutation(api.tasks.remove);
  const assignTask = useMutation(api.sprints.assignTask);

  if (tasks.length === 0) {
    return (
      <p className="border-t border-line px-4 py-5 text-center text-label text-ghost">
        {emptyLabel}
      </p>
    );
  }

  return (
    <ul className="border-t border-line">
      {tasks.map((t) => {
        const done = t.status === "done";
        return (
          <li
            key={t._id}
            className="group/row flex items-center gap-3 border-b border-line/60 px-4 py-2 last:border-0 hover:bg-subtle/40"
          >
            <button
              onClick={() => updateStatus({ id: t._id, status: done ? "todo" : "done" })}
              title={done ? "Reopen" : "Mark done"}
              className="shrink-0 cursor-pointer"
            >
              {done ? (
                <Check className="h-4 w-4 text-success" />
              ) : t.status === "in_progress" ? (
                <CircleDot className="h-4 w-4 text-warn" />
              ) : (
                <span className="block h-4 w-4 rounded-full border border-line-2 hover:border-accent" />
              )}
            </button>

            <span className={`min-w-0 flex-1 truncate text-label ${done ? "text-ghost line-through" : "text-ink"}`}>
              {t.title}
            </span>

            <LabelChips labels={t.labels} />

            <span className="flex shrink-0 items-center gap-1.5 opacity-0 transition-opacity group-hover/row:opacity-100">
              <Select
                value={t.status || "todo"}
                onValueChange={(v) => updateStatus({ id: t._id, status: v })}
                size="sm"
                options={[
                  { value: "todo", label: "To do" },
                  { value: "in_progress", label: "In progress" },
                  { value: "done", label: "Done" },
                ]}
              />
              <Select
                value={t.sprintId ?? "__backlog"}
                onValueChange={(v) =>
                  assignTask({ taskId: t._id, sprintId: (v === "__backlog" ? undefined : v) as any })
                }
                size="sm"
                options={[
                  { value: "__backlog", label: "Backlog" },
                  ...sprints.map((s) => ({ value: s._id, label: s.name })),
                ]}
              />
              <button
                onClick={() => removeTask({ id: t._id })}
                title="Delete task"
                className="grid h-6 w-6 place-items-center rounded text-ghost hover:bg-danger-tint hover:text-danger cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
