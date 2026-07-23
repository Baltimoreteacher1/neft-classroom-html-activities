#!/usr/bin/env node
// Byte-preserving insertion of an "Interactive Tools" dropdown row into
// curriculum/index.html — one per base lesson that ships at least one
// interactive tool (per its lessons/<id>/config.json). The row surfaces the
// per-lesson standalone tools page at /lessons/<id>/?mode=tools.
//
// Placement: immediately AFTER the base lesson's small-group blocks (group1
// then group2) — i.e. after the LAST consecutive lesson-smallgroup sibling
// that follows the base lesson. If the lesson has no small-group blocks, the
// row goes directly after the base lesson's own </details>.
//
// Modeled on tools/splice-small-group-curriculum.mjs: no re-serialization,
// sentinel-guarded one-time CSS, per-lesson idempotency marker, byte-for-byte
// preservation of everything it does not touch.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.env.REPO || resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FILE = join(ROOT, "curriculum", "index.html");
const LESSONS = join(ROOT, "lessons");

// Shared interactive-visual REGISTRY: a config block counts as an interactive
// tool only if its `kind` is one of these. Keep in sync with the engine's
// interactive-visual registry.
const REGISTRY = new Set([
  "solid-3d",
  "line-grapher",
  "area-morph",
  "factor-tree-lab",
  "factor-tree",
  "decimal-columns",
  "lcm-lab",
  "decimal-product",
  "decimal-quotient",
  "fraction-divide",
  "algebra-expand",
  "combine-like-terms",
  "tape-diagram",
  "coordinate-plane",
  "scenario-sim",
  "number-line",
  "histogram",
  "dot-plot",
  "box-plot",
  "bar-chart",
  "power-builder",
  "distributive-builder",
  "percent-builder",
  "unit-rate-builder",
  "long-division-builder",
  "ratio-table-builder",
  "stat-towers",
  "step-solver",
  "box-plot-builder",
  "histogram-builder",
  "equation-balance-lab",
  "stats-data-lab",
  "number-line-explorer",
  "dist-explorer",
  "cross-section",
  "net-folder",
  "manip",
]);

const SECTIONS = ["explore", "practice", "connect", "launch", "reflect"];
const TOOL_KEYS = ["diagram", "visual", "simulator", "lab"];

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// A lesson qualifies if any section/key holds a block (object OR array of
// objects) whose `kind` is in the REGISTRY.
function lessonHasTool(id) {
  const cfgPath = join(LESSONS, id, "config.json");
  if (!existsSync(cfgPath)) return false;
  let cfg;
  try {
    cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
  } catch {
    return false;
  }
  for (const sec of SECTIONS) {
    const s = cfg[sec];
    if (!s || typeof s !== "object" || Array.isArray(s)) continue;
    for (const key of TOOL_KEYS) {
      const v = s[key];
      if (!v) continue;
      const items = Array.isArray(v) ? v : [v];
      for (const it of items) {
        if (it && typeof it === "object" && REGISTRY.has(it.kind)) return true;
      }
    }
  }
  return false;
}

let html = readFileSync(FILE, "utf8");
const before = html;

// --- 1. One-time CSS for the Interactive Tools rows ---------------------
const CSS_MARK = "/* tools-links-injected */";
if (!html.includes(CSS_MARK)) {
  const css = `
      ${CSS_MARK}
      details.lesson.lesson-tools {
        margin-left: 1.6rem;
        margin-bottom: 10px;
        border-left: 4px solid #0d7a76;
        border-top-left-radius: 10px;
        border-bottom-left-radius: 10px;
        background: rgba(255, 255, 255, 0.04);
        transition:
          background 0.15s ease,
          border-color 0.15s ease,
          box-shadow 0.15s ease;
      }
      details.lesson.lesson-tools[open] {
        background: rgba(255, 255, 255, 0.07);
        box-shadow: 0 8px 22px -14px rgba(0, 0, 0, 0.35);
      }
      .lesson-tools > summary.lesson-sum {
        min-height: 48px;
        padding: 12px 14px;
      }
      .lesson-tools > summary .lesson-head {
        font-size: 14.5px;
        line-height: 1.35;
        letter-spacing: 0.01em;
      }
      .lesson-tools .lesson-obj {
        font-size: 14.5px;
        line-height: 1.5;
        color: var(--ink);
        opacity: 0.82;
        font-style: normal;
        max-width: 62ch;
      }
      .lesson-tools .res {
        min-height: 42px;
        padding: 9px 16px;
        font-weight: 700;
        font-size: 14px;
        color: #084a47;
        background: linear-gradient(180deg, #ecf9f8, #d7f0ee);
        border: 1px solid rgba(13, 122, 118, 0.28);
        border-radius: 10px;
        box-shadow: 0 4px 12px -8px rgba(8, 74, 71, 0.4);
      }
      .lesson-tools .res:hover {
        background: linear-gradient(180deg, #e0f4f2, #c6e9e6);
        border-color: rgba(13, 122, 118, 0.42);
      }
      .badge-tools {
        background: #d4f2ef;
        color: #0d7a76;
        font-weight: 700;
        letter-spacing: 0.02em;
      }
`;
  const anchor = "      details.lesson {";
  const ai = html.indexOf(anchor);
  if (ai === -1) throw new Error("CSS anchor 'details.lesson {' not found");
  html = html.slice(0, ai) + css + html.slice(ai);
}

