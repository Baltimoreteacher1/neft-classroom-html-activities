// Customize Activity, Workstream D: differentiation presets, tiered versions and transformations.
//   node --test tools/studio-customize-differentiate.test.mjs
// Pins: every preset and tier over every fixture is a fixed point of normalizeActivity with no new validation errors;
// language support never changes a question, a key or the objective (assertRigor, mutation-proven); original keys are
// still accepted by the checker; shorten keeps a question per skill; extension adds only reviewable items listed in
// lineage.added; extend-practice adds only verified items (or says why not); transforms keep keys and facts;
// availableTransforms is honest; every teacher-visible string is English + Spanish; nothing mutates its input.
import assert from "node:assert/strict";
import test from "node:test";
import { checkResponse } from "../access-practice-lab/src/studio/core/check.js";
import {
  applyPreset,
  assertRigor,
  compareVersions,
  keyResponse,
  makeVersion,
  makeVersions,
  PRESETS,
} from "../access-practice-lab/src/studio/core/differentiate.js";
import { allFormats, vocabSample } from "../access-practice-lab/src/studio/core/fixtures.js";
import {
  normalizeActivity,
  questionsOf,
  TIERS,
} from "../access-practice-lab/src/studio/core/schema.js";
import {
  availableTransforms,
  exitTicket,
  runTransform,
  speakingTask,
  toKind,
  transformStatus,
  vocabPractice,
  writingTask,
} from "../access-practice-lab/src/studio/core/transforms.js";
import { validateActivity } from "../access-practice-lab/src/studio/core/validate.js";
import {
  allBilingual,
  assertKeysStillWork,
  assertWellFormed,
  CORRUPTIONS,
  correctStatus,
  deps,
  errorKeys,
  FIXTURES,
  freeze,
  json,
  mathWorksheet,
  reading,
} from "./studio-customize-differentiate-helpers.mjs";

// ── presets ────────────────────────────────────────────────────────────────

test("the preset list is the contract's six, each bilingual, with a dial", () => {
  assert.deepEqual(
    PRESETS.map((p) => p.id),
    [
      "keep",
      "language-support",
      "simplify-directions",
      "increase-challenge",
      "shorten",
      "extend-practice",
    ],
  );
  allBilingual(
    PRESETS.map((p) => p.label),
    "preset label",
  );
  allBilingual(
    PRESETS.map((p) => p.description),
    "preset description",
  );
  assert.throws(() => applyPreset(allFormats(), "nope"), RangeError);
});

test("every preset over every fixture: well-formed, bilingual, keys intact, input untouched", () => {
  for (const [name, make] of Object.entries(FIXTURES))
    for (const p of PRESETS) {
      const source = freeze(make());
      const before = json(source);
      const { activity, changes, warnings } = applyPreset(source, p.id);
      const label = `${name}/${p.id}`;
      assert.equal(json(source), before, `${label}: input mutated`);
      assertWellFormed(source, activity, label);
      assertKeysStillWork(source, activity, label);
      allBilingual(changes, `${label} changes`);
      allBilingual(warnings, `${label} warnings`);
      assert.equal(activity.id, source.id, `${label}: a preset edits the draft in place`);
      assert.deepEqual(activity.context, source.context, `${label}: context (objective) changed`);
      if (p.id === "keep") {
        assert.deepEqual(activity, source);
        assert.equal(changes.length, 0);
      }
    }
});

test("presets are deterministic and the ones that only reshape are idempotent", () => {
  for (const make of Object.values(FIXTURES))
    for (const p of PRESETS) {
      const a = applyPreset(make(), p.id);
      assert.deepEqual(applyPreset(make(), p.id), a, `${p.id}: not deterministic`);
    }
  for (const id of ["keep", "language-support", "simplify-directions"])
    for (const make of Object.values(FIXTURES)) {
      const once = applyPreset(make(), id).activity;
      const twice = applyPreset(once, id);
      assert.deepEqual(twice.activity, once, `${id}: applying twice changed it again`);
      assert.equal(twice.changes.length, 0, `${id}: second run reported changes`);
    }
});

