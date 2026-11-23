// Richer activities than core/fixtures.js for the print and Word tests: every block type, math markup, all six
// organizers, supports on, and a landscape picture with regions.

import { normalizeActivity } from "../core/schema.js";

export const PICTURE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAoCAIAAADBrGu+AAAAeklEQVR4nO3VsQmAQBQEUQuzCGOrM7acq8TYyExE5PiYzC0MTHqwL/k37e2IbsIXCKAXCKAX3J1tfhYGeK2vG4YAfK4vGnhAZ33FIECAABoQf4U6hsrDUQDxP/HvBNAJoBNAlw9YtyU6AXQC6ATQCaATQCeATgBdPOACYcWLOoaz8ygAAAAASUVORK5CYII=";

const q = (id, format, rest) => ({ id, type: "question", format, ...rest });

export function richWorksheet(extra = {}) {
  return normalizeActivity({
    id: "rich-ws",
    title: 'Fractions & Ratios: "Quick" Practice',
    description: "Ratios, fractions and a short reading.",
    kind: "worksheet",
    template: "guided",
    context: {
      grade: "6",
      subject: "Math",
      unitNumber: 3,
      unitTitle: "Ratios",
      day: "Day 2",
      objective: "I can compare two amounts with a ratio.",
      standards: [{ code: "6.RP.A.1", origin: "teacher" }],
    },
    supports: { spanish: true, visuals: true, frames: true, hints: true },
    options: { workspace: "roomy" },
    notes: { teacher: "Pair students for question 4.", misconceptions: ["Adding instead of multiplying."] },
    blocks: [
      { id: "h1", type: "text", role: "heading", text: "Part A: Ratios" },
      { id: "d1", type: "text", role: "directions", text: "Read the passage.\n\nThen answer each question." },
      { id: "p1", type: "passage", title: "The Bake Sale", text: "Ana mixes **2 cups** of flour with 3 cups of sugar.\n\nShe doubles the recipe." },
      { id: "v1", type: "vocab", items: [
        { id: "ratio", term: "ratio", def: "A comparison of two amounts.", es: "razón", example: "2 to 3", image: { src: PICTURE, alt: "A cake" } },
        { id: "rate", term: "rate", def: "A ratio with different units.", es: "tasa", example: "60 miles per hour" },
      ] },
      { id: "i1", type: "image", src: PICTURE, alt: "A sunny field", caption: "A field at noon." },
      { id: "m1", type: "math", text: "{3/4} + {1/8} = x^2", caption: "Example" },
      { id: "t1", type: "table", caption: "Recipe", headers: ["Flour", "Sugar"], rows: [["2", "3"], ["4", "6"]] },
      { id: "o1", type: "organizer", kind: "kwl", prompts: [] },
      { id: "o2", type: "organizer", kind: "compare", prompts: ["Ratio", "Rate"] },
      { id: "o3", type: "organizer", kind: "cause-effect", prompts: ["More flour"] },
      { id: "o4", type: "organizer", kind: "claim-evidence", prompts: ["Ana is right"] },
      { id: "o5", type: "organizer", kind: "web", prompts: ["Ratios", "Part", "Whole"] },
      { id: "o6", type: "organizer", kind: "sequence", prompts: ["Mix", "Bake"] },
      { id: "a1", type: "audio", label: "Listening", say: "Ana mixes flour with sugar. Listen for the ratio." },
      q("c1", "choice", { prompt: "What is the ratio of flour to sugar?", options: [
        { id: "a", text: "2 to 3" }, { id: "b", text: "3 to 2" }, { id: "c", text: "{2/5}" } ],
        answer: "a", hint: "Flour first.", explanation: "Flour is 2 and sugar is 3.", misconception: "Reversing the order." }),
      q("n1", "number", { prompt: "How many cups of sugar for 6 cups of flour?", answer: "9", unit: "cups", expr: "6*3/2", explanation: "Scale by 3.", hint: "Find the scale factor." }),
      q("b1", "blank", { prompt: "Fill in.", text: "The ratio 2:3 is [[equivalent|the same]] to [[4]]:6.", bank: true, explanation: "Multiply both by 2." }),
      q("s1", "short", { prompt: "Explain why 4:6 equals 2:3.", kind: "explain", sample: "Both are multiplied by 2.", rubric: ["Names the factor"], frame: "Both amounts are ___ by ___.", minWords: 20 }),
      q("l1", "numberline", { prompt: "Mark {7/8}.", min: 0, max: 2, step: 0.25, answer: "7/8" }),
      q("pl1", "plot", { prompt: "Plot the points.", min: -4, max: 4, points: [{ x: 3, y: -2 }, { x: -1, y: 4 }] }),
      q("h2", "hotspot", { prompt: "Where is the sun?", image: { src: PICTURE, alt: "A field with a sun" }, regions: [
        { id: "sun", label: "The sun", x: 62, y: 5, w: 30, h: 35 }, { id: "grass", label: "The grass", x: 0, y: 62, w: 100, h: 38 } ], answer: "sun" }),
      { id: "n9", type: "note", text: "Collect papers at the bell." },
    ],
    ...extra,
  });
}

/** One question of each answer-bearing field set to a unique token, to prove the student copy never prints them. */
export function sentinelWorksheet() {
  return normalizeActivity({
    id: "sentinel",
    title: "Sentinel",
    kind: "worksheet",
    supports: { spanish: true, frames: true },
    notes: { teacher: "ZQNOTE-teacher", misconceptions: ["ZQNOTE-miscon"] },
    blocks: [
      q("c", "choice", { prompt: "Pick one.", options: [{ id: "a", text: "Left" }, { id: "b", text: "Right" }], answer: "b", hint: "ZQHINT-c", explanation: "ZQEXPL-c", misconception: "ZQMISC-c" }),
      q("n", "number", { prompt: "Compute.", answer: "98765", accept: ["98765.0", "ZQACCEPT"], expr: "98765", explanation: "ZQEXPL-n" }),
      q("b", "blank", { prompt: "Fill.", text: "A [[zqalpha|zqalt]] and [[zqbeta]].", explanation: "ZQEXPL-b" }),
      q("s", "short", { prompt: "Write.", sample: "ZQSAMPLE", rubric: ["ZQRUBRIC"], kind: "write" }),
      q("t", "fillTable", { prompt: "Fill.", headers: ["x", "y"], rows: [["1", { answer: "zqcell1" }], ["2", { answer: "zqcell2" }]] }),
      q("l", "numberline", { prompt: "Mark it.", min: 0, max: 1, step: 0.25, answer: "7/8" }),
      q("p", "plot", { prompt: "Plot it.", min: 0, max: 5, points: [{ x: 3, y: 4 }] }),
      q("bd", "build", { prompt: "Build.", words: ["Pinto", "quill", "rowan"], accept: ["ZQACCEPT2"] }),
      q("e", "error", { prompt: "Find it.", steps: [{ id: "s1", text: "step one" }, { id: "s2", text: "step two" }], errorStep: "s2", fixOptions: [{ id: "f1", text: "fix one" }, { id: "f2", text: "fix two" }], fixAnswer: "f1", explanation: "ZQEXPL-e" }),
      { id: "n1", type: "note", text: "ZQNOTE-block" },
      { id: "au", type: "audio", label: "Hear", say: "ZQSCRIPT read this" },
    ],
  });
}
