// Speaking Studio: authentic spoken production — plan, rehearse, record, listen back, review, re-record.
// Speaking ability is shown by speaking: every task here ends in a recording, never a multiple-choice
// answer. The lab cannot hear words, so the learner types what they said; the Language Coach works from
// that transcript, and from the loudness envelope for time speaking and pauses (all on this device).
import { crumbsHTML, setComponentsI18n } from "../components.js";
import { i18nFor, makeI18n } from "../i18n.js";
import { loadMission, loadSpeakingTasks, loadStudioIndex } from "../content.js";
import { recommendTasks } from "../lang/adapt.js";
import { analyzeResponse, compareDrafts } from "../lang/analyze.js";
import {
  LocalFeedbackProvider,
  LOCAL_FEEDBACK_MODEL_VERSION,
  LOCAL_FEEDBACK_PROMPT_VERSION,
} from "../lang/providers.js";
import { describeSpeech, summarizeEnvelope } from "../lang/audio.js";
import { appendEntry, buildProfile, loadLedger, saveLedger, suggestStage } from "../lang/ledger.js";
import { emptyReview, reviewComplete } from "../lang/rubrics.js";
import {
  addTake,
  choiceEffects,
  loadStudio,
  missionState,
  saveStudio,
  speakingState,
} from "../lang/studio.js";
import * as audioStore from "../audio-store.js";
import { canRecord, isRecording, takesFor } from "../recorder.js";
import { canSpeak, speak, speakDialogue, stop as stopSpeech } from "../speech.js";
import { waveformSVG } from "../waveform.js";
import {
  chartHTML,
  chooserHeroHTML,
  disclosure,
  feedbackHTML,
  jumpNavHTML,
  purposeBadgeHTML,
  rubricHTML,
  stageLockedHTML,
  stagePickerHTML,
  stepperHTML,
  supportsPanelHTML,
  tableHTML,
  taskCardHTML,
  trackDisclosures,
} from "../studio-ui.js";
import { ART, BASE, announce, html, icon, raw, wordCount } from "../util.js";

const IGN = raw("data-nsr-ignore");
let S = null;
let I = makeI18n("en"); // set at the top of render and in each handler that has a ctx
const chosen = new Map(); // task id → stage picked before the first attempt
let kept = new Map(); // take id → object URL for recordings kept on this device
let timing = { prep: 0, max: 0 }; // optional preparation countdown and response limit (this tab only)
let stopScope = null;
const feedbackProvider = new LocalFeedbackProvider();

const save = () => saveStudio(S.studio);
const TYPES = {
  retell: [["Retell", "Volver a contar"], "replay", ["Tell what happened, in order.", "Cuenta lo que pasó, en orden."]],
  describe: [["Describe", "Describir"], "search", ["Say what you see in data, pictures or places.", "Di lo que ves en datos, imágenes o lugares."]],
  compare: [["Compare", "Comparar"], "grid", ["Say how two things are alike and different.", "Di en qué se parecen y en qué se diferencian dos cosas."]],
  explain: [["Explain", "Explicar"], "bulb", ["Say why or how something happens.", "Di por qué o cómo sucede algo."]],
  argue: [["Argue", "Argumentar"], "flag", ["Take a position and back it up with evidence.", "Toma una postura y apóyala con evidencia."]],
  discuss: [["Discuss", "Conversar"], "conversation", ["Answer a partner in a short conversation.", "Responde a un compañero en una conversación corta."]],
};
const kindT = (k) => (TYPES[k] ? I.T(...TYPES[k][0]) : undefined);
// The five steps of a speaking task, shared by the chooser's loop and the stepper.
const STEP_ES = { Plan: "Planear", "Say it": "Dilo", "Type it": "Escríbelo", Coach: "Coach", Review: "Revisar", "Listen back": "Escúchate", Check: "Verificar" };
const stepT = (label) => I.T(label, STEP_ES[label]);

async function findTask(id, from) {
  if (from?.startsWith("mission:")) {
    const mission = await loadMission(from.slice(8)).catch(() => null);
    const t = mission?.phases.flatMap((p) => p.tasks || []).find((x) => x.task?.id === id)?.task;
    if (t) return { task: { band: "6-8", ...t }, mission };
  }
  const t = (await loadSpeakingTasks()).tasks.find((x) => x.id === id);
  return t ? { task: t, mission: null } : null;
}
const backHref = (band) => `${BASE}/speak?grades=${band}`;
const missionHref = (m, band) => `${BASE}/missions/${m.id}?grades=${band}`;

