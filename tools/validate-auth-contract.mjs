#!/usr/bin/env node
/**
 * validate-auth-contract.mjs — authentication may not change by accident.
 *
 * WHY THIS EXISTS. On 2026-08-16 a teacher sign-in rewrite shipped at 08:04,
 * grew four follow-up commits over eleven hours, and never signed a single
 * teacher in. Every gate in this repo stayed green throughout, because each one
 * asked whether the code was well-formed and none asked whether the AUTH MODEL
 * was still the one that works. The rollback restored the previous model; this
 * gate is what stops the next unrelated change from drifting off it silently.
 *
 * It holds two different kinds of fact, and the distinction matters:
 *
 *   1. INVARIANTS — statements in AUTH_CONTRACT.md that are checkable in source.
 *      A canonical redirect that stops being a 308, a gate that stops failing
 *      closed, a per-browser branch coming back. These fail on their own merits.
 *
 *   2. A CONTENT PIN — sha256 of each auth-critical file, in
 *      data/auth-baseline.json. Any edit to any of them fails this gate until
 *      the baseline is re-pinned ON PURPOSE (`--update`). That is deliberately
 *      annoying. It converts "I touched _middleware.js while doing something
 *      else" from an invisible event into a blocking one, which is exactly the
 *      class of accident that cost a day.
 *
 * WHAT IT IS NOT. Every check here is a source-text fact. Greps prove the source
 * says something; they do not prove production behaves. The behaviour is proved
 * by tools/e2e-auth.mjs in two real browser engines, and by
 * tools/auth-contract.test.mjs against the real module.
 *
 * Self-tests its detectors before running them, because a detector that has
 * quietly stopped matching reports a perfectly frozen auth system.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE = join(ROOT, "data/auth-baseline.json");
const CONTRACT = "AUTH_CONTRACT.md";

const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const sha = (text) => createHash("sha256").update(text, "utf8").digest("hex");

/* ── The invariants, as named detectors over one file's source ─────────────── */

/**
 * Each detector answers one question about one file and returns null when the
 * contract holds, or a sentence naming what broke. They are exported shapes so
 * the self-test can drive them against fixtures rather than against the repo.
 */
const DETECTORS = {
  "canonical redirect is method-preserving": (src) =>
    /status:\s*308/.test(src)
      ? null
      : "the www→apex redirect is no longer a 308; 301/302 drop a POST body (AUTH_CONTRACT §1)",

  "canonical redirect runs before the password gate": (src) => {
    // Anchored to the CALL SITE, not the name: `export function
    // canonicalRedirect(url)` sits above the gate no matter where it is called
    // from, so matching the bare name would pass even with the call deleted.
    const canonical = src.indexOf("const canonical = canonicalRedirect(url)");
    const gate = src.indexOf("WWW-Authenticate");
    if (canonical < 0)
      return "the canonicalRedirect() CALL is gone from onRequest (AUTH_CONTRACT §1)";
    if (gate < 0) return "the Basic Auth challenge is gone from the middleware (AUTH_CONTRACT §2)";
    return canonical < gate
      ? null
      : "the password gate now runs BEFORE canonicalization, so a credential can be entered on www (AUTH_CONTRACT §1)";
  },

  "the gate is HTTP Basic with the expected realm": (src) =>
    /Basic realm="EduWonderLab"/.test(src)
      ? null
      : "the Basic Auth realm changed; browsers key stored credentials by realm, so this silently forgets every teacher's saved password (AUTH_CONTRACT §2)",

  "a missing SITE_PASSWORD fails closed": (src) =>
    /status:\s*503/.test(src) && /if\s*\(!password\)/.test(src)
      ? null
      : "the unset-password branch no longer returns 503; an unconfigured gate must never serve teacher material (AUTH_CONTRACT §6)",

  "no session or cookie architecture has returned": (src) =>
    /Set-Cookie|nt_teacher|teacher-auth/i.test(src)
      ? "cookie/session auth has been reintroduced into the middleware — this is the model that was rolled back (AUTH_CONTRACT header)"
      : null,

  "no per-browser branching has returned": (src) =>
    /Sec-Fetch-Mode|sec-fetch-mode/i.test(src)
      ? "the middleware branches on Sec-Fetch-Mode again; Chromium and WebKit must see ONE flow (AUTH_CONTRACT §7)"
      : null,
};

/** The Planner must send its credential as a header, never persist or expose it. */
const STORE_DETECTORS = {
  "the planner sends x-teacher-key as a header": (src) =>
    /x-teacher-key/i.test(src)
      ? null
      : "the planner no longer sends x-teacher-key; the pacing endpoint authorizes on that header (AUTH_CONTRACT §3)",

  "the planner does not put a credential in a URL": (src) =>
    /[?&](?:key|teacherKey|teacher_key)=/.test(src)
      ? "a teacher key is being placed in a URL, where it reaches logs and Referer headers (AUTH_CONTRACT §3)"
      : null,
};

/**
 * Comments are evidence of intent, not of behaviour. teacher-mode.js documents
 * the separation it must maintain ("neither is SITE_PASSWORD"), and a detector
 * that reads that as a violation punishes the file for explaining itself — so
 * strip comments before asking what the CODE names.
 */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

