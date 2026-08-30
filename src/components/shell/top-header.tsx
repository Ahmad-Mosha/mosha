"use client";

import React, { useEffect } from "react";
import { useMoshaStore } from "@/lib/store";
import {
  Search,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Command,
  Flame,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function TopHeader() {
  const {
    activeModule,
    setCommandMenuOpen,
    setTaskDialogOpen,
    setGoalDialogOpen,
    setEditingGoalId,
    setEditingTaskId,
    focusRunning,
    focusSecondsLeft,
    startFocus,
    pauseFocus,
    resetFocus,
    tickFocus,
  } = useMoshaStore();

  // Focus Timer interval effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (focusRunning) {
      interval = setInterval(() => {
        tickFocus();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [focusRunning, tickFocus]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const moduleTitles: Record<string, string> = {
    tasks: "Tasks & Focus (Home)",
    goals: "Major Life Goals",
    notes: "Notes & Knowledge Base",
    calendar: "Calendar",
    today: "Today's Sanctuary",
    problems: "Algorithmic Mastery Hub",
    learning: "Learning",
    career: "Engineering Career & Market",
    projects: "Projects",
    gym: "Gym",
    finance: "Sovereign Ledger (Finance)",
    journal: "Engineering Journal",
    skills: "Interactive Skill Graph",
    interview: "Interview Mode Arena",
    ideas: "Personal Ideas & Sandbox",
    analytics: "Life & Engineering Analytics",
  };

  const handleQuickAdd = () => {
    if (activeModule === "goals") {
      setEditingGoalId(null);
      setGoalDialogOpen(true);
    } else {
      setEditingTaskId(null);
      setTaskDialogOpen(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 h-13 bg-surface/90 backdrop-blur-md border-b border-line px-6 flex items-center justify-between transition-all">
      {/* Left: Section Context & Global Search */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2 text-label">
          <span className="font-serif font-semibold text-ink">
            MOSHA
          </span>
          <span className="text-line-2">/</span>
          <span className="font-medium text-muted">
            {moduleTitles[activeModule] || "Workspace"}
          </span>
        </div>

        {/* Global Search Bar (Triggers ⌘K) */}
        <button
          onClick={() => setCommandMenuOpen(true)}
          className="hidden sm:flex items-center space-x-2.5 px-3 py-1.5 rounded-lg bg-subtle hover:bg-subtle-2 border border-line text-label text-faint transition-colors shadow-2xs group cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-ghost group-hover:text-muted" />
          <span className="text-label">Search notes, tasks, goals...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-surface-2 text-meta text-faint border border-line font-mono shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Deep Work Focus Timer & Quick Actions */}
      <div className="flex items-center space-x-3">
        {/* Deep Work Flow Timer Pill */}
        <div className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-subtle border border-line text-label font-mono">
          <Flame
            className={`w-3.5 h-3.5 ${
              focusRunning ? "text-warn animate-pulse" : "text-ghost"
            }`}
          />
          <span className="font-semibold text-ink">
            {formatTimer(focusSecondsLeft)}
          </span>
          <button
            onClick={() => (focusRunning ? pauseFocus() : startFocus())}
            className="p-1 text-muted hover:text-ink transition-colors cursor-pointer"
            title={focusRunning ? "Pause timer" : "Start 50m focus"}
          >
            {focusRunning ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3" />
            )}
          </button>
          <button
            onClick={resetFocus}
            className="p-1 text-ghost hover:text-muted transition-colors cursor-pointer"
            title="Reset timer"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* Dynamic Contextual Quick Add Button */}
        <button
          onClick={handleQuickAdd}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg text-label font-semibold shadow-2xs transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{activeModule === "goals" ? "New Goal" : "New Task"}</span>
        </button>

        <ThemeToggle />

        {/* Command Palette (⌘K) */}
        <button
          onClick={() => setCommandMenuOpen(true)}
          className="p-2 rounded-lg text-faint hover:text-ink hover:bg-subtle-2 transition-colors cursor-pointer"
          title="Command Palette (⌘K)"
        >
          <Command className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
