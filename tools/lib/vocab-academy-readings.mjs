// Vocabulary Academy — Companion Reading checks (docs/vocab-academy/readings-spec.md). Pure: a reading file and its unit
// in, issues out. Every lesson (unit file) has one authored passage; this checks the SECOND reading written for it:
// a different genre, the lesson's words in new contexts, evidence questions and context-clue annotations that the
// interactive reader (src/vocab-academy/reading/) uses. Auto-checked only: facts, tone and Spanish need a person.
import { bandOfGrade, GENRES } from "../../access-practice-lab/src/vocab-academy/contract.js";
import {
  hasDoubleSpace,
  hasMojibake,
  occursIn,
  placeholderHit,
  sentenceShape,
  sentencesOf,
  wordCount,
} from "./vocab-academy-lexical.mjs";
import { gradeNumber, PASSAGE_WORDS } from "./vocab-academy-schema.mjs";
import { shingleSimilarity } from "./vocab-academy-scope.mjs";

export const READING_SCHEMA = "vocab-academy.reading.v1";
export const READING_SKILLS = ["word-meaning", "context", "inference", "evidence", "main-idea"];
export const CLUE_TYPES = ["definition", "example", "contrast", "synonym", "restatement"];
/** Fraction of the lesson's words a companion reading must use (each missing one is also listed as a warning). */
export const MIN_COVERAGE = 0.8;
/** A reading may share at most this much (5-word shingles) with the lesson's own passage. */
export const MAX_OVERLAP = 0.15;

const str = (v) => typeof v === "string" && v.trim() !== "";
const strArr = (v, min = 1) => Array.isArray(v) && v.length >= min && v.every(str);
const int = (v) => Number.isInteger(v);

/**
 * @param {object} file  parsed readings/uNN.json
 * @param {object} unit  the lesson (unit) file it belongs to
 * @param {{ fk?: (t:string)=>number }} [ctx]
 * @returns {{ issues: {sev:string, code:string, loc:string, msg:string}[], info: { words:number, fk:number|null, used:number, total:number } }}
 */
