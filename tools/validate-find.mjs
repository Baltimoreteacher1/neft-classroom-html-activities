#!/usr/bin/env node
/* =============================================================================
 * validate-find.mjs — gate for /curriculum/find/
 * -----------------------------------------------------------------------------
 * Scaffolded by scripts/new-surface.mjs. Wired into `npm run validate`, so it
 * gates every deploy. Add checks specific to what this surface promises — the
 * ones below are the classes that have actually broken surfaces in this repo:
 *
 *   1. Every file this surface owns still exists (a clobber deletes, it does
 *      not corrupt — and existsSync on the wrong path passes silently, so the
 *      list is explicit).
 *   2. The page's scripts parse, and every inline on* handler resolves to a
 *      function that is actually defined.
 *   3. No unscoped selector in the stylesheet.
 *   4. No dark-mode block — this is a light-only site.
 *   5. The discouraged label does not appear.
 * ========================================================================== */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

const OWNED_FILES = [
  "curriculum/find/index.html",
  "curriculum/find/find.css",
  "curriculum/find/find.js",
  "curriculum/find/find-engine.js",
  "curriculum/find/plan-engine.js",
  "curriculum/find/plan-ui.js",
  "curriculum/find/collections.js",
  "curriculum/find/collections-ui.js",
  "curriculum/find/dom.js",
  "tools/validate-find.mjs",
  "tools/curriculum-find-plan.test.mjs",
  "tools/validate-find-browser.mjs",
];

const failures = [];
const fail = (m) => failures.push(m);
const check = (cond, m) => {
  if (!cond) fail(m);
};

/* --- 1. Owned files present and non-trivial -------------------------------- */
const files = new Map();
for (const rel of OWNED_FILES) {
  try {
    const body = read(rel);
    check(body.length > 200, `${rel} is only ${body.length} bytes — possible clobber or stub`);
    files.set(rel, body);
  } catch {
    fail(`missing owned file: ${rel}`);
  }
}
if (failures.length) {
  console.error("validate-find: " + failures.join("\n  "));
  process.exit(1);
}

const html = files.get("curriculum/find/index.html");
const css = files.get("curriculum/find/find.css");
const js = files.get("curriculum/find/find.js");

/* --- 2. Scripts parse; inline handlers resolve ------------------------------ */
for (const [i, block] of [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].entries()) {
  const src = block[1].trim();
  if (!src) continue;
  try {
    new Function(src);
  } catch (e) {
    fail(`inline <script> #${i + 1} in index.html does not parse: ${e.message}`);
  }
}

const defined = new Set([...js.matchAll(/function\s+([A-Za-z_$][\w$]*)/g)].map((m) => m[1]));
for (const m of html.matchAll(/\son[a-z]+="([A-Za-z_$][\w$]*)\s*\(/g)) {
  check(defined.has(m[1]), `inline handler calls ${m[1]}(), which find.js does not define`);
}

/* --- 2b. Every relative module import inside the surface resolves to an owned file ---------------------- */
for (const [rel, body] of files) {
  if (!rel.startsWith("curriculum/find/") || !rel.endsWith(".js")) continue;
  for (const m of body.matchAll(/^import[^"']*["'](\.\/[^"']+)["']/gm)) {
    const target = `curriculum/find/${m[1].slice(2)}`;
    check(files.has(target), `${rel} imports ${m[1]}, which is not an owned file of the surface`);
  }
}

/* --- 3. Stylesheet stays scoped -------------------------------------------- */
for (const line of css.split("\n")) {
  const sel = line.match(/^\s*([a-z][\w-]*)\s*(?:,|\{)/);
  if (sel && !["from", "to"].includes(sel[1])) {
    fail(`unscoped selector "${sel[1]}" in find.css — it must live under .find-wrap`);
  }
}

/* --- 4 & 5. Light-only, and the label ------------------------------------- */
for (const [rel, body] of files) {
  check(
    !/prefers-color-scheme\s*:\s*dark/.test(body),
    `${rel} emits a dark-mode block; this is a light-only site`,
  );
  check(
    !/\bESOL\b/.test(body),
    `${rel} uses the discouraged label; say "support" or "Level 1" instead`,
  );
}

/* -------------------------------------------------------------------------- */
if (failures.length) {
  console.error("validate-find FAILED:");
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`✓ /curriculum/find/ lock passed (${OWNED_FILES.length} owned files).`);
