// Source material workspace: pasted text, PDF honesty, and final activities that pass the Studio's validator.
// (Word files and unsafe-file rejection: tools/studio-x-ingest-docx.test.mjs)
//   node --test tools/studio-x-ingest.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { normalizeActivity } from "../access-practice-lab/src/studio/core/schema.js";
import { validateActivity } from "../access-practice-lab/src/studio/core/validate.js";
import {
  buildActivityFromIngest,
  ingestPdf,
  ingestText,
  resolveAnswer,
} from "../access-practice-lab/src/studio/x/ingest.js";

const ofType = (r, t) => r.blocks.filter((b) => b.type === t);
const codes = (r) => r.review.map((x) => x.code);
const newId = () => "s0123456789";

// ── pasted multiple-choice questions ────────────────────────────────────────

const KEYED = `1. Which number is prime?
a) 4
*b) 7
c) 9

2. What is 6 x 7?
a) 36
b) 42
c) 48
Answer: b

3. Which shape has three sides?
a) square
b) triangle
c) circle
Respuesta: B`;

test("multiple choice with a mark, an Answer line and a Spanish Respuesta line", () => {
  const r = ingestText(KEYED);
  assert.equal(r.ok, true);
  const qs = ofType(r, "question");
  assert.equal(qs.length, 3);
  assert.deepEqual(
    qs.map((q) => q.answer),
    ["o2", "o2", "o2"],
  );
  assert.deepEqual(
    qs.map((q) => q.answerSource),
    ["mark", "answer-line", "answer-line"],
  );
  assert.ok(qs.every((q) => q.confidence === "high" && q.format === "choice"));
  assert.deepEqual(qs[0].lines, [1, 4]);
  assert.equal(qs[0].prompt, "Which number is prime?");
  assert.equal(qs[0].options[1].text, "7");
  assert.equal(r.review.length, 0);
  const s = r.suggestions.find((x) => x.id === "questions-choice");
  assert.equal(s.kind, "check");
  assert.equal(s.template, "skill-check");
  assert.equal(s.count, 3);
});

test("an answer key section at the end keys the questions it names", () => {
  const r = ingestText(`1. Capital of France?
a) Paris
b) Rome

2. Largest planet?
a) Mars
b) Jupiter

Answer Key
1. a
2-b`);
  const qs = ofType(r, "question");
  assert.deepEqual(
    qs.map((q) => q.answer),
    ["o1", "o2"],
  );
  assert.deepEqual(
    qs.map((q) => q.answerSource),
    ["key", "key"],
  );
  assert.equal(r.review.length, 0);
});

test("without an answer key the answer is NOT guessed: it goes to review", () => {
  const r = ingestText(`1. Which is a noun?
a) run
b) dog
c) quickly

2. Which is a verb?
a) jump
b) tree
c) blue`);
  const qs = ofType(r, "question");
  assert.equal(qs.length, 2);
  assert.ok(qs.every((q) => q.answer === "" && q.confidence === "review"));
  assert.deepEqual(codes(r), ["unmarked", "unmarked"]);
  assert.ok(r.review.every((x) => x.itemId && x.lines[0] >= 1));
  const s = r.suggestions.find((x) => x.id === "questions-choice");
  assert.equal(s.count, 0, "no answered question is offered");
  assert.equal(s.ready, false);
  assert.ok(s.note.en && s.note.es);
});

test("ambiguous choice lists are reported, never repaired", () => {
  const missing = ingestText("1. Pick one\na) one\nb) two\nd) four");
  assert.deepEqual(codes(missing), ["missing-option"]);
  assert.equal(missing.blocks.length, 0, "a list with a missing choice is left out whole");
  const lone = ingestText("1. Pick one\na) one");
  assert.deepEqual(codes(lone), ["one-option"]);
  const twice = ingestText("1. Pick\n*a) one\n*b) two\nc) three");
  assert.deepEqual(codes(twice), ["two-marks"]);
  assert.equal(ofType(twice, "question")[0].answer, "");
  const clash = ingestText("1. Pick\n*a) one\nb) two\nAnswer: b");
  assert.deepEqual(codes(clash), ["answer-conflict"]);
  const word = ingestText("1. Pick\na) cat\nb) dog\nAnswer: Dog");
  assert.equal(
    ofType(word, "question")[0].answer,
    "o2",
    "an Answer line may repeat the choice text exactly",
  );
  const stray = ingestText("1. Pick\na) cat\nb) dog\nAnswer: Cow");
  assert.deepEqual(codes(stray), ["bad-answer-line"]);
  const multi = ingestText("1. Pick\na) cat\nb) dog\nc) cow\nAnswer: a, c");
  assert.deepEqual(codes(multi), ["multi-answer"]);
  const bad = ingestText("1. Pick\na) cat\nb) dog\n\nAnswer Key\n1. f");
  assert.equal(ofType(bad, "question").length, 1);
});

