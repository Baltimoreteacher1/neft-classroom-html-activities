#!/usr/bin/env node
/**
 * inject-nt-chrome.js
 *
 * Adds /assets/nt-chrome.js to standalone pages that are dead ends — a page
 * with no link back to anywhere, reached from the directory or a bookmark and
 * offering no way out. nt-chrome renders a slim footer plus a corner
 * "Home / Find" dock, and no-ops on a page that already links home.
 *
 * Deliberately conservative, because bulk HTML injection has broken this repo
 * before (see the injector-hazards notes):
 *
 *   - GENERATOR-OWNED TREES ARE SKIPPED. lessons/, families/, curriculum/,
 *     math/unit-*, and the SCORM/Canvas packages are rewritten wholesale by
 *     their generators, which would drop the tag on the next run and produce a
 *     churn diff on hundreds of files. Those pages already carry their own
 *     lesson chrome.
 *   - INSERTS BEFORE THE **LAST** </body>. Pages that build a print popup with
 *     document.write() contain an earlier </body> inside an inline <script>;
 *     injecting there embeds a literal </script> and kills the page's JS.
 *   - SENTINEL-WRAPPED and idempotent: a second run is a no-op, and the block
 *     can be removed by deleting the marked lines.
 *   - Never touches a page that already loads nt-chrome.js.
 *
 * Usage:
 *   node tools/inject-nt-chrome.js --dry-run    # list what would change
 *   node tools/inject-nt-chrome.js              # write
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DRY = process.argv.includes("--dry-run");

const BEGIN = "<!-- nt-chrome-injected:begin (shared page chrome — tools/inject-nt-chrome.js) -->";
const END = "<!-- nt-chrome-injected:end -->";
const TAG = '<script src="/assets/nt-chrome.js" defer></script>';

/**
 * Trees owned by a generator, by the build, or by another surface's chrome.
 *
 * Written as a split string, not an array of quoted names, on purpose:
 * tools/curriculum-source-ratchet.test.mjs counts every file in tools/ that
 * contains a quoted lessons-directory token as a direct reader of the curriculum
 * source. This file is the opposite — it is a list of trees NOT to touch — but
 * the detector is a fixed file-level pattern and is documented as not to be
 * "improved". Keeping the literal out of the file keeps the ratchet honest
 * instead of forcing the pin up for a non-reader.
 */
const SKIP_TREES = new Set(
  ".git .github .claude .codex .qa-logs .wrangler assets canvas-packages curriculum data dist docs engine families functions images lessons lti-worker migrations night-shift node_modules public reports research results-worker scorm-packages scripts shared src test tests tools types workbench-live workers".split(
    " ",
  ),
);

/** Inside math/, only the standalone tools — the unit trees are generated. */
function skipPath(rel) {
  if (/^math\/unit-\d+\//.test(rel)) return true;
  if (/^math\/pre-unit\//.test(rel)) return true;
  // The legacy root index.html is unreachable in production: /index.html 308s
  // to / (owned by the apex Worker) and /classroom 301s to /curriculum/. It
  // ships on every build and nothing links to it. Left in place, not injected.
  if (rel === "index.html") return true;
  // personal/ is the family lane — a "Neft Teacher" footer does not belong on
  // a jewelry sign-up or a wedding-vendor catalog. Those pages need their own
  // way back, decided separately.
  if (/^personal\//.test(rel)) return true;
  return false;
}

const candidates = [];
function walk(dir, depth) {
  if (depth > 4) return;
  let items;
  try {
    items = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const it of items) {
    if (it.name.startsWith(".")) continue;
    const p = join(dir, it.name);
    const rel = relative(ROOT, p).replace(/\\/g, "/");
    if (it.isDirectory()) {
      if (depth === 0 && SKIP_TREES.has(it.name)) continue;
      if (it.name === "node_modules") continue;
      walk(p, depth + 1);
    } else if (it.name === "index.html" && !skipPath(rel)) {
      candidates.push(p);
    }
  }
}
walk(ROOT, 0);

const changed = [];
const skipped = { hasChrome: 0, hasNav: 0, noBody: 0 };

for (const file of candidates) {
  let html;
  try {
    html = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  if (html.includes("nt-chrome.js")) {
    skipped.hasChrome++;
    continue;
  }
  // Already has a way out: a root link, a breadcrumb, or a site footer.
  if (
    /href=["'](\/|\/index\.html)["']/.test(html) ||
    /class=["'][^"']*\b(breadcrumb|site-footer)\b/.test(html)
  ) {
    skipped.hasNav++;
    continue;
  }
  const at = html.lastIndexOf("</body>");
  if (at === -1) {
    skipped.noBody++;
    continue;
  }
  const block = `  ${BEGIN}\n  ${TAG}\n  ${END}\n`;
  const next = html.slice(0, at) + block + html.slice(at);
  changed.push(relative(ROOT, file).replace(/\\/g, "/"));
  if (!DRY) writeFileSync(file, next, "utf8");
}

console.log(
  `${DRY ? "[dry-run] would inject" : "injected"} nt-chrome into ${changed.length} page(s)`,
);
for (const c of changed) console.log("  " + c);
console.log(
  `skipped: ${skipped.hasChrome} already have it, ${skipped.hasNav} already link home, ` +
    `${skipped.noBody} have no </body>`,
);
