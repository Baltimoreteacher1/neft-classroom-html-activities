// Vocabulary Academy activity engines — shared helpers: ctx normalisation, word forms, distractor pools,
// deterministic choice placement and the item factory. Pure (no DOM), so tests run in node.
import { bandOfGrade } from "../contract.js";
import { rngFor } from "../rng.js";
import { makeI18n } from "../../i18n.js";

export const gradeNum = (g) => (String(g).toUpperCase() === "K" ? 0 : Number(g) || 0);
export const POS_NAME = {
  n: ["noun", "sustantivo"],
  v: ["verb", "verbo"],
  adj: ["adjective", "adjetivo"],
  adv: ["adverb", "adverbio"],
  prep: ["preposition", "preposición"],
  conj: ["conjunction", "conjunción"],
  pron: ["pronoun", "pronombre"],
  phr: ["phrase", "frase"],
};

/** Fill in every ctx default so engines never branch on missing keys. */
export function normCtx(ctx = {}, unit) {
  const grade = String(ctx.grade ?? ctx.unit?.grade ?? unit?.grade ?? "6");
  const band = ctx.band || bandOfGrade(grade);
  return {
    ...ctx,
    grade,
    band,
    early: band === "early",
    supports: ctx.supports || {},
    I: ctx.I || makeI18n("en"),
    unit: ctx.unit || unit,
  };
}

// ── text helpers ────────────────────────────────────────────────────────────
export const lcFirst = (s) => (s ? s[0].toLowerCase() + s.slice(1) : s);
export const capFirst = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
export const noDot = (s) => String(s || "").replace(/[.!?]+\s*$/, "");
export const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9' -]/g, "")
    .replace(/\s+/g, " ")
    .trim();
