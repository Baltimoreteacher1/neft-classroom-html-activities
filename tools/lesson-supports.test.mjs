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

/* ===========================================================================
 * 9. EVERY VARIANT CLASS, SYSTEMATICALLY.
 *
 * The first inheritance fix was verified on one lesson's group1. That proves
 * one lesson's group1. These sweep the real manifest so a variant class nobody
 * tested by hand — catch-up, group2, group3 — cannot quietly behave differently.
 * ======================================================================== */
import { readFileSync as _readFileSync } from "node:fs";

const MANIFEST = JSON.parse(
  _readFileSync(join(ROOT, "assets", "learning-supports", "manifest.json"), "utf8"),
);

t("every variant in the curriculum resolves to its parent and de-duplicates", () => {
  const classes = new Set();
  let checked = 0;
  let dedupedSomewhere = 0;
  for (const [lessonId, entry] of Object.entries(MANIFEST)) {
    const applicable = LS.applicableSupports(entry, {}).map((s) => s.key);
    const store = { [lessonId]: LS.normalizeProfile({ keys: applicable }, lessonId) };
    for (const [name, v] of Object.entries(entry.variants || {})) {
      classes.add(name.replace(/\d+$/, "N"));
      const r = LS.resolveForLesson(v.id, store, entry);
      checked++;
      // Nothing a variant already authors is added again …
      for (const k of v.intrinsic || []) {
        assert.ok(!r.keys.includes(k), `${v.id} re-applied its own ${k}`);
      }
      // … and nothing else is lost on the way, except a task modification,
      // which is deliberately parent-only (see the modification test below).
      const expected = applicable.filter(
        (k) => !(v.intrinsic || []).includes(k) && LS.byKey[k].impact !== "modification",
      );
      assert.deepEqual(r.keys.slice().sort(), expected.slice().sort(), v.id);
      if (r.suppressed.length) dedupedSomewhere++;
      // An intrinsic scaffold may never suppress an UNRELATED support. The
      // only other thing allowed in `suppressed` is a task modification.
      for (const k of r.suppressed) {
        assert.ok(
          (v.intrinsic || []).includes(k) || LS.byKey[k].impact === "modification",
          `${v.id} suppressed ${k} for no authored reason`,
        );
      }
    }
  }
  assert.ok(checked > 200, `only ${checked} variants checked`);
  assert.deepEqual([...classes].sort(), ["catchup", "groupN"]);
  assert.ok(dedupedSomewhere > 100, "de-duplication is barely firing — check the intrinsic data");
});

t("a modification does NOT propagate into a small-group variant by default", () => {
  // Small-group lessons are already the more scaffolded pathway. Silently
  // shortening their practice set on top of that is a compounding change to
  // instructional demand that no teacher asked for, so the modification is
  // recorded as parent-only and a variant must opt in for itself.
  const entry = MANIFEST["5-3"];
  // visual-vocabulary, not word-bank: group1 authors its own word bank, so that
  // one is legitimately suppressed and would not prove anything here.
  const store = {
    "5-3": LS.normalizeProfile({ keys: ["shorter-practice-set", "visual-vocabulary"] }, "5-3"),
  };
  const parent = LS.resolveEffectiveSupports({ lessonId: "5-3", store, entry, surface: "screen" });
  assert.deepEqual(parent.modifications, ["shorter-practice-set"]);
  const variant = LS.resolveEffectiveSupports({
    lessonId: "5-3-group1",
    store,
    entry,
    surface: "screen",
  });
  assert.deepEqual(variant.modifications, [], "a task modification propagated into a small group");
  assert.ok(
    variant.active.includes("visual-vocabulary"),
    "de-modifying dropped an unrelated support",
  );
  // A teacher who configures the VARIANT itself is obeyed.
  const opted = LS.resolveEffectiveSupports({
    lessonId: "5-3-group1",
    store: {
      ...store,
      "5-3-group1": LS.normalizeProfile({ keys: ["shorter-practice-set"] }, "5-3-group1"),
    },
    entry,
    surface: "screen",
  });
  assert.deepEqual(opted.modifications, ["shorter-practice-set"]);
});

/* ===========================================================================
 * 17. RE-PACING. Support configuration is keyed by LESSON, so it travels with
 * the lesson wherever the calendar moves it. These pin that, because the
 * alternative — a date key — would silently drop every support the first time
 * a snow day rippled the plan.
 * ======================================================================== */
