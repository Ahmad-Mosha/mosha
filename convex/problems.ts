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
