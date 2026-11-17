// Passport card "More practice on this device": the practice places that keep their own records outside the four
// domain rooms (Language Choice Boards, Talk Table, Access Prep skill builders, Daily Warm-Up). It only reads what
// those places already saved; it adds nothing to the stamp count, which stays the core-room activities.
import { BOARD_LINES_NOTE, choiceSummary, talkSummary } from "../lang/boards.js";
import { getWarmup, isComplete } from "../lang/warmup.js";
import { PREFIX } from "../store.js";
import { BASE, html, icon, safeJson, storage, todayISO } from "../util.js";

function prepDone() {
  let n = 0;
  for (const k of storage.keys()) if (k.startsWith(`${PREFIX}:prep:`) && safeJson(storage.get(k), null)?.done) n += 1;
  return n;
}

function warmupDays(prefs) {
  const days = getWarmup(prefs).days || {};
  return Object.values(days).filter((d) => isComplete(d)).length;
}

export function morePracticeHTML(I, band, prefs) {
  const choice = choiceSummary(storage.get(`${PREFIX}:choiceBoards`), band);
  const talk = talkSummary(storage.get(`${PREFIX}:talkTable`), todayISO());
  const prep = prepDone();
  const warm = warmupDays(prefs);
  const row = (ico, title, value, note, href) => html`<li>
    <span class="pass-more-ico" aria-hidden="true">${icon(ico)}</span>
    <a href="${href}">${title}</a>
    <strong>${value}</strong>
    <span class="fine">${note}</span>
  </li>`;
  return html`<section class="pass-card pass-more" aria-labelledby="passMore">
    <h2 id="passMore">${icon("grid")} ${I.T("More practice on this device", "Más práctica en este dispositivo")}</h2>
    <ul class="pass-more-list">
      ${row("grid", I.T("Choice Boards", "Tableros de opciones"), choice.squares, I.T(`squares · ${choice.lines} three-in-a-row ${choice.lines === 1 ? "line" : "lines"}`, `casillas · ${choice.lines} ${choice.lines === 1 ? "línea" : "líneas"} de tres`), `${BASE}/choice-boards?grades=${band}`)}
      ${row("conversation", I.T("Talk Table", "Mesa de conversación"), talk.cards, I.T(`family talks · ${talk.week} this week`, `conversaciones · ${talk.week} esta semana`), `${BASE}/talk-table?grades=${band}`)}
      ${row("tests", I.T("Access Prep skill builders", "Prácticas de destrezas ACCESS"), prep, I.T("sets finished", "conjuntos terminados"), `${BASE}/access-prep?grades=${band}`)}
      ${row("sparkle", I.T("Daily Warm-Up", "Calentamiento diario"), warm, I.T("days with all four steps", "días con los cuatro pasos"), `${BASE}/warmup?grades=${band}`)}
    </ul>
    <p class="fine">${I.T(BOARD_LINES_NOTE[0], BOARD_LINES_NOTE[1])}</p>
  </section>`;
}
