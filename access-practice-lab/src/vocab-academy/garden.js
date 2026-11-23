// Vocabulary Academy — the Word Garden. Every word of a unit is a plant that grows as the word is learned:
// seed (new) → sprout (learning) → sapling (developing) → flower (applying) → tree with fruit (secure); a word that needs
// review droops. The plant is a picture of the word's DERIVED state (model.wordState), never a separate score, and each
// plot also says its state in words, so nothing depends on colour or shape alone. Pure markup, no storage.
import { html, raw } from "../util.js";
import { STATES, STATE_LABEL } from "./contract.js";

const SEED = `<ellipse class="seed" cx="30" cy="66" rx="7" ry="4.5"/>`;
const SPROUT = `<path class="stem" d="M30 68 V54"/><path class="leaf" d="M30 56 C18 54 16 46 18 42 C26 42 30 48 30 56Z"/><path class="leaf" d="M30 54 C42 52 44 44 42 40 C34 40 30 46 30 54Z"/>`;
const SAPLING = `<path class="stem" d="M30 70 V34"/><path class="leaf" d="M30 58 C16 58 12 48 14 42 C24 42 30 48 30 58Z"/><path class="leaf" d="M30 50 C44 50 48 40 46 34 C36 34 30 40 30 50Z"/><path class="leaf" d="M30 40 C20 38 18 30 20 25 C27 26 30 32 30 40Z"/><circle class="heart" cx="30" cy="30" r="4"/>`;
const petals = [0, 72, 144, 216, 288]
  .map((a) => `<circle class="petal" cx="30" cy="14" r="6.5" transform="rotate(${a} 30 24)"/>`)
  .join("");
const FLOWER = `<path class="stem" d="M30 70 V26"/><path class="leaf" d="M30 62 C16 62 12 52 14 46 C24 46 30 52 30 62Z"/><path class="leaf" d="M30 52 C44 52 48 42 46 36 C36 36 30 42 30 52Z"/>${petals}<circle class="heart" cx="30" cy="24" r="5"/>`;
const TREE = `<rect class="trunk" x="26" y="42" width="8" height="28" rx="2"/><circle class="crown" cx="30" cy="30" r="20"/><circle class="crown" cx="19" cy="38" r="12"/><circle class="crown" cx="41" cy="38" r="12"/><circle class="fruit" cx="24" cy="26" r="3.2"/><circle class="fruit" cx="36" cy="32" r="3.2"/><circle class="fruit" cx="30" cy="18" r="3.2"/><circle class="fruit" cx="20" cy="40" r="3.2"/>`;

const ART = {
  new: SEED,
  learning: SPROUT,
  developing: SAPLING,
  applying: FLOWER,
  secure: TREE,
  "review-needed": SAPLING,
};

/** The plant for one state, as inline SVG (decorative: the plot's text names the state). */
export const plantSvg = (state) =>
  `<svg class="va-plant" viewBox="0 0 60 74" aria-hidden="true" focusable="false">${ART[state] || ART.new}</svg>`;

/** How many words are in each state: { new, learning, … } for a list of states. Pure. */
export function stageCounts(states) {
  const out = Object.fromEntries(STATES.map((s) => [s, 0]));
  for (const s of states || []) if (s in out) out[s] += 1;
  return out;
}

/** One plot: a link to the word, its plant, its name and its state in words. */
export function plotHTML(I, { id, hw, state }, href) {
  const label = I.T(...STATE_LABEL[state]);
  const inner = html`${raw(plantSvg(state))}<span class="va-plot-word" lang="en">${hw}</span
    ><span class="va-plot-state">${label}</span>`;
  return id
    ? html`<li>
        <a class="va-plot" href="${href(id)}" data-stage="${state}" aria-label="${hw}: ${label}"
          >${inner}</a
        >
      </li>`
    : html`<li><span class="va-plot" data-stage="${state}">${inner}</span></li>`;
}

/** A garden of plots for one list of { id, hw, state }. */
export const gardenHTML = (I, rows, href) =>
  html`<ul class="va-garden">
    ${rows.map((r) => plotHTML(I, r, href))}
  </ul>`;

/** The key: each plant with its state name and a plain-words meaning. */
export function gardenKeyHTML(I, counts) {
  const mean = {
    new: ["not met yet", "todavía no la conoces"],
    learning: ["you are meeting it", "la estás conociendo"],
    developing: ["you know what it means", "ya sabes qué significa"],
    applying: ["you can use it", "ya puedes usarla"],
    secure: ["you remembered it later, too", "también la recordaste después"],
    "review-needed": ["time to look at it again", "es hora de repasarla"],
  };
  return html`<ul class="va-garden-key">
    ${STATES.map(
      (s) =>
        html`<li>
          <strong>${I.T(...STATE_LABEL[s])}</strong> (${counts[s] || 0}): ${I.T(...mean[s])}
        </li>`,
    )}
  </ul>`;
}
