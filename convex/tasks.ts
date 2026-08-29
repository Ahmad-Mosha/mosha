import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Query: List all tasks
export const list = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db
      .query("tasks")
      .order("desc")
      .collect();
    return tasks;
  },
});

// Mutation: Create task (clean & backward-compatible)
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.string(), // "p1_urgent" | "p2_medium" | "p3_low"
    module: v.string(), // "general" | "goals" | "problems" | "learning" | "gym" | "career" | "finance" | "personal"
    dueDate: v.optional(v.string()),
    dueTime: v.optional(v.string()),
    status: v.optional(v.string()),
    subtasks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          completed: v.boolean(),
        })
      )
    ),
    tags: v.optional(v.array(v.string())),
    isBigRock: v.optional(v.boolean()),
    durationMinutes: v.optional(v.number()),
    estimatedMinutes: v.optional(v.number()),
    goalId: v.optional(v.id("major_life_goals")),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("tasks", {
      ...args,
      status: args.status || "todo",
      createdAt: new Date().toISOString(),
    });
    return id;
  },
});

// Mutation: Update task
export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    module: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    dueTime: v.optional(v.string()),
    subtasks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          completed: v.boolean(),
        })
      )
    ),
    tags: v.optional(v.array(v.string())),
    isBigRock: v.optional(v.boolean()),
    durationMinutes: v.optional(v.number()),
    estimatedMinutes: v.optional(v.number()),
    goalId: v.optional(v.id("major_life_goals")),
    order: v.optional(v.number()),
    completedAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
    return id;
  },
});

// Mutation: Toggle task completion
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
    return { status: nextStatus };
  },
});

// Mutation: Update status
export const updateStatus = mutation({
  args: {
    id: v.id("tasks"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      completedAt: args.status === "done" ? new Date().toISOString() : undefined,
    });
  },
});

// Mutation: Toggle subtask
export const toggleSubtask = mutation({
  args: {
    taskId: v.id("tasks"),
    subtaskId: v.string(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || !task.subtasks) return;

    const updated = task.subtasks.map((st) => {
      if (st.id === args.subtaskId) {
        return { ...st, completed: !st.completed };
      }
      return st;
    });

    await ctx.db.patch(args.taskId, { subtasks: updated });
  },
});

// Mutation: Delete task
export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Mutation: Clear all completed tasks
export const clearCompleted = mutation({
  args: {},
  handler: async (ctx) => {
    const doneTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "done"))
      .collect();

    for (const t of doneTasks) {
      await ctx.db.delete(t._id);
    }
    return { cleared: doneTasks.length };
  },
});
