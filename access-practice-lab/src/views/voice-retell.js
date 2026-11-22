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
import { BASE, announce, html, icon, raw, toHtml } from "../util.js";
import { latestMeterHTML, loadVoice, saveVoice, voiceCrumbs } from "./voice-common.js";
import { listenCardHTML, listenClick, stopListening } from "./voice-listen.js";

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
const fullFrames = new Set(); // task ids where the learner asked for the full frames again after a first take

export const findRetell = (id) => RETELLS.find((r) => r.id === id) || null;
const keyFor = (id) => `voice:retell:${id}`;

function sourceHTML(task, I, ctx) {
  if (task.mode === "listen")
    return html`${task.picture
      ? html`<figure class="lc-picture"><img src="${BASE}/${task.picture}" alt="${task.alt || ""}" loading="lazy" /></figure>`
      : ""}${listenCardHTML(I, task, { key: task.id, rate: ctx.prefs?.rate || 0.9, genre: I.T(task.genre, task.genreEs) })}`;
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

function vocabHTML(task, I) {
  if (!task.vocab?.length) return "";
  const es = I.spanish || I.bilingual;
  return html`<section class="panel lc-vocab">
    <h2><span class="step-badge">1</span> ${I.T("Get ready: key words", "Prepárate: palabras clave")}</h2>
    <p class="fine">
      ${I.T("Say each word out loud once. You will want these words when you speak.", "Di cada palabra en voz alta una vez. Las vas a necesitar al hablar.")}
    </p>
    <dl class="lc-words" lang="en">
      ${task.vocab.map(
        ([word, meaning, spanish]) =>
          html`<div><dt>${word}</dt><dd>${meaning}${es ? html` <span class="lc-es" lang="es">${spanish}</span>` : ""}</dd></div>`,
      )}
    </dl>
  </section>`;
}

function plannerHTML(task, I) {
  const notes = plans.get(task.id) || {};
  return html`<section class="panel planner">
    <h2>
      <span class="step-badge">2</span> ${I.T("Plan your retell", "Planea lo que vas a contar")}
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

/** Sentence frames that fade: full on the first try, starters only afterwards (the learner can ask for the full set). */
function framesHTML(task, I, tries) {
  if (!task.frames) return "";
  const full = tries === 0 || fullFrames.has(task.id);
  const list = full ? task.frames.full : task.frames.light;
  return html`<details class="studio-disc lc-frames" open>
    <summary>${full ? I.T("Sentence frames: full", "Marcos de oraciones: completos") : I.T("Sentence frames: starters only", "Marcos de oraciones: solo el comienzo")}</summary>
    <ul class="disc-body" lang="en">${list.map((f) => html`<li class="lc-frame">${f}</li>`)}</ul>
    ${
      tries > 0
        ? html`<p class="fine">
            ${full
              ? html`${I.T("Try it with starters only.", "Inténtalo solo con el comienzo.")}
                  <button type="button" class="ghost small" data-retell-frames="light">${I.T("Use starters only", "Usar solo el comienzo")}</button>`
              : html`${I.T("The frames got shorter because you have practiced once.", "Los marcos son más cortos porque ya practicaste una vez.")}
                  <button type="button" class="ghost small" data-retell-frames="full">${I.T("Show full frames", "Mostrar marcos completos")}</button>`}
          </p>`
        : ""
    }
  </details>`;
}

const reviewTicks = (id) => loadVoice().reviews?.[id] || [];

/** The first criterion the learner has not ticked, as the single thing to work on in the next take. */
export function nextFocus(task, ticks = []) {
  const i = task.criteria.findIndex((_, k) => !ticks[k]);
  return i < 0 ? null : task.criteria[i];
}

function reviewHTML(task, I, key) {
  const ticks = reviewTicks(task.id);
  const focus = nextFocus(task, ticks);
  return html`<section class="panel lc-review" id="retell-review">
    <h2><span class="step-badge">4</span> ${I.T("Review: listen to yourself", "Revisa: escúchate")}</h2>
    <p class="fine">
      ${I.T("Play your recording, then tick what you did. Only you can judge this: the lab does not listen to or score your voice.", "Reproduce tu grabación y marca lo que hiciste. Solo tú puedes juzgarlo: el laboratorio no escucha ni califica tu voz.")}
    </p>
    <fieldset class="lc-criteria">
      <legend>${I.T("In my retell, I...", "En mi relato...")}</legend>
      ${task.criteria.map(
        (c, i) => html`<label class="lc-crit"><input type="checkbox" data-retell-crit="${i}" ${ticks[i] ? raw("checked") : ""} /> <span lang="en">${c}</span></label>`,
      )}
    </fieldset>
    <p class="lc-improve" data-retell-focus role="status">${focusHTML(focus, I)}</p>
  </section>`;
}

function focusHTML(focus, I) {
  return focus
    ? html`<b>${I.T("Improve: for your next recording, work on this one thing:", "Mejora: en tu próxima grabación, trabaja solo en esto:")}</b> <span lang="en">${focus}</span>`
    : html`<b>${I.T("You ticked everything.", "Marcaste todo.")}</b> ${I.T("Try the same retell again without the frames, or compare with the model.", "Prueba el mismo relato sin los marcos o compáralo con el modelo.")}`;
}

function speakHTML(task, ctx, I) {
  const key = keyFor(task.id);
  const spoke = takesFor(key).length > 0;
  const lim = REHEARSAL[task.band] || REHEARSAL["6-8"];
  return html`<section class="panel" id="retell-say">
      <h2>
        <span class="step-badge">3</span> ${I.T("Speak: retell it out loud", "Habla: cuéntalo en voz alta")}
      </h2>
      <p class="voice-prompt" lang="en">${task.prompt}</p>
      ${framesHTML(task, I, takesFor(key).length || (loadVoice().retell?.[task.id] ? 1 : 0))}
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
        ? html`${reviewHTML(task, I, key)}
            <section class="panel">
              <h2>
                <span class="step-badge">5</span>
                ${I.T("Compare with a model retell", "Compara con un modelo")}
              </h2>
              <p class="fine">
                ${I.T("Listen for the order words the model uses. Your retell does not have to match it word for word.", "Escucha las palabras de orden que usa el modelo. Tu relato no tiene que ser igual palabra por palabra.")}
              </p>
              ${modelStudentHTML(key, task.model, I)}
              ${latestMeterHTML(key, task.model, I, ctx.prefs?.rate || 0.9)}
            </section>`
        : ""
    }`;
}

function stagesHTML(task, I, spoke) {
  const reviewed = reviewTicks(task.id).some(Boolean);
  const at = !spoke ? 0 : reviewed ? 3 : 2;
  const names = [
    I.T("Prepare", "Prepara"),
    I.T("Speak", "Habla"),
    I.T("Review", "Revisa"),
    I.T("Improve", "Mejora"),
  ];
  return html`<ol class="lc-stages" aria-label="${I.S("Your steps", "Tus pasos")}">
    ${names.map((n, i) => html`<li class="${i < at ? "is-done" : i === at ? "is-now" : ""}" ${i === at ? raw('aria-current="step"') : ""}>${n}</li>`)}
  </ol>`;
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
          ${stagesHTML(task, I, spoke)}
        </header>
        <div class="studio-cols">
          <div class="studio-col">${sourceHTML(task, I, ctx)}${vocabHTML(task, I)}${plannerHTML(task, I)}</div>
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
  if (listenClick(e, ctx, I, task, { key: task.id })) return true;
  const frames = t.closest("[data-retell-frames]");
  if (frames) {
    if (frames.dataset.retellFrames === "full") fullFrames.add(id);
    else fullFrames.delete(id);
    ctx.rerender();
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

export function retellChange(e, ctx, I, id) {
  if (e.target.matches("[data-retell-crit]")) {
    const task = findRetell(id);
    if (!task) return;
    const state = loadVoice();
    state.reviews ||= {};
    const ticks = task.criteria.map((_, i) => Boolean(state.reviews[id]?.[i]));
    ticks[Number(e.target.dataset.retellCrit)] = e.target.checked;
    state.reviews[id] = ticks;
    saveVoice(state);
    const box = document.querySelector("[data-retell-focus]");
    if (box) box.innerHTML = toHtml(focusHTML(nextFocus(task, ticks), I));
    return;
  }
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
  stopListening(null);
  mounted?.renderer?.destroy?.();
  mounted?.i18n?.stop?.();
  mounted = null;
}
