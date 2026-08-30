import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { addDays, today } from "./recurrence";

/**
 * Gym: sessions, plans and body metrics.
 *
 * Volume and personal records are always derived from the sets themselves, so
 * they cannot drift from what was actually logged.
 */

export const SPLITS = ["push", "pull", "legs", "upper", "lower", "full", "other"];

const setSchema = v.object({
  reps: v.number(),
  weightKg: v.number(),
  rpe: v.optional(v.number()),
});

const exerciseSchema = v.object({
  id: v.string(),
  name: v.string(),
  sets: v.array(setSchema),
});

/** Tonnage: the honest one-number summary of how much work a session was. */
export const volumeOf = (exercises: { sets: { reps: number; weightKg: number }[] }[]) =>
  exercises.reduce(
    (total, e) => total + e.sets.reduce((s, x) => s + x.reps * x.weightKg, 0),
    0
  );

/** Epley — good enough to compare a heavy triple against a light set of ten. */
export const estimate1RM = (weightKg: number, reps: number) =>
  reps <= 1 ? weightKg : Math.round(weightKg * (1 + reps / 30));

// --- Sessions ---------------------------------------------------------------

export const listSessions = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db.query("gym_sessions").withIndex("by_date").collect();
    return sessions
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((s) => ({
        ...s,
        volumeKg: volumeOf(s.exercises),
        setCount: s.exercises.reduce((n, e) => n + e.sets.length, 0),
      }));
  },
});

export const createSession = mutation({
  args: {
    title: v.string(),
    split: v.string(),
    date: v.optional(v.string()),
    durationMinutes: v.optional(v.number()),
    notes: v.optional(v.string()),
    rating: v.optional(v.number()),
    planId: v.optional(v.id("gym_plans")),
    exercises: v.optional(v.array(exerciseSchema)),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("gym_sessions", {
      title: args.title.trim() || "Session",
      split: args.split,
      date: args.date || today(),
      durationMinutes: args.durationMinutes,
      notes: args.notes,
      rating: args.rating,
      planId: args.planId,
      exercises: args.exercises ?? [],
      createdAt: new Date().toISOString(),
    });
  },
});

export const updateSession = mutation({
  args: {
    id: v.id("gym_sessions"),
    title: v.optional(v.string()),
    split: v.optional(v.string()),
    date: v.optional(v.string()),
    durationMinutes: v.optional(v.number()),
    notes: v.optional(v.string()),
    rating: v.optional(v.number()),
    exercises: v.optional(v.array(exerciseSchema)),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
  },
});

export const removeSession = mutation({
  args: { id: v.id("gym_sessions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

/** Start a session from a plan, carrying its exercises across empty. */
export const startFromPlan = mutation({
  args: { planId: v.id("gym_plans"), date: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Plan not found");

    return await ctx.db.insert("gym_sessions", {
      title: plan.name,
      split: plan.split,
      date: args.date || today(),
      planId: plan._id,
      // Target weight pre-fills the first set so the common case is one tap.
      exercises: plan.exercises.map((e) => ({
        id: e.id,
        name: e.name,
        sets: Array.from({ length: Math.max(1, e.targetSets) }, () => ({
          reps: e.targetReps,
          weightKg: e.targetWeightKg ?? 0,
        })),
      })),
      createdAt: new Date().toISOString(),
    });
  },
});

// --- Plans ------------------------------------------------------------------

export const listPlans = query({
  args: {},
  handler: async (ctx) => ctx.db.query("gym_plans").withIndex("by_order").collect(),
});

export const createPlan = mutation({
  args: {
    name: v.string(),
    split: v.string(),
    notes: v.optional(v.string()),
    exercises: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          targetSets: v.number(),
          targetReps: v.number(),
          targetWeightKg: v.optional(v.number()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("gym_plans").collect();
    return await ctx.db.insert("gym_plans", {
      name: args.name.trim() || "Plan",
      split: args.split,
      notes: args.notes,
      exercises: args.exercises ?? [],
      order: existing.length,
      createdAt: new Date().toISOString(),
    });
  },
});

export const updatePlan = mutation({
  args: {
    id: v.id("gym_plans"),
    name: v.optional(v.string()),
    split: v.optional(v.string()),
    notes: v.optional(v.string()),
    exercises: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          targetSets: v.number(),
          targetReps: v.number(),
          targetWeightKg: v.optional(v.number()),
        })
      )
    ),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
  },
});

export const removePlan = mutation({
  args: { id: v.id("gym_plans") },
  handler: async (ctx, args) => {
    // Sessions already logged from this plan keep their history; they just
    // lose the link back to a template that no longer exists.
    const sessions = await ctx.db.query("gym_sessions").collect();
    for (const s of sessions) {
      if (s.planId === args.id) await ctx.db.patch(s._id, { planId: undefined });
    }
    await ctx.db.delete(args.id);
  },
});

// --- Body -------------------------------------------------------------------

export const listBodyMetrics = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("body_metrics").withIndex("by_date").collect();
    return rows.sort((a, b) => a.date.localeCompare(b.date));
  },
});

