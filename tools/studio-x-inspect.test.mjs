// Creation Quality Inspector: every finding type has a minimal failing fixture, the clean fixture has no "fix",
// repairs are idempotent and never change an answer, and the input is never touched.
//   node --test tools/studio-x-inspect.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { answerText } from "../access-practice-lab/src/studio/core/check.js";
import { allFormats } from "../access-practice-lab/src/studio/core/fixtures.js";
import { normalizeActivity, questionsOf } from "../access-practice-lab/src/studio/core/schema.js";
import { studentCopyFor } from "../access-practice-lab/src/studio/core/student-copy.js";
import {
  applyRepair,
  inspectResource,
  REPAIR_IDS,
} from "../access-practice-lab/src/studio/x/inspect.js";

const DIRECTIONS = { id: "d1", type: "text", role: "directions", text: "Read, then answer." };
/** A small activity: directions + the given blocks. */
const act = (blocks, extra = {}) =>
  normalizeActivity({
    id: "t1",
    title: "Test",
    kind: "interactive",
    context: { grade: "6", subject: "Math", source: { origin: "teacher" } },
    supports: { hints: false },
    blocks: [DIRECTIONS, ...blocks],
    ...extra,
  });
const choice = (extra = {}) => ({
  id: "q1",
  type: "question",
  format: "choice",
  prompt: "Pick one.",
  options: [
    { id: "a", text: "Yes" },
    { id: "b", text: "No" },
  ],
  answer: "a",
  explanation: "Because.",
  ...extra,
});
const num = (extra = {}) => ({
  id: "q1",
  type: "question",
  format: "number",
  prompt: "How many?",
  answer: "4",
  explanation: "Count them.",
  ...extra,
});
const ids = (r) => r.findings.map((f) => f.id);
const find = (r, id) => r.findings.find((f) => f.id === id);
const pairOk = (p) => p && typeof p.en === "string" && typeof p.es === "string" && p.en && p.es;

test("clean fixture: allFormats() has no 'fix' finding, in every kind and format", () => {
  for (const kind of ["interactive", "game", "check", "worksheet"])
    for (const format of ["student", "print", "word"]) {
      const copy = format === "student" ? { copy: studentCopyFor } : {};
      const r = inspectResource(allFormats(kind), { format, ...copy });
      assert.deepEqual(
        r.findings.filter((f) => f.severity === "fix"),
        [],
        `${kind}/${format}`,
      );
      assert.equal(r.ok, true);
    }
});

test("every finding has an id, a severity, a where, and English + Spanish message and how", () => {
  const messy = act([choice({ answer: "" }), num({ explanation: "" })], { title: "" });
  const r = inspectResource(messy);
  assert.ok(r.findings.length > 2);
  for (const f of r.findings) {
    assert.ok(f.id && ["fix", "check", "note"].includes(f.severity), f.id);
    assert.equal(typeof f.where, "object");
    assert.ok(pairOk(f.message) && pairOk(f.how), f.id);
    assert.notEqual(f.message.es, f.message.en, `${f.id}: Spanish is not a copy`);
  }
  assert.equal(r.ok, false);
  assert.deepEqual(
    r.findings.map((f) => f.severity),
    [...r.findings.map((f) => f.severity)].sort(
      (a, b) => ["fix", "check", "note"].indexOf(a) - ["fix", "check", "note"].indexOf(b),
    ),
    "fix first",
  );
});

test("validateActivity errors and warnings are surfaced, translated, and not re-implemented", () => {
  const r = inspectResource(act([choice({ answer: "zzz" })]));
  const f = find(r, "validate:no-answer");
  assert.equal(f.severity, "fix");
  assert.deepEqual(f.where, { blockId: "q1", questionId: "q1" });
  assert.match(f.message.en, /^Question 1: /);
  assert.match(f.message.es, /^Pregunta 1: Elija cuál opción es la correcta/);
  assert.ok(
    !ids(r).includes("missing-answer"),
    "no second finding for what validate already reported",
  );
  const w = find(inspectResource(act([choice(), choice({ id: "q2" })])), "validate:dup-question");
  assert.equal(w.severity, "check");
  assert.match(w.message.es, /repite la Pregunta 1/);
});

