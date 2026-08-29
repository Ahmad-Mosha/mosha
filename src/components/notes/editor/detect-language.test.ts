/**
 * Run with:  node --experimental-strip-types src/components/notes/editor/detect-language.test.ts
 *
 * No framework on purpose. These cases are the ones highlight.js got wrong —
 * short snippets are what a notes app actually holds.
 */
import assert from "node:assert";
import { detectLanguage } from "./detect-language.ts";

const CASES: [string, string | null][] = [
  ["let x = 10\nconsole.log(x)", "javascript"],
  ["def solve(nums):\n    seen = {}\n    return seen", "python"],
  ["import os\nprint(os.getcwd())", "python"],
  ["export async function f(id: string) { return id; }", "typescript"],
  ["interface User { name: string }", "typescript"],
  ["package main\n\nfunc main() {\n\tx := 1\n}", "go"],
  ["pub fn main() {\n    let mut x = 5;\n}", "rust"],
  ["SELECT * FROM users WHERE id = 1;", "sql"],
  ["#include <stdio.h>\nstd::cout << 1;", "cpp"],
  ['{"a": 1, "b": [2,3]}', "json"],
  ["FROM node:20\nRUN npm install", "dockerfile"],
  ["sudo apt-get install nginx", "bash"],
  // Too short or not code: must stay unlabelled rather than guess.
  ["hello", null],
  ["just some prose here", null],
];

for (const [code, expected] of CASES) {
  assert.strictEqual(
    detectLanguage(code),
    expected,
    `${JSON.stringify(code.slice(0, 40))} -> expected ${expected}`
  );
}

console.log(`detect-language: ${CASES.length}/${CASES.length} passed`);
