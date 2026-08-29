"use client";

import React, { useEffect, useRef, useState } from "react";
import { NodeViewContent, NodeViewWrapper, ReactNodeViewProps } from "@tiptap/react";
import { Check, Copy, Sparkles } from "lucide-react";
import { detectLanguage } from "./detect-language";
/** Languages offered in the code-block picker, in the order they appear. */
export const CODE_LANGUAGES = [
  { value: "plaintext", label: "Plain text" },
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "tsx", label: "TSX / JSX" },
  { value: "python", label: "Python" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash / Shell" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "css", label: "CSS" },
  { value: "xml", label: "HTML / XML" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "dockerfile", label: "Dockerfile" },
  { value: "diff", label: "Diff" },
];


/**
 * Code blocks previously had no language at all — the hljs theme in globals.css
 * could never fire because nothing set a language class. This node view exposes
 * the picker and keeps the choice on the node, so it survives save/reload.
 */
export function CodeBlockView({ node, updateAttributes }: ReactNodeViewProps) {
  const [copied, setCopied] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);
  // Once you choose a language by hand, detection stops arguing with you.
  const userPicked = useRef(false);
  const language: string = node.attrs.language || "plaintext";
  const code = node.textContent;

  useEffect(() => {
    if (userPicked.current) return;
    if (language !== "plaintext") return;

    // Debounced: guessing on every keystroke makes the label flicker while a
    // line is still half-written.
    const t = setTimeout(() => {
      const guess = detectLanguage(code);
      if (guess && CODE_LANGUAGES.some((l) => l.value === guess)) {
        updateAttributes({ language: guess });
        setAutoDetected(true);
      }
    }, 600);

    return () => clearTimeout(t);
  }, [code, language, updateAttributes]);

  const copy = () => {
    navigator.clipboard.writeText(node.textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <NodeViewWrapper className="relative group/code my-3">
      <div
        className="absolute right-2 top-2 z-10 flex items-center gap-1
                   opacity-0 group-hover/code:opacity-100 focus-within:opacity-100
                   transition-opacity duration-150"
        contentEditable={false}
      >
        {autoDetected && (
          <span
            title="Language detected automatically — pick one to override"
            className="flex items-center gap-1 rounded-md border border-white/10
                       bg-white/10 px-1.5 py-1 text-meta text-[#C8CEDA]"
          >
            <Sparkles className="h-3 w-3" />
            auto
          </span>
        )}

        <select
          value={language}
          onChange={(e) => {
            userPicked.current = true;
            setAutoDetected(false);
            updateAttributes({ language: e.target.value });
          }}
          // Native select is deliberate here: it sits inside contentEditable,
          // where a portalled listbox steals the selection and breaks typing.
          className="appearance-none rounded-md bg-white/10 px-2 py-1 text-meta
                     font-mono text-[#C8CEDA] outline-none hover:bg-white/15
                     cursor-pointer border border-white/10"
          aria-label="Code language"
        >
          {CODE_LANGUAGES.map((l) => (
            <option key={l.value} value={l.value} className="text-ink bg-surface-2">
              {l.label}
            </option>
          ))}
        </select>

        <button
          onClick={copy}
          type="button"
          className="rounded-md bg-white/10 p-1.5 text-[#C8CEDA] hover:bg-white/15
                     transition-colors cursor-pointer border border-white/10"
          title="Copy code"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-success" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      <pre className="!my-0">
        {/* lowlight emits hljs spans into a <code>; the prop's type is
            narrowed to "div" upstream, hence the cast. */}
        <NodeViewContent as={"code" as "div"} className={`language-${language}`} />
      </pre>
    </NodeViewWrapper>
  );
}
