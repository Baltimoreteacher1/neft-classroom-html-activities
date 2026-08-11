#!/usr/bin/env node
/**
 * validate-family-broadcast.mjs — guard for the Weekly Family Broadcast.
 *
 *   node tools/validate-family-broadcast.mjs
 *
 * No dependencies, non-zero exit on any failure. This surface returns data
 * about ONE NAMED CHILD to their family, so the checks here are about the two
 * things that would actually hurt if they regressed:
 *
 *   PRIVACY   The endpoint must never gain a path that answers with data
 *             before the save code has been checked and resolved.
 *   DIGNITY   Every family-facing string exists in real Spanish as well as
 *             English, the kitchen-table bank covers every misconception tag
 *             the platform can emit, and no deficit vocabulary reaches a
 *             family in either language.
 *
 * Run it from anywhere; paths resolve from the repo root.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BROADCAST_DIR = resolve(repoRoot, "curriculum/family-connections/broadcast");
const ENDPOINT = resolve(repoRoot, "functions/api/family-broadcast.js");
const LABELS = resolve(repoRoot, "data/misconception-labels.json");

const failures = [];
const fail = (msg) => failures.push(msg);
const rel = (p) => relative(repoRoot, p);

/* ------------------------------------------------------------------ inputs */

const labels = JSON.parse(readFileSync(LABELS, "utf8"));
const canonicalTags = Object.keys(labels.tags || {});
const content = await import(`file://${join(BROADCAST_DIR, "broadcast-content.js")}`).catch(
  (err) => {
    fail(`broadcast-content.js does not load: ${err.message}`);
    return null;
  },
);

if (!content) {
  report(0, 0);
}

const {
  KITCHEN_TABLE,
  TAGS,
  STANDARDS,
  ASSETS,
  BRIDGES,
  UI,
  DEFAULT_KITCHEN_TABLE,
  DEFAULT_NEXT_UP,
} = content;

/* ---------------------------------------- 1. bank covers all 19 tags ------ */

if (canonicalTags.length !== 23) {
  fail(
    `data/misconception-labels.json declares ${canonicalTags.length} tags, expected 23 — update this validator deliberately, not by accident`,
  );
}

for (const tag of canonicalTags) {
  if (!TAGS[tag]) {
    fail(`TAGS is missing "${tag}" (present in data/misconception-labels.json)`);
    continue;
  }
  const meta = TAGS[tag];
  if (meta.label !== labels.tags[tag].label) {
    fail(`TAGS["${tag}"].label has drifted from data/misconception-labels.json`);
  }
  if (meta.watchFor !== labels.tags[tag].watchFor) {
    fail(`TAGS["${tag}"].watchFor has drifted from data/misconception-labels.json`);
  }
  if (!meta.watchForEs || meta.watchForEs === meta.watchFor) {
    fail(`TAGS["${tag}"].watchForEs is missing or is the English text`);
  }
  if (!Array.isArray(meta.standards) || !meta.standards.length) {
    fail(`TAGS["${tag}"] names no standard, so "still building" cannot link anywhere`);
  }
  for (const std of meta.standards || []) {
    if (!STANDARDS[std]) fail(`TAGS["${tag}"] points at unknown standard "${std}"`);
  }
}

for (const tag of Object.keys(TAGS)) {
  if (!canonicalTags.includes(tag)) {
    fail(`TAGS has "${tag}", which data/misconception-labels.json does not know`);
  }
}

let activityCount = 0;
for (const tag of canonicalTags) {
  const a = KITCHEN_TABLE[tag];
  if (!a) {
    fail(`the kitchen-table bank has no activity for "${tag}"`);
    continue;
  }
  activityCount += 1;
  checkActivity(`KITCHEN_TABLE["${tag}"]`, a);
}
checkActivity("DEFAULT_KITCHEN_TABLE", DEFAULT_KITCHEN_TABLE);

