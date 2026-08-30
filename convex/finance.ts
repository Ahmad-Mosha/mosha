import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { addDays, today } from "./recurrence";

/**
 * Finance answers two questions: where the money went, and how long what is
 * left lasts. Every figure here is derived from the ledger — nothing is a
 * stored total that can quietly disagree with the transactions behind it.
 */

const monthOf = (date: string) => date.slice(0, 7); // YYYY-MM

/** A recurring item's cost per month, so cadences can be compared. */
export const monthlyEquivalent = (amount: number, cadence: string) =>
  cadence === "weekly" ? (amount * 52) / 12 : cadence === "yearly" ? amount / 12 : amount;

// --- Config -----------------------------------------------------------------

export const getConfig = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("finance_config").collect())[0] ?? null,
});

export const setConfig = mutation({
  args: {
    currency: v.optional(v.string()),
    startingBalance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = (await ctx.db.query("finance_config").collect())[0];
    const patch = { ...args, updatedAt: new Date().toISOString() };
    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return await ctx.db.insert("finance_config", patch);
  },
});

// --- Transactions -----------------------------------------------------------

export const listRecords = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("finance_records").withIndex("by_date").collect();
    return rows.sort((a, b) => b.date.localeCompare(a.date));
  },
});

export const createRecord = mutation({
  args: {
    type: v.string(),
    title: v.string(),
    amount: v.number(),
    category: v.string(),
    date: v.optional(v.string()),
    notes: v.optional(v.string()),
    potId: v.optional(v.id("finance_pots")),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("finance_records", {
      ...args,
      title: args.title.trim(),
      category: args.category.trim() || "Uncategorised",
      // Amounts are always stored positive; `type` carries the direction.
      amount: Math.abs(args.amount),
      date: args.date || today(),
      createdAt: new Date().toISOString(),
    });

    // Money moved into a pot is money the pot now holds.
    if (args.potId) {
      const pot = await ctx.db.get(args.potId);
      if (pot) {
        await ctx.db.patch(args.potId, {
          currentAmount: pot.currentAmount + Math.abs(args.amount),
        });
      }
    }
    return id;
  },
});

export const updateRecord = mutation({
  args: {
    id: v.id("finance_records"),
    type: v.optional(v.string()),
    title: v.optional(v.string()),
    amount: v.optional(v.number()),
    category: v.optional(v.string()),
    date: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, {
      ...fields,
      ...(fields.amount !== undefined ? { amount: Math.abs(fields.amount) } : {}),
    });
  },
});

export const removeRecord = mutation({
  args: { id: v.id("finance_records") },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    // Deleting a contribution has to take it back out of the pot.
    if (row?.potId) {
      const pot = await ctx.db.get(row.potId);
      if (pot) {
        await ctx.db.patch(row.potId, {
          currentAmount: Math.max(0, pot.currentAmount - row.amount),
        });
      }
    }
    await ctx.db.delete(args.id);
  },
});

// --- Recurring --------------------------------------------------------------

export const listRecurring = query({
  args: {},
  handler: async (ctx) => ctx.db.query("finance_recurring").collect(),
});

export const createRecurring = mutation({
  args: {
    type: v.string(),
    title: v.string(),
    amount: v.number(),
    category: v.string(),
    cadence: v.string(),
    dayOfMonth: v.optional(v.number()),
  },
  handler: async (ctx, args) =>
    ctx.db.insert("finance_recurring", {
      ...args,
      title: args.title.trim(),
      amount: Math.abs(args.amount),
      active: true,
      createdAt: new Date().toISOString(),
    }),
});

export const updateRecurring = mutation({
  args: {
    id: v.id("finance_recurring"),
    title: v.optional(v.string()),
    amount: v.optional(v.number()),
    category: v.optional(v.string()),
    cadence: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
  },
});

