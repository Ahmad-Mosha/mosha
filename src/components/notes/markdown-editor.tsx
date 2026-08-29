"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
);

interface MarkdownEditorProps {
  content: string;
  onChange: (value: string) => void;
}

export function MarkdownEditorComponent({
  content,
  onChange,
}: MarkdownEditorProps) {
  const [val, setVal] = useState(content || "");

  useEffect(() => {
    setVal(content || "");
  }, [content]);

  const handleChange = (v?: string) => {
    const next = v || "";
    setVal(next);
    onChange(next);
  };

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col" data-color-mode="light">
      <MDEditor
        value={val}
        onChange={handleChange}
        height={550}
        preview="edit"
        className="w-full h-full border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs"
      />
    </div>
  );
}
