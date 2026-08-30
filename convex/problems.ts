import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const problems = await ctx.db
      .query("problems")
      .withIndex("by_next_review")
      .collect();
    return problems;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    url: v.optional(v.string()),
    platform: v.string(),
    pattern: v.string(),
    difficulty: v.string(),
    solveTimeSeconds: v.optional(v.number()),
    masteryLevel: v.number(),
    mistakes: v.optional(v.string()),
    notes: v.optional(v.string()),
    code: v.optional(v.string()),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const nextDays =
      args.masteryLevel >= 100 ? 14 : args.masteryLevel >= 80 ? 7 : 2;

    const id = await ctx.db.insert("problems", {
      ...args,
      reviewCount: 1,
      nextReviewDate: new Date(Date.now() + nextDays * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      lastSolvedDate: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
    });
    return id;
  },
});

export const updateMastery = mutation({
  args: {
    id: v.id("problems"),
    masteryLevel: v.number(),
  },
  handler: async (ctx, args) => {
    const problem = await ctx.db.get(args.id);
    if (!problem) throw new Error("Problem not found");

    const nextDays =
      args.masteryLevel >= 100 ? 21 : args.masteryLevel >= 80 ? 7 : 2;

    await ctx.db.patch(args.id, {
      masteryLevel: args.masteryLevel,
      reviewCount: (problem.reviewCount ?? 0) + 1,
      nextReviewDate: new Date(Date.now() + nextDays * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      lastSolvedDate: new Date().toISOString().split("T")[0],
    });
  },
});

// ---------------------------------------------------------------------------
// Curriculum progress
// ---------------------------------------------------------------------------

import { scheduleAfter, type Recall } from "./spacedRepetition";
import { today } from "./recurrence";

/**
 * Record an attempt at a curriculum problem, creating the progress row on
 * first contact. The client sends the slug and the metadata it already knows
 * from the static list, so nothing needs to be seeded up front — 150 empty
 * rows would just be 150 rows to keep in sync.
 */
export const logAttempt = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    pattern: v.string(),
    difficulty: v.string(),
    recall: v.string(),
    url: v.optional(v.string()),
    notes: v.optional(v.string()),
    code: v.optional(v.string()),
    language: v.optional(v.string()),
    solveTimeSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("problems")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    const schedule = scheduleAfter(
      args.recall as Recall,
      existing?.reviewStreak ?? 0
    );

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...schedule,
        reviewCount: (existing.reviewCount ?? 0) + 1,
        attempts: (existing.attempts ?? 0) + 1,
        ...(args.notes !== undefined ? { notes: args.notes } : {}),
        ...(args.code !== undefined ? { code: args.code } : {}),
        ...(args.language !== undefined ? { language: args.language } : {}),
        ...(args.solveTimeSeconds !== undefined
          ? { solveTimeSeconds: args.solveTimeSeconds }
          : {}),
      });
      return existing._id;
    }

    return await ctx.db.insert("problems", {
      slug: args.slug,
      title: args.title,
      pattern: args.pattern,
      difficulty: args.difficulty,
      platform: "leetcode",
      url: args.url,
      notes: args.notes,
      code: args.code,
      language: args.language,
      solveTimeSeconds: args.solveTimeSeconds,
      reviewCount: 1,
      attempts: 1,
      ...schedule,
      createdAt: new Date().toISOString(),
    });
  },
});

/** Undo — drops the progress row so the problem returns to unsolved. */
export const resetProblem = mutation({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("problems")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

/** Everything due for review on or before today, hardest recall first. */
export const dueForReview = query({
  args: {},
  handler: async (ctx) => {
    const now = today();
    const all = await ctx.db.query("problems").collect();
    return all
      .filter((p) => p.nextReviewDate && p.nextReviewDate <= now)
      .sort((a, b) => (a.masteryLevel ?? 0) - (b.masteryLevel ?? 0));
  },
});
