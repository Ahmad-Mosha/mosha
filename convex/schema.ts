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
    githubUrl: v.optional(v.string()),
    liveUrl: v.optional(v.string()),
    devNotes: v.optional(v.string()), // Architecture notes / RFC content
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
    isDaily: v.boolean(), // Kept in sync with `recurrence` for the by_daily index
    recurrence: v.optional(v.string()), // "none" | "daily" | "weekdays" | "weekly" | "monthly"
    streakCount: v.optional(v.number()), // Streak for daily habits (e.g. 5 days)
    lastCompletedDate: v.optional(v.string()), // YYYY-MM-DD
    goalId: v.optional(v.id("major_life_goals")), // Link to Major Life Goal
    projectId: v.optional(v.id("projects")), // Link to Project
    sprintId: v.optional(v.id("sprints")), // Which sprint the task sits in
    // Free-form labels — frontend, backend, review, devops. Never a fixed
    // list; the vocabulary is whatever has been used.
    labels: v.optional(v.array(v.string())),
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

  // 3b. Sprints — a project's work split into time-boxed chunks
  sprints: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    goal: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    status: v.string(), // "planned" | "active" | "done"
    order: v.number(),
    createdAt: v.string(),
  }).index("by_project", ["projectId"]),

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
    topicId: v.optional(v.id("learning_topics")), // Linked to a learning topic
    isPinned: v.boolean(),
    isFavorite: v.boolean(),
    tags: v.optional(v.array(v.string())),
    goalId: v.optional(v.id("major_life_goals")),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_folder", ["folderId"])
    .index("by_project", ["projectId"])
    .index("by_topic", ["topicId"])
    .index("by_pinned", ["isPinned"])
    .index("by_updated", ["updatedAt"]),

  // 6. Problem Solving & Algorithmic Mastery Hub
  problems: defineTable({
    // Links a progress row to a NeetCode 150 entry (src/lib/neetcode-150.ts).
    // Absent for problems logged outside the curriculum.
    slug: v.optional(v.string()),
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
    reviewStreak: v.optional(v.number()), // clean recalls in a row
    attempts: v.optional(v.number()),
    nextReviewDate: v.optional(v.string()),
    lastSolvedDate: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_next_review", ["nextReviewDate"])
    .index("by_pattern", ["pattern"])
    .index("by_slug", ["slug"]),

  // 7. Learning
  //
  // A subject is learned from several sources at once — a course, a book, a
  // few videos — so the unit is the track, not the source. Tracks hold an
  // ordered list of topics (the roadmap); resources attach to a track, and
  // optionally to one topic inside it.
  learning_tracks: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    status: v.string(), // "active" | "planned" | "paused" | "done"
    order: v.number(),
    createdAt: v.string(),
  }).index("by_order", ["order"]),

  learning_topics: defineTable({
    trackId: v.id("learning_tracks"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(), // "todo" | "learning" | "done"
    order: v.number(),
    /** Drives the study heatmap; touched whenever the topic is worked on. */
    lastStudiedAt: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_track", ["trackId"])
    .index("by_studied", ["lastStudiedAt"]),

  learning_resources: defineTable({
    trackId: v.id("learning_tracks"),
    /** Set when the resource covers one topic rather than the whole track. */
    topicId: v.optional(v.id("learning_topics")),
    title: v.string(),
    url: v.optional(v.string()), // absent for a local file or an AI-generated PDF
    type: v.string(), // "course" | "book" | "video" | "article" | "pdf" | "docs" | "other"
    status: v.string(), // "queued" | "active" | "done"
    notes: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_track", ["trackId"])
    .index("by_topic", ["topicId"]),

  // 8. Gym
  //
  // A session is what actually happened; a plan is what you intended. Sessions
  // stand alone so a workout is never blocked on having a plan, and a plan can
  // seed one when you do have it.
  gym_sessions: defineTable({
    title: v.string(),
    split: v.string(), // "push" | "pull" | "legs" | "upper" | "lower" | "full" | custom
    date: v.string(), // YYYY-MM-DD
    durationMinutes: v.optional(v.number()),
    notes: v.optional(v.string()),
    /** 1-5, how the session felt. */
    rating: v.optional(v.number()),
    planId: v.optional(v.id("gym_plans")),
    exercises: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        sets: v.array(
          v.object({
            reps: v.number(),
            weightKg: v.number(),
            rpe: v.optional(v.number()),
          })
        ),
      })
    ),
    createdAt: v.string(),
  }).index("by_date", ["date"]),

  /** Reusable templates: the exercises you intend to do for a given split. */
  gym_plans: defineTable({
    name: v.string(),
    split: v.string(),
    notes: v.optional(v.string()),
    exercises: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        targetSets: v.number(),
        targetReps: v.number(),
        targetWeightKg: v.optional(v.number()),
      })
    ),
    order: v.number(),
    createdAt: v.string(),
  }).index("by_order", ["order"]),

  /** Body over time — weight is the spine, the rest is optional. */
  body_metrics: defineTable({
    date: v.string(), // YYYY-MM-DD, one entry per day
    weightKg: v.optional(v.number()),
    bodyFatPct: v.optional(v.number()),
    /** Free-form so you measure whatever you actually measure. */
    measurements: v.optional(
      v.array(v.object({ name: v.string(), valueCm: v.number() }))
    ),
    notes: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_date", ["date"]),

  // 9. Finance
  //
  // Two questions matter: where the money went, and how long what is left
  // lasts. Everything here serves one of those. Transactions are the ledger;
  // recurring items are the fixed costs that make a burn rate predictable;
  // pots are what you are saving toward.
  finance_records: defineTable({
    type: v.string(), // "income" | "expense"
    title: v.string(),
    amount: v.number(),
    category: v.string(),
    date: v.string(), // YYYY-MM-DD
    notes: v.optional(v.string()),
    /** Set when this row was generated from a recurring item. */
    recurringId: v.optional(v.id("finance_recurring")),
    potId: v.optional(v.id("finance_pots")),
    createdAt: v.string(),
  })
    .index("by_date", ["date"])
    .index("by_category", ["category"]),

  /** Fixed costs and income that repeat — what makes a burn rate meaningful. */
  finance_recurring: defineTable({
    type: v.string(), // "income" | "expense"
    title: v.string(),
    amount: v.number(),
    category: v.string(),
    cadence: v.string(), // "monthly" | "weekly" | "yearly"
    dayOfMonth: v.optional(v.number()),
    active: v.boolean(),
    createdAt: v.string(),
  }).index("by_active", ["active"]),

  /** A savings target, optionally tied to a life goal it pays for. */
  finance_pots: defineTable({
    name: v.string(),
    targetAmount: v.number(),
    /** Money already in it, adjusted by contributions. */
    currentAmount: v.number(),
    goalId: v.optional(v.id("major_life_goals")),
    targetDate: v.optional(v.string()),
    createdAt: v.string(),
  }),

  /** Single row: currency and the balance the runway counts down from. */
  finance_config: defineTable({
    currency: v.optional(v.string()),
    startingBalance: v.optional(v.number()),
    updatedAt: v.string(),
  }),

  // 11. Military Service — leave periods and the discharge countdown.
  // Days are "at base" unless a period says otherwise; only the exceptions
  // are stored, which is how you actually think about it.
  service_periods: defineTable({
    kind: v.string(), // "home" | "duty"
    startDate: v.string(), // YYYY-MM-DD, inclusive
    endDate: v.string(), // YYYY-MM-DD, inclusive
    label: v.optional(v.string()),
    // "cycle" rows are regenerated from the rotation rule; "manual" ones are
    // hand-marked and must survive a regenerate.
    source: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_start", ["startDate"]),

  // Single row. Holds the dates the whole countdown hangs off.
  service_config: defineTable({
    dischargeDate: v.optional(v.string()),
    serviceStartDate: v.optional(v.string()),
    // Fixed rotation: a known changeover date plus how long each phase runs.
    cycleAnchor: v.optional(v.string()), // a date the anchor phase begins
    cycleAnchorPhase: v.optional(v.string()), // "base" | "home" on that date
    cycleBaseDays: v.optional(v.number()),
    cycleHomeDays: v.optional(v.number()),
    updatedAt: v.string(),
  }),

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
