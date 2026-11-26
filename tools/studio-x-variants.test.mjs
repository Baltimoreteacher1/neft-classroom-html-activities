// Resource variants: same seed -> same bytes, different seeds -> different numbers, every new answer recomputed
// independently (here with plain floating point, a third evaluator beside the generator's builders and the
// module's exact-rational check), the original never touched, equivalence never claimed.
//   node --test tools/studio-x-variants.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import {
  answerText,
  checkResponse,
  tableBlanks,
} from "../access-practice-lab/src/studio/core/check.js";
import { allFormats } from "../access-practice-lab/src/studio/core/fixtures.js";
import { generateMath, MATH_TOPICS } from "../access-practice-lab/src/studio/core/mathgen.js";
import {
  normalizeActivity,
  questionsOf,
  uid,
} from "../access-practice-lab/src/studio/core/schema.js";
import { validateActivity } from "../access-practice-lab/src/studio/core/validate.js";
import { makeVariant, VARIANT_MODES } from "../access-practice-lab/src/studio/x/variants.js";
import { CONTEXT_TABLE } from "../access-practice-lab/src/studio/x/variants-context.js";

const deepFreeze = (o) => {
  for (const v of Object.values(o)) if (v && typeof v === "object") deepFreeze(v);
  return Object.freeze(o);
};
const sheet = (topic, extra = {}) =>
  normalizeActivity({
    id: "orig",
    title: `Practice ${topic}`,
    kind: "worksheet",
    context: { grade: "6", subject: "Math", source: { origin: "teacher" } },
    blocks: [
      { id: "d1", type: "text", role: "directions", text: "Solve." },
      ...generateMath({ topic, grade: 6, count: 10, seed: 11, level: 2 }),
    ],
    ...extra,
  });
const pair = (p) => p && typeof p.en === "string" && p.en && typeof p.es === "string" && p.es;
/** Identifies one drawn item (the same prompt can be drawn with different choices). */
const sig = (q) =>
  JSON.stringify([
    q.prompt,
    q.options?.map((o) => o.text),
    q.answer,
    q.steps?.map((x) => x.text),
    q.fixOptions?.map((o) => o.text),
    q.fixAnswer,
  ]);
const digitsOf = (a) => JSON.stringify(a).match(/\d+(?:\.\d+)?/g) || [];

/** Plain floating point, independent of core/math.js and of the generator kit. */
const fl = (expr) =>
  Function(
    `"use strict";return (${expr.replace(/[×·]/g, "*").replace(/÷/g, "/").replace(/[−–]/g, "-").replace(/\^/g, "**")})`,
  )();
const flText = (t) => {
  const s = t.replace(/[{}]/g, "").replace(/[$,]/g, "").replace(/[−–]/g, "-").trim();
  let m = /^(\d+):(\d+)/.exec(s);
  if (m) return Number(m[1]) / Number(m[2]);
  m = /^(-?\d+) (\d+)\/(\d+)/.exec(s);
  if (m) return Number(m[1]) + Number(m[2]) / Number(m[3]);
  m = /^(-?\d+)\/(\d+)/.exec(s);
  if (m) return Number(m[1]) / Number(m[2]);
  m = /^(-?[\d.]+)(%?)/.exec(s);
  return m ? Number(m[1]) / (m[2] ? 100 : 1) : NaN;
};

test("modes, bad arguments", () => {
  assert.deepEqual([...VARIANT_MODES], ["numbers", "reorder", "context"]);
  const a = sheet("unit-rate");
  assert.throws(() => makeVariant(a, { seed: 1.5, mode: "numbers" }), TypeError);
  assert.throws(() => makeVariant(a, { seed: "1", mode: "numbers" }), TypeError);
  assert.throws(() => makeVariant(a, { seed: 1, mode: "harder" }), RangeError);
  const wrong = structuredClone(allFormats());
  wrong.blocks.find((b) => b.id === "q-number").answer = "999";
  assert.throws(
    () => makeVariant(wrong, { seed: 1, mode: "reorder" }),
    /has errors/,
    "a wrong original is never varied",
  );
});

