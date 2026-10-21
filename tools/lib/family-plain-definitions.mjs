// Rules for data/family-plain-definitions.json, shared by the gate
// (tools/validate-family-plain-definitions.mjs) and its unit test.
//
// Everything here is pure and deterministic: no network, no clock, no randomness.
import { baseLessonId, vocabKey } from "../../scripts/lib/family-plain-definitions.mjs";
import { listLessonDirs, loadLessonConfig } from "./curriculum-source.mjs";

export const LIMITS = Object.freeze({
  enMaxWords: 12, // hard cap; the target is 6-10
  enTargetMin: 6,
  enTargetMax: 10,
  esMaxWords: 14,
  exampleEnMaxWords: 10,
  exampleEsMaxWords: 12,
  maxGrade: 5, // Flesch-Kincaid grade, English plain definitions
  minWords: 3,
});

/* -- words, sentences, syllables, grade ------------------------------------ */

/** A "word" is a token with a letter or digit in it; stand-alone symbols (=, →, —) are not words. */
export const wordsOf = (s) =>
  String(s || "")
    .split(/\s+/)
    .filter((t) => /[\p{L}\p{N}]/u.test(t));
export const wordCount = (s) => wordsOf(s).length;

export function sentenceCount(s) {
  const parts = String(s || "")
    .trim()
    .split(/(?<=[.!?])\s+(?=\S)/)
    .filter((p) => /[\p{L}\p{N}]/u.test(p));
  return Math.max(1, parts.length);
}

/** Syllables in one token. Numerals and mixed tokens (3x, 2³, 50%) count as one. */
export function syllables(token) {
  const w = String(token)
    .toLowerCase()
    .replace(/[^a-záéíóúüñ0-9]/g, "");
  if (!w) return 0;
  if (/[0-9]/.test(w)) return 1;
  let word = w
    .replace(/[áàä]/g, "a")
    .replace(/[éèë]/g, "e")
    .replace(/[íìï]/g, "i")
    .replace(/[óòö]/g, "o")
    .replace(/[úùü]/g, "u");
  if (word.length <= 3) return 1;
  word = word.replace(/^some/, "sum");
  // Silent endings: -es / -ed after a plain consonant, and a final e unless it follows consonant + l (table).
  let core = word.replace(/(?<=[^aeiouysxzcgh])es$/, "").replace(/(?<=[^tdaeiouy])ed$/, "");
  if (!/[^aeiouy]le$/.test(core)) core = core.replace(/e$/, "");
  core = core.replace(/^y/, "");
  const groups = core.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

/** Flesch-Kincaid grade level. 0.39 W/S + 11.8 Syl/W - 15.59. */
export function fkGrade(text) {
  const ws = wordsOf(text);
  if (!ws.length) return 0;
  const syl = ws.reduce((n, t) => n + syllables(t), 0);
  const grade = 0.39 * (ws.length / sentenceCount(text)) + 11.8 * (syl / ws.length) - 15.59;
  return Math.round(grade * 100) / 100;
}

/* -- stems, for the "term may not appear in its own definition" rule -------- */

const fold = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
const tokensOf = (s) => fold(s).match(/[a-z0-9]+/g) || [];

export function enStem(word) {
  let w = fold(word).replace(/[^a-z0-9]/g, "");
  if (w.length > 5 && w.endsWith("ing")) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith("ed")) w = w.slice(0, -2);
  else if (w.length > 4 && w.endsWith("es")) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
  if (w.length > 3 && w.endsWith("e")) w = w.slice(0, -1);
  return w;
}

/** Two Spanish words are "the same word" when they share a stem (razón / razones, sumar / suma). */
function esSame(a, b) {
  if (a === b) return true;
  if (a.length < 4 || b.length < 4 || Math.abs(a.length - b.length) > 3) return false;
  const n = Math.min(a.length, b.length, 6);
  return a.slice(0, n) === b.slice(0, n);
}

/** True if the token sequence `phrase` appears contiguously in `tokens` under `same`. */
function containsSequence(tokens, phrase, same) {
  if (!phrase.length) return false;
  for (let i = 0; i + phrase.length <= tokens.length; i++) {
    if (phrase.every((p, j) => same(tokens[i + j], p))) return true;
  }
  return false;
}

/** Surface forms of a term: "at least / at most" -> ["at least", "at most"]; "(b1)" notes dropped. */
export function termVariants(name) {
  return String(name || "")
    .replace(/\([^)]*\)/g, " ")
    .split(/\s*\/\s*/)
    .map((v) => v.trim())
    .filter(Boolean);
}

