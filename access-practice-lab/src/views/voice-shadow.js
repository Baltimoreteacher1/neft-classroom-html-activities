// Shadowing (/voice/shadow/<set>): a model line plays, the learner records the same line, and the two appear side by
// side — the model's word timing (from the read-aloud voice's own word events) and the learner's recorded waveform.
// It shows phrasing and length, never pronunciation scores, speed targets or a clock.
import { recorderHTML } from "../components.js";
import { SHADOW_SETS } from "../content/voice-lab.js";
import { modelRhythm, modelStudentHTML, playModelStudent } from "../model-student-ui.js";
import { isRecording, takesFor } from "../recorder.js";
import { announce, html, icon, raw } from "../util.js";
import { waveformSVG } from "../waveform.js";
import { latestMeterHTML, loadVoice, markDone, saveVoice, voiceCrumbs } from "./voice-common.js";

export const SHADOW_VOICE = { "6-8": "Nia", "3-5": "Sam" };
export const findShadowSet = (id) => SHADOW_SETS.find((s) => s.id === id) || null;
const keyFor = (id, i) => `voice:shadow:${id}:${i}`;
const modelFor = (set, i) => ({
  name: SHADOW_VOICE[set.band] || "Nia",
  line: set.lines[i],
  partial: false,
});

function sideBySideHTML(key, I) {
  const take = takesFor(key).at(-1);
  if (!take || isRecording(key)) return "";
  const rhythm = modelRhythm(key);
  return html`<div class="shadow-compare compare-grid">
      <figure class="compare-cell">
        <figcaption>
          ${I.T("Model: when each word was said", "Modelo: cuándo se dijo cada palabra")}
        </figcaption>
        ${rhythm ? raw(waveformSVG(rhythm.env)) : html`<p class="fine">${I.T("Play the model line to see its rhythm here.", "Reproduce la frase modelo para ver su ritmo aquí.")}</p>`}
        ${rhythm && !rhythm.fromVoice ? html`<p class="fine">${I.T("This voice did not report word times, so the rhythm is spread by word length.", "Esta voz no informó los tiempos de las palabras, así que el ritmo se reparte según la longitud de las palabras.")}</p>` : ""}
      </figure>
      <figure class="compare-cell">
        <figcaption>${I.T("You", "Tú")} · ${take.seconds}s</figcaption>
        ${raw(waveformSVG(take.env))}
      </figure>
    </div>
    <p class="fine">
      ${I.T("Look for the same groups of words and the same pauses. Matching the rhythm matters more than matching the speed.", "Busca los mismos grupos de palabras y las mismas pausas. Seguir el ritmo importa más que la velocidad.")}
    </p>`;
}

export function shadowHTML(ctx, I, id) {
  const set = findShadowSet(id);
  if (!set) return null;
  const done = loadVoice().shadow?.[id] || [];
  const rate = ctx.prefs?.rate || 0.9;
  const title = I.T(`Shadowing: ${set.title}`, `Imitar en voz alta: ${set.titleEs}`);
  return {
    title: I.S(`Shadowing: ${set.title}`, `Imitar en voz alta: ${set.titleEs}`),
    html: html`${voiceCrumbs(I, ctx.band, title)}
      <article class="activity voice-page d-speaking">
        <header class="act-head">
          <p class="act-context">
            ${icon("speaking")}
            ${I.T("Shadowing · record and compare", "Imitar en voz alta · graba y compara")}
          </p>
          <h1 tabindex="-1">${title}</h1>
          <p class="lead">
            ${I.T("Hear the line, then say it the same way: the same word groups, the same pauses. Record, then look at the two shapes side by side.", "Escucha la frase y dila de la misma manera: los mismos grupos de palabras y las mismas pausas. Graba y mira las dos formas una al lado de la otra.")}
          </p>
          <p class="fine">
            ${I.T(`${done.length} of ${set.lines.length} lines shadowed on this device.`, `${done.length} de ${set.lines.length} frases imitadas en este dispositivo.`)}
          </p>
        </header>
        <ol class="voice-steps">
          ${set.lines.map((_, i) => {
            const key = keyFor(id, i);
            const said = done.includes(i);
            return html`<li class="panel voice-step ${said ? "is-done" : ""}">
              <h2>
                ${I.T(`Line ${i + 1}`, `Frase ${i + 1}`)}
                ${said ? html`<span class="tag">${icon("check")} ${I.T("Shadowed", "Imitada")}</span>` : ""}
              </h2>
              ${modelStudentHTML(key, modelFor(set, i), I)}
              ${recorderHTML(key, { recording: isRecording(key), i18n: I })}
              ${sideBySideHTML(key, I)} ${latestMeterHTML(key, modelFor(set, i), I, rate)}
              <div class="row-actions">
                <button type="button" class="btn" data-shadow-done="${i}" aria-pressed="${said}">
                  ${icon("check")} ${I.T("I shadowed this line", "Imité esta frase")}
                </button>
              </div>
            </li>`;
          })}
        </ol>
      </article>`,
  };
}

export function shadowClick(e, ctx, I, id) {
  const set = findShadowSet(id);
  if (!set) return false;
  const t = e.target;
  const ms = t.closest("[data-model-student]");
  if (ms) {
    const i = Number(ms.dataset.modelStudent.split(":").at(-1));
    playModelStudent(ms.dataset.modelStudent, modelFor(set, i), {
      rate: ctx.prefs?.rate || 0.9,
      I,
      rerender: () => ctx.rerender(),
    });
    return true;
  }
  const doneBtn = t.closest("[data-shadow-done]");
  if (doneBtn) {
    const state = loadVoice();
    markDone(state, "shadow", id, Number(doneBtn.dataset.shadowDone));
    saveVoice(state);
    announce(I.S("Saved on this device.", "Guardado en este dispositivo."));
    ctx.rerender();
    return true;
  }
  return false;
}
