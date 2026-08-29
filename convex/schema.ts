import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // 1. Major Life Goals
  major_life_goals: defineTable({
    title: v.string(),
    description: v.string(),
    icon: v.string(),
    status: v.string(),
    targetDate: v.optional(v.string()),
    progress: v.number(),
    milestones: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        completed: v.boolean(),
        completedAt: v.optional(v.string()),
      })
    ),
    phase: v.optional(v.string()),
    meaning: v.optional(v.string()),
    notes: v.optional(v.string()),
    order: v.number(),
    completedAt: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_order", ["order"])
    .index("by_status", ["status"]),

  // 2. Clean Minimal Tasks Table
  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(), // "todo" | "in_progress" | "done"
    priority: v.string(), // "p1_urgent" | "p2_medium" | "p3_low"
    module: v.string(), // "general" | "goals" | "problems" | "learning" | "gym" | "career" | "finance" | "personal"
    dueDate: v.optional(v.string()), // YYYY-MM-DD
    dueTime: v.optional(v.string()),
    subtasks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          completed: v.boolean(),
        })
      )
    ),
    tags: v.optional(v.array(v.string())),
    isBigRock: v.optional(v.boolean()),
    durationMinutes: v.optional(v.number()),
    estimatedMinutes: v.optional(v.number()),
    goalId: v.optional(v.id("major_life_goals")),
    order: v.optional(v.number()),
    completedAt: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_status", ["status"])
    .index("by_due_date", ["dueDate"])
    .index("by_priority", ["priority"])
    .index("by_module", ["module"]),

  // 3. Problem Solving & Algorithmic Mastery Hub
  problems: defineTable({
    title: v.string(),
    url: v.optional(v.string()),
    platform: v.string(),
    pattern: v.string(),
    difficulty: v.string(),
    solveTimeSeconds: v.optional(v.number()),
    masteryLevel: v.number(),
    mistakes: v.optional(v.string()),
    notes: v.optional(v.string()),
    code: v.optional(v.string()),
    language: v.optional(v.string()),
    reviewCount: v.optional(v.number()),
    nextReviewDate: v.optional(v.string()),
    lastSolvedDate: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_next_review", ["nextReviewDate"])
    .index("by_pattern", ["pattern"]),

  // 4. Learning & CS Roadmaps
  learning_topics: defineTable({
    subject: v.string(),
    title: v.string(),
    description: v.string(),
    status: v.string(),
    progress: v.number(),
    notes: v.optional(v.string()),
    resources: v.optional(
      v.array(
        v.object({
          title: v.string(),
          url: v.string(),
          type: v.string(),
        })
      )
    ),
    order: v.number(),
    createdAt: v.string(),
  }).index("by_subject", ["subject"]),

  // 5. Iron Journal (Gym & Fitness)
  gym_sessions: defineTable({
    title: v.string(),
    split: v.string(),
    date: v.string(),
    durationMinutes: v.number(),
    totalVolumeKg: v.optional(v.number()),
    notes: v.optional(v.string()),
    rating: v.optional(v.number()),
    exercises: v.array(
      v.object({
        name: v.string(),
        sets: v.number(),
        reps: v.number(),
        weightKg: v.number(),
        rpe: v.optional(v.number()),
        isPr: v.optional(v.boolean()),
      })
    ),
    createdAt: v.string(),
  }).index("by_date", ["date"]),

  // 6. Sovereign Ledger (Personal Finance)
  finance_records: defineTable({
    type: v.string(),
    title: v.string(),
    amount: v.number(),
    category: v.string(),
    date: v.string(),
    notes: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_date", ["date"]),

  // 7. Engineering Journal & Lessons
  journal_entries: defineTable({
    title: v.string(),
    category: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
    date: v.string(),
    createdAt: v.string(),
  }).index("by_date", ["date"]),
});