export function isCircularEn(termNames, definition) {
  const defTokens = tokensOf(definition).map(enStem);
  return termNames.some((name) =>
    termVariants(name).some((v) => {
      const phrase = tokensOf(v).map(enStem).filter(Boolean);
      return phrase.length > 0 && containsSequence(defTokens, phrase, (a, b) => a === b);
    }),
  );
}

export function isCircularEs(termNamesEs, definition) {
  const defTokens = tokensOf(definition);
  return termNamesEs.some((name) =>
    termVariants(name).some((v) => {
      const phrase = tokensOf(v);
      // A one-word term of three letters or fewer ("por") is a function word, not a giveaway.
      if (phrase.length === 1 && phrase[0].length < 4) return false;
      return phrase.length > 0 && containsSequence(defTokens, phrase, esSame);
    }),
  );
}

/* -- numerals ---------------------------------------------------------------- */

/** Every number a text states, as strings with separators stripped ("1,344" -> "1344"). */
export function numeralsOf(text) {
  const out = new Set();
  const s = String(text || "")
    .replace(/(\d),(\d{3})/g, "$1$2")
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉]/g, (c) => ` ${"⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉".indexOf(c) % 10} `);
  for (const m of s.matchAll(/\d+(?:\.\d+)?/g)) out.add(String(Number(m[0])));
  return out;
}

/* -- jargon ------------------------------------------------------------------ */

/**
 * Grade 3-5 mathematics a family member is assumed to know. A plain definition
 * may use these freely; any OTHER grade-6 vocabulary word may appear only when
 * it is itself a vocabulary term of a lesson that uses the defined term.
 */
export const FAMILIAR_MATH_WORDS = new Set(
  (
    "add,addition,subtract,subtraction,sum,difference,product,quotient,multiply,multiplication,divide,division," +
    "number,digit,fraction,decimal,decimal point,whole,whole number,half,equal,equation,plus,minus,times,total,amount,count," +
    "square,rectangle,triangle,circle,shape,side,edge,corner,angle,line,number line,point,graph,table,row,column," +
    "pattern,group,part,piece,answer,estimate,round,compare,measure,length,width,height,size," +
    "unit,value,more,less,greater,least,most,zero,ones,tens,hundreds,place,sign,percent,even,odd," +
    "solve,distance,order,less than,greater than,middle,center,top,bottom,opposite"
  )
    .split(",")
    .map((p) => p.split(" ").map(enStem).join(" ")),
);

/**
 * The first grade-6 vocabulary term found in `definition` that is neither
 * familiar nor allowed (null when clean). `jargon` is a list of stem-phrases
 * (arrays); `allowed` a Set of those phrases joined by a space.
 */
export function findJargon(definition, jargon, allowed) {
  // "means" / "meaning" is the verb here, never the statistical mean.
  const tokens = tokensOf(definition)
    .filter((t) => !/^(means|meaning|meant)$/.test(t))
    .map(enStem);
  const hits = [];
  for (const phrase of jargon) {
    if (!containsSequence(tokens, phrase, (a, b) => a === b)) continue;
    const joined = phrase.join(" ");
    if (FAMILIAR_MATH_WORDS.has(joined)) continue;
    if (allowed.has(joined)) continue;
    hits.push(joined);
  }
  // A phrase swallowed by a longer allowed phrase is not a separate hit.
  const longer = (h) => [...allowed].some((a) => a !== h && a.includes(h));
  const real = hits.filter((h) => !longer(h));
  return real.length ? real[0] : null;
}

/* -- one entry ---------------------------------------------------------------- */

const isStr = (v) => typeof v === "string" && v.trim().length > 0;

/**
 * Check one definition (the entry itself, or one of its senses).
 * ctx: { names: [EN surface forms], namesEs: [ES surface forms], authored: Set<numeral>,
 *        jargon: [[stem...]], allowed: Set<string> }
 * Returns a list of problem strings.
 */
