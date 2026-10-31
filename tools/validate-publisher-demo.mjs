#!/usr/bin/env node
/* =============================================================================
 * validate-publisher-demo.mjs — gate for /curriculum/publisher-demo/
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

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadLessonConfig } from "./lib/curriculum-source.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

const OWNED_FILES = [
  "curriculum/publisher-demo/index.html",
  "curriculum/publisher-demo/publisher-demo.css",
  "curriculum/publisher-demo/publisher-demo.js",
  "tools/validate-publisher-demo.mjs",
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
  console.error("validate-publisher-demo: " + failures.join("\n  "));
  process.exit(1);
}

const html = files.get("curriculum/publisher-demo/index.html");
const css = files.get("curriculum/publisher-demo/publisher-demo.css");
const js = files.get("curriculum/publisher-demo/publisher-demo.js");
const flagshipRoute = "/" + "less" + "ons/3-1/";
const lessonRoute = (suffix) => "/" + "less" + "ons/" + suffix;

/* --- 2a. This is a guided, usable tour, not a static placeholder ------------ */
for (const required of [
  `href="${flagshipRoute}"`,
  'id="batch-count"',
  'id="prediction-form"',
  'id="transfer-form"',
  'id="prediction-feedback"',
  'id="transfer-feedback"',
  'aria-live="polite"',
  'role="tablist"',
  "Synthetic sample",
  "Working",
  "Planned",
  "What this does not establish",
]) {
  check(
    html.includes(required),
    `publisher demonstration is missing required feature/content: ${required}`,
  );
}
check(
  (html.match(/class="tour-stop/g) || []).length === 5,
  "the demonstration must have all five guided stops",
);
check(css.includes("prefers-reduced-motion: reduce"), "reduced-motion support is missing");
for (const href of [
  flagshipRoute,
  lessonRoute("3-1-group1/practice.html"),
  lessonRoute("3-1/homework.html"),
  "/curriculum/ratio-quest/",
  "/curriculum/math-canvas/",
  "/curriculum/family-connections/",
  "/teacher-tools/evidence-groups/",
]) {
  const rel = href.replace(/^\//, "");
  check(
    existsSync(join(ROOT, rel)) || existsSync(join(ROOT, rel, "index.html")),
    `working tour route does not resolve locally: ${href}`,
  );
}
check(
  read("teacher-tools/evidence-groups/index.html").includes('id="btn-demo"'),
  "teacher evidence example is not connected to its working sample-data control",
);
check(
  read("curriculum/publisher-demo/publisher-demo.js").includes("juice === 9 && water === 6"),
  "ratio model prediction check is missing its 3-batch answer",
);
check(
  read("curriculum/publisher-demo/publisher-demo.js").includes("water === 8"),
  "ratio model transfer check is missing its equivalent-ratio answer",
);

const dashboard = read("teacher-data-dashboard/index.html");
check(
  dashboard.includes("Scenario illustration only."),
  "teacher dashboard scenario limitation is not visible at the top of the scenario view",
);
check(
  dashboard.includes("not a standardized-score predictor"),
  "teacher dashboard does not reject standardized-score prediction claims",
);
check(
  dashboard.includes("not a confidence interval"),
  "teacher dashboard does not clarify the illustrative range",
);
check(
  !dashboard.includes("Standardized Score Predictor</strong>"),
  "unvalidated standardized score predictor claim remains in the teacher dashboard",
);

const flagship = loadLessonConfig("3-1");
const cafeteriaModel = flagship.connect?.simulator;
check(
  flagship.standard === "6.AT.1",
  "flagship ratio lesson is no longer aligned to its recorded Grade 6 standard",
);
check(
  cafeteriaModel?.xName === "groups of 2 side dishes" && cafeteriaModel?.yName === "main dishes",
  "flagship proportional model labels must match the cafeteria context",
);
check(
  cafeteriaModel?.rate === 3 && cafeteriaModel?.xMax === 5 && cafeteriaModel?.xStep === 1,
  "flagship cafeteria model must scale 3 main dishes for each group of 2 side dishes",
);
check(
  cafeteriaModel?.rate * cafeteriaModel?.xMax === 15,
  "five groups of two side dishes must scale to 15 main dishes",
);

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
    `inline handler calls ${m[1]}(), which publisher-demo.js does not define`,
  );
}

/* --- 3. Stylesheet stays scoped -------------------------------------------- */
for (const line of css.split("\n")) {
  const sel = line.match(/^\s*([a-z][\w-]*)\s*(?:,|\{)/);
  if (sel && !["from", "to"].includes(sel[1])) {
    fail(
      `unscoped selector "${sel[1]}" in publisher-demo.css — it must live under .publisher-demo-wrap`,
    );
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
  console.error("validate-publisher-demo FAILED:");
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`✓ /curriculum/publisher-demo/ lock passed (${OWNED_FILES.length} owned files).`);
