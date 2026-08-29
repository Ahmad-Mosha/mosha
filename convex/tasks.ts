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
    module: v.string(), // "general" | "problems" | "learning" | "gym" | "career" | "goals" | "finance" | "personal" | "projects"
    dueDate: v.optional(v.string()),
    dueTime: v.optional(v.string()),
    isDaily: v.optional(v.boolean()),
    status: v.optional(v.string()),
    goalId: v.optional(v.id("major_life_goals")),
    projectId: v.optional(v.id("projects")),
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
      projectId: args.projectId,
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
    priority: v.optional(v.string()),
    module: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    dueTime: v.optional(v.string()),
    status: v.optional(v.string()),
    goalId: v.optional(v.id("major_life_goals")),
    projectId: v.optional(v.id("projects")),
    isDaily: v.optional(v.boolean()),
    streakCount: v.optional(v.number()),
    lastCompletedDate: v.optional(v.string()),
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
  },
});

// Mutation: Toggle task completion status
export const toggle = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");

    if (task.isDaily) {
      const today = new Date().toISOString().split("T")[0];
      const isAlreadyCompletedToday = task.lastCompletedDate === today;

      if (isAlreadyCompletedToday) {
        // Toggle back
        await ctx.db.patch(args.id, {
          status: "todo",
          lastCompletedDate: undefined,
          streakCount: Math.max(0, (task.streakCount || 1) - 1),
        });
      } else {
        // Increment streak
        await ctx.db.patch(args.id, {
          status: "done",
          lastCompletedDate: today,
          streakCount: (task.streakCount || 0) + 1,
          completedAt: new Date().toISOString(),
        });
      }
    } else {
      const nextStatus = task.status === "done" ? "todo" : "done";
      await ctx.db.patch(args.id, {
        status: nextStatus,
        completedAt: nextStatus === "done" ? new Date().toISOString() : undefined,
      });
    }
  },
});

// Mutation: Toggle subtask completion
export const toggleSubtask = mutation({
  args: {
    taskId: v.id("tasks"),
    subtaskId: v.string(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || !task.subtasks) throw new Error("Task or subtasks not found");

    const updatedSubtasks = task.subtasks.map((st) =>
      st.id === args.subtaskId ? { ...st, completed: !st.completed } : st
    );

    const allCompleted = updatedSubtasks.every((st) => st.completed);
    const nextStatus = allCompleted && updatedSubtasks.length > 0 ? "done" : task.status;

    await ctx.db.patch(args.taskId, {
      subtasks: updatedSubtasks,
      status: nextStatus,
      completedAt: nextStatus === "done" ? new Date().toISOString() : task.completedAt,
    });
  },
});

// Mutation: Remove task
export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Mutation: Update task status
export const updateStatus = mutation({
  args: {
    id: v.id("tasks"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const isDone = args.status === "done";
    await ctx.db.patch(args.id, {
      status: args.status,
      completedAt: isDone ? new Date().toISOString() : undefined,
    });
  },
});

// Mutation: Clear completed tasks
export const clearCompleted = mutation({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    const completed = tasks.filter((t) => t.status === "done" && !t.isDaily);
    for (const t of completed) {
      await ctx.db.delete(t._id);
    }
  },
});
