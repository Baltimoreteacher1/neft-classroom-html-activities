// Teacher Hub: a read-only view of this browser's Journey evidence, followed by the shared mission guide.
// Progress stays on this device. A teacher link names only a mission and step, never a learner.
import { makeI18n } from "/access-practice-lab/src/i18n.js";
import { guideHTML, mountGuide } from "/access-practice-lab/src/journey/ui/guide.js";
import { BANDS, MISSION_IDS, MISSIONS, STEPS } from "/access-practice-lab/src/journey/curriculum.js";
import { getStep, loadJourney, missionStatus } from "/access-practice-lab/src/journey/state.js";
import { recommendNext } from "/access-practice-lab/src/journey/recommend.js";
import { loadLedger } from "/access-practice-lab/src/lang/ledger.js";
import { BASE, html, toHtml } from "/access-practice-lab/src/util.js";

const MODES = ["en", "es", "bi"];
const DOMAINS = ["Listening", "Speaking", "Reading", "Writing"];
const tx = (I, en, es) => I.T(en, es);

/** Summary of recorded actions, never a proficiency estimate or an auto-score. */
export function journeyEvidenceHTML(I, { state, ledger, band }) {
  const entries = (ledger?.entries || []).filter(
    (entry) => entry?.src === "mission" && entry.band === band &&
      MISSION_IDS.some((id) => String(entry.task || "").startsWith(`${id}.`)),
  );
  const active = MISSION_IDS.filter((id) => missionStatus(state, band, id) !== "not-started");
  const recommendation = recommendNext(state, band, { ledger });
  const recommended = recommendation && MISSION_IDS.includes(recommendation.mission) &&
    STEPS.some((step) => step.id === recommendation.step) ? recommendation : null;
  const domainRows = DOMAINS.map((domain) => {
    const own = entries.filter((entry) => entry.domain === domain);
    return { domain, first: own.filter((e) => e.kind === "first").length,
      revision: own.filter((e) => e.kind === "revision").length,
      transfer: own.filter((e) => e.kind === "transfer" && e.stage === "independent").length,
      independent: own.filter((e) => e.stage === "independent" && e.kind === "first").length };
  });
  return html`<section class="jg-sec" aria-labelledby="th-journey-evidence-title" data-journey-evidence>
    <h3 id="th-journey-evidence-title">${tx(I, "Learning evidence on this device", "Evidencia de aprendizaje en este dispositivo")}</h3>
    <p>${tx(I, "This view summarizes saved Journey actions in this browser. It is not a class roster, a WIDA score, or a rating of speaking and writing quality.", "Esta vista resume las acciones del viaje guardadas en este navegador. No es una lista de clase, un puntaje WIDA ni una calificación de la calidad oral o escrita.")}</p>
    ${active.length || entries.length ? html`
      <dl class="jg-moves">
        <dt>${tx(I, "Missions started", "Misiones iniciadas")}</dt><dd>${active.length}</dd>
        <dt>${tx(I, "Missions completed", "Misiones completadas")}</dt><dd>${active.filter((id) => missionStatus(state, band, id).startsWith("completed") || missionStatus(state, band, id) === "independently-demonstrated").length}</dd>
      </dl>
      <div style="overflow-x:auto"><table class="jg-table"><caption>${tx(I, "Recorded language actions by domain", "Acciones lingüísticas registradas por dominio")}</caption>
        <thead><tr><th scope="col">${tx(I, "Domain", "Dominio")}</th><th scope="col">${tx(I, "First attempts", "Primeros intentos")}</th><th scope="col">${tx(I, "Revisions", "Revisiones")}</th><th scope="col">${tx(I, "Independent transfer", "Transferencia independiente")}</th></tr></thead>
        <tbody>${domainRows.map((row) => html`<tr><th scope="row">${row.domain}</th><td>${row.first} <small>(${row.independent} ${tx(I, "independent", "independientes")})</small></td><td>${row.revision}</td><td>${row.transfer}</td></tr>`)}</tbody>
      </table></div>
      <h4>${tx(I, "Mission history", "Historial de misiones")}</h4>
      <ul>${active.map((id) => {
        const done = STEPS.filter((step) => getStep(state, band, id, step.id).status === "done").length;
        const observations = entries.filter((e) => String(e.task).startsWith(`${id}.`)).length;
        return html`<li><strong>${I.T(...MISSIONS[id].title)}</strong>: ${done} / ${STEPS.length} ${tx(I, "steps done", "pasos completados")}; ${observations} ${tx(I, "recorded responses", "respuestas registradas")}. <a href="${BASE}/journey/${id}?grades=${band}">${tx(I, "Inspect mission", "Ver misión")}</a></li>`;
      })}</ul>
      ${entries.length ? html`<h4>${tx(I, "Recent recorded actions", "Acciones registradas recientemente")}</h4>
        <ol>${entries.slice(-6).reverse().map((entry) => {
          const [id, step] = String(entry.task).split(".");
          const support = entry.stage === "independent" ? tx(I, "independent", "independiente") : tx(I, "with support", "con apoyo");
          const kind = { first: tx(I, "first attempt", "primer intento"), revision: tx(I, "revision", "revisión"), transfer: tx(I, "transfer", "transferencia"), retry: tx(I, "retry", "nuevo intento") }[entry.kind] || tx(I, "activity", "actividad");
          return html`<li><strong>${I.T(...MISSIONS[id].title)}</strong> · ${step} · ${entry.domain || tx(I, "domain not recorded", "dominio no registrado")} · ${kind} · ${support}</li>`;
        })}</ol>` : ""}
    ` : html`<p role="status">${tx(I, "No Journey evidence has been saved in this browser for this grade band yet. A learner can begin without an account; completed work will appear here only on the same device or after an authorized progress import.", "Todavía no hay evidencia del viaje guardada en este navegador para esta banda de grados. Un estudiante puede comenzar sin cuenta; su trabajo aparecerá aquí solo en el mismo dispositivo o después de importar su progreso con autorización.")}</p>`}
    ${recommended ? html`<div class="jg-callout"><strong>${tx(I, "Suggested next teaching move", "Siguiente paso didáctico sugerido")}</strong>
      <p>${I.T(...recommended.reason)}</p>
      <p>${tx(I, "Based on", "Basado en")}: ${entries.filter((e) => String(e.task).startsWith(`${recommended.mission}.`)).length} ${tx(I, "recorded responses in this mission and saved step status", "respuestas registradas en esta misión y el estado guardado de sus pasos")}.</p>
      <a href="${BASE}/journey/${recommended.mission}/${recommended.step}?grades=${band}&assigned=1">${tx(I, "Open this student step", "Abrir este paso del estudiante")}</a>
    </div>` : ""}
  </section>`;
}

export function mountJourneyPanel(root) {
  const lang = new URLSearchParams(location.search).get("lang");
  const I = makeI18n(MODES.includes(lang) ? lang : "en", "en");
  const selected = new URLSearchParams(location.search).get("band");
  const band = BANDS.includes(selected) ? selected : "6-8";
  const opts = { band, compact: true, hub: true, action: location.pathname };
  const evidence = journeyEvidenceHTML(I, { state: loadJourney(), ledger: loadLedger(), band });
  root.innerHTML = toHtml(html`${evidence}${guideHTML(I, opts)}`);
  mountGuide(root.querySelector("[data-gd]"), { I, opts, urlState: false });
  root.querySelector("select[name=band]")?.addEventListener("change", (event) => {
    root.querySelector("[data-journey-evidence]").outerHTML = toHtml(journeyEvidenceHTML(I, {
      state: loadJourney(), ledger: loadLedger(), band: event.target.value,
    }));
  });
}
