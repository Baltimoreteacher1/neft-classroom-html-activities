// Passport card for thematic units: the units this learner has started, with progress and any certificate.
// Reads the units' own saved record; shows nothing until a unit has been started.
import { loadIndex, loadUnits } from "../content.js";
import { activityDoneReader, activityLocator, loadUnitsState, unitProgress } from "../lang/units.js";
import { loadRecord } from "../store.js";
import { html, icon } from "../util.js";
import { unitsHref } from "./units-common.js";

export async function unitsPassportHTML(I) {
  const state = loadUnitsState();
  if (!Object.keys(state.units).length) return "";
  const [index, ...files] = await Promise.all([loadIndex(), ...["6-8", "3-5"].map((b) => loadUnits(b))]);
  const rows = [];
  for (const [i, band] of ["6-8", "3-5"].entries()) {
    const done = activityDoneReader(activityLocator(index, band), loadRecord);
    for (const unit of files[i]?.units || []) {
      const rec = state.units[unit.id];
      if (!rec) continue;
      const p = unitProgress(unit, rec, done);
      if (p.started) rows.push({ band, unit, p, rec });
    }
  }
  if (!rows.length) return "";
  return html`<section class="pass-card" aria-labelledby="passUnits">
    <h2 id="passUnits">${icon("road")} ${I.T("Units", "Unidades")}</h2>
    <ul>${rows.map(({ band, unit, p, rec }) => html`<li><a href="${unitsHref(band, unit.id)}"><strong>${I.TO(unit.title)}</strong></a>: ${I.T(`${p.finished} of ${p.stops} stops finished`, `${p.finished} de ${p.stops} paradas terminadas`)}${rec.cert ? html` · <a href="${unitsHref(band, unit.id, "certificate")}">${icon("medal")} ${I.T("Certificate", "Certificado")}</a>` : ""}</li>`)}</ul>
    <p class="fine">${I.T("A record of what you did, not a score or a level.", "Un registro de lo que hiciste, no una calificación ni un nivel.")}</p></section>`;
}
