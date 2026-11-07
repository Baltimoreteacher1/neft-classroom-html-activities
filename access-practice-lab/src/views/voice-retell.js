// Listen-then-speak and read-then-speak retell: take in a short source, plan, then retell it out loud.
// Two ways to speak, chosen by the learner:
//   Practice (default): no clock; record as many times as you like, then compare with a model retell.
//   Test-day rehearsal: the lab's SpeakingMachine — planning time, a response window and two takes — the same
//   ACCESS-style rehearsal limits the assessment simulator already uses. The recording is kept on this device
//   for the teacher. Nothing is scored.
import { makeSpeakingRenderer } from "../acc/audio/speaking-ui.js";
import { I18nEngine } from "../acc/i18n/I18nEngine.js";
import { openStorage } from "../acc/storage/access-db.js";
import { recorderHTML } from "../components.js";
import { RETELLS } from "../content/voice-lab.js";
import { modelStudentHTML, playModelStudent } from "../model-student-ui.js";
import { isRecording, takesFor } from "../recorder.js";
import { canSpeak, speak } from "../speech.js";
import { announce, html, icon, raw } from "../util.js";
import { latestMeterHTML, loadVoice, saveVoice, voiceCrumbs } from "./voice-common.js";

/** Rehearsal limits per band: planning seconds and the response window (seconds). */
export const REHEARSAL = {
  "3-5": { prepSeconds: 20, recordSeconds: 60 },
  "6-8": { prepSeconds: 30, recordSeconds: 90 },
};
const IGN = raw("data-nsr-ignore");
const plans = new Map(); // task id → planner notes (this tab only)
let mode = "practice";
let hidden = false; // read tasks: the learner hid the text before speaking
let mounted = null; // { renderer, i18n }
const submitted = new Map(); // task id → the rehearsal response saved on this device (this tab)

export const findRetell = (id) => RETELLS.find((r) => r.id === id) || null;
const keyFor = (id) => `voice:retell:${id}`;

function sourceHTML(task, I, spoke) {
  if (task.mode === "listen")
    return html`<section class="source listen-card">
      <h2 class="source-title">${icon("listening")} ${I.T("Listen first", "Escucha primero")}</h2>
      <div class="listen-player">
        <button type="button" class="listen-btn" data-retell-play>
          <span class="listen-icon" aria-hidden="true">${icon("play")}</span
          ><span class="listen-label">${I.T("Listen", "Escuchar")}</span>
        </button>
        <button type="button" class="ghost" data-stop-audio>
          ${icon("stop")} ${I.T("Stop", "Detener")}
        </button>
      </div>
      <p class="fine">
        ${I.T("Listen as many times as you need. The words appear after you speak.", "Escucha todas las veces que necesites. Las palabras aparecen después de que hables.")}
      </p>
      ${
        spoke
          ? html`<details class="studio-disc">
              <summary>${I.T("Read what you heard", "Lee lo que escuchaste")}</summary>
              <div class="disc-body" lang="en">${task.turns.map((p) => html`<p>${p}</p>`)}</div>
            </details>`
          : ""
      }
    </section>`;
  return html`<section class="source">
    <h2 class="source-title">${icon("reading")} ${I.T("Read first", "Lee primero")}</h2>
    ${
      hidden
        ? html`<p class="fine">
            ${I.T("The text is hidden so you retell from memory and your plan.", "El texto está oculto para que lo cuentes de memoria y con tu plan.")}
            <button type="button" class="ghost small" data-retell-hide>
              ${I.T("Show the text again", "Mostrar el texto otra vez")}
            </button>
          </p>`
        : html`<div class="source-text" lang="en">${task.text.map((p) => html`<p>${p}</p>`)}</div>
            <button type="button" class="btn small" data-retell-hide>
              ${icon("check")} ${I.T("I'm ready: hide the text", "Estoy listo: ocultar el texto")}
            </button>`
    }
  </section>`;
}

function plannerHTML(task, I) {
  const notes = plans.get(task.id) || {};
  return html`<section class="panel planner">
    <h2>
      <span class="step-badge">1</span> ${I.T("Plan your retell", "Planea lo que vas a contar")}
    </h2>
    <p class="fine">
      ${I.T("Write a few key words, not sentences.", "Escribe algunas palabras clave, no oraciones.")}
    </p>
    <div class="slot-grid">
      ${task.plan.map(
        (label, i) =>
          html`<label class="field slot"
            ><span><b class="slot-n">${i + 1}</b>${label}</span
            ><textarea rows="2" data-retell-plan="${i}" ${IGN}>${notes[i] || ""}</textarea>
          </label>`,
      )}
    </div>
  </section>`;
}

