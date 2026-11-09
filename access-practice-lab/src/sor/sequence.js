// Phonics Path: an original structured-literacy scope and sequence in three levels (roughly Grades 1-3).
// Skills follow the order explicit, systematic phonics programs teach them: closed syllables and short vowels,
// digraphs, blends and glued sounds, suffixes, vowel-consonant-e, open syllables, vowel teams, r-controlled vowels,
// syllable division, prefixes, suffixes with spelling rules, and advanced patterns. All words, sentences and
// passages are original to this lab. The three authored files hold the lessons; this file assembles and validates them.
import { LEVEL_1 } from "../content/phonics/level-1.js";
import { LEVEL_2 } from "../content/phonics/level-2.js";
import { LEVEL_3 } from "../content/phonics/level-3.js";

export const LEVELS = Object.freeze([LEVEL_1, LEVEL_2, LEVEL_3]);

/** Flatten levels -> units -> lessons, stamping position and the next lesson so authors never maintain links. */
const flat = LEVELS.flatMap((level) =>
  level.units.flatMap((unit) => unit.lessons.map((lesson) => ({ lesson, level, unit }))),
);
export const READING_LESSONS = Object.freeze(
  flat.map(({ lesson, level, unit }, i) =>
    Object.freeze({
      ...lesson,
      level: level.level,
      levelTitle: level.title,
      unitId: unit.id,
      unit: unit.title,
      n: i + 1,
      next: flat[i + 1]?.lesson.id ?? null,
    }),
  ),
);

export const lessonById = (id) => READING_LESSONS.find((lesson) => lesson.id === id);
export const unitsOf = (level) =>
  level.units.map((unit) => ({ ...unit, lessons: unit.lessons.map((l) => lessonById(l.id)) }));

/** Rebuild a spelling from grapheme units. A split unit such as "a_e" wraps the next unit: m + a_e + k = make. */
export function spellUnits(units) {
  let out = "";
  let after = "";
  for (const unit of units) {
    if (unit.includes("_")) {
      const [front, back] = unit.split("_");
      out += front;
      after = back;
    } else {
      out += unit;
      if (after) {
        out += after;
        after = "";
      }
    }
  }
  return out + after;
}

/** Ordered activity phases for one lesson. Optional phases appear only when the lesson authors them. */
export const phasesFor = (lesson) => [
  "model",
  "build",
  "read",
  ...(lesson.sort ? ["sort"] : []),
  "spell",
  "text",
  ...(lesson.dictation ? ["dictation"] : []),
  "transfer",
  "complete",
];

const WORD = /^[a-z]+$/;
const wordsOf = (text) => text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [];

function checkItem(errors, key, item) {
  if (
    !item?.word ||
    !Array.isArray(item.units) ||
    !Array.isArray(item.sounds) ||
    item.units.length !== item.sounds.length ||
    !item.meaning
  ) {
    errors.push(`${key}: needs word, meaning, and units that map one-to-one to sounds`);
    return;
  }
  if (!WORD.test(item.word)) errors.push(`${key}: word must be lowercase letters`);
  if (spellUnits(item.units) !== item.word)
    errors.push(`${key}: units spell "${spellUnits(item.units)}", not "${item.word}"`);
  if (!item.sounds.every((s) => /^\/.+\/$/.test(s)))
    errors.push(`${key}: each sound must look like /x/`);
}