function checkActivity(where, a) {
  if (!Number.isFinite(a.minutes) || a.minutes <= 0 || a.minutes > 5) {
    fail(`${where}.minutes is ${a.minutes}; it must be a real number of minutes, five at most`);
  }
  if (!Array.isArray(a.steps) || a.steps.length < 3) {
    fail(`${where} has ${(a.steps || []).length} steps; at least three are required`);
  }
  if (!Array.isArray(a.stepsEs) || a.stepsEs.length !== (a.steps || []).length) {
    fail(`${where}.stepsEs does not match the English steps one for one`);
  }
  for (const field of ["title", "materials", "why"]) {
    const en = a[field];
    const es = a[`${field}Es`];
    if (!en || typeof en !== "string") fail(`${where}.${field} is missing`);
    if (!es || typeof es !== "string") fail(`${where}.${field}Es is missing`);
  }
  for (let i = 0; i < (a.steps || []).length; i++) {
    if (!a.stepsEs || !a.stepsEs[i]) fail(`${where}.stepsEs[${i}] is missing`);
  }
}

/* ------------------------------- 2. no Spanish string equals its English -- */

let pairsChecked = 0;

function comparePair(where, en, es) {
  if (typeof en !== "string" || typeof es !== "string") return;
  pairsChecked += 1;
  if (en.trim() === es.trim()) {
    fail(`${where}: the Spanish string is the English string ("${en.slice(0, 60)}")`);
  }
}

function walkPairs(where, obj) {
  for (const [key, value] of Object.entries(obj)) {
    if (!key.endsWith("Es")) continue;
    const base = key.slice(0, -2);
    if (!(base in obj)) continue;
    if (Array.isArray(value) && Array.isArray(obj[base])) {
      for (let i = 0; i < value.length; i++)
        comparePair(`${where}.${key}[${i}]`, obj[base][i], value[i]);
    } else {
      comparePair(`${where}.${key}`, obj[base], value);
    }
  }
}

for (const [tag, a] of Object.entries(KITCHEN_TABLE)) walkPairs(`KITCHEN_TABLE["${tag}"]`, a);
walkPairs("DEFAULT_KITCHEN_TABLE", DEFAULT_KITCHEN_TABLE);
for (const [tag, meta] of Object.entries(TAGS)) walkPairs(`TAGS["${tag}"]`, meta);
for (const [std, meta] of Object.entries(STANDARDS)) walkPairs(`STANDARDS["${std}"]`, meta);
for (const [std, list] of Object.entries(ASSETS)) {
  for (let i = 0; i < list.length; i++) walkPairs(`ASSETS["${std}"][${i}]`, list[i]);
}
for (let i = 0; i < DEFAULT_NEXT_UP.length; i++)
  walkPairs(`DEFAULT_NEXT_UP[${i}]`, DEFAULT_NEXT_UP[i]);
for (const [std, bridge] of Object.entries(BRIDGES)) {
  comparePair(`BRIDGES["${std}"]`, bridge.en, bridge.es);
}

// The page chrome is a flat key-per-language pair rather than a *Es suffix.
for (const key of Object.keys(UI.en)) {
  const en = UI.en[key];
  const es = UI.es[key];
  if (typeof en !== "string") continue;
  if (typeof es !== "string") {
    fail(`UI.es.${key} is missing; the Spanish page would fall back to English`);
    continue;
  }
  comparePair(`UI.${key}`, en, es);
}

/* --------------------------------- 3. no deficit or programme-label words -- */

const BANNED = [
  { word: "ESOL", re: /\bESOL\b/i, note: "never name a programme on a family page" },
  { word: "failing", re: /\bfailing\b/i, note: "deficit language" },
  { word: "behind", re: /\bbehind\b/i, note: "deficit language" },
  { word: "low", re: /\blow\b/i, note: "deficit language" },
  { word: "poor", re: /\bpoor\b/i, note: "deficit language" },
];

function filesUnder(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...filesUnder(full));
    else out.push(full);
  }
  return out;
}

const scanned = [...filesUnder(BROADCAST_DIR), ENDPOINT];
for (const file of scanned) {
  const src = readFileSync(file, "utf8");
  const lines = src.split("\n");
  for (const { word, re, note } of BANNED) {
    for (let i = 0; i < lines.length; i++) {
      if (re.test(lines[i])) {
        fail(`${rel(file)}:${i + 1} contains "${word}" (${note})`);
      }
    }
  }
}

/* ------------------------- 4. the endpoint always checks the save code ----- */

const endpointSrc = readFileSync(ENDPOINT, "utf8");