test("language-support: access only. frames, word bank, read-aloud, Spanish where it exists, words first", () => {
  const source = freeze(FIXTURES.reading());
  const { activity, changes, warnings } = applyPreset(source, "language-support");
  const s = activity.supports;
  assert.deepEqual(
    [s.readAloud, s.chunk, s.frames, s.hints, s.spanish],
    [true, true, true, true, true],
  );
  assert.ok(changes.length >= 4);
  const types = activity.blocks.map((b) => b.type);
  assert.ok(
    types.indexOf("vocab") < types.indexOf("passage"),
    "word list comes before the passage",
  );
  assert.equal(activity.blocks.find((b) => b.id === "b1").bank, true, "blank got a word bank");
  assert.equal(
    activity.blocks.find((b) => b.id === "s1").frame.length > 0,
    true,
    "short question got a frame",
  );
  assert.equal(assertRigor(source, activity).ok, true);
  assert.equal(
    warnings.some((w) => /Spanish/.test(w.en)),
    false,
  );
  // No Spanish data: the flag is not turned on and the teacher is told.
  const none = applyPreset(freeze(FIXTURES.vocabSample()), "language-support");
  assert.equal(none.activity.supports.spanish, false);
  assert.ok(none.warnings.some((w) => /Spanish/.test(w.en)));
  assert.equal(none.activity.supports.visuals, false);
});

test("language-support never replaces a teacher's own frame or text", () => {
  const source = freeze(FIXTURES.allFormats());
  const teacherFrame = questionsOf(source).find((q) => q.id === "q-short").frame;
  const { activity } = applyPreset(source, "language-support");
  assert.equal(questionsOf(activity).find((q) => q.id === "q-short").frame, teacherFrame);
  assert.equal(
    json(questionsOf(activity).map((q) => q.prompt)),
    json(questionsOf(source).map((q) => q.prompt)),
  );
});

test("simplify-directions only splits: same words, numbered steps, reported", () => {
  const source = freeze(FIXTURES.reading());
  const { activity, changes } = applyPreset(source, "simplify-directions");
  const was = source.blocks.find((b) => b.id === "d1").text;
  const now = activity.blocks.find((b) => b.id === "d1").text;
  const steps = now.split("\n\n");
  assert.equal(steps.length, 4, now);
  assert.ok(steps.every((s, i) => s.startsWith(`${i + 1}. `)));
  const bag = (t) =>
    t
      .toLowerCase()
      .replace(/\d+\.\s/g, "")
      .replace(/[^a-z ]/g, " ")
      .split(/\s+/)
      .filter((w) => w && w !== "then")
      .sort();
  assert.deepEqual(bag(now), bag(was), "no word was replaced or added");
  assert.equal(changes.length, 1);
  assert.equal(json(questionsOf(activity)), json(questionsOf(source)));
  // "if ... then ..." stays one idea; abbreviations do not split.
  const cond = normalizeActivity({
    ...reading(),
    blocks: [
      {
        id: "d1",
        type: "text",
        role: "directions",
        text: "Ask Mr. Neft if you are stuck then try again. Check your work.",
      },
      ...reading().blocks.slice(1),
    ],
  });
  const text = applyPreset(cond, "simplify-directions").activity.blocks[0].text;
  assert.match(text, /1\. Ask Mr\. Neft if you are stuck then try again\./);
});

test("simplify-directions with nothing to split changes nothing and says why", () => {
  const { activity, changes, warnings } = applyPreset(
    freeze(FIXTURES.vocabSample()),
    "simplify-directions",
  );
  assert.deepEqual(changes, []);
  assert.equal(warnings.length, 1);
  assert.deepEqual(activity, FIXTURES.vocabSample());
});

