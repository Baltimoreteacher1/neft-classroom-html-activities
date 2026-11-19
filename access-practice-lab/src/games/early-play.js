// Language Game Studio for the early bands (K, 1, 2-3). The 22 studio games are written for grades 3-8, so these
// bands open their own practice activities instead, grouped by skill: the same activities the Early Hub lists,
// read from the band's content index. Never an empty hub.
import { bandLabel, bandLabelEs } from "../bands.js";
import { BASE, CORE_DOMAINS, DOMAIN_META, html, icon } from "../util.js";
import { activityHref } from "../views/room.js";

const card = (I, band, row) => html`<li class="gs-card panel">
  <div class="gs-card-body">
    <h3><a href="${activityHref(row.domain, row.level, row.id)}?grades=${band}">${row.title}</a></h3>
    <p class="fine">${row.skill || I.S("Language practice", "Práctica de lenguaje")} · ${row.minutes || "5"} min</p>
    <a class="btn btn-primary" href="${activityHref(row.domain, row.level, row.id)}?grades=${band}">${icon("play")}${I.T("Play", "Jugar")}<span class="visually-hidden"> ${row.title}</span></a>
  </div>
</li>`;

/** `rows` are the band's index rows (bandRows). */
export function earlyPlayHTML(I, band, rows) {
  const groups = CORE_DOMAINS.map((d) => [d, rows.filter((r) => r.domain === d)]).filter(([, list]) => list.length);
  return html`<div class="gs-hub gs-band-${band}">
    <header class="gs-hero">
      <div class="gs-hero-copy">
        <p class="gm-kicker">${icon("sparkle")}${I.T("Language Game Studio", "Estudio de juegos de lenguaje")}</p>
        <h1 tabindex="-1">${I.T("Play with language", "Juega con el lenguaje")}</h1>
        <p class="lead">${I.T(`${rows.length} short activities for ${bandLabel(band)}. Pick a skill and play. Directions are read aloud and there is no timer.`, `${rows.length} actividades cortas para ${bandLabelEs(band)}. Elige una destreza y juega. Las instrucciones se leen en voz alta y no hay cronómetro.`)}</p>
        <p><a class="btn" href="${BASE}/early?grades=${band}">${I.T("Open the Early Hub", "Abrir el Centro infantil")}</a></p>
      </div>
    </header>
    ${groups.map(([d, list]) => html`<section class="gs-all" aria-labelledby="ep-${d}"><h2 id="ep-${d}">${icon(DOMAIN_META[d].icon)} ${I.S(DOMAIN_META[d].name, DOMAIN_META[d].es)} <small>(${list.length})</small></h2>
      <ul class="gs-grid">${list.map((r) => card(I, band, r))}</ul></section>`)}
  </div>`;
}