test("questions written without blank lines between them are still split", () => {
  const r = ingestText("1. First?\na) x\n*b) y\n2. Second?\n*a) p\nb) q");
  assert.deepEqual(
    ofType(r, "question").map((q) => q.prompt),
    ["First?", "Second?"],
  );
});

// ── matching, sequence, vocabulary ──────────────────────────────────────────

test("matching pairs become pairs and a match suggestion; duplicates go to review", () => {
  const r = ingestText(`Match each word to its meaning:
hot - not cold
big - not small
fast - moving quickly`);
  const pairs = ofType(r, "pairs");
  assert.equal(pairs.length, 1);
  assert.deepEqual(
    pairs[0].pairs.map((p) => p.left),
    ["hot", "big", "fast"],
  );
  assert.deepEqual(pairs[0].lines, [1, 4]);
  assert.deepEqual(
    pairs[0].pairs.map((p) => p.line),
    [2, 3, 4],
  );
  const s = r.suggestions.find((x) => x.id === "match-pairs");
  assert.equal(s.format, "match");
  assert.equal(s.template, "match-sort");
  const dup = ingestText(
    "Match the words to their meanings:\nhot - warm\nwarm - warm\nhot - not cold",
  );
  assert.ok(codes(dup).includes("dup-pair"));
  assert.equal(ofType(dup, "pairs")[0].confidence, "review");
  assert.equal(
    buildActivityFromIngest(dup, {}, { newId }).activity,
    null,
    "repeat pairs are not built",
  );
});

test("steps in order become a sequence", () => {
  const r = ingestText(`Step 1: Wash your hands.
Step 2: Wet the paper towel.
Step 3: Wipe the desk.`);
  const seq = ofType(r, "sequence")[0];
  assert.deepEqual(
    seq.steps.map((s) => s.text),
    ["Wash your hands.", "Wet the paper towel.", "Wipe the desk."],
  );
  assert.equal(seq.confidence, "high");
  assert.equal(r.suggestions.find((s) => s.id === "order-steps").format, "order");
  const plain = ingestText("1. Gather paper\n2. Fold it\n3. Cut a slit");
  assert.equal(ofType(plain, "sequence")[0].confidence, "review");
  assert.deepEqual(codes(plain), ["steps-guess"]);
  const headed = ingestText(
    "Steps to make a plane\n\n1. Gather paper\n2. Fold it\n3. Cut a slit".replace(
      "Steps to",
      "Steps to",
    ),
  );
  assert.equal(
    ofType(headed, "sequence")[0].confidence,
    "review",
    "an unmarked heading is not a signal in pasted text",
  );
});

test("a vocabulary list: dash, colon and tab forms", () => {
  const r = ingestText(`photosynthesis - how plants make food from light
chlorophyll: the green part of a plant that takes in light
stomata\tsmall holes in a leaf`);
  const v = ofType(r, "vocab");
  assert.equal(v.length, 1);
  assert.equal(v[0].items.length, 3);
  assert.deepEqual(
    v[0].items.map((i) => i.term),
    ["photosynthesis", "chlorophyll", "stomata"],
  );
  assert.equal(v[0].confidence, "high");
  assert.equal(r.review.length, 0);
  const s = r.suggestions.find((x) => x.id === "vocab");
  assert.equal(s.transform, "vocabPractice");
  assert.equal(s.ready, true);
});

test("a tab-separated vocabulary table: header skipped, uneven and empty rows reported not guessed", () => {
  const r = ingestText(
    "Word\tMeaning\ncell\tsmallest unit of life\natom\tbasic unit of matter\nmolecule\nion\t\nmass\tamount of matter\textra",
  );
  const v = ofType(r, "vocab")[0];
  assert.deepEqual(
    v.items.map((i) => i.term),
    ["cell", "atom"],
  );
  assert.ok(codes(r).includes("uneven-columns"));
  assert.ok(codes(r).includes("empty-cell"));
  assert.equal(
    v.items.some((i) => i.term === "ion" || i.term === "molecule"),
    false,
  );
  assert.ok(r.review.every((x) => x.lines && x.lines[0] > 1));
});