test("shorten: fewer questions, at least one per skill, never zero, objective kept", () => {
  for (const [name, make] of Object.entries(FIXTURES)) {
    const source = freeze(make());
    const { activity, changes, warnings } = applyPreset(source, "shorten");
    const skills = (a) =>
      new Set(questionsOf(a).map((q) => q.skill.trim().toLowerCase() || `format:${q.format}`));
    assert.ok(questionsOf(activity).length >= 1, `${name}: zero questions`);
    assert.deepEqual(
      [...skills(activity)].sort(),
      [...skills(source)].sort(),
      `${name}: lost a skill`,
    );
    assert.equal(activity.context.objective, source.context.objective);
    assert.ok(changes.length > 0 || warnings.length > 0);
    // What stays is untouched.
    const byId = new Map(questionsOf(source).map((q) => [q.id, q]));
    for (const q of questionsOf(activity)) assert.equal(json(q), json(byId.get(q.id)));
  }
  const math = applyPreset(freeze(FIXTURES.mathWorksheet()), "shorten");
  assert.ok(questionsOf(math.activity).length < questionsOf(FIXTURES.mathWorksheet()).length);
  const one = normalizeActivity({ ...vocabSample(), blocks: vocabSample().blocks.slice(0, 2) });
  const kept = applyPreset(freeze(one), "shorten");
  assert.equal(questionsOf(kept.activity).length, 1);
  assert.equal(kept.warnings.length, 1, "already as short as it can be");
  const game = allFormats("game");
  assert.ok(
    questionsOf(applyPreset(freeze(game), "shorten").activity).length >= 3,
    "a game stays playable",
  );
});

test("increase-challenge adds only reviewable written items, tracked in lineage.added", () => {
  const source = freeze(FIXTURES.reading());
  const { activity, changes } = applyPreset(source, "increase-challenge");
  const added = questionsOf(activity).filter(
    (q) => !questionsOf(source).some((o) => o.id === q.id),
  );
  assert.equal(added.length, 2);
  for (const q of added) {
    assert.equal(q.format, "short");
    assert.ok(
      q.hint && q.explanation && q.rubric.length > 0,
      `${q.id} needs hint, explanation, rubric`,
    );
    assert.equal(q.sample, "", "no invented sample answer");
    assert.ok(activity.lineage.added.includes(q.id));
    assert.equal(checkResponse(q, keyResponse(q)).status, "review", "never auto-graded");
  }
  assert.match(added[0].prompt, /because.*but.*so/s);
  assert.match(
    added[0].prompt,
    /Mia plants seeds in the spring/,
    "built from the activity's own sentence",
  );
  assert.equal(changes.length, 1);
  // Original questions are untouched and in order.
  assert.deepEqual(questionsOf(activity).slice(0, questionsOf(source).length), questionsOf(source));
  // Nothing to build from: nothing added.
  const bare = normalizeActivity({ ...vocabSample(), blocks: vocabSample().blocks.slice(1) });
  const none = applyPreset(freeze(bare), "increase-challenge");
  assert.equal(questionsOf(none.activity).length, questionsOf(bare).length);
  assert.equal(none.warnings.length, 1);
  assert.equal(none.activity.lineage, null);
});

test("extend-practice: only verified math or the activity's own vocabulary, else nothing and a warning", () => {
  const math = freeze(FIXTURES.mathWorksheet());
  const r = applyPreset(math, "extend-practice");
  const addedMath = questionsOf(r.activity).filter(
    (q) => !questionsOf(math).some((o) => o.id === q.id),
  );
  assert.ok(addedMath.length >= 1, "added generated math");
  for (const q of addedMath) {
    assert.equal(q.skill, "equivalent-ratios");
    assert.equal(correctStatus(q), "correct", "key accepted by the checker");
    assert.ok(r.activity.lineage.added.includes(q.id));
  }
  assert.deepEqual(validateActivity(r.activity).errors, []);
  const prompts = questionsOf(r.activity).map((q) => `${q.format}|${q.prompt}`);
  assert.equal(new Set(prompts).size, prompts.length, "no duplicate of an existing question");

  const vocab = freeze(FIXTURES.vocabSample());
  const v = applyPreset(vocab, "extend-practice");
  const terms = new Set(["habitat", "predator", "producer"]);
  const defs = new Set(vocab.blocks[0].items.map((i) => i.def));
  const addedVocab = questionsOf(v.activity).filter(
    (q) => !questionsOf(vocab).some((o) => o.id === q.id),
  );
  assert.ok(addedVocab.length >= 3);
  for (const q of addedVocab) {
    if (q.format === "choice")
      assert.ok(
        q.options.every((o) => defs.has(o.text)),
        "options are the given meanings",
      );
    else assert.ok(terms.has(q.text.replace(/[\[\]]/g, "")), "blank answer is a given term");
    assert.equal(correctStatus(q), "correct");
  }

  const nothing = applyPreset(freeze(FIXTURES.reading()), "extend-practice");
  assert.equal(questionsOf(nothing.activity).length, questionsOf(FIXTURES.reading()).length);
  assert.equal(nothing.warnings.length, 1);
  assert.deepEqual(nothing.changes, []);
  assert.equal(nothing.activity.lineage, null);
});

