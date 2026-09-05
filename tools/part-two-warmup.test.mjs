#!/usr/bin/env node
/* =============================================================================
 * part-two-warmup.test.mjs — Day 2 opens on a WARM-UP, not on three notebook
 * assignments; and Day 2's "Solve it" is one method laid out across, not six
 * assignments stacked down.
 *
 * WHY THIS EXISTS.
 *
 * Part 2 (Apply Day) grew its own hand-rolled warm-up. It fed each question
 * through `renderComponent`'s problem-card shell, which derives a ✏️ notebook
 * setup per item (problem-shell.js `notebookPromptFor`), so a three-question
 * autograded check arrived as three ✏️ notebook assignments — and its
 * `onAnswer` was a no-op, so nothing a student answered there was ever saved.
 * Joel, 2026-09-01: "day 2 warmup questions should not involve the notebook —
 * they should just look like regular warmup questions that check/submit at the
 * end." The fix deletes the second implementation: `renderWarmupPhase` is
 * exported from lesson-renderer.js and Part 2 calls it with
 * `{standalone:false, retrieval:false, heading, lede}`.
 *
 * The same fix laid the six guided moves of Today's Problem out horizontally
 * (Joel: "the steps should line up next to each other horizontally").
 *
 * WHAT IT DRIVES. The REAL renderers, booted the way the page boots them
 * (`bootPartTwo` / `bootLesson` from engine/core), against the REAL shipped
 * configs in lessons/. Not a fixture: a fixture of a warm-up would keep
 * passing after the product's warm-up stopped resembling it, which is the exact
 * failure mode that let two "warm-ups" drift apart in the first place.
 *
 * THE BLAST RADIUS IS PART 1. Exporting and parameterising the shared warm-up
 * put every core lesson on the site behind this change: 281 core configs carry
 * a `warmup.title` ("Warmup: Previous Lesson Check") that the renderer must go
 * on IGNORING, or a Part 2 fix silently renames every Part 1 warm-up. So the
 * second half of this file is a regression guard on a core lesson: derived
 * heading, standalone phase header, spaced-retrieval bonus.
 *
 * ZERO-MATCH GUARDS THROUGHOUT. "Found no .nb-setup" is only meaningful if the
 * warm-up rendered at all, so every absence assertion is paired with a
 * presence assertion on the same subtree. A selector that matches nothing is a
 * FAILURE here, not a pass.
 * ========================================================================== */

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import "./lib/register-engine-hooks.mjs";

const ROOT = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, ROOT), "utf8");
const readJson = (p) => JSON.parse(read(p));

/* The canaries. Small and named on purpose: every lesson on the site rides the
 * one `renderWarmupPhase` card, so this is a canary for that shared shell, not
 * a fleet sweep (the fleet sweep over all 76 part2 configs is at the bottom and
 * needs no DOM). Preconditions are asserted below with a message that tells the
 * next reader to pick a different canary rather than to weaken the test. */
const PART2 = "6-1-part2";
const PART1 = "3-3";

/* Failures are COLLECTED, not thrown. A file that stops at the first bad
 * assertion tells you one thing per run, and this file exists to be run against
 * deliberately broken code — under the shipped Part 2 warm-up, six of these
 * checks are wrong at once and all six should say so. */
let pass = 0;
const failures = [];
const t = (name, fn) => {
  try {
    fn();
    pass++;
    console.log(`  ok  ${name}`);
  } catch (e) {
    failures.push(name);
    console.log(`  FAIL  ${name}\n        ${e.message.split("\n")[0]}`);
  }
};

/* ── a DOM the engine can boot in ─────────────────────────────────────────── */

const RETRIEVAL_BANK = read("data/retrieval-bank.json");

/**
 * jsdom implements no layout and no audio, and the engine touches both on boot.
 * Every shim here stands in for a browser API jsdom omits — none of them stands
 * in for engine code, so nothing under test is replaced by a stub.
 */