t("supports follow the lesson, not the day it was scheduled on", () => {
  const store = { "5-3": LS.normalizeProfile({ keys: ["word-bank"] }, "5-3") };
  // Moving a lesson changes nothing this layer can see: there is no date in it.
  assert.equal(JSON.stringify(store).includes("2026"), false);
  assert.deepEqual(LS.resolveForLesson("5-3", store, MANIFEST["5-3"]).keys, ["word-bank"]);
});

t("replacing lesson A with lesson B on a day shows B's configuration, not A's", () => {
  const store = {
    "5-3": LS.normalizeProfile({ keys: ["word-bank", "sentence-frames"] }, "5-3"),
    "3-1": LS.normalizeProfile({ keys: ["visual-vocabulary"] }, "3-1"),
  };
  assert.deepEqual(LS.resolveForLesson("3-1", store, MANIFEST["3-1"]).keys, ["visual-vocabulary"]);
  // And a lesson that was never configured reads as unconfigured even when its
  // neighbour on the calendar is fully configured.
  assert.deepEqual(LS.resolveForLesson("3-2", store, MANIFEST["3-2"]).keys, []);
});

/* ===========================================================================
 * 14. THE FUTURE ROSTER INTERFACE.
 *
 * A per-student system, if one is ever built behind its own privacy review,
 * should be able to ask for support KEYS without this layer learning anything
 * about a student. `resolveEffectiveSupports` already takes a store and a
 * lesson and returns supports; it has no parameter through which a name, a
 * plan status or a proficiency level could arrive. This pins that shape.
 * ======================================================================== */
t("the resolver's interface cannot carry student information", () => {
  const eff = LS.resolveEffectiveSupports({
    lessonId: "5-3",
    store: { "5-3": LS.normalizeProfile({ keys: ["word-bank"] }, "5-3") },
    entry: MANIFEST["5-3"],
    surface: "screen",
    // A caller that tries to smuggle a student through is ignored, not obeyed.
    studentName: "A. B.",
    widaLevel: 2,
    iep: true,
  });
  const serialized = JSON.stringify(eff);
  assert.equal(serialized.includes("A. B."), false);
  assert.equal(serialized.includes("wida"), false);
  assert.equal(serialized.includes("iep"), false);
  assert.deepEqual(eff.active, ["word-bank"]);
});