export const removeRecurring = mutation({
  args: { id: v.id("finance_recurring") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

/** Post a recurring item into the ledger for a given date. */
export const postRecurring = mutation({
  args: { id: v.id("finance_recurring"), date: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const r = await ctx.db.get(args.id);
    if (!r) throw new Error("Not found");
    return await ctx.db.insert("finance_records", {
      type: r.type,
      title: r.title,
      amount: r.amount,
      category: r.category,
      date: args.date || today(),
      recurringId: r._id,
      createdAt: new Date().toISOString(),
    });
  },
});

// --- Pots -------------------------------------------------------------------

export const listPots = query({
  args: {},
  handler: async (ctx) => {
    const pots = await ctx.db.query("finance_pots").collect();
    const goals = await ctx.db.query("major_life_goals").collect();
    return pots.map((p) => ({
      ...p,
      progress: p.targetAmount > 0
        ? Math.min(100, Math.round((p.currentAmount / p.targetAmount) * 100))
        : 0,
      goalTitle: p.goalId ? goals.find((g) => g._id === p.goalId)?.title : undefined,
    }));
  },
});

export const createPot = mutation({
  args: {
    name: v.string(),
    targetAmount: v.number(),
    currentAmount: v.optional(v.number()),
    goalId: v.optional(v.id("major_life_goals")),
    targetDate: v.optional(v.string()),
  },
  handler: async (ctx, args) =>
    ctx.db.insert("finance_pots", {
      ...args,
      name: args.name.trim(),
      currentAmount: args.currentAmount ?? 0,
      createdAt: new Date().toISOString(),
    }),
});

export const updatePot = mutation({
  args: {
    id: v.id("finance_pots"),
    name: v.optional(v.string()),
    targetAmount: v.optional(v.number()),
    currentAmount: v.optional(v.number()),
    goalId: v.optional(v.id("major_life_goals")),
    targetDate: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
  },
});

export const removePot = mutation({
  args: { id: v.id("finance_pots") },
  handler: async (ctx, args) => {
    const records = await ctx.db.query("finance_records").collect();
    for (const r of records) {
      if (r.potId === args.id) await ctx.db.patch(r._id, { potId: undefined });
    }
    await ctx.db.delete(args.id);
  },
});

// --- Derived ----------------------------------------------------------------

/** Everything the overview needs, computed from the ledger in one pass. */
export const summary = query({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db.query("finance_records").collect();
    const recurring = await ctx.db.query("finance_recurring").collect();
    const pots = await ctx.db.query("finance_pots").collect();
    const config = (await ctx.db.query("finance_config").collect())[0];

    const now = today();
    const thisMonth = monthOf(now);
    const month = records.filter((r) => monthOf(r.date) === thisMonth);

    const sum = (rows: typeof records, type: string) =>
      rows.filter((r) => r.type === type).reduce((n, r) => n + r.amount, 0);

    const incomeThisMonth = sum(month, "income");
    const spentThisMonth = sum(month, "expense");

    // Averaged over the last 90 days rather than this month alone, so an
    // unusually quiet or expensive month does not distort the runway.
    const since = addDays(now, -90);
    const recent = records.filter((r) => r.date >= since && r.type === "expense");
    const observedMonthlyBurn = recent.reduce((n, r) => n + r.amount, 0) / 3;

    const fixedMonthly = recurring
      .filter((r) => r.active && r.type === "expense")
      .reduce((n, r) => n + monthlyEquivalent(r.amount, r.cadence), 0);

    const balance =
      (config?.startingBalance ?? 0) + sum(records, "income") - sum(records, "expense");

    const burn = Math.max(observedMonthlyBurn, fixedMonthly);
    const runwayMonths = burn > 0 ? Number((balance / burn).toFixed(1)) : null;

    // By category, this month, biggest first — the useful ordering.
    const byCategory: Record<string, number> = {};
    for (const r of month) {
      if (r.type !== "expense") continue;
      byCategory[r.category] = (byCategory[r.category] ?? 0) + r.amount;
    }

    return {
      currency: config?.currency ?? "EGP",
      balance,
      incomeThisMonth,
      spentThisMonth,
      netThisMonth: incomeThisMonth - spentThisMonth,
      fixedMonthly,
      observedMonthlyBurn,
      runwayMonths,
      savedTotal: pots.reduce((n, p) => n + p.currentAmount, 0),
      categories: Object.entries(byCategory)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount),
      /** Net per month for the last six, for the trend bars. */
      trend: Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const rows = records.filter((r) => monthOf(r.date) === key);
        return { month: key, net: sum(rows, "income") - sum(rows, "expense") };
      }),
    };
  },
});
