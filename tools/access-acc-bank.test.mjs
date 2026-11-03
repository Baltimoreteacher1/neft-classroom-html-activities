#!/usr/bin/env node
/**
 * The bank validator is only worth trusting if it fails when it should. Each case below starts from a set that passes and
 * breaks exactly one thing; the validator must name it.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { checkBank, checkSet } from "./validate-access-bank.mjs";

const prov = { source: "original", author: "EduWonderLab, AI-assisted draft" };
const base = (o) => ({
  rev: 1,
  mode: "Interpretive",
  standard: "ELD-SC",
  band: "building",
  cognitive: "analyze",
  languageDemand: "moderate",
  response: "select",
  scoring: "key",
  functions: ["Explain cause and effect"],
  features: ["connectors and transitions"],
  wida: {
    explicit: true,
    ids: ["ELD-SC.2-3.Explain.Interpretive", "ELD-SC.4-5.Explain.Interpretive"],
  },
  provenance: prov,
  reviewStatus: "automated-checks-only",
  facts: ["Cold air cools water vapor."],
  ...o,
});
const para = (n, w) =>
  Array.from(
    { length: n },
    (_, i) => `Paragraph ${i} ${Array.from({ length: w }, (_, j) => `word${i}x${j}`).join(" ")}.`,
  );
const mc = (i, ans, o = {}) => ({
  id: `t${i}`,
  type: "multiple-choice",
  domain: "Reading",
  klu: "Explain",
  context: "Science",
  stimulus: "p",
  stem: `Why does thing ${i} happen in the story about number ${i}?`,
  options: ["a", "b", "c", "d"].map((id, k) => ({
    id,
    text: `Choice ${id} about topic ${i} variant ${k} text`,
  })),
  answer: ans,
  distractors: Object.fromEntries(
    ["a", "b", "c", "d"]
      .filter((x) => x !== ans)
      .map((x) => [x, `Not ${x}: the passage says otherwise for item ${i}.`]),
  ),
  explanation: `Because the passage says so for item ${i}.`,
  support: {
    clue: "Look at paragraph two for the reason.",
    frame: "The thing happens because ______.",
    model:
      "Mentor example. A puddle shrinks when the sun warms it, so the water leaves. Do the same with your passage.",
  },
  meta: base({
    misconceptions: Object.fromEntries(
      ["a", "b", "c", "d"].filter((x) => x !== ans).map((x) => [x, `tag ${x}`]),
    ),
    stimulusType: "passage",
  }),
  ...o,
});
const goodSet = () => ({
  id: "t-read-01",
  title: "Test set",
  grade: "3-5",
  domain: "Reading",
  minutes: 15,
  description: "d",
  bank: { version: 1, provenance: prov, reviewStatus: "automated-checks-only" },
  stimuli: [{ id: "p", kind: "passage", title: "A passage", paragraphs: para(4, 30) }],
  items: ["a", "b", "c", "d", "a", "c"].map((ans, i) => mc(i + 1, ans)),
});
const errs = (set) => checkSet(set, "t.json").errors.join("\n");

test("a well-formed set passes", () => assert.equal(errs(goodSet()), ""));

const cases = [
  ["missing meta", (s) => delete s.items[0].meta, /meta missing/],
  [
    "wrong mode for the domain",
    (s) => (s.items[0].meta.mode = "Expressive"),
    /meta\.mode must be Interpretive/,
  ],
  [
    "wrong standard for the context",
    (s) => (s.items[0].meta.standard = "ELD-MA"),
    /meta\.standard must be ELD-SC/,
  ],
  ["a WIDA level as a band", (s) => (s.items[0].meta.band = "Level 3"), /meta\.band/],
  [
    "invented WIDA ids",
    (s) => (s.items[0].meta.wida.ids = ["ELD-SC.9-9.Explain"]),
    /meta\.wida\.ids must equal the catalog/,
  ],
  [
    "wrong explicit flag",
    (s) => (s.items[0].meta.wida.explicit = false),
    /meta\.wida\.explicit must be true/,
  ],
  [
    "claiming human review",
    (s) => (s.items[0].meta.reviewStatus = "human-reviewed"),
    /may claim human review|no item may claim human review/,
  ],
  [
    "set claiming human review",
    (s) => (s.bank.reviewStatus = "human-reviewed"),
    /may not claim human review/,
  ],
  ["a distractor with no note", (s) => delete s.items[0].distractors.b, /distractors\.b/],
  [
    "a distractor with no misconception tag",
    (s) => delete s.items[0].meta.misconceptions.c,
    /misconceptions\.c/,
  ],
  ["missing support tier", (s) => delete s.items[0].support.frame, /support\.frame required/],
  [
    "a clue stating the key word for word",
    (s) => (s.items[0].support.clue = `Think: ${s.items[0].options[0].text}`),
    /states the correct choice/,
  ],
  [
    "a mentor model that is the task itself",
    (s) =>
      (s.items[0].support.model = `Mentor example. ${s.items[0].stem} ${s.items[0].options.map((o) => o.text).join(" ")}`),
    /mentor model is too close/,
  ],
  [
    "a score claim in student text",
    (s) => (s.items[0].explanation = "This shows your WIDA score is high."),
    /scoring or level claim/,
  ],
  [
    "timer language",
    (s) => (s.items[0].stem = "Hurry and pick why thing happens"),
    /timer or speed language/,
  ],
  [
    "a passage far too short",
    (s) => (s.stimuli[0].paragraphs = ["Too short."]),
    /passage is 70 to 330 words/,
  ],
  [
    "an unused stimulus",
    (s) => s.stimuli.push({ id: "x", kind: "passage", title: "Unused", paragraphs: para(4, 30) }),
    /used by no item/,
  ],
  [
    "image without alt text",
    (s) => s.stimuli.push({ id: "im", kind: "image", title: "i", src: "/x.svg", alt: "pic" }),
    /image needs descriptive alt/,
  ],
  [
    "table without a caption",
    (s) => s.stimuli.push({ id: "tb", kind: "table", title: "t", columns: ["a"], rows: [["b"]] }),
    /table needs a caption/,
  ],
  [
    "every key in the same position",
    (s) => s.items.forEach((it, i) => Object.assign(it, mc(i + 1, "a"))),
    /one position too often/,
  ],
  ["too few items", (s) => (s.items = s.items.slice(0, 3)), /5 to 12 items/],
  ["a domain mismatch", (s) => (s.items[0].domain = "Listening"), /does not match the set/],
  [
    "none of the above",
    (s) => (s.items[0].options[3].text = "None of the above"),
    /none of the above/,
  ],
];
for (const [name, mutate, pattern] of cases)
  test(`rejects: ${name}`, () => {
    const s = goodSet();
    mutate(s);
    assert.match(errs(s), pattern);
  });

test("listening: the script must equal the joined turns, plays must be two, the text must be long enough and the screen short", () => {
  const turns = Array.from({ length: 8 }, (_, i) => ({
    speaker: i % 2 ? "Student" : "Teacher",
    text: `This is spoken line number ${i} about the class plan and the schedule for today.`,
  }));
  const script = turns.map((t) => `${t.speaker}: ${t.text}`).join(" ");
  const set = () => ({
    ...goodSet(),
    id: "t-listen-01",
    domain: "Listening",
    stimuli: [
      { id: "p", kind: "audio", title: "Listen", transcript: true, maxPlays: 2, turns, script },
    ],
    items: ["a", "b", "c", "d", "a", "c"].map((ans, i) => {
      const it = mc(i + 1, ans, { type: "listening-response", domain: "Listening" });
      it.meta.stimulusType = "audio";
      it.meta.mode = "Interpretive";
      return it;
    }),
  });
  assert.equal(errs(set()), "");
  let s = set();
  s.stimuli[0].script = "different text";
  assert.match(errs(s), /script must equal the joined turns/);
  s = set();
  s.stimuli[0].maxPlays = 3;
  assert.match(errs(s), /maxPlays must be 2/);
  s = set();
  s.stimuli[0].turns = turns.slice(0, 2);
  s.stimuli[0].script = turns
    .slice(0, 2)
    .map((t) => `${t.speaker}: ${t.text}`)
    .join(" ");
  assert.match(errs(s), /at least 45 words/);
  s = set();
  s.items[0].stem = Array.from({ length: 80 }, () => "word").join(" ");
  assert.match(errs(s), /too much to read for a listening item/);
  s = set();
  s.stimuli[0].transcript = false;
  assert.match(errs(s), /transcript must be true/);
});

test("speaking and writing: configuration, rubric and exemplar are required, and the lab never claims to score them", () => {
  const speak = () => ({
    ...goodSet(),
    id: "t-speak-01",
    domain: "Speaking",
    stimuli: [
      { id: "p", kind: "prompt", title: "Task", paragraphs: ["Tell a friend how a plant grows."] },
    ],
    items: Array.from({ length: 5 }, (_, i) => {
      const it = mc(i + 1, "a", { type: "speaking-response", domain: "Speaking" });
      delete it.options;
      delete it.answer;
      delete it.distractors;
      delete it.explanation;
      it.speaking = {
        prepSeconds: 30,
        recordSeconds: 45,
        takes: 2,
        checklist: ["I did one", "I did two", "I did three"],
        exemplar: ["clear order", "uses connectors", "gives a reason"],
      };
      it.meta = base({
        mode: "Expressive",
        response: "speak",
        scoring: "rubric",
        rubric: "speaking-practice",
        stimulusType: "prompt",
        wida: {
          explicit: true,
          ids: ["ELD-SC.2-3.Explain.Expressive", "ELD-SC.4-5.Explain.Expressive"],
        },
      });
      return it;
    }),
  });
  assert.equal(errs(speak()), "");
  let s = speak();
  s.items[0].speaking.prepSeconds = 90;
  assert.match(errs(s), /prepSeconds must be 30 to 45/);
  s = speak();
  s.items[0].speaking.exemplar = ["only one"];
  assert.match(errs(s), /exemplar needs 3 or more/);
  s = speak();
  s.items[0].meta.rubric = "other";
  assert.match(errs(s), /meta\.rubric must be speaking-practice/);
  s = speak();
  s.items[0].meta.scoring = "key";
  assert.match(errs(s), /speaking and writing items are scored by rubric/);
});

test("bank level: duplicate ids and near-duplicate items and stimuli are rejected", () => {
  const a = goodSet();
  const b = goodSet();
  b.id = "t-read-02";
  assert.match(
    checkBank([
      { file: "a", set: a },
      { file: "b", set: b },
    ]).errors.join("\n"),
    /already used|near-duplicate/,
  );
  const c = goodSet();
  c.id = "t-read-03";
  c.items.forEach((it, i) => (it.id = `u${i}`));
  const dup = checkBank([
    { file: "a", set: a },
    { file: "c", set: c },
  ]).errors.join("\n");
  assert.match(dup, /near-duplicate items/);
  assert.match(dup, /near-duplicate stimuli/);
});
