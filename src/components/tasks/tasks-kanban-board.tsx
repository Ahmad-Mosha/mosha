"use client";

import React from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { RotateCcw, Plus } from "lucide-react";
import confetti from "canvas-confetti";

interface KanbanProps {
  tasks: any[];
  onEdit: (task: any) => void;
  onAddTaskInStatus: (status: string) => void;
}

const COLUMNS = [
  { id: "todo", title: "To Do", icon: "📋", headerColor: "bg-subtle-2 text-accent" },
  { id: "in_progress", title: "In Progress", icon: "⚡", headerColor: "bg-blue-50 text-blue-800 border-blue-200" },
  { id: "done", title: "Done", icon: "🏆", headerColor: "bg-emerald-50 text-emerald-800 border-emerald-200" },
];

export function TasksKanbanBoard({
  tasks,
  onEdit,
  onAddTaskInStatus,
}: KanbanProps) {
  const updateStatus = useMutation(api.tasks.updateStatus);

  const handleMove = async (taskId: any, nextStatus: string) => {
    if (nextStatus === "done") {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    }
    await updateStatus({ id: taskId, status: nextStatus });
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "p1_urgent":
        return <span className="text-[10px] font-mono font-bold text-rose-600">🔥 High</span>;
      case "p3_low":
        return <span className="text-[10px] font-mono text-faint">Low</span>;
      default:
        return <span className="text-[10px] font-mono text-amber-700">Medium</span>;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => (t.status || "todo") === col.id);

        return (
          <div
            key={col.id}
            className="bento-card rounded-xl p-4 space-y-3 bg-surface min-h-[420px] flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-line pb-2.5">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{col.icon}</span>
                  <span className="font-serif font-bold text-sm text-ink">
                    {col.title}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${col.headerColor}`}
                >
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks in Column */}
              <div className="space-y-2.5">
                {colTasks.length === 0 ? (
                  <div className="py-10 text-center text-xs text-ghost font-mono">
                    No tasks in {col.title}
                  </div>
                ) : (
                  colTasks.map((t) => (
                    <div
                      key={t._id}
                      onClick={() => onEdit(t)}
                      className="p-3 rounded-lg border border-line bg-surface-2 shadow-2xs hover:border-accent/40 transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h5
                          className={`text-xs font-semibold leading-snug line-clamp-2 ${
                            col.id === "done" ? "line-through text-ghost" : "text-ink"
                          }`}
                        >
                          {t.title}
                        </h5>
                        {t.isDaily && (
                          <span
                            title="Daily recurring"
                            className="text-[10px] font-mono text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded shrink-0 flex items-center gap-0.5 font-semibold"
                          >
                            <RotateCcw className="w-2.5 h-2.5" /> Daily
                          </span>
                        )}
                      </div>

                      {t.description && (
                        <p className="text-[11px] text-faint line-clamp-1">
                          {t.description}
                        </p>
                      )}

                      {/* Card Footer with Quick Move Dropdown */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-between pt-1 border-t border-line/60 text-[10px] font-mono"
                      >
                        <div>{getPriorityBadge(t.priority)}</div>

                        <select
                          value={t.status || "todo"}
                          onChange={(e) => handleMove(t._id, e.target.value)}
                          className="bg-subtle px-1.5 py-0.5 rounded border border-line text-muted focus:outline-none cursor-pointer"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
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
              className="w-full py-2 rounded-lg border border-dashed border-line-2 hover:border-accent hover:bg-surface-2 text-xs text-faint hover:text-ink transition-colors cursor-pointer text-center font-medium mt-3 flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add {col.title}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
