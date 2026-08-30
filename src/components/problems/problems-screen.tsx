"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Brain, ExternalLink, Flame, Plus, Search, X } from "lucide-react";
import { Select } from "@/components/ui/select";
import { ActivityHeatmap, currentStreak, longestStreak } from "@/components/ui/activity-heatmap";
import { fromDayString, today } from "../../../convex/recurrence";
import { LogDialog, type ProblemRow } from "./log-dialog";

const LONG = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" });

const DIFF_STYLE: Record<string, string> = {
  Easy: "text-success",
  Medium: "text-warn",
  Hard: "text-danger",
};

/** Mastery colours the dot, so a solved-but-shaky problem does not look finished. */
function masteryDot(mastery: number) {
  if (mastery >= 100) return "bg-success";
  if (mastery >= 80) return "bg-info";
  if (mastery >= 50) return "bg-warn";
  return "bg-danger";
}

export function ProblemsScreen() {
  const problems = (useQuery(api.problems.list) ?? []) as unknown as ProblemRow[];
  const due = (useQuery(api.problems.dueForReview) ?? []) as unknown as ProblemRow[];

  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [pattern, setPattern] = useState("all");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProblemRow | null>(null);

  /** Patterns come from what has actually been logged — nothing is preset. */
  const knownPatterns = useMemo(
    () => Array.from(new Set(problems.map((p) => p.pattern).filter(Boolean))).sort(),
    [problems]
  );

  const counts = useMemo(() => {
    const byDay: Record<string, number> = {};
    for (const p of problems) {
      if (p.lastSolvedDate) byDay[p.lastSolvedDate] = (byDay[p.lastSolvedDate] ?? 0) + 1;
    }
    return byDay;
  }, [problems]);

  const dayProblems = useMemo(
    () => (selectedDay ? problems.filter((p) => p.lastSolvedDate === selectedDay) : []),
    [problems, selectedDay]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return problems.filter((p) => {
      if (difficulty !== "all" && p.difficulty !== difficulty) return false;
      if (pattern !== "all" && p.pattern !== pattern) return false;
      if (q && !p.title.toLowerCase().includes(q) && !p.pattern?.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [problems, query, difficulty, pattern]);

  const grouped = useMemo(() => {
    const map = new Map<string, ProblemRow[]>();
    for (const p of filtered) {
      const key = p.pattern || "Uncategorised";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  const mastered = problems.filter((p) => (p.masteryLevel ?? 0) >= 100).length;

  const openNew = (date?: string) => {
    setEditing(null);
    setSelectedDay(date ?? selectedDay);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="font-serif text-display font-bold text-ink">Problem Solving</h1>
          <p className="mt-0.5 text-label text-faint">
            Everything you solve, in or out of any plan.
          </p>
        </div>

        <div className="flex items-center gap-5">
          <Stat label="Solved" value={`${problems.length}`} />
          <Stat label="Mastered" value={`${mastered}`} />
          <Stat label="Patterns" value={`${knownPatterns.length}`} />
          <Stat
            label="Streak"
            value={`${currentStreak(counts)}`}
            sub={`best ${longestStreak(counts)}`}
            icon={<Flame className="h-3.5 w-3.5 text-warn" />}
          />
          <button
            onClick={() => openNew()}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-label
                       font-semibold text-accent-fg transition-colors hover:bg-accent-hover cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Log a solve
          </button>
        </div>
      </header>

      <section className="rounded-xl border border-line bg-surface px-4 py-5">
        <h2 className="mb-4 text-center font-mono text-meta font-semibold uppercase text-faint">
          Solving activity
        </h2>
        <ActivityHeatmap
          counts={counts}
          ramp="info"
          unit="problem"
          weeks={30}
          cellSize={18}
          selectedDay={selectedDay}
          onSelectDay={(d) => setSelectedDay((cur) => (cur === d ? null : d))}
        />

        {selectedDay && (
          <div className="mx-auto mt-5 max-w-xl border-t border-line pt-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-label font-semibold text-ink">
                  {LONG.format(fromDayString(selectedDay))}
                </p>
                <p className="font-mono text-meta text-faint">
                  {dayProblems.length === 0
                    ? "Nothing solved"
                    : `${dayProblems.length} ${dayProblems.length === 1 ? "problem" : "problems"} solved`}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openNew(selectedDay)}
                  className="rounded-lg border border-line px-2.5 py-1 text-label text-muted
                             transition-colors hover:bg-subtle hover:text-ink cursor-pointer"
                >
                  Log on this day
                </button>
                <button
                  onClick={() => setSelectedDay(null)}
                  title="Clear selection"
                  className="grid h-7 w-7 place-items-center rounded-lg text-ghost hover:bg-subtle hover:text-ink cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <ul className="space-y-1">
              {dayProblems.map((p) => (
                <ProblemRowItem
                  key={p._id}
                  problem={p}
                  onOpen={() => { setEditing(p); setDialogOpen(true); }}
                />
              ))}
            </ul>
          </div>
        )}
      </section>

      {due.length > 0 && (
        <section className="rounded-xl border border-info/35 bg-info-tint/40 p-4">
          <h2 className="mb-2.5 flex items-center gap-1.5 font-mono text-meta font-semibold uppercase text-info">
            <Brain className="h-3.5 w-3.5" /> Due for review
            <span className="text-ghost">{due.length}</span>
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {due.map((p) => (
              <button
                key={p._id}
                onClick={() => { setEditing(p); setDialogOpen(true); }}
                className="flex items-center gap-1.5 rounded-lg border border-line bg-surface-2
                           px-2.5 py-1 text-label text-ink transition-colors hover:border-info cursor-pointer"
              >
                {p.title}
                <span className="font-mono text-meta text-ghost">{p.masteryLevel ?? 0}%</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ghost" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your log…"
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
          value={pattern}
          onValueChange={setPattern}
          size="sm"
          options={[
            { value: "all", label: "All patterns" },
            ...knownPatterns.map((p) => ({ value: p, label: p })),
          ]}
        />
      </div>

      {problems.length === 0 ? (
        <div className="space-y-3 rounded-xl border border-dashed border-line-2 py-16 text-center">
          <p className="text-label text-ghost">Nothing logged yet.</p>
          <button
            onClick={() => openNew()}
            className="rounded-lg bg-accent px-4 py-2 text-label font-semibold text-accent-fg
                       hover:bg-accent-hover cursor-pointer"
          >
            Log your first solve
          </button>
        </div>
      ) : grouped.length === 0 ? (
        <p className="py-12 text-center text-label text-ghost">Nothing matches those filters.</p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([name, list]) => (
            <section key={name} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h3 className="text-heading text-ink">{name}</h3>
                <span className="font-mono text-meta text-ghost">{list.length}</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <ul className="space-y-1">
                {list.map((p) => (
                  <ProblemRowItem
                    key={p._id}
                    problem={p}
                    showDate
                    onOpen={() => { setEditing(p); setDialogOpen(true); }}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <LogDialog
        open={dialogOpen}
        editing={editing}
        defaultDate={editing ? undefined : selectedDay ?? undefined}
        knownPatterns={knownPatterns}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
      />
    </div>
  );
}

function ProblemRowItem({
  problem, onOpen, showDate,
}: {
  problem: ProblemRow;
  onOpen: () => void;
  showDate?: boolean;
}) {
  const mastery = problem.masteryLevel ?? 0;
  const isDue = problem.nextReviewDate && problem.nextReviewDate <= today();

  return (
    <li className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2
                   transition-colors hover:border-line-2">
      <span className={`h-2 w-2 shrink-0 rounded-full ${masteryDot(mastery)}`} />

      <button onClick={onOpen} className="min-w-0 flex-1 text-left cursor-pointer">
        <span className="block truncate text-label text-ink">{problem.title}</span>
        {showDate && problem.lastSolvedDate && (
          <span className="font-mono text-meta text-ghost">{problem.lastSolvedDate}</span>
        )}
      </button>

      {isDue && (
        <span className="shrink-0 rounded bg-info-tint px-1.5 py-0.5 font-mono text-meta text-info">
          due
        </span>
      )}
      {(problem.reviewCount ?? 0) > 1 && (
        <span className="shrink-0 font-mono text-meta text-ghost">×{problem.reviewCount}</span>
      )}
      <span className="shrink-0 font-mono text-meta text-ghost">{mastery}%</span>
      <span className={`w-14 shrink-0 text-right font-mono text-meta ${DIFF_STYLE[problem.difficulty] ?? "text-faint"}`}>
        {problem.difficulty}
      </span>

      {problem.url && (
        <a
          href={problem.url}
          target="_blank"
          rel="noreferrer"
          title="Open problem"
          className="shrink-0 text-ghost transition-colors hover:text-accent"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </li>
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
