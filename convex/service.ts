import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Military service: which days are spent at home, and how long is left.
 *
 * Only the exceptions are stored. A day is "at base" unless a period says
 * otherwise, which is how service actually works — base is the default state
 * and leave is the thing you count.
 */

export const getConfig = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("service_config").collect();
    return rows[0] ?? null;
  },
});

export const setConfig = mutation({
  args: {
    dischargeDate: v.optional(v.string()),
    serviceStartDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = (await ctx.db.query("service_config").collect())[0];
    const patch = { ...args, updatedAt: new Date().toISOString() };
    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return await ctx.db.insert("service_config", patch);
  },
});

export const listPeriods = query({
  args: {},
  handler: async (ctx) => ctx.db.query("service_periods").withIndex("by_start").collect(),
});

export const addPeriod = mutation({
  args: {
    kind: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    label: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Tolerate a range picked backwards rather than rejecting it.
    const [startDate, endDate] =
      args.startDate <= args.endDate
        ? [args.startDate, args.endDate]
        : [args.endDate, args.startDate];

    return await ctx.db.insert("service_periods", {
      kind: args.kind,
      startDate,
      endDate,
      label: args.label,
      createdAt: new Date().toISOString(),
    });
  },
});

export const updatePeriod = mutation({
  args: {
    id: v.id("service_periods"),
    kind: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    label: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
  },
});

export const removePeriod = mutation({
  args: { id: v.id("service_periods") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

/**
 * Replace the rotation-generated periods in one shot.
 *
 * The rule itself is expanded on the client (src/lib/service.ts, where it is
 * unit-tested) and this only persists the result, so the date maths has a
 * single home. Hand-marked periods are untouched — only `source: "cycle"`
 * rows are cleared, so a one-off leave you added by hand survives a
 * regenerate.
 */
export const replaceCycle = mutation({
  args: {
    rule: v.object({
      anchor: v.string(),
      anchorPhase: v.string(),
      baseDays: v.number(),
      homeDays: v.number(),
    }),
    periods: v.array(
      v.object({
        kind: v.string(),
        startDate: v.string(),
        endDate: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("service_periods").collect();
    for (const p of existing) {
      if (p.source === "cycle") await ctx.db.delete(p._id);
    }

    const now = new Date().toISOString();
    for (const p of args.periods) {
      await ctx.db.insert("service_periods", { ...p, source: "cycle", createdAt: now });
    }

    const config = (await ctx.db.query("service_config").collect())[0];
    const rulePatch = {
      cycleAnchor: args.rule.anchor,
      cycleAnchorPhase: args.rule.anchorPhase,
      cycleBaseDays: args.rule.baseDays,
      cycleHomeDays: args.rule.homeDays,
      updatedAt: now,
    };
    if (config) await ctx.db.patch(config._id, rulePatch);
    else await ctx.db.insert("service_config", rulePatch);

    return args.periods.length;
  },
});

/** Drop the generated rotation, leaving hand-marked periods alone. */
export const clearCycle = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("service_periods").collect();
    let removed = 0;
    for (const p of existing) {
      if (p.source === "cycle") {
        await ctx.db.delete(p._id);
        removed++;
      }
    }
    return removed;
  },
});