// ── tiers ──────────────────────────────────────────────────────────────────

test("every tier over every fixture is well-formed and passes assertRigor", () => {
  for (const [name, make] of Object.entries(FIXTURES))
    for (const tier of TIERS) {
      const source = freeze(make());
      const before = json(source);
      const { activity, changes, warnings } = makeVersion(source, tier, deps);
      const label = `${name}/${tier}`;
      assert.equal(json(source), before, `${label}: input mutated`);
      assertWellFormed(source, activity, label);
      assertKeysStillWork(source, activity, label);
      assert.deepEqual(assertRigor(source, activity), { ok: true, problems: [] }, label);
      allBilingual(changes, `${label} changes`);
      allBilingual(warnings, `${label} warnings`);
      assert.match(activity.id, /^s[a-f0-9]{10}$/);
      assert.notEqual(activity.id, source.id);
      assert.equal(activity.rev, 0);
      assert.ok(
        activity.title.endsWith(`(${tier[0].toUpperCase()}${tier.slice(1)})`),
        activity.title,
      );
      assert.equal(activity.lineage.variantOf, source.id);
      assert.equal(activity.lineage.tier, tier);
      assert.equal(activity.context.objective, source.context.objective);
    }
});

test("makeVersion default id has the studio's uid style; makeVersions makes the four, distinct", () => {
  const source = freeze(FIXTURES.reading());
  const one = makeVersion(source, "emerging");
  assert.match(one.activity.id, /^s[a-f0-9]{10}$/);
  const all = makeVersions(source, undefined, deps);
  assert.deepEqual(
    all.map((v) => v.tier),
    [...TIERS],
  );
  assert.equal(new Set(all.map((v) => v.activity.id)).size, 4);
  assert.throws(() => makeVersion(source, "advanced"), RangeError);
});

test("versions merge the source lineage and keep family, ref, title, url and hash", () => {
  const src = normalizeActivity({
    ...reading(),
    lineage: {
      family: "access-bank",
      ref: "u1/set-3",
      title: "Platform title",
      url: "/access-practice-lab/x/",
      sourceHash: "abc123",
      added: ["c1"],
    },
  });
  const v = makeVersion(freeze(src), "extension", deps).activity;
  assert.deepEqual(
    { ...v.lineage, added: undefined },
    {
      family: "access-bank",
      ref: "u1/set-3",
      title: "Platform title",
      url: "/access-practice-lab/x/",
      sourceHash: "abc123",
      variantOf: src.id,
      tier: "extension",
      added: undefined,
    },
  );
  assert.ok(v.lineage.added.includes("c1"), "earlier additions stay listed");
  assert.ok(v.lineage.added.length >= 3);
});

