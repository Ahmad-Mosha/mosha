"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useMoshaStore } from "@/lib/store";
import { TaskCreateDialog } from "./task-create-dialog";
import { TaskItemRow } from "./task-item-row";
import { TasksKanbanBoard } from "./tasks-kanban-board";
import {
  Sparkles,
  Flame,
  Plus,
  LayoutList,
  Kanban,
  CheckCircle2,
  Filter,
  Search,
  Check,
  Calendar,
  Layers,
  Trash2,
  Clock,
  ArrowRight,
} from "lucide-react";
import confetti from "canvas-confetti";

export function TasksScreen() {
  const { startFocus, setActiveModule } = useMoshaStore();

  const convexTasks = useQuery(api.tasks.list);
  const goals = useQuery(api.goals.list) || [];
  const createTask = useMutation(api.tasks.create);
  const clearCompleted = useMutation(api.tasks.clearCompleted);

  // Warm instant hydration cache
  const [cachedTasks, setCachedTasks] = useState<any[]>([]);
  const [isLoadedFromCache, setIsLoadedFromCache] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("mosha_cached_tasks");
      if (saved) setCachedTasks(JSON.parse(saved));
    } catch {}
    setIsLoadedFromCache(true);
  }, []);

  useEffect(() => {
    if (convexTasks !== undefined) {
      setCachedTasks(convexTasks);
      try {
        localStorage.setItem("mosha_cached_tasks", JSON.stringify(convexTasks));
      } catch {}
    }
  }, [convexTasks]);

  const tasks = convexTasks !== undefined ? convexTasks : cachedTasks;
  const isLoading = convexTasks === undefined && cachedTasks.length === 0 && !isLoadedFromCache;

  // View settings
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [activeTab, setActiveTab] = useState<string>("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");

  // Inline Quick Add state
  const [inlineTitle, setInlineTitle] = useState("");
  const [inlineIsBigRock, setInlineIsBigRock] = useState(false);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [dialogStatus, setDialogStatus] = useState<string>("todo");

  const todayStr = new Date().toISOString().split("T")[0];

  // Filter computation
  const todayTasks = tasks.filter(
    (t: any) => t.isBigRock || t.dueDate === todayStr || !t.dueDate
  );
  const bigRocks = tasks.filter((t: any) => t.isBigRock);
  const completedBigRocks = bigRocks.filter((t: any) => t.status === "done").length;
  const totalCompleted = tasks.filter((t: any) => t.status === "done").length;

  const filteredTasks = tasks.filter((t: any) => {
    // Tab filter
    if (activeTab === "today") {
      const isDueToday = t.dueDate === todayStr;
      const isBig = t.isBigRock;
      const isGeneralTodo = !t.dueDate && t.status !== "done";
      if (!isDueToday && !isBig && !isGeneralTodo && t.status === "done") return false;
    } else if (activeTab === "upcoming") {
      if (!t.dueDate || t.dueDate <= todayStr) return false;
    } else if (activeTab === "big_rocks") {
      if (!t.isBigRock) return false;
    } else if (activeTab === "completed") {
      if (t.status !== "done") return false;
    }

    // Search filter
    if (
      searchQuery &&
      !t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Priority filter
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;

    // Module filter
    if (moduleFilter !== "all" && t.module !== moduleFilter) return false;

    return true;
  });

  const handleInlineAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTitle.trim()) return;

    await createTask({
      title: inlineTitle.trim(),
      isBigRock: inlineIsBigRock,
      priority: inlineIsBigRock ? "p1_urgent" : "p2_medium",
      module: "general",
      dueDate: todayStr,
      estimatedMinutes: inlineIsBigRock ? 50 : 25,
    });

    setInlineTitle("");
    setInlineIsBigRock(false);
  };

  const handleOpenCreateInStatus = (status: string) => {
    setEditingTask(null);
    setDialogStatus(status);
    setIsDialogOpen(true);
  };

  const getGoalTitle = (goalId?: string) => {
    if (!goalId) return undefined;
    const g = goals.find((item: any) => item._id === goalId);
    return g ? `${g.icon || "🎯"} ${g.title}` : undefined;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Hero Sanctuary & 3 Big Rocks Anchor */}
      <div className="bento-card rounded-2xl p-6 sm:p-7 bg-gradient-to-r from-white via-white to-[#F8F9FA] border-[#E2E8F0] space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 text-xs font-mono text-amber-700 font-semibold">
              <Sparkles className="w-4 h-4" />
              <span className="uppercase tracking-wider">
                Morning Sanctuary & Focus
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1A202C]">
              Good day, Ahmed.
            </h1>
            <p className="text-xs sm:text-sm text-[#4A5568] max-w-xl leading-relaxed">
              &ldquo;Win the morning, win the day.&rdquo; Lock in on your 3 Big Rocks, maintain daily momentum, and advance your engineering craft.
            </p>
          </div>

          {/* Quick Flow Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => startFocus(50)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#333E50] hover:bg-[#252E3B] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Start 50m Deep Work</span>
            </button>
          </div>
        </div>

        {/* 3 Big Rocks Visual Tracker Bar */}
        <div className="p-4 rounded-xl bg-[#FBFBFA] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center font-bold">
              <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <div className="font-serif font-bold text-sm text-[#1A202C]">
                Today&apos;s 3 Big Rocks Progress
              </div>
              <div className="text-[11px] font-mono text-[#718096]">
                {completedBigRocks}/{Math.max(bigRocks.length, 3)} Anchor Rocks Completed
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 flex-1 max-w-xs">
            <div className="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${
                    bigRocks.length > 0
                      ? (completedBigRocks / bigRocks.length) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <span className="font-mono text-xs font-bold text-[#1A202C] shrink-0">
              {bigRocks.length > 0
                ? Math.round((completedBigRocks / bigRocks.length) * 100)
                : 0}
              %
            </span>
          </div>
        </div>

        {/* Inline Quick-Add Task Input */}
        <form
          onSubmit={handleInlineAdd}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inlineTitle}
              onChange={(e) => setInlineTitle(e.target.value)}
              placeholder="Quick capture a task for today (Press Enter to save)..."
              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-xs text-[#1A202C] focus:outline-none focus:border-[#333E50] shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E2E8F0] bg-white text-xs text-[#718096] cursor-pointer select-none shadow-2xs hover:border-[#CBD5E1]">
              <input
                type="checkbox"
                checked={inlineIsBigRock}
                onChange={(e) => setInlineIsBigRock(e.target.checked)}
                className="rounded border-[#CBD5E1] text-amber-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px] font-mono font-medium flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                Big Rock
              </span>
            </label>

            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[#333E50] hover:bg-[#252E3B] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>

      {/* 2. Control Bar: Tabs, View Mode Switcher, and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#ECEAE4] pb-3">
        {/* Left: View Tabs */}
        <div className="flex items-center space-x-1.5 text-xs overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: "today", label: `Today's Sanctuary (${todayTasks.length})` },
            { id: "big_rocks", label: `🔥 Big Rocks (${bigRocks.length})` },
            { id: "all", label: `All Tasks (${tasks.length})` },
            { id: "upcoming", label: "Upcoming" },
            { id: "completed", label: `Completed (${totalCompleted})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#333E50] text-white font-semibold shadow-2xs"
                  : "bg-white border border-[#E2E8F0] text-[#718096] hover:text-[#1A202C]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right: View Toggle (List vs Kanban) & Full Create Modal */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center rounded-lg border border-[#E2E8F0] bg-white p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-[#333E50] text-white shadow-2xs"
                  : "text-[#718096] hover:text-[#1A202C]"
              }`}
              title="List View"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-[#333E50] text-white shadow-2xs"
                  : "text-[#718096] hover:text-[#1A202C]"
              }`}
              title="Kanban Board View"
            >
              <Kanban className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setEditingTask(null);
              setIsDialogOpen(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#333E50] hover:bg-[#252E3B] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* 3. Search & Category Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A0AEC0]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, descriptions..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#1A202C] focus:outline-none focus:border-[#333E50]"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#4A5568] focus:outline-none cursor-pointer"
          >
            <option value="all">All Domains</option>
            <option value="goals">🎯 Goals</option>
            <option value="problems">🧩 LeetCode</option>
            <option value="learning">📚 CS Learning</option>
            <option value="gym">🏋️ Gym</option>
            <option value="career">💼 Career</option>
            <option value="finance">💰 Finance</option>
            <option value="personal">🌱 Personal</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#4A5568] focus:outline-none cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="p1_urgent">🔥 P1 Urgent</option>
            <option value="p2_medium">⚡ P2 Medium</option>
            <option value="p3_low">🌱 P3 Low</option>
          </select>
        </div>
      </div>

      {/* 4. Task Content (List View vs Kanban View) */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 bg-[#E2E8F0] rounded-xl w-full"
            />
          ))}
        </div>
      ) : viewMode === "kanban" ? (
        <TasksKanbanBoard
          tasks={filteredTasks}
          onEdit={(t) => {
            setEditingTask(t);
            setIsDialogOpen(true);
          }}
          onAddTaskInStatus={handleOpenCreateInStatus}
        />
      ) : filteredTasks.length === 0 ? (
        <div className="bento-card rounded-2xl p-12 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-[#CBD5E1] mx-auto" />
          <h3 className="font-serif text-lg font-bold text-[#1A202C]">
            No tasks found in this view
          </h3>
          <p className="text-xs text-[#718096] max-w-sm mx-auto">
            Enjoy the peace of a clean slate, or click &ldquo;New Task&rdquo; to schedule your next objective.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task: any) => (
            <TaskItemRow
              key={task._id}
              task={task}
              onEdit={(t) => {
                setEditingTask(t);
                setIsDialogOpen(true);
              }}
              goalTitle={getGoalTitle(task.goalId)}
            />
          ))}
        </div>
      )}

      {/* 5. Create / Edit Task Modal Dialog */}
      <TaskCreateDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingTask(null);
        }}
        editingTask={editingTask}
        defaultModule={moduleFilter !== "all" ? moduleFilter : "general"}
        defaultIsBigRock={activeTab === "big_rocks"}
      />
    </div>
  );
}