export function checkSense(label, sense, ctx) {
  const bad = [];
  const { en, es, example } = sense || {};
  if (!isStr(en)) bad.push(`${label}: missing English definition`);
  if (!isStr(es)) bad.push(`${label}: missing Spanish definition`);
  if (isStr(en)) {
    const n = wordCount(en);
    if (n > LIMITS.enMaxWords)
      bad.push(`${label}: English is ${n} words (max ${LIMITS.enMaxWords}): "${en}"`);
    if (n < LIMITS.minWords) bad.push(`${label}: English is only ${n} words: "${en}"`);
    if (isCircularEn(ctx.names, en))
      bad.push(`${label}: English definition uses the term itself: "${en}"`);
    const g = fkGrade(en);
    if (g > LIMITS.maxGrade)
      bad.push(`${label}: reading grade ${g} is above ${LIMITS.maxGrade}: "${en}"`);
    const j = findJargon(en, ctx.jargon || [], ctx.allowed || new Set());
    if (j)
      bad.push(
        `${label}: uses "${j}", which is grade-6 vocabulary this lesson does not define: "${en}"`,
      );
    const extra = [...numeralsOf(en)].filter((x) => !ctx.authored.has(x));
    if (extra.length)
      bad.push(
        `${label}: states ${extra.join(", ")}, which the lesson's own wording never says: "${en}"`,
      );
  }
  if (isStr(es)) {
    const n = wordCount(es);
    if (n > LIMITS.esMaxWords)
      bad.push(`${label}: Spanish is ${n} words (max ${LIMITS.esMaxWords}): "${es}"`);
    if (n < LIMITS.minWords) bad.push(`${label}: Spanish is only ${n} words: "${es}"`);
    if (isCircularEs(ctx.namesEs, es))
      bad.push(`${label}: Spanish definition uses the term itself: "${es}"`);
    if (isStr(en) && es.trim() === en.trim() && /[a-z]{4,}/i.test(en))
      bad.push(`${label}: Spanish is a copy of the English`);
  }
  if (example !== undefined) {
    if (!example || !isStr(example.en) || !isStr(example.es)) {
      bad.push(`${label}: example needs both en and es`);
    } else {
      const ne = wordCount(example.en);
      const ns = wordCount(example.es);
      if (ne > LIMITS.exampleEnMaxWords)
        bad.push(
          `${label}: English example is ${ne} words (max ${LIMITS.exampleEnMaxWords}): "${example.en}"`,
        );
      if (ns > LIMITS.exampleEsMaxWords)
        bad.push(
          `${label}: Spanish example is ${ns} words (max ${LIMITS.exampleEsMaxWords}): "${example.es}"`,
        );
      if (!/\d/.test(example.en))
        bad.push(`${label}: example has no real numbers: "${example.en}"`);
    }
  }
  return bad;
}

/**
 * Check a whole entry: the default sense, each extra sense, and the lesson lists.
 * ctx.senseLessons(sense) -> context for that sense (the lessons it covers decide
 * which numerals and jargon are authored/allowed); ctx.lessonExists(id).
 */
export function checkEntry(name, entry, ctxFor, lessonExists = () => true) {
  const bad = [];
  if (!entry || typeof entry !== "object") return [`${name}: entry is not an object`];
  bad.push(...checkSense(name, entry, ctxFor(null)));
  const claimed = new Map();
  (entry.senses || []).forEach((sense, i) => {
    const label = `${name} [sense ${i + 1}]`;
    const lessons = sense.lessons;
    if (!Array.isArray(lessons) || !lessons.length) {
      bad.push(`${label}: needs a non-empty lessons list`);
      return;
    }
    for (const id of lessons) {
      if (!lessonExists(id)) bad.push(`${label}: lesson ${id} does not exist`);
      if (claimed.has(id))
        bad.push(`${label}: lesson ${id} is also claimed by sense ${claimed.get(id)}`);
      claimed.set(id, i + 1);
    }
    bad.push(...checkSense(label, sense, ctxFor(lessons)));
  });
  return bad;
}

export { baseLessonId, vocabKey };

/* -- the whole file against the whole curriculum ------------------------------ */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const texts = (v) =>
  [
    v.definition,
    v.definitionEs,
    v.example,
    v.visual,
    v.cloze,
    ...(Array.isArray(v.examples) ? v.examples.flatMap((e) => [e.text, e.why]) : []),
  ]
    .filter(Boolean)
    .join(" ");

/**
 * Everything the data file is judged against:
 *   records: one per (lesson config, vocabulary item)
 *   extras:  bank and shared-glossary items (no lesson of their own)
 * `MATH_GLOSSARY` is passed in so the unit test needs no engine import.
 */
