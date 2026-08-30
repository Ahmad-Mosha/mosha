"use client";

import React, { useState } from "react";
import { Plus, Tag } from "lucide-react";
import { Select } from "@/components/ui/select";
import { TagInput } from "@/components/ui/tag-input";

const PRIORITIES = [
  { value: "p1_urgent", label: "High" },
  { value: "p2_medium", label: "Medium" },
  { value: "p3_low", label: "Low" },
];

/**
 * Adding work is more than a title. Priority sits inline, and labels open on
 * demand so the common case stays one field and one Enter — but the task
 * arrives already classified instead of needing a second pass to sort it.
 */
export function TaskComposer({
  placeholder, knownLabels, onAdd,
}: {
  placeholder: string;
  knownLabels: string[];
  onAdd: (input: { title: string; priority: string; labels: string[] }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("p2_medium");
  const [labels, setLabels] = useState<string[]>([]);
  const [showLabels, setShowLabels] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await onAdd({ title: title.trim(), priority, labels });
      setTitle("");
      setLabels([]);
      setShowLabels(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2 rounded-xl border border-line bg-surface p-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="relative min-w-48 flex-1">
          <Plus className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ghost" />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-line bg-surface-2 py-2 pl-8 pr-2 text-label
                       text-ink outline-none transition-colors placeholder:text-ghost focus:border-accent"
          />
        </div>

        <Select
          value={priority}
          onValueChange={setPriority}
          size="sm"
          options={PRIORITIES}
        />

        <button
          type="button"
          onClick={() => setShowLabels((v) => !v)}
          title="Add labels"
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-meta font-mono
                      transition-colors cursor-pointer ${
                        showLabels || labels.length
                          ? "border-accent bg-accent-soft text-ink"
                          : "border-line text-muted hover:bg-subtle hover:text-ink"
                      }`}
        >
          <Tag className="h-3 w-3" />
          {labels.length ? labels.length : "Labels"}
        </button>

        <button
          type="submit"
          disabled={!title.trim() || saving}
          className="rounded-lg bg-accent px-4 py-2 text-label font-semibold text-accent-fg
                     transition-colors hover:bg-accent-hover disabled:opacity-40 cursor-pointer"
        >
          Add
        </button>
      </div>

      {showLabels && (
        <TagInput
          values={labels}
          onChange={setLabels}
          options={knownLabels}
          placeholder="frontend, backend, review…"
        />
      )}
    </form>
  );
}

/** Shared chip rendering so labels look the same everywhere they appear. */
export function LabelChips({ labels }: { labels?: string[] }) {
  if (!labels?.length) return null;
  return (
    <span className="flex flex-wrap items-center gap-1">
      {labels.map((l) => (
        <span key={l} className="rounded bg-subtle-2 px-1.5 py-0.5 font-mono text-meta text-muted">
          {l}
        </span>
      ))}
    </span>
  );
}
