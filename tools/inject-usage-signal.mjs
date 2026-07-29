#!/usr/bin/env node
/* =============================================================================
 * inject-usage-signal — add the anonymous usage beacon to pages that no shared
 * runtime already reaches.
 * -----------------------------------------------------------------------------
 * Most of the site is instrumented WITHOUT touching HTML: save-resume-engine.js
 * (2306 pages) and nt-page-enhance.js (862 pages) each load /assets/nt-usage.js
 * themselves. That leaves ~312 standalone pages — hubs, about pages, tool
 * launchers — that load neither. This injects the tag into exactly those.
 *
 * WHY IT TARGETS THE LAST </body>
 * A previous injector in this repo inserted before the FIRST </body> and landed
 * inside a documented code example rather than the page itself, silently
 * shipping a broken page. Documentation pages here legitimately contain escaped
 * or literal </body> text in <pre>/<code> blocks. The real closing tag is always
 * the last one, so that is the only safe anchor.
 *
 * Idempotent: a page already containing data-nt-usage is skipped. Every write is
 * verified by re-reading the file and asserting exactly one tag, one </body>
 * insertion point, and unchanged byte length except for the inserted block.
 *
 *   node tools/inject-usage-signal.mjs            # report only (default)
 *   node tools/inject-usage-signal.mjs --write    # apply
 * ========================================================================== */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const WRITE = process.argv.includes("--write");

const TAG = '<script src="/assets/nt-usage.js" data-nt-usage="1" defer></script>';

/** Pages that already pull the beacon in via a shared runtime. */
const HOST_SCRIPTS = ["save-resume/save-resume-engine.js", "assets/nt-page-enhance.js"];

/**
 * Not real student-facing pages: build fixtures, dev harnesses and partials.
 * Instrumenting these would put noise rows in the table that look like usage.
 */
const SKIP_PREFIXES = ["dist/", "node_modules/", "test/", "tests/", "tmp/", "test-results/"];
const SKIP_EXACT = new Set(["404.html"]);

function listHtml() {
  const out = execFileSync(
    "git",
    ["ls-files", "*.html"],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );
  return out
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((p) => !SKIP_PREFIXES.some((pre) => p.startsWith(pre)))
    .filter((p) => !SKIP_EXACT.has(p));
}

function alreadyCovered(html) {
  if (html.includes("data-nt-usage")) return "tag";
  if (html.includes("nt-usage.js")) return "tag";
  if (HOST_SCRIPTS.some((h) => html.includes(h))) return "host";
  return null;
}

/**
 * Insert before the LAST </body>, preserving that line's existing indentation
 * so the closing tag stays exactly where the author put it. Returns the new
 * text plus the exact inserted block (needed to verify the write), or null when
 * there is no closing tag (fragment/partial) — those are skipped, not guessed.
 */
function inject(html) {
  const idx = html.toLowerCase().lastIndexOf("</body>");
  if (idx === -1) return null;

  // Whitespace between the previous newline and </body> is that tag's indent.
  // Reuse it for the script line and hand it back to </body> untouched, so the
  // diff is a single added line and nothing else moves.
  const lineStart = html.lastIndexOf("\n", idx) + 1;
  const indent = /^[ \t]*$/.test(html.slice(lineStart, idx)) ? html.slice(lineStart, idx) : "";
  const block = `${indent}${TAG}\n`;

  return { text: html.slice(0, lineStart) + block + html.slice(lineStart), block };
}

function verify(before, after, block) {
  const tags = after.split("data-nt-usage").length - 1;
  if (tags !== 1) return `expected 1 beacon tag, found ${tags}`;
  const bodiesBefore = before.toLowerCase().split("</body>").length;
  const bodiesAfter = after.toLowerCase().split("</body>").length;
  if (bodiesBefore !== bodiesAfter) return "closing </body> count changed";
  if (after.length !== before.length + block.length) return "unexpected byte-length delta";
  // The strongest check: removing the inserted block must reproduce the
  // original file byte-for-byte, so nothing else on the page was disturbed.
  if (after.replace(block, "") !== before) return "content outside the block changed";
  return null;
}

const files = listHtml();
const summary = { total: files.length, host: 0, tagged: 0, injected: 0, noBody: 0, failed: [] };

for (const rel of files) {
  const abs = resolve(ROOT, rel);
  let html;
  try {
    html = readFileSync(abs, "utf8");
  } catch {
    continue;
  }

  const covered = alreadyCovered(html);
  if (covered === "host") {
    summary.host += 1;
    continue;
  }
  if (covered === "tag") {
    summary.tagged += 1;
    continue;
  }

  const next = inject(html);
  if (next === null) {
    summary.noBody += 1;
    continue;
  }

  const problem = verify(html, next.text, next.block);
  if (problem) {
    summary.failed.push(`${rel}: ${problem}`);
    continue;
  }

  if (WRITE) {
    writeFileSync(abs, next.text);
    // Re-read: trust the disk, not the in-memory string.
    const check = verify(html, readFileSync(abs, "utf8"), next.block);
    if (check) summary.failed.push(`${rel}: post-write ${check}`);
  }
  summary.injected += 1;
}

const verb = WRITE ? "injected" : "would inject";
console.log(
  `usage-signal: ${summary.total} pages — ${summary.host} covered by a shared runtime, ` +
    `${summary.tagged} already tagged, ${summary.noBody} without </body>, ` +
    `${summary.injected} ${verb}.`,
);
if (summary.failed.length) {
  console.error(`\nFAILED (${summary.failed.length}):`);
  for (const f of summary.failed.slice(0, 20)) console.error(`  ${f}`);
  process.exit(1);
}
if (!WRITE && summary.injected > 0) {
  console.log("Re-run with --write to apply.");
}
