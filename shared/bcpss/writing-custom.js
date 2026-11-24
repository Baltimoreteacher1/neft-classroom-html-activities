// Writing Lab customization — ONE format for the interactive page (bcpss-teachers/writing-lab/) and the printed
// packets (functions/_lib/bcpss/studio-doc-writing.js via the export endpoint). A teacher edits the task, sentence
// starters, transitions and extra words; the edits travel as a small URL parameter (?c=...) so students open the
// same version on their own devices. Nothing is stored on a server and no student data is involved.
//
// Shape (every field optional):
//   { v: 1, title, note, prompt: {l1_2,l3_4,l5_6}, topic: {..}, conclusion: {..}, starters: [str], transitions: [str], words: [str] }
// Everything is sanitized here: unknown keys dropped, strings trimmed, control characters removed, lengths capped.
// The page renders text with textContent and the print renderers escape, so no markup survives either way.

export const CUSTOM_VERSION = 1;
const LEVELS = ["l1_2", "l3_4", "l5_6"];
const LIMITS = {
  title: 60,
  note: 300,
  prompt: 400,
  frame: 220,
  starter: 200,
  starters: 6,
  word: 40,
  transitions: 14,
  words: 20,
};

const clean = (value, max) => {
  if (typeof value !== "string") return "";
  // Drop control characters (keep normal spaces), collapse runs of whitespace.
  const text = Array.from(value)
    .filter((ch) => ch >= " " || ch === "\n")
    .join("")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, max);
};

function cleanLevels(obj, max) {
  if (!obj || typeof obj !== "object") return null;
  const out = {};
  for (const l of LEVELS) {
    const t = clean(obj[l], max);
    if (t) out[l] = t;
  }
  return Object.keys(out).length ? out : null;
}

function cleanList(list, maxItems, maxLen) {
  if (!Array.isArray(list)) return null;
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const t = clean(item, maxLen);
    if (!t || seen.has(t.toLowerCase())) continue;
    seen.add(t.toLowerCase());
    out.push(t);
    if (out.length >= maxItems) break;
  }
  return out.length ? out : null;
}

/** Returns a clean customization object, or null when nothing usable is left. */
export function sanitizeCustom(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out = { v: CUSTOM_VERSION };
  const title = clean(raw.title, LIMITS.title);
  if (title) out.title = title;
  const note = clean(raw.note, LIMITS.note);
  if (note) out.note = note;
  const prompt = cleanLevels(raw.prompt, LIMITS.prompt);
  if (prompt) out.prompt = prompt;
  const topic = cleanLevels(raw.topic, LIMITS.frame);
  if (topic) out.topic = topic;
  const conclusion = cleanLevels(raw.conclusion, LIMITS.frame);
  if (conclusion) out.conclusion = conclusion;
  const starters = cleanList(raw.starters, LIMITS.starters, LIMITS.starter);
  if (starters) out.starters = starters;
  const transitions = cleanList(raw.transitions, LIMITS.transitions, LIMITS.word);
  if (transitions) out.transitions = transitions;
  const words = cleanList(raw.words, LIMITS.words, LIMITS.word);
  if (words) out.words = words;
  return Object.keys(out).length > 1 ? out : null;
}

/** A new writing object with the customization applied (the authored object is never mutated). */
export function applyCustom(writing, raw) {
  const c = sanitizeCustom(raw);
  if (!writing || !c) return writing;
  const w = structuredClone(writing);
  if (c.title) w.title = c.title;
  if (c.note) w.teacher_note = c.note;
  if (c.prompt) w.prompt = { ...w.prompt, ...c.prompt };
  if (c.topic) w.spo.topic = { ...w.spo.topic, ...c.topic };
  if (c.conclusion) w.spo.conclusion = { ...w.spo.conclusion, ...c.conclusion };
  if (c.starters) w.spo.starters = c.starters.map((text) => ({ type: "teacher", text }));
  if (c.transitions) w.transitions = c.transitions;
  if (c.words) w.extra_words = c.words;
  w.customized = true;
  return w;
}

// ---- URL encoding: base64url(UTF-8 JSON). Works in browsers and Workers (TextEncoder/btoa/atob). ----
export function encodeCustom(raw) {
  const c = sanitizeCustom(raw);
  if (!c) return "";
  const bytes = new TextEncoder().encode(JSON.stringify(c));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeCustom(param) {
  const s = String(param || "");
  if (!s || s.length > 6000 || !/^[A-Za-z0-9_-]+$/.test(s)) return null;
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
    return sanitizeCustom(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}
