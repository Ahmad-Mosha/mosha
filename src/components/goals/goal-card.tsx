"use client";

import React from "react";
import { Calendar, CheckCircle2, ChevronRight, Check } from "lucide-react";
import confetti from "canvas-confetti";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

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
      className="bento-card rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-3 cursor-pointer hover:border-[#333E50]/40 transition-all group"
    >
      {/* Top Row: Icon + Title + Target Date */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#F8F9FA] border border-[#E2E8F0] flex items-center justify-center text-xl shadow-2xs group-hover:scale-105 transition-transform">
              {goal.icon || "🎯"}
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1A202C] leading-snug group-hover:text-[#333E50] transition-colors line-clamp-1">
                {goal.title}
              </h3>
              {goal.targetDate && (
                <span className="text-[11px] font-mono text-[#718096] flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  {goal.targetDate}
                </span>
              )}
            </div>
          </div>

          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold shrink-0 ${
              goal.status === "completed"
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : "bg-[#EDF2F7] text-[#333E50]"
            }`}
          >
            {goal.status === "completed" ? "Done 🏆" : "Active"}
          </span>
        </div>

        {/* Short Description */}
        {goal.description && (
          <p className="text-xs text-[#4A5568] line-clamp-2 leading-relaxed">
            {goal.description}
          </p>
        )}
      </div>

      {/* Bottom Row: Progress bar & Milestones counter */}
      <div className="pt-3 border-t border-[#ECEAE4] space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#718096] text-[11px]">
            {completedMilestones}/{totalMilestones} Milestones
          </span>
          <span className="font-bold text-[#1A202C]">{goal.progress}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              goal.progress === 100
                ? "bg-emerald-600"
                : goal.progress >= 70
                ? "bg-blue-600"
                : goal.progress >= 40
                ? "bg-amber-600"
                : "bg-[#333E50]"
            }`}
            style={{ width: `${goal.progress}%` }}
          />
        </div>

        {/* Card Footer Action */}
        <div className="flex items-center justify-between pt-0.5 text-[11px] text-[#718096]">
          <span className="group-hover:text-[#1A202C] flex items-center gap-0.5 transition-colors font-medium">
            View details & milestones
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>

          {completedMilestones < totalMilestones && (
            <button
              onClick={handleToggleFirstIncomplete}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F1F3F5] hover:bg-[#E2E8F0] text-[#1A202C] transition-colors cursor-pointer"
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
