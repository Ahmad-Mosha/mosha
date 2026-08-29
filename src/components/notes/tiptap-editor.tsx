"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Underline from "@tiptap/extension-underline";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code2,
  Minus,
  Highlighter,
  Copy,
  Check,
} from "lucide-react";

interface TipTapEditorProps {
  initialContent: string;
  onChange: (html: string, plainText: string) => void;
  placeholder?: string;
}

const HIGHLIGHT_COLORS = [
  { name: "Yellow", color: "#FEF08A" },
  { name: "Green", color: "#BBF7D0" },
  { name: "Blue", color: "#BFDBFE" },
  { name: "Rose", color: "#FECDD3" },
  { name: "Purple", color: "#E9D5FF" },
];

export function TipTapEditor({
  initialContent,
  onChange,
  placeholder = "Start writing your note, paste code, or organize with checklists...",
}: TipTapEditorProps) {
  const [copied, setCopied] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const [, setTick] = useState(0);

  // Store latest onChange in a ref so we never re-bind editor on parent re-renders
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Debounced auto-save timer ref (only serializes HTML when typing pauses, 0ms lag during typing/formatting)
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: {
          HTMLAttributes: {
            class:
              "bg-[#1E293B] text-[#F8FAFC] font-mono text-xs p-4 rounded-xl my-4 overflow-x-auto border border-[#334155]",
          },
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Underline,
    ],
    content: initialContent || "",
    onTransaction: () => {
      // Force instant toolbar active state sync on 60fps/120fps transactions
      setTick((t) => (t + 1) % 1000);
    },
    onUpdate: ({ editor }) => {
      // Debounce serialization so typing and toolbar clicks have ZERO main-thread lag
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const html = editor.getHTML();
        const text = editor.getText();
        onChangeRef.current(html, text);
      }, 400);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none focus:outline-none min-h-[500px] text-sm text-ink leading-relaxed p-6",
      },
    },
  });

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  if (!editor) return null;

  const handleCopy = () => {
    const text = editor.getText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const insertSymbol = (sym: string) => {
    editor.chain().focus().insertContent(` ${sym} `).run();
  };

  const insertCallout = (type: "tip" | "warning" | "note") => {
    const map = {
      tip: "💡 <strong>Tip:</strong> Key insight or optimization...",
      warning: "⚠️ <strong>Warning:</strong> Watch out for edge cases...",
      note: "📌 <strong>Note:</strong> Essential context or reminder...",
    };
    editor
      .chain()
      .focus()
      .insertContent(`<blockquote><p>${map[type]}</p></blockquote>`)
      .run();
  };

  return (
    <div className="flex flex-col h-full bg-surface-2 rounded-2xl border border-line shadow-xs overflow-hidden">
      {/* 1. Ultra-Fast Rich Text Formatting Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 px-4 py-2.5 bg-surface border-b border-line text-xs">
        <div className="flex flex-wrap items-center gap-0.5">
          {/* Headings */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleHeading({ level: 1 }).run();
            }}
            className={`p-1.5 rounded-lg hover:bg-subtle-2 cursor-pointer transition-colors ${
              editor.isActive("heading", { level: 1 })
                ? "bg-accent text-accent-fg"
                : "text-muted"
            }`}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleHeading({ level: 2 }).run();
            }}
            className={`p-1.5 rounded-lg hover:bg-subtle-2 cursor-pointer transition-colors ${
              editor.isActive("heading", { level: 2 })
                ? "bg-accent text-accent-fg"
                : "text-muted"
            }`}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleHeading({ level: 3 }).run();
            }}
            className={`p-1.5 rounded-lg hover:bg-subtle-2 cursor-pointer transition-colors ${
              editor.isActive("heading", { level: 3 })
                ? "bg-accent text-accent-fg"
                : "text-muted"
            }`}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-line mx-1" />

          {/* Inline Formats */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleBold().run();
            }}
            className={`p-1.5 rounded-lg hover:bg-subtle-2 cursor-pointer transition-colors ${
              editor.isActive("bold")
                ? "bg-accent text-accent-fg"
                : "text-muted"
            }`}
            title="Bold (⌘B)"
          >
            <Bold className="w-4 h-4" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleItalic().run();
            }}
            className={`p-1.5 rounded-lg hover:bg-subtle-2 cursor-pointer transition-colors ${
              editor.isActive("italic")
                ? "bg-accent text-accent-fg"
                : "text-muted"
            }`}
            title="Italic (⌘I)"
          >
            <Italic className="w-4 h-4" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleUnderline().run();
            }}
            className={`p-1.5 rounded-lg hover:bg-subtle-2 cursor-pointer transition-colors ${
              editor.isActive("underline")
                ? "bg-accent text-accent-fg"
                : "text-muted"
            }`}
            title="Underline (⌘U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleStrike().run();
            }}
            className={`p-1.5 rounded-lg hover:bg-subtle-2 cursor-pointer transition-colors ${
              editor.isActive("strike")
                ? "bg-accent text-accent-fg"
                : "text-muted"
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleCode().run();
            }}
            className={`p-1.5 rounded-lg hover:bg-subtle-2 cursor-pointer transition-colors ${
              editor.isActive("code")
                ? "bg-accent text-accent-fg"
                : "text-muted"
            }`}
            title="Inline Code"
          >
            <Code className="w-4 h-4" />
          </button>

          {/* Highlight Color Picker */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowHighlights(!showHighlights);
              }}
              className={`p-1.5 rounded-lg hover:bg-subtle-2 cursor-pointer transition-colors flex items-center gap-0.5 ${
                editor.isActive("highlight")
                  ? "bg-amber-100 text-amber-900"
                  : "text-muted"
              }`}
              title="Highlight Text"
            >
              <Highlighter className="w-4 h-4" />
            </button>

            {showHighlights && (
              <div className="absolute top-9 left-0 z-50 p-2 bg-surface-2 border border-line rounded-xl shadow-lg flex items-center gap-1.5 animate-in fade-in">
                {HIGHLIGHT_COLORS.map((h) => (
                  <button
                    key={h.name}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor
                        .chain()
                        .focus()
                        .toggleHighlight({ color: h.color })
                        .run();
                      setShowHighlights(false);
                    }}
                    style={{ backgroundColor: h.color }}
                    className="w-5 h-5 rounded-full border border-black/10 hover:scale-110 transition-transform cursor-pointer"
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
                  className="text-[10px] text-faint hover:text-black px-1 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="w-[1px] h-4 bg-line mx-1" />

          {/* Lists & Tasks */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleBulletList().run();
            }}
            className={`p-1.5 rounded-lg hover:bg-subtle-2 cursor-pointer transition-colors ${
              editor.isActive("bulletList")
                ? "bg-accent text-accent-fg"
                : "text-muted"
            }`}
            title="Bulleted List"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleOrderedList().run();
            }}
            className={`p-1.5 rounded-lg hover:bg-subtle-2 cursor-pointer transition-colors ${
              editor.isActive("orderedList")
                ? "bg-accent text-accent-fg"
                : "text-muted"
            }`}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleTaskList().run();
            }}
            className={`p-1.5 rounded-lg hover:bg-subtle-2 cursor-pointer transition-colors ${
              editor.isActive("taskList")
                ? "bg-accent text-accent-fg"
                : "text-muted"
            }`}
            title="Task Checklist"
          >
            <CheckSquare className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-line mx-1" />

          {/* Blocks */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleBlockquote().run();
            }}
            className={`p-1.5 rounded-lg hover:bg-subtle-2 cursor-pointer transition-colors ${
              editor.isActive("blockquote")
                ? "bg-accent text-accent-fg"
                : "text-muted"
            }`}
            title="Blockquote"
          >
            <Quote className="w-4 h-4" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleCodeBlock().run();
            }}
            className={`p-1.5 rounded-lg hover:bg-subtle-2 cursor-pointer transition-colors ${
              editor.isActive("codeBlock")
                ? "bg-accent text-accent-fg"
                : "text-muted"
            }`}
            title="Code Block"
          >
            <Code2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().setHorizontalRule().run();
            }}
            className="p-1.5 rounded-lg hover:bg-subtle-2 text-muted cursor-pointer transition-colors"
            title="Divider Line"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Right Tools: Quick Callouts, Symbols & Copy */}
        <div className="flex items-center space-x-1.5">
          {/* Quick Insert Callout */}
          <div className="flex items-center space-x-1 border border-line bg-surface-2 rounded-lg px-2 py-0.5 text-[11px]">
            <span className="text-faint text-[10px] uppercase font-mono">
              Callout:
            </span>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertCallout("tip");
              }}
              className="hover:bg-subtle-2 px-1 rounded cursor-pointer"
              title="Insert Tip Callout"
            >
              💡
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertCallout("note");
              }}
              className="hover:bg-subtle-2 px-1 rounded cursor-pointer"
              title="Insert Note Callout"
            >
              📌
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertCallout("warning");
              }}
              className="hover:bg-subtle-2 px-1 rounded cursor-pointer"
              title="Insert Warning Callout"
            >
              ⚠️
            </button>
          </div>

          {/* Quick Arrow Symbols */}
          <div className="hidden sm:flex items-center space-x-1 border border-line bg-surface-2 rounded-lg px-2 py-0.5 text-[11px] font-mono">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertSymbol("→");
              }}
              className="hover:bg-subtle-2 px-1 rounded cursor-pointer"
              title="Arrow Right"
            >
              →
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertSymbol("⇒");
              }}
              className="hover:bg-subtle-2 px-1 rounded cursor-pointer"
              title="Double Arrow"
            >
              ⇒
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertSymbol("✓");
              }}
              className="hover:bg-subtle-2 px-1 rounded cursor-pointer"
              title="Checkmark"
            >
              ✓
            </button>
          </div>

          {/* Copy Plain Text */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-subtle-2 text-muted hover:text-ink cursor-pointer transition-colors flex items-center gap-1 text-[11px]"
            title="Copy Text"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Editor Canvas */}
      <div className="flex-1 overflow-y-auto min-h-[500px]">
        <EditorContent editor={editor} />
      </div>

      {/* 3. Editor Status Bar */}
      <div className="px-5 py-2.5 border-t border-line bg-surface flex items-center justify-between text-[11px] font-mono text-faint">
        <span>
          {editor.getText().trim()
            ? editor.getText().trim().split(/\s+/).length
            : 0}{" "}
          words • {editor.getText().length} characters
        </span>
        <span className="text-[10px] text-ghost">
          Auto-saves in real-time
        </span>
      </div>
    </div>
  );
}
