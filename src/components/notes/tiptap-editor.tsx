"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { all, createLowlight } from "lowlight";
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

const lowlight = createLowlight(all);

interface TipTapEditorProps {
  content: string;
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
  content,
  onChange,
  placeholder = "Start writing, typing '/' for markdown, or structure your thoughts...",
}: TipTapEditorProps) {
  const [copied, setCopied] = React.useState(false);
  const [showHighlights, setShowHighlights] = React.useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disabled in favor of syntax highlighted CodeBlockLowlight
        heading: {
          levels: [1, 2, 3],
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
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
      TextStyle,
      Color,
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      onChange(html, text);
    },
    editorProps: {
      attributes: {
        class:
          "prose max-w-none focus:outline-none min-h-[380px] text-sm text-[#1A202C] leading-relaxed p-4",
      },
    },
  });

  // Sync content when active note changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

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
      note: "📌 <strong>Note:</strong> Essential architectural context...",
    };
    editor.chain().focus().insertContent(`<blockquote><p>${map[type]}</p></blockquote>`).run();
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-[#E2E8F0] shadow-2xs overflow-hidden">
      {/* 1. Rich Text Formatting Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 p-2 bg-[#FAFAFA] border-b border-[#ECEAE4] text-xs">
        <div className="flex flex-wrap items-center gap-0.5">
          {/* Headings */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded hover:bg-[#EDF2F7] cursor-pointer transition-colors ${
              editor.isActive("heading", { level: 1 }) ? "bg-[#333E50] text-white" : "text-[#4A5568]"
            }`}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded hover:bg-[#EDF2F7] cursor-pointer transition-colors ${
              editor.isActive("heading", { level: 2 }) ? "bg-[#333E50] text-white" : "text-[#4A5568]"
            }`}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded hover:bg-[#EDF2F7] cursor-pointer transition-colors ${
              editor.isActive("heading", { level: 3 }) ? "bg-[#333E50] text-white" : "text-[#4A5568]"
            }`}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-[#E2E8F0] mx-1" />

          {/* Inline Formats */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-[#EDF2F7] cursor-pointer transition-colors ${
              editor.isActive("bold") ? "bg-[#333E50] text-white" : "text-[#4A5568]"
            }`}
            title="Bold (⌘B)"
          >
            <Bold className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-[#EDF2F7] cursor-pointer transition-colors ${
              editor.isActive("italic") ? "bg-[#333E50] text-white" : "text-[#4A5568]"
            }`}
            title="Italic (⌘I)"
          >
            <Italic className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded hover:bg-[#EDF2F7] cursor-pointer transition-colors ${
              editor.isActive("underline") ? "bg-[#333E50] text-white" : "text-[#4A5568]"
            }`}
            title="Underline (⌘U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded hover:bg-[#EDF2F7] cursor-pointer transition-colors ${
              editor.isActive("strike") ? "bg-[#333E50] text-white" : "text-[#4A5568]"
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-1.5 rounded hover:bg-[#EDF2F7] cursor-pointer transition-colors ${
              editor.isActive("code") ? "bg-[#333E50] text-white" : "text-[#4A5568]"
            }`}
            title="Inline Code"
          >
            <Code className="w-4 h-4" />
          </button>

          {/* Highlight Color Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowHighlights(!showHighlights)}
              className={`p-1.5 rounded hover:bg-[#EDF2F7] cursor-pointer transition-colors flex items-center gap-0.5 ${
                editor.isActive("highlight") ? "bg-amber-100 text-amber-900" : "text-[#4A5568]"
              }`}
              title="Highlight Text"
            >
              <Highlighter className="w-4 h-4" />
            </button>

            {showHighlights && (
              <div className="absolute top-8 left-0 z-50 p-1.5 bg-white border border-[#E2E8F0] rounded-lg shadow-lg flex items-center gap-1.5 animate-in fade-in">
                {HIGHLIGHT_COLORS.map((h) => (
                  <button
                    key={h.name}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().toggleHighlight({ color: h.color }).run();
                      setShowHighlights(false);
                    }}
                    style={{ backgroundColor: h.color }}
                    className="w-5 h-5 rounded-full border border-black/10 hover:scale-110 transition-transform cursor-pointer"
                    title={h.name}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetHighlight().run();
                    setShowHighlights(false);
                  }}
                  className="text-[10px] text-[#718096] hover:text-black px-1"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="w-[1px] h-4 bg-[#E2E8F0] mx-1" />

          {/* Lists & Tasks */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded hover:bg-[#EDF2F7] cursor-pointer transition-colors ${
              editor.isActive("bulletList") ? "bg-[#333E50] text-white" : "text-[#4A5568]"
            }`}
            title="Bulleted List"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded hover:bg-[#EDF2F7] cursor-pointer transition-colors ${
              editor.isActive("orderedList") ? "bg-[#333E50] text-white" : "text-[#4A5568]"
            }`}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`p-1.5 rounded hover:bg-[#EDF2F7] cursor-pointer transition-colors ${
              editor.isActive("taskList") ? "bg-[#333E50] text-white" : "text-[#4A5568]"
            }`}
            title="Task Checklist"
          >
            <CheckSquare className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-[#E2E8F0] mx-1" />

          {/* Blocks */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded hover:bg-[#EDF2F7] cursor-pointer transition-colors ${
              editor.isActive("blockquote") ? "bg-[#333E50] text-white" : "text-[#4A5568]"
            }`}
            title="Blockquote"
          >
            <Quote className="w-4 h-4" />
          </button>

          {/* Colorized Code Block */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-1.5 rounded hover:bg-[#EDF2F7] cursor-pointer transition-colors flex items-center gap-1 ${
              editor.isActive("codeBlock") ? "bg-[#333E50] text-white" : "text-[#4A5568]"
            }`}
            title="Colorized Code Block (with syntax highlighting)"
          >
            <Code2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded hover:bg-[#EDF2F7] text-[#4A5568] cursor-pointer"
            title="Divider Line"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Right Tools: Insert Callouts, Symbols & Copy */}
        <div className="flex items-center space-x-1.5">
          {/* Quick Insert Callout */}
          <div className="flex items-center space-x-1 border border-[#E2E8F0] bg-white rounded-md px-1.5 py-0.5 text-[11px]">
            <span className="text-[#718096]">Insert:</span>
            <button
              type="button"
              onClick={() => insertCallout("tip")}
              className="hover:bg-[#F1F3F5] px-1 rounded cursor-pointer"
              title="Insert Tip Callout"
            >
              💡
            </button>
            <button
              type="button"
              onClick={() => insertCallout("note")}
              className="hover:bg-[#F1F3F5] px-1 rounded cursor-pointer"
              title="Insert Note Callout"
            >
              📌
            </button>
            <button
              type="button"
              onClick={() => insertCallout("warning")}
              className="hover:bg-[#F1F3F5] px-1 rounded cursor-pointer"
              title="Insert Warning Callout"
            >
              ⚠️
            </button>
          </div>

          {/* Quick Arrow Symbols */}
          <div className="hidden sm:flex items-center space-x-1 border border-[#E2E8F0] bg-white rounded-md px-1.5 py-0.5 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => insertSymbol("→")}
              className="hover:bg-[#F1F3F5] px-1 rounded cursor-pointer"
              title="Arrow Right"
            >
              →
            </button>
            <button
              type="button"
              onClick={() => insertSymbol("⇒")}
              className="hover:bg-[#F1F3F5] px-1 rounded cursor-pointer"
              title="Double Arrow"
            >
              ⇒
            </button>
            <button
              type="button"
              onClick={() => insertSymbol("✓")}
              className="hover:bg-[#F1F3F5] px-1 rounded cursor-pointer"
              title="Checkmark"
            >
              ✓
            </button>
          </div>

          {/* Copy Plain Text */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-[#EDF2F7] text-[#4A5568] hover:text-[#1A202C] cursor-pointer transition-colors flex items-center gap-1 text-[11px]"
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
      <div className="flex-1 overflow-y-auto min-h-[420px] max-h-[70vh]">
        <EditorContent editor={editor} />
      </div>

      {/* 3. Editor Status Bar */}
      <div className="px-4 py-2 border-t border-[#ECEAE4] bg-[#FAFAFA] flex items-center justify-between text-[11px] font-mono text-[#718096]">
        <span>
          {editor.getText().trim() ? editor.getText().trim().split(/\s+/).length : 0} words •{" "}
          {editor.getText().length} characters
        </span>
        <span className="text-[10px] text-[#A0AEC0]">
          Auto-saves in real-time
        </span>
      </div>
    </div>
  );
}
