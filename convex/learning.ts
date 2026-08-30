import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { today } from "./recurrence";
import { LEARNING_ROOT, removeOwnedFolder, renameChildFolder } from "./folderPaths";

/**
 * Learning: tracks, the topics that make up their roadmap, and the resources
 * they are learned from.
 *
 * Progress is always derived from topic status — never stored — so a track's
 * percentage cannot drift from the roadmap it describes.
 */

export const RESOURCE_TYPES = ["course", "book", "video", "article", "pdf", "docs", "other"];

const progressOf = (topics: { status: string }[]) => {
  if (topics.length === 0) return 0;
  const done = topics.filter((t) => t.status === "done").length;
  return Math.round((done / topics.length) * 100);
};

// --- Tracks -----------------------------------------------------------------

export const listTracks = query({
  args: {},
  handler: async (ctx) => {
    const tracks = await ctx.db.query("learning_tracks").withIndex("by_order").collect();
    const topics = await ctx.db.query("learning_topics").collect();
    const resources = await ctx.db.query("learning_resources").collect();

    return tracks.map((t) => {
      const own = topics.filter((x) => x.trackId === t._id);
      return {
        ...t,
        topicCount: own.length,
        doneCount: own.filter((x) => x.status === "done").length,
        progress: progressOf(own),
        resourceCount: resources.filter((r) => r.trackId === t._id).length,
        /** The topic to pick up next: the one in progress, else the first unstarted. */
        nextTopic:
          own.sort((a, b) => a.order - b.order).find((x) => x.status === "learning") ??
          own.find((x) => x.status === "todo") ??
          null,
        lastStudiedAt: own
          .map((x) => x.lastStudiedAt)
          .filter(Boolean)
          .sort()
          .pop(),
      };
    });
  },
});

export const getTrack = query({
  args: { id: v.id("learning_tracks") },
  handler: async (ctx, args) => {
    const track = await ctx.db.get(args.id);
    if (!track) return null;

    const topics = (
      await ctx.db
        .query("learning_topics")
        .withIndex("by_track", (q) => q.eq("trackId", args.id))
        .collect()
    ).sort((a, b) => a.order - b.order);

    const resources = await ctx.db
      .query("learning_resources")
      .withIndex("by_track", (q) => q.eq("trackId", args.id))
      .collect();

    return { ...track, topics, resources, progress: progressOf(topics) };
  },
});

export const createTrack = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("learning_tracks").collect();
    return await ctx.db.insert("learning_tracks", {
      name: args.name.trim(),
      description: args.description,
      status: args.status ?? "active",
      order: existing.length,
      createdAt: new Date().toISOString(),
    });
  },
});

export const updateTrack = mutation({
  args: {
    id: v.id("learning_tracks"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...fields }) => {
    // A renamed track should not strand its notes under the old folder name.
    if (fields.name !== undefined) {
      const current = await ctx.db.get(id);
      if (current) await renameChildFolder(ctx, LEARNING_ROOT, current.name, fields.name);
    }
    await ctx.db.patch(id, fields);
  },
});

/** Removing a track takes its roadmap and its resource links with it. */
export const removeTrack = mutation({
  args: { id: v.id("learning_tracks") },
  handler: async (ctx, args) => {
    const track = await ctx.db.get(args.id);

    const topics = await ctx.db
      .query("learning_topics")
      .withIndex("by_track", (q) => q.eq("trackId", args.id))
      .collect();

    if (track) {
      const topicIds = new Set(topics.map((t) => String(t._id)));
      await removeOwnedFolder(ctx, LEARNING_ROOT, track.name, (n) =>
        Boolean(n.topicId && topicIds.has(String(n.topicId)))
      );
    }

    for (const t of topics) await ctx.db.delete(t._id);

    const resources = await ctx.db
      .query("learning_resources")
      .withIndex("by_track", (q) => q.eq("trackId", args.id))
      .collect();
    for (const r of resources) await ctx.db.delete(r._id);

    await ctx.db.delete(args.id);
  },
});

// --- Topics -----------------------------------------------------------------

export const createTopic = mutation({
  args: {
    trackId: v.id("learning_tracks"),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const siblings = await ctx.db
      .query("learning_topics")
      .withIndex("by_track", (q) => q.eq("trackId", args.trackId))
      .collect();

    return await ctx.db.insert("learning_topics", {
      trackId: args.trackId,
      title: args.title.trim(),
      description: args.description,
      status: "todo",
      order: siblings.length,
      createdAt: new Date().toISOString(),
    });
  },
});

export const updateTopic = mutation({
  args: {
    id: v.id("learning_topics"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...fields }) => {
    // Any real engagement with a topic counts as studying it today, which is
    // what the heatmap reflects. Reordering does not.
    const touched = fields.status !== undefined || fields.title !== undefined;

    await ctx.db.patch(id, {
      ...fields,
      ...(touched ? { lastStudiedAt: today() } : {}),
    });
  },
});

export const removeTopic = mutation({
  args: { id: v.id("learning_topics") },
  handler: async (ctx, args) => {
    // Resources pinned to this topic stay with the track, unpinned.
    const resources = await ctx.db
      .query("learning_resources")
      .withIndex("by_topic", (q) => q.eq("topicId", args.id))
      .collect();
    for (const r of resources) await ctx.db.patch(r._id, { topicId: undefined });

    await ctx.db.delete(args.id);
  },
});

/** Persist a reordered roadmap in one call. */
export const reorderTopics = mutation({
  args: { orderedIds: v.array(v.id("learning_topics")) },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { order: i });
    }
  },
});

// --- Resources --------------------------------------------------------------

export const listResources = query({
  args: {},
  handler: async (ctx) => {
    const resources = await ctx.db.query("learning_resources").collect();
    const tracks = await ctx.db.query("learning_tracks").collect();
    const topics = await ctx.db.query("learning_topics").collect();

    return resources.map((r) => ({
      ...r,
      trackName: tracks.find((t) => t._id === r.trackId)?.name ?? "—",
      topicTitle: r.topicId ? topics.find((t) => t._id === r.topicId)?.title : undefined,
    }));
  },
});

export const createResource = mutation({
  args: {
    trackId: v.id("learning_tracks"),
    topicId: v.optional(v.id("learning_topics")),
    title: v.string(),
    url: v.optional(v.string()),
    type: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("learning_resources", {
      ...args,
      title: args.title.trim(),
      status: "queued",
      createdAt: new Date().toISOString(),
    });
  },
});

export const updateResource = mutation({
  args: {
    id: v.id("learning_resources"),
    title: v.optional(v.string()),
    url: v.optional(v.string()),
    type: v.optional(v.string()),
    status: v.optional(v.string()),
    topicId: v.optional(v.id("learning_topics")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
  },
});

export const removeResource = mutation({
  args: { id: v.id("learning_resources") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
