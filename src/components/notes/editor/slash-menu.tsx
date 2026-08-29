"use client";

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Extension, type Editor, type Range } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import {
  Code2, Heading1, Heading2, Heading3, Image as ImageIcon, List,
  ListOrdered, ListChecks, Minus, Quote, Table as TableIcon, Type,
} from "lucide-react";

interface Item {
  title: string;
  hint: string;
  icon: React.ElementType;
  /** Extra words that should match this item without appearing in the label. */
  keywords?: string;
  run: (editor: Editor, range: Range) => void;
}

const ITEMS: Item[] = [
  { title: "Text", hint: "Plain paragraph", icon: Type, keywords: "paragraph body",
    run: (e, r) => e.chain().focus().deleteRange(r).setNode("paragraph").run() },
  { title: "Heading 1", hint: "Large section title", icon: Heading1, keywords: "h1 title",
    run: (e, r) => e.chain().focus().deleteRange(r).setNode("heading", { level: 1 }).run() },
  { title: "Heading 2", hint: "Medium section title", icon: Heading2, keywords: "h2",
    run: (e, r) => e.chain().focus().deleteRange(r).setNode("heading", { level: 2 }).run() },
  { title: "Heading 3", hint: "Small section title", icon: Heading3, keywords: "h3",
    run: (e, r) => e.chain().focus().deleteRange(r).setNode("heading", { level: 3 }).run() },
  { title: "Bullet list", hint: "Unordered list", icon: List, keywords: "ul unordered",
    run: (e, r) => e.chain().focus().deleteRange(r).toggleBulletList().run() },
  { title: "Numbered list", hint: "Ordered list", icon: ListOrdered, keywords: "ol ordered",
    run: (e, r) => e.chain().focus().deleteRange(r).toggleOrderedList().run() },
  { title: "To-do list", hint: "Checkbox checklist", icon: ListChecks, keywords: "task check todo",
    run: (e, r) => e.chain().focus().deleteRange(r).toggleTaskList().run() },
  { title: "Code block", hint: "Syntax-highlighted code", icon: Code2, keywords: "snippet pre",
    run: (e, r) => e.chain().focus().deleteRange(r).setCodeBlock().run() },
  { title: "Quote", hint: "Blockquote callout", icon: Quote, keywords: "blockquote citation",
    run: (e, r) => e.chain().focus().deleteRange(r).toggleBlockquote().run() },
  { title: "Table", hint: "3 x 3 with header row", icon: TableIcon, keywords: "grid",
    run: (e, r) => e.chain().focus().deleteRange(r)
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  { title: "Divider", hint: "Horizontal rule", icon: Minus, keywords: "hr line separator",
    run: (e, r) => e.chain().focus().deleteRange(r).setHorizontalRule().run() },
  { title: "Image", hint: "Embed by URL", icon: ImageIcon, keywords: "picture photo img",
    run: (e, r) => {
      const src = window.prompt("Image URL");
      if (src) e.chain().focus().deleteRange(r).setImage({ src }).run();
      else e.chain().focus().deleteRange(r).run();
    } },
];

export interface SlashListHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const SlashList = forwardRef<SlashListHandle, any>(({ items, command }, ref) => {
  const [selected, setSelected] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => setSelected(0), [items]);

  // Keep the active row in view while arrowing past the visible window.
  useLayoutEffect(() => {
    listRef.current
      ?.querySelectorAll("[data-row]")
      [selected]?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        setSelected((s) => (s + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelected((s) => (s + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        if (items[selected]) command(items[selected]);
        return true;
      }
      return false;
    },
  }));

  if (!items.length) return null;

  return (
    <div
      ref={listRef}
      className="w-64 max-h-72 overflow-y-auto rounded-xl border border-line
                 bg-surface-2 p-1 shadow-lg shadow-black/10"
    >
      {items.map((item: Item, i: number) => {
        const Icon = item.icon;
        return (
          <button
            key={item.title}
            data-row
            type="button"
            onMouseDown={(e) => { e.preventDefault(); command(item); }}
            onMouseEnter={() => setSelected(i)}
            className={`w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5
                        text-left transition-colors cursor-pointer ${
                          i === selected ? "bg-subtle" : ""
                        }`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center
                             rounded-md border border-line bg-surface text-muted">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-label font-medium text-ink">
                {item.title}
              </span>
              <span className="block truncate text-meta text-faint">{item.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
});
SlashList.displayName = "SlashList";

/**
 * `/` at the start of an empty block opens a block inserter, the way Notion and
 * Obsidian do. Positioned against the caret rect directly — a popup library for
 * one absolutely-positioned panel is not worth the dependency.
 */
export const SlashMenu = Extension.create({
  name: "slashMenu",

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: "/",
        startOfLine: true,
        allowSpaces: false,

        items: ({ query }) => {
          const q = query.toLowerCase();
          return ITEMS.filter(
            (i) =>
              i.title.toLowerCase().includes(q) ||
              i.keywords?.toLowerCase().includes(q)
          ).slice(0, 10);
        },

        command: ({ editor, range, props }) => props.run(editor, range),

        render: () => {
          let renderer: ReactRenderer<SlashListHandle> | null = null;
          let el: HTMLDivElement | null = null;

          const place = (rect: DOMRect | null) => {
            if (!el || !rect) return;
            // Flip above the caret when there is not room below it.
            const below = window.innerHeight - rect.bottom;
            const height = el.offsetHeight || 288;
            const top = below < height + 16 ? rect.top - height - 6 : rect.bottom + 6;
            el.style.left = `${Math.min(rect.left, window.innerWidth - 272)}px`;
            el.style.top = `${Math.max(8, top)}px`;
          };

          return {
            onStart: (props) => {
              renderer = new ReactRenderer(SlashList, { props, editor: props.editor });
              el = document.createElement("div");
              el.style.position = "fixed";
              el.style.zIndex = "120";
              el.appendChild(renderer.element);
              document.body.appendChild(el);
              place(props.clientRect?.() ?? null);
            },
            onUpdate: (props) => {
              renderer?.updateProps(props);
              place(props.clientRect?.() ?? null);
            },
            onKeyDown: (props) => {
              if (props.event.key === "Escape") {
                el?.remove();
                return true;
              }
              return renderer?.ref?.onKeyDown(props) ?? false;
            },
            onExit: () => {
              el?.remove();
              renderer?.destroy();
              el = null;
              renderer = null;
            },
          };
        },
      }),
    ];
  },
});
