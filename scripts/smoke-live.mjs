#!/usr/bin/env node
/**
 * Post-deploy smoke test against PRODUCTION.
 *
 * Everything else in this repo verifies the source or the local `dist/`. The
 * recurring failure here is different: gates pass, the push succeeds, and
 * production is still broken — a truncated bundle (assets/game-fx.js shipped
 * mid-function and killed the FX kit across ~114 games), a service worker
 * serving stale HTML, a secret that only binds at deploy time, a search index
 * that returns zero results. None of those are visible before the deploy.
 *
 * So this fetches the live site and checks three things the build cannot:
 *   1. Critical pages return 200 and contain the marker that proves they
 *      rendered as themselves, not as a 404 or an empty shell.
 *   2. Critical JS assets parse. A truncated file is a 200 with valid bytes;
 *      only actually parsing it catches the failure that took down the games.
 *   3. The public build stamp reports the commit we expect to be live.
 *
 * Run:  npm run smoke:live                    # check whatever is live now
 *       npm run smoke:live -- --expect <sha>  # also assert the deployed commit
 *       npm run smoke:live -- --base http://localhost:4173
 */
import { execFileSync } from "node:child_process";
import { Script } from "node:vm";

const argv = process.argv.slice(2);
const arg = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);
const BASE = (arg("--base") || "https://eduwonderlab.com").replace(/\/$/, "");
const EXPECT_SHA = arg("--expect");
const TIMEOUT_MS = 20000;
// External services get their own, longer budget — and unlike before, a budget
// at all. Measured: the Apps Script insights endpoint answers in 5.5-10.2s.
const EXTERNAL_TIMEOUT_MS = 30000;

/** Pages whose failure a student or teacher would hit within the first minute. */
const PAGES = [
  { path: "/", marker: /<title|<body/i, name: "home portal" },
  { path: "/curriculum/", marker: /curriculum|lesson/i, name: "curriculum hub" },
  { path: "/lessons/1-1/", marker: /<title/i, name: "lesson 1-1 launcher" },
  { path: "/directory/", marker: /<title/i, name: "activity directory" },
  { path: "/access-practice-lab/", marker: /<title/i, name: "ACCESS practice lab" },
  // Teacher surfaces sit behind Basic Auth, so 401 is the healthy answer —
  // it proves the middleware is live. A 200 here would mean the gate is OFF.
  { path: "/teacher-tools/", marker: /<title/i, name: "teacher tools hub", authGated: true },
  { path: "/math/student-board/", marker: /<title/i, name: "class board" },
];

/**
 * Plain status-code contracts, including surfaces that must STAY gated.
 * Absorbed from the former tools/smoke-live-site.mjs, whose `/curriculum/ → 401`
 * assertion had been failing every scheduled run since the hub became public;
 * a permanently-red check is a check nobody reads, so the expectation is now
 * pinned to verified live behaviour (2026-07-28).
 */
const STATUS_CHECKS = [
  ["mailbox (public)", "/curriculum/student-digital-mailbox/", 200],
  ["mailbox CSS (public)", "/curriculum/student-digital-mailbox/mailbox.css", 200],
  ["mailbox links.js (public)", "/curriculum/student-digital-mailbox/mailbox-links.js", 200],
  ["mailbox teacher page (gated)", "/curriculum/student-digital-mailbox/teacher/", 401],
];

/** External dependency: the mailbox insights endpoint (Apps Script). */
const EXTERNAL_CHECKS = [
  [
    "insights endpoint",
    "https://script.google.com/macros/s/AKfycbxs4s0aA4LQCuIyrmdg6RIvv27eVm7PpbDrWR1SVmWsqvRVdfDWHEzFzaEpnorpPe7wrQ/exec",
    200,
  ],
];

/**
 * Shared bundles that are loaded by hundreds of pages. A syntax error in any of
 * these is silent in the browser console of a page nobody has open yet.
 */
const ASSETS = [
  "/assets/app.js",
  "/assets/game-fx.js",
  "/assets/shared.css",
  "/assets/curriculum-teacher-workflow.js",
  "/assets/ai-tutor.js",
  "/assets/adaptive-engine.js",
];

/**
 * Return a syntax-error message for JS source, or null if it parses.
 *
 * Classic scripts parse with vm.Script, but an ES module ("import"/"export" at
 * top level) is a SyntaxError there — checking only one way would report a
 * healthy module as a broken bundle. Try script form, then module form.
 */