export async function loadSources(root = ROOT) {
  const records = [];
  const lessonIds = new Set();
  for (const id of listLessonDirs()) {
    lessonIds.add(id);
    const vocab = loadLessonConfig(id).vocabulary;
    for (const v of Array.isArray(vocab) ? vocab : []) {
      if (!v || !v.term) continue;
      records.push({
        lessonId: id,
        term: String(v.term),
        termEs: String(v.termEs || ""),
        definition: String(v.definition || ""),
        definitionEs: String(v.definitionEs || ""),
        text: texts(v),
      });
    }
  }
  const extras = [];
  const bankPath = join(root, "vocab-hub", "vocab-bank.json");
  if (existsSync(bankPath)) {
    for (const b of JSON.parse(readFileSync(bankPath, "utf8")).items || []) {
      if (b && b.term)
        extras.push({
          term: String(b.term),
          termEs: String(b.termEs || ""),
          definition: String(b.definition || ""),
          definitionEs: String(b.definitionEs || ""),
          text: texts(b),
        });
    }
  }
  const { MATH_GLOSSARY } = await import("@eduwonderlab/engine/core/math-glossary.js");
  for (const g of MATH_GLOSSARY)
    extras.push({
      term: g.term,
      termEs: g.termEs || "",
      definition: g.definition || "",
      definitionEs: g.definitionEs || "",
      text: texts(g),
    });
  return { records, extras, lessonIds };
}

const sameLesson = (lessons, id) => lessons.includes(id) || lessons.includes(baseLessonId(id));

/**
 * Judge `data` ({terms: {...}}) against `sources`. Returns { problems, stats }.
 * Pure: the self-tests hand it mutated copies of the real file.
 */
export function evaluate(data, sources) {
  const problems = [];
  const { records, extras, lessonIds } = sources;
  const terms = (data && data.terms) || {};

  // Group everything by normalised key.
  const groups = new Map();
  const group = (key) => {
    if (!groups.has(key))
      groups.set(key, { names: new Set(), namesEs: new Set(), recs: [], extras: [] });
    return groups.get(key);
  };
  for (const r of records) {
    const g = group(vocabKey(r.term));
    g.names.add(r.term);
    if (r.termEs) g.namesEs.add(r.termEs);
    g.recs.push(r);
  }
  for (const x of extras) {
    const g = group(vocabKey(x.term));
    g.names.add(x.term);
    if (x.termEs) g.namesEs.add(x.termEs);
    g.extras.push(x);
  }

  // Entries, keyed the way the generator keys them.
  const entries = new Map();
  for (const [name, entry] of Object.entries(terms)) {
    const key = vocabKey(name);
    if (entries.has(key)) problems.push(`${name}: duplicate key (normalises to "${key}")`);
    entries.set(key, { name, entry });
  }

  // Coverage both ways.
  for (const key of groups.keys()) {
    if (!entries.has(key)) problems.push(`"${[...groups.get(key).names][0]}": no plain definition`);
  }
  for (const { name } of entries.values()) {
    if (!groups.has(vocabKey(name)))
      problems.push(`${name}: not a vocabulary term in any lesson, the bank or the glossary`);
  }

  // Jargon universe: every grade-6 term the curriculum teaches.
  const jargonSet = new Map();
  for (const g of groups.values())
    for (const n of g.names)
      for (const v of termVariants(n)) {
        const phrase = tokensOf(v)
          .filter((t, i) => !(i === 0 && /^(the|a|an)$/.test(t)))
          .map(enStem)
          .filter(Boolean);
        if (phrase.length) jargonSet.set(phrase.join(" "), phrase);
      }
  const jargon = [...jargonSet.values()].sort((a, b) => b.length - a.length);

  const stats = {
    terms: entries.size,
    senses: 0,
    examples: 0,
    maxWords: 0,
    maxWordsTerm: "",
    maxGrade: 0,
    maxGradeTerm: "",
    maxEs: 0,
    outsideTarget: 0,
    longFormal: 0,
    rawLong: 0,
  };

  for (const [key, { name, entry }] of entries) {
    const g = groups.get(key);
    if (!g) continue;
    const ctxFor = (lessons) => {
      const recs = lessons ? g.recs.filter((r) => sameLesson(lessons, r.lessonId)) : g.recs;
      const pool = lessons ? recs : [...recs, ...g.extras];
      const authored = new Set();
      for (const r of pool) for (const n of numeralsOf(r.text)) authored.add(n);
      const lessonSet = new Set(recs.map((r) => r.lessonId));
      const allowed = new Set();
      for (const r of records) {
        if (!lessonSet.has(r.lessonId)) continue;
        for (const v of termVariants(r.term))
          allowed.add(tokensOf(v).map(enStem).filter(Boolean).join(" "));
      }
      for (const a of entry.allow || []) allowed.add(tokensOf(a).map(enStem).join(" "));
      // A definition may use the words of the term it defines ("prime factor" -> "factor").
      for (const n of [...g.names, name])
        for (const v of termVariants(n)) {
          const stems = tokensOf(v).map(enStem).filter(Boolean);
          for (const st of stems) allowed.add(st);
          allowed.add(stems.join(" "));
        }
      return { names: [...g.names, name], namesEs: [...g.namesEs], authored, jargon, allowed };
    };
    problems.push(...checkEntry(name, entry, ctxFor, (id) => lessonIds.has(id)));

    // An `allow` that no definition needs is a stale exception.
    const all = [entry, ...(entry.senses || [])];
    for (const a of entry.allow || []) {
      const stems = tokensOf(a).map(enStem);
      if (!all.some((s) => containsSequence(tokensOf(s.en).map(enStem), stems, (x, y) => x === y)))
        problems.push(`${name}: allow "${a}" is not used by any definition`);
    }

    // stats
    stats.senses += (entry.senses || []).length;
    for (const s of all) {
      if (s.example) stats.examples += 1;
      if (typeof s.en !== "string") continue;
      const n = wordCount(s.en);
      const gr = fkGrade(s.en);
      if (n > stats.maxWords) (stats.maxWords = n), (stats.maxWordsTerm = name);
      if (gr > stats.maxGrade) (stats.maxGrade = gr), (stats.maxGradeTerm = name);
      if (n < LIMITS.enTargetMin || n > LIMITS.enTargetMax) stats.outsideTarget += 1;
      stats.maxEs = Math.max(stats.maxEs, wordCount(s.es));
    }

    // Same authored wording must get the same plain sense.
    if ((entry.senses || []).length) {
      const seen = new Map();
      for (const r of g.recs) {
        const sense = (entry.senses || []).findIndex((s) =>
          sameLesson(s.lessons || [], r.lessonId),
        );
        const k = r.definition.trim();
        if (!seen.has(k)) seen.set(k, new Map());
        seen.get(k).set(sense, r.lessonId);
      }
      for (const [def, bySense] of seen)
        if (bySense.size > 1)
          problems.push(
            `${name}: lessons ${[...bySense.values()].join(", ")} share the wording "${def}" but get different plain senses`,
          );
    }
  }
  return { problems, stats };
}

