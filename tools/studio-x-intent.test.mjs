// Studio X: the plain-language creation assistant (access-practice-lab/src/studio/x/intent.js).
//   node --test tools/studio-x-intent.test.mjs
// Pins: each example request maps onto an existing kind/template/transform/tier/math topic; the assistant says ok:false
// with concrete choices (never a guess) when content is missing; builds use only the teacher's own words, passages and
// verified math problems; every activity passes normalizeActivity + validateActivity; builds are deterministic;
// every teacher-facing string is English + Spanish; nothing mutates its inputs.
import assert from "node:assert/strict";
import test from "node:test";
import { allFormats } from "../access-practice-lab/src/studio/core/fixtures.js";
import {
  normalizeActivity,
  questionsOf,
  TEMPLATES,
  TIERS,
} from "../access-practice-lab/src/studio/core/schema.js";
import { validateActivity } from "../access-practice-lab/src/studio/core/validate.js";
import { buildFromPlan, interpretRequest } from "../access-practice-lab/src/studio/x/intent.js";

const ID = { newId: () => "sfixed0001" };
const PASSAGE =
  "The Nile River flows north through Egypt. Ancient Egyptians farmed along its banks because the yearly flood left rich soil. They grew wheat and barley. Boats carried people and goods up and down the river. The river gave Egypt water, food and a road.";
const WORDS = [
  ["habitat", "the place where an animal lives"],
  ["producer", "a living thing that makes its own food"],
  ["consumer", "a living thing that eats other living things"],
  ["decomposer", "a living thing that breaks down dead matter"],
  ["predator", "an animal that hunts other animals"],
  ["prey", "an animal that is hunted by other animals"],
  ["food chain", "the path of energy from one living thing to the next"],
  ["food web", "many food chains linked together"],
  ["energy", "the ability to do work"],
  ["organism", "any living thing"],
  ["community", "all the living things in one area"],
  ["population", "all the members of one species in one area"],
];
const VOCAB = WORDS.map(([term, def]) => ({ term, def }));
const LIST = WORDS.map(([t]) => t).join(", ");

const sound = (activity) => {
  assert.ok(activity, "an activity");
  assert.deepEqual(normalizeActivity(activity), activity, "fixed point of normalizeActivity");
  const check = validateActivity(activity);
  assert.equal(check.ok, true, JSON.stringify(check.errors));
};
const pairOk = (p, where) => {
  assert.ok(p && typeof p.en === "string" && p.en.trim(), `${where}: English`);
  assert.ok(typeof p.es === "string" && p.es.trim(), `${where}: Spanish`);
  assert.notEqual(p.es, p.en, `${where}: Spanish is not the English copied`);
};
const allPairs = (res) => {
  pairOk(res.explanation, "explanation");
  for (const c of res.choices) {
    pairOk(c.question, "question");
    assert.ok(c.options.length >= 2);
    for (const o of c.options) pairOk(o.label, "option");
  }
};
const reviewPairs = (review) => {
  for (const r of review) pairOk(r, `review ${r.code}`);
};

test("worksheet about ecosystems with visual vocabulary and sentence frames", () => {
  const text = "Create a worksheet about ecosystems with visual vocabulary and sentence frames";
  const res = interpretRequest(text);
  assert.equal(res.plan.kind, "worksheet");
  assert.equal(res.plan.template, "guided");
  assert.equal(res.plan.topic, "ecosystems");
  assert.deepEqual(res.plan.supports, ["visuals", "frames"]);
  // No words, passage or lesson were given: it must not make up ecosystem content.
  assert.equal(res.ok, false);
  assert.equal(res.plan.confidence, "low");
  assert.deepEqual(
    res.choices.map((c) => c.id),
    ["source"],
  );
  assert.match(res.explanation.en, /do not guess/);
  assert.match(res.explanation.es, /no adivino/);
  allPairs(res);
  assert.equal(buildFromPlan(res.plan, { request: text }).activity, null);

  const context = { vocab: VOCAB, request: text };
  const withWords = interpretRequest(text, {
    vocab: VOCAB,
    sourceText: WORDS.map((w) => w.join(" - ")).join("\n"),
  });
  assert.equal(withWords.ok, true);
  const built = buildFromPlan(
    withWords.plan,
    { ...context, sourceText: WORDS.map((w) => w.join(" - ")).join("\n") },
    ID,
  );
  sound(built.activity);
  assert.equal(built.activity.kind, "worksheet");
  assert.equal(built.activity.supports.frames, true);
  assert.ok(
    questionsOf(built.activity).some((q) => q.frame),
    "frames were added to questions",
  );
  // Pictures were asked for but the words have none: said, not faked.
  assert.equal(built.activity.supports.visuals, false);
  assert.ok(built.review.some((r) => r.code === "support-warning" && /Pictures/.test(r.en)));
  reviewPairs(built.review);
});

