// "My reading log": any text I read this week, in the lab or not. Independent reading builds volume,
// and a log makes it visible to me and to a teacher in a conference. It counts texts, days and the
// minutes I typed. It is not a goal I must hit and nothing is scored.
import { addReadingLog, loadReadingState, readingLogSummary, saveReadingState } from "../reading-state.js";
import { announce, html, icon, toHtml } from "../util.js";

/** Markup (a string) for the shelf: this week's summary, the form and the last few entries. */
export function readingLogHTML(I, state) {
  const sum = readingLogSummary(state.log);
  const recent = [...(state.log || [])].reverse().slice(0, 5);
  return toHtml(html`<section class="rr-log" aria-labelledby="rr-log-title">
    <p class="rr-eyebrow">${icon("reading")} ${I.T("Independent reading", "Lectura independiente")}</p>
    <h2 id="rr-log-title">${I.T("My reading log", "Mi registro de lectura")}</h2>
    <p>${I.T("Log anything you read, in the lab or not: a book, an article, a story, a sign. Reading a little every day adds up.", "Anota cualquier cosa que leas, en el laboratorio o no: un libro, un artículo, un cuento, un letrero. Leer un poco cada día suma.")}</p>
    <p class="rr-log-sum" role="status">${I.T(
      `This week: ${sum.texts} ${sum.texts === 1 ? "text" : "texts"} on ${sum.days} ${sum.days === 1 ? "day" : "days"}${sum.minutes ? `, ${sum.minutes} minutes` : ""}.`,
      `Esta semana: ${sum.texts} ${sum.texts === 1 ? "texto" : "textos"} en ${sum.days} ${sum.days === 1 ? "día" : "días"}${sum.minutes ? `, ${sum.minutes} minutos` : ""}.`,
    )}</p>
    <div class="rr-log-form" role="group" aria-label="${I.S("Add to my reading log", "Agregar a mi registro de lectura")}">
      <label class="field"><span>${I.T("What did you read?", "¿Qué leíste?")}</span><input type="text" data-rr-log-title maxlength="80" autocomplete="off" /></label>
      <label class="field"><span>${I.T("Minutes (optional)", "Minutos (opcional)")}</span><input type="number" data-rr-log-minutes min="1" max="240" inputmode="numeric" /></label>
      <label class="field"><span>${I.T("One thing I learned or liked (optional)", "Algo que aprendí o me gustó (opcional)")}</span><input type="text" data-rr-log-note maxlength="140" autocomplete="off" /></label>
      <button type="button" class="btn btn-primary" data-rr-log-add>${I.T("Add to my log", "Agregar a mi registro")}</button>
    </div>
    ${recent.length ? html`<ul class="rr-log-list">${recent.map((row) => html`<li><strong>${row.title}</strong> <span class="fine">${row.t.slice(0, 10)}${row.minutes ? ` · ${row.minutes} min` : ""}</span>${row.note ? html`<br /><span>${row.note}</span>` : ""}</li>`)}</ul>` : ""}
  </section>`);
}

/** Click handling for the log form. Returns true when it handled the event. */
export function readingLogClick(e, ctx, I) {
  if (!e.target.closest("[data-rr-log-add]")) return false;
  const form = e.target.closest(".rr-log-form");
  const state = loadReadingState();
  const entry = addReadingLog(state, {
    title: form.querySelector("[data-rr-log-title]").value,
    minutes: form.querySelector("[data-rr-log-minutes]").value,
    note: form.querySelector("[data-rr-log-note]").value,
  });
  if (!entry) {
    announce(I.S("Type what you read first.", "Primero escribe qué leíste."));
    form.querySelector("[data-rr-log-title]").focus();
    return true;
  }
  saveReadingState(state);
  announce(I.S("Added to your reading log.", "Agregado a tu registro de lectura."));
  ctx.rerender();
  return true;
}
