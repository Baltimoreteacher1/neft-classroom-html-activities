#!/usr/bin/env node
// Elementary (band 3-5) studio coverage and standalone band validation.
//  * checkWritingTask now rejects a missing/unknown band (checkSpeakingTask always did);
//  * band 3-5 writing and discussion tasks carry the extra shape rules in validate-access-studio.mjs;
//  * the 3-5 band keeps its own writing collection and at least one discussion task;
//  * the sixteen expansion tasks exist with substantial annotated exemplars, honest labelling and no water-safety claims.
// Every rule is run against known-bad fixtures first so a detector that stops firing fails loudly.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const STUDIO = join(ROOT, "access-practice-lab", "content", "studio");
const read = (f) => JSON.parse(readFileSync(join(STUDIO, f), "utf8"));
const speaking = read("speaking.json").tasks;
const writing = read("writing.json").tasks;
const exemplars = [
  ...read("exemplars-speaking.json").exemplars,
  ...read("exemplars-writing.json").exemplars,
];
const clone = (x) => JSON.parse(JSON.stringify(x));
const words = (s) => String(s).split(/\s+/).filter(Boolean).length;

const {
  checkElementaryCoverage,
  checkElementarySpeaking,
  checkElementaryWriting,
  checkSpeakingTask,
  checkWritingTask,
  collect,
  sweepExemplars,
} = await import("./validate-access-studio.mjs");

const NEW_SPEAKING = {
  "spk35-library-route-discuss": "3-5",
  "spk35-garden-budget-argue": "3-5",
  "spk35-sound-materials-explain": "3-5",
  "spk35-storm-story-retell": "3-5",
  "spk-unit-price-briefing": "6-8",
  "spk-water-filter-panel": "6-8",
  "spk-archive-perspectives": "6-8",
  "spk-library-space-forum": "6-8",
};
const NEW_WRITING = {
  "wrt35-lunch-waste-cer": "3-5",
  "wrt35-garden-array-explanation": "3-5",
  "wrt35-playground-access-letter": "3-5",
  "wrt35-animal-shelter-letter": "3-5",
  "wrt35-community-garden-report": "3-5",
  "wrt35-lost-map-narrative": "3-5",
  "wrt-water-use-policy-argue": "6-8",
  "wrt-insulation-investigation-cer": "6-8",
};
const spk = (id) => speaking.find((t) => t.id === id);
const wrt = (id) => writing.find((t) => t.id === id);
const clean = (fn) => collect(fn);

test("importing the validator does not sweep content or exit", () => {
  assert.equal(typeof checkWritingTask, "function");
  assert.equal(typeof checkElementaryCoverage, "function");
});

test("checkWritingTask validates the band on its own", () => {
  const good = wrt("wrt35-lunch-waste-cer");
  assert.deepEqual(
    clean(() => checkWritingTask("w", good)),
    [],
  );
  const missing = clone(good);
  delete missing.band;
  assert.ok(
    clean(() => checkWritingTask("w", missing)).some((m) => /band/.test(m)),
    "missing band must fail",
  );
  const bad = clone(good);
  bad.band = "4-5";
  assert.ok(
    clean(() => checkWritingTask("w", bad)).some((m) => /band/.test(m)),
    "unofficial band must fail",
  );
  const inline = clone(wrt("wrt-mulch-cer"));
  delete inline.band;
  assert.ok(
    !clean(() => checkWritingTask("w", inline, { inline: true })).some((m) => /band/.test(m)),
    "inline mission tasks inherit the mission band",
  );
});