test("missing directions: activity level and per question, with a safe repair", () => {
  const noDir = normalizeActivity({ ...act([choice()]), blocks: [choice()] });
  const f = find(inspectResource(noDir), "missing-directions");
  assert.ok(f && !f.repair);
  const blank = act([
    { id: "q1", type: "question", format: "blank", prompt: "", text: "Seeds need [[water]]." },
  ]);
  const g = find(inspectResource(blank), "missing-question-directions");
  assert.equal(g.repair, "add-default-directions");
  assert.deepEqual(g.where, { blockId: "q1", questionId: "q1" });
  const fixed = applyRepair(blank, g.repair, g.where);
  assert.equal(fixed.applied, true);
  assert.equal(
    questionsOf(fixed.activity)[0].prompt,
    "Write the missing word or number on each line.",
  );
  assert.ok(!ids(inspectResource(fixed.activity)).includes("missing-question-directions"));
  assert.equal(applyRepair(fixed.activity, g.repair, g.where).applied, false);
});

test("missing answers that validate does not see: a blank table cell with no key", () => {
  const t = act([
    {
      id: "q1",
      type: "question",
      format: "fillTable",
      prompt: "Fill in.",
      headers: ["a", "b"],
      rows: [
        ["1", { answer: "2" }],
        ["3", { answer: "" }],
      ],
    },
  ]);
  const r = inspectResource(t);
  assert.ok(find(r, "missing-answer"));
  assert.equal(find(r, "missing-answer").severity, "fix");
});

test("wrong arithmetic: number answers, math statements and blanks, by exact fractions", () => {
  const bad = (blocks) => find(inspectResource(act(blocks)), "wrong-arithmetic");
  const good = (blocks) => !ids(inspectResource(act(blocks))).includes("wrong-arithmetic");
  assert.ok(bad([num({ prompt: "What is {3/4} + {1/2}?", answer: "1" })]));
  assert.ok(good([num({ prompt: "What is {3/4} + {1/2}?", answer: "5/4" })]));
  assert.ok(good([num({ prompt: "What is {3/4} + {1/2}?", answer: "1 1/4" })]), "equal by value");
  assert.ok(good([num({ prompt: "What is 0.1 + 0.2?", answer: "3/10" })]), "exact, no float noise");
  assert.ok(bad([num({ prompt: "Calculate 12 × 7.", answer: "82" })]));
  assert.ok(good([num({ prompt: "Calculate 12 × 7.", answer: "84" })]));
  assert.ok(
    good([num({ prompt: "A box holds 12 pens. How many in 7 boxes?", answer: "999" })]),
    "word problems are left to validate",
  );
  assert.ok(bad([{ id: "m1", type: "math", text: "{3/4} + {1/2} = 1" }]));
  assert.ok(good([{ id: "m1", type: "math", text: "{3/4} + {1/2} = {5/4}" }]));
  assert.ok(good([{ id: "m1", type: "math", text: "Area = 3 × 4 = 12" }]));
  assert.ok(bad([{ id: "m1", type: "math", text: "Area = 3 × 4 = 13" }]));
  assert.ok(
    good([{ id: "m1", type: "math", text: "2 {1/4} + {1/2} = 3" }]),
    "mixed numbers are skipped, not guessed",
  );
  assert.ok(
    bad([
      { id: "q1", type: "question", format: "blank", prompt: "Fill in.", text: "2 + 3 = [[6]]" },
    ]),
  );
  assert.ok(
    good([
      {
        id: "q1",
        type: "question",
        format: "blank",
        prompt: "Fill in.",
        text: "2 + 3 = [[5|5.0]]",
      },
    ]),
  );
  const f = bad([num({ prompt: "Calculate 12 × 7.", answer: "82" })]);
  assert.equal(f.severity, "fix");
  assert.match(f.message.es, /84/);
  assert.ok(!f.repair, "arithmetic needs the teacher's judgment");
});

