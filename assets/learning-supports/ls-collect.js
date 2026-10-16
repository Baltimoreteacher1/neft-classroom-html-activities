// Finds the words on a page that read-aloud should speak, in reading order, and
// keeps a handle on each word's place in the page so it can be highlighted.
//
// What is skipped matters as much as what is read: hidden content, scripts,
// pictures and diagrams, form fields, this support's own controls, and the
// duplicate translation when a line is shown in both languages.

import { splitWords, verbalizeToken } from "./ls-speech-text.js";

/** @typedef {import("./ls-speech-text.js").Lang} Lang */
/**
 * @typedef {object} PageToken
 * @property {string} text what the voice says
 * @property {Lang} lang
 * @property {boolean} breakAfter true on the last word of a heading, paragraph or list item
 * @property {Text} node
 * @property {number} start
 * @property {number} end
 */

const SKIP =
  "script,style,noscript,template,svg,canvas,iframe,video,audio,input,textarea,select,option,nav,[role='navigation'],.ewl-skip,.skip-link,[hidden],[aria-hidden='true'],[data-ls-ui],[data-ls-skip],.sr-only,.visually-hidden";

/**
 * Is the element drawn at all? Looked up per element and remembered for one
 * collection only, because panels open and close between reads.
 * @param {Element} el
 * @param {WeakMap<Element, boolean>} cache
 * @returns {boolean}
 */
function isShown(el, cache) {
  const cached = cache.get(el);
  if (cached !== undefined) return cached;
  const style = el.ownerDocument.defaultView?.getComputedStyle(el);
  const hiddenHere = !style || style.display === "none" || style.visibility === "hidden";
  const shown = !hiddenHere && (!el.parentElement || isShown(el.parentElement, cache));
  cache.set(el, shown);
  return shown;
}

/**
 * The nearest ancestor that starts a new line of reading.
 * @param {Element} el
 */
function blockOf(el) {
  /** @type {Element | null} */
  let cur = el;
  const view = el.ownerDocument.defaultView;
  while (cur?.parentElement && view?.getComputedStyle(cur).display.startsWith("inline")) {
    cur = cur.parentElement;
  }
  return cur ?? el;
}

/** @param {Element} el */
function languageOf(el) {
  const tagged = el.closest("[lang]");
  if (!tagged || tagged === el.ownerDocument.documentElement || tagged === el.ownerDocument.body) {
    return { lang: /** @type {Lang} */ ("en"), tagged: null };
  }
  const code = (tagged.getAttribute("lang") || "").toLowerCase();
  if (code.startsWith("es")) return { lang: /** @type {Lang} */ ("es"), tagged };
  if (code.startsWith("en")) return { lang: /** @type {Lang} */ ("en"), tagged };
  return { lang: /** @type {Lang} */ ("en"), tagged: null };
}

/**
 * Should this text be left out because the same thing is shown in the other
 * language and the reader asked for `want`?
 * @param {Element} parent
 * @param {Lang} lang the text's own language
 * @param {Element | null} tagged the element that carries that language
 * @param {Lang} want
 */
function isDuplicateTranslation(parent, lang, tagged, want) {
  // The engine's two-lane stack: <span class="i18n-stack"><span lang=en>…<span lang=es>…
  const lane = parent.closest(".i18n-en, .i18n-es");
  const stack = lane?.closest(".i18n-stack");
  if (lane && stack && stack.querySelector(want === "es" ? ".i18n-es" : ".i18n-en")) {
    return !lane.classList.contains(want === "es" ? "i18n-es" : "i18n-en");
  }
  // A short gloss beside the other language: read only the one that was asked for.
  if (lang === "es" && want === "en" && tagged) return isGloss(tagged);
  if (lang === "en" && want === "es" && !tagged) {
    return [...blockOf(parent).querySelectorAll('[lang^="es"]')].some(isGloss);
  }
  return false;
}

const GLOSS_TAGS = new Set([
  "SPAN",
  "EM",
  "I",
  "SMALL",
  "B",
  "STRONG",
  "A",
  "LABEL",
  "SUB",
  "SUP",
  "Q",
  "CITE",
  "ABBR",
  "U",
]);

/**
 * A translation tucked inside a line of the other language ("Play · Juega"):
 * a phrase-level element whose parent holds other text too. Paragraphs and
 * headings in their own language are not glosses; they are read in that language.
 * @param {Element} el
 */
function isGloss(el) {
  const parent = el.parentElement;
  if (!parent || !GLOSS_TAGS.has(el.tagName)) return false;
  return (parent.textContent ?? "").trim().length > (el.textContent ?? "").trim().length;
}

/**
 * @param {Node} root
 * @param {{ want?: Lang, range?: Range | null }} [opts]
 *   want: the language the reader asked for. range: only read inside a selection.
 * @returns {PageToken[]}
 */
export function collectTokens(root, { want = "en", range = null } = {}) {
  const doc = root.ownerDocument ?? /** @type {Document} */ (root);
  /** @type {WeakMap<Element, boolean>} */
  const shown = new WeakMap();
  const walker = doc.createTreeWalker(root, 4 /* SHOW_TEXT */);
  /** @type {PageToken[]} */
  const tokens = [];
  /** @type {Element | null} */
  let lastBlock = null;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const node = /** @type {Text} */ (n);
    const parent = node.parentElement;
    if (!parent || !node.data.trim()) continue;
    if (parent.closest(SKIP) || !isShown(parent, shown)) continue;
    if (range && !range.intersectsNode(node)) continue;
    const { lang, tagged } = languageOf(parent);
    if (isDuplicateTranslation(parent, lang, tagged, want)) continue;

    const block = blockOf(parent);
    if (lastBlock && block !== lastBlock && tokens.length)
      tokens[tokens.length - 1].breakAfter = true;
    lastBlock = block;

    for (const word of splitWords(node.data)) {
      let { start, end } = word;
      if (range) {
        if (node === range.startContainer) {
          if (end <= range.startOffset) continue;
          start = Math.max(start, range.startOffset);
        }
        if (node === range.endContainer) {
          if (start >= range.endOffset) continue;
          end = Math.min(end, range.endOffset);
        }
      }
      const text = verbalizeToken(node.data.slice(start, end), lang);
      if (!text) continue;
      tokens.push({ text, lang, breakAfter: false, node, start, end });
    }
  }
  if (tokens.length) tokens[tokens.length - 1].breakAfter = true;
  return tokens;
}

/**
 * What to read: the selection if there is one, else the problem the student is
 * working on, else the main part of the page.
 * @param {Document} doc
 * @param {Element | null} [anchor] where the student last was; the panel button
 *   has focus when it is pressed, so the caller remembers the element before it
 * @returns {{ root: Node, range: Range | null, kind: "selection" | "problem" | "page" }}
 */
export function resolveTarget(doc, anchor = doc.activeElement) {
  const sel = doc.defaultView?.getSelection();
  if (sel && !sel.isCollapsed && sel.rangeCount) {
    const range = sel.getRangeAt(0);
    if (!range.collapsed && range.toString().trim()) {
      return { root: range.commonAncestorContainer, range, kind: "selection" };
    }
  }
  const problem = anchor?.closest?.(".problem-card, .problem-section, [data-ls-problem]");
  if (problem) return { root: problem, range: null, kind: "problem" };
  const main = doc.querySelector("main, [role='main'], #main-content") ?? doc.body;
  // A page title that sits above <main> is still part of the page.
  const title = doc.querySelector("h1");
  const root = title && !main.contains(title) ? doc.body : main;
  return { root, range: null, kind: "page" };
}
