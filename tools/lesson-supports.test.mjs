#!/usr/bin/env node
/* =============================================================================
 * lesson-supports.test.mjs — the invariants the lesson adaptation layer exists
 * to hold. Each block names the failure it prevents, because a test whose
 * purpose is not written down gets deleted the first time it is inconvenient.
 * ========================================================================== */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = readFileSync(join(ROOT, "shared", "supports", "lesson-supports.js"), "utf8");

function load() {
  const mod = { exports: {} };
  new Function("module", "globalThis", SRC)(mod, {});
  return mod.exports;
}

const LS = load();

// A stand-in for one canonical manifest entry. Deliberately NOT read from the
// real manifest: these tests must fail on a logic regression, not on a
// curriculum edit.
const ENTRY = {
  lessonId: "5-3",
  title: "Determine the Area of Trapezoids",
  standard: "6.GR.1",
  contentObjective: "I can find the area of a trapezoid using A = ½(b1 + b2) × h.",
  vocabulary: [
    {
      term: "Trapezoid",
      termEs: "Trapecio",
      definition: "One pair of parallel sides.",
      definitionEs: "Un par de lados paralelos.",
    },
    { term: "Height", definition: "The perpendicular distance between the bases." },
  ],
  workedExample: "A = ½ × (4 + 8) × 5\n4 + 8 = 12\n12 × 5 = 60\nHalf of 60 is 30.",
  sentenceFrames: ["The height is ___ because it is perpendicular to ___."],
  wordBank: ["base", "height", "perpendicular", "trapezoid"],
  readinessHref: "/lessons/5-3/readiness/",
  variants: {
    group1: {
      id: "5-3-group1",
      title: "5.3 Small Group · Group 1",
      intrinsic: ["sentence-frames", "worked-example"],
    },
    group2: { id: "5-3-group2", title: "5.3 Small Group · Group 2", intrinsic: [] },
  },
};

// A mathematically different lesson, for the cross-lesson leakage checks.
const RATIO_ENTRY = {
  lessonId: "3-1",
  title: "Equivalent Ratios",
  standard: "6.RP.1",
  vocabulary: [{ term: "Ratio", definition: "A comparison of two quantities." }],
  sentenceFrames: ["These ratios are equivalent because both quantities were multiplied by ___."],
  wordBank: ["ratio", "equivalent", "scale factor"],
  workedExample: "",
  readinessHref: "",
  variants: {},
};

let pass = 0;
function t(name, fn) {
  fn();
  pass++;
  console.log(`  ok  ${name}`);
}

/* ===========================================================================
 * 1. RIGOR. An accommodation may change presentation and language. It may not
 *    touch the mathematics. This is the guarantee the whole feature rests on:
 *    a teacher applies "sentence frames" and the numbers, the objective, the
 *    worked example and the standard are exactly what they were.
 * ======================================================================== */
t("no non-modification support mutates protected mathematics", () => {
  const before = JSON.stringify(ENTRY);
  for (const s of LS.CATALOG.filter((x) => x.impact !== "modification")) {
    LS.preview([s.key], ENTRY);
    LS.resolveCapabilities([s.key]);
    LS.resolveConflicts([s.key]);
    assert.equal(JSON.stringify(ENTRY), before, `${s.key} mutated the lesson entry`);
  }
});

t("preview reports the protected fields as unchanged", () => {
  const pv = LS.preview(["word-bank", "sentence-frames"], ENTRY);
  for (const f of ["standard", "contentObjective", "workedExample"]) {
    assert.ok(pv.unchanged.includes(f), `${f} is not declared protected`);
  }
});

t("exactly one catalogue support is a modification, and it says so", () => {
  const mods = LS.CATALOG.filter((s) => s.impact === "modification");
  assert.equal(mods.length, 1);
  assert.equal(mods[0].key, "shorter-practice-set");
  const pv = LS.preview(["shorter-practice-set", "word-bank"], ENTRY);
  assert.equal(pv.modifications.length, 1);
  assert.equal(pv.modifications[0].key, "shorter-practice-set");
});

