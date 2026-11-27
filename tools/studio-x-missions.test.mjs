// Studio X: missions (access-practice-lab/src/studio/x/missions*.js).
//   node --test tools/studio-x-missions.test.mjs
// Pins: every mission type compiles ONE valid lp-activity/1 from the teacher's own source with its stages in the fixed
// order; a stage the source cannot fill is omitted and listed in review[] (never filled with generic text); every
// sentence a student reads is the teacher's or a heading; support levels change access only; no timers and no new
// block types; unusable source questions are left out and named; the package parts really build a package whose
// student files carry no teacher notes; the player's own step model keeps every stage reachable, in order.
import assert from "node:assert/strict";
import test from "node:test";
import JSZip from "jszip";
import { allFormats } from "../access-practice-lab/src/studio/core/fixtures.js";
import {
  BLOCK_TYPES,
  normalizeActivity,
  questionsOf,
} from "../access-practice-lab/src/studio/core/schema.js";
import { validateActivity } from "../access-practice-lab/src/studio/core/validate.js";
import { buildSteps } from "../access-practice-lab/src/studio/player/flow.js";
import { ingestText } from "../access-practice-lab/src/studio/x/ingest.js";
import {
  buildMission,
  MISSION_IDS,
  missionNeeds,
  missionPackage,
  missionPackageParts,
  missionTypes,
  readMissionSource,
  STAGES,
} from "../access-practice-lab/src/studio/x/missions.js";
import { buildPackage, validatePackage } from "../access-practice-lab/src/studio/x/package.js";
import { PLAYER_CSS, PLAYER_JS } from "./studio-player-helpers.mjs";

const ID = { newId: () => "sfixed0003" };
const base = () => {
  const a = allFormats();
  a.blocks.push(
    {
      type: "table",
      caption: "Seeds sprouted",
      headers: ["Day", "Sprouts"],
      rows: [
        ["1", "0"],
        ["3", "2"],
      ],
    },
    {
      type: "question",
      format: "short",
      kind: "explain",
      prompt: "Explain what the table shows.",
      rubric: ["Names the pattern", "Uses numbers from the table"],
      sample: "Sprouts grow each day.",
    },
  );
  return normalizeActivity(a);
};
const INPUT = {
  topic: "Plant growth",
  objective: "Explain what plants need to grow.",
  question: "What helps a seed become a plant?",
  task: "Write two sentences that answer our question.",
  reflection: "What surprised you?",
  rubric: ["I name the pattern.", "I use numbers from the table."],
  source: { activity: base() },
};
const headings = (a) => a.blocks.filter((b) => b.type === "text" && b.role === "heading");
const textOf = (a) => JSON.stringify(a.blocks);

test("seven mission types, each with a plain purpose and per-stage needs", () => {
  const types = missionTypes();
  assert.equal(types.length, 7);
  assert.deepEqual(types.map((t) => t.id).sort(), [
    "communication",
    "escape",
    "history",
    "math",
    "reading",
    "science",
    "vocabulary",
  ]);
  for (const t of types) {
    assert.ok(t.label.en && t.label.es && t.purpose.en && t.purpose.es, t.id);
    const needs = missionNeeds(t.id);
    assert.deepEqual(
      needs.map((n) => n.stage),
      [...STAGES],
    );
    for (const n of needs) assert.ok(n.needs.en && n.needs.es && n.label.en && n.label.es);
  }
  assert.equal(STAGES.length, 9);
});

