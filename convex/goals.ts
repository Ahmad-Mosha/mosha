import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export interface MilestoneType {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}



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
      }),
    ),
    order: v.number(),
    phase: v.optional(v.string()),
    meaning: v.optional(v.string()),
    notes: v.optional(v.string()),
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
        }),
      ),
    ),
    order: v.optional(v.number()),
    phase: v.optional(v.string()),
    notes: v.optional(v.string()),
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

    const milestonesList: MilestoneType[] =
      (goal.milestones as MilestoneType[]) || [];
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

    const completedCount = updatedMilestones.filter(
      (m: MilestoneType) => m.completed,
    ).length;
    const progress =
      updatedMilestones.length > 0
        ? Math.round((completedCount / updatedMilestones.length) * 100)
        : goal.progress;

    const allCompleted =
      completedCount === updatedMilestones.length &&
      updatedMilestones.length > 0;
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
