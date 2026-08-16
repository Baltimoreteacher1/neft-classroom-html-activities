#!/usr/bin/env node
/**
 * validate:teacher-credentials — the teacher key must never reach a browser.
 *
 * WHAT THIS GATE EXISTS FOR. The platform had a credential in browser storage
 * (`neft.teacher.key` in localStorage, written by the planner's inline key form)
 * and a *different* credential hardcoded in shipped JavaScript (the Teacher Mode
 * PIN). Neither fact was visible from any single file: the planner's key form was
 * correct code, the PIN constant was correct code, and the only wrong thing was
 * the relationship between them and the server.
 *
 * A grep cannot know a secret's value — and MUST NOT, since a gate that greps for
 * the credential would have to contain it. So this checks the *shapes* that let a
 * credential escape, all of which have actually occurred here:
 *
 *   1. a shipped client file naming a server-only secret binding
 *   2. a shipped client file persisting a teacher key to web storage
 *   3. the planner sending a raw key header from the browser
 *   4. the sign-in page keeping the key after using it
 *   5. a teacher key travelling in a URL from client code
 *
 * Detectors are self-tested against known-bad fixtures first, because a gate that
 * silently stops firing reports a clean tree — which is how this class of defect
 * survived in the first place.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const failures = [];
const note = (m) => failures.push(m);

/* ── Detectors ─────────────────────────────────────────────────────────────── */

/** Server-only bindings must not be named in code the browser downloads. */
const SERVER_BINDING = /\bTEACHER_KEY_NEFT\b|\bTEACHER_KEY_ALBA\b|\bTEACHER_SESSION_SECRET\b/;

/** Writing any teacher key into web storage. The read side is allowed — the
 *  planner still CLEARS the legacy value, and clearing is the fix, not the bug. */