// --- helpers (shared shape with the small-group injector) ----------------
function matchingDetailsEnd(start) {
  const tagRe = /<details\b[^>]*>|<\/details>/g;
  tagRe.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = tagRe.exec(html))) {
    if (match[0].startsWith("<details")) depth++;
    else if (--depth === 0) return tagRe.lastIndex;
  }
  throw new Error(`unclosed <details> at byte ${start}`);
}

// Byte offset just after the base lesson's own closing </details>.
function parentDetailsEnd(parent) {
  const href = `href="/lessons/${parent}/"`;
  let at = -1;
  while ((at = html.indexOf(href, at + 1)) !== -1) {
    const start = html.lastIndexOf("<details", at);
    if (start === -1) continue;
    const openEnd = html.indexOf(">", start);
    const openTag = html.slice(start, openEnd + 1);
    const classes = openTag.match(/class="([^"]*)"/)?.[1]?.split(/\s+/) || [];
    if (
      !classes.includes("lesson") ||
      classes.includes("lesson-smallgroup") ||
      classes.includes("lesson-tools")
    )
      continue;
    const end = matchingDetailsEnd(start);
    if (at < end) return end;
  }
  throw new Error(`parent lesson dropdown not found: ${parent}`);
}

// From `pos` (just after the base lesson </details>), skip over consecutive
// sibling <details ... lesson-smallgroup ...> blocks and return the offset
// after the last one. Stops as soon as the next sibling is not a small-group
// block (or there is intervening non-whitespace markup, e.g. end of unit).
function afterSmallGroupSiblings(pos) {
  let cursor = pos;
  while (true) {
    const next = html.indexOf("<details", cursor);
    if (next === -1) return cursor;
    if (html.slice(cursor, next).trim() !== "") return cursor;
    const openEnd = html.indexOf(">", next);
    const openTag = html.slice(next, openEnd + 1);
    const classes = openTag.match(/class="([^"]*)"/)?.[1] || "";
    if (/\blesson-smallgroup\b/.test(classes)) {
      cursor = matchingDetailsEnd(next);
      continue;
    }
    return cursor;
  }
}

function blockFor(id) {
  const dotted = String(id).replace("-", ".");
  const search = `${id} interactive tools practice manipulatives`;
  return (
    `\n          <!-- tools-link:${id} -->` +
    `\n          <details class="lesson lesson-tools" data-search="${esc(search)}">` +
    `\n            <summary class="lesson-sum">` +
    `\n              <span class="lesson-head">🧰 ${dotted} Interactive Tools <span class="badge badge-tools">Practice</span></span>` +
    `\n            </summary>` +
    `\n            <div class="lesson-body">` +
    `\n              <p class="lesson-obj">Hands-on tools from this lesson to keep practicing — nothing is graded.</p>` +
    `\n              <div class="res-row">` +
    `\n                <a class="res" href="/lessons/${id}/?mode=tools">🧰 Open Interactive Tools</a>` +
    `\n              </div>` +
    `\n            </div>` +
    `\n          </details>`
  );
}

// --- 2. Discover base lessons and insert one Tools row each --------------
// Base lessons are identified by their Interactive Lesson anchor.
const baseIds = [];
const seen = new Set();
const anchorRe = /href="\/lessons\/([^/"]+)\/"\s*>Interactive Lesson/g;
let m;
while ((m = anchorRe.exec(before))) {
  const id = m[1];
  if (!seen.has(id)) {
    seen.add(id);
    baseIds.push(id);
  }
}

let inserted = 0;
let skippedNoTool = 0;
for (const id of baseIds) {
  if (html.includes(`<!-- tools-link:${id} -->`)) continue; // idempotent
  if (!lessonHasTool(id)) {
    skippedNoTool++;
    continue;
  }
  const end = parentDetailsEnd(id);
  const insertAt = afterSmallGroupSiblings(end);
  html = html.slice(0, insertAt) + blockFor(id) + html.slice(insertAt);
  inserted++;
}

// --- 3. Inline Tools link on small-group & catch-up rows -----------------
// Those rows carry a single "Start …" launch link. Append a sibling
// "Interactive Tools" pill (→ /lessons/<id>/?mode=tools) for every such lesson
// that ships a tool. The optional trailing group in the pattern captures an
// already-present tools link so a re-run is a no-op (idempotent).
let inlineAdded = 0;
html = html.replace(
  /(<a class="res" href="\/lessons\/([\w-]+)\/">Start (?:small group|Catch-Up)<\/a>)(\s*<a class="res" href="\/lessons\/\2\/\?mode=tools">[^<]*<\/a>)?/g,
  (match, startAnchor, id, existing) => {
    if (existing) return match; // already has its tools link
    if (!lessonHasTool(id)) return match;
    inlineAdded++;
    return `${startAnchor}\n                <a class="res" href="/lessons/${id}/?mode=tools">🧰 Interactive Tools</a>`;
  },
);

if (html === before) {
  console.log("no changes");
} else {
  writeFileSync(FILE, html);
}

const total = (html.match(/class="lesson lesson-tools"/g) || []).length;
console.log(
  `base-lessons=${baseIds.length} inserted=${inserted} skipped-no-tool=${skippedNoTool} total-tools-rows=${total} inline-added=${inlineAdded}`,
);