test("the same worksheet request in Spanish reads the same plan", () => {
  const res = interpretRequest(
    "Crea una hoja de trabajo sobre los ecosistemas con vocabulario visual y marcos de oraciones",
  );
  assert.equal(res.plan.kind, "worksheet");
  assert.equal(res.plan.topic, "ecosistemas");
  assert.deepEqual(res.plan.supports, ["visuals", "frames"]);
  assert.equal(res.ok, false);
  allPairs(res);
  const game = interpretRequest("Haz un juego con estas palabras: casa, perro, gato");
  assert.equal(game.plan.kind, "game");
  assert.deepEqual(game.plan.terms, ["casa", "perro", "gato"]);
});

test("interactive game from twelve vocabulary words", () => {
  const text = `Make an interactive game using these twelve vocabulary words: ${LIST}`;
  const bare = interpretRequest(text);
  assert.equal(bare.plan.kind, "game");
  assert.equal(bare.plan.template, "quest");
  assert.deepEqual(
    bare.plan.terms,
    WORDS.map(([t]) => t),
  );
  // Words alone are not enough for a game: no meaning is invented.
  assert.equal(bare.ok, false);
  assert.deepEqual(
    bare.choices.map((c) => c.id),
    ["meanings"],
  );
  allPairs(bare);
  const none = buildFromPlan(bare.plan, { request: text });
  assert.equal(none.activity, null);
  assert.ok(none.review.some((r) => r.code === "no-meaning"));
  reviewPairs(none.review);

  const res = interpretRequest(text, { vocab: VOCAB });
  assert.equal(res.ok, true);
  assert.equal(res.plan.confidence, "high");
  assert.deepEqual(res.choices, []);
  const a = buildFromPlan(res.plan, { vocab: VOCAB, request: text }, ID);
  sound(a.activity);
  assert.equal(a.activity.kind, "game");
  const block = a.activity.blocks.find((b) => b.type === "vocab");
  assert.equal(block.items.length, 12);
  for (const item of block.items)
    assert.equal(item.def, Object.fromEntries(WORDS)[item.term], "meaning is the teacher's own");
  assert.ok(questionsOf(a.activity).length >= 3);
  // Deterministic: same input, same output.
  const again = buildFromPlan(res.plan, { vocab: VOCAB, request: text }, ID);
  assert.deepEqual(again.activity, a.activity);
});

test("a word list with meanings, or a bare list on separate lines, is read from the message", () => {
  const withMeanings = interpretRequest(
    `Make a quick check using these words:\n${WORDS.slice(0, 4)
      .map((w) => w.join(" - "))
      .join("\n")}`,
  );
  assert.equal(withMeanings.ok, true);
  assert.equal(withMeanings.plan.kind, "check");
  const lines = `Make a game with these words:\nsun\nmoon\nstar\nplanet`;
  const bare = interpretRequest(lines);
  assert.deepEqual(bare.plan.terms, ["sun", "moon", "star", "planet"]);
  assert.equal(bare.ok, false);
  const found = interpretRequest(lines, {
    vocab: [
      { term: "sun", def: "the star at the center of our solar system" },
      { term: "moon", def: "a natural object that circles a planet" },
      { term: "star", def: "a huge ball of burning gas" },
      { term: "planet", def: "a large body that circles a star" },
    ],
  });
  assert.equal(found.ok, true);
  // Twelve was said, three given: the mismatch is reported rather than ignored.
  const off = interpretRequest("Make a game using these twelve words: sun, moon, star", {
    vocab: [
      { term: "sun", def: "the star at the center of our solar system" },
      { term: "moon", def: "a natural object that circles a planet" },
      { term: "star", def: "a huge ball of burning gas" },
    ],
  });
  assert.equal(off.ok, true);
  assert.match(off.explanation.en, /twelve|12/);
  assert.match(off.explanation.es, /12/);
});

