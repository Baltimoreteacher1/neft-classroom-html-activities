#!/usr/bin/env node
// Byte-preserving insertion of small-group rows into curriculum/index.html.
// For each base lesson, insert TWO indented <details> (Group 1 then Group 2)
// immediately after the parent lesson's </details> — so dropdown order is
// Lesson → Small Group 1 → Small Group 2 → (Catch-Up if present).
// Also injects a one-time CSS block for the indented small-group styling.
// No re-serialization; same approach as splice-catchup-curriculum.mjs.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.env.REPO || resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FILE = join(ROOT, "curriculum", "index.html");
const rows = JSON.parse(readFileSync(new URL("./small-group-rows.json", import.meta.url)));

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

let html = readFileSync(FILE, "utf8");
const before = html;

// --- 1. One-time CSS for indented small-group entries -------------------
const CSS_MARK = "/* small-group-injected */";
if (!html.includes(CSS_MARK)) {
  const css = `
      ${CSS_MARK}
      details.lesson.lesson-smallgroup {
        margin-left: 1.6rem;
        margin-bottom: 10px;
        border-left: 4px solid var(--line);
        border-top-left-radius: 10px;
        border-bottom-left-radius: 10px;
        background: rgba(255, 255, 255, 0.04);
        transition:
          background 0.15s ease,
          border-color 0.15s ease,
          box-shadow 0.15s ease;
      }
      details.lesson.lesson-sg1 { border-left-color: #3b82f6; }
      details.lesson.lesson-sg2 { border-left-color: #f59e0b; }
      details.lesson.lesson-smallgroup[open] {
        background: rgba(255, 255, 255, 0.07);
        box-shadow: 0 8px 22px -14px rgba(0, 0, 0, 0.35);
      }
      .lesson-smallgroup > summary.lesson-sum { min-height: 48px; padding: 12px 14px; }
      .lesson-smallgroup > summary .lesson-head { font-size: 14.5px; line-height: 1.35; letter-spacing: 0.01em; }
      .lesson-smallgroup .lesson-obj { font-size: 14.5px; line-height: 1.5; color: var(--ink); opacity: 0.82; font-style: normal; max-width: 62ch; }
      .lesson-smallgroup .res {
        min-height: 42px; padding: 9px 16px; font-weight: 700; font-size: 14px;
        color: #0f3f73; background: linear-gradient(180deg, #f4f8fd, #e7f0fa);
        border: 1px solid rgba(30, 90, 160, 0.22); border-radius: 10px;
        box-shadow: 0 4px 12px -8px rgba(15, 63, 115, 0.45);
      }
      .lesson-smallgroup .res:hover {
        background: linear-gradient(180deg, #eaf3fc, #dceaf8);
        border-color: rgba(30, 90, 160, 0.35);
      }
      .lesson-sg2 .res {
        color: #7a4a05; background: linear-gradient(180deg, #fff9eb, #fef0c7);
        border-color: rgba(180, 120, 20, 0.28);
        box-shadow: 0 4px 12px -8px rgba(122, 74, 5, 0.35);
      }
      .lesson-sg2 .res:hover {
        background: linear-gradient(180deg, #fff4d8, #fde8a8);
        border-color: rgba(180, 120, 20, 0.42);
      }
      .badge-support { background: #e0edff; color: #1e40af; font-weight: 700; letter-spacing: 0.02em; }
      .badge-challenge { background: #fef3c7; color: #92400e; font-weight: 700; letter-spacing: 0.02em; }
`;
  const anchor = "      details.lesson {";
  let ai = html.indexOf(anchor);
  if (ai === -1) ai = html.indexOf("</head>");
  if (ai === -1) throw new Error("CSS anchor not found in index.html");
  html = html.slice(0, ai) + `<style>\n${css}\n</style>\n` + html.slice(ai);
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
  // Student-facing labels: Group 1 is "Foundations" — never "Extra Support"
  // (that stays teacher-facing only). Objectives drop the facilitation-voice
  // "With my small group," preamble, same as the lesson renderer does.
  const badgeLabel = r.group === 1 ? "Foundations" : r.label;
  const cleaned = String(r.objective).replace(/^with (?:my|your|the) small group,?\s*/i, "");
  const objective = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
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
                <span class="badge ${badgeClass}">${esc(badgeLabel)}</span></span
              >
            </summary>
            <div class="lesson-body">
              <p class="lesson-obj">${esc(objective)}</p>
              <div class="res-row">
                <a class="res" href="/lessons/${r.id}/">Start small group</a>
              </div>
            </div>
          </details>`;
}

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

function parentDetailsEnd(parent) {
  const href = `href="/lessons/${parent}/"`;
  let at = -1;
  while ((at = html.indexOf(href, at + 1)) !== -1) {
    const start = html.lastIndexOf("<details", at);
    if (start === -1) continue;
    const openEnd = html.indexOf(">", start);
    const openTag = html.slice(start, openEnd + 1);
    const classes = openTag.match(/class="([^"]*)"/)?.[1]?.split(/\s+/) || [];
    if (!classes.includes("lesson") || classes.includes("lesson-smallgroup")) continue;
    const end = matchingDetailsEnd(start);
    if (at < end) return end;
  }
  throw new Error(`parent lesson dropdown not found: ${parent}`);
}

// --refresh: strip existing small-group blocks first so they are re-inserted
// with the current heading format (idempotent upgrade path).
if (process.argv.includes("--refresh")) {
  html = html.replace(/\n?\s*<details\s+class="lesson lesson-smallgroup[\s\S]*?<\/details>/g, "");
}

let inserted = 0;
for (const [parent, group] of byParent) {
  const pending = group.filter((r) => !html.includes(`href="/lessons/${r.id}/"`));
  if (!pending.length) continue;
  const end = parentDetailsEnd(parent);
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
