// Shared pieces of the Units views: routes, the loaded session (data + progress), headings, and the bilingual helpers.
import { crumbsHTML } from "../components.js";
import { loadIndex, loadUnits } from "../content.js";
import {
  activityDoneReader,
  activityLocator,
  loadUnitsState,
  normalizeUnits,
  saveUnitsState,
  unitProgress,
} from "../lang/units.js";
import { loadRecord } from "../store.js";
import { BASE, html, icon } from "../util.js";

export const DOMAIN_ICON = {
  Listening: "listening",
  Speaking: "speaking",
  Reading: "reading",
  Writing: "writing",
};
export const DOMAIN_ES = {
  Listening: "Escuchar",
  Speaking: "Hablar",
  Reading: "Leer",
  Writing: "Escribir",
};
export const LEVEL_NAME = {
  A: ["Starting support", "Apoyo inicial"],
  B: ["Growing", "En crecimiento"],
  C: ["Expanding", "En expansión"],
};

export const unitsHref = (band, id = "", sub = "", query = "") =>
  `${BASE}/units${id ? `/${id}` : ""}${sub ? `/${sub}` : ""}?grades=${band}${query}`;

/** Everything one render needs: the band's units, the activity locator, this device's progress and a saver. */
export async function loadSession(band) {
  const [data, index] = await Promise.all([loadUnits(band), loadIndex()]);
  const units = data?.units || [];
  const locator = activityLocator(index, band);
  const state = loadUnitsState();
  const activityDone = activityDoneReader(locator, loadRecord);
  return {
    band,
    units,
    byId: new Map(units.map((u) => [u.id, u])),
    locator,
    state,
    activityDone,
    save: () => saveUnitsState(state),
  };
}

/** The other band that owns a unit id, so a shared link opens in the right band. */
export async function bandOwning(id, band) {
  const other = band === "6-8" ? "3-5" : "6-8";
  const data = await loadUnits(other);
  return data?.units?.some((u) => u.id === id) ? other : null;
}

export function unitCrumbs(I, band, unit = null, here = null) {
  const items = [
    [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
    [I.S("Units", "Unidades"), unit || here ? unitsHref(band) : null],
  ];
  if (unit) items.push([I.pick(unit.title), here ? unitsHref(band, unit.id) : null]);
  if (here) items.push([here, null]);
  return crumbsHTML(
    items.filter((x) => x[0] !== undefined),
    { i18n: I },
  );
}

/** Paragraphs of an authored text (blank line = new paragraph). */
export const paragraphs = (text) =>
  String(text || "")
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);

/** English text with the Spanish alongside in bilingual mode, or Spanish alone in Spanish mode. */
export function textBlocks(I, en, es, { cls = "un-prose", lead = "" } = {}) {
  const block = (t, lang) =>
    html`<div class="${cls}" lang="${lang}">${paragraphs(t).map((p) => html`<p>${p}</p>`)}</div>`;
  if (I.spanish) return html`${lead}${block(es, "es")}`;
  if (I.bilingual) return html`${lead}${block(en, "en")}${block(es, "es")}`;
  return html`${lead}${block(en, "en")}`;
}

export const domainChip = (I, d) =>
  html`<span class="un-chip un-chip-${d.toLowerCase()}"
    >${icon(DOMAIN_ICON[d])} ${I.T(d, DOMAIN_ES[d])}</span
  >`;

/** Progress bar with an accessible text value; the number is finished stops, never a score. */
export function barHTML(I, done, total, label) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return html`<div
    class="un-bar"
    role="img"
    aria-label="${I.S(`${label}: ${done} of ${total}`, `${label}: ${done} de ${total}`)}"
  >
    <span style="width:${pct}%"></span>
  </div>`;
}

export const NOT_FOUND = (I, band) => ({
  title: I.S("Unit not found", "No se encontró la unidad"),
  html: html`${unitCrumbs(I, band, null, I.S("Not found", "No se encontró"))}
    <section class="panel empty-state">
      <h1 tabindex="-1">
        ${I.T("We could not find that unit or lesson.", "No pudimos encontrar esa unidad o lección.")}
      </h1>
      <p>
        <a class="btn btn-primary" href="${unitsHref(band)}"
          >${I.T("All units", "Todas las unidades")}</a
        >
      </p>
    </section>`,
});

export const DISCLAIMER = (I) =>
  html`<p class="disclaimer">
    ${I.T("Practice on this device. Your progress is a record of what you did, not a score, a level or a prediction. Spanish is machine-assisted and has not been reviewed by a human translator.", "Práctica en este dispositivo. Tu progreso es un registro de lo que hiciste, no una calificación, un nivel ni una predicción. El español es asistido por máquina y no lo ha revisado un traductor humano.")}
  </p>`;

const emptyRec = () => normalizeUnits({ units: { x: {} } }).units.x;
/** This unit's record on this device (created empty on first touch; call session.save() after changing it). */
export const recOf = (session, id) => (session.state.units[id] ||= emptyRec());
/** unitProgress plus whether the certificate has been claimed. */
export const progressFor = (session, unit) => ({ ...unitProgress(unit, recOf(session, unit.id), session.activityDone), certificate: Boolean(session.state.units[unit.id]?.cert) });
