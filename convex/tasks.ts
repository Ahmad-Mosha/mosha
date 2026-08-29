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

// Mutation: Create task
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.string(), // "p1_urgent" | "p2_medium" | "p3_low"
    module: v.string(), // "general" | "problems" | "learning" | "gym" | "career" | "goals" | "finance" | "personal"
    dueDate: v.optional(v.string()),
    dueTime: v.optional(v.string()),
    isDaily: v.optional(v.boolean()),
    status: v.optional(v.string()),
    goalId: v.optional(v.id("major_life_goals")),
    subtasks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          completed: v.boolean(),
        })
      )
    ),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const isDaily = Boolean(args.isDaily);
    const id = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      priority: args.priority,
      module: args.module,
      dueDate: isDaily ? undefined : args.dueDate,
      dueTime: args.dueTime,
      isDaily,
      status: args.status || "todo",
      streakCount: isDaily ? 0 : undefined,
      goalId: args.goalId,
      subtasks: args.subtasks,
      order: args.order,
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
    isDaily: v.optional(v.boolean()),
    streakCount: v.optional(v.number()),
    lastCompletedDate: v.optional(v.string()),
    goalId: v.optional(v.id("major_life_goals")),
    subtasks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          completed: v.boolean(),
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

// Mutation: Toggle task completion with streak calculation
export const toggle = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");

    const today = new Date().toISOString().split("T")[0];
    const nextStatus = task.status === "done" ? "todo" : "done";

    let streakCount = task.streakCount;
    if (task.isDaily) {
      if (nextStatus === "done") {
        streakCount = (task.streakCount || 0) + 1;
      } else {
        streakCount = Math.max(0, (task.streakCount || 1) - 1);
      }
    }

    await ctx.db.patch(args.id, {
      status: nextStatus,
      completedAt: nextStatus === "done" ? new Date().toISOString() : undefined,
      lastCompletedDate: nextStatus === "done" ? today : undefined,
      streakCount,
    });

    return { status: nextStatus, streakCount };
  },
});

// Mutation: Update status (for Kanban)
export const updateStatus = mutation({
  args: {
    id: v.id("tasks"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];
    await ctx.db.patch(args.id, {
      status: args.status,
      completedAt: args.status === "done" ? new Date().toISOString() : undefined,
      lastCompletedDate: args.status === "done" ? today : undefined,
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

// Mutation: Migrate and clean all legacy fields from database
export const cleanupLegacyFields = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("tasks").collect();
    let cleaned = 0;
    for (const doc of all) {
      // Re-insert clean document
      const cleanDoc = {
        title: doc.title,
        description: doc.description,
        status: doc.status || "todo",
        priority: doc.priority || "p2_medium",
        module: doc.module || "general",
        dueDate: doc.dueDate,
        dueTime: doc.dueTime,
        isDaily: Boolean(doc.isDaily),
        streakCount: doc.streakCount,
        lastCompletedDate: doc.lastCompletedDate,
        goalId: doc.goalId,
        subtasks: doc.subtasks,
        order: doc.order,
        completedAt: doc.completedAt,
        createdAt: doc.createdAt || new Date().toISOString(),
      };
      await ctx.db.replace(doc._id, cleanDoc);
      cleaned++;
    }
    return { cleaned };
  },
});
