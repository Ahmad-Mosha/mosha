import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const DEFAULT_FINANCE = [
  {
    type: "savings_goal",
    title: "Marriage & Life Foundation Fund",
    amount: 15000,
    category: "Marriage Fund",
    date: new Date().toISOString().split("T")[0],
    notes: "Target: 50,000. Core pillar for housing and wedding readiness.",
    createdAt: new Date().toISOString(),
  },
  {
    type: "income",
    title: "Software Consulting / Engineering Stipend",
    amount: 2800,
    category: "Salary",
    date: new Date().toISOString().split("T")[0],
    notes: "Primary monthly cashflow",
    createdAt: new Date().toISOString(),
  },
  {
    type: "expense",
    title: "Cloud Servers & Development Subscriptions",
    amount: 120,
    category: "Tech",
    date: new Date().toISOString().split("T")[0],
    notes: "VPS, Domains, GitHub, Cursor",
    createdAt: new Date().toISOString(),
  },
];

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("finance_records").order("desc").collect();
  },
});

export const seedIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("finance_records").first();
    if (!existing) {
      for (const f of DEFAULT_FINANCE) {
        await ctx.db.insert("finance_records", f);
      }
    }
  },
});

export const create = mutation({
  args: {
    type: v.string(),
    title: v.string(),
    amount: v.number(),
    category: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("finance_records", {
      ...args,
      date: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
    });
  },
});
