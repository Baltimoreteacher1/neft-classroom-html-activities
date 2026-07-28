#!/usr/bin/env node
/**
 * validate-public-security.mjs — regression guard for the public-route security
 * posture of the award-portfolio work.
 *
 * Added after an audit found that math/command-center/index.html, a page
 * published to the production site, shipped a UI for running arbitrary npm
 * scripts, streaming server stdout, browsing QA log files, and rendering a
 * table of student names and save/resume codes — all of it revealed as soon as
 * anything answered on http://localhost:3030, with server-supplied strings
 * interpolated straight into innerHTML.
 *
 * These checks assert the remediation stays in place. Wired into
 * `npm run validate`, so the pre-push QA loop blocks a regression.
 *
 * Run: npm run validate:public-security
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const checks = [];

function check(ok, message) {
  checks.push({ ok, message });
  if (!ok) errors.push(message);
}

/* ------------------------------- 1. the legacy Math Command Center --------- */

const CC = resolve(ROOT, "math/command-center/index.html");
if (!existsSync(CC)) {
  errors.push("math/command-center/index.html is missing — the page must remain, remediated.");
} else {
  const html = readFileSync(CC, "utf8");

  check(
    /function isDevHost\(/.test(html),
    "command-center: the isDevHost() gate is gone — the local-server integration would run on the public site",
  );
  check(
    /applyProductionPosture\(/.test(html),
    "command-center: applyProductionPosture() is gone — production visitors would see dev-only controls",
  );
  check(
    /if \(!isDevHost\(\)\)/.test(html),
    "command-center: the load handler no longer checks isDevHost() before probing the local server",
  );
  check(
    !/api\/student-progress/.test(html),
    "command-center: the student-progress fetch is back — a public page must not pull a roster",
  );
  check(
    !/progress-table-body|filterProgressTable|renderProgressTable/.test(html),
    "command-center: the student name / resume-code table is back on a public route",
  );
  check(
    /function ccEscape\(/.test(html),
    "command-center: ccEscape() is gone — server-supplied strings would be interpolated unescaped",
  );
  check(
    /ccEscape\(data\.branch\)/.test(html),
    "command-center: the branch name from the local server is no longer escaped before innerHTML",
  );
  check(
    !/onclick="viewLogFile\('\$\{/.test(html),
    "command-center: a log filename is being interpolated into an inline onclick attribute again",
  );
  check(
    /encodeURIComponent\(scriptName\)/.test(html),
    "command-center: the script name is no longer URL-encoded before being sent to the local server",
  );
}

/* --------- 2. no page ships an unauthenticated roster of names + codes ----- */

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  ".wrangler",
  "docs",
  "tools",
  "scripts",
  "tests",
  "test",
  "reports",
  ".qa-logs",
]);

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry) || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, out);
    else if (entry.endsWith(".html")) out.push(full);
  }
  return out;
}

const pages = walk(ROOT);

/* Pages that legitimately reach roster data do so through the shared teacher
 * key. This asserts the pairing: if a page fetches a roster endpoint, it must
 * also reference the teacher key. */
const ROSTER_ENDPOINT = /\/api\/(roster|student-progress)\b/;
const TEACHER_KEY = /neft\.teacher\.key|teacherKey|TEACHER_KEY|nt-board-teacher-key/;

for (const file of pages) {
  const rel = file.replace(`${ROOT}/`, "");
  const html = readFileSync(file, "utf8");
  if (ROSTER_ENDPOINT.test(html) && !TEACHER_KEY.test(html)) {
    errors.push(`${rel}: fetches roster data without referencing the shared teacher key`);
  }
}
checks.push({ ok: true, message: `${pages.length} published pages scanned for ungated roster access` });

/* ---------------------- 3. judge mode is synthetic-only -------------------- */

