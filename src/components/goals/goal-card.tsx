"use client";

import React from "react";
import { Calendar, ChevronRight } from "lucide-react";
import confetti from "canvas-confetti";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function formatGoalIcon(icon: string | undefined): string {
  if (!icon) return "🎯";
  switch (icon) {
    case "military_tech":
    case "shield":
      return "🎖️";
    case "work":
    case "briefcase":
      return "💼";
    case "favorite":
    case "heart":
      return "❤️";
    case "award":
      return "🏆";
    default:
      return icon;
  }
}

export function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return (
        <span className="px-2 py-0.5 rounded-full text-meta font-mono font-semibold bg-success-tint text-success border border-success/35">
          Done 🏆
        </span>
      );
    case "planning":
      return (
        <span className="px-2 py-0.5 rounded-full text-meta font-mono font-semibold bg-info-tint text-info border border-info/35">
          Planning 🧭
        </span>
      );
    case "vision":
      return (
        <span className="px-2 py-0.5 rounded-full text-meta font-mono font-semibold bg-shipped-tint text-shipped border border-shipped/35">
          Vision 🔭
        </span>
      );
    case "on_hold":
      return (
        <span className="px-2 py-0.5 rounded-full text-meta font-mono font-semibold bg-warn-tint text-warn border border-warn/35">
          On Hold ⏸️
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 rounded-full text-meta font-mono font-semibold bg-subtle-2 text-accent border border-line">
          In Progress ⚡
        </span>
      );
  }
}

export interface GoalProps {
  goal: {
    _id: any;
    title: string;
    description: string;
    icon: string;
    status: string;
    targetDate?: string;
    progress: number;
    milestones: { id: string; title: string; completed: boolean }[];
    order: number;
  };
  onSelect: (goal: any) => void;
}

export function GoalCard({ goal, onSelect }: GoalProps) {
  const toggleMilestone = useMutation(api.goals.toggleMilestone);

  const completedMilestones =
    goal.milestones?.filter((m) => m.completed).length || 0;
  const totalMilestones = goal.milestones?.length || 0;
  const displayedIcon = formatGoalIcon(goal.icon);

  const handleToggleFirstIncomplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIncomplete = goal.milestones?.find((m) => !m.completed);
    if (nextIncomplete) {
      const res = await toggleMilestone({
        goalId: goal._id,
        milestoneId: nextIncomplete.id,
      });
      if (res && res.progress === 100) {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      }
    }
  };

  return (
    <article
      onClick={() => onSelect(goal)}
      className="bento-card rounded-xl p-5 flex flex-col justify-between space-y-3.5 cursor-pointer hover:border-accent/40 transition-all group overflow-hidden"
    >
      {/* Top Section */}
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-subtle border border-line flex items-center justify-center text-title shadow-2xs group-hover:scale-105 transition-transform select-none">
              {displayedIcon}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-serif text-heading font-bold text-ink leading-tight truncate group-hover:text-accent transition-colors">
                {goal.title}
              </h3>
              {goal.targetDate && (
                <span className="text-meta font-mono text-faint flex items-center gap-1 mt-1 truncate">
                  <Calendar className="w-3 h-3 shrink-0" />
                  {goal.targetDate}
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0 select-none">
            {getStatusBadge(goal.status)}
          </div>
        </div>

        {/* Short Description */}
        {goal.description && (
          <p className="text-label text-muted line-clamp-2 leading-relaxed">
            {goal.description}
          </p>
        )}
      </div>

      {/* Bottom Section: Progress bar & Milestones counter */}
      <div className="pt-3 border-t border-line space-y-2">
        <div className="flex items-center justify-between text-label font-mono">
          <span className="text-faint text-meta">
            {completedMilestones}/{totalMilestones} Milestones
          </span>
          <span className="font-bold text-ink">{goal.progress}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-line h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              goal.progress === 100
                ? "bg-success"
                : goal.progress >= 70
                ? "bg-info"
                : goal.progress >= 40
                ? "bg-warn"
                : "bg-accent"
            }`}
            style={{ width: `${goal.progress}%` }}
          />
        </div>

        {/* Card Footer Action */}
        <div className="flex items-center justify-between pt-0.5 text-meta text-faint">
          <span className="group-hover:text-ink flex items-center gap-0.5 transition-colors font-medium">
            View details & milestones
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>

          {completedMilestones < totalMilestones && (
            <button
              onClick={handleToggleFirstIncomplete}
              className="text-meta font-mono px-2 py-0.5 rounded bg-subtle-2 hover:bg-line text-ink transition-colors cursor-pointer"
              title="Quickly complete next milestone"
            >
              + Complete Next
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
