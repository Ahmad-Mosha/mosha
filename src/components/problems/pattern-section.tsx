"use client";

import React, { useState } from "react";
import { ChevronRight, ExternalLink, Circle, CheckCircle2 } from "lucide-react";
import { problemUrl, type CurriculumProblem } from "@/lib/neetcode-150";
import { today } from "../../../convex/recurrence";
import type { ProgressRow } from "./problems-screen";

const DIFF_STYLE: Record<string, string> = {
  Easy: "text-success",
  Medium: "text-warn",
  Hard: "text-danger",
};

/** Mastery drives the ring colour: a solved-but-shaky problem should not look done. */
function masteryRing(mastery: number) {
  if (mastery >= 100) return "text-success";
  if (mastery >= 80) return "text-info";
  if (mastery >= 50) return "text-warn";
  return "text-danger";
}

interface Props {
  pattern: string;
  problems: CurriculumProblem[];
  total: number;
  progress: Record<string, ProgressRow>;
  onOpen: (slug: string) => void;
}

export function PatternSection({ pattern, problems, total, progress, onOpen }: Props) {
  const [open, setOpen] = useState(false);
  const done = problems.filter((p) => progress[p.slug]).length;
  const allDone = done === total && total > 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-subtle/60 cursor-pointer"
      >
        <ChevronRight
          className={`h-4 w-4 shrink-0 text-ghost transition-transform duration-150 ${open ? "rotate-90" : ""}`}
        />
        <span className={`flex-1 truncate text-heading ${allDone ? "text-success" : "text-ink"}`}>
          {pattern}
        </span>

        <span className="hidden w-32 sm:block">
          <span className="block h-1.5 overflow-hidden rounded-full bg-subtle-2">
            <span
              className={`block h-full rounded-full transition-[width] duration-500 ${allDone ? "bg-success" : "bg-accent"}`}
              style={{ width: `${pct}%` }}
            />
          </span>
        </span>

        <span className="w-14 shrink-0 text-right font-mono text-meta text-faint">
          {done}/{total}
        </span>
      </button>

      {open && (
        <ul className="divide-y divide-line border-t border-line">
          {problems.map((p) => {
            const row = progress[p.slug];
            const mastery = row?.masteryLevel ?? 0;
            const isDue = row?.nextReviewDate && row.nextReviewDate <= today();

            return (
              <li key={p.slug}>
                <div className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-subtle/50">
                  <button
                    onClick={() => onOpen(p.slug)}
                    title={row ? "Log another attempt" : "Mark as attempted"}
                    className="shrink-0 cursor-pointer"
                  >
                    {row ? (
                      <CheckCircle2 className={`h-4 w-4 ${masteryRing(mastery)}`} />
                    ) : (
                      <Circle className="h-4 w-4 text-line-2 hover:text-accent" />
                    )}
                  </button>

                  <button
                    onClick={() => onOpen(p.slug)}
                    className="min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <span className={`truncate text-label ${row ? "text-ink" : "text-ink-2"}`}>
                      {p.title}
                    </span>
                  </button>

                  {isDue && (
                    <span className="shrink-0 rounded bg-info-tint px-1.5 py-0.5 font-mono text-meta text-info">
                      due
                    </span>
                  )}
                  {row && (
                    <span className="hidden shrink-0 font-mono text-meta text-ghost sm:block">
                      {mastery}%
                    </span>
                  )}

                  <span className={`w-14 shrink-0 text-right font-mono text-meta ${DIFF_STYLE[p.difficulty]}`}>
                    {p.difficulty}
                  </span>

                  <a
                    href={problemUrl(p.slug)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Open on LeetCode"
                    className="shrink-0 text-ghost transition-colors hover:text-accent"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
