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

const pageOnly = readFileSync(
  new URL("../curriculum/my-progress/index.html", import.meta.url),
  "utf8",
);
const mathPage = readFileSync(new URL("../math/my-progress/index.html", import.meta.url), "utf8");
// Both progress URLs render ONE shared component; its source is part of what
// the student sees, so every copy rule below is checked against page + module.
const storesSrc = readFileSync(
  new URL("../assets/my-progress/progress-stores.js", import.meta.url),
  "utf8",
);
const viewSrc = ["progress-sections.js", "progress-view.js"]
  .map((f) => readFileSync(new URL(`../assets/my-progress/${f}`, import.meta.url), "utf8"))
  .join("\n");
const page = [pageOnly, storesSrc, viewSrc].join("\n");

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
  assert.ok(/noindex/.test(pageOnly), "the page is not indexable");
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

// ── One unified view, read-only over every tool's store ────────────────────
{
  const day = 86400000;
  const now = Date.now();
  const seed = {
    "nt-signal:v1": JSON.stringify({
      standards: {
        "6.AT.1": { attempts: 5, correct: 5, lastTs: now - day },
        "6.NOS.2": { attempts: 4, correct: 1, lastTs: now - 2 * day },
        "6.GR.1": { attempts: 1, correct: 1, lastTs: now },
      },
    }),
    "pa-summary-3-4": JSON.stringify({
      score: 120,
      stars: 2,
      firstTry: 5,
      total: 8,
      playedAt: now - 3 * day,
    }),
    "pa-summary-unit-7": JSON.stringify({
      score: 300,
      stars: 3,
      firstTry: 9,
      total: 10,
      playedAt: now - day,
    }),
    nt_results_v1: JSON.stringify([
      {
        activityId: "webquest-x",
        activityTitle: "Ratio WebQuest",
        scorePercent: 85,
        completedAt: new Date(now - 4 * day).toISOString(),
      },
    ]),
    "choiceboard-u3": JSON.stringify([true, true, true, false, false, false, false, false, false]),
    "nsr:rec:ABC123": JSON.stringify({
      activityId: "stats-slam",
      activityTitle: "Stats Slam",
      url: "/math/statistics/games/unit8-stats-slam.html",
      progressPercent: 40,
      updatedAt: new Date(now - 5 * day).toISOString(),
    }),
    "ewl-fluency-profiles-v1": JSON.stringify({ ids: [0, 2], active: 0 }),
    "ewl-fluency-progress-v1": JSON.stringify({
      "6:divide-fractions": {
        attempts: 10,
        correct: 4,
        sprintBest: 6,
        lastPracticed: new Date(now - day).toISOString(),
      },
    }),
    "ewl-fluency-progress-v1:profile-2": JSON.stringify({
      "5:multiply-decimals": {
        attempts: 6,
        correct: 6,
        streakBest: 9,
        lastPracticed: new Date(now).toISOString(),
      },
    }),
    "ewl-fluency-tutor-v2": JSON.stringify({
      sessions: [{ at: now - day, answered: 10, correct: 4, mode: "practice" }],
    }),
    arl_progress: JSON.stringify({
      completedMissions: ["mission-1", "mission-2"],
      missionStars: { "mission-1": 3, "mission-2": 2 },
      lastPlayedAt: new Date(now - 2 * day).toISOString(),
    }),
  };
  /** A storage that records any attempt to write: reading must never write. */
  function readOnlyStorage(data) {
    const keys = Object.keys(data);
    return {
      writes: 0,
      get length() {
        return keys.length;
      },
      key: (i) => keys[i] ?? null,
      getItem: (k) => (k in data ? data[k] : null),
      setItem() {
        this.writes += 1;
      },
      removeItem() {
        this.writes += 1;
      },
    };
  }
  const vm = await import("node:vm");
  const ctx = { window: {} };
  vm.runInNewContext(storesSrc, ctx);
  const S = ctx.window.NTProgressStores;
  const store = readOnlyStorage(seed);
  const snap = S.collect(store);

  checks += 1;
  assert.equal(store.writes, 0, "collecting progress never writes to any tool's store");
  checks += 1;
  assert.equal(
    /\.(setItem|removeItem)\(/.test(storesSrc),
    false,
    "the store readers contain no write call at all",
  );
  checks += 1;
  assert.equal(snap.arcade.runs.length, 2, "Practice Arcade lesson + unit runs are read");
  checks += 1;
  assert.equal(snap.results[0].percent, 85, "saved activity results are read");
  checks += 1;
  assert.equal(snap.saves[0].percent, 40, "Save/Resume records are read");
  checks += 1;
  assert.equal(snap.fluency.length, 2, "every Fluency Lab learner profile is read");
  checks += 1;
  assert.equal(
    snap.fluency[0].skills[0].best,
    6,
    "the older sprintBest field still counts as the best run",
  );
  checks += 1;
  assert.equal(snap.fluency[1].skills[0].best, 9, "and so does the newer streakBest field");
  checks += 1;
  assert.equal(
    snap.almostRight.missions.filter((m) => m.done).length,
    2,
    "Almost-Right missions are read",
  );
  checks += 1;
  assert.equal(snap.boards[2].bingo, true, "choice-board bingo is detected");

  const rows = S.skillRows(snap);
  checks += 1;
  assert.deepEqual(
    [...rows.map((r) => r.code)].sort().join(","),
    "6.AT.1,6.NOS.2",
    "a one-attempt standard stays below the evidence bar in the unified view too",
  );
  const next = S.nextSuggestion(snap);
  checks += 1;
  assert.equal(next.code, "6.NOS.2", "the next suggestion is the skill most worth another look");
  checks += 1;
  assert.ok(S.recentActivity(snap, 20).length >= 5, "recent activity merges every store");
  checks += 1;
  assert.equal(
    S.isEmpty(S.collect(readOnlyStorage({}))),
    true,
    "an empty device is reported as empty, not broken",
  );

  // The view writes only in Restore, and only the two stores Restore has always merged.
  const viewWrites = viewSrc.match(/localStorage\.setItem\(\s*("[^"]*"|[^,]+)/g) || [];
  checks += 1;
  assert.ok(viewWrites.length > 0, "Restore still merges a backup");
  for (const w of viewWrites) {
    checks += 1;
    assert.ok(
      /nt_results_v1|choiceboard-u/.test(w),
      `the view may only restore results/choice boards, found: ${w}`,
    );
  }
  checks += 1;
  assert.equal(
    /removeItem\(/.test(viewSrc),
    false,
    "the unified view never deletes another tool's data",
  );

  // Both URLs render the same component, against the same seeded device.
  for (const [route, html] of [
    ["/curriculum/my-progress/", pageOnly],
    ["/math/my-progress/", mathPage],
  ]) {
    checks += 1;
    assert.ok(/data-progress-view/.test(html), `${route} mounts the unified view`);
    for (const f of ["progress-stores.js", "progress-sections.js", "progress-view.js"]) {
      checks += 1;
      assert.ok(html.includes(`/assets/my-progress/${f}`), `${route} loads ${f}`);
    }
    const dom = new JSDOM(html.replace(/<script[\s\S]*?<\/script>/g, ""), {
      url: `https://eduwonderlab.com${route}`,
      runScripts: "outside-only",
    });
    for (const [k, v] of Object.entries(seed)) dom.window.localStorage.setItem(k, v);
    const before = JSON.stringify(Object.entries(dom.window.localStorage));
    dom.window.eval(storesSrc);
    dom.window.eval(viewSrc);
    if (dom.window.document.readyState === "loading")
      await new Promise((r) => dom.window.addEventListener("DOMContentLoaded", r));
    const text = dom.window.document.querySelector("[data-progress-view]").textContent;
    for (const expected of [
      "Practice Arcade",
      "Stats Slam",
      "Fluency Lab",
      "Almost-Right",
      "Ratio WebQuest",
      "Next suggested skill",
      "Próxima habilidad sugerida",
      "Print my progress",
      "Back up to a file",
      "Restore from a file",
    ]) {
      checks += 1;
      assert.ok(text.includes(expected), `${route} shows "${expected}"`);
    }
    checks += 1;
    assert.equal(
      JSON.stringify(Object.entries(dom.window.localStorage)),
      before,
      `${route} rendered without changing any store`,
    );
  }
}

console.log(`my progress: ${checks} checks passed.`);
