// Dictation controls shared by the Speaking Studio, the conversation partner and oral reading. One recognition
// session at a time. Recognized words go into an editable box; the learner can always correct or type instead.
import { DICTATION_NOTE, canDictate, startDictation } from "./stt.js";
import { announce, html, icon } from "./util.js";

let session = null; // { mode, stop() }
let sessionId = "";
let sessionDone = null; // the onDone given when the session started

let localReady = false;

export const dictating = (id) => Boolean(session) && sessionId === id;

/**
 * Hands-free transcription while a take records runs only after the learner has used the dictate button once and the
 * browser recognized ON THE DEVICE. The lab never probes speech recognition on page load (some Chromium builds crash
 * the page when the recognizer is touched without a user gesture), and never runs the network recognizer alongside
 * the recorder on the same microphone.
 */
export const autoDictationReady = () => localReady && canDictate();
export const dictationMode = () => session?.mode || "";

/** The dictate button and a note about where recognition runs, or the typing note when it cannot. */
export function dictationControlsHTML(id, I, { label = null } = {}) {
  if (!canDictate())
    return html`<p class="fine dict-note">${icon("info")} ${I.T(...DICTATION_NOTE.none)}</p>`;
  const on = dictating(id);
  return html`<div class="dict-row">
    <button
      type="button"
      class="btn ${on ? "is-live" : ""}"
      data-dictate="${id}"
      aria-pressed="${on}"
    >
      ${icon(on ? "stop" : "speaking")}
      ${on ? I.T("Stop listening", "Dejar de escuchar") : label || I.T("Say it: the words appear here", "Dilo: las palabras aparecen aquí")}
    </button>
    <p class="fine dict-note" role="status">
      ${on ? I.T(...(DICTATION_NOTE[session.mode] || DICTATION_NOTE.standard)) : I.T("You can also type or fix the words yourself.", "También puedes escribir o corregir las palabras tú mismo.")}
    </p>
  </div>`;
}

/**
 * Starts or stops dictation for `id`. While listening, `onText(text)` gets the running transcript; on stop,
 * `onDone(text, mode)` gets the final words. Returns true when it handled the click.
 */
export async function toggleDictation(id, { I, onText, onDone, lang = "en-US" } = {}) {
  if (session) {
    const was = session;
    const wasId = sessionId;
    const done = sessionDone;
    session = null;
    sessionId = "";
    sessionDone = null;
    const text = await was.stop();
    done?.(text, was.mode);
    if (wasId === id) return true;
  }
  const s = await startDictation({
    lang,
    onText: (r) => onText?.(r.text),
    onError: (err) => {
      session = null;
      sessionId = "";
      sessionDone = null;
      announce(
        err === "not-allowed"
          ? I.S(
              "Speech recognition was not allowed. You can type instead.",
              "No se permitió el reconocimiento de voz. Puedes escribir.",
            )
          : I.S(
              "Speech recognition stopped. You can type instead.",
              "El reconocimiento de voz se detuvo. Puedes escribir.",
            ),
      );
    },
  });
  if (!s) {
    announce(I.S(...DICTATION_NOTE.none));
    return true;
  }
  session = s;
  sessionId = id;
  sessionDone = onDone || null;
  if (s.mode === "local") localReady = true;
  announce(I.S("Listening. Speak now.", "Escuchando. Habla ahora."));
  return true;
}

/** Stops any session without reporting (navigation). */
export function cancelDictation() {
  session?.stop();
  session = null;
  sessionId = "";
  sessionDone = null;
}
