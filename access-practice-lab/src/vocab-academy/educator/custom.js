// Vocabulary Academy — custom units (SPEC §3.2 subset, `custom: true`). Pure validation and building, plus storage
// through Core's store API (progress.custom, one record per unit id). No AI and no network: a pasted word that exists in
// the corpus is pre-filled from the validated corpus record; any other word needs a definition and an example written
// by the teacher, checked by the same rules the curriculum follows (the word appears in the example, the definition does
// not use the word or its family, no placeholders, no duplicates). A custom unit NEVER overwrites published curriculum:
// ids start with "cu." and corpus words are copied under new ids, so editing one never touches the original.
import { GRADES, POS, wordSlug } from "../contract.js";
import { loadProgress, saveProgress } from "../store.js";

export const CUSTOM_PREFIX = "cu.";
export const MAX_WORDS = 20;
const GLYPH_MAX = 3;
const DEF_WORDS_MAX = { early: 9, "upper-elem": 14, other: 22 };
const PLACEHOLDER =
  /\b(?:todo|tbd|lorem|ipsum)\b|\[[^\]]*\]|\.{3}|…|example sentence|your sentence here/i;

/** [English, Spanish] copy for each validation code (the UI shows these next to the field). */
export const ERROR_COPY = Object.freeze({
  "title-empty": ["Give the lesson a title.", "Dale un título a la lección."],
  "title-long": ["Keep the title under 60 characters.", "Usa un título de menos de 60 caracteres."],
  grade: ["Choose a grade.", "Elige un grado."],
  "words-none": ["Add at least one word.", "Agrega al menos una palabra."],
  "words-many": [
    `A lesson holds at most ${MAX_WORDS} words.`,
    `Una lección tiene como máximo ${MAX_WORDS} palabras.`,
  ],
  "hw-empty": ["Write the word.", "Escribe la palabra."],
  "hw-chars": [
    "Use letters, spaces, hyphens or apostrophes in the word.",
    "Usa letras, espacios, guiones o apóstrofos en la palabra.",
  ],
  pos: ["Choose the part of speech.", "Elige la parte de la oración."],
  "def-empty": [
    "Write a definition in your own words.",
    "Escribe una definición con tus propias palabras.",
  ],
  "def-has-word": [
    "The definition uses the word (or a word from its family). Explain it with simpler words.",
    "La definición usa la palabra (o una de su familia). Explícala con palabras más simples.",
  ],
  "def-placeholder": [
    "The definition still has placeholder text.",
    "La definición todavía tiene texto provisional.",
  ],
  "ex-empty": ["Write an example sentence.", "Escribe una oración de ejemplo."],
  "ex-missing-word": [
    "The example sentence must use the word.",
    "La oración de ejemplo debe usar la palabra.",
  ],
  "ex-placeholder": [
    "The example still has placeholder text.",
    "El ejemplo todavía tiene texto provisional.",
  ],
  "glyph-count": [
    `Use 1 to ${GLYPH_MAX} emoji for the picture.`,
    `Usa de 1 a ${GLYPH_MAX} emojis para la imagen.`,
  ],
  "glyph-alt": [
    "Describe the picture in a sentence so a screen reader can read it.",
    "Describe la imagen en una oración para que un lector de pantalla la lea.",
  ],
  dup: [
    "This word and part of speech are already in the lesson.",
    "Esta palabra y parte de la oración ya están en la lección.",
  ],
});
export const WARNING_COPY = Object.freeze({
  "def-long": [
    "This definition is longer than usual for the grade. Shorter is easier to learn.",
    "Esta definición es más larga de lo usual para el grado. Una más corta se aprende mejor.",
  ],
  "few-words": [
    "Most lessons teach 5 to 10 words.",
    "La mayoría de las lecciones enseñan de 5 a 10 palabras.",
  ],
  "in-corpus": [
    "This word is also taught in a published lesson. Your version is a separate copy.",
    "Esta palabra también se enseña en una lección publicada. Tu versión es una copia aparte.",
  ],
});

// ── word matching ─────────────────────────────────────────────────────────────
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Inflected surface forms of a headword: -s -es -ed -d -ing -ly -er -est, y→ies/ied, drop-e + ing, doubled final letter. */
export function surfaceForms(hw) {
  const w = String(hw).trim().toLowerCase();
  if (!w) return [];
  const forms = new Set([w]);
  for (const s of ["s", "es", "ed", "d", "ing", "ly", "er", "est"]) forms.add(w + s);
  if (w.endsWith("e")) for (const s of ["ing", "ed", "er", "est"]) forms.add(w.slice(0, -1) + s);
  if (/[^aeiou]y$/.test(w))
    for (const s of ["ies", "ied", "ier", "iest", "ily"]) forms.add(w.slice(0, -1) + s);
  if (/[^aeiou][aeiou][^aeiouwxy]$/.test(w))
    for (const s of ["ing", "ed", "er", "est"]) forms.add(w + w.at(-1) + s);
  return [...forms].sort((a, b) => b.length - a.length);
}
const surfaceRe = (hw, flags = "iu") =>
  new RegExp(
    `(?<![\\p{L}\\p{N}])(?:${surfaceForms(hw)
      .map((f) => esc(f).replace(/\s+/g, "\\s+"))
      .join("|")})(?![\\p{L}\\p{N}])`,
    flags,
  );
