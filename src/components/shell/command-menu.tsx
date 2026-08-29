"use client";

import React, { useEffect } from "react";
import { Command } from "cmdk";
import { useMoshaStore, ModuleId } from "@/lib/store";
import {
  Target,
  Sparkles,
  Code2,
  BookOpen,
  Briefcase,
  Layers,
  Dumbbell,
  Wallet,
  BookMarked,
  GitBranch,
  Mic,
  Lightbulb,
  Plus,
  Play,
  RotateCcw,
  Search,
} from "lucide-react";

export function CommandMenu() {
  const {
    isCommandMenuOpen,
    setCommandMenuOpen,
    setActiveModule,
    setGoalDialogOpen,
    setEditingGoalId,
    startFocus,
    resetFocus,
  } = useMoshaStore();

  // Handle global ⌘K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandMenuOpen(!isCommandMenuOpen);
      }
      if (e.key === "Escape") {
        setCommandMenuOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isCommandMenuOpen, setCommandMenuOpen]);

  if (!isCommandMenuOpen) return null;

  const navigateTo = (mod: ModuleId) => {
    setActiveModule(mod);
    setCommandMenuOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-start justify-center pt-24 p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white border border-[#E2E8F0] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <Command className="w-full">
          <div className="flex items-center px-4 py-3 border-b border-[#E2E8F0] gap-3">
            <Search className="w-4 h-4 text-[#A0AEC0]" />
            <Command.Input
              autoFocus
              placeholder="Type a command, search modules, or take an action..."
              className="w-full text-sm text-[#1A202C] placeholder:text-[#A0AEC0] focus:outline-none font-sans"
            />
            <kbd
              onClick={() => setCommandMenuOpen(false)}
              className="px-2 py-0.5 rounded bg-[#F8F9FA] text-[10px] text-[#718096] border border-[#E2E8F0] cursor-pointer font-mono"
            >
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2 text-xs space-y-2">
            <Command.Empty className="py-6 text-center text-[#A0AEC0]">
              No results found.
            </Command.Empty>

            {/* Quick Actions */}
            <Command.Group
              heading="Quick Actions"
              className="text-[10px] font-mono uppercase tracking-wider text-[#718096] px-2 py-1"
            >
              <Command.Item
                onSelect={() => {
                  setEditingGoalId(null);
                  setGoalDialogOpen(true);
                  setCommandMenuOpen(false);
                }}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-[#1A202C] hover:bg-[#F3F4F6] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Plus className="w-3.5 h-3.5 text-[#333E50]" />
                  <span>Create New Major Life Goal</span>
                </div>
                <kbd className="text-[10px] font-mono text-[#A0AEC0]">N G</kbd>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  startFocus(50);
                  setCommandMenuOpen(false);
                }}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-[#1A202C] hover:bg-[#F3F4F6] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Play className="w-3.5 h-3.5 text-amber-600" />
                  <span>Start 50-Minute Deep Work Session</span>
                </div>
                <kbd className="text-[10px] font-mono text-[#A0AEC0]">S F</kbd>
              </Command.Item>
            </Command.Group>

            {/* Navigation Modules */}
            <Command.Group
              heading="Modules & Sections"
              className="text-[10px] font-mono uppercase tracking-wider text-[#718096] px-2 py-1"
            >
              <Command.Item
                onSelect={() => navigateTo("goals")}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#1A202C] hover:bg-[#F3F4F6] cursor-pointer transition-colors"
              >
                <Target className="w-3.5 h-3.5 text-[#333E50]" />
                <span>Major Life Goals (Pillars)</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigateTo("today")}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#1A202C] hover:bg-[#F3F4F6] cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Today's Sanctuary & 3 Big Rocks</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigateTo("problems")}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#1A202C] hover:bg-[#F3F4F6] cursor-pointer transition-colors"
              >
                <Code2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Algorithmic Mastery & LeetCode Hub</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigateTo("learning")}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#1A202C] hover:bg-[#F3F4F6] cursor-pointer transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>Learning & CS Roadmaps (OS, DB, Go, Node, Bun)</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigateTo("gym")}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#1A202C] hover:bg-[#F3F4F6] cursor-pointer transition-colors"
              >
                <Dumbbell className="w-3.5 h-3.5 text-rose-600" />
                <span>Iron Journal (Gym & Workouts)</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigateTo("finance")}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#1A202C] hover:bg-[#F3F4F6] cursor-pointer transition-colors"
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sovereign Ledger (Personal Finance)</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigateTo("journal")}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#1A202C] hover:bg-[#F3F4F6] cursor-pointer transition-colors"
              >
                <BookMarked className="w-3.5 h-3.5 text-purple-600" />
                <span>Engineering Journal & Reflections</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