const judgeDir = resolve(ROOT, "judge-mode");
if (!existsSync(judgeDir)) {
  errors.push("judge-mode/ is missing");
} else {
  const judgePages = walk(judgeDir);
  check(judgePages.length >= 2, "judge-mode: expected an index plus per-product pages");
  for (const file of judgePages) {
    const rel = file.replace(`${ROOT}/`, "");
    const html = readFileSync(file, "utf8");
    if (!/data-ewl-judge-mode/.test(html) && !/judge-mode\/">/.test(html)) continue;
    if (/data-ewl-judge-mode/.test(html)) {
      if (!/synthetic-data\.js/.test(html)) {
        errors.push(`${rel}: a judge-mode page must load the synthetic dataset`);
      }
      if (!/judge-mode\.js/.test(html)) {
        errors.push(`${rel}: a judge-mode page must load the judge-mode runner`);
      }
    }
  }

  const judgeSrc = readFileSync(resolve(ROOT, "shared/portfolio/judge-mode.js"), "utf8");
  check(
    /useSynthetic\(/.test(judgeSrc),
    "judge-mode.js: no longer switches the evidence layer into synthetic mode",
  );
  check(
    /clearSynthetic\(/.test(judgeSrc),
    "judge-mode.js: no longer clears synthetic mode on page hide",
  );

  const syntheticSrc = readFileSync(resolve(ROOT, "shared/portfolio/synthetic-data.js"), "utf8");
  // Strip comments first: the file's own header documents the ban by naming the
  // forbidden calls, and that prose must not trip the check.
  const syntheticCode = syntheticSrc
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
  check(
    !/Math\.random\(|Date\.now\(/.test(syntheticCode),
    "synthetic-data.js: contains a non-deterministic source — a demo must be reproducible",
  );
  const badIds = [...syntheticSrc.matchAll(/learnerId:\s*"([^"]+)"/g)]
    .map((m) => m[1])
    .filter((id) => !id.startsWith("demo:"));
  check(
    badIds.length === 0,
    `synthetic-data.js: learner ids must start with "demo:" — found ${badIds.join(", ")}`,
  );
}

/* -------------- 4. the support profile stores no sensitive fields ---------- */

const profileSrc = readFileSync(resolve(ROOT, "shared/support/support-profile.js"), "utf8");
const fieldsBlock = /var FIELDS = \{([\s\S]*?)\n  \};/.exec(profileSrc);
if (!fieldsBlock) {
  errors.push("support-profile.js: could not locate the FIELDS declaration");
} else {
  const banned = ["diagnos", "iep", "504", "disabilit", "medical", "medication", "confidential"];
  const declared = [...fieldsBlock[1].matchAll(/^\s{4}([A-Za-z]+):/gm)].map((m) => m[1].toLowerCase());
  for (const field of declared) {
    for (const token of banned) {
      if (field.includes(token)) {
        errors.push(`support-profile.js: field "${field}" looks like sensitive student data`);
      }
    }
  }
  checks.push({
    ok: true,
    message: `${declared.length} support-profile fields checked against the banned list`,
  });
}

/* --------------------------- 5. the excluded product ----------------------- */

const excludedRoute = resolve(ROOT, "curriculum/monster-math-academy/index.html");
check(
  existsSync(excludedRoute),
  "the excluded product's route must remain live and unmodified: /curriculum/monster-math-academy/",
);

const productRegistry = readFileSync(resolve(ROOT, "data/product-registry.json"), "utf8");
const registryProducts = JSON.parse(productRegistry).products;
check(
  !JSON.stringify(registryProducts).toLowerCase().includes("monster"),
  "the excluded product appears in the product registry entries",
);

/* "Do not modify its code" taken literally: no award-portfolio layer may be
 * injected into the excluded product's pages. The support-profile injector
 * originally swept it up with every other student-facing page — passive and
 * backward-compatible, but a modification nonetheless. This asserts the
 * exclusion holds for every layer this initiative added. */
const EXCLUDED_DIR = resolve(ROOT, "curriculum/monster-math-academy");
const PORTFOLIO_LAYERS = [
  "/shared/support/support-profile",
  "/shared/support/scaffold-ladder",
  "/shared/evidence/learning-evidence",
  "/shared/evidence/curriculum-registry-client",
  "/shared/evidence/instructional-need",
  "/shared/portfolio/",
];
for (const file of walk(EXCLUDED_DIR)) {
  const rel = file.replace(`${ROOT}/`, "");
  const html = readFileSync(file, "utf8");
  for (const layer of PORTFOLIO_LAYERS) {
    if (html.includes(layer)) {
      errors.push(`${rel}: the excluded product must not carry the award-portfolio layer "${layer}"`);
    }
  }
}
checks.push({
  ok: true,
  message: `excluded product scanned for ${PORTFOLIO_LAYERS.length} portfolio layers — none present`,
});

/* --------------------------------- report ---------------------------------- */

for (const c of checks) {
  if (!c.ok) console.error(`  ✗ ${c.message}`);
}
for (const e of errors) {
  if (!checks.some((c) => c.message === e)) console.error(`  ✗ ${e}`);
}

console.log(
  `validate-public-security: ${errors.length === 0 ? "PASS ✅" : "FAIL ❌"} — ${checks.length} invariant group(s), ${pages.length} pages scanned, ${errors.length} error(s).`,
);
process.exit(errors.length === 0 ? 0 : 1);