export const usesWord = (text, hw) => surfaceRe(hw).test(String(text || ""));
const FAMILY_SUFFIX =
  /(?:ious|ous|ful|less|ness|ment|tion|sion|ing|ed|ly|er|est|al|ive|ic|ity|y|s)$/;
/** The definition uses the headword, an inflection of it, or a word that begins with its stem (cautious → caution). */
export function defUsesFamily(def, hw) {
  if (usesWord(def, hw)) return true;
  const w = String(hw).trim().toLowerCase();
  if (/\s/.test(w)) return false;
  const stem = w.replace(FAMILY_SUFFIX, "");
  if (stem.length < 4) return false;
  return (
    String(def)
      .toLowerCase()
      .match(/[\p{L}]+/gu) || []
  ).some((t) => t.length >= stem.length && t.startsWith(stem));
}

const wordCountOf = (t) =>
  String(t || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
const bandKey = (g) =>
  ["K", "1", "2"].includes(String(g))
    ? "early"
    : ["3", "4", "5"].includes(String(g))
      ? "upper-elem"
      : "other";
/** A glyph is a short symbol, not letters or digits (emoji-scene cards are composed by the UI). */
export const glyphOk = (g) =>
  typeof g === "string" &&
  g.length > 0 &&
  g.length <= 12 &&
  !/[A-Za-z0-9]/.test(g) &&
  !/\s/.test(g);
/** "🧗 ⚠️" or "🧗,⚠️" → ["🧗","⚠️"] */
export const parseGlyphs = (text) =>
  String(text || "")
    .split(/[\s,]+/)
    .filter(Boolean);

/** Errors and warnings for one word draft: [{ code, field }]. */
export function validateWord(w, { grade = "6" } = {}) {
  const errors = [];
  const warnings = [];
  const hw = String(w.hw || "").trim();
  if (!hw) errors.push({ code: "hw-empty", field: "hw" });
  else if (!/^[\p{L}][\p{L}' -]{0,38}$/u.test(hw)) errors.push({ code: "hw-chars", field: "hw" });
  if (!POS.includes(w.pos)) errors.push({ code: "pos", field: "pos" });
  const def = String(w.def || "").trim();
  if (!def) errors.push({ code: "def-empty", field: "def" });
  else if (PLACEHOLDER.test(def)) errors.push({ code: "def-placeholder", field: "def" });
  else if (hw && defUsesFamily(def, hw)) errors.push({ code: "def-has-word", field: "def" });
  else if (wordCountOf(def) > DEF_WORDS_MAX[bandKey(grade)])
    warnings.push({ code: "def-long", field: "def" });
  const ex = String(w.ex || "").trim();
  if (!ex) errors.push({ code: "ex-empty", field: "ex" });
  else if (PLACEHOLDER.test(ex)) errors.push({ code: "ex-placeholder", field: "ex" });
  else if (hw && !usesWord(ex, hw)) errors.push({ code: "ex-missing-word", field: "ex" });
  const glyphs = Array.isArray(w.glyphs) ? w.glyphs : [];
  if (glyphs.length && (glyphs.length > GLYPH_MAX || !glyphs.every(glyphOk)))
    errors.push({ code: "glyph-count", field: "glyphs" });
  else if (glyphs.length && !String(w.alt || "").trim())
    errors.push({ code: "glyph-alt", field: "alt" });
  if (w.base) warnings.push({ code: "in-corpus", field: "hw" });
  return { errors, warnings };
}

/** Validate a whole draft. `errors` are unit-level; `words[i]` holds each word's own errors and warnings. */
export function validateUnit(draft) {
  const errors = [];
  const warnings = [];
  const title = String(draft.title || "").trim();
  if (!title) errors.push({ code: "title-empty", field: "title" });
  else if (title.length > 60) errors.push({ code: "title-long", field: "title" });
  if (!GRADES.includes(String(draft.grade))) errors.push({ code: "grade", field: "grade" });
  const list = Array.isArray(draft.words) ? draft.words : [];
  if (!list.length) errors.push({ code: "words-none", field: "words" });
  if (list.length > MAX_WORDS) errors.push({ code: "words-many", field: "words" });
  if (list.length && list.length < 3) warnings.push({ code: "few-words", field: "words" });
  const seen = new Set();
  const words = list.map((w) => {
    const r = validateWord(w, { grade: draft.grade });
    const hw = String(w.hw || "").trim().toLowerCase();
    if (hw) {
      const key = `${hw}|${w.pos}`;
      if (seen.has(key)) r.errors.push({ code: "dup", field: "hw" });
      seen.add(key);
    }
    return r;
  });
  const ok = !errors.length && words.every((w) => !w.errors.length);
  return { ok, errors, warnings, words };
}

// ── building ──────────────────────────────────────────────────────────────────
const unitSlug = (title) => wordSlug(title).slice(0, 22) || "unit";
/** cu.<slug>-<4 chars of now>; `taken` (ids already stored) is never reused. */
export function newUnitId(title, now = Date.now(), taken = []) {
  const base = `${CUSTOM_PREFIX}${unitSlug(title)}`;
  let n = Math.abs(Math.trunc(now));
  let id = `${base}-${n.toString(36).slice(-4)}`;
  while (taken.includes(id)) id = `${base}-${(n += 1).toString(36).slice(-4)}`;
  return id;
}
const DEFAULT_OBJECTIVES = [
  "I can say what each word on this list means.",
  "I can use each word in a sentence of my own.",
];
const DEFAULT_DISCUSS = [
  "Choose one word from this lesson and use it in a sentence about your day. Say it to your partner.",
];

/** The §3.2 word record for one draft word. A corpus copy keeps its other validated fields (syn, family, morph, pron…). */
export function buildWord(w, unitId) {
  const base = w.base ? JSON.parse(JSON.stringify(w.base)) : {};
  const hw = String(w.hw).trim();
  const ex = String(w.ex).trim();
  const hits = [...ex.matchAll(new RegExp(surfaceRe(hw, "giu").source, "giu"))];
  const rec = {
    ...base,
    id: `${unitId}.${wordSlug(hw)}.${w.pos}`,
    hw,
    pos: w.pos,
    tier: base.tier || "tier2",
    cats: Array.isArray(base.cats) ? base.cats : [],
    level: base.level || 2,
    def: String(w.def).trim(),
    ex,
    syn: Array.isArray(base.syn) ? base.syn : [],
    visual: w.glyphs?.length
      ? { kind: "scene", glyphs: w.glyphs.slice(0, GLYPH_MAX), alt: String(w.alt).trim() }
      : base.visual || { kind: "none", glyphs: [], alt: "" },
    src: {
      method: w.base ? "corpus-copy" : "teacher-authored",
      basis: ["teacher"],
      note: w.base ? `copied from ${w.base.id}` : "",
    },
  };
  // A cloze needs the blank exactly once; otherwise the corpus cloze (if any) is dropped with the sentence it came from.
  if (hits.length === 1)
    rec.cloze = {
      s: `${ex.slice(0, hits[0].index)}___${ex.slice(hits[0].index + hits[0][0].length)}`,
      f: hits[0][0],
    };
  else delete rec.cloze;
  const gloss = String(w.es || "").trim();
  if (gloss) rec.es = { gloss, cognate: Boolean(base.es?.cognate) };
  else delete rec.es;
  return rec;
}

/** Deterministic frames and bank from the teacher's own words (no generated prose). */
const widaFor = (words) => ({
  frames: ["I can use the word ___ when ___.", "___ means ___.", "One example of ___ is ___."],
  bank: words.map((w) => w.hw),
  oral: "Partner A says a sentence using one word from the list; Partner B says what the word means.",
});

/** The saved unit (§3.2 subset). `draft.supports` is an optional support profile for this unit; `draft.activities` the chosen activity type ids. */
export function buildUnit(draft, { now = Date.now(), taken = [], id = "" } = {}) {
  const unitId = id || newUnitId(draft.title, now, taken);
  const words = draft.words.map((w) => buildWord(w, unitId));
  const lines = (v) =>
    (Array.isArray(v) ? v : String(v || "").split("\n")).map((s) => s.trim()).filter(Boolean);
  const objectives = lines(draft.objectives);
  const discuss = lines(draft.discuss);
  return {
    schema: 1,
    custom: true,
    id: unitId,
    grade: String(draft.grade),
    n: 0,
    title: draft.title.trim(),
    theme: String(draft.theme || "").trim() || "Teacher-made lesson",
    strand: "thematic",
    version: "1.0.0",
    objectives: objectives.length ? objectives : DEFAULT_OBJECTIVES,
    rationale:
      String(draft.rationale || "").trim() || "Words chosen by the teacher for this class.",
    pacingDays: Math.min(10, Math.max(1, Math.ceil(words.length / 3))),
    words,
    review: [],
    produce: {
      sentences: [],
      combine: [],
      discuss: discuss.length ? discuss : DEFAULT_DISCUSS,
      explain: "",
    },
    teacher: {
      overview: String(draft.rationale || "").trim(),
      notes: {},
      discuss: discuss.length ? discuss : DEFAULT_DISCUSS,
    },
    wida: widaFor(words),
    activities: [...new Set(draft.activities || [])],
    ...(draft.supports ? { supports: draft.supports } : {}),
    editorial: { status: "teacher-authored", needsReview: [] },
    createdAt: new Date(now).toISOString(),
  };
}

// ── drafts: paste, corpus, clone ──────────────────────────────────────────────
const POS_TAG = new RegExp(`\\((${POS.join("|")})\\)\\s*$`, "i");
/** "cautious, reluctant (adj)\ncandid" → [{ hw, pos? }]. Lines, commas and semicolons separate words; "(adj)" sets the part of speech. */
export function parseWordList(text) {
  return String(text || "")
    .split(/[\n;,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const tag = POS_TAG.exec(s);
      return { hw: s.replace(POS_TAG, "").trim(), ...(tag ? { pos: tag[1].toLowerCase() } : {}) };
    })
    .slice(0, MAX_WORDS + 5);
}
/** Headword (lower case) → corpus entries [{ id, pos, grade, unit }], from the generated index. */
export function corpusByHeadword(index) {
  const map = new Map();
  for (const [id, w] of Object.entries(index?.words || {})) {
    const key = String(w.hw || "").toLowerCase();
    if (key)
      map.set(key, [...(map.get(key) || []), { id, pos: w.pos, grade: w.grade, unit: w.unit }]);
  }
  return map;
}
const fromRecord = (rec) => ({
  hw: rec.hw,
  pos: rec.pos,
  def: rec.def || "",
  ex: rec.ex || "",
  glyphs: rec.visual?.glyphs || [],
  alt: rec.visual?.alt || "",
  es: rec.es?.gloss || "",
  base: rec,
});
/** An empty word the teacher must write (no corpus match). */
export const blankWord = (hw = "", pos = "") => ({
  hw,
  pos,
  def: "",
  ex: "",
  glyphs: [],
  alt: "",
  es: "",
  base: null,
});
/**
 * Draft words for a pasted list. `lookup(id)` returns a corpus word record (data.js getWord → { word }); a word found in
 * the corpus is pre-filled with that validated record, any other is blank for the teacher to write.
 */
export async function draftFromList(items, byHw, lookup) {
  const out = [];
  for (const { hw, pos } of items) {
    const hit = (byHw.get(hw.toLowerCase()) || []).find((h) => !pos || h.pos === pos) || null;
    const found = hit ? (await lookup(hit.id))?.word : null;
    out.push(found ? fromRecord(found) : blankWord(hw, pos || ""));
  }
  return out;
}
/** Draft words from existing records (select-from-corpus and clone). */
export const draftFromRecords = (records) => records.map(fromRecord);

// ── storage (progress.custom through Core's store) ────────────────────────────
export const listCustom = () =>
  Object.values(loadProgress().custom || {}).filter(
    (u) => u?.custom === true && String(u.id).startsWith(CUSTOM_PREFIX),
  );
export const getCustom = (id) => listCustom().find((u) => u.id === id) || null;
export function saveCustom(unit) {
  if (!unit?.custom || !String(unit.id).startsWith(CUSTOM_PREFIX))
    throw new TypeError("Only custom lessons (cu.) can be saved here.");
  const progress = loadProgress();
  progress.custom = { ...(progress.custom || {}), [unit.id]: unit };
  return saveProgress(progress);
}
export function deleteCustom(id) {
  const progress = loadProgress();
  const next = { ...(progress.custom || {}) };
  delete next[id];
  progress.custom = next;
  return saveProgress(progress);
}
/** A file the student-side importer (store.importProgress) already understands: a progress record holding only `custom`. */
export const exportUnitFile = (unit) => ({ v: 1, custom: { [unit.id]: unit } });
export const exportUnitText = (unit) => `${JSON.stringify(exportUnitFile(unit), null, 2)}\n`;
/** Units found in an exported file, re-checked before they are saved ([] when the file holds none). */
export function unitsFromFile(obj) {
  const all = obj && typeof obj === "object" ? Object.values(obj.custom || {}) : [];
  return all.filter(
    (u) =>
      u?.custom === true &&
      String(u.id || "").startsWith(CUSTOM_PREFIX) &&
      Array.isArray(u.words) &&
      u.words.length &&
      u.words.every((w) => w.hw && w.def && w.ex && usesWord(w.ex, w.hw)),
  );
}