test("a three-column tab table stays a table; uneven rows are flagged", () => {
  const r = ingestText("Name\tTemp\tUnit\nWater\t100\tC\nIce\t0\nSteam\t120\tC");
  const t = ofType(r, "table")[0];
  assert.deepEqual(t.headers, ["Name", "Temp", "Unit"]);
  assert.equal(t.rows.length, 3);
  assert.equal(t.confidence, "review");
  assert.ok(codes(r).includes("uneven-columns"));
});

test("words separated only by commas are flagged, not trusted", () => {
  const r = ingestText("However, the cat sat down\nBecause, the dog ran away");
  const v = ofType(r, "vocab")[0];
  assert.equal(v.confidence, "review");
  assert.deepEqual(codes(r), ["comma-vocab"]);
});

// ── problems, short answers, blanks, passages ───────────────────────────────

test("number problems are computed exactly; a bare expression is flagged", () => {
  const r = ingestText("3/4 + 1/2 =\n12 ÷ 4 =\n6 × 7 =\n\n5/8");
  const ps = ofType(r, "question").filter((q) => q.format === "number");
  assert.equal(ps.length, 4);
  assert.equal(ps[0].answer, "5/4");
  assert.equal(ps[1].answer, "3");
  assert.equal(ps[2].answer, "42");
  assert.equal(ps[3].confidence, "review");
  assert.deepEqual(codes(r), ["bare-expression"]);
  const s = r.suggestions.find((x) => x.id === "questions-number");
  assert.equal(s.kind, "worksheet");
});

test("questions with the teacher's own answer, blanks, prompts and bullets", () => {
  const r = ingestText(`1. How many sides does a hexagon have?
Answer: 6

2. The capital of France is ____.
Answer: Paris

3. Name one planet.
Answer: Mars

4. The ____ is bright and the ____ is hot.
Answer: sun

5. A fill in with no key ____.

Write a paragraph about your favorite season.

- pencil
- paper
- ruler

What is your favorite season?`);
  const q = ofType(r, "question");
  const by = (f) => q.filter((x) => x.format === f);
  assert.equal(by("number")[0].answer, "6");
  assert.equal(by("blank")[0].text, "The capital of France is [[Paris]].");
  assert.equal(by("short").find((x) => x.sample)?.sample, "Mars");
  assert.ok(by("short").some((x) => x.prompt.startsWith("Write a paragraph")));
  assert.ok(by("short").some((x) => x.prompt === "What is your favorite season?"));
  assert.deepEqual(ofType(r, "list")[0].items, ["pencil", "paper", "ruler"]);
  assert.ok(codes(r).includes("blank-many"));
  assert.ok(codes(r).includes("blank-no-answer"));
  assert.equal(by("blank").length, 1, "nothing is made from the blanks that have no single answer");
  assert.ok(r.suggestions.find((s) => s.id === "questions-short").template === "reading-writing");
});

const PASSAGE =
  "The water cycle moves water around the Earth. Water rises from oceans as vapor, cools into clouds, and falls as rain. The rain flows back to rivers and the sea, and the cycle starts again.";

test("a reading passage with questions suggests interactive reading, writing and speaking", () => {
  const r = ingestText(`The Water Cycle

${PASSAGE}

1. What falls from clouds?
a) rain
b) sand
Answer: a

2. Why does water rise from the ocean?`);
  assert.equal(ofType(r, "passage").length, 1);
  assert.equal(ofType(r, "question").length, 2);
  const ids = r.suggestions.map((s) => s.id);
  for (const id of [
    "reading",
    "writing-task",
    "speaking-task",
    "questions-choice",
    "questions-short",
  ])
    assert.ok(ids.includes(id), id);
  const reading = r.suggestions.find((s) => s.id === "reading");
  assert.equal(reading.template, "interactive-reading");
  assert.equal(reading.count, 3);
});

test("text that cannot be classified is reported, not dropped; long input is capped honestly", () => {
  const r = ingestText("Name: ______\nDate");
  assert.ok(codes(r).includes("unclassified") || codes(r).includes("blank-no-answer"));
  assert.equal(ingestText("   ").ok, false);
  assert.ok(ingestText("   ").error.es);
  const big = ingestText(`${"cat - a small pet animal\n".repeat(4000)}`);
  assert.ok(codes(big).includes("truncated"));
  assert.ok(ofType(big, "vocab").length >= 1);
});

// ── provenance, privacy, language, determinism ──────────────────────────────