/* -- family text must not restate a lesson's list differently ------------------ */

/** Lists of three or more percents in a text, each as a sorted array of numbers. */
export function percentLists(text) {
  const item = String.raw`\d+(?:[.,]\d+)?\s?%`;
  const sep = String.raw`\s*(?:,|·)?\s*(?:(?:and|or|y|o)\s+)?`;
  const re = new RegExp(`${item}(?:${sep}${item}){2,}`, "g");
  return [...String(text || "").matchAll(re)].map((m) =>
    [...m[0].matchAll(/\d+(?:[.,]\d+)?/g)]
      .map((x) => Number(x[0].replace(",", ".")))
      .sort((a, b) => a - b),
  );
}

const sameSet = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * The benchmark-percent bug: a lesson DEFINES a list ("1%, 10%, 25%, 50%, 75%,
 * 100%") and the family sidecar restates part of it ("like 10%, 25%, 50%, and
 * 75%"), so the page tells a parent two different lists. Any percent list in the
 * sidecar's learningTonight / bigIdea / watchFor that shares two or more percents
 * with a defined list must be that list.
 *
 * `lessons`: [{ id, vocab: [{term, definition, definitionEs}] , sidecar }]
 */
export function listMismatches(lessons) {
  const problems = [];
  for (const { id, vocab, sidecar } of lessons) {
    const defined = [];
    for (const v of vocab || [])
      for (const t of [v.definition, v.definitionEs])
        for (const l of percentLists(t)) defined.push({ term: v.term, list: l });
    if (!defined.length || !sidecar) continue;
    const fields = [
      ["learningTonight", sidecar.learningTonight],
      ["bigIdea", sidecar.bigIdea],
      ...(sidecar.watchFor || []).map((w, i) => [`watchFor[${i}]`, w]),
    ];
    for (const [name, value] of fields)
      for (const lang of ["en", "es"])
        for (const list of percentLists(value && value[lang])) {
          for (const d of defined) {
            const shared = list.filter((x) => d.list.includes(x)).length;
            if (shared >= 2 && !sameSet([...new Set(list)], [...new Set(d.list)]))
              problems.push(
                `${id} ${name}.${lang}: lists ${list.join("%, ")}% but "${d.term}" defines ${d.list.join("%, ")}%`,
              );
          }
        }
  }
  return [...new Set(problems)];
}

export function loadSidecarLists(root = ROOT) {
  const dir = join(root, "data", "family-homework-notes");
  const lessons = new Set(listLessonDirs());
  const out = [];
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".json"))) {
    const id = f.replace(/\.json$/, "");
    if (!lessons.has(id)) continue;
    out.push({
      id,
      vocab: loadLessonConfig(id).vocabulary || [],
      sidecar: JSON.parse(readFileSync(join(dir, f), "utf8")),
    });
  }
  return out;
}
