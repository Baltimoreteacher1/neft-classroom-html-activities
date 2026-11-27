// Worksheets of a chosen length for the fitting tests: a realistic mix of the formats a teacher uses most.
// Test aid only; nothing on the student pages imports it.

import { normalizeActivity } from "../core/schema.js";

const q = (id, format, rest) => ({ id, type: "question", format, ...rest });

const MAKERS = [
  (i) =>
    q(`q${i}`, "choice", {
      prompt: `Which ratio is equivalent to ${i + 1}:${i + 2}?`,
      options: [
        { id: "a", text: `${2 * (i + 1)}:${2 * (i + 2)}` },
        { id: "b", text: `${i + 2}:${i + 1}` },
        { id: "c", text: `${i + 1}:${2 * (i + 2)}` },
        { id: "d", text: `${i + 3}:${i + 4}` },
      ],
      answer: "a",
    }),
  (i) =>
    q(`q${i}`, "number", {
      prompt: `${i + 2} cups of flour go with 3 cups of sugar. How much flour goes with ${3 * (i + 2)} cups of sugar?`,
      answer: String((i + 2) * (i + 2)),
      accept: [],
      expr: String((i + 2) * (i + 2)),
      unit: "cups",
    }),
  (i) =>
    q(`q${i}`, "choice", {
      prompt: `Which pair of ratios is equivalent?`,
      options: [
        { id: "a", text: `${i + 1}:2 and ${2 * (i + 1)}:4` },
        { id: "b", text: `${i + 1}:2 and ${i + 2}:3` },
        { id: "c", text: `${i + 1}:2 and 2:${i + 1}` },
      ],
      answer: "a",
    }),
  (i) =>
    q(`q${i}`, "short", {
      prompt: `Why are ${i + 1}:${i + 2} and ${2 * (i + 1)}:${2 * (i + 2)} equivalent?`,
      kind: "write",
      sample: "Both parts were multiplied by 2.",
      rubric: ["Names the multiplier"],
    }),
  (i) =>
    q(`q${i}`, "blank", {
      prompt: "Fill in the blank.",
      text: `A ratio compares [[two]] amounts (item ${i}).`,
    }),
];

/**
 * A worksheet with `n` questions and a heading plus directions up front. Question ids are q0..q(n-1); a heading is
 * added before every sixth question so long sheets have section titles that must not be stranded.
 */
export function sampleWorksheet(n, extra = {}) {
  const blocks = [
    { id: "d1", type: "text", role: "directions", text: "Read each question carefully. Show your thinking." },
  ];
  for (let i = 0; i < n; i++) {
    if (i > 0 && i % 6 === 0)
      blocks.push({ id: `h${i}`, type: "text", role: "heading", text: `Part ${i / 6 + 1}: More practice` });
    blocks.push(MAKERS[i % MAKERS.length](i));
  }
  return normalizeActivity({
    id: `fit-sample-${n}`,
    title: `Ratios practice (${n} questions)`,
    kind: "worksheet",
    template: "guided",
    context: { grade: "6", subject: "Math", unitNumber: 3, unitTitle: "Ratios", objective: "I can write equivalent ratios." },
    blocks,
    ...extra,
  });
}