function installDom(url) {
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', { url });
  const w = dom.window;
  w.HTMLElement.prototype.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.HTMLCanvasElement.prototype.getContext = () => null;
  w.scrollTo = () => {};
  w.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
  w.cancelAnimationFrame = (id) => clearTimeout(id);
  w.AudioContext = function AudioContextStub() {
    return {
      createOscillator: () => ({
        connect() {},
        start() {},
        stop() {},
        frequency: { setValueAtTime() {} },
      }),
      createGain: () => ({
        connect() {},
        gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
      }),
      destination: {},
      currentTime: 0,
      close() {},
      resume() {},
    };
  };
  w.matchMedia =
    w.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }));

  globalThis.window = w;
  globalThis.document = w.document;
  for (const key of [
    "HTMLElement",
    "HTMLCanvasElement",
    "Element",
    "Node",
    "NodeFilter",
    "Range",
    "Text",
    "customElements",
    "getComputedStyle",
    "MutationObserver",
    "IntersectionObserver",
    "ResizeObserver",
    "CustomEvent",
    "Event",
    "MouseEvent",
    "KeyboardEvent",
    "DOMParser",
    "XMLSerializer",
    "SVGElement",
    "Image",
    "Blob",
    "FileReader",
    "AudioContext",
  ]) {
    if (w[key]) {
      try {
        globalThis[key] = w[key];
      } catch {
        /* a read-only global (navigator) — the engine reads it off window */
      }
    }
  }
  globalThis.requestAnimationFrame = w.requestAnimationFrame;
  globalThis.cancelAnimationFrame = w.cancelAnimationFrame;
  Object.defineProperty(globalThis, "localStorage", {
    value: w.localStorage,
    configurable: true,
    writable: true,
  });
  // The retrieval bonus is fetched, and it is one of the things under test on
  // Part 1 — so it is served the REAL bank rather than stubbed away. Everything
  // else 404s, the way an offline Chromebook sees it.
  const fetchImpl = (input) => {
    const u = String(input && input.url ? input.url : input);
    if (u.includes("retrieval-bank.json")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(JSON.parse(RETRIEVAL_BANK)),
        text: () => Promise.resolve(RETRIEVAL_BANK),
      });
    }
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve(null),
      text: () => Promise.resolve(""),
    });
  };
  globalThis.fetch = fetchImpl;
  w.fetch = fetchImpl;
  return dom;
}

const tick = (ms = 25) => new Promise((r) => setTimeout(r, ms));

/**
 * Wait for a CONDITION, never for a duration. A fixed sleep is a guess about
 * someone else's machine; on a loaded CI box it becomes a flaky gate, and a
 * flaky gate stops being read.
 */
async function waitFor(predicate, what, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (predicate()) return;
    if (Date.now() > deadline)
      throw new Error(`timed out after ${timeoutMs}ms waiting for ${what}`);
    await tick();
  }
}

/** Boot a real lesson id through its real boot function and get past the door. */
async function boot(lessonId, bootFn) {
  installDom(`https://eduwonderlab.com/lessons/${lessonId}/`);
  const config = readJson(`lessons/${lessonId}/config.json`);
  bootFn(config);
  await waitFor(
    () => document.getElementById("id-name") && document.getElementById("id-start"),
    `${lessonId}: the identity screen to render (the boot failed)`,
  );
  const name = document.getElementById("id-name");
  name.value = "Test Student";
  name.dispatchEvent(new window.Event("input", { bubbles: true }));
  document.getElementById("id-start").click();
  await waitFor(
    () => document.querySelectorAll(".act-step-panel").length > 0,
    `${lessonId}: act-step panels after Start — without them every absence assertion below ` +
      "would pass for the wrong reason",
  );
  // The spaced-retrieval bonus mounts asynchronously, after the review bank
  // resolves. Both the "Part 1 still has one" and the "Part 2 has none"
  // assertions depend on that having had its chance, so settle it here rather
  // than guessing a duration at each call site.
  await loadRetrievalBank();
  await tick(50);
  return { config, doc: document, win: window };
}

