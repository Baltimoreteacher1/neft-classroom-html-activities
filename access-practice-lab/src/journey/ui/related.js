// Related practice for the Journey: a collapsible list under the step-complete panel and the mission overview, and an
// optional unit checkpoint card. The mapping lives in ../resources.js; this file only renders it.
// Nothing here changes progress. Items are practice around the mission, never a requirement, and checkpoint tests
// are linked exactly as they exist (Independent Rehearsal mode, no supports).
import { loadIndex } from "../../content.js";
import { html, icon } from "../../util.js";
import { MISSIONS, STEPS, unitOf } from "../curriculum.js";
import { checkpointsFor, resourcesFor } from "../resources.js";

const SHOWN = 3;

/** The content index, or null when it cannot be loaded (offline, tests): the registry still answers. */
async function readIndex() {
  try {
    return await loadIndex();
  } catch {
    return null;
  }
}

const KIND_GLYPH = {
  activity: "reading",
  studio: "worlds",
  game: "sparkle",
  test: "tests",
  printable: "save",
  family: "families",
};

function itemHTML(I, r) {
  const title = r.titleT ? I.T(...r.titleT) : html`<span lang="en">${r.title}</span>`;
  return html`<li>
    <a href="${r.href}">${icon(KIND_GLYPH[r.kind] || "arrow-right")}<strong>${title}</strong></a>
    ${r.tag ? html`<span class="jr-chip">${I.T(...r.tag)}</span>` : ""}
    <span class="fine">${I.T(...r.why)}</span>
  </li>`;
}

/** The "Related practice" collapsible for one step (3 items). Empty string when the step has none. */
export function relatedListHTML(I, band, missionId, stepId, index) {
  const list = resourcesFor(missionId, stepId, band, index).slice(0, SHOWN);
  if (!list.length) return "";
  const step = STEPS.find((s) => s.id === stepId);
  return html`<details class="jr-related" data-jr-related>
    <summary>
      ${icon("reading")} ${I.T("Related practice", "Práctica relacionada")}
      <span class="fine"
        >${I.T(`more for ${step.label[0]}, if you want it`, `más para ${step.label[1]}, si quieres`)}</span
      >
    </summary>
    <ul class="jr-related-list">
      ${list.map((r) => itemHTML(I, r))}
    </ul>
  </details>`;
}

/** The optional end-of-unit checkpoint card. Empty string when the unit has no tests for this band. */
export function checkpointCardHTML(I, band, unitN, index) {
  const list = checkpointsFor(unitN, band, index);
  if (!list.length) return "";
  return html`<section
    class="jr-checkpoint"
    aria-labelledby="jrCheckpoint${unitN}"
    data-jr-checkpoint
  >
    <h3 id="jrCheckpoint${unitN}">
      ${icon("tests")}
      ${I.T("Unit checkpoint (optional)", "Punto de control de la unidad (opcional)")}
    </h3>
    <p class="fine">
      ${I.T("A practice test you can try on your own, with no help shown. It does not change your journey.", "Una prueba de práctica que puedes intentar por tu cuenta, sin ayuda a la vista. No cambia tu viaje.")}
    </p>
    <ul class="jr-related-list">
      ${list.map((r) => itemHTML(I, r))}
    </ul>
  </section>`;
}

/**
 * Markup for the step-complete panel: related practice for the step just finished, plus the unit checkpoint card
 * when the recommendation says the unit is complete.
 */
export async function relatedPanelHTML({ I, band, missionId, stepId, rec }) {
  const index = await readIndex();
  const unit = unitOf(missionId);
  const card =
    rec?.kind === "unit-complete" && unit ? checkpointCardHTML(I, band, unit.n, index) : "";
  return html`${relatedListHTML(I, band, missionId, stepId, index)}${card}`;
}

/**
 * Markup for the mission overview: related practice for the step the learner is about to do, plus the unit
 * checkpoint card once every mission of the unit is complete (`unitDone`).
 */
export async function relatedOverviewHTML({ I, band, missionId, stepId, unitDone = false }) {
  if (!MISSIONS[missionId]) return "";
  const index = await readIndex();
  const unit = unitOf(missionId);
  const card = unitDone && unit ? checkpointCardHTML(I, band, unit.n, index) : "";
  return html`${relatedListHTML(I, band, missionId, stepId, index)}${card}`;
}
