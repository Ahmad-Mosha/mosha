import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // 1. Major Life Goals
  major_life_goals: defineTable({
    title: v.string(),
    description: v.string(),
    icon: v.string(),
    status: v.string(), // "in_progress" | "planning" | "vision" | "on_hold" | "completed"
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
    order: v.number(),
    completedAt: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_order", ["order"])
    .index("by_status", ["status"]),

  // 2. Projects & Engineering Repositories Hub
  projects: defineTable({
    name: v.string(),
    description: v.string(),
    status: v.string(), // "active" | "in_progress" | "planning" | "in_review" | "completed" | "on_hold"
    techStack: v.array(v.string()), // e.g. ["Rust", "gRPC", "Redis"]
    version: v.optional(v.string()), // e.g. "v1.4.2"
    branch: v.optional(v.string()), // e.g. "main" or "feature/grpc-multiplexing"
    githubUrl: v.optional(v.string()),
    liveUrl: v.optional(v.string()),
    devNotes: v.optional(v.string()), // Architecture notes / RFC content
    goalId: v.optional(v.id("major_life_goals")),
    order: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_order", ["order"])
    .index("by_status", ["status"]),

  // 3. Tasks & Daily Habits System
  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(), // "todo" | "in_progress" | "in_review" | "done"
    priority: v.string(), // "p1_urgent" | "p2_medium" | "p3_low"
    module: v.string(), // "general" | "problems" | "learning" | "gym" | "career" | "goals" | "finance" | "personal" | "projects"
    dueDate: v.optional(v.string()), // YYYY-MM-DD
    dueTime: v.optional(v.string()),
    isDaily: v.boolean(), // Daily recurring habit
    streakCount: v.optional(v.number()), // Streak for daily habits (e.g. 5 days)
    lastCompletedDate: v.optional(v.string()), // YYYY-MM-DD
    goalId: v.optional(v.id("major_life_goals")), // Link to Major Life Goal
    projectId: v.optional(v.id("projects")), // Link to Project
    subtasks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          completed: v.boolean(),
        })
      )
    ),
    order: v.optional(v.number()),
    completedAt: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_status", ["status"])
    .index("by_due_date", ["dueDate"])
    .index("by_priority", ["priority"])
    .index("by_module", ["module"])
    .index("by_daily", ["isDaily"])
    .index("by_project", ["projectId"]),

  // 4. Knowledge Base Folders & Hierarchy
  folders: defineTable({
    name: v.string(),
    icon: v.optional(v.string()),
    parentId: v.optional(v.id("folders")), // Parent folder for subfolder hierarchy
    order: v.number(),
    createdAt: v.string(),
  })
    .index("by_order", ["order"])
    .index("by_parent", ["parentId"]),

  // 5. Notes & Knowledge Base (Rich Text)
  notes: defineTable({
    title: v.string(),
    content: v.string(), // HTML / JSON rich content
    plainText: v.optional(v.string()), // For instant search & preview snippets
    folderId: v.optional(v.id("folders")),
    projectId: v.optional(v.id("projects")), // Linked to Project
    isPinned: v.boolean(),
    isFavorite: v.boolean(),
    tags: v.optional(v.array(v.string())),
    goalId: v.optional(v.id("major_life_goals")),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_folder", ["folderId"])
    .index("by_project", ["projectId"])
    .index("by_pinned", ["isPinned"])
    .index("by_updated", ["updatedAt"]),

  // 6. Problem Solving & Algorithmic Mastery Hub
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

  // 7. Learning & CS Roadmaps
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

  // 8. Iron Journal (Gym & Fitness)
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

  // 9. Sovereign Ledger (Personal Finance)
  finance_records: defineTable({
    type: v.string(),
    title: v.string(),
    amount: v.number(),
    category: v.string(),
    date: v.string(),
    notes: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_date", ["date"]),

  // 10. Engineering Journal & Lessons
  journal_entries: defineTable({
    title: v.string(),
    category: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
    date: v.string(),
    createdAt: v.string(),
  }).index("by_date", ["date"]),
});
