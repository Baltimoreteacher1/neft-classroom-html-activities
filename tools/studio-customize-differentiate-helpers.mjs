// Fixtures and assertions shared by the Customize Activity differentiation tests (not a test file itself).
import assert from "node:assert/strict";
import { checkResponse } from "../access-practice-lab/src/studio/core/check.js";
import { keyResponse } from "../access-practice-lab/src/studio/core/differentiate.js";
import { allFormats, vocabSample } from "../access-practice-lab/src/studio/core/fixtures.js";
import { generateMath } from "../access-practice-lab/src/studio/core/mathgen.js";
import { normalizeActivity, questionsOf } from "../access-practice-lab/src/studio/core/schema.js";
import { validateActivity } from "../access-practice-lab/src/studio/core/validate.js";

export const freeze = (v) => {
  if (v && typeof v === "object" && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const k of Object.keys(v)) freeze(v[k]);
  }
  return v;
};
export const json = (v) => JSON.stringify(v);

export const reading = () =>
  normalizeActivity({
    id: "sample-reading",
    title: "The Garden Reading",
    kind: "interactive",
    template: "interactive-reading",
    context: {
      grade: "4",
      subject: "Science",
      objective: "Explain what plants need to grow.",
      standards: [{ code: "4-LS1-1", origin: "teacher" }],
      source: { origin: "teacher" },
    },
    supports: { hints: true },
    blocks: [
      {
        id: "d1",
        type: "text",
        role: "directions",
        text: "Read the passage. Then answer the questions; use the word list if you need help. Ask a partner if you are stuck.",
      },
      {
        id: "p1",
        type: "passage",
        title: "The Garden",
        text: "Mia plants seeds in the spring. The seeds need water and sun to grow. In summer the plants grow tall and strong. Mia waters them every morning before school. Bees visit the flowers and carry yellow dust from one plant to the next. Mia picks the ripe vegetables in the fall and shares them with her family.",
      },
      {
        id: "v1",
        type: "vocab",
        items: [
          {
            id: "w1",
            term: "seed",
            def: "a small part of a plant that can grow into a new plant",
            es: "semilla",
            example: "A seed needs water.",
          },
          {
            id: "w2",
            term: "grow",
            def: "to get bigger",
            es: "crecer",
            example: "Plants grow in the sun.",
          },
          {
            id: "w3",
            term: "ripe",
            def: "ready to eat",
            es: "maduro",
            example: "The ripe fruit is red.",
          },
        ],
      },
      {
        id: "c1",
        type: "question",
        format: "choice",
        prompt: "What do the seeds need?",
        options: [
          { id: "a", text: "Water and sun" },
          { id: "b", text: "Only snow" },
          { id: "c", text: "Plastic" },
        ],
        answer: "a",
        hint: "Read the second sentence.",
        explanation: "The passage says seeds need water and sun.",
        skill: "details",
      },
      {
        id: "b1",
        type: "question",
        format: "blank",
        prompt: "Complete the sentence.",
        text: "Mia plants seeds in the [[spring]].",
        hint: "Find the season in the first sentence.",
        explanation: "The passage says spring.",
        skill: "details",
      },
      {
        id: "s1",
        type: "question",
        format: "short",
        kind: "explain",
        prompt: "Why do the plants grow tall?",
        rubric: ["Names water and sun"],
        skill: "explain",
      },
      { id: "n1", type: "note", text: "Watch for students who skip the word list." },
    ],
  });

export const mathWorksheet = () =>
  normalizeActivity({
    id: "sample-math",
    title: "Ratio Practice",
    kind: "worksheet",
    template: "guided",
    context: {
      grade: "6",
      subject: "Math",
      objective: "Write equivalent ratios.",
      source: { origin: "teacher" },
    },
    blocks: [
      { id: "md", type: "text", role: "directions", text: "Solve each problem. Show your work." },
      ...generateMath({ topic: "equivalent-ratios", grade: 6, count: 6, seed: 7, level: 1 }),
    ],
  });