async function chooserHTML(ctx, index, entries) {
  const band = ctx.band;
  const tasks = index.speaking.filter((t) => t.band === band || !t.band);
  const full = new Map((await loadSpeakingTasks()).tasks.map((t) => [t.id, t]));
  const recs = recommendTasks(tasks, entries, { band, n: 3 });
  const groups = Object.keys(TYPES)
    .map((k) => [k, tasks.filter((t) => t.taskType === k)])
    .filter(([, l]) => l.length);
  const card = (t, why) =>
    taskCardHTML({
      href: `${BASE}/speak/${t.id}?grades=${band}`,
      title: t.title,
      ico: TYPES[t.taskType]?.[1] || "speaking",
      kind: kindT(t.taskType),
      time: t.time,
      desc: full.get(t.id)?.scenario,
      meta: [t.keyUse, t.contentArea],
      why,
      i18n: I,
    });
  const next = recs[0];
  return html`${crumbsHTML([
      [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
      [I.S("Speaking Studio", "Estudio de expresión oral"), null],
    ], { i18n: I })}
    <div class="d-speaking">
    ${chooserHeroHTML({
      domain: "d-speaking",
      eyebrow: I.T(`Grades ${band.replace("-", "–")} · ${tasks.length} speaking tasks`, `Grados ${band.replace("-", "–")} · ${tasks.length} tareas de expresión oral`),
      title: I.T("Speaking Studio", "Estudio de expresión oral"),
      lead: I.T("Plan what you will say, say it out loud, listen back, and say it better. You show your speaking by speaking.", "Planea lo que vas a decir, dilo en voz alta, escúchate y dilo mejor. Demuestras tu expresión oral hablando."),
      art: `${ART}/domain-speaking.svg`,
      loop: ["Plan", "Say it", "Listen back", "Check", "Review"].map(stepT),
      i18n: I,
      cta: next
        ? html`<a
            class="btn btn-primary btn-big btn-next"
            href="${BASE}/speak/${next.task.id}?grades=${band}"
            ><span class="btn-kicker">${I.T("Try next", "Prueba la siguiente")}</span
            ><span class="next-title">${next.task.title}</span>${icon("arrow-right")}</a
          >`
        : "",
    })}
    ${
      tasks.length
        ? html`${jumpNavHTML(
            groups.map(([k]) => [`spk-${k}`, kindT(k)]),
            I.S("Jump to a kind of speaking task", "Ir a un tipo de tarea de expresión oral"),
          )}
          ${
            recs.length
              ? html`<section class="task-group is-next" aria-labelledby="spk-next-h">
                  <header>
                    <h2 id="spk-next-h">${icon("sparkle")} ${I.T("Try next", "Prueba la siguiente")}</h2>
                    <p class="fine">${I.T("Picked from the evidence you have saved on this device.", "Elegidas según la evidencia que guardaste en este dispositivo.")}</p>
                  </header>
                  <div class="task-grid">${recs.map((r) => card(r.task, r.why))}</div>
                </section>`
              : ""
          }
          ${groups.map(
            ([k, list]) =>
              html`<section class="task-group" id="spk-${k}" aria-labelledby="spk-${k}-h">
                <header>
                  <h2 id="spk-${k}-h">${icon(TYPES[k][1])} ${kindT(k)}</h2>
                  <p class="fine">${I.T(...TYPES[k][2])}</p>
                </header>
                <div class="task-grid">${list.map((t) => card(t))}</div>
              </section>`,
          )}`
        : html`<section class="panel empty-state">
            <img src="${ART}/empty.svg" alt="" width="480" height="300" />
            <h2>${I.T("No speaking tasks for this grade band yet", "Todavía no hay tareas de expresión oral para este grupo de grados")}</h2>
            <p>${I.T("Switch grade band from the menu, or open the quick Speaking practice room.", "Cambia el grupo de grados desde el menú o abre la sala rápida de práctica de hablar.")}</p>
            <a class="btn" href="${BASE}/Speaking/A?grades=${band}">${I.T("Speaking practice room", "Sala de práctica de hablar")}</a>
          </section>`
    }
    <p class="no-print">
      <a class="btn" href="${BASE}/printables/studio-speaking" target="_blank" rel="noopener"
        >${icon("print")} ${I.T("Print speaking task cards", "Imprimir tarjetas de tareas de expresión oral")}</a
      >
    </p>
    <p class="disclaimer">
      ${I.T("Classroom speaking practice. The Language Coach reads the transcript you type and measures time and pauses on this device. It does not judge pronunciation, and it is not a WIDA score.", "Práctica de expresión oral en el aula. El Language Coach lee la transcripción que escribes y mide el tiempo y las pausas en este dispositivo. No juzga la pronunciación y no es un puntaje de WIDA.")}
    </p>`;
}

function stimulusHTML(task) {
  const st = task.stimulus;
  if (!st || st.kind === "none") return "";
  if (st.kind === "audio")
    return html`<section class="source listen-card">
      <h3 class="source-title">${icon("listening")} ${I.T("Listen first", "Escucha primero")}</h3>
      <div class="listen-player">
        <button type="button" class="listen-btn" data-play-stimulus>
          <span class="listen-icon" aria-hidden="true">${icon("play")}</span
          ><span class="listen-label">${I.T("Listen", "Escuchar")}</span>
        </button>
        <button type="button" class="ghost" data-stop-audio>${icon("stop")} ${I.T("Stop", "Detener")}</button>
        <p class="listen-meta fine">
          ${I.T("Listen as many times as you need. The words are not shown until after you speak.", "Escucha todas las veces que necesites. Las palabras no se muestran hasta que hables.")}
        </p>
      </div>
    </section>`;
  if (st.kind === "chart") return html`<section class="source">${chartHTML(st.chart)}</section>`;
  if (st.kind === "table") return html`<section class="source">${tableHTML(st.table)}</section>`;
  if (st.kind === "text")
    return html`<section class="source">
      <div class="source-text">${(st.text || []).map((p) => html`<p>${p}</p>`)}</div>
    </section>`;
  return "";
}

function plannerHTML(task, state) {
  return html`<section class="panel planner" id="spk-plan">
    <h3><span class="step-badge">1</span> ${I.T("Plan what you will say", "Planea lo que vas a decir")}</h3>
    <div class="slot-grid">
      ${task.planner.map(
        (slot, i) =>
          html`<label class="field slot"
            ><span><b class="slot-n">${i + 1}</b>${slot.label}</span
            ><textarea
              rows="2"
              data-plan="${slot.id}"
              ${S.stage === "independent" ? "" : html`placeholder="${S.fx.hints[slot.id] || slot.hint}"`}
              ${IGN}
            >
${state.plan[slot.id] || ""}</textarea>
          </label>`,
      )}
    </div>
    <label class="practiced"
      ><input type="checkbox" data-rehearsed ${state.rehearsed ? raw("checked") : ""} ${IGN} /> ${I.T("I said my plan quietly out loud once.", "Dije mi plan en voz baja una vez.")}</label
    >
  </section>`;
}

