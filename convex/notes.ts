import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// DEFAULT INITIAL SEED FOLDERS
export const SEED_FOLDERS = [
  { name: "Architecture & Systems", icon: "🏗️", order: 1 },
  { name: "LeetCode & Patterns", icon: "🧩", order: 2 },
  { name: "Military Service Log", icon: "🎖️", order: 3 },
  { name: "Ideas & Reflections", icon: "💡", order: 4 },
  { name: "Books & Summaries", icon: "📚", order: 5 },
];

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
    icon: v.string(),
    color: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("folders").collect();
    const id = await ctx.db.insert("folders", {
      name: args.name.trim(),
      icon: args.icon || "📁",
      color: args.color,
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
    icon: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      name: args.name.trim(),
      icon: args.icon || "📁",
    });
  },
});

// Mutation: Remove Folder
export const removeFolder = mutation({
  args: { id: v.id("folders") },
  handler: async (ctx, args) => {
    // Unlink notes in this folder
    const notesInFolder = await ctx.db
      .query("notes")
      .withIndex("by_folder", (q) => q.eq("folderId", args.id))
      .collect();

    for (const note of notesInFolder) {
      await ctx.db.patch(note._id, { folderId: undefined });
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

// Mutation: Seed defaults if empty
export const seedIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existingFolders = await ctx.db.query("folders").first();
    let firstFolderId = undefined;

    if (!existingFolders) {
      for (const f of SEED_FOLDERS) {
        const id = await ctx.db.insert("folders", {
          ...f,
          createdAt: new Date().toISOString(),
        });
        if (!firstFolderId) firstFolderId = id;
      }
    } else {
      firstFolderId = existingFolders._id;
    }

    const existingNotes = await ctx.db.query("notes").first();
    if (!existingNotes) {
      await ctx.db.insert("notes", {
        title: "Welcome to MOSHA Knowledge Base 🪐",
        content: `
          <h1>Precision Knowledge Architecture</h1>
          <p>Welcome to your personal digital sanctuary for notes, system architectures, research logs, and lifelong insights.</p>
          <h2>Key Capabilities</h2>
          <ul>
            <li><strong>Full Rich Text Formatting:</strong> Headings, bold, italic, highlights, lists, and code blocks.</li>
            <li><strong>Task Checklists:</strong> Interactive action items inside any note.</li>
            <li><strong>Folder & Topic Segregation:</strong> Group by Systems, LeetCode, Military, and Reflections.</li>
            <li><strong>Direct Goal Linking:</strong> Associate insights with your Major Life Goals.</li>
          </ul>
          <blockquote>"Knowledge is of two kinds. We know a subject ourselves, or we know where we can find information upon it."</blockquote>
        `,
        plainText: "Welcome to your personal digital sanctuary for notes, system architectures, research logs, and lifelong insights.",
        folderId: firstFolderId,
        isPinned: true,
        isFavorite: true,
        tags: ["sanctuary", "architecture"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return { seeded: true };
  },
});
