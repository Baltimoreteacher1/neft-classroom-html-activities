// Sentence Surgery & Cohesion X-Ray (src/lang/cohesion-xray.js)
// X-Ray Lenses toolbar: Cohesion Lens (inline SVG pronoun->antecedent arcs + transition highlights)
// and Clause Surgery (keyboard-reorderable Condition + Cause + Effect blocks with live punctuation & TTS).

import { i18nFor } from "../i18n.js";
import { speak, stop as stopSpeech } from "../speech.js";
import { html, icon, raw } from "../util.js";

let lensOn = true;
let clauses = [
  { id: "cond", role: "Condition", text: "When temperatures rise" },
  { id: "cause", role: "Cause", text: "water evaporates faster" },
  { id: "effect", role: "Effect", text: "so drought risk increases" },
];

export function cohesionXrayHTML(ctx) {
  const I = i18nFor(ctx);
  const assembled = `${clauses[0].text}, ${clauses[1].text}, ${clauses[2].text}.`;

  return html`<section class="panel no-print" style="margin:1rem 0;border:1.5px solid #2e4a94;" aria-labelledby="cxTitle">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem;">
      <div>
        <p class="eyebrow">${I.T("Sentence Surgery & Cohesion X-Ray", "Cirugía de oraciones y rayos X")}</p> <!-- ES-REVIEW -->
        <h2 id="cxTitle" style="margin:0;font-size:1.1rem;">${I.T("X-Ray Lenses & Clause Builder", "Lentes de cohesión y bloques")}</h2> <!-- ES-REVIEW -->
      </div>
      <button type="button" class="btn small" data-cx-lens aria-pressed="${lensOn}">${I.T("Cohesion Lens", "Lente de cohesión")}: ${lensOn ? "ON" : "OFF"}</button>
    </div>

    ${lensOn ? html`<div style="background:#fff;padding:.85rem;border-radius:10px;border:1px solid #d5d9e0;margin:.75rem 0;">
      <svg viewBox="0 0 460 54" width="100%" height="54" role="img" aria-label="Cohesion arc connecting antecedent noun to pronoun">
        <path d="M56,34 Q145,4 235,34" fill="none" stroke="#1fa6a2" stroke-width="2.5" marker-end="url(#cxArrow)"/>
        <defs><marker id="cxArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#1fa6a2"/></marker></defs>
        <text x="16" y="46" font-size="14" font-weight="700" fill="#17324d">The students</text>
        <text x="108" y="46" font-size="14" fill="#24323f">tested the water.</text>
        <text x="225" y="46" font-size="14" font-weight="700" fill="#075568">They</text>
        <text x="264" y="46" font-size="14" fill="#24323f">recorded</text>
        <rect x="324" y="31" width="96" height="20" rx="5" fill="#f2c15b"/>
        <text x="330" y="45" font-size="13" font-weight="700" fill="#17324d">As a result,</text>
      </svg>
    </div>` : ""}

    <p class="fine">${I.T("Clause Surgery: move Condition, Cause, and Effect blocks to hear how meaning shifts.", "Cirugía de cláusulas: mueve los bloques para escuchar cómo cambia el sentido.")}</p> <!-- ES-REVIEW -->
    <div style="display:flex;flex-wrap:wrap;gap:.5rem;margin:.6rem 0;">
      ${clauses.map((c, idx) => html`<div class="card" style="padding:.55rem .75rem;display:flex;align-items:center;gap:.4rem;background:#f7f4ec;">
        <span class="is-std-pill">${c.role}</span>
        <span>${c.text}</span>
        ${idx > 0 ? html`<button type="button" class="ghost small" data-cx-move="${idx}:-1" aria-label="Move ${c.role} left">←</button>` : ""}
        ${idx < clauses.length - 1 ? html`<button type="button" class="ghost small" data-cx-move="${idx}:1" aria-label="Move ${c.role} right">→</button>` : ""}
      </div>`)}
    </div>
    <p style="font-weight:700;margin:.5rem 0;">${assembled}</p>
    <button type="button" class="btn small" data-cx-hear="${assembled}">${icon("volume")} ${I.T("Hear Sentence", "Escuchar oración")}</button>
  </section>`;
}

export function onCohesionXrayClick(e, ctx) {
  if (e.target.closest("[data-cx-lens]")) {
    lensOn = !lensOn;
    ctx.rerender();
    return true;
  }
  const mv = e.target.closest("[data-cx-move]");
  if (mv) {
    const [iStr, dStr] = mv.dataset.cxMove.split(":");
    const i = Number(iStr);
    const j = i + Number(dStr);
    if (j >= 0 && j < clauses.length) {
      [clauses[i], clauses[j]] = [clauses[j], clauses[i]];
      ctx.rerender();
    }
    return true;
  }
  const hear = e.target.closest("[data-cx-hear]");
  if (hear) {
    stopSpeech();
    speak(hear.dataset.cxHear, { rate: 0.92 });
    return true;
  }
  return false;
}
