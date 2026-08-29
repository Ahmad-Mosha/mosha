import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const DEFAULT_TOPICS = [
  {
    subject: "Operating Systems",
    title: "Virtual Memory, Paging & TLB Mechanics",
    description: "Multi-level page tables, demand paging, TLB hit/miss latency, and page replacement algorithms.",
    status: "in_progress",
    progress: 70,
    notes: "Review Linux page fault handling in kernel space.",
    resources: [
      { title: "OSTEP: Operating Systems Three Easy Pieces", url: "https://pages.cs.wisc.edu/~remzi/OSTEP/", type: "book" },
    ],
    order: 1,
    createdAt: new Date().toISOString(),
  },
  {
    subject: "Databases",
    title: "Storage Engines: B+ Trees vs LSM Trees",
    description: "Write amplification, compaction strategies (Leveled vs Tiered), and WAL crash recovery.",
    status: "mastered",
    progress: 100,
    notes: "LSM excels at high write throughput (SSTables); B+ Tree excels at random read latency.",
    resources: [
      { title: "Designing Data-Intensive Applications (DDIA)", url: "https://dataintensive.net/", type: "book" },
    ],
    order: 2,
    createdAt: new Date().toISOString(),
  },
  {
    subject: "Go",
    title: "Goroutines, Channels & Runtime Scheduler (GMP Model)",
    description: "Goroutines multiplexed on OS threads (M) via logical processors (P). Work stealing algorithm.",
    status: "in_progress",
    progress: 85,
    notes: "Preemption in Go 1.14+ via asynchronous OS signals (SIGURG).",
    resources: [
      { title: "Go Under The Hood", url: "https://golang.design/under-the-hood/", type: "doc" },
    ],
    order: 3,
    createdAt: new Date().toISOString(),
  },
];

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("learning_topics").order("asc").collect();
  },
});

export const seedIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("learning_topics").first();
    if (!existing) {
      for (const t of DEFAULT_TOPICS) {
        await ctx.db.insert("learning_topics", t);
      }
    }
  },
});

export const updateProgress = mutation({
  args: {
    id: v.id("learning_topics"),
    progress: v.number(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      progress: args.progress,
      status: args.status,
    });
  },
});
