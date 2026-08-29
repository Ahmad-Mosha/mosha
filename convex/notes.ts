import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Query: List all folders
export const listFolders = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("folders").withIndex("by_order").collect();
  },
});

// Mutation: Create Folder
export const createFolder = mutation({
  args: {
    name: v.string(),
    icon: v.optional(v.string()),
    parentId: v.optional(v.id("folders")),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("folders").collect();
    const id = await ctx.db.insert("folders", {
      name: args.name.trim(),
      icon: args.icon || "folder",
      parentId: args.parentId,
      order: args.order ?? existing.length + 1,
      createdAt: new Date().toISOString(),
    });
    return id;
  },
});

// Mutation: Update Folder
export const updateFolder = mutation({
  args: {
    id: v.id("folders"),
    name: v.string(),
    icon: v.optional(v.string()),
    parentId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      name: args.name.trim(),
      icon: args.icon || "folder",
      parentId: args.parentId,
    });
  },
});

// Mutation: Remove Folder (and subfolders)
export const removeFolder = mutation({
  args: { id: v.id("folders") },
  handler: async (ctx, args) => {
    // 1. Unlink notes in this folder
    const notesInFolder = await ctx.db
      .query("notes")
      .withIndex("by_folder", (q) => q.eq("folderId", args.id))
      .collect();

    for (const note of notesInFolder) {
      await ctx.db.patch(note._id, { folderId: undefined });
    }

    // 2. Unlink subfolders or remove
    const subfolders = await ctx.db
      .query("folders")
      .withIndex("by_parent", (q) => q.eq("parentId", args.id))
      .collect();

    for (const sub of subfolders) {
      await ctx.db.patch(sub._id, { parentId: undefined });
    }

    await ctx.db.delete(args.id);
  },
});

// Query: List all notes
export const listNotes = query({
  args: {},
  handler: async (ctx) => {
    const notes = await ctx.db
      .query("notes")
      .order("desc")
      .collect();
    return notes;
  },
});

// Query: Get single note
export const getNote = query({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Mutation: Create Note
export const createNote = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    plainText: v.optional(v.string()),
    folderId: v.optional(v.id("folders")),
    isPinned: v.optional(v.boolean()),
    isFavorite: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    goalId: v.optional(v.id("major_life_goals")),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const id = await ctx.db.insert("notes", {
      title: args.title.trim() || "Untitled Note",
      content: args.content,
      plainText: args.plainText || "",
      folderId: args.folderId,
      isPinned: args.isPinned || false,
      isFavorite: args.isFavorite || false,
      tags: args.tags || [],
      goalId: args.goalId,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

// Mutation: Update Note
export const updateNote = mutation({
  args: {
    id: v.id("notes"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    plainText: v.optional(v.string()),
    folderId: v.optional(v.id("folders")),
    isPinned: v.optional(v.boolean()),
    isFavorite: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    goalId: v.optional(v.id("major_life_goals")),
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

// Mutation: Toggle Pinned
export const togglePinned = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.id);
    if (!note) throw new Error("Note not found");
    await ctx.db.patch(args.id, { isPinned: !note.isPinned });
  },
});

// Mutation: Toggle Favorite
export const toggleFavorite = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.id);
    if (!note) throw new Error("Note not found");
    await ctx.db.patch(args.id, { isFavorite: !note.isFavorite });
  },
});

