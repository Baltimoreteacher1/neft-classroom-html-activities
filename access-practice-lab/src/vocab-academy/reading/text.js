// Vocabulary Academy reader — text model. PURE: no DOM, no storage, no speech.
// A paragraph is cut two ways that both cover every character of it exactly once:
//   sentences  contiguous spans (the whitespace after a sentence belongs to that sentence), for read-along and "tap the sentence";
//   tokens     the words inside it (letters, digits, inner apostrophes and hyphens), for karaoke and "tap the phrase".
// Lesson words are found by stem and become spans over the same text, so a button can wrap whole tokens.

const ABBR = /\b(Mr|Mrs|Ms|Dr|St|Jr|Sr|vs|etc)\./g;
const MASK = "\u0001";
const TOKEN_RE = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;
const SENT_END_RE = /[.!?]+["”')\]]*\s+/g;

/** Sentence spans [{ index, start, end, text }] that partition `para` (no gaps, no overlaps). `text` includes trailing space. */
export function sentenceSpans(para) {
  const s = String(para ?? "");
  if (!s) return [];
  const masked = s.replace(ABBR, (m) => m.slice(0, -1) + MASK);
  const out = [];
  let start = 0;
  for (const m of masked.matchAll(SENT_END_RE)) {
    const end = m.index + m[0].length;
    out.push({ start, end });
    start = end;
  }
  if (start < s.length) out.push({ start, end: s.length });
  return out.map((x, index) => ({
    index,
    start: x.start,
    end: x.end,
    text: s.slice(x.start, x.end),
  }));
}

/** Word tokens [{ index, start, end, text }] in reading order. */
export function tokenSpans(para) {
  const s = String(para ?? "");
  return [...s.matchAll(TOKEN_RE)].map((m, index) => ({
    index,
    start: m.index,
    end: m.index + m[0].length,
    text: m[0],
  }));
}

/** The sentence that holds character `charIndex` (clamped to the paragraph), or -1 for an empty paragraph. */
export function sentenceAt(sentences, charIndex) {
  if (!sentences.length) return -1;
  const i = sentences.findIndex((x) => charIndex >= x.start && charIndex < x.end);
  return i >= 0 ? i : charIndex < 0 ? 0 : sentences.length - 1;
}

/**
 * The token a speech `boundary` event points at. `charIndex` is where the spoken word starts; browsers may point at the
 * space before a word or into it, so the token holding the index wins and otherwise the next token. -1 when none.
 */
export function tokenAt(tokens, charIndex) {
  if (!tokens.length || !(charIndex >= 0)) return -1;
  const inside = tokens.findIndex((t) => charIndex >= t.start && charIndex < t.end);
  if (inside >= 0) return inside;
  const next = tokens.findIndex((t) => t.start >= charIndex);
  return next;
}

/**
 * What to say for a read-along that starts at sentence `from` of paragraph `para`: one speech segment per sentence from
 * there to the end of that paragraph and on through the rest of the reading. Segments are trimmed the way speak() trims
 * them, and `lead` is the number of leading blanks removed, so a boundary's charIndex maps back with `start + lead + charIndex`.
 */
export function readAlongPlan(paras, { para = 0, sentence = 0 } = {}) {
  const plan = [];
  for (let p = Math.max(0, para); p < paras.length; p++) {
    const sents = sentenceSpans(paras[p]);
    for (const s of sents) {
      if (p === para && s.index < sentence) continue;
      const raw = s.text;
      const lead = raw.length - raw.trimStart().length;
      const text = raw.trim();
      if (text) plan.push({ para: p, sentence: s.index, start: s.start, lead, text });
    }
  }
  return plan;
}

/** Map one boundary event inside plan segment `seg` onto { para, token } given that paragraph's tokens. */
export function locateBoundary(seg, tokens, charIndex) {
  const at = seg.start + seg.lead + Math.max(0, Number(charIndex) || 0);
  return { para: seg.para, token: tokenAt(tokens, at), char: at };
}

const reEsc = (s) => String(s).replace(/[-.*+?^${}()|[\]\\]/g, "\\$&");
/** The leading stem a word's inflected forms share ("ambitious" → "ambitio"). Short words match whole. */
export const stemOf = (hw) => {
  const w = String(hw ?? "").toLowerCase();
  return w.length > 6 ? w.slice(0, -2) : w;
};

/**
 * Where the lesson's words are in a paragraph: [{ id, start, end, text }] sorted, never overlapping. A one-word headword
 * matches any token that starts with its stem and is at most four letters longer; a phrase matches its words in order.
 */
export function wordSpans(para, words) {
  const s = String(para ?? "");
  const tokens = tokenSpans(s);
  const found = [];
  for (const w of words || []) {
    const hw = String(w.hw || "")
      .trim()
      .toLowerCase();
    if (!hw) continue;
    if (/\s/.test(hw)) {
      const re = new RegExp(
        `(?<![\\p{L}\\p{N}])${hw.split(/\s+/).map(reEsc).join("\\s+")}(?![\\p{L}\\p{N}])`,
        "giu",
      );
      for (const m of s.matchAll(re))
        found.push({ id: w.id, start: m.index, end: m.index + m[0].length, text: m[0] });
      continue;
    }
    const stem = stemOf(hw);
    for (const t of tokens) {
      const low = t.text.toLowerCase();
      if (low.startsWith(stem) && low.length <= hw.length + 4)
        found.push({ id: w.id, start: t.start, end: t.end, text: t.text });
    }
  }
  found.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
  const out = [];
  let edge = -1;
  for (const f of found)
    if (f.start >= edge) {
      out.push(f);
      edge = f.end;
    }
  return out;
}

/**
 * A paragraph as pieces the renderer can draw without any further text work. Each piece is one of
 *   { kind: "gap",  start, end, text }                           whitespace/punctuation between tokens
 *   { kind: "tok",  start, end, text, token, sentence }          a plain word
 *   { kind: "word", start, end, text, wordId, sentence, tokens } a lesson word (one or more tokens)
 * Pieces are in order and together cover every character of the paragraph.
 */
export function paraPieces(para, words) {
  const s = String(para ?? "");
  const sentences = sentenceSpans(s);
  const tokens = tokenSpans(s);
  const spans = wordSpans(s, words);
  const pieces = [];
  let pos = 0;
  // Whitespace and punctuation between tokens, cut at sentence edges so a gap never belongs to two sentences.
  const gap = (to) => {
    for (const sent of sentences) {
      const from = Math.max(pos, sent.start);
      const upto = Math.min(to, sent.end);
      if (upto > from) pieces.push({ kind: "gap", start: from, end: upto, text: s.slice(from, upto), sentence: sent.index });
    }
    pos = Math.max(pos, to);
  };
  let ti = 0;
  while (ti < tokens.length) {
    const t = tokens[ti];
    const span = spans.find((w) => t.start >= w.start && t.start < w.end);
    if (span) {
      const inside = tokens.filter((x) => x.start >= span.start && x.end <= span.end);
      gap(span.start);
      pieces.push({
        kind: "word",
        start: span.start,
        end: span.end,
        text: s.slice(span.start, span.end),
        wordId: span.id,
        sentence: sentenceAt(sentences, span.start),
        tokens: inside.map((x) => x.index),
      });
      pos = span.end;
      ti += Math.max(1, inside.length);
    } else {
      gap(t.start);
      pieces.push({
        kind: "tok",
        start: t.start,
        end: t.end,
        text: t.text,
        token: t.index,
        sentence: sentenceAt(sentences, t.start),
      });
      pos = t.end;
      ti += 1;
    }
  }
  gap(s.length);
  return pieces;
}

/** Whole-reading helpers. */
export const readingText = (paras) => (paras || []).join("\n\n");
export const wordCountOf = (paras) => readingText(paras).split(/\s+/).filter(Boolean).length;

/** The distinct lesson-word ids that really occur in a reading's text, in order of first appearance. */
export function wordsMet(paras, words) {
  const seen = [];
  for (const p of paras || [])
    for (const w of wordSpans(p, words)) if (!seen.includes(w.id)) seen.push(w.id);
  return seen;
}

/** Normalise for sentence comparison: NFKC, curly quotes straightened, whitespace collapsed, case folded. */
export const norm = (t) =>
  String(t ?? "")
    .normalize("NFKC")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
