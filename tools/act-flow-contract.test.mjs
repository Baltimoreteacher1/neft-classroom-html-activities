#!/usr/bin/env node
// The taught order IS the navigation — one canonical Act 2 sequence that every
// surface derives from. This contract exists because four navigation surfaces
// (act step strip, subcard ribbon, side rail, floating Next pill) drifted into
// four different orders during 2026-08-25..27: the numbered strip started at
// Explore while the taught order started at Vocabulary, "Continue to
// Vocabulary" stranded students on Explore, the ribbon's Practice chip
// scrolled to the wrong card while the sidebar's identical chip worked, and
// flagship's 6-entry PHASE_KEYS showed Act 3 the "explore" scene on all 30
// flagship lessons. Every check here is a source-text fact about the exact
// line that regressed; each is mutation-tested below before the real sweep.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const renderer = readFileSync(join(root, "engine/core/lesson-renderer.js"), "utf8");
const app = readFileSync(join(root, "engine/core/app.js"), "utf8");
const flagship = readFileSync(join(root, "engine/templates/flagship/flagship.js"), "utf8");
const partTwo = readFileSync(join(root, "engine/core/part-two-renderer.js"), "utf8");

/* Two kinds of check live in this file and they are not interchangeable.
 * Everything below is a REGRESSION PIN — a defect that shipped, pinned to the
 * line that regressed — except `noPartTwoForward`, which enforces a PRODUCT
 * DECISION and therefore has to say whose. Provenance is held by
 * tools/product-decisions.test.mjs; this file only reads it, so a decision
 * whose record is deleted fails loudly instead of silently becoming an
 * anonymous invariant again. */
const DECISIONS = JSON.parse(
  readFileSync(join(root, "data/product-decisions.json"), "utf8"),
).decisions;
const decisionById = (id) => DECISIONS.find((d) => d.id === id);
const APPLY_DAY = decisionById("part-one-does-not-link-to-apply-day");

/** Order of act-step keys as pushed inside renderAct2Studio. */
function act2StepOrder(src) {
  const fnStart = src.indexOf("function renderAct2Studio");
  const fnEnd = src.indexOf("renderActSteps(el, state, 1, steps)", fnStart);
  const body = src.slice(fnStart, fnEnd);
  return [...body.matchAll(/key:\s*"([a-z]+)"/g)].map((m) => m[1]);
}

/** Jump keys listed for phase 1 in PHASE_SUBTABS. */
function sidebarJumpOrder(src) {
  const start = src.indexOf("const PHASE_SUBTABS");
  const one = src.indexOf("1: [", start);
  const end = src.indexOf("]", src.indexOf("newWindow", one));
  const body = src.slice(one, end);
  return [...body.matchAll(/jump:\s*"([a-z]+)"/g)].map((m) => m[1]);
}

