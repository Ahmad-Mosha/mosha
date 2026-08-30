import {
  BookOpen, FileText, Film, GraduationCap, Globe, Newspaper, Wrench,
} from "lucide-react";

/**
 * How the different kinds of source look. Everything you actually learn from
 * is here — including a PDF with no URL, because a file on your disk or one an
 * AI generated for you is still a resource worth tracking.
 */
export const RESOURCE_META: Record<
  string,
  { label: string; icon: React.ElementType; chip: string; text: string }
> = {
  course: { label: "Course", icon: GraduationCap, chip: "bg-info-tint text-info", text: "text-info" },
  book: { label: "Book", icon: BookOpen, chip: "bg-shipped-tint text-shipped", text: "text-shipped" },
  video: { label: "Video", icon: Film, chip: "bg-danger-tint text-danger", text: "text-danger" },
  article: { label: "Article", icon: Newspaper, chip: "bg-warn-tint text-warn", text: "text-warn" },
  pdf: { label: "PDF", icon: FileText, chip: "bg-success-tint text-success", text: "text-success" },
  docs: { label: "Docs", icon: Globe, chip: "bg-accent-soft text-ink-2", text: "text-muted" },
  other: { label: "Other", icon: Wrench, chip: "bg-subtle-2 text-muted", text: "text-muted" },
};

export const RESOURCE_OPTIONS = Object.entries(RESOURCE_META).map(([value, m]) => ({
  value,
  label: m.label,
}));

export const resourceMeta = (t?: string) => RESOURCE_META[t ?? "other"] ?? RESOURCE_META.other;

/** Where a resource sits in your queue. */
export const RESOURCE_STATUS: Record<string, { label: string; chip: string }> = {
  queued: { label: "Queued", chip: "bg-subtle-2 text-muted" },
  active: { label: "Reading", chip: "bg-info-tint text-info" },
  done: { label: "Finished", chip: "bg-success-tint text-success" },
};

export const RESOURCE_STATUS_OPTIONS = Object.entries(RESOURCE_STATUS).map(([value, m]) => ({
  value,
  label: m.label,
}));

/** A topic's place on the roadmap. */
export const TOPIC_STATUS: Record<string, { label: string; chip: string; dot: string }> = {
  todo: { label: "Not started", chip: "bg-subtle-2 text-muted", dot: "bg-line-2" },
  learning: { label: "Learning", chip: "bg-warn-tint text-warn", dot: "bg-warn" },
  done: { label: "Learned", chip: "bg-success-tint text-success", dot: "bg-success" },
};

export const TOPIC_STATUS_OPTIONS = Object.entries(TOPIC_STATUS).map(([value, m]) => ({
  value,
  label: m.label,
}));

export const TRACK_STATUS: Record<string, { label: string; chip: string; dot: string }> = {
  active: { label: "Active", chip: "bg-success-tint text-success", dot: "bg-success" },
  planned: { label: "Planned", chip: "bg-subtle-2 text-muted", dot: "bg-ghost" },
  paused: { label: "Paused", chip: "bg-warn-tint text-warn", dot: "bg-warn" },
  done: { label: "Finished", chip: "bg-shipped-tint text-shipped", dot: "bg-shipped" },
};

export const TRACK_STATUS_OPTIONS = Object.entries(TRACK_STATUS).map(([value, m]) => ({
  value,
  label: m.label,
}));
