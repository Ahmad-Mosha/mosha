"use client";

import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Trash2, X } from "lucide-react";
import { Select } from "@/components/ui/select";
import { TagInput } from "@/components/ui/tag-input";
import { PRIORITY_OPTIONS } from "./task-meta";
import type { Sprint } from "./sprint-board";

const STATUS_OPTIONS = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

/**
 * Editing a task. Everything the composer can set, plus where it lives —
 * previously a task could only be created and moved between columns, so a
 * typo in a title meant deleting it and starting again.
 */
export function TaskDialog({
  task, sprints, knownLabels, onClose,
}: {
  task: any | null;
  sprints: Sprint[];
  knownLabels: string[];
  onClose: () => void;
}) {
  const updateTask = useMutation(api.tasks.update);
  const removeTask = useMutation(api.tasks.remove);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("p2_medium");
  const [status, setStatus] = useState("todo");
  const [labels, setLabels] = useState<string[]>([]);
  const [sprintId, setSprintId] = useState("__backlog");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title ?? "");
    setDescription(task.description ?? "");
    setPriority(task.priority ?? "p2_medium");
    setStatus(task.status ?? "todo");
    setLabels(task.labels ?? []);
    setSprintId(task.sprintId ?? "__backlog");
    setDueDate(task.dueDate ?? "");
  }, [task]);

  if (!task) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await updateTask({
        id: task._id,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        labels,
        sprintId: (sprintId === "__backlog" ? undefined : sprintId) as any,
        dueDate: dueDate || undefined,
      });
      onClose();
    } catch {
      toast.error("Could not save that task");
    } finally {
      setSaving(false);
    }
  };

  const field =
    "w-full rounded-lg border border-line bg-surface px-3 py-2 text-label text-ink outline-none transition-colors placeholder:text-ghost focus:border-accent";

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-line bg-surface-2 p-5 shadow-2xl animate-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <Dialog.Title className="font-serif text-heading text-ink">Edit task</Dialog.Title>
            <Dialog.Close className="grid h-7 w-7 place-items-center rounded-lg text-faint hover:bg-subtle-2 hover:text-ink cursor-pointer">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={save} className="space-y-3.5 pt-4">
            <input
              autoFocus
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className={field}
            />

            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes, acceptance criteria…"
              className={`${field} leading-relaxed`}
            />

            <div className="grid grid-cols-2 gap-2.5">
              <label className="space-y-1">
                <span className="block font-mono text-meta uppercase text-faint">Priority</span>
                <Select value={priority} onValueChange={setPriority} className="w-full" options={PRIORITY_OPTIONS} />
              </label>
              <label className="space-y-1">
                <span className="block font-mono text-meta uppercase text-faint">Status</span>
                <Select value={status} onValueChange={setStatus} className="w-full" options={STATUS_OPTIONS} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <label className="space-y-1">
                <span className="block font-mono text-meta uppercase text-faint">Sprint</span>
                <Select
                  value={sprintId}
                  onValueChange={setSprintId}
                  className="w-full"
                  options={[
                    { value: "__backlog", label: "Backlog" },
                    ...sprints.map((s) => ({ value: s._id, label: s.name })),
                  ]}
                />
              </label>
              <label className="space-y-1">
                <span className="block font-mono text-meta uppercase text-faint">Due</span>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={field} />
              </label>
            </div>

            <div className="space-y-1">
              <span className="block font-mono text-meta uppercase text-faint">Labels</span>
              <TagInput
                values={labels}
                onChange={setLabels}
                options={knownLabels}
                placeholder="frontend, backend, review…"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={async () => {
                  await removeTask({ id: task._id });
                  toast.success("Task deleted");
                  onClose();
                }}
                className="flex items-center gap-1.5 font-mono text-meta text-ghost transition-colors hover:text-danger cursor-pointer"
              >
                <Trash2 className="h-3 w-3" /> Delete task
              </button>

              <div className="flex gap-2">
                <Dialog.Close className="rounded-lg border border-line px-4 py-2 text-label text-muted transition-colors hover:bg-subtle hover:text-ink cursor-pointer">
                  Cancel
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={!title.trim() || saving}
                  className="rounded-lg bg-accent px-4 py-2 text-label font-semibold text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-40 cursor-pointer"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
