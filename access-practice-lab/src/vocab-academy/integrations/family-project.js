// Vocabulary Academy · family projection. Pure (no DOM, no storage): Node-testable.
//
// A family sees the words of ONE unit and a few things to talk about. This module is the only place that decides
// which unit fields reach the family pages, and it is a WHITELIST: each field below is copied by name, so a field the
// content schema adds later (teacher notes, answer keys, rationale, editorial flags, class data) stays out until it
// is added here on purpose. tools/vocab-academy-integration.test.mjs diffs the output against every teacher and
// answer string of a reference unit.
import { hashSeed, rngFor } from "../rng.js";

const text = (v, max = 400) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const list = (v, max, each = 200) =>
  (Array.isArray(v) ? v : [])
    .map((x) => text(x, each))
    .filter(Boolean)
    .slice(0, max);

/** One word as a family may see it. No misuse sentences, cloze items, source notes or teacher notes. */
export function familyWord(word) {
  const es = word?.es && typeof word.es === "object" ? word.es : null;
  const glyphs = list(word?.visual?.glyphs, 3, 8);
  return {
    id: text(word?.id, 80),
    hw: text(word?.hw, 60),
    pos: text(word?.pos, 8),
    pron: text(word?.pron, 60),
    def: text(word?.def, 300),
    ex: text(word?.ex, 300),
    syn: list(word?.syn, 4, 40),
    frame: text(word?.frame, 200),
    es:
      es && text(es.gloss, 80) ? { gloss: text(es.gloss, 80), cognate: es.cognate === true } : null,
    glyphs,
    alt: glyphs.length ? text(word?.visual?.alt, 240) : "",
  };
}

/** Everything the family view shows about a unit, before any talk prompt. */
export function familyUnit(unit) {
  return {
    id: text(unit?.id, 40),
    grade: text(unit?.grade, 4),
    n: Number(unit?.n) || 0,
    title: text(unit?.title, 120),
    theme: text(unit?.theme, 120),
    objectives: list(unit?.objectives, 4, 200),
    words: (Array.isArray(unit?.words) ? unit.words : [])
      .map(familyWord)
      .filter((w) => w.id && w.hw && w.def),
  };
}

const wrap = (en, es) => ({ en, es });

/**
 * 3 to 5 conversation starters, the same for the same unit every time. Built only from student-facing fields:
 * `produce.discuss`, `produce.sentences`, each word's frame, meaning, Spanish gloss and opposite. Never the
 * teacher block, never an answer. Spanish wraps English prompts (the practice language is English; the family may
 * answer in any language) and is written out in full for the prompts the program generates itself.
 */
export function talkAboutIt(unit, n = 4) {
  const want = Math.max(3, Math.min(5, Number(n) || 4));
  const view = familyUnit(unit);
  const words = view.words;
  if (!words.length) return [];
  const rng = rngFor(hashSeed(`va-family:${view.id}`));
  const order = rng.shuffle(words);
  const discuss = list(unit?.produce?.discuss, 2, 300);
  const sentences = list(unit?.produce?.sentences, 3, 300);
  const out = [];
  const add = (id, say, wordId = "", frame = "") => {
    if (say?.en && !out.some((s) => s.id === id)) out.push({ id, wordId, frame, ...say });
  };

  if (discuss[0])
    add(
      "discuss-1",
      wrap(
        discuss[0],
        `Conversen en el idioma que prefieran. La pregunta, en inglés: ${discuss[0]}`,
      ),
    );
  const framed = order.find((w) => w.frame);
  if (framed)
    add(
      `frame-${framed.id}`,
      wrap(
        `Finish this sentence together, then make up a different ending: “${framed.frame}”`,
        `Completen juntos esta oración (en inglés) y luego inventen otro final: “${framed.frame}”`,
      ),
      framed.id,
      framed.frame,
    );
  const meaning = order[0];
  add(
    `meaning-${meaning.id}`,
    wrap(
      `What does “${meaning.hw}” mean? Explain it in your own words, in English, Spanish or both.`,
      `¿Qué significa “${meaning.hw}”? Explíquenlo con sus propias palabras, en inglés, en español o en ambos.`,
    ),
    meaning.id,
  );
  if (sentences[0])
    add(
      "sentence-1",
      wrap(sentences[0], `Digan una oración en inglés o en español: ${sentences[0]}`),
    );
  const bridge = order.find((w) => w.es?.cognate);
  if (bridge)
    add(
      `bridge-${bridge.id}`,
      wrap(
        `In Spanish this word is “${bridge.es.gloss}”. Do the two words sound alike? Where else might you hear it?`,
        `En español la palabra es “${bridge.es.gloss}”. ¿Suenan parecidas las dos palabras? ¿Dónde más podrían oírla?`,
      ),
      bridge.id,
    );
  const opposite = order.find((w) => (unit.words.find((x) => x.id === w.id)?.ant || []).length);
  if (opposite)
    add(
      `opposite-${opposite.id}`,
      wrap(
        `Can you think of a word that means the opposite of “${opposite.hw}”? Use both words in a sentence.`,
        `¿Se les ocurre una palabra que signifique lo contrario de “${opposite.hw}”? Usen las dos palabras en una oración.`,
      ),
      opposite.id,
    );
  if (discuss[1])
    add(
      "discuss-2",
      wrap(
        discuss[1],
        `Conversen en el idioma que prefieran. La pregunta, en inglés: ${discuss[1]}`,
      ),
    );
  if (sentences[1])
    add(
      "sentence-2",
      wrap(sentences[1], `Digan otra oración, en inglés o en español: ${sentences[1]}`),
    );
  return out.slice(0, want);
}

/** The honest label every family page carries; `assigned` only when a class link says the unit was assigned. */
export const FAMILY_LABEL = Object.freeze({
  optional: wrap(
    "Optional home practice — not assigned by your teacher",
    "Práctica opcional en casa — su docente no la asignó",
  ),
  assigned: wrap("Assigned by your teacher", "Asignada por su docente"),
});

/**
 * Whether an assignment (class server shape `{ id, title, path }`) names this unit. Returns the teacher's own title
 * only; no class name, roster or other assignment ever reaches the family view.
 */
export function assignedUnit(assignments, grade, n) {
  const prefix = `vocabulary-academy/grade/${grade}/lesson/${Number(n)}`;
  for (const a of Array.isArray(assignments) ? assignments : []) {
    const path = String(a?.path || "")
      .replace(/^\/?access-practice-lab\//, "")
      .replace(/^\//, "")
      .split("?")[0];
    if (path === prefix || path.startsWith(`${prefix}/`)) return { title: text(a.title, 120) };
  }
  return null;
}

/** Lab band ids (src/bands.js) mapped to the Vocabulary Academy grade a family most likely means. */
export const gradeForBand = (band) =>
  ({ K: "K", 1: "1", "2-3": "2", "3-5": "4", "6-8": "6" })[String(band)] || "";
