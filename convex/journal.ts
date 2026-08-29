import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const DEFAULT_JOURNAL = [
  {
    title: "Why In-Memory Caches Need Strict Eviction & Backpressure",
    category: "architectural_decision",
    content: "When designing high-throughput services, unbounded in-memory maps lead to silent OOM kills. Always pair LRU/LFU cache with deterministic memory quotas and active ttl expirations.",
    tags: ["Systems", "Go", "Architecture"],
    date: new Date().toISOString().split("T")[0],
    createdAt: new Date().toISOString(),
  },
  {
    title: "Post-Mortem: Overcomplicating Graph Traversal in Coding Practice",
    category: "mistake_postmortem",
    content: "Mistake: tried to build topological sort with complex cycle recursion instead of Kahn's simple in-degree BFS. Lesson: always write down the invariant first before typing code.",
    tags: ["Algorithms", "Reflection"],
    date: new Date().toISOString().split("T")[0],
    createdAt: new Date().toISOString(),
  },
];

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("journal_entries").order("desc").collect();
  },
});

export const seedIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("journal_entries").first();
    if (!existing) {
      for (const j of DEFAULT_JOURNAL) {
        await ctx.db.insert("journal_entries", j);
      }
    }
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    category: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("journal_entries", {
      ...args,
      date: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
    });
  },
});
