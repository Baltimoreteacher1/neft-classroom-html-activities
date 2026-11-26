// Studio X: Teacher Resource Recipes (access-practice-lab/src/studio/x/recipes.js).
//   node --test tools/studio-x-recipes.test.mjs
// Pins: normalizeRecipe is the only entry (caps sizes, strips unknown fields, refuses other schemas); a recipe captured
// from an activity holds structure only (no topic words, questions, answers or images); applying it to another topic
// reproduces the structure from the NEW source and leaks nothing from the old one; slots no compatible component can fill
// are reported in review[] and never filled with unrelated content; the six built-in recipes only use steps the model can
// express and really fill from a suitable source; outputs pass normalizeActivity + validateActivity and are deterministic.
import assert from "node:assert/strict";
import test from "node:test";
import { makeVersion } from "../access-practice-lab/src/studio/core/differentiate.js";
import {
  FORMATS,
  normalizeActivity,
  questionsOf,
} from "../access-practice-lab/src/studio/core/schema.js";
import { validateActivity } from "../access-practice-lab/src/studio/core/validate.js";
import {
  applyRecipe,
  builtinRecipes,
  normalizeRecipe,
  RECIPE_SCHEMA,
  recipeFromActivity,
} from "../access-practice-lab/src/studio/x/recipes.js";

const ID = { newId: () => "sfixed0002" };
const NILE = {
  sourceText:
    "The Nile River flows north through Egypt. Ancient Egyptians farmed along its banks because the yearly flood left rich soil. They grew wheat and barley. Boats carried people and goods up and down the river. The river gave Egypt water, food and a road.",
  vocab: [
    { term: "flood", def: "a large amount of water covering dry land" },
    { term: "soil", def: "the top layer of earth where plants grow" },
    { term: "barley", def: "a grain used for food" },
    { term: "delta", def: "land shaped like a triangle where a river meets the sea" },
  ],
  terms: ["flood", "soil", "barley", "delta"],
  topic: "the Nile",
};
const VOLCANO = {
  sourceText:
    "A volcano is an opening in the Earth's crust. Hot melted rock called magma rises from deep below the ground. When pressure builds, the magma erupts as lava and ash. Lava cools into new hard rock over many years. Some volcanoes sleep for centuries before they wake.",
  vocab: [
    { term: "magma", def: "hot melted rock under the ground" },
    { term: "lava", def: "melted rock that reaches the surface" },
    { term: "crust", def: "the thin outer layer of the Earth" },
    { term: "erupt", def: "to burst out with force" },
  ],
  terms: ["magma", "lava", "crust", "erupt"],
  topic: "volcanoes",
};

const sound = (activity) => {
  assert.ok(activity, "an activity");
  assert.deepEqual(normalizeActivity(activity), activity, "fixed point of normalizeActivity");
  const check = validateActivity(activity);
  assert.equal(check.ok, true, JSON.stringify(check.errors));
};
const shape = (a) => a.blocks.map((b) => (b.type === "question" ? `q:${b.format}` : b.type));
const tokens = (text) =>
  new Set(
    String(text)
      .toLowerCase()
      .match(/\p{L}{4,}/gu) || [],
  );
const strings = (value, out = []) => {
  if (typeof value === "string") out.push(value);
  else if (value && typeof value === "object")
    for (const v of Object.values(value)) strings(v, out);
  return out;
};
const pairOk = (p, where) => {
  assert.ok(p?.en?.trim(), `${where}: English`);
  assert.ok(p?.es?.trim() && p.es !== p.en, `${where}: Spanish`);
};
const unfilled = (review) =>
  review.filter((r) => r.code === "step-unfilled" || r.code === "step-partial");

