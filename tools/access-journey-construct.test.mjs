// Language Construction Engine (the `build` engine of the ACCESS Learning Journey): logic + UI.
//
//   node --test tools/access-journey-construct.test.mjs
//
// The logic half drives the pure engine with the real m08 pack and small synthetic tasks. The UI half renders every
// module in jsdom (skipped with a note when jsdom cannot be resolved).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import m08 from "../access-practice-lab/src/content/journey/m08.js";
import * as C from "../access-practice-lab/src/journey/engines/construct.js";
import { findPhrase } from "../access-practice-lab/src/lang/text.js";

const band35 = m08.bands["3-5"];
const band68 = m08.bands["6-8"];
const plant = band35.build.find((t) => t.module === "expand");
const yieldTask = band68.build.find((t) => t.module === "expand");
const connectorTask = band35.build.find((t) => t.module === "connector");
const combineTask = band68.build.find((t) => t.module === "combine");
const unmet = (r) => r.needs.filter((n) => !n.met).map((n) => n.id);
const mentions = (text, words) => words.filter((w) => findPhrase(text, w).length);

test("every m08 build module validates, transfer included", () => {
  for (const b of Object.values(m08.bands)) assert.doesNotThrow(() => C.validateTasks(b.build));
});

test("malformed tasks throw descriptive errors", () => {
  assert.throws(
    () =>
      C.validateTask({
        kind: "build",
        module: "expand",
        base: "A.",
        needs: [{ id: "x", label: "y", test: {} }],
        transfer: {},
      }),
    /exactly one of connectorJob, terms, minNew/,
  );
  assert.throws(
    () =>
      C.validateTask({
        kind: "build",
        module: "combine",
        pair: ["a"],
        relation: "cause",
        keep: ["a"],
        transfer: {},
      }),
    /pair must be two sentences/,
  );
  assert.throws(
    () =>
      C.validateTask({
        kind: "build",
        module: "connector",
        title: "t",
        gaps: [{ before: "a", options: ["x", "y"], ok: ["z"] }],
        transfer: { gaps: [] },
      }),
    /ok must be a non-empty subset/,
  );
  assert.throws(
    () =>
      C.validateTask({
        kind: "build",
        module: "discourse",
        title: "t",
        units: [{ id: "a", text: "a" }],
        order: [],
        transfer: {},
      }),
    /3 or more/,
  );
  assert.throws(
    () => C.validateTask({ ...plant, transfer: undefined }),
    /missing transfer payload/,
  );
  assert.throws(() => C.validateTask({ module: "nope" }), /module must be one of/);
});

// ── expand ───────────────────────────────────────────────────────────────────
const VALID_PLANT = [
  "The plant grew quickly because it received enough sunlight and water.",
  "The plant got a lot of sun, so it grew tall.",
  "The plant got sunlight. As a result, it grew bigger.",
  "The plant grew well since it had good soil.",
  "The plant grew taller due to plenty of water.",
  "The plant got rain and sunlight, which led to it growing strong.",
  "Because the soil was rich and wet, the plant grew healthy.",
  "The plant grew slowly in the shade because it did not get enough light.",
  "The plant grew fast, thanks to the rain.",
  "Since the plant received water and sun every day, it grew big.",
];
test("expand accepts many valid constructions (because, so, as a result, since, due to, which led to ...)", () => {
  for (const s of VALID_PLANT) {
    const r = C.evaluate(plant, s);
    assert.equal(r.accepted, true, `${s} -> unmet ${unmet(r)} base ${r.baseKept.met}`);
    assert.ok(r.relationship?.cause && r.relationship?.effect, `relationship for ${s}`);
  }
  assert.ok(
    new Set(VALID_PLANT.map((s) => C.evaluate(plant, s).relationship.connector.word)).size >= 6,
  );
});

test("expand reports which clause is cause and which is effect by position", () => {
  const a = C.evaluate(
    plant,
    "The plant grew quickly because it received enough sunlight and water.",
  ).relationship;
  assert.equal(a.cause.text, "it received enough sunlight and water");
  assert.equal(a.effect.text, "The plant grew quickly");
  assert.equal(a.order, "effect-first");
  const b = C.evaluate(plant, "The plant got a lot of sun, so it grew tall.").relationship;
  assert.equal(b.cause.text, "The plant got a lot of sun");
  assert.equal(b.effect.text, "it grew tall");
  const c = C.evaluate(
    plant,
    "Because the soil was rich and wet, the plant grew healthy.",
  ).relationship;
  assert.equal(c.cause.text, "the soil was rich and wet");
  assert.equal(c.order, "cause-first");
  assert.equal(
    C.evaluate(plant, "The plant got sunlight. As a result, it grew bigger.").relationship.order,
    "two-sentences",
  );
});

test("expand returns evidence spans of the learner's own words and a tagged what-you-added list", () => {
  const text = "The plant grew quickly because it received enough sunlight and water.";
  const r = C.evaluate(plant, text);
  for (const n of r.needs) {
    assert.ok(n.evidence.length > 0, n.id);
    for (const e of n.evidence) assert.equal(text.slice(e.start, e.end), e.text);
  }
  assert.deepEqual(
    r.added.map((a) => [a.tag, a.text]),
    [
      ["how", "quickly"],
      ["cause", "because it received enough"],
      ["detail", "sunlight and water"],
    ],
  );
  assert.equal(r.connector.word, "because");
});

test("expand rejects: no cause, no detail, unrelated, unchanged, empty - each names the unmet need", () => {
  const noCause = C.evaluate(plant, "The plant grew quickly in the sun.");
  assert.equal(noCause.accepted, false);
  assert.deepEqual(unmet(noCause), ["why"]);
  assert.match(noCause.nextMove[0], /WHY/);
  const noDetail = C.evaluate(plant, "The plant grew quickly because it was happy.");
  assert.deepEqual(unmet(noDetail), ["detail"]);
  const noHow = C.evaluate(plant, "The plant grew because it got sun.");
  assert.deepEqual(unmet(noHow), ["how"]);
  const unrelated = C.evaluate(plant, "I like pizza because it is tasty and warm.");
  assert.equal(unrelated.accepted, false);
  assert.equal(unrelated.baseKept.met, false);
  assert.match(unrelated.nextMove[0], /Keep the idea/);
  assert.equal(C.evaluate(plant, "The plant grew.").accepted, false);
  assert.equal(C.evaluate(plant, "").accepted, false);
  // "so" as a degree word and "since" as a time word are not cause connectors
  assert.deepEqual(unmet(C.evaluate(plant, "The plant grew so quickly in the sun.")), ["why"]);
  assert.deepEqual(unmet(C.evaluate(plant, "The plant grew taller in the sun since Monday.")), [
    "why",
  ]);
  // a cause word with nothing after it
  const dangling = C.evaluate(plant, "The plant grew quickly in the sun because.");
  assert.deepEqual(unmet(dangling), ["why"]);
  assert.match(dangling.needs.find((n) => n.id === "why").hint[0], /reason/);
});

