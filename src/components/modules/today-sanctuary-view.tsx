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
  const [isBigRock, setIsBigRock] = useState(false);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await createTask({
      title: newTaskTitle.trim(),
      isBigRock,
      priority: isBigRock ? "high" : "medium",
      module: "general",
    });
    setNewTaskTitle("");
    setIsBigRock(false);
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
            &ldquo;Excellence is not an act, but a habit.&rdquo; Lock in on your 3 Big Rocks, complete your workout, and advance your engineering mastery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => startFocus(50)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-[#333E50] hover:bg-[#252E3B] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Start 50m Deep Work</span>
          </button>
        </div>
      </div>

      {/* 3 Columns: Tasks, Quick Radar, Streaks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Col 1: 3 Big Rocks & Tasks */}
        <div className="bento-card rounded-xl p-5 space-y-4 md:col-span-2">
          <div className="flex items-center justify-between border-b border-[#ECEAE4] pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#333E50]">
                🎯 Priority Tasks & 3 Big Rocks
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#718096]">
              {completedCount}/{tasks.length} Completed
            </span>
          </div>

          {/* Task creation input */}
          <form onSubmit={handleAddTask} className="flex items-center gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add task for today..."
              className="flex-1 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs text-[#1A202C] focus:outline-none focus:border-[#333E50]"
            />
            <label className="flex items-center gap-1.5 text-xs text-[#718096] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isBigRock}
                onChange={(e) => setIsBigRock(e.target.checked)}
                className="rounded text-[#333E50] focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px] font-mono">Big Rock</span>
            </label>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-[#333E50] text-white text-xs font-semibold hover:bg-[#252E3B] transition-colors cursor-pointer"
            >
              Add
            </button>
          </form>

          {/* Task List */}
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <p className="text-xs text-[#A0AEC0] py-6 text-center">
                No tasks logged for today yet. Add your 3 Big Rocks above!
              </p>
            ) : (
              tasks.map((t: any) => (
                <div
                  key={t._id}
                  onClick={() => toggleTask({ id: t._id })}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    t.status === "done"
                      ? "bg-[#F8F9FA] border-[#E2E8F0] opacity-60"
                      : t.isBigRock
                      ? "bg-amber-50/50 border-amber-200"
                      : "bg-white border-[#E2E8F0] hover:border-[#CBD5E1]"
                  }`}
                >
                  {t.status === "done" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-[#A0AEC0] shrink-0" />
                  )}
                  <span
                    className={`flex-1 text-xs ${
                      t.status === "done"
                        ? "line-through text-[#718096]"
                        : "text-[#1A202C] font-medium"
                    }`}
                  >
                    {t.title}
                  </span>
                  {t.isBigRock && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                      Big Rock
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Col 2: Quick Jump Hub & Habit Streaks */}
        <div className="space-y-5">
          {/* Quick Hub Card */}
          <div className="bento-card rounded-xl p-5 space-y-3">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#718096]">
              Quick Modules
            </h3>
            <div className="space-y-2 text-xs">
              <button
                onClick={() => setActiveModule("problems")}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8F9FA] transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-blue-700" />
                  <span className="font-medium text-[#1A202C]">Problem Solving</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#A0AEC0] group-hover:text-[#1A202C]" />
              </button>

              <button
                onClick={() => setActiveModule("gym")}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8F9FA] transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-rose-600" />
                  <span className="font-medium text-[#1A202C]">Iron Journal</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#A0AEC0] group-hover:text-[#1A202C]" />
              </button>

              <button
                onClick={() => setActiveModule("learning")}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8F9FA] transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-700" />
                  <span className="font-medium text-[#1A202C]">Learning & CS</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#A0AEC0] group-hover:text-[#1A202C]" />
              </button>
            </div>
          </div>

          {/* Consistency Streaks */}
          <div className="bento-card rounded-xl p-5 space-y-3">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#718096]">
              Consistency Pulse
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#ECEAE4]">
                <span className="text-[#4A5568]">🔥 Daily Deep Work</span>
                <span className="font-mono font-bold text-[#1A202C]">14 Days</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#ECEAE4]">
                <span className="text-[#4A5568]">💪 Gym Training</span>
                <span className="font-mono font-bold text-[#1A202C]">4 Days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#4A5568]">🧩 Algorithmic Recall</span>
                <span className="font-mono font-bold text-[#1A202C]">95% Rate</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