/** The client PIN must stay a client PIN. */
const PIN_DETECTORS = {
  "Teacher Mode does not name a server-only binding": (src) =>
    /TEACHER_KEY_|SITE_PASSWORD|env\.TEACHER_KEY/.test(stripComments(src))
      ? "shipped Teacher Mode code names a server binding; the PIN is a classroom deterrent and must never be a server credential (AUTH_CONTRACT §4)"
      : null,
};

/* ── Self-test: every detector must fire on a known-bad fixture ────────────── */

function selfTest() {
  const good = read("functions/_middleware.js");
  const cases = [
    ["canonical redirect is method-preserving", good.replace(/status:\s*308/, "status: 301")],
    [
      "canonical redirect runs before the password gate",
      good.replace("const canonical = canonicalRedirect(url)", "const canonical = null"),
    ],
    [
      "the gate is HTTP Basic with the expected realm",
      good.replace('Basic realm="EduWonderLab"', 'Basic realm="Other"'),
    ],
    ["a missing SITE_PASSWORD fails closed", good.replace(/status:\s*503/, "status: 200")],
    ["no session or cookie architecture has returned", `${good}\nheaders.set("Set-Cookie", x);`],
    ["no per-browser branching has returned", `${good}\nconst m = h.get("Sec-Fetch-Mode");`],
  ];
  for (const [name, mutated] of cases) {
    if (DETECTORS[name](mutated) === null) {
      throw new Error(`self-test: detector "${name}" did not fire on a mutated source`);
    }
  }
  for (const [name, fn] of Object.entries(DETECTORS)) {
    if (fn(good) !== null) {
      throw new Error(`self-test: detector "${name}" fires on the CURRENT source: ${fn(good)}`);
    }
  }
  // Negative fixtures for the smaller detector sets.
  if (
    STORE_DETECTORS["the planner does not put a credential in a URL"]("/api/x?key=abc") === null
  ) {
    throw new Error("self-test: the URL-credential detector did not fire");
  }
  if (
    PIN_DETECTORS["Teacher Mode does not name a server-only binding"]("env.TEACHER_KEY") === null
  ) {
    throw new Error("self-test: the PIN/server-binding detector did not fire");
  }
  return cases.length + 2;
}

/* ── Run ───────────────────────────────────────────────────────────────────── */

const update = process.argv.includes("--update");
const failures = [];
let checks = 0;

const selfTests = selfTest();
checks += selfTests;

const baseline = JSON.parse(read("data/auth-baseline.json"));
const files = Object.keys(baseline.files);

// The contract document must name exactly the files the baseline pins. A file
// added to one and not the other is how this stops describing reality.
const contractText = read(CONTRACT);
for (const f of files) {
  checks++;
  if (!contractText.includes(f)) {
    failures.push(`${CONTRACT} does not mention the pinned auth file \`${f}\` (§8 table)`);
  }
}

// The content pin.
const nextFiles = {};
for (const f of files) {
  checks++;
  const actual = sha(read(f));
  nextFiles[f] = actual;
  if (actual !== baseline.files[f] && !update) {
    failures.push(
      `${f} changed since the auth baseline was pinned.\n` +
        `      If this change to AUTHENTICATION is intended: re-read ${CONTRACT}, run\n` +
        `      \`npm run e2e:auth\` in BOTH engines, then re-pin with:\n` +
        `        node tools/validate-auth-contract.mjs --update\n` +
        `      If you did NOT mean to touch auth, revert this file.`,
    );
  }
}

// The invariants.
const middleware = read("functions/_middleware.js");
for (const [_name, fn] of Object.entries(DETECTORS)) {
  checks++;
  const problem = fn(middleware);
  if (problem) failures.push(`functions/_middleware.js — ${problem}`);
}
const store = read("curriculum/planning/planning-store.js");
for (const [_name, fn] of Object.entries(STORE_DETECTORS)) {
  checks++;
  const problem = fn(store);
  if (problem) failures.push(`curriculum/planning/planning-store.js — ${problem}`);
}
const pin = read("engine/core/teacher-mode.js");
for (const [_name, fn] of Object.entries(PIN_DETECTORS)) {
  checks++;
  const problem = fn(pin);
  if (problem) failures.push(`engine/core/teacher-mode.js — ${problem}`);
}

if (update) {
  writeFileSync(
    BASELINE,
    `${JSON.stringify({ ...baseline, files: nextFiles }, null, 2)}\n`,
    "utf8",
  );
  console.log(`auth-contract: re-pinned ${files.length} files to their current content.`);
  console.log("             Confirm `npm run e2e:auth` passed in BOTH engines before committing.");
}

if (failures.length) {
  console.error(`\nauth-contract: ${failures.length} problem(s) — authentication is FROZEN.\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error(
    `\n  The model is documented in ${CONTRACT}. Baseline: ${baseline.baselineCommit}.\n`,
  );
  process.exit(1);
}

console.log(
  `auth-contract: ${checks} checks passed (${selfTests} self-tests, ${files.length} files pinned at ${baseline.baselineCommit}).`,
);
