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
      <div className="bento-card rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-white via-white to-[#F8F9FA]">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-mono text-amber-700">
            <Sparkles className="w-4 h-4" />
            <span className="uppercase tracking-wider font-semibold">
              Morning Ritual & Focus
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1A202C]">
            Good day, Ahmed.
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5568] max-w-xl leading-relaxed">
            &ldquo;Excellence is not an act, but a habit.&rdquo; Lock in on your daily execution, complete your workout, and advance your engineering craft.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => startFocus(50)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#333E50] hover:bg-[#252E3B] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Start 50m Deep Work</span>
          </button>
        </div>
      </div>

      {/* 3 Pillars Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* LeetCode Mastery Block */}
        <div
          onClick={() => setActiveModule("problems")}
          className="bento-card rounded-xl p-5 cursor-pointer hover:border-[#333E50]/40 transition-all group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-[#A0AEC0] group-hover:translate-x-1 transition-transform" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-[#1A202C]">
              Problem Solving
            </h3>
            <p className="text-xs text-[#718096]">
              Master algorithmic patterns with 100% mastery engine.
            </p>
          </div>
        </div>

        {/* CS Learning Block */}
        <div
          onClick={() => setActiveModule("learning")}
          className="bento-card rounded-xl p-5 cursor-pointer hover:border-[#333E50]/40 transition-all group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-[#A0AEC0] group-hover:translate-x-1 transition-transform" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-[#1A202C]">
              CS & Systems
            </h3>
            <p className="text-xs text-[#718096]">
              Operating Systems, Databases, Go, Node.js roadmaps.
            </p>
          </div>
        </div>

        {/* Iron Journal Block */}
        <div
          onClick={() => setActiveModule("gym")}
          className="bento-card rounded-xl p-5 cursor-pointer hover:border-[#333E50]/40 transition-all group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <Dumbbell className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-[#A0AEC0] group-hover:translate-x-1 transition-transform" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-[#1A202C]">
              Iron Journal
            </h3>
            <p className="text-xs text-[#718096]">
              Push / Pull / Legs tracking, progressive overload & PRs.
            </p>
          </div>
        </div>
      </div>

      {/* Today's Tasks Minimalist Checklist */}
      <div className="bento-card rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#ECEAE4] pb-3">
          <div className="flex items-center space-x-2">
            <h2 className="font-serif text-lg font-bold text-[#1A202C]">
              Quick Action Checklist
            </h2>
            <span className="text-xs font-mono text-[#718096]">
              ({completedCount}/{tasks.length} Completed)
            </span>
          </div>

          <button
            onClick={() => setActiveModule("tasks")}
            className="text-xs text-[#333E50] hover:underline font-medium flex items-center gap-1"
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
            className="flex-1 px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#1A202C] focus:outline-none focus:border-[#333E50]"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[#333E50] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Add
          </button>
        </form>

        {/* Tasks List */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="text-center py-6 text-xs text-[#A0AEC0] font-mono">
              No tasks for today.
            </div>
          ) : (
            tasks.slice(0, 6).map((task: any) => (
              <div
                key={task._id}
                onClick={() => toggleTask({ id: task._id })}
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${
                  task.status === "done"
                    ? "bg-[#F8F9FA] border-[#E2E8F0] opacity-60"
                    : "bg-white border-[#E2E8F0] hover:border-[#CBD5E1]"
                }`}
              >
                {task.status === "done" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-[#CBD5E1] shrink-0" />
                )}
                <span
                  className={`text-xs flex-1 ${
                    task.status === "done"
                      ? "line-through text-[#A0AEC0]"
                      : "text-[#1A202C] font-medium"
                  }`}
                >
                  {task.title}
                </span>
                {task.isDaily && (
                  <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
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