for (const mode of VARIANT_MODES) {
  test(`${mode}: same seed -> byte-identical output; the original is untouched; the result is valid and honest`, () => {
    const originals = [sheet("unit-rate"), sheet("equivalent-ratios"), allFormats("worksheet")];
    for (const original of originals) {
      const frozen = deepFreeze(structuredClone(original));
      const before = JSON.stringify(frozen);
      const r1 = makeVariant(frozen, { seed: 7, mode });
      const r2 = makeVariant(frozen, { seed: 7, mode });
      assert.equal(JSON.stringify(r1), JSON.stringify(r2), "byte-identical");
      assert.equal(JSON.stringify(frozen), before, "original untouched");
      assert.notEqual(r1.activity.id, original.id);
      assert.equal(r1.activity.rev, 0);
      assert.equal(r1.seed, 7);
      assert.equal(r1.mode, mode);
      assert.equal(r1.equivalence, "not-claimed");
      assert.ok(pair(r1.note));
      for (const c of r1.changes) assert.ok(pair(c.message), "change is bilingual");
      for (const s of r1.skipped) assert.ok(pair(s.reason), "skip is bilingual");
      for (const s of r1.review) assert.ok(pair(s.message));
      assert.deepEqual(
        normalizeActivity(structuredClone(r1.activity)),
        r1.activity,
        "already normalized",
      );
      assert.equal(validateActivity(r1.activity).ok, true);
      assert.equal(
        questionsOf(r1.activity).length,
        questionsOf(original).length,
        "no question added or lost",
      );
      assert.deepEqual(
        r1.activity.blocks.map((b) => b.id).sort(),
        original.blocks.map((b) => b.id).sort(),
        "block ids are kept",
      );
    }
  });
}

test("uid: ids can come from schema.uid when the caller wants random ones", () => {
  const a = sheet("unit-rate");
  const x = makeVariant(a, { seed: 1, mode: "reorder" }, { uid });
  const y = makeVariant(a, { seed: 1, mode: "reorder" }, { uid });
  assert.notEqual(x.activity.id, y.activity.id);
  assert.match(x.activity.id, /^a/);
});

test("numbers: different seeds give different numbers for generators that allow it", () => {
  const a = sheet("unit-rate");
  const outs = [1, 2, 3, 4, 5].map((seed) =>
    JSON.stringify(makeVariant(a, { seed, mode: "numbers" }).activity.blocks),
  );
  assert.ok(new Set(outs).size >= 4, "seeds give different sets");
  const r = makeVariant(a, { seed: 1, mode: "numbers" });
  assert.ok(r.changes.length >= 4, `${r.changes.length} items regenerated`);
  for (const c of r.changes) assert.notEqual(c.before, c.after);
});

test("numbers: every regenerated answer is recomputed independently and matches, in every topic", () => {
  let checked = 0;
  for (const topic of MATH_TOPICS) {
    const captured = new Map();
    const generate = (opts) => {
      const items = generateMath(opts);
      for (const it of items) captured.set(sig(it), it);
      return items;
    };
    const a = sheet(topic.id);
    for (const seed of [3, 4]) {
      const r = makeVariant(a, { seed, mode: "numbers" }, { generate, strict: true });
      for (const c of r.changes) {
        const q = r.activity.blocks.find((b) => b.id === c.blockId);
        const raw = captured.get(sig(q));
        assert.ok(raw, "the new item is one the generator made");
        assert.equal(raw.skill, topic.id);
        if (q.format === "number")
          assert.ok(Math.abs(fl(raw.expr) - flText(q.answer)) < 1e-9, `${topic.id}: ${q.prompt}`);
        if (q.format === "numberline") assert.ok(Math.abs(fl(raw.expr) - flText(q.answer)) < 1e-9);
        if (q.format === "choice") {
          const right = q.options.find((o) => o.id === q.answer);
          assert.ok(Math.abs(fl(raw.expr) - flText(right.text)) < 1e-9, `${topic.id}: ${q.prompt}`);
          assert.equal(
            q.options.filter((o) => Math.abs(flText(o.text) - fl(raw.expr)) < 1e-9).length,
            1,
          );
        }
        if (q.format === "fillTable") assert.ok(tableBlanks(q).length > 0);
        const right =
          q.format === "error"
            ? { step: q.errorStep, fix: q.fixAnswer }
            : q.format === "fillTable"
              ? Object.fromEntries(tableBlanks(q).map((b) => [b.key, b.answer]))
              : q.answer;
        assert.equal(checkResponse(q, right).status, "correct", q.prompt);
        checked++;
      }
    }
  }
  assert.ok(checked > 100, `${checked} regenerated items verified`);
});

