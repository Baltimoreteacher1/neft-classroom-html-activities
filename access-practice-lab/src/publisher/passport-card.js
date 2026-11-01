// Passport card for the connected journey. Reads the journey's own saved record; shows nothing until the learner has started it.
import { BASE, html, icon, safeJson, storage } from "../util.js";
import { normalize, STORE_KEY, summarize } from "./evidence.js";

export function journeyCardHTML(J, I) {
  const raw = safeJson(storage.get(STORE_KEY), null);
  if (!raw || !J) return "";
  const sum = summarize(normalize(raw), J);
  const started = sum.listen.done + sum.read.done + sum.speak.takes + sum.speak.checks + sum.write.drafts > 0;
  if (!started) return "";
  const stage = (st) => (st === "independent" ? I.T("on my own", "por mi cuenta") : I.T("with support", "con apoyo"));
  const rows = [
    [I.T("Listening", "Escuchar"), sum.listen.stage, I.T(`${sum.listen.done} of ${sum.listen.total} tasks`, `${sum.listen.done} de ${sum.listen.total} tareas`)],
    [I.T("Reading", "Leer"), sum.read.stage, I.T(`${sum.read.done} of ${sum.read.total} tasks`, `${sum.read.done} de ${sum.read.total} tareas`)],
    [I.T("Speaking", "Hablar"), sum.speak.stage, I.T(`${sum.speak.takes} recording(s)`, `${sum.speak.takes} grabación(es)`)],
    [I.T("Writing", "Escribir"), sum.write.stage, I.T(`${sum.write.drafts} draft(s)`, `${sum.write.drafts} borrador(es)`)],
  ];
  return html`<section class="pass-card" aria-labelledby="passJourney">
    <h2 id="passJourney">${icon("list")} ${I.T("Connected journey", "Recorrido conectado")}: ${J.title}</h2>
    <ul>${rows.map(([name, st, n]) => html`<li><strong>${name}</strong>: ${n}, ${stage(st)}</li>`)}</ul>
    <p class="fine">${I.T("Practice evidence, not a score or level. “With support” and “on my own” are kept apart.", "Evidencia de práctica, no una calificación ni un nivel. “Con apoyo” y “por mi cuenta” se mantienen separados.")}</p>
    <a class="btn" href="${BASE}/publisher-demo/evidence">${I.T("See evidence and next step", "Ver evidencia y siguiente paso")}</a></section>`;
}