test("normalizeRecipe is the only entry: caps sizes, strips unknown fields, refuses other schemas", () => {
  const dirty = {
    schema: RECIPE_SCHEMA,
    id: "bad id!",
    name: `${"n".repeat(300)}`,
    kind: "worksheet",
    template: "not-a-template",
    tier: "nope",
    evil: "<script>",
    __proto__: { polluted: true },
    supports: { wida: 9, frames: true, hints: false, spanish: "yes", unknown: true },
    steps: [
      {
        block: "question",
        format: "choice",
        count: 99,
        prompt: "Why is the sky blue?",
        answer: "scattering",
      },
      { block: "question", format: "not-a-format" },
      { block: "script" },
      { block: "organizer", organizer: "bogus", extra: 1 },
      ...Array.from({ length: 60 }, () => ({ block: "passage" })),
    ],
  };
  const r = normalizeRecipe(dirty);
  assert.equal(r.schema, RECIPE_SCHEMA);
  assert.equal(r.name.length, 80);
  assert.equal(r.template, "guided", "unknown template falls back to the kind's first");
  assert.equal(r.tier, "");
  assert.equal(r.steps.length, 14);
  assert.deepEqual(r.steps[0], { block: "question", format: "choice", count: 8 });
  assert.deepEqual(r.steps[1], { block: "organizer", count: 1, organizer: "web" });
  assert.deepEqual(r.supports, {
    wida: 0,
    visuals: false,
    spanish: false,
    readAloud: false,
    frames: true,
    hints: false,
    chunk: false,
  });
  assert.match(r.id, /^[a-z][a-z0-9_-]{0,31}$/i);
  assert.deepEqual(Object.keys(r).sort(), [
    "id",
    "kind",
    "name",
    "schema",
    "steps",
    "supports",
    "template",
    "tier",
  ]);
  assert.ok(!JSON.stringify(r).includes("sky"), "no step carries question text");
  assert.deepEqual(normalizeRecipe(r), r, "fixed point");
  assert.deepEqual(normalizeRecipe(dirty), r, "deterministic id");
  assert.equal(normalizeRecipe({ schema: "lp-recipe/2", steps: [] }), null);
  assert.equal(normalizeRecipe(null), null);
  assert.equal(normalizeRecipe("x"), null);
  assert.equal(
    normalizeRecipe({ steps: [] }).schema,
    RECIPE_SCHEMA,
    "a missing schema is read as the current one",
  );
});

test("a captured recipe holds structure only", () => {
  const reading = builtinRecipes().find((b) => b.id === "reading-vocab-comprehension").recipe;
  const made = applyRecipe(reading, NILE, ID).activity;
  sound(made);
  const recipe = recipeFromActivity(made, "My reading routine");
  assert.equal(recipe.name, "My reading routine");
  assert.equal(recipe.kind, made.kind);
  assert.equal(recipe.template, made.template);
  assert.deepEqual(
    recipe.steps.map((s) => (s.block === "question" ? `${s.format}x${s.count}` : s.block)),
    ["directions", "passage", "vocab", "identifyx1", "blankx2", "orderx1", "shortx1"],
  );
  const json = JSON.stringify(recipe);
  const topicWords = new Set();
  for (const text of strings([
    made.blocks.filter((b) => b.type !== "text"),
    NILE.sourceText,
    NILE.vocab,
  ]))
    for (const w of tokens(text)) topicWords.add(w);
  const structural = new Set([
    "question",
    "block",
    "format",
    "count",
    "passage",
    "vocab",
    "directions",
    "schema",
    "kind",
    "template",
    "supports",
    "steps",
    "name",
    "interactive",
    "reading",
    "short",
    "order",
    "blank",
    "identify",
    "explain",
    "frames",
    "hints",
    "tier",
  ]);
  for (const w of tokens(json))
    assert.ok(structural.has(w) || !topicWords.has(w), `recipe leaked "${w}"`);
  for (const q of questionsOf(made)) {
    assert.ok(!json.includes(q.prompt), "no question text");
    if (q.answer) assert.ok(!json.includes(`"${q.answer}"`), "no answer");
  }
  assert.ok(!json.includes("data:image"), "no images");
  assert.ok(!/teacher|notes|misconception/i.test(json), "no teacher-only content");
});

