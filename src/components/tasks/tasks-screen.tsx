"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { TaskCreateDialog } from "./task-create-dialog";
import { TaskGroupedList, type TaskGroup } from "./task-grouped-list";
import { TasksKanbanBoard } from "./tasks-kanban-board";
import { Select } from "@/components/ui/select";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { parseTaskInput } from "@/lib/parse-task-input";
import {
  addDays, effectiveStatus, isRecurring, today,
} from "../../../convex/recurrence";
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

  // Read straight from Convex. A localStorage mirror showed tasks that no
  // longer existed in the database, which made the screen lie about its state.
  const tasks = convexTasks ?? [];
  const isLoading = convexTasks === undefined;

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

  const [pendingStatus, setPendingStatus] = useState<string | undefined>();
  const searchRef = useRef<HTMLInputElement>(null);
  const quickAddRef = useRef<HTMLInputElement>(null);

  const todayStr = today();

  // Completion is rule-aware: a daily ticked yesterday counts as pending again.
  const doneOf = (t: any) => effectiveStatus(t) === "done";
  const completedCount = tasks.filter(doneOf).length;
  const recurringTasks = tasks.filter(isRecurring);
  const todayTasks = tasks.filter(
    (t: any) => isRecurring(t) || t.dueDate === todayStr || (!t.dueDate && !doneOf(t))
  );

  const filteredTasks = tasks.filter((t: any) => {
    const done = doneOf(t);
    if (activeTab === "today") {
      if (!isRecurring(t) && t.dueDate && t.dueDate > todayStr) return false;
      if (done && t.dueDate !== todayStr && !isRecurring(t)) return false;
    } else if (activeTab === "recurring") {
      if (!isRecurring(t)) return false;
    } else if (activeTab === "upcoming") {
      if (!t.dueDate || t.dueDate <= todayStr || done) return false;
    } else if (activeTab === "completed") {
      if (!done) return false;
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

  /**
   * Group by when something is due rather than showing one flat wall. Overdue
   * first, because that is the only bucket that needs a decision today.
   */
  const groupedTasks = useMemo<TaskGroup[]>(() => {
    const tomorrow = addDays(todayStr, 1);
    const weekEnd = addDays(todayStr, 7);
    const buckets: Record<string, any[]> = {
      overdue: [], today: [], tomorrow: [], week: [], later: [], someday: [], done: [],
    };

    for (const t of filteredTasks) {
      if (doneOf(t) && !isRecurring(t)) buckets.done.push(t);
      else if (!t.dueDate) buckets.someday.push(t);
      else if (t.dueDate < todayStr) buckets.overdue.push(t);
      else if (t.dueDate === todayStr) buckets.today.push(t);
      else if (t.dueDate === tomorrow) buckets.tomorrow.push(t);
      else if (t.dueDate <= weekEnd) buckets.week.push(t);
      else buckets.later.push(t);
    }

    const order = (a: any, b: any) => (a.order ?? 1e9) - (b.order ?? 1e9);
    const labels: [string, string, "danger" | "default"][] = [
      ["overdue", "Overdue", "danger"],
      ["today", "Today", "default"],
      ["tomorrow", "Tomorrow", "default"],
      ["week", "This week", "default"],
      ["later", "Later", "default"],
      ["someday", "No date", "default"],
      ["done", "Completed", "default"],
    ];

    return labels
      .filter(([id]) => buckets[id].length > 0)
      .map(([id, label, tone]) => ({
        id, label, tone,
        tasks: [...buckets[id]].sort(order),
      }));
  }, [filteredTasks, todayStr]);

  const handleInlineAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTitle.trim() || isInlineSubmitting) return;

    setIsInlineSubmitting(true);
    try {
      // The typed line carries its own date, priority, tag and repeat rule;
      // the dropdowns are the fallback for anything it did not mention.
      const parsed = parseTaskInput(inlineTitle);
      await createTask({
        title: parsed.title,
        priority: parsed.priority ?? inlinePriority,
        module: parsed.module ?? inlineModule,
        dueDate: parsed.dueDate ?? (inlineIsDaily ? undefined : todayStr),
        dueTime: parsed.dueTime,
        recurrence: parsed.recurrence ?? (inlineIsDaily ? "daily" : "none"),
      });
      setInlineTitle("");
      setInlineIsDaily(false);
    } catch (err) {
      toast.error("Could not create task");
    } finally {
      setIsInlineSubmitting(false);
    }
  };

  /**
   * Keyboard shortcuts. Ignored while typing so they never swallow input, and
   * scoped to this screen because that is the only place they mean anything.
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);

      if (e.key === "Escape" && typing) {
        (el as HTMLElement).blur();
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "n") {
        e.preventDefault();
        quickAddRef.current?.focus();
      } else if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "v") {
        e.preventDefault();
        setViewMode((m) => (m === "list" ? "kanban" : "list"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
            ref={quickAddRef}
            placeholder="Add a task…  try: email dana tomorrow 5pm !1 #career"
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
            { id: "recurring", label: `Repeating (${recurringTasks.length})` },
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
              ref={searchRef}
              placeholder="Search…  (/)"
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
            // Previously the status was accepted and thrown away, so "add to
            // In Progress" always produced a Todo.
            setEditingTask(null);
            setPendingStatus(status);
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
        <TaskGroupedList
          groups={groupedTasks}
          onEdit={(t) => {
            setEditingTask(t);
            setIsDialogOpen(true);
          }}
          getGoalTitle={getGoalTitle}
        />
      )}

      {/* 5. Create / Edit Task Modal Dialog */}
      <TaskCreateDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingTask(null);
          setPendingStatus(undefined);
        }}
        editingTask={editingTask}
        defaultModule={moduleFilter !== "all" ? moduleFilter : "general"}
        defaultIsDaily={activeTab === "recurring"}
        defaultStatus={pendingStatus}
      />
    </div>
  );
}