/** The step panel whose strip chip carries `key`, or a loud failure. */
function stepPanel(doc, key, label) {
  const chips = [...doc.querySelectorAll(".act-step-chip")];
  const i = chips.findIndex((c) => c.dataset.stepKey === key);
  assert.notEqual(
    i,
    -1,
    `${label}: no "${key}" step in the strip (found: ${chips.map((c) => c.dataset.stepKey).join(", ") || "none"})`,
  );
  const panel = doc.querySelectorAll(".act-step-panel")[i];
  assert.ok(panel, `${label}: the "${key}" chip has no panel behind it`);
  return panel;
}

/**
 * Buttons that offer to grade the warm-up's own questions — one per WARM-UP,
 * never one per question. The spaced-retrieval BONUS is excluded deliberately:
 * it is a different kind of question (optional, ungraded, from weeks ago) and
 * ships its own Check Answer, so counting it would make this assertion about
 * the bonus rather than about the warm-up.
 */
const submitControls = (root) =>
  [...root.querySelectorAll("button")].filter(
    (b) => /\b(submit|check)\b/i.test(b.textContent) && !b.closest(".retrieval-card"),
  );

/** Every saved response the engine has written to storage, flattened. */
function savedResponses(win) {
  const out = {};
  for (let i = 0; i < win.localStorage.length; i++) {
    const k = win.localStorage.key(i);
    let parsed;
    try {
      parsed = JSON.parse(win.localStorage.getItem(k));
    } catch {
      continue;
    }
    if (parsed && typeof parsed === "object" && parsed.responses) {
      Object.assign(out, parsed.responses);
    }
  }
  return out;
}

const { loadRetrievalBank } = await import("@eduwonderlab/engine/core/retrieval.js");
const { bootPartTwo } = await import("@eduwonderlab/engine/core/part-two-renderer.js");
const { bootLesson, renderWarmupPhase } = await import(
  "@eduwonderlab/engine/core/lesson-renderer.js"
);

/* ═══ 1 · PART 2 — the warm-up is a warm-up ══════════════════════════════════ */

console.log(`\npart 2 warm-up (${PART2}, booted through bootPartTwo)`);

const p2 = await boot(PART2, bootPartTwo);
const p2Warmup = p2.config.reviewWarmup;
assert.ok(
  p2Warmup && Array.isArray(p2Warmup.questions) && p2Warmup.questions.length >= 2,
  `${PART2} no longer carries an authored reviewWarmup — pick another Part 2 canary`,
);
assert.ok(
  p2Warmup.prevLessonTitle,
  `${PART2}'s reviewWarmup has no prevLessonTitle — pick a canary that names yesterday's lesson`,
);

const p2Panel = stepPanel(p2.doc, "warmup", PART2);

t("Part 2 renders the SHARED warm-up card, not a second implementation", () => {
  assert.ok(
    p2Panel.querySelector(".card-warmup-phase"),
    "no .card-warmup-phase in Part 2's warm-up step — it is rendering its own surface again, " +
      "which is how the notebook shell got in",
  );
  assert.equal(
    // Excluding the retrieval bonus, which borrows the same class so it sits
    // among the questions — its presence is a separate assertion below.
    p2Panel.querySelectorAll(".warmup-question-card:not(.retrieval-card)").length,
    p2Warmup.questions.length,
    `expected ${p2Warmup.questions.length} warm-up question cards`,
  );
});

t("ZERO notebook setups and ZERO problem-card shells", () => {
  const nb = p2Panel.querySelectorAll(".nb-setup");
  const cards = p2Panel.querySelectorAll(".problem-card");
  assert.equal(
    nb.length,
    0,
    `${nb.length} ✏️ notebook setup(s) in the Day 2 warm-up — a quick autograded check is ` +
      "arriving as notebook assignments again (Joel: the day 2 warm-up must not involve the notebook)",
  );
  assert.equal(
    cards.length,
    0,
    `${cards.length} .problem-card shell(s) in the Day 2 warm-up — the warm-up is back on ` +
      "renderComponent, and that shell is what derives the notebook prompt",
  );
});

