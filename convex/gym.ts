import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const DEFAULT_GYM_SESSIONS = [
  {
    title: "Pull Day (Deadlift & Weighted Pull-ups)",
    split: "Pull",
    date: new Date().toISOString().split("T")[0],
    durationMinutes: 75,
    totalVolumeKg: 18450,
    rating: 5,
    notes: "Felt strong. Hit a new 5-rep PR on conventional deadlift 140kg.",
    exercises: [
      { name: "Conventional Deadlift", sets: 4, reps: 5, weightKg: 140, isPr: true },
      { name: "Weighted Pull-Ups", sets: 4, reps: 6, weightKg: 25, isPr: true },
      { name: "Chest Supported Row", sets: 3, reps: 10, weightKg: 70 },
      { name: "Incline Bicep Curls", sets: 3, reps: 12, weightKg: 16 },
      { name: "Face Pulls", sets: 4, reps: 15, weightKg: 30 },
    ],
    createdAt: new Date().toISOString(),
  },
];

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("gym_sessions").order("desc").collect();
  },
});

export const seedIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("gym_sessions").first();
    if (!existing) {
      for (const s of DEFAULT_GYM_SESSIONS) {
        await ctx.db.insert("gym_sessions", s);
      }
    }
  },
});

export const logSession = mutation({
  args: {
    title: v.string(),
    split: v.string(),
    durationMinutes: v.number(),
    totalVolumeKg: v.number(),
    notes: v.optional(v.string()),
    exercises: v.array(
      v.object({
        name: v.string(),
        sets: v.number(),
        reps: v.number(),
        weightKg: v.number(),
        rpe: v.optional(v.number()),
        isPr: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("gym_sessions", {
      ...args,
      date: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
    });
  },
});