t("no preset can smuggle a modification in under an accommodation label", () => {
  for (const p of LS.PRESETS) {
    for (const k of p.keys) assert.notEqual(LS.byKey[k].impact, "modification", `${p.key} → ${k}`);
  }
});

/* ===========================================================================
 * 2. LESSON-SPECIFIC CONTENT. A generic frame where the lesson authored a
 *    precise one is a worse support and reads as a system that did not look at
 *    the lesson. The preview must quote the LESSON.
 * ======================================================================== */
t("preview quotes this lesson's own frame, vocabulary and word bank", () => {
  const pv = LS.preview(["sentence-frames", "visual-vocabulary", "word-bank"], ENTRY);
  const text = JSON.stringify(pv);
  assert.match(text, /perpendicular to/, "the authored geometry frame is missing");
  assert.match(text, /Trapezoid/);
  assert.match(text, /base/);
  assert.doesNotMatch(text, /I know ___ because ___/, "a generic frame replaced the authored one");
});

t("a different lesson previews its own mathematics, never the previous one", () => {
  const pv = LS.preview(["sentence-frames", "word-bank"], RATIO_ENTRY);
  const text = JSON.stringify(pv);
  assert.match(text, /both quantities were multiplied/);
  assert.doesNotMatch(text, /perpendicular/, "geometry language leaked into a ratio lesson");
});

t("bilingual preview uses the authored Spanish, and is not offered without it", () => {
  assert.ok(LS.byKey["bilingual-vocabulary"].requires(ENTRY, {}));
  assert.ok(!LS.byKey["bilingual-vocabulary"].requires(RATIO_ENTRY, {}));
  assert.match(JSON.stringify(LS.preview(["bilingual-vocabulary"], ENTRY)), /Trapecio/);
});

/* ===========================================================================
 * 3. APPLICABILITY. A control that does nothing is worse than no control: a
 *    teacher ticks it, records the accommodation as provided, and it was not.
 * ======================================================================== */
t("supports are offered only where the lesson can deliver them", () => {
  const keys = LS.applicableSupports(RATIO_ENTRY, {}).map((s) => s.key);
  assert.ok(!keys.includes("worked-example"), "offered a worked example the lesson does not have");
  assert.ok(!keys.includes("readiness-review"), "offered a readiness route that does not exist");
  assert.ok(keys.includes("sentence-frames"));
});

t("authored overrides suppress a tool where it would remove the objective", () => {
  const withCalc = LS.applicableSupports(ENTRY, {}).map((s) => s.key);
  assert.ok(withCalc.includes("calculator"));
  const withoutCalc = LS.applicableSupports(ENTRY, { computationIsObjective: true }).map(
    (s) => s.key,
  );
  assert.ok(!withoutCalc.includes("calculator"));
  const noChart = LS.applicableSupports(ENTRY, { factRecallIsObjective: true }).map((s) => s.key);
  assert.ok(!noChart.includes("multiplication-chart"));
});

t("a throwing applicability rule is inapplicable, not fatal", () => {
  const saved = LS.byKey["word-bank"].requires;
  LS.byKey["word-bank"].requires = () => {
    throw new Error("authored rule blew up");
  };
  const keys = LS.applicableSupports(ENTRY, {}).map((s) => s.key);
  assert.ok(!keys.includes("word-bank"));
  assert.ok(keys.length > 5, "one bad rule took the whole catalogue down");
  LS.byKey["word-bank"].requires = saved;
});

t("accommodations with no software behaviour are documented, never offered", () => {
  const offered = new Set(LS.CATALOG.map((s) => s.key));
  for (const n of LS.NOT_IMPLEMENTED) {
    assert.ok(!offered.has(n.key), `${n.key} is both "not implemented" and offered as a toggle`);
    assert.ok(n.reason && n.insteadDo, `${n.key} has no reason recorded`);
  }
  assert.ok(LS.NOT_IMPLEMENTED.some((n) => n.key === "extended-time"));
});

