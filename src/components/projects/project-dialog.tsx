"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { X, Plus, Terminal, Github, Globe, GitBranch, Layers } from "lucide-react";

interface ProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingProject?: any | null;
}

const COMMON_TECH = [
  "TypeScript",
  "React",
  "Next.js",
  "Tailwind",
  "Rust",
  "Go",
  "Python",
  "gRPC",
  "Redis",
  "PostgreSQL",
  "Kafka",
  "Docker",
];

export function ProjectDialog({
  isOpen,
  onClose,
  editingProject,
}: ProjectDialogProps) {
  const createProject = useMutation(api.projects.createProject);
  const updateProject = useMutation(api.projects.updateProject);
  const goals = useQuery(api.goals.list) || [];

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [techInput, setTechInput] = useState("");
  const [version, setVersion] = useState("v1.0.0");
  const [branch, setBranch] = useState("main");
  const [githubUrl, setGithubUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [goalId, setGoalId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name || "");
      setDescription(editingProject.description || "");
      setStatus(editingProject.status || "active");
      setTechStack(editingProject.techStack || []);
      setVersion(editingProject.version || "v1.0.0");
      setBranch(editingProject.branch || "main");
      setGithubUrl(editingProject.githubUrl || "");
      setLiveUrl(editingProject.liveUrl || "");
      setGoalId(editingProject.goalId || "");
    } else {
      setName("");
      setDescription("");
      setStatus("active");
      setTechStack(["TypeScript", "React"]);
      setVersion("v1.0.0");
      setBranch("main");
      setGithubUrl("");
      setLiveUrl("");
      setGoalId("");
    }
  }, [editingProject, isOpen]);

  const handleAddTech = (tech: string) => {
    const clean = tech.trim();
    if (clean && !techStack.includes(clean)) {
      setTechStack([...techStack, clean]);
    }
    setTechInput("");
  };

  const handleRemoveTech = (tech: string) => {
    setTechStack(techStack.filter((t) => t !== tech));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingProject) {
        await updateProject({
          id: editingProject._id,
          name: name.trim(),
          description: description.trim(),
          status,
          techStack,
          version: version.trim() || undefined,
          branch: branch.trim() || undefined,
          githubUrl: githubUrl.trim() || undefined,
          liveUrl: liveUrl.trim() || undefined,
          goalId: goalId ? (goalId as any) : undefined,
        });
      } else {
        await createProject({
          name: name.trim(),
          description: description.trim(),
          status,
          techStack,
          version: version.trim() || "v1.0.0",
          branch: branch.trim() || "main",
          githubUrl: githubUrl.trim() || undefined,
          liveUrl: liveUrl.trim() || undefined,
          goalId: goalId ? (goalId as any) : undefined,
        });
      }
      onClose();
    } catch (err) {
      console.error("Failed to save project:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-surface-2 border border-line rounded-2xl shadow-xl p-6 z-50 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
          <div className="flex justify-between items-center pb-4 border-b border-line">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent text-accent-fg flex items-center justify-center font-bold text-sm">
                <Terminal className="w-4 h-4" />
              </div>
              <Dialog.Title className="font-serif text-lg font-bold text-ink">
                {editingProject ? "Edit Project" : "New Engineering Project"}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button className="text-faint hover:text-ink p-1 rounded-md hover:bg-subtle-2 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
            {/* Project Name */}
            <div className="space-y-1">
              <label className="font-mono uppercase tracking-wider text-[11px] font-semibold text-muted">
                Project / Repository Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nexus API Gateway, Core Auth Service..."
                className="w-full bg-subtle border border-line rounded-xl px-3.5 py-2.5 text-xs text-ink focus:outline-none focus:border-accent focus:bg-surface-2 transition-all font-medium"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="font-mono uppercase tracking-wider text-[11px] font-semibold text-muted">
                Description & Purpose
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="High-level architectural overview or objective..."
                className="w-full bg-subtle border border-line rounded-xl px-3.5 py-2 text-xs text-ink focus:outline-none focus:border-accent focus:bg-surface-2 transition-all leading-relaxed"
              />
            </div>

            {/* Status & Version */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-mono uppercase tracking-wider text-[11px] font-semibold text-muted">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-subtle border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none cursor-pointer"
                >
                  <option value="active">🟢 Active Development</option>
                  <option value="in_progress">🟡 In Progress</option>
                  <option value="in_review">🔵 In Review</option>
                  <option value="planning">⚪ Planning / Spec</option>
                  <option value="completed">🟣 Completed / Shipped</option>
                  <option value="on_hold">🔴 Maintenance / Paused</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-mono uppercase tracking-wider text-[11px] font-semibold text-muted">
                  Release Version
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="v1.0.0"
                  className="w-full bg-subtle border border-line rounded-xl px-3 py-2 text-xs font-mono text-ink focus:outline-none"
                />
              </div>
            </div>

            {/* Tech Stack Tags */}
            <div className="space-y-1.5">
              <label className="font-mono uppercase tracking-wider text-[11px] font-semibold text-muted">
                Tech Stack
              </label>
              <div className="flex flex-wrap gap-1.5 p-2 bg-subtle border border-line rounded-xl min-h-[38px] items-center">
                {techStack.map((tech) => (
                  <span
                    key={tech}
                    className="bg-surface-2 border border-line px-2 py-0.5 rounded-md font-mono text-[11px] text-accent font-medium flex items-center gap-1 shadow-2xs"
                  >
                    <span>{tech}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTech(tech)}
                      className="text-ghost hover:text-rose-600 cursor-pointer ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && techInput.trim()) {
                      e.preventDefault();
                      handleAddTech(techInput);
                    }
                  }}
                  placeholder="+ Add tech (Enter)..."
                  className="bg-transparent text-xs font-mono focus:outline-none flex-1 min-w-[100px] px-1"
                />
              </div>

              {/* Quick Tech Badges */}
              <div className="flex flex-wrap gap-1 pt-1">
                {COMMON_TECH.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleAddTech(t)}
                    className={`px-1.5 py-0.5 rounded border text-[10px] font-mono transition-colors cursor-pointer ${
                      techStack.includes(t)
                        ? "bg-accent text-accent-fg border-accent"
                        : "bg-surface-2 border-line text-faint hover:bg-subtle-2"
                    }`}
                  >
                    +{t}
                  </button>
                ))}
              </div>
            </div>

            {/* Git Branch & URLs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="font-mono uppercase tracking-wider text-[11px] font-semibold text-muted flex items-center gap-1">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Working Branch</span>
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main, feature/grpc..."
                  className="w-full bg-subtle border border-line rounded-xl px-3 py-2 text-xs font-mono text-ink focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono uppercase tracking-wider text-[11px] font-semibold text-muted flex items-center gap-1">
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub Repo URL</span>
                </label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full bg-subtle border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none"
                />
              </div>
            </div>

            {/* Linked Life Goal */}
            <div className="space-y-1 pt-1">
              <label className="font-mono uppercase tracking-wider text-[11px] font-semibold text-muted flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Link to Major Life Goal</span>
              </label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full bg-subtle border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none cursor-pointer"
              >
                <option value="">No linked life goal</option>
                {goals.map((g: any) => (
                  <option key={g._id} value={g._id}>
                    {g.icon || "🎯"} {g.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t border-line">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-line hover:bg-subtle text-muted text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                {isSubmitting
                  ? "Saving..."
                  : editingProject
                  ? "Save Changes"
                  : "Create Project"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
