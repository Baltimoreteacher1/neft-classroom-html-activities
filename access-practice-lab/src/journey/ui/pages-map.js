// /journey/map: 4 units x 3 missions x 6 steps as a winding trail. The trail is ONE nested ordered list
// (units > missions > steps), so a screen reader and the keyboard get the same order the eye follows;
// journey.css draws it as a trail on wide screens and a vertical path on phones.
import { html, icon, raw } from "../../util.js";
import { FEATURES, MISSIONS, MISSION_IDS, UNITS, missionNumber, stepInfo } from "../curriculum.js";
import { missionProgress, missionStatus } from "../state.js";
import {
  KLU_NAME,
  MISSION_STATUS,
  envChip,
  hasGrowthRecord,
  hereChip,
  jhref,
  legendHTML,
  missionDone,
  pipRow,
  resolveDeps,
  stepHref,
  tx,
  unitClass,
  unitLabel,
} from "./pages-shared.js";

const STATUS_GLYPH = {
  "in-progress": "play",
  "completed-with-support": "check",
  "independently-demonstrated": "star",
};
const SPIRAL = raw(
  '<svg class="jr-spiral" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 13a1 1 0 1 1 1-1 3 3 0 1 1-3-3 5 5 0 1 1 5 5"/></svg>',
);

/** Subtle markers on a node: the spiral edge it builds on, a review that is ready, and Before & After evidence. */
function marksHTML(I, band, id, review, growth) {
  const m = MISSIONS[id];
  const marks = [];
  if (m.reviews.length)
    marks.push(
      html`<li class="jr-mark is-spiral">
        ${SPIRAL}<span>${I.T("Builds on", "Se apoya en")}</span>
        ${m.reviews.map((r) => html`<a href="${jhref(band, `/${r}`)}">${I.T(`Mission ${missionNumber(r)}`, `Misión ${missionNumber(r)}`)}</a>`)}
      </li>`,
    );
  if (review)
    marks.push(
      html`<li class="jr-mark is-review">
        <a href="${stepHref(band, review.mission, review.step)}"
          >${icon("retry")}<span
            >${I.T("Keep it strong", "Mantenlo fuerte")}:
            ${tx(I, FEATURES[review.feature].label)}</span
          ></a
        >
      </li>`,
    );
  if (growth)
    marks.push(
      html`<li class="jr-mark is-evidence">
        <a href="${jhref(band, `/${id}`)}#before-after"
          >${icon("growth")}<span>${I.T("Before & After", "Antes y después")}</span></a
        >
      </li>`,
    );
  return marks.length
    ? html`<ul class="jr-marks">
        ${marks}
      </ul>`
    : "";
}

function nodeHTML(c, id) {
  const { I, band, state, ledger, recommendation: rec, reviewBy } = c;
  const m = MISSIONS[id];
  const n = missionNumber(id);
  const status = missionStatus(state, band, id);
  const prog = missionProgress(state, band, id);
  const here = rec.mission === id;
  return html`<li
    class="jr-node ${here ? "is-current" : ""}"
    id="jr-${id}"
    data-mission="${id}"
    data-status="${status}"
    ${here ? raw('tabindex="-1"') : ""}
  >
    <article class="jr-card" aria-labelledby="jr-${id}-t">
      <div class="jr-card-top">
        <span class="jr-num" aria-hidden="true">${n}</span>${envChip(I, m.environment)}
      </div>
      <p class="jr-kick">${I.T(`Mission ${n} of ${MISSION_IDS.length}`, `Misión ${n} de ${MISSION_IDS.length}`)}</p>
      <h3 id="jr-${id}-t"><a href="${jhref(band, `/${id}`)}">${tx(I, m.title)}</a></h3>
      <p class="jr-status is-${status}">
        ${STATUS_GLYPH[status] ? icon(STATUS_GLYPH[status]) : ""}<strong
          >${tx(I, MISSION_STATUS[status])}</strong
        ><span>${I.T(`${prog.done} of 6 steps`, `${prog.done} de 6 pasos`)}</span>
      </p>
      ${here ? hereChip(I) : ""} ${pipRow(I, state, band, id, { here: here ? rec.step : null })}
      ${marksHTML(I, band, id, reviewBy.get(id), hasGrowthRecord(ledger, band, id))}
    </article>
  </li>`;
}

