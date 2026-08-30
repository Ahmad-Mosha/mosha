"use client";

import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Github, Globe, Terminal, X } from "lucide-react";
import { Select } from "@/components/ui/select";
import { STATUS_META } from "./projects-screen";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editingProject?: any | null;
}

/**
 * Name, what it is, what it's built with, where it lives. Release version and
 * working branch used to live here too — both were copies of something git
 * already knows, kept up to date by hand and wrong the moment you forgot.
 */
export function ProjectDialog({ isOpen, onClose, editingProject }: Props) {
  const createProject = useMutation(api.projects.createProject);
  const updateProject = useMutation(api.projects.updateProject);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [techInput, setTechInput] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(editingProject?.name ?? "");
    setDescription(editingProject?.description ?? "");
    setStatus(editingProject?.status ?? "active");
    setTechStack(editingProject?.techStack ?? []);
    setGithubUrl(editingProject?.githubUrl ?? "");
    setLiveUrl(editingProject?.liveUrl ?? "");
    setTechInput("");
  }, [editingProject, isOpen]);

  const addTech = (raw: string) => {
    const clean = raw.trim().replace(/,$/, "");
    if (clean && !techStack.includes(clean)) setTechStack((s) => [...s, clean]);
    setTechInput("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim(),
      status,
      techStack,
      githubUrl: githubUrl.trim() || undefined,
      liveUrl: liveUrl.trim() || undefined,
    };
    try {
      if (editingProject) await updateProject({ id: editingProject._id, ...payload });
      else await createProject(payload);
      onClose();
    } catch {
      toast.error("Could not save the project");
    } finally {
      setSaving(false);
    }
  };

  const field =
    "w-full rounded-lg border border-line bg-surface px-3 py-2 text-label text-ink outline-none transition-colors placeholder:text-ghost focus:border-accent";

  return (
    <Dialog.Root open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-line bg-surface-2 p-5 shadow-2xl animate-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-fg">
                <Terminal className="h-4 w-4" />
              </span>
              <Dialog.Title className="font-serif text-heading text-ink">
                {editingProject ? "Edit project" : "New project"}
              </Dialog.Title>
            </div>
            <Dialog.Close className="grid h-7 w-7 place-items-center rounded-lg text-faint hover:bg-subtle-2 hover:text-ink cursor-pointer">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={submit} className="space-y-3.5 pt-4">
            <input
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className={field}
            />

            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is it, in one line"
              className={`${field} leading-relaxed`}
            />

            <div className="space-y-1">
              <span className="font-mono text-meta uppercase text-faint">Status</span>
              <Select
                value={status}
                onValueChange={setStatus}
                className="w-full"
                options={Object.entries(STATUS_META).map(([v, m]) => ({ value: v, label: m.label }))}
              />
            </div>

            <div className="space-y-1.5">
              <span className="font-mono text-meta uppercase text-faint">Stack</span>
              <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-line bg-surface p-2">
                {techStack.map((tech) => (
                  <span
                    key={tech}
                    className="flex items-center gap-1 rounded bg-subtle-2 px-1.5 py-0.5 font-mono text-meta text-muted"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => setTechStack((s) => s.filter((t) => t !== tech))}
                      className="text-ghost hover:text-danger cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter or comma commits; backspace on an empty field removes the last.
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTech(techInput);
                    } else if (e.key === "Backspace" && !techInput) {
                      setTechStack((s) => s.slice(0, -1));
                    }
                  }}
                  onBlur={() => techInput && addTech(techInput)}
                  placeholder={techStack.length ? "" : "TypeScript, Go, Postgres…"}
                  className="min-w-24 flex-1 bg-transparent px-1 font-mono text-meta text-ink outline-none placeholder:text-ghost"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="flex items-center gap-1.5 font-mono text-meta uppercase text-faint">
                  <Github className="h-3 w-3" /> Repository
                </span>
                <input
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/…"
                  className={field}
                />
              </label>
              <label className="space-y-1">
                <span className="flex items-center gap-1.5 font-mono text-meta uppercase text-faint">
                  <Globe className="h-3 w-3" /> Live
                </span>
                <input
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  placeholder="https://…"
                  className={field}
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Dialog.Close className="rounded-lg border border-line px-4 py-2 text-label text-muted transition-colors hover:bg-subtle hover:text-ink cursor-pointer">
                Cancel
              </Dialog.Close>
              <button
                type="submit"
                disabled={!name.trim() || saving}
                className="rounded-lg bg-accent px-4 py-2 text-label font-semibold text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-40 cursor-pointer"
              >
                {saving ? "Saving…" : editingProject ? "Save" : "Create"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
