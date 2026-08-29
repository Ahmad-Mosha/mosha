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
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
            🔥 High
          </span>
        );
      case "p3_low":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#F1F3F5] text-[#718096]">
            Low
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200">
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
      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#EDF2F7] text-[#4A5568] flex items-center gap-1">
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
          ? "bg-[#F8F9FA]/80 border-[#E2E8F0] opacity-60"
          : task.isDaily
          ? "bg-gradient-to-r from-blue-50/20 via-white to-white border-blue-200 hover:border-blue-300 shadow-2xs"
          : "bg-white border-[#E2E8F0] hover:border-[#333E50]/40 shadow-2xs hover:shadow-xs"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          type="button"
          onClick={handleToggle}
          className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer shrink-0 ${
            isDone
              ? "bg-[#333E50] border-[#333E50] text-white"
              : task.isDaily
              ? "border-blue-400 hover:border-blue-600 bg-white"
              : "border-[#CBD5E1] hover:border-[#718096] bg-white"
          }`}
        >
          {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h4
              className={`text-sm font-semibold leading-snug truncate ${
                isDone ? "line-through text-[#A0AEC0]" : "text-[#1A202C]"
              }`}
            >
              {task.title}
            </h4>

            <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
              {task.isDaily && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                  <RotateCcw className="w-2.5 h-2.5" /> Daily
                </span>
              )}
              {getPriorityBadge(task.priority)}
              {getModuleBadge(task.module)}
              {goalTitle && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {goalTitle}
                </span>
              )}
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-[#718096] line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Subtasks inline checklist */}
          {subtasks.length > 0 && (
            <div className="space-y-1 pt-1">
              <div className="text-[10px] font-mono text-[#718096] flex items-center gap-2">
                <span>
                  Checklist: {completedSubtasks}/{subtasks.length}
                </span>
                <div className="w-20 bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#333E50] h-full rounded-full"
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
                    className={`text-[11px] flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      st.completed
                        ? "bg-[#F1F3F5] text-[#A0AEC0] line-through border-transparent"
                        : "bg-white text-[#4A5568] border-[#E2E8F0] hover:border-[#CBD5E1]"
                    }`}
                  >
                    <span
                      className={`w-3 h-3 rounded-xs border flex items-center justify-center text-[9px] ${
                        st.completed
                          ? "bg-[#333E50] border-[#333E50] text-white"
                          : "border-[#CBD5E1]"
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
            <div className="flex items-center gap-1 text-[11px] font-mono text-[#718096] pt-0.5">
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
            className="p-1.5 rounded-lg hover:bg-[#F1F3F5] text-[#718096] hover:text-[#1A202C] transition-colors cursor-pointer"
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
            className="p-1.5 rounded-lg hover:bg-rose-50 text-[#718096] hover:text-rose-600 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