const PERSISTS_KEY =
  /(localStorage|sessionStorage)\s*\.\s*setItem\s*\(\s*["'][^"']*teacher[^"']*key[^"']*["']/i;

/** A raw key header sent from client code. Tooling may do this; a page may not. */
const SENDS_KEY_HEADER = /["']x-teacher-key["']\s*:/i;

/** A teacher key in a URL, from client code. */
const KEY_IN_URL = /[?&]key=\$\{|searchParams\.set\(\s*["']key["']/;

const DETECTORS = [
  ["names a server-only secret binding", SERVER_BINDING],
  ["persists a teacher key to web storage", PERSISTS_KEY],
  ["sends a raw x-teacher-key header from the browser", SENDS_KEY_HEADER],
  ["puts a teacher key in a URL", KEY_IN_URL],
];

/* ── Self-test: every detector must fire on a known-bad line ───────────────── */

const FIXTURES = [
  ["const k = env.TEACHER_KEY_NEFT;", SERVER_BINDING, true],
  ["const k = env.TEACHER_KEY;", SERVER_BINDING, false],
  ['localStorage.setItem("neft.teacher.key", k);', PERSISTS_KEY, true],
  ['localStorage.removeItem("neft.teacher.key");', PERSISTS_KEY, false],
  ['localStorage.setItem("nt-teacher-mode", "1");', PERSISTS_KEY, false],
  ['headers: { "x-teacher-key": key }', SENDS_KEY_HEADER, true],
  ['headers: { "Content-Type": "application/json" }', SENDS_KEY_HEADER, false],
  ["fetch(`/api/pacing/state?key=${key}`)", KEY_IN_URL, true],
  ['url.searchParams.set("key", key)', KEY_IN_URL, true],
  ['url.searchParams.get("key")', KEY_IN_URL, false],
];
for (const [line, re, shouldMatch] of FIXTURES) {
  if (re.test(line) !== shouldMatch) {
    note(`self-test: detector ${re} ${shouldMatch ? "missed" : "false-fired on"}: ${line}`);
  }
}

/* ── Sweep the client surface ──────────────────────────────────────────────── */

// Everything the browser downloads. functions/ is the server and is exempt by
// definition; tools/ and scripts/ are node-side and legitimately hold raw keys
// from the environment; docs/ and tests describe rather than ship.
const CLIENT_DIRS = ["assets", "engine", "shared", "curriculum", "teacher-login", "math"];
const EXEMPT = /^(functions|tools|scripts|docs|tests|node_modules|dist)\//;

function trackedFiles() {
  const out = execFileSync("git", ["ls-files", ...CLIENT_DIRS], { encoding: "utf8" });
  return out
    .split("\n")
    .filter(Boolean)
    .filter((p) => /\.(js|mjs|html)$/.test(p))
    .filter((p) => !EXEMPT.test(p))
    .filter((p) => !/\.test\.(m?js)$/.test(p));
}

/**
 * THE RATCHET.
 *
 * Nine teacher surfaces predate the unified session and still read a key out of
 * `neft.teacher.key` and send it as `x-teacher-key`. They are not broken — the
 * server now authorizes them by session cookie before it ever looks at that
 * header, so they work the moment a teacher signs in, and their key box is
 * simply dead weight. But a credential held in the browser is exactly the
 * exposure this gate exists to remove, so each one is listed BY NAME and the
 * list may only shrink.
 *
 * Removing one is the unit of work: delete its key field and its storage read,
 * let the cookie carry the request, delete its line below. A new file cannot be
 * added — an unlisted offender fails outright.
 */
const MIGRATION_DEBT = new Set([
  "assets/curriculum-live-signal.js",
  "assets/learning-supports/learning-supports.js",
  "curriculum/forge/forge.js",
  "curriculum/map/signal.js",
  "curriculum/plan-notes/plan-notes.js",
  "curriculum/plan-notes/plan-store.js",
  "curriculum/showcase/showcase.js",
  "engine/core/lesson-renderer.js",
  "math/student-board/index.html",
]);

const stillOwing = new Set();

for (const file of trackedFiles()) {
  let source;
  try {
    source = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  for (const [label, re] of DETECTORS) {
    if (!re.test(source)) continue;
    // The server-binding detector is never excusable: naming TEACHER_KEY_NEFT in
    // a shipped file leaks the configuration, not a legacy pattern.
    if (re !== SERVER_BINDING && MIGRATION_DEBT.has(file)) {
      stillOwing.add(file);
      continue;
    }
    note(`${file} ${label}`);
  }
}

for (const file of MIGRATION_DEBT) {
  if (!stillOwing.has(file)) {
    note(
      `${file} no longer holds a browser-side teacher key — remove it from MIGRATION_DEBT in this file`,
    );
  }
}

/* ── Positive invariants on the two files that define the model ────────────── */

const login = readFileSync("teacher-login/index.html", "utf8");
if (!login.includes("/api/teacher-auth/login")) {
  note("teacher-login: does not post to /api/teacher-auth/login");
}
if (!/input\.value = ""/.test(login)) {
  note("teacher-login: does not clear the key field after a successful sign-in");
}

const store = readFileSync("curriculum/planning/planning-store.js", "utf8");
if (!store.includes('credentials: "same-origin"')) {
  note("planning-store: pacing requests do not send the session cookie");
}
if (!store.includes("forgetLegacyKey")) {
  note("planning-store: no longer clears the legacy localStorage teacher key");
}

const middleware = readFileSync("functions/_middleware.js", "utf8");
if (!middleware.includes("resolveTeacherSession")) {
  note(
    "middleware: the teacher session is not verified, so the page gate and the API gate are split again",
  );
}

/* ── Report ────────────────────────────────────────────────────────────────── */

if (failures.length) {
  console.error("✗ validate:teacher-credentials");
  for (const f of failures) console.error(`   - ${f}`);
  process.exit(1);
}
console.log(
  `✓ teacher credentials stay server-side (${trackedFiles().length} client files, ${DETECTORS.length} detectors, ${FIXTURES.length} self-tests).`,
);
