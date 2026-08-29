/**
 * Guess a code block's language from distinctive syntax.
 *
 * highlight.js's own `highlightAuto` is built for whole files and is unusable
 * on the short snippets people actually paste into notes — it scores
 * `let x = 10; console.log(x)` as CSS, and a clean JS sample as INI. A wrong
 * confident label is worse than none, so this matches only on markers that
 * are hard to mistake, and returns null when nothing is convincing.
 *
 * Order matters: the more specific dialect wins over the family it belongs to
 * (TypeScript before JavaScript, C++ before C).
 */
const RULES: [RegExp, string][] = [
  [/^\s*<\?php/m, "php"],
  [/^\s*(?:FROM|RUN|CMD|ENTRYPOINT)\s+\S/m, "dockerfile"],
  [/^\s*(?:SELECT|INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|CREATE\s+TABLE)\b/im, "sql"],
  [/^\s*(?:def|async\s+def)\s+\w+\s*\(|^\s*(?:from|import)\s+\w+.*$|^\s*class\s+\w+.*:\s*$|\bprint\(/m, "python"],
  [/^\s*package\s+\w+|^\s*func\s+\w*\s*\(|:=/m, "go"],
  [/^\s*(?:pub\s+)?fn\s+\w+|let\s+mut\s+|^\s*impl\s+\w+|::<|&str\b/m, "rust"],
  [/^\s*#include\s*[<"]|std::|\bcout\s*<</m, "cpp"],
  [/^\s*(?:public|private|protected)\s+(?:static\s+)?(?:void|int|String|class)\s/m, "java"],
  [/\binterface\s+\w+\s*\{|\btype\s+\w+\s*=|:\s*(?:string|number|boolean|void|any)\b|\bas\s+\w+\b/m, "typescript"],
  [/\b(?:const|let|var)\s+\w+\s*=|console\.(?:log|error|warn)\(|=>\s*[{(]|\brequire\(/m, "javascript"],
  [/^\s*(?:#!\/bin\/(?:ba)?sh|sudo\s|apt(?:-get)?\s|npm\s|pnpm\s|git\s|cd\s|echo\s)/m, "bash"],
  [/^\s*(?:<!DOCTYPE|<html|<\/?[a-z][\w-]*\s*\/?>)/im, "xml"],
  [/^\s*[.#]?[\w-]+\s*\{[^}]*:\s*[^;]+;/m, "css"],
  [/^\s*\w[\w-]*:\s*(?:\S|$)/m, "yaml"],
];

/** Needs enough text that a single stray token cannot swing the result. */
const MIN_CHARS = 12;

export function detectLanguage(code: string): string | null {
  const text = code.trim();
  if (text.length < MIN_CHARS) return null;

  // JSON is worth a real parse rather than a pattern — it is either valid or not.
  if (/^\s*[{[]/.test(text) && /[}\]]\s*$/.test(text)) {
    try {
      JSON.parse(text);
      return "json";
    } catch {
      // fall through to the pattern rules
    }
  }

  for (const [pattern, language] of RULES) {
    if (pattern.test(text)) return language;
  }
  return null;
}