const CHECKS = {
  stripOrder(rendererSrc) {
    const order = act2StepOrder(rendererSrc);
    assert.deepEqual(
      order,
      ["vocab", "launch", "learn", "explore", "practice", "connect"],
      `Act 2 step order drifted: ${order.join(" → ")} — the strip must present the taught sequence`,
    );
  },
  sidebarSubset(appSrc, rendererSrc) {
    const strip = act2StepOrder(rendererSrc);
    const jumps = sidebarJumpOrder(appSrc);
    assert.ok(jumps.length >= 3, "side rail lost its act-step entries");
    const positions = jumps.map((k) => strip.indexOf(k));
    assert.ok(
      positions.every((p) => p >= 0),
      `side rail names a step the strip does not have: ${jumps.join(", ")}`,
    );
    const sorted = [...positions].sort((a, b) => a - b);
    assert.deepEqual(positions, sorted, "side rail lists act steps out of taught order");
  },
  fivePhaseRail(rendererSrc) {
    // Objectives Review and MSTAR Review are PHASES — their own large buttons
    // in the side rail beside Warm-Up / Lesson / Exit Ticket (Joel,
    // 2026-08-28) — not step chips inside Act 3. MSTAR is optional, so it is
    // both conditional on authored items and flagged `optional` so a student
    // who skips it still completes the lesson.
    const start = rendererSrc.indexOf("const lessonPhases = [");
    assert.ok(start > 0, "the lesson no longer declares its phase list");
    const block = rendererSrc.slice(start, rendererSrc.indexOf("createApp({", start));
    for (const fn of [
      "renderAct1Launch",
      "renderAct2Studio",
      "renderAct3ExitTicket",
      "renderObjectivesReviewAct",
      "renderMstarReviewAct",
    ]) {
      assert.ok(block.includes(fn), `the phase list lost ${fn}`);
    }
    const keys = [...block.matchAll(/phaseNameByKey\("([a-zA-Z0-9]+)"\)/g)].map((m) => m[1]);
    assert.deepEqual(
      keys,
      ["act1", "act2", "act3", "objectivesReview", "mstarReview"],
      `phase names drifted: ${keys.join(" → ")}`,
    );
    assert.ok(
      /hasMstarPractice\(config\)/.test(block) && /optional: true/.test(block),
      "MSTAR must stay conditional AND optional — otherwise skipping it withholds the lesson's completion",
    );
    // Act 3 holds the exit ticket alone.
    const a3 = rendererSrc.slice(
      rendererSrc.indexOf("export function renderAct3ExitTicket"),
      rendererSrc.indexOf("export function renderObjectivesReviewAct"),
    );
    assert.ok(
      !/renderActSteps\(/.test(a3) && !/key:\s*"(mastery|mstar)"/.test(a3),
      "Act 3 grew steps again — Objectives Review and MSTAR Review are their own phases",
    );
  },
  studentSeesNoTimer(rendererSrc) {
    // Every timer in an interactive lesson is a teacher facilitation tool
    // (Joel, 2026-08-28). Both — the Warm-Up countdown and the Turn & Talk 60s
    // timer — sit inside an isTeacherMode() gate.
    for (const marker of ["timerBar = document.createElement", "startTimer60"]) {
      const at = rendererSrc.indexOf(marker);
      assert.ok(at > 0, `the timer marker ${marker} is gone — re-point this pin`);
      const before = rendererSrc.slice(Math.max(0, at - 1200), at);
      assert.ok(
        before.lastIndexOf("if (isTeacherMode()) {") > before.lastIndexOf("\n}"),
        `a timer near "${marker}" is no longer inside an isTeacherMode() gate — students would see a clock`,
      );
    }
  },
  act1Strip(appSrc, rendererSrc) {
    // Act 1 walks Warm-Up → Math Notes → Objectives → Notice & Wonder as
    // STEPS, and the side rail's doors into them are jumps, never takeover
    // extras (the extras had a "Continue to Vocabulary" that skipped all three).
    const fnStart = rendererSrc.indexOf("function renderAct1Launch");
    const fnEnd = rendererSrc.indexOf("renderActSteps(el, state, 0, steps)", fnStart);
    const order = [...rendererSrc.slice(fnStart, fnEnd).matchAll(/key:\s*"([a-z]+)"/g)].map(
      (m) => m[1],
    );
    assert.deepEqual(
      order,
      ["warmup", "mathnotes", "objectives", "noticewonder"],
      `Act 1 step order drifted: ${order.join(" → ")}`,
    );
    const start = appSrc.indexOf("const PHASE_SUBTABS");
    const zero = appSrc.slice(appSrc.indexOf("0: [", start), appSrc.indexOf("1: [", start));
    for (const kind of ["mathnotes", "objectives", "noticewonder"]) {
      assert.ok(
        new RegExp(`jump:\\s*"${kind}"`).test(zero),
        `side rail lost its Act 1 door into ${kind}`,
      );
      assert.ok(
        !new RegExp(`extra:\\s*"${kind}"`).test(zero),
        `PHASE_SUBTABS reintroduced ${kind} as a takeover extra — it is an Act 1 STEP`,
      );
    }
  },
  noTakeoverTeaching(appSrc) {
    const start = appSrc.indexOf("const PHASE_SUBTABS");
    const end = appSrc.indexOf("};", start);
    const table = appSrc.slice(start, end);
    for (const kind of ["vocab", "launch", "learn"]) {
      assert.ok(
        !new RegExp(`extra:\\s*"${kind}"`).test(table),
        `PHASE_SUBTABS reintroduced ${kind} as a takeover extra — it is an act STEP`,
      );
    }
  },
  ribbonFiltersJumps(appSrc) {
    assert.ok(
      /subtabsFor\(config, index\)\.filter\(\(t\) => !t \|\| !t\.jump\)/.test(appSrc),
      "the ribbon no longer filters jump entries — the taught sequence would render twice per screen",
    );
    assert.ok(
      !/data-sub-jump]"\)\.forEach/.test(appSrc),
      "the ribbon's broken data-sub-jump handler (first-.card-wins querySelector) came back",
    );
  },
  continueLandsOnVocab(rendererSrc) {
    const btn = rendererSrc.indexOf('"Continue to Vocabulary');
    assert.ok(btn > 0, "Act 1's Continue to Vocabulary button is gone");
    const handler = rendererSrc.slice(btn, btn + 400);
    assert.ok(
      /goToActStep\("vocab"\)/.test(handler),
      "Continue to Vocabulary no longer selects the vocab step — students land wherever the strip last was",
    );
    assert.ok(
      !/openExtra\("vocab"\)/.test(handler),
      "Continue to Vocabulary reverted to the takeover panel (closing it stranded students on Explore)",
    );
  },
  stepSavedByKey(rendererSrc) {
    assert.ok(
      /saveResponse\(phaseIdx, "act_step", steps\[i\]\.key\)/.test(rendererSrc),
      "act_step is no longer saved by stable key — a conditional step list silently re-points numeric saves",
    );
  },
  flagshipScenesPerAct(flagshipSrc) {
    assert.ok(/ACT_SCENE_KEYS/.test(flagshipSrc), "flagship lost its per-act scene mapping");
    assert.ok(
      !/PHASE_KEYS\[phaseIndex\]/.test(flagshipSrc),
      "flagship reverted to indexing 6 scene keys by a 3-act phase index (Act 3 shows the explore scene)",
    );
  },
  // The floating pill is a STEP control, not a phase control. Standing on Act
  // 2's Launch it used to read "Next: Exit Ticket" and skip Learn It, Explore,
  // Practice and Connect in one tap, because it only ever knew about phases.
  nextPillFollowsSteps(appSrc) {
    const start = appSrc.indexOf("function mountNextButton");
    assert.ok(start > 0, "the floating Next pill is gone");
    const body = appSrc.slice(start, appSrc.indexOf("})();", start));
    assert.ok(
      /getActStepNav\(\)/.test(body),
      "the Next pill stopped reading the mounted act-step chain — it is naming phases again, so one tap skips the rest of the act",
    );
    assert.ok(
      /nav\.show\(nav\.index \+ 1\)/.test(body),
      "the Next pill no longer advances to the next STEP; it jumps straight to the next act",
    );
    assert.ok(
      /addEventListener\("nt:actstep-changed", refresh\)/.test(body),
      "the Next pill no longer refreshes when the step changes — selecting a step leaves it naming a stale destination",
    );
  },
  /* PRODUCT DECISION, not a regression pin — see data/product-decisions.json,
   * id `part-one-does-not-link-to-apply-day`. Every other check in this file
   * pins a defect that shipped. This one pins a choice Joel made, and the
   * failure message says so, because the opposite of it was pinned here for two
   * days as though it were a proven invariant. */
  noPartTwoForward(rendererSrc, decision) {
    assert.ok(decision, "the Apply Day decision is not recorded in data/product-decisions.json");
    assert.ok(
      !/part-two-forward/.test(rendererSrc),
      `the "Continue to Part 2: Apply Day" card came back.\n` +
        `      This is a PRODUCT DECISION, not a defect: ${decision.decidedBy} on ${decision.decidedOn} said\n` +
        `        "${decision.because}"\n` +
        `      If ${decision.decidedBy} has changed his mind, update that entry and this check in the SAME commit.\n` +
        `      If you are an agent who has not asked him, you do not have permission to change it.`,
    );
  },
  partTwoLabels(partTwoSrc) {
    assert.ok(/name:\s*"Review"/.test(partTwoSrc), 'Part 2 phase 0 is no longer named "Review"');
    assert.ok(
      !/"Warm-Up",\s*\n?\s*"Day 2\./.test(partTwoSrc),
      "Part 2's in-page header disagrees with its sidebar label again",
    );
  },
};

