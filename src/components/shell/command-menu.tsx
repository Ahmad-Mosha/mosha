"use client";

import React, { useEffect } from "react";
import { Command } from "cmdk";
import { useMoshaStore } from "@/lib/store";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Search,
  CheckSquare,
  Target,
  Code2,
  BookOpen,
  Dumbbell,
  Wallet,
  BookMarked,
  Flame,
  Plus,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export function CommandMenu() {
  const {
    isCommandMenuOpen,
    setCommandMenuOpen,
    setActiveModule,
    setTaskDialogOpen,
    setGoalDialogOpen,
    startFocus,
  } = useMoshaStore();

  const tasks = useQuery(api.tasks.list) || [];
  const goals = useQuery(api.goals.list) || [];

  // Toggle Command Menu via ⌘K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandMenuOpen(!isCommandMenuOpen);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isCommandMenuOpen, setCommandMenuOpen]);

  if (!isCommandMenuOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-start justify-center pt-24 px-4 animate-in fade-in"
      onClick={() => setCommandMenuOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="flex flex-col h-full text-xs">
          <div className="flex items-center border-b border-[#ECEAE4] px-4 py-3">
            <Search className="w-4 h-4 text-[#718096] mr-2 shrink-0" />
            <Command.Input
              autoFocus
              placeholder="Type a command, jump to module, or search..."
              className="w-full bg-transparent focus:outline-none text-sm text-[#1A202C] placeholder:text-[#A0AEC0]"
            />
            <kbd className="px-2 py-0.5 rounded bg-[#F1F3F5] text-[10px] font-mono text-[#718096] border border-[#E2E8F0]">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2 space-y-1">
            <Command.Empty className="py-6 text-center text-xs text-[#A0AEC0]">
              No matching commands or records found.
            </Command.Empty>

            {/* Quick Actions Group */}
            <Command.Group heading="Quick Actions" className="text-[10px] font-mono uppercase text-[#718096] px-2 py-1">
              <Command.Item
                onSelect={() => {
                  setCommandMenuOpen(false);
                  setTaskDialogOpen(true);
                }}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#F8F9FA] cursor-pointer text-xs transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded-md bg-[#333E50] text-white flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-[#1A202C]">Create New Task</span>
                </div>
                <span className="font-mono text-[10px] text-[#718096]">Action</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  setCommandMenuOpen(false);
                  setGoalDialogOpen(true);
                }}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#F8F9FA] cursor-pointer text-xs transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded-md bg-purple-600 text-white flex items-center justify-center">
                    <Target className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-[#1A202C]">Add Major Life Goal</span>
                </div>
                <span className="font-mono text-[10px] text-[#718096]">Action</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  setCommandMenuOpen(false);
                  startFocus(50);
                }}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#F8F9FA] cursor-pointer text-xs transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded-md bg-amber-500 text-white flex items-center justify-center">
                    <Flame className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-[#1A202C]">Start 50m Deep Work Block</span>
                </div>
                <span className="font-mono text-[10px] text-[#718096]">Focus</span>
              </Command.Item>
            </Command.Group>

            {/* Navigation Modules Group */}
            <Command.Group heading="Navigation" className="text-[10px] font-mono uppercase text-[#718096] px-2 py-1 pt-2">
              <Command.Item
                onSelect={() => {
                  setActiveModule("tasks");
                  setCommandMenuOpen(false);
                }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F8F9FA] cursor-pointer text-xs text-[#1A202C]"
              >
                <div className="flex items-center space-x-2">
                  <CheckSquare className="w-4 h-4 text-[#333E50]" />
                  <span>Tasks & 3 Big Rocks (Home)</span>
                </div>
                <ArrowRight className="w-3 h-3 text-[#A0AEC0]" />
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  setActiveModule("goals");
                  setCommandMenuOpen(false);
                }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F8F9FA] cursor-pointer text-xs text-[#1A202C]"
              >
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-purple-700" />
                  <span>Major Life Goals</span>
                </div>
                <ArrowRight className="w-3 h-3 text-[#A0AEC0]" />
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  setActiveModule("problems");
                  setCommandMenuOpen(false);
                }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F8F9FA] cursor-pointer text-xs text-[#1A202C]"
              >
                <div className="flex items-center space-x-2">
                  <Code2 className="w-4 h-4 text-blue-700" />
                  <span>Problem Solving & LeetCode</span>
                </div>
                <ArrowRight className="w-3 h-3 text-[#A0AEC0]" />
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  setActiveModule("learning");
                  setCommandMenuOpen(false);
                }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F8F9FA] cursor-pointer text-xs text-[#1A202C]"
              >
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-emerald-700" />
                  <span>Learning & CS Roadmaps</span>
                </div>
                <ArrowRight className="w-3 h-3 text-[#A0AEC0]" />
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  setActiveModule("gym");
                  setCommandMenuOpen(false);
                }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F8F9FA] cursor-pointer text-xs text-[#1A202C]"
              >
                <div className="flex items-center space-x-2">
                  <Dumbbell className="w-4 h-4 text-rose-600" />
                  <span>Iron Journal (Gym & Fitness)</span>
                </div>
                <ArrowRight className="w-3 h-3 text-[#A0AEC0]" />
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  setActiveModule("finance");
                  setCommandMenuOpen(false);
                }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F8F9FA] cursor-pointer text-xs text-[#1A202C]"
              >
                <div className="flex items-center space-x-2">
                  <Wallet className="w-4 h-4 text-emerald-700" />
                  <span>Sovereign Ledger (Finance)</span>
                </div>
                <ArrowRight className="w-3 h-3 text-[#A0AEC0]" />
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  setActiveModule("journal");
                  setCommandMenuOpen(false);
                }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F8F9FA] cursor-pointer text-xs text-[#1A202C]"
              >
                <div className="flex items-center space-x-2">
                  <BookMarked className="w-4 h-4 text-purple-700" />
                  <span>Engineering Journal</span>
                </div>
                <ArrowRight className="w-3 h-3 text-[#A0AEC0]" />
              </Command.Item>
            </Command.Group>

            {/* Quick Tasks List search */}
            {tasks.length > 0 && (
              <Command.Group heading="Active Tasks" className="text-[10px] font-mono uppercase text-[#718096] px-2 py-1 pt-2">
                {tasks.slice(0, 5).map((t: any) => (
                  <Command.Item
                    key={t._id}
                    onSelect={() => {
                      setActiveModule("tasks");
                      setCommandMenuOpen(false);
                    }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F8F9FA] cursor-pointer text-xs"
                  >
                    <span className="truncate text-[#1A202C]">{t.title}</span>
                    <span className="text-[10px] font-mono text-[#A0AEC0]">
                      {t.status === "done" ? "Done" : "Todo"}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
