"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Github, Globe, Plus, Search } from "lucide-react";
import { Select } from "@/components/ui/select";
import { ProjectDialog } from "./project-dialog";
import { ProjectDetailView } from "./project-detail-view";

export const STATUS_META: Record<string, { label: string; dot: string; chip: string }> = {
  active: { label: "Active", dot: "bg-success", chip: "bg-success-tint text-success" },
  in_progress: { label: "In progress", dot: "bg-warn", chip: "bg-warn-tint text-warn" },
  in_review: { label: "In review", dot: "bg-info", chip: "bg-info-tint text-info" },
  planning: { label: "Planning", dot: "bg-ghost", chip: "bg-subtle-2 text-muted" },
  completed: { label: "Shipped", dot: "bg-shipped", chip: "bg-shipped-tint text-shipped" },
  on_hold: { label: "Paused", dot: "bg-danger", chip: "bg-danger-tint text-danger" },
};

export function ProjectsScreen() {
  const projects = useQuery(api.projects.listProjects) ?? [];
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  /** Every stack entry already in use, offered as suggestions. */
  const knownTech = useMemo(
    () =>
      Array.from(new Set(projects.flatMap((p: any) => p.techStack ?? []))).sort(),
    [projects]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p: any) => {
      if (status !== "all" && p.status !== status) return false;
      if (!q) return true;
      return (
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.techStack?.some((t: string) => t.toLowerCase().includes(q))
      );
    });
  }, [projects, status, query]);

  const dialog = (
    <ProjectDialog
      isOpen={dialogOpen}
      onClose={() => { setDialogOpen(false); setEditing(null); }}
      editingProject={editing}
      knownTech={knownTech}
    />
  );

  // The dialog has to render in both branches; it used to live only in the
  // list, so Edit from inside a project set state with nothing mounted to show.
  if (selected) {
    return (
      <>
        <ProjectDetailView
          projectId={selected}
          onBack={() => setSelected(null)}
          onEdit={(p) => { setEditing(p); setDialogOpen(true); }}
        />
        {dialog}
      </>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="font-serif text-display font-bold text-ink">Projects</h1>
          <p className="mt-0.5 text-label text-faint">
            What you are building, and what is in flight right now.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-44 sm:w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ghost" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects…"
              className="w-full rounded-lg border border-line bg-surface-2 py-1.5 pl-8 pr-2
                         text-label text-ink outline-none transition-colors
                         placeholder:text-ghost focus:border-accent"
            />
          </div>
          <Select
            value={status}
            onValueChange={setStatus}
            size="sm"
            options={[
              { value: "all", label: "All statuses" },
              ...Object.entries(STATUS_META).map(([v, m]) => ({ value: v, label: m.label })),
            ]}
          />
          <button
            onClick={() => { setEditing(null); setDialogOpen(true); }}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-label
                       font-semibold text-accent-fg transition-colors hover:bg-accent-hover cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> New project
          </button>
        </div>
      </header>

      {projects.length === 0 ? (
        <div className="space-y-3 rounded-xl border border-dashed border-line-2 py-16 text-center">
          <p className="text-label text-ghost">No projects yet.</p>
          <button
            onClick={() => { setEditing(null); setDialogOpen(true); }}
            className="rounded-lg bg-accent px-4 py-2 text-label font-semibold text-accent-fg
                       hover:bg-accent-hover cursor-pointer"
          >
            Create your first project
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-label text-ghost">Nothing matches those filters.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p: any) => (
            <ProjectCard key={p._id} project={p} onOpen={() => setSelected(p._id)} />
          ))}
        </div>
      )}

      {dialog}
    </div>
  );
}

function ProjectCard({ project, onOpen }: { project: any; onOpen: () => void }) {
  const meta = STATUS_META[project.status] ?? STATUS_META.planning;
  const stack: string[] = project.techStack ?? [];

  return (
    <article
      onClick={onOpen}
      className="group flex cursor-pointer flex-col gap-3 rounded-xl border border-line bg-surface
                 p-4 transition-colors hover:border-line-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-serif text-heading text-ink">{project.name}</h3>
          {project.description && (
            <p className="mt-0.5 line-clamp-2 text-label text-faint">{project.description}</p>
          )}
        </div>
        <span className={`flex shrink-0 items-center gap-1.5 rounded px-2 py-0.5 font-mono text-meta ${meta.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>

      {stack.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {stack.slice(0, 5).map((t) => (
            <span key={t} className="rounded bg-subtle-2 px-1.5 py-0.5 font-mono text-meta text-muted">
              {t}
            </span>
          ))}
          {stack.length > 5 && (
            <span className="px-1 font-mono text-meta text-ghost">+{stack.length - 5}</span>
          )}
        </div>
      )}

      <div className="mt-auto space-y-1.5">
        <div className="h-1 overflow-hidden rounded-full bg-subtle-2">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${project.progress ?? 0}%` }}
          />
        </div>
        <div className="flex items-center justify-between font-mono text-meta text-ghost">
          <span>
            {project.doneTaskCount ?? 0}/{project.taskCount ?? 0} tasks
          </span>
          <span className="flex items-center gap-2">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Repository"
                className="text-ghost transition-colors hover:text-ink"
              >
                <Github className="h-3.5 w-3.5" />
              </a>
            )}
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Live site"
                className="text-ghost transition-colors hover:text-ink"
              >
                <Globe className="h-3.5 w-3.5" />
              </a>
            )}
          </span>
        </div>
      </div>
    </article>
  );
}
