// "Silent-Period" Receptive Bridge (src/lang/silent-bridge.js)
// Stigma-free "Whisper / Build Silently" mode alongside microphone speaking tasks.
// Records Receptive Mastery separately from Expressive (Mic) Mastery in localStorage.

import { i18nFor } from "../i18n.js";
import { speak, stop as stopSpeech } from "../speech.js";
import { announce, html, icon, safeJson, storage } from "../util.js";

export const RECEPTIVE_KEY = "accessPracticeLab:v1:receptiveMastery";

const TILES = [
  "In my observation,",
  "the evidence shows",
  "that this change happens",
  "because",
  "each part connects.",
];

let silentMode = false;
let assembled = [];
let savedFlag = false;

export function getReceptiveSummary() {
  return safeJson(storage.get(RECEPTIVE_KEY), { count: 0, items: [] }) || { count: 0, items: [] };
}

export function silentBridgeHTML(ctx, promptId = "speak-task") {
  const I = i18nFor(ctx);
  const sentence = assembled.join(" ");

  return html`<section class="panel no-print" style="margin:1rem 0;border:1.5px solid #8a3a5c;" aria-labelledby="sbTitle">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem;">
      <div>
        <p class="eyebrow">${I.T("Zero-Pressure Participation", "Participación sin presión")}</p> <!-- ES-REVIEW -->
        <h2 id="sbTitle" style="margin:0;font-size:1.1rem;">${I.T("Silent-Period Receptive Bridge", "Puente receptivo silencioso")}</h2> <!-- ES-REVIEW -->
      </div>
      <button type="button" class="btn small ${silentMode ? "btn-primary" : ""}" data-sb-toggle aria-pressed="${silentMode}">
        ${silentMode ? I.T("Whisper / Build Silently: ON", "Construir en silencio: ACTIVO") : I.T("Whisper / Build Silently", "Construir en silencio")} <!-- ES-REVIEW -->
      </button>
    </div>

    ${silentMode ? html`<div style="margin-top:.85rem;">
      <p class="fine">${I.T("Tap phrase tiles to build your response silently, then hear a neutral voice model it. No microphone required.", "Toca las fichas para construir tu respuesta en silencio y luego escúchala. No requiere micrófono.")}</p> <!-- ES-REVIEW -->
      <div class="is-word-bank" role="group" aria-label="${I.S("Phrase tiles", "Fichas de frases")}">
        ${TILES.map((tile) => html`<button type="button" class="is-bank-chip" data-sb-tile="${tile}">${tile}</button>`)}
      </div>
      <p style="background:#f7f4ec;padding:.75rem;border-radius:8px;border:1px solid #d5d9e0;min-height:2.5rem;">${sentence || I.T("Your built response appears here…", "Tu respuesta aparecerá aquí…")}</p>
      <div class="is-actions">
        <button type="button" class="btn small" data-sb-hear>${icon("volume")} ${I.T("Hear Built Sentence", "Escuchar oración")}</button>
        <button type="button" class="btn btn-primary small" data-sb-save="${promptId}">${icon("check")} ${I.T("Save Receptive Progress", "Guardar progreso receptivo")}</button> <!-- ES-REVIEW -->
        <button type="button" class="btn small" data-sb-clear>${I.T("Clear", "Limpiar")}</button>
        <button type="button" class="btn ghost small" data-sb-voice>${I.T("I'm ready to try my voice", "Estoy listo para usar mi voz")}</button> <!-- ES-REVIEW -->
      </div>
      ${savedFlag ? html`<p class="is-item-fb is-ok" role="status">${I.T("Receptive Mastery recorded on this device!", "¡Dominio receptivo guardado en este dispositivo!")}</p>` : ""}
    </div>` : ""}
  </section>`;
}

export function onSilentBridgeClick(e, ctx) {
  if (e.target.closest("[data-sb-toggle]")) {
    silentMode = !silentMode;
    savedFlag = false;
    ctx.rerender();
    return true;
  }
  const tile = e.target.closest("[data-sb-tile]");
  if (tile) {
    assembled.push(tile.dataset.sbTile);
    savedFlag = false;
    ctx.rerender();
    return true;
  }
  if (e.target.closest("[data-sb-hear]")) {
    const s = assembled.join(" ");
    if (s) { stopSpeech(); speak(s, { rate: 0.9 }); }
    return true;
  }
  const saveBtn = e.target.closest("[data-sb-save]");
  if (saveBtn) {
    const cur = getReceptiveSummary();
    cur.count = (cur.count || 0) + 1;
    cur.items = [...(cur.items || []), { id: saveBtn.dataset.sbSave, text: assembled.join(" "), at: Date.now() }].slice(-30);
    storage.set(RECEPTIVE_KEY, JSON.stringify(cur));
    savedFlag = true;
    announce("Receptive mastery saved.");
    ctx.rerender();
    return true;
  }
  if (e.target.closest("[data-sb-clear]")) {
    assembled = [];
    savedFlag = false;
    ctx.rerender();
    return true;
  }
  if (e.target.closest("[data-sb-voice]")) {
    silentMode = false;
    announce("Switched to voice mode.");
    ctx.rerender();
    return true;
  }
  return false;
}