function parseError(source, filename) {
  try {
    new Script(source, { filename });
    return null;
  } catch (scriptErr) {
    try {
      execFileSync(process.execPath, ["--check", "--input-type=module", "-"], {
        input: source,
        stdio: ["pipe", "ignore", "pipe"],
      });
      return null; // valid ES module
    } catch {
      return scriptErr.message;
    }
  }
}

/** Bytes for small files, KB for the rest — "0 KB" hides a truncated asset. */
const fmtSize = (n) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(0)} KB`);

const results = [];
const pass = (name, detail = "") => results.push({ ok: true, name, detail });
const failCheck = (name, detail) => results.push({ ok: false, name, detail });
// A degraded EXTERNAL dependency is not a reason to roll back this deploy —
// see EXTERNAL_CHECKS. Reported loudly, but never exits non-zero.
const warnCheck = (name, detail) => results.push({ ok: true, warn: true, name, detail });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * A blip is not a regression.
 *
 * Every check here used to be single-shot, so one slow edge response or 5xx
 * during the seconds after a promotion reported "PRODUCTION IS DEGRADED — roll
 * back", on a deploy that was fine. That fired twice on 2026-07-28 and both
 * times a re-run immediately passed 19/19. A verifier that cries wolf gets
 * ignored, and then it cannot do its actual job.
 *
 * Only TRANSPORT-level symptoms are retried: no response, a timeout, 5xx, or
 * 429. A response that arrived and was simply wrong — 200 where 401 was
 * required, a missing body marker, a syntax error — is a real finding and fails
 * on the first attempt. Retrying those would mask exactly the regressions this
 * script exists to catch.
 *
 * The build stamp is the one exception, and it is handled in checkStamp() rather
 * than here: a stale commit straight after a deploy is usually edge-propagation
 * lag, not a failed build, and the two are distinguished by whether it converges.
 * See the comment there.
 */
const RETRY_ATTEMPTS = 3;
const RETRY_BASE_MS = 1500;
const isTransient = (res) => res.status === 0 || res.status === 429 || res.status >= 500;

/**
 * Retries must never delay the ALARM.
 *
 * Retrying is right for a blip, but a genuinely down site does not refuse
 * connections — it hangs. Measured against a blackholed host, one check burns
 * ~36s exhausting its attempts, so 18 sequential checks would sit silent for
 * ~11 minutes before ship.sh reported anything. During a real outage that is
 * precisely backwards: the slower the report, the longer production stays
 * broken. Retries exist to suppress false alarms, not to postpone true ones.
 *
 * So the whole run carries a wall-clock budget. Once it is spent, checks still
 * RUN — coverage is never silently reduced — but they stop retrying, and the
 * report says so. Normal runs finish in ~10s and never reach it.
 */
const RETRY_BUDGET_MS = 90_000;
const startedAt = Date.now();
/**
 * The budget guards against retry THRASH delaying an alarm. checkStamp's settle
 * wait is not thrash — it is a deliberate, bounded wait that runs first, so
 * counting it would leave every later check retry-less exactly when the CDN is
 * still in flux. Discount it.
 */
let settleSpentMs = 0;
const budgetSpent = () => Date.now() - startedAt - settleSpentMs >= RETRY_BUDGET_MS;
let budgetExhausted = false;

async function get(path, { attempts = RETRY_ATTEMPTS, timeoutMs = TIMEOUT_MS } = {}) {
  const url = `${BASE}${path}`;
  let res;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    res = await getOnce(url, timeoutMs);
    if (!isTransient(res)) return { ...res, attempt };
    if (budgetSpent()) {
      // Enough of this run has been spent waiting that further retries only
      // delay the verdict. Fail fast from here on.
      budgetExhausted = true;
      return { ...res, attempt, exhausted: true, budgetHit: true };
    }
    if (attempt < attempts) await sleep(RETRY_BASE_MS * attempt);
  }
  return { ...res, attempt: attempts, exhausted: true };
}

async function getOnce(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Cache-bust so we test the origin's current output, not an edge copy.
    const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}smoke=${Date.now()}`, {
      signal: controller.signal,
      headers: { "cache-control": "no-cache" },
      redirect: "follow",
    });
    const body = await res.text();
    return { status: res.status, body, url };
  } catch (err) {
    return {
      status: 0,
      body: "",
      url,
      error: err.name === "AbortError" ? `timeout after ${timeoutMs}ms` : err.message,
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Note retries on an otherwise-passing check so flakiness stays visible. */
const retryNote = (res) => (res.attempt > 1 ? ` (after ${res.attempt} attempts)` : "");

async function checkPages() {
  for (const page of PAGES) {
    const res = await get(page.path);
    if (page.authGated) {
      if (res.status === 401) {
        pass(`page ${page.path}`, "401 — auth gate active" + retryNote(res));
        continue;
      }
      if (res.status === 200) {
        failCheck(
          `page ${page.path}`,
          "200 without auth — the Basic Auth gate is NOT protecting this surface",
        );
        continue;
      }
      failCheck(`page ${page.path}`, res.error || `HTTP ${res.status} (expected 401)`);
      continue;
    }
    if (res.status !== 200) {
      failCheck(`page ${page.path}`, res.error || `HTTP ${res.status}`);
      continue;
    }
    if (!page.marker.test(res.body)) {
      failCheck(
        `page ${page.path}`,
        `200 but body does not look like ${page.name} (${res.body.length} bytes)`,
      );
      continue;
    }
    // A page that renders its own error shell is a 200 too.
    if (/<title>\s*(404|not found|error)/i.test(res.body)) {
      failCheck(`page ${page.path}`, "served an error page with HTTP 200");
      continue;
    }
    pass(`page ${page.path}`, fmtSize(res.body.length) + retryNote(res));
  }
}

async function checkAssets() {
  for (const path of ASSETS) {
    const res = await get(path);
    if (res.status !== 200) {
      failCheck(`asset ${path}`, res.error || `HTTP ${res.status}`);
      continue;
    }
    if (res.body.length === 0) {
      failCheck(`asset ${path}`, "empty response");
      continue;
    }
    // HTML served for a missing asset is the classic silent 200.
    if (/^\s*<!doctype html/i.test(res.body)) {
      failCheck(`asset ${path}`, "served HTML instead of the asset (missing from dist?)");
      continue;
    }
    if (path.endsWith(".js")) {
      const err = parseError(res.body, path);
      if (err) {
        failCheck(`asset ${path}`, `LIVE FILE DOES NOT PARSE — ${err}`);
        continue;
      }
    }
    pass(`asset ${path}`, `${fmtSize(res.body.length)} parses${retryNote(res)}`);
  }
}

/**
 * Cloudflare promotes a Pages build across edge nodes over some seconds, so
 * right after a deploy one node can serve the new commit while another still
 * serves the old one. ship.sh's poll_stamp confirms on whichever node answers
 * it, then hands off to this script — which may hit a node that has not caught
 * up yet. Failing on that first read is how ship.sh twice reported
 * "PRODUCTION IS DEGRADED" (and advised a rollback) over a perfectly healthy
 * deploy on 2026-07-29.
 *
 * A stale stamp is therefore not automatically a finding — but it is not
 * automatically fine either. The two cases are told apart by whether they
 * CONVERGE: propagation lag resolves in seconds, a stuck or failed build never
 * does. So re-poll for a bounded window and only then fail. This does not mask
 * the regression the fail-fast rule was protecting: a build that genuinely did
 * not promote still fails, just ~STAMP_SETTLE_MS later.
 *
 * Only applies with --expect (i.e. straight after a deploy). Without it there
 * is nothing to converge ON, and the check just reports what is live.
 */
const STAMP_SETTLE_MS = 120_000;
const STAMP_SETTLE_INTERVAL_MS = 10_000;

async function readStamp() {
  const res = await get("/access-practice-lab/config.json");
  if (res.status !== 200) return { error: res.error || `HTTP ${res.status}` };
  try {
    const commit = String(JSON.parse(res.body).commit || "");
    return commit ? { commit } : { error: "config.json has no commit field" };
  } catch {
    return { error: "config.json is not valid JSON" };
  }
}

async function checkStamp() {
  const matches = (live) => live.startsWith(EXPECT_SHA) || EXPECT_SHA.startsWith(live);

  let first = await readStamp();
  if (first.error) return failCheck("build stamp", first.error);
  if (!EXPECT_SHA) return pass("build stamp", `serving ${first.commit.slice(0, 9)}`);
  if (matches(first.commit))
    return pass("build stamp", `serving ${first.commit.slice(0, 9)} as expected`);

  // Stale on first read — wait for the promotion to finish propagating.
  const settleStart = Date.now();
  const deadline = settleStart + STAMP_SETTLE_MS;
  let latest = first;
  try {
    while (Date.now() < deadline) {
      await sleep(STAMP_SETTLE_INTERVAL_MS);
      latest = await readStamp();
      if (latest.error) continue;
      if (matches(latest.commit)) {
        const waited = Math.round((Date.now() - settleStart) / 1000);
        return pass(
          "build stamp",
          `serving ${latest.commit.slice(0, 9)} as expected (converged after ${waited}s)`,
        );
      }
    }
  } finally {
    settleSpentMs += Date.now() - settleStart;
  }
  return failCheck(
    "build stamp",
    `production still serves ${(latest.commit || first.commit).slice(0, 9)}, expected ` +
      `${EXPECT_SHA.slice(0, 9)} after ${STAMP_SETTLE_MS / 1000}s — the build did not promote`,
  );
}

async function checkStatuses() {
  for (const [label, target, want] of STATUS_CHECKS) {
    const res = await get(target);
    if (res.status === want) pass(`status ${label}`, `${res.status}${retryNote(res)}`);
    else failCheck(`status ${label}`, res.error || `got ${res.status}, expected ${want}`);
  }
}

/**
 * Third-party dependencies, reported as WARNINGS.
 *
 * These say nothing about whether THIS deploy is good. The insights endpoint is
 * Google Apps Script, measured at 5.5–10.2s per call with 2x variance — by far
 * the slowest check here, and it previously ran through a bare `fetch()` with NO
 * timeout at all, so a hung Google request could stall the whole verification
 * indefinitely. Letting it fail the gate told you to roll back a healthy site
 * because someone else's service was slow, which is both wrong and the kind of
 * false alarm that trains people to ignore the gate.
 */
async function checkExternals() {
  for (const [label, target, want] of EXTERNAL_CHECKS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), EXTERNAL_TIMEOUT_MS);
    let status = 0;
    let error = null;
    try {
      status = (await fetch(target, { redirect: "follow", signal: controller.signal })).status;
    } catch (err) {
      error = err.name === "AbortError" ? `no response in ${EXTERNAL_TIMEOUT_MS}ms` : err.message;
    } finally {
      clearTimeout(timer);
    }
    if (status === want) pass(`external ${label}`, `${status}`);
    else
      warnCheck(
        `external ${label}`,
        `${error || `got ${status}, expected ${want}`} — third-party, does NOT block this deploy`,
      );
  }
}

