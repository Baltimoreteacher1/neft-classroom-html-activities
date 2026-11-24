// BCPSS Writing Lab (The Writing Revolution sentence-to-paragraph path) — contract + validator.
// One file per unit: db/seeds/bcpss/v2/writing/<unitId>.mjs → export default { ...writing }.
// Brief: db/seeds/bcpss/v2/WRITING_BRIEF.md. Exemplar: writing/g4-sci-u2.mjs.
//
// Shape (every array item that practices content carries `lesson` = one of lessons[].id):
//   title              catchy assignment name (2-6 words)
//   genre              "explain" | "argue" | "inform" | "narrate"
//   lessons[3-4]       { id: "A".."D", title }  the unit's lesson focuses the writing draws on
//   source             { title, text, lesson }  short ORIGINAL content text students take notes from
//   notes[3-4]         { sentence, note }  TWR note-taking: a source sentence → key words, abbreviations, symbols
//   bbs[2-3]           { lesson, kernel, because, but, so }  Because-But-So (endings start lower-case, no conjunction)
//   expand[2]          { lesson, kernel, parts{who?,what?,when?,where?,why?,how?}, model }  sentence expansion
//   fragments[4-6]     { text, is_sentence, fix? }  "Sentence or fragment?" — fix required for fragments
//   appositives[2-3]   { lesson, sentence, noun, options[3], answer, model }  sentence has "___" right after noun
//   subordinate[3]     { lesson, conjunction, stem, model }  model starts with the conjunction (TWR sub. conj.)
//   spo                Single-Paragraph Outline:
//     topic            { l1_2, l3_4, l5_6 } topic-sentence frames with [blanks]
//     starters[2-3]    { type: question|appositive|subordinate|statement|exclamation|command, text }
//     details[5-6]     { note, lesson }  key-word notes (NOT full sentences)
//     distractors[2]   off-topic notes (Starter level sorts them out)
//     conclusion       { l1_2, l3_4, l5_6 } concluding-sentence frames with [blanks]
//   prompt             { l1_2, l3_4, l5_6 }  the writing task at each WIDA band
//   transitions[6-10]  genre-fitting transition words/phrases
//   model              { l1_2, l3_4, l5_6 }  model responses (sentence counts per grade, see SENTENCE_RANGE)
//   mpo                (required grades 5-8) { thesis, paragraphs[2-3]{ topic, notes[2-4] }, conclusion }
//   revise[3-5]        unit-specific revision checks ("Did I name the amplitude in centimeters?")
//   tip                ONE short teacher sentence
import { BANNED_PHRASES } from "./schema.mjs";

export const WRITING_GENRES = ["explain", "argue", "inform", "narrate"];
export const WRITING_LEVELS = ["l1_2", "l3_4", "l5_6"];
export const STARTER_TYPES = ["question", "appositive", "subordinate", "statement", "exclamation", "command"];
export const SUBORDINATORS = ["after", "although", "as", "because", "before", "even though", "if", "once", "since", "unless", "until", "when", "whenever", "where", "while"];
const PART_KEYS = ["who", "what", "when", "where", "why", "how"];

// Model length (sentences) by grade band, per level.
const SENTENCE_RANGE = {
  k2: { l1_2: [1, 3], l3_4: [2, 4], l5_6: [3, 5] },
  g35: { l1_2: [2, 4], l3_4: [4, 6], l5_6: [5, 8] },
  g68: { l1_2: [3, 4], l3_4: [5, 7], l5_6: [6, 10] },
};
const SOURCE_WORDS = { k2: [25, 90], g35: [60, 170], g68: [90, 230] };
const AVG_WORDS = { K: 8, 1: 10, 2: 11, 3: 14, 4: 16, 5: 18, 6: 19, 7: 21, 8: 23 };

