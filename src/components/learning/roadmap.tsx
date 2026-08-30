"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import {
  ArrowUpRight, Check, ChevronDown, ChevronUp, CircleDot, NotebookPen, Plus, Trash2,
} from "lucide-react";
import { Select } from "@/components/ui/select";
import { useMoshaStore } from "@/lib/store";
import { ResourceList } from "./resource-list";
import { TOPIC_STATUS, TOPIC_STATUS_OPTIONS } from "./learning-meta";

/**
 * The roadmap: an ordered path through a subject.
 *
 * Order is the point — it is the sequence you intend to learn things in — so
 * topics move up and down explicitly rather than being sorted by anything
 * derived. Opening one reveals its notes and the resources pinned to it.
 */
export function Roadmap({
  trackId, topics, resources, notesByTopic,
}: {
  trackId: string;
  topics: any[];
  resources: any[];
  /** topicId -> the note that holds its write-up. */
  notesByTopic: Record<string, { id: string; words: number }>;
}) {
  const createTopic = useMutation(api.learning.createTopic);
  const updateTopic = useMutation(api.learning.updateTopic);
  const removeTopic = useMutation(api.learning.removeTopic);
  const reorderTopics = useMutation(api.learning.reorderTopics);
  const getOrCreateNote = useMutation(api.notes.getOrCreateForTopic);
  const openNote = useMoshaStore((s) => s.openNote);

  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    try {
      await createTopic({ trackId: trackId as any, title: draft.trim() });
      setDraft("");
    } catch {
      toast.error("Could not add that topic");
    }
  };

  const move = async (index: number, delta: number) => {
    const next = [...topics];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    await reorderTopics({ orderedIds: next.map((t) => t._id) });
  };

  /**
   * Notes live in the knowledge base, not in this screen. Opening one creates
   * it on first use, then hands off to Notes — full width, full editor, and
   * searchable alongside everything else you have written.
   */
  const openTopicNote = async (topic: any) => {
    try {
      const id = await getOrCreateNote({ topicId: topic._id });
      if (id) openNote(id);
    } catch {
      toast.error("Could not open the note");
    }
  };

  /** Clicking the marker cycles the topic forward through the roadmap. */
  const cycle = (status: string) =>
    status === "todo" ? "learning" : status === "learning" ? "done" : "todo";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-meta font-semibold uppercase text-faint">
          Roadmap <span className="text-ghost">{topics.length}</span>
        </h2>
      </div>

      <form onSubmit={add} className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <Plus className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ghost" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a topic to the path…"
            className="w-full rounded-lg border border-line bg-surface py-2 pl-8 pr-2 text-label
                       text-ink outline-none transition-colors placeholder:text-ghost focus:border-accent"
          />
        </div>
        <button
          type="submit"
          disabled={!draft.trim()}
          className="rounded-lg bg-accent px-4 py-2 text-label font-semibold text-accent-fg
                     transition-colors hover:bg-accent-hover disabled:opacity-40 cursor-pointer"
        >
          Add
        </button>
      </form>

      {topics.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-2 py-10 text-center text-label text-ghost">
          No topics yet. Add the first thing you want to understand.
        </p>
      ) : (
        <ol className="space-y-1.5">
          {topics.map((t, i) => {
            const status = TOPIC_STATUS[t.status] ?? TOPIC_STATUS.todo;
            const isOpen = open === t._id;
            const own = resources.filter((r) => r.topicId === t._id);

            return (
              <li
                key={t._id}
                className={`overflow-hidden rounded-xl border transition-colors ${
                  isOpen ? "border-accent bg-surface" : "border-line bg-surface hover:border-line-2"
                }`}
              >
                <div className="group flex items-center gap-3 px-3 py-2.5">
                  {/* The path marker: position, and one click to advance. */}
                  <button
                    onClick={() => updateTopic({ id: t._id, status: cycle(t.status) })}
                    title={`${status.label} — click to advance`}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line
                               transition-colors hover:border-accent cursor-pointer"
                  >
                    {t.status === "done" ? (
                      <Check className="h-3.5 w-3.5 text-success" />
                    ) : t.status === "learning" ? (
                      <CircleDot className="h-3.5 w-3.5 text-warn" />
                    ) : (
                      <span className="font-mono text-meta text-ghost">{i + 1}</span>
                    )}
                  </button>

                  <button
                    onClick={() => setOpen(isOpen ? null : t._id)}
                    className="min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <span className={`block truncate text-label ${t.status === "done" ? "text-ghost" : "text-ink"}`}>
                      {t.title}
                    </span>
                    {(own.length > 0 || notesByTopic[t._id]) && (
                      <span className="flex items-center gap-2 font-mono text-meta text-ghost">
                        {own.length > 0 && <span>{own.length} resources</span>}
                        {notesByTopic[t._id] && (
                          <span className="flex items-center gap-1">
                            <NotebookPen className="h-2.5 w-2.5" />
                            {notesByTopic[t._id].words > 0
                              ? `${notesByTopic[t._id].words} words`
                              : "note"}
                          </span>
                        )}
                      </span>
                    )}
                  </button>

                  <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-meta ${status.chip}`}>
                    {status.label}
                  </span>

                  <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      title="Move up"
                      className="grid h-6 w-6 place-items-center rounded text-ghost hover:bg-subtle-2 hover:text-ink disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      disabled={i === topics.length - 1}
                      title="Move down"
                      className="grid h-6 w-6 place-items-center rounded text-ghost hover:bg-subtle-2 hover:text-ink disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <button
                      onClick={async () => {
                        await removeTopic({ id: t._id });
                        if (isOpen) setOpen(null);
                        toast.success("Topic removed");
                      }}
                      title="Remove topic"
                      className="grid h-6 w-6 place-items-center rounded text-ghost hover:bg-danger-tint hover:text-danger cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                </div>

                {isOpen && (
                  <div className="space-y-4 border-t border-line p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-meta uppercase text-faint">Status</span>
                      <Select
                        value={t.status}
                        onValueChange={(v) => updateTopic({ id: t._id, status: v })}
                        size="sm"
                        options={TOPIC_STATUS_OPTIONS}
                      />
                      {t.lastStudiedAt && (
                        <span className="font-mono text-meta text-ghost">
                          last studied {t.lastStudiedAt}
                        </span>
                      )}
                    </div>

                    <ResourceList
                      trackId={trackId}
                      resources={resources}
                      topics={topics}
                      filterTopicId={t._id}
                    />

                    <button
                      onClick={() => openTopicNote(t)}
                      className="group/note flex w-full items-center gap-3 rounded-xl border border-line
                                 bg-surface-2 px-3 py-2.5 text-left transition-colors
                                 hover:border-accent cursor-pointer"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-ink-2">
                        <NotebookPen className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-label text-ink">
                          {notesByTopic[t._id] ? "Open the note" : "Start a note"}
                        </span>
                        <span className="block font-mono text-meta text-ghost">
                          {notesByTopic[t._id]
                            ? `${notesByTopic[t._id].words} words · in your knowledge base`
                            : "Opens full width in Notes, filed under Learning"}
                        </span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-ghost transition-transform group-hover/note:translate-x-0.5 group-hover/note:-translate-y-0.5" />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
