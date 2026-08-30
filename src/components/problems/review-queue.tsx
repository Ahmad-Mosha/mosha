"use client";

import React from "react";
import { Brain } from "lucide-react";
import type { ProgressRow } from "./problems-screen";

/**
 * What spaced repetition says is due now. Sits above the roadmap because
 * reviewing beats starting something new — the schema has carried
 * nextReviewDate from the beginning with nothing acting on it.
 */
export function ReviewQueue({
  due, onOpen,
}: {
  due: ProgressRow[];
  onOpen: (slug: string) => void;
}) {
  return (
    <section className="rounded-xl border border-info/35 bg-info-tint/40 p-4">
      <h2 className="mb-2.5 flex items-center gap-1.5 font-mono text-meta font-semibold uppercase text-info">
        <Brain className="h-3.5 w-3.5" />
        Due for review
        <span className="text-ghost">{due.length}</span>
      </h2>

      <div className="flex flex-wrap gap-1.5">
        {due.map((r) => (
          <button
            key={r._id}
            onClick={() => r.slug && onOpen(r.slug)}
            disabled={!r.slug}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-2.5 py-1
                       text-label text-ink transition-colors hover:border-info
                       disabled:opacity-50 cursor-pointer"
          >
            {(r as any).title}
            <span className="font-mono text-meta text-ghost">{r.masteryLevel ?? 0}%</span>
          </button>
        ))}
      </div>
    </section>
  );
}
