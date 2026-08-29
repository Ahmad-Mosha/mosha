"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { BookMarked, Plus, Calendar } from "lucide-react";

export function EngineeringJournalView() {
  const entries = useQuery(api.journal.list) || [];
  const createEntry = useMutation(api.journal.create);

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("architectural_decision");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("Architecture, Systems");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    await createEntry({
      title: title.trim(),
      category,
      content: content.trim(),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    setIsAdding(false);
    setTitle("");
    setContent("");
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "mistake_postmortem":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            Post-Mortem
          </span>
        );
      case "architectural_decision":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            Architecture RFC
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            Reflection
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bento-card rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs">
            <BookMarked className="w-4 h-4 text-purple-700" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#718096] font-semibold">
              The Engineering Ledger
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1A202C] mt-1">
            Engineering Journal & Lessons
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5568] max-w-xl leading-relaxed mt-1">
            Real architectural decisions, bug post-mortems, mental models, and lifelong craftsmanship logs.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#333E50] hover:bg-[#252E3B] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Write Entry</span>
        </button>
      </div>

      {/* Add Entry Form */}
      {isAdding && (
        <form
          onSubmit={handleSave}
          className="bento-card rounded-xl p-5 space-y-3 border-2 border-[#333E50]/20 animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-[#ECEAE4] pb-2">
            <h3 className="font-serif text-base font-bold text-[#1A202C]">
              New Journal Entry
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-[#718096] cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-mono text-[11px] uppercase text-[#718096]">Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Invariant analysis on Distributed Locks"
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase text-[#718096]">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white cursor-pointer"
              >
                <option value="architectural_decision">Architectural Decision</option>
                <option value="mistake_postmortem">Mistake Post-Mortem</option>
                <option value="reflection">Daily Reflection</option>
              </select>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <label className="font-mono text-[11px] uppercase text-[#718096]">Content *</label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What did you learn? What was the mistake or decision?"
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0]"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#333E50] text-white font-semibold text-xs shadow-2xs hover:bg-[#252E3B] cursor-pointer"
            >
              Publish Entry
            </button>
          </div>
        </form>
      )}

      {/* Entries List */}
      <div className="space-y-4">
        {entries.length === 0 ? (
          <div className="bento-card rounded-xl p-10 text-center text-xs text-[#A0AEC0]">
            No journal entries written yet. Click &ldquo;Write Entry&rdquo; above.
          </div>
        ) : (
          entries.map((entry: any) => (
            <article
              key={entry._id}
              className="bento-card rounded-xl p-6 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#ECEAE4] pb-3">
                <div className="flex items-center space-x-3">
                  {getCategoryBadge(entry.category)}
                  <h2 className="font-serif text-lg font-bold text-[#1A202C]">
                    {entry.title}
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-[#718096] flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {entry.date}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#4A5568] leading-relaxed whitespace-pre-wrap">
                {entry.content}
              </p>

              <div className="flex items-center gap-2 pt-2 text-[10px] font-mono text-[#718096]">
                {entry.tags?.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-[#F8F9FA] border border-[#E2E8F0]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
