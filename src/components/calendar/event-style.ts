import {
  BookMarked, Brain, CheckSquare, Dumbbell, Target, Wallet,
} from "lucide-react";
import type { EventKind } from "../../../convex/calendar";

/**
 * One colour per stream, so a month reads at a glance without a legend:
 * you learn "green is training, amber is money" in about two days.
 * All tokens, so it survives the theme swap.
 */
export const EVENT_STYLE: Record<
  EventKind,
  { label: string; icon: React.ElementType; dot: string; chip: string; text: string }
> = {
  task: {
    label: "Task",
    icon: CheckSquare,
    dot: "bg-accent",
    chip: "bg-accent-soft text-ink",
    text: "text-ink",
  },
  gym: {
    label: "Training",
    icon: Dumbbell,
    dot: "bg-success",
    chip: "bg-success-tint text-success",
    text: "text-success",
  },
  finance: {
    label: "Money",
    icon: Wallet,
    dot: "bg-warn",
    chip: "bg-warn-tint text-warn",
    text: "text-warn",
  },
  journal: {
    label: "Journal",
    icon: BookMarked,
    dot: "bg-shipped",
    chip: "bg-shipped-tint text-shipped",
    text: "text-shipped",
  },
  review: {
    label: "Review",
    icon: Brain,
    dot: "bg-info",
    chip: "bg-info-tint text-info",
    text: "text-info",
  },
  goal: {
    label: "Goal",
    icon: Target,
    dot: "bg-danger",
    chip: "bg-danger-tint text-danger",
    text: "text-danger",
  },
};

export const EVENT_ORDER: EventKind[] = [
  "task", "review", "gym", "finance", "journal", "goal",
];
