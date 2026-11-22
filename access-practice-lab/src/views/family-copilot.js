// Family "Co-Pilot" Mode (src/views/family-copilot.js)
// Zero-English-Required Co-Learning: splits into Student Side (English task) + Family Side (Spanish prompts & Celebration Stamp).

import { i18nFor } from "../i18n.js";
import { speak, stop as stopSpeech } from "../speech.js";
import { announce, html, icon, safeJson, storage } from "../util.js";

export const FAMILY_STAMPS_KEY = "accessPracticeLab:v1:familyCoPilotStamps";

let copilotOpen = false;
let stamped = false;

export function familyCoPilotHTML(ctx) {
  const I = i18nFor(ctx);
  const stamps = safeJson(storage.get(FAMILY_STAMPS_KEY), []) || [];

  return html`<section class="panel no-print" style="margin:1.25rem 0;border:2px solid #075568;" aria-labelledby="fcTitle">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem;">
      <div>
        <p class="eyebrow">${I.T("Zero-English-Required Co-Learning", "Aprendizaje compartido sin exigir inglés")}</p> <!-- ES-REVIEW -->
        <h2 id="fcTitle" style="margin:0;">${I.T("Family Co-Pilot Mode", "Modo Copiloto Familiar")}</h2> <!-- ES-REVIEW -->
      </div>
      <button type="button" class="btn btn-primary small" data-fc-toggle aria-expanded="${copilotOpen}">
        ${copilotOpen ? I.T("Close Co-Pilot View", "Cerrar vista Copiloto") : I.T("Launch Co-Pilot View", "Abrir vista Copiloto")} <!-- ES-REVIEW -->
      </button>
    </div>

    ${copilotOpen ? html`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem;margin-top:1rem;">
      <div class="card" style="background:#fff;border:1.5px solid #17324d;">
        <p class="eyebrow">Student Side (English)</p>
        <h3>Today's Prompt</h3>
        <p>Describe one change you observed in nature or your community, and explain why it happened using <strong>because</strong>.</p>
        <button type="button" class="btn small" data-fc-say="Describe one change you observed and explain why it happened using because.">${icon("volume")} Hear Prompt</button>
      </div>
      <div class="card" style="background:#eaf4f4;border:1.5px solid #075568;">
        <p class="eyebrow">Lado Familiar (Español)</p> <!-- ES-REVIEW -->
        <h3>Qué está practicando su estudiante</h3> <!-- ES-REVIEW -->
        <p class="fine">Su estudiante está practicando cómo explicar causas y efectos en inglés usando la palabra <em>because</em> (porque).</p> <!-- ES-REVIEW -->
        <p style="margin:.4rem 0;"><strong>Preguntas para conversar en casa:</strong></p> <!-- ES-REVIEW -->
        <ul class="fine" style="margin:0 0 .75rem;padding-left:1.1rem;">
          <li>¿Qué cambio notaste hoy?</li>
          <li>¿Por qué crees que ocurrió ese cambio?</li>
          <li>¿Qué palabra nueva usaste?</li>
        </ul>
        <button type="button" class="btn btn-primary small" data-fc-stamp>${icon("star")} ${I.T("Family Celebration Stamp", "Sello de celebración familiar")} (${stamps.length})</button> <!-- ES-REVIEW -->
        ${stamped ? html`<p class="is-item-fb is-ok" role="status">¡Sello guardado en Mi Pasaporte!</p>` : ""}
      </div>
    </div>` : ""}
  </section>`;
}

export function onFamilyCoPilotClick(e, ctx) {
  if (e.target.closest("[data-fc-toggle]")) {
    copilotOpen = !copilotOpen;
    ctx.rerender();
    return true;
  }
  const say = e.target.closest("[data-fc-say]");
  if (say) {
    stopSpeech();
    speak(say.dataset.fcSay, { rate: 0.9 });
    return true;
  }
  if (e.target.closest("[data-fc-stamp]")) {
    const stamps = safeJson(storage.get(FAMILY_STAMPS_KEY), []) || [];
    stamps.push({ at: Date.now(), label: "Family Co-Pilot Celebration" });
    storage.set(FAMILY_STAMPS_KEY, JSON.stringify(stamps.slice(-30)));
    stamped = true;
    announce("Family Celebration Stamp saved to My Passport.");
    ctx.rerender();
    return true;
  }
  return false;
}
