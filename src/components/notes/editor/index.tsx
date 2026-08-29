"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  EditorContent,
  useEditor,
  useEditorState,
} from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  Bold, Code, Highlighter, Italic, Link as LinkIcon,
  Strikethrough, Underline as UnderlineIcon,
} from "lucide-react";
import { buildExtensions } from "./extensions";
import { SlashMenu } from "./slash-menu";
import { Toolbar } from "./toolbar";

interface Props {
  initialContent: string;
  onChange: (html: string, plainText: string) => void;
  placeholder?: string;
}

/** Serialising the document is O(doc); do it when typing pauses, not per key. */
const SAVE_DEBOUNCE_MS = 500;

export function NoteEditor({
  initialContent,
  onChange,
  placeholder = "Write, or press / for blocks…",
}: Props) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "pending" | "saved">("idle");
  const [counts, setCounts] = useState({ words: 0, chars: 0 });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: buildExtensions({ placeholder, extra: [SlashMenu] }),
    content: initialContent || "",
    editorProps: {
      attributes: {
        class:
          "tiptap focus:outline-none text-body text-ink-2 px-14 md:px-20 py-8 min-h-[60vh]",
      },
    },
    onUpdate: ({ editor }) => {
      setSaveState("pending");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const text = editor.getText();
        onChangeRef.current(editor.getHTML(), text);
        // Counts ride along with the save we already pay for, so typing costs
        // no extra document traversal.
        setCounts(countOf(text));
        setSaveState("saved");
      }, SAVE_DEBOUNCE_MS);
    },
  });

  // Seed the counts once the document is parsed.
  useEffect(() => {
    if (editor) setCounts(countOf(editor.getText()));
  }, [editor]);

  // Flush a pending save on unmount so switching notes never drops the last
  // few keystrokes typed inside the debounce window.
  const flush = useCallback(() => {
    if (!saveTimer.current || !editor) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = null;
    onChangeRef.current(editor.getHTML(), editor.getText());
  }, [editor]);

  useEffect(() => flush, [flush]);

  if (!editor) return null;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface-2">
      <Toolbar editor={editor} />

      {/* One scroll container. The old layout nested an overflow-y-auto inside
          another, which gave the note two scrollbars and scrolled the toolbar
          out of reach. */}
      <div className="flex-1 overflow-y-auto" onBlur={flush}>
        <div className="mx-auto w-full max-w-3xl">
          <EditorContent editor={editor} />
        </div>
      </div>

      <BubbleMenu
        editor={editor}
        // A selection inside a code block wants the language picker, not text
        // formatting, so suppress the bubble there.
        shouldShow={({ editor, from, to }) =>
          from !== to && !editor.isActive("codeBlock")
        }
        className="flex items-center gap-0.5 rounded-xl border border-line
                   bg-surface-2 p-1 shadow-lg shadow-black/10"
      >
        <BubbleButtons editor={editor} />
      </BubbleMenu>

      <StatusBar words={counts.words} chars={counts.chars} saveState={saveState} />
    </div>
  );
}

function BubbleButtons({ editor }: { editor: any }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      link: e.isActive("link"),
      highlight: e.isActive("highlight"),
    }),
  });

  const item = (
    active: boolean,
    run: () => void,
    title: string,
    Icon: React.ElementType
  ) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); run(); }}
      className={`grid h-7 w-7 place-items-center rounded-md transition-colors cursor-pointer ${
        active ? "bg-accent text-accent-fg" : "text-muted hover:bg-subtle-2 hover:text-ink"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );

  return (
    <>
      {item(s.bold, () => editor.chain().focus().toggleBold().run(), "Bold", Bold)}
      {item(s.italic, () => editor.chain().focus().toggleItalic().run(), "Italic", Italic)}
      {item(s.underline, () => editor.chain().focus().toggleUnderline().run(), "Underline", UnderlineIcon)}
      {item(s.strike, () => editor.chain().focus().toggleStrike().run(), "Strikethrough", Strikethrough)}
      {item(s.code, () => editor.chain().focus().toggleCode().run(), "Code", Code)}
      {item(
        s.highlight,
        () => editor.chain().focus().toggleHighlight({ color: "#FEF08A" }).run(),
        "Highlight",
        Highlighter
      )}
      {item(
        s.link,
        () => {
          const url = window.prompt("Link URL", editor.getAttributes("link").href || "https://");
          if (url === null) return;
          if (url === "") editor.chain().focus().extendMarkRange("link").unsetLink().run();
          else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        },
        "Link",
        LinkIcon
      )}
    </>
  );
}

function countOf(text: string) {
  const trimmed = text.trim();
  return {
    words: trimmed ? trimmed.split(/\s+/).length : 0,
    chars: text.length,
  };
}

function StatusBar({
  words,
  chars,
  saveState,
}: {
  words: number;
  chars: number;
  saveState: "idle" | "pending" | "saved";
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-between border-t border-line
                 bg-surface px-5 py-2 font-mono text-meta text-faint"
    >
      <span>
        {words} {words === 1 ? "word" : "words"} · {chars} characters
      </span>
      <span className={saveState === "pending" ? "text-warn" : "text-faint"}>
        {saveState === "pending" ? "Saving…" : saveState === "saved" ? "Saved" : "Ready"}
      </span>
    </div>
  );
}
