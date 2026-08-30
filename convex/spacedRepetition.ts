import { addDays, today } from "./recurrence";

/**
 * Spaced repetition for solved problems.
 *
 * A deliberately small SM-2: the interval depends on how the recall went and
 * how many clean reviews came before it. Getting it wrong drops you to the
 * front of the queue rather than nudging the interval down, because a problem
 * you could not re-solve is a problem you have not learned.
 */

export type Recall = "again" | "hard" | "good" | "easy";

/** Days until the next review, given the recall and prior clean streak. */
export function nextInterval(recall: Recall, streak: number): number {
  if (recall === "again") return 1;

  const base = { hard: 2, good: 4, easy: 7 }[recall];
  const growth = { hard: 1.3, good: 2.2, easy: 3 }[recall];

  // Cap at a season: past that, the queue stops being a review tool.
  return Math.min(120, Math.round(base * Math.pow(growth, Math.max(0, streak))));
}

/** Mastery as a percentage, for progress rings. Mirrors the recall ladder. */
export const MASTERY_FOR: Record<Recall, number> = {
  again: 20,
  hard: 50,
  good: 80,
  easy: 100,
};

export function scheduleAfter(recall: Recall, streak: number, from = today()) {
  const cleanStreak = recall === "again" ? 0 : streak + 1;
  return {
    nextReviewDate: addDays(from, nextInterval(recall, cleanStreak - 1)),
    reviewStreak: cleanStreak,
    masteryLevel: MASTERY_FOR[recall],
    lastSolvedDate: from,
  };
}
