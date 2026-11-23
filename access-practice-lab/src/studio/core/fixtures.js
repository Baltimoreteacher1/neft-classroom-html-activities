// Real, valid activities used by the tests of every renderer and as the "try a sample" in the studio.
// `allFormats()` has exactly one question of each of the 15 formats, with answers that check out.

import { normalizeActivity } from "./schema.js";

const PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export const ALL_FORMAT_BLOCKS = [
  { id: "t1", type: "text", role: "directions", text: "Read each question. Answer, then check." },
  {
    id: "p1",
    type: "passage",
    title: "The Garden",
    text: "Mia plants seeds in the spring. The seeds need water and sun. In summer the plants grow tall.",
  },
  {
    id: "v1",
    type: "vocab",
    items: [
      {
        id: "v1",
        term: "ratio",
        def: "A comparison of two amounts.",
        es: "razón",
        example: "The ratio of cats to dogs is 2 to 3.",
      },
    ],
  },
  {
    id: "q-choice",
    type: "question",
    format: "choice",
    prompt: "What do seeds need?",
    options: [
      { id: "a", text: "Water and sun" },
      { id: "b", text: "Only snow" },
      { id: "c", text: "Plastic" },
    ],
    answer: "a",
    hint: "Read the second sentence.",
    explanation: "The passage says seeds need water and sun.",
  },
  {
    id: "q-multi",
    type: "question",
    format: "multi",
    prompt: "Select all fractions equal to {1/2}.",
    options: [
      { id: "a", text: "{2/4}" },
      { id: "b", text: "{3/4}" },
      { id: "c", text: "{4/8}" },
    ],
    answers: ["a", "c"],
    hint: "Multiply top and bottom by the same number.",
    explanation: "{2/4} and {4/8} both simplify to {1/2}.",
  },
  {
    id: "q-match",
    type: "question",
    format: "match",
    prompt: "Match each word to its meaning.",
    pairs: [
      { id: "p1", left: "ratio", right: "compares two amounts" },
      { id: "p2", left: "rate", right: "ratio with different units" },
      { id: "p3", left: "unit rate", right: "amount for one unit" },
    ],
    hint: "Think about units.",
    explanation: "Each word names a kind of comparison.",
  },
  {
    id: "q-sort",
    type: "question",
    format: "sort",
    prompt: "Sort the numbers.",
    categories: [
      { id: "even", label: "Even" },
      { id: "odd", label: "Odd" },
    ],
    items: [
      { id: "i1", text: "4", category: "even" },
      { id: "i2", text: "7", category: "odd" },
      { id: "i3", text: "12", category: "even" },
      { id: "i4", text: "9", category: "odd" },
    ],
    hint: "Even numbers end in 0, 2, 4, 6, 8.",
    explanation: "Even numbers divide by 2 with nothing left.",
  },
  {
    id: "q-order",
    type: "question",
    format: "order",
    prompt: "Put the steps in order.",
    items: [
      { id: "s1", text: "Plant the seed" },
      { id: "s2", text: "Water the seed" },
      { id: "s3", text: "The plant grows" },
    ],
    hint: "What happens first?",
    explanation: "Planting comes before growing.",
  },
  {
    id: "q-blank",
    type: "question",
    format: "blank",
    prompt: "Complete the sentence.",
    text: "A [[ratio]] compares two amounts, like [[2]] to 3.",
    hint: "Look at the vocabulary.",
    explanation: "A ratio compares two amounts.",
  },
  {
    id: "q-number",
    type: "question",
    format: "number",
    prompt: "What is {1/2} + {1/4}?",
    answer: "3/4",
    expr: "1/2+1/4",
    accept: ["0.75"],
    hint: "Use a common denominator.",
    explanation: "{1/2} = {2/4}, so {2/4} + {1/4} = {3/4}.",
  },
  {
    id: "q-short",
    type: "question",
    format: "short",
    kind: "explain",
    prompt: "Explain why seeds need water.",
    sample: "Seeds need water to start growing.",
    rubric: ["Names water", "Gives a reason"],
    frame: "Seeds need ___ because ___.",
    minWords: 3,
  },
  {
    id: "q-identify",
    type: "question",
    format: "identify",
    prompt: "Click the words that name a season.",
    text: "Mia plants in the [[spring]]. Plants grow in [[summer]]. It is cold in winter.",
    hint: "Seasons are parts of the year.",
    explanation: "Spring and summer are seasons named in the text. (Winter is not marked here.)",
  },
  {
    id: "q-hotspot",
    type: "question",
    format: "hotspot",
    prompt: "Click the seed.",
    image: { src: PIXEL, alt: "A garden with a seed and a flower" },
    regions: [
      { id: "seed", label: "The seed", x: 5, y: 60, w: 30, h: 30 },
      { id: "flower", label: "The flower", x: 55, y: 10, w: 35, h: 40 },
    ],
    answer: "seed",
    hint: "It is under the soil.",
    explanation: "The seed is below the ground.",
  },
  {
    id: "q-line",
    type: "question",
    format: "numberline",
    prompt: "Place {3/4} on the number line.",
    min: 0,
    max: 1,
    step: 0.25,
    answer: "3/4",
    hint: "Split 0 to 1 into four parts.",
    explanation: "{3/4} is three of four equal parts.",
  },
  {
    id: "q-build",
    type: "question",
    format: "build",
    prompt: "Build the sentence.",
    words: ["Plants", "need", "water"],
    accept: [],
    hint: "Start with who or what.",
    explanation: "A sentence names a subject, then what it does.",
  },
  {
    id: "q-error",
    type: "question",
    format: "error",
    prompt: "Find the mistake.",
    steps: [
      { id: "e1", text: "2 + 3 × 4" },
      { id: "e2", text: "= 5 × 4" },
      { id: "e3", text: "= 20" },
    ],
    errorStep: "e2",
    fixOptions: [
      { id: "f1", text: "Multiply first: 3 × 4 = 12" },
      { id: "f2", text: "Add last" },
    ],
    fixAnswer: "f1",
    hint: "Which operation goes first?",
    explanation: "Multiplication comes before addition: 2 + 12 = 14.",
  },
  {
    id: "q-table",
    type: "question",
    format: "fillTable",
    prompt: "Complete the ratio table.",
    headers: ["Cups of flour", "Cookies"],
    rows: [
      ["1", "12"],
      ["2", { answer: "24" }],
      ["3", { answer: "36" }],
    ],
    hint: "Each cup makes 12 cookies.",
    explanation: "Multiply cups by 12.",
  },
  {
    id: "q-plot",
    type: "question",
    format: "plot",
    prompt: "Plot the point (2, 3).",
    min: 0,
    max: 5,
    points: [{ x: 2, y: 3 }],
    hint: "Go right 2, then up 3.",
    explanation: "The point is at x = 2, y = 3.",
  },
  { id: "n1", type: "note", text: "Watch for students who add instead of multiply." },
];

