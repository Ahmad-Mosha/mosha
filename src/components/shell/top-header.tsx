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
    tasks: "Tasks & 3 Big Rocks (Home)",
    goals: "Major Life Goals",
    today: "Today's Sanctuary",
    problems: "Algorithmic Mastery Hub",
    learning: "Learning & CS Subjects",
    career: "Engineering Career & Market",
    projects: "Projects & Tech Builds",
    gym: "Iron Journal (Fitness)",
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
    <header className="sticky top-0 z-40 h-13 bg-[#FDFDFD]/90 backdrop-blur-md border-b border-[#E2E8F0] px-6 flex items-center justify-between transition-all">
      {/* Left: Section Context & Global Search */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-serif font-semibold text-[#1A202C]">
            MOSHA
          </span>
          <span className="text-[#CBD5E1]">/</span>
          <span className="font-medium text-[#4A5568]">
            {moduleTitles[activeModule] || "Workspace"}
          </span>
        </div>

        {/* Global Search Bar (Triggers ⌘K) */}
        <button
          onClick={() => setCommandMenuOpen(true)}
          className="hidden sm:flex items-center space-x-2.5 px-3 py-1.5 rounded-lg bg-[#F8F9FA] hover:bg-[#F1F3F5] border border-[#E2E8F0] text-xs text-[#718096] transition-colors shadow-2xs group cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-[#A0AEC0] group-hover:text-[#4A5568]" />
          <span className="text-xs">Search tasks, goals, commands...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white text-[10px] text-[#718096] border border-[#E2E8F0] font-mono shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Deep Work Focus Timer & Quick Actions */}
      <div className="flex items-center space-x-3">
        {/* Deep Work Flow Timer Pill */}
        <div className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-[#F8F9FA] border border-[#E2E8F0] text-xs font-mono">
          <Flame
            className={`w-3.5 h-3.5 ${
              focusRunning ? "text-amber-500 animate-pulse" : "text-[#A0AEC0]"
            }`}
          />
          <span className="font-semibold text-[#1A202C]">
            {formatTimer(focusSecondsLeft)}
          </span>
          <button
            onClick={() => (focusRunning ? pauseFocus() : startFocus())}
            className="p-1 text-[#4A5568] hover:text-[#1A202C] transition-colors cursor-pointer"
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
            className="p-1 text-[#A0AEC0] hover:text-[#4A5568] transition-colors cursor-pointer"
            title="Reset timer"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* Dynamic Contextual Quick Add Button */}
        <button
          onClick={handleQuickAdd}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#333E50] hover:bg-[#252E3B] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{activeModule === "goals" ? "New Goal" : "New Task"}</span>
        </button>

        {/* Command Palette (⌘K) */}
        <button
          onClick={() => setCommandMenuOpen(true)}
          className="p-2 rounded-lg text-[#718096] hover:text-[#1A202C] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
          title="Command Palette (⌘K)"
        >
          <Command className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