test("provenance carries facts about the source and never its content; nothing is logged", () => {
  const spy = [];
  const orig = { ...console };
  for (const m of ["log", "info", "warn", "error", "debug"]) console[m] = (...a) => spy.push(a);
  let r;
  try {
    r = ingestText("secret-term - secret meaning here\nother - other meaning here", {
      filename: "C:\\Users\\me\\Quiz 3.txt",
    });
    ingestPdf();
  } finally {
    Object.assign(console, orig);
  }
  assert.equal(spy.length, 0, "nothing is logged");
  assert.deepEqual(Object.keys(r.provenance).sort(), ["bytes", "lines", "name", "type"]);
  assert.equal(r.provenance.name, "Quiz 3.txt");
  assert.equal(r.provenance.type, "txt");
  assert.equal(r.provenance.lines, 2);
  assert.ok(r.provenance.bytes > 20);
  assert.equal(JSON.stringify(r.provenance).includes("secret"), false);
  assert.equal(ingestText("a - b c").provenance.type, "pasted");
});

test("every teacher-facing string is a real {en, es} pair; results are deterministic", () => {
  const inputs = [
    "1. A\na) x\nb) y\n\n2. B\na) p\nb) q\nd) r\n\n3. C\n*a) k\n*b) l\n\nName: ___\n5/8\nWrite about it.",
    "Word\tMeaning\ncell\tx y\nion\n\nMatch these words:\ncat - a pet\ncat - a pet",
  ];
  const seen = [];
  for (const t of inputs) {
    const r = ingestText(t);
    assert.deepEqual(r, ingestText(t));
    seen.push(...r.review.map((x) => x.reason), ...r.suggestions.map((s) => s.label));
  }
  assert.ok(seen.length >= 8);
  for (const p of seen) {
    assert.ok(p.en && p.es && p.en !== p.es, JSON.stringify(p));
    assert.doesNotMatch(p.es, /\b(?:the|and|was|were|this)\b/i, p.es);
  }
});

// ── PDF ─────────────────────────────────────────────────────────────────────

test("PDF reading is honestly refused with the paste-the-text path", () => {
  for (const r of [
    ingestPdf(),
    ingestPdf(new Uint8Array([0x25, 0x50, 0x44, 0x46]), { filename: "scan.pdf" }),
  ]) {
    assert.equal(r.ok, false);
    assert.equal(r.code, "pdf-unavailable");
    assert.match(r.error.en, /not available/i);
    assert.match(r.error.en, /paste/i);
    assert.match(r.error.en, /scanned/i);
    assert.match(r.error.es, /no está disponible/i);
    assert.match(r.error.es, /p[eé]galo/i);
    assert.equal("blocks" in r, false, "nothing is extracted");
  }
});

// ── from ingest to an activity ──────────────────────────────────────────────

test("a keyed quiz builds an activity that passes normalizeActivity and validateActivity", () => {
  const r = ingestText(KEYED, { filename: "unit quiz.txt" });
  const { ok, activity, review, validation } = buildActivityFromIngest(
    r,
    { suggestion: "questions-choice" },
    { newId, context: { grade: "6", subject: "Math" } },
  );
  assert.equal(ok, true, JSON.stringify(validation.errors));
  assert.equal(validateActivity(activity).ok, true);
  assert.deepEqual(
    normalizeActivity(activity),
    activity,
    "already a fixed point of normalizeActivity",
  );
  assert.equal(activity.kind, "check");
  assert.equal(activity.template, "skill-check");
  assert.equal(activity.id, "s0123456789");
  assert.equal(activity.title, "unit quiz");
  assert.equal(activity.blocks.filter((b) => b.type === "question").length, 3);
  assert.equal(activity.context.source.origin, "teacher");
  assert.equal(activity.context.source.note, "Teacher upload: unit quiz.txt");
  assert.equal(review.length, 0);
  assert.equal(activity.options.timer, false);
  const pasted = buildActivityFromIngest(ingestText(KEYED), {}, { newId });
  assert.equal(pasted.activity.context.source.note, "Pasted by the teacher.");
});

test("questions without an answer are left out of the activity and reported; the teacher can resolve them", () => {
  const text = `${KEYED}\n\n4. Which is a noun?\na) run\nb) dog\nc) quickly`;
  let r = ingestText(text);
  const built = buildActivityFromIngest(r, { kind: "worksheet", template: "guided" }, { newId });
  assert.equal(built.ok, true);
  assert.equal(built.activity.blocks.filter((b) => b.type === "question").length, 3);
  assert.ok(built.review.some((x) => x.code === "left-out" && x.reason.es));
  const open = r.blocks.find((b) => b.answer === "");
  r = resolveAnswer(r, open.id, "b");
  assert.equal(r.blocks.find((b) => b.id === open.id).answer, "o2");
  assert.equal(r.blocks.find((b) => b.id === open.id).answerSource, "teacher");
  assert.equal(r.review.length, 0);
  assert.equal(
    buildActivityFromIngest(r, {}, { newId }).activity.blocks.filter((b) => b.type === "question")
      .length,
    4,
  );
  assert.equal(resolveAnswer(r, open.id, "z"), r, "an unknown letter changes nothing");
});

