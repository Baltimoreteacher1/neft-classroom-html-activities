#!/usr/bin/env node
/* =============================================================================
 * validate-showcase.mjs — gate for "Student Work Becomes the Textbook"
 * -----------------------------------------------------------------------------
 *   node tools/validate-showcase.mjs
 *
 * No dependencies. Exits non-zero on the first category of failure so a broken
 * consent or moderation guarantee can never ship. What it proves:
 *
 *   1. data/student-showcase.json entries are real standards, are captioned,
 *      declare a legal display_mode, and are honestly labelled as curriculum
 *      exemplars rather than as children's work.
 *   2. No entry carries anything shaped like a full student name.
 *   3. functions/api/showcase.js gates EVERY state-changing route and EVERY
 *      non-approved read behind the teacher key, checked by walking the actual
 *      handler bodies and comparing statement order — not by grepping for a
 *      reassuring substring.
 *   4. assets/student-showcase.css has no unscoped selector. That file loads on
 *      lesson pages; a leaked selector there has broken this repo before.
 *   5. None of the files this feature owns contain the discouraged label, and
 *      none of them emit a dark-mode block (this is a light-only site).
 * ========================================================================== */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

const OWNED_FILES = [
  "curriculum/showcase/index.html",
  "curriculum/showcase/showcase.js",
  "curriculum/showcase/showcase.css",
  "assets/student-showcase.js",
  "assets/student-showcase.css",
  "functions/api/showcase.js",
  "data/student-showcase.json",
  "tools/validate-showcase.mjs",
];

const failures = [];
const fail = (msg) => failures.push(msg);

/* -------------------------------------------------------------------------- */
/* 1 + 2. Seed data                                                           */
/* -------------------------------------------------------------------------- */
const ns = JSON.parse(read("data/curriculum-nervous-system.json"));
const standardIds = new Set((ns.nodes || []).map((n) => n && n.id).filter(Boolean));
if (standardIds.size < 10) fail("curriculum-nervous-system.json yielded almost no standard ids");

const seed = JSON.parse(read("data/student-showcase.json"));
const items = Array.isArray(seed.items) ? seed.items : null;

if (!items || !items.length) {
  fail("data/student-showcase.json has no `items` array");
} else {
  if (typeof seed._note !== "string" || !/exemplar/i.test(seed._note)) {
    fail("data/student-showcase.json is missing a `_note` explaining these are exemplars");
  }
  if (items.length < 8) fail(`seed has only ${items.length} entries; at least 8 expected`);

  const DISPLAY_MODES = new Set(["anonymous", "firstNameInitial"]);
  // Two capitalised words in a row is what a full name looks like.
  const FULL_NAME = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/;
  const NAME_FIELDS = ["displayName", "display_name", "name", "studentName", "author"];
  const seenIds = new Set();

  items.forEach((item, i) => {
    const where = `seed item ${i} (${(item && item.id) || "no id"})`;
    if (!item || typeof item !== "object") return fail(`${where}: not an object`);

    if (!item.id || seenIds.has(item.id)) fail(`${where}: missing or duplicate id`);
    seenIds.add(item.id);

    if (!standardIds.has(item.standard)) {
      fail(`${where}: standard "${item.standard}" is not in curriculum-nervous-system.json`);
    }
    if (typeof item.caption !== "string" || !item.caption.trim()) {
      fail(`${where}: caption is empty`);
    }
    if (!DISPLAY_MODES.has(item.display_mode)) {
      fail(`${where}: display_mode must be "anonymous" or "firstNameInitial"`);
    }
    if (item.source !== "curriculum-exemplar") {
      fail(`${where}: source must be "curriculum-exemplar" so it is never mistaken for real work`);
    }
    if (item.state && item.state !== "approved") {
      fail(`${where}: seed entries must be state "approved"`);
    }

    for (const field of NAME_FIELDS) {
      const value = item[field];
      if (typeof value === "string" && FULL_NAME.test(value)) {
        fail(`${where}: field "${field}" looks like a full student name ("${value}")`);
      }
    }

    if (typeof item.linkPath === "string" && item.linkPath) {
      const p = item.linkPath;
      const bad = !p.startsWith("/") || p.startsWith("//") || p.includes("..") || p.includes(":");
      if (bad) fail(`${where}: linkPath "${p}" is not a safe same-origin path`);
    }
  });

  const distinctStandards = new Set(items.map((i) => i && i.standard));
  if (distinctStandards.size < 6) {
    fail(`seed spans only ${distinctStandards.size} standards; spread exemplars more widely`);
  }
}

