// Offline, same-device speaking turns. Recordings exist only in this tab and are removed on navigation.
import { i18nFor } from "../i18n.js";
import { ACCESS_LAB_FLAGS } from "../lang/feature-flags.js";
import { BASE, announce, html } from "../util.js";
import * as rec from "../recorder.js";
import { printSheet } from "../print-sheet.js";

const PROMPTS = [
  { en: "Tell what happened first, next and last.", es: "Cuenta qué pasó primero, después y al final." },
  { en: "Describe one idea and give a detail from the text.", es: "Describe una idea y da un detalle del texto." },
  { en: "Explain how you solved the problem. Use because.", es: "Explica cómo resolviste el problema. Usa porque." },
];
let index = 0, turn = 0, take = null, recording = false;
const key = "accessPracticeLab:v1:partner-turn";
const checklist = (I) => `<article><h1>${I.T("Partner speaking · teacher listening checklist", "Conversación en pareja · lista de escucha docente")}</h1><ul><li>${I.T("Both partners have a chance to speak.", "Ambos compañeros tienen oportunidad de hablar.")}</li><li>${I.T("The speaker uses a detail or example.", "Quien habla usa un detalle o ejemplo.")}</li><li>${I.T("The listener responds to the idea.", "Quien escucha responde a la idea.")}</li><li>${I.T("Wait time and helpful prompts are available.", "Hay tiempo para pensar y preguntas de apoyo.")}</li></ul><p>${I.T("Practice only. No score or level.", "Solo práctica. Sin puntaje ni nivel.")}</p></article>`;

export async function render(ctx) {
  const I = i18nFor(ctx), prompt = PROMPTS[index % PROMPTS.length], speaker = turn % 2 ? "Partner B" : "Partner A";
  if (!ACCESS_LAB_FLAGS.sameDevicePartnerEnabled) return { title: I.T("Partner Talk", "Conversación en pareja"), html: html`<section class="panel"><h1>${I.T("Not available", "No disponible")}</h1></section>` };
  return { title: I.T("Partner Talk", "Conversación en pareja"), html: html`<article class="pg-root"><p class="eyebrow">${I.T("Offline · same device", "Sin conexión · mismo dispositivo")}</p><h1 tabindex="-1">${I.T("Partner Talk", "Conversación en pareja")}</h1><p class="lead">${I.T("Pass the device between partners. Each turn has one recorder. Recording is optional and stays in this tab unless you download it.", "Pásense el dispositivo. Cada turno tiene una grabadora. Grabar es opcional y queda en esta pestaña a menos que descargues el archivo.")}</p><section class="panel"><h2>${I.T("Role cards", "Tarjetas de roles")}</h2><div class="lp-extended-grid"><article class="panel"><h3>Partner A</h3><p>${I.T("Speak first. Give an idea and a detail.", "Habla primero. Da una idea y un detalle.")}</p></article><article class="panel"><h3>Partner B</h3><p>${I.T("Listen, then respond to the idea.", "Escucha y luego responde a la idea.")}</p></article></div></section><section class="panel"><p class="eyebrow">${I.T(speaker, turn % 2 ? "Compañero B" : "Compañero A")} · ${I.T(`Turn ${turn + 1}`, `Turno ${turn + 1}`)}</p><h2 lang="${I.spanish ? "es" : "en"}">${I.T(prompt.en, prompt.es)}</h2><button class="btn" type="button" data-partner-say>${I.T("Hear the prompt", "Escuchar la consigna")}</button><div class="row-actions"><button class="btn btn-primary" type="button" data-partner-record ${recording ? "disabled" : ""}>${I.T("Start this turn", "Empezar este turno")}</button><button class="btn" type="button" data-partner-stop ${recording ? "" : "disabled"}>${I.T("Stop recording", "Detener grabación")}</button><button class="btn" type="button" data-partner-next>${I.T("Next partner", "Siguiente compañero")}</button></div><p role="status" aria-live="polite" data-partner-status>${recording ? I.T("Recording in this tab…", "Grabando en esta pestaña…") : take ? I.T("A recording is available in this tab.", "Hay una grabación disponible en esta pestaña.") : I.T("No recording made yet.", "Aún no hay grabación.")}</p>${take ? html`<audio controls src="${take.url}"></audio><a class="btn small" href="${take.url}" download="partner-turn.${take.extension}">${I.T("Download this turn", "Descargar este turno")}</a>` : ""}</section><button class="btn" type="button" data-partner-checklist>${I.T("Print teacher listening checklist", "Imprimir lista de escucha docente")}</button><p class="fine">${I.T("No audio is uploaded or kept after leaving this page. Do not enter real student names.", "No se sube audio ni se guarda al salir de esta página. No escribas nombres reales de estudiantes.")}</p><a href="${BASE}/program">${I.T("Back to teacher tools", "Volver a las herramientas docentes")}</a></article>` };
}

export async function onClick(e, ctx) {
  const I = i18nFor(ctx);
  if (e.target.closest?.("[data-partner-say]")) { const { speak, speakSpanish } = await import("../speech.js"); I.spanish ? speakSpanish(PROMPTS[index % PROMPTS.length].es) : speak(PROMPTS[index % PROMPTS.length].en); return true; }
  if (e.target.closest?.("[data-partner-record]")) { try { await rec.start(key, { onStop: (takes) => { take = takes.at(-1) || null; recording = false; ctx.rerender(); } }); recording = rec.isRecording(key); ctx.rerender(); } catch (error) { announce(I.S(`Microphone unavailable: ${error.message}`, `Micrófono no disponible: ${error.message}`)); } return true; }
  if (e.target.closest?.("[data-partner-stop]")) { await rec.stop(); recording = false; const takes = rec.takesFor(key); take = takes.at(-1) || null; ctx.rerender(); return true; }
  if (e.target.closest?.("[data-partner-next]")) { await rec.stop(); recording = false; index = (index + 1) % PROMPTS.length; turn++; take = null; ctx.rerender(); return true; }
  if (e.target.closest?.("[data-partner-checklist]")) { await printSheet(checklist(I)); return true; }
  return false;
}

export async function unmount() { await rec.stop(); take = null; recording = false; }