test("matching, sequence, vocabulary, problems and prompts all build valid activities", () => {
  const cases = [
    [
      "Match each word to its meaning:\nhot - not cold\nbig - not small",
      { suggestion: "match-pairs" },
      "match",
    ],
    ["Step 1: Wash.\nStep 2: Dry.\nStep 3: Fold.", { suggestion: "order-steps" }, "order"],
    ["3/4 + 1/2 =\n6 × 7 =\n12 ÷ 4 =", { suggestion: "questions-number" }, "number"],
    ["Write a paragraph about your day.", { suggestion: "questions-short" }, "short"],
    ["Fruits: apple, pear\nColors: red, blue", { suggestion: "sort-groups" }, "sort"],
  ];
  for (const [text, sel, format] of cases) {
    const r = ingestText(text);
    const b = buildActivityFromIngest(r, sel, { newId });
    assert.equal(b.ok, true, `${format}: ${JSON.stringify(b.validation?.errors)}`);
    assert.ok(
      b.activity.blocks.some((x) => x.type === "question" && x.format === format),
      format,
    );
    assert.equal(validateActivity(b.activity).ok, true);
  }
  const numbers = buildActivityFromIngest(
    ingestText(cases[2][0]),
    { suggestion: "questions-number" },
    { newId },
  ).activity;
  assert.equal(numbers.kind, "worksheet", "three problems suggest a worksheet");
  assert.equal(numbers.blocks.find((x) => x.format === "number").expr.length > 0, true);
});

test("a vocabulary list builds a word list and word practice through the existing transform", () => {
  const r = ingestText(
    "cell - the smallest unit of life\natom - the basic unit of matter\nion - a charged atom",
  );
  const plain = buildActivityFromIngest(
    r,
    { kind: "interactive", template: "match-sort", transform: "" },
    { newId },
  );
  assert.equal(plain.ok, false, "a word list alone has no questions yet, and says so");
  assert.ok(plain.review.some((x) => x.code === "few-questions"));
  const practice = buildActivityFromIngest(r, { suggestion: "vocab" }, { newId });
  assert.equal(practice.ok, true, JSON.stringify(practice.validation.errors));
  const qs = practice.activity.blocks.filter((b) => b.type === "question");
  assert.ok(qs.length >= 3);
  assert.ok(practice.activity.blocks.some((b) => b.type === "vocab" && b.items.length === 3));
  assert.equal(practice.activity.lineage.variantOf, "s0123456789");
  assert.ok(practice.review.some((x) => x.code === "transform"));
  const joined = JSON.stringify(practice.activity);
  assert.equal(joined.includes("the smallest unit of life"), true);
});

test("a passage builds a valid writing task through the existing transform; bad requests say why", () => {
  const r = ingestText(`${PASSAGE}\n\n1. What falls from clouds?\na) rain\nb) sand\nAnswer: a`);
  const reading = buildActivityFromIngest(r, { suggestion: "reading" }, { newId });
  assert.equal(reading.ok, true);
  assert.equal(reading.activity.template, "interactive-reading");
  assert.ok(reading.activity.blocks.some((b) => b.type === "passage"));
  const w = buildActivityFromIngest(r, { suggestion: "writing-task" }, { newId });
  assert.equal(w.ok, true, JSON.stringify(w.validation?.errors));
  assert.equal(buildActivityFromIngest(r, { kind: "nope" }, { newId }).ok, false);
  assert.equal(buildActivityFromIngest({ ok: false }, {}, {}).activity, null);
  const game = buildActivityFromIngest(
    ingestText(KEYED.split("\n\n")[0]),
    { kind: "game", template: "quest" },
    { newId },
  );
  assert.equal(game.ok, false, "a game needs three questions");
  assert.ok(game.review.some((x) => x.code === "few-questions" && x.reason.es));
});

test("building never mutates the ingest result", () => {
  const r = ingestText(KEYED);
  const before = JSON.stringify(r);
  buildActivityFromIngest(r, { suggestion: "questions-choice" }, { newId });
  assert.equal(JSON.stringify(r), before);
});