test("turn a reading passage into a comprehension activity", () => {
  const text = "Turn this reading passage into a comprehension activity";
  const missing = interpretRequest(text);
  assert.equal(missing.ok, false);
  assert.deepEqual(
    missing.choices.map((c) => c.id),
    ["source"],
  );

  const res = interpretRequest(text, { sourceText: PASSAGE });
  assert.equal(res.ok, true);
  assert.equal(res.plan.kind, "interactive");
  assert.equal(res.plan.template, "interactive-reading");
  const built = buildFromPlan(res.plan, { sourceText: PASSAGE }, ID);
  sound(built.activity);
  assert.equal(built.activity.template, "interactive-reading");
  assert.equal(built.activity.blocks.find((b) => b.type === "passage").text, PASSAGE);
  const formats = new Set(questionsOf(built.activity).map((q) => q.format));
  assert.ok(formats.has("blank") && formats.has("short"), [...formats].join());
  // A passage pasted under the request line works the same.
  const inline = interpretRequest(`${text}\n\n${PASSAGE}`);
  assert.equal(inline.ok, true);
  assert.equal(
    buildFromPlan(inline.plan, { request: `${text}\n\n${PASSAGE}` }, ID).activity.blocks.find(
      (b) => b.type === "passage",
    ).text,
    PASSAGE,
  );
});

test("three differentiated versions need an activity and use the existing tiers", () => {
  const text = "Create three differentiated versions";
  const none = interpretRequest(text);
  assert.equal(none.ok, false);
  assert.deepEqual(none.plan.versions, ["emerging", "developing", "extension"]);
  assert.deepEqual(
    none.choices.map((c) => c.id),
    ["activity"],
  );
  allPairs(none);

  const source = allFormats("interactive");
  const snapshot = structuredClone(source);
  const res = interpretRequest(text, { activity: source });
  assert.equal(res.ok, true);
  assert.equal(res.plan.versions.length, 3);
  assert.ok(res.plan.versions.every((t) => TIERS.includes(t)));
  const built = buildFromPlan(res.plan, { activity: source }, ID);
  assert.equal(built.versions.length, 3);
  for (const v of built.versions) {
    sound(v.activity);
    assert.equal(v.activity.lineage.tier, v.tier);
    assert.equal(v.activity.lineage.variantOf, source.id);
  }
  assert.deepEqual(source, snapshot, "the original is untouched");
  assert.equal(
    interpretRequest("Create one differentiated version", { activity: source }).choices[0].id,
    "version-level",
  );
  assert.equal(
    interpretRequest("Make all four differentiated versions of this worksheet", {
      activity: source,
    }).plan.versions.length,
    TIERS.length,
  );
});

test("short interactive review about equivalent expressions uses verified problems and names the approximation", () => {
  const text = "Build a short interactive review about equivalent expressions";
  const res = interpretRequest(text);
  assert.equal(res.plan.kind, "interactive");
  assert.equal(res.plan.template, "explore-practice");
  assert.equal(res.plan.count, 6);
  assert.deepEqual(res.plan.mathTopics, ["evaluate-expressions"]);
  assert.equal(res.ok, true);
  assert.equal(res.plan.confidence, "medium");
  // The generators make "evaluate expressions", not "equivalent expressions": the teacher is asked.
  assert.deepEqual(
    res.choices.map((c) => c.id),
    ["math-topic"],
  );
  allPairs(res);
  const built = buildFromPlan(res.plan, {}, ID);
  sound(built.activity);
  assert.equal(questionsOf(built.activity).length, 6);
  assert.equal(built.activity.context.subject, "Math");
  assert.ok(built.review.some((r) => r.code === "generated-math"));
  reviewPairs(built.review);
  assert.deepEqual(buildFromPlan(res.plan, {}, ID).activity, built.activity, "deterministic");
  // A plainly named math topic needs no question.
  const plain = interpretRequest("Make a worksheet about equivalent ratios");
  assert.equal(plain.ok, true);
  assert.deepEqual(plain.choices, []);
  assert.equal(plain.plan.confidence, "high");
});

