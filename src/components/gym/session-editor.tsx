"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Copy, Plus, Trash2, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Select } from "@/components/ui/select";
import { SPLIT_OPTIONS, formatVolume, newId } from "./gym-meta";

interface SetRow { reps: number; weightKg: number; rpe?: number }
interface Exercise { id: string; name: string; sets: SetRow[] }

/**
 * Logging a session.
 *
 * Sets are rows you fill in as you go, and each new set copies the one above —
 * because the second set is almost always the same as the first, and retyping
 * it every time is what stops people logging at all.
 */
export function SessionEditor({
  session, knownExercises, onClose,
}: {
  session: any;
  knownExercises: string[];
  onClose: () => void;
}) {
  const updateSession = useMutation(api.gym.updateSession);
  const removeSession = useMutation(api.gym.removeSession);

  const [title, setTitle] = useState(session.title ?? "");
  const [split, setSplit] = useState(session.split ?? "push");
  const [date, setDate] = useState(session.date ?? "");
  const [duration, setDuration] = useState(session.durationMinutes ?? "");
  const [notes, setNotes] = useState(session.notes ?? "");
  const [exercises, setExercises] = useState<Exercise[]>(session.exercises ?? []);
  const [saving, setSaving] = useState(false);

  const volume = exercises.reduce(
    (t, e) => t + e.sets.reduce((s, x) => s + (x.reps || 0) * (x.weightKg || 0), 0),
    0
  );

  const patchExercise = (id: string, fn: (e: Exercise) => Exercise) =>
    setExercises((xs) => xs.map((e) => (e.id === id ? fn(e) : e)));

  const save = async () => {
    setSaving(true);
    try {
      await updateSession({
        id: session._id,
        title: title.trim() || "Session",
        split,
        date,
        durationMinutes: duration === "" ? undefined : Number(duration),
        notes: notes.trim() || undefined,
        exercises,
      });
      toast.success("Session saved");
      onClose();
    } catch {
      toast.error("Could not save the session");
    } finally {
      setSaving(false);
    }
  };

  const field =
    "rounded-lg border border-line bg-surface px-2.5 py-1.5 text-label text-ink outline-none transition-colors placeholder:text-ghost focus:border-accent";

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-line bg-surface-2 p-5 shadow-2xl animate-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <Dialog.Title className="font-serif text-heading text-ink">Session</Dialog.Title>
            <Dialog.Close className="grid h-7 w-7 place-items-center rounded-lg text-faint hover:bg-subtle-2 hover:text-ink cursor-pointer">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <label className="col-span-2 space-y-1">
                <span className="block font-mono text-meta uppercase text-faint">Title</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className={`w-full ${field}`} />
              </label>
              <label className="space-y-1">
                <span className="block font-mono text-meta uppercase text-faint">Split</span>
                <Select value={split} onValueChange={setSplit} className="w-full" options={SPLIT_OPTIONS} />
              </label>
              <label className="space-y-1">
                <span className="block font-mono text-meta uppercase text-faint">Date</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`w-full ${field}`} />
              </label>
            </div>

            <div className="space-y-2">
              {exercises.map((ex) => (
                <div key={ex.id} className="space-y-2 rounded-xl border border-line bg-surface p-3">
                  <div className="flex items-center gap-2">
                    <input
                      list="known-exercises"
                      value={ex.name}
                      onChange={(e) => patchExercise(ex.id, (x) => ({ ...x, name: e.target.value }))}
                      placeholder="Exercise"
                      className={`flex-1 ${field}`}
                    />
                    <button
                      onClick={() => setExercises((xs) => xs.filter((x) => x.id !== ex.id))}
                      title="Remove exercise"
                      className="grid h-7 w-7 place-items-center rounded-lg text-ghost hover:bg-danger-tint hover:text-danger cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    {ex.sets.map((set, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-5 shrink-0 text-center font-mono text-meta text-ghost">{i + 1}</span>
                        <input
                          type="number" inputMode="decimal" value={set.weightKg}
                          onChange={(e) =>
                            patchExercise(ex.id, (x) => ({
                              ...x,
                              sets: x.sets.map((s, j) => (j === i ? { ...s, weightKg: Number(e.target.value) } : s)),
                            }))
                          }
                          className={`w-20 ${field}`}
                        />
                        <span className="font-mono text-meta text-ghost">kg ×</span>
                        <input
                          type="number" inputMode="numeric" value={set.reps}
                          onChange={(e) =>
                            patchExercise(ex.id, (x) => ({
                              ...x,
                              sets: x.sets.map((s, j) => (j === i ? { ...s, reps: Number(e.target.value) } : s)),
                            }))
                          }
                          className={`w-16 ${field}`}
                        />
                        <span className="font-mono text-meta text-ghost">reps</span>
                        <span className="ml-auto font-mono text-meta text-faint">
                          {formatVolume((set.reps || 0) * (set.weightKg || 0))}
                        </span>
                        <button
                          onClick={() =>
                            patchExercise(ex.id, (x) => ({ ...x, sets: x.sets.filter((_, j) => j !== i) }))
                          }
                          title="Remove set"
                          className="text-ghost hover:text-danger cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      patchExercise(ex.id, (x) => ({
                        ...x,
                        // Copy the previous set: the next one is usually the same.
                        sets: [...x.sets, x.sets[x.sets.length - 1] ?? { reps: 8, weightKg: 0 }],
                      }))
                    }
                    className="flex items-center gap-1.5 font-mono text-meta text-muted hover:text-ink cursor-pointer"
                  >
                    <Copy className="h-3 w-3" /> Add set
                  </button>
                </div>
              ))}

              <datalist id="known-exercises">
                {knownExercises.map((n) => <option key={n} value={n} />)}
              </datalist>

              <button
                onClick={() =>
                  setExercises((xs) => [...xs, { id: newId(), name: "", sets: [{ reps: 8, weightKg: 0 }] }])
                }
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed
                           border-line-2 py-2.5 text-label text-muted transition-colors
                           hover:border-accent hover:text-ink cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add exercise
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <label className="space-y-1">
                <span className="block font-mono text-meta uppercase text-faint">Minutes</span>
                <input
                  type="number" value={duration}
                  onChange={(e) => setDuration(e.target.value === "" ? "" : Number(e.target.value))}
                  className={`w-full ${field}`}
                />
              </label>
              <label className="space-y-1">
                <span className="block font-mono text-meta uppercase text-faint">Notes</span>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} className={`w-full ${field}`} />
              </label>
            </div>

            <div className="flex items-center justify-between border-t border-line pt-3">
              <button
                onClick={async () => {
                  await removeSession({ id: session._id });
                  toast.success("Session deleted");
                  onClose();
                }}
                className="flex items-center gap-1.5 font-mono text-meta text-ghost hover:text-danger cursor-pointer"
              >
                <Trash2 className="h-3 w-3" /> Delete session
              </button>

              <div className="flex items-center gap-3">
                <span className="font-mono text-meta text-faint">{formatVolume(volume)} total</span>
                <button
                  onClick={save}
                  disabled={saving}
                  className="rounded-lg bg-accent px-4 py-2 text-label font-semibold text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-40 cursor-pointer"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
