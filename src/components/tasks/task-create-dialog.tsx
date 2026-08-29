"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { X, Plus, Trash2, Calendar, AlertCircle, RotateCcw } from "lucide-react";

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingTask?: any | null;
  defaultModule?: string;
  defaultIsDaily?: boolean;
}

const MODULE_OPTIONS = [
  { id: "general", label: "General", icon: "📋" },
  { id: "problems", label: "Problem Solving / LeetCode", icon: "🧩" },
  { id: "learning", label: "CS & Systems Learning", icon: "📚" },
  { id: "gym", label: "Gym & Vitality", icon: "🏋️" },
  { id: "career", label: "Career & Engineering", icon: "💼" },
  { id: "goals", label: "Major Goals", icon: "🎯" },
  { id: "finance", label: "Finance", icon: "💰" },
  { id: "personal", label: "Personal & Reflection", icon: "🌱" },
];

export function TaskCreateDialog({
  isOpen,
  onClose,
  editingTask,
  defaultModule = "general",
  defaultIsDaily = false,
}: TaskDialogProps) {
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const removeTask = useMutation(api.tasks.remove);
  const goals = useQuery(api.goals.list) || [];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("p2_medium");
  const [module, setModule] = useState(defaultModule);
  const [goalId, setGoalId] = useState<string>("");
  const [isDaily, setIsDaily] = useState(defaultIsDaily);
  const [dueDate, setDueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [subtasks, setSubtasks] = useState<
    { id: string; title: string; completed: boolean }[]
  >([]);
  const [newSubtaskText, setNewSubtaskText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title || "");
      setDescription(editingTask.description || "");
      setPriority(editingTask.priority || "p2_medium");
      setModule(editingTask.module || "general");
      setGoalId(editingTask.goalId || "");
      setIsDaily(Boolean(editingTask.isDaily));
      setDueDate(editingTask.dueDate || new Date().toISOString().split("T")[0]);
      setSubtasks(editingTask.subtasks || []);
    } else {
      setTitle("");
      setDescription("");
      setPriority("p2_medium");
      setModule(defaultModule);
      setGoalId("");
      setIsDaily(defaultIsDaily);
      setDueDate(new Date().toISOString().split("T")[0]);
      setSubtasks([]);
    }
    setErrorMsg(null);
  }, [editingTask, isOpen, defaultModule, defaultIsDaily]);

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    setSubtasks([
      ...subtasks,
      { id: `st-${Date.now()}`, title: newSubtaskText.trim(), completed: false },
    ]);
    setNewSubtaskText("");
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const payload: any = {
      title: title.trim(),
      priority,
      module,
      isDaily,
      isBigRock: false,
    };

    if (description.trim()) payload.description = description.trim();
    if (dueDate && !isDaily) payload.dueDate = dueDate;
    if (goalId) payload.goalId = goalId as any;
    if (subtasks.length > 0) payload.subtasks = subtasks;

    try {
      if (editingTask) {
        await updateTask({
          id: editingTask._id,
          ...payload,
        });
      } else {
        await createTask(payload);
      }
      onClose();
    } catch (err: any) {
      console.error("Failed to save task:", err);
      setErrorMsg(err.message || "Failed to save task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (editingTask) {
      try {
        await removeTask({ id: editingTask._id });
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to delete task.");
      }
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl border border-[#E2E8F0] animate-in zoom-in-95 max-h-[92vh] overflow-y-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#ECEAE4] pb-3">
            <div>
              <Dialog.Title className="font-serif text-xl font-bold text-[#1A202C]">
                {editingTask ? "Edit Task" : "New Task"}
              </Dialog.Title>
            </div>
            <Dialog.Close className="p-1.5 rounded-md text-[#718096] hover:text-[#1A202C] hover:bg-[#F3F4F6] cursor-pointer">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Title Input */}
            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase tracking-wider text-[#718096] font-semibold">
                Task Title *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Solve 1 LeetCode Graph problem..."
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:border-[#333E50] focus:outline-none text-sm text-[#1A202C]"
              />
            </div>

            {/* Daily Recurring Toggle */}
            <div
              onClick={() => setIsDaily(!isDaily)}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                isDaily
                  ? "bg-blue-50/80 border-blue-300 shadow-2xs"
                  : "bg-[#F8F9FA] border-[#E2E8F0] hover:border-[#CBD5E1]"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isDaily
                      ? "bg-blue-600 text-white"
                      : "bg-[#E2E8F0] text-[#718096]"
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-serif font-bold text-xs text-[#1A202C]">
                    Daily Recurring Task
                  </div>
                  <div className="text-[10px] text-[#718096]">
                    Repeats every single day (e.g. daily problem solving, workout, reading).
                  </div>
                </div>
              </div>

              <input
                type="checkbox"
                checked={isDaily}
                onChange={(e) => setIsDaily(e.target.checked)}
                className="rounded border-[#CBD5E1] text-blue-600 focus:ring-0 cursor-pointer w-4 h-4"
              />
            </div>

            {/* Category / Domain & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-mono text-[11px] uppercase tracking-wider text-[#718096] font-semibold">
                  Category
                </label>
                <select
                  value={module}
                  onChange={(e) => setModule(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white focus:border-[#333E50] focus:outline-none cursor-pointer"
                >
                  {MODULE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[11px] uppercase tracking-wider text-[#718096] font-semibold">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white focus:border-[#333E50] focus:outline-none cursor-pointer"
                >
                  <option value="p1_urgent">🔥 High (P1)</option>
                  <option value="p2_medium">⚡ Medium (P2)</option>
                  <option value="p3_low">🌱 Low (P3)</option>
                </select>
              </div>
            </div>

            {/* Due Date (hidden if Daily) & Link to Major Goal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {!isDaily && (
                <div className="space-y-1">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-[#718096] font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#718096]" /> Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white focus:border-[#333E50] focus:outline-none cursor-pointer text-xs"
                  />
                </div>
              )}

              <div className={`space-y-1 ${isDaily ? "sm:col-span-2" : ""}`}>
                <label className="font-mono text-[11px] uppercase tracking-wider text-[#718096] font-semibold">
                  Linked Life Goal (Optional)
                </label>
                <select
                  value={goalId}
                  onChange={(e) => setGoalId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white focus:border-[#333E50] focus:outline-none cursor-pointer"
                >
                  <option value="">None</option>
                  {goals.map((g: any) => (
                    <option key={g._id} value={g._id}>
                      {g.icon || "🎯"} {g.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes / Description */}
            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase tracking-wider text-[#718096] font-semibold">
                Notes & Details
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional notes or links..."
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:border-[#333E50] focus:outline-none text-xs"
              />
            </div>

            {/* Subtasks / Checklist Builder */}
            <div className="space-y-2 pt-2 border-t border-[#ECEAE4]">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[11px] uppercase tracking-wider text-[#718096] font-semibold">
                  Checklist ({subtasks.length})
                </label>
              </div>

              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {subtasks.map((st, idx) => (
                  <div
                    key={st.id}
                    className="flex items-center gap-2 p-1.5 rounded-lg bg-[#F8F9FA] border border-[#E2E8F0]"
                  >
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={(e) => {
                        const updated = [...subtasks];
                        updated[idx].completed = e.target.checked;
                        setSubtasks(updated);
                      }}
                      className="rounded border-[#CBD5E1] text-[#333E50] focus:ring-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={st.title}
                      onChange={(e) => {
                        const updated = [...subtasks];
                        updated[idx].title = e.target.value;
                        setSubtasks(updated);
                      }}
                      className="flex-1 bg-transparent text-xs text-[#1A202C] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="text-[#A0AEC0] hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  placeholder="Add item..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-3 py-1.5 rounded-lg bg-[#F1F3F5] hover:bg-[#E2E8F0] text-[#1A202C] font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-[#ECEAE4]">
              {editingTask ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-[#718096] hover:bg-[#F3F4F6] font-medium transition-colors cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-[#333E50] hover:bg-[#252E3B] disabled:opacity-50 text-white font-semibold shadow-xs transition-colors cursor-pointer text-xs"
                >
                  {isSubmitting ? "Saving..." : editingTask ? "Save" : "Create Task"}
                </button>
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
