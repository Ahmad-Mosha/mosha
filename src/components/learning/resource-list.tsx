"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { Select } from "@/components/ui/select";
import {
  RESOURCE_OPTIONS, RESOURCE_STATUS, RESOURCE_STATUS_OPTIONS, resourceMeta,
} from "./learning-meta";

/**
 * Resources for a track. A URL is optional on purpose — a book on your shelf
 * or a PDF an AI generated for you is a real source, and refusing to record it
 * because it has no link would just push it somewhere else.
 */
export function ResourceList({
  trackId, resources, topics, filterTopicId,
}: {
  trackId: string;
  resources: any[];
  topics: { _id: string; title: string }[];
  /** When set, only show and create resources pinned to this topic. */
  filterTopicId?: string;
}) {
  const createResource = useMutation(api.learning.createResource);
  const updateResource = useMutation(api.learning.updateResource);
  const removeResource = useMutation(api.learning.removeResource);

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("course");

  const shown = filterTopicId
    ? resources.filter((r) => r.topicId === filterTopicId)
    : resources;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createResource({
        trackId: trackId as any,
        topicId: (filterTopicId ?? undefined) as any,
        title: title.trim(),
        url: url.trim() || undefined,
        type,
      });
      setTitle(""); setUrl(""); setAdding(false);
      toast.success("Resource saved");
    } catch {
      toast.error("Could not save that resource");
    }
  };

  const field =
    "w-full rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-label text-ink outline-none transition-colors placeholder:text-ghost focus:border-accent";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-meta font-semibold uppercase text-faint">
          Resources <span className="text-ghost">{shown.length}</span>
        </h3>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-label
                     text-muted transition-colors hover:bg-subtle hover:text-ink cursor-pointer"
        >
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>

      {adding && (
        <form onSubmit={add} className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-2.5">
          <label className="min-w-40 flex-[2] space-y-1">
            <span className="block font-mono text-meta uppercase text-faint">Title</span>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="OSTEP, Chapter 13"
              className={field}
            />
          </label>
          <label className="min-w-40 flex-[2] space-y-1">
            <span className="block font-mono text-meta uppercase text-faint">Link (optional)</span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…  or leave blank for a file"
              className={field}
            />
          </label>
          <label className="space-y-1">
            <span className="block font-mono text-meta uppercase text-faint">Type</span>
            <Select value={type} onValueChange={setType} size="sm" options={RESOURCE_OPTIONS} />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-accent px-3 py-1.5 text-label font-semibold text-accent-fg hover:bg-accent-hover cursor-pointer"
          >
            Save
          </button>
        </form>
      )}

      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-2 py-6 text-center text-label text-ghost">
          Nothing saved here yet.
        </p>
      ) : (
        <ul className="space-y-1">
          {shown.map((r) => {
            const meta = resourceMeta(r.type);
            const Icon = meta.icon;
            const status = RESOURCE_STATUS[r.status] ?? RESOURCE_STATUS.queued;

            return (
              <li
                key={r._id}
                className="group flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2"
              >
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${meta.chip}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className={`truncate text-label ${r.status === "done" ? "text-ghost" : "text-ink"}`}>
                    {r.title}
                  </p>
                  {r.topicTitle && (
                    <p className="truncate font-mono text-meta text-ghost">{r.topicTitle}</p>
                  )}
                </div>

                {!filterTopicId && topics.length > 0 && (
                  <span className="hidden shrink-0 opacity-0 transition-opacity group-hover:opacity-100 sm:block">
                    <Select
                      value={r.topicId ?? "__track"}
                      onValueChange={(v) =>
                        updateResource({
                          id: r._id,
                          topicId: (v === "__track" ? undefined : v) as any,
                        })
                      }
                      size="sm"
                      options={[
                        { value: "__track", label: "Whole track" },
                        ...topics.map((t) => ({ value: t._id, label: t.title })),
                      ]}
                    />
                  </span>
                )}

                <span className="shrink-0">
                  <Select
                    value={r.status}
                    onValueChange={(v) => updateResource({ id: r._id, status: v })}
                    size="sm"
                    options={RESOURCE_STATUS_OPTIONS}
                  />
                </span>

                {r.url && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    title="Open"
                    className="shrink-0 text-ghost transition-colors hover:text-accent"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}

                <button
                  onClick={() => removeResource({ id: r._id })}
                  title="Remove"
                  className="shrink-0 text-ghost opacity-0 transition-opacity hover:text-danger group-hover:opacity-100 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
