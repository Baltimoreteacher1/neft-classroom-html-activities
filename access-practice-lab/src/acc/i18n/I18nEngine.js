// I18nEngine: English and Spanish for the ACCESS enterprise surfaces (assessment simulator, audio, storage, teacher
// evidence). Interface text only: passages, questions, answer choices, supports written by authors and student work stay
// English, because the practice itself is English-language practice. The language choice is the lab's own
// (`prefs.lang`: "en" | "es" | "bi"), so one switch governs the whole lab.
//
// How it works: the UI is built in English. In Spanish mode a MutationObserver translates interface strings through the
// dictionary in locales/es.js (exact strings and patterns for text with numbers), remembering the English original so the
// switch back is lossless. A string with no entry stays English; tools/access-acc-i18n-scan.mjs fails if any interface
// string in the covered screens is missing. Spanish is machine-assisted and not yet reviewed by a human translator.
import { ES_EXACT, ES_PATTERNS } from "./locales/es.js";

export const LOCALES = Object.freeze(["en", "es"]);
const PREFS_KEY = "accessPracticeLab:v1:prefs";
const ATTRS = ["aria-label", "title", "placeholder", "alt"];
// Content regions stay English by design (and are marked lang="en" inside a Spanish page).
const CONTENT = [".acc-stim", ".acc-stem", ".acc-choice-text", ".acc-order-text", ".acc-token", ".acc-zone-label", ".acc-cloze", ".acc-textarea", ".acc-support-card p", ".acc-checklist", ".acc-transcript p", ".acc-q-meta", "[data-i18n-skip]"].join(",");
const SKIP = `${CONTENT},textarea,script,style`;
/** True when a text node or element is interface text (translated), not authored content or student work. */
export const isInterface = (node) => {
  const el = node.nodeType === 3 ? node.parentElement : node;
  if (!el?.closest) return true;
  // The listening player lives in the passage pane but is interface; only its transcript is content.
  if (el.closest(".acc-listen") && !el.closest(".acc-transcript p")) return true;
  return !el.closest(SKIP);
};

/** "en" | "es" | "bi" as stored by the lab. Anything else is English. */
export function storedMode(storage = globalThis.localStorage) {
  try {
    const mode = JSON.parse(storage?.getItem(PREFS_KEY) || "{}")?.lang;
    return ["en", "es", "bi"].includes(mode) ? mode : "en";
  } catch {
    return "en";
  }
}
/** Spanish only when the whole interface is Spanish; "bi" keeps English here (documented limitation). */
export const localeFor = (mode) => (mode === "es" ? "es" : "en");

export function translate(text, locale = "es") {
  if (locale !== "es") return text;
  const key = text.trim();
  if (!key) return text;
  const hit = ES_EXACT[key];
  if (hit !== undefined) return text.replace(key, hit);
  for (const [re, fn] of ES_PATTERNS) {
    const m = key.match(re);
    if (m) return text.replace(key, fn(...m.slice(1)));
  }
  return text;
}

const originals = new WeakMap(); // node -> English
const attrOriginals = new WeakMap(); // element -> { attr: English }

/** True when the engine rewrote this node/attribute into Spanish (used by the completeness scan). */
export const wasTranslated = (nodeOrEl, attr) => {
  if (attr) return attrOriginals.get(nodeOrEl)?.[attr]?.es === nodeOrEl.getAttribute(attr) && attrOriginals.get(nodeOrEl)?.[attr]?.en !== attrOriginals.get(nodeOrEl)?.[attr]?.es;
  const rec = originals.get(nodeOrEl);
  return Boolean(rec && rec.es === nodeOrEl.nodeValue && rec.en !== rec.es);
};

function applyText(node, locale) {
  if (node.nodeType !== 3 || !isInterface(node)) return;
  const current = node.nodeValue;
  const known = originals.get(node);
  // A node whose text changed since we translated it holds new English: forget the old original.
  const en = known && (current === known.es || current === known.en) ? known.en : current;
  const next = locale === "es" ? translate(en, "es") : en;
  if (next !== current) {
    originals.set(node, { en, es: next });
    node.nodeValue = next;
  } else if (!known) originals.set(node, { en, es: next });
}

function applyAttrs(el, locale) {
  if (el.matches?.(CONTENT)) {
    if (locale === "es") el.setAttribute("lang", "en");
    else if (el.getAttribute("lang") === "en") el.removeAttribute("lang");
  }
  if (!isInterface(el) && !el.matches?.("button,[role=slider],[role=separator],audio,input,select,summary")) return;
  const saved = attrOriginals.get(el) || {};
  for (const a of ATTRS) {
    if (!el.hasAttribute?.(a)) continue;
    const current = el.getAttribute(a);
    const known = saved[a];
    const en = known && (current === known.es || current === known.en) ? known.en : current;
    const next = locale === "es" ? translate(en, "es") : en;
    saved[a] = { en, es: next };
    if (next !== current) el.setAttribute(a, next);
  }
  attrOriginals.set(el, saved);
}

function walk(root, locale) {
  if (root.nodeType === 3) return applyText(root, locale);
  if (root.nodeType !== 1) return;
  applyAttrs(root, locale);
  for (const child of root.childNodes) walk(child, locale);
}

export class I18nEngine {
  constructor({ root, doc = root.ownerDocument, getMode = () => storedMode() } = {}) {
    this.root = root;
    this.doc = doc;
    this.getMode = getMode;
    this.locale = localeFor(getMode());
    this.busy = false;
    this.observer = new doc.defaultView.MutationObserver((records) => this.onMutations(records));
  }
  start() {
    this.apply(this.root);
    this.observer.observe(this.root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    this.syncPage();
    return this;
  }
  stop() {
    this.observer.disconnect();
  }
  onMutations(records) {
    if (this.busy) return;
    this.busy = true; // our own rewrites must not re-enter
    try {
      for (const r of records) {
        if (r.type === "childList") for (const n of r.addedNodes) walk(n, this.locale);
        else if (r.type === "characterData") applyText(r.target, this.locale);
        else if (r.type === "attributes") applyAttrs(r.target, this.locale);
      }
    } finally {
      this.busy = false;
      this.observer.takeRecords();
    }
  }
  apply(node) {
    this.busy = true;
    try {
      walk(node, this.locale);
    } finally {
      this.busy = false;
      this.observer.takeRecords();
    }
  }
  /** Switch language in place; nothing the learner did is touched. */
  setLocale(locale) {
    if (!LOCALES.includes(locale) || locale === this.locale) return;
    this.locale = locale;
    this.apply(this.root);
    this.syncPage();
  }
  /** Declares the language of the interface text on the container, so screen readers pick the right voice. */
  syncPage() {
    this.root.setAttribute("lang", this.locale);
  }
}
