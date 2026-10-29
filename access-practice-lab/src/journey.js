// "My journey": every skill and level is one country, and each country is a route of up to 12 stops.
// A stop is finished when every activity in its slice of the route is finished, so grades 3-5
// (12 activities per level) get one activity per stop and grades 6-8 (about 24-28) get two or three.
// Finishing all stops earns the country sticker on the paper passport. This is finished practice,
// never a score or a level: the paper passport shows country names, not level letters.
import { isActivityComplete } from "./store.js";
import { CORE_DOMAINS, DOMAIN_META, LEVEL_KEYS, html } from "./util.js";

export const STOPS = 12;

/** [English, Spanish] country for each skill and level. The paper passport and its teacher key use the same table. */
export const COUNTRIES = {
  Listening: { A: ["Japan", "Japón"], B: ["Kenya", "Kenia"], C: ["Brazil", "Brasil"] },
  Speaking: { A: ["Mexico", "México"], B: ["Italy", "Italia"], C: ["India", "India"] },
  Reading: { A: ["Egypt", "Egipto"], B: ["Peru", "Perú"], C: ["Australia", "Australia"] },
  Writing: { A: ["Canada", "Canadá"], B: ["Morocco", "Marruecos"], C: ["China", "China"] },
};

/** Split `count` activities into up to STOPS consecutive slices, as evenly as possible: [start, end) pairs. */
export function stopSlices(count) {
  const stops = Math.min(STOPS, count);
  return Array.from({ length: stops }, (_, i) => [Math.round((i * count) / stops), Math.round(((i + 1) * count) / stops)]);
}

/**
 * @param {{id: string, domain: string, level: string, record: object}[]} rows activities in authored order, each with its saved record
 * @returns {{domain: string, level: string, country: string[], total: number, stops: boolean[], stopsDone: number, complete: boolean}[]}
 */
export function routeProgress(rows) {
  const routes = [];
  for (const domain of CORE_DOMAINS) {
    for (const level of LEVEL_KEYS) {
      const acts = rows.filter((r) => r.domain === domain && r.level === level);
      if (!acts.length) continue;
      const done = acts.map((r) => isActivityComplete(r.record, r.id));
      const stops = stopSlices(acts.length).map(([from, to]) => done.slice(from, to).every(Boolean));
      const stopsDone = stops.filter(Boolean).length;
      routes.push({ domain, level, country: COUNTRIES[domain][level], total: acts.length, stops, stopsDone, complete: stopsDone === stops.length });
    }
  }
  return routes;
}

export function journeyHTML(I, routes) {
  const cards = routes.map(
    (r) => html`<li class="journey-card d-${r.domain.toLowerCase()} ${r.complete ? "is-done" : ""}">
      <div class="journey-name"><strong>${I.T(...r.country)}</strong><span class="fine">${I.T(r.domain, DOMAIN_META[r.domain].es)}</span></div>
      <ol class="journey-stops" aria-label="${I.S(`${r.stopsDone} of ${r.stops.length} stops finished`, `${r.stopsDone} de ${r.stops.length} paradas terminadas`)}">${r.stops.map((on) => html`<li class="${on ? "on" : ""}"></li>`)}</ol>
      <p class="journey-count">${r.complete ? I.T("Country sticker earned!", "¡Calcomanía del país ganada!") : I.T(`${r.stopsDone} of ${r.stops.length} stops`, `${r.stopsDone} de ${r.stops.length} paradas`)}</p>
    </li>`,
  );
  return html`<section class="panel pass-journey" aria-labelledby="journeyTitle">
    <h2 id="journeyTitle">${I.T("My journey", "Mi viaje")}</h2>
    <p class="fine">${I.T("Each country is one skill. A stop is finished when its activities are finished. Finish all the stops to earn the country sticker for your paper passport.", "Cada país es una destreza. Una parada está terminada cuando sus actividades están terminadas. Termina todas las paradas para ganar la calcomanía del país para tu pasaporte de papel.")}</p>
    <ul class="journey-grid">${cards}</ul>
  </section>`;
}
