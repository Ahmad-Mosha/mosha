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
  FileText,
  Code2,
  BookOpen,
  Dumbbell,
  Wallet,
  BookMarked,
  Flame,
  Plus,
  ArrowRight,
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
  const notes = useQuery(api.notes.listNotes) || [];

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
        className="w-full max-w-xl bg-surface-2 border border-line rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="flex flex-col h-full text-xs">
          <div className="flex items-center border-b border-line px-4 py-3">
            <Search className="w-4 h-4 text-faint mr-2 shrink-0" />
            <Command.Input
              autoFocus
              placeholder="Type a command, jump to module, or search..."
              className="w-full bg-transparent focus:outline-none text-sm text-ink placeholder:text-ghost"
            />
            <kbd className="px-2 py-0.5 rounded bg-subtle-2 text-[10px] font-mono text-faint border border-line">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2 space-y-1">
            <Command.Empty className="py-6 text-center text-xs text-ghost">
              No matching commands or records found.
            </Command.Empty>

            {/* Quick Actions Group */}
            <Command.Group heading="Quick Actions" className="text-[10px] font-mono uppercase text-faint px-2 py-1">
              <Command.Item
                onSelect={() => {
                  setCommandMenuOpen(false);
                  setTaskDialogOpen(true);
                }}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-subtle cursor-pointer text-xs transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded-md bg-accent text-accent-fg flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-ink">Create New Task</span>
                </div>
                <span className="font-mono text-[10px] text-faint">Action</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  setCommandMenuOpen(false);
                  setGoalDialogOpen(true);
                }}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-subtle cursor-pointer text-xs transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded-md bg-purple-600 text-white flex items-center justify-center">
                    <Target className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-ink">Add Major Life Goal</span>
                </div>
                <span className="font-mono text-[10px] text-faint">Action</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  setCommandMenuOpen(false);
                  startFocus(50);
                }}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-subtle cursor-pointer text-xs transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded-md bg-amber-500 text-white flex items-center justify-center">
                    <Flame className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-ink">Start 50m Deep Work Block</span>
                </div>
                <span className="font-mono text-[10px] text-faint">Focus</span>
              </Command.Item>
            </Command.Group>

            {/* Navigation Modules Group */}
            <Command.Group heading="Navigation" className="text-[10px] font-mono uppercase text-faint px-2 py-1 pt-2">
              <Command.Item
                onSelect={() => {
                  setActiveModule("tasks");
                  setCommandMenuOpen(false);
                }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-subtle cursor-pointer text-xs text-ink"
              >
                <div className="flex items-center space-x-2">
                  <CheckSquare className="w-4 h-4 text-accent" />
                  <span>Tasks & Focus (Home)</span>
                </div>
                <ArrowRight className="w-3 h-3 text-ghost" />
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  setActiveModule("goals");
                  setCommandMenuOpen(false);
                }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-subtle cursor-pointer text-xs text-ink"
              >
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-purple-700" />
                  <span>Major Life Goals</span>
                </div>
                <ArrowRight className="w-3 h-3 text-ghost" />
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  setActiveModule("notes");
                  setCommandMenuOpen(false);
                }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-subtle cursor-pointer text-xs text-ink"
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-700" />
                  <span>Notes & Knowledge Base</span>
                </div>
                <ArrowRight className="w-3 h-3 text-ghost" />
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  setActiveModule("problems");
                  setCommandMenuOpen(false);
                }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-subtle cursor-pointer text-xs text-ink"
              >
                <div className="flex items-center space-x-2">
                  <Code2 className="w-4 h-4 text-blue-700" />
                  <span>Problem Solving & LeetCode</span>
                </div>
                <ArrowRight className="w-3 h-3 text-ghost" />
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  setActiveModule("learning");
                  setCommandMenuOpen(false);
                }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-subtle cursor-pointer text-xs text-ink"
              >
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-emerald-700" />
                  <span>Learning & CS Roadmaps</span>
                </div>
                <ArrowRight className="w-3 h-3 text-ghost" />
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  setActiveModule("gym");
                  setCommandMenuOpen(false);
                }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-subtle cursor-pointer text-xs text-ink"
              >
                <div className="flex items-center space-x-2">
                  <Dumbbell className="w-4 h-4 text-rose-600" />
                  <span>Iron Journal (Gym & Fitness)</span>
                </div>
                <ArrowRight className="w-3 h-3 text-ghost" />
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  setActiveModule("finance");
                  setCommandMenuOpen(false);
                }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-subtle cursor-pointer text-xs text-ink"
              >
                <div className="flex items-center space-x-2">
                  <Wallet className="w-4 h-4 text-emerald-700" />
                  <span>Sovereign Ledger (Finance)</span>
                </div>
                <ArrowRight className="w-3 h-3 text-ghost" />
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  setActiveModule("journal");
                  setCommandMenuOpen(false);
                }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-subtle cursor-pointer text-xs text-ink"
              >
                <div className="flex items-center space-x-2">
                  <BookMarked className="w-4 h-4 text-purple-700" />
                  <span>Engineering Journal</span>
                </div>
                <ArrowRight className="w-3 h-3 text-ghost" />
              </Command.Item>
            </Command.Group>

            {/* Quick Notes Search */}
            {notes.length > 0 && (
              <Command.Group heading="Recent Notes" className="text-[10px] font-mono uppercase text-faint px-2 py-1 pt-2">
                {notes.slice(0, 4).map((n: any) => (
                  <Command.Item
                    key={n._id}
                    onSelect={() => {
                      setActiveModule("notes");
                      setCommandMenuOpen(false);
                    }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-subtle cursor-pointer text-xs"
                  >
                    <span className="truncate text-ink">{n.title}</span>
                    <span className="text-[10px] font-mono text-ghost">Note</span>
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
