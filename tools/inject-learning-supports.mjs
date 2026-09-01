#!/usr/bin/env node
/* =============================================================================
 * inject-learning-supports.mjs — safely inject/revert learning support refs
 * in the 64 canonical lesson index.html files.
 *
 * Usage:
 *   node tools/inject-learning-supports.mjs            # Inject
 *   node tools/inject-learning-supports.mjs --dry-run  # Report only, write nothing
 *   node tools/inject-learning-supports.mjs --revert   # Remove/Restore
 *   node tools/inject-learning-supports.mjs --check    # Check status
 * ========================================================================== */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS_DIR = join(ROOT, "lessons");

const BEGIN_MARK = "<!-- ewl-supports-injected:begin -->";
const END_MARK = "<!-- ewl-supports-injected:end -->";

/**
 * Cache-busting version stamped on the two asset URLs, or `null` for none.
 *
 * ONE constant, read by the writer AND by --check, because they used to be two
 * literals that disagreed: the blocks said `v28`, checkFile() demanded `v26`,
 * and the fleet carried NEITHER — scripts/generate-lesson-shells.mjs, the
 * generator that actually owns these 84 canonical index.html files, writes the
 * URLs unversioned. So `--check` printed "INVALID" for every lesson and exited
 * 1 on every run since the day the versions drifted apart. A gate that is red
 * unconditionally is a gate nobody reads.
 *
 * `null` is therefore the truthful value today: it makes this injector emit
 * byte-identical tags to the generator that owns the pages, so the two cannot
 * fight over the same file. Bumping it is a deliberate act — see refreshBlock()
 * for what a bump does (refresh in place, never append).
 */
const ASSET_VERSION = null;
const VERSION_QUERY = ASSET_VERSION ? `?v=${ASSET_VERSION}` : "";
const CSS_HREF = `/assets/learning-supports/learning-supports.css${VERSION_QUERY}`;
const JS_SRC = `/assets/learning-supports/learning-supports.js${VERSION_QUERY}`;

const CSS_BLOCK = `\n${BEGIN_MARK}\n  <link rel="stylesheet" href="${CSS_HREF}" />\n${END_MARK}`;
const JS_BLOCK = `\n${BEGIN_MARK}\n  <script src="${JS_SRC}" defer></script>\n${END_MARK}`;

// Every sentinel block in a page, whatever indentation or spacing it carries.
const BLOCK_RE =
  /<!--\s*ewl-supports-injected:begin\s*-->[\s\S]*?<!--\s*ewl-supports-injected:end\s*-->/gi;

// Compare blocks by content, not bytes: the fleet indents the tag two spaces,
// older runs used four, and an indentation difference is not a reason to
// rewrite 84 committed files.
const normalize = (s) =>
  s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");

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

function realCloseIndex(html, tag) {
  const lower = html.toLowerCase();
  const index = lower.lastIndexOf(tag);
  return index;
}

function revertFile(file, lessonId, dry) {
  let html = readFileSync(file, "utf8");
  let changed = false;

  // 1. Remove sentinel blocks
  const blockRe =
    /<!--\s*ewl-supports-injected:begin\s*-->[\s\S]*?<!--\s*ewl-supports-injected:end\s*-->\s*/gi;
  if (blockRe.test(html)) {
    html = html.replace(blockRe, "");
    changed = true;
  }

  // 2. Remove HTML attribute
  const attrRe = new RegExp(`\\s*data-ewl-supports-lesson="${lessonId}"`, "i");
  if (attrRe.test(html)) {
    html = html.replace(attrRe, "");
    changed = true;
  }

  if (changed) {
    if (!dry) writeFileSync(file, html, "utf8");
    console.log(`  ${dry ? "WOULD REVERT" : "REVERTED"}: ${lessonId}`);
    return true;
  }
  return false;
}

/**
 * Put exactly ONE current block for `asset` into `html`.
 *
 * The guard keys on the SENTINEL, which is what identifies "this layer is
 * present". It used to key on the asset URL's `?v=` string, and that is a
 * double-injection machine: a page still holding the previous version fails the
 * test, so the injector appends a SECOND block and leaves the stale one in
 * place — the browser then loads two copies of learning-supports.js and mounts
 * the dock twice. It was not hypothetical: all 84 canonical lessons carry the
 * unversioned URL, so one plain run of this script added 84 duplicate CSS
 * blocks and 84 duplicate JS blocks.
 *
 * A version MISMATCH is a refresh, not an append: strip the existing block(s)
 * for this asset and rebuild at the first one's position — the strip-then-
 * rebuild shape tools/inject-enterprise-head.js:183-184 uses. Rebuilding over
 * ALL matches also repairs a page an earlier version-keyed run already
 * double-injected.
 */