t("ONE submit control for the whole warm-up, not one per question", () => {
  const buttons = submitControls(p2Panel);
  assert.equal(
    buttons.length,
    1,
    `${buttons.length} submit/check controls in the Day 2 warm-up ` +
      `(${buttons.map((b) => JSON.stringify(b.textContent.trim().slice(0, 40))).join(", ") || "none"}) — ` +
      `there must be exactly one for all ${p2Warmup.questions.length} questions`,
  );
});

t("the heading names YESTERDAY's lesson, not Part 1's 'Last Lesson Check'", () => {
  const h = p2Panel.querySelector("h3");
  assert.ok(h, "the warm-up card lost its heading");
  const text = h.textContent.trim();
  assert.ok(
    text.includes(p2Warmup.prevLessonTitle),
    `the Day 2 warm-up heading is "${text}" — it must name yesterday's lesson ` +
      `("${p2Warmup.prevLessonTitle}")`,
  );
  assert.ok(
    !/Last Lesson Check/i.test(text),
    `the Day 2 warm-up heading is "${text}" — "Last Lesson Check" is Part 1's derived heading ` +
      "and names the wrong day on Apply Day",
  );
});

t("NO spaced-retrieval bonus on Part 2", () => {
  const bonus = p2.doc.querySelectorAll(".retrieval-card");
  assert.equal(
    bonus.length,
    0,
    `${bonus.length} "Remember When" bonus card(s) on Apply Day — this step IS the review of ` +
      "yesterday, so reaching further back a second time is the second-warm-up shape Act 1 removed",
  );
});

t("answering persists immediately — the old onAnswer was a no-op", () => {
  const before = savedResponses(p2.win)["0_warmup_answers"];
  assert.ok(
    !before || before[0] === undefined,
    "the canary already has a saved answer before anything was clicked",
  );
  const radios = p2Panel.querySelectorAll('input[name="warmup_q_p0_0"]');
  assert.ok(radios.length >= 2, `Q1 rendered ${radios.length} choices`);
  radios[0].checked = true;
  radios[0].dispatchEvent(new p2.win.Event("change", { bubbles: true }));
  const after = savedResponses(p2.win)["0_warmup_answers"];
  assert.ok(
    after && after[0] === 0,
    `selecting a choice wrote ${JSON.stringify(after)} — a student's Day 2 warm-up answers are ` +
      "not being saved at all",
  );
});

t("submitting GRADES the warm-up and persists the attempt", () => {
  // Q1 deliberately wrong, the rest correct — so a hardcoded or missing score
  // cannot pass. Q1's wrong choice is picked as "any index that is not the key".
  const q0 = p2Warmup.questions[0];
  const wrong = q0.choices.findIndex((_, i) => i !== q0.correctIndex);
  const picks = p2Warmup.questions.map((q, i) => (i === 0 ? wrong : q.correctIndex));
  picks.forEach((choice, qIdx) => {
    const radios = p2Panel.querySelectorAll(`input[name="warmup_q_p0_${qIdx}"]`);
    assert.ok(radios[choice], `Q${qIdx + 1} has no choice at index ${choice}`);
    radios[choice].checked = true;
    radios[choice].dispatchEvent(new p2.win.Event("change", { bubbles: true }));
  });

  submitControls(p2Panel)[0].click();

  const expected = picks.length - 1;
  const badge = p2Panel.querySelector("#warmupScoreBadge");
  assert.ok(badge, "the score badge is gone — a submitted warm-up shows no score");
  assert.ok(
    badge.textContent.includes(`Final Score: ${expected}/${picks.length}`),
    `the score badge reads "${badge.textContent.trim()}" — expected ` +
      `"Final Score: ${expected}/${picks.length}" for ${expected} correct of ${picks.length}`,
  );

  const saved = savedResponses(p2.win)["0_warmup_answers"];
  assert.ok(saved, "nothing was written to 0_warmup_answers — the attempt did not persist");
  assert.equal(saved.checked, true, "the persisted attempt is not marked as submitted");
  picks.forEach((choice, qIdx) => {
    assert.equal(
      saved[qIdx],
      choice,
      `Q${qIdx + 1} persisted as ${saved[qIdx]}, but the student chose ${choice}`,
    );
  });
});