test("expand handles symbols and numbers in cues and the 6-8 task", () => {
  const ok = C.evaluate(
    yieldTask,
    "The yield dropped by 40% because roots sat in water after the soil compacted.",
  );
  assert.equal(ok.accepted, true, JSON.stringify(unmet(ok)));
  const asResultOf = C.evaluate(
    yieldTask,
    "The yield dropped sharply as a result of compacted soil.",
  );
  assert.equal(asResultOf.accepted, true, "as a result of: the cause follows it");
  assert.equal(asResultOf.relationship.cause.text, "compacted soil");
  assert.equal(
    C.evaluate(
      yieldTask,
      "Roots sat in water. As a result, the yield dropped steadily as the soil stayed wet.",
    ).accepted,
    true,
  );
  assert.deepEqual(unmet(C.evaluate(yieldTask, "The yield dropped.")), ["how", "why", "detail"]);
});

test("expand minNew counts new content words through diffWords", () => {
  const task = {
    kind: "build",
    module: "expand",
    title: "t",
    base: "The beans grew.",
    needs: [{ id: "more", label: "Add 3 new words", test: { minNew: 3 } }],
    transfer: { base: "The beans grew.", needs: [{ id: "more", label: "x", test: { minNew: 1 } }] },
  };
  assert.equal(C.evaluate(task, "The beans grew.").accepted, false);
  assert.equal(C.evaluate(task, "The beans grew tall.").accepted, false);
  const r = C.evaluate(task, "The green beans grew tall near sunny windows.");
  assert.equal(r.accepted, true);
  assert.deepEqual(
    r.newWords.map((w) => w.text),
    ["green", "tall", "near", "sunny", "windows"],
  );
});

test("compareConnectors names the connector used, its altConnectors note and a prompt to rewrite with another", () => {
  const c = C.compareConnectors(
    plant,
    "The plant grew quickly because it received enough sunlight and water.",
  );
  assert.equal(c.used.word, "because");
  assert.equal(c.used.note, plant.altConnectors[0].note);
  assert.deepEqual(
    c.others.map((o) => o.word),
    ["so", "as a result"],
  );
  assert.match(c.prompt[0], /different connector: so, as a result/);
  const since = C.compareConnectors(plant, "The plant grew well since it had good soil.");
  assert.equal(since.used.family, "because");
  assert.equal(since.used.note, plant.altConnectors[0].note);
  const none = C.compareConnectors(plant, "The plant grew quickly.");
  assert.equal(none.used, null);
  const led = C.compareConnectors(
    yieldTask,
    "Roots sat in water, which led to a drop in the yield.",
  );
  assert.equal(led.used.family, "which led to");
});

test("meaningChange comes from the altConnectors notes", () => {
  const from = "The plant grew quickly because it received enough sunlight.";
  const to = "The plant received enough sunlight, so it grew quickly.";
  const m = C.meaningChange(plant, from, to);
  assert.equal(m.same, false);
  assert.equal(m.orderChanged, true);
  assert.equal(m.keptIdea, true);
  assert.equal(m.noteFrom, plant.altConnectors[0].note);
  assert.equal(m.noteTo, plant.altConnectors[1].note);
  assert.ok(m.messages.some((x) => /reason comes first/.test(x[0])));
  assert.equal(C.meaningChange(plant, from, from).same, true);
  assert.equal(C.meaningChange(plant, from, "I like pizza because it is tasty.").keptIdea, false);
});

test("swapPreview reorders the learner's own clauses; display only", () => {
  const text = "The plant grew quickly because it received enough sunlight.";
  assert.equal(
    C.swapPreview(text, "so"),
    "It received enough sunlight, so the plant grew quickly.",
  );
  assert.equal(
    C.swapPreview(text, "as a result"),
    "It received enough sunlight. As a result, the plant grew quickly.",
  );
  assert.equal(C.swapPreview("The plant grew quickly.", "so"), null);
  assert.equal(C.swapPreview(text, "which led to"), null);
});

// ── combine ──────────────────────────────────────────────────────────────────
const VALID_COMBINE = [
  [
    "because (end)",
    "The tomato plants produce less fruit because the new gym wing blocks the afternoon sun.",
  ],
  [
    "because (start)",
    "Because the new gym wing blocks the afternoon sun, the tomato plants produce less fruit.",
  ],
  ["so", "The new gym wing blocks the afternoon sun, so the tomato plants produce less fruit."],
  [
    "as a result",
    "The new gym wing blocks the afternoon sun. As a result, the tomato plants produce less fruit.",
  ],
  [
    "which causes",
    "The new gym wing blocks the afternoon sun, which causes the tomato plants to produce less fruit.",
  ],
  [
    "therefore",
    "The new gym wing blocks the afternoon sun; therefore, the tomato plants produce less fruit.",
  ],
  [
    "since",
    "The tomato plants produce less fruit since the new gym wing blocks the afternoon sun.",
  ],
  [
    "due to",
    "Due to the new gym wing blocking the afternoon sun, the tomato plants produce less fruit.",
  ],
  [
    "causing",
    "The new gym wing blocks the afternoon sun, causing the tomato plants to produce less fruit.",
  ],
];
test("combine accepts any structure whose connector does the relation's job and keeps the terms", () => {
  const types = new Set();
  for (const [name, s] of VALID_COMBINE) {
    const r = C.evaluate(combineTask, s);
    assert.equal(
      r.accepted,
      true,
      `${name}: ${JSON.stringify({ miss: r.keepMissing, rev: r.reversed, c: r.connector, next: r.nextMove })}`,
    );
    types.add(r.structure.type);
    assert.ok(r.structure.shape.type);
    assert.ok(r.connector.span.text);
  }
  assert.ok(types.size >= 5, [...types].join());
});

test("combine reports structure type and connector used", () => {
  const so = C.evaluate(combineTask, VALID_COMBINE[2][1]);
  assert.equal(so.structure.type, "coordination");
  assert.equal(so.connector.word, "so");
  assert.equal(C.evaluate(combineTask, VALID_COMBINE[0][1]).structure.type, "subordination");
  assert.equal(C.evaluate(combineTask, VALID_COMBINE[3][1]).structure.type, "transition");
  assert.equal(C.evaluate(combineTask, VALID_COMBINE[4][1]).structure.type, "relative");
});

