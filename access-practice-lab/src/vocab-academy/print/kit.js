// Vocabulary Academy print: small reusable HTML pieces (pure; return util.js `html` values).
import { esc, html, raw } from "./shared.js";

export const POS_NAME = {
  n: "noun",
  v: "verb",
  adj: "adjective",
  adv: "adverb",
  prep: "preposition",
  conj: "conjunction",
  pron: "pronoun",
  phr: "phrase",
};

/** One printed sheet. `id` becomes the heading anchor so every sheet is a labelled region. */
export const sheet = (name, label, body, extra = "") =>
  html`<section class="vap-sheet vap-s-${name} ${extra}" aria-label="${label}" data-sheet="${name}">
    ${body}
  </section>`;

/** A section title with a part tab. The tab is text, never colour alone. */
export const sheetTitle = (tab, title, lead = "") =>
  html`<header class="vap-title">
    <p class="vap-tab">${tab}</p>
    <h2>${title}</h2>
    ${lead ? html`<p class="vap-lead">${lead}</p>` : ""}
  </header>`;

export const subTitle = (letter, title, lead = "") =>
  html`<header class="vap-sub">
    <h3><span class="vap-letter" aria-hidden="true">${letter}</span>${title}</h3>
    ${lead ? html`<p class="vap-lead">${lead}</p>` : ""}
  </header>`;

/** Replace the first ___ in a cloze sentence with a blank (or, in teacher mode, the printed answer). */
export function clozeText(sentence, answer = "") {
  const parts = String(sentence).split("___");
  const blank = answer
    ? html`<span class="vap-fill">${answer}</span>`
    : html`<span class="vap-blank" role="img" aria-label="blank"></span>`;
  return html`${parts[0]}${blank}${parts.slice(1).join("___")}`;
}

/** Circle-a-letter bubble. `right` fills it (teacher edition) and adds a check so black-and-white keeps the meaning. */
export const bubble = (letter, right = false) =>
  right
    ? html`<span class="vap-bubble is-right" aria-label="${letter}, correct answer"
        ><span aria-hidden="true">${letter}</span></span
      >`
    : html`<span class="vap-bubble" aria-hidden="true">${letter}</span>`;

/** A multiple-choice list. `rightIndex` is only ever passed in teacher mode. */
export function choiceList(letters, choices, { rightIndex = -1, wide = false } = {}) {
  return html`<ol class="vap-choices ${wide ? "is-wide" : ""}" role="list">
    ${choices.map(
      (c, i) =>
        html`<li class="${i === rightIndex ? "is-right" : ""}">
          ${bubble(letters[i], i === rightIndex)}<span class="vap-choice-text"
            >${c}${i === rightIndex ? html`<span class="vap-check-mark" aria-hidden="true"> ✓</span>` : ""}</span
          >
        </li>`,
    )}
  </ol>`;
}

/** Ruled writing lines. `guide` draws a top, dotted middle and base line (handwriting guide for K-2). */
export const ruled = (n, { guide = false, label = "Write here" } = {}) =>
  html`<div class="vap-lines ${guide ? "is-guide" : ""}" role="img" aria-label="${label}">
    ${Array.from({ length: n }, () => html`<span class="vap-line"></span>`)}
  </div>`;

/** A framed response paragraph box for grades 6-12. */
export const writingBox = (lines = 9, label = "Write your paragraph here") =>
  html`<div class="vap-box-lines" role="img" aria-label="${label}">
    ${Array.from({ length: lines }, () => html`<span class="vap-line"></span>`)}
  </div>`;

export const drawBox = (label = "Draw your picture here") =>
  html`<div class="vap-draw" role="img" aria-label="${label}">
    <span class="vap-draw-label" aria-hidden="true">Draw</span>
  </div>`;

export const checkBox = () => html`<span class="vap-checkbox" aria-hidden="true"></span>`;

