// MathSense missions, written once in English (the text is the key into i18n-es-mathsense.js).
// kind: set (build it in the workspace), between (any amount strictly between two others), type (write a value in a
// stated form) or choose (pick one). `slips` name a specific, known mistake by its exact value; `hints` climb from
// "notice" to "try this", and none of them state the answer (content.test.mjs enforces that).
// `skill` is the nearest Fluency Lab skill the evidence is filed under.

import { MISSIONS_45 } from "./missions-45.js";
import { MISSIONS_6 } from "./missions-6.js";
import { MISSIONS_78 } from "./missions-78.js";

export const BANDS = Object.freeze([
  { id: "4-5", label: "Grades 4-5" },
  { id: "6", label: "Grade 6" },
  { id: "7-8", label: "Grades 7-8" },
]);

export const TOPICS = Object.freeze({
  equivalence: {
    name: "Equivalent fractions",
    explain:
      "Different pieces, same amount. In your own words, what stayed the same, and what changed?",
    frames: ["The amount stayed the same because ___.", "The pieces changed because ___."],
  },
  ordering: {
    name: "Ordering",
    explain: "How did you decide which amount is greater? Use the pictures in your sentence.",
    frames: ["I knew ___ was greater because ___.", "To compare, I changed everything into ___."],
  },
  benchmark: {
    name: "Benchmarks",
    explain: "Which benchmark helped you, and what did you notice about the pieces?",
    frames: ["The benchmark ___ helped because ___.", "It is close to ___ because ___."],
  },
  improper: {
    name: "Fractions greater than 1",
    explain:
      "How can a fraction be more than one whole? Say what the bar and the number line show.",
    frames: [
      "The fraction is more than 1 because ___.",
      "On the number line it is past ___ because ___.",
    ],
  },
  "percent-over-100": {
    name: "Percents over 100",
    explain:
      "What does a percent greater than 100% tell you about the amount compared with one whole?",
    frames: ["A percent over 100% means ___.", "On the percent bar it goes past ___ because ___."],
  },
  repeating: {
    name: "Repeating decimals",
    explain: "Why is a decimal that stops different from one that repeats? Use the word exactly.",
    frames: [
      "The digits ___ repeat, so ___.",
      "A decimal that stops is not exactly equal because ___.",
    ],
  },
  conversion: {
    name: "Fractions, decimals and percents",
    explain: "How are the fraction, decimal and percent for this amount connected?",
    frames: [
      "The fraction, decimal and percent all show ___.",
      "To change one into another I ___.",
    ],
  },
});

export const MISSIONS = Object.freeze([...MISSIONS_45, ...MISSIONS_6, ...MISSIONS_78]);

export const missionsFor = (band) => MISSIONS.filter((mission) => mission.band === band);
export const missionById = (id) => MISSIONS.find((mission) => mission.id === id) ?? null;

// Starting points for free exploration: each one makes a different relationship visible.
export const SCENARIOS = Object.freeze([
  { id: "quarter", label: "Three fourths", a: "3/4", parts: 4 },
  { id: "third", label: "One third, a repeating decimal", a: "1/3", parts: 3 },
  { id: "improper", label: "Seven fourths, more than one whole", a: "7/4", parts: 4 },
  { id: "over", label: "Five halves, 250%", a: "5/2", parts: 2 },
  { id: "eighth", label: "Three eighths", a: "3/8", parts: 8 },
  { id: "fifth", label: "Two fifths and its hundredths", a: "2/5", parts: 10 },
  { id: "twelve", label: "Five twelfths", a: "5/12", parts: 12 },
  {
    id: "pair",
    label: "Compare two thirds and three fourths",
    a: "2/3",
    b: "3/4",
    parts: 3,
    partsB: 4,
  },
]);
