#!/usr/bin/env node
// Byte-preserving insertion of catch-up rows into curriculum/index.html:
// after the </details> of each band's last lesson. No re-serialization.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.env.REPO || resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FILE = join(ROOT, "curriculum", "index.html");
const rows = JSON.parse(readFileSync(new URL("./catchup-rows.json", import.meta.url)));

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

let html = readFileSync(FILE, "utf8");
const before = html;
let inserted = 0;

for (const r of rows) {
  if (html.includes(`/lessons/${r.id}/`)) {
    console.log(`skip (present): ${r.id}`);
    continue;
  }
  const anchor = `href="/lessons/${r.afterLesson}/"`;
  const ai = html.indexOf(anchor);
  if (ai === -1) throw new Error(`anchor not found: ${anchor}`);
  const ci = html.indexOf("</details>", ai);
  if (ci === -1) throw new Error(`no closing details after ${anchor}`);
  const end = ci + "</details>".length;
  const block = `
          <details
            class="lesson lesson-catchup"
            data-search="${esc(r.search)}"
          >
            <summary class="lesson-sum">
              <span class="lesson-head"
                >\u{1F9ED} ${r.range} Catch-Up
                <span class="badge badge-std">Review</span></span
              >
            </summary>
            <div class="lesson-body">
              <p class="lesson-obj">
                Missed a lesson? Review the big ideas from Lessons ${r.range} and practice them
                all in one place — then you're caught up.
              </p>
              <div class="res-row">
                <a class="res" href="/lessons/${r.id}/">Start Catch-Up</a>
              </div>
            </div>
          </details>`;
  html = html.slice(0, end) + block + html.slice(end);
  inserted++;
}

if (html === before) {
  console.log("no changes");
} else {
  writeFileSync(FILE, html);
}
const count = (html.match(/lesson-catchup/g) || []).length;
console.log(`inserted=${inserted} total-catchup-details=${count}`);
// Integrity: original lesson links all still present.
let missing = 0;
for (const r of rows) if (!html.includes(`href="/lessons/${r.afterLesson}/"`)) missing++;
console.log(`base-anchors-missing=${missing}`);