test("round trip: the same structure for a different topic, with nothing from the first topic", () => {
  const reading = builtinRecipes().find((b) => b.id === "reading-vocab-comprehension").recipe;
  const first = applyRecipe(reading, NILE, ID);
  assert.deepEqual(unfilled(first.review), []);
  const recipe = recipeFromActivity(first.activity, "Reading routine");
  const second = applyRecipe(recipe, VOLCANO, ID);
  sound(second.activity);
  assert.deepEqual(unfilled(second.review), []);
  assert.deepEqual(
    shape(second.activity),
    shape(first.activity),
    "same order of parts and formats",
  );
  assert.equal(second.activity.kind, first.activity.kind);
  assert.equal(second.activity.template, first.activity.template);
  assert.equal(second.activity.blocks.find((b) => b.type === "passage").text, VOLCANO.sourceText);
  assert.deepEqual(
    second.activity.blocks.find((b) => b.type === "vocab").items.map((v) => [v.term, v.def]),
    VOLCANO.vocab.map((v) => [v.term, v.def]),
  );
  assert.match(second.activity.title, /^Volcanoes: /);
  // Nothing of the first topic survives anywhere in the new activity.
  const old = new Set([...tokens(NILE.sourceText), ...tokens(JSON.stringify(NILE.vocab))]);
  const fresh = new Set([...tokens(VOLCANO.sourceText), ...tokens(JSON.stringify(VOLCANO.vocab))]);
  const generic = new Set(
    tokens(JSON.stringify(applyRecipe(reading, { ...VOLCANO, topic: "" }, ID).activity)),
  );
  for (const text of strings(second.activity)) {
    for (const w of tokens(text))
      assert.ok(
        !(old.has(w) && !fresh.has(w) && !generic.has(w)),
        `leaked "${w}" from the first topic`,
      );
  }
  // Deterministic, and neither input is changed.
  const snapshot = structuredClone([recipe, VOLCANO]);
  assert.deepEqual(applyRecipe(recipe, VOLCANO, ID).activity, second.activity);
  assert.deepEqual([recipe, VOLCANO], snapshot);
});

test("supports and the differentiation tier are part of the structure", () => {
  const reading = builtinRecipes().find((b) => b.id === "reading-vocab-comprehension").recipe;
  const base = applyRecipe(reading, NILE, ID).activity;
  const tiered = makeVersion(base, "emerging", ID).activity;
  const recipe = recipeFromActivity(tiered, "Emerging reading");
  assert.equal(recipe.tier, "emerging");
  assert.equal(recipe.supports.readAloud, true);
  assert.equal(recipe.supports.frames, true);
  const out = applyRecipe(recipe, VOLCANO, ID);
  sound(out.activity);
  assert.equal(out.activity.lineage.tier, "emerging");
  assert.equal(out.activity.supports.readAloud, true);
  assert.ok(
    questionsOf(out.activity).some((q) => q.frame),
    "frames were added through the support layer",
  );
});

test("a slot nothing compatible can fill is reported and never filled with unrelated content", () => {
  const recipe = normalizeRecipe({
    name: "Mixed",
    kind: "interactive",
    template: "explore-practice",
    steps: [
      { block: "directions" },
      { block: "passage" },
      { block: "image" },
      { block: "table" },
      { block: "question", format: "hotspot" },
      { block: "question", format: "sort" },
      { block: "question", format: "choice", count: 2 },
    ],
  });
  // Vocabulary only: there is no passage and no categories, and the studio never makes pictures or tables.
  const { activity, review } = applyRecipe(
    recipe,
    { vocab: VOLCANO.vocab, terms: VOLCANO.terms, topic: "volcanoes" },
    ID,
  );
  sound(activity);
  const gaps = unfilled(review);
  assert.deepEqual(
    gaps.map((g) => g.step),
    [2, 3, 4, 5, 6],
  );
  for (const g of gaps) pairOk(g, `review step ${g.step}`);
  assert.deepEqual(
    shape(activity),
    ["text", "q:choice", "q:choice"],
    "only the compatible slots were filled",
  );
  assert.ok(
    !activity.blocks.some((b) => b.type === "passage" || b.type === "image" || b.type === "table"),
  );
  assert.ok(!questionsOf(activity).some((q) => q.format === "hotspot" || q.format === "sort"));
  // Nothing at all to build from: no activity rather than an empty shell.
  const none = applyRecipe(recipe, {}, ID);
  assert.equal(none.activity, null);
  assert.ok(none.review.some((r) => r.code === "no-questions"));
  // A partly filled slot says how many were asked for and how many were made.
  const partial = applyRecipe(
    { ...recipe, steps: [{ block: "question", format: "match", count: 5 }] },
    { vocab: VOLCANO.vocab, terms: VOLCANO.terms },
    ID,
  );
  assert.ok(partial.review.some((r) => r.code === "step-partial" && /asked for 5/.test(r.en)));
  pairOk(
    partial.review.find((r) => r.code === "step-partial"),
    "partial",
  );
});

