"use client";

import React, { useState } from "react";
import { Editor, useEditorState } from "@tiptap/react";
import {
  Bold, Code, Code2, Heading1, Heading2, Heading3, Highlighter, Italic,
  Link as LinkIcon, List, ListChecks, ListOrdered, Minus, Quote,
  Redo2, Strikethrough, Table as TableIcon, Underline as UnderlineIcon, Undo2,
} from "lucide-react";

const HIGHLIGHTS = [
  { name: "Yellow", color: "#FEF08A" },
  { name: "Green", color: "#BBF7D0" },
  { name: "Blue", color: "#BFDBFE" },
  { name: "Rose", color: "#FECDD3" },
  { name: "Purple", color: "#E9D5FF" },
];

function Btn({
  active, onRun, title, children, disabled,
}: {
  active?: boolean;
  onRun: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      // mouseDown + preventDefault keeps the selection in the document; a plain
      // onClick blurs the editor first and the command applies to nothing.
      onMouseDown={(e) => { e.preventDefault(); onRun(); }}
      title={title}
      aria-pressed={active}
      className={`grid h-7 w-7 place-items-center rounded-md transition-colors cursor-pointer
        disabled:opacity-30 disabled:cursor-default ${
          active
            ? "bg-accent text-accent-fg"
            : "text-muted hover:bg-subtle-2 hover:text-ink"
        }`}
    >
      {children}
    </button>
  );
}

const Divider = () => <span className="mx-1 h-4 w-px bg-line" />;

export function Toolbar({ editor }: { editor: Editor }) {
  const [showHighlights, setShowHighlights] = useState(false);

  /**
   * The whole performance fix. The previous version called setState on every
   * ProseMirror transaction, re-rendering the entire editor on each keystroke.
   * useEditorState subscribes to exactly these booleans and re-renders only
   * when one of them actually flips.
   */
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h1: e.isActive("heading", { level: 1 }),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      link: e.isActive("link"),
      highlight: e.isActive("highlight"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      task: e.isActive("taskList"),
      quote: e.isActive("blockquote"),
      codeBlock: e.isActive("codeBlock"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const setLink = () => {
    const previous = editor.getAttributes("link").href;
    const url = window.prompt("Link URL", previous || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div
      className="sticky top-0 z-20 flex flex-wrap items-center gap-0.5 border-b
                 border-line bg-surface/85 px-3 py-1.5 backdrop-blur-md"
    >
      <Btn active={s.h1} onRun={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">
        <Heading1 className="h-4 w-4" />
      </Btn>
      <Btn active={s.h2} onRun={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
        <Heading2 className="h-4 w-4" />
      </Btn>
      <Btn active={s.h3} onRun={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
        <Heading3 className="h-4 w-4" />
      </Btn>

      <Divider />

      <Btn active={s.bold} onRun={() => editor.chain().focus().toggleBold().run()} title="Bold  ⌘B">
        <Bold className="h-4 w-4" />
      </Btn>
      <Btn active={s.italic} onRun={() => editor.chain().focus().toggleItalic().run()} title="Italic  ⌘I">
        <Italic className="h-4 w-4" />
      </Btn>
      <Btn active={s.underline} onRun={() => editor.chain().focus().toggleUnderline().run()} title="Underline  ⌘U">
        <UnderlineIcon className="h-4 w-4" />
      </Btn>
      <Btn active={s.strike} onRun={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
        <Strikethrough className="h-4 w-4" />
      </Btn>
      <Btn active={s.code} onRun={() => editor.chain().focus().toggleCode().run()} title="Inline code">
        <Code className="h-4 w-4" />
      </Btn>
      <Btn active={s.link} onRun={setLink} title="Link">
        <LinkIcon className="h-4 w-4" />
      </Btn>

      <div className="relative">
        <Btn
          active={s.highlight}
          onRun={() => setShowHighlights((v) => !v)}
          title="Highlight"
        >
          <Highlighter className="h-4 w-4" />
        </Btn>
        {showHighlights && (
          <div
            className="absolute left-0 top-9 z-50 flex items-center gap-1.5 rounded-xl
                       border border-line bg-surface-2 p-2 shadow-lg"
          >
            {HIGHLIGHTS.map((h) => (
              <button
                key={h.name}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  editor.chain().focus().toggleHighlight({ color: h.color }).run();
                  setShowHighlights(false);
                }}
                style={{ backgroundColor: h.color }}
                className="h-5 w-5 rounded-full border border-black/10
                           transition-transform hover:scale-110 cursor-pointer"
                title={h.name}
              />
            ))}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().unsetHighlight().run();
                setShowHighlights(false);
              }}
              className="px-1 text-meta text-faint hover:text-ink cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <Divider />

      <Btn active={s.bullet} onRun={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
        <List className="h-4 w-4" />
      </Btn>
      <Btn active={s.ordered} onRun={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
        <ListOrdered className="h-4 w-4" />
      </Btn>
      <Btn active={s.task} onRun={() => editor.chain().focus().toggleTaskList().run()} title="To-do list">
        <ListChecks className="h-4 w-4" />
      </Btn>

      <Divider />

      <Btn active={s.quote} onRun={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">
        <Quote className="h-4 w-4" />
      </Btn>
      <Btn active={s.codeBlock} onRun={() => editor.chain().focus().toggleCodeBlock().run()} title="Code block">
        <Code2 className="h-4 w-4" />
      </Btn>
      <Btn
        onRun={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="Table"
      >
        <TableIcon className="h-4 w-4" />
      </Btn>
      <Btn onRun={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
        <Minus className="h-4 w-4" />
      </Btn>

      <div className="ml-auto flex items-center gap-0.5">
        <Btn disabled={!s.canUndo} onRun={() => editor.chain().focus().undo().run()} title="Undo  ⌘Z">
          <Undo2 className="h-4 w-4" />
        </Btn>
        <Btn disabled={!s.canRedo} onRun={() => editor.chain().focus().redo().run()} title="Redo  ⇧⌘Z">
          <Redo2 className="h-4 w-4" />
        </Btn>
      </div>
    </div>
  );
}