test("emerging: read-aloud, parts, words first, short steps, frames, banks, Spanish where it exists", () => {
  const { activity: a } = makeVersion(freeze(FIXTURES.reading()), "emerging", deps);
  assert.deepEqual(
    [
      a.supports.wida,
      a.supports.readAloud,
      a.supports.chunk,
      a.supports.frames,
      a.supports.hints,
      a.supports.spanish,
    ],
    [2, true, true, true, true, true],
  );
  const types = a.blocks.map((b) => b.type);
  assert.ok(types.indexOf("vocab") < types.indexOf("passage"));
  assert.equal(a.blocks.find((b) => b.id === "d1").text.split("\n\n").length, 4);
  assert.equal(a.blocks.find((b) => b.id === "b1").bank, true);
  assert.ok(
    a.blocks.find((b) => b.id === "c1").frame,
    "choice questions get a sentence frame at this tier",
  );
  const wida1 = makeVersion(
    normalizeActivity({ ...reading(), supports: { wida: 1 } }),
    "emerging",
  ).activity;
  assert.equal(wida1.supports.wida, 1);
});

test("developing and expanding: fewer supports, no chunking, frames shrink; extension removes them", () => {
  const dev = makeVersion(freeze(FIXTURES.reading()), "developing", deps).activity;
  const exp = makeVersion(freeze(FIXTURES.reading()), "expanding", deps).activity;
  const ext = makeVersion(freeze(FIXTURES.reading()), "extension", deps).activity;
  assert.deepEqual([dev.supports.wida, exp.supports.wida, ext.supports.wida], [3, 4, 5]);
  assert.equal(dev.supports.chunk, false);
  assert.equal(dev.supports.frames && exp.supports.frames, true);
  assert.equal(ext.supports.frames, false);
  assert.equal(dev.blocks.find((b) => b.id === "b1").bank, true);
  assert.equal(exp.blocks.find((b) => b.id === "b1").bank, false, "expanding adds no word bank");
  assert.equal(
    exp.blocks.find((b) => b.id === "c1").frame,
    "",
    "expanding frames only written answers",
  );
  assert.ok(
    exp.blocks.find((b) => b.id === "s1").frame.length <
      dev.blocks.find((b) => b.id === "s1").frame.length,
  );
  const types = dev.blocks.map((b) => b.type);
  assert.ok(
    types.indexOf("passage") < types.indexOf("vocab"),
    "developing leaves the word list where it was",
  );
});

test("only the extension tier adds questions; each has hint, explanation, rubric and is listed", () => {
  for (const [name, make] of Object.entries(FIXTURES)) {
    const source = make();
    for (const tier of TIERS) {
      const v = makeVersion(freeze(source), tier, deps).activity;
      const ids = new Set(questionsOf(source).map((q) => q.id));
      const added = questionsOf(v).filter((q) => !ids.has(q.id));
      if (tier !== "extension") assert.equal(added.length, 0, `${name}/${tier} added a question`);
      for (const q of added) {
        assert.ok(q.hint && q.explanation && q.rubric.length, `${name}: incomplete added item`);
        assert.ok(v.lineage.added.includes(q.id));
      }
    }
  }
  const ext = makeVersion(freeze(FIXTURES.reading()), "extension", deps);
  assert.equal(ext.activity.lineage.added.length, 2);
  const bare = normalizeActivity({
    ...FIXTURES.allFormats(),
    blocks: FIXTURES.allFormats().blocks.filter((b) => ["q-choice", "q-number"].includes(b.id)),
  });
  const noText = makeVersion(freeze(bare), "extension", deps);
  assert.deepEqual(noText.activity.lineage.added, [], "nothing to build from: nothing added");
  assert.ok(noText.warnings.some((w) => /challenge/.test(w.en)));
});

// ── rigor, mutation-proven ─────────────────────────────────────────────────

test("assertRigor fails on a corrupted key, a dropped question, a changed objective, prompt, format or extra question", () => {
  for (const make of [FIXTURES.allFormats, FIXTURES.reading, FIXTURES.mathWorksheet]) {
    const source = freeze(make());
    const good = makeVersion(source, "emerging", deps).activity;
    assert.equal(assertRigor(source, good).ok, true);
    const mutate = (fn) => {
      const copy = structuredClone(good);
      fn(copy);
      return normalizeActivity(copy);
    };
    for (const [code, fn] of CORRUPTIONS) {
      const bad = mutate(fn);
      const r = assertRigor(source, bad);
      assert.equal(r.ok, false, `${source.id}: corruption "${code}" not caught`);
      assert.ok(
        r.problems.some((p) => p.code === code),
        `${source.id}: expected ${code}, got ${r.problems.map((p) => p.code)}`,
      );
      allBilingual(r.problems, `problem ${code}`);
    }
  }
});