/** One entry per day — logging twice updates rather than duplicating. */
export const upsertBodyMetric = mutation({
  args: {
    date: v.optional(v.string()),
    weightKg: v.optional(v.number()),
    bodyFatPct: v.optional(v.number()),
    measurements: v.optional(
      v.array(v.object({ name: v.string(), valueCm: v.number() }))
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const date = args.date || today();
    const existing = await ctx.db
      .query("body_metrics")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { ...args, date });
      return existing._id;
    }
    return await ctx.db.insert("body_metrics", {
      ...args,
      date,
      createdAt: new Date().toISOString(),
    });
  },
});

export const removeBodyMetric = mutation({
  args: { id: v.id("body_metrics") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// --- Derived ----------------------------------------------------------------

/**
 * Best estimated 1RM per exercise, and when it was hit. Personal records are
 * computed from history rather than flagged by hand, so they cannot be wrong.
 */
export const personalRecords = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db.query("gym_sessions").collect();
    const best: Record<
      string,
      { name: string; weightKg: number; reps: number; oneRm: number; date: string }
    > = {};

    for (const s of sessions) {
      for (const e of s.exercises) {
        for (const set of e.sets) {
          if (set.weightKg <= 0 || set.reps <= 0) continue;
          const oneRm = estimate1RM(set.weightKg, set.reps);
          const key = e.name.trim().toLowerCase();
          if (!best[key] || oneRm > best[key].oneRm) {
            best[key] = {
              name: e.name.trim(),
              weightKg: set.weightKg,
              reps: set.reps,
              oneRm,
              date: s.date,
            };
          }
        }
      }
    }
    return Object.values(best).sort((a, b) => b.oneRm - a.oneRm);
  },
});

/** Headline numbers for the overview. */
export const summary = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db.query("gym_sessions").collect();
    const body = await ctx.db.query("body_metrics").withIndex("by_date").collect();
    const weekAgo = addDays(today(), -7);

    const recent = sessions.filter((s) => s.date >= weekAgo);
    const withWeight = body
      .filter((b) => typeof b.weightKg === "number")
      .sort((a, b) => a.date.localeCompare(b.date));

    const latest = withWeight[withWeight.length - 1];
    const monthAgo = addDays(today(), -30);
    const priorPoint = [...withWeight].reverse().find((b) => b.date <= monthAgo);

    return {
      sessionsThisWeek: recent.length,
      volumeThisWeek: volumeOf(recent.flatMap((s) => s.exercises)),
      totalSessions: sessions.length,
      latestWeight: latest?.weightKg ?? null,
      latestWeightDate: latest?.date ?? null,
      weightChange30d:
        latest && priorPoint && typeof priorPoint.weightKg === "number"
          ? Number((latest.weightKg! - priorPoint.weightKg).toFixed(1))
          : null,
    };
  },
});