test("every mission type compiles one valid activity with its stages in order", () => {
  for (const type of MISSION_IDS) {
    const r = buildMission({ ...INPUT, type }, ID);
    assert.equal(
      r.ok,
      true,
      `${type}: ${JSON.stringify(r.review.filter((x) => x.code?.startsWith("invalid")))}`,
    );
    const a = r.activity;
    assert.equal(a.kind, "interactive");
    assert.deepEqual(normalizeActivity(a), a, `${type}: a fixed point of normalizeActivity`);
    assert.deepEqual(validateActivity(a).errors, [], type);
    assert.match(a.title, /Plant growth/);
    const built = r.stages.filter((s) => s.built).map((s) => s.id);
    assert.deepEqual(
      built,
      STAGES.filter((s) => built.includes(s)),
      `${type}: stage order is the fixed order`,
    );
    assert.ok(built.length >= 6, `${type}: ${built}`);
    assert.deepEqual(
      headings(a).map((h) => h.text.replace(/^\d+\. /, "")).length,
      built.length,
      "one heading per built stage",
    );
    headings(a).forEach((h, i) =>
      assert.match(h.text, new RegExp(`^${i + 1}\\. `), "numbered 1..n"),
    );
    const ids = a.blocks.map((b) => b.id);
    assert.equal(new Set(ids).size, ids.length, `${type}: unique ids`);
    // stage membership matches the block list exactly
    assert.deepEqual(
      r.stages.flatMap((s) => s.blockIds),
      ids,
    );
    assert.equal(a.options.timer, false);
    assert.equal(a.options.revise, true);
    assert.ok(
      a.blocks.every((b) => BLOCK_TYPES.includes(b.type)),
      "only existing block types",
    );
    assert.doesNotMatch(textOf(a), /timer|countdown|beat the clock|minutes? left/i);
    assert.equal(a.notes.teacher.length > 20, true, "teacher notes say what was built");
  }
});

test("stages the source cannot fill are omitted and reported, never filled with generic text", () => {
  const r = buildMission(
    {
      type: "science",
      topic: "Moon",
      source: {
        questions: [
          { format: "number", prompt: "What is 2 + 2?", answer: "4", explanation: "Add." },
        ],
      },
    },
    ID,
  );
  assert.equal(r.ok, true);
  assert.deepEqual(
    r.stages.filter((s) => s.built).map((s) => s.id),
    ["practice"],
  );
  const omittedStages = r.review.filter((x) => x.code === "stage-omitted").map((x) => x.stage);
  assert.deepEqual(
    omittedStages,
    STAGES.filter((s) => s !== "practice"),
  );
  for (const x of r.review) assert.ok(x.en && x.es, `bilingual: ${x.code}`);
  // the only text a student reads is a heading and the teacher's own question
  const texts = r.activity.blocks.filter((b) => b.type === "text");
  assert.deepEqual(
    texts.map((b) => b.role),
    ["heading"],
  );
  assert.equal(
    r.activity.blocks.filter((b) => b.type === "organizer").length,
    0,
    "no organizer without anything to gather from",
  );
  assert.equal(questionsOf(r.activity)[0].prompt, "What is 2 + 2?");
});

test("every sentence a student reads comes from the teacher: nothing is invented", () => {
  const r = buildMission({ ...INPUT, type: "history" }, ID);
  const src = base();
  const allowed = new Set([
    INPUT.objective,
    INPUT.question,
    INPUT.task,
    INPUT.reflection,
    ...src.blocks.flatMap((b) => [b.text, b.title, b.prompt, b.caption].filter(Boolean)),
  ]);
  for (const b of r.activity.blocks) {
    if (b.type === "text" && b.role === "heading") continue;
    if (b.type === "text") {
      const body = b.text.split("\n").filter((l) => !/^Check your response/.test(l));
      for (const line of body)
        assert.ok(
          allowed.has(line) || INPUT.rubric.includes(line.replace(/^• /, "")),
          `unexpected text: ${line}`,
        );
    }
    if (b.type === "question") {
      const original = [...questionsOf(src)].find((q) => q.prompt === b.prompt);
      if (original)
        assert.equal(
          JSON.stringify({ ...b, id: 0 }),
          JSON.stringify({ ...original, id: 0 }),
          `question untouched: ${b.prompt}`,
        );
      else
        assert.ok(
          [INPUT.task, INPUT.reflection].includes(b.prompt),
          `unexpected question: ${b.prompt}`,
        );
    }
    if (b.type === "passage" || b.type === "vocab" || b.type === "table") {
      const same = src.blocks.find((s) => s.type === b.type);
      assert.equal(
        JSON.stringify({ ...b, id: 0 }),
        JSON.stringify({ ...same, id: 0 }),
        `${b.type} is the teacher's own`,
      );
    }
  }
});

