#!/usr/bin/env node
/**
 * Baseline contract for /api endpoints.
 *
 * An audit of the 20 route files found the guards applied unevenly: 6 rate
 * limit, several have no try/catch at all, and each of the 6 limiters is a
 * separate hand-rolled copy of the same sliding window. The fix is
 * functions/_lib/http.js — but rewriting 20 live endpoints at once is not a
 * safe change, so this test does two things instead:
 *
 *   1. New endpoints must use the shared handler. Anything not on the LEGACY
 *      list below has to import functions/_lib/http.js.
 *   2. The LEGACY list may only shrink. It is a migration queue, not an
 *      exemption — each entry is a route still carrying its own plumbing.
 *
 * Every legacy route is additionally held to the floor it already meets, so a
 * rewrite cannot quietly drop protection it has today: if it parses a JSON
 * body, it must have a try/catch.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Routes that predate functions/_lib/http.js. Remove an entry when you migrate
 * it; never add one.
 */
const LEGACY = new Set([
  "functions/api/board/[[path]].js",
  "functions/api/class-boss.js",
  "functions/api/class-pulse.js",
  "functions/api/curriculum/content.js",
  "functions/api/family-broadcast.js",
  "functions/api/family-connections/[[path]].js",
  "functions/api/family-connections/canvas-direct.js",
  "functions/api/family-connections/domain.js",
  "functions/api/family-connections/meeting-notification.js",
  "functions/api/family-connections/scheduler-d1.js",
  "functions/api/family-connections/scheduler-rules.js",
  "functions/api/family-connections/scheduler.js",
  "functions/api/forge.js",
  "functions/api/google/calendar.js",
  "functions/api/google/callback.js",
  "functions/api/google/classroom.js",
  "functions/api/google/daily-sync.js",
  "functions/api/google/login.js",
  "functions/api/google/logout.js",
  "functions/api/google/status.js",
  "functions/api/grade/[[path]].js",
  "functions/api/manip-room/[[path]].js",
  "functions/api/misconception-heatmap.js",
  "functions/api/monster-save/[[path]].js",
  "functions/api/progress/[[path]].js",
  "functions/api/reasoning/[[path]].js",
  "functions/api/roster/[[path]].js",
  "functions/api/scores/[[path]].js",
  "functions/api/scorm.js",
  "functions/api/screener-assist/[[path]].js",
  "functions/api/settings/warmup.js",
  "functions/api/sg-room/[[path]].js",
  "functions/api/showcase.js",
  "functions/api/signal/[[path]].js",
  "functions/api/study-pack/[[path]].js",
  "functions/api/supports/[[path]].js",
  "functions/api/teach-machine.js",
  "functions/api/tutor/[[path]].js",
]);

const routes = execFileSync("git", ["ls-files", "functions/api"], { cwd: ROOT, encoding: "utf8" })
  .split("\n")
  .filter((f) => f.endsWith(".js") && !f.includes(".test."));

let failures = 0;
const fail = (m) => {
  failures++;
  console.error(`   ✗ ${m}`);
};

console.log("/api endpoint contract");

for (const route of routes) {
  const src = readFileSync(resolve(ROOT, route), "utf8");
  const usesShared = /from ["'][^"']*_lib\/http\.js["']/.test(src);

  if (!usesShared && !LEGACY.has(route)) {
    fail(
      `${route} is a new endpoint and must use the shared handler:\n` +
        `       import { handler } from "../_lib/http.js";\n` +
        `       export const onRequest = handler({ methods: [...], handle: async (ctx) => ({...}) });`,
    );
    continue;
  }

  if (usesShared && LEGACY.has(route)) {
    fail(`${route} now uses the shared handler — remove it from LEGACY in ${"functions/api-contract.test.mjs"}`);
    continue;
  }

  if (!usesShared) {
    // Floor for un-migrated routes: anything that parses a body must handle a
    // throw, or a malformed request becomes an HTML 500 for a JSON caller.
    const parsesBody = /await\s+(request|req)\.json\(\)/.test(src);
    if (parsesBody && !/\bcatch\b/.test(src)) {
      fail(`${route} parses a JSON body but has no try/catch — a bad body returns an HTML 500`);
    }
  }
}

// Routes deleted from disk must be dropped from the queue, so the count stays honest.
for (const route of LEGACY) {
  if (!routes.includes(route)) {
    fail(`${route} is listed in LEGACY but no longer exists — remove the entry`);
  }
}

if (failures) {
  console.error(`\n✗ /api contract: ${failures} failure(s)`);
  process.exit(1);
}
const migrated = routes.length - LEGACY.size;
console.log(
  `   ✓ ${routes.length} routes: ${migrated} on the shared handler, ${LEGACY.size} queued for migration`,
);
