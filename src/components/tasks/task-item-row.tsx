"use client";

import React from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Check,
  Calendar,
  Edit2,
  Trash2,
  Target,
  RotateCcw,
} from "lucide-react";
import confetti from "canvas-confetti";

interface TaskItemProps {
  task: any;
  onEdit: (task: any) => void;
  goalTitle?: string;
}

export function TaskItemRow({ task, onEdit, goalTitle }: TaskItemProps) {
  const toggleTask = useMutation(api.tasks.toggle);
  const removeTask = useMutation(api.tasks.remove);
  const toggleSubtask = useMutation(api.tasks.toggleSubtask);

  const isDone = task.status === "done";

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = isDone ? "todo" : "done";
    if (nextStatus === "done") {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
    await toggleTask({ id: task._id });
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "p1_urgent":
        return (
          <span className="px-2 py-0.5 rounded text-meta font-mono font-bold bg-danger-tint text-danger border border-danger/35">
            🔥 High
          </span>
        );
      case "p3_low":
        return (
          <span className="px-2 py-0.5 rounded text-meta font-mono font-medium bg-subtle-2 text-faint">
            Low
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-meta font-mono font-semibold bg-warn-tint text-warn border border-warn/35">
            Medium
          </span>
        );
    }
  };

  const getModuleBadge = (mod: string) => {
    const map: Record<string, { label: string; icon: string }> = {
      goals: { label: "Goals", icon: "🎯" },
      problems: { label: "LeetCode", icon: "🧩" },
      learning: { label: "CS Learning", icon: "📚" },
      gym: { label: "Gym", icon: "🏋️" },
      career: { label: "Career", icon: "💼" },
      finance: { label: "Finance", icon: "💰" },
      personal: { label: "Personal", icon: "🌱" },
      general: { label: "General", icon: "📋" },
    };
    const item = map[mod] || { label: "General", icon: "📋" };
    return (
      <span className="px-2 py-0.5 rounded text-meta font-mono bg-subtle-2 text-muted flex items-center gap-1">
        <span>{item.icon}</span>
        <span>{item.label}</span>
      </span>
    );
  };

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s: any) => s.completed).length;

  return (
    <article
      onClick={() => onEdit(task)}
      className={`group rounded-xl border p-3.5 transition-all cursor-pointer select-none ${
        isDone
          ? "bg-subtle/80 border-line opacity-60"
          : task.isDaily
          ? "bg-gradient-to-r from-info-tint/20 via-surface-2 to-surface-2 border-info/35 hover:border-info/35 shadow-2xs"
          : "bg-surface-2 border-line hover:border-accent/40 shadow-2xs hover:shadow-xs"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          type="button"
          onClick={handleToggle}
          className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer shrink-0 ${
            isDone
              ? "bg-accent border-accent text-accent-fg"
              : task.isDaily
              ? "border-info/35 hover:border-info/35 bg-surface-2"
              : "border-line-2 hover:border-faint bg-surface-2"
          }`}
        >
          {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h4
              className={`text-body font-semibold leading-snug truncate ${
                isDone ? "line-through text-ghost" : "text-ink"
              }`}
            >
              {task.title}
            </h4>

            <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
              {task.isDaily && (
                <span className="px-2 py-0.5 rounded text-meta font-mono font-bold bg-info-tint text-info border border-info/35 flex items-center gap-1">
                  <RotateCcw className="w-2.5 h-2.5" /> Daily
                  {(task.streakCount || 0) > 0 && (
                    <span className="text-warn font-bold ml-0.5">
                      🔥 {task.streakCount}d
                    </span>
                  )}
                </span>
              )}
              {getPriorityBadge(task.priority)}
              {getModuleBadge(task.module)}
              {goalTitle && (
                <span className="px-2 py-0.5 rounded text-meta font-mono bg-shipped-tint text-shipped border border-shipped/35 flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {goalTitle}
                </span>
              )}
            </div>
          </div>

          {task.description && (
            <p className="text-label text-faint line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Subtasks inline checklist */}
          {subtasks.length > 0 && (
            <div className="space-y-1 pt-1">
              <div className="text-meta font-mono text-faint flex items-center gap-2">
                <span>
                  Checklist: {completedSubtasks}/{subtasks.length}
                </span>
                <div className="w-20 bg-line h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-accent h-full rounded-full"
                    style={{
                      width: `${(completedSubtasks / subtasks.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {subtasks.map((st: any) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSubtask({ taskId: task._id, subtaskId: st.id });
                    }}
                    className={`text-meta flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      st.completed
                        ? "bg-subtle-2 text-ghost line-through border-transparent"
                        : "bg-surface-2 text-muted border-line hover:border-line-2"
                    }`}
                  >
                    <span
                      className={`w-3 h-3 rounded-xs border flex items-center justify-center text-meta ${
                        st.completed
                          ? "bg-accent border-accent text-accent-fg"
                          : "border-line-2"
                      }`}
                    >
                      {st.completed && "✓"}
                    </span>
                    {st.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Due Date (only if not Daily) */}
          {task.dueDate && !task.isDaily && (
            <div className="flex items-center gap-1 text-meta font-mono text-faint pt-0.5">
              <Calendar className="w-3 h-3" />
              <span>{task.dueDate}</span>
            </div>
          )}
        </div>

        {/* Actions on Hover */}
        <div className="flex items-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            title="Edit task"
            className="p-1.5 rounded-lg hover:bg-subtle-2 text-faint hover:text-ink transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTask({ id: task._id });
            }}
            title="Delete task"
            className="p-1.5 rounded-lg hover:bg-danger-tint text-faint hover:text-danger transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
