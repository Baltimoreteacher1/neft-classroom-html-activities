// "My journey": every skill and level is one country, and each country is a route of up to 12 stops.
// A stop is finished when every activity in its slice of the route is finished, so grades 3-5
// (12 activities per level) get one activity per stop and grades 6-8 (about 24-28) get two or three.
// Every third stop opens a culture card for the country (src/content/passport-cards.js), shown in the Trip journal.
// Finishing all stops earns the country sticker on the paper passport. This is finished practice,
// never a score or a level: the paper passport shows country names, not level letters.
import { CARD_KINDS, PASSPORT_CARDS, cardStop, cardUnlocks } from "./content/passport-cards.js";
import { isActivityComplete } from "./store.js";
import { BASE, CORE_DOMAINS, DOMAIN_META, LEVEL_KEYS, html, icon } from "./util.js";

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
 * @returns {{domain: string, level: string, country: string[], total: number, stops: boolean[], stopIds: string[][], band: string, stopsDone: number, complete: boolean}[]}
 */
export function routeProgress(rows) {
  const routes = [];
  for (const domain of CORE_DOMAINS) {
    for (const level of LEVEL_KEYS) {
      const acts = rows.filter((r) => r.domain === domain && r.level === level);
      if (!acts.length) continue;
      const done = acts.map((r) => isActivityComplete(r.record, r.id));
      const slices = stopSlices(acts.length);
      const stops = slices.map(([from, to]) => done.slice(from, to).every(Boolean));
      const stopIds = slices.map(([from, to]) => acts.slice(from, to).map((a) => a.id));
      const stopsDone = stops.filter(Boolean).length;
      routes.push({ domain, level, country: COUNTRIES[domain][level], total: acts.length, stops, stopIds, band: acts[0].band, stopsDone, complete: stopsDone === stops.length });
    }
  }
  return routes;
}

/** One tap to the first unfinished stop of a country. */
const nextStopLink = (I, r) => {
  const i = r.stops.indexOf(false);
  return html`<a class="btn btn-primary small journey-go" href="${BASE}/play?ids=${encodeURIComponent(r.stopIds[i].join(","))}&grades=${r.band}">${I.T(`${r.stopsDone ? "Continue" : "Start"}: stop ${i + 1}`, `${r.stopsDone ? "Continuar" : "Empezar"}: parada ${i + 1}`)} ${icon("arrow-right")}</a>`;
};

/** "Culture card: Mount Fuji (2 of 4)" for the newest card a route has opened, or when the first one opens. */
const cardLine = (I, r) => {
  const open = cardUnlocks(r.stopsDone, r.stops.length);
  if (!open)
    return html`<p class="journey-cardline fine">${icon("sparkle")} ${I.T(`First culture card at stop ${cardStop(0, r.stops.length)}`, `Primera tarjeta de cultura en la parada ${cardStop(0, r.stops.length)}`)}</p>`;
  const card = PASSPORT_CARDS[r.country[0]][open - 1];
  return html`<p class="journey-cardline"><a href="${BASE}/passport/journal?grades=${r.band}#tj-${r.domain}-${r.level}">${icon("sparkle")} ${I.T(`Culture card: ${card.title[0]} (${open} of ${CARD_KINDS.length})`, `Tarjeta de cultura: ${card.title[1]} (${open} de ${CARD_KINDS.length})`)}</a></p>`;
};

export function journeyHTML(I, routes) {
  const cards = routes.map(
    (r) => html`<li class="journey-card d-${r.domain.toLowerCase()} ${r.complete ? "is-done" : ""}">
      <div class="journey-name"><strong>${I.T(...r.country)}</strong><span class="fine">${I.T(r.domain, DOMAIN_META[r.domain].es)}</span></div>
      <ol class="journey-stops" aria-label="${I.S(`${r.stopsDone} of ${r.stops.length} stops finished`, `${r.stopsDone} de ${r.stops.length} paradas terminadas`)}">${r.stops.map((on, i) => html`<li class="${on ? "on" : ""}"><a href="${BASE}/play?ids=${encodeURIComponent(r.stopIds[i].join(","))}&grades=${r.band}" aria-label="${I.S(`Stop ${i + 1}: ${r.country[0]} — open its activities`, `Parada ${i + 1}: ${r.country[1]} — abrir sus actividades`)}">${on ? html`${icon("check")}<span class="visually-hidden">${I.S("Finished", "Terminada")}</span>` : i + 1}</a></li>`)}</ol>
      <p class="journey-count">${r.complete ? I.T("Country sticker earned!", "¡Calcomanía del país ganada!") : I.T(`${r.stopsDone} of ${r.stops.length} stops`, `${r.stopsDone} de ${r.stops.length} paradas`)}</p>
      ${cardLine(I, r)}
      ${r.complete ? "" : nextStopLink(I, r)}
    </li>`,
  );
  return html`<section class="panel pass-journey" aria-labelledby="journeyTitle">
    <h2 id="journeyTitle">${I.T("My journey", "Mi viaje")}</h2>
    <p class="fine">${I.T("Each country is one skill. A stop is finished when its activities are finished. Every third stop opens a culture card. Finish all the stops to earn the country sticker for your paper passport.", "Cada país es una destreza. Una parada está terminada cuando sus actividades están terminadas. Cada tercera parada abre una tarjeta de cultura. Termina todas las paradas para ganar la calcomanía del país para tu pasaporte de papel.")}</p>
    <p class="row-actions"><a class="btn small" href="${BASE}/passport/journal?grades=${routes[0]?.band || ""}">${icon("reading")} ${I.T("Open my trip journal", "Abrir mi diario del viaje")}</a></p>
    <ul class="journey-grid">${cards}</ul>
  </section>`;
}
