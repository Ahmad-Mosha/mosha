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

// Mutation: Remove Folder (and all subfolders and notes unlinked)
export const removeFolder = mutation({
  args: { id: v.id("folders") },
  handler: async (ctx, args) => {
    // 1. Unlink or delete notes in this folder
    const notesInFolder = await ctx.db
      .query("notes")
      .withIndex("by_folder", (q) => q.eq("folderId", args.id))
      .collect();

    for (const note of notesInFolder) {
      await ctx.db.delete(note._id);
    }

    // 2. Also recursively delete any subfolders and their notes
    const subfolders = await ctx.db
      .query("folders")
      .withIndex("by_parent", (q) => q.eq("parentId", args.id))
      .collect();

    for (const sub of subfolders) {
      const subNotes = await ctx.db
        .query("notes")
        .withIndex("by_folder", (q) => q.eq("folderId", sub._id))
        .collect();
      for (const sn of subNotes) {
        await ctx.db.delete(sn._id);
      }
      await ctx.db.delete(sub._id);
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

// Mutation: Clear all folders
export const clearAllFolders = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("folders").collect();
    for (const f of all) {
      await ctx.db.delete(f._id);
    }
    return { deleted: all.length };
  },
});