test("combine rejects: two sentences with a period, copied pair, wrong relation, dropped idea, reversed cause", () => {
  const concat = C.evaluate(
    combineTask,
    "The new gym wing blocks the afternoon sun. The tomato plants produce less fruit.",
  );
  assert.equal(concat.accepted, false);
  assert.equal(concat.sideBySide, true);
  assert.match(concat.nextMove[0], /side by side/);
  const copied = C.evaluate(combineTask, combineTask.pair.join(" "));
  assert.equal(copied.accepted, false);
  const contrast = C.evaluate(
    combineTask,
    "The new gym wing blocks the afternoon sun but the tomato plants produce less fruit.",
  );
  assert.equal(contrast.accepted, false);
  assert.equal(contrast.wrongRelation.job, "contrast");
  assert.match(contrast.nextMove[0], /a difference/);
  const dropped = C.evaluate(combineTask, "It blocks the sun because they make less.");
  assert.equal(dropped.accepted, false);
  assert.ok(dropped.keepMissing.includes("gym"));
  const reversed = C.evaluate(
    combineTask,
    "The new gym wing blocks the afternoon sun because the tomato plants produce less fruit.",
  );
  assert.equal(reversed.accepted, false);
  assert.equal(reversed.reversed, true);
  assert.equal(C.evaluate(combineTask, "").accepted, false);
});

test("combine works for contrast, sequence and addition relations too", () => {
  const mk = (relation, pair, keep) => ({
    kind: "build",
    module: "combine",
    title: "c",
    pair,
    relation,
    keep,
    transfer: { pair, relation, keep },
  });
  const contrast = mk(
    "contrast",
    ["Bed 1 is tall and green.", "Bed 2 is small and yellow."],
    ["bed", "tall", "small"],
  );
  assert.equal(
    C.evaluate(contrast, "Bed 1 is tall and green, but Bed 2 is small and yellow.").accepted,
    true,
  );
  assert.equal(
    C.evaluate(contrast, "Bed 1 is tall and green, while Bed 2 is small and yellow.").accepted,
    true,
  );
  assert.equal(
    C.evaluate(contrast, "Bed 1 is tall and green, because Bed 2 is small and yellow.").accepted,
    false,
  );
  const seq = mk(
    "sequence",
    ["We watered the seeds.", "The sprouts came up."],
    ["watered", "sprouts"],
  );
  assert.equal(
    C.evaluate(seq, "We watered the seeds, and then the sprouts came up.").accepted,
    true,
  );
  const add = mk(
    "addition",
    ["The soil is dark.", "The soil is crumbly."],
    ["soil", "dark", "crumbly"],
  );
  assert.equal(C.evaluate(add, "The soil is dark and crumbly.").accepted, true);
});

test("combine transfer item uses its own pair and keep terms", () => {
  const ok = C.evaluate(
    combineTask,
    "Because construction trucks compacted the soil, water pools on the beds after rain.",
    { transfer: true },
  );
  assert.equal(ok.accepted, true);
  assert.equal(
    C.evaluate(
      combineTask,
      "The new gym wing blocks the afternoon sun, so the tomato plants produce less fruit.",
      { transfer: true },
    ).accepted,
    false,
  );
});

// ── connector ────────────────────────────────────────────────────────────────
test("connector: right, wrong and multiple-ok; feedback explains the relation and never states the ok option", () => {
  const right = C.evaluate(connectorTask, ["because", "so", "but"]);
  assert.equal(right.accepted, true);
  assert.ok(right.items.every((i) => i.feedback.tone === "right"));
  const wrong = C.evaluate(connectorTask, ["so", "because", "and then"]);
  assert.equal(wrong.accepted, false);
  assert.equal(wrong.firstWrong, 0);
  connectorTask.gaps.forEach((g, i) => {
    const fb = wrong.items[i].feedback;
    assert.equal(fb.tone, "hint");
    for (const lang of fb.t)
      assert.deepEqual(
        mentions(lang, g.ok),
        [],
        `feedback for gap ${i} names an ok option: ${lang}`,
      );
  });
  assert.match(wrong.items[0].feedback.t[0], /reason|why/);
  assert.match(wrong.items[2].feedback.t[0], /different/);
  const partial = C.evaluate(connectorTask, ["because", null, null]);
  assert.equal(partial.accepted, false);
  assert.match(partial.nextMove[0], /Choose a connector/);
  const multi = {
    kind: "build",
    module: "connector",
    title: "multi",
    gaps: [
      {
        before: "The pot got water",
        after: "it stood up.",
        relation: "cause",
        options: ["so", "and so", "but"],
        ok: ["so", "and so"],
      },
    ],
    transfer: {
      gaps: [
        { before: "x", after: "y", relation: "contrast", options: ["but", "so"], ok: ["but"] },
      ],
    },
  };
  assert.equal(C.evaluate(multi, ["so"]).accepted, true);
  assert.equal(C.evaluate(multi, ["and so"]).accepted, true);
  const miss = C.evaluate(multi, ["but"]);
  assert.equal(miss.accepted, false);
  for (const lang of miss.items[0].feedback.t)
    assert.deepEqual(mentions(lang, ["so", "and so"]), []);
  assert.equal(C.evaluate(multi, ["but"], { transfer: true }).accepted, true);
});

test("connector feedback scrubs an authored note that leaks the answer", () => {
  const leaky = { ...connectorTask, notes: { so: "So shows the result. Try because." } };
  const r = C.evaluate(leaky, ["so", null, null]);
  for (const lang of r.items[0].feedback.t) assert.deepEqual(mentions(lang, ["because"]), []);
});

