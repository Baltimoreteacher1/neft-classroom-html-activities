#!/usr/bin/env node
/**
 * validate-route-contract.mjs — a URL may not quietly change what it answers.
 *
 * WHY THIS EXISTS. On 2026-08-25 `/curriculum/` was changed from a public 200
 * into a 302 that sent anonymous visitors to `/curriculum/units/`. The change
 * was correct by every measure the repo had: `qa:loop` 99/99, `e2e:auth` 32/32
 * in both engines, `smoke:live` 34/34. Production did exactly what the design
 * said. It was reverted within the hour, because `/curriculum/` is the URL Joel
 * types every day, and every one of those gates was asking "does this behave as
 * specified?" while nobody had asked "should this URL's answer change at all?"
 *
 * Those are different questions and only the second one had an answer that
 * mattered. A bookmark is an interface. Changing what a URL returns is an
 * outward-facing change to somebody's workflow, and it must be a deliberate act
 * with a name on it — not a side effect of a middleware edit that passes review.
 *
 * SO THIS GATE PINS THE ANSWER, NOT THE IMPLEMENTATION. For every route in
 * data/public-route-contract.json it calls the REAL `onRequest` with no
 * credentials and asserts the anonymous status, and the redirect target when
 * there is one. Any drift fails the build until the baseline is re-pinned on
 * purpose with `--update` — the same deliberately-annoying shape as
 * validate:auth-contract's content pin, and for the same reason.
 *
 * WHAT IT IS NOT. It does not say a route may never change. It says a human has
 * to decide that it should, and `--update` is where they say so. Re-pinning a
 * student-facing route to a redirect or a 401 is exactly the kind of change to
 * run past Joel first; the gate's job is to make sure that conversation happens
 * before a class does.
 *
 * Self-tests its detectors before running them, because a gate that has quietly
 * stopped comparing reports a perfectly stable site.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { onRequest } from "../functions/_middleware.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT = join(ROOT, "data/public-route-contract.json");
const HOST = "https://eduwonderlab.com";

/**
 * A throwaway password. The point is to exercise the CONFIGURED gate: with
 * SITE_PASSWORD unset every teacher surface 503s, and a contract measured in
 * that state would pin the fail-closed path instead of the real one.
 */
const PASSWORD = "route-contract-probe-not-a-real-secret";

/** Ask the middleware what an anonymous visitor gets. */
async function probe(path) {
  const response = await onRequest({
    request: new Request(`${HOST}${path}`),
    env: { SITE_PASSWORD: PASSWORD, TEACHER_KEY: `${PASSWORD}-api` },
    next: async () => new Response("<html><body>page</body></html>", { status: 200 }),
    data: {},
  });
  const status = response.status;
  const location = response.headers.get("location");
  const result = { status };
  if (location) {
    // Store the path, not the absolute URL: the contract must not go stale if
    // the canonical host ever changes, and a same-origin redirect is the only
    // kind any of these routes should ever issue.
    result.redirectsTo = location.startsWith(HOST) ? location.slice(HOST.length) : location;
  }
  return result;
}

/** A one-line English description of what a route answers, for the failure text. */
function describe(entry) {
  if (!entry) return "(not in the contract)";
  if (entry.redirectsTo) return `${entry.status} → ${entry.redirectsTo}`;
  return String(entry.status);
}

function sameAnswer(a, b) {
  return a.status === b.status && (a.redirectsTo || null) === (b.redirectsTo || null);
}

/* ── Self-test: prove the comparison still detects the failure it exists for ── */

function selfTest() {
  const cases = [
    // The exact drift that caused the incident.
    [{ status: 200 }, { status: 302, redirectsTo: "/curriculum/units/" }, true],
    // A student route quietly becoming gated.
    [{ status: 200 }, { status: 401 }, true],
    // A gated route quietly becoming public — the dangerous direction.
    [{ status: 401 }, { status: 200 }, true],
    // Same status, different destination: still a changed answer.
    [{ status: 302, redirectsTo: "/a/" }, { status: 302, redirectsTo: "/b/" }, true],
    // No change must not fire.
    [{ status: 200 }, { status: 200 }, false],
    [{ status: 302, redirectsTo: "/a/" }, { status: 302, redirectsTo: "/a/" }, false],
  ];
  for (const [before, after, shouldFire] of cases) {
    if (sameAnswer(before, after) === shouldFire) {
      throw new Error(
        `self-test: comparing ${describe(before)} with ${describe(after)} ` +
          `${shouldFire ? "did not fire" : "fired when it should not have"}`,
      );
    }
  }
  return cases.length;
}

/* ── Run ─────────────────────────────────────────────────────────────────── */

const update = process.argv.includes("--update");
const selfTests = selfTest();

const contract = JSON.parse(readFileSync(CONTRACT, "utf8"));
const failures = [];
const next = {};

for (const [path, expected] of Object.entries(contract.routes)) {
  const actual = await probe(path);
  next[path] = actual;
  if (sameAnswer(expected, actual)) continue;
  failures.push(
    `${path}\n` +
      `      was:  ${describe(expected)}\n` +
      `      now:  ${describe(actual)}\n` +
      `      ${expected.why || ""}`,
  );
}

if (update) {
  writeFileSync(
    CONTRACT,
    `${JSON.stringify({ ...contract, routes: mergeWhy(contract, next) }, null, 2)}\n`,
  );
  console.log(
    `route-contract: re-pinned ${Object.keys(next).length} routes to their current answers.`,
  );
  console.log(
    "             A student-facing route that changed needs Joel's agreement, not just a re-pin.",
  );
}

/** Keep each route's written reason when re-pinning; the status is what moves. */
function mergeWhy(previous, fresh) {
  const merged = {};
  for (const [path, answer] of Object.entries(fresh)) {
    const why = previous.routes[path]?.why;
    merged[path] = why ? { ...answer, why } : answer;
  }
  return merged;
}

if (failures.length && !update) {
  console.error(`\nroute-contract: ${failures.length} route(s) changed what they answer.\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error(
    "\n  A URL's answer is an interface. Someone has a bookmark, a Canvas link, or a\n" +
      "  SCORM package pointing at it. If this change is intended, say so on purpose:\n" +
      "    node tools/validate-route-contract.mjs --update\n" +
      "  and if the route is student- or teacher-facing, agree it with Joel FIRST —\n" +
      "  every automated gate passed on the change this file was written for.\n",
  );
  process.exit(1);
}

console.log(
  `route-contract: ${Object.keys(contract.routes).length} routes answer as pinned ` +
    `(${selfTests} self-tests).`,
);