test("assertRigor on an extension version flags an added item without a hint or not listed", () => {
  const source = freeze(FIXTURES.reading());
  const ext = makeVersion(source, "extension", deps).activity;
  assert.equal(assertRigor(source, ext).ok, true);
  const noHint = structuredClone(ext);
  const added = noHint.blocks.find(
    (b) =>
      b.id ===
      noHint.lineage.added.find((id) =>
        noHint.blocks.some((x) => x.id === id && x.type === "question"),
      ),
  );
  added.hint = "";
  assert.ok(
    assertRigor(source, normalizeActivity(noHint)).problems.some(
      (p) => p.code === "added-incomplete",
    ),
  );
  const unlisted = structuredClone(ext);
  unlisted.lineage.added = [];
  assert.ok(
    assertRigor(source, normalizeActivity(unlisted)).problems.some(
      (p) => p.code === "added-unlisted",
    ),
  );
});

// ── comparison ─────────────────────────────────────────────────────────────

test("compareVersions rows are correct on a sample", () => {
  const source = freeze(FIXTURES.reading());
  const versions = makeVersions(source, ["emerging", "extension"], deps).map((v) => v.activity);
  const table = compareVersions([source, ...versions]);
  assert.equal(table.columns.length, 3);
  assert.deepEqual(
    table.columns.map((c) => c.tier),
    ["", "emerging", "extension"],
  );
  const row = (key) => table.rows.find((r) => r.key === key).values;
  assert.deepEqual(row("wida"), [0, 2, 5]);
  assert.deepEqual(row("readAloud"), [false, true, false]);
  assert.deepEqual(row("frames"), [false, true, false]);
  assert.deepEqual(row("questions"), [3, 3, 5]);
  assert.deepEqual(row("frameCount"), [0, 2, 0]);
  assert.deepEqual(row("wordBank"), [0, 1, 0]);
  assert.deepEqual(row("vocabPreview"), [0, 3, 0]);
  assert.deepEqual(row("directionSteps"), [1, 4, 1]);
  assert.equal(row("passageChunks")[0], 0);
  assert.ok(row("passageChunks")[1] >= 2);
  assert.ok(row("readingWords")[0] > 0 && row("readingWords")[2] > row("readingWords")[0]);
  assert.deepEqual(row("added"), [0, 0, 2]);
  assert.deepEqual(row("sameObjective"), [true, true, true]);
  assert.deepEqual(row("sameAnswerKeys"), [true, true, true]);
  assert.equal(table.sameObjective && table.sameAnswerKeys, true);
  allBilingual(
    table.rows.map((r) => r.label),
    "row label",
  );
  // A shortened version does not have the same keys as the original's question set.
  const short = applyPreset(source, "shorten").activity;
  const cmp = compareVersions([source, short]);
  assert.equal(cmp.sameObjective, true);
});

// ── transforms ─────────────────────────────────────────────────────────────

const sameKeys = (source, out, ids) => {
  const byId = new Map(questionsOf(source).map((q) => [q.id, q]));
  for (const q of questionsOf(out).filter((x) => ids.includes(x.id)))
    assert.equal(json(q), json(byId.get(q.id)), `${q.id} changed`);
};

test("toKind wraps convertActivity: same questions and keys, returns its notes", () => {
  const source = freeze(FIXTURES.allFormats());
  const r = toKind(source, "worksheet");
  assert.equal(r.ran, true);
  assert.equal(r.activity.kind, "worksheet");
  assert.equal(r.activity.id, source.id);
  assert.ok(r.notes.length > 0);
  allBilingual(r.notes, "toKind notes");
  assert.deepEqual(questionsOf(r.activity), questionsOf(source));
  assert.equal(toKind(source, "interactive").ran, false, "same kind");
  assert.equal(
    toKind(freeze(FIXTURES.vocabSample()), "game").ran,
    false,
    "a game needs three questions",
  );
});

