"use client";

import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink } from "lucide-react";
import { fromDayString, today } from "../../../convex/recurrence";
import type { ProblemRow } from "./log-dialog";

/**
 * One flat, sortable table.
 *
 * Grouping by pattern fragmented the view — at a hundred problems you scroll
 * past fifteen headers instead of scanning. A single sorted list scales, and
 * pattern stays a column you can sort or filter on.
 */

type SortKey = "title" | "pattern" | "difficulty" | "mastery" | "solved" | "review";
type Direction = "asc" | "desc";

const DIFF_RANK: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };

const DIFF_STYLE: Record<string, string> = {
  Easy: "text-success",
  Medium: "text-warn",
  Hard: "text-danger",
};

function masteryColour(m: number) {
  if (m >= 100) return "bg-success";
  if (m >= 80) return "bg-info";
  if (m >= 50) return "bg-warn";
  return "bg-danger";
}

const SHORT = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });
const fmt = (d?: string) => (d ? SHORT.format(fromDayString(d)) : "—");

/** Relative wording beats a date for the review column — it is a countdown. */
function reviewLabel(next?: string): { text: string; tone: string } {
  if (!next) return { text: "—", tone: "text-ghost" };
  const now = today();
  if (next <= now) return { text: "due", tone: "text-info font-semibold" };
  const days = Math.round(
    (fromDayString(next).getTime() - fromDayString(now).getTime()) / 86_400_000
  );
  if (days <= 3) return { text: `${days}d`, tone: "text-warn" };
  return { text: `${days}d`, tone: "text-ghost" };
}

interface Props {
  problems: ProblemRow[];
  onOpen: (p: ProblemRow) => void;
}

export function ProblemTable({ problems, onOpen }: Props) {
  const [sort, setSort] = useState<SortKey>("solved");
  const [dir, setDir] = useState<Direction>("desc");

  const toggle = (key: SortKey) => {
    if (key === sort) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      // Text reads best A–Z; scores and dates read best highest/newest first.
      setDir(key === "title" || key === "pattern" ? "asc" : "desc");
    }
  };

  const rows = useMemo(() => {
    const value = (p: ProblemRow) => {
      switch (sort) {
        case "title": return p.title.toLowerCase();
        case "pattern": return (p.pattern || "").toLowerCase();
        case "difficulty": return DIFF_RANK[p.difficulty] ?? 1;
        case "mastery": return p.masteryLevel ?? 0;
        case "solved": return p.lastSolvedDate ?? "";
        case "review": return p.nextReviewDate ?? "9999";
      }
    };
    return [...problems].sort((a, b) => {
      const x = value(a);
      const y = value(b);
      const cmp = x < y ? -1 : x > y ? 1 : 0;
      return dir === "asc" ? cmp : -cmp;
    });
  }, [problems, sort, dir]);

  const Header = ({
    label, sortKey, className = "",
  }: {
    label: string; sortKey: SortKey; className?: string;
  }) => (
    <th className={`px-3 py-2 font-mono text-meta font-semibold uppercase ${className}`}>
      <button
        onClick={() => toggle(sortKey)}
        className={`inline-flex items-center gap-1 transition-colors cursor-pointer
          ${sort === sortKey ? "text-ink" : "text-faint hover:text-ink"}`}
      >
        {label}
        {sort === sortKey &&
          (dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className="max-h-[60vh] overflow-auto">
        <table className="w-full border-collapse text-left">
          {/* Sticky so the columns stay meaningful a hundred rows down. */}
          <thead className="sticky top-0 z-10 bg-subtle">
            <tr className="border-b border-line">
              <Header label="Problem" sortKey="title" />
              <Header label="Pattern" sortKey="pattern" className="hidden md:table-cell" />
              <Header label="Level" sortKey="difficulty" className="hidden sm:table-cell" />
              <Header label="Mastery" sortKey="mastery" />
              <Header label="Solved" sortKey="solved" className="hidden sm:table-cell" />
              <Header label="Review" sortKey="review" />
              <th className="w-8 px-2" />
            </tr>
          </thead>

          <tbody>
            {rows.map((p) => {
              const mastery = p.masteryLevel ?? 0;
              const review = reviewLabel(p.nextReviewDate);

              return (
                <tr
                  key={p._id}
                  onClick={() => onOpen(p)}
                  className="cursor-pointer border-b border-line/60 transition-colors last:border-0 hover:bg-subtle/60"
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${masteryColour(mastery)}`} />
                      <span className="truncate text-label text-ink">{p.title}</span>
                      {(p.reviewCount ?? 0) > 1 && (
                        <span className="shrink-0 font-mono text-meta text-ghost">
                          ×{p.reviewCount}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="hidden px-3 py-2 md:table-cell">
                    <span className="truncate font-mono text-meta text-muted">{p.pattern}</span>
                  </td>

                  <td className="hidden px-3 py-2 sm:table-cell">
                    <span className={`font-mono text-meta ${DIFF_STYLE[p.difficulty] ?? "text-faint"}`}>
                      {p.difficulty}
                    </span>
                  </td>

                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1 w-10 overflow-hidden rounded-full bg-subtle-2">
                        <span
                          className={`block h-full rounded-full ${masteryColour(mastery)}`}
                          style={{ width: `${mastery}%` }}
                        />
                      </span>
                      <span className="font-mono text-meta text-faint">{mastery}%</span>
                    </div>
                  </td>

                  <td className="hidden px-3 py-2 font-mono text-meta text-ghost sm:table-cell">
                    {fmt(p.lastSolvedDate)}
                  </td>

                  <td className={`px-3 py-2 font-mono text-meta ${review.tone}`}>
                    {review.text}
                  </td>

                  <td className="px-2 py-2">
                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Open problem"
                        className="text-ghost transition-colors hover:text-accent"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
