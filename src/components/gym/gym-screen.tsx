"use client";

import React, { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Dumbbell, Flame, Play, Plus, Scale, Trash2, Trophy } from "lucide-react";
import { Select } from "@/components/ui/select";
import { ActivityHeatmap, currentStreak, longestStreak } from "@/components/ui/activity-heatmap";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { today } from "../../../convex/recurrence";
import { SPLIT_OPTIONS, formatVolume, newId, splitMeta } from "./gym-meta";
import { SessionEditor } from "./session-editor";

type Tab = "sessions" | "plans" | "body";

export function GymScreen() {
  const sessions = useQuery(api.gym.listSessions) ?? [];
  const plans = useQuery(api.gym.listPlans) ?? [];
  const body = useQuery(api.gym.listBodyMetrics) ?? [];
  const records = useQuery(api.gym.personalRecords) ?? [];
  const stats = useQuery(api.gym.summary);

  const createSession = useMutation(api.gym.createSession);
  const startFromPlan = useMutation(api.gym.startFromPlan);

  const [tab, setTab] = useState<Tab>("sessions");
  const [editing, setEditing] = useState<any | null>(null);

  /** Training days feed the heatmap; a day you trained is a day that counts. */
  const counts = useMemo(() => {
    const byDay: Record<string, number> = {};
    for (const s of sessions) byDay[s.date] = (byDay[s.date] ?? 0) + 1;
    return byDay;
  }, [sessions]);

  /** Exercise names you have used before, offered while logging. */
  const knownExercises = useMemo(
    () =>
      Array.from(
        new Set(sessions.flatMap((s: any) => s.exercises.map((e: any) => e.name).filter(Boolean)))
      ).sort() as string[],
    [sessions]
  );

  const startBlank = async () => {
    const id = await createSession({ title: "Session", split: "push" });
    const fresh = { _id: id, title: "Session", split: "push", date: today(), exercises: [] };
    setEditing(fresh);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="font-serif text-display font-bold text-ink">Gym</h1>
          <p className="mt-0.5 text-label text-faint">
            What you lifted, what you planned, and what your body is doing about it.
          </p>
        </div>

        <div className="flex items-center gap-5">
          <Stat label="This week" value={`${stats?.sessionsThisWeek ?? 0}`} sub="sessions" />
          <Stat label="Volume" value={formatVolume(stats?.volumeThisWeek ?? 0)} sub="7d" />
          <Stat
            label="Streak"
            value={`${currentStreak(counts)}`}
            sub={`best ${longestStreak(counts)}`}
            icon={<Flame className="h-3.5 w-3.5 text-warn" />}
          />
          {stats?.latestWeight != null && (
            <Stat
              label="Weight"
              value={`${stats.latestWeight}`}
              sub={
                stats.weightChange30d != null
                  ? `${stats.weightChange30d > 0 ? "+" : ""}${stats.weightChange30d}kg / 30d`
                  : "kg"
              }
              icon={<Scale className="h-3.5 w-3.5 text-info" />}
            />
          )}
          <button
            onClick={startBlank}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-label font-semibold text-accent-fg transition-colors hover:bg-accent-hover cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Log session
          </button>
        </div>
      </header>

      {sessions.length > 0 && (
        <section className="rounded-xl border border-line bg-surface px-4 py-5">
          <h2 className="mb-4 text-center font-mono text-meta font-semibold uppercase text-faint">
            Training days
          </h2>
          <ActivityHeatmap counts={counts} ramp="success" unit="session" weeks={30} cellSize={13} />
        </section>
      )}

      <div className="flex gap-1 border-b border-line">
        {(["sessions", "plans", "body"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-2 text-label capitalize transition-colors cursor-pointer ${
              tab === t ? "border-accent font-semibold text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "sessions" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_280px]">
          <div className="space-y-2">
            {sessions.length === 0 ? (
              <div className="space-y-3 rounded-xl border border-dashed border-line-2 py-16 text-center">
                <Dumbbell className="mx-auto h-8 w-8 text-line-2" />
                <p className="text-label text-ghost">Nothing logged yet.</p>
                <button
                  onClick={startBlank}
                  className="rounded-lg bg-accent px-4 py-2 text-label font-semibold text-accent-fg hover:bg-accent-hover cursor-pointer"
                >
                  Log your first session
                </button>
              </div>
            ) : (
              sessions.map((s: any) => {
                const meta = splitMeta(s.split);
                return (
                  <button
                    key={s._id}
                    onClick={() => setEditing(s)}
                    className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-left transition-colors hover:border-line-2 cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-label text-ink">{s.title}</span>
                        <span className={`rounded px-1.5 py-0.5 font-mono text-meta ${meta.chip}`}>
                          {meta.label}
                        </span>
                      </div>
                      <span className="font-mono text-meta text-ghost">
                        {s.date} · {s.exercises.length} exercises · {s.setCount} sets
                        {s.durationMinutes ? ` · ${s.durationMinutes}m` : ""}
                      </span>
                    </div>
                    <span className="shrink-0 font-mono text-meta text-faint">
                      {formatVolume(s.volumeKg)}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <aside className="space-y-2">
            <h2 className="flex items-center gap-1.5 font-mono text-meta font-semibold uppercase text-faint">
              <Trophy className="h-3.5 w-3.5" /> Personal records
            </h2>
            {records.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line-2 py-6 text-center text-label text-ghost">
                Log some sets and these appear.
              </p>
            ) : (
              <ul className="space-y-1">
                {records.slice(0, 10).map((r: any) => (
                  <li
                    key={r.name}
                    className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-label text-ink">{r.name}</span>
                    <span className="shrink-0 font-mono text-meta text-faint">
                      {r.weightKg}×{r.reps}
                    </span>
                    <span
                      title="Estimated one-rep max"
                      className="shrink-0 rounded bg-success-tint px-1.5 py-0.5 font-mono text-meta text-success"
                    >
                      {r.oneRm}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      )}

      {tab === "plans" && (
        <PlansTab plans={plans} onStart={async (planId) => {
          const id = await startFromPlan({ planId: planId as any });
          const plan = plans.find((p: any) => p._id === planId);
          toast.success(`Started ${plan?.name ?? "session"}`);
          setEditing({
            _id: id,
            title: plan?.name ?? "Session",
            split: plan?.split ?? "push",
            date: today(),
            exercises: (plan?.exercises ?? []).map((e: any) => ({
              id: e.id,
              name: e.name,
              sets: Array.from({ length: Math.max(1, e.targetSets) }, () => ({
                reps: e.targetReps,
                weightKg: e.targetWeightKg ?? 0,
              })),
            })),
          });
          setTab("sessions");
        }} />
      )}

      {tab === "body" && <BodyTab entries={body} />}

      {editing && (
        <SessionEditor
          session={editing}
          knownExercises={knownExercises}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function PlansTab({ plans, onStart }: { plans: any[]; onStart: (id: string) => void }) {
  const createPlan = useMutation(api.gym.createPlan);
  const updatePlan = useMutation(api.gym.updatePlan);
  const removePlan = useMutation(api.gym.removePlan);

  const [name, setName] = useState("");
  const [split, setSplit] = useState("push");
  const [open, setOpen] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<any | null>(null);

  const field =
    "rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-label text-ink outline-none focus:border-accent";

  return (
    <div className="space-y-3">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          await createPlan({ name: name.trim(), split });
          setName("");
          toast.success("Plan created");
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <label className="min-w-44 flex-1 space-y-1">
          <span className="block font-mono text-meta uppercase text-faint">Plan name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Push A" className={`w-full ${field}`} />
        </label>
        <label className="space-y-1">
          <span className="block font-mono text-meta uppercase text-faint">Split</span>
          <Select value={split} onValueChange={setSplit} size="sm" options={SPLIT_OPTIONS} />
        </label>
        <button type="submit" className="rounded-lg bg-accent px-3 py-1.5 text-label font-semibold text-accent-fg hover:bg-accent-hover cursor-pointer">
          Create plan
        </button>
      </form>

      {plans.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-2 py-12 text-center text-label text-ghost">
          No plans yet. A plan is the workout you intend to repeat.
        </p>
      ) : (
        plans.map((p: any) => {
          const meta = splitMeta(p.split);
          const isOpen = open === p._id;
          return (
            <div key={p._id} className="overflow-hidden rounded-xl border border-line bg-surface">
              <div className="flex items-center gap-3 px-4 py-3">
                <button onClick={() => setOpen(isOpen ? null : p._id)} className="min-w-0 flex-1 text-left cursor-pointer">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-serif text-heading text-ink">{p.name}</span>
                    <span className={`rounded px-1.5 py-0.5 font-mono text-meta ${meta.chip}`}>{meta.label}</span>
                  </span>
                  <span className="block font-mono text-meta text-ghost">
                    {p.exercises.length} exercises
                  </span>
                </button>
                <button
                  onClick={() => onStart(p._id)}
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-label font-semibold text-accent-fg hover:bg-accent-hover cursor-pointer"
                >
                  <Play className="h-3 w-3" /> Start
                </button>
                <button
                  onClick={() => setConfirm(p)}
                  title="Delete plan"
                  className="grid h-8 w-8 place-items-center rounded-lg text-ghost hover:bg-danger-tint hover:text-danger cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {isOpen && (
                <div className="space-y-2 border-t border-line p-3">
                  {p.exercises.map((ex: any, i: number) => (
                    <div key={ex.id} className="flex items-center gap-2">
                      <input
                        value={ex.name}
                        onChange={(e) =>
                          updatePlan({
                            id: p._id,
                            exercises: p.exercises.map((x: any, j: number) =>
                              j === i ? { ...x, name: e.target.value } : x
                            ),
                          })
                        }
                        placeholder="Exercise"
                        className={`flex-1 ${field}`}
                      />
                      <input
                        type="number" value={ex.targetSets}
                        onChange={(e) =>
                          updatePlan({
                            id: p._id,
                            exercises: p.exercises.map((x: any, j: number) =>
                              j === i ? { ...x, targetSets: Number(e.target.value) } : x
                            ),
                          })
                        }
                        className={`w-16 ${field}`}
                      />
                      <span className="font-mono text-meta text-ghost">×</span>
                      <input
                        type="number" value={ex.targetReps}
                        onChange={(e) =>
                          updatePlan({
                            id: p._id,
                            exercises: p.exercises.map((x: any, j: number) =>
                              j === i ? { ...x, targetReps: Number(e.target.value) } : x
                            ),
                          })
                        }
                        className={`w-16 ${field}`}
                      />
                      <button
                        onClick={() =>
                          updatePlan({
                            id: p._id,
                            exercises: p.exercises.filter((_: any, j: number) => j !== i),
                          })
                        }
                        className="text-ghost hover:text-danger cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      updatePlan({
                        id: p._id,
                        exercises: [
                          ...p.exercises,
                          { id: newId(), name: "", targetSets: 3, targetReps: 8 },
                        ],
                      })
                    }
                    className="flex items-center gap-1.5 font-mono text-meta text-muted hover:text-ink cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> Add exercise
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={`Delete “${confirm?.name}”?`}
        body="Sessions already logged from it keep their history."
        confirmLabel="Delete plan"
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          await removePlan({ id: confirm._id });
          toast.success("Plan deleted");
          setConfirm(null);
        }}
      />
    </div>
  );
}

function BodyTab({ entries }: { entries: any[] }) {
  const upsert = useMutation(api.gym.upsertBodyMetric);
  const remove = useMutation(api.gym.removeBodyMetric);

  const [date, setDate] = useState(today());
  const [weight, setWeight] = useState("");
  const [fat, setFat] = useState("");

  const withWeight = entries.filter((e) => typeof e.weightKg === "number");
  const min = Math.min(...withWeight.map((e) => e.weightKg), Infinity);
  const max = Math.max(...withWeight.map((e) => e.weightKg), -Infinity);
  const span = max - min || 1;

  const field =
    "rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-label text-ink outline-none focus:border-accent";

  return (
    <div className="space-y-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (weight === "" && fat === "") return;
          await upsert({
            date,
            weightKg: weight === "" ? undefined : Number(weight),
            bodyFatPct: fat === "" ? undefined : Number(fat),
          });
          setWeight(""); setFat("");
          toast.success("Logged");
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <label className="space-y-1">
          <span className="block font-mono text-meta uppercase text-faint">Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
        </label>
        <label className="space-y-1">
          <span className="block font-mono text-meta uppercase text-faint">Weight kg</span>
          <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="78.4" className={`w-24 ${field}`} />
        </label>
        <label className="space-y-1">
          <span className="block font-mono text-meta uppercase text-faint">Body fat %</span>
          <input type="number" step="0.1" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="16" className={`w-24 ${field}`} />
        </label>
        <button type="submit" className="rounded-lg bg-accent px-3 py-1.5 text-label font-semibold text-accent-fg hover:bg-accent-hover cursor-pointer">
          Log
        </button>
      </form>

      {/* A sparkline beats a chart library for one series you glance at. */}
      {withWeight.length > 1 && (
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="mb-2 flex items-center justify-between font-mono text-meta text-ghost">
            <span>{min}kg</span>
            <span>Weight · {withWeight.length} entries</span>
            <span>{max}kg</span>
          </div>
          <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-24 w-full">
            <polyline
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="0.6"
              strokeLinejoin="round"
              points={withWeight
                .map((e, i) => {
                  const x = (i / (withWeight.length - 1)) * 100;
                  const y = 26 - ((e.weightKg - min) / span) * 24;
                  return `${x},${y}`;
                })
                .join(" ")}
            />
          </svg>
        </div>
      )}

      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-2 py-12 text-center text-label text-ghost">
          Nothing logged. Weight is the one number worth having a history of.
        </p>
      ) : (
        <ul className="space-y-1">
          {[...entries].reverse().map((e) => (
            <li key={e._id} className="group flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2">
              <span className="font-mono text-meta text-ghost">{e.date}</span>
              <span className="flex-1 text-label text-ink">
                {e.weightKg != null && <>{e.weightKg} kg</>}
                {e.bodyFatPct != null && <span className="ml-2 text-faint">{e.bodyFatPct}% bf</span>}
              </span>
              <button
                onClick={() => remove({ id: e._id })}
                title="Remove"
                className="text-ghost opacity-0 transition-opacity hover:text-danger group-hover:opacity-100 cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
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