// ── morphology ───────────────────────────────────────────────────────────────
const morph = {
  kind: "build",
  module: "morphology",
  title: "Word parts",
  words: [
    {
      word: "rebuild",
      parts: [
        { t: "re", type: "prefix", meaning: "again" },
        { t: "build", type: "root", meaning: "to make a structure" },
      ],
      ask: "What does rebuild mean?",
    },
    {
      word: "pollution",
      mode: "decompose",
      parts: [
        { t: "pollute", type: "root", meaning: "to make dirty" },
        { t: "tion", type: "suffix", meaning: "act or result of" },
      ],
    },
  ],
  transfer: {
    words: [
      {
        word: "unsafe",
        parts: [
          { t: "un", type: "prefix", meaning: "not" },
          { t: "safe", type: "root", meaning: "free from danger" },
        ],
      },
      {
        word: "movement",
        parts: [
          { t: "move", type: "root", meaning: "to change place" },
          { t: "ment", type: "suffix", meaning: "result of" },
        ],
      },
    ],
  },
};
test("morphology: slots by part type, meaning-match, feedback names the part type", () => {
  C.validateTask(morph);
  const d = C.init(morph);
  assert.deepEqual(d.words[0].slots, { prefix: [null], root: [null], suffix: [null] });
  const q0 = C.meaningQuestion(morph, 0);
  assert.equal(q0.options.length, 3);
  assert.ok(q0.options.includes("to make a structure"));
  const q1 = C.meaningQuestion(morph, 1);
  const good = [
    { slots: { prefix: ["re"], root: ["build"], suffix: [null] }, meaning: q0.answer },
    { slots: { prefix: [null], root: ["pollute"], suffix: ["-tion"] }, meaning: q1.answer },
  ];
  const ok = C.evaluate(morph, { words: good });
  assert.equal(ok.accepted, true, JSON.stringify(ok.items.map((i) => i.per)));
  const bad = C.evaluate(morph, {
    words: [
      { slots: { prefix: ["build"], root: ["re"], suffix: [null] }, meaning: q0.answer },
      good[1],
    ],
  });
  assert.equal(bad.accepted, false);
  const w0 = bad.items[0];
  assert.equal(w0.built, false);
  assert.ok(w0.per.every((x) => x.state === "wrong"));
  assert.match(w0.per[0].feedback[0], /prefix/);
  assert.match(w0.per.find((x) => x.type === "root").feedback[0], /root/);
  assert.doesNotMatch(JSON.stringify(w0.per), /“re”.*fits/);
  const noMeaning = C.evaluate(morph, { words: [{ ...good[0], meaning: null }, good[1]] });
  assert.equal(noMeaning.accepted, false);
  const wrongMeaning = C.evaluate(morph, {
    words: [{ ...good[0], meaning: q0.options.find((o) => o !== q0.answer) }, good[1]],
  });
  assert.equal(wrongMeaning.items[0].meaningOk, false);
  assert.equal(
    C.evaluate(morph, { words: good.map((w) => ({ ...w, slots: { ...w.slots, prefix: ["re"] } })) })
      .accepted,
    false,
    "an extra prefix chip is not accepted",
  );
  const t = C.init(morph, { transfer: true });
  assert.equal(t.words.length, 2);
  const tq = C.meaningQuestion(C.resolveTask(morph, true), 0);
  assert.equal(
    C.evaluate(
      morph,
      {
        words: [
          { slots: { prefix: ["un"], root: ["safe"], suffix: [null] }, meaning: tq.answer },
          {
            slots: { prefix: [null], root: ["move"], suffix: ["ment"] },
            meaning: C.meaningQuestion(C.resolveTask(morph, true), 1).answer,
          },
        ],
      },
      { transfer: true },
    ).accepted,
    true,
  );
  const chips = C.morphChips(morph, 1);
  assert.equal(chips.length, 4, "decompose adds two decoy chips");
  assert.ok(chips.includes("pollute") && chips.includes("tion"));
});

// ── pronoun ──────────────────────────────────────────────────────────────────
const pron = {
  kind: "build",
  module: "pronoun",
  title: "Who is it?",
  text: [
    { id: "s1", text: "Maya gave the seeds to Ana." },
    { id: "s2", text: "She planted them in Bed 1." },
  ],
  pronouns: [
    { sentence: "s2", phrase: "She", options: ["Maya", "Ana"], ok: "Ana" },
    { sentence: "s2", phrase: "them", options: ["the seeds", "Bed 1"], ok: "the seeds" },
  ],
  transfer: {
    text: [
      { id: "s1", text: "The bee visited the flower." },
      { id: "s2", text: "It was full of nectar." },
    ],
    pronouns: [
      { sentence: "s2", phrase: "It", options: ["The bee", "the flower"], ok: "the flower" },
    ],
  },
};
test("pronoun: picks the referent; a miss explains generically and never names the right one", () => {
  C.validateTask(pron);
  assert.equal(C.evaluate(pron, ["Ana", "the seeds"]).accepted, true);
  const r = C.evaluate(pron, ["Maya", "Bed 1"]);
  assert.equal(r.accepted, false);
  assert.equal(r.firstWrong, 0);
  assert.equal(r.items[0].lookAt, "s1");
  for (const [i, ok] of [
    [0, "Ana"],
    [1, "the seeds"],
  ])
    for (const lang of r.items[i].feedback.t) assert.deepEqual(mentions(lang, [ok]), []);
  assert.match(r.items[0].feedback.t[0], /who is doing the action/);
  assert.equal(C.evaluate(pron, ["the flower"], { transfer: true }).accepted, true);
  assert.equal(C.evaluate(pron, ["The bee"], { transfer: true }).accepted, false);
  const multi = {
    ...pron,
    pronouns: [{ ...pron.pronouns[0], ok: ["Ana", "Maya"] }],
    transfer: pron.transfer,
  };
  assert.equal(C.evaluate(multi, ["Maya"]).accepted, true);
});

// ── discourse ────────────────────────────────────────────────────────────────
const disc = {
  kind: "build",
  module: "discourse",
  title: "Order the report",
  units: [
    { id: "a", text: "The garden club noticed Bed 2 was yellow.", role: "claim" },
    { id: "b", text: "The oak tree blocks the light.", role: "reason" },
    { id: "c", text: "The beans grew slowly.", role: "result" },
    { id: "d", text: "The club will trim the tree.", role: "conclusion" },
  ],
  order: ["a", "b", "c", "d"],
  alt: [["a", "c", "b", "d"]],
  connectors: [
    { before: "c", word: "so" },
    { before: "d", word: "finally" },
  ],
  transfer: {
    units: [
      { id: "a", text: "First text." },
      { id: "b", text: "Second text." },
      { id: "c", text: "Third text." },
    ],
    order: ["a", "b", "c"],
    alt: [],
    connectors: [{ before: "b", word: "then" }],
  },
};
test("discourse: any valid order or alt; feedback is a count and the first wrong place only", () => {
  C.validateTask(disc);
  const start = C.init(disc);
  assert.notDeepEqual(start.order, disc.order);
  assert.notDeepEqual(start.order, disc.alt[0]);
  assert.equal(
    C.evaluate(disc, { order: ["a", "b", "c", "d"], connectors: ["so", "finally"] }).accepted,
    true,
  );
  assert.equal(
    C.evaluate(disc, { order: ["a", "c", "b", "d"], connectors: ["so", "finally"] }).accepted,
    true,
    "alt order",
  );
  const r = C.evaluate(disc, { order: ["a", "d", "c", "b"], connectors: [null, null] });
  assert.equal(r.accepted, false);
  assert.deepEqual([r.order.right, r.order.total, r.order.firstWrong], [2, 4, 2]);
  assert.match(r.nextMove[0], /place 1 and place 2/);
  const text = JSON.stringify([r.summary, r.nextMove]);
  assert.doesNotMatch(text, /oak tree|trim the tree|beans grew/);
  const orderOkConnWrong = C.evaluate(disc, {
    order: ["a", "b", "c", "d"],
    connectors: ["finally", "finally"],
  });
  assert.equal(orderOkConnWrong.accepted, false);
  assert.equal(orderOkConnWrong.order.ok, true);
  assert.equal(orderOkConnWrong.connectors[0].ok, false);
  assert.equal(orderOkConnWrong.connectors[1].ok, true);
  for (let i = 0; i < 2; i++)
    assert.ok(C.discourseOptions(disc, i).includes(disc.connectors[i].word));
  assert.equal(
    C.evaluate(disc, { order: ["a", "b", "c"], connectors: ["then"] }, { transfer: true }).accepted,
    true,
  );
});

