"use client";

import React, { useMemo, useRef, useState } from "react";
import { Check, Plus, X } from "lucide-react";

/**
 * Pick several values from what you have used before, or add a new one.
 *
 * Suggestions are always derived from existing data rather than a built-in
 * list, so the vocabulary is whatever you have actually used — a stack or a
 * label you invent next year behaves exactly like one from today.
 */
export function TagInput({
  values, onChange, options, placeholder = "Add…", className = "",
}: {
  values: string[];
  onChange: (next: string[]) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = draft.trim().toLowerCase();
  const available = useMemo(
    () => options.filter((o) => !values.includes(o) && o.toLowerCase().includes(query)),
    [options, values, query]
  );
  const isNew =
    draft.trim().length > 0 &&
    !options.some((o) => o.toLowerCase() === query) &&
    !values.some((v) => v.toLowerCase() === query);

  const add = (v: string) => {
    const clean = v.trim();
    if (clean && !values.includes(clean)) onChange([...values, clean]);
    setDraft("");
  };

  // A click in the list would otherwise be lost to the input's blur.
  const hold = () => { if (blurTimer.current) clearTimeout(blurTimer.current); };
  const release = () => { blurTimer.current = setTimeout(() => setOpen(false), 120); };

  return (
    <div className={`relative ${className}`}>
      <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-line bg-surface p-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="flex items-center gap-1 rounded bg-subtle-2 px-1.5 py-0.5 font-mono text-meta text-muted"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="text-ghost transition-colors hover:text-danger cursor-pointer"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}

        <input
          value={draft}
          onChange={(e) => { setDraft(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => { release(); if (draft.trim()) add(draft); }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && values.length) {
              onChange(values.slice(0, -1));
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={values.length ? "" : placeholder}
          className="min-w-24 flex-1 bg-transparent px-1 font-mono text-meta text-ink outline-none placeholder:text-ghost"
        />
      </div>

      {open && (available.length > 0 || isNew) && (
        <div
          onMouseDown={hold}
          onMouseUp={release}
          className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-line bg-surface-2 p-1 shadow-lg"
        >
          {isNew && (
            <button
              type="button"
              onClick={() => add(draft)}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-label text-accent transition-colors hover:bg-subtle cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add “{draft.trim()}”
            </button>
          )}
          {available.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => add(o)}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-label text-ink-2 transition-colors hover:bg-subtle cursor-pointer"
            >
              <Check className="h-3.5 w-3.5 opacity-0" />
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