// ── Mutation self-test: every detector must FAIL on the code that shipped. ──
const MUTANTS = [
  () => CHECKS.stripOrder(renderer.replace('key: "vocab"', 'key: "zz-removed"')),
  () => CHECKS.noTakeoverTeaching(app.replace('jump: "vocab"', 'extra: "vocab"')),
  () => CHECKS.ribbonFiltersJumps(app.replace(".filter((t) => !t || !t.jump)", "")),
  () =>
    CHECKS.continueLandsOnVocab(renderer.replace('goToActStep("vocab")', 'ctx.openExtra("vocab")')),
  () =>
    CHECKS.stepSavedByKey(
      renderer.replace(
        'saveResponse(phaseIdx, "act_step", steps[i].key)',
        'saveResponse(phaseIdx, "act_step", String(i))',
      ),
    ),
  () =>
    CHECKS.flagshipScenesPerAct(
      flagship
        .replace("ACT_SCENE_KEYS", "PHASE_KEYS")
        .replace("sceneForPhase(scenes, phaseIndex)", "scenes[PHASE_KEYS[phaseIndex]]"),
    ),
  () => CHECKS.nextPillFollowsSteps(app.replaceAll("getActStepNav()", "null")),
  () =>
    CHECKS.nextPillFollowsSteps(app.replace("nav.show(nav.index + 1);", "app.navigateTo(cur);")),
  () =>
    CHECKS.nextPillFollowsSteps(
      app.replace('document.addEventListener("nt:actstep-changed", refresh);', ""),
    ),
  () =>
    CHECKS.noPartTwoForward(
      renderer.replace("renderAct3ExitTicket", 'x="part-two-forward";renderAct3ExitTicket'),
      APPLY_DAY,
    ),
  // and the record itself is load-bearing: an unrecorded decision must not gate
  () => CHECKS.noPartTwoForward(renderer, null),
  () => CHECKS.act1Strip(app, renderer.replace('key: "mathnotes"', 'key: "zz-gone"')),
  () => CHECKS.act1Strip(app.replace('jump: "objectives"', 'extra: "objectives"'), renderer),
  () =>
    CHECKS.fivePhaseRail(
      renderer.replace("renderObjectivesReviewAct(el, state, ctx, config),", ""),
    ),
  () => CHECKS.fivePhaseRail(renderer.replace("optional: true", "optional: false")),
  () =>
    CHECKS.studentSeesNoTimer(
      renderer.replace(
        "  if (isTeacherMode()) {\n    timerBar = document.createElement",
        "  if (true) {\n    timerBar = document.createElement",
      ),
    ),
];
let caught = 0;
for (const mutate of MUTANTS) {
  try {
    mutate();
  } catch {
    caught += 1;
  }
}
assert.equal(caught, MUTANTS.length, "a flow-contract detector stopped firing");

// ── The real sweep ──
CHECKS.stripOrder(renderer);
CHECKS.sidebarSubset(app, renderer);
CHECKS.noTakeoverTeaching(app);
CHECKS.ribbonFiltersJumps(app);
CHECKS.continueLandsOnVocab(renderer);
CHECKS.stepSavedByKey(renderer);
CHECKS.flagshipScenesPerAct(flagship);
CHECKS.nextPillFollowsSteps(app);
CHECKS.noPartTwoForward(renderer, APPLY_DAY);
CHECKS.partTwoLabels(partTwo);
CHECKS.act1Strip(app, renderer);
CHECKS.fivePhaseRail(renderer);
CHECKS.studentSeesNoTimer(renderer);

console.log(
  `act-flow-contract: PASS (13 checks — 12 regression pins + 1 recorded product decision, ${MUTANTS.length} mutation-proven)`,
);