// ── state, transfer independence, criteria, ledger ───────────────────────────
test("module records: try -> accepted -> transfer -> done, with transfer judged on its own item", () => {
  const tasks = band35.build;
  let s = C.initBuild(tasks);
  assert.equal(s.modules.length, 2);
  assert.equal(C.doneCriteria(tasks, s).done, false);
  s = C.setRecord(s, 0, { phase: "try", draft: { text: VALID_PLANT[0], history: [] } });
  let step = C.submit(tasks[0], s, 0);
  assert.equal(step.result.accepted, true);
  assert.equal(step.kind, "first");
  s = step.state;
  assert.equal(s.modules[0].phase, "accepted");
  assert.equal(s.modules[0].accepted, true);
  assert.equal(s.modules[0].transferOk, false);
  // the base item's sentence does NOT pass the transfer item
  s = C.setRecord(s, 0, { phase: "transfer", tdraft: { text: VALID_PLANT[0], history: [] } });
  step = C.submit(tasks[0], s, 0);
  assert.equal(step.result.accepted, false);
  assert.equal(step.result.transfer, true);
  assert.equal(step.kind, "transfer");
  s = step.state;
  assert.equal(s.modules[0].phase, "transfer");
  assert.equal(s.modules[0].transferAttempts, 1);
  s = C.setRecord(s, 0, {
    tdraft: {
      text: "The beans turned yellow because they got no light in the shade.",
      history: [],
    },
  });
  step = C.submit(tasks[0], s, 0);
  assert.equal(step.result.accepted, true);
  s = step.state;
  assert.equal(s.modules[0].phase, "done");
  assert.equal(C.doneCriteria(tasks, s).done, false, "second module is still open");
  assert.equal(C.doneCriteria(tasks, s).remaining, 1);
  s = C.noteSupport(s, 1, "frames");
  s = C.noteSupport(s, 1, "frames");
  assert.deepEqual(s.modules[1].supports, ["frames"]);
  s = C.setRecord(s, 1, { accepted: true, transferOk: true, attempts: 2 });
  const dc = C.doneCriteria(tasks, s);
  assert.equal(dc.done, true);
  const res = C.doneResult(tasks, s);
  assert.deepEqual(
    res.modules.map((m) => m.module),
    ["expand", "connector"],
  );
  assert.deepEqual(res.supportsUsed, ["frames"]);
  assert.equal(JSON.stringify(res).includes("beans"), false, "no learner text in the done result");
});

test("loadBuild repairs saved state that no longer fits the pack", () => {
  const tasks = band35.build;
  assert.equal(C.loadBuild(tasks, null).modules.length, 2);
  assert.equal(C.loadBuild(tasks, { v: 1, index: 0, modules: [] }).modules.length, 2);
  const s = C.initBuild(tasks);
  assert.equal(C.loadBuild(tasks, { ...s, index: 9 }).index, 1);
});

test("ledgerEntry: sentence modules only, mission source, Writing domain, honest stage", () => {
  const base = { missionId: "m08", band: "3-5", klu: "Explain", supports: [] };
  const first = C.ledgerEntry({ ...base, module: "expand", text: VALID_PLANT[0], kind: "first" });
  assert.equal(first.src, "mission");
  assert.equal(first.task, "m08.build");
  assert.equal(first.domain, "Writing");
  assert.equal(first.use, "Explain");
  assert.equal(first.kind, "first");
  assert.equal(first.stage, "supported");
  assert.ok(first.m.words >= 10 && first.m.link >= 1);
  const transfer = C.ledgerEntry({
    ...base,
    module: "expand",
    text: VALID_PLANT[0],
    kind: "transfer",
  });
  assert.equal(transfer.stage, "independent");
  assert.equal(
    C.ledgerEntry({
      ...base,
      module: "expand",
      text: VALID_PLANT[0],
      kind: "transfer",
      supports: ["frames"],
    }).stage,
    "supported",
  );
  assert.equal(
    C.ledgerEntry({
      ...base,
      module: "expand",
      text: VALID_PLANT[0],
      kind: "first",
      supports: ["frames", "shelf"],
    }).supports.hint,
    true,
  );
  assert.equal(C.ledgerEntry({ ...base, module: "connector", text: "x" }), null);
  assert.equal(C.ledgerEntry({ ...base, module: "combine", text: "" }), null);
});

// ── UI (jsdom) ───────────────────────────────────────────────────────────────
let JSDOM = null;
try {
  ({ JSDOM } = await import("jsdom"));
} catch {
  /* the UI half is skipped when jsdom cannot be resolved */
}
const ui = { skip: JSDOM ? false : "jsdom is not resolvable from this checkout" };
const UI = JSDOM ? await import("../access-practice-lab/src/journey/ui/construct.js") : null;
const { makeI18n } = JSDOM ? await import("../access-practice-lab/src/i18n.js") : {};

const plain = (el) => {
  const c = el.cloneNode(true);
  for (const t of c.querySelectorAll(".cn-tag")) t.remove();
  return c.textContent.trim();
};

function harness(
  pack,
  { support = "A", independent = false, band = "3-5", lang = "en", data = {} } = {},
) {
  const dom = new JSDOM("<!doctype html><body><div id='root'></div></body>");
  const root = dom.window.document.getElementById("root");
  const log = { helps: [], ledger: [], done: [], announce: [] };
  const env = {
    I: makeI18n(lang),
    band,
    support,
    independent,
    missionId: "m08",
    step: "build",
    mission: { klu: "Explain" },
    pack,
    data,
    update(patch) {
      env.data = { ...env.data, ...patch };
      draw();
    },
    help: (id) => log.helps.push(id),
    done: (r) => log.done.push(r),
    ledger: (e) => log.ledger.push(e),
    announce: (m) => log.announce.push(m),
    navigate() {},
  };
  const draw = () => {
    root.innerHTML = String(UI.render(pack.build, env));
    UI.mount(root, env);
  };
  draw();
  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  const tap = (sel) => {
    const el = typeof sel === "string" ? $(sel) : sel;
    assert.ok(el, `missing ${sel}`);
    el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, cancelable: true }));
  };
  const type = (sel, value) => {
    $(sel).value = value;
  };
  const text = () => root.textContent.replace(/\s+/g, " ");
  const tapText = (selector, label) =>
    tap($$(selector).find((b) => b.textContent.trim() === label));
  return { dom, root, env, log, $, $$, tap, type, text, tapText, draw };
}
const pack35 = { ...band35, build: band35.build };
const synth = { vocab: band35.vocab, frames: band35.frames, build: [morph, pron, disc] };

