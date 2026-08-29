"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ProjectDialog } from "./project-dialog";
import { ProjectDetailView } from "./project-detail-view";
import {
  Plus,
  Search,
  Terminal,
  FolderGit2,
  GitBranch,
  Layers,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export function ProjectsScreen() {
  const projects = useQuery(api.projects.listProjects) || [];

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);

  // If a project is selected, show the detailed Project Workspace
  if (selectedProjectId) {
    return (
      <ProjectDetailView
        projectId={selectedProjectId}
        onBack={() => setSelectedProjectId(null)}
        onEdit={(proj) => {
          setEditingProject(proj);
          setIsDialogOpen(true);
        }}
      />
    );
  }

  // Filter projects
  const filteredProjects = projects.filter((p: any) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name?.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q);
      const matchTech = p.techStack?.some((t: string) => t.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchTech) return false;
    }
    return true;
  });

  const getStatusDot = (status: string) => {
    switch (status) {
      case "active":
        return <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />;
      case "in_progress":
        return <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />;
      case "in_review":
        return <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />;
      case "completed":
        return <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />;
      default:
        return <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />;
    }
  };

  return (
    <div className="w-full h-full bg-[#FDFDFD] flex flex-col overflow-hidden select-none animate-in fade-in duration-150">
      {/* 1. Header & Action Bar */}
      <div className="px-6 py-4 border-b border-[#ECEAE4] bg-white flex flex-wrap justify-between items-center gap-4 shrink-0">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A202C]">
            Projects Workspace
          </h1>
          <p className="text-xs text-[#718096]">
            Active repositories, microservices, and sprint Kanban boards.
          </p>
        </div>

        {/* Search, Status Filters & New Project Button */}
        <div className="flex items-center gap-2.5 text-xs">
          {/* Search */}
          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A0AEC0]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search repositories & tech..."
              className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#1A202C] focus:outline-none focus:border-[#333E50]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white px-2.5 py-1.5 rounded-xl border border-[#E2E8F0] text-xs text-[#1A202C] focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="planning">Planning</option>
            <option value="completed">Completed</option>
          </select>

          <button
            onClick={() => {
              setEditingProject(null);
              setIsDialogOpen(true);
            }}
            className="px-4 py-2 bg-[#333E50] hover:bg-[#252E3B] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* 2. Active Repositories Grid (Matching Stitch Design) */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-mono text-xs text-[#4A5568] uppercase tracking-widest font-bold">
              Active Repositories ({filteredProjects.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Project Cards */}
            {filteredProjects.map((project: any) => (
              <div
                key={project._id}
                onClick={() => setSelectedProjectId(project._id)}
                className="bg-white border border-[#E2E8F0] hover:border-[#333E50] p-5 rounded-2xl cursor-pointer transition-all shadow-2xs hover:shadow-md flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="space-y-2">
                  {/* Card Header: Title & Status Indicator */}
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-serif text-base font-bold text-[#1A202C] group-hover:text-[#333E50] transition-colors line-clamp-1">
                      {project.name}
                    </h3>
                    <div className="mt-1">{getStatusDot(project.status)}</div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[#4A5568] line-clamp-2 leading-relaxed h-9">
                    {project.description || "No description provided."}
                  </p>

                  {/* Progress bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] font-mono text-[#718096]">
                      <span>Sprint Progress</span>
                      <span>
                        {project.doneTaskCount || 0}/{project.taskCount || 0} tasks ({project.progress || 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#EDF2F7] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#333E50] h-full rounded-full transition-all duration-300"
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer: Tech Stack Pills & Version */}
                <div className="mt-4 pt-3 border-t border-[#ECEAE4] flex justify-between items-center text-xs">
                  <div className="flex gap-1 flex-wrap items-center max-w-[70%] overflow-hidden">
                    {(project.techStack || []).slice(0, 3).map((tech: string) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded font-mono text-[10px] text-[#4A5568] font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                    {(project.techStack || []).length > 3 && (
                      <span className="text-[10px] font-mono text-[#A0AEC0]">
                        +{project.techStack.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 font-mono text-[11px] text-[#718096]">
                    <span>{project.version || "v1.0.0"}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            ))}

            {/* Dotted Create Project Card */}
            <div
              onClick={() => {
                setEditingProject(null);
                setIsDialogOpen(true);
              }}
              className="border-2 border-dashed border-[#CBD5E1] rounded-2xl p-5 hover:border-[#333E50] transition-all cursor-pointer flex flex-col items-center justify-center min-h-[190px] group bg-[#FAFAFA] hover:bg-[#F4F5F7] space-y-2"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-[#CBD5E1] flex items-center justify-center group-hover:border-[#333E50] transition-colors">
                <Plus className="w-5 h-5 text-[#718096] group-hover:text-[#333E50]" />
              </div>
              <span className="font-semibold text-xs text-[#718096] group-hover:text-[#333E50] transition-colors">
                New Project Repository
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Create / Edit Project Modal */}
      <ProjectDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingProject(null);
        }}
        editingProject={editingProject}
      />
    </div>
  );
}
