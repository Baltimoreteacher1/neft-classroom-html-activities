// Shared pieces of the craft studios (Argument Arena /arena, Mentor Text Explorer /mentor, Sentence Lab /sentences):
// links, breadcrumbs, the support-level picker, hero, topic cards and each studio's inline illustration.
import { crumbsHTML } from "../components.js";
import { LEVELS, loadCraft, saveCraft } from "../lang/craft.js";
import { announce, BASE, html, icon, raw } from "../util.js";

export const STUDIOS = {
  arena: {
    route: "arena",
    name: ["Argument Arena", "Arena de argumentos"],
    ico: "conversation",
    domain: "d-speaking",
  },
  mentor: {
    route: "mentor",
    name: ["Mentor Text Explorer", "Explorador de textos modelo"],
    ico: "reading",
    domain: "d-reading",
  },
  sentences: {
    route: "sentences",
    name: ["Sentence Lab", "Laboratorio de oraciones"],
    ico: "writing",
    domain: "d-writing",
  },
};

export const craftHref = (studio, band, path = "") =>
  `${BASE}/${STUDIOS[studio].route}${path ? `/${path}` : ""}?grades=${band}`;

export function craftCrumbs(I, studio, band, here = null) {
  const s = STUDIOS[studio];
  const items = [
    [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
    [I.S("Practice", "Practicar"), `${BASE}/library?grades=${band}`],
    [I.S(...s.name), here ? craftHref(studio, band) : null],
  ];
  if (here) items.push([here, null]);
  return crumbsHTML(items, { i18n: I });
}

const LEVEL_WORDS = {
  A: ["Full help", "Con toda la ayuda", "Frames, labels and tips are open."],
  B: ["Some help", "Con algo de ayuda", "Short starters and hints on request."],
  C: ["On my own", "Por mi cuenta", "No frames or labels. This counts as independent practice."],
};
const LEVEL_FINE_ES = {
  A: "Marcos, etiquetas y consejos abiertos.",
  B: "Comienzos cortos y pistas si los pides.",
  C: "Sin marcos ni etiquetas. Cuenta como práctica independiente.",
};

/** Support level A / B / C, saved on this device for all three studios. */
export function levelPickerHTML(I, level, studio) {
  return html`<fieldset class="cs-levels no-print">
    <legend>${I.T("How much help do you want?", "¿Cuánta ayuda quieres?")}</legend>
    <div class="cs-level-row">
      ${LEVELS.map(
        (k) =>
          html`<button
            type="button"
            class="cat-chip cs-level"
            data-craft-level="${k}"
            aria-pressed="${level === k}"
          >
            <strong>${k}</strong> ${I.T(LEVEL_WORDS[k][0], LEVEL_WORDS[k][1])}
          </button>`,
      )}
    </div>
    <p class="fine" data-studio="${studio}">${I.T(LEVEL_WORDS[level][2], LEVEL_FINE_ES[level])}</p>
  </fieldset>`;
}

/** Handles a click on the level picker. Returns true when it did. */
export function levelClick(e, ctx) {
  const b = e.target.closest?.("[data-craft-level]");
  if (!b) return false;
  const state = loadCraft();
  state.level = b.dataset.craftLevel;
  saveCraft(state);
  announce(b.textContent.trim());
  ctx.rerender();
  return true;
}

export function heroHTML(I, studio, { eyebrow, title, lead, art }) {
  const s = STUDIOS[studio];
  return html`<section class="room-hero studio-hero ${s.domain} cs-hero">
    <div class="room-hero-copy">
      <p class="eyebrow">${eyebrow}</p>
      <h1 tabindex="-1">${title}</h1>
      <p class="lead">${lead}</p>
    </div>
    <div class="room-hero-art cs-art">${raw(art)}</div>
  </section>`;
}

export const cardHTML = ({ href, title, ico, kind, desc, done = "" }) =>
  html`<a class="card task-card craft-card" href="${href}">
    <span class="task-top"
      ><span class="task-ico">${icon(ico)}</span
      ><span class="task-kind">${kind}</span
      >${done ? html`<span class="task-time">${icon("check")} ${done}</span>` : ""}</span
    >
    <strong class="task-title">${title}</strong>
    <span class="task-desc">${desc}</span>
  </a>`;

export const practiceNote = (I) =>
  html`<p class="disclaimer">
    ${I.T("Practice on this device. Checks look for words and patterns; they cannot judge meaning, and nothing here is a WIDA or ACCESS score or level. Your work stays in this browser.", "Práctica en este dispositivo. Las revisiones buscan palabras y patrones; no pueden juzgar el significado y nada aquí es un puntaje ni un nivel de WIDA o ACCESS. Tu trabajo se queda en este navegador.")}
  </p>`;

/** A labelled ring of progress as text and a bar (no color-only signal). */
export const progressBar = (done, total, label) =>
  html`<span class="cs-bar" role="img" aria-label="${label}"
    ><i style="width:${total ? Math.round((done / total) * 100) : 0}%"></i
  ></span>`;

const SVG = (label, body) =>
  `<svg viewBox="0 0 480 300" width="480" height="300" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

/** Hand-drawn inline illustrations. Colors come from CSS classes in craft-studios.css. */
export const ART = {
  arena: (alt) =>
    SVG(
      alt,
      `<rect class="bg" x="0" y="0" width="480" height="300" rx="24"/>
      <rect class="pod p1" x="60" y="170" width="130" height="100" rx="10"/>
      <rect class="pod p2" x="290" y="170" width="130" height="100" rx="10"/>
      <path class="pt" d="M104 218l14 14 26-30"/><path class="pt" d="M336 208l38 38m0-38l-38 38"/>
      <path class="bub b1" d="M52 40h150a14 14 0 0 1 14 14v52a14 14 0 0 1-14 14h-92l-28 24 4-24h-34a14 14 0 0 1-14-14V54a14 14 0 0 1 14-14z"/>
      <path class="bub b2" d="M278 70h150a14 14 0 0 1 14 14v52a14 14 0 0 1-14 14h-34l4 24-28-24h-92a14 14 0 0 1-14-14V84a14 14 0 0 1 14-14z"/>
      <rect class="ln" x="72" y="62" width="112" height="8" rx="4"/><rect class="ln" x="72" y="80" width="88" height="8" rx="4"/><rect class="ln" x="72" y="98" width="100" height="8" rx="4"/>
      <rect class="ln" x="298" y="92" width="112" height="8" rx="4"/><rect class="ln" x="298" y="110" width="80" height="8" rx="4"/><rect class="ln" x="298" y="128" width="96" height="8" rx="4"/>
      <circle class="head" cx="125" cy="150" r="14"/><circle class="head" cx="355" cy="150" r="14"/>
      <path class="star" d="M240 108l9 18 20 3-14 14 3 20-18-10-18 10 3-20-14-14 20-3z"/>`,
    ),
  mentor: (alt) =>
    SVG(
      alt,
      `<rect class="bg" x="0" y="0" width="480" height="300" rx="24"/>
      <path class="page" d="M240 70c-40-22-100-22-150-4v176c50-18 110-18 150 4z"/>
      <path class="page" d="M240 70c40-22 100-22 150-4v176c-50-18-110-18-150 4z"/>
      <rect class="ln" x="112" y="100" width="100" height="9" rx="4"/><rect class="hl h1" x="112" y="124" width="82" height="14" rx="4"/><rect class="ln" x="112" y="152" width="100" height="9" rx="4"/><rect class="hl h2" x="112" y="176" width="64" height="14" rx="4"/>
      <rect class="ln" x="268" y="100" width="100" height="9" rx="4"/><rect class="hl h3" x="268" y="124" width="90" height="14" rx="4"/><rect class="ln" x="268" y="152" width="100" height="9" rx="4"/><rect class="ln" x="268" y="176" width="70" height="9" rx="4"/>
      <circle class="lens" cx="330" cy="205" r="34"/><path class="grip" d="M354 230l36 36" />
      <path class="note" d="M96 232h96a8 8 0 0 1 8 8v22a8 8 0 0 1-8 8H96a8 8 0 0 1-8-8v-22a8 8 0 0 1 8-8z"/><rect class="ln" x="102" y="244" width="76" height="6" rx="3"/><rect class="ln" x="102" y="256" width="52" height="6" rx="3"/>`,
    ),
  sentences: (alt) =>
    SVG(
      alt,
      `<rect class="bg" x="0" y="0" width="480" height="300" rx="24"/>
      <rect class="belt" x="30" y="170" width="420" height="22" rx="11"/>
      <g class="gear g1"><circle cx="110" cy="110" r="38"/><circle class="hub" cx="110" cy="110" r="12"/></g>
      <g class="gear g2"><circle cx="190" cy="82" r="26"/><circle class="hub" cx="190" cy="82" r="9"/></g>
      <rect class="box" x="250" y="60" width="180" height="84" rx="14"/>
      <rect class="slot s" x="266" y="82" width="46" height="24" rx="8"/><rect class="slot v" x="318" y="82" width="46" height="24" rx="8"/><rect class="slot o" x="370" y="82" width="46" height="24" rx="8"/>
      <rect class="tile s" x="56" y="140" width="58" height="26" rx="8"/><rect class="tile v" x="126" y="140" width="58" height="26" rx="8"/><rect class="tile o" x="196" y="140" width="58" height="26" rx="8"/>
      <rect class="tile m" x="300" y="215" width="62" height="26" rx="8"/><rect class="tile c" x="374" y="215" width="44" height="26" rx="8"/>
      <path class="arrow" d="M330 150v36m-10-10l10 12 10-12"/>`,
    ),
};
