// Picture speaking ladder: one picture scene, three practice steps that climb from words to sentences to extended
// talk, the way the ACCESS speaking test climbs. Each step: hear the model student, record, compare length, mark it
// said. The steps are practice steps — never an ACCESS tier or a WIDA level.
import { LADDERS } from "../content/voice-lab.js";
import { modelStudentHTML, playModelStudent } from "../model-student-ui.js";
import { recorderHTML } from "../components.js";
import { isRecording } from "../recorder.js";
import { ART, BASE, announce, html, icon } from "../util.js";
import { disclosure } from "../studio-ui.js";
import {
  latestMeterHTML,
  loadVoice,
  markDone,
  saveVoice,
  voiceCrumbs,
  voiceHref,
} from "./voice-common.js";

export const STEP_NAMES = [
  ["Step 1 · Words", "Paso 1 · Palabras"],
  ["Step 2 · Sentences", "Paso 2 · Oraciones"],
  ["Step 3 · Tell more", "Paso 3 · Di más"],
];
const keyFor = (id, i) => `voice:ladder:${id}:${i}`;
export const findLadder = (id) => LADDERS.find((l) => l.id === id) || null;

export function ladderHTML(ctx, I, id) {
  const ladder = findLadder(id);
  if (!ladder) return null;
  const done = loadVoice().ladder?.[id] || [];
  const rate = ctx.prefs?.rate || 0.9;
  const title = I.T(ladder.title, ladder.titleEs);
  return {
    title: I.S(ladder.title, ladder.titleEs),
    html: html`${voiceCrumbs(I, ctx.band, title)}
      <article class="activity voice-page d-speaking">
        <header class="act-head">
          <p class="act-context">
            ${icon("speaking")}
            ${I.T("Picture speaking ladder", "Escalera de expresión oral con imagen")}
          </p>
          <h1 tabindex="-1">${title}</h1>
          <p class="lead">
            ${I.T("Look at the picture. Climb three steps: name things, tell about them, then say more. Hear the model student first each time.", "Mira la imagen. Sube tres pasos: nombra cosas, cuenta sobre ellas y luego di más. Escucha primero al estudiante modelo cada vez.")}
          </p>
          <p class="fine">
            ${I.T("These are practice steps, not ACCESS tiers or WIDA levels. The lab does not score speaking.", "Estos son pasos de práctica, no niveles de ACCESS ni de WIDA. El laboratorio no califica la expresión oral.")}
          </p>
        </header>
        <div class="voice-scene">
          <img
            src="${BASE}/${ladder.picture}"
            alt="${ladder.alt}"
            width="480"
            height="320"
            decoding="async"
          />
        </div>
        <ol class="voice-steps" aria-label="${I.S("Practice steps", "Pasos de práctica")}">
          ${ladder.steps.map((step, i) => {
            const key = keyFor(id, i);
            const said = done.includes(i);
            return html`<li class="panel voice-step ${said ? "is-done" : ""}" id="step-${i + 1}">
              <h2>
                ${I.T(...STEP_NAMES[i])}
                ${said ? html`<span class="tag">${icon("check")} ${I.T("Said", "Dicho")}</span>` : ""}
              </h2>
              <p class="voice-prompt" lang="en">${step.prompt}</p>
              <button type="button" class="ghost small" data-say="${step.prompt}">
                ${icon("volume")} ${I.T("Hear the question", "Escuchar la pregunta")}
              </button>
              ${modelStudentHTML(key, step.model, I)}
              ${disclosure(`voice-frame-${id}-${i}`, html`${icon("bulb")} ${I.T("Show a sentence frame", "Mostrar un marco de oración")}`, html`<p class="voice-frame" lang="en">${step.frame}</p>`)}
              ${recorderHTML(key, { recording: isRecording(key), i18n: I })}
              ${latestMeterHTML(key, step.model, I, rate)}
              <div class="row-actions">
                <button
                  type="button"
                  class="btn ${said ? "" : "btn-primary"}"
                  data-voice-said="${i}"
                  aria-pressed="${said}"
                >
                  ${icon("check")}
                  ${said ? I.T("I said this step", "Dije este paso") : I.T("I said it out loud", "Lo dije en voz alta")}
                </button>
              </div>
            </li>`;
          })}
        </ol>
        ${
          done.length === ladder.steps.length
            ? html`<section class="panel voice-done" role="status">
                <img src="${ART}/domain-speaking.svg" alt="" width="160" height="120" />
                <p>
                  <strong
                    >${I.T("You climbed the whole ladder.", "Subiste toda la escalera.")}</strong
                  >
                  ${I.T("Try another picture, or record step 3 again with one more reason.", "Prueba otra imagen o graba otra vez el paso 3 con una razón más.")}
                </p>
                <a class="btn" href="${voiceHref("", ctx.band)}"
                  >${I.T("Back to the Voice Lab", "Volver al Laboratorio de voz")}</a
                >
              </section>`
            : ""
        }
      </article>`,
  };
}

export function ladderClick(e, ctx, I, id) {
  const ladder = findLadder(id);
  if (!ladder) return false;
  const t = e.target;
  const ms = t.closest("[data-model-student]");
  if (ms) {
    const i = Number(ms.dataset.modelStudent.split(":").at(-1));
    playModelStudent(ms.dataset.modelStudent, ladder.steps[i]?.model, {
      rate: ctx.prefs?.rate || 0.9,
      I,
      rerender: () => ctx.rerender(),
    });
    return true;
  }
  const said = t.closest("[data-voice-said]");
  if (said) {
    const state = loadVoice();
    markDone(state, "ladder", id, Number(said.dataset.voiceSaid));
    saveVoice(state);
    announce(I.S("Step saved on this device.", "Paso guardado en este dispositivo."));
    ctx.rerender();
    return true;
  }
  return false;
}
