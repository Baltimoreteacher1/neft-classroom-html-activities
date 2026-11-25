// Teach It Back: the rule-based check. Pure and local: nothing here reads the network, a clock or the page.
// It looks for authored key-point words in the learner's text (English or Spanish, accents ignored) and reports only
// what it can quote. Every quote is a verbatim slice of the learner's text; an observation without one is dropped.
// It never judges accent, dialect, speed, spelling or the grammar of speech, never says an idea is true or false, and
// gives no score, level, percent or rank.
import { diffWords, sentences, stem, tokenize } from "../lang/text.js";

export const SHORT_WORDS = 12;
const MAX_QUOTE = 160;
const WINDOW = 70;
const EXAMPLE = /\b(for example|for instance|such as|imagine|suppose|say you|por ejemplo)\b|\d/i;
const LINK = /\b(because|so that|that is why|that's why|which means|therefore|porque|por eso)\b/i;

const fold = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/’/g, "'");

/** A light ending-stripped key so make/makes/making and law/laws match. */
export function key(word) {
  let w = fold(word);
  if (w.endsWith("ing") && w.length > 5) w = w.slice(0, -3);
  else if (w.endsWith("ed") && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith("es") && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith("s") && !w.endsWith("ss") && w.length > 3) w = w.slice(0, -1);
  if (w.endsWith("e") && w.length > 3) w = w.slice(0, -1);
  return w;
}

const compile = (entry) =>
  String(entry)
    .split("+")
    .map((part) =>
      part
        .trim()
        .split(/\s+/)
        .map((raw) => {
          const prefix = raw.endsWith("*");
          const w = fold(raw.replace(/\*$/, ""));
          return { w, prefix, k: key(w), s: stem(w) };
        }),
    );

const sameWord = (tok, a) => (a.prefix ? tok.f.startsWith(a.w) : tok.f === a.w || tok.k === a.k || tok.s === a.s);

function prepare(text) {
  const sents = sentences(text);
  const tokens = tokenize(text).map((t) => {
    const f = fold(t.lower);
    return { ...t, f, k: key(f), s: stem(f), sent: sents.findIndex((s) => t.start >= s.start && t.start < s.end) };
  });
  return { text: String(text || ""), tokens, sents };
}

/** First run of tokens matching `words`, optionally limited to one sentence. */
function findRun(tokens, words, sent = null) {
  for (let i = 0; i + words.length <= tokens.length; i++) {
    if (sent !== null && tokens[i].sent !== sent) continue;
    if (words.every((a, j) => tokens[i + j].sent === tokens[i].sent && sameWord(tokens[i + j], a))) return tokens.slice(i, i + words.length);
  }
  return null;
}

/** Where one accept entry matches: { start, end, sent } of its first part, or null. */
export function matchEntry(doc, entry) {
  const parts = compile(entry);
  if (parts.length === 1) {
    const run = findRun(doc.tokens, parts[0]);
    return run ? { start: run[0].start, end: run.at(-1).end, sent: run[0].sent } : null;
  }
  for (let s = 0; s < doc.sents.length; s++) {
    const runs = parts.map((words) => findRun(doc.tokens, words, s));
    if (runs.every(Boolean)) return { start: runs[0][0].start, end: runs[0].at(-1).end, sent: s };
  }
  return null;
}

/** The sentence around a match, or a window of it when the sentence is long. Always a verbatim slice. */
export function quoteAt(doc, at) {
  const s = doc.sents[at.sent] || { start: 0, end: doc.text.length };
  if (s.end - s.start <= MAX_QUOTE) return doc.text.slice(s.start, s.end).trim();
  let a = Math.max(s.start, at.start - WINDOW);
  let b = Math.min(s.end, at.end + WINDOW);
  if (a > s.start) a += Math.max(0, doc.text.slice(a, at.start).search(/\s/) + 1);
  if (b < s.end) b = Math.max(at.end, doc.text.slice(at.end, b).lastIndexOf(" ") + at.end);
  return doc.text.slice(a, b).trim();
}

