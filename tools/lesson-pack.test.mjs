import assert from "node:assert/strict";
import test from "node:test";
import { buildLessonPack } from "../access-practice-lab/src/lesson-builder/pack.js";

const lesson = {
  settings: {
    band: "3-5",
    domains: ["Reading"],
    fn: "explain",
    support: "B",
    minutes: 20,
    topic: "Plant growth",
  },
  objectives: {
    content: "I can describe how a seed changes.",
    language: "I can explain a change using because.",
  },
  phases: [
    {
      key: "opening",
      minutes: 4,
      teacher: "Model the idea.",
      student: "Notice a change.",
      frames: ["I notice ___"],
    },
    {
      key: "vocabulary",
      minutes: 4,
      teacher: "Preview words.",
      student: "Use the words.",
      words: ["seed", "sprout"],
    },
    {
      key: "exit",
      minutes: 3,
      teacher: "Look for a clear cause and effect.",
      student: "Explain one change.",
      frames: ["It changed because ___"],
    },
  ],
};

test("T3 lesson pack separates the teacher key from three student support sheets", () => {
  const pack = buildLessonPack(lesson, {
    rowById: () => null,
    phaseHref: () => "/access-practice-lab/",
    homeCard: { q: ["What changed?", "¿Qué cambió?"], starter: ["I notice…", "Veo…"] },
    glossary: {
      terms: [
        { term: "seed", es: "semilla", emoji: "🌱" },
        { term: "sprout", es: "brote" },
      ],
    },
    origin: "https://thelanguagepage.com",
  });
  assert.ok(pack.bytes instanceof Uint8Array);
  assert.equal(pack.challengeCount, 6);
  assert.ok(pack.files["student/sheet-A.html"].includes("Ready for more?"));
  assert.ok(pack.files["student/sheet-B.html"].includes("explain a change using because"));
  assert.ok(pack.files["student/sheet-C.html"].includes("Need more help?"));
  assert.ok(pack.files["student/vocabulary-grid.html"].includes("semilla"));
  assert.ok(pack.files["student/home-task.html"].includes("¿Qué cambió?"));
  assert.ok(pack.files["teacher/answer-key.html"].includes("TEACHER ONLY"));
  for (const [name, body] of Object.entries(pack.files)) {
    if (name.startsWith("student/"))
      assert.doesNotMatch(body, /TEACHER ONLY|Look for a clear cause/);
  }
  assert.match(new TextDecoder().decode(pack.bytes), /teacher\/answer-key\.html/);
});

test("T3 rejects exporting an unbuilt or malformed lesson", () => {
  assert.throws(() => buildLessonPack(null), /Build a lesson/);
});
