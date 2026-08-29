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
    version: v.optional(v.string()),
    branch: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    liveUrl: v.optional(v.string()),
    devNotes: v.optional(v.string()),
    goalId: v.optional(v.id("major_life_goals")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("projects").collect();
    const now = new Date().toISOString();

    const id = await ctx.db.insert("projects", {
      name: args.name.trim(),
      description: args.description.trim(),
      status: args.status,
      techStack: args.techStack,
      version: args.version || "v1.0.0",
      branch: args.branch || "main",
      githubUrl: args.githubUrl,
      liveUrl: args.liveUrl,
      devNotes: args.devNotes || "",
      goalId: args.goalId,
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
    version: v.optional(v.string()),
    branch: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    liveUrl: v.optional(v.string()),
    devNotes: v.optional(v.string()),
    goalId: v.optional(v.id("major_life_goals")),
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

    for (const t of tasks) {
      await ctx.db.patch(t._id, { projectId: undefined });
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

// Mutation: Seed Projects matching Stitch Screen
export const seedProjects = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("projects").collect();
    if (existing.length > 0) return { alreadySeeded: true };

    const now = new Date().toISOString();

    // 1. Nexus API Gateway
    const p1 = await ctx.db.insert("projects", {
      name: "Nexus API Gateway",
      description: "High-throughput rust microservice for routing internal data streams and handling auth delegation.",
      status: "active",
      techStack: ["Rust", "gRPC", "Redis"],
      version: "v1.4.2",
      branch: "feature/grpc-multiplexing",
      githubUrl: "https://github.com/mosha/nexus-gateway",
      devNotes: `<h3>Architecture & Protobuf Definitions</h3><p>Ensure we update the protobuf definitions in the shared repo before deploying the multiplexing branch to staging. The current schema drops field <code>origin_ip</code> causing 400s.</p><ul><li>Connection pooling with Redis Cluster via deadpool-redis</li><li>p99 latency target: &lt; 15ms</li></ul>`,
      order: 1,
      createdAt: now,
      updatedAt: now,
    });

    // Add initial tasks for Nexus API Gateway
    await ctx.db.insert("tasks", {
      title: "Implement connection pooling for Redis cluster",
      description: "Set up deadpool-redis with healthcheck pings",
      status: "in_progress",
      priority: "p1_urgent",
      module: "projects",
      projectId: p1,
      isDaily: false,
      createdAt: now,
    });

    await ctx.db.insert("tasks", {
      title: "Refactor payload validation schema",
      description: "Ensure protobuf compatibility",
      status: "done",
      priority: "p2_medium",
      module: "projects",
      projectId: p1,
      isDaily: false,
      completedAt: now,
      createdAt: now,
    });

    await ctx.db.insert("tasks", {
      title: "Write unit tests for authentication middleware",
      description: "Coverage target > 90%",
      status: "todo",
      priority: "p3_low",
      module: "projects",
      projectId: p1,
      isDaily: false,
      createdAt: now,
    });

    // 2. Web UI Kit Core
    const p2 = await ctx.db.insert("projects", {
      name: "Web UI Kit Core",
      description: "Shared React component library utilizing Radix primitives and Tailwind for the new dashboard overhaul.",
      status: "active",
      techStack: ["React", "Tailwind", "TypeScript"],
      version: "v2.1.0",
      branch: "main",
      githubUrl: "https://github.com/mosha/ui-kit",
      order: 2,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("tasks", {
      title: "Migrate Dialog component to Radix UI 2.0",
      status: "todo",
      priority: "p2_medium",
      module: "projects",
      projectId: p2,
      isDaily: false,
      createdAt: now,
    });

    // 3. Log Ingestion Pipeline
    const p3 = await ctx.db.insert("projects", {
      name: "Log Ingestion Pipeline",
      description: "ETL workers for aggregating server metrics and application logs into Elasticsearch.",
      status: "active",
      techStack: ["Go", "Kafka", "Elastic"],
      version: "v0.9.8",
      branch: "main",
      order: 3,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("tasks", {
      title: "Tune Kafka partition consumers for peak load",
      status: "todo",
      priority: "p1_urgent",
      module: "projects",
      projectId: p3,
      isDaily: false,
      createdAt: now,
    });

    return { seeded: true };
  },
});
