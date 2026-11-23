// Vocabulary Academy games — pure text helpers (no DOM). Everything here is deterministic and
// importable from Node tests. Word forms, sentence splitting, masking and clue-token rules.

export const STOP = new Set(
  "a an the and or but so if of to in on at by for with from as is are was were be been being it its it's this that these those he she they we you i me my your his her their our him them us not no do does did has have had will would can could should may might must than then there here also very just into out up down over under about after before when while because until since although too more most much many some any all each every one two who what which where why how".split(
    " ",
  ),
);

export const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[‘’]/g, "'")
    .trim();
export const same = (a, b) => norm(a) === norm(b);
export const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
export const uniq = (list) => [...new Set(list)];
export const esc2 = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Split prose into sentences (keeps closing quotes with the sentence). */
export function sentencesOf(text) {
  const out = String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?]["”']?)\s+(?=["“']?[A-Z0-9])/);
  return out.map((s) => s.trim()).filter(Boolean);
}

/** Word tokens with their character positions: [{ t, i, w }]. w=true for a word (letters/apostrophes/hyphens). */
export function tokenize(text) {
  const out = [];
  const re = /[A-Za-zÀ-ɏ][A-Za-zÀ-ɏ'’-]*|\d+|[^\sA-Za-z\d]+|\s+/g;
  let m;
  let i = 0;
  while ((m = re.exec(text))) {
    const t = m[0];
    const w = /^[A-Za-zÀ-ɏ\d]/.test(t);
    out.push({ t, i: i++, w, space: /^\s+$/.test(t) });
  }
  return out;
}
export const isContent = (t) => {
  const n = norm(t).replace(/^['-]+|['-]+$/g, "");
  return n.length > 2 && !STOP.has(n) && /[a-z]/.test(n);
};

/** Surface forms a headword can take in text (inflections + the word's own family list + base). */
export function formsOf(word) {
  const hw = norm(word.hw);
  const f = new Set([hw]);
  const add = (x) => x && f.add(norm(x));
  if (/e$/.test(hw)) {
    add(`${hw}d`);
    add(`${hw.slice(0, -1)}ing`);
    add(`${hw}s`);
    add(`${hw}r`);
    add(`${hw}st`);
  } else if (/[^aeiou]y$/.test(hw)) {
    const b = hw.slice(0, -1);
    ["ies", "ied", "ier", "iest", "ily", "iness"].forEach((s) => add(b + s));
    add(`${hw}ing`);
  } else {
    ["s", "es", "ed", "ing", "er", "est", "ly"].forEach((s) => add(hw + s));
    if (/[^aeiou][aeiou][^aeiouwxy]$/.test(hw)) {
      add(`${hw}${hw.slice(-1)}ed`);
      add(`${hw}${hw.slice(-1)}ing`);
    }
  }
  for (const fam of word.family || []) add(fam.w);
  for (const seg of word.morph?.segs || []) if (seg.t === "base" && seg.s.length > 3) add(seg.s);
  for (const x of word.forms || []) add(x);
  return [...f].filter((x) => x.length > 0).sort((a, b) => b.length - a.length);
}
const formRe = (word) => new RegExp(`(?<![A-Za-z])(?:${formsOf(word).map(esc2).join("|")})(?![A-Za-z])`, "i");

/** First occurrence of any form of `word` in `text`: { index, length, form } or null. */
export function findForm(text, word) {
  const m = formRe(word).exec(String(text || ""));
  return m ? { index: m.index, length: m[0].length, form: m[0] } : null;
}
/** Replace the first form of the word with a blank. found=false when the word is not in the text. */
export function maskForm(text, word, blank = "___") {
  const hit = findForm(text, word);
  if (!hit) return { text, found: false, form: "" };
  return {
    text: text.slice(0, hit.index) + blank + text.slice(hit.index + hit.length),
    found: true,
    form: hit.form,
  };
}
/** True when any of the word's forms appears in the text (used to keep answers out of stems). */
export const mentions = (text, word) => Boolean(findForm(text, word));

/** Mask every target word (for example sentences that must not give the answer away). */
export function maskAll(text, words, blank = "___") {
  let out = text;
  for (const w of words) out = maskForm(out, w, blank).text;
  return out;
}
export const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
export const stripEnd = (s) => clean(s).replace(/[.!?]+$/, "");
export const wordsIn = (s) => (String(s).match(/[A-Za-zÀ-ɏ'-]+/g) || []).length;
