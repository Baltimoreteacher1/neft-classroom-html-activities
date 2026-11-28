// Connector Bridge artwork: two idea towers, a bridge whose shape is the relationship, and punctuation drawn as
// tiles on the deck. The bridge is drawn twice (across for wide screens, down for phones) and CSS shows one.
// Colors come from --job (a token color per relationship); the draw-in animation is off under reduced motion.
import { html, raw } from "../util.js";
import { deckTiles } from "./bridge-model.js";

const arrow = (x, y, dir = 1) => `<path class="cb-head" d="M${x} ${y}l${-13 * dir} -8 0 16z"/>`;

/** One bridge per relationship, drawn left (idea A) to right (idea B) inside a 240 x 120 box. */
const SHAPES = {
  cause: `<path class="cb-deck" d="M4 60H224"/>${arrow(238, 60)}<path class="cb-chev" d="M48 48l10 12-10 12M98 48l10 12-10 12M148 48l10 12-10 12"/>`,
  contrast: `<path class="cb-deck" d="M4 40H224"/>${arrow(238, 40)}<path class="cb-deck is-back" d="M236 80H16"/>${arrow(2, 80, -1)}`,
  addition: `<path class="cb-deck" d="M4 46H224"/>${arrow(238, 46)}<path class="cb-deck is-soft" d="M4 76H224"/>${arrow(238, 76)}<path class="cb-plus" d="M40 60h20M50 50v20M180 60h20M190 50v20"/>`,
  sequence: `<path class="cb-deck" d="M4 100H64V76H124V52H184V28H224"/>${arrow(238, 28)}<circle class="cb-dot" cx="34" cy="82" r="9"/><circle class="cb-dot" cx="94" cy="58" r="9"/><circle class="cb-dot" cx="154" cy="34" r="9"/>`,
  example: `<path class="cb-deck" d="M4 60H100"/><path class="cb-deck is-soft" d="M100 60L170 28M100 60L170 92"/><path class="cb-deck" d="M100 60H190"/><circle class="cb-dot is-soft" cx="206" cy="26" r="9"/><circle class="cb-dot is-soft" cx="206" cy="94" r="9"/><circle class="cb-dot" cx="214" cy="60" r="13"/>`,
  conclusion: `<path class="cb-deck is-soft" d="M4 26L130 60"/><path class="cb-deck is-soft" d="M4 94L130 60"/><path class="cb-deck" d="M4 60H70M130 60H224"/>${arrow(238, 60)}`,
  none: `<path class="cb-deck is-gap" d="M4 60H234"/>`,
};

export function shapeSVG(job, vertical = false) {
  const body = SHAPES[job] || SHAPES.none;
  return raw(`<svg class="cb-svg ${vertical ? "is-v" : "is-h"}" viewBox="${vertical ? "0 0 120 240" : "0 0 240 120"}" aria-hidden="true" focusable="false">
    <path class="cb-water" d="${vertical ? "M0 0v240M8 0v240" : "M0 112q15-8 30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0"}"/>
    <g ${vertical ? 'transform="translate(120 0) rotate(90)"' : ""}>${body}</g>
  </svg>`);
}

/** Punctuation tiles + the connector word, sitting on the bridge like a keystone. */
export function keystoneHTML(I, connector, esGloss = "") {
  const tiles = deckTiles(connector);
  if (!tiles.length)
    return html`<div class="cb-keystone is-empty">
      <span class="cb-word">${I.T("Choose a connector", "Elige un conector")}</span>
    </div>`;
  return html`<div class="cb-keystone">
    ${tiles.map((t) =>
      t.kind === "word"
        ? html`<span class="cb-word" lang="en">${I.TARGET(t.text, esGloss)}</span>`
        : html`<span class="cb-mark"
            ><b aria-hidden="true">${t.text}</b><small>${I.T(...t.label)}</small></span
          >`,
    )}
  </div>`;
}

export function bridgeSceneHTML(I, { a, b, connector, job, gloss = "" }) {
  return html`<div class="cb-scene" data-job="${job || "none"}">
    <div class="cb-tower cb-a">
      <span class="cb-tag">${I.T("Idea A", "Idea A")}</span>
      <p lang="en">${a}</p>
    </div>
    <div class="cb-span">
      ${shapeSVG(job || "none")}${shapeSVG(job || "none", true)}${keystoneHTML(I, connector, gloss)}
    </div>
    <div class="cb-tower cb-b">
      <span class="cb-tag">${I.T("Idea B", "Idea B")}</span>
      <p lang="en">${b}</p>
    </div>
  </div>`;
}

/** A tiny bridge for cards and results (no text). */
export const miniBridge = (job) =>
  html`<span class="cb-mini" data-job="${job}">${shapeSVG(job)}</span>`;

/** The balance for "weigh the evidence": tilt 1 puts the weight on the right pan (your evidence), -1 on the left. */
export function scaleHTML(I, tilt) {
  return html`<div class="cb-scale" style="--tilt:${tilt * 9}deg" data-tilt="${tilt}">
    <svg viewBox="0 0 240 120" aria-hidden="true" focusable="false">
      <path class="cb-post" d="M120 112V34M92 112h56" />
      <g class="cb-beam">
        <path class="cb-beam-bar" d="M30 34H210" />
        <path class="cb-string" d="M30 34L12 76M30 34L48 76M210 34L192 76M210 34L228 76" />
        <path class="cb-pan is-counter" d="M8 76H52q-2 14-22 14T8 76z" />
        <path class="cb-pan is-support" d="M188 76H232q-2 14-22 14T188 76z" />
      </g>
      <circle class="cb-pivot" cx="120" cy="34" r="7" />
    </svg>
    <div class="cb-scale-labels">
      <span>${I.T("Other side", "El otro lado")}</span
      ><span>${I.T("Your evidence", "Tu evidencia")}</span>
    </div>
  </div>`;
}
