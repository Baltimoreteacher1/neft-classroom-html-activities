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
  ["insights endpoint", "https://script.google.com/macros/s/AKfycbxs4s0aA4LQCuIyrmdg6RIvv27eVm7PpbDrWR1SVmWsqvRVdfDWHEzFzaEpnorpPe7wrQ/exec", 200],
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

async function get(path) {
  const url = `${BASE}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
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
    return { status: 0, body: "", url, error: err.name === "AbortError" ? `timeout after ${TIMEOUT_MS}ms` : err.message };
  } finally {
    clearTimeout(timer);
  }
}

async function checkPages() {
  for (const page of PAGES) {
    const res = await get(page.path);
    if (page.authGated) {
      if (res.status === 401) { pass(`page ${page.path}`, "401 — auth gate active"); continue; }
      if (res.status === 200) { failCheck(`page ${page.path}`, "200 without auth — the Basic Auth gate is NOT protecting this surface"); continue; }
      failCheck(`page ${page.path}`, res.error || `HTTP ${res.status} (expected 401)`);
      continue;
    }
    if (res.status !== 200) {
      failCheck(`page ${page.path}`, res.error || `HTTP ${res.status}`);
      continue;
    }
    if (!page.marker.test(res.body)) {
      failCheck(`page ${page.path}`, `200 but body does not look like ${page.name} (${res.body.length} bytes)`);
      continue;
    }
    // A page that renders its own error shell is a 200 too.
    if (/<title>\s*(404|not found|error)/i.test(res.body)) {
      failCheck(`page ${page.path}`, "served an error page with HTTP 200");
      continue;
    }
    pass(`page ${page.path}`, fmtSize(res.body.length));
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
    pass(`asset ${path}`, `${fmtSize(res.body.length)} parses`);
  }
}

async function checkStamp() {
  const res = await get("/access-practice-lab/config.json");
  if (res.status !== 200) return failCheck("build stamp", res.error || `HTTP ${res.status}`);
  let stamp;
  try {
    stamp = JSON.parse(res.body);
  } catch {
    return failCheck("build stamp", "config.json is not valid JSON");
  }
  const live = String(stamp.commit || "");
  if (!live) return failCheck("build stamp", "config.json has no commit field");
  if (EXPECT_SHA) {
    const match = live.startsWith(EXPECT_SHA) || EXPECT_SHA.startsWith(live);
    if (!match) return failCheck("build stamp", `production serves ${live.slice(0, 9)}, expected ${EXPECT_SHA.slice(0, 9)}`);
    return pass("build stamp", `serving ${live.slice(0, 9)} as expected`);
  }
  pass("build stamp", `serving ${live.slice(0, 9)}`);
}

async function checkStatuses() {
  for (const [label, target, want] of [...STATUS_CHECKS, ...EXTERNAL_CHECKS]) {
    const isAbsolute = /^https?:\/\//.test(target);
    let status;
    if (isAbsolute) {
      try {
        status = (await fetch(target, { redirect: "follow" })).status;
      } catch (err) {
        failCheck(`status ${label}`, err.message);
        continue;
      }
    } else {
      status = (await get(target)).status;
    }
    if (status === want) pass(`status ${label}`, `${status}`);
    else failCheck(`status ${label}`, `got ${status}, expected ${want}`);
  }
}

console.log(`Smoke-testing ${BASE}${EXPECT_SHA ? ` (expecting ${EXPECT_SHA.slice(0, 9)})` : ""}\n`);
await checkStamp();
await checkPages();
await checkAssets();
await checkStatuses();

for (const r of results) console.log(`  ${r.ok ? "✓" : "✗"} ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.error(`\n✗ PRODUCTION IS DEGRADED — ${failed.length} check(s) failed.`);
  console.error("  Roll back by shipping the last known-good commit:");
  console.error("      ALLOW_DEPLOY=1 npm run ship -- <last-good-sha>");
  console.error("  Or, if the build itself is stuck rather than wrong:");
  console.error("      ALLOW_DEPLOY=1 npm run ship:rebuild");
  process.exit(1);
}
console.log("✓ Production looks healthy.");
