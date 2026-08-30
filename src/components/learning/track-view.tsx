"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Roadmap } from "./roadmap";
import { ResourceList } from "./resource-list";
import { TRACK_STATUS_OPTIONS } from "./learning-meta";

type Tab = "roadmap" | "resources";

export function TrackView({
  trackId, onBack, onDeleted,
}: {
  trackId: string;
  onBack: () => void;
  onDeleted: () => void;
}) {
  const track = useQuery(api.learning.getTrack, { id: trackId as any });
  const notesByTopic = useQuery(api.notes.notesByTopic) ?? {};
  const updateTrack = useMutation(api.learning.updateTrack);
  const removeTrack = useMutation(api.learning.removeTrack);

  const [tab, setTab] = useState<Tab>("roadmap");
  const [confirm, setConfirm] = useState(false);

  if (track === undefined) {
    return <div className="py-20 text-center text-label text-ghost">Loading…</div>;
  }
  if (!track) {
    return (
      <div className="space-y-3 py-20 text-center">
        <p className="text-label text-ghost">That track no longer exists.</p>
        <button onClick={onBack} className="text-label text-accent hover:underline cursor-pointer">
          Back to learning
        </button>
      </div>
    );
  }

  const learned = track.topics.filter((t: any) => t.status === "done").length;

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 font-mono text-meta uppercase text-faint transition-colors hover:text-ink cursor-pointer"
        >
          <ArrowLeft className="h-3 w-3" /> Learning
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-serif text-title font-bold text-ink">{track.name}</h1>
              <Select
                value={track.status}
                onValueChange={(v) => updateTrack({ id: trackId as any, status: v })}
                size="sm"
                options={TRACK_STATUS_OPTIONS}
              />
            </div>
            {track.description && (
              <p className="max-w-2xl text-label text-faint">{track.description}</p>
            )}
          </div>

          <button
            onClick={() => setConfirm(true)}
            title="Delete track"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-muted
                       transition-colors hover:border-danger/35 hover:bg-danger-tint hover:text-danger cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-line bg-surface px-4 py-3">
          <div className="flex min-w-48 flex-1 items-center gap-3">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-subtle-2">
              <span
                className={`block h-full rounded-full transition-[width] duration-500 ${
                  track.progress === 100 ? "bg-success" : "bg-accent"
                }`}
                style={{ width: `${track.progress}%` }}
              />
            </span>
            <span className="shrink-0 font-mono text-meta text-faint">{track.progress}%</span>
          </div>
          <span className="font-mono text-meta text-ghost">
            {learned}/{track.topics.length} topics learned
          </span>
          <span className="font-mono text-meta text-ghost">
            {track.resources.length} resources
          </span>
        </div>

        <div className="flex gap-1 border-b border-line">
          {(["roadmap", "resources"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-3 py-2 text-label capitalize transition-colors cursor-pointer ${
                tab === t
                  ? "border-accent font-semibold text-ink"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      {tab === "roadmap" ? (
        <Roadmap
          trackId={trackId}
          topics={track.topics}
          resources={track.resources}
          notesByTopic={notesByTopic}
        />
      ) : (
        <ResourceList trackId={trackId} resources={track.resources} topics={track.topics} />
      )}

      <ConfirmDialog
        open={confirm}
        title={`Delete “${track.name}”?`}
        body="Its roadmap, saved resources and topic notes go with it, along with its folder in Notes. This cannot be undone."
        confirmLabel="Delete track"
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          await removeTrack({ id: trackId as any });
          toast.success("Track deleted");
          setConfirm(false);
          onDeleted();
        }}
      />
    </div>
  );
}