/** Every rule a lesson must satisfy. Returns a list of plain-language errors; an empty list means the lesson is valid. */
export function validateLesson(lesson) {
  const errors = [];
  if (!lesson?.id || !lesson.title || !lesson.objective || !lesson.model || !lesson.note)
    errors.push("missing lesson metadata");
  if (!Array.isArray(lesson?.prerequisites) || !lesson.prerequisites.length)
    errors.push("prerequisites missing");
  for (const key of ["example", "build", "read", "spell", "transfer"])
    checkItem(errors, key, lesson?.[key]);
  const b = lesson?.build;
  if (!b?.tiles?.length || !b.units?.every((unit) => b.tiles.includes(unit)))
    errors.push("build: tile bank misses a target grapheme");
  else if (
    b.tiles.length < b.units.length + 2 ||
    b.tiles.length > 9 ||
    new Set(b.tiles).size !== b.tiles.length
  )
    errors.push("build: tile bank needs 2+ distinct distractors and at most 9 tiles");
  const r = lesson?.read;
  if (
    !r?.choices?.includes(r.word) ||
    new Set(r.choices).size !== r.choices.length ||
    r.choices.length < 3
  )
    errors.push("read: needs 3+ distinct choices including the target");
  if (
    !Array.isArray(lesson?.cards) ||
    !lesson.cards.length ||
    !lesson.cards.every((c) => c.g && c.sound && c.key && c.pic)
  )
    errors.push("cards: each needs g, sound, key, pic");
  else if (
    !lesson.cards.every((c) => c.key.toLowerCase().includes(c.g.replace("_", "").toLowerCase()[0]))
  )
    errors.push("cards: key word should contain the pattern's first letter");
  if (!lesson?.passage || !lesson.question?.endsWith("?") || !lesson.answerWords?.length)
    errors.push("connected reading task incomplete");
  else {
    const passage = new Set(wordsOf(lesson.passage));
    if (passage.size < 8) errors.push("passage: needs at least 8 distinct words");
    for (const w of lesson.answerWords)
      if (!passage.has(w.toLowerCase())) errors.push(`answerWords: "${w}" is not in the passage`);
    const seen = new Set([
      ...(lesson.example ? [lesson.example.word] : []),
      lesson.build?.word,
      lesson.read?.word,
      lesson.spell?.word,
      ...(r?.choices || []),
    ]);
    if (passage.has(lesson.transfer?.word) || seen.has(lesson.transfer?.word))
      errors.push("transfer: word must not appear in guided practice or the passage");
    if (!Array.isArray(lesson.exceptions))
      errors.push("exceptions: must list the words to preview");
  }
  if (lesson?.sort) {
    const { a, b: bb } = lesson.sort;
    const ok = (x) =>
      x?.label &&
      x.rule &&
      x.match &&
      Array.isArray(x.words) &&
      x.words.length >= 3 &&
      x.words.length <= 5;
    if (!ok(a) || !ok(bb))
      errors.push("sort: two buckets each need label, rule, match (regex) and 3-5 words");
    else {
      const ra = new RegExp(a.match);
      const rb = new RegExp(bb.match);
      const all = [...a.words, ...bb.words];
      if (new Set(all).size !== all.length) errors.push("sort: a word appears twice");
      for (const w of a.words)
        if (!ra.test(w) || rb.test(w))
          errors.push(`sort: "${w}" does not belong only in "${a.label}"`);
      for (const w of bb.words)
        if (!rb.test(w) || ra.test(w))
          errors.push(`sort: "${w}" does not belong only in "${bb.label}"`);
    }
  }
  if (lesson?.dictation) {
    const d = lesson.dictation;
    const n = wordsOf(d.sentence || "").length;
    if (!/[.?!]$/.test(d.sentence || "") || n < 4 || n > 10)
      errors.push("dictation: sentence must end with punctuation and have 4-10 words");
    const taught = new Set([
      lesson.example?.word,
      lesson.build?.word,
      lesson.read?.word,
      lesson.spell?.word,
      lesson.transfer?.word,
      ...(r?.choices || []),
    ]);
    if (!wordsOf(d.sentence || "").some((w) => taught.has(w)))
      errors.push("dictation: sentence must use a word from this lesson");
  }
  if (lesson?.trick && !(Array.isArray(lesson.trick) && lesson.trick.every((w) => WORD.test(w))))
    errors.push("trick: lowercase words only");
  return errors;
}

/** Whole-sequence rules: unique ids, a sensible level/unit shape, and every lesson valid. */
export function validateSequence() {
  const errors = [];
  const ids = new Set();
  for (const lesson of READING_LESSONS) {
    if (ids.has(lesson.id)) errors.push(`duplicate lesson id ${lesson.id}`);
    ids.add(lesson.id);
    for (const e of validateLesson(lesson)) errors.push(`${lesson.id}: ${e}`);
  }
  for (const level of LEVELS) {
    if (!level.title || !level.grade || !level.blurb || !level.units?.length)
      errors.push(`level ${level.level}: missing metadata`);
    for (const unit of level.units)
      if (!unit.id || !unit.title || !unit.summary || !unit.skills?.length || !unit.lessons?.length)
        errors.push(`unit ${unit.id}: missing metadata or lessons`);
  }
  return errors;
}
