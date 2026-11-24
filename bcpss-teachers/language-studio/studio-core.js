// Language Studio Player — shared helpers (agent S owns this file).
// Every kind module may import from "../studio-core.js". The activity `ctx` is built in studio-app.js
// from these helpers; see db/seeds/bcpss/v2/PLAYER_BRIEF.md for the contract.

export const LEVELS = ["l1_2", "l3_4", "l5_6"];
export const LEVEL_INFO = {
  l1_2: { name: "Starter", wida: "WIDA levels 1–2" },
  l3_4: { name: "Core", wida: "WIDA levels 3–4" },
  l5_6: { name: "Stretch", wida: "WIDA levels 5–6" },
};

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
/** Escape a value for safe insertion into innerHTML / attributes. */
export const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

/** Small DOM builder: h("button", { class: "st-btn", onclick }, "Label", child...). Never parses HTML. */
export function h(tag, attrs, ...kids) {
  const node = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs || {})) {
    if (val === false || val == null) continue;
    if (key.startsWith("on") && typeof val === "function") node.addEventListener(key.slice(2), val);
    else if (key === "class") node.className = val;
    else if (key === "text") node.textContent = val;
    else node.setAttribute(key, val === true ? "" : String(val));
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    node.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return node;
}

/** Deterministic PRNG from a string seed (xmur3 + mulberry32). Returns () => number in [0, 1). */
export function rng(seed) {
  let hash = 1779033703 ^ String(seed).length;
  for (let i = 0; i < String(seed).length; i++) {
    hash = Math.imul(hash ^ String(seed).charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  let a = hash >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seeded Fisher-Yates; returns a copy. Same seed gives the same order. */
export function shuffle(array, seed = String(Math.random())) {
  const copy = [...array];
  const next = rng(seed);
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const reducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
export const ttsAvailable = () =>
  "speechSynthesis" in window && typeof SpeechSynthesisUtterance === "function";

let speakToken = 0;
/** Read text aloud. Resolves true when it finished speaking, false when speech is unavailable or was cancelled. */
export function tts(text, { rate = 0.95, lang = "en-US" } = {}) {
  if (!ttsAvailable() || !String(text || "").trim()) return Promise.resolve(false);
  const mine = ++speakToken;
  window.speechSynthesis.cancel();
  return new Promise((resolve) => {
    const utter = new SpeechSynthesisUtterance(String(text));
    utter.rate = rate;
    utter.lang = lang;
    // Some browsers never fire "end" (no voices installed); fall back to an estimated duration.
    const limit = window.setTimeout(() => finish(false), 3000 + (String(text).length * 90) / rate);
    const finish = (spoken) => {
      window.clearTimeout(limit);
      resolve(spoken && mine === speakToken);
    };
    utter.onend = () => finish(true);
    utter.onerror = () => finish(false);
    window.speechSynthesis.speak(utter);
  });
}
export const stopSpeaking = () => {
  speakToken++;
  if (ttsAvailable()) window.speechSynthesis.cancel();
};

/** Polite screen-reader announcement. */
export function announce(message) {
  const live = document.getElementById("stLive");
  if (!live) return;
  live.textContent = "";
  window.setTimeout(() => {
    live.textContent = String(message || "");
  }, 40);
}

// ---------- storage (every access wrapped; the page works with storage blocked) ----------
export function storeGet(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function storeSet(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

const progressKey = (unitId) => `bcpss-studio:${unitId}`;
/** Progress shape: { stars: { "1": 3, ... }, level: "l3_4", last: 1, exit: "text" } */
export function loadProgress(unitId) {
  const saved = storeGet(progressKey(unitId));
  return {
    stars: {},
    level: null,
    last: null,
    exit: "",
    ...(saved && typeof saved === "object" ? saved : {}),
  };
}
export function saveProgress(unitId, patch) {
  const next = { ...loadProgress(unitId), ...patch };
  storeSet(progressKey(unitId), next);
  return next;
}
export const activityStateKey = (unitId, index) => `bcpss-studio:${unitId}:a${index}`;

/** Find the emoji icon of a vocab term (case-insensitive, tolerant of plural/inflected forms). */
export function makeVocabIcon(vocab) {
  const list = Array.isArray(vocab) ? vocab : [];
  return (term) => {
    const t = String(term || "")
      .trim()
      .toLowerCase();
    if (!t) return "";
    const hit =
      list.find((v) => v.term.toLowerCase() === t) ||
      list.find((v) => t.startsWith(v.term.toLowerCase().slice(0, Math.max(4, v.term.length - 2))));
    return hit?.icon || "";
  };
}

/** Grade band drives the visual theme: k2 (playful), g35 (friendly), g68 (editorial). */
export function gradeBand(grade) {
  const g = String(grade ?? "").toUpperCase();
  if (g === "K" || g === "0" || g === "1" || g === "2") return "k2";
  if (g === "3" || g === "4" || g === "5") return "g35";
  return "g68";
}

export const DOMAIN_CLASS = {
  Listening: "listening",
  Speaking: "speaking",
  Reading: "reading",
  Writing: "writing",
  Vocabulary: "vocab",
  Game: "game",
};
export const domainClass = (domain) => DOMAIN_CLASS[domain] || "vocab";

/** Words of a string, trimmed, for counting. */
export const wordCount = (text) =>
  String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

/** Normalise free text for forgiving comparisons: lowercase, strip punctuation/units spacing. */
export const norm = (text) =>
  String(text ?? "")
    .toLowerCase()
    .replace(/×/g, "x")
    .replace(
      /square|cubic|centimeters?|centimetres?|cm|inches|inch|feet|foot|ft|meters?|units?/g,
      "",
    )
    .replace(/[^a-z0-9.]+/g, "");

/** Stars from how many tries were needed (retries / total). */
export const starsFor = (mistakes, total) =>
  mistakes === 0 ? 3 : mistakes <= Math.max(1, Math.ceil(total / 3)) ? 2 : 1;

/** Copy text to the clipboard; resolves true on success. */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = h("textarea", { "aria-hidden": "true", style: "position:fixed;opacity:0" });
    area.value = text;
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}

const STAR_PATH = "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.2l-5.9 3.4 1.3-6.6L2.5 9.4l6.6-.8z";
/** Decorative star icon (filled when `on`). */
export const starSvg = (on) => {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("class", `st-star${on ? " is-on" : ""}`);
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(ns, "path");
  path.setAttribute("d", STAR_PATH);
  path.setAttribute("fill", "currentColor");
  svg.append(path);
  return svg;
};