function supportsHTML(task) {
  if (S.stage === "independent")
    return html`<p class="own-note">
      ${icon("user")}<span
        >${I.T("You chose to work on your own: no frames, words or model. Your plan and your voice are enough.", "Elegiste trabajar por tu cuenta: sin marcos, palabras ni modelo. Tu plan y tu voz son suficientes.")}</span
      >
    </p>`;
  return supportsPanelHTML(task, S.stage, {
    modelBody: {
      summary: I.T("Hear a model answer", "Escucha una respuesta modelo"),
      body: html`<button type="button" class="btn" data-play-model>
        ${icon("volume")} ${I.T("Hear the model", "Escuchar el modelo")}
      </button>`,
    },
    i18n: I,
  });
}

function timingHTML(task) {
  const [, hi] = task.targetSeconds;
  const opt = (v, label, cur) =>
    html`<option value="${v}" ${cur === v ? raw("selected") : ""}>${label}</option>`;
  return disclosure(
    "spk-timing",
    html`${icon("clock")} ${I.T("Optional timing", "Tiempo opcional")}`,
    html`<p class="fine">
        ${I.T("Off by default. Use these to practice speaking on a clock; nothing changes in your results.", "Desactivado de forma predeterminada. Úsalo para practicar hablar con reloj; nada cambia en tus resultados.")}
      </p>
      <div class="timing-grid">
        <label class="field"
          ><span>${I.T("Get ready first", "Prepárate primero")}</span
          ><select data-timing="prep" ${IGN}>
            ${opt(0, I.S("No countdown", "Sin cuenta regresiva"), timing.prep)}${opt(5, I.S("5 seconds", "5 segundos"), timing.prep)}${opt(10, I.S("10 seconds", "10 segundos"), timing.prep)}${opt(30, I.S("30 seconds", "30 segundos"), timing.prep)}
          </select></label
        >
        <label class="field"
          ><span>${I.T("Stop automatically", "Detener automáticamente")}</span
          ><select data-timing="max" ${IGN}>
            ${opt(0, I.S("No limit", "Sin límite"), timing.max)}${opt(hi, I.S(`After ${hi} seconds`, `Después de ${hi} segundos`), timing.max)}
          </select></label
        >
      </div>`,
  );
}

function takeRowHTML(t, i, task, state) {
  const isKept = state.takes.find((x) => x.id === t.id)?.keptAudio;
  return html`<li>
    <div class="take-head">
      <strong>${I.T(`Try ${i + 1}`, `Intento ${i + 1}`)}</strong><span class="fine">${t.seconds}s</span>
    </div>
    ${raw(waveformSVG(t.env))}
    <audio controls preload="none" aria-label="${I.S(`Play recording ${i + 1}`, `Reproducir la grabación ${i + 1}`)}" src="${t.url}"></audio>
    <div class="take-actions">
      ${audioStore.available() ? html`<button type="button" class="ghost small" data-keep="${t.id}">${isKept ? html`${icon("check")} ${I.T("Kept for my teacher", "Guardada para mi docente")}` : I.T("Keep for my teacher", "Guardar para mi docente")}</button>` : ""}<a
        class="ghost small"
        href="${t.url}"
        download="speaking-${task.id}-${i + 1}.${t.extension}"
        >${icon("download")} ${I.T("Download", "Descargar")}</a
      >
    </div>
  </li>`;
}

function compareHTML(takes) {
  const cell = (label, labelEs, ariaEn, ariaEs, t, n) =>
    html`<figure class="compare-cell">
      <figcaption>${I.T(label, labelEs)} · ${t.seconds}s</figcaption>
      ${raw(waveformSVG(t.env))}<audio
        controls
        preload="none"
        aria-label="${I.S(ariaEn, ariaEs)}"
        src="${t.url}"
      ></audio
      ><span class="fine">${I.T(`Try ${n}`, `Intento ${n}`)}</span>
    </figure>`;
  return html`<section class="compare" aria-label="${I.S("Compare your tries", "Compara tus intentos")}">
    <h4>${I.T("Compare your tries", "Compara tus intentos")}</h4>
    <p class="fine">
      ${I.T("Listen to both. Notice what changed, such as a reason added or a clearer ending. Length alone does not make an answer better.", "Escucha los dos. Fíjate en lo que cambió, como una razón agregada o un final más claro. Que una respuesta sea más larga no la hace mejor.")}
    </p>
    <div class="compare-grid">
      ${cell("Oldest saved try", "Intento guardado más antiguo", "Play oldest saved try", "Reproducir el intento guardado más antiguo", takes[0], 1)}${cell("Latest try", "Último intento", "Play latest try", "Reproducir el último intento", takes.at(-1), takes.length)}
    </div>
  </section>`;
}

