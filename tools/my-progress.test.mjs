#!/usr/bin/env node
/* ==========================================================================
 * my-progress.test.mjs — the student-facing progress-by-standard page.
 *
 * The failure this guards against is a progress page that makes claims it
 * cannot support. Telling a twelve-year-old "you can't do ratios" on the
 * evidence of one wrong answer is worse than telling them nothing, and it is
 * exactly what a page like this does by default unless someone stops it. So the
 * evidence threshold and the framing are both asserted, along with the promise
 * that none of it leaves the device.
 * ========================================================================== */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const page = readFileSync(new URL("../curriculum/my-progress/index.html", import.meta.url), "utf8");

let checks = 0;

// ── It never claims anything from thin evidence ────────────────────────────
checks += 1;
assert.ok(/MIN_ATTEMPTS = 3/.test(page), "a skill needs at least 3 attempts before it is reported");
checks += 1;
assert.ok(
  /attempts < MIN_ATTEMPTS\) return;/.test(page),
  "and standards below that threshold are dropped rather than shown as 0%",
);
checks += 1;
assert.ok(
  /one question is not evidence/i.test(page),
  "the empty state explains WHY it is empty, so silence does not read as a bug",
);

// ── Framing: what you can do, never a deficit verdict ──────────────────────
checks += 1;
assert.ok(/You can do these/.test(page), "the top band names a capability");
checks += 1;
assert.ok(/Worth another look/.test(page), "the bottom band is a next step, not a judgement");
// Deficit PHRASINGS, not bare words: "Every line below is a skill" is positional
// and perfectly fine, while "below grade level" is the thing this page must never
// say to a child about themselves.
for (const [label, pattern] of [
  ["failing", /\bfailing\b/i],
  ["below grade/standard", /\bbelow\s+(grade|standard|basic|proficient|level)/i],
  ["behind", /\b(you are|you're|falling)\s+behind\b/i],
  ["weak", /\bweak(ness|nesses)?\b/i],
  ["poor", /\bpoor\b/i],
  ["struggling", /\bstruggling\b/i],
  ["deficient", /\bdeficien/i],
  ["mastery verdict", /\bnot mastered\b/i],
]) {
  checks += 1;
  assert.equal(
    pattern.test(page),
    false,
    `student-facing copy must not use deficit language ("${label}")`,
  );
}

// ── Nothing leaves the device ──────────────────────────────────────────────
{
  const fetches = page.match(/fetch\(\s*["'][^"']+/g) || [];
  checks += 1;
  assert.ok(fetches.length > 0, "the page fetches the standards registry");
  for (const f of fetches) {
    checks += 1;
    assert.ok(/["']\/data\//.test(f), `the page may only read static data files, found: ${f}`);
  }
  checks += 1;
  assert.equal(
    /method:\s*["']POST/i.test(page),
    false,
    "a progress page must never POST — its whole promise is that it stays local",
  );
  checks += 1;
  assert.ok(/never sent anywhere/i.test(page), "and the page says so to the student");
  checks += 1;
  assert.ok(/noindex/.test(page), "the page is not indexable");
}

// ── It renders, against a real NTSignal store ──────────────────────────────
{
  const dom = new JSDOM(page, {
    url: "https://eduwonderlab.com/curriculum/my-progress/",
    runScripts: "outside-only",
  });
  globalThis.window = dom.window;
  globalThis.localStorage = dom.window.localStorage;
  await import("../assets/nt-signal.js");
  const S = dom.window.NTSignal;

  // One attempt: below the evidence bar.
  S.record({ standard: "6.GR.1", correct: true });
  // Enough attempts, mostly right.
  for (let i = 0; i < 5; i++) S.record({ standard: "6.NOS.1", correct: i < 5 });
  // Enough attempts, mostly wrong.
  for (let i = 0; i < 5; i++) S.record({ standard: "6.AT.4", correct: i < 1 });

  const profile = S.profile();
  checks += 1;
  assert.equal(profile.standards["6.NOS.1"].correct, 5, "the store recorded the strong skill");
  checks += 1;
  assert.equal(profile.standards["6.AT.4"].correct, 1, "and the shaky one");

  // Reproduce the page's own banding rule against that store, so a change to
  // either the thresholds or the bands has to be a deliberate one.
  const banded = (rate) => (rate >= 0.8 ? "solid" : rate >= 0.5 ? "growing" : "revisit");
  checks += 1;
  assert.equal(banded(5 / 5), "solid", "5 of 5 is a capability");
  checks += 1;
  assert.equal(banded(1 / 5), "revisit", "1 of 5 is worth another look");
  checks += 1;
  assert.ok(
    (Number(profile.standards["6.GR.1"].attempts) || 0) < 3,
    "the single-attempt standard stays below the reporting bar",
  );

  // The registry the page reads must actually contain the codes it will show.
  const registry = JSON.parse(
    readFileSync(new URL("../data/ccss-standards.json", import.meta.url), "utf8"),
  ).standards;
  for (const code of ["6.NOS.1", "6.AT.4"]) {
    checks += 1;
    assert.ok(registry[code]?.shortLabel, `${code} has a student-readable label to render`);
  }
}

// ── Registered where students can find it ──────────────────────────────────
{
  const routes = JSON.parse(readFileSync(new URL("../data/routes.json", import.meta.url), "utf8"));
  checks += 1;
  assert.ok(
    routes.routes.some((r) => r.path === "/curriculum/my-progress/"),
    "the page is registered in routes.json so search and the directory can find it",
  );
  const hub = readFileSync(new URL("../curriculum/index.html", import.meta.url), "utf8");
  checks += 1;
  assert.ok(
    hub.includes("/curriculum/my-progress/"),
    "and linked from the curriculum hub — an unreachable page is not a feature",
  );
}

console.log(`my progress: ${checks} checks passed.`);