const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean);
const isStr = (v, min = 1) => typeof v === "string" && v.trim().length >= min;
const isArr = (v, min = 0, max = Infinity) => Array.isArray(v) && v.length >= min && v.length <= max;
const leveled = (v, min = 8) => v && typeof v === "object" && WRITING_LEVELS.every((l) => isStr(v[l], min));
const hasBlank = (s) => /\[[^\]]+\]/.test(String(s));
const sentencesOf = (t) =>
  String(t || "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => words(s).length > 1);

export function writingBand(grade) {
  const g = String(grade).toUpperCase();
  if (g === "K" || g === "1" || g === "2") return "k2";
  return Number(g) >= 6 ? "g68" : "g35";
}

export function validateWriting(unit, w) {
  const problems = [];
  const add = (m) => problems.push(`${unit.id} (writing): ${m}`);
  if (!w || typeof w !== "object") return [`${unit.id} (writing): missing writing content`];
  const band = writingBand(unit.grade);
  const grade = String(unit.grade).toUpperCase();

  if (!(isStr(w.title, 4) && words(w.title).length <= 6)) add("title: 2-6 words");
  if (!WRITING_GENRES.includes(w.genre)) add(`genre must be one of ${WRITING_GENRES.join("|")}`);
  if (!isStr(w.tip, 10) || words(w.tip).length > 30) add("tip: one teacher sentence, max 30 words");

  const lessonIds = new Set();
  if (!isArr(w.lessons, 3, 4)) add("lessons: 3-4 {id, title}");
  for (const l of w.lessons || []) {
    if (!(isStr(l.id) && isStr(l.title, 6))) add(`lesson needs id + title: ${JSON.stringify(l)}`);
    lessonIds.add(l.id);
  }
  const used = new Set();
  const lessonRef = (item, ctx) => {
    if (!lessonIds.has(item?.lesson)) add(`${ctx}: lesson "${item?.lesson}" is not a lessons[].id`);
    else used.add(item.lesson);
  };

  const s = w.source;
  if (!(s && isStr(s.title, 3) && isStr(s.text, 40))) add("source {title, text, lesson}");
  else {
    lessonRef(s, "source");
    const n = words(s.text).length;
    const [lo, hi] = SOURCE_WORDS[band];
    if (n < lo || n > hi) add(`source.text is ${n} words; grade ${grade} wants ${lo}-${hi}`);
  }

  if (!isArr(w.notes, 3, 4)) add("notes: 3-4 {sentence, note}");
  for (const n of w.notes || []) {
    if (!(isStr(n.sentence, 15) && isStr(n.note, 3))) add("note item needs sentence + note");
    else if (words(n.note).length >= words(n.sentence).length) add(`note "${n.note}" must be shorter than its sentence (key words only)`);
    else if (/[!?]$/.test(n.note.trim()) || /\b[a-z]{5,}\.$/i.test(n.note.trim())) add(`note "${n.note}" is written as a sentence; use key words, no end punctuation`);
  }

  if (!isArr(w.bbs, 2, 3)) add("bbs: 2-3 {lesson, kernel, because, but, so}");
  for (const b of w.bbs || []) {
    lessonRef(b, `bbs "${b?.kernel}"`);
    if (!isStr(b.kernel, 8) || /[.!?,]$/.test(b.kernel.trim())) add(`bbs kernel "${b?.kernel}" needs text with no end punctuation`);
    for (const c of ["because", "but", "so"]) {
      const v = String(b[c] || "").trim();
      if (!isStr(v, 6)) add(`bbs "${b?.kernel}" missing ${c} ending`);
      else if (/^(because|but|so)\b/i.test(v)) add(`bbs ${c} ending "${v}" must not repeat the conjunction`);
      else if (/^[A-Z]/.test(v) && !/^(I|[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b/.test(v)) add(`bbs ${c} ending "${v}" should start lower-case (proper nouns are fine)`);
      else if (!/[.!?]$/.test(v)) add(`bbs ${c} ending "${v}" must end with punctuation`);
    }
  }

  if (!isArr(w.expand, 2, 2)) add("expand: exactly 2 {lesson, kernel, parts, model}");
  for (const e of w.expand || []) {
    lessonRef(e, `expand "${e?.kernel}"`);
    const keys = Object.keys(e.parts || {});
    if (!(isStr(e.kernel, 4) && words(e.kernel).length <= 6)) add(`expand kernel "${e?.kernel}" must be a short kernel (max 6 words)`);
    if (keys.length < 3 || keys.some((k) => !PART_KEYS.includes(k) || !isStr(e.parts[k], 2))) add(`expand "${e?.kernel}" parts: 3+ of ${PART_KEYS.join("/")}`);
    if (!isStr(e.model, 20) || words(e.model).length <= words(e.kernel).length + 3) add(`expand "${e?.kernel}" model must be the expanded sentence`);
  }

  if (!isArr(w.fragments, 4, 6)) add("fragments: 4-6 {text, is_sentence, fix?}");
  else {
    const kinds = new Set(w.fragments.map((f) => f.is_sentence === true));
    if (kinds.size < 2) add("fragments must mix sentences and fragments");
    for (const f of w.fragments) {
      if (!isStr(f.text, 4) || typeof f.is_sentence !== "boolean") add(`fragment item needs text + is_sentence: ${JSON.stringify(f)}`);
      else if (!f.is_sentence && !isStr(f.fix, 8)) add(`fragment "${f.text}" needs a fix (the complete sentence)`);
    }
  }

  if (!isArr(w.appositives, 2, 3)) add("appositives: 2-3 {lesson, sentence, noun, options, answer, model}");
  for (const a of w.appositives || []) {
    lessonRef(a, `appositive "${a?.noun}"`);
    const ok = isStr(a.sentence) && (a.sentence.includes(", ___,") || a.sentence.includes(", ___."));
    if (!ok) add(`appositive sentence must contain ", ___," (or ", ___." at the end): "${a?.sentence}"`);
    if (!(isStr(a.noun) && String(a.sentence).includes(a.noun))) add(`appositive noun "${a?.noun}" must appear in the sentence`);
    if (!(isArr(a.options, 3, 3) && Number.isInteger(a.answer) && a.answer >= 0 && a.answer < 3)) add(`appositive "${a?.noun}" needs 3 options + answer index`);
    else if (!String(a.model || "").includes(a.options[a.answer])) add(`appositive model must use the right option "${a.options[a.answer]}"`);
  }

  if (!isArr(w.subordinate, 3, 3)) add("subordinate: exactly 3 {lesson, conjunction, stem, model}");
  for (const x of w.subordinate || []) {
    lessonRef(x, `subordinate "${x?.conjunction}"`);
    const c = String(x.conjunction || "").toLowerCase();
    if (!SUBORDINATORS.includes(c)) add(`subordinate conjunction "${x?.conjunction}" not in ${SUBORDINATORS.join(", ")}`);
    if (!isStr(x.stem, 6) || /[.!?]$/.test(x.stem.trim())) add(`subordinate "${x?.conjunction}" stem: the main clause students attach to, no end punctuation`);
    if (!String(x.model || "").toLowerCase().startsWith(c) || !String(x.model).includes(",")) add(`subordinate model must start with "${x?.conjunction}" and use a comma`);
  }

  const p = w.spo;
  if (!p) add("spo required");
  else {
    if (!leveled(p.topic) || !WRITING_LEVELS.every((l) => hasBlank(p.topic[l]))) add("spo.topic {l1_2,l3_4,l5_6} frames with [blanks]");
    if (!leveled(p.conclusion) || !WRITING_LEVELS.every((l) => hasBlank(p.conclusion[l]))) add("spo.conclusion {l1_2,l3_4,l5_6} frames with [blanks]");
    if (!isArr(p.starters, 2, 3) || !p.starters.every((x) => STARTER_TYPES.includes(x.type) && isStr(x.text, 12))) add(`spo.starters: 2-3 {type: ${STARTER_TYPES.join("|")}, text}`);
    if (!isArr(p.details, 5, 6)) add("spo.details: 5-6 {note, lesson}");
    for (const d of p.details || []) {
      lessonRef(d, `spo detail "${d?.note}"`);
      if (!isStr(d.note, 3) || words(d.note).length > 9 || /[.!?]$/.test(d.note.trim())) add(`spo detail "${d?.note}" must be key-word notes (max 9 words, no end punctuation)`);
    }
    if (!isArr(p.distractors, 2, 2) || !p.distractors.every((d) => isStr(d, 3))) add("spo.distractors: exactly 2 off-topic notes");
  }

  if (!leveled(w.prompt, 20)) add("prompt {l1_2,l3_4,l5_6}");
  if (!isArr(w.transitions, 6, 10)) add("transitions: 6-10");
  if (!leveled(w.model, 20)) add("model {l1_2,l3_4,l5_6}");
  else
    for (const l of WRITING_LEVELS) {
      const n = sentencesOf(w.model[l]).length;
      const [lo, hi] = SENTENCE_RANGE[band][l];
      if (n < lo || n > hi) add(`model.${l} has ${n} sentences; grade ${grade} wants ${lo}-${hi}`);
    }
  if (band !== "k2" && Number(grade) >= 5) {
    const m = w.mpo;
    if (!(m && isStr(m.thesis, 20) && isStr(m.conclusion, 20) && isArr(m.paragraphs, 2, 3) && m.paragraphs.every((x) => isStr(x.topic, 10) && isArr(x.notes, 2, 4)))) add("mpo {thesis, paragraphs[2-3]{topic, notes[2-4]}, conclusion} required for grades 5-8");
  }
  if (!isArr(w.revise, 3, 5) || !w.revise.every((r) => isStr(r, 10))) add("revise: 3-5 unit-specific checks");
  for (const id of lessonIds) if (!used.has(id)) add(`lesson ${id} is never practiced`);

  const blob = JSON.stringify(w).toLowerCase();
  for (const phrase of BANNED_PHRASES) if (blob.includes(phrase)) add(`contains banned phrase "${phrase}"`);
  for (const re of [/\besol\b/, /\bwida\b/, /\bsyntax\b/]) if (re.test(blob)) add(`contains banned word ${re}`);

  const readable = [s?.text, ...WRITING_LEVELS.map((l) => w.model?.[l])].filter(Boolean).join(" ");
  const ss = sentencesOf(readable);
  if (ss.length) {
    const avg = ss.reduce((n, x) => n + words(x).length, 0) / ss.length;
    const limit = AVG_WORDS[grade] ?? 19;
    if (avg > limit) add(`source + models average ${avg.toFixed(1)} words/sentence; grade ${grade} max is ${limit}`);
  }
  return problems;
}