/** Keeps only observations whose quote is a verbatim, non-empty part of the learner's text. */
export const quoted = (text, obs) => (obs && obs.quote && String(text).includes(obs.quote) ? obs : null);

export const wordsIn = (text) => tokenize(text).length;

function pointHit(doc, point) {
  for (const entry of point.accept) {
    const at = matchEntry(doc, entry);
    if (at) return { id: point.id, found: true, quote: quoteAt(doc, at) };
  }
  return { id: point.id, found: false, quote: "" };
}

function termHit(doc, concept) {
  for (const t of concept.terms) {
    const at = matchEntry(doc, t.w);
    if (at) return { term: doc.text.slice(at.start, at.end), quote: quoteAt(doc, at) };
  }
  return null;
}

const sentenceQuote = (doc, re) => {
  const i = doc.sents.findIndex((s) => re.test(doc.text.slice(s.start, s.end)));
  return i < 0 ? "" : quoteAt(doc, { sent: i, start: doc.sents[i].start, end: doc.sents[i].start });
};

/**
 * Check one explanation against a concept.
 * @returns {{words:number, empty:boolean, short:boolean, points:{id:string,found:boolean,quote:string}[],
 *   covered:string[], missing:string[], strength:object|null, nextStep:object|null}}
 */
export function analyze(concept, text, { plan = [] } = {}) {
  const doc = prepare(text);
  const words = doc.tokens.length;
  const out = { words, empty: words === 0, short: words < SHORT_WORDS, points: [], covered: [], missing: [], strength: null, nextStep: null };
  if (out.empty) {
    out.missing = concept.points.map((p) => p.id);
    return out;
  }
  out.points = concept.points.map((p) => pointHit(doc, p));
  out.covered = out.points.filter((p) => p.found).map((p) => p.id);
  out.missing = out.points.filter((p) => !p.found).map((p) => p.id);

  const first = out.points.find((p) => p.found);
  const term = termHit(doc, concept);
  const example = out.short ? "" : sentenceQuote(doc, EXAMPLE);
  const link = out.short ? "" : sentenceQuote(doc, LINK);
  const strength = first
    ? { kind: "point", pointId: first.id, quote: first.quote }
    : example
      ? { kind: "example", quote: example }
      : link
        ? { kind: "link", quote: link }
        : term
          ? { kind: "term", term: term.term, quote: term.quote }
          : null;
  out.strength = quoted(doc.text, strength);

  const last = doc.sents.at(-1);
  const anchor = last ? doc.text.slice(last.start, last.end).trim() : "";
  const next = out.missing.find((id) => plan.includes(id)) || out.missing[0];
  const nextStep = next
    ? { kind: "add-point", pointId: next, quote: anchor }
    : !example && !out.short && out.strength?.kind !== "example"
      ? { kind: "add-example", quote: anchor }
      : null;
  out.nextStep = quoted(doc.text, nextStep);
  return out;
}

/**
 * What changed between two tries. Neutral on length: it counts and lists, and never calls longer better.
 */
export function compare(concept, before, after) {
  const a = analyze(concept, before);
  const b = analyze(concept, after);
  const ops = diffWords(before, after);
  const count = (op) => ops.filter((o) => o.op === op).reduce((n, o) => n + wordsIn(o.text), 0);
  return {
    same: String(before).trim() === String(after).trim(),
    addedCount: count("add"),
    removedCount: count("del"),
    addedPhrases: ops.filter((o) => o.op === "add" && String(after).includes(o.text)).map((o) => o.text).slice(0, 4),
    newPoints: b.points.filter((p) => p.found && !a.covered.includes(p.id)).map((p) => ({ id: p.id, quote: p.quote })),
    lostPoints: a.covered.filter((id) => !b.covered.includes(id)),
    keptPoints: b.covered.filter((id) => a.covered.includes(id)),
  };
}
