import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  isDoneForPeriod, nextOccurrence, nextStreak, recurrenceOf, today,
} from "./recurrence";

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
    recurrence: v.optional(v.string()),
    status: v.optional(v.string()),
    goalId: v.optional(v.id("major_life_goals")),
    projectId: v.optional(v.id("projects")),
    sprintId: v.optional(v.id("sprints")),
    labels: v.optional(v.array(v.string())),
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
    const rule = recurrenceOf({
      recurrence: args.recurrence,
      isDaily: args.isDaily,
    });
    const recurring = rule !== "none";
    const id = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      priority: args.priority,
      module: args.module,
      // A recurring task still needs a first due date to count periods from.
      dueDate: args.dueDate || (recurring ? today() : undefined),
      dueTime: args.dueTime,
      isDaily: recurring,
      recurrence: rule,
      status: args.status || "todo",
      streakCount: recurring ? 0 : undefined,
      goalId: args.goalId,
      projectId: args.projectId,
      sprintId: args.sprintId,
      labels: args.labels,
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
    sprintId: v.optional(v.id("sprints")),
    labels: v.optional(v.array(v.string())),
    isDaily: v.optional(v.boolean()),
    recurrence: v.optional(v.string()),
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
    // `isDaily` backs the by_daily index, so it must never drift from the rule.
    if (fields.recurrence !== undefined) {
      const rule = recurrenceOf({ recurrence: fields.recurrence });
      fields.isDaily = rule !== "none";
      if (rule === "none") fields.streakCount = 0;
    }
    await ctx.db.patch(id, fields);
  },
});

// Mutation: Toggle task completion status
export const toggle = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");

    const rule = recurrenceOf(task);

    if (rule === "none") {
      const nextStatus = task.status === "done" ? "todo" : "done";
      await ctx.db.patch(args.id, {
        status: nextStatus,
        completedAt: nextStatus === "done" ? new Date().toISOString() : undefined,
      });
      return;
    }

    // Recurring: completing rolls the due date to the next occurrence rather
    // than closing the task, so the habit stays live instead of disappearing.
    const now = today();

    if (isDoneForPeriod(task)) {
      await ctx.db.patch(args.id, {
        status: "todo",
        lastCompletedDate: undefined,
        streakCount: Math.max(0, (task.streakCount || 1) - 1),
        dueDate: now,
        completedAt: undefined,
      });
      return;
    }

    await ctx.db.patch(args.id, {
      status: "done",
      lastCompletedDate: now,
      streakCount: nextStreak(rule, task.lastCompletedDate, task.streakCount || 0, now),
      dueDate: nextOccurrence(rule, now),
      completedAt: new Date().toISOString(),
    });
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

/**
 * Drop a task into a column at a position. Status and order move together, so
 * a drag is one round trip and cannot leave the two out of sync.
 */
export const move = mutation({
  args: {
    id: v.id("tasks"),
    status: v.string(),
    /** Ids of every task in the destination column, in their new order. */
    orderedIds: v.array(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");

    // Ticking a recurring task by dragging it to Done must follow the same
    // rules as the checkbox, or the streak and next due date silently diverge.
    if (args.status === "done" && recurrenceOf(task) !== "none") {
      if (!isDoneForPeriod(task)) {
        const now = today();
        const rule = recurrenceOf(task);
        await ctx.db.patch(args.id, {
          status: "done",
          lastCompletedDate: now,
          streakCount: nextStreak(rule, task.lastCompletedDate, task.streakCount || 0, now),
          dueDate: nextOccurrence(rule, now),
          completedAt: new Date().toISOString(),
        });
      }
    } else {
      await ctx.db.patch(args.id, {
        status: args.status,
        completedAt: args.status === "done" ? new Date().toISOString() : undefined,
      });
    }

    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { order: i });
    }
  },
});

/** Persist a manual sort after a drag within the list view. */
export const reorder = mutation({
  args: { orderedIds: v.array(v.id("tasks")) },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { order: i });
    }
  },
});