test("numbers: an answer that fails independent recomputation is skipped (or throws when strict)", () => {
  const corrupt = (opts) =>
    generateMath(opts).map((it) =>
      it.format === "number" ? { ...it, answer: String(Number.parseFloat(it.answer) + 1) } : it,
    );
  const a = sheet("unit-rate");
  const numberIds = questionsOf(a)
    .filter((q) => q.format === "number")
    .map((q) => q.id);
  assert.ok(numberIds.length >= 2);
  const r = makeVariant(a, { seed: 2, mode: "numbers" }, { generate: corrupt });
  for (const id of numberIds) {
    assert.ok(!r.changes.some((c) => c.blockId === id), "never keeps an unverified answer");
    assert.ok(
      r.skipped.some((s) => s.blockId === id),
      "and says so",
    );
    assert.deepEqual(
      r.activity.blocks.find((b) => b.id === id),
      a.blocks.find((b) => b.id === id),
      "kept as it was",
    );
  }
  assert.throws(
    () => makeVariant(a, { seed: 2, mode: "numbers" }, { generate: corrupt, strict: true }),
    /variants:/,
  );
});

test("numbers: only families a generator can reproduce are changed; the rest is skipped with a reason", () => {
  const a = normalizeActivity({
    id: "mixed",
    title: "Mixed",
    kind: "worksheet",
    context: { grade: "6", subject: "Math", source: { origin: "teacher" } },
    blocks: [
      { id: "d1", type: "text", role: "directions", text: "Go." },
      {
        id: "h1",
        type: "question",
        format: "number",
        prompt: "What is 12 + 30?",
        answer: "42",
        explanation: "12 + 30 = 42.",
      },
      {
        id: "e1",
        type: "question",
        format: "number",
        skill: "unit-rate",
        prompt: "Pens cost $6 for 3. What is one pen, in dollars? Show it.",
        answer: "2",
        explanation: "6 ÷ 3 = 2.",
      },
      {
        id: "o1",
        type: "question",
        format: "order",
        skill: "order-of-operations",
        prompt: "Order.",
        items: [{ text: "a" }, { text: "b" }],
      },
      { id: "p1", type: "question", format: "short", prompt: "Explain.", sample: "x" },
      { id: "n1", type: "note", text: "Teacher note." },
    ],
  });
  const r = makeVariant(a, { seed: 1, mode: "numbers" });
  assert.equal(r.changes.length, 0);
  const reason = (id) => r.skipped.find((s) => s.blockId === id).reason.en;
  assert.match(reason("h1"), /does not record a generator family/);
  assert.match(reason("e1"), /No verified generator reproduced/);
  assert.match(reason("o1"), /no independent way to recompute/);
  assert.match(reason("p1"), /no independent way to recompute/);
  assert.deepEqual(
    r.activity.blocks.map((b) => b.id),
    a.blocks.map((b) => b.id),
  );
  assert.equal(
    answerText(questionsOf(r.activity)[0]),
    "42",
    "hand-written items keep their answers",
  );
});

