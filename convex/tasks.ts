import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tasks").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    isBigRock: v.boolean(),
    priority: v.string(),
    module: v.string(),
    dueDate: v.optional(v.string()),
    durationMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tasks", {
      ...args,
      status: "todo",
      createdAt: new Date().toISOString(),
    });
  },
});

export const toggle = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");
    const nextStatus = task.status === "done" ? "todo" : "done";
    await ctx.db.patch(args.id, {
      status: nextStatus,
      completedAt: nextStatus === "done" ? new Date().toISOString() : undefined,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
