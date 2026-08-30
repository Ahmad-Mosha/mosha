import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Query: List all projects
export const listProjects = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").withIndex("by_order").collect();
    const tasks = await ctx.db.query("tasks").collect();

    // Attach task count statistics to each project
    return projects.map((p) => {
      const projectTasks = tasks.filter((t) => t.projectId === p._id);
      const doneCount = projectTasks.filter((t) => t.status === "done").length;
      const totalCount = projectTasks.length;
      const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

      return {
        ...p,
        taskCount: totalCount,
        doneTaskCount: doneCount,
        progress,
      };
    });
  },
});

// Query: Get single project by ID with its tasks
export const getProject = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.id);
    if (!project) return null;

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();

    const notes = await ctx.db
      .query("notes")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();

    return {
      ...project,
      tasks,
      notes,
    };
  },
});

// Mutation: Create Project
export const createProject = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    status: v.string(), // "active" | "in_progress" | "planning" | "in_review" | "completed" | "on_hold"
    techStack: v.array(v.string()),
    githubUrl: v.optional(v.string()),
    liveUrl: v.optional(v.string()),
    devNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("projects").collect();
    const now = new Date().toISOString();

    const id = await ctx.db.insert("projects", {
      name: args.name.trim(),
      description: args.description.trim(),
      status: args.status,
      techStack: args.techStack,
      githubUrl: args.githubUrl,
      liveUrl: args.liveUrl,
      devNotes: args.devNotes || "",
      order: existing.length + 1,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

// Mutation: Update Project
export const updateProject = mutation({
  args: {
    id: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    techStack: v.optional(v.array(v.string())),
    githubUrl: v.optional(v.string()),
    liveUrl: v.optional(v.string()),
    devNotes: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, {
      ...fields,
      updatedAt: new Date().toISOString(),
    });
    return id;
  },
});

// Mutation: Remove Project
export const removeProject = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    // Unlink tasks
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();

    // Tasks survive the project — they move to the general list rather than
    // being destroyed. Their sprint link has to go with the sprints below.
    for (const t of tasks) {
      await ctx.db.patch(t._id, { projectId: undefined, sprintId: undefined });
    }

    const sprints = await ctx.db
      .query("sprints")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();
    for (const s of sprints) {
      await ctx.db.delete(s._id);
    }

    // Unlink notes
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();

    for (const n of notes) {
      await ctx.db.patch(n._id, { projectId: undefined });
    }

    await ctx.db.delete(args.id);
  },
});
