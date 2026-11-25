// Phase 4 data gates (F-09, F-11, F-12, F-14, F-16): G-41 lesson-vocab-coverage, G-42 reading-band-readability,
// G-43 tier-rubric-candidates, G-44 materials-classification, G-45 transfer-candidates.
// Same contract as the other gate files: run({data}) -> {errors, info}; controls() must each produce errors.
import { glossPairs } from "../../bcpss-teachers/language-studio/studio-lesson-extras.js";
import {
  HELPER_COGNATES,
  LESSON_HELPER_WORDS,
} from "../../db/seeds/bcpss/v2/lesson-helper-words.mjs";
import { loadLessons } from "../../functions/_lib/bcpss/lessons.js";
import {
  BAND_ORDER,
  monotonicProblems,
  readability,
} from "../../functions/_lib/bcpss/reading-readability.js";
import { clone } from "./dataset.mjs";

const fold = (s) => String(s).toLowerCase();

// ── G-41 ──────────────────────────────────────────────────────────────────────
/** Pure check: every lesson vocab entry is a unit card word or carries a valid helper card. */
export function checkLessonVocab(unitId, lessons, unitTerms, helperTerms = []) {
  const errors = [];
  const unit = new Set(unitTerms.map(fold));
  const used = new Set();
  for (const lesson of lessons)
    for (const v of lesson.vocab) {
      const key = fold(v.term);
      if (unit.has(key)) continue;
      used.add(key);
      const card = v.card;
      const id = `${unitId}/${lesson.id}/${v.term}`;
      if (!card) {
        errors.push(`${id}: not a unit word and has no helper card`);
        continue;
      }
      for (const f of ["def", "example", "es", "cognate"])
        if (!card[f] || typeof card[f] !== "string") errors.push(`${id}: card.${f} missing`);
      if (!HELPER_COGNATES.includes(card.cognate))
        errors.push(`${id}: bad cognate "${card.cognate}"`);
      if (card.review_status !== "machine")
        errors.push(`${id}: card must be labelled draft (machine)`);
      if (card.example && !fold(card.example).includes(key.split(" ")[0].slice(0, 4)))
        errors.push(`${id}: example does not use the word`);
      if (card.def && fold(card.def).includes(key))
        errors.push(`${id}: definition uses the word itself`);
    }
  for (const t of helperTerms)
    if (!used.has(fold(t))) errors.push(`${unitId}/${t}: helper card for a word no lesson uses`);
  return errors;
}

export const g41 = {
  id: "G-41",
  name: "lesson-vocab-coverage",
  async run({ data }) {
    const errors = [];
    let entries = 0;
    let helpers = 0;
    const authoredCardUnits = new Set(Object.keys(LESSON_HELPER_WORDS));
    for (const detail of data.units) {
      const id = detail.unit.id;
      const set = await loadLessons(id);
      const unitTerms = detail.studio.vocab.map((v) => v.term);
      entries += set.lessons.reduce((n, l) => n + l.vocab.length, 0);
      helpers += set.lessons.reduce((n, l) => n + l.vocab.filter((v) => v.card).length, 0);
      const helperTerms = (LESSON_HELPER_WORDS[id] || []).map((c) => c.term);
      errors.push(...checkLessonVocab(id, set.lessons, unitTerms, helperTerms));
      // The UI path: a lesson's Spanish help must include the helper words' glosses.
      for (const lesson of set.lessons) {
        const withCard = lesson.vocab.filter((v) => v.card);
        if (!withCard.length) continue;
        const pairs = glossPairs(detail.studio.vocab, lesson, { payload: {} });
        for (const v of withCard)
          if (!pairs.some((p) => fold(p.term) === fold(v.term)))
            errors.push(
              `${id}/${lesson.id}/${v.term}: helper gloss not offered by the lesson gloss list`,
            );
      }
    }
    for (const id of authoredCardUnits)
      if (!data.units.some((d) => d.unit.id === id))
        errors.push(`${id}: helper cards for an unknown unit`);
    if (helpers < 80) errors.push(`only ${helpers} helper-card lesson entries (baseline 88)`);
    return { errors, info: { lessonVocabEntries: entries, helperCardEntries: helpers } };
  },
  async controls() {
    const lesson = (vocab) => [{ id: "u-l01", vocab }];
    const ok = {
      def: "to look at two things",
      example: "We compare two prices.",
      es: "comparar",
      cognate: "true",
      review_status: "machine",
    };
    return [
      {
        name: "no card for a non-unit word",
        errors: checkLessonVocab("u", lesson([{ term: "compare" }]), ["ratio"]),
      },
      {
        name: "example without the word",
        errors: checkLessonVocab(
          "u",
          lesson([{ term: "compare", card: { ...ok, example: "We look at prices." } }]),
          ["ratio"],
        ),
      },
      {
        name: "card not labelled draft",
        errors: checkLessonVocab(
          "u",
          lesson([{ term: "compare", card: { ...ok, review_status: "human" } }]),
          ["ratio"],
        ),
      },
      {
        name: "orphan helper card",
        errors: checkLessonVocab("u", lesson([{ term: "ratio" }]), ["ratio"], ["compare"]),
      },
    ];
  },
};

