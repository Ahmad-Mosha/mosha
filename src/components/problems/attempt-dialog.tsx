"use client";

import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { ExternalLink, RotateCcw, X } from "lucide-react";
import { problemUrl, type CurriculumProblem } from "@/lib/neetcode-150";
import { nextInterval, type Recall } from "../../../convex/spacedRepetition";
import type { ProgressRow } from "./problems-screen";

/** The recall ladder, worst to best. Wording is about re-solving, not feeling. */
const RECALLS: { value: Recall; label: string; hint: string; cls: string }[] = [
  { value: "again", label: "Again", hint: "Needed the solution", cls: "border-danger/35 bg-danger-tint text-danger" },
  { value: "hard", label: "Hard", hint: "Got there, slowly", cls: "border-warn/35 bg-warn-tint text-warn" },
  { value: "good", label: "Good", hint: "Solved it cleanly", cls: "border-info/35 bg-info-tint text-info" },
  { value: "easy", label: "Easy", hint: "Instant, no doubt", cls: "border-success/35 bg-success-tint text-success" },
];

interface Props {
  problem: CurriculumProblem | null;
  existing?: ProgressRow;
  onClose: () => void;
}

export function AttemptDialog({ problem, existing, onClose }: Props) {
  const logAttempt = useMutation(api.problems.logAttempt);
  const resetProblem = useMutation(api.problems.resetProblem);

  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNotes(existing?.notes ?? "");
  }, [problem?.slug, existing?.notes]);

  if (!problem) return null;

  const streak = existing?.reviewStreak ?? 0;

  const submit = async (recall: Recall) => {
    setSaving(true);
    try {
      await logAttempt({
        slug: problem.slug,
        title: problem.title,
        pattern: problem.pattern,
        difficulty: problem.difficulty,
        recall,
        url: problemUrl(problem.slug),
        notes: notes.trim() || undefined,
      });
      const days = nextInterval(recall, recall === "again" ? 0 : streak);
      toast.success(`Logged — back in ${days} ${days === 1 ? "day" : "days"}`);
      onClose();
    } catch {
      toast.error("Could not save that attempt");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs animate-in fade-in" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2
                     space-y-4 rounded-2xl border border-line bg-surface-2 p-5 shadow-2xl
                     animate-in zoom-in-95"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Dialog.Title className="font-serif text-heading text-ink">
                {problem.title}
              </Dialog.Title>
              <p className="mt-0.5 font-mono text-meta text-faint">
                {problem.pattern} · {problem.difficulty}
                {existing && <> · seen {existing.reviewCount ?? 1}×</>}
              </p>
            </div>
            <Dialog.Close className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-faint hover:bg-subtle-2 hover:text-ink cursor-pointer">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <a
            href={problemUrl(problem.slug)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-label text-info hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open on LeetCode
          </a>

          <label className="block space-y-1">
            <span className="font-mono text-meta uppercase text-faint">
              Intuition / where it went wrong
            </span>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="The invariant, the trap, the thing you forgot…"
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-label
                         leading-relaxed text-ink outline-none transition-colors
                         placeholder:text-ghost focus:border-accent"
            />
          </label>

          <div className="space-y-1.5">
            <span className="font-mono text-meta uppercase text-faint">
              How did the recall go?
            </span>
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

          {existing && (
            <button
              onClick={async () => {
                await resetProblem({ slug: problem.slug });
                toast.success("Progress reset");
                onClose();
              }}
              className="flex items-center gap-1.5 font-mono text-meta text-ghost hover:text-danger cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" /> Reset this problem
            </button>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
