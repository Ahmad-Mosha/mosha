"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { GoalCard } from "./goal-card";
import { GoalDetailsDialog } from "./goal-details-dialog";
import { QuoteRotator } from "./quote-rotator";
import { useMoshaStore } from "@/lib/store";
import { Plus, Target } from "lucide-react";

export function MajorGoalsBento() {
  const { setGoalDialogOpen, setEditingGoalId } = useMoshaStore();

  const goals = useQuery(api.goals.list);

  const [activeFilter, setActiveFilter] = useState<"all" | "in_progress" | "completed">("all");
  const [selectedGoal, setSelectedGoal] = useState<any | null>(null);

  const allGoals = goals || [];
  const inProgressGoals = allGoals.filter((g: any) => g.status !== "completed");
  const completedGoals = allGoals.filter((g: any) => g.status === "completed");

  const displayedGoals =
    activeFilter === "in_progress"
      ? inProgressGoals
      : activeFilter === "completed"
      ? completedGoals
      : allGoals;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Quran Verse Wisdom Banner (Clean, editorial, full width) */}
      <div className="w-full">
        <QuoteRotator />
      </div>

      {/* 2. Compact Control Bar (+ Add Major Goal & Filter Pills) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-b border-[#ECEAE4] pb-3">
        {/* Left: Filter Tabs */}
        <div className="flex items-center space-x-1.5 text-xs">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeFilter === "all"
                ? "bg-[#333E50] text-white font-semibold shadow-2xs"
                : "bg-white border border-[#E2E8F0] text-[#718096] hover:text-[#1A202C]"
            }`}
          >
            All Goals ({allGoals.length})
          </button>
          <button
            onClick={() => setActiveFilter("in_progress")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeFilter === "in_progress"
                ? "bg-[#333E50] text-white font-semibold shadow-2xs"
                : "bg-white border border-[#E2E8F0] text-[#718096] hover:text-[#1A202C]"
            }`}
          >
            In Progress ({inProgressGoals.length})
          </button>
          <button
            onClick={() => setActiveFilter("completed")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeFilter === "completed"
                ? "bg-[#333E50] text-white font-semibold shadow-2xs"
                : "bg-white border border-[#E2E8F0] text-[#718096] hover:text-[#1A202C]"
            }`}
          >
            Completed ({completedGoals.length})
          </button>
        </div>

        {/* Right: Actions */}
        <button
          onClick={() => {
            setEditingGoalId(null);
            setGoalDialogOpen(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#333E50] hover:bg-[#252E3B] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Major Goal</span>
        </button>
      </div>

      {/* 3. Goals Bento Grid */}
      {displayedGoals.length === 0 ? (
        <div className="bento-card rounded-xl p-10 text-center space-y-3">
          <Target className="w-8 h-8 text-[#CBD5E1] mx-auto" />
          <h3 className="font-serif text-lg font-bold text-[#1A202C]">
            No major goals in this view
          </h3>
          <p className="text-xs text-[#718096] max-w-sm mx-auto">
            Click &ldquo;Add Major Goal&rdquo; above to create your next life milestone.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-stretch">
          {displayedGoals.map((goal: any) => (
            <GoalCard
              key={goal._id}
              goal={goal}
              onSelect={(g) => setSelectedGoal(g)}
            />
          ))}
        </div>
      )}

      {/* 4. Goal Details Modal Drawer (Opens on card click) */}
      <GoalDetailsDialog
        goal={selectedGoal}
        isOpen={Boolean(selectedGoal)}
        onClose={() => setSelectedGoal(null)}
      />
    </div>
  );
}
