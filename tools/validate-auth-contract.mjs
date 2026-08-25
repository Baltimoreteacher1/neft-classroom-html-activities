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

  // This detector used to read `/Set-Cookie|nt_teacher|teacher-auth/` and ban
  // cookies outright. That was the right ban for the thing it was written
  // against — a session system that REPLACED Basic Auth with a login page and
  // per-teacher key slots — but it also banned the harmless half: a receipt
  // issued AFTER the password check that only saves the teacher from retyping
  // it. The ban is now on the shape that actually failed, not on the word
  // "cookie". See AUTH_CONTRACT §2a.
  "no sign-in page or teacher-auth endpoint has returned": (src) =>
    /teacher-auth|teacher-login/i.test(src)
      ? "a teacher-auth endpoint or /teacher-login/ page is back in the middleware — that is the architecture that was rolled back (AUTH_CONTRACT header)"
      : null,

  "the password check is still the ONLY thing that grants access": (src) => {
    const mints = src.match(/mintSessionCookie\s*\(/g) || [];
    if (mints.length === 0) return null; // no receipt at all is also fine
    if (mints.length > 1) {
      return "mintSessionCookie() is called from more than one place; a receipt may only be issued where SITE_PASSWORD was just verified (AUTH_CONTRACT §2a)";
    }
    const verified = src.indexOf("supplied === password");
    const minted = src.indexOf("mintSessionCookie(");
    if (verified < 0) {
      return "the SITE_PASSWORD comparison is gone from the middleware (AUTH_CONTRACT §2)";
    }
    return minted > verified
      ? null
      : "a session receipt is issued before SITE_PASSWORD is verified, which makes the cookie a credential in its own right (AUTH_CONTRACT §2a)";
  },

  "no per-browser branching has returned": (src) =>
    /Sec-Fetch-Mode|sec-fetch-mode/i.test(src)
      ? "the middleware branches on Sec-Fetch-Mode again; Chromium and WebKit must see ONE flow (AUTH_CONTRACT §7)"
      : null,
};

/**
 * The receipt is a receipt, not a second credential: it must be signed with
 * SITE_PASSWORD itself, so rotating the password revokes every outstanding one
 * and there is no second secret anybody has to remember to set.
 */
const SESSION_DETECTORS = {
  "the receipt reads no environment binding of its own": (src) =>
    /\benv\b/.test(stripComments(src))
      ? "the session module reads an environment binding; its key must be SITE_PASSWORD, passed in, so rotation revokes every receipt (AUTH_CONTRACT §2a)"
      : null,

  "the receipt is signed, not merely encoded": (src) =>
    /crypto\.subtle\.sign/.test(src) && /HMAC/.test(src)
      ? null
      : "the session token is no longer HMAC-signed; an unsigned token is a password anyone can write (AUTH_CONTRACT §2a)",

  "the receipt expires": (src) =>
    /SESSION_TTL_MS\s*=\s*24 \* 60 \* 60 \* 1000/.test(src) && /expiresAt <= now/.test(src)
      ? null
      : "the 24-hour expiry is gone; a receipt that never expires is a permanent bypass of the password (AUTH_CONTRACT §2a)",

  "the receipt cookie is not readable by page scripts": (src) =>
    /HttpOnly/.test(src) && /Secure/.test(src) && /SameSite=Lax/.test(src)
      ? null
      : "the receipt cookie lost HttpOnly/Secure/SameSite=Lax (AUTH_CONTRACT §2a)",
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
    [
      "no sign-in page or teacher-auth endpoint has returned",
      `${good}\nif (p === "/api/teacher-auth/login") return login(request);`,
    ],
    [
      "the password check is still the ONLY thing that grants access",
      // The failure that matters: a receipt handed out before, or instead of,
      // the password comparison.
      good.replace(
        'const header = request.headers.get("Authorization") || "";',
        'const c = await mintSessionCookie(password);\nconst header = request.headers.get("Authorization") || "";',
      ),
    ],
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
  const session = read("functions/_lib/teacher-session.js");
  const sessionCases = [
    ["the receipt reads no environment binding of its own", `${session}\nconst k = env.OTHER_KEY;`],
    [
      "the receipt is signed, not merely encoded",
      session.replace(/crypto\.subtle\.sign/g, "fakeSign"),
    ],
    ["the receipt expires", session.replace(/expiresAt <= now/, "false")],
    ["the receipt cookie is not readable by page scripts", session.replace(/HttpOnly/g, "")],
  ];
  for (const [name, mutated] of sessionCases) {
    if (SESSION_DETECTORS[name](mutated) === null) {
      throw new Error(`self-test: detector "${name}" did not fire on a mutated source`);
    }
  }
  for (const [name, fn] of Object.entries(SESSION_DETECTORS)) {
    if (fn(session) !== null) {
      throw new Error(`self-test: detector "${name}" fires on the CURRENT source: ${fn(session)}`);
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
  return cases.length + sessionCases.length + 2;
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
const sessionSrc = read("functions/_lib/teacher-session.js");
for (const [_name, fn] of Object.entries(SESSION_DETECTORS)) {
  checks++;
  const problem = fn(sessionSrc);
  if (problem) failures.push(`functions/_lib/teacher-session.js — ${problem}`);
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
