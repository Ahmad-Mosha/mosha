"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { X, Plus, Trash2, Calendar, AlertCircle, RotateCcw } from "lucide-react";
import { Select, NONE } from "@/components/ui/select";
import { RECURRENCE_OPTIONS, recurrenceOf } from "../../../convex/recurrence";

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingTask?: any | null;
  defaultModule?: string;
  defaultIsDaily?: boolean;
  /** Column a Kanban 'add here' click came from. */
  defaultStatus?: string;
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
  defaultStatus,
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
  const [recurrence, setRecurrence] = useState<string>(defaultIsDaily ? "daily" : "none");
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
      setRecurrence(recurrenceOf(editingTask));
      setDueDate(editingTask.dueDate || new Date().toISOString().split("T")[0]);
      setSubtasks(editingTask.subtasks || []);
    } else {
      setTitle("");
      setDescription("");
      setPriority("p2_medium");
      setModule(defaultModule);
      setGoalId("");
      setRecurrence(defaultIsDaily ? "daily" : "none");
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
      recurrence,
    };

    // Honour the column the task was added from.
    if (!editingTask && defaultStatus) payload.status = defaultStatus;

    if (description.trim()) payload.description = description.trim();
    if (dueDate) payload.dueDate = dueDate;
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
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface-2 p-6 shadow-2xl border border-line animate-in zoom-in-95 max-h-[92vh] overflow-y-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <Dialog.Title className="font-serif text-title font-bold text-ink">
                {editingTask ? "Edit Task" : "New Task"}
              </Dialog.Title>
            </div>
            <Dialog.Close className="p-1.5 rounded-md text-faint hover:text-ink hover:bg-subtle-2 cursor-pointer">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-danger-tint border border-danger/35 text-danger text-label flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-label">
            {/* Title Input */}
            <div className="space-y-1">
              <label className="font-mono text-meta uppercase tracking-wider text-faint font-semibold">
                Task Title *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Solve 1 LeetCode Graph problem..."
                className="w-full px-3 py-2 rounded-lg border border-line focus:border-accent focus:outline-none text-body text-ink"
              />
            </div>

            {/* Repeat rule */}
            <div className="space-y-1">
              <label className="font-mono text-meta uppercase tracking-wider text-faint font-semibold flex items-center gap-1.5">
                <RotateCcw className="w-3 h-3" />
                Repeats
              </label>
              <Select
                value={recurrence}
                onValueChange={setRecurrence}
                className="w-full"
                options={RECURRENCE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              />
              {recurrence !== "none" && (
                <p className="text-meta text-faint pt-0.5">
                  Completing it moves the due date to the next occurrence and keeps
                  the streak going.
                </p>
              )}
            </div>

            {/* Category / Domain & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-mono text-meta uppercase tracking-wider text-faint font-semibold">
                  Category
                </label>
                <Select
                  value={module}
                  onValueChange={setModule}
                  className="w-full"
                  options={MODULE_OPTIONS.map((opt) => ({
                    value: opt.id,
                    label: `${opt.icon} ${opt.label}`,
                  }))}
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-meta uppercase tracking-wider text-faint font-semibold">
                  Priority
                </label>
                <Select
                  value={priority}
                  onValueChange={setPriority}
                  className="w-full"
                  options={[
                    { value: "p1_urgent", label: "🔥 High (P1)" },
                    { value: "p2_medium", label: "⚡ Medium (P2)" },
                    { value: "p3_low", label: "🌱 Low (P3)" }
                  ]}
                />
              </div>
            </div>

            {/* Due Date (hidden if Daily) & Link to Major Goal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {true && (
                <div className="space-y-1">
                  <label className="font-mono text-meta uppercase tracking-wider text-faint font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-faint" /> Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-line bg-surface-2 focus:border-accent focus:outline-none cursor-pointer text-label"
                  />
                </div>
              )}

              <div className={`space-y-1 `}>
                <label className="font-mono text-meta uppercase tracking-wider text-faint font-semibold">
                  Linked Life Goal (Optional)
                </label>
                <Select
                  value={goalId || NONE}
                  onValueChange={(v) => setGoalId(v === NONE ? "" : v)}
                  className="w-full"
                  options={[
                    { value: NONE, label: "None" },
                    ...goals.map((g: any) => ({
                      value: g._id,
                      label: `${g.icon || "🎯"} ${g.title}`,
                    })),
                  ]}
                />
              </div>
            </div>

            {/* Notes / Description */}
            <div className="space-y-1">
              <label className="font-mono text-meta uppercase tracking-wider text-faint font-semibold">
                Notes & Details
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional notes or links..."
                className="w-full px-3 py-2 rounded-lg border border-line focus:border-accent focus:outline-none text-label"
              />
            </div>

            {/* Subtasks / Checklist Builder */}
            <div className="space-y-2 pt-2 border-t border-line">
              <div className="flex items-center justify-between">
                <label className="font-mono text-meta uppercase tracking-wider text-faint font-semibold">
                  Checklist ({subtasks.length})
                </label>
              </div>

              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {subtasks.map((st, idx) => (
                  <div
                    key={st.id}
                    className="flex items-center gap-2 p-1.5 rounded-lg bg-subtle border border-line"
                  >
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={(e) => {
                        const updated = [...subtasks];
                        updated[idx].completed = e.target.checked;
                        setSubtasks(updated);
                      }}
                      className="rounded border-line-2 text-accent focus:ring-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={st.title}
                      onChange={(e) => {
                        const updated = [...subtasks];
                        updated[idx].title = e.target.value;
                        setSubtasks(updated);
                      }}
                      className="flex-1 bg-transparent text-label text-ink focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="text-ghost hover:text-danger p-1 cursor-pointer"
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
                  className="flex-1 px-3 py-1.5 rounded-lg border border-line text-label focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-3 py-1.5 rounded-lg bg-subtle-2 hover:bg-line text-ink font-semibold text-label transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-line">
              {editingTask ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-danger hover:bg-danger-tint px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer text-label"
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
                  className="px-4 py-2 rounded-lg text-faint hover:bg-subtle-2 font-medium transition-colors cursor-pointer text-label"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 text-accent-fg font-semibold shadow-xs transition-colors cursor-pointer text-label"
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
