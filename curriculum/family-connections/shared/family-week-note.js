/* =============================================================================
 * shared/family-week-note.js — write the weekly note to families, in English
 * and Spanish, from the lessons that are actually posted this week.
 * -----------------------------------------------------------------------------
 * NOTHING HERE IS TRANSLATED. Every Spanish string is either a frame authored
 * in Spanish below or a phrase copied verbatim from `data/family-week-notes.json`,
 * which projects the curated bilingual family-homework notes and the curated
 * bilingual lesson vocabulary. Machine-translating an objective is exactly the
 * Spanglish that made ESOL parents stop reading these notes.
 *
 * THE PARALLEL RULE
 *   The two lanes say the same thing or neither says it. When a lesson has no
 *   Spanish big idea, the big-idea sentence is dropped from BOTH lanes rather
 *   than leaving English sitting in the Spanish column.
 *
 * Pure functions — no DOM, no fetch.
 * ========================================================================== */

/** The published `week.note` field is capped at 500 characters. */
export const NOTE_LIMIT = 500;
const MAX_TERMS = 4;

const FRAMES = Object.freeze({
  en: {
    opening: (terms) => `This week in math we are working with ${terms}.`,
    openingNoTerms: "This week in math we are continuing our current unit.",
    closing: "Ask your student to show you one example and explain their thinking.",
    join: (items) =>
      items.length < 3
        ? items.join(" and ")
        : `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`,
  },
  es: {
    opening: (terms) => `Esta semana en matemáticas estamos trabajando con ${terms}.`,
    openingNoTerms: "Esta semana en matemáticas seguimos con la unidad actual.",
    closing: "Pídale a su estudiante que le muestre un ejemplo y explique su razonamiento.",
    join: (items) =>
      items.length < 3 ? items.join(" y ") : `${items.slice(0, -1).join(", ")} y ${items.at(-1)}`,
  },
});

/* Vocabulary is stored title-cased for cards ("Ratio Tables"); inside a sentence
 * that reads like a shout. Acronyms keep their capitals. */
function inSentence(term) {
  const hasAcronym = term.split(/\s+/).some((word) => word.length > 1 && word === word.toUpperCase());
  return hasAcronym ? term : term.toLowerCase();
}

/** Distinct lesson ids for the posted lesson days, in calendar order. */
export function weekLessonIds(weekDays) {
  const ids = [];
  for (const entry of weekDays ?? []) {
    if (entry?.status !== "lesson") continue;
    const id = String(entry.lessonId ?? "").trim();
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

/* A flagship lesson is the same mathematics as its base lesson, and the curated
 * notes are filed under the base id. */
const bankEntry = (bank, lessonId) =>
  bank?.lessons?.[lessonId] ?? bank?.lessons?.[lessonId.replace(/-flagship$/, "")] ?? null;

function weekVocabulary(entries) {
  const seen = new Set();
  const terms = [];
  /* One term per lesson first, so a five-lesson week is not described entirely
   * by Monday's vocabulary. */
  for (let round = 0; round < MAX_TERMS; round += 1) {
    for (const entry of entries) {
      const term = entry?.vocabulary?.[round];
      if (!term) continue;
      const key = term.en.toLowerCase().replace(/s$/, "");
      if (seen.has(key)) continue;
      seen.add(key);
      terms.push(term);
      if (terms.length === MAX_TERMS) return terms;
    }
  }
  return terms;
}

function compose(lang, terms, bigIdea) {
  const frame = FRAMES[lang];
  const opening = terms.length
    ? frame.opening(frame.join(terms.map((term) => inSentence(term[lang]))))
    : frame.openingNoTerms;
  return [opening, bigIdea?.[lang], frame.closing].filter(Boolean).join(" ");
}

/**
 * Build both lanes of the weekly family note.
 *
 * @param {{status: string, lessonId: string}[]} weekDays the section's week days
 * @param {{lessons: Record<string, any>}} bank data/family-week-notes.json
 * @returns {{en: string, es: string, lessonIds: string[], usedBigIdea: string,
 *            missing: string[]}} `missing` lists posted lessons the bank has no
 *            curated bilingual material for.
 */
export function buildFamilyWeekNote(weekDays, bank) {
  const lessonIds = weekLessonIds(weekDays);
  const missing = lessonIds.filter((id) => !bankEntry(bank, id));
  const entries = lessonIds.map((id) => bankEntry(bank, id)).filter(Boolean);
  if (!entries.length) return { en: "", es: "", lessonIds, usedBigIdea: "", missing };

  const terms = weekVocabulary(entries);
  const anchorIndex = entries.findIndex((entry) => entry.bigIdea?.en && entry.bigIdea?.es);
  const anchor = anchorIndex >= 0 ? entries[anchorIndex] : null;
  const usedBigIdea = anchor ? lessonIds[anchorIndex] : "";

  let en = compose("en", terms, anchor?.bigIdea);
  let es = compose("es", terms, anchor?.bigIdea);
  /* Over the limit, the big idea goes from BOTH lanes — a note that keeps the
   * English explanation and drops the Spanish one is the failure this whole
   * module exists to prevent. */
  if (en.length > NOTE_LIMIT || es.length > NOTE_LIMIT) {
    en = compose("en", terms, null);
    es = compose("es", terms, null);
    return { en, es, lessonIds, usedBigIdea: "", missing };
  }
  return { en, es, lessonIds, usedBigIdea, missing };
}
