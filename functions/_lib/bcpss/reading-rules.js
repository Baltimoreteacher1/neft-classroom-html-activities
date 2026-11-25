// Schema + quality rules for BCPSS vocabulary readings (db/seeds/bcpss/readings/*.mjs).
// Shared by the regression test and by authors, so a passage that breaks a rule fails fast.

import { termRegex } from "../../../bcpss-teachers/bcpss-term-match.js";
import { monotonicProblems } from "./reading-readability.js";

export { termRegex };
export const READING_TIERS = ["1_2", "3_4", "5_6"];
export const READING_GENRES = [
  "informational",
  "explanatory",
  "narrative",
  "procedural",
  "biographical",
];
export const QUESTION_TYPES = ["detail", "vocab", "inference"];

/** [min, max] word counts per grade band and WIDA tier. */
const LIMITS = {
  early: { "1_2": [25, 55], "3_4": [40, 85], "5_6": [55, 120] },
  mid: { "1_2": [40, 75], "3_4": [80, 125], "5_6": [120, 180] },
  upper: { "1_2": [50, 90], "3_4": [100, 150], "5_6": [150, 220] },
};
const MAX_AVG_SENTENCE = {
  early: { "1_2": 9, "3_4": 12, "5_6": 17 },
  mid: { "1_2": 10, "3_4": 14, "5_6": 20 },
  upper: { "1_2": 11, "3_4": 16, "5_6": 24 },
};

export const bandOf = (grade) =>
  ["K", "1", "2"].includes(String(grade))
    ? "early"
    : ["3", "4", "5"].includes(String(grade))
      ? "mid"
      : "upper";
export const wordLimits = (grade) => LIMITS[bandOf(grade)];

export const countWords = (text) =>
  (String(text).match(/[A-Za-z0-9][A-Za-z0-9'’-]*/g) || []).length;
const sentencesOf = (text) =>
  String(text)
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
export function validateReading(reading, unit, vocabTerms) {
  const problems = [];
  const id = reading?.unit_id || "(missing unit_id)";
  const bad = (msg) => problems.push(`${id}: ${msg}`);
  if (!unit) return [`${id}: unknown unit`];
  if (typeof reading.title !== "string" || !reading.title.trim() || countWords(reading.title) > 9)
    bad("title missing or longer than 9 words");
  if (!READING_GENRES.includes(reading.genre))
    bad(`genre must be one of ${READING_GENRES.join(", ")}`);
  const limits = wordLimits(unit.grade);
  const avgCap = MAX_AVG_SENTENCE[bandOf(unit.grade)];
  for (const t of READING_TIERS) {
    const text = reading.texts?.[t];
    if (typeof text !== "string" || !text.trim()) {
      bad(`texts.${t} missing`);
      continue;
    }
    const n = countWords(text);
    if (n < limits[t][0] || n > limits[t][1])
      bad(`texts.${t} has ${n} words (allowed ${limits[t][0]}–${limits[t][1]})`);
    const avg = n / Math.max(1, sentencesOf(text).length);
    if (avg > avgCap[t])
      bad(`texts.${t} averages ${avg.toFixed(1)} words per sentence (max ${avgCap[t]})`);
    if (/[*#_`<>{}]|undefined|\{t/.test(text))
      bad(`texts.${t} contains markup or placeholder characters`);
    for (const term of vocabTerms)
      if (!termRegex(term).test(text)) bad(`texts.${t} never uses the vocabulary term “${term}”`);
  }
  for (const p of monotonicProblems(reading.texts)) bad(p);
  if (reading.revision && reading.revision.status !== "draft")
    bad('a revised reading must carry revision.status "draft" until a human reviews it');
  const qs = reading.questions;
  if (!Array.isArray(qs) || qs.length !== 3)
    bad("needs exactly 3 questions (detail, vocab, inference)");
  else {
    qs.forEach((q, i) => {
      if (q.type !== QUESTION_TYPES[i])
        bad(`question ${i + 1} type must be “${QUESTION_TYPES[i]}”`);
      if (typeof q.q !== "string" || q.q.trim().length < 8) bad(`question ${i + 1} text missing`);
      if (
        !Array.isArray(q.options) ||
        q.options.length !== 3 ||
        new Set(q.options.map((o) => String(o).toLowerCase())).size !== 3
      )
        bad(`question ${i + 1} needs 3 unique options`);
      if (![0, 1, 2].includes(q.answer)) bad(`question ${i + 1} answer must be 0, 1 or 2`);
      if (q.type === "vocab" && !vocabTerms.some((t) => termRegex(t).test(q.q)))
        bad("vocab question must name a unit term");
      for (const t of READING_TIERS) {
        const ev = q.evidence?.[t];
        if (typeof ev !== "string" || ev.trim().length < 6)
          bad(`question ${i + 1} evidence.${t} missing`);
        else if (
          !String(reading.texts?.[t] || "")
            .toLowerCase()
            .includes(ev.toLowerCase())
        )
          bad(`question ${i + 1} evidence.${t} is not a verbatim phrase of texts.${t}`);
      }
    });
  }
  return problems;
}
