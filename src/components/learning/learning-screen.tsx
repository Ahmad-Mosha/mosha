"use client";

import React, { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { ArrowRight, BookOpen, Flame, Plus, Search } from "lucide-react";
import { Select } from "@/components/ui/select";
import { ActivityHeatmap, currentStreak, longestStreak } from "@/components/ui/activity-heatmap";
import { TrackView } from "./track-view";
import { TRACK_STATUS, TRACK_STATUS_OPTIONS, resourceMeta } from "./learning-meta";

export function LearningScreen() {
  const tracks = useQuery(api.learning.listTracks) ?? [];
  const resources = useQuery(api.learning.listResources) ?? [];
  const createTrack = useMutation(api.learning.createTrack);

  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  /**
   * Study activity, from when topics were last touched. Marking a topic or
   * writing notes is studying; nothing has to be logged separately.
   */
  const counts = useMemo(() => {
    const byDay: Record<string, number> = {};
    for (const t of tracks) {
      if (t.lastStudiedAt) byDay[t.lastStudiedAt] = (byDay[t.lastStudiedAt] ?? 0) + 1;
    }
    return byDay;
  }, [tracks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tracks.filter((t: any) => {
      if (status !== "all" && t.status !== status) return false;
      if (!q) return true;
      return t.name?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
    });
  }, [tracks, query, status]);

  /** What to pick back up: active tracks that have a next topic waiting. */
  const continueWith = useMemo(
    () => tracks.filter((t: any) => t.status === "active" && t.nextTopic).slice(0, 3),
    [tracks]
  );

  const totalTopics = tracks.reduce((n: number, t: any) => n + t.topicCount, 0);
  const totalLearned = tracks.reduce((n: number, t: any) => n + t.doneCount, 0);

  if (selected) {
    return (
      <TrackView
        trackId={selected}
        onBack={() => setSelected(null)}
        onDeleted={() => setSelected(null)}
      />
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const id = await createTrack({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setName(""); setDescription(""); setAdding(false);
      toast.success("Track created");
      if (id) setSelected(id);
    } catch {
      toast.error("Could not create that track");
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="font-serif text-display font-bold text-ink">Learning</h1>
          <p className="mt-0.5 text-label text-faint">
            What you are studying, in what order, and from where.
          </p>
        </div>

        <div className="flex items-center gap-5">
          <Stat label="Tracks" value={`${tracks.length}`} />
          <Stat label="Topics" value={`${totalLearned}`} sub={`of ${totalTopics}`} />
          <Stat label="Resources" value={`${resources.length}`} />
          <Stat
            label="Streak"
            value={`${currentStreak(counts)}`}
            sub={`best ${longestStreak(counts)}`}
            icon={<Flame className="h-3.5 w-3.5 text-warn" />}
          />
          <button
            onClick={() => setAdding((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-label
                       font-semibold text-accent-fg transition-colors hover:bg-accent-hover cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> New track
          </button>
        </div>
      </header>

      {adding && (
        <form onSubmit={submit} className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-3">
          <label className="min-w-44 flex-1 space-y-1">
            <span className="block font-mono text-meta uppercase text-faint">Subject</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Operating Systems"
              className="w-full rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-label text-ink outline-none focus:border-accent"
            />
          </label>
          <label className="min-w-56 flex-[2] space-y-1">
            <span className="block font-mono text-meta uppercase text-faint">Why / what for</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Understand how the kernel actually schedules work"
              className="w-full rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-label text-ink outline-none focus:border-accent"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-accent px-3 py-1.5 text-label font-semibold text-accent-fg hover:bg-accent-hover cursor-pointer"
          >
            Create
          </button>
        </form>
      )}

      {/* Pick up where you left off, before anything else on the page. */}
      {continueWith.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-mono text-meta font-semibold uppercase text-faint">Pick up where you left off</h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {continueWith.map((t: any) => (
              <button
                key={t._id}
                onClick={() => setSelected(t._id)}
                className="group flex items-center gap-3 rounded-xl border border-accent/30 bg-accent-soft/40
                           px-3 py-2.5 text-left transition-colors hover:border-accent cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-meta uppercase text-faint">{t.name}</p>
                  <p className="truncate text-label text-ink">{t.nextTopic.title}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ghost transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </section>
      )}

      {tracks.length > 0 && (
        <section className="rounded-xl border border-line bg-surface px-4 py-5">
          <h2 className="mb-4 text-center font-mono text-meta font-semibold uppercase text-faint">
            Study activity
          </h2>
          <ActivityHeatmap counts={counts} ramp="shipped" unit="track" weeks={30} cellSize={13} />
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ghost" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tracks…"
            className="w-full rounded-lg border border-line bg-surface-2 py-1.5 pl-8 pr-2 text-label
                       text-ink outline-none transition-colors placeholder:text-ghost focus:border-accent"
          />
        </div>
        <Select
          value={status}
          onValueChange={setStatus}
          size="sm"
          options={[{ value: "all", label: "All statuses" }, ...TRACK_STATUS_OPTIONS]}
        />
      </div>

      {tracks.length === 0 ? (
        <div className="space-y-3 rounded-xl border border-dashed border-line-2 py-16 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-line-2" />
          <p className="text-label text-ghost">
            Nothing here yet. A track is one subject — the roadmap and sources live inside it.
          </p>
          <button
            onClick={() => setAdding(true)}
            className="rounded-lg bg-accent px-4 py-2 text-label font-semibold text-accent-fg hover:bg-accent-hover cursor-pointer"
          >
            Start your first track
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-label text-ghost">Nothing matches those filters.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t: any) => (
            <TrackCard
              key={t._id}
              track={t}
              resources={resources.filter((r: any) => r.trackId === t._id)}
              onOpen={() => setSelected(t._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TrackCard({
  track, resources, onOpen,
}: {
  track: any;
  resources: any[];
  onOpen: () => void;
}) {
  const meta = TRACK_STATUS[track.status] ?? TRACK_STATUS.planned;
  /** One icon per kind of source, so you see at a glance how you're learning it. */
  const kinds = Array.from(new Set(resources.map((r) => r.type))).slice(0, 5);

  return (
    <article
      onClick={onOpen}
      className="group flex cursor-pointer flex-col gap-3 rounded-xl border border-line bg-surface p-4
                 transition-colors hover:border-line-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-serif text-heading text-ink">{track.name}</h3>
          {track.description && (
            <p className="mt-0.5 line-clamp-2 text-label text-faint">{track.description}</p>
          )}
        </div>
        <span className={`flex shrink-0 items-center gap-1.5 rounded px-2 py-0.5 font-mono text-meta ${meta.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>

      {track.nextTopic && (
        <p className="truncate text-label text-muted">
          <span className="font-mono text-meta uppercase text-ghost">next </span>
          {track.nextTopic.title}
        </p>
      )}

      {kinds.length > 0 && (
        <div className="flex items-center gap-1">
          {kinds.map((k) => {
            const m = resourceMeta(k);
            const Icon = m.icon;
            return (
              <span key={k} title={m.label} className={`grid h-5 w-5 place-items-center rounded ${m.chip}`}>
                <Icon className="h-3 w-3" />
              </span>
            );
          })}
          <span className="ml-0.5 font-mono text-meta text-ghost">{resources.length}</span>
        </div>
      )}

      <div className="mt-auto space-y-1.5">
        <div className="h-1 overflow-hidden rounded-full bg-subtle-2">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${
              track.progress === 100 ? "bg-success" : "bg-accent"
            }`}
            style={{ width: `${track.progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between font-mono text-meta text-ghost">
          <span>{track.doneCount}/{track.topicCount} topics</span>
          <span>{track.progress}%</span>
        </div>
      </div>
    </article>
  );
}

function Stat({
  label, value, sub, icon,
}: {
  label: string; value: string; sub?: string; icon?: React.ReactNode;
}) {
  return (
    <div className="text-right">
      <div className="flex items-center justify-end gap-1.5">
        {icon}
        <span className="font-serif text-title leading-none text-ink">{value}</span>
      </div>
      <div className="font-mono text-meta uppercase text-ghost">
        {label}
        {sub && <span className="ml-1 normal-case text-faint">{sub}</span>}
      </div>
    </div>
  );
}
