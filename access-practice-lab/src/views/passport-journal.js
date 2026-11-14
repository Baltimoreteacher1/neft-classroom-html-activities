// /passport/journal: the Trip journal. One entry per finished journey stop (what the learner did, plus one line they
// write: "I learned / Aprendí"), and the culture cards each country has opened. Saved on this device in the
// preferences record the Passport progress code exports (src/trip-journal.js). Prints as a plain paper journal.
// Practice, not a score: entries exist because stops were finished; nothing here rates the learner.
import { crumbsHTML } from "../components.js";
import { bandRows } from "../content.js";
import {
  CARD_KINDS,
  KIND_LABEL,
  PASSPORT_CARDS,
  cardStop,
  cardUnlocks,
} from "../content/passport-cards.js";
import { i18nFor } from "../i18n.js";
import { routeProgress } from "../journey.js";
import { getStudentName, loadRecord } from "../store.js";
import { MAX_LINE, getJournal, journalEntries, journalPatch } from "../trip-journal.js";
import { BASE, DOMAIN_META, announce, bandLabel, html, icon, raw } from "../util.js";

const IGN = raw("data-nsr-ignore");

/** The cards a country has opened, plus a locked placeholder that says when the next one opens. */
export function cardsHTML(I, route) {
  const [en] = route.country;
  const cards = PASSPORT_CARDS[en] || [];
  const open = cardUnlocks(route.stopsDone, route.stops);
  const next = open < CARD_KINDS.length ? cardStop(open, route.stops) : 0;
  return html`<ul class="tj-cards">
    ${cards.slice(0, open).map(
      (c) =>
        html`<li class="tj-card">
          <p class="eyebrow">${I.T(...KIND_LABEL[c.kind])}</p>
          <h4>${I.T(...c.title)}</h4>
          <p>${I.T(...c.text)}</p>
          <p class="tj-ask">${icon("families")} ${I.T(...c.ask)}</p>
        </li>`,
    )}
    ${next ? html`<li class="tj-card is-locked no-print"><p class="fine">${I.T(`Next card opens at stop ${next}.`, `La próxima tarjeta se abre en la parada ${next}.`)}</p></li>` : ""}
  </ul>`;
}

function countryHTML(I, group) {
  const id = `tj-${group.domain}-${group.level}`;
  return html`<section class="panel tj-country" aria-labelledby="${id}">
    <h2 id="${id}">
      ${I.T(...group.country)}
      <span class="fine">· ${I.T(group.domain, DOMAIN_META[group.domain].es)}</span>
    </h2>
    <p class="fine">
      ${I.T(`${group.stopsDone} of ${group.stops} stops finished`, `${group.stopsDone} de ${group.stops} paradas terminadas`)}
    </p>
    <h3>${I.T("Culture cards", "Tarjetas de cultura")}</h3>
    ${cardsHTML(I, group)}
    <h3>${I.T("My stops", "Mis paradas")}</h3>
    <ol class="tj-entries">
      ${group.entries.map(
        (e) =>
          html`<li class="tj-entry">
            <p class="tj-stop">
              <strong>${I.T(`Stop ${e.stop}`, `Parada ${e.stop}`)}</strong> ·
              ${e.activities.join(" · ")}
            </p>
            <label class="field"
              ><span>${I.T("I learned…", "Aprendí…")}</span
              ><input
                type="text"
                maxlength="${MAX_LINE}"
                autocomplete="off"
                data-tj-line="${e.key}"
                value="${e.line}"
                ${IGN}
            /></label>
            <p class="tj-print-line" aria-hidden="true">${e.line || " "}</p>
          </li>`,
      )}
    </ol>
  </section>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const band = ctx.band;
  const rows = await bandRows(band);
  const saved = rows.map((row) => ({ ...row, record: loadRecord(band, row.domain, row.level) }));
  const titles = new Map(rows.map((r) => [r.id, r.title]));
  const groups = journalEntries(band, routeProgress(saved), titles, getJournal(ctx.prefs));
  const name = getStudentName();
  return {
    title: I.S("Trip journal", "Diario del viaje"),
    html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/`],
        [I.S("My Passport", "Pasaporte"), `${BASE}/passport?grades=${band}`],
        [I.S("Trip journal", "Diario del viaje"), null],
      ])}
      <section class="tj-page">
        <header class="panel tj-head">
          <p class="eyebrow">
            ${I.T(`My journey · ${bandLabel(band)}`, `Mi viaje · ${bandLabel(band)}`)}
          </p>
          <h1 tabindex="-1">
            ${name ? I.T(`${name}'s trip journal`, `Diario del viaje de ${name}`) : I.T("My trip journal", "Mi diario del viaje")}
          </h1>
          <p class="lead">
            ${I.T("Every finished stop gets a page here. Write one thing you learned. Culture cards open as you travel.", "Cada parada terminada tiene su página aquí. Escribe una cosa que aprendiste. Las tarjetas de cultura se abren mientras viajas.")}
          </p>
          <p class="fine">
            ${I.T("Saved on this device. Your Passport progress code carries it. This is practice, not a score.", "Se guarda en este dispositivo. Tu código de progreso del Pasaporte lo incluye. Es práctica, no un puntaje.")}
          </p>
          <div class="row-actions no-print">
            <button type="button" class="btn btn-primary" data-tj-print>
              ${icon("print")} ${I.T("Print my journal", "Imprimir mi diario")}
            </button>
            <a class="btn" href="${BASE}/passport?grades=${band}"
              >${icon("arrow-left")} ${I.T("Back to my Passport", "Volver a mi Pasaporte")}</a
            >
          </div>
        </header>
        ${
          groups.length
            ? groups.map((g) => countryHTML(I, g))
            : html`<section class="panel">
                <p>
                  ${I.T("Finish your first stop on My journey and its page will appear here.", "Termina tu primera parada en Mi viaje y su página aparecerá aquí.")}
                </p>
                <a class="btn btn-primary" href="${BASE}/passport?grades=${band}#journeyTitle"
                  >${I.T("Go to My journey", "Ir a Mi viaje")} ${icon("arrow-right")}</a
                >
              </section>`
        }
      </section>`,
  };
}

export function onInput(e, ctx) {
  const input = e.target.closest?.("[data-tj-line]");
  if (!input) return false;
  ctx.setPrefs(journalPatch(ctx.prefs, input.dataset.tjLine, input.value));
  const echo = input.closest(".tj-entry")?.querySelector(".tj-print-line");
  if (echo) echo.textContent = input.value.trim() || " ";
  return true;
}

export function onClick(e, ctx) {
  if (!e.target.closest("[data-tj-print]")) return false;
  announce(i18nFor(ctx).S("Opening the print window.", "Abriendo la ventana de impresión."));
  window.print();
  return true;
}