test(
  "ui: every module renders in the explore phase with an intro, a progress list and a Start button",
  ui,
  () => {
    const packs = [band35, band68, synth];
    for (const p of packs) {
      for (let i = 0; i < p.build.length; i++) {
        const h = harness(p, { data: { build: { ...C.initBuild(p.build), index: i } } });
        assert.equal(h.$("[data-cn-root]").dataset.module, p.build[i].module);
        assert.equal(h.$("[data-cn-root]").dataset.phase, "explore");
        assert.ok(h.$(".cn-intro"), `${p.build[i].module} intro`);
        assert.equal(h.$$(".cn-steps li").length, p.build.length);
        assert.equal(h.$$(".cn-phases li").length, 4);
        assert.ok(h.$('[data-cn="start"]'));
        assert.equal(h.$('[data-cn="check"]'), null);
        assert.equal(h.$("[data-cn-root]").getAttribute("aria-labelledby"), "cn-title");
      }
    }
  },
);

test(
  "ui: bilingual mode shows Spanish chrome in lang=es and keeps task content English",
  ui,
  () => {
    const h = harness(pack35, { lang: "bi" });
    assert.ok(h.$('.bi-es[lang="es"]'));
    assert.ok(h.text().includes("Construye"));
    const es = harness(pack35, { lang: "es" });
    assert.ok(es.text().includes("Empezar"));
  },
);

test(
  "ui: expand end to end - supports, chips, check, What changed, arrow, connector lab, transfer without supports",
  ui,
  () => {
    const h = harness(pack35, { support: "A" });
    // support A: frames, word bank and the details shelf are on screen and count as opened
    assert.ok(h.$(".cn-frames") && h.$(".cn-bank") && h.$(".cn-shelf"));
    assert.ok(h.$(".cn-bank-es"), "Spanish gloss in the word bank");
    assert.deepEqual(h.log.helps.sort(), [
      "build.expand.bank",
      "build.expand.frames",
      "build.expand.shelf",
    ]);
    assert.deepEqual(h.env.data.build.modules[0].supports.sort(), ["bank", "frames", "shelf"]);
    h.tap('[data-cn="start"]');
    assert.equal(h.$("[data-cn-root]").dataset.phase, "try");
    assert.equal(h.$('[data-k="tray"]').value, "The plant grew.");
    // tap a chip from the shelf: it is added to the tray before the full stop
    h.tapText(".cn-shelf .cn-chip", "quickly");
    assert.equal(h.$('[data-k="tray"]').value, "The plant grew quickly.");
    h.tap('[data-cn="undo"]');
    assert.equal(h.$('[data-k="tray"]').value, "The plant grew.");
    // a miss gives a checklist and ONE next move
    h.type('[data-k="tray"]', "The plant grew quickly in the sun.");
    h.tap('[data-cn="check"]');
    assert.equal(h.$("[data-cn-root]").dataset.phase, "try");
    assert.ok(h.$(".feedback.is-hint"));
    assert.equal(h.$$(".cn-needs li.is-open").length, 1);
    assert.equal(h.$$(".cn-next").length, 1);
    assert.equal(h.log.ledger[0].kind, "first");
    // typed and chip-built sentences both work
    h.type(
      '[data-k="tray"]',
      "The plant grew quickly because it received enough sunlight and water.",
    );
    h.tap('[data-cn="check"]');
    assert.equal(h.$("[data-cn-root]").dataset.phase, "accepted");
    assert.equal(h.log.ledger[1].kind, "revision");
    assert.equal(h.$('[data-k="tray"]').readOnly, true);
    assert.equal(h.$$(".cn-needs li.is-met").length, 4);
    assert.ok(
      h.$$(".cn-needs .cn-quote").some((q) => q.textContent === "quickly"),
      "evidence quotes the learner's own word",
    );
    const marks = h.$$(".cn-after mark.cn-new");
    assert.deepEqual(
      marks.map((m) => m.className.replace("cn-new ", "")),
      ["cn-t-how", "cn-t-cause", "cn-t-detail"],
    );
    assert.ok(
      marks.every((m) => m.querySelector(".cn-tag")),
      "marks carry a text label, not colour alone",
    );
    assert.equal(h.$$(".cn-legend li").length, 3);
    const arrow = h.$(".cn-arrow");
    assert.ok(arrow);
    assert.match(arrow.textContent, /it received enough sunlight and water/);
    assert.match(arrow.textContent, /The plant grew quickly/);
    assert.match(arrow.textContent, /result comes first/);
    // connector lab: swap restructures the learner's own clauses and shows the authored note
    assert.ok(h.$(".cn-swap"));
    assert.equal(h.$$(".cn-swap .cn-chip").length, 3);
    h.tap('[data-cn="swap"][data-v="so"]');
    assert.match(
      plain(h.$(".cn-swap-out .cn-after")),
      /^It received enough sunlight and water, so the plant grew quickly\.$/,
    );
    assert.equal(h.$(".cn-swap-out .cn-note").textContent, plant.altConnectors[1].note);
    assert.equal(h.$$(".cn-swap-out .cn-clause").length, 2);
    h.type(
      '[data-k="own"]',
      "The plant got enough sunlight and water. As a result, it grew quickly.",
    );
    h.tap('[data-cn="compare"]');
    assert.match(
      h.$(".cn-compare").textContent,
      /Before: the result comes first, then the reason\. Now: the reason and the result are in two sentences\./,
    );
    assert.match(h.$(".cn-compare").textContent, /As a result starts a new sentence/);
    // transfer: a NEW item and no supports at all, whatever the support level says
    h.tap('[data-cn="to-transfer"]');
    assert.equal(h.$("[data-cn-root]").dataset.phase, "transfer");
    assert.ok(h.$(".cn-notice.is-transfer"));
    assert.match(h.text(), /The beans turned yellow\./);
    assert.equal(h.$(".cn-supports"), null);
    assert.equal(h.$(".cn-shelf"), null);
    assert.equal(h.$(".cn-frames"), null);
    assert.equal(h.$(".cn-bank"), null);
    assert.equal(h.$('[data-cn="help"]'), null);
    assert.equal(h.$(".cn-swap"), null);
    h.type(
      '[data-k="tray"]',
      "The plant grew quickly because it received enough sunlight and water.",
    );
    h.tap('[data-cn="check"]');
    assert.equal(
      h.$("[data-cn-root]").dataset.phase,
      "transfer",
      "the base item's sentence does not pass the transfer item",
    );
    h.type('[data-k="tray"]', "The beans turned yellow because they got no light in the shade.");
    h.tap('[data-cn="check"]');
    assert.equal(h.$("[data-cn-root]").dataset.phase, "done");
    const kinds = h.log.ledger.map((e) => e.kind);
    assert.deepEqual(kinds, ["first", "revision", "transfer", "transfer"]);
    assert.equal(h.log.ledger.at(-1).stage, "independent", "transfer entries carry no supports");
    assert.equal(h.log.ledger.at(-1).task, "m08.build");
    // next module: the connector laboratory
    h.tap('[data-cn="next"]');
    assert.equal(h.$("[data-cn-root]").dataset.module, "connector");
    assert.equal(h.log.done.length, 0);
  },
);