/* ===========================================================================
 * 4. INHERITANCE + DEDUPLICATION. "sentence frames on" means ENSURE sentence
 *    support exists — not append a second, more generic one on top of a
 *    small-group lesson's better authored frame.
 * ======================================================================== */
const STORE = {
  "5-3": LS.normalizeProfile(
    { keys: ["sentence-frames", "word-bank", "visual-vocabulary"] },
    "5-3",
  ),
};

t("a small-group variant inherits the parent lesson's selection", () => {
  const r = LS.resolveForLesson("5-3-group2", STORE, ENTRY);
  assert.deepEqual(r.keys.sort(), ["sentence-frames", "visual-vocabulary", "word-bank"]);
  assert.equal(r.overridden, false);
});

t("a variant that already authors a support does not receive it twice", () => {
  const r = LS.resolveForLesson("5-3-group1", STORE, ENTRY);
  assert.ok(!r.keys.includes("sentence-frames"), "stacked a second sentence frame");
  assert.deepEqual(r.suppressed, ["sentence-frames"]);
  assert.ok(r.keys.includes("word-bank"), "de-duplication removed an unrelated support");
});

t("a variant configured by hand overrides inheritance outright", () => {
  const store = {
    ...STORE,
    "5-3-group2": LS.normalizeProfile({ keys: ["visual-model"] }, "5-3-group2"),
  };
  const r = LS.resolveForLesson("5-3-group2", store, ENTRY);
  assert.deepEqual(r.keys, ["visual-model"]);
  assert.equal(r.overridden, true);
});

t("the whole-group lesson is unaffected by a variant's override", () => {
  const store = { ...STORE, "5-3-group1": LS.normalizeProfile({ keys: [] }, "5-3-group1") };
  assert.deepEqual(LS.resolveForLesson("5-3", store, ENTRY).keys.sort(), [
    "sentence-frames",
    "visual-vocabulary",
    "word-bank",
  ]);
});

t("a lesson with no profile resolves to nothing — canonical rendering", () => {
  assert.deepEqual(LS.resolveForLesson("3-1", STORE, RATIO_ENTRY).keys, []);
  assert.deepEqual(LS.resolveForLesson("5-3-group1", {}, ENTRY).keys, []);
});

/* ===========================================================================
 * 5. LESSON A's CONFIGURATION MUST NOT REACH LESSON B.
 * ======================================================================== */
t("copying a setup transfers intent, never lesson-specific content", () => {
  const copied = LS.copyProfileTo(STORE["5-3"], "3-1", RATIO_ENTRY, {});
  assert.equal(copied.lessonId, "3-1");
  assert.ok(copied.keys.includes("sentence-frames"));
  // The copy holds keys only, so no trapezoid frame can travel with it.
  assert.equal(JSON.stringify(copied).includes("perpendicular"), false);
  const pv = LS.preview(copied.keys, RATIO_ENTRY);
  assert.match(JSON.stringify(pv), /both quantities were multiplied/);
});

t("a copy drops supports the destination lesson cannot deliver", () => {
  const src = LS.normalizeProfile({ keys: ["worked-example", "sentence-frames"] }, "5-3");
  const copied = LS.copyProfileTo(src, "3-1", RATIO_ENTRY, {});
  assert.deepEqual(copied.keys, ["sentence-frames"]);
});

/* ===========================================================================
 * 6. STORED SHAPE. Deltas only, versioned, total on bad input. A support
 *    system that cannot read its own store must render the canonical lesson,
 *    not throw inside a classroom.
 * ======================================================================== */
