"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useMoshaStore } from "@/lib/store";
import { X, Check, Edit2, Calendar, Trash2, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import { formatGoalIcon } from "./goal-card";

interface GoalDetailsProps {
  goal: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GoalDetailsDialog({ goal, isOpen, onClose }: GoalDetailsProps) {
  const { setGoalDialogOpen, setEditingGoalId } = useMoshaStore();
  const toggleMilestone = useMutation(api.goals.toggleMilestone);
  const updateGoal = useMutation(api.goals.update);
  const removeGoal = useMutation(api.goals.remove);

  if (!goal) return null;

  const handleToggle = async (milestoneId: string) => {
    try {
      const res = await toggleMilestone({
        goalId: goal._id,
        milestoneId,
      });
      if (res && res.progress === 100) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      console.error("Failed to toggle milestone:", err);
    }
  };

  const handleToggleStatus = async () => {
    const nextStatus = goal.status === "completed" ? "in_progress" : "completed";
    await updateGoal({
      id: goal._id,
      status: nextStatus,
      progress: nextStatus === "completed" ? 100 : goal.progress,
      completedAt: nextStatus === "completed" ? new Date().toISOString() : undefined,
    });
    if (nextStatus === "completed") {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
      });
    }
  };

  const handleDelete = async () => {
    await removeGoal({ id: goal._id });
    onClose();
  };

  const completedCount = goal.milestones?.filter((m: any) => m.completed).length || 0;
  const totalMilestones = goal.milestones?.length || 0;
  const displayedIcon = formatGoalIcon(goal.icon);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl border border-[#E2E8F0] animate-in zoom-in-95 max-h-[90vh] overflow-y-auto space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[#ECEAE4] pb-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#F8F9FA] border border-[#E2E8F0] flex items-center justify-center text-2xl shadow-2xs shrink-0 select-none">
                {displayedIcon}
              </div>
              <div>
                <Dialog.Title className="font-serif text-2xl font-bold text-[#1A202C]">
                  {goal.title}
                </Dialog.Title>
                <div className="flex items-center space-x-3 text-xs text-[#718096] mt-0.5 font-mono">
                  {goal.targetDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Target: {goal.targetDate}
                    </span>
                  )}
                  <span>•</span>
                  <span
                    className={`font-semibold ${
                      goal.status === "completed" ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {goal.status === "completed" ? "Completed 🏆" : "In Progress"}
                  </span>
                </div>
              </div>
            </div>

            <Dialog.Close className="p-1.5 rounded-md text-[#718096] hover:text-[#1A202C] hover:bg-[#F3F4F6] cursor-pointer">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          {/* Description */}
          {goal.description && (
            <div className="p-3.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl text-xs sm:text-sm text-[#4A5568] leading-relaxed">
              {goal.description}
            </div>
          )}

          {/* Progress Bar & Readiness */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#718096] uppercase tracking-wider font-semibold">
                Overall Progress
              </span>
              <strong className="text-[#1A202C] text-sm">{goal.progress}%</strong>
            </div>

            <div className="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  goal.progress === 100
                    ? "bg-emerald-600"
                    : goal.progress >= 70
                    ? "bg-blue-600"
                    : "bg-[#333E50]"
                }`}
                style={{ width: `${goal.progress}%` }}
              />
            </div>
          </div>

          {/* Milestones Checklist */}
          <div className="space-y-2.5 pt-2 border-t border-[#ECEAE4]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#718096]">
                Interactive Milestones ({completedCount}/{totalMilestones})
              </span>
              <span className="text-[10px] text-[#A0AEC0] font-mono">
                Click checkbox to complete
              </span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {goal.milestones?.map((m: any) => (
                <div
                  key={m.id}
                  onClick={() => handleToggle(m.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                    m.completed
                      ? "bg-[#F8F9FA] border-[#E2E8F0] opacity-75"
                      : "bg-white border-[#E2E8F0] hover:border-[#CBD5E1]"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                      m.completed
                        ? "bg-[#333E50] border-[#333E50] text-white"
                        : "border-[#CBD5E1] bg-white hover:border-[#718096]"
                    }`}
                  >
                    {m.completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span
                    className={`flex-1 text-xs ${
                      m.completed
                        ? "line-through text-[#A0AEC0]"
                        : "text-[#1A202C] font-medium"
                    }`}
                  >
                    {m.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#ECEAE4] text-xs">
            <button
              onClick={handleDelete}
              className="text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleToggleStatus}
                className={`px-3 py-1.5 rounded-lg font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  goal.status === "completed"
                    ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {goal.status === "completed" ? "Mark In Progress" : "Mark Completed"}
              </button>

              <button
                onClick={() => {
                  setEditingGoalId(goal._id);
                  setGoalDialogOpen(true);
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#333E50] hover:bg-[#252E3B] text-white font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
