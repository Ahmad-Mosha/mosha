"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useMoshaStore } from "@/lib/store";
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Plus,
  Flame,
  Dumbbell,
  Code2,
  BookOpen,
  ArrowRight,
} from "lucide-react";

export function TodaySanctuaryView() {
  const { startFocus, setActiveModule } = useMoshaStore();
  const tasks = useQuery(api.tasks.list) || [];
  const createTask = useMutation(api.tasks.create);
  const toggleTask = useMutation(api.tasks.toggle);

  const [newTaskTitle, setNewTaskTitle] = useState("");

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await createTask({
      title: newTaskTitle.trim(),
      isDaily: false,
      priority: "p2_medium",
      module: "general",
    });
    setNewTaskTitle("");
  };

  const completedCount = tasks.filter((t: any) => t.status === "done").length;

  return (
    <div className="space-y-6">
      {/* Morning Ritual & Focus Hero */}
      <div className="bento-card rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-surface-2 via-surface-2 to-subtle">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-label font-mono text-warn">
            <Sparkles className="w-4 h-4" />
            <span className="uppercase tracking-wider font-semibold">
              Morning Ritual & Focus
            </span>
          </div>
          <h1 className="font-serif text-display font-bold tracking-tight text-ink">
            Good day, Ahmed.
          </h1>
          <p className="text-label sm:text-body text-muted max-w-xl leading-relaxed">
            &ldquo;Excellence is not an act, but a habit.&rdquo; Lock in on your daily execution, complete your workout, and advance your engineering craft.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => startFocus(50)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg text-label font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Flame className="w-4 h-4 text-warn fill-warn" />
            <span>Start 50m Deep Work</span>
          </button>
        </div>
      </div>

      {/* 3 Pillars Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* LeetCode Mastery Block */}
        <div
          onClick={() => setActiveModule("problems")}
          className="bento-card rounded-xl p-5 cursor-pointer hover:border-accent/40 transition-all group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-info-tint text-info flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-ghost group-hover:translate-x-1 transition-transform" />
          </div>
          <div>
            <h3 className="font-serif text-heading font-bold text-ink">
              Problem Solving
            </h3>
            <p className="text-label text-faint">
              Master algorithmic patterns with 100% mastery engine.
            </p>
          </div>
        </div>

        {/* CS Learning Block */}
        <div
          onClick={() => setActiveModule("learning")}
          className="bento-card rounded-xl p-5 cursor-pointer hover:border-accent/40 transition-all group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-success-tint text-success flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-ghost group-hover:translate-x-1 transition-transform" />
          </div>
          <div>
            <h3 className="font-serif text-heading font-bold text-ink">
              CS & Systems
            </h3>
            <p className="text-label text-faint">
              Operating Systems, Databases, Go, Node.js roadmaps.
            </p>
          </div>
        </div>

        {/* Iron Journal Block */}
        <div
          onClick={() => setActiveModule("gym")}
          className="bento-card rounded-xl p-5 cursor-pointer hover:border-accent/40 transition-all group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-danger-tint text-danger flex items-center justify-center">
              <Dumbbell className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-ghost group-hover:translate-x-1 transition-transform" />
          </div>
          <div>
            <h3 className="font-serif text-heading font-bold text-ink">
              Iron Journal
            </h3>
            <p className="text-label text-faint">
              Push / Pull / Legs tracking, progressive overload & PRs.
            </p>
          </div>
        </div>
      </div>

      {/* Today's Tasks Minimalist Checklist */}
      <div className="bento-card rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center space-x-2">
            <h2 className="font-serif text-heading font-bold text-ink">
              Quick Action Checklist
            </h2>
            <span className="text-label font-mono text-faint">
              ({completedCount}/{tasks.length} Completed)
            </span>
          </div>

          <button
            onClick={() => setActiveModule("tasks")}
            className="text-label text-accent hover:underline font-medium flex items-center gap-1"
          >
            <span>Open Full Tasks Screen</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Add Input */}
        <form onSubmit={handleAddTask} className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add task to today's list..."
            className="flex-1 px-3 py-2 rounded-lg border border-line text-label text-ink focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-accent text-accent-fg text-label font-semibold transition-colors cursor-pointer"
          >
            Add
          </button>
        </form>

        {/* Tasks List */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="text-center py-6 text-label text-ghost font-mono">
              No tasks for today.
            </div>
          ) : (
            tasks.slice(0, 6).map((task: any) => (
              <div
                key={task._id}
                onClick={() => toggleTask({ id: task._id })}
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${
                  task.status === "done"
                    ? "bg-subtle border-line opacity-60"
                    : "bg-surface-2 border-line hover:border-line-2"
                }`}
              >
                {task.status === "done" ? (
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-line-2 shrink-0" />
                )}
                <span
                  className={`text-label flex-1 ${
                    task.status === "done"
                      ? "line-through text-ghost"
                      : "text-ink font-medium"
                  }`}
                >
                  {task.title}
                </span>
                {task.isDaily && (
                  <span className="text-meta font-mono text-info bg-info-tint px-1.5 py-0.5 rounded">
                    Daily
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