test("speaking activity for beginning English learners needs a passage; it never invents a text", () => {
  const text =
    "Create a speaking activity for beginning English learners about ancient civilizations";
  const res = interpretRequest(text);
  assert.equal(res.plan.transform, "speakingTask");
  assert.equal(res.plan.kind, "interactive");
  assert.equal(res.plan.template, "build-explain");
  assert.equal(res.plan.wida, 2);
  assert.equal(res.plan.topic, "ancient civilizations");
  assert.equal(res.ok, false);
  assert.deepEqual(
    res.choices.map((c) => c.id),
    ["passage"],
  );
  allPairs(res);
  assert.equal(buildFromPlan(res.plan, {}).activity, null);

  const ok = interpretRequest(text, { sourceText: PASSAGE });
  assert.equal(ok.ok, true);
  const built = buildFromPlan(ok.plan, { sourceText: PASSAGE }, ID);
  sound(built.activity);
  const speaking = questionsOf(built.activity).find((q) => q.skill === "speaking");
  assert.ok(speaking, "a speaking question from the passage");
  assert.equal(speaking.sample, "", "no sample answer is written");
  assert.equal(built.activity.supports.wida, 2);
  assert.equal(built.activity.supports.readAloud, true);
  assert.equal(built.activity.supports.frames, true);
  reviewPairs(built.review);
});

test("an existing activity can become another kind or an exit ticket", () => {
  const source = allFormats("worksheet");
  const game = interpretRequest("Turn this worksheet into a game", { activity: source });
  assert.equal(game.plan.transform, "toKind:game");
  assert.equal(game.ok, true);
  assert.equal(buildFromPlan(game.plan, { activity: source }, ID).activity.kind, "game");
  const exit = interpretRequest("Make an exit ticket from this activity", { activity: source });
  assert.equal(exit.plan.transform, "exitTicket");
  const made = buildFromPlan(exit.plan, { activity: source }, ID);
  sound(made.activity);
  assert.equal(made.activity.kind, "check");
  // The same words with no activity ask for one instead of making something up.
  const none = interpretRequest("Make an exit ticket from this activity");
  assert.equal(none.ok, false);
});

test("unsupported, empty and ambiguous requests are refused honestly", () => {
  for (const text of [
    "Make a video about fractions",
    "Create a slideshow about the water cycle",
    "Genera una canción sobre las fracciones",
  ]) {
    const res = interpretRequest(text);
    assert.equal(res.ok, false, text);
    assert.equal(res.plan, null);
    assert.deepEqual(
      res.choices.map((c) => c.id),
      ["format"],
    );
    assert.match(res.explanation.en, /cannot make/);
    allPairs(res);
  }
  for (const text of ["", "   ", "hello there", "asdf"]) {
    const res = interpretRequest(text);
    assert.equal(res.ok, false, JSON.stringify(text));
    assert.equal(res.plan, null);
    assert.equal(res.choices.length, 1);
    allPairs(res);
  }
  // A supported part still goes ahead, and the unsupported part is named.
  const mixed = interpretRequest(
    "Make a worksheet and a slideshow using these words: sun, moon, star",
    {
      vocab: [
        { term: "sun", def: "the star at the center of our solar system" },
        { term: "moon", def: "a natural object that circles a planet" },
        { term: "star", def: "a huge ball of burning gas" },
      ],
    },
  );
  assert.equal(mixed.ok, true);
  assert.match(mixed.explanation.en, /cannot make a video, slideshow/);
  // Unknown topic and nothing to build from: asks, never pretends.
  const topic = interpretRequest("Write ten questions about the Civil War");
  assert.equal(topic.ok, false);
  assert.ok(topic.choices.length >= 1 && topic.choices.length <= 3);
});

test("plans and contexts from outside are untrusted: junk never throws and never builds", () => {
  for (const plan of [
    null,
    undefined,
    7,
    "x",
    {},
    { kind: "nope", terms: "a", versions: ["x"], count: "9e9" },
  ]) {
    const out = buildFromPlan(plan, { sourceText: PASSAGE });
    assert.ok(Array.isArray(out.review));
    if (out.activity) sound(out.activity);
  }
  const huge = interpretRequest(`Make a game: ${"x".repeat(50000)}`);
  assert.equal(typeof huge.ok, "boolean");
  // Every plan template is one the studio has.
  const plan = interpretRequest(
    "Build a short interactive review about equivalent expressions",
  ).plan;
  assert.ok(TEMPLATES[plan.kind].some((t) => t.id === plan.template));
});
