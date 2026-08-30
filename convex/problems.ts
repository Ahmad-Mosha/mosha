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
// Solving log
// ---------------------------------------------------------------------------

import { scheduleAfter, type Recall } from "./spacedRepetition";
import { today } from "./recurrence";

/**
 * A stable key for a problem, derived from its title.
 *
 * Re-solving something should update the existing row and advance its review
 * schedule, not create a second copy — so the same title always lands on the
 * same record, however it was typed.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Log a solve. Anything can be logged — the plan you are following, or the
 * problem that just came up. Nothing needs to exist beforehand.
 */
export const logSolve = mutation({
  args: {
    title: v.string(),
    pattern: v.string(),
    difficulty: v.string(),
    recall: v.string(),
    platform: v.optional(v.string()),
    url: v.optional(v.string()),
    notes: v.optional(v.string()),
    code: v.optional(v.string()),
    language: v.optional(v.string()),
    solveTimeSeconds: v.optional(v.number()),
    /** Defaults to today; set it when logging something solved earlier. */
    solvedOn: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const title = args.title.trim();
    if (!title) throw new Error("A problem needs a title");

    const slug = slugify(title);
    const solvedOn = args.solvedOn || today();

    const existing = await ctx.db
      .query("problems")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    const schedule = scheduleAfter(
      args.recall as Recall,
      existing?.reviewStreak ?? 0,
      solvedOn
    );

    const optional = {
      ...(args.url !== undefined ? { url: args.url } : {}),
      ...(args.notes !== undefined ? { notes: args.notes } : {}),
      ...(args.code !== undefined ? { code: args.code } : {}),
      ...(args.language !== undefined ? { language: args.language } : {}),
      ...(args.solveTimeSeconds !== undefined
        ? { solveTimeSeconds: args.solveTimeSeconds }
        : {}),
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...schedule,
        title,
        pattern: args.pattern,
        difficulty: args.difficulty,
        reviewCount: (existing.reviewCount ?? 0) + 1,
        attempts: (existing.attempts ?? 0) + 1,
        ...optional,
      });
      return existing._id;
    }

    return await ctx.db.insert("problems", {
      slug,
      title,
      pattern: args.pattern,
      difficulty: args.difficulty,
      platform: args.platform || "leetcode",
      reviewCount: 1,
      attempts: 1,
      ...schedule,
      ...optional,
      createdAt: new Date().toISOString(),
    });
  },
});

export const removeProblem = mutation({
  args: { id: v.id("problems") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

/** Everything due for review on or before today, weakest recall first. */
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
