"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Flame,
  Tag,
  Target,
  Sparkles,
} from "lucide-react";

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingTask?: any | null;
  defaultModule?: string;
  defaultIsBigRock?: boolean;
}

const MODULE_OPTIONS = [
  { id: "general", label: "General / Day-to-Day", icon: "📋" },
  { id: "goals", label: "Major Life Goals", icon: "🎯" },
  { id: "problems", label: "Problem Solving / LeetCode", icon: "🧩" },
  { id: "learning", label: "CS & Systems Learning", icon: "📚" },
  { id: "gym", label: "Gym & Vitality", icon: "🏋️" },
  { id: "career", label: "Engineering Career", icon: "💼" },
  { id: "finance", label: "Finance & Ledger", icon: "💰" },
  { id: "personal", label: "Personal & Reflection", icon: "🌱" },
];

export function TaskCreateDialog({
  isOpen,
  onClose,
  editingTask,
  defaultModule = "general",
  defaultIsBigRock = false,
}: TaskDialogProps) {
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const goals = useQuery(api.goals.list) || [];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isBigRock, setIsBigRock] = useState(defaultIsBigRock);
  const [priority, setPriority] = useState("p2_medium");
  const [module, setModule] = useState(defaultModule);
  const [goalId, setGoalId] = useState<string>("");
  const [dueDate, setDueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueTime, setDueTime] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState(50);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(["deepwork"]);
  const [subtasks, setSubtasks] = useState<
    { id: string; title: string; completed: boolean }[]
  >([]);
  const [newSubtaskText, setNewSubtaskText] = useState("");

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title || "");
      setDescription(editingTask.description || "");
      setIsBigRock(Boolean(editingTask.isBigRock));
      setPriority(editingTask.priority || "p2_medium");
      setModule(editingTask.module || "general");
      setGoalId(editingTask.goalId || "");
      setDueDate(editingTask.dueDate || new Date().toISOString().split("T")[0]);
      setDueTime(editingTask.dueTime || "");
      setEstimatedMinutes(editingTask.estimatedMinutes || 50);
      setTags(editingTask.tags || []);
      setSubtasks(editingTask.subtasks || []);
    } else {
      setTitle("");
      setDescription("");
      setIsBigRock(defaultIsBigRock);
      setPriority("p2_medium");
      setModule(defaultModule);
      setGoalId("");
      setDueDate(new Date().toISOString().split("T")[0]);
      setDueTime("");
      setEstimatedMinutes(50);
      setTags(["deepwork"]);
      setSubtasks([]);
    }
  }, [editingTask, isOpen, defaultModule, defaultIsBigRock]);

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, "");
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

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
    if (!title.trim()) return;

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      isBigRock,
      priority,
      module,
      goalId: goalId ? (goalId as any) : undefined,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      estimatedMinutes: Number(estimatedMinutes) || 25,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
      tags: tags.length > 0 ? tags : undefined,
    };

    if (editingTask) {
      await updateTask({
        id: editingTask._id,
        ...payload,
      });
    } else {
      await createTask(payload);
    }

    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl border border-[#E2E8F0] animate-in zoom-in-95 max-h-[92vh] overflow-y-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#ECEAE4] pb-3">
            <div>
              <Dialog.Title className="font-serif text-xl font-bold text-[#1A202C]">
                {editingTask ? "Edit Task" : "Create New Task"}
              </Dialog.Title>
              <Dialog.Description className="text-xs text-[#718096]">
                Structure daily focus, anchor 3 Big Rocks, and link to major pillars.
              </Dialog.Description>
            </div>
            <Dialog.Close className="p-1.5 rounded-md text-[#718096] hover:text-[#1A202C] hover:bg-[#F3F4F6] cursor-pointer">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Title Input */}
            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase tracking-wider text-[#718096] font-semibold">
                Task Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be accomplished?"
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:border-[#333E50] focus:outline-none text-sm text-[#1A202C]"
              />
            </div>

            {/* Big Rock Spotlight Banner */}
            <div
              onClick={() => setIsBigRock(!isBigRock)}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                isBigRock
                  ? "bg-amber-50/80 border-amber-300 shadow-2xs"
                  : "bg-[#F8F9FA] border-[#E2E8F0] hover:border-[#CBD5E1]"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isBigRock
                      ? "bg-amber-500 text-white"
                      : "bg-[#E2E8F0] text-[#718096]"
                  }`}
                >
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-serif font-bold text-xs text-[#1A202C]">
                    Today&apos;s 3 Big Rocks
                  </div>
                  <div className="text-[10px] text-[#718096]">
                    Make this one of your 3 non-negotiable anchor tasks for today.
                  </div>
                </div>
              </div>

              <input
                type="checkbox"
                checked={isBigRock}
                onChange={(e) => setIsBigRock(e.target.checked)}
                className="rounded border-[#CBD5E1] text-amber-600 focus:ring-0 cursor-pointer w-4 h-4"
              />
            </div>

            {/* Domain / Module & Linked Major Goal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-mono text-[11px] uppercase tracking-wider text-[#718096] font-semibold">
                  Domain / Category
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
                  Link to Major Goal (Optional)
                </label>
                <select
                  value={goalId}
                  onChange={(e) => setGoalId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white focus:border-[#333E50] focus:outline-none cursor-pointer"
                >
                  <option value="">None (Independent Task)</option>
                  {goals.map((g: any) => (
                    <option key={g._id} value={g._id}>
                      {g.icon || "🎯"} {g.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority & Date & Estimated Time */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-mono text-[11px] uppercase tracking-wider text-[#718096] font-semibold">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white focus:border-[#333E50] focus:outline-none cursor-pointer"
                >
                  <option value="p1_urgent">🔥 P1 - Urgent / High</option>
                  <option value="p2_medium">⚡ P2 - Medium</option>
                  <option value="p3_low">🌱 P3 - Low</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[11px] uppercase tracking-wider text-[#718096] font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#718096]" /> Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white focus:border-[#333E50] focus:outline-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[11px] uppercase tracking-wider text-[#718096] font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#718096]" /> Duration
                </label>
                <select
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white focus:border-[#333E50] focus:outline-none cursor-pointer"
                >
                  <option value={15}>15 mins (Quick Win)</option>
                  <option value={25}>25 mins (1 Pomodoro)</option>
                  <option value={50}>50 mins (Deep Work Block)</option>
                  <option value={90}>90 mins (Flow Sprint)</option>
                </select>
              </div>
            </div>

            {/* Description / Notes */}
            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase tracking-wider text-[#718096] font-semibold">
                Description / Context Notes
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key details, acceptance criteria, or steps..."
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:border-[#333E50] focus:outline-none"
              />
            </div>

            {/* Subtasks Builder */}
            <div className="space-y-2 pt-2 border-t border-[#ECEAE4]">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[11px] uppercase tracking-wider text-[#718096] font-semibold">
                  Subtasks / Checklist ({subtasks.length})
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
                  placeholder="Add subtask..."
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

            {/* Tags */}
            <div className="space-y-1.5 pt-2 border-t border-[#ECEAE4]">
              <label className="font-mono text-[11px] uppercase tracking-wider text-[#718096] font-semibold flex items-center gap-1">
                <Tag className="w-3 h-3" /> Tags
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-md bg-[#EDF2F7] text-[#333E50] font-mono text-[10px] flex items-center gap-1"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-[#718096] hover:text-rose-600 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="+ tag"
                  className="px-2 py-0.5 rounded border border-[#E2E8F0] text-[11px] w-20 focus:outline-none"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#ECEAE4]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-[#718096] hover:bg-[#F3F4F6] font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#333E50] hover:bg-[#252E3B] text-white font-semibold shadow-xs transition-colors cursor-pointer"
              >
                {editingTask ? "Save Changes" : "Create Task"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
