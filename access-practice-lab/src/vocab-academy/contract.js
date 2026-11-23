// Vocabulary Academy — shared constants. LEAD-OWNED: import from here, never copy a value.
// Spec: docs/vocab-academy/SPEC.md

export const VA_KEY = "accessPracticeLab:v1:vocabAcademy";
export const VA_ROUTE = "vocabulary-academy";
export const CONTENT_BASE = "/access-practice-lab/content/vocab-academy";

/** Grade ids in curriculum order. */
export const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
/** Planned units per grade and target words per unit (docs/vocab-academy/SPEC.md §3.1). */
export const PLAN = {
  K: { units: 12, words: 5 },
  1: { units: 12, words: 6 },
  2: { units: 15, words: 8 },
  3: { units: 18, words: 10 },
  4: { units: 20, words: 10 },
  5: { units: 20, words: 10 },
  6: { units: 20, words: 10 },
  7: { units: 20, words: 10 },
  8: { units: 20, words: 10 },
  9: { units: 20, words: 10 },
  10: { units: 20, words: 10 },
  11: { units: 20, words: 10 },
  12: { units: 20, words: 10 },
};
/** Visual / interaction band for a grade: drives art direction and response modes. */
export const bandOfGrade = (g) =>
  g === "K" || g === "1" || g === "2"
    ? "early"
    : ["3", "4", "5"].includes(String(g))
      ? "upper-elem"
      : ["6", "7", "8"].includes(String(g))
        ? "middle"
        : "high";
/** The lab's own band ids (src/bands.js) for a Vocabulary Academy grade. */
export const labBandOfGrade = (g) =>
  g === "K"
    ? "K"
    : g === "1"
      ? "1"
      : g === "2"
        ? "2-3"
        : ["3", "4", "5"].includes(String(g))
          ? "3-5"
          : "6-8";

/** Published units are "g6-u01"; a teacher's custom unit (src/vocab-academy/educator/custom.js) keeps its own "cu.<slug>" id. */
export const unitId = (grade, n) =>
  /^cu\.[a-z0-9-]+$/.test(String(n)) ? String(n) : `g${grade}-u${String(n).padStart(2, "0")}`;
export const unitFile = (grade, n) =>
  `${CONTENT_BASE}/g${grade}/u${String(n).padStart(2, "0")}.json`;
export const wordSlug = (hw) =>
  String(hw)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
export const wordIdOf = (hw, pos, nth = 1) =>
  `va.${wordSlug(hw)}.${pos}${nth > 1 ? `.${nth}` : ""}`;

export const POS = ["n", "v", "adj", "adv", "prep", "conj", "pron", "phr"];
export const TIERS = ["general", "tier2", "tier3"];
export const CATS = [
  "multiple-meaning",
  "morph-productive",
  "function",
  "abstract",
  "figurative",
  "confusable",
  "word-family",
];
export const STRANDS = ["thematic", "morphology", "disciplinary", "literary", "rhetoric"];
export const GENRES = [
  "narrative",
  "informational",
  "dialogue",
  "argument",
  "science",
  "history",
  "biography",
  "description",
  "poem",
];
export const Q_SKILLS = ["word-meaning", "context", "inference", "evidence", "main-idea"];
export const STUDY_FOCI = ["prefix", "suffix", "root", "family", "compound", "none"];

/**
 * The eight sections of every lesson, in the order of a Wordly Wise-style lesson: the word list, Exercises A to F, and
 * the lesson review. `id` is the stable key stored in progress (a–h); `code` is the exercise letter a learner sees
 * ("6A" in lesson 6), empty for the word list and the review.
 */
export const LESSONS = [
  { id: "a", code: "", en: "Word List", es: "Lista de palabras" },
  { id: "b", code: "A", en: "Finding Meanings", es: "Encontrar los significados" },
  { id: "c", code: "B", en: "Just the Right Word", es: "La palabra justa" },
  { id: "d", code: "C", en: "Applying Meanings", es: "Aplicar los significados" },
  { id: "e", code: "D", en: "Word Study", es: "Estudio de palabras" },
  { id: "f", code: "E", en: "Reading Passage", es: "La lectura" },
  { id: "g", code: "F", en: "Using the Words", es: "Usar las palabras" },
  { id: "h", code: "", en: "Lesson Review", es: "Repaso de la lección" },
];

/** A section's full name in lesson `n`: ["Exercise 6A: Finding Meanings", "Ejercicio 6A: …"], or ["Word List", …]. */
export function sectionTitle(letter, n = "") {
  const l = LESSONS.find((x) => x.id === letter);
  if (!l) return ["", ""];
  if (!l.code) return [l.en, l.es];
  const num = typeof n === "number" || /^\d+$/.test(String(n)) ? String(n) : "";
  return [`Exercise ${num}${l.code}: ${l.en}`, `Ejercicio ${num}${l.code}: ${l.es}`];
}

// ── learning model ──────────────────────────────────────────────────────────
export const DIMS = ["rec", "mean", "ctx", "morph", "prod", "delay"];
export const DIM_LABEL = {
  rec: ["Recognition", "Reconocimiento"],
  mean: ["Meaning", "Significado"],
  ctx: ["In context", "En contexto"],
  morph: ["Word parts", "Partes de la palabra"],
  prod: ["Using it", "Usarla"],
  delay: ["Remembering later", "Recordar después"],
};
export const STATES = ["new", "learning", "developing", "applying", "secure", "review-needed"];
export const STATE_LABEL = {
  new: ["New", "Nueva"],
  learning: ["Learning", "Aprendiendo"],
  developing: ["Developing", "En desarrollo"],
  applying: ["Applying", "Aplicando"],
  secure: ["Secure", "Segura"],
  "review-needed": ["Review needed", "Necesita repaso"],
};
export const INTERVAL_DAYS = [1, 3, 7, 14, 30, 60];
export const REVIEW_PER_DAY = { min: 3, max: 20, default: 8 };

// ── supports (WIDA-informed; flags only — SPEC §5) ──────────────────────────
export const SUPPORT_KEYS = [
  "picture",
  "audio",
  "glossaryEs",
  "frames",
  "wordBank",
  "model",
  "chunked",
  "rehearsal",
  "starters",
  "organizer",
  "readAloud",
  "anyLanguageResponse",
];
export const SUPPORT_DOMAINS = ["listening", "speaking", "reading", "writing"];
export const emptySupports = () => ({
  ...Object.fromEntries(SUPPORT_KEYS.map((k) => [k, false])),
  fade: 0,
});
/** Supports that count a correct answer at half weight toward advancing a word's state. */
export const HEAVY_SUPPORTS = ["wordBank", "model", "readAloud", "chunked"];

export const GAME_IDS = [
  "word-quest",
  "context-detective",
  "word-builder",
  "meaning-match",
  "word-sort",
  "vocab-arena",
  "sentence-lab",
  "word-connections",
  "reading-mystery",
  "word-mastery",
];
export const PRINT_KINDS = [
  "workbook",
  "teacher",
  "review",
  "assessment",
  "assessment-key",
  "words",
];

export const DISCLAIMER = {
  en: "Practice for vocabulary growth. It is not an official WIDA or ACCESS score and does not predict one.",
  es: "Práctica para crecer en vocabulario. No es un puntaje oficial de WIDA ni de ACCESS y no lo predice.",
};

/** Scope decision (Joel, 2026-11-20: "don't do 9-12, just do the k-8"): grades 9–12 are NOT authored in this release.
 *  Completeness checks, the index and every grade picker use SHIPPED_GRADES; GRADES/PLAN keep the 9–12 plan for later. */
export const SHIPPED_GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8"];
