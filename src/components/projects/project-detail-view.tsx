"use client";

import React, { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ProjectKanban } from "./project-kanban";
import { NoteEditor } from "../notes/editor";
import {
  ArrowLeft,
  Github,
  Globe,
  GitBranch,
  Edit2,
  Trash2,
  CheckCircle2,
  Layers,
  FileCode,
  Terminal,
  Calendar,
} from "lucide-react";

interface ProjectDetailViewProps {
  projectId: any;
  onBack: () => void;
  onEdit: (project: any) => void;
}

export function ProjectDetailView({
  projectId,
  onBack,
  onEdit,
}: ProjectDetailViewProps) {
  const project = useQuery(api.projects.getProject, { id: projectId });
  const updateProject = useMutation(api.projects.updateProject);
  const removeProject = useMutation(api.projects.removeProject);

  const [activeTab, setActiveTab] = useState<"kanban" | "notes" | "overview">("kanban");

  // Debounced auto-save timer for Dev Notes
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-label text-ghost animate-pulse">
        Loading project workspace...
      </div>
    );
  }

  const handleDevNotesChange = (html: string, plainText: string) => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await updateProject({
          id: project._id,
          devNotes: html,
        });
      } catch (err) {
        console.error("Auto-save dev notes failed:", err);
      }
    }, 500);
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
      await removeProject({ id: project._id });
      onBack();
    }
  };

  const tasks = project.tasks || [];
  const doneTasks = tasks.filter((t: any) => t.status === "done").length;
  const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2.5 py-1 rounded-full bg-success-tint text-success border border-success/35 font-mono text-meta font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span>Active</span>
          </span>
        );
      case "in_progress":
        return (
          <span className="px-2.5 py-1 rounded-full bg-warn-tint text-warn border border-warn/35 font-mono text-meta font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-warn" />
            <span>In Progress</span>
          </span>
        );
      case "in_review":
        return (
          <span className="px-2.5 py-1 rounded-full bg-info-tint text-info border border-info/35 font-mono text-meta font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-info" />
            <span>In Review</span>
          </span>
        );
      case "completed":
        return (
          <span className="px-2.5 py-1 rounded-full bg-shipped-tint text-shipped border border-shipped/35 font-mono text-meta font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-shipped" />
            <span>Shipped</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-subtle text-muted border border-line font-mono text-meta font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-ghost" />
            <span>Planning</span>
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-2 overflow-hidden animate-in fade-in duration-150">
      {/* 1. Project Master Header */}
      <div className="px-6 py-4 border-b border-line bg-surface flex flex-wrap justify-between items-center gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg border border-line hover:bg-surface-2 text-muted hover:text-ink transition-colors cursor-pointer flex items-center gap-1 text-label font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Projects</span>
          </button>

          <div className="flex items-center gap-2">
            <h1 className="font-serif text-title md:text-title font-bold text-ink">
              {project.name}
            </h1>
            {getStatusBadge(project.status)}
            {project.version && (
              <span className="px-2 py-0.5 rounded bg-subtle-2 font-mono text-meta text-muted font-semibold">
                {project.version}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls & External Links */}
        <div className="flex items-center space-x-2 text-label">
          {project.branch && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-2 border border-line font-mono text-meta text-muted">
              <GitBranch className="w-3.5 h-3.5 text-faint" />
              <span>{project.branch}</span>
            </div>
          )}

          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg border border-line bg-surface-2 hover:bg-subtle text-muted hover:text-ink transition-colors cursor-pointer"
              title="Open GitHub Repository"
            >
              <Github className="w-4 h-4" />
            </a>
          )}

          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg border border-line bg-surface-2 hover:bg-subtle text-muted hover:text-ink transition-colors cursor-pointer"
              title="Open Live Deployment"
            >
              <Globe className="w-4 h-4" />
            </a>
          )}

          <button
            onClick={() => onEdit(project)}
            className="p-1.5 rounded-lg border border-line bg-surface-2 hover:bg-subtle text-muted hover:text-ink transition-colors cursor-pointer"
            title="Edit Project"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg border border-line bg-surface-2 hover:bg-danger-tint text-faint hover:text-danger transition-colors cursor-pointer"
            title="Delete Project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Sub-Header: Description, Tech Stack & Navigation Tabs */}
      <div className="px-6 pt-3 border-b border-line bg-surface-2 flex flex-wrap justify-between items-end gap-3 shrink-0">
        <div className="space-y-2 pb-3 max-w-2xl">
          {project.description && (
            <p className="text-label text-muted leading-relaxed font-normal">
              {project.description}
            </p>
          )}

          {/* Tech Stack Pills */}
          <div className="flex flex-wrap gap-1">
            {(project.techStack || []).map((t: string) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded bg-subtle border border-line font-mono text-meta text-accent font-medium shadow-2xs"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab("kanban")}
            className={`px-4 py-2 text-label font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "kanban"
                ? "border-accent text-ink"
                : "border-transparent text-faint hover:text-ink"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sprint Kanban</span>
            <span className="px-1.5 py-0.2 rounded-full bg-subtle-2 text-meta font-mono">
              {tasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("notes")}
            className={`px-4 py-2 text-label font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "notes"
                ? "border-accent text-ink"
                : "border-transparent text-faint hover:text-ink"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Architecture & Dev Notes</span>
          </button>

          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-label font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "overview"
                ? "border-accent text-ink"
                : "border-transparent text-faint hover:text-ink"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Progress & Metrics ({progress}%)</span>
          </button>
        </div>
      </div>

      {/* 3. Tab Content Panes */}
      <div className="flex-1 overflow-hidden flex flex-col bg-surface">
        {activeTab === "kanban" && (
          <ProjectKanban projectId={project._id} />
        )}

        {activeTab === "notes" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-5xl w-full mx-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <div>
                <h3 className="font-serif text-heading font-bold text-ink">
                  Technical Specs & Architecture RFC
                </h3>
                <p className="text-label text-faint">
                  Document system boundaries, data contracts, and deployment runbooks.
                </p>
              </div>
              <span className="text-meta font-mono text-ghost">
                Auto-saves in real-time
              </span>
            </div>

            <NoteEditor
              key={project._id}
              initialContent={project.devNotes || "<h2>Architecture Overview</h2><p>Document technical details here...</p>"}
              onChange={handleDevNotesChange}
              placeholder="Write architecture notes, paste code snippets, or document endpoints..."
            />
          </div>
        )}

        {activeTab === "overview" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-4xl w-full mx-auto space-y-6">
            {/* Progress Card */}
            <div className="p-6 bg-surface-2 border border-line rounded-2xl shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-serif text-heading font-bold text-ink">
                  Sprint Completion Rate
                </h3>
                <span className="font-mono text-heading font-bold text-accent">
                  {progress}% Complete
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-subtle-2 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-accent h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2 text-center text-label">
                <div className="p-3 bg-subtle rounded-xl border border-line">
                  <span className="font-mono text-heading font-bold text-ink">
                    {tasks.length}
                  </span>
                  <p className="text-faint text-meta mt-0.5">Total Tasks</p>
                </div>
                <div className="p-3 bg-subtle rounded-xl border border-line">
                  <span className="font-mono text-heading font-bold text-success">
                    {doneTasks}
                  </span>
                  <p className="text-faint text-meta mt-0.5">Done Tasks</p>
                </div>
                <div className="p-3 bg-subtle rounded-xl border border-line">
                  <span className="font-mono text-heading font-bold text-warn">
                    {tasks.length - doneTasks}
                  </span>
                  <p className="text-faint text-meta mt-0.5">Pending Issues</p>
                </div>
              </div>
            </div>

            {/* Quick Repository Overview */}
            <div className="p-6 bg-surface-2 border border-line rounded-2xl shadow-xs space-y-3 text-label">
              <h4 className="font-mono uppercase tracking-wider text-meta font-bold text-muted">
                Repository Metadata
              </h4>
              <div className="space-y-2 text-muted">
                <div className="flex justify-between py-1.5 border-b border-line">
                  <span className="text-faint">Branch</span>
                  <span className="font-mono font-medium text-ink">{project.branch || "main"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-line">
                  <span className="text-faint">Version</span>
                  <span className="font-mono font-medium text-ink">{project.version || "v1.0.0"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-line">
                  <span className="text-faint">Created At</span>
                  <span className="font-mono font-medium text-ink">
                    {new Date(project.createdAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
