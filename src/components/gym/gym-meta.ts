export const SPLIT_META: Record<string, { label: string; chip: string }> = {
  push: { label: "Push", chip: "bg-info-tint text-info" },
  pull: { label: "Pull", chip: "bg-shipped-tint text-shipped" },
  legs: { label: "Legs", chip: "bg-warn-tint text-warn" },
  upper: { label: "Upper", chip: "bg-success-tint text-success" },
  lower: { label: "Lower", chip: "bg-danger-tint text-danger" },
  full: { label: "Full body", chip: "bg-accent-soft text-ink-2" },
  other: { label: "Other", chip: "bg-subtle-2 text-muted" },
};

export const SPLIT_OPTIONS = Object.entries(SPLIT_META).map(([value, m]) => ({
  value,
  label: m.label,
}));

export const splitMeta = (s?: string) => SPLIT_META[s ?? "other"] ?? SPLIT_META.other;

/** Tonnage gets large fast; thousands are the readable unit. */
export const formatVolume = (kg: number) =>
  kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${Math.round(kg)}kg`;

export const newId = () => Math.random().toString(36).slice(2, 10);
