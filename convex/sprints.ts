import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { today } from "./recurrence";

/**
 * Sprints belong to a project and carry its tasks.
 *
 * Progress is derived from the tasks pointing at the sprint rather than stored,
 * so it can never disagree with the board.
 */

export const listForProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const sprints = await ctx.db
      .query("sprints")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    return sprints
      .sort((a, b) => a.order - b.order)
      .map((s) => {
        const own = tasks.filter((t) => t.sprintId === s._id);
        const done = own.filter((t) => t.status === "done").length;
        return {
          ...s,
          taskCount: own.length,
          doneCount: done,
          progress: own.length ? Math.round((done / own.length) * 100) : 0,
          daysLeft:
            s.endDate && s.status !== "done"
              ? Math.round(
                  (new Date(s.endDate).getTime() - new Date(today()).getTime()) /
                    86_400_000
                )
              : null,
        };
      });
  },
});

export const createSprint = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    goal: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const siblings = await ctx.db
      .query("sprints")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return await ctx.db.insert("sprints", {
      ...args,
      name: args.name.trim() || `Sprint ${siblings.length + 1}`,
      // Only one sprint runs at a time; a new one is planned until started.
      status: siblings.some((s) => s.status === "active") ? "planned" : "active",
      order: siblings.length,
      createdAt: new Date().toISOString(),
    });
  },
});

export const updateSprint = mutation({
  args: {
    id: v.id("sprints"),
    name: v.optional(v.string()),
    goal: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    // Starting a sprint closes whichever one was running.
    if (fields.status === "active") {
      const sprint = await ctx.db.get(id);
      if (sprint) {
        const siblings = await ctx.db
          .query("sprints")
          .withIndex("by_project", (q) => q.eq("projectId", sprint.projectId))
          .collect();
        for (const s of siblings) {
          if (s._id !== id && s.status === "active") {
            await ctx.db.patch(s._id, { status: "done" });
          }
        }
      }
    }
    await ctx.db.patch(id, fields);
  },
});

/** Deleting a sprint returns its tasks to the backlog rather than removing them. */
export const removeSprint = mutation({
  args: { id: v.id("sprints") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db.query("tasks").collect();
    for (const t of tasks) {
      if (t.sprintId === args.id) {
        await ctx.db.patch(t._id, { sprintId: undefined });
      }
    }
    await ctx.db.delete(args.id);
  },
});

/** Move a task into a sprint, or out to the backlog with null. */
export const assignTask = mutation({
  args: {
    taskId: v.id("tasks"),
    sprintId: v.optional(v.id("sprints")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, { sprintId: args.sprintId });
  },
});
