// Plain-language definitions for families (grade 3-4 reading level, EN + ES).
//
// A lesson's own vocabulary definition is written for the student and the
// teacher ("A reasoned answer that is close enough to be useful, found without
// exact computation."). The adult at the kitchen table, often reading in their
// second language, needs the short version first. This module is the single
// source of truth for that short version: `data/family-glossary.json`, the family glossary (the Spanish
// term, the plain EN/ES definition and the example of every vocabulary word, one entry each).
//
// Rules, and the gate that enforces them: tools/validate-family-plain-definitions.mjs.
// The lesson's authored definition is never edited. It travels beside the plain
// one as `formal` / `formalEs`, so every surface can offer a "More precisely" line.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const PLAIN_DEFINITIONS_PATH = join(ROOT, "data", "family-glossary.json");

/** The one normalised vocabulary key. Singularises by dropping a final "s". */
export const vocabKey = (term) =>
  String(term || "")
    .toLowerCase()
    .replace(/s$/, "")
    .trim();

/** "4-3-group1" / "2-5-catchup" / "1-3-part2" -> "4-3" / "2-5" / "1-3". */
export function baseLessonId(id) {
  const m = /^(\d+-\d+)/.exec(String(id || ""));
  return m ? m[1] : String(id || "");
}

/**
 * Parse the file into a Map keyed by `vocabKey`. A term that means different
 * things in different lessons ("base", "scale", "term") carries `senses`, each
 * naming the lessons it applies to; the entry's own en/es is the default sense.
 */
export function parsePlainDefinitions(data) {
  const map = new Map();
  const terms = (data && data.terms) || {};
  for (const [name, entry] of Object.entries(terms)) {
    const key = vocabKey(name);
    if (map.has(key))
      throw new Error(`family-plain-definitions: duplicate key "${key}" ("${name}")`);
    map.set(key, { name, ...entry });
  }
  return map;
}

let _cache = null;
export function loadPlainDefinitions(path = PLAIN_DEFINITIONS_PATH) {
  if (path === PLAIN_DEFINITIONS_PATH && _cache) return _cache;
  const map = existsSync(path)
    ? parsePlainDefinitions(JSON.parse(readFileSync(path, "utf8")))
    : new Map();
  if (path === PLAIN_DEFINITIONS_PATH) _cache = map;
  return map;
}

/** The sense of `entry` that applies to `lessonId` (exact id first, then its base lesson). */
export function senseFor(entry, lessonId) {
  if (!entry) return null;
  const base = baseLessonId(lessonId);
  for (const sense of entry.senses || []) {
    const lessons = sense.lessons || [];
    if (lessons.includes(String(lessonId)) || lessons.includes(base)) return sense;
  }
  return entry;
}

/**
 * Plain definition of `term` for `lessonId`: { en, es, example? } or null.
 * No lessonId = the default sense (what the shared glossary shows).
 */
export function plainFor(term, lessonId = "", map = loadPlainDefinitions()) {
  const entry = map.get(vocabKey(term));
  const sense = senseFor(entry, lessonId);
  if (!sense) return null;
  const out = { en: sense.en, es: sense.es };
  if (sense === entry && entry.termEs) {
    out.name = entry.name;
    out.termEs = entry.termEs;
    if (entry.alsoEs) out.alsoEs = entry.alsoEs;
  }
  if (sense.example) out.example = sense.example;
  return out;
}

const sameCase = (spanish, like) =>
  like && like[0] !== like[0].toLowerCase() && spanish[0] !== spanish[0].toUpperCase()
    ? spanish[0].toUpperCase() + spanish.slice(1)
    : spanish;

/**
 * The ONE Spanish term for a vocabulary item: the glossary's `termEs` (or one of its `alsoEs` forms, kept when the
 * lesson uses a different part of speech), written in the lesson's own capitalisation. A lesson that names the same
 * word two ways ("el todo", "Total") is brought to the glossary term. Plural/other forms (the English term is not the
 * glossary key itself) are left to the lesson, since only the glossary key's own number is defined.
 */
function glossaryTermEs(item, plain) {
  const own = String(item.termEs || "");
  if (
    !plain.termEs ||
    String(item.term || "")
      .toLowerCase()
      .trim() !== plain.name.toLowerCase().trim()
  )
    return own;
  const known = [plain.termEs, ...(plain.alsoEs || [])].map((x) => x.toLowerCase());
  if (own && known.includes(own.toLowerCase().trim())) return own;
  return sameCase(plain.termEs, own);
}

/**
 * Put the plain definition first and keep the authored one as `formal`.
 *
 * Every vocabulary item keeps its other fields. `definition` / `definitionEs`
 * become the plain text, so every consumer that already reads those two fields
 * (flashcards, the match game, the word quiz, the glossary popup, the family
 * guide) shows the short version with no further change. `formal` / `formalEs`
 * hold the lesson's own wording, for a "More precisely" line; they are empty
 * when the two are identical. `plain: true` marks an item as converted, so
 * applying this twice is harmless.
 */
export function withPlainDefinitions(vocabList, lessonId = "", map = loadPlainDefinitions()) {
  if (!Array.isArray(vocabList)) return [];
  return vocabList.map((item) => {
    if (!item || item.plain) return item;
    const plain = plainFor(item.term, lessonId, map);
    if (!plain) return item;
    const formal = String(item.definition || "");
    const formalEs = String(item.definitionEs || "");
    const out = {
      ...item,
      termEs: glossaryTermEs(item, plain),
      definition: plain.en,
      definitionEs: plain.es,
      formal: formal === plain.en ? "" : formal,
      formalEs: formalEs === plain.es ? "" : formalEs,
      plain: true,
    };
    if (plain.example) out.plainExample = plain.example;
    return out;
  });
}
