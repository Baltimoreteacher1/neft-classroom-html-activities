// The model student card and the "speak about as long as the model" meter. Shared by the practice tests and the
// Speaking Studio so the routine looks and behaves the same everywhere. The meter compares LENGTH only: it appears
// after a recording, never runs while the learner speaks, and is never a countdown or a speed target.
import { compareLength, estimateSeconds, lengthAdvice, rhythmEnvelope } from "./lang/model-student.js";
import { canSpeak, speak } from "./speech.js";
import { announce, html, icon } from "./util.js";

const measured = new Map(); // key → seconds the model actually took to play on this device (this tab only)
const heard = new Set(); // keys whose model was played in this tab
const rhythms = new Map(); // key → { env, fps, fromVoice } from the last full playback

/** The model's word-timing envelope from its last full playback on this device, or null. */
export const modelRhythm = (key) => rhythms.get(key) || null;

/** Seconds the model takes: measured from a real playback when there was one, otherwise estimated from its words. */
export function modelSeconds(key, line, rate = 1) {
  return measured.get(key) || estimateSeconds(line, rate);
}
export const modelHeard = (key) => heard.has(key);
export function resetModelStudent() {
  measured.clear();
  heard.clear();
  rhythms.clear();
}

const initials = (name) =>
  String(name || "?")
    .slice(0, 1)
    .toUpperCase();

/**
 * The model student's turn. `model` is { name, line, partial } from findModelStudent (or a studio model with
 * name ""). The line is already printed in the task; this card speaks it in a classmate's voice, then hands over.
 */
export function modelStudentHTML(key, model, I) {
  if (!model) return "";
  const name = model.name || I.S("A classmate", "Un compañero");
  const done = heard.has(key);
  return html`<section
    class="model-student ${done ? "is-heard" : ""}"
    aria-label="${I.S("Model student", "Estudiante modelo")}"
  >
    <span class="ms-avatar" aria-hidden="true">${initials(name)}</span>
    <div class="ms-body">
      <p class="ms-kicker">
        ${icon("speaking")} ${I.T("Model student", "Estudiante modelo")} · <strong>${name}</strong>
      </p>
      <p class="ms-line" lang="en">“${model.line}”</p>
      <div class="ms-actions">
        ${
          canSpeak()
            ? html`<button type="button" class="btn small" data-model-student="${key}">
                ${icon("volume")}
                ${done ? I.T(`Hear ${name} again`, `Escuchar a ${name} otra vez`) : I.T(`Hear ${name} first`, `Escucha primero a ${name}`)}
              </button>`
            : html`<span class="fine"
                >${I.T("Read-aloud is not available here. Read the model line, or ask your teacher to say it.", "La lectura en voz alta no está disponible aquí. Lee la frase modelo o pide a tu docente que la diga.")}</span
              >`
        }
      </div>
      <p class="ms-turn" role="status">
        ${done ? I.T(`Now it is your turn. Use your own words, and speak about as long as ${name} — or longer.`, `Ahora te toca a ti. Usa tus propias palabras y habla más o menos lo mismo que ${name}, o más.`) : ""}
      </p>
    </div>
  </section>`;
}

/** Plays the model in a classmate voice and times it. Returns once it finishes; `rerender` refreshes the card. */
export async function playModelStudent(key, model, { rate = 0.9, I, rerender } = {}) {
  if (!model?.line) return false;
  if (!canSpeak()) {
    announce(
      I.S(
        "Read-aloud is not available. Read the model line.",
        "La lectura en voz alta no está disponible. Lee la frase modelo.",
      ),
    );
    return false;
  }
  const started = Date.now();
  const marks = [];
  const ok = await speak(model.line, {
    rate,
    persona: "student",
    onBoundary: (b) => {
      if (b.name !== "sentence") marks.push({ charIndex: b.charIndex, t: (Date.now() - started) / 1000 });
    },
  });
  if (ok) {
    const secs = Math.round(((Date.now() - started) / 1000) * 10) / 10;
    if (secs >= 0.5) {
      measured.set(key, secs);
      rhythms.set(key, rhythmEnvelope(model.line, marks, secs));
    }
    heard.add(key);
    announce(I.S("Now it is your turn.", "Ahora te toca a ti."));
    rerender?.();
  }
  return ok;
}

/**
 * Two bars, the model's speaking time and the learner's, with one plain observation. Shown only after a take.
 * @param {number} youSeconds seconds the learner actually spoke
 */
export function lengthMeterHTML(key, model, youSeconds, I, { rate = 1 } = {}) {
  if (!model?.line || !(youSeconds > 0)) return "";
  const secs = modelSeconds(key, model.line, rate);
  const cmp = compareLength(youSeconds, secs, { partial: model.partial });
  if (!cmp) return "";
  const name = model.name || "";
  const advice = lengthAdvice(cmp, name, { partial: model.partial });
  const modelLabel = name
    ? I.S(
        `${name}${model.partial ? " (start)" : ""}`,
        `${name}${model.partial ? " (comienzo)" : ""}`,
      )
    : I.S("Model", "Modelo");
  const estimated = !measured.has(key);
  return html`<figure
    class="len-meter is-${cmp.band}"
    aria-label="${I.S("Speaking length compared with the model", "Duración de tu habla comparada con el modelo")}"
  >
    <figcaption>
      ${icon("growth")} ${I.T("How long you spoke", "Cuánto tiempo hablaste")}
    </figcaption>
    <div class="len-row">
      <span class="len-name">${modelLabel}</span>
      <span class="len-track"
        ><span class="len-bar is-model" style="width:${cmp.modelPct}%"></span
      ></span>
      <span class="len-val">${I.T(`about ${cmp.model}s`, `unos ${cmp.model} s`)}</span>
    </div>
    <div class="len-row">
      <span class="len-name">${I.T("You", "Tú")}</span>
      <span class="len-track"
        ><span class="len-bar is-you" style="width:${cmp.youPct}%"></span
      ></span>
      <span class="len-val">${I.T(`about ${cmp.you}s`, `unos ${cmp.you} s`)}</span>
    </div>
    <p class="len-advice">${I.T(advice[0], advice[1])}</p>
    <p class="fine">
      ${estimated ? I.T("The model's time is estimated from its words. Press its play button to measure it on this device.", "El tiempo del modelo se calcula a partir de sus palabras. Presiona su botón para medirlo en este dispositivo.") : ""}
      ${I.T("This compares length only. It is not a speed goal or a score.", "Esto solo compara la duración. No es una meta de velocidad ni un puntaje.")}
    </p>
  </figure>`;
}
