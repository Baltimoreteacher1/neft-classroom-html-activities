#!/usr/bin/env node
/* =============================================================================
 * inject-offline-sw.mjs — safely inject/revert the offline service-worker
 * registration snippet on the pages that have a scoped SW:
 *
 *   - the 64 canonical lesson launchers (lessons/<u>-<l>/index.html)
 *       -> registers /lessons/sw.js            (scope /lessons/)
 *   - math/games/practice-arcade/index.html
 *       -> registers /math/games/practice-arcade/sw.js
 *
 * Mirrors tools/inject-mobile-access.js: one sentinel-guarded block injected
 * before the REAL </body> (script-aware — vendored libs / print templates
 * contain literal "</body>" text inside <script> blocks; splicing there
 * corrupts inline JS). Idempotent; covered automatically by
 * tools/validate-injection-integrity.mjs via the sentinel family.
 *
 * Usage:
 *   node tools/inject-offline-sw.mjs            # inject (writes files)
 *   node tools/inject-offline-sw.mjs --dry-run  # report only
 *   node tools/inject-offline-sw.mjs --revert   # remove the injected blocks
 *   node tools/inject-offline-sw.mjs --check    # verify status (exit 1 on gap)
 * ========================================================================== */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS_DIR = join(ROOT, "lessons");

const MARK = "offline-sw-injected";
const BEGIN = `<!-- ${MARK}:begin (offline service worker — tools/inject-offline-sw.mjs) -->`;
const END = `<!-- ${MARK}:end -->`;

// NO template literals inside the generated inline script (repo rule: injected
// inline JS must survive naive re-splicing and older parsers).
function snippet(swPath, scope) {
  return [
    BEGIN,
    "<script>",
    '  if ("serviceWorker" in navigator) {',
    '    addEventListener("load", function () {',
    "      navigator.serviceWorker",
    '        .register("' + swPath + '", { scope: "' + scope + '" })',
    "        .catch(function () {});",
    "    });",
    "  }",
    "</script>",
    END,
  ].join("\n");
}

// Allow-list: same canonical-lesson set the learning-supports injector targets
// (lessons/<unit>-<lesson>/index.html), plus the practice arcade shell.
function getCanonicalLessons() {
  if (!existsSync(LESSONS_DIR)) {
    console.error("Lessons directory does not exist.");
    process.exit(1);
  }
  return readdirSync(LESSONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d+-\d+$/.test(d.name))
    .map((d) => d.name)
    .sort((a, b) => {
      const [au, al] = a.split("-").map(Number);
      const [bu, bl] = b.split("-").map(Number);
      return au !== bu ? au - bu : al - bl;
    });
}

function targets() {
  const list = getCanonicalLessons().map((id) => ({
    file: join(LESSONS_DIR, id, "index.html"),
    swPath: "/lessons/sw.js",
    scope: "/lessons/",
  }));
  list.push({
    file: join(ROOT, "math", "games", "practice-arcade", "index.html"),
    swPath: "/math/games/practice-arcade/sw.js",
    scope: "/math/games/practice-arcade/",
  });
  return list;
}

// Find the real closing tag: skip occurrences that sit inside a <script>
// block (mirrors tools/inject-mobile-access.js realCloseIndex). Some pages
// (e.g. the arcade's document.write CDN fallback string) contain an ESCAPED
// "<\/script>" that throws the open/close balance off permanently — when no
// balanced candidate exists, fall back to lastIndexOf, the repo's known-good
// splice point (see tools/inject-learning-supports.mjs).
function realCloseIndex(html, closeTag) {
  const lower = html.toLowerCase();
  const candidates = [];
  let i = lower.indexOf(closeTag);
  while (i !== -1) {
    const before = lower.slice(0, i);
    const opens = (before.match(/<script\b/g) || []).length;
    const closes = (before.match(/<\/script>/g) || []).length;
    if (opens === closes) candidates.push(i);
    i = lower.indexOf(closeTag, i + 1);
  }
  if (candidates.length) return candidates[candidates.length - 1];
  return lower.lastIndexOf(closeTag);
}

function revertHtml(html) {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\s*${esc(BEGIN)}[\\s\\S]*?${esc(END)}`, "g");
  return html.replace(re, "");
}

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");
const REVERT = args.has("--revert");
const CHECK = args.has("--check");

const report = {
  scanned: 0,
  injected: 0,
  already: 0,
  reverted: 0,
  missing: [],
  skippedNoBody: [],
  invalid: [],
};

for (const t of targets()) {
  const rel = relative(ROOT, t.file);
  if (!existsSync(t.file)) {
    report.missing.push(rel);
    continue;
  }
  report.scanned++;
  let html = readFileSync(t.file, "utf8");

  if (CHECK) {
    const begins = html.split(`${MARK}:begin`).length - 1;
    const ends = html.split(`${MARK}:end`).length - 1;
    const ok = begins === 1 && ends === 1 && html.includes(t.swPath);
    if (!ok) report.invalid.push(`${rel} (begin=${begins}, end=${ends})`);
    continue;
  }

  if (REVERT) {
    if (html.includes(`${MARK}:begin`)) {
      if (!DRY) writeFileSync(t.file, revertHtml(html), "utf8");
      report.reverted++;
    }
    continue;
  }

  if (html.includes(`${MARK}:begin`)) {
    report.already++;
    continue;
  }
  const bodyAt = realCloseIndex(html, "</body>");
  if (bodyAt === -1) {
    report.skippedNoBody.push(rel);
    continue;
  }
  html = html.slice(0, bodyAt) + snippet(t.swPath, t.scope) + "\n" + html.slice(bodyAt);
  if (!DRY) writeFileSync(t.file, html, "utf8");
  report.injected++;
}

const mode = CHECK ? "check" : REVERT ? "revert" : "inject";
console.log(`Offline-SW registration ${mode}${DRY ? " (dry-run)" : ""}`);
console.log("  pages scanned    :", report.scanned);
if (CHECK) {
  console.log("  invalid          :", report.invalid.length);
  report.invalid.forEach((f) => console.log("    INVALID:", f));
} else if (REVERT) {
  console.log("  reverted         :", report.reverted);
} else {
  console.log("  injected         :", report.injected);
  console.log("  already injected :", report.already);
  console.log("  skipped (no </body>):", report.skippedNoBody.length);
  report.skippedNoBody.forEach((f) => console.log("    SKIPPED:", f));
}
if (report.missing.length) {
  report.missing.forEach((f) => console.log("  MISSING:", f));
}
if (CHECK) process.exit(report.invalid.length || report.missing.length ? 1 : 0);
if (report.missing.length) process.exit(1);
