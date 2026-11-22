// Word Lab depth (pure, no DOM): a word is learned in four steps, not one multiple-choice question.
//   RECOGNIZE  pick the meaning, the Spanish match or the blank (the original Word Garden questions)
//   UNDERSTAND use the word's relationships: the phrase it travels in, a synonym or antonym, which meaning is in play
//   APPLY      write a sentence of your own that shows what the word means
//   TRANSFER   use the word in a context from a different subject, by speaking or writing
// A word moves to the next step after one independent success at the current one. Success is saved with the kind of task, so the
// step is worked out from the record, never stored twice. Nothing here is random, timed or scored: the same word on the same day
// gives the same task, and the sentence check only tests what a program can honestly test (the word is used, it is a sentence).
import { DEPTH } from "../content/wordlab-depth.js";
import { dayNumber } from "./ledger.js";
import { hash, pickBy, placeAnswer, reviewQuestion } from "./wordlab.js";

export { DEPTH };
export const WORD_STAGES = ["recognize", "understand", "apply", "transfer"];
export const STAGE_INFO = {
  recognize: ["Recognize", "Reconocer", "Choose the meaning, the Spanish word or the blank."],
  understand: ["Understand", "Comprender", "Use how the word connects to other words."],
  apply: ["Apply", "Aplicar", "Write a sentence of your own."],
  transfer: ["Transfer", "Transferir", "Use the word in a new place or subject."],
};
const RECOGNIZE = ["meaning", "spanish", "sentence"];
const UNDERSTAND = ["collocation", "relation", "sense"];
const GATES = {
  recognize: RECOGNIZE,
  understand: UNDERSTAND,
  apply: ["use"],
  transfer: ["transfer"],
};

export const depthOf = (word) => DEPTH[word.w] || {};

/** Words from the target's grade band (a word marked "both" draws from every band), so a grade 3-5 task never uses grade 6-8 words. */
export const poolFor = (word, words) =>
  word.b === "both" ? words : words.filter((w) => w.b === word.b || w.b === "both");

/**
 * Where a word is on the four-step path, worked out from its saved results. A result with no `kind` is an old Word Garden
 * review, which was always a recognize task. `done` is true once the word has been transferred.
 */