test("invalid interaction configs", () => {
  const match = inspectResource(
    act([
      {
        id: "q1",
        type: "question",
        format: "match",
        prompt: "Match.",
        pairs: [{ id: "p1", left: "a", right: "b" }],
      },
    ]),
  );
  assert.equal(find(match, "validate:few-pairs").severity, "fix");
  const noCorrect = inspectResource(act([choice({ answer: "z" })]));
  assert.equal(find(noCorrect, "validate:no-answer").severity, "fix");

  const order = act([
    {
      id: "q1",
      type: "question",
      format: "order",
      prompt: "Order.",
      items: [
        { id: "i1", text: "Plant" },
        { id: "i2", text: "plant " },
        { id: "i3", text: "Grow" },
      ],
    },
  ]);
  const dup = find(inspectResource(order), "dup-order-item");
  assert.equal(dup.severity, "fix");
  assert.equal(dup.repair, "trim-duplicate-order-items");

  const sameId = act([
    choice({
      options: [
        { id: "a", text: "Yes" },
        { id: "a", text: "No" },
      ],
    }),
  ]);
  assert.ok(find(inspectResource(sameId), "dup-id"));

  const sort = act([
    {
      id: "q1",
      type: "question",
      format: "sort",
      prompt: "Sort.",
      categories: [
        { id: "x", label: "X" },
        { id: "y", label: "Y" },
      ],
      items: [
        { id: "i1", text: "a", category: "x" },
        { id: "i2", text: "b", category: "x" },
      ],
    },
  ]);
  assert.ok(find(inspectResource(sort), "empty-category"));

  const line = act([
    {
      id: "q1",
      type: "question",
      format: "numberline",
      prompt: "Place.",
      min: 0,
      max: 1,
      step: 0.25,
      answer: "1/3",
    },
  ]);
  assert.ok(find(inspectResource(line), "numberline-off-tick"));

  const plot = act([
    {
      id: "q1",
      type: "question",
      format: "plot",
      prompt: "Plot.",
      min: 0,
      max: 5,
      points: [
        { x: 1, y: 1 },
        { x: 1, y: 1 },
      ],
    },
  ]);
  assert.ok(find(inspectResource(plot), "dup-point"));
});

test("controls: only real gaps in the non-drag alternative are reported", () => {
  const base = allFormats();
  assert.ok(
    !ids(inspectResource(base)).includes("no-keyboard-path"),
    "the player has no drag-only format",
  );
  const hot = structuredClone(base);
  hot.blocks.find((b) => b.id === "q-hotspot").regions[0].label = "";
  assert.ok(find(inspectResource(hot), "no-keyboard-path"));
  const wide = act([
    {
      id: "q1",
      type: "question",
      format: "plot",
      prompt: "Plot.",
      min: 0,
      max: 50,
      points: [{ x: 40, y: 3 }],
    },
  ]);
  assert.equal(find(inspectResource(wide), "no-keyboard-path").severity, "fix");
  const ok = act([
    {
      id: "q1",
      type: "question",
      format: "plot",
      prompt: "Plot.",
      min: -10,
      max: 10,
      points: [{ x: 4, y: 3 }],
    },
  ]);
  assert.ok(!ids(inspectResource(ok)).includes("no-keyboard-path"));
});