/** One of every format. Valid for every kind. */
export function allFormats(kind = "interactive", extra = {}) {
  return normalizeActivity({
    id: "sample-all",
    title: "All question types",
    kind,
    context: { grade: "6", subject: "Math", source: { origin: "teacher" } },
    supports: { spanish: true, readAloud: true, frames: true, hints: true },
    blocks: ALL_FORMAT_BLOCKS,
    ...extra,
  });
}

/** A short vocabulary matching set a teacher might start with. */
export function vocabSample() {
  return normalizeActivity({
    id: "sample-vocab",
    title: "Ecosystem Words",
    kind: "interactive",
    template: "match-sort",
    context: { grade: "3", subject: "Science", source: { origin: "teacher" } },
    blocks: [
      {
        type: "vocab",
        items: [
          { term: "habitat", def: "the place where an animal lives" },
          { term: "predator", def: "an animal that hunts other animals" },
          { term: "producer", def: "a living thing that makes its own food" },
        ],
      },
      {
        type: "question",
        format: "match",
        prompt: "Match each word to its meaning.",
        pairs: [
          { left: "habitat", right: "the place where an animal lives" },
          { left: "predator", right: "an animal that hunts other animals" },
          { left: "producer", right: "a living thing that makes its own food" },
        ],
        hint: "Read each meaning slowly.",
        explanation: "Each word names a part of an ecosystem.",
      },
    ],
  });
}
