// Builds data/content/word-frequency.json from this repo's own unit corpus (no network, no external list).
//   node tools/content/build-word-frequency.mjs           write the file
//   node tools/content/build-word-frequency.mjs --stdout   print instead of writing
// For every distinct word in the student-facing text of each unit: how many units contain it, and in how many of the four
// subjects. Words seen in fewer than two units are omitted (absence means "rare in this corpus").
import fs from "node:fs";
import { BCPSS_UNITS } from "../../data/bcpss-curriculum-seed.mjs";
import { loadLessons } from "../../functions/_lib/bcpss/lessons.js";
import { loadStudio } from "../../functions/_lib/bcpss/studio.js";
import { unitStudentText } from "./verifiers/lib/texts.mjs";
import { stemWord, wordsOf } from "./verifiers/lib/words.mjs";

const SUBJECT = { ela: "ela", math: "math", sci: "science", ss: "social-studies" };
const OUT = new URL("../../data/content/word-frequency.json", import.meta.url);

const docFreq = new Map();
const subjectSets = new Map();
let units = 0;
for (const u of BCPSS_UNITS) {
  const lessons = (await loadLessons(u.id))?.lessons || [];
  const text = unitStudentText({ studio: await loadStudio(u.id), lessons });
  const subject = SUBJECT[u.id.split("-")[1]];
  const seen = new Set(text.flatMap((t) => wordsOf(t).map(stemWord)));
  for (const w of seen) {
    docFreq.set(w, (docFreq.get(w) || 0) + 1);
    if (!subjectSets.has(w)) subjectSets.set(w, new Set());
    subjectSets.get(w).add(subject);
  }
  units += 1;
}
const words = {};
for (const w of [...docFreq.keys()].sort())
  if (docFreq.get(w) >= 2) words[w] = [docFreq.get(w), subjectSets.get(w).size];
const doc = {
  version: 1,
  source:
    "this repo's unit student text (studio + lessons), distinct words per unit; no external list",
  units,
  subjects: Object.values(SUBJECT),
  limits:
    "Counts reflect only this corpus: a word that is common in English but rare here looks domain-specific, and a word used in every subject here may still be technical. Words in fewer than 2 units are omitted. Candidate tiers are for human review.",
  fields: "word -> [unitDocFreq, subjectCount]",
  words,
};
const json = `${JSON.stringify(doc)}\n`;
if (process.argv.includes("--stdout")) process.stdout.write(json);
else fs.writeFileSync(OUT, json);
console.error(`word-frequency: ${units} units, ${Object.keys(words).length} words`);
