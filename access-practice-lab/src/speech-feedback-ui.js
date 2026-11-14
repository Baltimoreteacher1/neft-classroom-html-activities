// The Speaking Studio's "What I said" panel: the learner's own words read back with word-bank and linking words
// marked, a short checklist, and pace as information. Rendering only; every number comes from lang/speech-feedback.js.
// Pace is said once, plainly, with no target, no comparison and no good/bad wording (PLATFORM.md honesty rules).
import { speechFeedback } from "./lang/speech-feedback.js";
import { html, icon } from "./util.js";

/** Spanish for the purpose-move labels in lang/purpose.js (descriptive, like the English). */
const MOVE_ES = {
  orient: "Presenta la escena (cuándo, dónde, quién)",
  sequence: "Ordena los sucesos con palabras de tiempo",
  events: "Cuenta lo que pasó con verbos de acción en pasado",
  response: "Muestra cómo terminó o qué significó",
  topic: "Nombra y define el tema",
  details: "Da detalles específicos (datos, números, nombres)",
  organize: "Agrupa las ideas con palabras de enlace",
  close: "Cierra con la idea principal",
  phenomenon: "Dice qué se está explicando",
  cause: "Conecta causa y efecto",
  chain: "Conecta más de un paso del proceso",
  support: "Apoya la explicación con datos o una fuente",
  claim: "Presenta una postura clara",
  reason: "Da una razón",
  evidence: "Usa evidencia de la fuente",
  counter: "Considera otro punto de vista",
  restate: "Termina volviendo a la postura",
};

const PACE_NONE = {
  "no-recording": [
    "There is no recording for this take, so there is nothing to say about pace.",
    "No hay grabación de este intento, así que no hay nada que decir sobre el ritmo.",
  ],
  mismatch: [
    "The words and the recording do not seem to match, so pace is not shown. Check the words above.",
    "Las palabras y la grabación no parecen coincidir, así que no se muestra el ritmo. Revisa las palabras de arriba.",
  ],
  "too-short": [
    "The take is too short to describe pace.",
    "El intento es demasiado corto para describir el ritmo.",
  ],
};

const markLabel = (I, kind) =>
  kind === "bank"
    ? I.S("word-bank word", "palabra del banco")
    : I.S("linking word", "palabra de enlace");

function transcriptHTML(fb, I) {
  return html`<p class="sf-said" lang="en">
    ${fb.segments.map((s) => (s.kind ? html`<mark class="sf-${s.kind}" title="${markLabel(I, s.kind)}">${s.text}<span class="visually-hidden"> (${markLabel(I, s.kind)})</span></mark>` : s.text))}
  </p>`;
}

function paceHTML(pace, I) {
  if (pace.wpm)
    return I.T(
      `About ${pace.wpm} words a minute; longest stretch without a pause ${pace.longestRun} seconds. This is information about this take, not a score — there is no right speed.`,
      `Unas ${pace.wpm} palabras por minuto; el tramo más largo sin pausa fue de ${pace.longestRun} segundos. Es información sobre este intento, no un puntaje: no hay una velocidad correcta.`,
    );
  const t = PACE_NONE[pace.reason] || [
    "Pace could not be measured for this take.",
    "No se pudo medir el ritmo de este intento.",
  ];
  return I.T(...t);
}

/**
 * @param {object} o
 * @param {string} o.transcript
 * @param {object} o.task  a Speaking Studio task (keyUse, stages.supported.bank)
 * @param {object|null} o.audio  summarizeEnvelope() result, or null
 * @param {string} o.stage  guided | supported | independent (independent never shows unused bank words)
 * @param {boolean} o.typed  true when the words were typed, not recognised from speech
 * @param {boolean} o.sttAvailable  speech recognition works in this browser
 */
export function whatISaidHTML({ transcript, task, audio, stage, typed, sttAvailable }, I) {
  const fb = speechFeedback(transcript, {
    keyUse: task.keyUse,
    wordBank: task.stages?.supported?.bank || [],
    audio,
  });
  if (!fb.words) return "";
  const showList = stage !== "independent";
  const linkLabel =
    fb.links.kind === "order"
      ? I.T("Order words I used", "Palabras de orden que usé")
      : I.T("Linking words I used", "Palabras de enlace que usé");
  const none = I.T("none yet", "ninguna todavía");
  return html`<section class="panel sf-panel" id="spk-said" aria-labelledby="sfTitle">
    <h3 id="sfTitle">${icon("speaking")} ${I.T("What I said", "Lo que dije")}</h3>
    ${typed ? html`<p class="fine">${icon("info")} ${sttAvailable ? I.T("These are the words you typed.", "Estas son las palabras que escribiste.") : I.T("Speech recognition is not available in this browser, so this uses the words you typed.", "El reconocimiento de voz no está disponible en este navegador, así que se usan las palabras que escribiste.")}</p>` : ""}
    ${transcriptHTML(fb, I)}
    <p class="fine sf-key">
      <mark class="sf-bank">${I.T("word bank", "banco de palabras")}</mark>
      <mark class="sf-link"
        >${fb.links.kind === "order" ? I.T("order word", "palabra de orden") : I.T("linking word", "palabra de enlace")}</mark
      >
    </p>
    <ul class="speech-stats sf-checks">
      ${fb.bank.total ? html`<li class="${fb.bank.used.length ? "ok" : "todo"}">${icon(fb.bank.used.length ? "check" : "info")}<span>${I.T(`Words from the word bank I used: ${fb.bank.used.length} of ${fb.bank.total}`, `Palabras del banco que usé: ${fb.bank.used.length} de ${fb.bank.total}`)}${fb.bank.used.length ? ` (${fb.bank.used.join(", ")})` : ""}</span></li>` : ""}
      <li class="${fb.links.words.length ? "ok" : "todo"}">
        ${icon(fb.links.words.length ? "check" : "info")}<span
          >${linkLabel}: ${fb.links.words.length ? fb.links.words.join(", ") : none}</span
        >
      </li>
      ${fb.moves.map((m) => html`<li class="${m.present ? "ok" : "todo"}">${icon(m.present ? "check" : "info")}<span>${I.T(m.label, MOVE_ES[m.id] || m.label)}${m.present ? "" : html` <span class="fine">${I.T("(not yet)", "(todavía no)")}</span>`}</span></li>`)}
    </ul>
    <p class="fine sf-pace">${icon("clock")} ${paceHTML(fb.pace, I)}</p>
    ${showList && fb.bank.unused.length ? html`<p class="sf-unused"><strong>${I.T("Words from the list you have not used yet:", "Palabras de la lista que todavía no usaste:")}</strong> ${fb.bank.unused.join(", ")}</p>` : ""}
    <div class="row-actions">
      <button type="button" class="btn" data-again-word>
        ${icon("retry")}
        ${showList && fb.bank.total ? I.T("Try again and add one word from the list", "Inténtalo otra vez y agrega una palabra de la lista") : I.T("Try again and add one more linking word", "Inténtalo otra vez y agrega otra palabra de enlace")}
      </button>
    </div>
  </section>`;
}
