// Small shared pieces for the premium Language Labs hub. Markup only; no state, no storage.
// Lab names are English being studied, so ES and EN+ES keep them in English and add the Spanish as a gloss (I.TARGET).
import * as C from "../content/language-labs.js";
import { BASE, html, icon } from "../util.js";

export const bandOf = (b) => (b === "3-5" ? "3-5" : "6-8");
export const labName = (I, lab) => I.TARGET(...lab.title);

export const labHref = (lab, band, step = 1) =>
  lab.here
    ? `${BASE}/language-labs/${lab.id}?step=${step}&grades=${band}`
    : `${BASE}/${lab.href}?grades=${band}`;

export const usePill = (I, useKey) => {
  const u = C.KEY_USES[useKey];
  return u ? html`<span class="ll-use is-${u.tone}">${I.T(u.en, u.es)}</span>` : "";
};

export const dimPill = (I, dimKey) => {
  const d = C.DIMENSIONS[dimKey];
  return d ? html`<span class="ll-dim">${I.T(d.en, d.es)}</span>` : "";
};

// Same markup the lab's click handler listens for: [data-ll-speak] speaks its value.
export const speakBtn = (I, text, labelEn = "Listen", labelEs = "Escuchar") =>
  html`<button
    type="button"
    class="btn small ghost ll-speak-btn"
    data-ll-speak="${text}"
    aria-label="${I.S(labelEn, labelEs)}"
  >
    ${icon("volume")} <span>${I.T(labelEn, labelEs)}</span>
  </button>`;

export const sectionHead = (eyebrow, title, id, lead = "") =>
  html`<header class="llp-head">
    <p class="llp-eyebrow">${eyebrow}</p>
    <h2 id="${id}">${title}</h2>
    ${lead ? html`<p class="llp-lead">${lead}</p>` : ""}
  </header>`;
