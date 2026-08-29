import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export interface MilestoneType {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export const SEED_GOALS = [
  {
    title: "Finish Military Service",
    description:
      "Complete national duty with honor, physical strength, and mental resilience.",
    icon: "🎖️",
    status: "in_progress",
    targetDate: "2025-12-31",
    progress: 50,
    milestones: [
      { id: "m1", title: "Basic Training Phase Completed", completed: true },
      { id: "m2", title: "Establish Daily Workout & Reading Routine", completed: true },
      { id: "m3", title: "Maintain Consistent Problem Solving Habit", completed: false },
      { id: "m4", title: "Complete Active Duty Term with Distinction", completed: false },
    ],
    order: 1,
    createdAt: new Date().toISOString(),
  },
  {
    title: "Get My First Job",
    description:
      "Secure a high-impact Software Engineering role building scalable distributed systems.",
    icon: "💼",
    status: "in_progress",
    targetDate: "2026-03-31",
    progress: 40,
    milestones: [
      { id: "j1", title: "Master Top 150 LeetCode Patterns (100% Mastery)", completed: true },
      { id: "j2", title: "Build 2 Production-Grade Backend Projects in Go & Node.js", completed: true },
      { id: "j3", title: "Complete System Design & Behavioral STAR Matrix", completed: false },
      { id: "j4", title: "Submit 30 Targeted High-Quality Applications", completed: false },
      { id: "j5", title: "Ace Technical Rounds & Sign First Offer", completed: false },
    ],
    order: 2,
    createdAt: new Date().toISOString(),
  },
  {
    title: "Get Married",
    description:
      "Establish a righteous, warm, and loving family home built on Islamic values.",
    icon: "❤️",
    status: "in_progress",
    targetDate: "2027-06-30",
    progress: 25,
    milestones: [
      { id: "w1", title: "Personal Character & Spiritual Maturity", completed: true },
      { id: "w2", title: "Establish Dedicated Marriage & Housing Fund", completed: false },
      { id: "w3", title: "Achieve Stable Career & Sustainable Income", completed: false },
      { id: "w4", title: "Take Official Steps & Complete Marriage (Nikah)", completed: false },
    ],
    order: 3,
    createdAt: new Date().toISOString(),
  },
];

// Query: List all major life goals
export const list = query({
  args: {},
  handler: async (ctx) => {
    const goals = await ctx.db
      .query("major_life_goals")
      .withIndex("by_order")
      .collect();
    return goals;
  },
});

// Mutation: Seed defaults if empty
export const seedIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("major_life_goals").first();
    if (!existing) {
      for (const goal of SEED_GOALS) {
        await ctx.db.insert("major_life_goals", goal);
      }
      return { seeded: true, count: SEED_GOALS.length };
    }
    return { seeded: false, count: 0 };
  },
});

// Mutation: Create a new major life goal
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    icon: v.string(),
    status: v.string(),
    targetDate: v.optional(v.string()),
    progress: v.number(),
    milestones: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        completed: v.boolean(),
        completedAt: v.optional(v.string()),
      })
    ),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("major_life_goals", {
      ...args,
      createdAt: new Date().toISOString(),
    });
    return id;
  },
});

// Mutation: Update existing goal
export const update = mutation({
  args: {
    id: v.id("major_life_goals"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    status: v.optional(v.string()),
    targetDate: v.optional(v.string()),
    progress: v.optional(v.number()),
    milestones: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          completed: v.boolean(),
          completedAt: v.optional(v.string()),
        })
      )
    ),
    order: v.optional(v.number()),
    completedAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
    return id;
  },
});

// Mutation: Toggle a milestone inside a goal and recompute progress
export const toggleMilestone = mutation({
  args: {
    goalId: v.id("major_life_goals"),
    milestoneId: v.string(),
  },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.goalId);
    if (!goal) throw new Error("Goal not found");

    const milestonesList: MilestoneType[] = (goal.milestones as MilestoneType[]) || [];
    const updatedMilestones = milestonesList.map((m: MilestoneType) => {
      if (m.id === args.milestoneId) {
        const nextCompleted = !m.completed;
        return {
          ...m,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
        };
      }
      return m;
    });

    const completedCount = updatedMilestones.filter((m: MilestoneType) => m.completed).length;
    const progress =
      updatedMilestones.length > 0
        ? Math.round((completedCount / updatedMilestones.length) * 100)
        : goal.progress;

    const allCompleted = completedCount === updatedMilestones.length && updatedMilestones.length > 0;
    const status = allCompleted ? "completed" : "in_progress";

    await ctx.db.patch(args.goalId, {
      milestones: updatedMilestones,
      progress,
      status,
      completedAt: allCompleted ? new Date().toISOString() : undefined,
    });

    return { progress, status };
  },
});

// Mutation: Delete a goal
export const remove = mutation({
  args: { id: v.id("major_life_goals") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
