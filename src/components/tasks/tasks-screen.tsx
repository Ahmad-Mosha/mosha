"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { TaskCreateDialog } from "./task-create-dialog";
import { TaskItemRow } from "./task-item-row";
import { TasksKanbanBoard } from "./tasks-kanban-board";
import { Select } from "@/components/ui/select";
import { AnimatePresence, motion } from "framer-motion";
import { listContainer, listItem } from "@/lib/motion";
import {
  Plus,
  CheckCircle2,
  Search,
  Trash2,
  LayoutList,
  Kanban,
  RotateCcw,
} from "lucide-react";

export function TasksScreen() {
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

  // View & Filters State
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");

  // Inline Quick Add state
  const [inlineTitle, setInlineTitle] = useState("");
  const [inlinePriority, setInlinePriority] = useState("p2_medium");
  const [inlineModule, setInlineModule] = useState("general");
  const [inlineIsDaily, setInlineIsDaily] = useState(false);
  const [isInlineSubmitting, setIsInlineSubmitting] = useState(false);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  // Calculations
  const completedCount = tasks.filter((t: any) => t.status === "done").length;
  const dailyTasks = tasks.filter((t: any) => t.isDaily);
  const todayTasks = tasks.filter(
    (t: any) => t.isDaily || t.dueDate === todayStr || (!t.dueDate && t.status !== "done")
  );

  const filteredTasks = tasks.filter((t: any) => {
    if (activeTab === "today") {
      const isDailyTask = t.isDaily;
      const isDueToday = t.dueDate === todayStr;
      const isUndatedTodo = !t.dueDate && t.status !== "done";
      if (!isDailyTask && !isDueToday && !isUndatedTodo && t.status === "done") return false;
      if (t.dueDate && t.dueDate !== todayStr && !isDailyTask) return false;
    } else if (activeTab === "daily") {
      if (!t.isDaily) return false;
    } else if (activeTab === "upcoming") {
      if (!t.dueDate || t.dueDate <= todayStr || t.status === "done" || t.isDaily) return false;
    } else if (activeTab === "completed") {
      if (t.status !== "done") return false;
    }

    if (
      searchQuery &&
      !t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (moduleFilter !== "all" && t.module !== moduleFilter) return false;

    return true;
  });

  const handleInlineAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTitle.trim() || isInlineSubmitting) return;

    setIsInlineSubmitting(true);
    try {
      await createTask({
        title: inlineTitle.trim(),
        priority: inlinePriority,
        module: inlineModule,
        dueDate: inlineIsDaily ? undefined : todayStr,
        isDaily: inlineIsDaily,
      });
      setInlineTitle("");
      setInlineIsDaily(false);
    } catch (err) {
      console.error("Failed to create inline task:", err);
    } finally {
      setIsInlineSubmitting(false);
    }
  };

  const getGoalTitle = (goalId?: string) => {
    if (!goalId) return undefined;
    const g = goals.find((item: any) => item._id === goalId);
    return g ? `${g.icon || "🎯"} ${g.title}` : undefined;
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="font-serif text-title sm:text-display font-bold text-ink">
              Tasks
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-label font-mono font-semibold bg-subtle-2 text-accent">
              {completedCount}/{tasks.length} Done
            </span>
          </div>
          <p className="text-label text-faint mt-0.5">
            Daily execution, recurring habits, and actionable roadmap.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle: List vs Kanban */}
          <div className="flex items-center rounded-lg border border-line bg-surface-2 p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md text-label transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-accent text-accent-fg shadow-2xs"
                  : "text-faint hover:text-ink"
              }`}
              title="List View"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-md text-label transition-colors cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-accent text-accent-fg shadow-2xs"
                  : "text-faint hover:text-ink"
              }`}
              title="Sprint / Kanban Board"
            >
              <Kanban className="w-4 h-4" />
            </button>
          </div>

          {completedCount > 0 && (
            <button
              onClick={() => clearCompleted()}
              title="Clear all completed tasks"
              className="px-3 py-2 rounded-lg bg-surface-2 border border-line hover:bg-danger-tint text-faint hover:text-danger text-label font-medium transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Done</span>
            </button>
          )}

          <button
            onClick={() => {
              setEditingTask(null);
              setIsDialogOpen(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg text-label font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* 2. Fast Inline Quick Add Row */}
      <form
        onSubmit={handleInlineAdd}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-xl bg-surface-2 border border-line shadow-2xs hover:border-line-2 transition-all"
      >
        <div className="flex items-center flex-1">
          <Plus className="w-4 h-4 text-ghost ml-2 shrink-0" />
          <input
            type="text"
            value={inlineTitle}
            onChange={(e) => setInlineTitle(e.target.value)}
            placeholder="Add a task or daily habit... (Press Enter to save)"
            className="w-full bg-transparent px-2 py-1 text-label text-ink focus:outline-none placeholder:text-ghost"
          />
        </div>

        <div className="flex items-center space-x-1.5 shrink-0 justify-end">
          {/* Daily toggle button */}
          <label
            className={`px-2 py-1 rounded-md text-meta font-mono flex items-center gap-1 cursor-pointer select-none transition-colors border ${
              inlineIsDaily
                ? "bg-info-tint text-info border-info/35 font-semibold"
                : "bg-subtle text-faint border-line hover:text-ink"
            }`}
          >
            <input
              type="checkbox"
              checked={inlineIsDaily}
              onChange={(e) => setInlineIsDaily(e.target.checked)}
              className="hidden"
            />
            <RotateCcw className="w-3 h-3" />
            <span>Daily</span>
          </label>

          <Select
            value={inlineModule}
            onValueChange={setInlineModule}
            size="sm"
            mono
            options={[
              { value: "general", label: "📋 General" },
              { value: "problems", label: "🧩 LeetCode" },
              { value: "learning", label: "📚 Learning" },
              { value: "gym", label: "🏋️ Gym" },
              { value: "career", label: "💼 Career" },
              { value: "goals", label: "🎯 Goals" },
              { value: "finance", label: "💰 Finance" },
              { value: "personal", label: "🌱 Personal" }
            ]}
          />

          <Select
            value={inlinePriority}
            onValueChange={setInlinePriority}
            size="sm"
            mono
            options={[
              { value: "p1_urgent", label: "🔥 High" },
              { value: "p2_medium", label: "⚡ Medium" },
              { value: "p3_low", label: "🌱 Low" }
            ]}
          />

          <button
            type="submit"
            disabled={!inlineTitle.trim() || isInlineSubmitting}
            className="px-3 py-1 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-40 text-accent-fg text-label font-semibold transition-colors cursor-pointer"
          >
            {isInlineSubmitting ? "Adding..." : "Add"}
          </button>
        </div>
      </form>

      {/* 3. Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Left: View Tabs */}
        <div className="flex items-center space-x-1.5 text-label overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "all", label: `All (${tasks.length})` },
            { id: "today", label: `Today (${todayTasks.length})` },
            { id: "daily", label: `🔁 Daily Habits (${dailyTasks.length})` },
            { id: "upcoming", label: "Upcoming" },
            { id: "completed", label: `Completed (${completedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "bg-accent text-accent-fg font-semibold shadow-2xs"
                  : "bg-surface-2 border border-line text-faint hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right: Search & Dropdowns */}
        <div className="flex items-center space-x-2 text-label">
          <div className="relative w-44">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ghost" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-line bg-surface-2 text-label text-ink focus:outline-none focus:border-accent"
            />
          </div>

          <Select
            value={moduleFilter}
            onValueChange={setModuleFilter}
            options={[
              { value: "all", label: "All Domains" },
              { value: "problems", label: "🧩 LeetCode" },
              { value: "learning", label: "📚 CS Learning" },
              { value: "gym", label: "🏋️ Gym" },
              { value: "career", label: "💼 Career" },
              { value: "goals", label: "🎯 Goals" },
              { value: "finance", label: "💰 Finance" },
              { value: "personal", label: "🌱 Personal" },
              { value: "general", label: "📋 General" }
            ]}
          />
        </div>
      </div>

      {/* 4. Task Content (List View vs Kanban Board View) */}
      {isLoading ? (
        <div className="space-y-2.5 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-line rounded-xl w-full"
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
          onAddTaskInStatus={(status) => {
            setEditingTask(null);
            setIsDialogOpen(true);
          }}
        />
      ) : filteredTasks.length === 0 ? (
        <div className="bento-card rounded-2xl p-12 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-line-2 mx-auto" />
          <h3 className="font-serif text-heading font-bold text-ink">
            No tasks found
          </h3>
          <p className="text-label text-faint max-w-sm mx-auto">
            All clear in this view. Use the quick add input above to capture your next task or daily habit.
          </p>
        </div>
      ) : (
        <motion.div
          className="space-y-2.5"
          variants={listContainer}
          initial="initial"
          animate="animate"
        >
          <AnimatePresence initial={false}>
            {filteredTasks.map((task: any) => (
              <motion.div key={task._id} layout variants={listItem} exit="exit">
                <TaskItemRow
                  task={task}
                  onEdit={(t) => {
                    setEditingTask(t);
                    setIsDialogOpen(true);
                  }}
                  goalTitle={getGoalTitle(task.goalId)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
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
        defaultIsDaily={activeTab === "daily"}
      />
    </div>
  );
}