function recorderBlock(task, state) {
  const key = task.id;
  const rec = isRecording(key);
  const takes = takesFor(key);
  const manual = state.takes.some((t) => t.manual);
  const [lo, hi] = task.targetSeconds;
  if (!canRecord())
    return html`<section class="panel recorder is-unavailable" id="spk-say">
      <h3><span class="step-badge">2</span> ${I.T("Say it", "Dilo")}</h3>
      <p class="rec-state is-off">
        ${icon("alert")}<span
          ><strong>${I.T("This browser cannot record.", "Este navegador no puede grabar.")}</strong> ${I.T("Say your answer to a partner or your teacher out loud. Then press the button and type what you said.", "Di tu respuesta en voz alta a un compañero o a tu docente. Luego presiona el botón y escribe lo que dijiste.")}</span
        >
      </p>
      <div class="rec-main">
        ${manual ? "" : html`<button type="button" class="btn btn-primary" data-manual-take>${icon("check")} ${I.T("I said it out loud", "Lo dije en voz alta")}</button>`}
        <button type="button" class="ghost" data-say="${task.prompt}">
          ${icon("volume")} ${I.T("Hear the task", "Escuchar la tarea")}
        </button>
      </div>
    </section>`;
  return html`<section
    class="panel recorder studio-rec ${rec ? "is-recording" : ""}"
    id="spk-say"
    aria-label="${I.S("Record your answer", "Graba tu respuesta")}"
  >
    <h3><span class="step-badge">2</span> ${I.T("Say it", "Dilo")}</h3>
    <p class="fine">
      ${I.T(`Aim for ${lo}–${hi} seconds. Speak in a quiet place. Recordings stay on this device unless you keep one for your teacher.`, `Intenta hablar de ${lo} a ${hi} segundos. Habla en un lugar tranquilo. Las grabaciones se quedan en este dispositivo a menos que guardes una para tu docente.`)}
    </p>
    <p class="rec-state ${rec ? "is-live" : ""}" role="status">
      ${rec ? html`<span class="rec-pulse" aria-hidden="true"></span><span><strong>${I.T("Recording.", "Grabando.")}</strong> ${I.T("The microphone is on. Press Stop when you are done.", "El micrófono está encendido. Presiona Detener cuando termines.")}</span>` : html`${icon("record")}<span>${takes.length ? I.T(`${takes.length} ${takes.length === 1 ? "try" : "tries"} saved on this device. The microphone is off.`, `${takes.length} ${takes.length === 1 ? "intento guardado" : "intentos guardados"} en este dispositivo. El micrófono está apagado.`) : I.T("Ready. The microphone is off until you press Record.", "Listo. El micrófono está apagado hasta que presiones Grabar.")}</span>`}
    </p>
    <div class="rec-main">
      ${
        rec
          ? html`<button type="button" class="rec-btn is-stop" data-rec-stop="${key}">
                <span class="rec-dot" aria-hidden="true"></span>${I.T("Stop", "Detener")}
              </button>
              <div class="rec-live" aria-live="off">
                <span class="rec-meter" style="--lvl:0.00"></span>
                <span class="rec-time">0s</span>
                <canvas class="rec-scope" width="360" height="56" aria-hidden="true"></canvas>
              </div>`
          : html`<button
              type="button"
              class="rec-btn"
              data-rec-start="${key}"
              data-rec-prep="${timing.prep}"
              data-rec-max="${timing.max}"
            >
              <span class="rec-dot" aria-hidden="true"></span
              >${takes.length ? I.T("Record again", "Grabar otra vez") : I.T("Record my answer", "Grabar mi respuesta")}
            </button>`
      }
      <button type="button" class="ghost" data-say="${task.prompt}">
        ${icon("volume")} ${I.T("Hear the task", "Escuchar la tarea")}
      </button>
    </div>
    <p class="rec-quiet" role="status" hidden></p>
    <p class="rec-countdown" data-rec-countdown="${key}" role="status"></p>
    <p class="rec-error" data-rec-error="${key}" role="status"></p>
    ${rec ? "" : timingHTML(task)}
    ${manual || rec ? "" : html`<p class="fine rec-fallback">${I.T("No microphone, or it is not working?", "¿No tienes micrófono o no funciona?")} <button type="button" class="ghost small" data-manual-take>${I.T("I said it out loud (no recording)", "Lo dije en voz alta (sin grabación)")}</button></p>`}
    ${
      takes.length
        ? html`<ol class="takes">
            ${takes.map((t, i) => takeRowHTML(t, i, task, state))}
          </ol>`
        : ""
    }
    ${takes.length > 1 ? compareHTML(takes) : ""}
  </section>`;
}

/** A typed transcript that is much longer or shorter than the speaking measured is probably not a match. */
function transcriptCheck(take) {
  const words = wordCount(take.transcript);
  const seconds = take.audio?.ok ? take.audio.speechSeconds : 0;
  if (!words || !seconds) return "";
  const rate = words / seconds;
  if (rate > 4.5)
    return html`<p class="note-todo">
      ${icon("alert")}<span
        >${I.T(`You typed ${words} words for ${seconds} seconds of speaking. That is more than most people say that fast — check that you typed only what you said.`, `Escribiste ${words} palabras para ${seconds} segundos de habla. Es más de lo que la mayoría de las personas dice tan rápido — revisa que escribiste solo lo que dijiste.`)}</span
      >
    </p>`;
  if (rate < 0.7 && seconds >= 8)
    return html`<p class="note-todo">
      ${icon("alert")}<span
        >${I.T(`You typed ${words} words for ${seconds} seconds of speaking. Did you leave parts out?`, `Escribiste ${words} palabras para ${seconds} segundos de habla. ¿Omitiste alguna parte?`)}</span
      >
    </p>`;
  return "";
}

function analysisHTML(task, state, take) {
  if (!take) return "";
  const sum = take.audio;
  return html`<section class="panel transcript-panel" id="spk-type">
    <h3><span class="step-badge">3</span> ${I.T("Listen back, then type what you said", "Escúchate y luego escribe lo que dijiste")}</h3>
    <p class="fine">
      ${I.T(`${take.manual ? "Type what you said." : "Listen to your take. Then type what you said."} Type it exactly as you said it, including mistakes — the Language Coach can only look at the words you type, so a "cleaned-up" version would hide what to work on. It cannot hear your voice.`, `${take.manual ? "Escribe lo que dijiste." : "Escucha tu grabación. Luego escribe lo que dijiste."} Escríbelo exactamente como lo dijiste, con los errores incluidos — el Language Coach solo puede ver las palabras que escribes, así que una versión «arreglada» ocultaría lo que hay que trabajar. No puede oír tu voz.`)}
    </p>
    ${
      sum
        ? html`<ul class="speech-stats">
            ${describeSpeech(sum, task.targetSeconds).map((l) => html`<li class="${l.ok ? "ok" : "todo"}">${icon(l.ok ? "check" : "info")}<span>${l.text}</span></li>`)}
          </ul>`
        : ""
    }
    ${transcriptCheck(take)}
    <label class="field paper"
      ><span class="paper-head"
        >${I.T("What I said (exactly)", "Lo que dije (exactamente)")}
        <span class="fine" data-tcount>${I.T(`${wordCount(take.transcript)} words`, `${wordCount(take.transcript)} palabras`)}</span></span
      ><textarea id="spk-transcript" rows="5" data-transcript ${IGN}>
${take.transcript || ""}</textarea>
    </label>
    <div class="row-actions">
      <button
        type="button"
        class="btn btn-primary"
        data-analyze
        ${wordCount(take.transcript) < 3 ? raw("disabled") : ""}
      >
        ${icon("sparkle")} ${I.T("Check my language", "Revisar mi lenguaje")}
      </button>
    </div>
  </section>`;
}

