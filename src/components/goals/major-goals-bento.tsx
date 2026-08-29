"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { GoalCard } from "./goal-card";
import { GoalDetailsDialog } from "./goal-details-dialog";
import { QuoteRotator } from "./quote-rotator";
import { useMoshaStore } from "@/lib/store";
import { Plus, Target } from "lucide-react";

export function MajorGoalsBento() {
  const { setGoalDialogOpen, setEditingGoalId } = useMoshaStore();

  const convexGoals = useQuery(api.goals.list);
  // Read straight from Convex; see the note in notes-screen.tsx on why the
  // localStorage mirror was removed.

  // Use Convex data if loaded, otherwise fallback to warm cache
  const goals = convexGoals ?? [];
  const isLoading = convexGoals === undefined;

  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const selectedGoal = goals.find((g: any) => g._id === selectedGoalId) || null;

  const inProgressGoals = goals.filter((g: any) => g.status === "in_progress");
  const planningGoals = goals.filter((g: any) => g.status === "planning");
  const visionGoals = goals.filter((g: any) => g.status === "vision");
  const onHoldGoals = goals.filter((g: any) => g.status === "on_hold");
  const completedGoals = goals.filter((g: any) => g.status === "completed");

  const displayedGoals =
    activeFilter === "all"
      ? goals
      : goals.filter((g: any) => g.status === activeFilter);

  const filters = [
    { id: "all", label: `All Goals (${goals.length})` },
    { id: "in_progress", label: `In Progress (${inProgressGoals.length})` },
    { id: "planning", label: `Planning (${planningGoals.length})` },
    { id: "vision", label: `Vision (${visionGoals.length})` },
    { id: "on_hold", label: `On Hold (${onHoldGoals.length})` },
    { id: "completed", label: `Completed (${completedGoals.length})` },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Quran Verse Wisdom Banner */}
      <div className="w-full">
        <QuoteRotator />
      </div>

      {/* 2. Control Bar (+ Add Major Goal & Filter Pills) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-b border-line pb-3">
        {/* Left: Dynamic Status Filter Pills */}
        <div className="flex items-center space-x-1.5 text-label overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeFilter === f.id
                  ? "bg-accent text-accent-fg font-semibold shadow-2xs"
                  : "bg-surface-2 border border-line text-faint hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Right: Actions */}
        <button
          onClick={() => {
            setEditingGoalId(null);
            setGoalDialogOpen(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg text-label font-semibold shadow-2xs transition-all cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Major Goal</span>
        </button>
      </div>

      {/* 3. Goals Bento Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-stretch">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bento-card rounded-xl p-5 space-y-4 animate-pulse"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-line" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-line rounded w-3/4" />
                  <div className="h-3 bg-line rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-line rounded w-full" />
              <div className="h-2 bg-line rounded-full w-full" />
            </div>
          ))}
        </div>
      ) : displayedGoals.length === 0 ? (
        <div className="bento-card rounded-xl p-10 text-center space-y-3">
          <Target className="w-8 h-8 text-line-2 mx-auto" />
          <h3 className="font-serif text-heading font-bold text-ink">
            No goals found in this view
          </h3>
          <p className="text-label text-faint max-w-sm mx-auto">
            Click &ldquo;Add Major Goal&rdquo; above to create a new milestone.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-stretch">
          {displayedGoals.map((goal: any) => (
            <GoalCard
              key={goal._id}
              goal={goal}
              onSelect={(g) => setSelectedGoalId(g._id)}
            />
          ))}
        </div>
      )}

      {/* 4. Goal Details Modal Drawer */}
      <GoalDetailsDialog
        goal={selectedGoal}
        isOpen={Boolean(selectedGoalId)}
        onClose={() => setSelectedGoalId(null)}
      />
    </div>
  );
}
