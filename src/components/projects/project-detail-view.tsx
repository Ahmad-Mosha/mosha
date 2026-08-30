"use client";

import React, { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { today } from "../../../convex/recurrence";
import {
  ArrowLeft, ArrowUpRight, Check, CircleDot, Github, Globe, NotebookPen, Pencil, Plus, Trash2,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import { SprintSections, type Sprint } from "./sprint-board";
import { STATUS_META } from "./projects-screen";
import { useMoshaStore } from "@/lib/store";
import { TaskComposer, LabelChips } from "./task-composer";
import { TaskDialog } from "./task-dialog";
import { priorityOf, dueMeta } from "./task-meta";

const COLUMNS = [
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "done", label: "Done" },
];

type Tab = "board" | "sprints" | "notes";

export function ProjectDetailView({
  projectId, onBack, onEdit, onDeleted,
}: {
  projectId: string;
  onBack: () => void;
  onEdit: (project: any) => void;
  onDeleted: () => void;
}) {
  const project = useQuery(api.projects.getProject, { id: projectId as any });
  const sprints = (useQuery(api.sprints.listForProject, { projectId: projectId as any }) ??
    []) as unknown as Sprint[];
  const updateProject = useMutation(api.projects.updateProject);
  const createTask = useMutation(api.tasks.create);
  const updateStatus = useMutation(api.tasks.updateStatus);
  const removeTask = useMutation(api.tasks.remove);
  const assignTask = useMutation(api.sprints.assignTask);
  const removeProject = useMutation(api.projects.removeProject);
  const getOrCreateNote = useMutation(api.notes.getOrCreateForProject);
  const notesByProject = useQuery(api.notes.notesByProject) ?? {};
  const openNote = useMoshaStore((s) => s.openNote);

  const [tab, setTab] = useState<Tab>("board");
  /** Which sprint the board shows. null means the backlog. */
  const [boardSprint, setBoardSprint] = useState<string | null | undefined>(undefined);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const tasks = project?.tasks ?? [];
  const activeSprint = sprints.find((s) => s.status === "active") ?? null;

  /**
   * The board defaults to the running sprint but is switchable — undefined
   * means "follow the active sprint", null means the backlog.
   */
  const shownSprint = boardSprint === undefined ? activeSprint?._id ?? null : boardSprint;

  const boardTasks = useMemo(
    () =>
      shownSprint
        ? tasks.filter((t: any) => t.sprintId === shownSprint)
        : tasks.filter((t: any) => !t.sprintId),
    [tasks, shownSprint]
  );

  /** Suggestions are whatever this project has already used. */
  const knownLabels = useMemo(
    () => Array.from(new Set(tasks.flatMap((t: any) => t.labels ?? []))).sort() as string[],
    [tasks]
  );

  const done = tasks.filter((t: any) => t.status === "done").length;
  const percent = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  if (project === undefined) {
    return <div className="py-20 text-center text-label text-ghost">Loading…</div>;
  }
  if (!project) {
    return (
      <div className="space-y-3 py-20 text-center">
        <p className="text-label text-ghost">That project no longer exists.</p>
        <button onClick={onBack} className="text-label text-accent hover:underline cursor-pointer">
          Back to projects
        </button>
      </div>
    );
  }

  const addTask = async (
    input: { title: string; priority: string; labels: string[] },
    sprintId: string | null = shownSprint
  ) => {
    try {
      await createTask({
        title: input.title,
        priority: input.priority,
        module: "projects",
        projectId: projectId as any,
        sprintId: (sprintId ?? undefined) as any,
        labels: input.labels.length ? input.labels : undefined,
      });
    } catch {
      toast.error("Could not add that task");
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 font-mono text-meta uppercase text-faint transition-colors hover:text-ink cursor-pointer"
        >
          <ArrowLeft className="h-3 w-3" /> Projects
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-serif text-title font-bold text-ink">{project.name}</h1>
              <Select
                value={project.status}
                onValueChange={(v) => updateProject({ id: projectId as any, status: v })}
                size="sm"
                options={Object.entries(STATUS_META).map(([v, m]) => ({ value: v, label: m.label }))}
              />
            </div>
            {project.description && (
              <p className="max-w-2xl text-label text-faint">{project.description}</p>
            )}
            {project.techStack?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {project.techStack.map((t: string) => (
                  <span key={t} className="rounded bg-subtle-2 px-1.5 py-0.5 font-mono text-meta text-muted">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {project.githubUrl && (
              <a
                href={project.githubUrl} target="_blank" rel="noreferrer" title="Repository"
                className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition-colors hover:bg-subtle hover:text-ink"
              >
                <Github className="h-4 w-4" />
              </a>
            )}
            {project.liveUrl && (
              <a
                href={project.liveUrl} target="_blank" rel="noreferrer" title="Live site"
                className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition-colors hover:bg-subtle hover:text-ink"
              >
                <Globe className="h-4 w-4" />
              </a>
            )}
            <button
              onClick={() => onEdit(project)}
              title="Edit project"
              className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition-colors hover:bg-subtle hover:text-ink cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              title="Delete project"
              className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition-colors hover:border-danger/35 hover:bg-danger-tint hover:text-danger cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Where the project stands, in one line. */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-line bg-surface px-4 py-3">
          <div className="flex min-w-48 flex-1 items-center gap-3">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-subtle-2">
              <span
                className={`block h-full rounded-full transition-[width] duration-500 ${
                  percent === 100 ? "bg-success" : "bg-accent"
                }`}
                style={{ width: `${percent}%` }}
              />
            </span>
            <span className="shrink-0 font-mono text-meta text-faint">{percent}%</span>
          </div>

          <span className="font-mono text-meta text-ghost">
            {done}/{tasks.length} tasks
          </span>

          {activeSprint ? (
            <span className="font-mono text-meta text-ghost">
              <span className="text-success">{activeSprint.name}</span>
              {activeSprint.daysLeft !== null && (
                <>
                  {" · "}
                  {activeSprint.daysLeft < 0
                    ? `${-activeSprint.daysLeft}d over`
                    : `${activeSprint.daysLeft}d left`}
                </>
              )}
            </span>
          ) : (
            <span className="font-mono text-meta text-ghost">No sprint running</span>
          )}
        </div>

        <div className="flex gap-1 border-b border-line">
          {(["board", "sprints", "notes"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-3 py-2 text-label capitalize transition-colors cursor-pointer ${
                tab === t
                  ? "border-accent font-semibold text-ink"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      {tab === "board" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-meta font-semibold uppercase text-faint">Showing</span>
              <Select
                value={shownSprint ?? "__backlog"}
                onValueChange={(v) => setBoardSprint(v === "__backlog" ? null : v)}
                size="sm"
                options={[
                  { value: "__backlog", label: "Backlog" },
                  ...sprints.map((s) => ({
                    value: s._id,
                    label: s.status === "active" ? `${s.name} · running` : s.name,
                  })),
                ]}
              />
              <span className="font-mono text-meta text-ghost">{boardTasks.length}</span>
            </div>
          </div>

          <TaskComposer
            placeholder={
              shownSprint
                ? `Add to ${sprints.find((s) => s._id === shownSprint)?.name ?? "sprint"}…`
                : "Add to the backlog…"
            }
            knownLabels={knownLabels}
            onAdd={addTask}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {COLUMNS.map((col) => {
              const colTasks = boardTasks.filter((t: any) => (t.status || "todo") === col.id);
              return (
                <div key={col.id} className="flex min-h-64 flex-col rounded-xl border border-line bg-surface">
                  <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
                    <span className="font-mono text-meta font-semibold uppercase text-faint">
                      {col.label}
                    </span>
                    <span className="font-mono text-meta text-ghost">{colTasks.length}</span>
                  </div>

                  <div className="flex-1 space-y-2 p-2.5">
                    {colTasks.length === 0 ? (
                      <p className="py-10 text-center font-mono text-meta text-ghost">empty</p>
                    ) : (
                      colTasks.map((t: any) => (
                        <div
                          key={t._id}
                          onClick={() => setEditingTask(t)}
                          className="group cursor-pointer space-y-2 rounded-lg border border-line bg-surface-2 p-3 transition-colors hover:border-line-2"
                        >
                          <div className="flex items-start gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus({ id: t._id, status: t.status === "done" ? "todo" : "done" });
                              }}
                              className="mt-0.5 shrink-0 cursor-pointer"
                              title={t.status === "done" ? "Reopen" : "Mark done"}
                            >
                              {t.status === "done" ? (
                                <Check className="h-3.5 w-3.5 text-success" />
                              ) : t.status === "in_progress" ? (
                                <CircleDot className="h-3.5 w-3.5 text-warn" />
                              ) : (
                                <span className="block h-3.5 w-3.5 rounded-full border border-line-2 hover:border-accent" />
                              )}
                            </button>
                            <span
                              className={`flex-1 text-label leading-snug ${
                                t.status === "done" ? "text-ghost line-through" : "text-ink"
                              }`}
                            >
                              {t.title}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeTask({ id: t._id }); }}
                              title="Delete task"
                              className="shrink-0 text-ghost opacity-0 transition-opacity hover:text-danger group-hover:opacity-100 cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-1">
                            <span className={`rounded px-1.5 py-0.5 font-mono text-meta ${priorityOf(t.priority).chip}`}>
                              {priorityOf(t.priority).label}
                            </span>
                            {(() => {
                              const due = dueMeta(t.dueDate, today());
                              return due ? (
                                <span title={due.title} className={`rounded px-1.5 py-0.5 font-mono text-meta ${due.tone}`}>
                                  {due.text}
                                </span>
                              ) : null;
                            })()}
                            <LabelChips labels={t.labels} />
                          </div>

                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <Select
                              value={t.status || "todo"}
                              onValueChange={(v) => updateStatus({ id: t._id, status: v })}
                              size="sm"
                              options={COLUMNS.map((c) => ({ value: c.id, label: c.label }))}
                            />
                            {sprints.length > 0 && (
                              <Select
                                value={t.sprintId ?? "__backlog"}
                                onValueChange={(v) =>
                                  assignTask({
                                    taskId: t._id,
                                    sprintId: (v === "__backlog" ? undefined : v) as any,
                                  })
                                }
                                size="sm"
                                options={[
                                  { value: "__backlog", label: "Backlog" },
                                  ...sprints.map((s) => ({ value: s._id, label: s.name })),
                                ]}
                              />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "sprints" && (
        <SprintSections
          projectId={projectId}
          sprints={sprints}
          tasks={tasks}
          knownLabels={knownLabels}
          onAddTask={addTask}
          onEditTask={setEditingTask}
        />
      )}

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete “${project.name}”?`}
        body="Its sprints go with it. Its tasks move to your general list rather than being deleted."
        confirmLabel="Delete project"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await removeProject({ id: projectId as any });
          toast.success("Project deleted — its tasks moved to your general list");
          setConfirmDelete(false);
          onDeleted();
        }}
      />

      <TaskDialog
        task={editingTask}
        sprints={sprints}
        knownLabels={knownLabels}
        onClose={() => setEditingTask(null)}
      />

      {tab === "notes" && (
        <button
          onClick={async () => {
            try {
              const id = await getOrCreateNote({ projectId: projectId as any });
              if (id) openNote(id);
            } catch {
              toast.error("Could not open the note");
            }
          }}
          className="group/note flex w-full items-center gap-3 rounded-xl border border-line
                     bg-surface px-4 py-3.5 text-left transition-colors hover:border-accent cursor-pointer"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-ink-2">
            <NotebookPen className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-label text-ink">
              {notesByProject[projectId] ? "Open the note" : "Start a note"}
            </span>
            <span className="block font-mono text-meta text-ghost">
              {notesByProject[projectId]
                ? `${notesByProject[projectId].words} words · Projects / ${project.name}`
                : `Opens full width in Notes, filed under Projects / ${project.name}`}
            </span>
          </span>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-ghost transition-transform group-hover/note:translate-x-0.5 group-hover/note:-translate-y-0.5" />
        </button>
      )}

    </div>
  );
}