export function wordStage(rec) {
  const wins = new Set();
  for (const e of [...(rec?.ev || []), ...(rec?.pr || [])])
    if (e?.ok && e.independent !== false) wins.add(e.kind || "meaning");
  for (const stage of WORD_STAGES)
    if (!GATES[stage].some((k) => wins.has(k)))
      return { stage, index: WORD_STAGES.indexOf(stage), done: false };
  return { stage: "transfer", index: 3, done: true };
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wordRe = (w) => new RegExp(`\\b${escapeRe(w.length > 5 ? w.slice(0, -1) : w)}\\w*`, "i");
const single = (s) => /^[a-z-]+$/i.test(s);

// Every phrase a bank word is known for, so a collocation blank can never be filled by a second word that also works.
let knownPhrases = null;
function phrases(words) {
  if (knownPhrases) return knownPhrases;
  knownPhrases = new Set();
  for (const w of words) for (const c of DEPTH[w.w]?.col || []) knownPhrases.add(c.toLowerCase());
  return knownPhrases;
}

function collocationTask(word, words, h) {
  const cols = depthOf(word).col || [];
  const re = wordRe(word.w);
  const phrase = cols.find((c) => re.test(c));
  if (!phrase) return null;
  const given = phrase.match(re)[0];
  const blank = phrase.replace(re, "_____");
  const known = phrases(words);
  const wrong = pickBy(
    poolFor(word, words),
    h,
    2,
    (w) =>
      w.id === word.id ||
      w.pos !== word.pos ||
      w.s === word.s ||
      known.has(blank.replace("_____", w.w).toLowerCase()) ||
      (depthOf(word).syn || []).includes(w.w),
  );
  if (wrong.length < 2) return null;
  const opts = placeAnswer(
    { text: given.toLowerCase() === word.w ? word.w : given, ok: true },
    wrong.map((w) => ({ text: w.w, ok: false })),
    h >>> 3,
  );
  return { kind: "collocation", blank, answer: given, opts };
}

function relationTask(word, words, h) {
  const d = depthOf(word);
  const syn = (d.syn || []).find(single);
  const ant = (d.ant || []).find(single);
  const rel = syn && ant ? (h % 2 ? "syn" : "ant") : syn ? "syn" : ant ? "ant" : null;
  if (!rel) return null;
  const answer = rel === "syn" ? syn : ant;
  const wrong = pickBy(poolFor(word, words), h >>> 2, 2, (w) => {
    const o = depthOf(w);
    return (
      w.id === word.id ||
      w.pos !== word.pos ||
      w.w === answer ||
      [...(d.syn || []), ...(d.ant || []), ...(o.syn || []), ...(o.ant || [])].some(
        (x) => x === w.w || x === word.w,
      )
    );
  });
  if (wrong.length < 2) return null;
  const opts = placeAnswer(
    { text: answer, ok: true },
    wrong.map((w) => ({ text: w.w, ok: false })),
    h >>> 3,
  );
  return { kind: "relation", rel, answer, opts };
}

function senseTask(word, h) {
  const mm = depthOf(word).mm;
  if (!mm) return null;
  const opts = placeAnswer({ text: mm[1], ok: true }, [{ text: word.x, ok: false }], h >>> 3);
  return { kind: "sense", other: mm[0], opts };
}

/** The question or writing task for a word on a given day, chosen by its step. Same word, same day, same task. */
export function depthTask(word, words, rec, now = Date.now()) {
  const day = dayNumber(now) || 0;
  const h = hash(`${word.id}:${day}:depth`);
  const { stage } = wordStage(rec);
  if (stage === "recognize") return { stage, ...reviewQuestion(word, poolFor(word, words), now) };
  if (stage === "understand") {
    const tasks = [
      collocationTask(word, words, h),
      relationTask(word, words, h),
      senseTask(word, h),
    ].filter(Boolean);
    if (tasks.length) return { stage, ...tasks[h % tasks.length] };
    return { stage, ...reviewQuestion(word, poolFor(word, words), now) };
  }
  if (stage === "apply") return { stage, kind: "use", model: word.x };
  const others = TRANSFER_CONTEXTS.filter((c) => c.s !== word.s);
  return { stage, kind: "transfer", model: word.x, context: others[h % others.length] };
}

/** Real places to use a word in another subject. `s` is the subject the context belongs to. */
export const TRANSFER_CONTEXTS = [
  {
    s: "ela",
    en: "a book club talking about the main character",
    es: "un club de lectura que habla del personaje principal",
  },
  {
    s: "math",
    en: "planning a budget for a class trip",
    es: "planear un presupuesto para un paseo de la clase",
  },
  {
    s: "sci",
    en: "explaining a science fair project to visitors",
    es: "explicar un proyecto de la feria de ciencias a los visitantes",
  },
  {
    s: "ss",
    en: "a town meeting about a new park",
    es: "una reunión del pueblo sobre un parque nuevo",
  },
  {
    s: "ela",
    en: "writing a review of a movie you saw",
    es: "escribir una reseña de una película que viste",
  },
  {
    s: "sci",
    en: "weather or nature you noticed on the way to school",
    es: "el clima o la naturaleza que notaste de camino a la escuela",
  },
  {
    s: "ss",
    en: "a choice your family had to make",
    es: "una decisión que tuvo que tomar tu familia",
  },
  {
    s: "math",
    en: "designing a game or an app for friends",
    es: "diseñar un juego o una aplicación para tus amigos",
  },
];

const FRAMES = {
  noun: [
    ["One example of {w} is ___.", "Un ejemplo de «{w}» es ___."],
    ["{W} matters because ___.", "«{w}» importa porque ___."],
  ],
  verb: [
    ["People {w} when ___.", "Las personas «{w}» cuando ___."],
    ["We can {w} by ___.", "Podemos «{w}» al ___."],
  ],
  adjective: [
    ["It was {w} because ___.", "Fue «{w}» porque ___."],
    ["Something {w} is ___.", "Algo «{w}» es ___."],
  ],
  adverb: [
    ["She did it {w} because ___.", "Lo hizo «{w}» porque ___."],
    ["They worked {w}, so ___.", "Trabajaron «{w}», así que ___."],
  ],
};
/** Two sentence starters for the word, in English and Spanish. The first is easier to finish. */
export function starters(word) {
  const cap = word.w[0].toUpperCase() + word.w.slice(1);
  return (FRAMES[word.pos] || FRAMES.noun).map(([en, es]) => ({
    en: en.replace("{w}", word.w).replace("{W}", cap),
    es: es.replace("{w}", word.w),
  }));
}

/**
 * Checks a learner's sentence for what a program can honestly check: it uses the word (or a form of it), it is long enough to be a
 * sentence, it ends like one, and it is not the model sentence copied. It cannot tell if the sentence is good, so the view asks
 * the learner to check meaning against the model and a short list.
 */
export function checkUse(word, text) {
  const t = String(text || "").trim();
  const count = t.split(/\s+/).filter(Boolean).length;
  const norm = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  const has = wordRe(word.w).test(t);
  const long = count >= 6;
  const punct = /[.!?]["')]?$/.test(t);
  const copied = norm(t) === norm(word.x);
  return { ok: has && long && punct && !copied, has, long, punct, copied, count };
}

/** Saves a result that does not move the spaced schedule (optional practice). Kept apart from `ev` so the 1, 3, 7, 14 day rule is untouched. */
export function practiceWord(state, id, { ok, independent, kind }, now = Date.now()) {
  state.garden ||= {};
  const rec = (state.garden[id] ||= { t: new Date(now).toISOString(), ev: [] });
  rec.pr ||= [];
  rec.pr.push({
    t: new Date(now).toISOString(),
    ok: Boolean(ok),
    independent: Boolean(independent),
    kind,
  });
  if (rec.pr.length > 40) rec.pr.splice(0, rec.pr.length - 40);
  return wordStage(rec);
}

/** Up to `n` planted words for a mixed review, the ones seen longest ago first. Not limited to words that are due. */
export function mixedSet(state, now = Date.now(), n = 6) {
  const last = (rec) =>
    [...(rec.ev || []), ...(rec.pr || [])]
      .map((e) => String(e.t))
      .sort()
      .at(-1) || String(rec.t);
  return Object.keys(state.garden || {})
    .sort(
      (a, b) => last(state.garden[a]).localeCompare(last(state.garden[b])) || a.localeCompare(b),
    )
    .slice(0, n);
}
