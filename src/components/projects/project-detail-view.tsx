"use client";

import React, { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import {
  ArrowLeft, Check, Circle, Github, Globe, Pencil, Plus, Trash2,
} from "lucide-react";
import { NoteEditor } from "../notes/editor";
import { Select } from "@/components/ui/select";
import { SprintBoard } from "./sprint-board";
import { STATUS_META } from "./projects-screen";

const COLUMNS = [
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "done", label: "Done" },
];

type Tab = "sprints" | "notes";

export function ProjectDetailView({
  projectId, onBack, onEdit,
}: {
  projectId: string;
  onBack: () => void;
  onEdit: (project: any) => void;
}) {
  const project = useQuery(api.projects.getProject, { id: projectId as any });
  const sprints = useQuery(api.sprints.listForProject, { projectId: projectId as any }) ?? [];
  const updateProject = useMutation(api.projects.updateProject);
  const createTask = useMutation(api.tasks.create);
  const updateStatus = useMutation(api.tasks.updateStatus);
  const removeTask = useMutation(api.tasks.remove);
  const assignTask = useMutation(api.sprints.assignTask);

  const [tab, setTab] = useState<Tab>("sprints");
  const [selectedSprint, setSelectedSprint] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const tasks = project?.tasks ?? [];

  /** The board shows one sprint at a time, or the backlog when none is picked. */
  const boardTasks = useMemo(
    () =>
      selectedSprint
        ? tasks.filter((t: any) => t.sprintId === selectedSprint)
        : tasks.filter((t: any) => !t.sprintId),
    [tasks, selectedSprint]
  );

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

  const meta = STATUS_META[project.status] ?? STATUS_META.planning;

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    try {
      await createTask({
        title: draft.trim(),
        priority: "p2_medium",
        module: "projects",
        projectId: projectId as any,
        sprintId: (selectedSprint ?? undefined) as any,
      });
      setDraft("");
    } catch {
      toast.error("Could not add that task");
    }
  };

  return (
    <div className="space-y-5">
      <header className="space-y-3 border-b border-line pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 font-mono text-meta uppercase text-faint transition-colors hover:text-ink cursor-pointer"
        >
          <ArrowLeft className="h-3 w-3" /> Projects
        </button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-title text-ink">{project.name}</h1>
              <Select
                value={project.status}
                onValueChange={(v) => updateProject({ id: projectId as any, status: v })}
                size="sm"
                options={Object.entries(STATUS_META).map(([v, m]) => ({ value: v, label: m.label }))}
              />
            </div>
            {project.description && (
              <p className="mt-1 max-w-2xl text-label text-faint">{project.description}</p>
            )}
            {project.techStack?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {project.techStack.map((t: string) => (
                  <span key={t} className="rounded bg-subtle-2 px-1.5 py-0.5 font-mono text-meta text-muted">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                title="Repository"
                className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition-colors hover:bg-subtle hover:text-ink"
              >
                <Github className="h-4 w-4" />
              </a>
            )}
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                title="Live site"
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
          </div>
        </div>

        <div className="flex gap-1">
          {(["sprints", "notes"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-label capitalize transition-colors cursor-pointer ${
                tab === t ? "bg-accent font-semibold text-accent-fg" : "text-muted hover:bg-subtle hover:text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      {tab === "sprints" ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
          <SprintBoard
            projectId={projectId}
            sprints={sprints as any}
            selectedSprint={selectedSprint}
            onSelectSprint={setSelectedSprint}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-meta font-semibold uppercase text-faint">
                {selectedSprint
                  ? sprints.find((s: any) => s._id === selectedSprint)?.name ?? "Sprint"
                  : "Backlog"}
                <span className="ml-1.5 text-ghost">{boardTasks.length}</span>
              </h2>
              {selectedSprint && (
                <button
                  onClick={() => setSelectedSprint(null)}
                  className="font-mono text-meta text-ghost hover:text-ink cursor-pointer"
                >
                  show backlog
                </button>
              )}
            </div>

            <form onSubmit={addTask} className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Plus className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ghost" />
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={selectedSprint ? "Add to this sprint…" : "Add to the backlog…"}
                  className="w-full rounded-lg border border-line bg-surface py-1.5 pl-8 pr-2 text-label text-ink outline-none transition-colors placeholder:text-ghost focus:border-accent"
                />
              </div>
              {/* An explicit submit: a lone input gives no implicit submission
                  here, so Enter did nothing. */}
              <button
                type="submit"
                disabled={!draft.trim()}
                className="rounded-lg bg-accent px-3 py-1.5 text-label font-semibold text-accent-fg
                           transition-colors hover:bg-accent-hover disabled:opacity-40 cursor-pointer"
              >
                Add
              </button>
            </form>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {COLUMNS.map((col) => {
                const colTasks = boardTasks.filter(
                  (t: any) => (t.status || "todo") === col.id
                );
                return (
                  <div key={col.id} className="space-y-2 rounded-xl border border-line bg-surface p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-meta font-semibold uppercase text-faint">
                        {col.label}
                      </span>
                      <span className="font-mono text-meta text-ghost">{colTasks.length}</span>
                    </div>

                    {colTasks.length === 0 ? (
                      <p className="py-6 text-center font-mono text-meta text-ghost">empty</p>
                    ) : (
                      colTasks.map((t: any) => (
                        <div
                          key={t._id}
                          className="group space-y-1.5 rounded-lg border border-line bg-surface-2 p-2.5"
                        >
                          <div className="flex items-start gap-2">
                            <button
                              onClick={() =>
                                updateStatus({
                                  id: t._id,
                                  status: t.status === "done" ? "todo" : "done",
                                })
                              }
                              className="mt-0.5 shrink-0 cursor-pointer"
                              title={t.status === "done" ? "Reopen" : "Mark done"}
                            >
                              {t.status === "done" ? (
                                <Check className="h-3.5 w-3.5 text-success" />
                              ) : (
                                <Circle className="h-3.5 w-3.5 text-line-2 hover:text-accent" />
                              )}
                            </button>
                            <span
                              className={`flex-1 text-label ${
                                t.status === "done" ? "text-ghost line-through" : "text-ink"
                              }`}
                            >
                              {t.title}
                            </span>
                            <button
                              onClick={() => removeTask({ id: t._id })}
                              title="Delete task"
                              className="shrink-0 text-ghost opacity-0 transition-opacity hover:text-danger group-hover:opacity-100 cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
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
                                  ...sprints.map((s: any) => ({ value: s._id, label: s.name })),
                                ]}
                              />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[65vh] overflow-hidden rounded-xl border border-line">
          <NoteEditor
            key={projectId}
            initialContent={project.devNotes || ""}
            placeholder="Architecture, decisions, runbooks…"
            onChange={(html) => updateProject({ id: projectId as any, devNotes: html })}
          />
        </div>
      )}
    </div>
  );
}
