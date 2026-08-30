/**
 * Shared vocabulary for how a task's metadata looks.
 *
 * Labels are user-invented, so their colours cannot be configured anywhere —
 * they are derived from the text itself. The same label is therefore always
 * the same colour, everywhere, without storing anything.
 */

export const PRIORITY_META: Record<
  string,
  { label: string; chip: string; dot: string; rank: number }
> = {
  p1_urgent: { label: "High", chip: "bg-danger-tint text-danger", dot: "bg-danger", rank: 0 },
  p2_medium: { label: "Medium", chip: "bg-warn-tint text-warn", dot: "bg-warn", rank: 1 },
  p3_low: { label: "Low", chip: "bg-subtle-2 text-muted", dot: "bg-ghost", rank: 2 },
};

export const PRIORITY_OPTIONS = Object.entries(PRIORITY_META)
  .sort((a, b) => a[1].rank - b[1].rank)
  .map(([value, m]) => ({ value, label: m.label }));

export const priorityOf = (p?: string) => PRIORITY_META[p ?? "p2_medium"] ?? PRIORITY_META.p2_medium;

/** Token-based palette, so labels stay readable in both themes. */
const LABEL_COLOURS = [
  "bg-info-tint text-info",
  "bg-success-tint text-success",
  "bg-shipped-tint text-shipped",
  "bg-warn-tint text-warn",
  "bg-danger-tint text-danger",
  "bg-accent-soft text-ink-2",
];

/**
 * Stable hash so a label keeps its colour across sessions and screens.
 * djb2 — small, well-distributed for short strings.
 */
export function labelColour(label: string): string {
  let hash = 5381;
  for (let i = 0; i < label.length; i++) {
    hash = ((hash << 5) + hash + label.charCodeAt(i)) | 0;
  }
  return LABEL_COLOURS[Math.abs(hash) % LABEL_COLOURS.length];
}

/**
 * A due date is only interesting relative to today, so it renders as a short
 * date whose colour carries the urgency — overdue reads before you parse it.
 */
export function dueMeta(due: string | undefined, today: string) {
  if (!due) return null;
  const short = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" })
    .format(new Date(due + "T00:00:00"));
  if (due < today) return { text: short, tone: "bg-danger-tint text-danger", title: `Overdue — ${due}` };
  if (due === today) return { text: "Today", tone: "bg-warn-tint text-warn", title: `Due today — ${due}` };
  return { text: short, tone: "bg-subtle-2 text-muted", title: `Due ${due}` };
}