function unitHTML(c, u) {
  const { I, band, state } = c;
  const done = u.missions.filter((id) => missionDone(state, band, id)).length;
  const steps = u.missions.reduce((s, id) => s + missionProgress(state, band, id).done, 0);
  return html`<li class="jr-unit ${`jr-u${u.n}`}" id="u${u.n}" aria-labelledby="u${u.n}-t">
    <header class="jr-unit-head">
      <span class="jr-unit-n" aria-hidden="true">${u.n}</span>
      <div class="jr-unit-copy">
        <h2 id="u${u.n}-t">${unitLabel(I, u)}</h2>
        <p class="fine">${tx(I, u.blurb)}</p>
      </div>
      <p class="jr-unit-prog">
        <span class="jr-klu">${tx(I, KLU_NAME[u.klu])}</span
        ><span class="fine"
          >${I.T(`${done} of 3 missions · ${steps} of 18 steps`, `${done} de 3 misiones · ${steps} de 18 pasos`)}</span
        >
      </p>
    </header>
    <ol class="jr-trail">
      ${u.missions.map((id) => nodeHTML(c, id))}
    </ol>
  </li>`;
}

export function mapHTML(ctx, deps = {}) {
  const d = resolveDeps(ctx, deps);
  const { I, band, recommendation: rec } = d;
  const c = { ...d, reviewBy: new Map(d.reviews.map((r) => [r.mission, r])) };
  const step = stepInfo(rec.step);
  return html`<div class="jr-page jr-map-page" data-band="${band}">
    <nav class="crumbs" aria-label="${I.S("Breadcrumb", "Ruta de navegación")}">
      <ol>
        <li><a href="${jhref(band)}">${I.T("My Journey", "Mi viaje")}</a></li>
        <li aria-current="page">${I.T("Journey map", "Mapa del viaje")}</li>
      </ol>
    </nav>
    <header class="jr-map-head">
      <div>
        <p class="eyebrow">
          ${I.T("Four units · twelve missions · six steps each", "Cuatro unidades · doce misiones · seis pasos cada una")}
        </p>
        <h1 id="mapTitle" tabindex="-1">${I.T("My Journey Map", "Mi mapa del viaje")}</h1>
        <p class="lead">
          ${I.T("Follow the trail from telling stories to making your case. Open any mission; the marker shows where you are.", "Sigue el sendero desde contar historias hasta defender tu postura. Abre cualquier misión; el marcador muestra dónde estás.")}
        </p>
      </div>
      <div class="jr-map-tools">
        <a class="btn btn-primary" href="${stepHref(band, rec.mission, rec.step)}"
          >${I.T(`Go to Mission ${missionNumber(rec.mission)}, Step ${step.n}`, `Ir a la misión ${missionNumber(rec.mission)}, paso ${step.n}`)}${icon("arrow-right")}</a
        >
        <a class="btn" href="#jr-${rec.mission}"
          >${icon("pin")}${I.T("Show where I am", "Mostrar dónde estoy")}</a
        >
      </div>
      ${legendHTML(I)}
    </header>
    <ol
      class="jr-units"
      aria-label="${I.S("The learning journey: four units", "El viaje de aprendizaje: cuatro unidades")}"
    >
      ${UNITS.map((u) => unitHTML(c, u))}
    </ol>
    <p class="jr-foot fine">
      ${I.T("Markers show what you did and which help you used. They are not scores or levels.", "Los marcadores muestran lo que hiciste y qué ayuda usaste. No son puntajes ni niveles.")}
    </p>
  </div>`;
}
