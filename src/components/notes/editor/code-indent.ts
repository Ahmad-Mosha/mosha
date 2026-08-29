import type { Editor } from "@tiptap/core";
import type { EditorState } from "@tiptap/pm/state";

/**
 * Indentation behaviour inside code blocks. Without this, Enter drops you back
 * to column zero, which makes Python (and any braced language) painful to type.
 *
 * Two spaces is the unit. Tabs already in pasted code are respected when
 * measuring an existing line's indent, but new indentation is always spaces so
 * a block never ends up mixing both.
 */
const INDENT = "  ";

/** Lines ending in one of these open a new block, so the next line indents. */
const OPENS_BLOCK = /[:{[(]\s*$/;

/** Closing a block on its own line pulls that line back out one level. */
const CLOSES_BLOCK = /^\s*[}\])]/;

interface Ctx {
  blockStart: number;
  text: string;
  from: number;
  to: number;
}

function ctx(state: EditorState): Ctx | null {
  const { $from, from, to } = state.selection;
  if ($from.parent.type.name !== "codeBlock") return null;
  return { blockStart: $from.start(), text: $from.parent.textContent, from, to };
}

const leadingWhitespace = (line: string) => /^[ \t]*/.exec(line)![0];

const lineStartOffset = (text: string, offset: number) =>
  text.lastIndexOf("\n", offset - 1) + 1;

function lineAt(text: string, start: number): string {
  const end = text.indexOf("\n", start);
  return text.slice(start, end === -1 ? undefined : end);
}

/** Enter: carry the current indent down, and add a level after an opener. */
export function smartNewline(editor: Editor): boolean {
  const { state } = editor;
  const c = ctx(state);
  if (!c) return false;

  const cursor = c.from - c.blockStart;
  const lineStart = lineStartOffset(c.text, cursor);
  const before = c.text.slice(lineStart, cursor);
  const indent = leadingWhitespace(before);

  const next = "\n" + indent + (OPENS_BLOCK.test(before) ? INDENT : "");
  editor.view.dispatch(state.tr.insertText(next, c.from, c.to).scrollIntoView());
  return true;
}

/**
 * Tab / Shift-Tab. With a collapsed cursor Tab inserts one unit where you are;
 * with a selection it shifts every touched line, which is how you actually
 * re-indent a block of Python.
 */
export function shiftIndent(editor: Editor, outdent: boolean): boolean {
  const { state } = editor;
  const c = ctx(state);
  if (!c) return false;

  const fromOff = c.from - c.blockStart;
  const toOff = c.to - c.blockStart;

  if (!outdent && fromOff === toOff) {
    editor.view.dispatch(state.tr.insertText(INDENT, c.from).scrollIntoView());
    return true;
  }

  const starts: number[] = [];
  let i = lineStartOffset(c.text, fromOff);
  while (i <= toOff) {
    starts.push(i);
    const nl = c.text.indexOf("\n", i);
    if (nl === -1 || nl >= toOff) break;
    i = nl + 1;
  }

  const tr = state.tr;
  // Apply bottom-up so the offsets of earlier lines stay valid.
  for (const start of [...starts].reverse()) {
    const abs = c.blockStart + start;
    if (outdent) {
      const lead = leadingWhitespace(lineAt(c.text, start));
      const remove = Math.min(INDENT.length, lead.length);
      if (remove > 0) tr.delete(abs, abs + remove);
    } else {
      tr.insertText(INDENT, abs);
    }
  }

  if (!tr.docChanged) return false;
  editor.view.dispatch(tr.scrollIntoView());
  return true;
}

/** Backspace inside leading whitespace removes a whole indent unit, not one space. */
export function backspaceIndent(editor: Editor): boolean {
  const { state } = editor;
  const c = ctx(state);
  if (!c || c.from !== c.to) return false;

  const cursor = c.from - c.blockStart;
  const lineStart = lineStartOffset(c.text, cursor);
  const before = c.text.slice(lineStart, cursor);

  // Only when the cursor sits in pure indentation, on a unit boundary.
  if (before.length === 0 || !/^[ ]+$/.test(before)) return false;
  if (before.length % INDENT.length !== 0) return false;

  editor.view.dispatch(
    state.tr.delete(c.from - INDENT.length, c.from).scrollIntoView()
  );
  return true;
}

/**
 * Typing a closing bracket as the first thing on a line snaps that line back
 * one level, so `}` lands under its opener instead of under the body.
 */
export function dedentOnClose(editor: Editor, char: string): boolean {
  const { state } = editor;
  const c = ctx(state);
  if (!c || c.from !== c.to) return false;

  const cursor = c.from - c.blockStart;
  const lineStart = lineStartOffset(c.text, cursor);
  const before = c.text.slice(lineStart, cursor);

  if (!/^[ ]+$/.test(before)) return false;
  if (!CLOSES_BLOCK.test(char)) return false;
  if (before.length < INDENT.length) return false;

  const abs = c.blockStart + lineStart;
  const tr = state.tr.delete(abs, abs + INDENT.length);
  tr.insertText(char, tr.mapping.map(c.from));
  editor.view.dispatch(tr.scrollIntoView());
  return true;
}