/* ═══ 2 · PART 2 — Today's Problem lays the six moves ACROSS ════════════════ */

console.log("\npart 2 · Today's Problem — six moves, one row-flow");

const toProblem = [...p2.doc.querySelectorAll("button")].find((b) =>
  /See today's problem/i.test(b.textContent),
);
assert.ok(toProblem, "the Review phase lost its 'See today's problem' advance button");
toProblem.click();
// Waiting on a marker that Today's Problem always carries — NOT on the grid
// under test, which would turn "the grid is gone" into a hang instead of a
// named failure.
await waitFor(
  () =>
    [...p2.doc.querySelectorAll("button")].some((b) => /Break into groups/i.test(b.textContent)),
  "the Today's Problem phase to render",
);

const SOLVE_ORDER = ["know", "need", "plan", "work", "answer", "why"];

t("the six guided moves are children of one .p2-solve-steps grid, in order", () => {
  const grid = p2.doc.querySelector(".p2-solve-steps");
  assert.ok(
    grid,
    "no .p2-solve-steps container on Today's Problem — the six moves are stacked down the " +
      "page again (Joel: the steps should line up next to each other horizontally)",
  );
  const keys = [...grid.children].map((child) => {
    const input = child.querySelector("textarea");
    return input ? String(input.id).replace(/^p2-\d+-/, "") : `<no textarea: ${child.className}>`;
  });
  assert.deepEqual(
    keys,
    SOLVE_ORDER,
    `the grid holds [${keys.join(", ")}] — all six moves must be its direct children, in ` +
      "know → need → plan → work → answer → why order",
  );
});

t("'My work' spans the full row", () => {
  const grid = p2.doc.querySelector(".p2-solve-steps");
  assert.ok(grid, "no .p2-solve-steps grid — nothing can span a row that does not exist");
  const wide = grid.querySelectorAll(":scope > .p2-solve-wide");
  assert.equal(
    wide.length,
    1,
    `${wide.length} full-row children in the solve grid — exactly one ("My work") must span`,
  );
  assert.equal(
    wide[0].querySelector("textarea").id.replace(/^p2-\d+-/, ""),
    "work",
    "the full-row child is not 'My work' — a six-row textarea at a third of the width is not " +
      "somewhere a student can show every step",
  );
});

t("the stylesheet actually lays that grid out (jsdom has no layout to measure)", () => {
  const css = read("engine/styles/design-system.css");
  const rule = /\.p2-solve-steps\s*\{([^}]*)\}/.exec(css);
  assert.ok(rule, ".p2-solve-steps has no rule in design-system.css — the markup is inert");
  assert.match(
    rule[1],
    /display:\s*grid/,
    `.p2-solve-steps is not display:grid — it reads "${rule[1].replace(/\s+/g, " ").trim()}"`,
  );
  assert.match(
    rule[1],
    /grid-template-columns:\s*repeat\(\s*auto-fit\s*,\s*minmax\(/,
    ".p2-solve-steps must use repeat(auto-fit, minmax(...)) so the column count follows the " +
      "viewport and a phone collapses to one column with no separate breakpoint",
  );
  const wideRule = /\.p2-solve-steps\s*>\s*\.p2-solve-wide\s*\{([^}]*)\}/.exec(css);
  assert.ok(wideRule, "no .p2-solve-steps > .p2-solve-wide rule — 'My work' will not span");
  assert.match(
    wideRule[1],
    /grid-column:\s*1\s*\/\s*-1/,
    `'My work' does not span every column — it reads "${wideRule[1].replace(/\s+/g, " ").trim()}"`,
  );
});

/* ═══ 3 · PART 1 REGRESSION GUARD — the blast radius ════════════════════════ */

