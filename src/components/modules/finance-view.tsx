"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Wallet, Plus, ArrowUpRight, ArrowDownRight, Heart } from "lucide-react";

export function FinanceView() {
  const records = useQuery(api.finance.list) || [];
  const createRecord = useMutation(api.finance.create);

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("Living");
  const [notes, setNotes] = useState("");

  const transactions = records.filter((r: any) => r.type !== "savings_goal");

  const totalIncome = transactions
    .filter((r: any) => r.type === "income")
    .reduce((acc: number, r: any) => acc + (r.amount || 0), 0);

  const totalExpenses = transactions
    .filter((r: any) => r.type === "expense")
    .reduce((acc: number, r: any) => acc + (r.amount || 0), 0);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) return;
    await createRecord({
      title: title.trim(),
      amount,
      type,
      category,
      notes: notes.trim() || undefined,
    });
    setIsAdding(false);
    setTitle("");
    setAmount(0);
    setNotes("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bento-card rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs">
            <Wallet className="w-4 h-4 text-emerald-700" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-faint font-semibold">
              Sovereign Ledger
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink mt-1">
            Personal Finance & Life Funds
          </h1>
          <p className="text-xs sm:text-sm text-muted max-w-xl leading-relaxed mt-1">
            Clean cashflow, intentional savings allocations, and the foundational Marriage Fund.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Transaction</span>
        </button>
      </div>

      {/* Marriage & Life Fund Spotlight */}
      <div className="bento-card rounded-xl p-6 bg-gradient-to-r from-danger-tint/60 via-white to-white border-rose-200 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <Heart className="w-5 h-5 fill-rose-600" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-rose-800 font-semibold">
                Core Life Milestone Fund
              </span>
              <h2 className="font-serif text-xl font-bold text-ink">
                Marriage & Housing Foundation
              </h2>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-900 border border-rose-200">
            $15,000 / $50,000 (30%)
          </span>
        </div>

        <div className="w-full bg-line h-2.5 rounded-full overflow-hidden">
          <div className="bg-rose-600 h-full rounded-full" style={{ width: "30%" }} />
        </div>

        <p className="text-xs text-faint">
          Target allocation: $50,000 dedicated to wedding, initial home deposit, and mutual family stability.
        </p>
      </div>

      {/* Add Transaction Drawer */}
      {isAdding && (
        <form
          onSubmit={handleAddRecord}
          className="bento-card rounded-xl p-5 space-y-3 border-2 border-accent/20 animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-line pb-2">
            <h3 className="font-serif text-base font-bold text-ink">
              Log Financial Entry
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-faint cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-mono text-[11px] uppercase text-faint">Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Consulting Milestone"
                className="w-full px-3 py-2 rounded-lg border border-line"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase text-faint">Amount ($) *</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-line"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase text-faint">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-line bg-surface-2 cursor-pointer"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-accent text-accent-fg font-semibold text-xs shadow-2xs hover:bg-accent-hover cursor-pointer"
            >
              Save Entry
            </button>
          </div>
        </form>
      )}

      {/* Transactions List */}
      <div className="bento-card rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-faint">
            Recent Cashflow Log
          </span>
          <div className="flex items-center space-x-4 text-xs font-mono">
            <span className="text-emerald-700 font-semibold">+${totalIncome.toLocaleString()}</span>
            <span className="text-rose-700 font-semibold">-${totalExpenses.toLocaleString()}</span>
          </div>
        </div>

        <div className="divide-y divide-line text-xs">
          {transactions.length === 0 ? (
            <p className="text-xs text-ghost py-6 text-center">
              No transactions logged yet.
            </p>
          ) : (
            transactions.map((t: any) => (
              <div key={t._id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      t.type === "income"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {t.type === "income" ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-ink">{t.title}</div>
                    <span className="text-[10px] font-mono text-faint">
                      {t.category} • {t.date}
                    </span>
                  </div>
                </div>

                <div
                  className={`font-mono font-bold text-sm ${
                    t.type === "income" ? "text-emerald-700" : "text-ink"
                  }`}
                >
                  {t.type === "income" ? "+" : "-"}${t.amount?.toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