test("a math recipe re-targets another verified topic, calculated end to end", () => {
  const math = builtinRecipes().find((b) => b.id === "math-model-error-practice").recipe;
  const percent = applyRecipe(math, { topic: "percent", grade: "6" }, ID);
  sound(percent.activity);
  assert.deepEqual(unfilled(percent.review), []);
  assert.equal(
    percent.activity.blocks.some((b) => b.type === "math"),
    true,
    "a worked example from a calculated problem",
  );
  const recipe = recipeFromActivity(percent.activity, "Math routine");
  const equations = applyRecipe(recipe, { topic: "one-step equations", grade: "6" }, ID);
  sound(equations.activity);
  assert.deepEqual(
    shape(equations.activity),
    shape(percent.activity),
    "same structure for the new topic",
  );
  const skills = new Set(questionsOf(equations.activity).map((q) => q.skill));
  assert.ok(
    skills.size > 0 && [...skills].every((s) => /-equations$/.test(s)),
    `every problem comes from the new topic: ${[...skills]}`,
  );
  assert.ok(!skills.has("percent"), "nothing from the first topic");
  assert.ok(!equations.activity.blocks.some((b) => b.type === "math" && /percent|%/i.test(b.text)));
  // A text source cannot fill a math model: reported, not faked.
  const text = applyRecipe(math, { vocab: NILE.vocab, terms: NILE.terms }, ID);
  assert.ok(
    unfilled(text.review).some((r) => r.step === 2),
    "the worked-example step is reported",
  );
  assert.ok(!text.activity?.blocks.some((b) => b.type === "math"));
});

test("the six built-in recipes use only steps the model expresses and fill from a suitable source", () => {
  const list = builtinRecipes();
  assert.equal(list.length, 6);
  assert.equal(new Set(list.map((b) => b.id)).size, 6);
  const sources = {
    "visual-vocab-practice-exit": { vocab: NILE.vocab, terms: NILE.terms },
    "science-evidence-writing": NILE,
    "reading-vocab-comprehension": NILE,
    "speaking-frames-response": NILE,
    "math-model-error-practice": { topic: "equivalent ratios", grade: "6" },
    "small-group-guided-transfer": NILE,
  };
  for (const b of list) {
    pairOk(b.label, `${b.id} label`);
    pairOk(b.about, `${b.id} about`);
    assert.deepEqual(normalizeRecipe(b.recipe), b.recipe, `${b.id} is normalized`);
    assert.equal(b.recipe.steps.length, b.recipe.steps.filter(Boolean).length);
    for (const s of b.recipe.steps) {
      if (s.block === "question") assert.ok(FORMATS.includes(s.format), `${b.id}: ${s.format}`);
    }
    const out = applyRecipe(b.recipe, sources[b.id], ID);
    sound(out.activity);
    assert.deepEqual(unfilled(out.review), [], `${b.id} fills every step from a suitable source`);
    for (const r of out.review) pairOk(r, `${b.id} review ${r.code}`);
    assert.deepEqual(
      applyRecipe(b.recipe, sources[b.id], ID).activity,
      out.activity,
      `${b.id} deterministic`,
    );
    // The same recipe with nothing to build from builds nothing.
    assert.equal(applyRecipe(b.recipe, {}, ID).activity, null, `${b.id} with no source`);
  }
  // The visual-vocabulary recipe asks for pictures; with none in the word list it says so instead of faking them.
  const visual = applyRecipe(list[0].recipe, sources["visual-vocab-practice-exit"], ID);
  assert.equal(visual.activity.supports.visuals, false);
  assert.ok(visual.review.some((r) => r.code === "support-warning"));
  // The speaking recipe's audio plays the source's own text and the writing recipe keeps its evidence organizer.
  const speaking = applyRecipe(
    list.find((b) => b.id === "speaking-frames-response").recipe,
    NILE,
    ID,
  ).activity;
  assert.ok(
    NILE.sourceText.startsWith(speaking.blocks.find((b) => b.type === "audio").say.slice(0, 40)),
  );
  const science = applyRecipe(
    list.find((b) => b.id === "science-evidence-writing").recipe,
    NILE,
    ID,
  ).activity;
  assert.equal(science.blocks.find((b) => b.type === "organizer").kind, "claim-evidence");
});

test("an unreadable recipe builds nothing and says so in both languages", () => {
  for (const bad of [null, "x", { schema: "lp-recipe/9" }]) {
    const out = applyRecipe(bad, NILE, ID);
    assert.equal(out.activity, null);
    assert.equal(out.review[0].code, "bad-recipe");
    pairOk(out.review[0], "bad-recipe");
  }
});
