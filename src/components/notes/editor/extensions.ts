import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import Underline from "@tiptap/extension-underline";
import Typography from "@tiptap/extension-typography";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { TableKit } from "@tiptap/extension-table";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CodeBlockView } from "./code-block";

/**
 * `common` covers the 37 languages worth highlighting (js/ts/py/go/rust/sql/
 * bash/json/yaml...). The full set is 192 and five times the bundle for
 * languages this notebook will never see.
 */
export const lowlight = createLowlight(common);


interface BuildOptions {
  placeholder: string;
  /** Extra extensions (slash menu, wikilinks) that need call-site context. */
  extra?: any[];
}

export function buildExtensions({ placeholder, extra = [] }: BuildOptions) {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      // Replaced below by the lowlight version, which actually highlights.
      codeBlock: false,
      link: false,
    }),

    CodeBlockLowlight.extend({
      addNodeView: () => ReactNodeViewRenderer(CodeBlockView),
      addKeyboardShortcuts() {
        return {
          // Tab must indent inside a code block, not move focus out of it.
          Tab: () => {
            if (!this.editor.isActive("codeBlock")) return false;
            this.editor.commands.insertContent("  ");
            return true;
          },
        };
      },
    }).configure({
      lowlight,
      defaultLanguage: "plaintext",
      exitOnTripleEnter: false,
      exitOnArrowDown: true,
    }),

    Placeholder.configure({
      placeholder: ({ node }) =>
        node.type.name === "heading"
          ? "Heading"
          : node.type.name === "codeBlock"
            ? ""
            : placeholder,
      includeChildren: true,
    }),

    Highlight.configure({ multicolor: true }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Underline,

    // Turns -- into –, (c) into ©, -> into →. Replaces the old row of manual
    // symbol-insert buttons in the toolbar.
    Typography,

    Link.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: {
        class: "text-info underline underline-offset-2 cursor-pointer",
      },
    }),

    Image.configure({
      inline: false,
      HTMLAttributes: { class: "rounded-xl max-w-full my-3" },
    }),

    TableKit.configure({
      table: { resizable: true, HTMLAttributes: { class: "mosha-table" } },
    }),

    ...extra,
  ];
}