test(
  "ui: connector module - picks, check, wrong feedback never names the answer, transfer",
  ui,
  () => {
    const h = harness(pack35, {
      support: "B",
      data: { build: { ...C.initBuild(pack35.build), index: 1 } },
    });
    h.tap('[data-cn="start"]');
    const gap = (i, v) => h.tap(`[data-cn="pick"][data-i="${i}"][data-v="${v}"]`);
    gap(0, "so");
    gap(1, "because");
    gap(2, "and then");
    h.tap('[data-cn="check"]');
    assert.equal(h.$$(".cn-gap-fb.is-hint").length, 3);
    const fbText = h.$$(".cn-gap-fb").map((n) => n.textContent);
    connectorTask.gaps.forEach((g, i) =>
      assert.deepEqual(mentions(fbText[i], g.ok), [], `gap ${i}: ${fbText[i]}`),
    );
    assert.equal(h.$("[data-cn-root]").dataset.phase, "try");
    gap(0, "because");
    gap(1, "so");
    gap(2, "but");
    h.tap('[data-cn="check"]');
    assert.equal(h.$("[data-cn-root]").dataset.phase, "accepted");
    assert.equal(h.$$(".cn-gap-fb.is-right").length, 3);
    assert.equal(h.log.ledger.length, 0, "connector picks are not sentences");
    h.tap('[data-cn="to-transfer"]');
    assert.equal(h.$$(".cn-gap").length, 2);
    assert.equal(h.$(".cn-supports"), null);
    h.tap('[data-cn="pick"][data-i="0"][data-v="because"]');
    h.tap('[data-cn="pick"][data-i="1"][data-v="so"]');
    h.tap('[data-cn="check"]');
    assert.equal(h.$("[data-cn-root]").dataset.phase, "done");
    assert.equal(h.log.done.length, 0, "the step is not done until every module is");
  },
);

test("ui: support C offers help on request; independent mode starts in try with none", ui, () => {
  const c = harness(pack35, { support: "C" });
  assert.equal(c.$(".cn-supports .cn-frames"), null);
  assert.deepEqual(c.log.helps, []);
  assert.equal(c.$$('[data-cn="help"]').length, 3);
  c.tap('[data-cn="help"][data-v="bank"]');
  assert.deepEqual(c.log.helps, ["build.expand.bank"]);
  assert.ok(c.$(".cn-bank"));
  assert.deepEqual(c.env.data.build.modules[0].supports, ["bank"]);
  const own = harness(pack35, { support: "A", independent: true });
  assert.equal(own.$("[data-cn-root]").dataset.phase, "try");
  assert.equal(own.$(".cn-supports"), null);
  assert.equal(own.$('[data-cn="help"]'), null);
  assert.deepEqual(own.log.helps, []);
  assert.ok(own.$(".cn-notice"));
  own.type('[data-k="tray"]', VALID_PLANT[0]);
  own.tap('[data-cn="check"]');
  assert.equal(own.log.ledger[0].stage, "independent");
});

test(
  "ui: combine - source sentence chips, structure, connector and arrow; side-by-side is refused",
  ui,
  () => {
    const h = harness(band68, {
      support: "B",
      band: "6-8",
      data: { build: { ...C.initBuild(band68.build), index: 1 } },
    });
    h.tap('[data-cn="start"]');
    assert.equal(h.$$(".cn-pair .cn-chip").length, 2);
    h.tap('[data-k="pair-0"]');
    assert.equal(h.$('[data-k="tray"]').value, "The new gym wing blocks the afternoon sun");
    h.tap('[data-k="pair-1"]');
    h.tap('[data-cn="check"]');
    assert.equal(h.$("[data-cn-root]").dataset.phase, "try");
    assert.match(h.$(".cn-next").textContent, /side by side/);
    h.type(
      '[data-k="tray"]',
      "The new gym wing blocks the afternoon sun, so the tomato plants produce less fruit.",
    );
    h.tap('[data-cn="check"]');
    assert.equal(h.$("[data-cn-root]").dataset.phase, "accepted");
    assert.match(h.$(".cn-structure").textContent, /linking word/);
    assert.ok(h.$(".cn-arrow"));
    assert.equal(h.log.ledger.at(-1).m.complex + h.log.ledger.at(-1).m.compound >= 1, true);
  },
);

test(
  "ui: morphology - tap a chip then a slot, meaning match, feedback names the part type",
  ui,
  () => {
    const h = harness(synth, { support: "B" });
    h.tap('[data-cn="start"]');
    assert.equal(h.$$(".cn-word").length, 2);
    assert.equal(h.$$(".cn-reel").length, 6, "prefix/root/suffix slot for each of the two words");
    // wrong placement first
    h.tap('[data-cn="mchip"][data-w="0"][data-v="build"]');
    assert.equal(h.$('[data-cn="mchip"][data-v="build"]').getAttribute("aria-pressed"), "true");
    h.tap('[data-cn="slot"][data-w="0"][data-type="prefix"]');
    assert.equal(
      h.$('[data-cn="slot"][data-w="0"][data-type="prefix"]').textContent.trim(),
      "build",
    );
    assert.equal(h.$('[data-cn="mchip"][data-v="build"]'), null, "a placed chip leaves the pool");
    h.tap('[data-cn="check"]');
    assert.match(h.$(".cn-parts-fb").textContent, /Check the prefix/);
    // take it back, build it right
    h.tap('[data-cn="slot"][data-w="0"][data-type="prefix"]');
    assert.ok(h.$('[data-cn="mchip"][data-v="build"]'));
    const place = (w, v, type) => {
      h.tap(`[data-cn="mchip"][data-w="${w}"][data-v="${v}"]`);
      h.tap(`[data-cn="slot"][data-w="${w}"][data-type="${type}"]`);
    };
    place(0, "re", "prefix");
    place(0, "build", "root");
    place(1, "pollute", "root");
    place(1, "tion", "suffix");
    const meaning = (w, answer) => h.tap(`[data-cn="mean"][data-w="${w}"][data-v="${answer}"]`);
    meaning(0, C.meaningQuestion(morph, 0).answer);
    meaning(1, C.meaningQuestion(morph, 1).answer);
    h.tap('[data-cn="check"]');
    assert.equal(h.$("[data-cn-root]").dataset.phase, "accepted");
  },
);