test("numbers: an item with a picture is never regenerated", () => {
  const a = sheet("area-perimeter");
  const withPic = structuredClone(a);
  const q = withPic.blocks.find((b) => b.type === "question");
  q.image = { src: "/assets/x.png", alt: "A poster" };
  const r = makeVariant(withPic, { seed: 1, mode: "numbers" });
  assert.match(r.skipped.find((s) => s.blockId === q.id).reason.en, /picture/);
});

// ── reorder ────────────────────────────────────────────────────────────────────

const key = (q) => {
  // What each answer MEANS (the text it points at), independent of where the item sits.
  const t = (list, id) => list.find((x) => x.id === id)?.text;
  switch (q.format) {
    case "choice":
      return t(q.options, q.answer);
    case "multi":
      return q.answers
        .map((id) => t(q.options, id))
        .sort()
        .join("|");
    case "match":
      return q.pairs
        .map((p) => `${p.left}=${p.right}`)
        .sort()
        .join("|");
    case "sort":
      return q.items
        .map((i) => `${i.text}:${q.categories.find((c) => c.id === i.category)?.label}`)
        .sort()
        .join("|");
    case "error":
      return `${q.steps.find((s) => s.id === q.errorStep)?.text}→${t(q.fixOptions, q.fixAnswer)}`;
    default:
      return answerText(q);
  }
};

test("reorder: choices, pairs and questions move; every answer still means the same thing", () => {
  const a = allFormats("worksheet");
  const outs = new Set();
  for (const seed of [1, 2, 3, 4]) {
    const r = makeVariant(a, { seed, mode: "reorder" });
    outs.add(
      JSON.stringify(r.activity.blocks.map((b) => b.id)) +
        JSON.stringify(questionsOf(r.activity).map((q) => q.options?.map((o) => o.id))),
    );
    const before = new Map(questionsOf(a).map((q) => [q.id, q]));
    for (const q of questionsOf(r.activity)) {
      assert.equal(key(q), key(before.get(q.id)), `${q.format} key preserved`);
      const o = before.get(q.id);
      if (q.format === "order")
        assert.deepEqual(q.items, o.items, "an ordered list is never reordered");
      if (q.format === "build") assert.deepEqual(q.words, o.words);
      if (q.format === "error") assert.deepEqual(q.steps, o.steps);
    }
    assert.ok(r.changes.length > 0);
  }
  assert.ok(outs.size >= 3, "different seeds give different orders");
});

test("reorder: questions stay after the passage they follow; games and cross-references are left alone", () => {
  const mk = (blocks, extra = {}) =>
    normalizeActivity({
      id: "r1",
      title: "R",
      kind: "worksheet",
      context: { grade: "6", subject: "Math", source: { origin: "teacher" } },
      blocks,
      ...extra,
    });
  const q = (id, prompt, extra = {}) => ({
    id,
    type: "question",
    format: "choice",
    prompt,
    options: [
      { id: "a", text: "Yes" },
      { id: "b", text: "No" },
    ],
    answer: "a",
    explanation: "Because.",
    ...extra,
  });
  const a = mk([
    q("q1", "One?"),
    q("q2", "Two?"),
    q("q3", "Three?"),
    { id: "p1", type: "passage", title: "T", text: "Text." },
    q("q4", "Four?"),
    q("q5", "Five?"),
    q("q6", "Six?"),
  ]);
  for (const seed of [1, 2, 3, 4, 5]) {
    const ids = makeVariant(a, { seed, mode: "reorder" }).activity.blocks.map((b) => b.id);
    assert.equal(ids[3], "p1", "the passage does not move");
    assert.deepEqual(ids.slice(0, 3).sort(), ["q1", "q2", "q3"]);
    assert.deepEqual(ids.slice(4).sort(), ["q4", "q5", "q6"]);
  }
  const game = mk([q("q1", "One?"), q("q2", "Two?"), q("q3", "Three?")], { kind: "game" });
  const g = makeVariant(game, { seed: 3, mode: "reorder" });
  assert.deepEqual(
    g.activity.blocks.map((b) => b.id),
    ["q1", "q2", "q3"],
  );
  assert.ok(g.skipped.some((s) => /difficulty path/.test(s.reason.en)));
  const refer = mk([
    q("q1", "One?"),
    q("q2", "Use your answer from the previous question."),
    q("q3", "Three?"),
  ]);
  const f = makeVariant(refer, { seed: 3, mode: "reorder" });
  assert.deepEqual(
    f.activity.blocks.map((b) => b.id),
    ["q1", "q2", "q3"],
  );
  assert.ok(f.skipped.some((s) => /another question/.test(s.reason.en)));
  const positional = mk([
    q("q1", "One?", {
      options: [
        { id: "a", text: "Red" },
        { id: "b", text: "Blue" },
        { id: "c", text: "Both A and B" },
      ],
    }),
    q("q2", "Two?"),
  ]);
  const p = makeVariant(positional, { seed: 3, mode: "reorder" });
  assert.deepEqual(
    p.activity.blocks.find((b) => b.id === "q1").options.map((o) => o.id),
    ["a", "b", "c"],
  );
  assert.ok(p.skipped.some((s) => s.blockId === "q1"));
});

