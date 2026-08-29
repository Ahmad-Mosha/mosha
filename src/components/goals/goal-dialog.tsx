"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useMoshaStore } from "@/lib/store";
import { X, Plus, Trash2, Calendar } from "lucide-react";

const EMOJI_OPTIONS = [
  "🎖️", "💼", "❤️", "🎯", "🚀", "💡", "🏋️", "📚",
  "🏆", "💍", "⚔️", "🛡️", "🌟", "🔥", "💻", "🧠",
  "🕌", "🏔️", "🌱", "🔑", "📈", "🎨", "✍️", "✈️"
];

export function GoalDialog() {
  const { isGoalDialogOpen, setGoalDialogOpen, editingGoalId, setEditingGoalId } =
    useMoshaStore();

  const goals = useQuery(api.goals.list) || [];
  const createGoal = useMutation(api.goals.create);
  const updateGoal = useMutation(api.goals.update);
  const removeGoal = useMutation(api.goals.remove);

  const existingGoal = goals.find((g: any) => g._id === editingGoalId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("in_progress");
  const [targetDate, setTargetDate] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [milestones, setMilestones] = useState<
    { id: string; title: string; completed: boolean }[]
  >([]);
  const [newMilestoneText, setNewMilestoneText] = useState("");

  useEffect(() => {
    if (existingGoal) {
      setTitle(existingGoal.title);
      setDescription(existingGoal.description || "");
      setStatus(existingGoal.status || "in_progress");
      setTargetDate(existingGoal.targetDate || "");
      setIcon(existingGoal.icon || "🎯");
      setMilestones(existingGoal.milestones || []);
    } else {
      setTitle("");
      setDescription("");
      setStatus("in_progress");
      setTargetDate("");
      setIcon("🎯");
      setMilestones([
        { id: `m-${Date.now()}-1`, title: "Define roadmap & first action", completed: false },
      ]);
    }
  }, [existingGoal, isGoalDialogOpen]);

  const handleAddMilestone = () => {
    if (!newMilestoneText.trim()) return;
    setMilestones([
      ...milestones,
      { id: `m-${Date.now()}`, title: newMilestoneText.trim(), completed: false },
    ]);
    setNewMilestoneText("");
  };

  const handleRemoveMilestone = (id: string) => {
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const completedCount = milestones.filter((m) => m.completed).length;
    const computedProgress =
      milestones.length > 0
        ? Math.round((completedCount / milestones.length) * 100)
        : existingGoal?.progress || 0;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      status,
      targetDate: targetDate || undefined,
      icon: icon || "🎯",
      milestones,
      progress: computedProgress,
      phase: "Active",
      order: editingGoalId && existingGoal ? existingGoal.order : goals.length + 1,
    };

    if (editingGoalId && existingGoal) {
      await updateGoal({
        id: editingGoalId as any,
        ...payload,
      });
    } else {
      await createGoal(payload);
    }

    setGoalDialogOpen(false);
    setEditingGoalId(null);
  };

  const handleDelete = async () => {
    if (editingGoalId) {
      await removeGoal({ id: editingGoalId as any });
      setGoalDialogOpen(false);
      setEditingGoalId(null);
    }
  };

  return (
    <Dialog.Root open={isGoalDialogOpen} onOpenChange={setGoalDialogOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface-2 p-6 shadow-2xl border border-line animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
            <div>
              <Dialog.Title className="font-serif text-xl font-bold text-ink">
                {editingGoalId ? "Edit Major Goal" : "Add Major Life Goal"}
              </Dialog.Title>
              <Dialog.Description className="text-xs text-faint">
                Set a monumental life milestone with actionable sub-milestones.
              </Dialog.Description>
            </div>
            <Dialog.Close className="p-1.5 rounded-md text-faint hover:text-ink hover:bg-subtle-2 cursor-pointer">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {/* Emblem Icon + Title Row */}
            <div className="flex items-start gap-3">
              {/* Emoji Emblem Picker */}
              <div className="relative">
                <label className="font-mono text-[11px] uppercase tracking-wider text-faint font-semibold block mb-1">
                  Emblem
                </label>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-12 h-10 rounded-lg border border-line hover:border-accent bg-subtle flex items-center justify-center text-xl cursor-pointer transition-colors"
                >
                  {icon}
                </button>

                {showEmojiPicker && (
                  <div className="absolute top-16 left-0 z-50 p-2 bg-surface-2 border border-line rounded-xl shadow-xl grid grid-cols-6 gap-1 w-56 animate-in fade-in zoom-in-95">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setIcon(emoji);
                          setShowEmojiPicker(false);
                        }}
                        className={`w-8 h-8 rounded-md flex items-center justify-center text-base hover:bg-subtle-2 cursor-pointer transition-colors ${
                          icon === emoji ? "bg-accent/10 border border-accent" : ""
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="flex-1 space-y-1">
                <label className="font-mono text-[11px] uppercase tracking-wider text-faint font-semibold">
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Finish Military Service, Get First Job..."
                  className="w-full px-3 py-2 rounded-lg border border-line focus:border-accent focus:outline-none text-sm text-ink"
                />
              </div>
            </div>

            {/* Target Date (Calendar Component) & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-mono text-[11px] uppercase tracking-wider text-faint font-semibold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-faint" />
                  Target Date
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-line focus:border-accent focus:outline-none text-xs text-ink bg-surface-2 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[11px] uppercase tracking-wider text-faint font-semibold">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-line focus:border-accent focus:outline-none text-xs text-ink bg-surface-2 cursor-pointer"
                >
                  <option value="in_progress">In Progress ⚡</option>
                  <option value="planning">Planning 🧭</option>
                  <option value="vision">Vision 🔭</option>
                  <option value="on_hold">On Hold ⏸️</option>
                  <option value="completed">Completed 🏆</option>
                </select>
              </div>
            </div>

            {/* Core Mission & Description */}
            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase tracking-wider text-faint font-semibold">
                Core Mission & Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is the core purpose and mission of this goal?"
                className="w-full px-3 py-2 rounded-lg border border-line focus:border-accent focus:outline-none text-xs text-ink"
              />
            </div>

            {/* Sub-Milestones Checklist Builder */}
            <div className="space-y-2 pt-2 border-t border-line">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[11px] uppercase tracking-wider text-faint font-semibold">
                  Milestones ({milestones.length})
                </label>
                <span className="text-[10px] text-ghost font-mono">
                  Checking items recalculates progress
                </span>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {milestones.map((m, idx) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-subtle border border-line"
                  >
                    <input
                      type="checkbox"
                      checked={m.completed}
                      onChange={(e) => {
                        const updated = [...milestones];
                        updated[idx].completed = e.target.checked;
                        setMilestones(updated);
                      }}
                      className="rounded border-line-2 text-accent focus:ring-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={m.title}
                      onChange={(e) => {
                        const updated = [...milestones];
                        updated[idx].title = e.target.value;
                        setMilestones(updated);
                      }}
                      className="flex-1 bg-transparent text-xs text-ink focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestone(m.id)}
                      className="text-ghost hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Milestone Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newMilestoneText}
                  onChange={(e) => setNewMilestoneText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddMilestone();
                    }
                  }}
                  placeholder="Add next sub-milestone..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-line text-xs text-ink focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-line">
              {editingGoalId ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold transition-colors flex items-center gap-1 cursor-pointer text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setGoalDialogOpen(false)}
                  className="px-4 py-2 rounded-lg text-faint hover:bg-subtle-2 font-medium transition-colors cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg font-semibold shadow-xs transition-colors cursor-pointer text-xs"
                >
                  {editingGoalId ? "Save Changes" : "Create Goal"}
                </button>
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