test("vocabPractice builds only from the word list; keys check; objective and lineage kept", () => {
  for (const make of [FIXTURES.vocabSample, FIXTURES.reading, FIXTURES.allFormats]) {
    const source = freeze(make());
    const items = source.blocks.find((b) => b.type === "vocab").items;
    const r = vocabPractice(source, deps);
    if (items.length < 2) {
      assert.equal(r.ran, false);
      continue;
    }
    assert.equal(r.ran, true);
    assertWellFormed(source, r.activity, "vocabPractice");
    assert.equal(r.activity.context.objective, source.context.objective);
    assert.equal(r.activity.lineage.variantOf, source.id);
    allBilingual(r.notes, "vocabPractice notes");
    const terms = new Set(items.map((i) => i.term.toLowerCase()));
    const defs = new Set(items.map((i) => i.def));
    const qs = questionsOf(r.activity);
    assert.ok(qs.length >= 2);
    for (const q of qs) {
      assert.equal(correctStatus(q), "correct");
      if (q.format === "choice") assert.ok(q.options.every((o) => defs.has(o.text)));
      if (q.format === "match")
        assert.ok(q.pairs.every((p) => terms.has(p.left.toLowerCase()) && defs.has(p.right)));
      if (q.format === "blank") assert.ok(!/\[\[[^\]]+\]\]/.test(q.text) || q.skill);
      assert.ok(r.activity.lineage.added.includes(q.id));
    }
  }
  assert.equal(vocabPractice(freeze(FIXTURES.mathWorksheet())).ran, false);
});

test("vocabPractice makes an example-sentence blank only from the word's own example", () => {
  const r = vocabPractice(freeze(FIXTURES.reading()), deps);
  const blanks = questionsOf(r.activity).filter((q) => q.skill === "vocabulary in context");
  assert.ok(blanks.length >= 1);
  const examples = ["A seed needs water.", "Plants grow in the sun.", "The ripe fruit is red."];
  for (const q of blanks) assert.ok(examples.includes(q.text.replace(/\[\[|\]\]/g, "")), q.text);
});

test("exitTicket: 3-6 existing auto-checked questions, kind check, keys exactly as they were", () => {
  const source = freeze(FIXTURES.allFormats());
  const r = exitTicket(source, deps);
  assert.equal(r.ran, true);
  assert.equal(r.activity.kind, "check");
  assert.equal(r.activity.template, "exit-ticket");
  const qs = questionsOf(r.activity);
  assert.ok(qs.length >= 3 && qs.length <= 6, `${qs.length}`);
  assert.ok(qs.every((q) => q.format !== "short"));
  sameKeys(
    source,
    r.activity,
    qs.map((q) => q.id),
  );
  assertWellFormed(source, r.activity, "exitTicket");
  assertKeysStillWork(source, r.activity, "exitTicket");
  allBilingual(r.notes, "exitTicket notes");
  assert.equal(r.activity.lineage.variantOf, source.id);
  assert.equal(exitTicket(freeze(FIXTURES.vocabSample())).ran, false);
  const inPlace = exitTicket(source, { inPlace: true });
  assert.equal(inPlace.activity.id, source.id);
  assert.equal(inPlace.activity.title, source.title);
});