function speakHTML(task, ctx, I) {
  const key = keyFor(task.id);
  const spoke = takesFor(key).length > 0;
  const lim = REHEARSAL[task.band] || REHEARSAL["6-8"];
  return html`<section class="panel" id="retell-say">
      <h2>
        <span class="step-badge">2</span> ${I.T("Retell it out loud", "Cuéntalo en voz alta")}
      </h2>
      <p class="voice-prompt" lang="en">${task.prompt}</p>
      <fieldset class="voice-modes">
        <legend>${I.T("How do you want to speak?", "¿Cómo quieres hablar?")}</legend>
        <label
          ><input
            type="radio"
            name="retell-mode"
            value="practice"
            data-retell-mode
            ${mode === "practice" ? raw("checked") : ""}
          />
          ${I.T("Practice: no clock, record as many times as you like", "Práctica: sin reloj, graba todas las veces que quieras")}</label
        >
        <label
          ><input
            type="radio"
            name="retell-mode"
            value="rehearsal"
            data-retell-mode
            ${mode === "rehearsal" ? raw("checked") : ""}
          />
          ${I.T(`Test-day rehearsal: ${lim.prepSeconds} seconds to plan, up to ${lim.recordSeconds} seconds to speak, two tries`, `Ensayo como el día de la prueba: ${lim.prepSeconds} segundos para planear, hasta ${lim.recordSeconds} segundos para hablar, dos intentos`)}</label
        >
      </fieldset>
      ${
        mode === "rehearsal"
          ? html`<div class="acc-wrap" data-retell-rehearsal></div>`
          : html`${recorderHTML(key, { prompt: task.prompt, recording: isRecording(key), i18n: I })}
              <p class="fine">
                ${I.T("No microphone?", "¿No tienes micrófono?")}
                <button type="button" class="ghost small" data-retell-done>
                  ${I.T("I said it out loud", "Lo dije en voz alta")}
                </button>
              </p>`
      }
    </section>
    ${
      spoke || loadVoice().retell?.[task.id]
        ? html`<section class="panel">
            <h2>
              <span class="step-badge">3</span>
              ${I.T("Compare with a model retell", "Compara con un modelo")}
            </h2>
            <p class="fine">
              ${I.T("Did you include every part of your plan? Listen for the order words the model uses.", "¿Incluiste cada parte de tu plan? Escucha las palabras de orden que usa el modelo.")}
            </p>
            ${modelStudentHTML(key, task.model, I)}
            ${latestMeterHTML(key, task.model, I, ctx.prefs?.rate || 0.9)}
          </section>`
        : ""
    }`;
}

export function retellHTML(ctx, I, id) {
  const task = findRetell(id);
  if (!task) return null;
  const title = I.T(task.title, task.titleEs);
  const spoke = takesFor(keyFor(id)).length > 0 || Boolean(loadVoice().retell?.[id]);
  return {
    title: I.S(task.title, task.titleEs),
    html: html`${voiceCrumbs(I, ctx.band, title)}
      <article class="activity voice-page d-speaking">
        <header class="act-head">
          <p class="act-context">
            ${icon(task.mode === "listen" ? "listening" : "reading")}
            ${task.mode === "listen" ? I.T("Listen, then retell", "Escucha y vuelve a contar") : I.T("Read, then retell", "Lee y vuelve a contar")}
          </p>
          <h1 tabindex="-1">${title}</h1>
        </header>
        <div class="studio-cols">
          <div class="studio-col">${sourceHTML(task, I, spoke)}${plannerHTML(task, I)}</div>
          <div class="studio-col">${speakHTML(task, ctx, I)}</div>
        </div>
      </article>`,
  };
}

function markRetell(id) {
  const state = loadVoice();
  state.retell ||= {};
  state.retell[id] = true;
  saveVoice(state);
}

export function retellClick(e, ctx, I, id) {
  const task = findRetell(id);
  if (!task) return false;
  const t = e.target;
  if (t.closest("[data-retell-play]")) {
    if (canSpeak()) speak(task.turns, { rate: ctx.prefs?.rate || 0.9, persona: "teacher" });
    else
      announce(
        I.S(
          "Read-aloud is not available. Ask your teacher to read it.",
          "La lectura en voz alta no está disponible. Pide a tu docente que la lea.",
        ),
      );
    return true;
  }
  if (t.closest("[data-retell-hide]")) {
    hidden = !hidden;
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-retell-done]")) {
    markRetell(id);
    announce(
      I.S(
        "Saved on this device. Now compare with the model.",
        "Guardado en este dispositivo. Ahora compara con el modelo.",
      ),
    );
    ctx.rerender();
    return true;
  }
  const ms = t.closest("[data-model-student]");
  if (ms) {
    playModelStudent(ms.dataset.modelStudent, task.model, {
      rate: ctx.prefs?.rate || 0.9,
      I,
      rerender: () => ctx.rerender(),
    });
    return true;
  }
  return false;
}

export function retellInput(e, _ctx, _I, id) {
  const t = e.target;
  if (!t.matches("[data-retell-plan]")) return;
  const notes = plans.get(id) || {};
  notes[t.dataset.retellPlan] = t.value;
  plans.set(id, notes);
}

export function retellChange(e, ctx) {
  if (!e.target.matches("[data-retell-mode]")) return;
  mode = e.target.value === "rehearsal" ? "rehearsal" : "practice";
  ctx.rerender();
}

export function onRetellRecorded(id) {
  markRetell(id);
}

export function retellMount(root, ctx, _I, id) {
  retellUnmount();
  const task = findRetell(id);
  const host = root.querySelector("[data-retell-rehearsal]");
  if (!task || !host) return;
  const lim = REHEARSAL[task.band] || REHEARSAL["6-8"];
  const item = { id: `voice-retell-${task.id}`, speaking: { ...lim, takes: 2 } };
  const renderer = makeSpeakingRenderer({ getStorage: openStorage })(item, {
    doc: document,
    announce,
    session: null,
    response: submitted.get(task.id),
    onChange: (resp) => {
      if (resp?.submitted) {
        submitted.set(task.id, resp);
        markRetell(task.id);
        ctx.rerender();
      }
    },
  });
  host.append(renderer.el);
  mounted = { renderer, i18n: new I18nEngine({ root: host }).start() };
}

export function retellUnmount() {
  mounted?.renderer?.destroy?.();
  mounted?.i18n?.stop?.();
  mounted = null;
}
