// The Family Guide for one BCPSS unit (and the chooser's unit list). Authored bilingual content
// (db/seeds/bcpss/v2/family/<unitId>.mjs) is joined with the unit's Language Studio essentials; a unit
// without an authored family block gets a derived bilingual guide, never an empty page.
// Curriculum data only, no student data. Pure and deterministic.

import * as seed from "../../../data/bcpss-curriculum-seed.mjs";
import { FAMILY_LOADERS } from "../../../db/seeds/bcpss/v2/index.mjs";
import { provenanceOf } from "../../../shared/bcpss-provenance.js";
import { fallbackFamily } from "./family-fallback.js";
import { loadLessons } from "./lessons.js";
import { loadFamily, loadStudio } from "./studio.js";

const UNITS = seed.BCPSS_UNITS || [];
const UNIT_BY_ID = new Map(UNITS.map((u) => [u.id, u]));
const CONN_BY_UNIT = new Map((seed.UNIT_CONNECTIONS || []).map((c) => [c.unit_id, c]));
const CARD_BY_UNIT = new Map(
  (seed.FAMILY_CARDS || []).map((c) => [c.unit_id, c.translations_json || {}]),
);

/** Activity kinds a child can play at home in the Language Studio family mode, in order of preference. */
const FAMILY_PLAY_KINDS = [
  "match",
  "word_sort",
  "clue_game",
  "cloze",
  "unscramble",
  "quiz",
  "sequence",
  "talk_cards",
];
const MAX_PLAY = 4;
const LABS = ["words", "speak"];

const brief = (u) => ({ id: u.id, unit_number: u.unit_number, title: u.unit_title });

function neighbours(unit) {
  const siblings = UNITS.filter((u) => u.grade === unit.grade && u.subject === unit.subject).sort(
    (a, b) => a.unit_number - b.unit_number,
  );
  const i = siblings.findIndex((u) => u.id === unit.id);
  return {
    prev: i > 0 ? brief(siblings[i - 1]) : null,
    next: i >= 0 && i < siblings.length - 1 ? brief(siblings[i + 1]) : null,
    total: siblings.length,
  };
}

/** Card summaries open with "In class, we are practicing ..." boilerplate; keep the family-facing sentences. */
function cardSummary(unitId, lang, fallback) {
  const text = CARD_BY_UNIT.get(unitId)?.[lang]?.summary;
  if (!text) return fallback;
  const kept = text.split(/(?<=[.!?])\s+/).filter((s) => !/^(In class|En clase)\b/.test(s));
  return (
    kept
      .join(" ")
      .replace(/^In [^,]+, your child/, "Your child")
      .replace(/^En [^,]+, su hijo\/a/, "Su hijo o hija")
      .replace(/hijo\/a/g, "hijo o hija") || fallback
  );
}

function playList(unitId, studio) {
  const acts = studio?.activities || [];
  const picked = [];
  for (const kind of FAMILY_PLAY_KINDS) {
    const i = acts.findIndex((a) => a.kind === kind);
    if (i >= 0 && picked.length < MAX_PLAY) picked.push(i);
  }
  return picked
    .sort((a, b) => a - b)
    .map((i) => ({
      n: i + 1,
      kind: acts[i].kind,
      title: acts[i].title,
      minutes: acts[i].minutes,
      mission: acts[i].mission,
      url: `/bcpss-teachers/language-studio/?unit=${encodeURIComponent(unitId)}&mode=family&a=${i + 1}`,
    }));
}

function vocabList(studio, family, connVocab) {
  if (!studio?.vocab) {
    return connVocab.map((v) => ({
      term: v.term,
      es: v.cognate_es || null,
      icon: null,
      cognate: Boolean(v.cognate_es),
      es_note: v.cognate_hint || null,
      def: { en: v.student_friendly_def || v.kid_def || "", es: null },
      example: { en: "", es: "" },
    }));
  }
  return studio.vocab.map((v, i) => {
    const f = family?.vocab?.[i];
    return {
      term: v.term,
      es: v.es || null,
      icon: v.icon || null,
      cognate: /^cognate/i.test(v.es_note || ""),
      es_note: v.es_note || null,
      def: { en: v.def, es: f?.def_es || null },
      example: { en: v.example, es: f?.example_es || null },
    };
  });
}

export async function buildFamilyGuide(unitId) {
  const unit = UNIT_BY_ID.get(String(unitId));
  if (!unit) return null;
  const [studio, authoredFamily] = await Promise.all([loadStudio(unit.id), loadFamily(unit.id)]);
  const conn = CONN_BY_UNIT.get(unit.id);
  const vocab = vocabList(studio, authoredFamily, conn?.tier2_tier3_vocab || []);
  const base = authoredFamily
    ? authoredFamily
    : fallbackFamily({
        words: vocab.map((v) => v.term),
        cognates: vocab.filter((v) => v.es).map((v) => `${v.term} / ${v.es}`),
        frame: studio?.frames?.l3_4?.[0] || conn?.unit_example_frame || "",
      });
  const summary = authoredFamily?.summary || {
    en: cardSummary(unit.id, "en", unit.unit_summary),
    es: cardSummary(unit.id, "es", unit.unit_summary),
  };
  return {
    unit: {
      id: unit.id,
      grade: unit.grade,
      subject: unit.subject,
      unit_number: unit.unit_number,
      title: unit.unit_title,
      curriculum: unit.curriculum_name,
    },
    authored: Boolean(authoredFamily),
    // Same derivation as the unit detail: the family plan carries the draft notice until a person reviews the lessons.
    provenance: provenanceOf(await loadLessons(unit.id)),
    summary,
    can_do: studio?.can_do || null,
    goals: authoredFamily?.goals || null,
    vocab,
    talk: base.talk,
    try_at_home: base.try_at_home,
    say_it: base.say_it,
    help: base.help,
    home_language: base.home_language,
    celebrate: base.celebrate,
    play: playList(unit.id, studio),
    labs: studio
      ? []
      : LABS.map((key) => ({
          key,
          url: `/access-practice-lab/${key === "words" ? "wordlab" : "speak"}?bcpssUnit=${encodeURIComponent(unit.id)}`,
        })),
    neighbours: neighbours(unit),
    downloads: {
      pdf: `/api/bcpss/export/${encodeURIComponent(unit.id)}?format=pdf&part=family`,
      docx: `/api/bcpss/export/${encodeURIComponent(unit.id)}?format=docx&part=family`,
    },
  };
}

/** Chooser rows for one grade and subject: one bilingual line per unit. */
export async function buildFamilyDirectory(grade, subject) {
  const units = UNITS.filter(
    (u) => String(u.grade) === String(grade) && u.subject === subject,
  ).sort((a, b) => a.unit_number - b.unit_number);
  return Promise.all(
    units.map(async (u) => {
      const family = FAMILY_LOADERS[u.id] ? await loadFamily(u.id) : null;
      const first = (text) => String(text || "").split(/(?<=[.!?])\s+/)[0];
      return {
        id: u.id,
        unit_number: u.unit_number,
        title: u.unit_title,
        authored: Boolean(family),
        summary: {
          en: first(family?.summary?.en || cardSummary(u.id, "en", u.unit_summary)),
          es: first(family?.summary?.es || cardSummary(u.id, "es", u.unit_summary)),
        },
      };
    }),
  );
}
