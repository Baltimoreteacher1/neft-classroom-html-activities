// Speaking UI: the shared markup for every Speaking task (plan bar, frame chips, live level bar, microphone panel,
// typed fallback, self-playback review and the three-point self-check). Pure functions of (flow state, guard snapshot,
// env): no DOM reads, no device access. Chrome is translated through env.I; the English being read, the frame text and
// the learner's own words are never translated. Styles: lab-speaking.css. Behaviour: speaking-session.js.
import { html, icon } from "../util.js";
import { REASON_COPY } from "./audio-guard.js";
import {
  CHECK_IDS,
  PHASE,
  PLAN_MIN_MS,
  PLAN_WINDOW_MS,
  TYPED_MIN_WORDS,
  answered,
  canReady,
  chipsFor,
  countWords,
  elapsedMs,
} from "./speaking-flow.js";

/** How long "I'm ready" waits. 0 for tests, the QA hook and anyone who asks for calm (reduced motion): the button is simply there. */
export function planWait(env = {}) {
  if (env.qa || typeof window === "undefined") return 0;
  const doc = typeof document !== "undefined" ? document.documentElement : null;
  const calm =
    (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) ||
    doc?.dataset?.comfortMotion === "calm";
  return calm ? 0 : PLAN_MIN_MS;
}

export const CHECK_LABELS = Object.freeze({
  idea: ["Complete idea", "Idea completa"],
  word: ["Academic word", "Palabra académica"],
  voice: ["Clear voice", "Voz clara"],
});
const QUESTIONS = Object.freeze({
  idea: {
    q: [
      "I said a whole idea, not just a few words.",
      "Dije una idea completa, no solo unas pocas palabras.",
    ],
    tip: [
      "Next time, finish your sentence before you stop.",
      "La próxima vez, termina tu oración antes de parar.",
    ],
  },
  word: {
    q: [
      "I used an academic word from the task or the word bank.",
      "Usé una palabra académica de la tarea o del banco de palabras.",
    ],
    tip: [
      "Next time, choose one key word before you start.",
      "La próxima vez, elige una palabra clave antes de empezar.",
    ],
  },
  voice: {
    q: [
      "My voice was clear: someone could hear every word.",
      "Mi voz fue clara: alguien podía oír cada palabra.",
    ],
    typed: [
      "When I read my answer back aloud, my voice was clear.",
      "Cuando leí mi respuesta en voz alta, mi voz fue clara.",
    ],
    tip: [
      "Next time, watch the level bar and speak a little closer.",
      "La próxima vez, mira la barra de nivel y habla un poco más cerca.",
    ],
  },
});
const DECLINED = Object.freeze({
  en: "No recording this time. You can try the microphone again, or type your answer.",
  es: "Sin grabación esta vez. Puedes intentar el micrófono otra vez o escribir tu respuesta.",
});
const IDLE_SNAP = Object.freeze({
  state: "IDLE",
  reason: "",
  level: 0,
  take: null,
  fallback: false,
});
const pair = (I, p) => I.T(p[0], p[1]);

// ── small pieces ─────────────────────────────────────────────────────────────────────────
/** The live input level. Width comes from --lvl through transform in lab-speaking.css (no layout work per frame). */
export function levelHTML(level, I) {
  const pct = Math.round(Math.min(1, Math.max(0, Number(level) || 0)) * 100);
  return html`<div
    class="al-level"
    role="meter"
    aria-label="${I.S("Microphone level", "Nivel del micrófono")}"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow="${pct}"
  >
    <span style="--lvl:${(pct / 100).toFixed(2)}"></span>
  </div>`;
}

/** Sentence frames: read-only in the plan and mic steps, tap-to-add chips in the typed fallback. Hidden in Independent (C). */
export function framesHTML(frames, env, { chips = false } = {}) {
  const list = chipsFor(frames, env.sup?.frames || "none");
  if (!list.length) return "";
  const I = env.I;
  return html`<div class="sp-frames">
    <p class="sp-frames-l" id="sp-frames-l">
      ${chips ? I.T("Tap a frame to start your sentence", "Toca una estructura para empezar tu oración") : I.T("Sentence frames to try", "Estructuras de oración para probar")}
    </p>
    <ul class="sp-chips" aria-labelledby="sp-frames-l">
      ${list.map((text, i) => html`<li>${chips ? html`<button type="button" class="sp-chip" data-sp-chip="${i}" lang="en">${text}</button>` : html`<span class="sp-chip is-plain" lang="en">${text}</span>`}</li>`)}
    </ul>
  </div>`;
}