console.log(`Smoke-testing ${BASE}${EXPECT_SHA ? ` (expecting ${EXPECT_SHA.slice(0, 9)})` : ""}\n`);
await checkStamp();
await checkPages();
await checkAssets();
await checkStatuses();
await checkExternals();

for (const r of results) {
  const icon = r.warn ? "!" : r.ok ? "✓" : "✗";
  console.log(`  ${icon} ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
}

const failed = results.filter((r) => !r.ok);
const warned = results.filter((r) => r.warn);
console.log(
  `\n${results.length - failed.length}/${results.length} checks passed${warned.length ? ` (${warned.length} warning(s))` : ""}`,
);

// Repeat failures AFTER the summary. They used to print only in the middle of
// the list, so `... | tail` showed the rollback advice without ever showing
// which check failed — which is why two flaky ships could not be diagnosed
// from their own output.
if (warned.length) {
  console.log("\n! Warnings (third-party; not caused by this deploy):");
  for (const w of warned) console.log(`    ${w.name} — ${w.detail}`);
}
if (budgetExhausted) {
  console.error(
    `\n! Retry budget (${RETRY_BUDGET_MS / 1000}s) spent — later checks ran WITHOUT retries, so some\n` +
      "  failures below may be transient. Every check still ran; none were skipped.",
  );
}
if (failed.length) {
  console.error("\n✗ Failed checks:");
  for (const f of failed) console.error(`    ${f.name} — ${f.detail}`);
  console.error(`\n✗ PRODUCTION IS DEGRADED — ${failed.length} check(s) failed.`);
  console.error("  Roll back by shipping the last known-good commit:");
  console.error("      ALLOW_DEPLOY=1 npm run ship -- <last-good-sha>");
  console.error("  Or, if the build itself is stuck rather than wrong:");
  console.error("      ALLOW_DEPLOY=1 npm run ship:rebuild");
  process.exit(1);
}
console.log("✓ Production looks healthy.");
