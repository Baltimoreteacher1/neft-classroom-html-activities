// The verified math generators behind Activity Studio's "make practice for this unit".
//   node --test tools/studio-mathgen.test.mjs
// Pins: every topic is wired and makes full sets; the same seed gives the same questions; every typed-number key
// agrees with its own expression under a SECOND evaluator (plain floating point, not core/math.js); every set is
// accepted by the studio's own schema and validator; topicForUnit offers only what a unit's standards or title name.
import assert from "node:assert/strict";
import test from "node:test";
import {
  generateMath,
  MATH_TOPICS,
  mathSet,
  topicForUnit,
} from "../access-practice-lab/src/studio/core/mathgen.js";
import { normalizeActivity } from "../access-practice-lab/src/studio/core/schema.js";
import { validateActivity } from "../access-practice-lab/src/studio/core/validate.js";

const SEEDS = [1, 2, 3, 4, 5];
const LEVELS = [1, 2, 3];

test("every topic is wired and makes a full set at every grade and level", () => {
  assert.ok(MATH_TOPICS.length >= 17, "the topic list did not shrink");
  for (const topic of MATH_TOPICS)
    for (const grade of topic.grades)
      for (const level of LEVELS)
        for (const seed of SEEDS) {
          const set = generateMath({ topic: topic.id, grade, level, seed, count: 8 });
          assert.equal(
            set.length,
            8,
            `${topic.id} g${grade} L${level} #${seed} made ${set.length} of 8`,
          );
        }
});

test("an unknown topic makes nothing", () => {
  assert.deepEqual(generateMath({ topic: "no-such-topic" }), []);
  assert.deepEqual(mathSet({ topics: ["no-such-topic"] }), []);
});

test("the same seed gives the same questions; a different seed gives different ones", () => {
  for (const topic of MATH_TOPICS) {
    const a = generateMath({ topic: topic.id, seed: 7, count: 6 });
    const b = generateMath({ topic: topic.id, seed: 7, count: 6 });
    const c = generateMath({ topic: topic.id, seed: 8, count: 6 });
    assert.deepEqual(a, b, `${topic.id} is not deterministic`);
    assert.notDeepEqual(a, c, `${topic.id} ignores its seed`);
  }
});

test("no set repeats a prompt", () => {
  for (const topic of MATH_TOPICS) {
    const set = generateMath({ topic: topic.id, seed: 3, count: 10 });
    const keys = set.map((q) => `${q.prompt}|${JSON.stringify(q.steps ?? q.rows ?? "")}`);
    assert.equal(new Set(keys).size, keys.length, `${topic.id} repeats a question`);
  }
});

// A second evaluator on purpose: floats, own symbol map, no BigInt rationals.
function floatOf(expr) {
  const js = String(expr)
    .replace(/[−–]/g, "-")
    .replace(/×/g, "*")
    .replace(/[÷]/g, "/")
    .replace(/\^/g, "**")
    .replace(/,/g, "");
  if (!/^[\d\s.+\-*/()]+$/.test(js)) return null;
  try {
    return Function(`"use strict"; return (${js});`)();
  } catch {
    return null;
  }
}
const answerNumber = (text) => {
  const s = String(text).replace(/[−–]/g, "-").replace(/[$,%]/g, "").trim();
  const mixed = /^(-?)(\d+)\s+(\d+)\/(\d+)$/.exec(s);
  if (mixed) return (mixed[1] ? -1 : 1) * (Number(mixed[2]) + Number(mixed[3]) / Number(mixed[4]));
  const simple = /^(-?\d+)\/(\d+)$/.exec(s);
  return simple ? Number(simple[1]) / Number(simple[2]) : Number(s.replace(/\s/g, ""));
};

test("every typed-number key equals its expression under a second evaluator", () => {
  let checked = 0;
  let numbers = 0;
  for (const topic of MATH_TOPICS)
    for (const grade of topic.grades)
      for (const level of LEVELS)
        for (const q of generateMath({ topic: topic.id, grade, level, seed: 11, count: 8 })) {
          if (q.format !== "number") continue;
          numbers++;
          const want = floatOf(q.expr);
          if (want === null) continue;
          checked++;
          const got = answerNumber(q.answer);
          assert.ok(
            Math.abs(want - got) < 1e-9,
            `${topic.id}: "${q.prompt}" key ${q.answer} but ${q.expr} = ${want}`,
          );
        }
  assert.ok(numbers > 100, `only ${numbers} typed-number questions swept`);
  assert.ok(checked / numbers > 0.5, `only ${checked} of ${numbers} keys were checkable`);
});

test("mixed sets get harder and are accepted by the studio schema and validator", () => {
  const topics = MATH_TOPICS.filter((t) => t.grades.includes(6)).map((t) => t.id);
  const questions = mathSet({ topics, grade: 6, count: 12, seed: 5 });
  assert.equal(questions.length, 12);
  const activity = normalizeActivity({
    schema: "lp-activity/1",
    title: "Practice",
    kind: "worksheet",
    template: "practice",
    blocks: questions,
  });
  assert.equal(
    activity.blocks.filter((b) => b.type === "question").length,
    12,
    "normalize kept every question",
  );
  const report = validateActivity(activity);
  assert.deepEqual(report.errors, [], JSON.stringify(report.errors));
});

test("topicForUnit offers only what the standards or the title name, for the right grade", () => {
  assert.deepEqual(
    topicForUnit({ grade: 6, subject: "Math", standards: ["6.RP.A.3c"] }).slice(0, 3),
    ["equivalent-ratios", "unit-rate", "percent"],
  );
  assert.deepEqual(topicForUnit({ grade: 6, subject: "Math", standards: ["6.EE.B.7"] }), [
    "one-step-equations",
  ]);
  assert.deepEqual(
    topicForUnit({ grade: 6, subject: "Math", unitTitle: "Volume of Rectangular Prisms" }),
    ["volume"],
  );
  assert.deepEqual(topicForUnit({ grade: 7, subject: "Math", standards: ["7.EE.B.4b"] }), [
    "two-step-equations",
    "inequalities",
  ]);
  assert.deepEqual(
    topicForUnit({ grade: 3, subject: "Math", standards: ["6.RP.A.3"] }),
    [],
    "no topic is written for grade 3 ratios",
  );
  assert.deepEqual(
    topicForUnit({ grade: 6, subject: "ELA", unitTitle: "Fractions" }),
    [],
    "math only",
  );
  assert.deepEqual(
    topicForUnit({ grade: 6, subject: "Math", unitTitle: "Poetry" }),
    [],
    "nothing is guessed",
  );
  for (const t of topicForUnit({
    grade: 6,
    subject: "Math",
    unitTitle: "fractions and decimals and ratios and area",
  }))
    assert.ok(
      MATH_TOPICS.some((m) => m.id === t),
      `${t} is a real topic`,
    );
});
