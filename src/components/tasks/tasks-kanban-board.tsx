"use client";

import React from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Flame, Clock, Calendar, Check, MoreHorizontal } from "lucide-react";
import confetti from "canvas-confetti";

interface KanbanProps {
  tasks: any[];
  onEdit: (task: any) => void;
  onAddTaskInStatus: (status: string) => void;
}

const COLUMNS = [
  { id: "todo", title: "To Do", icon: "📋", countColor: "bg-[#EDF2F7] text-[#333E50]" },
  { id: "in_progress", title: "In Progress", icon: "⚡", countColor: "bg-blue-100 text-blue-800" },
  { id: "blocked", title: "Blocked", icon: "🛑", countColor: "bg-rose-100 text-rose-800" },
  { id: "done", title: "Done", icon: "🏆", countColor: "bg-emerald-100 text-emerald-800" },
];

export function TasksKanbanBoard({
  tasks,
  onEdit,
  onAddTaskInStatus,
}: KanbanProps) {
  const updateStatus = useMutation(api.tasks.updateStatus);

  const handleMove = async (taskId: any, nextStatus: string) => {
    if (nextStatus === "done") {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    }
    await updateStatus({ id: taskId, status: nextStatus });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => (t.status || "todo") === col.id);

        return (
          <div
            key={col.id}
            className="bento-card rounded-xl p-3.5 space-y-3 bg-[#FBFBFA] min-h-[380px] flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-[#ECEAE4] pb-2.5">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{col.icon}</span>
                  <span className="font-serif font-bold text-sm text-[#1A202C]">
                    {col.title}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${col.countColor}`}
                >
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks in Column */}
              <div className="space-y-2.5">
                {colTasks.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-[#A0AEC0] font-mono">
                    No tasks here
                  </div>
                ) : (
                  colTasks.map((t) => (
                    <div
                      key={t._id}
                      onClick={() => onEdit(t)}
                      className={`p-3 rounded-lg border bg-white shadow-2xs hover:border-[#333E50]/40 transition-all cursor-pointer space-y-2 group ${
                        t.isBigRock ? "border-amber-300 bg-amber-50/30" : "border-[#E2E8F0]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <h5
                          className={`text-xs font-semibold leading-snug line-clamp-2 ${
                            col.id === "done" ? "line-through text-[#A0AEC0]" : "text-[#1A202C]"
                          }`}
                        >
                          {t.title}
                        </h5>
                        {t.isBigRock && (
                          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                        )}
                      </div>

                      {/* Quick Move Selector */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-between pt-1 border-t border-[#ECEAE4]/80 text-[10px] font-mono text-[#718096]"
                      >
                        <select
                          value={t.status || "todo"}
                          onChange={(e) => handleMove(t._id, e.target.value)}
                          className="bg-[#F8F9FA] px-1.5 py-0.5 rounded border border-[#E2E8F0] focus:outline-none cursor-pointer"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="blocked">Blocked</option>
                          <option value="done">Done</option>
                        </select>

                        {t.estimatedMinutes && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {t.estimatedMinutes}m
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Add at bottom of column */}
            <button
              type="button"
              onClick={() => onAddTaskInStatus(col.id)}
              className="w-full py-1.5 rounded-lg border border-dashed border-[#CBD5E1] hover:border-[#333E50] hover:bg-white text-[11px] text-[#718096] hover:text-[#1A202C] transition-colors cursor-pointer text-center font-medium mt-2"
            >
              + Add {col.title}
            </button>
          </div>
        );
      })}
    </div>
  );
}