test("success points you type become the feedback stage, word for word; none typed, no feedback stage", () => {
  const withRubric = buildMission({ ...INPUT, type: "science" }, ID);
  const feedback = withRubric.stages.find((s) => s.id === "feedback");
  assert.equal(feedback.built, true);
  const body = withRubric.activity.blocks.find((b) => b.id === feedback.blockIds[1]);
  assert.match(body.text, /• I name the pattern\./);
  assert.match(body.text, /• I use numbers from the table\./);
  // the question's own (teacher-only) rubric never becomes student-facing text
  for (const b of withRubric.activity.blocks.filter((x) => x.type !== "question"))
    assert.ok(
      !JSON.stringify(b).includes("Names the pattern"),
      "teacher-only rubric stays out of student text",
    );
  const none = buildMission(
    {
      type: "science",
      topic: "Moon",
      task: "Explain the phases.",
      source: { passage: "The moon changes shape. We see different parts lit each night." },
    },
    ID,
  );
  assert.equal(none.stages.find((s) => s.id === "feedback").built, false);
  assert.ok(none.review.some((x) => x.code === "stage-omitted" && x.stage === "feedback"));
});

test("revision comes from find-the-mistake questions, otherwise the report says the player handles it", () => {
  const r = buildMission({ ...INPUT, type: "math" }, ID);
  assert.equal(r.stages.find((s) => s.id === "revision").built, true);
  assert.equal(questionsOf(r.activity).filter((q) => q.format === "error").length, 1);
  const noError = buildMission(
    {
      type: "math",
      topic: "Ratios",
      source: { questions: [{ format: "number", prompt: "3 + 4?", answer: "7" }] },
    },
    ID,
  );
  const native = noError.review.find((x) => x.code === "stage-native" && x.stage === "revision");
  assert.ok(native, "reported plainly");
  assert.equal(noError.activity.options.revise, true);
});

test("questions that fail the studio's own checks are left out and named", () => {
  const r = buildMission(
    {
      type: "escape",
      topic: "Review",
      source: {
        questions: [
          {
            format: "choice",
            prompt: "Pick one",
            options: [
              { id: "a", text: "x" },
              { id: "b", text: "y" },
            ],
          },
          { format: "number", prompt: "1 + 1?", answer: "2" },
        ],
      },
    },
    ID,
  );
  assert.equal(r.ok, true);
  assert.equal(questionsOf(r.activity).length, 1);
  const x = r.review.find((i) => i.code === "question-left-out");
  assert.ok(x && /Pick one/.test(x.en) && x.es);
});

test("no source at all is refused with a plain reason, not an empty mission", () => {
  const r = buildMission(
    { type: "reading", topic: "Dragons", objective: "Read about dragons." },
    ID,
  );
  assert.equal(r.ok, false);
  assert.equal(r.activity, null);
  assert.ok(r.review.some((x) => x.code === "no-questions" && x.en && x.es));
  assert.equal(buildMission({ type: "nope", topic: "x" }).review[0].code, "bad-type");
  assert.equal(buildMission({ type: "science", topic: "  " }).review[0].code, "no-topic");
});

test("a writing task becomes a written-response question with the teacher's words", () => {
  const r = buildMission(
    {
      type: "communication",
      topic: "Debate",
      task: "Argue for or against homework.",
      source: { vocab: [{ term: "claim", def: "a statement you argue" }] },
    },
    ID,
  );
  assert.equal(r.ok, true);
  const q = questionsOf(r.activity);
  assert.equal(q.length, 1);
  assert.equal(q[0].format, "short");
  assert.equal(q[0].prompt, "Argue for or against homework.");
  assert.equal(q[0].kind, "write");
  assert.equal(r.activity.blocks.find((b) => b.type === "vocab").items[0].term, "claim");
});

test("support level changes access only: same questions, same answers, same order", () => {
  const light = buildMission({ ...INPUT, type: "science", support: "light" }, ID).activity;
  const guided = buildMission({ ...INPUT, type: "science", support: "guided" }, ID).activity;
  const full = buildMission({ ...INPUT, type: "science", support: "full" }, ID).activity;
  assert.equal(light.supports.frames, false);
  assert.equal(guided.supports.frames, true);
  assert.equal(full.supports.readAloud, true);
  const essence = (a) =>
    questionsOf(a).map((q) => [
      q.format,
      q.prompt,
      q.answer ?? q.answers ?? q.pairs ?? q.items ?? null,
    ]);
  assert.deepEqual(essence(guided), essence(light));
  assert.deepEqual(essence(full), essence(light));
  assert.deepEqual(
    headings(full).map((h) => h.text),
    headings(light).map((h) => h.text),
    "stage order survives the support layer",
  );
});