test("elementary writing rules reject bad fixtures", () => {
  const base = wrt("wrt35-garden-array-explanation");
  assert.deepEqual(
    clean(() => checkElementaryWriting("w", base)),
    [],
  );
  const long = clone(base);
  long.expected.maxWords = 300;
  assert.ok(clean(() => checkElementaryWriting("w", long)).some((m) => /maxWords/.test(m)));
  const tiny = clone(base);
  tiny.expected.minWords = 5;
  assert.ok(clean(() => checkElementaryWriting("w", tiny)).some((m) => /minWords/.test(m)));
  const pages = clone(base);
  pages.expected.paragraphs = 5;
  assert.ok(clean(() => checkElementaryWriting("w", pages)).some((m) => /paragraphs/.test(m)));
  const model = clone(base);
  model.stages.guided.model = Array(140).fill("word").join(" ");
  assert.ok(clean(() => checkElementaryWriting("w", model)).some((m) => /model/.test(m)));
  const bank = clone(base);
  bank.stages.supported.bank = ["a", "b"];
  assert.ok(clean(() => checkElementaryWriting("w", bank)).some((m) => /bank/.test(m)));
  const notes = clone(base);
  notes.teacher.commonIssues = [];
  assert.ok(clean(() => checkElementaryWriting("w", notes)).some((m) => /commonIssues/.test(m)));
});

test("elementary speaking and discussion rules reject bad fixtures", () => {
  const base = spk("spk35-library-route-discuss");
  assert.deepEqual(
    clean(() => checkSpeakingTask("s", base)),
    [],
  );
  const seconds = clone(base);
  seconds.targetSeconds = [30, 150];
  assert.ok(
    clean(() => checkElementarySpeaking("s", seconds)).some((m) => /targetSeconds/.test(m)),
  );
  const same = clone(base);
  for (const u of same.turns) u.expects = "clarify";
  assert.ok(
    clean(() => checkElementarySpeaking("s", same)).some((m) =>
      /different discourse moves/.test(m),
    ),
  );
  const one = clone(base);
  one.turns = one.turns.slice(0, 1);
  assert.ok(clean(() => checkSpeakingTask("s", one)).some((m) => /2-4 partner turns/.test(m)));
  const silent = clone(base);
  silent.turns[0].say = "Why?";
  assert.ok(clean(() => checkElementarySpeaking("s", silent)).some((m) => /spoken line/.test(m)));
  const noReply = clone(base);
  noReply.planner = noReply.planner.filter((p) => p.id !== "partner");
  noReply.planner.push({ id: "extra", label: "Extra", hint: "More." });
  assert.ok(
    clean(() => checkElementarySpeaking("s", noReply)).some((m) => /answering the partner/.test(m)),
  );
});

test("the 3-5 band keeps its writing collection and a discussion task", () => {
  assert.deepEqual(
    clean(() => checkElementaryCoverage(speaking, writing)),
    [],
  );
  assert.ok(
    clean(() => checkElementaryCoverage(speaking, [])).some((m) =>
      /writing needs at least 6/.test(m),
    ),
  );
  const onlyOneForm = writing
    .filter((t) => t.band === "3-5")
    .map((t) => ({ ...t, form: "letter" }));
  assert.ok(
    clean(() => checkElementaryCoverage(speaking, onlyOneForm)).some((m) =>
      /different forms/.test(m),
    ),
  );
  const noDiscuss = speaking.map((t) =>
    t.taskType === "discuss" ? { ...t, taskType: "explain" } : t,
  );
  assert.ok(
    clean(() => checkElementaryCoverage(noDiscuss, writing)).some((m) => /discuss task/.test(m)),
  );
});

test("every 3-5 speaking and writing task passes the band rules", () => {
  const found = clean(() => {
    for (const t of speaking.filter((x) => x.band === "3-5"))
      checkSpeakingTask(`speaking:${t.id}`, t);
    for (const t of writing.filter((x) => x.band === "3-5")) checkWritingTask(`writing:${t.id}`, t);
  });
  assert.deepEqual(found, []);
});