function refreshBlock(html, asset, block, closeTag) {
  const existing = [...html.matchAll(BLOCK_RE)].filter((m) => m[0].includes(asset));

  if (existing.length === 0) {
    const at = realCloseIndex(html, closeTag);
    if (at === -1) return html;
    return html.slice(0, at) + block + "\n" + html.slice(at);
  }

  if (existing.length === 1 && normalize(existing[0][0]) === normalize(block)) return html;

  // Rebuild at the first block's position, drop the rest (last → first so the
  // earlier indices stay valid while we splice).
  let out = html;
  for (let i = existing.length - 1; i >= 1; i--) {
    const m = existing[i];
    out = out.slice(0, m.index).replace(/[ \t]*\n?$/, "") + out.slice(m.index + m[0].length);
  }
  const first = existing[0];
  // `block` carries a leading newline for the insert path; the in-place rebuild
  // replaces text that already sits on its own line, so drop it.
  const rebuilt = block.replace(/^\n/, "");
  return out.slice(0, first.index) + rebuilt + out.slice(first.index + first[0].length);
}

function injectFile(file, lessonId, dry) {
  const original = readFileSync(file, "utf8");
  let html = original;

  // 1. Inject html tag attribute
  if (!html.includes("data-ewl-supports-lesson=")) {
    html = html.replace(/<html\b/i, `<html data-ewl-supports-lesson="${lessonId}"`);
  }

  // 2. CSS link in <head>, 3. script before </body> — one current block each.
  html = refreshBlock(html, "learning-supports.css", CSS_BLOCK, "</head>");
  html = refreshBlock(html, "learning-supports.js", JS_BLOCK, "</body>");

  if (html !== original) {
    if (!dry) writeFileSync(file, html, "utf8");
    console.log(`  ${dry ? "WOULD INJECT" : "INJECTED"}: ${lessonId}`);
    return true;
  }
  return false;
}

/**
 * Is the layer present and current on this page?
 *
 * Every expectation is derived from the same constants the writer uses, so the
 * two can never disagree again. Exactly one block per asset — a page with two
 * is the double-injection this script used to cause, and must fail rather than
 * pass for having "at least one".
 */
function checkFile(file, lessonId) {
  const html = readFileSync(file, "utf8");
  const blocks = [...html.matchAll(BLOCK_RE)].map((m) => m[0]);
  const cssBlocks = blocks.filter((b) => b.includes("learning-supports.css"));
  const jsBlocks = blocks.filter((b) => b.includes("learning-supports.js"));

  return (
    blocks.length === 2 &&
    cssBlocks.length === 1 &&
    jsBlocks.length === 1 &&
    html.includes(`data-ewl-supports-lesson="${lessonId}"`) &&
    cssBlocks[0].includes(`href="${CSS_HREF}"`) &&
    jsBlocks[0].includes(`src="${JS_SRC}"`)
  );
}

function main() {
  const args = process.argv.slice(2);
  const isRevert = args.includes("--revert");
  const isCheck = args.includes("--check");
  const isDry = args.includes("--dry-run");

  console.log(
    `Learning Supports Integration - Mode: ${isRevert ? "REVERT" : isCheck ? "CHECK" : "INJECT"}` +
      `${isDry && !isCheck ? " (dry-run)" : ""}`,
  );

  const lessons = getCanonicalLessons();
  let touched = 0;
  let invalidCount = 0;

  for (const lessonId of lessons) {
    const file = join(LESSONS_DIR, lessonId, "index.html");
    if (!existsSync(file)) {
      if (isCheck) {
        console.error(`  MISSING: ${lessonId}/index.html`);
        invalidCount++;
      }
      continue;
    }

    if (isRevert) {
      if (revertFile(file, lessonId, isDry)) touched++;
    } else if (isCheck) {
      const ok = checkFile(file, lessonId);
      if (!ok) {
        console.log(`  INVALID: ${lessonId}`);
        invalidCount++;
      }
    } else {
      if (injectFile(file, lessonId, isDry)) touched++;
    }
  }

  if (isCheck) {
    console.log(
      `Check complete. ${lessons.length - invalidCount}/${lessons.length} lessons integrated.`,
    );
    process.exit(invalidCount > 0 ? 1 : 0);
  } else {
    console.log(
      `Operation complete. ${isDry ? "Would modify" : "Modified"} ${touched} lesson launchers.`,
    );
  }
}

main();