t("the stored profile carries no curriculum content and no student field", () => {
  const p = LS.normalizeProfile(
    {
      keys: ["word-bank"],
      title: "Trapezoids",
      href: "/lessons/5-3/",
      studentName: "A.B.",
      section: "601",
    },
    "5-3",
  );
  assert.deepEqual(Object.keys(p).sort(), ["keys", "lessonId", "preset", "schemaVersion"]);
  assert.equal(JSON.stringify(p).includes("A.B."), false);
});

t("unknown, duplicated and future keys degrade instead of crashing", () => {
  const p = LS.normalizeProfile(
    { keys: ["word-bank", "word-bank", "future-support-v9", 42, null] },
    "5-3",
  );
  assert.deepEqual(p.keys, ["word-bank"]);
  assert.deepEqual(LS.normalizeProfile(null, "5-3").keys, []);
  assert.deepEqual(LS.normalizeProfile("garbage", "5-3").keys, []);
  assert.equal(LS.normalizeProfile({ keys: [], preset: "no-such-preset" }, "5-3").preset, null);
});

t("an unknown lesson id resolves to nothing rather than to another lesson", () => {
  assert.equal(LS.parseLessonId("bogus"), null);
  assert.equal(LS.parentLessonId("bogus"), null);
  assert.deepEqual(LS.resolveForLesson("bogus", STORE, ENTRY).keys, []);
});

/* ===========================================================================
 * 7. CAPABILITY RESOLUTION + CONFLICT PRECEDENCE.
 * ======================================================================== */
t("support keys resolve to the engine's own capability names", () => {
  const caps = LS.resolveCapabilities([
    "sentence-frames",
    "word-bank",
    "chunk-directions",
    "calculator",
  ]);
  assert.deepEqual(caps.profiles, ["express-thinking"]);
  assert.deepEqual(caps.tools, ["calculator"]);
  assert.deepEqual(caps.adapt, ["iep-chunk-text"]);
  assert.equal(LS.supportsParam(["sentence-frames", "calculator"]), "express-thinking,calculator");
});

t("an explicitly chosen language support outranks reduced visual load", () => {
  const r = LS.resolveConflicts(["reduced-visual-load", "word-bank"]);
  assert.equal(r.collapseOptional, true);
  assert.deepEqual(r.pinned, ["word-bank"]);
  assert.deepEqual(LS.resolveConflicts(["reduced-visual-load"]).pinned, []);
});

/* ===========================================================================
 * 8. MUTATION TESTS. Seed the defects this layer is built to prevent and
 *    confirm the assertions above would actually catch them.
 * ======================================================================== */
t("mutation: a variant credited with no intrinsic support double-stacks, and is caught", () => {
  const broken = { ...ENTRY, variants: { group1: { id: "5-3-group1", intrinsic: [] } } };
  const r = LS.resolveForLesson("5-3-group1", STORE, broken);
  assert.ok(
    r.keys.includes("sentence-frames"),
    "the de-dup check cannot distinguish the two cases",
  );
  assert.deepEqual(r.suppressed, []);
});

t("mutation: a support pointing at no capability is detectable", () => {
  const empty = LS.resolveCapabilities(["no-such-support"]);
  assert.deepEqual(empty, { profiles: [], tools: [], adapt: [] });
  for (const s of LS.CATALOG) {
    const n = (s.profiles || []).length + (s.tools || []).length + (s.adapt || []).length;
    assert.ok(n > 0, `${s.key} names no capability`);
  }
});

t("mutation: reset leaving one delta behind would be visible", () => {
  const store = {
    "5-3": LS.normalizeProfile({ keys: ["word-bank"] }, "5-3"),
    "5-3-group1": LS.normalizeProfile({ keys: ["visual-model"] }, "5-3-group1"),
  };
  delete store["5-3"];
  assert.deepEqual(LS.resolveForLesson("5-3", store, ENTRY).keys, []);
  // The variant's own delta is a separate record and correctly survives.
  assert.deepEqual(LS.resolveForLesson("5-3-group1", store, ENTRY).keys, ["visual-model"]);
});

console.log(`lesson-supports: ${pass} assertions passed`);