test("ui: pronoun - highlighted pronouns and referent pickers; wrong pick is generic", ui, () => {
  const h = harness(synth, {
    support: "C",
    data: { build: { ...C.initBuild(synth.build), index: 1 } },
  });
  h.tap('[data-cn="start"]');
  assert.equal(h.$$("mark.cn-pron").length, 4, "two in the text, two on the pickers");
  h.tap('[data-cn="pick"][data-i="0"][data-v="Maya"]');
  h.tap('[data-cn="pick"][data-i="1"][data-v="the seeds"]');
  h.tap('[data-cn="check"]');
  assert.match(h.$(".cn-gap-fb.is-hint").textContent, /who is doing the action/);
  assert.doesNotMatch(h.$(".cn-gap-fb.is-hint").textContent, /Ana/);
  h.tap('[data-cn="pick"][data-i="0"][data-v="Ana"]');
  h.tap('[data-cn="check"]');
  assert.equal(h.$("[data-cn-root]").dataset.phase, "accepted");
});

test(
  "ui: discourse - up/down buttons reorder, first wrong place is marked, connectors are chips",
  ui,
  () => {
    const h = harness(synth, {
      support: "C",
      data: { build: { ...C.initBuild(synth.build), index: 2 } },
    });
    h.tap('[data-cn="start"]');
    assert.equal(h.$$(".cn-unit").length, 4);
    assert.equal(h.$$(".cn-conn").length, 2);
    const order = () => h.$$(".cn-unit-t").map((p) => p.textContent);
    const want = disc.order.map((id) => disc.units.find((u) => u.id === id).text);
    const bubble = () => {
      for (let guard = 0; guard < 30 && JSON.stringify(order()) !== JSON.stringify(want); guard++) {
        const o = order();
        const pos = o.findIndex((t, k) => t !== want[k]);
        const from = o.indexOf(want[pos]);
        h.tap(`[data-cn="move"][data-pos="${from}"][data-dir="-1"]`);
      }
    };
    h.tap('[data-cn="check"]');
    assert.equal(h.$$(".cn-unit.is-check").length, 1, "only the first wrong place is marked");
    assert.doesNotMatch(h.$(".feedback").textContent, /oak tree/);
    bubble();
    assert.deepEqual(order(), want);
    h.tap('[data-cn="dconn"][data-i="0"][data-v="so"]');
    h.tap('[data-cn="dconn"][data-i="1"][data-v="finally"]');
    h.tap('[data-cn="check"]');
    assert.equal(h.$("[data-cn-root]").dataset.phase, "accepted");
    assert.ok(
      h.$$(".cn-btn-ico").every((b) => b.disabled),
      "locked once accepted",
    );
  },
);

test(
  "ui: completing every module calls env.done once with the contract shape and persists for resume",
  ui,
  () => {
    const h = harness(pack35, { support: "B" });
    const run = (module, accepted, transfer) => {
      h.tap('[data-cn="start"]');
      accepted();
      h.tap('[data-cn="to-transfer"]');
      transfer();
      assert.ok(h.log.ledger.length >= 0, module);
    };
    run(
      "expand",
      () => {
        h.type('[data-k="tray"]', VALID_PLANT[1]);
        h.tap('[data-cn="check"]');
      },
      () => {
        h.type('[data-k="tray"]', "Since the beans got no sun in the shade, they turned yellow.");
        h.tap('[data-cn="check"]');
      },
    );
    h.tap('[data-cn="next"]');
    run(
      "connector",
      () => {
        for (const [i, v] of [
          [0, "because"],
          [1, "so"],
          [2, "but"],
        ])
          h.tap(`[data-cn="pick"][data-i="${i}"][data-v="${v}"]`);
        h.tap('[data-cn="check"]');
      },
      () => {
        for (const [i, v] of [
          [0, "because"],
          [1, "so"],
        ])
          h.tap(`[data-cn="pick"][data-i="${i}"][data-v="${v}"]`);
        h.tap('[data-cn="check"]');
      },
    );
    assert.equal(h.log.done.length, 1);
    const res = h.log.done[0];
    assert.deepEqual(
      res.modules.map((m) => [m.module, m.transferOk]),
      [
        ["expand", true],
        ["connector", true],
      ],
    );
    assert.ok(
      res.modules.every((m) => Number.isInteger(m.attempts) && Array.isArray(m.supportsUsed)),
    );
    assert.deepEqual(res.supportsUsed.sort(), ["frames"]);
    assert.ok(h.$(".cn-finished"));
    assert.equal(h.env.data.build.finished, true);
    // resume: a fresh mount from the saved data shows the finished step and does not call done again
    const again = harness(pack35, { support: "B", data: JSON.parse(JSON.stringify(h.env.data)) });
    assert.ok(again.$(".cn-finished"));
    assert.equal(again.log.done.length, 0);
  },
);

test("ui: a reload resumes the typed draft, the selected module and the phase", ui, () => {
  const h = harness(pack35, { support: "B" });
  h.tap('[data-cn="start"]');
  h.type('[data-k="tray"]', "The plant grew tall");
  h.tap('[data-cn="check"]');
  const saved = JSON.parse(JSON.stringify(h.env.data));
  const again = harness(pack35, { support: "B", data: saved });
  assert.equal(again.$("[data-cn-root]").dataset.phase, "try");
  assert.equal(again.$('[data-k="tray"]').value, "The plant grew tall");
  assert.ok(again.$(".cn-needs"), "the last check is still shown");
});

test("ui: a malformed pack shows a calm error instead of throwing", ui, () => {
  const bad = {
    ...band35,
    build: [{ kind: "build", module: "expand", title: "x", base: "A.", needs: [], transfer: {} }],
  };
  const h = harness(bad);
  assert.ok(h.$('[role="alert"]'));
});

test("css: uses ds.css tokens only, no purple, violet or magenta hex", () => {
  const css = readFileSync(
    new URL("../access-practice-lab/journey-construct.css", import.meta.url),
    "utf8",
  );
  for (const [, hex] of css.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
    const h = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
    const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16) / 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max - min < 0.1) continue;
    const d = max - min;
    const hue =
      (max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;
    assert.ok(
      !((hue + 360) % 360 >= 255 && (hue + 360) % 360 <= 335),
      `#${hex} is in the violet range`,
    );
  }
  assert.match(css, /prefers-reduced-motion: reduce/);
});
