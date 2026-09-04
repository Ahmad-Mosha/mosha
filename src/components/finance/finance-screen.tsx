"use client";

import React, { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import {
  ArrowDownRight, ArrowUpRight, Check, Pencil, PiggyBank, Plus, Repeat, Target, Trash2, Wallet,
} from "lucide-react";
import { Select } from "@/components/ui/select";
import { TagInput } from "@/components/ui/tag-input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { today } from "../../../convex/recurrence";

type Tab = "ledger" | "recurring" | "pots" | "wishlist";

const TYPE_OPTIONS = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
];

const CADENCE_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "yearly", label: "Yearly" },
];

export function FinanceScreen() {
  const records = useQuery(api.finance.listRecords) ?? [];
  const recurring = useQuery(api.finance.listRecurring) ?? [];
  const pots = useQuery(api.finance.listPots) ?? [];
  const wishlist = useQuery(api.finance.listWishlist) ?? [];
  const goals = useQuery(api.goals.list) ?? [];
  const stats = useQuery(api.finance.summary);
  const config = useQuery(api.finance.getConfig);

  const setConfig = useMutation(api.finance.setConfig);
  const createRecord = useMutation(api.finance.createRecord);
  const removeRecord = useMutation(api.finance.removeRecord);

  const [tab, setTab] = useState<Tab>("ledger");
  const [editingBalance, setEditingBalance] = useState(false);
  const [balanceDraft, setBalanceDraft] = useState("");

  const cur = stats?.currency ?? "EGP";
  const money = (n: number) =>
    `${n < 0 ? "−" : ""}${Math.abs(Math.round(n)).toLocaleString()} ${cur}`;

  /** Categories you have actually used, offered when adding. */
  const knownCategories = useMemo(
    () => Array.from(new Set(records.map((r: any) => r.category).filter(Boolean))).sort() as string[],
    [records]
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="font-serif text-display font-bold text-ink">Finance</h1>
          <p className="mt-0.5 text-label text-faint">
            Where the money went, and how long what is left lasts.
          </p>
        </div>

        <div className="flex items-center gap-5">
          <Stat label="Balance" value={money(stats?.balance ?? 0)} />
          <Stat
            label="This month"
            value={money(stats?.netThisMonth ?? 0)}
            tone={(stats?.netThisMonth ?? 0) >= 0 ? "text-success" : "text-danger"}
          />
          <Stat
            label="Runway"
            value={stats?.runwayMonths != null ? `${stats.runwayMonths}` : "—"}
            sub="months"
          />
          <Stat label="Saved" value={money(stats?.savedTotal ?? 0)} icon={<PiggyBank className="h-3.5 w-3.5 text-info" />} />
        </div>
      </header>

      {/* Runway is the number that changes decisions, so it leads. */}
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3 rounded-xl border border-line bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-mono text-meta font-semibold uppercase text-faint">
              Last six months
            </h2>
            <button
              onClick={() => {
                setBalanceDraft(String(config?.startingBalance ?? ""));
                setEditingBalance(true);
              }}
              className="flex items-center gap-1.5 font-mono text-meta text-ghost hover:text-ink cursor-pointer"
            >
              <Pencil className="h-3 w-3" /> starting balance
            </button>
          </div>

          {editingBalance && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await setConfig({ startingBalance: Number(balanceDraft) || 0, currency: cur });
                setEditingBalance(false);
                toast.success("Balance updated");
              }}
              className="flex items-end gap-2"
            >
              <input
                autoFocus type="number" value={balanceDraft}
                onChange={(e) => setBalanceDraft(e.target.value)}
                placeholder="What you have right now"
                className="w-40 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-label text-ink outline-none focus:border-accent"
              />
              <button type="submit" className="rounded-lg bg-accent px-3 py-1.5 text-label font-semibold text-accent-fg cursor-pointer">
                Save
              </button>
              <button type="button" onClick={() => setEditingBalance(false)} className="font-mono text-meta text-ghost hover:text-ink cursor-pointer">
                cancel
              </button>
            </form>
          )}

          <MonthlyTrend trend={stats?.trend ?? []} money={money} />

          <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-line pt-3 font-mono text-meta text-ghost">
            <span>fixed costs {money(stats?.fixedMonthly ?? 0)}/mo</span>
            <span>observed burn {money(stats?.observedMonthlyBurn ?? 0)}/mo</span>
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-line bg-surface p-4">
          <h2 className="font-mono text-meta font-semibold uppercase text-faint">
            Where it went this month
          </h2>
          {(stats?.categories ?? []).length === 0 ? (
            <p className="py-8 text-center text-label text-ghost">Nothing spent yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {stats!.categories.slice(0, 6).map((c: any) => {
                const pct = stats!.spentThisMonth
                  ? Math.round((c.amount / stats!.spentThisMonth) * 100)
                  : 0;
                return (
                  <li key={c.name} className="space-y-1">
                    <div className="flex items-center justify-between text-label">
                      <span className="truncate text-ink-2">{c.name}</span>
                      <span className="shrink-0 font-mono text-meta text-faint">{money(c.amount)}</span>
                    </div>
                    <span className="block h-1 overflow-hidden rounded-full bg-subtle-2">
                      <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <div className="flex gap-1 border-b border-line">
        {(["ledger", "recurring", "pots", "wishlist"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-2 text-label capitalize transition-colors cursor-pointer ${
              tab === t ? "border-accent font-semibold text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "ledger" && (
        <Ledger
          records={records}
          knownCategories={knownCategories}
          money={money}
          onAdd={createRecord}
          onRemove={removeRecord}
        />
      )}
      {tab === "recurring" && <Recurring items={recurring} knownCategories={knownCategories} money={money} />}
      {tab === "pots" && <Pots pots={pots} goals={goals} money={money} />}
      {tab === "wishlist" && <Wishlist items={wishlist} balance={stats?.balance ?? 0} money={money} />}
    </div>
  );
}

/** Six bars, zero-centred, so a bad month reads instantly. */
function MonthlyTrend({ trend, money }: { trend: any[]; money: (n: number) => string }) {
  const peak = Math.max(1, ...trend.map((t) => Math.abs(t.net)));
  return (
    <div className="flex h-28 items-center gap-2">
      {trend.map((t) => {
        const height = (Math.abs(t.net) / peak) * 100;
        const positive = t.net >= 0;
        return (
          <div key={t.month} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-20 w-full flex-col justify-center">
              <div className="flex h-1/2 items-end">
                {positive && (
                  <span
                    title={money(t.net)}
                    className="w-full rounded-t bg-success/70"
                    style={{ height: `${height}%` }}
                  />
                )}
              </div>
              <div className="flex h-1/2 items-start">
                {!positive && (
                  <span
                    title={money(t.net)}
                    className="w-full rounded-b bg-danger/70"
                    style={{ height: `${height}%` }}
                  />
                )}
              </div>
            </div>
            <span className="font-mono text-meta text-ghost">{t.month.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}

function Ledger({
  records, knownCategories, money, onAdd, onRemove,
}: {
  records: any[];
  knownCategories: string[];
  money: (n: number) => string;
  onAdd: any;
  onRemove: any;
}) {
  const [type, setType] = useState("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string[]>([]);
  const [date, setDate] = useState(today());

  const field =
    "rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-label text-ink outline-none focus:border-accent";

  return (
    <div className="space-y-3">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim() || !amount) return;
          await onAdd({
            type,
            title: title.trim(),
            amount: Number(amount),
            category: category[0] ?? "Uncategorised",
            date,
          });
          setTitle(""); setAmount(""); setCategory([]);
          toast.success("Recorded");
        }}
        className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-3"
      >
        <label className="space-y-1">
          <span className="block font-mono text-meta uppercase text-faint">Type</span>
          <Select value={type} onValueChange={setType} size="sm" options={TYPE_OPTIONS} />
        </label>
        <label className="min-w-40 flex-1 space-y-1">
          <span className="block font-mono text-meta uppercase text-faint">What</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Groceries" className={`w-full ${field}`} />
        </label>
        <label className="space-y-1">
          <span className="block font-mono text-meta uppercase text-faint">Amount</span>
          <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className={`w-28 ${field}`} />
        </label>
        <label className="min-w-40 flex-1 space-y-1">
          <span className="block font-mono text-meta uppercase text-faint">Category</span>
          {/* One category, but the same add-or-pick behaviour as everywhere else. */}
          <TagInput
            values={category}
            onChange={(v) => setCategory(v.slice(-1))}
            options={knownCategories}
            placeholder="Food, transport…"
          />
        </label>
        <label className="space-y-1">
          <span className="block font-mono text-meta uppercase text-faint">Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
        </label>
        <button type="submit" className="rounded-lg bg-accent px-3 py-1.5 text-label font-semibold text-accent-fg hover:bg-accent-hover cursor-pointer">
          Add
        </button>
      </form>

      {records.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-2 py-16 text-center">
          <Wallet className="mx-auto mb-2 h-8 w-8 text-line-2" />
          <p className="text-label text-ghost">No transactions yet.</p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-xl border border-line">
          {records.map((r: any) => (
            <li
              key={r._id}
              className="group flex items-center gap-3 border-b border-line/60 bg-surface px-4 py-2.5 last:border-0"
            >
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
                  r.type === "income" ? "bg-success-tint text-success" : "bg-danger-tint text-danger"
                }`}
              >
                {r.type === "income" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-label text-ink">{r.title}</p>
                <p className="font-mono text-meta text-ghost">{r.date} · {r.category}</p>
              </div>
              <span className={`shrink-0 font-mono text-label ${r.type === "income" ? "text-success" : "text-ink"}`}>
                {r.type === "income" ? "+" : "−"}{money(r.amount).replace("−", "")}
              </span>
              <button
                onClick={() => onRemove({ id: r._id })}
                title="Delete"
                className="shrink-0 text-ghost opacity-0 transition-opacity hover:text-danger group-hover:opacity-100 cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Recurring({
  items, knownCategories, money,
}: {
  items: any[];
  knownCategories: string[];
  money: (n: number) => string;
}) {
  const create = useMutation(api.finance.createRecurring);
  const update = useMutation(api.finance.updateRecurring);
  const remove = useMutation(api.finance.removeRecurring);
  const post = useMutation(api.finance.postRecurring);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [cadence, setCadence] = useState("monthly");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState<string[]>([]);

  const field =
    "rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-label text-ink outline-none focus:border-accent";

  return (
    <div className="space-y-3">
      <p className="text-label text-faint">
        The things that repeat whether or not you think about them. These set your burn rate.
      </p>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim() || !amount) return;
          await create({
            type, title: title.trim(), amount: Number(amount),
            category: category[0] ?? "Fixed", cadence,
          });
          setTitle(""); setAmount(""); setCategory([]);
          toast.success("Added");
        }}
        className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-3"
      >
        <label className="space-y-1">
          <span className="block font-mono text-meta uppercase text-faint">Type</span>
          <Select value={type} onValueChange={setType} size="sm" options={TYPE_OPTIONS} />
        </label>
        <label className="min-w-36 flex-1 space-y-1">
          <span className="block font-mono text-meta uppercase text-faint">What</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Phone plan" className={`w-full ${field}`} />
        </label>
        <label className="space-y-1">
          <span className="block font-mono text-meta uppercase text-faint">Amount</span>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={`w-24 ${field}`} />
        </label>
        <label className="space-y-1">
          <span className="block font-mono text-meta uppercase text-faint">Every</span>
          <Select value={cadence} onValueChange={setCadence} size="sm" options={CADENCE_OPTIONS} />
        </label>
        <label className="min-w-32 flex-1 space-y-1">
          <span className="block font-mono text-meta uppercase text-faint">Category</span>
          <TagInput values={category} onChange={(v) => setCategory(v.slice(-1))} options={knownCategories} placeholder="Fixed" />
        </label>
        <button type="submit" className="rounded-lg bg-accent px-3 py-1.5 text-label font-semibold text-accent-fg hover:bg-accent-hover cursor-pointer">
          Add
        </button>
      </form>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-2 py-12 text-center text-label text-ghost">
          Nothing recurring yet.
        </p>
      ) : (
        <ul className="space-y-1">
          {items.map((r: any) => (
            <li key={r._id} className="group flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2.5">
              <Repeat className={`h-3.5 w-3.5 shrink-0 ${r.active ? "text-accent" : "text-ghost"}`} />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-label ${r.active ? "text-ink" : "text-ghost line-through"}`}>{r.title}</p>
                <p className="font-mono text-meta text-ghost">{r.cadence} · {r.category}</p>
              </div>
              <span className={`shrink-0 font-mono text-label ${r.type === "income" ? "text-success" : "text-ink"}`}>
                {r.type === "income" ? "+" : "−"}{money(r.amount).replace("−", "")}
              </span>
              <button
                onClick={async () => { await post({ id: r._id }); toast.success("Posted to the ledger"); }}
                title="Post to the ledger for today"
                className="shrink-0 rounded-lg border border-line px-2 py-1 font-mono text-meta text-muted opacity-0 transition hover:bg-subtle hover:text-ink group-hover:opacity-100 cursor-pointer"
              >
                post
              </button>
              <button
                onClick={() => update({ id: r._id, active: !r.active })}
                title={r.active ? "Pause" : "Resume"}
                className="shrink-0 font-mono text-meta text-ghost opacity-0 transition hover:text-ink group-hover:opacity-100 cursor-pointer"
              >
                {r.active ? "pause" : "resume"}
              </button>
              <button
                onClick={() => remove({ id: r._id })}
                title="Delete"
                className="shrink-0 text-ghost opacity-0 transition hover:text-danger group-hover:opacity-100 cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Pots({ pots, goals, money }: { pots: any[]; goals: any[]; money: (n: number) => string }) {
  const create = useMutation(api.finance.createPot);
  const update = useMutation(api.finance.updatePot);
  const remove = useMutation(api.finance.removePot);

  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [goalId, setGoalId] = useState("__none");
  const [confirm, setConfirm] = useState<any | null>(null);

  const field =
    "rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-label text-ink outline-none focus:border-accent";

  return (
    <div className="space-y-3">
      <p className="text-label text-faint">
        What you are saving toward. A pot can point at a life goal, so the money and the reason
        for it live in the same system.
      </p>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim() || !target) return;
          await create({
            name: name.trim(),
            targetAmount: Number(target),
            goalId: (goalId === "__none" ? undefined : goalId) as any,
          });
          setName(""); setTarget(""); setGoalId("__none");
          toast.success("Pot created");
        }}
        className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-3"
      >
        <label className="min-w-40 flex-1 space-y-1">
          <span className="block font-mono text-meta uppercase text-faint">Saving for</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Laptop" className={`w-full ${field}`} />
        </label>
        <label className="space-y-1">
          <span className="block font-mono text-meta uppercase text-faint">Target</span>
          <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} className={`w-28 ${field}`} />
        </label>
        <label className="min-w-40 space-y-1">
          <span className="block font-mono text-meta uppercase text-faint">Life goal</span>
          <Select
            value={goalId}
            onValueChange={setGoalId}
            size="sm"
            options={[
              { value: "__none", label: "Not linked" },
              ...goals.map((g: any) => ({ value: g._id, label: `${g.icon || "🎯"} ${g.title}` })),
            ]}
          />
        </label>
        <button type="submit" className="rounded-lg bg-accent px-3 py-1.5 text-label font-semibold text-accent-fg hover:bg-accent-hover cursor-pointer">
          Create
        </button>
      </form>

      {pots.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-2 py-12 text-center text-label text-ghost">
          No pots yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {pots.map((p: any) => (
            <article key={p._id} className="group space-y-3 rounded-xl border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-serif text-heading text-ink">{p.name}</h3>
                  {p.goalTitle && (
                    <p className="flex items-center gap-1 truncate font-mono text-meta text-ghost">
                      <Target className="h-2.5 w-2.5" /> {p.goalTitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setConfirm(p)}
                  title="Delete pot"
                  className="shrink-0 text-ghost opacity-0 transition hover:text-danger group-hover:opacity-100 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="h-1.5 overflow-hidden rounded-full bg-subtle-2">
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ${p.progress === 100 ? "bg-success" : "bg-accent"}`}
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
                <div className="flex justify-between font-mono text-meta text-ghost">
                  <span>{money(p.currentAmount)}</span>
                  <span>{money(p.targetAmount)}</span>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = (e.currentTarget.elements.namedItem("add") as HTMLInputElement);
                  const value = Number(input.value);
                  if (!value) return;
                  update({ id: p._id, currentAmount: p.currentAmount + value });
                  input.value = "";
                  toast.success(`Added to ${p.name}`);
                }}
                className="flex items-center gap-1.5"
              >
                <input name="add" type="number" placeholder="Add amount" className={`flex-1 ${field}`} />
                <button type="submit" className="rounded-lg border border-line px-2.5 py-1.5 text-label text-muted hover:bg-subtle hover:text-ink cursor-pointer">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </form>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={`Delete “${confirm?.name}”?`}
        body="Transactions that fed it keep their history; they just lose the link."
        confirmLabel="Delete pot"
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          await remove({ id: confirm._id });
          toast.success("Pot deleted");
          setConfirm(null);
        }}
      />
    </div>
  );
}

function Wishlist({
  items, balance, money,
}: {
  items: any[]; balance: number; money: (n: number) => string;
}) {
  const create = useMutation(api.finance.createWishlistItem);
  const toggleBought = useMutation(api.finance.toggleWishlistBought);
  const remove = useMutation(api.finance.removeWishlistItem);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [confirm, setConfirm] = useState<any | null>(null);

  const field =
    "rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-label text-ink outline-none focus:border-accent";

  // Cheapest wins first — closest to affordable. Bought sits below, most recent first.
  const wanted = [...items].filter((i) => !i.bought).sort((a, b) => a.price - b.price);
  const bought = [...items].filter((i) => i.bought).sort((a, b) => (b.boughtAt ?? "").localeCompare(a.boughtAt ?? ""));
  const wantedTotal = wanted.reduce((n, i) => n + i.price, 0);
  const affordableCount = wanted.filter((i) => i.price <= balance).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-label text-faint">
          What you want to buy, priced out before it&apos;s a transaction.
        </p>
        {wanted.length > 0 && (
          <span className="font-mono text-meta text-ghost">
            {money(wantedTotal)} wanted
            {affordableCount > 0 && ` · ${affordableCount} affordable now`}
          </span>
        )}
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim() || !price) return;
          await create({ name: name.trim(), price: Number(price) });
          setName(""); setPrice("");
          toast.success("Added to wishlist");
        }}
        className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-3"
      >
        <label className="min-w-40 flex-1 space-y-1">
          <span className="block font-mono text-meta uppercase text-faint">Item</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Standing desk" className={`w-full ${field}`} />
        </label>
        <label className="space-y-1">
          <span className="block font-mono text-meta uppercase text-faint">Price</span>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={`w-28 ${field}`} />
        </label>
        <button type="submit" className="rounded-lg bg-accent px-3 py-1.5 text-label font-semibold text-accent-fg hover:bg-accent-hover cursor-pointer">
          Add
        </button>
      </form>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-2 py-12 text-center text-label text-ghost">
          Nothing on the list yet.
        </p>
      ) : (
        <ul className="divide-y divide-line/60 rounded-xl border border-line bg-surface">
          {[...wanted, ...bought].map((item) => {
            const affordable = !item.bought && item.price <= balance;
            return (
              <li key={item._id} className="group flex items-center gap-3 px-4 py-2.5">
                <button
                  onClick={() => toggleBought({ id: item._id })}
                  title={item.bought ? "Mark as not bought" : "Mark as bought"}
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors cursor-pointer ${
                    item.bought ? "border-accent bg-accent text-accent-fg" : "border-line-2 bg-surface-2 hover:border-faint"
                  }`}
                >
                  {item.bought && <Check className="h-3 w-3 stroke-[3]" />}
                </button>

                <span className={`min-w-0 flex-1 truncate text-label ${item.bought ? "text-ghost line-through" : "text-ink"}`}>
                  {item.name}
                </span>

                {affordable && (
                  <span className="shrink-0 rounded bg-success-tint px-1.5 py-0.5 font-mono text-meta text-success">
                    can afford
                  </span>
                )}

                <span className={`shrink-0 font-mono text-label ${item.bought ? "text-ghost" : "text-muted"}`}>
                  {money(item.price)}
                </span>

                <button
                  onClick={() => setConfirm(item)}
                  title="Remove"
                  className="shrink-0 text-ghost opacity-0 transition hover:text-danger group-hover:opacity-100 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={`Remove "${confirm?.name}"?`}
        body="It's just off the list — nothing else is affected."
        confirmLabel="Remove"
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          await remove({ id: confirm._id });
          toast.success("Removed");
          setConfirm(null);
        }}
      />
    </div>
  );
}

function Stat({
  label, value, sub, icon, tone,
}: {
  label: string; value: string; sub?: string; icon?: React.ReactNode; tone?: string;
}) {
  return (
    <div className="text-right">
      <div className="flex items-center justify-end gap-1.5">
        {icon}
        <span className={`font-serif text-title leading-none ${tone ?? "text-ink"}`}>{value}</span>
      </div>
      <div className="font-mono text-meta uppercase text-ghost">
        {label}
        {sub && <span className="ml-1 normal-case text-faint">{sub}</span>}
      </div>
    </div>
  );
}
