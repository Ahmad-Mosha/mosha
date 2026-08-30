"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Brain, Flame, Search, Target } from "lucide-react";
import { Select } from "@/components/ui/select";
import { ActivityHeatmap, currentStreak, longestStreak } from "@/components/ui/activity-heatmap";
import { NEETCODE_150, PATTERNS, BY_PATTERN } from "@/lib/neetcode-150";
import { today } from "../../../convex/recurrence";
import { PatternSection } from "./pattern-section";
import { AttemptDialog } from "./attempt-dialog";
import { ReviewQueue } from "./review-queue";

export type ProgressRow = {
  _id: string;
  slug?: string;
  masteryLevel?: number;
  nextReviewDate?: string;
  lastSolvedDate?: string;
  reviewCount?: number;
  reviewStreak?: number;
  notes?: string;
  code?: string;
  language?: string;
};

export function ProblemsScreen() {
  const rows = (useQuery(api.problems.list) ?? []) as unknown as ProgressRow[];
  const due = (useQuery(api.problems.dueForReview) ?? []) as unknown as ProgressRow[];

  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [state, setState] = useState("all");
  const [active, setActive] = useState<string | null>(null);

  /** slug -> progress, so the static list can render without a join. */
  const progress = useMemo(() => {
    const map: Record<string, ProgressRow> = {};
    for (const r of rows) if (r.slug) map[r.slug] = r;
    return map;
  }, [rows]);

  const counts = useMemo(() => {
    const byDay: Record<string, number> = {};
    for (const r of rows) {
      if (r.lastSolvedDate) byDay[r.lastSolvedDate] = (byDay[r.lastSolvedDate] ?? 0) + 1;
    }
    return byDay;
  }, [rows]);

  const solved = NEETCODE_150.filter((p) => progress[p.slug]).length;
  const mastered = NEETCODE_150.filter((p) => (progress[p.slug]?.masteryLevel ?? 0) >= 100).length;
  const percent = Math.round((solved / NEETCODE_150.length) * 100);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (slug: string, title: string, diff: string) => {
      if (difficulty !== "all" && diff !== difficulty) return false;
      if (state === "solved" && !progress[slug]) return false;
      if (state === "unsolved" && progress[slug]) return false;
      if (state === "due" && !(progress[slug]?.nextReviewDate && progress[slug]!.nextReviewDate! <= today()))
        return false;
      if (q && !title.toLowerCase().includes(q)) return false;
      return true;
    };
  }, [query, difficulty, state, progress]);

  const visiblePatterns = PATTERNS.filter((p) =>
    BY_PATTERN[p].some((x) => matches(x.slug, x.title, x.difficulty))
  );

  const activeProblem = active ? NEETCODE_150.find((p) => p.slug === active) ?? null : null;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="font-serif text-display font-bold text-ink">Problem Solving</h1>
          <p className="mt-0.5 text-label text-faint">
            NeetCode 150 · spaced repetition · pattern mastery
          </p>
        </div>

        <div className="flex items-center gap-5">
          <Stat label="Solved" value={`${solved}`} sub={`of ${NEETCODE_150.length}`} />
          <Stat label="Mastered" value={`${mastered}`} sub={`${percent}% covered`} />
          <Stat
            label="Streak"
            value={`${currentStreak(counts)}`}
            sub={`best ${longestStreak(counts)}`}
            icon={<Flame className="h-3.5 w-3.5 text-warn" />}
          />
        </div>
      </header>

      <div className="h-1.5 overflow-hidden rounded-full bg-subtle-2">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <section className="rounded-xl border border-line bg-surface p-4">
        <h2 className="mb-3 flex items-center gap-1.5 font-mono text-meta font-semibold uppercase text-faint">
          <Brain className="h-3.5 w-3.5" /> Solving activity
        </h2>
        <ActivityHeatmap counts={counts} ramp="info" unit="problem" weeks={26} />
      </section>

      {due.length > 0 && <ReviewQueue due={due} onOpen={setActive} />}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ghost" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the 150…"
            className="w-full rounded-lg border border-line bg-surface-2 py-1.5 pl-8 pr-2
                       text-label text-ink outline-none transition-colors
                       placeholder:text-ghost focus:border-accent"
          />
        </div>
        <Select
          value={difficulty}
          onValueChange={setDifficulty}
          size="sm"
          options={[
            { value: "all", label: "All difficulties" },
            { value: "Easy", label: "Easy" },
            { value: "Medium", label: "Medium" },
            { value: "Hard", label: "Hard" },
          ]}
        />
        <Select
          value={state}
          onValueChange={setState}
          size="sm"
          options={[
            { value: "all", label: "All problems" },
            { value: "unsolved", label: "Not started" },
            { value: "solved", label: "Attempted" },
            { value: "due", label: "Due for review" },
          ]}
        />
      </div>

      <div className="space-y-2.5">
        {visiblePatterns.length === 0 ? (
          <p className="py-12 text-center text-label text-ghost">Nothing matches those filters.</p>
        ) : (
          visiblePatterns.map((pattern) => (
            <PatternSection
              key={pattern}
              pattern={pattern}
              problems={BY_PATTERN[pattern].filter((x) => matches(x.slug, x.title, x.difficulty))}
              total={BY_PATTERN[pattern].length}
              progress={progress}
              onOpen={setActive}
            />
          ))
        )}
      </div>

      <AttemptDialog
        problem={activeProblem}
        existing={active ? progress[active] : undefined}
        onClose={() => setActive(null)}
      />
    </div>
  );
}

function Stat({
  label, value, sub, icon,
}: {
  label: string; value: string; sub?: string; icon?: React.ReactNode;
}) {
  return (
    <div className="text-right">
      <div className="flex items-center justify-end gap-1.5">
        {icon}
        <span className="font-serif text-title leading-none text-ink">{value}</span>
      </div>
      <div className="font-mono text-meta uppercase text-ghost">
        {label}
        {sub && <span className="ml-1 normal-case text-faint">{sub}</span>}
      </div>
    </div>
  );
}
