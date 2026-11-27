// Plan & Respond — small shared helpers for the view modules. No DOM except speak().

export const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

/** [bracketed] slots and ___ runs become visible blanks. Input is escaped first. */
export const blanks = (s) =>
  esc(s)
    .replace(/\[([^\]]+)\]/g, '<span class="cp-blank">$1</span>')
    .replace(/_{3,}/g, '<span class="cp-blank">&nbsp;</span>');

/** Per-view state, reset when the unit changes (the tab swaps st.vs). */
export function vstate(st, id, init = {}) {
  st.vs ??= {};
  st.vs[id] ??= { ...init };
  return st.vs[id];
}

function seedOf(str) {
  let h = 2166136261;
  for (const ch of String(str)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Deterministic shuffle (same seed, same order) so tests and reloads agree. Never returns the identity for n >= 2. */
export function shuffle(list, seed = "x") {
  const out = [...list];
  if (out.length < 2) return out;
  let s = seedOf(seed);
  const rnd = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let tries = 0; tries < 8; tries++) {
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    if (out.some((v, i) => v !== list[i])) break;
  }
  return out;
}

const ABBREV = /(?:\b(?:Mr|Mrs|Ms|Dr|St|Jr|Sr|vs|etc|Mt|Ft|U\.S)|\b[A-Z])\.$/;

/** Sentences of one paragraph. Keeps abbreviations like "U.S." and "Dr." together. */
function paragraphSentences(para) {
  const out = [];
  for (const piece of para.trim().split(/(?<=[.!?]["')\]]?)\s+(?=["'(\[]?[A-Z0-9¿¡])/)) {
    if (!piece) continue;
    if (out.length && ABBREV.test(out[out.length - 1])) out[out.length - 1] += ` ${piece}`;
    else out.push(piece);
  }
  return out.map((s) => s.trim()).filter(Boolean);
}

/** Paragraphs, each an array of sentences, in reading order. */
export const paragraphs = (text) =>
  String(text || "")
    .split(/\n+/)
    .map(paragraphSentences)
    .filter((p) => p.length);

/** All sentences in reading order. */
export const sentences = (text) => paragraphs(text).flat();

const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The unit's words (and their listed word-family forms) as a lookup: lower-case form -> vocab entry. */
export function termIndex(vocab) {
  const map = new Map();
  for (const v of vocab || []) {
    map.set(v.term.toLowerCase(), v);
    for (const f of v.family || [])
      if (!map.has(String(f).toLowerCase())) map.set(String(f).toLowerCase(), v);
  }
  return map;
}

function termRegex(index) {
  const forms = [...index.keys()].sort((a, b) => b.length - a.length).map(reEsc);
  return forms.length
    ? new RegExp(`(?<![\\p{L}\\p{N}])(?:${forms.join("|")})(?![\\p{L}\\p{N}])`, "giu")
    : null;
}

/** Escape raw text and wrap each unit word in wrap(matchText, vocabEntry). */
export function markTerms(raw, vocab, wrap) {
  const index = termIndex(vocab);
  const re = termRegex(index);
  const text = String(raw ?? "");
  if (!re) return esc(text);
  let out = "";
  let last = 0;
  for (const m of text.matchAll(re)) {
    out += esc(text.slice(last, m.index));
    out += wrap(esc(m[0]), index.get(m[0].toLowerCase()));
    last = m.index + m[0].length;
  }
  return out + esc(text.slice(last));
}

/** Unit words that occur in a text, in order of first appearance. */
export function termsIn(raw, vocab) {
  const index = termIndex(vocab);
  const re = termRegex(index);
  const seen = new Map();
  if (re)
    for (const m of String(raw ?? "").matchAll(re)) {
      const v = index.get(m[0].toLowerCase());
      if (!seen.has(v.term)) seen.set(v.term, v);
    }
  return [...seen.values()];
}

/** Read text aloud with the browser's own voice. Nothing leaves the device. */
export function speak(text) {
  const synth = globalThis.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === "undefined") return false;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(String(text));
  u.rate = 0.9;
  synth.speak(u);
  return true;
}
export const canSpeak = () =>
  Boolean(globalThis.speechSynthesis) && typeof SpeechSynthesisUtterance !== "undefined";

export const LEVEL_KEY = { "1_2": "l1_2", "3_4": "l3_4", "5_6": "l5_6" };
