"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
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
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#718096] font-semibold">
              Algorithmic Mastery Hub
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1A202C] mt-1">
            Problem Solving & Patterns
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5568] max-w-xl leading-relaxed mt-1">
            Track, review, and achieve <strong>100% Mastery</strong> (the ability to solve alone on a blank whiteboard every time).
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#333E50] hover:bg-[#252E3B] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Solved Problem</span>
        </button>
      </div>

      {/* Add Problem Drawer / Form */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="bento-card rounded-xl p-5 space-y-4 bg-white border-2 border-[#333E50]/20 animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-[#ECEAE4] pb-2">
            <h3 className="font-serif text-base font-bold text-[#1A202C]">
              Log New Solved Problem
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-[#718096] hover:text-[#1A202C] cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-mono text-[11px] uppercase text-[#718096] font-semibold">
                Problem Name *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Trapping Rain Water"
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#333E50]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase text-[#718096] font-semibold">
                LeetCode / Platform URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://leetcode.com/problems/..."
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#333E50]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase text-[#718096] font-semibold">
                Pattern / Algorithm
              </label>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="Two Pointers, DP, BFS..."
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase text-[#718096] font-semibold">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white cursor-pointer"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase text-[#718096] font-semibold">
                Time Spent (mins)
              </label>
              <input
                type="number"
                value={timeMins}
                onChange={(e) => setTimeMins(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase text-[#718096] font-semibold">
                Mastery Level (%)
              </label>
              <select
                value={masteryLevel}
                onChange={(e) => setMasteryLevel(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white font-semibold text-emerald-800 cursor-pointer"
              >
                <option value={100}>100% (Can solve alone effortlessly)</option>
                <option value={85}>85% (Clean solution, minor doubt)</option>
                <option value={50}>50% (Needed small hint / edge cases)</option>
                <option value={20}>20% (Needed full editorial)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase text-[#718096] font-semibold">
                Mistakes / Traps to Remember
              </label>
              <textarea
                rows={2}
                value={mistakes}
                onChange={(e) => setMistakes(e.target.value)}
                placeholder="What edge cases or traps did you face?"
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase text-[#718096] font-semibold">
                Key Invariant / Solution Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Core intuition and algorithmic invariant..."
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#333E50] text-white font-semibold text-xs shadow-2xs hover:bg-[#252E3B] transition-colors cursor-pointer"
            >
              Save Problem Record
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A0AEC0]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search problem name, pattern..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs text-[#1A202C] focus:outline-none focus:border-[#333E50]"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-[#718096] font-mono text-[11px]">Difficulty:</span>
          {["all", "easy", "medium", "hard"].map((d) => (
            <button
              key={d}
              onClick={() => setDifficultyFilter(d)}
              className={`px-2.5 py-1 rounded-md capitalize font-mono text-[11px] transition-colors cursor-pointer ${
                difficultyFilter === d
                  ? "bg-[#333E50] text-white font-semibold"
                  : "bg-white border border-[#E2E8F0] text-[#718096] hover:text-[#1A202C]"
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
            <thead className="bg-[#F8F9FA] border-b border-[#E2E8F0] text-[#718096] font-mono text-[11px] uppercase">
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
            <tbody className="divide-y divide-[#ECEAE4] text-[#1A202C]">
              {filteredProblems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#A0AEC0]">
                    No problem records logged yet. Click &ldquo;Log Solved Problem&rdquo; above!
                  </td>
                </tr>
              ) : (
                filteredProblems.map((problem: any) => (
                  <tr
                    key={problem._id}
                    className="hover:bg-[#F8F9FA] transition-colors group"
                  >
                    <td className="py-3.5 px-5 font-semibold">
                      <div className="flex items-center gap-2">
                        <span>{problem.title}</span>
                        {problem.url && (
                          <a
                            href={problem.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#A0AEC0] hover:text-blue-700"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-[11px] text-[#4A5568]">
                      {problem.pattern}
                    </td>
                    <td className="py-3.5 px-5">
                      {getDifficultyBadge(problem.difficulty)}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-[#718096]">
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
                        <span className="text-[10px] text-[#A0AEC0] font-mono">
                          {problem.masteryLevel >= 100 ? "(100% Mastered)" : "(In Review)"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-[#718096] text-[11px]">
                      {problem.nextReviewDate || "Queued"}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono">
                      <button
                        onClick={() => setSelectedProblem(problem)}
                        className="text-xs text-[#333E50] hover:underline font-semibold cursor-pointer"
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
          <div className="w-full max-w-xl bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#ECEAE4] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#1A202C]">
                {selectedProblem.title}
              </h3>
              <button
                onClick={() => setSelectedProblem(null)}
                className="text-xs text-[#718096] hover:text-[#1A202C] cursor-pointer"
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
                <div className="p-3 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg">
                  <span className="font-bold block text-[11px] font-mono uppercase text-[#718096]">
                    Core Invariant & Insights:
                  </span>
                  <p className="mt-1 text-[#1A202C]">{selectedProblem.notes}</p>
                </div>
              )}

              {selectedProblem.code && (
                <div className="space-y-1">
                  <span className="font-bold block text-[11px] font-mono uppercase text-[#718096]">
                    Solution Code ({selectedProblem.language}):
                  </span>
                  <pre className="p-3 bg-[#1A202C] text-emerald-300 font-mono text-[11px] rounded-lg overflow-x-auto">
                    {selectedProblem.code}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#ECEAE4]">
              <span className="text-xs text-[#718096]">
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