test("speakingTask and writingTask: from a passage, rubric, never auto-graded, teacher note", () => {
  const source = freeze(FIXTURES.reading());
  const sp = speakingTask(source, deps);
  assert.equal(sp.ran, true);
  assertWellFormed(source, sp.activity, "speakingTask");
  const q = questionsOf(sp.activity)[0];
  assert.equal(q.format, "short");
  assert.equal(q.kind, "explain");
  assert.ok(q.rubric.length >= 3 && q.frame && q.hint && q.explanation);
  assert.equal(q.sample, "");
  assert.equal(checkResponse(q, "the text is about a garden and seeds").status, "review");
  assert.ok(
    sp.activity.blocks.some((b) => b.type === "note"),
    "teacher note",
  );
  assert.equal(sp.activity.supports.frames, true);
  assert.equal(sp.activity.context.objective, source.context.objective);
  allBilingual(sp.notes, "speaking notes");

  const wr = writingTask(source, deps);
  assert.equal(wr.ran, true);
  assertWellFormed(source, wr.activity, "writingTask");
  assert.ok(
    wr.activity.blocks.some((b) => b.type === "organizer"),
    "planning organizer",
  );
  const wq = questionsOf(wr.activity);
  assert.ok(
    wq.length >= 2 &&
      wq.every((x) => x.format === "short" && x.rubric.length && x.hint && x.explanation),
  );
  assert.match(wq[0].prompt, /because.*but.*so/s);
  assert.ok(wr.activity.lineage.added.includes(wq[0].id));
  allBilingual(wr.notes, "writing notes");

  const audio = normalizeActivity({
    ...vocabSample(),
    blocks: [
      {
        id: "au",
        type: "audio",
        label: "Listen",
        say: "Tom walks to the park with his dog every day after school and they play with a red ball until it gets dark.",
      },
    ],
  });
  assert.equal(
    speakingTask(freeze(audio), deps).ran,
    true,
    "an audio transcript works for speaking",
  );
  assert.equal(writingTask(freeze(audio)).ran, false, "writing needs a passage");
  assert.equal(speakingTask(freeze(FIXTURES.vocabSample())).ran, false);
});

test("availableTransforms lists only what can run, and transformStatus says why the rest cannot", () => {
  for (const [name, make] of Object.entries(FIXTURES)) {
    const source = freeze(make());
    const status = transformStatus(source);
    const ids = availableTransforms(source).map((t) => t.id);
    assert.deepEqual(
      ids,
      status.filter((t) => t.can).map((t) => t.id),
    );
    allBilingual(
      availableTransforms(source).map((t) => t.label),
      `${name} labels`,
    );
    for (const t of status) {
      const r = runTransform(source, t.id, deps);
      assert.equal(r.ran, t.can, `${name}/${t.id}: availability disagrees with running it`);
      if (t.can) {
        assert.deepEqual(
          validateActivity(r.activity).errors.filter(
            (e) => !errorKeys(source).includes(`${e.code}:${e.blockId}`),
          ),
          [],
          `${name}/${t.id}`,
        );
      } else {
        allBilingual([t.reason], `${name}/${t.id} reason`);
        assert.deepEqual(r.activity, source, "unchanged when it cannot run");
        assert.deepEqual(r.notes, [t.reason]);
      }
    }
  }
  const vocab = availableTransforms(freeze(FIXTURES.vocabSample())).map((t) => t.id);
  assert.ok(vocab.includes("vocabPractice"));
  assert.ok(
    !vocab.includes("exitTicket") &&
      !vocab.includes("speakingTask") &&
      !vocab.includes("writingTask"),
  );
  assert.ok(!vocab.includes("toKind:interactive"), "no change to the kind it already is");
  assert.ok(
    !availableTransforms(freeze(FIXTURES.vocabSample())).some((t) => t.id === "toKind:game"),
  );
  assert.deepEqual(runTransform(freeze(FIXTURES.allFormats()), "nope").ran, false);
});

test("no transform or preset adds a timer, and every output keeps timers off", () => {
  for (const make of Object.values(FIXTURES)) {
    const source = freeze(make());
    for (const t of transformStatus(source).filter((x) => x.can))
      assert.equal(runTransform(source, t.id, deps).activity.options.timer, false);
    for (const tier of TIERS)
      assert.equal(makeVersion(source, tier, deps).activity.options.timer, false);
    assert.ok(
      !/timer|countdown|seconds|minutes/i.test(
        json(applyPreset(source, "language-support").changes),
      ),
    );
  }
});
