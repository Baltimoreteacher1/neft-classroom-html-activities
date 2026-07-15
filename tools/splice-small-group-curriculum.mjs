#!/usr/bin/env node
// Byte-preserving insertion of small-group rows into curriculum/index.html.
// For each base lesson, insert TWO indented <details> (Group 1 then Group 2)
// immediately after the parent lesson's </details> — so dropdown order is
// Lesson → Small Group 1 → Small Group 2 → (Catch-Up if present).
// Also injects a one-time CSS block for the indented small-group styling.
// No re-serialization; same approach as splice-catchup-curriculum.mjs.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.env.REPO || resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FILE = join(ROOT, "curriculum", "index.html");
const rows = JSON.parse(readFileSync(new URL("./small-group-rows.json", import.meta.url)));

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

let html = readFileSync(FILE, "utf8");
const before = html;

// --- 1. One-time CSS for indented small-group entries -------------------
const CSS_MARK = "/* small-group-injected */";
if (!html.includes(CSS_MARK)) {
  const css = `
      ${CSS_MARK}
      details.lesson.lesson-smallgroup {
        margin-left: 1.6rem;
        border-left: 3px solid var(--line);
        border-top-left-radius: 4px;
        border-bottom-left-radius: 4px;
      }
      details.lesson.lesson-sg1 { border-left-color: #3b82f6; }
      details.lesson.lesson-sg2 { border-left-color: #f59e0b; }
      .lesson-smallgroup > summary .lesson-head { font-size: 14px; }
      .badge-support { background: #e0edff; color: #1e40af; }
      .badge-challenge { background: #fef3c7; color: #92400e; }
`;
  const anchor = "      details.lesson {";
  const ai = html.indexOf(anchor);
  if (ai === -1) throw new Error("CSS anchor 'details.lesson {' not found");
  html = html.slice(0, ai) + css + html.slice(ai);
}

// --- 2. Insert two blocks per base lesson -------------------------------
// Group rows by parent, preserving group1-before-group2 order.
const byParent = new Map();
for (const r of rows) {
  if (!byParent.has(r.afterLesson)) byParent.set(r.afterLesson, []);
  byParent.get(r.afterLesson).push(r);
}

function blockFor(r) {
  const sg = r.group === 1 ? "sg1" : "sg2";
  const emoji = r.group === 1 ? "\u{1F91D}" : "\u{1F680}"; // 🤝 / 🚀
  const badgeClass = r.group === 1 ? "badge-support" : "badge-challenge";
  // Lesson number first (e.g. "1.3"), then the small-group info.
  const dotted = String(r.afterLesson).replace("-", ".");
  const heading = `${dotted} Small Group: Group ${r.group}`;
  return `
          <details
            class="lesson lesson-smallgroup lesson-${sg}"
            data-search="${esc(r.search)}"
          >
            <summary class="lesson-sum">
              <span class="lesson-head"
                >${emoji} ${heading}
                <span class="badge ${badgeClass}">${esc(r.label)}</span></span
              >
            </summary>
            <div class="lesson-body">
              <p class="lesson-obj">${esc(r.objective)}</p>
              <div class="res-row">
                <a class="res" href="/lessons/${r.id}/">Start small group</a>
              </div>
            </div>
          </details>`;
}

// --refresh: strip existing small-group blocks first so they are re-inserted
// with the current heading format (idempotent upgrade path).
if (process.argv.includes("--refresh")) {
  html = html.replace(
    /\n?\s*<details\s+class="lesson lesson-smallgroup[\s\S]*?<\/details>/g,
    "",
  );
}

let inserted = 0;
for (const [parent, group] of byParent) {
  const pending = group.filter((r) => !html.includes(`href="/lessons/${r.id}/"`));
  if (!pending.length) continue;
  const anchor = `href="/lessons/${parent}/"`;
  const ai = html.indexOf(anchor);
  if (ai === -1) throw new Error(`anchor not found: ${anchor}`);
  const ci = html.indexOf("</details>", ai);
  if (ci === -1) throw new Error(`no closing details after ${anchor}`);
  const end = ci + "</details>".length;
  const block = pending.map(blockFor).join("");
  html = html.slice(0, end) + block + html.slice(end);
  inserted += pending.length;
}

if (html === before) {
  console.log("no changes");
} else {
  writeFileSync(FILE, html);
}

const total = (html.match(/lesson-smallgroup/g) || []).length;
console.log(`inserted=${inserted} total-smallgroup-details=${total}`);
// Integrity: every base-lesson anchor still present.
let missing = 0;
for (const p of byParent.keys()) if (!html.includes(`href="/lessons/${p}/"`)) missing++;
console.log(`base-anchors-missing=${missing}`);
