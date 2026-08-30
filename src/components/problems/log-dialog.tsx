"use client";

import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Trash2, X } from "lucide-react";
import { Select } from "@/components/ui/select";
import { PatternInput } from "./pattern-input";
import { nextInterval, type Recall } from "../../../convex/spacedRepetition";
import { today } from "../../../convex/recurrence";

const RECALLS: { value: Recall; label: string; hint: string; cls: string }[] = [
  { value: "again", label: "Again", hint: "Needed the solution", cls: "border-danger/35 bg-danger-tint text-danger" },
  { value: "hard", label: "Hard", hint: "Got there, slowly", cls: "border-warn/35 bg-warn-tint text-warn" },
  { value: "good", label: "Good", hint: "Solved it cleanly", cls: "border-info/35 bg-info-tint text-info" },
  { value: "easy", label: "Easy", hint: "Instant, no doubt", cls: "border-success/35 bg-success-tint text-success" },
];

export interface ProblemRow {
  _id: string;
  title: string;
  pattern: string;
  difficulty: string;
  url?: string;
  notes?: string;
  reviewCount?: number;
  reviewStreak?: number;
  masteryLevel?: number;
  lastSolvedDate?: string;
  nextReviewDate?: string;
}

interface Props {
  open: boolean;
  /** Present when re-logging an existing problem. */
  editing?: ProblemRow | null;
  /** Pre-fills the solved-on date when opened from a heatmap day. */
  defaultDate?: string;
  /** Patterns already used, offered before the built-in suggestions. */
  knownPatterns: string[];
  onClose: () => void;
}

export function LogDialog({ open, editing, defaultDate, knownPatterns, onClose }: Props) {
  const logSolve = useMutation(api.problems.logSolve);
  const removeProblem = useMutation(api.problems.removeProblem);

  const [title, setTitle] = useState("");
  const [pattern, setPattern] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [solvedOn, setSolvedOn] = useState(defaultDate ?? today());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(editing?.title ?? "");
    setPattern(editing?.pattern ?? "");
    setDifficulty(editing?.difficulty ?? "Medium");
    setUrl(editing?.url ?? "");
    setNotes(editing?.notes ?? "");
    setSolvedOn(defaultDate ?? today());
  }, [open, editing, defaultDate]);

  const streak = editing?.reviewStreak ?? 0;

  const submit = async (recall: Recall) => {
    if (!title.trim()) {
      toast.error("Give the problem a title");
      return;
    }
    setSaving(true);
    try {
      await logSolve({
        title: title.trim(),
        pattern: pattern.trim() || "Uncategorised",
        difficulty,
        recall,
        url: url.trim() || undefined,
        notes: notes.trim() || undefined,
        solvedOn,
      });
      const days = nextInterval(recall, recall === "again" ? 0 : streak);
      toast.success(`Logged — back in ${days} ${days === 1 ? "day" : "days"}`);
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not log that");
    } finally {
      setSaving(false);
    }
  };

  const field = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-label text-ink outline-none transition-colors placeholder:text-ghost focus:border-accent";

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs animate-in fade-in" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-full max-w-lg -translate-x-1/2
                     -translate-y-1/2 space-y-3.5 overflow-y-auto rounded-2xl border border-line
                     bg-surface-2 p-5 shadow-2xl animate-in zoom-in-95"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="font-serif text-heading text-ink">
                {editing ? "Log another attempt" : "Log a solve"}
              </Dialog.Title>
              {editing && (
                <p className="mt-0.5 font-mono text-meta text-faint">
                  seen {editing.reviewCount ?? 1}× · mastery {editing.masteryLevel ?? 0}%
                </p>
              )}
            </div>
            <Dialog.Close className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-faint hover:bg-subtle-2 hover:text-ink cursor-pointer">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <input
            autoFocus={!editing}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Problem name"
            className={field}
          />

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <span className="font-mono text-meta uppercase text-faint">Pattern</span>
              <PatternInput
                value={pattern}
                onChange={setPattern}
                options={knownPatterns}
              />
            </div>

            <div className="space-y-1">
              <span className="font-mono text-meta uppercase text-faint">Difficulty</span>
              <Select
                value={difficulty}
                onValueChange={setDifficulty}
                className="w-full"
                options={[
                  { value: "Easy", label: "Easy" },
                  { value: "Medium", label: "Medium" },
                  { value: "Hard", label: "Hard" },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <span className="font-mono text-meta uppercase text-faint">Link (optional)</span>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                className={field}
              />
            </div>
            <div className="space-y-1">
              <span className="font-mono text-meta uppercase text-faint">Solved on</span>
              <input
                type="date"
                value={solvedOn}
                onChange={(e) => setSolvedOn(e.target.value)}
                className={field}
              />
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-mono text-meta uppercase text-faint">
              Intuition / where it went wrong
            </span>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="The invariant, the trap, the thing you forgot…"
              className={`${field} leading-relaxed`}
            />
          </div>

          <div className="space-y-1.5">
            <span className="font-mono text-meta uppercase text-faint">How did it go?</span>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {RECALLS.map((r) => (
                <button
                  key={r.value}
                  disabled={saving}
                  onClick={() => submit(r.value)}
                  className={`rounded-lg border px-2 py-2 text-center transition-transform
                              hover:scale-[1.02] disabled:opacity-50 cursor-pointer ${r.cls}`}
                >
                  <span className="block text-label font-semibold">{r.label}</span>
                  <span className="block font-mono text-meta opacity-70">
                    {nextInterval(r.value, r.value === "again" ? 0 : streak)}d
                  </span>
                  <span className="mt-0.5 block text-meta opacity-60">{r.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {editing && (
            <button
              onClick={async () => {
                await removeProblem({ id: editing._id as any });
                toast.success("Removed from the log");
                onClose();
              }}
              className="flex items-center gap-1.5 font-mono text-meta text-ghost hover:text-danger cursor-pointer"
            >
              <Trash2 className="h-3 w-3" /> Remove from log
            </button>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
