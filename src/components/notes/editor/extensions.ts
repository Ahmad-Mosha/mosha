import { Extension } from "@tiptap/core";
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
import { lowlight } from "./lowlight";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CodeBlockView } from "./code-block";
import {
  backspaceIndent, dedentOnClose, shiftIndent, smartNewline,
} from "./code-indent";


/**
 * Tab nests the current list item instead of moving focus out of the editor.
 * Lower priority than the code block's own Tab handler, so inside a code block
 * indentation still wins; outside a list it returns false and Tab moves focus
 * as normal, which keyboard users rely on to leave the editor.
 */
const ListIndentKeymap = Extension.create({
  name: "listIndentKeymap",
  priority: 50,
  addKeyboardShortcuts() {
    return {
      Tab: () =>
        this.editor.commands.sinkListItem("listItem") ||
        this.editor.commands.sinkListItem("taskItem"),
      "Shift-Tab": () =>
        this.editor.commands.liftListItem("listItem") ||
        this.editor.commands.liftListItem("taskItem"),
    };
  },
});

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
        const inCode = () => this.editor.isActive("codeBlock");
        return {
          // Tab must indent inside a code block, not move focus out of it.
          Tab: () => inCode() && shiftIndent(this.editor, false),
          "Shift-Tab": () => inCode() && shiftIndent(this.editor, true),
          Enter: () => inCode() && smartNewline(this.editor),
          Backspace: () => inCode() && backspaceIndent(this.editor),
          // Closing brackets pull their own line back one level.
          "}": () => inCode() && dedentOnClose(this.editor, "}"),
          "]": () => inCode() && dedentOnClose(this.editor, "]"),
          ")": () => inCode() && dedentOnClose(this.editor, ")"),
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

    ListIndentKeymap,

    ...extra,
  ];
}