// Built once: fixtures made without ids would otherwise get random ones on every call.
export const once = (make) => {
  let value;
  return () => {
    value ||= make();
    return value;
  };
};
export const FIXTURES = {
  allFormats: once(() => allFormats()),
  worksheetAll: once(() => allFormats("worksheet")),
  vocabSample: once(() => vocabSample()),
  reading: once(reading),
  mathWorksheet: once(mathWorksheet),
};

let counter = 0;
export const deps = { newId: () => `s${(++counter).toString(16).padStart(10, "0")}` };

export const hasSpanish = (t) =>
  t?.en &&
  t?.es &&
  t.en !== t.es &&
  /[áéíóúñ¿¡]|\b(se|el|la|los|las|de|que|para|no|un|una|y|con|nivel|palabras?|preguntas?|pasos?|apoyo|lectura|pistas|marcos|elementos|misma|mismo|mismas|mismos|boleto|tarea|hoja|actividad|respuestas?|claves)\b/i.test(
    t.es,
  );
export const allBilingual = (list, label) => {
  for (const t of list) assert.ok(hasSpanish(t), `${label}: not bilingual: ${json(t)}`);
};
export const errorKeys = (a) => validateActivity(a).errors.map((e) => `${e.code}:${e.blockId}`);

export const correctStatus = (q) => checkResponse(q, keyResponse(q)).status;

export function assertWellFormed(source, out, label) {
  assert.deepEqual(normalizeActivity(out), out, `${label}: not a fixed point of normalizeActivity`);
  const had = new Set(errorKeys(source));
  for (const e of errorKeys(out)) assert.ok(had.has(e), `${label}: new validation error ${e}`);
  assert.equal(out.options.timer, false, `${label}: timer`);
}

export function assertKeysStillWork(source, out, label) {
  const byId = new Map(questionsOf(out).map((q) => [q.id, q]));
  for (const q of questionsOf(source)) {
    const v = byId.get(q.id);
    if (!v) continue;
    assert.equal(
      checkResponse(v, keyResponse(q)).status,
      correctStatus(q),
      `${label}: key of ${q.id} no longer accepted`,
    );
  }
}

/** Deliberate corruptions of a differentiated version, each of which assertRigor must catch under its code. */
const first = (a, format) => questionsOf(a).find((q) => q.format === format);
export const CORRUPTIONS = [
  [
    "key",
    (a) => {
      const q = first(a, "choice") || first(a, "number");
      if (q.format === "choice") q.answer = q.options.find((o) => o.id !== q.answer).id;
      else q.answer = `${q.answer}9`;
    },
  ],
  [
    "dropped",
    (a) => {
      const q = questionsOf(a)[0];
      a.blocks = a.blocks.filter((b) => b.id !== q.id);
    },
  ],
  [
    "objective",
    (a) => {
      a.context.objective = "Something easier";
    },
  ],
  [
    "prompt",
    (a) => {
      questionsOf(a)[0].prompt += " (hint: it is B)";
    },
  ],
  [
    "format",
    (a) => {
      const q = questionsOf(a)[0];
      q.format = q.format === "choice" ? "number" : "choice";
    },
  ],
  [
    "added-not-allowed",
    (a) => {
      a.blocks.push({
        id: "extra",
        type: "question",
        format: "choice",
        prompt: "Extra?",
        options: [
          { id: "a", text: "x" },
          { id: "b", text: "y" },
        ],
        answer: "a",
        hint: "h",
        explanation: "e",
      });
    },
  ],
  [
    "reordered",
    (a) => {
      const qs = a.blocks.filter((b) => b.type === "question");
      const i = a.blocks.indexOf(qs[0]);
      const j = a.blocks.indexOf(qs[1]);
      [a.blocks[i], a.blocks[j]] = [a.blocks[j], a.blocks[i]];
    },
  ],
];