export const escRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const countWords = (t) =>
  (String(t || "").match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;
export function splitSentences(text) {
  return (String(text || "").match(/[^.!?]+[.!?]+["”’')]*\s*|[^.!?]+$/g) || [])
    .map((s) => s.trim())
    .filter(Boolean);
}

// ── word forms ──────────────────────────────────────────────────────────────
function inflections(w) {
  const out = new Set([w]);
  const add = (...xs) => xs.forEach((x) => out.add(x));
  if (w.length < 2) return [...out];
  const last = w.at(-1);
  const stem = w.slice(0, -1);
  add(`${w}s`, `${w}es`, `${w}ed`, `${w}ing`, `${w}er`, `${w}est`, `${w}ly`, `${w}ness`);
  if (last === "e") add(`${w}d`, `${w}r`, `${w}rs`, `${w}st`, `${stem}ing`, `${stem}ish`);
  if (w.endsWith("le")) add(`${w.slice(0, -1)}y`);
  if (last === "y")
    add(`${stem}ies`, `${stem}ied`, `${stem}ier`, `${stem}iest`, `${stem}ily`, `${stem}iness`);
  if (w.endsWith("ic")) add(`${w}ally`);
  if (/[^aeiou][aeiou][^aeiouwxy]$/.test(w))
    add(`${w}${last}ed`, `${w}${last}ing`, `${w}${last}er`);
  return [...out];
}
/** Every surface form of a word we are willing to recognise in writing. */
export function formList(word) {
  const hw = String(word.hw || "").toLowerCase();
  const set = new Set();
  const parts = hw.split(/\s+/);
  for (const v of inflections(parts[0])) set.add([v, ...parts.slice(1)].join(" "));
  for (const f of word.family || [])
    if (f?.w) inflections(String(f.w).toLowerCase()).forEach((x) => set.add(x));
  return [...set].sort((a, b) => b.length - a.length);
}
export const formsSource = (forms) =>
  `\\b(?:${forms.map((f) => escRe(f).replace(/ /g, "\\s+")).join("|")})\\b`;
export const formsRegex = (word, flags = "gi") => new RegExp(formsSource(formList(word)), flags);
export const hasForm = (text, word) => formsRegex(word, "i").test(String(text || ""));
export const maskWord = (text, word, blank = "___") =>
  String(text || "").replace(formsRegex(word), blank);
/** The surface form of `word` found in `text` (lowercased), or "". */
export const formIn = (text, word) =>
  (String(text || "").match(formsRegex(word, "i")) || [""])[0].toLowerCase();
/** JSON-safe target descriptor stored on writing items so gradeItem needs no word lookups. */
export const targetOf = (word, { syn = false } = {}) => {
  const forms = formList(word);
  if (syn) for (const s of word.syn || []) forms.push(String(s).toLowerCase());
  return { id: word.id, hw: word.hw, re: formsSource(forms) };
};

/** How a cloze answer relates to its headword: "" for the headword, "ly", "ed", … or null if unrelated. */
export function shapeOf(word, surface) {
  const hw = String(word.hw).toLowerCase();
  const f = String(surface || "").toLowerCase();
  if (f === hw) return "";
  for (const stem of [hw, hw.slice(0, -1), hw.replace(/y$/, "i")])
    if (stem.length > 2 && f.startsWith(stem)) return f.slice(stem.length) || "";
  return null;
}
/** A form of `word` that fits the same slot as `surface` (a form of `target`), or null. */
export function fitForm(word, target, surface) {
  const shape = shapeOf(target, surface);
  if (shape === "") return word.hw;
  if (shape == null) return null;
  const hw = word.hw.toLowerCase();
  const pool = [word.cloze?.f, word.cloze2?.f, ...(word.family || []).map((x) => x.w)].filter(
    Boolean,
  );
  const hit = pool.find((x) => shapeOf(word, x) === shape);
  if (hit) return hit;
  const guess = hw.endsWith("e") && /^[aeiouy]/.test(shape) ? hw.slice(0, -1) + shape : hw + shape;
  return /^(s|es|ed|ing|ly|er|est)$/.test(shape) ? guess : null;
}

// ── pools ───────────────────────────────────────────────────────────────────
export const wordsOf = (unit, ctx) => {
  const only = ctx?.onlyWords ? new Set(ctx.onlyWords) : null;
  return (unit.words || []).filter((w) => !only || only.has(w.id));
};
export function poolOf(unit, ctx) {
  const seen = new Set();
  const out = [];
  for (const w of [...(unit.words || []), ...(ctx.pool || [])])
    if (w?.id && !seen.has(w.id)) {
      seen.add(w.id);
      out.push(w);
    }
  return out;
}
export const groupIndex = (unit, word) =>
  (unit.relations?.groups || []).findIndex((g) => (g.ids || []).includes(word.id));
export const visualOf = (word) => Boolean(word?.visual && word.visual.kind !== "none");
export const isOpposite = (x, w) => Boolean(x.ant?.includes(w.hw) || w.ant?.includes(x.hw));
export const isSynonymish = (x, w) =>
  Boolean(
    w.syn?.includes(x.hw) ||
    x.syn?.includes(w.hw) ||
    (x.syn || []).some((s) => (w.syn || []).includes(s)),
  );

/** Other words ordered most-plausible first: same group + part of speech, then same pos, then the rest. */
export function nearWords(c, word, { far = false } = {}) {
  const g = groupIndex(c.unit, word);
  const tier = (x) => {
    const sameGroup = g >= 0 && groupIndex(c.unit, x) === g;
    const samePos = x.pos === word.pos;
    const inUnit = c.words.some((u) => u.id === x.id);
    return (sameGroup ? 0 : 2) + (samePos ? 0 : 4) + (inUnit ? 0 : 1);
  };
  const others = c.pool.filter((x) => x.id !== word.id);
  const shuffled = c.rng.shuffle(others);
  const key = (x) =>
    far
      ? (groupIndex(c.unit, x) === g && g >= 0 ? 8 : 0) +
        (x.pos === word.pos ? 0 : 4) +
        (c.words.some((u) => u.id === x.id) ? 0 : 1)
      : tier(x);
  return shuffled.sort((a, b) => key(a) - key(b));
}

// ── choice placement ────────────────────────────────────────────────────────
/** Shuffle correct + distractors deterministically; null when fewer than `minWrong` distinct distractors remain. */
export function place(rng, correct, wrongs, n, minWrong = 2) {
  const seen = new Set([norm(correct)]);
  const take = [];
  for (const w of wrongs) {
    const k = norm(w);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    take.push(w);
    if (take.length >= n - 1) break;
  }
  if (take.length < minWrong) return null;
  const choices = rng.shuffle([correct, ...take]);
  return { choices, answer: choices.indexOf(correct) };
}

export const relHint = (word, lead = "This word is about") =>
  word.rel ? `${lead}: ${word.rel}.` : "";

// ── item factory ────────────────────────────────────────────────────────────
export function makeContext(type, unit, ctx, rng, extra = {}) {
  const c0 = normCtx(ctx, unit);
  const words = wordsOf(unit, c0);
  return {
    type,
    unit,
    ctx: c0,
    rng,
    band: c0.band,
    early: c0.early,
    words,
    pool: poolOf(unit, c0),
    n: c0.early || c0.supports?.chunked ? 3 : 4,
    I: c0.I,
    ...extra,
  };
}
export function item(c, fields) {
  const t = c.type;
  const base = {
    id: `${c.unit.id}:${t.id}:${c.key}${c.ctx.salt ? `:${c.ctx.salt}` : ""}`,
    type: t.id,
    wordId: c.word?.id ?? null,
    dim: t.dim,
    domain: t.domain,
    mode: t.mode,
  };
  const out = { ...base, ...fields };
  if (c.early) out.audio = true;
  return out;
}
export const rngForItem = (unit, ctx, typeId, key) =>
  rngFor(`${unit.id}|${typeId}|${key}${ctx?.salt ? `|${ctx.salt}` : ""}`);

export function uniqueByStem(items) {
  const seen = new Set();
  return items.filter((it) => {
    const k = it.stem;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
export const answerText = (it) =>
  it.mode === "typed"
    ? it.answer?.[0]
    : it.mode === "choice" && it.choices
      ? it.choices[it.answer]
      : null;

export const esOf = (w) => (w?.es?.gloss ? { hw: w.hw, gloss: w.es.gloss } : undefined);
/** Common fields every word-scoped item carries: the word the supports (picture, Spanish gloss) belong to. */
export const wordExtras = (c, w = c.word) => ({
  focus: w?.id,
  es: esOf(w),
  ...(c.early && visualOf(w) ? { visual: w.id } : {}),
});
/** Multiple-choice item with deterministic placement; null when too few plausible distractors exist. */
export function mc(c, { correct, wrongs, minWrong, ...fields }) {
  const p = place(c.rng, correct, wrongs, c.n, minWrong);
  if (!p) return null;
  return item(c, { ...(c.word ? wordExtras(c) : {}), ...fields, ...p });
}
export const defsOf = (words) => words.map((x) => x.def).filter(Boolean);