// ── PLAN ────────────────────────────────────────────────────────────────────────────────
export function planHTML(o) {
  const { sp, env } = o;
  const I = env.I;
  const now = o.now ?? Date.now();
  const wait = o.wait ?? planWait(env);
  const open = canReady(sp, now, wait);
  return html`<section class="sp-plan" aria-labelledby="sp-plan-h">
    <h3 class="sp-h" id="sp-plan-h" tabindex="-1">
      ${I.T("Plan first. Think quietly.", "Primero planea. Piensa en silencio.")}
    </h3>
    <p>
      ${o.planNote || I.T("Take a few calm seconds. What is your first idea? Which important word will you use? How do you want to sound?", "Tómate unos segundos con calma. ¿Cuál es tu primera idea? ¿Qué palabra importante vas a usar? ¿Cómo quieres sonar?")}
    </p>
    ${framesHTML(o.planFrames ?? o.frames, env)}
    <div class="sp-plan-bar" aria-hidden="true">
      <span
        style="--sp-ms:${PLAN_WINDOW_MS}ms;--sp-delay:-${Math.min(PLAN_WINDOW_MS, elapsedMs(sp, now))}ms"
      ></span>
    </div>
    <p class="sp-plan-hint fine" role="status" data-sp-plan-hint>
      ${open ? I.T("Press the button when you are ready. There is no rush.", "Pulsa el botón cuando estés listo. No hay prisa.") : I.T("Think quietly. The button is ready in a moment.", "Piensa en silencio. El botón estará listo en un momento.")}
    </p>
    <div class="gs-actions">
      <button type="button" class="btn btn-primary btn-big" data-sp-ready ${open ? "" : "disabled"}>
        ${icon("check")}${I.T("I'm ready", "Estoy listo")}
      </button>
    </div>
  </section>`;
}

// ── READY / RECORD ──────────────────────────────────────────────────────────────────────
const noMicBtn = (I) =>
  html`<button type="button" class="btn" data-sp-nomic>
    ${icon("speaking")}${I.T("I can't record right now", "No puedo grabar ahora")}
  </button>`;

export function micHTML(o) {
  const { env } = o;
  const I = env.I;
  const snap = o.snap || IDLE_SNAP;
  const note = html`<p class="fine">
    ${I.T("Your voice stays in this browser tab. Nothing is uploaded, and nothing is scored.", "Tu voz se queda en esta pestaña del navegador. No se sube nada y nada recibe puntos.")}
  </p>`;
  if (snap.state === "REQUESTING_MIC")
    return html`<div class="sp-mic" aria-busy="true">
      <p role="status">
        ${I.T("Waiting for the microphone. Choose Allow if your browser asks.", "Esperando el micrófono. Elige Permitir si el navegador te lo pregunta.")}
      </p>
      <div class="gs-actions">${noMicBtn(I)}</div>
    </div>`;
  if (snap.state === "MONITORING_LEVEL")
    return html`<div class="sp-mic">
      ${levelHTML(snap.level, I)}
      <p role="status">
        ${I.T("Say a few words. The bar should move. When you are ready, start recording.", "Di unas palabras. La barra debe moverse. Cuando estés listo, empieza a grabar.")}
      </p>
      <div class="gs-actions">
        <button type="button" class="btn btn-primary btn-big" data-sp-rec>
          ${icon("record")}${I.T("Start recording", "Empezar a grabar")}</button
        >${noMicBtn(I)}
      </div>
    </div>`;
  if (snap.state === "RECORDING")
    return html`<div class="sp-mic is-live">
      ${levelHTML(snap.level, I)}
      <p role="status">
        ${I.T("Recording. Press Stop when you are done.", "Grabando. Pulsa Detener cuando termines.")}
      </p>
      <div class="gs-actions">
        <button type="button" class="btn btn-primary btn-big is-live" data-sp-stop>
          ${icon("stop")}${I.T("Stop recording", "Detener la grabación")}
        </button>
      </div>
    </div>`;
  return html`<div class="sp-mic">
    <p>
      ${I.T("Turn on your microphone, check the level bar, then record.", "Enciende tu micrófono, revisa la barra de nivel y luego graba.")}
    </p>
    <div class="gs-actions">
      <button type="button" class="btn btn-primary btn-big" data-sp-mic>
        ${icon("speaking")}${I.T("Turn on my microphone", "Encender mi micrófono")}</button
      >${noMicBtn(I)}
    </div>
    ${note}
  </div>`;
}