console.log(`\npart 1 regression guard (${PART1}, booted through bootLesson)`);

const p1 = await boot(PART1, bootLesson);
const p1Warmup = p1.config.warmup;
assert.ok(
  p1Warmup && Array.isArray(p1Warmup.questions) && p1Warmup.questions.length >= 2,
  `${PART1} no longer carries an authored warmup — pick another Part 1 canary`,
);
assert.ok(
  p1Warmup.title && p1Warmup.prevLessonTitle,
  `${PART1}'s warmup lost its title/prevLessonTitle — the point of this canary is that it ` +
    "carries a title the renderer must IGNORE; pick another",
);

const p1Panel = stepPanel(p1.doc, "warmup", PART1);

t("a core lesson's warm-up still DERIVES its heading and ignores warmup.title", () => {
  const p1Card = p1Panel.querySelector(".card-warmup-phase");
  assert.ok(p1Card, `${PART1}: no .card-warmup-phase — the core warm-up did not render`);
  const text = p1Card.querySelector("h3").textContent.trim();
  assert.ok(
    text.includes("Warm-Up: Last Lesson Check"),
    `${PART1}'s warm-up heading is "${text}" — a core lesson must keep the derived ` +
      '"Warm-Up: Last Lesson Check" heading',
  );
  assert.ok(
    text.includes(p1Warmup.prevLessonTitle),
    `${PART1}'s warm-up heading is "${text}" — it must still name the previous lesson ` +
      `("${p1Warmup.prevLessonTitle}")`,
  );
  assert.ok(
    !text.includes(p1Warmup.title),
    `${PART1}'s warm-up heading is "${text}", which is config.warmup.title — 281 core configs ` +
      "carry that field, so honouring it renames every Part 1 warm-up on the site",
  );
});

t("a core lesson's warm-up still gets its spaced-retrieval BONUS", () => {
  const bonus = p1Panel.querySelectorAll(".retrieval-card");
  assert.equal(
    bonus.length,
    1,
    `${PART1}'s warm-up mounted ${bonus.length} "Remember When" bonus cards — Part 2's ` +
      "`retrieval:false` has leaked into the default and every core lesson lost spaced review",
  );
});

t("a core lesson's warm-up still has exactly one submit control", () => {
  const buttons = submitControls(p1Panel);
  assert.equal(
    buttons.length,
    1,
    `${PART1}'s warm-up has ${buttons.length} submit/check controls ` +
      `(${buttons.map((b) => JSON.stringify(b.textContent.trim().slice(0, 40))).join(", ")})`,
  );
});

t("the STANDALONE phase header is still the default", () => {
  // Called with no opts at all — the shape any surface that is not inside a
  // step strip gets. `standalone:false` must stay opt-in, or a warm-up page
  // rendered on its own loses its "Act 1: Warm-Up" header and its way out.
  const responses = {};
  const state = {
    saveResponse: (phase, key, value) => {
      responses[`${phase}_${key}`] = value;
    },
    getResponse: (phase, key) => responses[`${phase}_${key}`] ?? null,
    markCompleted: () => {},
  };
  const ctx = { nextPhase: () => {} };

  const withHeader = p1.doc.createElement("div");
  renderWarmupPhase(withHeader, state, ctx, p1.config);
  assert.ok(
    withHeader.textContent.includes("Act 1: Warm-Up"),
    "renderWarmupPhase() with default opts no longer renders the standalone 'Act 1: Warm-Up' " +
      "phase header — standalone:false has become the default",
  );

  const embedded = p1.doc.createElement("div");
  renderWarmupPhase(embedded, state, ctx, p1.config, { standalone: false });
  assert.ok(
    !embedded.textContent.includes("Act 1: Warm-Up"),
    "renderWarmupPhase({standalone:false}) still renders a phase header — inside a step strip " +
      "that is a duplicate of the act's own header",
  );
});

/* ═══ 4 · FLEET SWEEP — every part2 config fits the shared renderer ═════════ */

console.log("\npart 2 fleet — every config satisfies the shared renderer's contract");