// Mutation: Remove Note
export const removeNote = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Mutation: Seed defaults matching the Stitch Design exactly
export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear old notes and folders to re-seed clean matching Stitch
    const oldFolders = await ctx.db.query("folders").collect();
    for (const f of oldFolders) await ctx.db.delete(f._id);
    const oldNotes = await ctx.db.query("notes").collect();
    for (const n of oldNotes) await ctx.db.delete(n._id);

    // 1. Parent: Engineering
    const engId = await ctx.db.insert("folders", {
      name: "Engineering",
      icon: "folder",
      order: 1,
      createdAt: new Date().toISOString(),
    });

    const archId = await ctx.db.insert("folders", {
      name: "Architecture",
      icon: "folder",
      parentId: engId,
      order: 2,
      createdAt: new Date().toISOString(),
    });

    await ctx.db.insert("folders", {
      name: "Deployment",
      icon: "folder",
      parentId: engId,
      order: 3,
      createdAt: new Date().toISOString(),
    });

    await ctx.db.insert("folders", {
      name: "Code Snippets",
      icon: "folder",
      parentId: engId,
      order: 4,
      createdAt: new Date().toISOString(),
    });

    // 2. Parent: Personal
    const personalId = await ctx.db.insert("folders", {
      name: "Personal",
      icon: "folder",
      order: 5,
      createdAt: new Date().toISOString(),
    });

    await ctx.db.insert("folders", {
      name: "Reflections",
      icon: "folder",
      parentId: personalId,
      order: 6,
      createdAt: new Date().toISOString(),
    });

    await ctx.db.insert("folders", {
      name: "Military Log",
      icon: "folder",
      parentId: personalId,
      order: 7,
      createdAt: new Date().toISOString(),
    });

    // 3. Ideas
    await ctx.db.insert("folders", {
      name: "Ideas",
      icon: "folder",
      order: 8,
      createdAt: new Date().toISOString(),
    });

    // 4. Resources
    await ctx.db.insert("folders", {
      name: "Resources",
      icon: "folder",
      order: 9,
      createdAt: new Date().toISOString(),
    });

    // Insert Stitch Screen 3 default cards
    const now = new Date().toISOString();

    await ctx.db.insert("notes", {
      title: "System Design: Microservices Transition Plan",
      content: `
        <h1>System Design: Microservices Transition Plan</h1>
        <p>Draft outlining the phased approach to migrating the monolithic architecture to microservices.</p>
        <h2>Phase 1 Objectives</h2>
        <ul>
          <li>Decouple the user authentication service and establish the API gateway.</li>
          <li>Establish distributed tracing using OpenTelemetry.</li>
          <li>Implement database per service pattern with event-driven sync.</li>
        </ul>
        <blockquote><p>💡 <strong>Tip:</strong> Review dependencies carefully before extracting database boundaries.</p></blockquote>
      `,
      plainText: "Draft outlining the phased approach to migrating the monolithic architecture to microservices. Phase 1 focuses on decoupling the user authentication service and establishing the API gateway. Review dependencies carefully.",
      folderId: archId,
      isPinned: true,
      isFavorite: false,
      tags: ["architecture", "draft"],
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("notes", {
      title: "Database Schema Revisions V2",
      content: `
        <h1>Database Schema Revisions V2</h1>
        <p>Updated ERD notes following yesterday's review.</p>
        <ul>
          <li>Add index to <code>user_id</code> on transaction table to improve query latency.</li>
          <li>Consider partitioning large historical log tables by month.</li>
          <li>Implement connection pooling with PgBouncer.</li>
        </ul>
      `,
      plainText: "Updated ERD notes following yesterday's review. Need to add index to user_id on transaction table to improve query latency. Consider partitioning large historical log tables by month.",
      folderId: archId,
      isPinned: false,
      isFavorite: false,
      tags: ["database", "performance"],
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("notes", {
      title: "API Rate Limiting Strategy",
      content: `
        <h1>API Rate Limiting Strategy</h1>
        <p>Implementing token bucket algorithm using Redis cluster.</p>
        <ul>
          <li>Current threshold: 100 req/min for free tier, 1000 req/min for premium.</li>
          <li>Handle edge cases where Redis cluster fails over gracefully.</li>
        </ul>
      `,
      plainText: "Implementing token bucket algorithm using Redis. Current threshold set to 100 req/min for free tier, 1000 req/min for premium. Need to handle edge cases where Redis cluster fails over.",
      folderId: archId,
      isPinned: false,
      isFavorite: true,
      tags: ["api", "security"],
      createdAt: now,
      updatedAt: now,
    });

    return { seeded: true };
  },
});

// Mutation: Clear all notes
export const clearAllNotes = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("notes").collect();
    for (const n of all) {
      await ctx.db.delete(n._id);
    }
    return { deleted: all.length };
  },
});
