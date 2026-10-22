// Text primitives for the language engine. Pure, dependency-free, deterministic.
// Everything the engine reports points back at a span of the student's own text.

const ABBR = /\b(?:Mr|Mrs|Ms|Dr|St|Jr|Sr|vs|etc|e\.g|i\.e|U\.S|No)\.$/i;

/** Tokens with character offsets: [{ text, lower, start, end }]. Keeps apostrophes and hyphens inside words. */
export function tokenize(text) {
  const out = [];
  const re = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu;
  for (const m of String(text || "").matchAll(re))
    out.push({ text: m[0], lower: m[0].toLowerCase().replace(/’/g, "'"), start: m.index, end: m.index + m[0].length });
  return out;
}

/** Sentences with offsets: [{ text, start, end }]. Respects decimals (2.5), abbreviations (Dr.), and ?!. runs. */
export function sentences(text) {
  const s = String(text || "");
  const out = [];
  let start = 0;
  const push = (end) => {
    const raw = s.slice(start, end);
    const lead = raw.length - raw.trimStart().length;
    const t = raw.trim();
    if (t) out.push({ text: t, start: start + lead, end: start + lead + t.length });
  };
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "\n" && s[i + 1] === "\n") {
      push(i);
      start = i + 1;
      continue;
    }
    if (!/[.!?]/.test(c)) continue;
    let j = i;
    while (j + 1 < s.length && /[.!?"')\]]/.test(s[j + 1])) j++;
    const next = s[j + 1];
    if (next !== undefined && !/\s/.test(next)) {
      i = j;
      continue; // 2.5, e.g.com, "...word.Word" typed without space is treated as one sentence
    }
    const upTo = s.slice(start, j + 1);
    if (c === "." && ABBR.test(upTo.trimEnd())) {
      i = j;
      continue;
    }
    push(j + 1);
    start = j + 1;
    i = j;
  }
  push(s.length);
  return out;
}

export const wordCount = (text) => tokenize(text).length;

const STOP = new Set(
  "a an the and or but so if then than that this these those of to in on at by for with from as is are was were be been being am do does did have has had i you he she it we they me him her us them my your his its our their not no yes can could will would should may might must there here what which who whom whose when where why how also very just about into over under up down out off again more most some any each other such only own same too s t don didn doesn isn wasn aren weren haven hasn hadn won wouldn couldn shouldn".split(
    " ",
  ),
);
export const isStop = (w) => STOP.has(w);

/** Crude suffix stripper: groups "pollutes/polluted/polluting/pollution" well enough to match source terms. */
export function stem(w) {
  let x = String(w).toLowerCase();
  if (x.length <= 3) return x;
  for (const [suf, rep] of [
    ["ational", "ate"], ["ization", "ize"], ["ations", "ate"], ["ation", "ate"], ["ities", "ity"],
    ["ness", ""], ["ments", ""], ["ment", ""], ["ingly", ""], ["edly", ""], ["ies", "y"], ["ing", ""],
    ["ed", ""], ["es", ""], ["s", ""], ["ly", ""],
  ]) {
    if (x.endsWith(suf) && x.length - suf.length >= 3) {
      x = x.slice(0, -suf.length) + rep;
      break;
    }
  }
  return x;
}

/** Content-word stems of a text (stopwords removed). */
export function contentStems(text) {
  return tokenize(text).filter((t) => !isStop(t.lower) && t.lower.length > 2).map((t) => stem(t.lower));
}

/** Find a phrase (case-insensitive, whole words, flexible whitespace/hyphen) in text → [{start,end,text}]. */
export function findPhrase(text, phrase) {
  const p = String(phrase || "").trim();
  if (!p) return [];
  const esc = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/[\s-]+/g, "[\\s-]+");
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${esc}(?![\\p{L}\\p{N}])`, "giu");
  return [...String(text).matchAll(re)].map((m) => ({ start: m.index, end: m.index + m[0].length, text: m[0] }));
}

/** Numbers (including 2.5, 1,200, 40%) as a normalised set — used to check evidence from data. */
export function numbersIn(text) {
  return [...String(text || "").matchAll(/\d[\d,]*(?:\.\d+)?%?/g)].map((m) => ({
    value: m[0].replace(/,/g, ""),
    start: m.index,
    end: m.index + m[0].length,
    text: m[0],
  }));
}

const VOWEL_GROUP = /[aeiouy]+/g;
export function syllables(word) {
  const w = String(word).toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  let n = (w.match(VOWEL_GROUP) || []).length;
  if (w.endsWith("e") && !w.endsWith("le") && n > 1) n--;
  return Math.max(1, n);
}

/** Flesch-Kincaid grade level for a passage — used by the item-quality validator, never shown to students. */
export function fleschKincaid(text) {
  const sents = sentences(text);
  const toks = tokenize(text);
  if (!sents.length || !toks.length) return 0;
  const syl = toks.reduce((n, t) => n + syllables(t.text), 0);
  return 0.39 * (toks.length / sents.length) + 11.8 * (syl / toks.length) - 15.59;
}

export const clip = (text, start, end, pad = 0) =>
  String(text).slice(Math.max(0, start - pad), Math.min(String(text).length, end + pad));

/** Word-level diff between two drafts: [{ op: "same"|"add"|"del", text }]. LCS on tokens, deterministic. */
export function diffWords(before, after) {
  const a = String(before || "").match(/\S+/g) || [];
  const b = String(after || "").match(/\S+/g) || [];
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = [];
  let i = 0;
  let j = 0;
  const emit = (op, text) => {
    const last = out[out.length - 1];
    if (last && last.op === op) last.text += ` ${text}`;
    else out.push({ op, text });
  };
  while (i < m && j < n) {
    if (a[i] === b[j]) emit("same", a[i++], j++);
    else if (dp[i + 1][j] >= dp[i][j + 1]) emit("del", a[i++]);
    else emit("add", b[j++]);
  }
  while (i < m) emit("del", a[i++]);
  while (j < n) emit("add", b[j++]);
  return out;
}