test("student workspace on worksheets: short writing that cannot fit, long worked solutions", () => {
  const sheet = (b, extra = {}) => act([b], { kind: "worksheet", ...extra });
  const short = sheet({
    id: "q1",
    type: "question",
    format: "short",
    prompt: "Explain.",
    kind: "explain",
    minWords: 150,
    sample: "x",
  });
  assert.equal(find(inspectResource(short), "workspace-too-small").severity, "fix");
  const fits = sheet({
    id: "q1",
    type: "question",
    format: "short",
    prompt: "Explain.",
    kind: "explain",
    minWords: 40,
    sample: "x",
  });
  assert.ok(!ids(inspectResource(fits)).includes("workspace-too-small"));
  const steps = "1 + 1 = 2. Then 2 + 2 = 4. Then 4 + 4 = 8. Then 8 + 8 = 16.";
  const long = sheet(num({ explanation: steps }));
  assert.equal(find(inspectResource(long), "workspace-too-small").severity, "check");
  assert.ok(
    !ids(
      inspectResource(sheet(num({ explanation: steps }), { options: { workspace: "roomy" } })),
    ).includes("workspace-too-small"),
  );
  assert.ok(
    !ids(inspectResource(act([num({ explanation: steps })]))).includes("workspace-too-small"),
    "only for paper",
  );
});

test("answer-key exposure: notes, note blocks and (worksheets) answers in the student copy", () => {
  const withNotes = act([choice(), { id: "n1", type: "note", text: "TEACHER ONLY secret" }], {
    notes: { teacher: "Private plan", misconceptions: [] },
  });
  assert.ok(
    !ids(inspectResource(withNotes)).includes("answer-key-exposure"),
    "studentCopy strips notes",
  );
  const leaky = inspectResource(withNotes, { copy: (a) => a });
  assert.equal(leaky.findings.filter((f) => f.id === "answer-key-exposure").length, 2);
  const sheet = act([choice()], { kind: "worksheet" });
  assert.ok(
    !ids(inspectResource(sheet)).includes("answer-key-exposure"),
    "the standalone HTML export blanks worksheet answers (shared studentCopyFor)",
  );
  const html = find(inspectResource(sheet, { copy: (a) => a }), "answer-key-exposure");
  assert.ok(html, "a copy function that keeps answers is still reported");
  assert.match(html.message.en, /1 of 1 questions/);
  assert.ok(!ids(inspectResource(sheet, { copy: studentCopyFor })).includes("answer-key-exposure"));
  for (const format of ["print", "word"])
    assert.ok(!ids(inspectResource(withNotes, { format })).includes("answer-key-exposure"));
});

test("inconsistent terminology: vocabulary spelling and capital letters, with a safe repair", () => {
  const vocab = {
    id: "v1",
    type: "vocab",
    items: [{ id: "w1", term: "unit rate", def: "Amount for one.", es: "tasa unitaria" }],
  };
  const clean = act([
    vocab,
    { id: "p1", type: "passage", title: "T", text: "Unit rate is useful. A unit rate compares." },
  ]);
  assert.ok(
    !ids(inspectResource(clean)).includes("inconsistent-terminology"),
    "sentence-start capital is fine",
  );
  const messy = act([
    vocab,
    {
      id: "p1",
      type: "passage",
      title: "T",
      text: "Unit-rate is useful. Find the Unit Rate. Then the unit-rate again.",
    },
    choice({ prompt: "What is a UNIT RATE?" }),
  ]);
  const r = inspectResource(messy);
  const hits = r.findings.filter((f) => f.id === "inconsistent-terminology");
  assert.equal(hits.length, 2);
  assert.equal(hits[0].repair, "normalize-terminology");
  const fixed = applyRepair(messy, "normalize-terminology", {});
  assert.equal(fixed.applied, true);
  const p = fixed.activity.blocks.find((b) => b.id === "p1");
  assert.equal(p.text, "Unit rate is useful. Find the unit rate. Then the unit rate again.");
  assert.equal(fixed.activity.blocks.find((b) => b.id === "q1").prompt, "What is a unit rate?");
  assert.equal(fixed.activity.blocks.find((b) => b.id === "v1").items[0].term, "unit rate");
  assert.ok(!ids(inspectResource(fixed.activity)).includes("inconsistent-terminology"));
  assert.equal(applyRepair(fixed.activity, "normalize-terminology", {}).applied, false);
});