function resultsHTML(task, state, take, prev) {
  if (!take?.analyzedAt) return "";
  const a = analyzeResponse(take.transcript, optsFor(task));
  const delta = prev?.transcript
    ? compareDrafts(prev.transcript, take.transcript, optsFor(task))
    : null;
  return html`<section class="panel" id="spk-coach">
      <h3><span class="step-badge">4</span> ${I.T("What your speaking shows", "Lo que muestra tu habla")}</h3>
      ${feedbackHTML(a, take.transcript, { patternHref: (id) => `${BASE}/detective/${id}?grades=${S.band}`, i18n: I })}
      ${
        delta
          ? html`<div class="revision-coach-card card">
              <h4>${icon("growth")} ${I.T("Compared with your last try", "Comparado con tu último intento")}</h4>
              <ul>
                ${delta.changes.map((c) => html`<li>${c.label}: ${c.from} → ${c.to} ${c.better ? icon("star") : ""}</li>`)}${delta.gainedMoves.map((m) => html`<li>${I.T(`New: ${m.toLowerCase()}`, `Nuevo: ${m.toLowerCase()}`)} ${icon("star")}</li>`)}${prev.audio && take.audio ? html`<li>${I.T(`Speaking time: ${prev.audio.speechSeconds}s → ${take.audio.speechSeconds}s`, `Tiempo hablando: ${prev.audio.speechSeconds}s → ${take.audio.speechSeconds}s`)}</li>` : ""}
              </ul>
            </div>`
          : ""
      }
    </section>
    <section class="panel" id="spk-review">
      <h3><span class="step-badge">5</span> ${I.T("Review your speaking", "Revisa tu habla")}</h3>
      ${rubricHTML(take.selfReview || emptyReview(), { modality: "speaking", prefix: `self-${take.id}`, i18n: I })}
      <div class="row-actions">
        <button
          type="button"
          class="btn btn-primary"
          data-finish
          ${reviewComplete(take.selfReview) ? "" : raw("disabled")}
        >
          ${I.T("Save my review", "Guardar mi revisión")}
        </button>
        <button type="button" class="btn" data-again>
          ${icon("retry")} ${I.T("Record again to improve", "Grabar otra vez para mejorar")}
        </button>
      </div>
      ${take.finished ? html`<p class="saved-note">${icon("check")} ${I.T("Saved. This is practice evidence, not a score.", "Guardado. Esto es evidencia de práctica, no un puntaje.")}</p>` : ""}
    </section>`;
}

function teacherHTML(task, state) {
  const take = state.takes.at(-1);
  if (!take)
    return html`<section class="panel">
      <p>${I.T("No recording has been made on this device yet.", "Todavía no se ha hecho ninguna grabación en este dispositivo.")}</p>
    </section>`;
  const reviews = take.teacherReview || [];
  return html`<section class="panel teacher-review">
    <h2>${I.T("Teacher conference review", "Revisión docente en conferencia")}</h2>
    <p class="fine">
      ${I.T("Listen to the learner's take, then record practice bands. Saved on this device with the learner's work.", "Escuche la grabación del estudiante y luego registre las bandas de práctica. Se guarda en este dispositivo junto con el trabajo del estudiante.")}
    </p>
    <p><strong>${I.T("Task:", "Tarea:")}</strong> ${task.title}</p>
    ${takesFor(task.id).at(-1) ? html`<audio controls src="${takesFor(task.id).at(-1).url}" aria-label="${I.S("Learner recording", "Grabación del estudiante")}"></audio>` : html`<p class="fine">${kept.get(take.id) ? "" : I.T("Recording is not in memory. Open it from a kept recording in Passport.", "La grabación no está en la memoria. Ábrala desde una grabación guardada en Pasaporte.")}</p>`}
    ${kept.get(take.id) ? html`<audio controls src="${kept.get(take.id)}" aria-label="${I.S("Kept recording", "Grabación guardada")}"></audio>` : ""}
    ${
      take.transcript
        ? html`<h3>${I.T("What the learner typed", "Lo que escribió el estudiante")}</h3>
            <p class="portfolio-response">${take.transcript}</p>`
        : ""
    }
    <h3>${I.T("Listen for", "Qué escuchar")}</h3>
    <ul>
      ${(task.teacher?.listenFor || []).map((x) => html`<li>${x}</li>`)}
    </ul>
    ${rubricHTML(S.teacherDraft || emptyReview(), { who: "teacher", modality: "speaking", prefix: "teacher", i18n: I })}
    <div class="row-actions">
      <button
        type="button"
        class="btn btn-primary"
        data-teacher-save
        ${reviewComplete(S.teacherDraft) ? "" : raw("disabled")}
      >
        ${I.T("Save teacher review", "Guardar revisión docente")}
      </button>
    </div>
    ${
      reviews.length
        ? html`<h3>${I.T("Earlier teacher reviews", "Revisiones docentes anteriores")}</h3>
            <ul>
              ${reviews.map((r) => html`<li>${r.t.slice(0, 10)} — ${["lc", "vu", "lctl"].map((k) => `${k}: ${r[k]}`).join(", ")}${r.note ? ` — ${r.note}` : ""}</li>`)}
            </ul>`
        : ""
    }
  </section>`;
}

const optsFor = (task) => ({
  keyUse: task.keyUse,
  modality: "speaking",
  sourceText: S.sourceText,
  sourceTerms: task.sourceTerms,
  wordBank: task.stages.supported.bank,
  stage: S.stage,
  expected: {
    minWords: Math.round(task.targetSeconds[0] * 1.6),
    maxWords: Math.round(task.targetSeconds[1] * 2.2),
  },
});
const stageSupports = () => ({
  frames: S.stage === "guided",
  bank: S.stage !== "independent",
  model: Boolean(S.state.used.model),
  coach: S.takeIndex > 0,
});