// ── context ────────────────────────────────────────────────────────────────────

const story = (extra = {}) =>
  normalizeActivity({
    id: "c1",
    title: "Marbles at the park",
    kind: "worksheet",
    context: { grade: "6", subject: "Math", source: { origin: "teacher" } },
    blocks: [
      { id: "d1", type: "text", role: "directions", text: "Read each problem." },
      {
        id: "v1",
        type: "vocab",
        items: [{ id: "w1", term: "ratio", def: "Compares two amounts.", es: "razón" }],
      },
      {
        id: "p1",
        type: "passage",
        title: "At the park",
        text: "Omar and Kai go to the park. Omar has 12 marbles. Kai has 8 marbles.",
      },
      {
        id: "q1",
        type: "question",
        format: "choice",
        prompt: "Omar gives Kai 4 marbles at the park. Who has more?",
        options: [
          { id: "a", text: "Omar" },
          { id: "b", text: "Kai" },
        ],
        answer: "a",
        hint: "Count the marbles.",
        explanation: "Omar has 8 marbles and Kai has 12 marbles.",
      },
      {
        id: "q2",
        type: "question",
        format: "blank",
        prompt: "Fill in.",
        text: "A marble is [[round]]. The ratio of Omar's marbles to Kai's marbles is [[12:8]].",
      },
      { id: "n1", type: "note", text: "Omar is the confident one." },
    ],
    ...extra,
  });