/* ===========================================================================
 * CLASS SECTIONS (601 / 602 / 603).
 *
 * A class is CONTEXT, not curriculum. All three are taught the same canonical
 * lessons; what differs is the teacher's support selection. These pin the
 * isolation that makes that safe — and pin it against a real localStorage,
 * because the whole point is what crosses a storage boundary.
 * ======================================================================== */
{
  // A minimal localStorage for the module's storage() to find.
  const mem = new Map();
  globalThis.localStorage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
    clear: () => mem.clear(),
  };
  const LS2 = load(); // a fresh module instance that can see that storage
  const reset = () => mem.clear();

  t("the section list is 601 / 602 / 603", () => {
    assert.deepEqual(LS2.sections(), ["601", "602", "603"]);
    assert.ok(LS2.isSection("602"));
    assert.ok(!LS2.isSection("Other"));
    assert.ok(!LS2.isSection("GR"), "a standards domain is not a class section");
  });

  t("the active class is read from the existing teacher-workflow state", () => {
    reset();
    assert.equal(LS2.activeSection(), null);
    // The key the Teacher Workflow card has always written.
    mem.set("curriculumTeacherWorkflow:v1", JSON.stringify({ section: "602", other: "kept" }));
    assert.equal(LS2.activeSection(), "602");
    LS2.setActiveSection("603");
    const state = JSON.parse(mem.get("curriculumTeacherWorkflow:v1"));
    assert.equal(state.section, "603");
    assert.equal(state.other, "kept", "writing the section clobbered the rest of teacher state");
  });

  t("an invalid stored class reads as no class, and is never guessed at", () => {
    reset();
    mem.set("curriculumTeacherWorkflow:v1", JSON.stringify({ section: "Other" }));
    assert.equal(LS2.activeSection(), null);
    mem.set("curriculumTeacherWorkflow:v1", "{not json");
    assert.equal(LS2.activeSection(), null);
  });

  t("601's configuration never appears as 602's", () => {
    reset();
    LS2.saveProfile("5-1", ["visual-vocabulary", "sentence-frames"], null, "601");
    assert.deepEqual(LS2.loadProfile("5-1", "601").keys, ["visual-vocabulary", "sentence-frames"]);
    assert.deepEqual(LS2.loadProfile("5-1", "602").keys, [], "602 inherited 601's configuration");
    assert.deepEqual(LS2.loadProfile("5-1", "603").keys, []);

    LS2.saveProfile("5-1", ["reduced-visual-load", "step-checklist"], null, "602");
    assert.deepEqual(LS2.loadProfile("5-1", "601").keys, ["visual-vocabulary", "sentence-frames"]);
    assert.deepEqual(LS2.loadProfile("5-1", "602").keys, ["reduced-visual-load", "step-checklist"]);
    assert.deepEqual(LS2.loadProfile("5-1", "603").keys, []);
  });

  t("an all-class configuration applies to every class until one overrides it", () => {
    reset();
    // No section: the shape this store has always had.
    LS2.saveProfile("5-1", ["word-bank"], null, null);
    for (const sec of ["601", "602", "603"]) {
      assert.deepEqual(LS2.loadProfile("5-1", sec).keys, ["word-bank"], `${sec} lost the default`);
    }
    LS2.saveProfile("5-1", ["visual-model"], null, "602");
    assert.deepEqual(LS2.loadProfile("5-1", "601").keys, ["word-bank"]);
    assert.deepEqual(LS2.loadProfile("5-1", "602").keys, ["visual-model"]);
  });

  t("resetting one class leaves the others alone", () => {
    reset();
    LS2.saveProfile("5-1", ["word-bank"], null, "601");
    LS2.saveProfile("5-1", ["visual-model"], null, "602");
    LS2.resetProfile("5-1", "601");
    assert.deepEqual(LS2.loadProfile("5-1", "601").keys, []);
    assert.deepEqual(LS2.loadProfile("5-1", "602").keys, ["visual-model"], "reset crossed classes");
  });

  t("inheritance and de-duplication still work inside a class", () => {
    reset();
    LS2.saveProfile("5-3", ["sentence-frames", "word-bank", "visual-vocabulary"], null, "601");
    const store = LS2.readStore("601");
    const r = LS2.resolveForLesson("5-3-group1", store, ENTRY);
    assert.ok(!r.keys.includes("sentence-frames"), "the variant re-applied its own frame");
    // The fixture's group1 authors a sentence frame and a worked example, so
    // only the frame is suppressed here; word-bank is not one of its intrinsics.
    assert.deepEqual(r.suppressed, ["sentence-frames"]);
    assert.ok(r.keys.includes("visual-vocabulary"));
    assert.ok(r.keys.includes("word-bank"));
    // …and the same variant sees nothing at all in a class that configured nothing.
    assert.deepEqual(LS2.resolveForLesson("5-3-group1", LS2.readStore("603"), ENTRY).keys, []);
  });

  t("copying a class setup transfers keys, and nothing else", () => {
    reset();
    LS2.saveProfile("5-1", ["word-bank"], null, "601");
    LS2.saveProfile("5-3", ["visual-model"], null, "601");
    assert.equal(LS2.copySectionSetup("601", "603"), true);
    assert.deepEqual(LS2.loadProfile("5-1", "603").keys, ["word-bank"]);
    assert.deepEqual(LS2.loadProfile("5-3", "603").keys, ["visual-model"]);
    // 602 was not in the transaction.
    assert.deepEqual(LS2.loadProfile("5-1", "602").keys, []);
    assert.equal(LS2.copySectionSetup("601", "601"), false, "copying onto itself is a no-op");
    assert.equal(LS2.copySectionSetup("601", "GR"), false, "a domain is not a copy target");
  });

  /* ------------------------------------------------------------------------
   * SCOPE, AS THE UI ASKS ABOUT IT.
   *
   * The supports surface stopped describing the inheritance model in prose and
   * started rendering it: a tab per scope, each labelled with whether that
   * class is reading the lesson default or has its own override, and a copy
   * control scoped to one lesson. Those three questions are answered by the
   * store, so they are pinned here rather than in the page.
   * --------------------------------------------------------------------- */
  t("the store can say which classes override a lesson, and which follow it", () => {
    reset();
    assert.deepEqual(
      LS2.sectionsOverriding("5-1"),
      [],
      "nothing configured, yet a class overrides",
    );
    LS2.saveProfile("5-1", ["word-bank"], null, null); // the all-class default
    assert.deepEqual(
      LS2.sectionsOverriding("5-1"),
      [],
      "the all-class default was reported as a class override",
    );
    assert.equal(LS2.hasOwnOverride("5-1", "602"), false);

    LS2.saveProfile("5-1", ["visual-model"], null, "602");
    assert.deepEqual(LS2.sectionsOverriding("5-1"), ["602"]);
    assert.equal(LS2.hasOwnOverride("5-1", "602"), true);
    assert.equal(
      LS2.hasOwnOverride("5-1", "601"),
      false,
      "601 follows the default, it does not own it",
    );
    // Per LESSON, not per class: 602 overriding 5-1 says nothing about 5-3.
    assert.deepEqual(LS2.sectionsOverriding("5-3"), []);
  });

  t("clearing the lesson default does NOT erase a class override", () => {
    // The behaviour the surface now states out loud next to the reset button.
    // If this ever changes, the sentence on the page becomes a lie.
    reset();
    LS2.saveProfile("5-1", ["word-bank"], null, null);
    LS2.saveProfile("5-1", ["visual-model"], null, "603");
    LS2.resetProfile("5-1", null);
    assert.deepEqual(LS2.loadProfile("5-1", "601").keys, [], "601 kept a cleared default");
    assert.deepEqual(
      LS2.loadProfile("5-1", "603").keys,
      ["visual-model"],
      "clearing the lesson default silently erased 603's own override",
    );
  });

  t("copying one lesson between classes touches only the destination", () => {
    reset();
    LS2.saveProfile("5-1", ["word-bank"], null, null); // default for everyone
    LS2.saveProfile("5-1", ["visual-model", "step-checklist"], null, "601");
    LS2.saveProfile("5-3", ["sentence-frames"], null, "601"); // a DIFFERENT lesson

    assert.equal(LS2.copyLessonToSection("5-1", "601", "602"), true);
    assert.deepEqual(LS2.loadProfile("5-1", "602").keys, ["visual-model", "step-checklist"]);
    // …and nothing else moved.
    assert.deepEqual(LS2.loadProfile("5-1", null).keys, ["word-bank"], "the lesson default moved");
    assert.deepEqual(
      LS2.loadProfile("5-1", "601").keys,
      ["visual-model", "step-checklist"],
      "the source class was mutated",
    );
    assert.equal(LS2.hasOwnOverride("5-1", "603"), false, "an unnamed class was given an override");
    assert.equal(
      LS2.hasOwnOverride("5-3", "602"),
      false,
      "a lesson-scoped copy carried another lesson across",
    );
    assert.equal(LS2.copyLessonToSection("5-1", "601", "601"), false, "copying onto itself");
    assert.equal(LS2.copyLessonToSection("5-1", "601", "GR"), false, "a domain is not a class");
    assert.equal(LS2.copyLessonToSection("nope", "601", "602"), false, "not a lesson id");
  });

  t("copying from a class that is only inheriting pins what the teacher saw", () => {
    // The 602 tab shows the default's ticks. Copying 602 to 603 must produce
    // that same configuration as 603's own override — not an empty one.
    reset();
    LS2.saveProfile("5-1", ["word-bank"], null, null);
    assert.equal(LS2.hasOwnOverride("5-1", "602"), false);
    assert.equal(LS2.copyLessonToSection("5-1", "602", "603"), true);
    assert.deepEqual(LS2.loadProfile("5-1", "603").keys, ["word-bank"]);
    assert.equal(LS2.hasOwnOverride("5-1", "603"), true, "the copy did not become an override");
    assert.equal(LS2.hasOwnOverride("5-1", "602"), false, "the source class gained an override");
  });

  t("the store holds no student information, per class or otherwise", () => {
    reset();
    LS2.saveProfile("5-1", ["word-bank"], null, "601");
    const raw = mem.get("ewl-lesson-supports:v1");
    assert.match(raw, /601/);
    assert.deepEqual(Object.keys(JSON.parse(raw)).sort(), ["lessons", "schemaVersion", "sections"]);
    for (const banned of [/name/i, /initial/i, /iep/i, /wida/i, /student/i]) {
      assert.doesNotMatch(raw, banned, `class-scoped store carries ${banned}`);
    }
  });

  delete globalThis.localStorage;
}

console.log(`lesson-supports: ${pass} assertions passed`);