/**
 * The shared warm-up grades `selIdx === q.correctIndex` against rendered
 * radios. The surface it replaced could render an open-response item and
 * silently grade nothing, so this is also the check that no part2 config
 * relied on anything the old code path allowed and the new one does not.
 */
function auditReviewWarmup(cfg) {
  const problems = [];
  const w = cfg.reviewWarmup;
  if (!w || !Array.isArray(w.questions) || !w.questions.length) {
    problems.push("no reviewWarmup.questions — Day 2 would open on nothing");
    return problems;
  }
  w.questions.forEach((q, i) => {
    if (!Array.isArray(q?.choices) || q.choices.length < 2) {
      problems.push(`q${i + 1}: ${q?.choices?.length ?? 0} choices — the warm-up renders radios`);
    }
    if (!Number.isInteger(q?.correctIndex)) {
      problems.push(
        `q${i + 1}: correctIndex is ${JSON.stringify(q?.correctIndex)}, not an integer`,
      );
    } else if (
      Array.isArray(q?.choices) &&
      (q.correctIndex < 0 || q.correctIndex >= q.choices.length)
    ) {
      problems.push(
        `q${i + 1}: correctIndex ${q.correctIndex} is outside its ${q.choices.length} choices`,
      );
    }
    if (!String(q?.stem || "").trim()) problems.push(`q${i + 1}: no stem`);
  });
  return problems;
}

// ── Self-test: the detector must fire on each shape it exists to catch. ──
assert.equal(auditReviewWarmup({}).length, 1, "the missing-warmup detector stopped firing");
assert.equal(
  auditReviewWarmup({
    reviewWarmup: {
      questions: [{ stem: "Explain your thinking.", choices: ["Because…"], correctIndex: 0 }],
    },
  }).length,
  1,
  "the open-response detector stopped firing",
);
assert.equal(
  auditReviewWarmup({
    reviewWarmup: { questions: [{ stem: "2 ÷ ½ = ?", choices: ["4", "1"], correctIndex: "0" }] },
  }).length,
  1,
  "the non-integer correctIndex detector stopped firing",
);
assert.equal(
  auditReviewWarmup({
    reviewWarmup: { questions: [{ stem: "2 ÷ ½ = ?", choices: ["4", "1"], correctIndex: 7 }] },
  }).length,
  1,
  "the out-of-range correctIndex detector stopped firing",
);
assert.equal(
  auditReviewWarmup({
    reviewWarmup: { questions: [{ stem: "2 ÷ ½ = ?", choices: ["4", "1"], correctIndex: 0 }] },
  }).length,
  0,
  "the detector fires on a good config",
);

const part2Ids = readdirSync(new URL("lessons", ROOT)).filter((d) => /-part2$/.test(d));
assert.ok(part2Ids.length >= 70, `expected the part2 fleet, found ${part2Ids.length}`);
const fleetFailures = [];
let questionCount = 0;
for (const id of part2Ids) {
  const cfg = readJson(`lessons/${id}/config.json`);
  questionCount += (cfg.reviewWarmup?.questions || []).length;
  for (const problem of auditReviewWarmup(cfg)) fleetFailures.push(`${id} ${problem}`);
}
assert.deepEqual(
  fleetFailures,
  [],
  `part2 warm-ups the shared renderer cannot grade:\n${fleetFailures.join("\n")}`,
);
pass++;
console.log(
  `  ok  ${part2Ids.length} part2 configs · ${questionCount} warm-up questions, all gradable`,
);

if (failures.length) {
  console.error(`\npart-two-warmup: ${failures.length} FAILED — ${failures.join("; ")}`);
  process.exit(1);
}
console.log(
  `\npart-two-warmup: PASS (${pass} checks — Day 2 opens on a warm-up, Part 1 keeps its own)`,
);
// A booted lesson leaves live timers behind (the service-worker deploy watcher,
// telemetry heartbeats). Every check above has already run, so exit on the
// result instead of idling for minutes while the page's clocks wind down.
process.exit(0);