export function checkReading(file, unit, ctx = {}) {
  const issues = [];
  const uid = unit?.id ?? "?";
  const err = (code, loc, msg) =>
    issues.push({ sev: "ERROR", code, loc: `reading ${uid} ${loc}`.trim(), msg });
  const warn = (code, loc, msg) =>
    issues.push({ sev: "WARN", code, loc: `reading ${uid} ${loc}`.trim(), msg });
  const info = { words: 0, fk: null, used: 0, total: 0 };
  const done = () => ({ issues, info });

  if (!file || typeof file !== "object") {
    err("reading-shape", "", "the file is not an object");
    return done();
  }
  if (file.schema !== READING_SCHEMA)
    err("reading-shape", "schema", `schema must be "${READING_SCHEMA}"`);
  if (file.unit !== uid) err("reading-shape", "unit", `unit must be "${uid}" (got "${file.unit}")`);
  if (String(file.grade) !== String(unit.grade))
    err("reading-shape", "grade", `grade must be "${unit.grade}"`);
  if (file.n !== unit.n) err("reading-shape", "n", `n must be ${unit.n}`);
  const r = file.reading;
  if (!r || typeof r !== "object") {
    err("reading-shape", "reading", "reading is missing");
    return done();
  }
  const band = bandOfGrade(String(unit.grade));
  const early = band === "early";
  const gnum = gradeNumber(String(unit.grade));
  if (r.id !== `${uid}-r1`) err("reading-id", "id", `id must be "${uid}-r1" (got "${r.id}")`);
  if (!GENRES.includes(r.genre))
    err("reading-fields", "genre", `genre must be one of ${GENRES.join(", ")}`);
  else if (r.genre === unit.passage?.genre)
    warn(
      "reading-genre",
      "genre",
      `same genre as the lesson passage ("${r.genre}"); a companion reading should contrast it`,
    );
  if (!str(r.title)) err("reading-fields", "title", "title is empty");
  else if (r.title.length > 70) warn("reading-fields", "title", "title is over 70 characters");
  if (!str(r.purpose))
    err("reading-fields", "purpose", "purpose (one line: why read this) is empty");
  else if (r.purpose.length > 140)
    err("reading-fields", "purpose", "purpose is over 140 characters");
  if (r.listenOnly !== early)
    err(
      "reading-fields",
      "listenOnly",
      early
        ? "grades K-2 readings must be listenOnly: true"
        : "listenOnly must be false for grades 3-8",
    );

  const words = Array.isArray(unit.words) ? unit.words : [];
  const byId = new Map(words.map((w) => [w?.id, w]));
  if (!strArr(r.paras))
    err("reading-fields", "paras", "paras must be a non-empty array of strings");
  else {
    const text = r.paras.join(" ");
    const n = wordCount(text);
    info.words = n;
    const [lo, hi] = PASSAGE_WORDS[band];
    if (n < lo || n > hi)
      err("reading-length", "paras", `${n} words; the ${band} range is ${lo}-${hi}`);
    if (r.genre !== "poem")
      r.paras.forEach((para, i) => {
        const shape = sentenceShape(para);
        if (shape.length)
          err("sentence-shape", `paras[${i}]`, `${shape.join("; ")}: "${para.slice(0, 60)}"`);
      });
    const sents = sentencesOf(text);
    if (early && (sents.length < 3 || sents.length > 8))
      warn(
        "reading-length",
        "paras",
        `${sents.length} sentences; K-2 readings are 3-8 short sentences`,
      );
    if (ctx.fk) info.fk = ctx.fk(text);
    if (info.fk != null) {
      if (info.fk > gnum + 3)
        warn(
          "readability",
          "paras",
          `Flesch-Kincaid ${info.fk.toFixed(1)} is above grade ${unit.grade} + 3`,
        );
      else if (info.fk < gnum - 6)
        warn(
          "readability",
          "paras",
          `Flesch-Kincaid ${info.fk.toFixed(1)} is below grade ${unit.grade} - 6`,
        );
    }
    // the lesson's own words, used in NEW sentences
    if (!strArr(r.words)) err("reading-words", "words", "words must be an array of word ids");
    else {
      for (const id of r.words)
        if (!byId.has(id)) err("reading-words", "words", `"${id}" is not a word of this lesson`);
      const used = words.filter((w) => occursIn(text, w));
      info.used = used.length;
      info.total = words.length;
      if (words.length && used.length / words.length < MIN_COVERAGE)
        err(
          "reading-coverage",
          "words",
          `uses ${used.length} of ${words.length} lesson words; at least ${Math.ceil(MIN_COVERAGE * words.length)} are needed`,
        );
      for (const w of words)
        if (!occursIn(text, w)) warn("reading-coverage", "words", `"${w.hw}" does not appear`);
      for (const id of r.words)
        if (byId.has(id) && !occursIn(text, byId.get(id)))
          err("reading-words", "words", `"${id}" is listed but does not appear in the text`);
    }
    if (unit.passage?.paras) {
      const sim = shingleSimilarity(text, unit.passage.paras.join(" "));
      if (sim > MAX_OVERLAP)
        err(
          "reading-overlap",
          "paras",
          `shares ${(sim * 100).toFixed(0)}% of its five-word phrases with the lesson's passage; write new sentences`,
        );
    }

    // questions
    const qs = r.qs;
    const [qlo, qhi] = early ? [2, 3] : [4, 5];
    if (!Array.isArray(qs) || qs.length < qlo || qs.length > qhi)
      err(
        "reading-qs",
        "qs",
        `${early ? "K-2 readings" : "readings"} need ${qlo}-${qhi} questions`,
      );
    else {
      const ids = new Set();
      const skills = new Set();
      const answers = [];
      qs.forEach((q, i) => {
        const at = `qs[${i}]`;
        if (q.id !== `${uid}-r1-q${i + 1}`)
          err("reading-qs", `${at}.id`, `id must be "${uid}-r1-q${i + 1}"`);
        if (ids.has(q.id)) err("reading-qs", `${at}.id`, "duplicate id");
        ids.add(q.id);
        if (!READING_SKILLS.includes(q.skill))
          err("reading-qs", `${at}.skill`, `skill must be one of ${READING_SKILLS.join(", ")}`);
        skills.add(q.skill);
        if (!str(q.q)) err("reading-qs", `${at}.q`, "question text is empty");
        if (!str(q.why))
          err("reading-qs", `${at}.why`, "why (the reason the answer is right) is empty");
        const want = early ? [2, 3] : [4, 4];
        if (
          !Array.isArray(q.choices) ||
          q.choices.length < want[0] ||
          q.choices.length > want[1] ||
          !q.choices.every(str)
        )
          err("reading-qs", `${at}.choices`, `${early ? "2-3" : "exactly 4"} non-empty choices`);
        else {
          const keys = q.choices.map((c) => c.trim().toLowerCase());
          if (new Set(keys).size !== keys.length)
            err("reading-qs", `${at}.choices`, "two choices are the same");
          if (!int(q.a) || q.a < 0 || q.a >= q.choices.length)
            err("reading-qs", `${at}.a`, "a must be the index of the one right choice");
          else {
            answers.push(q.a);
            const longest = Math.max(...q.choices.map((c) => c.length));
            if (
              q.choices.length >= 4 &&
              q.choices[q.a].length === longest &&
              q.choices.filter((c) => c.length === longest).length === 1 &&
              q.skill !== "evidence"
            )
              warn(
                "reading-qs",
                `${at}.choices`,
                "the right choice is the longest; make the wrong choices as detailed",
              );
          }
        }
        if (!int(q.para) || q.para < 0 || q.para >= r.paras.length)
          err(
            "reading-qs",
            `${at}.para`,
            "para must be the paragraph (0-based) where the answer lives",
          );
        if (q.skill === "evidence") {
          const para = r.paras[q.ev?.para];
          if (
            !q.ev ||
            !int(q.ev.para) ||
            !str(para) ||
            !str(q.ev.text) ||
            !para.includes(q.ev.text)
          )
            err(
              "reading-qs",
              `${at}.ev`,
              "an evidence question needs ev { para, text } where text is copied exactly from that paragraph",
            );
          else if (!sentencesOf(para).some((s) => s.trim() === q.ev.text.trim()))
            err("reading-qs", `${at}.ev`, "ev.text must be one whole sentence of the paragraph");
          else if (q.choices?.[q.a]?.trim() !== q.ev.text.trim())
            err(
              "reading-qs",
              `${at}.ev`,
              "the right choice of an evidence question must be the ev sentence itself",
            );
        }
        if (
          q.skill === "word-meaning" &&
          !words.some((w) => occursIn(q.q, w) && r.words?.includes(w.id))
        )
          warn(
            "reading-qs",
            `${at}.q`,
            "a word-meaning question should name one of the lesson's words",
          );
      });
      if (!early) {
        if (!skills.has("word-meaning"))
          err("reading-qs", "qs", "needs at least one word-meaning question");
        if (!["evidence", "inference", "main-idea"].some((s) => skills.has(s)))
          err("reading-qs", "qs", "needs an evidence, inference or main-idea question");
      }
      if (answers.length >= 4 && new Set(answers).size === 1)
        warn("reading-qs", "qs", "every right answer is in the same position");
    }

    // context clues (the interactive "find the clue" step)
    const clues = r.clues;
    if (clues == null) {
      if (!early)
        err("reading-clues", "clues", "grades 3-8 readings need at least 2 context clues");
    } else if (!Array.isArray(clues)) err("reading-clues", "clues", "clues must be an array");
    else {
      if (!early && clues.length < 2)
        err("reading-clues", "clues", "grades 3-8 readings need at least 2 context clues");
      if (clues.length > 6) err("reading-clues", "clues", "at most 6 context clues");
      const seen = new Set();
      clues.forEach((c, i) => {
        const at = `clues[${i}]`;
        const para = r.paras[c?.para];
        if (!byId.has(c?.word) || !r.words?.includes(c?.word))
          err("reading-clues", `${at}.word`, "word must be a word id listed in words");
        else if (str(para) && !occursIn(para, byId.get(c.word)))
          err("reading-clues", `${at}.word`, "the word must appear in the clue's paragraph");
        if (seen.has(c?.word)) err("reading-clues", `${at}.word`, "one clue per word");
        seen.add(c?.word);
        if (!CLUE_TYPES.includes(c?.type))
          err("reading-clues", `${at}.type`, `type must be one of ${CLUE_TYPES.join(", ")}`);
        if (!int(c?.para) || !str(para) || !str(c?.text) || !para.includes(c.text))
          err(
            "reading-clues",
            `${at}.text`,
            "text must be copied exactly from the paragraph at para",
          );
        else if (byId.get(c.word) && occursIn(c.text, byId.get(c.word)))
          err("reading-clues", `${at}.text`, "the clue text must not contain the word it explains");
      });
    }
    if (r.retellFrame == null) {
      if (!early)
        err("reading-fields", "retellFrame", "retellFrame is required (a sentence frame with ___)");
    } else if (!str(r.retellFrame) || !r.retellFrame.includes("___"))
      err("reading-fields", "retellFrame", "retellFrame must be a sentence frame containing ___");
  }

  // text hygiene over every string
  const strings = [];
  (function walk(v, path) {
    if (typeof v === "string") strings.push([path, v]);
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (v && typeof v === "object")
      for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k);
  })(r, "reading");
  for (const [path, s] of strings) {
    if (placeholderHit(s)) err("reading-text", path, `placeholder text: "${s.slice(0, 40)}"`);
    if (hasMojibake(s)) err("reading-text", path, "garbled characters");
    if (hasDoubleSpace(s)) warn("reading-text", path, "double space");
  }
  return done();
}