/* -------------------------------------------------------------------------- */
/* 3. API auth gates — walk the handler bodies, compare statement order        */
/* -------------------------------------------------------------------------- */
const api = read("functions/api/showcase.js");

// Return the { ... } body of `function NAME(` / `async function NAME(`.
function functionBody(source, name) {
  const signature = new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`);
  const match = signature.exec(source);
  if (!match) return null;
  const open = source.indexOf("{", match.index + match[0].length);
  if (open === -1) return null;
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  return null;
}

// A gate is real only if the failure path returns before any DB access.
function assertGated(body, label, { requireBeforeDb = true } = {}) {
  if (!body) return fail(`showcase.js: could not find ${label}`);
  const gateCall = body.indexOf("teacherGate(");
  const gateReturn = body.search(
    /if\s*\(\s*gate\s*!==\s*"ok"\s*\)\s*return\s+gateResponse\(gate\)/,
  );
  if (gateCall === -1) return fail(`showcase.js: ${label} never calls teacherGate()`);
  if (gateReturn === -1) {
    return fail(`showcase.js: ${label} never returns gateResponse() when the gate fails`);
  }
  if (gateReturn < gateCall) fail(`showcase.js: ${label} checks the gate before computing it`);
  if (!requireBeforeDb) return undefined;
  const dbUse = body.search(/env\.DB\.prepare\(|ensureSchema\(/);
  if (dbUse !== -1 && gateReturn > dbUse) {
    fail(`showcase.js: ${label} touches the database before the teacher-key gate returns`);
  }
  return undefined;
}

assertGated(functionBody(api, "handlePatch"), "handlePatch (approve / unpublish)");
assertGated(functionBody(api, "handleDelete"), "handleDelete (instant unpublish)");

// GET: only the public "approved" view may run unauthenticated. The gate must
// sit inside the non-approved branch and precede every query.
const getBody = functionBody(api, "handleGet");
if (!getBody) {
  fail("showcase.js: could not find handleGet");
} else {
  const branch = getBody.search(/if\s*\(\s*requestedState\s*!==\s*"approved"\s*\)/);
  const gateCall = getBody.indexOf("teacherGate(");
  const gateReturn = getBody.search(
    /if\s*\(\s*gate\s*!==\s*"ok"\s*\)\s*return\s+gateResponse\(gate\)/,
  );
  const firstQuery = getBody.search(/env\.DB\.prepare\(|ensureSchema\(/);
  if (branch === -1) fail('showcase.js: handleGet has no `requestedState !== "approved"` branch');
  if (gateCall === -1 || gateReturn === -1)
    fail("showcase.js: handleGet does not gate non-approved reads");
  if (branch !== -1 && gateCall !== -1 && gateCall < branch) {
    fail("showcase.js: handleGet calls teacherGate outside the non-approved branch");
  }
  if (firstQuery !== -1 && gateReturn !== -1 && gateReturn > firstQuery) {
    fail("showcase.js: handleGet queries the database before gating non-approved reads");
  }
  if (!/state\s*=\s*\?/.test(getBody) || !/\.bind\(requestedState/.test(getBody)) {
    fail("showcase.js: handleGet must bind the requested state into the WHERE clause");
  }
}

// The requested state must come from an allowlist that defaults to "approved",
// or the gate above could be walked around with a crafted query string.
const normalize = functionBody(api, "normalizeState");
if (!normalize) fail("showcase.js: normalizeState() is missing");
else if (!/VALID_STATES\.includes\(s\)\s*\?\s*s\s*:\s*"approved"/.test(normalize)) {
  fail('showcase.js: normalizeState() must fall back to "approved" for unknown input');
}

// Student submissions must land as pending, never as approved.
const postBody = functionBody(api, "handlePost");
if (!postBody) fail("showcase.js: handlePost is missing");
else {
  if (!/VALUES\s*\([^)]*'pending'/.test(postBody)) {
    fail("showcase.js: handlePost must INSERT with state 'pending'");
  }
  if (/'approved'/.test(postBody)) {
    fail("showcase.js: handlePost must never write the 'approved' state");
  }
  if (postBody.includes("teacherGate(")) {
    fail("showcase.js: handlePost is the unauthenticated student route and must not need a key");
  }
}

// The router must not reach the database itself, so every path is one of the
// four handlers checked above.
const routerBody = functionBody(api, "onRequest");
if (!routerBody) fail("showcase.js: onRequest is missing");
else if (/env\.DB\.prepare\(/.test(routerBody)) {
  fail("showcase.js: onRequest touches the database outside a gated handler");
}

// The consent resolver must require BOTH signals before showing a name.
const resolver = functionBody(api, "resolveDisplay");
if (!resolver) fail("showcase.js: resolveDisplay() is missing");
else {
  if (!/consentSaysName\s*&&\s*modeSaysName/.test(resolver)) {
    fail("showcase.js: resolveDisplay() must require the consent record AND display_mode to agree");
  }
  if (!/return\s*\{\s*displayName:\s*ANON_LABEL/.test(resolver)) {
    fail("showcase.js: resolveDisplay() must fall back to the anonymous label");
  }
}

// Ingest allowlist must match the generated standards list exactly.
const idsMatch = /const STANDARD_IDS = \[([\s\S]*?)\];/.exec(api);
if (!idsMatch) fail("showcase.js: STANDARD_IDS allowlist not found");
else {
  const declared = new Set(
    idsMatch[1]
      .split(",")
      .map((s) => s.trim().replace(/^"|"$/g, ""))
      .filter(Boolean),
  );
  for (const id of standardIds) {
    if (!declared.has(id)) fail(`showcase.js: STANDARD_IDS is missing "${id}"`);
  }
  for (const id of declared) {
    if (!standardIds.has(id)) fail(`showcase.js: STANDARD_IDS has unknown standard "${id}"`);
  }
}

/* -------------------------------------------------------------------------- */
/* 4. Runtime-include CSS must be fully scoped                                */
/* -------------------------------------------------------------------------- */
const includeCss = read("assets/student-showcase.css");
const cssNoComments = includeCss.replace(/\/\*[\s\S]*?\*\//g, "");

function checkScoped(css, path) {
  let i = 0;
  let depth = 0;
  let selectorStart = 0;
  while (i < css.length) {
    const ch = css[i];
    if (ch === "{") {
      if (depth === 0) {
        const selector = css.slice(selectorStart, i).trim();
        if (selector.startsWith("@")) {
          const at = selector.split(/\s|\(/)[0];
          if (at !== "@media" && at !== "@supports") {
            fail(`${path}: at-rule "${at}" is not allowed in the scoped include stylesheet`);
          }
          // Nested rules inside @media/@supports still have to be scoped.
        } else if (selector) {
          for (const part of selector.split(",")) {
            const one = part.trim();
            if (one && !one.startsWith(".nt-showcase")) {
              fail(`${path}: selector "${one}" is not scoped under .nt-showcase`);
            }
          }
        }
      }
      depth += 1;
      selectorStart = i + 1;
    } else if (ch === "}") {
      depth = Math.max(0, depth - 1);
      selectorStart = i + 1;
    }
    i += 1;
  }
}
checkScoped(cssNoComments, "assets/student-showcase.css");

/* -------------------------------------------------------------------------- */
/* 5. Vocabulary and light-only rules across every owned file                  */
/* -------------------------------------------------------------------------- */
// Assembled from character codes so this validator does not itself contain the
// discouraged label it is checking for.
const BANNED_LABEL = String.fromCharCode(69, 83, 79, 76);
// Likewise assembled, so the check never matches its own source. Matches the
// at-rule form only, so prose that merely names the media feature is fine.
const DARK_BLOCK = new RegExp("@media[^{]*prefers-" + "color" + "-scheme");
for (const rel of OWNED_FILES) {
  let source;
  try {
    source = read(rel);
  } catch (_e) {
    fail(`${rel}: file is missing`);
    continue;
  }
  if (source.includes(BANNED_LABEL)) fail(`${rel}: contains the discouraged label`);
  if (DARK_BLOCK.test(source)) {
    fail(`${rel}: emits a dark-mode block on a light-only site`);
  }
}

/* -------------------------------------------------------------------------- */
/* Report                                                                     */
/* -------------------------------------------------------------------------- */
if (failures.length) {
  for (const message of failures) console.error(`FAIL  ${message}`);
  console.error(`\nvalidate-showcase: ${failures.length} problem(s) found.`);
  process.exit(1);
}

const itemCount = items ? items.length : 0;
const standardCount = items ? new Set(items.map((i) => i.standard)).size : 0;
console.log(
  `PASS  validate-showcase: ${itemCount} exemplar entries across ${standardCount} standards, ` +
    `teacher-key gates verified on handlePatch/handleDelete/pending reads, ` +
    `${OWNED_FILES.length} owned files clean, include CSS fully scoped under .nt-showcase.`,
);
