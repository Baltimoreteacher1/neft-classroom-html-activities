#!/usr/bin/env node
/* ==========================================================================
 * participation.test.mjs — the participation equity tracker.
 *
 * Two things are asserted, and the first one is the whole reason this tool is a
 * local page rather than a dashboard.
 *
 *  1. THE TALLY NEVER LEAVES THE DEVICE. A per-student record of who spoke in
 *     class, sitting on a server, is a fundamentally different artifact from a
 *     teacher's own notes — and one that a classroom does not need. The roster
 *     is allowed to come DOWN; nothing about participation may go UP. There is
 *     deliberately no endpoint to write it to, and this test is what keeps it
 *     that way when someone later thinks "it would be handy to sync this".
 *
 *  2. THE RANDOM PICKER IS ACTUALLY EQUITABLE. A uniform pick over the whole
 *     class re-creates precisely the distribution the tool exists to correct,
 *     while looking fair. The pool must be restricted to the least-heard-from
 *     tier, and that is a property no amount of clicking would reveal.
 * ========================================================================== */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(
  new URL("../teacher-tools/participation/index.html", import.meta.url),
  "utf8",
);

let checks = 0;

// ── 1. Nothing about participation is transmitted ──────────────────────────
{
  const fetches = page.match(/fetch\(\s*["'`][^"'`]+/g) || [];
  checks += 1;
  assert.equal(fetches.length, 1, "the page makes exactly one network call");
  checks += 1;
  assert.ok(
    fetches[0].includes("/api/roster/get"),
    "and it is the read-only roster fetch — the roster comes down, nothing goes up",
  );

  checks += 1;
  assert.equal(
    /method:\s*["']POST/i.test(page),
    false,
    "the tracker must never POST — a per-student speech record on a server is not what a classroom needs",
  );
  checks += 1;
  assert.equal(/method:\s*["']PUT/i.test(page), false, "nor PUT");
  checks += 1;
  assert.equal(/sendBeacon/i.test(page), false, "nor beacon it out on unload");

  checks += 1;
  assert.ok(
    /no participation data is ever\s*\n?\s*sent anywhere/i.test(page.replace(/\s+/g, " ")) ||
      /no participation data is ever sent anywhere/i.test(page.replace(/\s+/g, " ")),
    "and the page states the promise to the teacher",
  );
  checks += 1;
  assert.ok(/localStorage/.test(page), "the tally is kept in localStorage");
}

// ── 2. The picker draws only from the least-heard-from ─────────────────────
{
  const start = page.indexOf('$("pickBtn").addEventListener');
  checks += 1;
  assert.ok(start > 0, "the picker exists");
  const picker = page.slice(start, page.indexOf('$("pickCountBtn")', start));

  checks += 1;
  assert.ok(/Math\.min\.apply/.test(picker), "it computes the minimum heard-from count");
  checks += 1;
  assert.ok(
    /heardCount\(s\.id\) === min/.test(picker),
    "and restricts the pool to students at that minimum",
  );
  checks += 1;
  assert.ok(/Math\.random\(\)/.test(picker), "then picks at random WITHIN that pool");

  // The failure mode: randomising over the whole roster.
  checks += 1;
  assert.equal(
    /roster\.students\[Math\.floor\(Math\.random/.test(picker),
    false,
    "it must NOT pick uniformly across the whole class — that reproduces the bias it exists to fix",
  );
}

// ── 3. Behavioural simulation of the tally + picker ────────────────────────
//
// The logic is inline in a classic script, so the two functions that decide
// fairness are lifted out and exercised directly rather than re-implemented
// here (a re-implementation would let the page drift while this stayed green).
{
  const heardSrc = page.slice(
    page.indexOf("function heardCount("),
    page.indexOf("function lastLabel("),
  );
  checks += 1;
  assert.ok(heardSrc.includes("spoke"), "heardCount counts speaking");
  checks += 1;
  assert.ok(heardSrc.includes("wrote"), "and writing");

  const store = { w: { a: { spoke: 3, wrote: 1 }, b: { spoke: 0, wrote: 0 }, c: { spoke: 1 } } };
  const heardCount = new Function("store", "week", `${heardSrc}; return heardCount;`)(store, "w");

  checks += 1;
  assert.equal(heardCount("a"), 4, "spoken and written both count toward being heard from");
  checks += 1;
  assert.equal(heardCount("b"), 0, "a silent student counts zero");
  checks += 1;
  assert.equal(heardCount("c"), 1, "a partial record still counts");
  checks += 1;
  assert.equal(heardCount("zzz"), 0, "an unknown student is zero, not a crash");

  // The pool the picker would draw from.
  const students = ["a", "b", "c"];
  const min = Math.min(...students.map(heardCount));
  const pool = students.filter((s) => heardCount(s) === min);
  checks += 1;
  assert.deepEqual(pool, ["b"], "with a=4, b=0, c=1 the picker can only choose the silent student");
}

// ── 4. Week boundary ───────────────────────────────────────────────────────
{
  const weekSrc = page.slice(page.indexOf("function weekKey("), page.indexOf("function readJson("));
  const weekKey = new Function(`${weekSrc}; return weekKey;`)();
  checks += 1;
  assert.equal(
    weekKey("2026-07-30T10:00:00Z"),
    weekKey("2026-07-27T08:00:00Z"),
    "Thursday and the Monday before it fall in the same week",
  );
  checks += 1;
  assert.notEqual(
    weekKey("2026-07-30T10:00:00Z"),
    weekKey("2026-07-24T08:00:00Z"),
    "the previous Friday is a different week",
  );
  checks += 1;
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(weekKey("2026-07-30T10:00:00Z")), "the key is a plain date");
}

// ── 5. Non-deficit framing ─────────────────────────────────────────────────
for (const [label, pattern] of [
  ["quiet kids", /\bquiet kids?\b/i],
  ["non-participant", /\bnon-?participan/i],
  ["problem students", /\bproblem students?\b/i],
  ["lazy", /\blazy\b/i],
]) {
  checks += 1;
  assert.equal(pattern.test(page), false, `the tool must not label students ("${label}")`);
}
checks += 1;
assert.ok(
  /have not been heard from/i.test(page),
  "the framing is about the teacher's reach, not the student's deficiency",
);

// ── 6. Reachable ───────────────────────────────────────────────────────────
{
  const hub = readFileSync(new URL("../teacher-tools/index.html", import.meta.url), "utf8");
  checks += 1;
  assert.ok(hub.includes("/teacher-tools/participation/"), "linked from the teacher tools hub");
  const routes = JSON.parse(readFileSync(new URL("../data/routes.json", import.meta.url), "utf8"));
  checks += 1;
  assert.ok(
    routes.routes.some((r) => r.path === "/teacher-tools/participation/"),
    "and registered in routes.json",
  );
}

console.log(`participation tracker: ${checks} checks passed.`);
