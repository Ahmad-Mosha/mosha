"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Select } from "@/components/ui/select";
import {
  Code2,
  Plus,
  ExternalLink,
  Search,
} from "lucide-react";

export function ProblemSolvingView() {
  const problems = useQuery(api.problems.list) || [];
  const createProblem = useMutation(api.problems.create);
  const updateMastery = useMutation(api.problems.updateMastery);

  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [selectedProblem, setSelectedProblem] = useState<any | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [pattern, setPattern] = useState("Two Pointers");
  const [difficulty, setDifficulty] = useState("medium");
  const [timeMins, setTimeMins] = useState(15);
  const [masteryLevel, setMasteryLevel] = useState(100);
  const [mistakes, setMistakes] = useState("");
  const [notes, setNotes] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");

  const filteredProblems = problems.filter((p: any) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.pattern.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiff =
      difficultyFilter === "all" || p.difficulty === difficultyFilter;
    return matchesSearch && matchesDiff;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createProblem({
      title: title.trim(),
      url: url.trim() || undefined,
      platform: "leetcode",
      pattern,
      difficulty,
      solveTimeSeconds: timeMins * 60,
      masteryLevel,
      mistakes: mistakes.trim() || undefined,
      notes: notes.trim() || undefined,
      code: code.trim() || undefined,
      language,
    });
    setIsAdding(false);
    setTitle("");
    setUrl("");
    setMistakes("");
    setNotes("");
    setCode("");
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case "easy":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Easy
          </span>
        );
      case "hard":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            Hard
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Medium
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Mission */}
      <div className="bento-card rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs">
            <Code2 className="w-4 h-4 text-blue-700" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-faint font-semibold">
              Algorithmic Mastery Hub
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink mt-1">
            Problem Solving & Patterns
          </h1>
          <p className="text-xs sm:text-sm text-muted max-w-xl leading-relaxed mt-1">
            Track, review, and achieve <strong>100% Mastery</strong> (the ability to solve alone on a blank whiteboard every time).
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Solved Problem</span>
        </button>
      </div>

      {/* Add Problem Drawer / Form */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="bento-card rounded-xl p-5 space-y-4 bg-surface-2 border-2 border-accent/20 animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-line pb-2">
            <h3 className="font-serif text-base font-bold text-ink">
              Log New Solved Problem
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-faint hover:text-ink cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-mono text-[11px] uppercase text-faint font-semibold">
                Problem Name *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Trapping Rain Water"
                className="w-full px-3 py-2 rounded-lg border border-line focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase text-faint font-semibold">
                LeetCode / Platform URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://leetcode.com/problems/..."
                className="w-full px-3 py-2 rounded-lg border border-line focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase text-faint font-semibold">
                Pattern / Algorithm
              </label>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="Two Pointers, DP, BFS..."
                className="w-full px-3 py-2 rounded-lg border border-line focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase text-faint font-semibold">
                Difficulty
              </label>
              <Select
                value={difficulty}
                onValueChange={setDifficulty}
                className="w-full"
                options={[
                  { value: "easy", label: "Easy" },
                  { value: "medium", label: "Medium" },
                  { value: "hard", label: "Hard" }
                ]}
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase text-faint font-semibold">
                Time Spent (mins)
              </label>
              <input
                type="number"
                value={timeMins}
                onChange={(e) => setTimeMins(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-line"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase text-faint font-semibold">
                Mastery Level (%)
              </label>
              <Select
                value={String(masteryLevel)}
                onValueChange={(v) => setMasteryLevel(Number(v))}
                className="w-full font-semibold"
                options={[
                  { value: "100", label: "100% (Can solve alone effortlessly)" },
                  { value: "85", label: "85% (Clean solution, minor doubt)" },
                  { value: "50", label: "50% (Needed small hint / edge cases)" },
                  { value: "20", label: "20% (Needed full editorial)" }
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase text-faint font-semibold">
                Mistakes / Traps to Remember
              </label>
              <textarea
                rows={2}
                value={mistakes}
                onChange={(e) => setMistakes(e.target.value)}
                placeholder="What edge cases or traps did you face?"
                className="w-full px-3 py-2 rounded-lg border border-line"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase text-faint font-semibold">
                Key Invariant / Solution Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Core intuition and algorithmic invariant..."
                className="w-full px-3 py-2 rounded-lg border border-line"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-accent text-accent-fg font-semibold text-xs shadow-2xs hover:bg-accent-hover transition-colors cursor-pointer"
            >
              Save Problem Record
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ghost" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search problem name, pattern..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-line text-xs text-ink focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-faint font-mono text-[11px]">Difficulty:</span>
          {["all", "easy", "medium", "hard"].map((d) => (
            <button
              key={d}
              onClick={() => setDifficultyFilter(d)}
              className={`px-2.5 py-1 rounded-md capitalize font-mono text-[11px] transition-colors cursor-pointer ${
                difficultyFilter === d
                  ? "bg-accent text-accent-fg font-semibold"
                  : "bg-surface-2 border border-line text-faint hover:text-ink"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Problem Solving Data Table */}
      <div className="bento-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-subtle border-b border-line text-faint font-mono text-[11px] uppercase">
              <tr>
                <th className="py-3 px-5">Problem Name</th>
                <th className="py-3 px-5">Pattern / Algorithm</th>
                <th className="py-3 px-5">Difficulty</th>
                <th className="py-3 px-5">Solve Time</th>
                <th className="py-3 px-5">Mastery Level</th>
                <th className="py-3 px-5">Next Spaced Review</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ink">
              {filteredProblems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-ghost">
                    No problem records logged yet. Click &ldquo;Log Solved Problem&rdquo; above!
                  </td>
                </tr>
              ) : (
                filteredProblems.map((problem: any) => (
                  <tr
                    key={problem._id}
                    className="hover:bg-subtle transition-colors group"
                  >
                    <td className="py-3.5 px-5 font-semibold">
                      <div className="flex items-center gap-2">
                        <span>{problem.title}</span>
                        {problem.url && (
                          <a
                            href={problem.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-ghost hover:text-blue-700"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-[11px] text-muted">
                      {problem.pattern}
                    </td>
                    <td className="py-3.5 px-5">
                      {getDifficultyBadge(problem.difficulty)}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-faint">
                      {Math.round((problem.solveTimeSeconds || 600) / 60)} mins
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-xs font-bold ${
                            problem.masteryLevel >= 100
                              ? "text-emerald-700"
                              : problem.masteryLevel >= 80
                              ? "text-blue-700"
                              : "text-amber-700"
                          }`}
                        >
                          {problem.masteryLevel}%
                        </span>
                        <span className="text-[10px] text-ghost font-mono">
                          {problem.masteryLevel >= 100 ? "(100% Mastered)" : "(In Review)"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-faint text-[11px]">
                      {problem.nextReviewDate || "Queued"}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono">
                      <button
                        onClick={() => setSelectedProblem(problem)}
                        className="text-xs text-accent hover:underline font-semibold cursor-pointer"
                      >
                        View Notes
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Problem Notes Drawer / Modal */}
      {selectedProblem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-surface-2 border border-line rounded-xl p-6 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-serif text-lg font-bold text-ink">
                {selectedProblem.title}
              </h3>
              <button
                onClick={() => setSelectedProblem(null)}
                className="text-xs text-faint hover:text-ink cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {selectedProblem.mistakes && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900">
                  <span className="font-bold block text-[11px] font-mono uppercase">
                    Mistakes / Traps:
                  </span>
                  <p className="mt-1">{selectedProblem.mistakes}</p>
                </div>
              )}

              {selectedProblem.notes && (
                <div className="p-3 bg-subtle border border-line rounded-lg">
                  <span className="font-bold block text-[11px] font-mono uppercase text-faint">
                    Core Invariant & Insights:
                  </span>
                  <p className="mt-1 text-ink">{selectedProblem.notes}</p>
                </div>
              )}

              {selectedProblem.code && (
                <div className="space-y-1">
                  <span className="font-bold block text-[11px] font-mono uppercase text-faint">
                    Solution Code ({selectedProblem.language}):
                  </span>
                  <pre className="p-3 bg-ink text-emerald-300 font-mono text-[11px] rounded-lg overflow-x-auto">
                    {selectedProblem.code}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-line">
              <span className="text-xs text-faint">
                Current Mastery: <strong>{selectedProblem.masteryLevel}%</strong>
              </span>
              <button
                onClick={() => {
                  updateMastery({
                    id: selectedProblem._id,
                    masteryLevel: 100,
                  });
                  setSelectedProblem(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 cursor-pointer"
              >
                Promote to 100% Mastery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