function stepsFor(state) {
  const take = state.takes.at(-1);
  return [
    { label: stepT("Plan"), done: Boolean(state.rehearsed || Object.values(state.plan).some(Boolean)) },
    { label: stepT("Say it"), done: state.takes.length > 0 },
    { label: stepT("Type it"), done: wordCount(take?.transcript) >= 3 },
    { label: stepT("Coach"), done: Boolean(take?.analyzedAt) },
    { label: stepT("Review"), done: Boolean(take?.finished) },
  ];
}

export async function render(ctx) {
  I = i18nFor(ctx);
  setComponentsI18n(I);
  const query = new URLSearchParams(location.search);
  const index = await loadStudioIndex();
  S = { ...(S || {}), band: ctx.band, studio: loadStudio(), ledger: loadLedger() };
  const entries = S.ledger.entries;
  const id = ctx.route.id;
  if (!id) return { title: I.S("Speaking Studio", "Estudio de expresión oral"), html: await chooserHTML(ctx, index, entries) };
  const found = await findTask(id, query.get("from"));
  if (!found)
    return {
      title: I.S("Not found", "No se encontró"),
      html: html`<section class="panel empty-state">
        <img src="${ART}/empty.svg" alt="" width="480" height="300" />
        <h1 tabindex="-1">${I.T("We could not find that task.", "No pudimos encontrar esa tarea.")}</h1>
        <a class="btn" href="${backHref(ctx.band)}">${I.T("Speaking Studio", "Estudio de expresión oral")}</a>
      </section>`,
    };
  const { task, mission } = found;
  S.task = task;
  S.mission = mission;
  S.fx = choiceEffects(task, mission, S.studio);
  S.state = speakingState(S.studio, task.id);
  S.profile = buildProfile(entries, { band: ctx.band });
  const requestedStage = query.get("suggestedStage");
  const missionStage =
    mission &&
    query.get("from")?.startsWith("mission:") &&
    ["guided", "supported", "independent"].includes(requestedStage)
      ? requestedStage
      : "";
  const baseSuggestion = suggestStage(S.profile, task.keyUse);
  const sug = missionStage
    ? {
        stage: missionStage,
        reason: I.T(
          "Your mission suggested this starting support from your earlier practice. You can choose a different setting.",
          "Tu misión sugirió este apoyo inicial según tu práctica anterior. Puedes elegir otra opción.",
        ),
      }
    : baseSuggestion;
  const hasTake = S.state.takes.length > 0;
  S.stage = S.state.stage || chosen.get(task.id) || sug.stage;
  S.takeIndex = Math.max(0, S.state.takes.length - 1);
  S.sourceText = task.stimulus?.turns ? task.stimulus.turns.map((t) => t.text) : [];
  const teacherMode = new URLSearchParams(location.search).get("tab") === "review";
  for (const t of S.state.takes)
    if (t.keptAudio && !kept.has(t.id)) {
      const u = await audioStore.urlFor(t.id);
      if (u) kept.set(t.id, u);
    }
  const take = S.state.takes.at(-1);
  const prev = S.state.takes.length > 1 ? S.state.takes.at(-2) : null;
  const board = mission ? missionState(S.studio, mission.id).board : [];
  return {
    title: task.title,
    html: html`${crumbsHTML([[I.S("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band}`], mission ? [mission.title, missionHref(mission, ctx.band)] : [I.S("Speaking Studio", "Estudio de expresión oral"), backHref(ctx.band)], [task.title, null]], { i18n: I })}
      <article class="activity studio-view speak-studio d-speaking">
        <header class="act-head">
          <div class="act-bar">
            <p class="act-context">
              ${icon("speaking")} ${I.T("Speaking Studio", "Estudio de expresión oral")} · ${kindT(task.taskType)} · ${task.keyUse}
            </p>
            <p class="act-step">${icon("clock")} ${task.time} · ${task.contentArea}</p>
          </div>
          <h1 tabindex="-1">${task.title}</h1>
          ${purposeBadgeHTML(S.stage, I)}
          <div class="task-brief">
            <div>
              <span class="brief-label">${icon("info")} ${I.T("Situation", "Situación")}</span>
              <p>${task.scenario}</p>
            </div>
            <div class="brief-task">
              <span class="brief-label">${icon("flag")} ${I.T("Your task", "Tu tarea")}</span>
              <p>
                ${task.prompt}${S.fx.promptAdd.map((x) => html` <span class="path-add">${x}</span>`)}
              </p>
              <button type="button" class="ghost small" data-say="${task.prompt}">
                ${icon("volume")} ${I.T("Hear the task", "Escuchar la tarea")}
              </button>
            </div>
          </div>
        </header>
        ${
          teacherMode
            ? teacherHTML(task, S.state)
            : html`${stepperHTML(stepsFor(S.state), { label: I.S("Speaking steps", "Pasos para hablar"), i18n: I })}
                ${hasTake ? stageLockedHTML(S.stage, undefined, I) : stagePickerHTML(S.stage, sug, "stage", I)}
                <div class="studio-cols">
                  <div class="studio-col">
                    ${stimulusHTML(task)}
                    ${
                      board.length
                        ? html`<section class="panel board">
                            <h3>${icon("pin")} ${I.T("Your evidence board", "Tu tablero de evidencia")}</h3>
                            <ul class="board-list">
                              ${board.map((b) => html`<li><strong>${b.label}:</strong> ${b.text}</li>`)}
                            </ul>
                          </section>`
                        : ""
                    }
                    ${plannerHTML(task, S.state)}
                  </div>
                  <div class="studio-col">
                    ${recorderBlock(task, S.state)} ${supportsHTML(task)}
                    ${
                      task.taskType === "discuss"
                        ? html`<section class="panel conversation">
                            <h3>${icon("conversation")} ${I.T("The conversation", "La conversación")}</h3>
                            <p class="fine">
                              ${I.T("Your partner speaks in turns. Answer each turn in your recording.", "Tu compañero habla por turnos. Responde cada turno en tu grabación.")}
                            </p>
                            <ol class="turns">
                              ${task.turns.map((u, i) => html`<li><button type="button" class="ghost small" data-play-turn="${i}">${icon("volume")} ${I.T(`Hear ${u.partner}`, `Escuchar a ${u.partner}`)}</button></li>`)}
                            </ol>
                          </section>`
                        : ""
                    }
                  </div>
                </div>
                ${analysisHTML(task, S.state, take)}${resultsHTML(task, S.state, take, prev)}`
        }
      </article>
      ${mission ? html`<p><a class="btn" href="${missionHref(mission, ctx.band)}">${icon("arrow-left")} ${I.T("Back to the mission", "Volver a la misión")}</a></p>` : ""}
      <p class="save-explainer">
        ${I.T("Plans, transcripts and reviews save on this browser. Recordings do not unless you keep one.", "Los planes, las transcripciones y las revisiones se guardan en este navegador. Las grabaciones no, a menos que guardes una.")}
        <a href="${BASE}/passport?grades=${ctx.band}">${I.T("Saved work and teacher options", "Trabajo guardado y opciones para docentes")}</a>
      </p>`,
  };
}

function lockStage() {
  if (S.state.takes.length || S.state.stage) return;
  S.state.stage = S.stage;
  S.state.used = { frames: S.stage === "guided", bank: S.stage !== "independent" };
}

export async function onRecorded(key, ctx) {
  if (!S?.task || key !== S.task.id) return;
  const t = takesFor(key).at(-1);
  if (!t || S.state.takes.some((x) => x.id === t.id)) return;
  lockStage();
  const audio = t.env?.length ? summarizeEnvelope(t.env, t.fps) : null;
  addTake(S.state, { id: t.id, seconds: t.seconds, audio, extra: {} });
  S.state.rehearsed = S.state.rehearsed || false;
  save();
  I = i18nFor(ctx);
  announce(I.S("Recording saved on this device. Listen back, then type what you said.", "Grabación guardada en este dispositivo. Escúchate y luego escribe lo que dijiste."));
  void ctx;
}

export function onInput(e) {
  if (!S?.task) return;
  const t = e.target;
  if (t.matches("[data-plan]")) {
    S.state.plan[t.dataset.plan] = t.value;
    save();
  } else if (t.matches("[data-transcript]")) {
    const take = S.state.takes.at(-1);
    if (take) {
      take.transcript = t.value;
      save();
      const b = document.querySelector("[data-analyze]");
      if (b) b.disabled = wordCount(t.value) < 3;
      const c = document.querySelector("[data-tcount]");
      if (c) c.textContent = I.S(`${wordCount(t.value)} words`, `${wordCount(t.value)} palabras`);
    }
  } else if (t.matches("[data-rubric-note]")) {
    const take = S.state.takes.at(-1);
    if (new URLSearchParams(location.search).get("tab") === "review")
      (S.teacherDraft ||= emptyReview()).note = t.value;
    else if (take) {
      take.selfReview = { ...(take.selfReview || emptyReview()), note: t.value };
      save();
    }
  }
}

export function onChange(e, ctx) {
  if (!S?.task) return;
  const t = e.target;
  if (t.matches("[data-timing]")) {
    timing = { ...timing, [t.dataset.timing]: Number(t.value) || 0 };
    const b = document.querySelector("[data-rec-start]");
    if (b) {
      b.dataset.recPrep = String(timing.prep);
      b.dataset.recMax = String(timing.max);
    }
    return;
  }
  if (t.matches("[data-stage]")) {
    chosen.set(S.task.id, t.value);
    S.stage = t.value;
    ctx.rerender();
    return;
  }
  if (t.matches("[data-rehearsed]")) {
    S.state.rehearsed = t.checked;
    save();
    return;
  }
  if (t.matches("[data-rubric]")) {
    if (new URLSearchParams(location.search).get("tab") === "review")
      (S.teacherDraft ||= emptyReview())[t.dataset.rubric] = t.value;
    else {
      const take = S.state.takes.at(-1);
      if (take) {
        take.selfReview = { ...(take.selfReview || emptyReview()), [t.dataset.rubric]: t.value };
        save();
      }
    }
    ctx.rerender();
  }
}

function analyze(ctx) {
  const take = S.state.takes.at(-1);
  if (take.analyzedText === take.transcript && take.analyzedAt) {
    announce(I.S("Your transcript has not changed since the last check.", "Tu transcripción no ha cambiado desde la última revisión."));
    return;
  }
  lockStage();
  S.state.attemptId ||= `a${Date.now().toString(36)}`;
  const first = !S.ledger.entries.some(
    (x) =>
      x.task === S.task.id &&
      x.src === "speaking" &&
      x.kind === "first" &&
      x.attempt === S.state.attemptId,
  );
  const result = feedbackProvider.evaluateSpeaking(take.transcript, null, optsFor(S.task));
  const a = result.analysis;
  take.analyzedText = take.transcript;
  take.analyzedAt = new Date().toISOString(); // the analysis is recomputed from the transcript, never stored
  const supports = { ...stageSupports(), coach: !first, noRecording: Boolean(take.manual) };
  const m = {
    ...a.ledger,
    spk: take.audio?.ok
      ? {
          speech: take.audio.speechSeconds,
          run: take.audio.longestRun,
          pauses30: take.audio.pausesPer30,
        }
      : undefined,
  };
  const entry = appendEntry(S.ledger, {
    src: "speaking",
    task: S.task.id,
    band: S.band,
    domain: "Speaking",
    use: S.task.keyUse,
    stage: S.stage,
    kind: first ? "first" : "revision",
    attempt: S.state.attemptId,
    supports,
    m,
    feedbackSource: result.feedbackSource,
    modelVersion: LOCAL_FEEDBACK_MODEL_VERSION,
    promptVersion: LOCAL_FEEDBACK_PROMPT_VERSION,
    confidence: 0.6,
  });
  take.ledgerId = entry.id;
  if (S.mission)
    missionState(S.studio, S.mission.id).tasks[S.task.id] = { done: true, t: take.analyzedAt };
  saveLedger(S.ledger);
  save();
  announce(I.S("Language Coach finished. Read your next moves.", "El Language Coach terminó. Lee tus próximos pasos."));
  ctx.rerender();
}

export function onClick(e, ctx) {
  if (!S?.task) return false;
  I = i18nFor(ctx);
  const t = e.target;
  if (t.closest("[data-manual-take]")) {
    lockStage();
    addTake(S.state, {
      id: `m${Date.now().toString(36)}`,
      seconds: 0,
      audio: null,
      extra: { manual: true },
    });
    save();
    announce(I.S("Now type what you said.", "Ahora escribe lo que dijiste."));
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-analyze]")) {
    analyze(ctx);
    return true;
  }
  if (t.closest("[data-play-stimulus]")) {
    const turns = S.task.stimulus.turns.map((u) => `${u.speaker}: ${u.text}`);
    canSpeak()
      ? speakDialogue(turns, { rate: ctx.prefs.rate })
      : announce(I.S("Read-aloud is not available. Ask your teacher to read it.", "La lectura en voz alta no está disponible. Pide a tu docente que lo lea."));
    return true;
  }
  if (t.closest("[data-play-model]")) {
    S.state.used.model = true;
    save();
    speak(S.task.stages.guided.model, { rate: ctx.prefs.rate });
    return true;
  }
  const turn = t.closest("[data-play-turn]");
  if (turn) {
    speak(S.task.turns[Number(turn.dataset.playTurn)].say, { rate: ctx.prefs.rate });
    return true;
  }
  const keep = t.closest("[data-keep]");
  if (keep) {
    const take = takesFor(S.task.id).find((x) => x.id === keep.dataset.keep);
    audioStore.keep(take, S.task.id).then((ok) => {
      const meta = S.state.takes.find((x) => x.id === take.id);
      if (ok && meta) {
        meta.keptAudio = true;
        save();
        announce(I.S("Kept on this device for your teacher. You can delete it in Passport.", "Guardada en este dispositivo para tu docente. Puedes borrarla en Pasaporte."));
      } else announce(I.S("This browser could not keep the recording. Use Download instead.", "Este navegador no pudo guardar la grabación. Usa Descargar."));
      ctx.rerender();
    });
    return true;
  }
  if (t.closest("[data-finish]")) {
    const take = S.state.takes.at(-1);
    take.finished = true;
    save();
    announce(I.S("Review saved.", "Revisión guardada."));
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-again]")) {
    document.querySelector("[data-rec-start]")?.scrollIntoView({ block: "center" });
    document.querySelector("[data-rec-start]")?.focus();
    return true;
  }
  if (t.closest("[data-new-attempt]")) {
    S.state.stage = "";
    S.state.attemptId = "";
    S.state.takes = [];
    S.state.plan = {};
    S.state.used = {};
    S.state.rehearsed = false;
    save();
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-teacher-save]")) {
    const take = S.state.takes.at(-1);
    (take.teacherReview ||= []).push({ t: new Date().toISOString(), ...S.teacherDraft });
    S.teacherDraft = null;
    save();
    announce(I.S("Teacher review saved.", "Revisión docente guardada."));
    ctx.rerender();
    return true;
  }
  return false;
}

/**
 * Draws the real microphone level as a rolling bar history while a take is recording. The recorder reports
 * the level into the meter's --lvl custom property; this only plots those readings, it never invents any.
 * If nothing louder than room noise arrives for three seconds it says so, in words.
 */
function wireScope(root) {
  const meter = root.querySelector(".rec-meter");
  const canvas = root.querySelector(".rec-scope");
  const quiet = root.querySelector(".rec-quiet");
  if (!meter || !canvas) return null;
  const g = canvas.getContext("2d");
  const color = getComputedStyle(canvas).color;
  const bars = Math.floor(canvas.width / 6);
  const hist = [];
  const start = performance.now();
  let last = 0;
  let peak = 0;
  const draw = () => {
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.fillStyle = color;
    const mid = canvas.height / 2;
    hist.forEach((v, i) => {
      const h = Math.max(2, v * canvas.height);
      g.fillRect((bars - hist.length + i) * 6, mid - h / 2, 4, h);
    });
  };
  const obs = new MutationObserver(() => {
    const now = performance.now();
    const lvl = Number.parseFloat(meter.style.getPropertyValue("--lvl")) || 0;
    peak = Math.max(peak, lvl);
    if (now - last >= 50) {
      last = now;
      hist.push(lvl);
      if (hist.length > bars) hist.shift();
      draw();
    }
    if (quiet && now - start > 3000) {
      const silent = peak < 0.05;
      quiet.hidden = !silent;
      if (silent)
        quiet.textContent = I.S(
          "We cannot hear you yet. Check that your microphone is on, and speak closer to it.",
          "Todavía no te oímos. Revisa que tu micrófono esté encendido y habla más cerca.",
        );
    }
  });
  obs.observe(meter, { attributes: true, attributeFilter: ["style"] });
  draw();
  return () => obs.disconnect();
}

export function mount(root) {
  trackDisclosures(root);
  for (const d of root.querySelectorAll("details[data-model]"))
    d.addEventListener("toggle", () => {
      if (d.open && S?.state) {
        S.state.used.model = true;
        save();
      }
    });
  stopScope?.();
  stopScope = wireScope(root);
}
export function unmount() {
  stopScope?.();
  stopScope = null;
  stopSpeech();
}