// The gate itself must exist, and must reuse the save-code model rather than
// inventing a weaker one.
if (!/function acceptableCode\(/.test(endpointSrc)) {
  fail("family-broadcast.js has no acceptableCode() gate");
}
if (!/student_progress WHERE save_code = \?/.test(endpointSrc)) {
  fail("family-broadcast.js never resolves the code against student_progress");
}
if (!/if \(!acceptableCode\(code\)\) return unauthorized\(\);/.test(endpointSrc)) {
  fail("family-broadcast.js does not reject an unacceptable code with a generic 401");
}

/* Meaningful ordering check: every `return json(` that carries child data must
   appear AFTER the acceptableCode gate, and the only pre-gate returns allowed
   are the OPTIONS 204, the method guard and the gate's own 401. */
const gateIndex = endpointSrc.indexOf("if (!acceptableCode(code)) return unauthorized();");
if (gateIndex < 0) {
  fail("could not locate the acceptableCode gate to order-check the returns");
} else {
  const beforeGate = endpointSrc.slice(0, gateIndex);
  const preGateReturns = [...beforeGate.matchAll(/return (?:json\(|new Response\()/g)];
  // Allowed before the gate: OPTIONS 204 and method-not-allowed. Anything else
  // is a route that could answer without an identity check.
  const allowedPreGate =
    (beforeGate.match(/status: 204/g) || []).length +
    (beforeGate.match(/"method-not-allowed"/g) || []).length;
  const helperReturns =
    (beforeGate.match(/return new Response\(JSON\.stringify\(obj\)/g) || []).length +
    (beforeGate.match(/return json\(\{ ok: false, error: "unauthorized" \}, 401\)/g) || []).length;
  if (preGateReturns.length > allowedPreGate + helperReturns) {
    fail(
      `family-broadcast.js has ${preGateReturns.length} response returns before the save-code gate; only the OPTIONS 204, the method guard and the shared json()/unauthorized() helpers may appear there`,
    );
  }
}

// A named child's week must never be cacheable, and must not be readable
// cross-origin even by a holder of the code.
if (!/"Cache-Control": "no-store/.test(endpointSrc)) {
  fail("family-broadcast.js does not set Cache-Control: no-store on its responses");
}
// Matches the header being SET (a quoted key with a value), not the header
// being named in the prose that explains why it is deliberately absent.
if (/["']Access-Control-Allow-Origin["']\s*:/.test(endpointSrc)) {
  fail(
    "family-broadcast.js sets an Access-Control-Allow-Origin header; this read is same-origin only",
  );
}
// Nothing may be logged: a log line here would carry a child's name or code.
if (/\bconsole\s*\.\s*(log|info|warn|error|debug)\s*\(/.test(endpointSrc)) {
  fail("family-broadcast.js logs; this endpoint must never write a child's name or code anywhere");
}
// Errors must not echo the underlying message (a D1 error can carry the code).
if (/error: "server-error",\s*message:/.test(endpointSrc)) {
  fail("family-broadcast.js echoes the raw error message on failure");
}
/* No grades, ever. The idempotent CREATE TABLE blocks have to stay faithful to
   the real schema (they are the same DDL the writing functions run), so they
   are stripped out before looking for a grade column being READ. */
const readSrc = endpointSrc.replace(/CREATE TABLE IF NOT EXISTS[\s\S]*?\)`/g, "");
for (const banned of ["progress_percent", "manual_grade", "scoreFromState", "exemplar_"]) {
  if (readSrc.includes(banned)) {
    fail(`family-broadcast.js reads "${banned}"; a family broadcast never shows a grade or score`);
  }
}

/* --------------------------------------------------------------- reporting */

report(activityCount, pairsChecked);

function report(activities, pairs) {
  if (failures.length) {
    console.error(`family-broadcast validation FAILED (${failures.length} problem(s)):`);
    for (const f of failures) console.error(`  ✗ ${f}`);
    process.exit(1);
  }
  console.log(
    `family-broadcast validation PASS ✅ (${activities}/19 tags covered by the kitchen-table bank, ${pairs} English/Spanish pairs distinct, ${scanned.length} files clear of deficit language, endpoint gated on the save code)`,
  );
}