// ── G-42 ──────────────────────────────────────────────────────────────────────
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

/** Pure check of one unit's reading: texts non-decreasing in FKGL and length, revisions labelled draft. */
export function checkReadingBands(unitId, reading) {
  const errors = monotonicProblems(reading?.texts).map((p) => `${unitId}: ${p}`);
  if (reading?.revision && reading.revision.status !== "draft")
    errors.push(`${unitId}: revised reading is not labelled draft`);
  return errors;
}

export const g42 = {
  id: "G-42",
  name: "reading-band-readability",
  async run({ data }) {
    const errors = [];
    const perBand = { "1_2": [], "3_4": [], "5_6": [] };
    let revised = 0;
    let measured = 0;
    for (const detail of data.units) {
      const reading = detail.reading;
      if (!reading) {
        errors.push(`${detail.unit.id}: no reading to measure`);
        continue;
      }
      measured += 1;
      if (reading.revision) revised += 1;
      errors.push(...checkReadingBands(detail.unit.id, reading));
      for (const band of BAND_ORDER) perBand[band].push(readability(reading.texts[band]).fkgl);
    }
    if (measured < 162) errors.push(`only ${measured} readings measured (expected 162)`);
    if (revised < 10)
      errors.push(`only ${revised} readings carry the draft revision label (expected 10)`);
    return {
      errors,
      info: {
        measured,
        revised,
        medianFkgl: Object.fromEntries(Object.entries(perBand).map(([k, v]) => [k, median(v)])),
      },
    };
  },
  async controls({ data }) {
    const fixture = (unitId) => clone(data.units.find((d) => d.unit.id === unitId).reading);
    const lengthFall = fixture("gk-math-u2");
    lengthFall.texts["3_4"] =
      "Sam has 6 blocks. Lia has 4 blocks. Sam has more. Omar has 6 blocks.";
    const swapped = fixture("g1-math-u6");
    [swapped.texts["1_2"], swapped.texts["5_6"]] = [swapped.texts["5_6"], swapped.texts["1_2"]];
    const harder = fixture("g7-ss-u1");
    harder.texts["3_4"] =
      "Maps show roads. Maps show homes. Maps help us plan. Cities grow. We need more roads. We need more water.";
    const unlabelled = fixture("gk-math-u2");
    unlabelled.revision = { status: "reviewed" };
    return [
      {
        name: "3_4 shorter than 1_2 (the original gk-math-u2 defect)",
        errors: checkReadingBands("fx", lengthFall),
      },
      { name: "bands in reverse order", errors: checkReadingBands("fx", swapped) },
      { name: "3_4 easier than 1_2 by FKGL", errors: checkReadingBands("fx", harder) },
      { name: "revision not labelled draft", errors: checkReadingBands("fx", unlabelled) },
    ];
  },
};
