#!/usr/bin/env node
/* =============================================================================
 * validate-student-supports.mjs — gate for /curriculum/student-supports/
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
  "curriculum/student-supports/index.html",
  "curriculum/student-supports/student-supports.css",
  "curriculum/student-supports/student-supports.js",
  "tools/validate-student-supports.mjs",
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
  console.error("validate-student-supports: " + failures.join("\n  "));
  process.exit(1);
}

const html = files.get("curriculum/student-supports/index.html");
const css = files.get("curriculum/student-supports/student-supports.css");
const js = files.get("curriculum/student-supports/student-supports.js");

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
  check(
    defined.has(m[1]),
    `inline handler calls ${m[1]}(), which student-supports.js does not define`,
  );
}

/* --- 3. Stylesheet stays scoped -------------------------------------------- */
for (const line of css.split("\n")) {
  const sel = line.match(/^\s*([a-z][\w-]*)\s*(?:,|\{)/);
  if (sel && !["from", "to"].includes(sel[1])) {
    fail(
      `unscoped selector "${sel[1]}" in student-supports.css — it must live under .student-supports-wrap`,
    );
  }
}

/* --- 6. SCOPE IS STATED, NOT INFERRED --------------------------------------
 *
 * The store is two-level — an all-class lesson default, and a per-class
 * override that replaces it — and it always behaved correctly. What it did not
 * do was SAY so, and a teacher could only learn the model by pressing Apply
 * and watching which classes changed.
 *
 * tools/lesson-supports.test.mjs pins the STORE. This pins the SENTENCES: that
 * the surface still renders a scope per class, still names the scope beside
 * Apply, and still labels reset with the scope it resets. None of that is
 * visible to a lint pass, a type check or a render probe — a page with a bare
 * "Reset" button parses, lints and renders perfectly, and is exactly the
 * ambiguity this section exists to prevent coming back.
 * ------------------------------------------------------------------------ */
const scopeChecks = [
  [
    /data-scope=/,
    "no scope selector — a teacher cannot see or switch which class they are editing",
  ],
  [
    /Applies to all class sections/,
    "the all-class default no longer says it applies to all classes",
  ],
  [/Using the lesson default/, "a class with no override no longer says it is inheriting"],
  [/instead of the lesson default/, "a class override no longer says it replaces the default"],
  [/ override</, "the class-override state is no longer headed as an override"],
  [/Customize for /, "no way to turn an inherited class into its own override"],
  [/to lesson default/, "reset is not labelled with the class it resets"],
  [/Editing: /, "the scope being edited is not stated before Apply"],
  [/Apply to class |Apply to all classes/, "the Apply button does not name its scope"],
  [/copyLessonToSection/, "copy-between-classes is gone from the surface"],
];
for (const [re, why] of scopeChecks) check(re.test(js), why);

/* A GENERIC RESET IS THE BUG. "Reset to original" on a page that can be
 * editing one class or all three does not say which it resets, and the two
 * outcomes are not recoverable from each other. */
check(
  !/>\s*Reset to original\s*</.test(js),
  'the generic "Reset to original" label is back — reset must name its scope',
);

/* PRIVACY, restated at the surface. The scope pass added a per-class UI, which
 * is exactly the moment someone reaches for a student field to go with it.
 *
 * Comments are stripped first, deliberately. This file's own header documents
 * the boundary — "no student name, no initials, no disability category" — and
 * a scan that cannot tell an assertion from a field flags the sentence that
 * promises the field does not exist. Code is what is checked. */
const code = js.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");
for (const banned of [
  /\bIEP\b/,
  /\bstudentName\b/,
  /disabilit/i,
  /\bwidaLevel\b/,
  /\binitials\b/,
]) {
  check(
    !banned.test(code),
    `student-supports.js code matches ${banned} — this surface is lesson + class only`,
  );
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
  console.error("validate-student-supports FAILED:");
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`✓ /curriculum/student-supports/ lock passed (${OWNED_FILES.length} owned files).`);