test("the sixteen expansion tasks exist in the right band with substantial exemplars", () => {
  const tasks = new Map([...speaking.map((t) => [t.id, t]), ...writing.map((t) => [t.id, t])]);
  const expected = { ...NEW_SPEAKING, ...NEW_WRITING };
  for (const [id, band] of Object.entries(expected)) {
    const t = tasks.get(id);
    assert.ok(t, `${id} missing`);
    assert.equal(t.band, band, `${id} band`);
    assert.deepEqual(Object.keys(t.stages.independent), [], `${id} independent must stay empty`);
    const mine = exemplars.filter((x) => x.taskId === id);
    assert.deepEqual(
      mine.map((x) => x.practiceBand).sort(),
      ["building", "early", "strong"],
      `${id} exemplar bands`,
    );
    assert.deepEqual(
      t.teacher.exemplarIds.slice().sort(),
      mine.map((x) => x.id).sort(),
      `${id} exemplarIds`,
    );
    const len = Object.fromEntries(mine.map((x) => [x.practiceBand, words(x.response)]));
    assert.ok(
      len.early < len.building && len.building < len.strong,
      `${id} exemplar length should grow with the band ${JSON.stringify(len)}`,
    );
    assert.ok(
      len.early >= 12 && len.strong >= 60,
      `${id} exemplars too thin ${JSON.stringify(len)}`,
    );
    for (const x of mine) {
      assert.ok(x.annotations.length >= 2, `${x.id} needs 2+ annotations`);
      assert.ok(x.whyThisBand.length > 60 && x.nextStep.length > 20, `${x.id} rationale/next step`);
    }
  }
  const taskIds = new Set(tasks.keys());
  assert.deepEqual(
    clean(() => sweepExemplars({ exemplars }, new Map([...taskIds].map((id) => [id, "x"])))),
    [],
  );
});

test("invented data and sources are labelled as practice or fictional", () => {
  const label = /(practice|fictional|made[- ]up|illustrative|fiction)/i;
  for (const id of Object.keys({ ...NEW_SPEAKING, ...NEW_WRITING })) {
    const t = spk(id) || wrt(id);
    const text = JSON.stringify([t.scenario, t.stimulus, t.sources]);
    assert.ok(label.test(text), `${id} must say its data or story is made up`);
  }
});

test("water tasks stay about cost and policy, never safety or quality", () => {
  const claim =
    /\b(safe to drink|drinking[- ]water safety|unsafe|contaminat|pollut|germs?|bacteria|toxic|healthier|tastes?|purer?|clean water|water quality is)\b/i;
  const forbidden = ["spk-water-filter-panel", "wrt-water-use-policy-argue"];
  for (const id of forbidden) {
    const t = spk(id) || wrt(id);
    const corpus =
      JSON.stringify(t) +
      exemplars
        .filter((x) => x.taskId === id)
        .map((x) => JSON.stringify(x))
        .join(" ");
    const hit = corpus.match(claim);
    // The only allowed mention is the disclaimer that the task is NOT about quality or safety.
    assert.ok(!hit || /not about/.test(t.scenario), `${id}: ${hit?.[0]}`);
    assert.match(t.scenario, /not about/i, `${id} must state what it is not about`);
  }
});

test("improved existing tasks carry task-specific vocabulary and teacher notes", () => {
  const vocabHas = (t, term) => t.vocab.some((v) => v.term === term && /^[^:]+:\s*\S/.test(v.es));
  assert.ok(vocabHas(spk("spk35-weather-describe"), "the fewest"));
  assert.ok(vocabHas(spk("spk35-recess-argue"), "vote"));
  assert.ok(vocabHas(spk("spk-rainfall-describe"), "rain gauge"));
  assert.ok(vocabHas(spk("spk-discounts-discuss"), "successive discounts"));
  for (const id of [
    "spk35-weather-describe",
    "spk35-recess-argue",
    "spk-rainfall-describe",
    "spk-discounts-discuss",
  ])
    assert.ok(spk(id).teacher.commonIssues.length >= 2, `${id} teacher notes`);
  for (const id of ["wrt-commute-report", "wrt-printing-press-essay"]) {
    const prompts = wrt(id)
      .revisionPrompts.map((r) => r.prompt)
      .join(" ");
    assert.match(
      prompts,
      /might|may have|about|an estimated|only what the numbers show/i,
      `${id} cautious guidance`,
    );
    assert.ok(
      wrt(id).revisionPrompts.length >= 7,
      `${id} revision prompts were added, not replaced`,
    );
  }
});