/** Teacher-only annotation box. The label is text, so it reads in black and white. */
export const keyNote = (label, body) =>
  html`<aside class="vap-key" aria-label="Teacher note">
    <strong class="vap-key-label">${label}</strong> ${body}
  </aside>`;

export const readToMe = (text = "Read to me") =>
  html`<p class="vap-readme">
    <svg class="vap-speaker" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
      <path
        d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      /></svg
    ><span>${text}</span>
  </p>`;

// ---- pictures ----------------------------------------------------------------------------------------------------

const DIAGRAMS = {
  spectrum:
    '<line x1="8" y1="40" x2="152" y2="40" stroke="currentColor" stroke-width="3"/><path d="M8 40l10-7v14zM152 40l-10-7v14z" fill="currentColor"/><circle cx="118" cy="40" r="9" fill="currentColor"/><path d="M30 28v24M70 28v24" stroke="currentColor" stroke-width="2"/>',
  contrast:
    '<rect x="8" y="14" width="56" height="52" rx="8" fill="none" stroke="currentColor" stroke-width="3"/><rect x="96" y="14" width="56" height="52" rx="8" fill="currentColor" opacity=".18" stroke="currentColor" stroke-width="3"/><path d="M70 40h20M76 33l-8 7 8 7M84 33l8 7-8 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
  cycle:
    '<path d="M80 12a28 28 0 1 1-26 17" fill="none" stroke="currentColor" stroke-width="3.5"/><path d="M48 30l8-9 4 12z" fill="currentColor"/><circle cx="80" cy="40" r="6" fill="currentColor"/>',
  web: '<g stroke="currentColor" stroke-width="3"><path d="M80 40L30 16M80 40L130 16M80 40L28 66M80 40L132 66M80 40v-28"/></g><circle cx="80" cy="40" r="11" fill="currentColor"/><g fill="none" stroke="currentColor" stroke-width="3"><circle cx="30" cy="16" r="6"/><circle cx="130" cy="16" r="6"/><circle cx="28" cy="66" r="6"/><circle cx="132" cy="66" r="6"/></g>',
  flow: '<g fill="none" stroke="currentColor" stroke-width="3"><rect x="6" y="22" width="38" height="36" rx="6"/><rect x="61" y="22" width="38" height="36" rx="6"/><rect x="116" y="22" width="38" height="36" rx="6"/><path d="M46 40h13M101 40h13M54 34l6 6-6 6M109 34l6 6-6 6"/></g>',
};

/**
 * A word picture as a print tile: emoji scene or a vector diagram, with a border and an alt text, so it reads in black
 * and white. `showAlt` prints the description under the picture (K-2 read-aloud support).
 */
export function sceneTile(word, { showAlt = false, size = "md" } = {}) {
  const v = word.visual;
  if (!v || v.kind === "none") return "";
  const alt = v.alt || `Picture for ${word.hw}`;
  const art =
    v.kind === "diagram"
      ? raw(
          `<svg class="vap-diagram" viewBox="0 0 160 80" aria-hidden="true" focusable="false">${DIAGRAMS[v.diagram] ?? DIAGRAMS.web}</svg>`,
        )
      : html`<span class="vap-glyphs" aria-hidden="true"
          >${(v.glyphs ?? []).slice(0, 3).join(" ")}</span
        >`;
  return html`<figure class="vap-scene is-${size}" role="img" aria-label="${alt}">
    ${art}${showAlt ? html`<figcaption>${alt}</figcaption>` : ""}
  </figure>`;
}

/** A tile from raw glyphs (used by the picture-match). */
export const glyphTile = (glyphs, alt, letter) =>
  html`<figure class="vap-scene is-md" role="img" aria-label="${alt}">
    <span class="vap-glyphs" aria-hidden="true">${(glyphs ?? []).slice(0, 3).join(" ")}</span
    >${letter ? html`<figcaption class="vap-tile-letter">${letter}</figcaption>` : ""}
  </figure>`;

export const fineEsc = esc;