/** Blocked microphone or "I can't record": the reason, a retry, and a typed or tap-to-build answer that finishes the same step. */
export function fallbackHTML(o) {
  const { sp, env } = o;
  const I = env.I;
  const copy = REASON_COPY[sp.reason] || DECLINED;
  const text = String(o.text || "");
  const words = countWords(text);
  return html`<section class="sp-fallback" aria-labelledby="sp-fb-h">
    <h3 class="sp-h" id="sp-fb-h" tabindex="-1">
      ${I.T("Let's keep going another way", "Sigamos de otra manera")}
    </h3>
    <p class="sp-reason" role="status" data-sp-reason="${sp.reason}">${I.T(copy.en, copy.es)}</p>
    <div class="gs-actions">
      <button type="button" class="btn" data-sp-retry>
        ${icon("replay")}${I.T("Try the microphone again", "Intentar el micrófono otra vez")}
      </button>
    </div>
    <label class="gs-label" for="sp-typed"
      >${I.T("Type what you would say", "Escribe lo que dirías")}</label
    >
    ${framesHTML(o.chipFrames ?? o.frames, env, { chips: true })}
    <textarea
      id="sp-typed"
      class="sp-typed"
      data-sp-typed
      rows="4"
      maxlength="400"
      spellcheck="true"
      lang="en"
      aria-describedby="sp-typed-note"
    >
${text}</textarea>
    <p class="fine" id="sp-typed-note">
      ${I.T(`Write at least ${TYPED_MIN_WORDS} words. A typed answer counts as your speaking try. It stays on this device.`, `Escribe al menos ${TYPED_MIN_WORDS} palabras. Una respuesta escrita cuenta como tu intento de hablar. Se queda en este dispositivo.`)}
    </p>
    <div class="gs-actions">
      <button
        type="button"
        class="btn btn-primary btn-big"
        data-sp-typed-done
        ${words >= TYPED_MIN_WORDS ? "" : "disabled"}
      >
        ${icon("check")}${I.T("Use my typed answer", "Usar mi respuesta escrita")}
      </button>
    </div>
  </section>`;
}

export function recordPartHTML(o) {
  const { sp, env } = o;
  const say = html`<h3 class="sp-h" id="sp-rd-h" tabindex="-1">${env.I.T("Say your answer", "Di tu respuesta")}</h3>`;
  if (sp.phase === PHASE.PLAN) return planHTML(o);
  if (sp.phase === PHASE.READY && sp.blocked) return fallbackHTML(o);
  if (sp.phase === PHASE.READY)
    return html`<section class="sp-ready" aria-labelledby="sp-rd-h">${say}${framesHTML(o.planFrames ?? o.frames, env)}${micHTML(o)}</section>`;
  if (sp.phase === PHASE.RECORD)
    return html`<section class="sp-ready" aria-labelledby="sp-rd-h">${say}${micHTML(o)}</section>`;
  return "";
}