test("Spanish headings when the teacher works in Spanish", () => {
  const r = buildMission({ ...INPUT, type: "science", lang: "es" }, ID);
  assert.match(r.activity.title, /^Investigación científica/);
  assert.match(headings(r.activity)[0].text, /^1\. Informe de la misión/);
  assert.match(r.activity.notes.teacher, /Etapas creadas/);
});

test("an ingest result is a source: its own vocabulary and questions are used", () => {
  const ingest = ingestText(
    "Words\norbit - the path around a planet\ncrater - a bowl-shaped hole\n\n1. What is an orbit?\nA. A path around a planet\n*B. Nothing\nC. A hole\n",
  );
  const src = readMissionSource({ ingest });
  assert.ok(src.vocab.some((v) => v.term === "orbit"));
  assert.ok(Array.isArray(src.rejected));
  const r = buildMission({ type: "vocabulary", topic: "Space words", source: { ingest } }, ID);
  assert.ok(r.activity === null || r.activity.blocks.some((b) => b.type === "vocab"));
});

test("the same input gives the same mission", () => {
  const stripIds = (a) =>
    JSON.stringify({ ...a, createdAt: 0, updatedAt: 0, blocks: a.blocks.map(({ id, ...b }) => b) });
  assert.equal(
    stripIds(buildMission({ ...INPUT, type: "reading" }, ID).activity),
    stripIds(buildMission({ ...INPUT, type: "reading" }, ID).activity),
  );
});

test("the player's own step model keeps every stage reachable, in order, with no step lost", () => {
  const { activity, stages } = buildMission({ ...INPUT, type: "science" }, ID);
  const steps = buildSteps(activity);
  const stepOf = (id) =>
    steps.findIndex((s) => s.question?.id === id || s.content.some((b) => b.id === id));
  let last = -1;
  for (const s of stages.filter((x) => x.built)) {
    const at = stepOf(s.blockIds[0]);
    assert.ok(at >= 0, `${s.id} heading is in a step`);
    assert.ok(at >= last, `${s.id} is not before the stage before it`);
    last = at;
  }
  assert.equal(
    steps.filter((s) => s.question).length,
    questionsOf(activity).length,
    "every question is one step",
  );
  assert.ok(
    !activity.blocks.some((b) => b.type === "note"),
    "no teacher notes inside the student flow",
  );
});

test("a blank whose answer is on the printed word list is flagged before packaging refuses it", async () => {
  const { activity } = buildMission({ ...INPUT, type: "science" }, ID);
  const { review } = missionPackage(activity);
  assert.ok(
    review.some((r) => r.code === "blank-answer-on-word-list" && /ratio/.test(r.en) && r.es),
  );
  await assert.rejects(
    buildPackage(
      { title: "x", parts: missionPackageParts(activity) },
      { generatedAt: "2026-11-26", js: PLAYER_JS, css: PLAYER_CSS, JSZip },
    ),
    (e) => e.code === "answer-leak",
  );
});

test("missionPackageParts is the shape buildPackage expects and builds a clean package", async () => {
  const noBlanks = {
    ...INPUT.source.activity,
    blocks: INPUT.source.activity.blocks.filter((b) => b.format !== "blank"),
  };
  const { activity } = buildMission(
    { ...INPUT, type: "science", source: { activity: noBlanks } },
    ID,
  );
  assert.deepEqual(
    missionPackage(activity).review.filter((r) => r.code === "blank-answer-on-word-list"),
    [],
  );
  const parts = missionPackageParts(activity);
  assert.deepEqual(
    parts.map((p) => [p.id, p.role]),
    [
      ["mission", "interactive"],
      ["printable", "worksheet"],
      ["teacher-notes", "notes"],
    ],
  );
  const built = await buildPackage(
    { title: activity.title, lang: "en", parts },
    { generatedAt: "2026-11-26", js: PLAYER_JS, css: PLAYER_CSS, JSZip },
  );
  const verdict = await validatePackage(built.zip, { JSZip });
  assert.equal(verdict.ok, true, JSON.stringify(verdict.errors));
  const zip = await JSZip.loadAsync(built.zip);
  const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
  for (const n of [
    "student/mission.html",
    "student/printable-print.html",
    "teacher/teacher-notes-print.html",
  ])
    assert.ok(names.includes(n), `${n} is in the package`);
  for (const n of names.filter((f) => f.startsWith("student/"))) {
    const html = await zip.file(n).async("string");
    assert.ok(!html.includes(activity.notes.teacher), `${n}: no teacher notes in a student file`);
  }
});
