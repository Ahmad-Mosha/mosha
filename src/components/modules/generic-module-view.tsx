"use client";

import React from "react";
import { ModuleId } from "@/lib/store";
import {
  Briefcase,
  Layers,
  GitBranch,
  Mic,
  Lightbulb,
  BarChart3,
  Calendar,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface GenericModuleProps {
  moduleId: ModuleId;
}

export function GenericModuleView({ moduleId }: GenericModuleProps) {
  const meta: Record<
    string,
    { title: string; subtitle: string; icon: React.ElementType; color: string; items: any[] }
  > = {
    career: {
      title: "Engineering Career & Job Market",
      subtitle: "Target roles, technical applications, recruiter pipeline, and salary milestones.",
      icon: Briefcase,
      color: "text-blue-700",
      items: [
        { title: "Backend Software Engineer (Go / Distributed Systems)", company: "Target Tier 1", status: "Applications Queued (18/30)" },
        { title: "Full Stack Engineer (TypeScript / Next.js / Cloud)", company: "Target Tier 1", status: "Preparation Phase" },
      ],
    },
    projects: {
      title: "Projects & Engineering Builds",
      subtitle: "Production architectures, microservices, open-source repositories, and build milestones.",
      icon: Layers,
      color: "text-[#333E50]",
      items: [
        { title: "Distributed Key-Value Store with Raft Consensus", stack: "Go • Raft • gRPC • WAL", status: "Active Build (v0.4)" },
        { title: "High-Throughput Task Queue & Worker Engine", stack: "Node.js • Redis • TypeScript", status: "Architecture RFC Ready" },
      ],
    },
    skills: {
      title: "Interactive Skill & Knowledge Graph",
      subtitle: "Visual dependency web mapping CS fundamentals, system design, and language mastery.",
      icon: GitBranch,
      color: "text-emerald-700",
      items: [
        { title: "Distributed Consensus (Raft / Paxos)", category: "Systems", status: "Mastered (100%)" },
        { title: "LSM Trees & Compaction Strategies", category: "Databases", status: "In Progress (85%)" },
        { title: "Linux Kernel Epoll & Async I/O (io_uring)", category: "OS / Networking", status: "Queued" },
      ],
    },
    interview: {
      title: "Interview Mode Arena",
      subtitle: "System Design blueprints, behavioral STAR story bank, and technical live drills.",
      icon: Mic,
      color: "text-purple-700",
      items: [
        { title: "Design a Global Rate Limiter & Token Bucket", type: "System Design", level: "Senior / Staff" },
        { title: "STAR: Resolving Silent Memory Leak in Production", type: "Behavioral Matrix", level: "Leadership" },
        { title: "Live Drill: Goroutine Leaks & Channel Deadlocks", type: "Go Deep Drill", level: "Advanced" },
      ],
    },
    ideas: {
      title: "Personal Ideas & Sandbox",
      subtitle: "Future startup concepts, hardware projects, technical experiments, and spontaneous sparks.",
      icon: Lightbulb,
      color: "text-amber-600",
      items: [
        { title: "Zero-Latency Local-First Sync Engine", notes: "CRDTs + SQLite embedded in WASM" },
        { title: "Self-Hosted Voice-Driven Second Brain", notes: "Local Whisper + Ollama + Convex Vector Search" },
      ],
    },
    analytics: {
      title: "Life & Engineering Analytics",
      subtitle: "Cross-system consistency, deep work velocity, and milestone progress curves.",
      icon: BarChart3,
      color: "text-rose-600",
      items: [
        { title: "Total Deep Work Logged", value: "148 Hours (This Month)" },
        { title: "Algorithmic Problems Mastered", value: "62 Problems (100% Mastery)" },
        { title: "Gym Workouts Completed", value: "16 Sessions (Avg 4.2/week)" },
      ],
    },
  };

  const current = meta[moduleId] || {
    title: "System Module",
    subtitle: "Personal workspace section.",
    icon: Sparkles,
    color: "text-[#333E50]",
    items: [],
  };

  const Icon = current.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bento-card rounded-xl p-6 flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs">
            <Icon className={`w-4 h-4 ${current.color}`} />
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#718096] font-semibold">
              MOSHA Module
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1A202C]">
            {current.title}
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5568] max-w-xl leading-relaxed">
            {current.subtitle}
          </p>
        </div>
      </div>

      {/* Items Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {current.items.map((item: any, idx: number) => (
          <div
            key={idx}
            className="bento-card rounded-xl p-5 flex flex-col justify-between space-y-3"
          >
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#718096]">
                {item.company || item.stack || item.category || item.type || "Record"}
              </span>
              <h3 className="font-serif text-base font-bold text-[#1A202C]">
                {item.title}
              </h3>
              {item.notes && (
                <p className="text-xs text-[#4A5568]">{item.notes}</p>
              )}
            </div>

            <div className="pt-3 border-t border-[#ECEAE4] flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-700 font-semibold">
                {item.status || item.value || item.level || "Active"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