// ── REVIEW / SELF_CHECK ─────────────────────────────────────────────────────────────────
export function reviewHTML(o) {
  const { sp, env } = o;
  const I = env.I;
  const first = sp.phase === PHASE.REVIEW;
  const back = sp.typed
    ? html`<blockquote class="sp-typed-view" lang="en">${o.text || ""}</blockquote>
        <button type="button" class="btn${first ? " btn-primary btn-big" : ""}" data-sp-play>
          ${icon("volume")}${first ? I.T("I read it back aloud", "Lo leí en voz alta") : I.T("Read it back again", "Leerlo otra vez")}
        </button>`
    : html`<button
        type="button"
        class="btn${first ? " btn-primary btn-big" : ""}"
        data-sp-play
        ${o.hasTake ? "" : "disabled"}
      >
        ${icon("play")}${first ? I.T("Play my recording", "Escuchar mi grabación") : I.T("Play it again", "Escucharla otra vez")}
      </button>`;
  return html`<section class="sp-review" aria-labelledby="sp-rv-h">
    <h3 class="sp-h" id="sp-rv-h" tabindex="-1">
      ${sp.typed ? I.T("Read your answer back", "Lee tu respuesta de nuevo") : I.T("Listen to yourself", "Escúchate")}
    </h3>
    ${first ? html`<p>${sp.typed ? I.T("Read it aloud quietly, or in your head, to continue.", "Léela en voz alta en voz baja, o en tu mente, para continuar.") : I.T("Play your recording once to continue.", "Escucha tu grabación una vez para continuar.")}</p>` : ""}
    <div class="gs-actions">
      ${back}<button type="button" class="btn" data-sp-retake>
        ${icon("replay")}${sp.typed ? I.T("Change my answer", "Cambiar mi respuesta") : I.T("Record again", "Grabar otra vez")}
      </button>
    </div>
  </section>`;
}

export function selfCheckHTML(o) {
  const { sp, env } = o;
  const I = env.I;
  const all = answered(sp);
  const ask = (id) => {
    const base = QUESTIONS[id];
    const over = o.questions?.[id] || {};
    return { q: over.q || (sp.typed && base.typed) || base.q, tip: over.tip || base.tip };
  };
  return html`<section class="sp-check" aria-labelledby="sp-ck-h">
    <h3 class="sp-h" id="sp-ck-h" tabindex="-1">${I.T("Check yourself", "Revísate")}</h3>
    <p class="fine">
      ${I.T("This is your own judgment. Nothing here is scored.", "Es tu propia opinión. Aquí nada recibe puntos.")}
    </p>
    ${CHECK_IDS.map((id) => {
      const v = sp.self[id];
      const { q, tip } = ask(id);
      return html`<fieldset class="sp-q">
        <legend><strong>${pair(I, CHECK_LABELS[id])}</strong> <span>${pair(I, q)}</span></legend>
        <div class="sp-q-row">
          <button type="button" class="sp-yn" data-sp-self="${id}:yes" aria-pressed="${v === true}">
            ${icon("check")}${I.T("Yes", "Sí")}
          </button>
          <button type="button" class="sp-yn" data-sp-self="${id}:no" aria-pressed="${v === false}">
            ${icon("growth")}${I.T("Not yet", "Todavía no")}
          </button>
        </div>
        ${v === false ? html`<p class="gs-hint">${icon("sparkle")}${pair(I, tip)}</p>` : ""}
      </fieldset>`;
    })}
    <div class="gs-actions">
      <button type="button" class="btn btn-primary btn-big" data-sp-finish ${all ? "" : "disabled"}>
        ${icon("star")}${o.finishLabel || I.T("Finish this step", "Terminar este paso")}
      </button>
    </div>
    ${all ? "" : html`<p class="fine">${I.T("Answer all three to finish.", "Responde las tres para terminar.")}</p>`}
  </section>`;
}

export function reviewPartHTML(o) {
  const { sp } = o;
  if (sp.phase === PHASE.REVIEW) return reviewHTML(o);
  if (sp.phase === PHASE.SELF_CHECK) return html`${reviewHTML(o)}${selfCheckHTML(o)}`;
  return "";
}

export const doneHTML = (o) =>
  o.sp.phase === PHASE.DONE
    ? html`<p class="sp-done" role="status">
        ${icon("check")}${o.env.I.T("Speaking try saved. Well done for giving it a go.", "Intento de hablar guardado. Bien hecho por intentarlo.")}
      </p>`
    : "";

/** The whole step in one call (Language Expeditions, Conversation Crossroads). Fluency Echo splits it across its steps. */
export const speakingHTML = (o) =>
  html`<div class="sp" data-sp-phase="${o.sp.phase}">
    ${recordPartHTML(o)}${reviewPartHTML(o)}${doneHTML(o)}
  </div>`;

