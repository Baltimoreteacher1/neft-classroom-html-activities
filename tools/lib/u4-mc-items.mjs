// Reads the multiple-choice items out of Unit 4's ten hand-built Practice Studio pages.
//
// The pages keep their items as `const NAME = [ ... ]` literals inside one inline script (T1_TASKS, T5_QUESTIONS,
// QUIZ_QUESTIONS, ...), so there is no data file to import. Each top-level array literal is cut out by bracket matching
// and evaluated in an empty VM context; an array that needs the page (a runtime call, a DOM id) is simply not an item
// list and is skipped. An item is any object with a `choices` array and a numeric `correct` index.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { REPO_ROOT } from "./curriculum-source.mjs";

export const U4_PAGES = [
  "percent-practice-studio",
  "percent-practice-studio-challenging",
  "4-2-practice-studio",
  "4-2-practice-studio-challenging",
  "4-3-practice-studio",
  "4-3-practice-studio-challenging",
  "4-4-practice-studio",
  "4-4-practice-studio-challenging",
  "4-5-practice-studio",
  "4-5-practice-studio-challenging",
];

/** Index of the bracket that closes the one at `open`, skipping strings, template literals and comments. */
function closeOf(/** @type {string} */ src, /** @type {number} */ open) {
  let depth = 0;
  let i = open;
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      i += 1;
      while (i < src.length && src[i] !== q) {
        if (src[i] === "\\") i += 1;
        else if (q === "`" && src[i] === "$" && src[i + 1] === "{") i = closeOf(src, i + 1);
        i += 1;
      }
    } else if (c === "/" && src[i + 1] === "/") {
      while (i < src.length && src[i] !== "\n") i += 1;
    } else if (c === "/" && src[i + 1] === "*") {
      i = src.indexOf("*/", i + 2) + 1;
    } else if (c === "[" || c === "{" || c === "(") depth += 1;
    else if (c === "]" || c === "}" || c === ")") {
      depth -= 1;
      if (depth === 0) return i;
    }
    i += 1;
  }
  return -1;
}

/** The inline, non-JSON scripts of a page, as one string. */
function pageScript(/** @type {string} */ html) {
  return [
    ...html.matchAll(
      /<script(?![^>]*\bsrc=)(?![^>]*type="application\/json")[^>]*>([\s\S]*?)<\/script>/g,
    ),
  ]
    .map((m) => m[1])
    .join("\n");
}

/**
 * The shapes the pages use: `choices: ["0.35", ...]` or `[{ en, es }]` with a numeric `correct`, or `[{ text, correct: true }]` where
 * `text` is a string or `{ en, es }`.
 * @returns {{ texts: string[], correct: number } | null}
 */
export function mcShape(/** @type {any} */ item) {
  const c = item?.choices;
  if (!Array.isArray(c) || c.length < 2) return null;
  const textOf = (/** @type {any} */ x) => {
    const t = typeof x === "string" ? x : (x?.text ?? x?.en ?? x);
    return typeof t === "string" ? t : t?.en;
  };
  const texts = c.map(textOf);
  if (!texts.every((t) => typeof t === "string")) return null;
  if (Number.isInteger(item.correct)) return { texts, correct: item.correct };
  const flagged = c.map((x) => x?.correct === true);
  if (flagged.filter(Boolean).length === 1) return { texts, correct: flagged.indexOf(true) };
  return null;
}

/** @returns {{ page: string, list: string, index: number | string, item: any, texts: string[], correct: number }[]} */
export function u4McItems(/** @type {string} */ page) {
  const html = readFileSync(join(REPO_ROOT, "math/unit-4", page, "index.html"), "utf8");
  const src = pageScript(html);
  const out = [];
  for (const m of src.matchAll(/^[ \t]*const ([A-Z][A-Z0-9_]*)\s*=\s*\[/gm)) {
    const open = (m.index ?? 0) + m[0].length - 1;
    const end = closeOf(src, open);
    if (end < 0) {
      if (process.env.U4_DEBUG) console.error(`${page} ${m[1]}: unbalanced`);
      continue;
    }
    /** @type {any} */ let list;
    try {
      // A literal may name page helpers (a shared option list, a mode constant); a call to one returns undefined, never a throw.
      const scope = new Proxy(
        {},
        { has: (_t, k) => typeof k === "string" && !(k in globalThis), get: () => () => undefined },
      );
      list = vm.runInNewContext(
        `(function () { with (__scope) { return (${src.slice(open, end + 1)}); } })()`,
        { __scope: scope },
        { timeout: 1000 },
      );
    } catch (e) {
      if (process.env.U4_DEBUG) console.error(`${page} ${m[1]}: ${e}`);
      continue;
    }
    if (!Array.isArray(list)) continue;
    // items sit at the top of an array (T5_QUESTIONS) or deeper (BASE_SECTIONS[n].items); walk everything under the literal
    const walk = (/** @type {any} */ node, /** @type {string} */ path) => {
      if (!node || typeof node !== "object") return;
      const shape = mcShape(node);
      if (shape) {
        out.push({ page, list: m[1], index: path, item: node, ...shape });
        return;
      }
      for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
    };
    walk(list, "");
  }
  return out;
}
