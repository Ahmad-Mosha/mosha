"use client";

import React, { useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";

/**
 * Pick an existing pattern or add a new one.
 *
 * Patterns are never a fixed list — they come from whatever has been logged,
 * and anything typed becomes one. A plain datalist made adding possible but
 * not obvious, so a new value is offered explicitly as "Add «…»".
 */
export function PatternInput({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = value.trim().toLowerCase();
  const matches = useMemo(
    () => options.filter((o) => o.toLowerCase().includes(query)),
    [options, query]
  );
  const isNew = value.trim().length > 0 && !options.some((o) => o.toLowerCase() === query);

  // A click inside the list would otherwise be lost to the input's blur.
  const hold = () => { if (blurTimer.current) clearTimeout(blurTimer.current); };
  const release = () => { blurTimer.current = setTimeout(() => setOpen(false), 120); };

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={release}
          onKeyDown={(e) => {
            if (e.key === "Enter" && open) { e.preventDefault(); setOpen(false); }
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Two Pointers…"
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 pr-7 text-label
                     text-ink outline-none transition-colors placeholder:text-ghost focus:border-accent"
        />
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ghost" />
      </div>

      {open && (matches.length > 0 || isNew) && (
        <div
          onMouseDown={hold}
          onMouseUp={release}
          className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border
                     border-line bg-surface-2 p-1 shadow-lg"
        >
          {isNew && (
            <button
              type="button"
              onClick={() => pick(value.trim())}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left
                         text-label text-accent transition-colors hover:bg-subtle cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add “{value.trim()}”
            </button>
          )}

          {matches.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => pick(o)}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left
                         text-label text-ink-2 transition-colors hover:bg-subtle cursor-pointer"
            >
              <Check className={`h-3.5 w-3.5 ${o === value ? "text-accent" : "opacity-0"}`} />
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