test("context: names, places and objects swap consistently; numbers, vocabulary and answers do not change", () => {
  const a = story();
  const r = makeVariant(a, { seed: 4, mode: "context" });
  const text = JSON.stringify(r.activity.blocks);
  assert.ok(
    !/Omar|Kai|marble|the park/i.test(text.replace(/"id":"[^"]*"/g, "")),
    "every registered token is gone",
  );
  assert.ok(r.changes.length >= 4, "names, place, object");
  assert.deepEqual(digitsOf(r.activity.blocks), digitsOf(a.blocks), "numbers untouched");
  assert.deepEqual(
    r.activity.blocks.find((b) => b.id === "v1"),
    a.blocks.find((b) => b.id === "v1"),
    "vocabulary untouched",
  );
  const was = a.blocks.find((b) => b.id === "q1");
  const now = r.activity.blocks.find((b) => b.id === "q1");
  assert.equal(now.answer, was.answer, "answer ids untouched");
  assert.equal(
    now.options.find((o) => o.id === now.answer).text,
    "Omar".replace("Omar", now.options[0].text),
    "the keyed option is the swapped name",
  );
  // consistency: the name in the passage is the name in the question and the key
  const newName = now.options[0].text;
  assert.ok(r.activity.blocks.find((b) => b.id === "p1").text.includes(newName));
  assert.ok(
    r.activity.blocks.find((b) => b.id === "n1").text.startsWith(newName),
    "teacher notes follow",
  );
  assert.equal(validateActivity(r.activity).ok, true);
  assert.ok(r.review.some((x) => /Read each story/.test(x.message.en)));
  assert.notEqual(
    JSON.stringify(makeVariant(a, { seed: 5, mode: "context" }).activity.blocks),
    JSON.stringify(r.activity.blocks),
  );
  assert.equal(
    JSON.stringify(a.blocks.find((b) => b.id === "q1")).includes("Omar"),
    true,
    "original untouched",
  );
});

test("context: a token that is also a vocabulary word is not swapped; tokens never collide; pictures raise a review", () => {
  const a = story();
  a.blocks
    .find((b) => b.id === "v1")
    .items.push({
      id: "w2",
      term: "marble",
      def: "A small glass ball.",
      es: "canica",
      example: "",
      image: null,
    });
  const r = makeVariant(a, { seed: 4, mode: "context" });
  assert.ok(JSON.stringify(r.activity.blocks).includes("marbles"), "marble words stay");
  assert.ok(r.skipped.some((s) => /marble/.test(s.reason.en) && /vocabulary/.test(s.reason.en)));
  assert.ok(!r.changes.some((c) => /marble/.test(c.message.en)));
  const pic = story();
  pic.blocks.splice(2, 0, {
    id: "i1",
    type: "image",
    src: "/assets/x.png",
    alt: "Omar with marbles",
    caption: "",
    decorative: false,
  });
  assert.ok(
    makeVariant(pic, { seed: 4, mode: "context" }).review.some((x) =>
      /Pictures were not changed/.test(x.message.en),
    ),
  );
  const names = new Set(Object.values(CONTEXT_TABLE.names).flat());
  assert.equal(
    names.size,
    Object.values(CONTEXT_TABLE.names).flat().length,
    "the table has no repeated name",
  );
  for (const [sg, pl] of CONTEXT_TABLE.objects)
    assert.ok(!/^[aeiou]/i.test(sg) && pl === `${sg}s`, "a/an stays right");
});

test("context: pronouns keep agreeing (names move only inside their pronoun group)", () => {
  const a = normalizeActivity({
    id: "c2",
    title: "Ana",
    kind: "worksheet",
    context: { grade: "6", subject: "Math", source: { origin: "teacher" } },
    blocks: [
      { id: "d1", type: "text", role: "directions", text: "Go." },
      {
        id: "q1",
        type: "question",
        format: "number",
        prompt: "Ana has 3 stickers. She buys 4 more. How many does she have?",
        answer: "7",
        explanation: "3 + 4 = 7.",
      },
      {
        id: "q2",
        type: "question",
        format: "number",
        prompt: "Sam has 2 stickers and Sam gets 5 more. How many are there?",
        answer: "7",
        explanation: "2 + 5 = 7.",
      },
      {
        id: "q3",
        type: "question",
        format: "number",
        prompt: "Luis has 1 sticker. He finds 2 more. How many does he have?",
        answer: "3",
        explanation: "1 + 2 = 3.",
      },
    ],
  });
  const r = makeVariant(a, { seed: 2, mode: "context" });
  const she = new Set(CONTEXT_TABLE.names.she);
  const he = new Set(CONTEXT_TABLE.names.he);
  const [q1, q2, q3] = questionsOf(r.activity);
  assert.ok(she.has(q1.prompt.split(" ")[0]) && q1.prompt.split(" ")[0] !== "Ana");
  assert.ok(he.has(q3.prompt.split(" ")[0]) && q3.prompt.split(" ")[0] !== "Luis");
  assert.ok(
    q2.prompt.startsWith("Sam"),
    "Sam can take any pronoun, so it stays while the text has he/she",
  );
  assert.ok(r.skipped.some((s) => /Sam/.test(s.reason.en)));
  assert.ok(/ She buys/.test(q1.prompt) && / He finds/.test(q3.prompt));
  assert.equal(q1.answer, "7");
});
