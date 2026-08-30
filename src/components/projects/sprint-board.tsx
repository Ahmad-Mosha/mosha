"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { CalendarClock, Check, Plus, Play, Target, Trash2 } from "lucide-react";
import { today } from "../../../convex/recurrence";

const SHORT = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });
const fmt = (d?: string) => (d ? SHORT.format(new Date(d)) : null);

const SPRINT_STATE: Record<string, { label: string; chip: string }> = {
  active: { label: "Running", chip: "bg-success-tint text-success" },
  planned: { label: "Planned", chip: "bg-subtle-2 text-muted" },
  done: { label: "Done", chip: "bg-shipped-tint text-shipped" },
};

interface Sprint {
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
 * Sprints for one project. The running sprint is the point of the screen, so
 * it is expanded and everything else is a compact row beneath it.
 */
export function SprintBoard({
  projectId, sprints, selectedSprint, onSelectSprint,
}: {
  projectId: string;
  sprints: Sprint[];
  selectedSprint: string | null;
  onSelectSprint: (id: string | null) => void;
}) {
  const createSprint = useMutation(api.sprints.createSprint);
  const updateSprint = useMutation(api.sprints.updateSprint);
  const removeSprint = useMutation(api.sprints.removeSprint);

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [ends, setEnds] = useState("");

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
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-meta font-semibold uppercase text-faint">Sprints</h2>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1
                     text-label text-muted transition-colors hover:bg-subtle hover:text-ink cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> New sprint
        </button>
      </div>

      {adding && (
        <form onSubmit={add} className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-3">
          <label className="min-w-40 flex-1 space-y-1">
            <span className="block font-mono text-meta uppercase text-faint">Name</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sprint 1"
              className="w-full rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-label text-ink outline-none focus:border-accent"
            />
          </label>
          <label className="min-w-48 flex-[2] space-y-1">
            <span className="block font-mono text-meta uppercase text-faint">Goal</span>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What has to be true when it ends"
              className="w-full rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-label text-ink outline-none focus:border-accent"
            />
          </label>
          <label className="space-y-1">
            <span className="block font-mono text-meta uppercase text-faint">Ends</span>
            <input
              type="date"
              value={ends}
              onChange={(e) => setEnds(e.target.value)}
              className="rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-label text-ink outline-none focus:border-accent"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-accent px-3 py-1.5 text-label font-semibold text-accent-fg hover:bg-accent-hover cursor-pointer"
          >
            Create
          </button>
        </form>
      )}

      {sprints.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-2 py-8 text-center text-label text-ghost">
          No sprints yet. Tasks live in the backlog until you make one.
        </p>
      ) : (
        <div className="space-y-1.5">
          {sprints.map((s) => {
            const state = SPRINT_STATE[s.status] ?? SPRINT_STATE.planned;
            const isSelected = selectedSprint === s._id;
            const overdue = s.daysLeft !== null && s.daysLeft < 0;

            return (
              <div
                key={s._id}
                onClick={() => onSelectSprint(isSelected ? null : s._id)}
                className={`group cursor-pointer rounded-xl border p-3 transition-colors ${
                  isSelected ? "border-accent bg-accent-soft/40" : "border-line bg-surface hover:border-line-2"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-serif text-heading text-ink">{s.name}</span>
                  <span className={`rounded px-1.5 py-0.5 font-mono text-meta ${state.chip}`}>
                    {state.label}
                  </span>

                  {s.endDate && s.status !== "done" && (
                    <span className={`flex items-center gap-1 font-mono text-meta ${overdue ? "text-danger" : "text-ghost"}`}>
                      <CalendarClock className="h-3 w-3" />
                      {overdue ? `${-s.daysLeft!}d over` : `${s.daysLeft}d left`}
                      <span className="text-ghost">· ends {fmt(s.endDate)}</span>
                    </span>
                  )}

                  <span className="ml-auto flex items-center gap-1.5">
                    {s.status !== "active" && s.status !== "done" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); updateSprint({ id: s._id as any, status: "active" }); }}
                        title="Start this sprint"
                        className="grid h-6 w-6 place-items-center rounded text-ghost opacity-0
                                   transition-opacity hover:bg-subtle-2 hover:text-success
                                   group-hover:opacity-100 cursor-pointer"
                      >
                        <Play className="h-3 w-3" />
                      </button>
                    )}
                    {s.status === "active" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); updateSprint({ id: s._id as any, status: "done" }); }}
                        title="Close this sprint"
                        className="grid h-6 w-6 place-items-center rounded text-ghost opacity-0
                                   transition-opacity hover:bg-subtle-2 hover:text-shipped
                                   group-hover:opacity-100 cursor-pointer"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await removeSprint({ id: s._id as any });
                        if (isSelected) onSelectSprint(null);
                        toast.success("Sprint removed — its tasks went back to the backlog");
                      }}
                      title="Delete sprint"
                      className="grid h-6 w-6 place-items-center rounded text-ghost opacity-0
                                 transition-opacity hover:bg-danger-tint hover:text-danger
                                 group-hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                </div>

                {s.goal && (
                  <p className="mt-1 flex items-start gap-1.5 text-label text-muted">
                    <Target className="mt-0.5 h-3 w-3 shrink-0 text-ghost" />
                    {s.goal}
                  </p>
                )}

                <div className="mt-2 flex items-center gap-2">
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-subtle-2">
                    <span
                      className={`block h-full rounded-full transition-[width] duration-500 ${
                        s.progress === 100 ? "bg-success" : "bg-accent"
                      }`}
                      style={{ width: `${s.progress}%` }}
                    />
                  </span>
                  <span className="shrink-0 font-mono text-meta text-ghost">
                    {s.doneCount}/{s.taskCount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
