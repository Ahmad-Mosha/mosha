"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { BookMarked, Plus, Calendar } from "lucide-react";
import { Select } from "@/components/ui/select";

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
            <span className="font-mono text-[11px] uppercase tracking-wider text-faint font-semibold">
              The Engineering Ledger
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink mt-1">
            Engineering Journal & Lessons
          </h1>
          <p className="text-xs sm:text-sm text-muted max-w-xl leading-relaxed mt-1">
            Real architectural decisions, bug post-mortems, mental models, and lifelong craftsmanship logs.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Write Entry</span>
        </button>
      </div>

      {/* Add Entry Form */}
      {isAdding && (
        <form
          onSubmit={handleSave}
          className="bento-card rounded-xl p-5 space-y-3 border-2 border-accent/20 animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-line pb-2">
            <h3 className="font-serif text-base font-bold text-ink">
              New Journal Entry
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-faint cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-mono text-[11px] uppercase text-faint">Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Invariant analysis on Distributed Locks"
                className="w-full px-3 py-2 rounded-lg border border-line"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase text-faint">Category</label>
              <Select
                value={category}
                onValueChange={setCategory}
                className="w-full"
                options={[
                  { value: "architectural_decision", label: "Architectural Decision" },
                  { value: "mistake_postmortem", label: "Mistake Post-Mortem" },
                  { value: "reflection", label: "Daily Reflection" }
                ]}
              />
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <label className="font-mono text-[11px] uppercase text-faint">Content *</label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What did you learn? What was the mistake or decision?"
              className="w-full px-3 py-2 rounded-lg border border-line"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-accent text-accent-fg font-semibold text-xs shadow-2xs hover:bg-accent-hover cursor-pointer"
            >
              Publish Entry
            </button>
          </div>
        </form>
      )}

      {/* Entries List */}
      <div className="space-y-4">
        {entries.length === 0 ? (
          <div className="bento-card rounded-xl p-10 text-center text-xs text-ghost">
            No journal entries written yet. Click &ldquo;Write Entry&rdquo; above.
          </div>
        ) : (
          entries.map((entry: any) => (
            <article
              key={entry._id}
              className="bento-card rounded-xl p-6 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
                <div className="flex items-center space-x-3">
                  {getCategoryBadge(entry.category)}
                  <h2 className="font-serif text-lg font-bold text-ink">
                    {entry.title}
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-faint flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {entry.date}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-muted leading-relaxed whitespace-pre-wrap">
                {entry.content}
              </p>

              <div className="flex items-center gap-2 pt-2 text-[10px] font-mono text-faint">
                {entry.tags?.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-subtle border border-line"
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