test("broken image refs: off-site and non-raster data are found on the raw input and removed with a note", () => {
  const raw = {
    ...act([choice()]),
    blocks: [
      DIRECTIONS,
      { id: "i1", type: "image", src: "https://tracker.example/pixel.png", alt: "x" },
      { id: "i2", type: "image", src: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=", alt: "y" },
      choice(),
    ],
  };
  const r = inspectResource(raw);
  const hits = r.findings.filter((f) => f.id === "broken-image");
  assert.equal(hits.length, 2);
  assert.equal(hits[0].severity, "fix");
  assert.equal(hits[0].repair, "remove-invalid-image");
  let work = raw;
  for (const h of hits) work = applyRepair(work, h.repair, h.where).activity;
  assert.ok(!work.blocks.some((b) => b.type === "image"));
  const notes = work.blocks.filter((b) => b.type === "note");
  assert.equal(notes.length, 2);
  assert.match(notes[0].text, /Se quitó una imagen/);
  assert.equal(inspectResource(work).findings.filter((f) => f.id === "broken-image").length, 0);
  assert.equal(applyRepair(work, "remove-invalid-image", {}).applied, false);
  const safe = act([{ id: "i1", type: "image", src: "/assets/x.png", alt: "ok" }, choice()]);
  assert.ok(!ids(inspectResource(safe)).includes("broken-image"));
});

test("audio blocks need text to read or show", () => {
  const r = inspectResource(
    act([{ id: "au1", type: "audio", say: "", label: "Listen" }, choice()]),
  );
  assert.equal(find(r, "audio-no-text").severity, "fix");
  assert.ok(
    !ids(
      inspectResource(act([{ id: "au1", type: "audio", say: "Hello", label: "Listen" }, choice()])),
    ).includes("audio-no-text"),
  );
});

test("incomplete Spanish: a vocabulary list with Spanish on some words only", () => {
  const vocab = (es2) => ({
    id: "v1",
    type: "vocab",
    items: [
      { id: "a", term: "ratio", def: "d", es: "razón" },
      { id: "b", term: "rate", def: "d", es: es2 },
    ],
  });
  assert.ok(find(inspectResource(act([vocab(""), choice()])), "incomplete-spanish"));
  assert.ok(!ids(inspectResource(act([vocab("tasa"), choice()]))).includes("incomplete-spanish"));
});

test("unsupported curriculum claims: origin 'curriculum' needs a curriculum unit behind it", () => {
  const claim = { standards: [{ code: "6.RP.A.1", origin: "curriculum" }] };
  const ctx = (source, more = {}) => ({ grade: "6", subject: "Math", ...claim, source, ...more });
  const bad = act([choice()], { context: ctx({ origin: "teacher" }) });
  const f = find(inspectResource(bad), "unsupported-curriculum-claim");
  assert.equal(f.severity, "fix");
  assert.match(f.message.es, /6\.RP\.A\.1/);
  const verified = act([choice()], {
    context: ctx({ origin: "curriculum", note: "BCPSS" }, { unitId: "u-6-3" }),
  });
  assert.ok(!ids(inspectResource(verified)).includes("unsupported-curriculum-claim"));
  const teacher = act([choice()], {
    context: {
      grade: "6",
      subject: "Math",
      standards: [{ code: "6.RP.A.1", origin: "teacher" }],
      source: { origin: "teacher" },
    },
  });
  assert.ok(!ids(inspectResource(teacher)).includes("unsupported-curriculum-claim"));
});

test("typed sequence numbers: renumber questions and steps (numbers only)", () => {
  const nums = act([
    choice({ id: "q1", prompt: "1. First?" }),
    choice({ id: "q2", prompt: "3. Second?" }),
    choice({ id: "q3", prompt: "3. Third?" }),
  ]);
  const f = find(inspectResource(nums), "question-numbering");
  assert.equal(f.repair, "renumber-sequence");
  const fixed = applyRepair(nums, f.repair, f.where);
  assert.deepEqual(
    questionsOf(fixed.activity).map((q) => q.prompt),
    ["1. First?", "2. Second?", "3. Third?"],
  );
  assert.equal(applyRepair(fixed.activity, f.repair, f.where).applied, false);
  const err = act([
    {
      id: "q1",
      type: "question",
      format: "error",
      prompt: "Find it.",
      steps: [
        { id: "s1", text: "Step 1: add" },
        { id: "s2", text: "Step 3: subtract" },
      ],
      errorStep: "s2",
      fixOptions: [
        { id: "a", text: "x" },
        { id: "b", text: "y" },
      ],
      fixAnswer: "a",
    },
  ]);
  const g = find(inspectResource(err), "step-numbering");
  const done = applyRepair(err, g.repair, g.where);
  assert.deepEqual(
    questionsOf(done.activity)[0].steps.map((s) => s.text),
    ["Step 1: add", "Step 2: subtract"],
  );
  assert.ok(
    !ids(
      inspectResource(act([choice({ prompt: "1. A" }), choice({ id: "q2", prompt: "2. B" })])),
    ).includes("question-numbering"),
  );
});

test("trim-duplicate-order-items drops the repeat, keeps the first, is idempotent and never leaves fewer than two", () => {
  const a = act([
    {
      id: "q1",
      type: "question",
      format: "order",
      prompt: "Order.",
      items: [
        { id: "i1", text: "Plant" },
        { id: "i2", text: "plant" },
        { id: "i3", text: "Grow" },
      ],
    },
  ]);
  const r = applyRepair(a, "trim-duplicate-order-items", { blockId: "q1" });
  assert.deepEqual(
    questionsOf(r.activity)[0].items.map((i) => i.id),
    ["i1", "i3"],
  );
  assert.equal(
    applyRepair(r.activity, "trim-duplicate-order-items", { blockId: "q1" }).applied,
    false,
  );
  const same = act([
    {
      id: "q1",
      type: "question",
      format: "order",
      prompt: "Order.",
      items: [
        { id: "i1", text: "Go" },
        { id: "i2", text: "go" },
      ],
    },
  ]);
  assert.equal(applyRepair(same, "trim-duplicate-order-items", {}).applied, false);
});

test("repairs never change an answer, and are idempotent on a messy activity; the input is untouched", () => {
  const messy = act([
    { id: "v1", type: "vocab", items: [{ id: "w1", term: "unit rate", def: "d", es: "tasa" }] },
    choice({ id: "q1", prompt: "1. What is a Unit-Rate?" }),
    choice({ id: "q2", prompt: "4. Unit-rate again?" }),
    { id: "q3", type: "question", format: "blank", prompt: "", text: "A [[unit rate]] is one." },
  ]);
  const frozen = JSON.parse(JSON.stringify(messy));
  const before = questionsOf(messy).map(answerText);
  let cur = messy;
  for (const id of REPAIR_IDS) {
    const once = applyRepair(cur, id, {});
    const twice = applyRepair(once.activity, id, {});
    assert.equal(twice.applied, false, id);
    assert.deepEqual(twice.activity, once.activity, id);
    cur = once.activity;
  }
  assert.deepEqual(questionsOf(cur).map(answerText), before);
  assert.deepEqual(JSON.parse(JSON.stringify(messy)), frozen, "input untouched");
  assert.equal(
    cur.blocks.find((b) => b.id === "q3").text,
    "A [[unit rate]] is one.",
    "answer markers are never edited",
  );
  assert.throws(() => applyRepair(messy, "rewrite-everything", {}), /Unknown repair/);
});

test("a frozen input is inspected without error", () => {
  const deep = (o) => {
    for (const v of Object.values(o)) if (v && typeof v === "object") deep(v);
    return Object.freeze(o);
  };
  const r = inspectResource(deep(allFormats()));
  assert.equal(r.ok, true);
});
