"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useMoshaStore } from "@/lib/store";
import { X, Check, Edit2, Calendar, Trash2 } from "lucide-react";
import confetti from "canvas-confetti";
import { formatGoalIcon, getStatusBadge } from "./goal-card";

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

  // Local optimistic state for instant UI update
  const [localMilestones, setLocalMilestones] = useState<any[]>([]);

  useEffect(() => {
    if (goal?.milestones) {
      setLocalMilestones(goal.milestones);
    }
  }, [goal?.milestones]);

  if (!goal) return null;

  const handleToggle = async (milestoneId: string) => {
    // 1. Instant 0ms optimistic visual update
    const updated = localMilestones.map((m: any) =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    setLocalMilestones(updated);

    const completedCount = updated.filter((m: any) => m.completed).length;
    const progress = Math.round((completedCount / updated.length) * 100);

    if (progress === 100) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    // 2. Sync to Convex backend
    try {
      await toggleMilestone({
        goalId: goal._id,
        milestoneId,
      });
    } catch (err) {
      console.error("Failed to toggle milestone:", err);
      // Revert if mutation fails
      setLocalMilestones(goal.milestones || []);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    await updateGoal({
      id: goal._id,
      status: newStatus,
      progress: newStatus === "completed" ? 100 : goal.progress,
      completedAt: newStatus === "completed" ? new Date().toISOString() : undefined,
    });
    if (newStatus === "completed") {
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

  const completedCount = localMilestones.filter((m: any) => m.completed).length;
  const totalMilestones = localMilestones.length;
  const computedProgress =
    totalMilestones > 0
      ? Math.round((completedCount / totalMilestones) * 100)
      : goal.progress;
  const displayedIcon = formatGoalIcon(goal.icon);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface-2 p-6 shadow-2xl border border-line animate-in zoom-in-95 max-h-[90vh] overflow-y-auto space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-line pb-4">
            <div className="flex items-center space-x-3.5 min-w-0 flex-1 pr-4">
              <div className="w-12 h-12 rounded-xl bg-subtle border border-line flex items-center justify-center text-2xl shadow-2xs shrink-0 select-none">
                {displayedIcon}
              </div>
              <div className="min-w-0 flex-1">
                <Dialog.Title className="font-serif text-2xl font-bold text-ink truncate">
                  {goal.title}
                </Dialog.Title>
                <div className="flex items-center space-x-3 text-xs text-faint mt-1 font-mono">
                  {goal.targetDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Target: {goal.targetDate}
                    </span>
                  )}
                  <span>•</span>
                  <div className="inline-flex">{getStatusBadge(goal.status)}</div>
                </div>
              </div>
            </div>

            <Dialog.Close className="p-1.5 rounded-md text-faint hover:text-ink hover:bg-subtle-2 cursor-pointer shrink-0">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          {/* Description */}
          {goal.description && (
            <div className="p-3.5 bg-subtle border border-line rounded-xl text-xs sm:text-sm text-muted leading-relaxed">
              {goal.description}
            </div>
          )}

          {/* Progress Bar & Readiness */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-faint uppercase tracking-wider font-semibold">
                Overall Progress
              </span>
              <strong className="text-ink text-sm">{computedProgress}%</strong>
            </div>

            <div className="w-full bg-line h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ease-out ${
                  computedProgress === 100
                    ? "bg-emerald-600"
                    : computedProgress >= 70
                    ? "bg-blue-600"
                    : computedProgress >= 40
                    ? "bg-amber-600"
                    : "bg-accent"
                }`}
                style={{ width: `${computedProgress}%` }}
              />
            </div>
          </div>

          {/* Milestones Checklist */}
          <div className="space-y-2.5 pt-2 border-t border-line">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-faint">
                Interactive Milestones ({completedCount}/{totalMilestones})
              </span>
              <span className="text-[10px] text-ghost font-mono">
                Click checkbox to toggle immediately
              </span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {localMilestones.map((m: any) => (
                <div
                  key={m.id}
                  onClick={() => handleToggle(m.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                    m.completed
                      ? "bg-subtle border-line opacity-80"
                      : "bg-surface-2 border-line hover:border-line-2"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                      m.completed
                        ? "bg-accent border-accent text-accent-fg"
                        : "border-line-2 bg-surface-2 hover:border-faint"
                    }`}
                  >
                    {m.completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span
                    className={`flex-1 text-xs ${
                      m.completed
                        ? "line-through text-ghost"
                        : "text-ink font-medium"
                    }`}
                  >
                    {m.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Quick Switcher */}
          <div className="p-3 bg-subtle border border-line rounded-xl flex items-center justify-between text-xs">
            <span className="font-mono text-[11px] font-semibold text-faint uppercase">
              Change Status
            </span>
            <select
              value={goal.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-line bg-surface-2 font-mono text-xs text-ink focus:outline-none cursor-pointer"
            >
              <option value="in_progress">In Progress ⚡</option>
              <option value="planning">Planning 🧭</option>
              <option value="vision">Vision 🔭</option>
              <option value="on_hold">On Hold ⏸️</option>
              <option value="completed">Completed 🏆</option>
            </select>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-line text-xs">
            <button
              onClick={handleDelete}
              className="text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setEditingGoalId(goal._id);
                  setGoalDialogOpen(true);
                  onClose();
                }}
                className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Full Goal
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
