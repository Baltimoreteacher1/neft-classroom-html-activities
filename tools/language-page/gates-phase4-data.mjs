// Phase 4 data gates (F-09, F-11, F-12, F-14, F-16): G-41 lesson-vocab-coverage, G-42 reading-band-readability,
// G-43 tier-rubric-candidates, G-44 materials-classification, G-45 transfer-candidates.
// Same contract as the other gate files: run({data}) -> {errors, info}; controls() must each produce errors.
import fs from "node:fs";
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
import { buildCandidates, buildWordFrequency, RUBRIC, tierSnapshot } from "./tier-rubric.mjs";

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

// ── G-43 ──────────────────────────────────────────────────────────────────────
const DATA_DIR = new URL("../../data/language-page/", import.meta.url);
const readJson = (name) => JSON.parse(fs.readFileSync(new URL(name, DATA_DIR), "utf8"));

/**
 * Pure check of the three shipped tier artifacts against the live units:
 * the frequency list is fresh, the candidates are exactly what the rubric yields from that list, every
 * candidate obeys the rubric on its own evidence, and no tier differs from the baseline unless approved.
 */
export function checkTierArtifacts({ units, list, cands, baseline }) {
  const errors = [];
  const fresh = buildWordFrequency(units);
  if (JSON.stringify(fresh) !== JSON.stringify(list))
    errors.push("word-frequency.json is stale: rebuild with node tools/build-tier-candidates.mjs");
  const expected = buildCandidates(list, units);
  if (JSON.stringify(expected.candidates) !== JSON.stringify(cands.candidates))
    errors.push("tier-candidates.json differs from what the rubric yields from the shipped list");
  if (JSON.stringify(expected.counts) !== JSON.stringify(cands.counts))
    errors.push("tier-candidates.json counts differ from the rubric result");
  const rows = new Map(
    units.flatMap((d) =>
      d.connections[0].tier2_tier3_vocab.map((v) => [`${d.unit.id}|${v.term}`, v.tier]),
    ),
  );
  for (const c of cands.candidates) {
    const e = c.evidence;
    const need =
      e.task_units >= RUBRIC.needTaskUnits || e.taught_subjects >= RUBRIC.needTaughtSubjects;
    const general = e.subjects_elsewhere >= RUBRIC.crossDomainSubjects && need;
    const specific = e.taught_subjects === 1 && e.subjects_elsewhere <= RUBRIC.specificMaxSubjects;
    if (c.suggested_tier === 2 && !general)
      errors.push(`${c.term}: suggested Tier 2 but the evidence is not general`);
    if (c.suggested_tier === 3 && (general || !specific))
      errors.push(`${c.term}: suggested Tier 3 but the evidence is not domain-specific`);
    if (![2, 3].includes(c.suggested_tier)) errors.push(`${c.term}: suggested tier must be 2 or 3`);
    if (c.status !== "candidate")
      errors.push(`${c.term}: status "${c.status}" (candidates are never applied here)`);
    if (c.suggested_tier === 3 && c.confidence !== "low")
      errors.push(`${c.term}: Tier 3 suggestions are low confidence`);
    if (!c.units.length) errors.push(`${c.term}: no units listed`);
    for (const u of c.units) {
      const tier =
        rows.get(`${u.unit}|${c.term}`) ??
        rows.get(
          `${u.unit}|${[...rows.keys()].map((k) => k.split("|")[1]).find((t) => t.toLowerCase() === c.term.toLowerCase())}`,
        );
      if (tier === undefined) errors.push(`${c.term}: ${u.unit} has no such term`);
      else if (tier !== u.current)
        errors.push(`${c.term}: ${u.unit} current tier ${tier} != ${u.current}`);
    }
  }
  const approved = new Set((baseline.approved || []).map((a) => `${a.unit}|${a.term}`));
  const live = tierSnapshot(units);
  for (const [unit, terms] of Object.entries(live))
    for (const [term, tier] of Object.entries(terms))
      if (baseline.tiers[unit]?.[term] !== tier && !approved.has(`${unit}|${term}`))
        errors.push(
          `${unit}/${term}: tier ${baseline.tiers[unit]?.[term]} -> ${tier} without an approval`,
        );
  for (const [unit, terms] of Object.entries(baseline.tiers))
    for (const term of Object.keys(terms))
      if (live[unit]?.[term] === undefined)
        errors.push(`${unit}/${term}: baseline term no longer in the data`);
  return errors;
}

export const g43 = {
  id: "G-43",
  name: "tier-rubric-candidates",
  async run({ data }) {
    const list = readJson("word-frequency.json");
    const cands = readJson("tier-candidates.json");
    const baseline = readJson("tier-baseline.json");
    const errors = checkTierArtifacts({ units: data.units, list, cands, baseline });
    const words = Object.keys(list.words).length;
    if (words < 0.9 * 3087) errors.push(`word list has ${words} words (baseline 3087, floor 90%)`);
    if (cands.candidates.length < 0.9 * 183)
      errors.push(`${cands.candidates.length} candidates (baseline 183, floor 90%)`);
    if (!list.meta.limits || !list.meta.source)
      errors.push("word list lacks its source/limits statement");
    return { errors, info: { words, candidates: cands.candidates.length, counts: cands.counts } };
  },
  async controls({ data }) {
    const units = data.units;
    const base = () => ({
      units,
      list: readJson("word-frequency.json"),
      cands: readJson("tier-candidates.json"),
      baseline: readJson("tier-baseline.json"),
    });
    const tamperedSuggestion = base();
    tamperedSuggestion.cands.candidates[0].suggested_tier =
      tamperedSuggestion.cands.candidates[0].suggested_tier === 2 ? 3 : 2;
    const wrongEvidence = base();
    const medium = wrongEvidence.cands.candidates.find((c) => c.suggested_tier === 2);
    medium.evidence.subjects_elsewhere = 1;
    const retiered = base();
    const live = clone(units);
    live[0].connections[0].tier2_tier3_vocab[0].tier =
      live[0].connections[0].tier2_tier3_vocab[0].tier === 2 ? 3 : 2;
    retiered.units = live;
    const staleList = base();
    delete staleList.list.words[Object.keys(staleList.list.words)[0]];
    return [
      {
        name: "candidate suggestion edited by hand",
        errors: checkTierArtifacts(tamperedSuggestion),
      },
      {
        name: "candidate evidence contradicts its tier",
        errors: checkTierArtifacts(wrongEvidence),
      },
      { name: "a tier silently changed in the data", errors: checkTierArtifacts(retiered) },
      { name: "frequency list out of date", errors: checkTierArtifacts(staleList) },
    ];
  },
};
