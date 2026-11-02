// Shared UI pieces: listening player, speaking recorder, vocabulary drawer,
// self-checks, tier picker, band switch, progress ring, reading voice toolbar.
import { SPEAKING_CHECKS } from "./grade.js";
import { canRecord, takesFor } from "./recorder.js";
import { waveformSVG } from "./waveform.js";
import { canSpeak, getVoiceOptions } from "./speech.js";
import { findCognatesInText } from "./multilingual.js";
import { glossInline } from "./glossary.js";
import { INLINE_BTN } from "./evidence-ui.js";
import { i18nFor, makeI18n } from "./i18n.js";
import { splitSentences, tagLabel } from "./lang/evidence-notebook.js";
import { LISTEN_NOTE_FIELDS, listeningSegments, signalParts } from "./learning.js";
import { BASE, DOMAIN_META, LEVEL_KEYS, TIERS, asList, bandLabel, html, icon, raw } from "./util.js";

const IGN = raw("data-nsr-ignore");

// Interface language for every builder below. Views call setComponentsI18n(I) while rendering; each builder also
// accepts an `i18n` option that wins over the module-level one. English mode output is the original English.
let I = makeI18n("en");
export function setComponentsI18n(i18n) {
  if (i18n) I = i18n;
}
/** Sets and returns the module-level i18n from a render ctx (for views that have no i18n of their own). */
export function ensureI18n(ctx) {
  I = i18nFor(ctx);
  return I;
}
/** The "microphone unavailable" message shown in `data-rec-error` and announced. Plain string. */
export const micDeniedMessage = (i18n = I) =>
  i18n.S(
    "The microphone is unavailable. Check browser permission and your microphone, or practice aloud with a partner. You can continue without recording.",
    "El micrófono no está disponible. Revisa el permiso del navegador y tu micrófono, o practica en voz alta con un compañero. Puedes continuar sin grabar.",
  );
const TIER_RANGE_ES = { A: "Más apoyo", B: "Algo de apoyo", C: "Más independencia" };
const tierName = (L, k) => L.T(TIERS[k].name, TIERS[k].es);
const NOTE_FIELD_ES = { main: "Idea principal", details: "Detalles clave", signals: "Palabras señal" };
// Decorative level pattern for the listening player; it only moves while audio is actually playing.
const BAR_H = [30, 55, 40, 75, 50, 90, 60, 40, 70, 95, 55, 35, 65, 85, 45, 60, 30, 70, 50, 80, 40, 55, 35, 25];
const listenBars = () => raw(BAR_H.map((h, i) => `<i style="--h:${h};--d:${i % 12}"></i>`).join(""));

// Scripts the current page can play, keyed by player id. Views register them
// while rendering so the heard text never has to sit in the DOM.
export const scripts = new Map();
const plays = new Map();
export const playCount = (key) => plays.get(key) || 0;
export const notePlay = (key) => plays.set(key, playCount(key) + 1);

/** Big listen button for a heard script. The transcript is NOT rendered here. */
export function listenPlayerHTML(
  key,
  segments,
  { label = null, rate = 0.9, test = false, maxPlays = Number.POSITIVE_INFINITY, played = null, i18n = null } = {},
) {
  const L = i18n || I;
  scripts.set(key, asList(segments));
  const limited = Number.isFinite(maxPlays);
  const n = played ?? playCount(key);
  if (!canSpeak())
    return html`<div class="listen-player is-unavailable" role="note">
      <p>
        <strong>${L.T("Read-aloud is not available in this browser.", "La lectura en voz alta no está disponible en este navegador.")}</strong>
        ${L.T("Ask your teacher to read the listening part to you.", "Pide a tu docente que te lea la parte de escuchar.")}
      </p>
    </div>`;
  if (limited) {
    const left = Math.max(0, maxPlays - n);
    return html`<div class="listen-player is-limited" data-player="${key}">
    <button type="button" class="listen-btn" data-listen="${key}" aria-describedby="lp-${key}" ${left ? "" : raw("disabled")}>
      <span class="listen-icon" aria-hidden="true">${icon("play")}</span>
      <span class="listen-label">${left ? (n ? L.T("Play once more", "Reproducir otra vez") : L.T("Play", "Reproducir")) : L.T("Played", "Reproducido")}</span>
    </button>
    <div class="listen-meta" id="lp-${key}" role="status">
      <span class="listen-bars" aria-hidden="true">${listenBars()}</span>
      <span>${left ? L.T(`Test conditions: you can play this recording ${left === 1 ? "one more time" : `${left} times`}. It cannot be paused.`, `Condiciones de prueba: puedes reproducir esta grabación ${left === 1 ? "una vez más" : `${left} veces`}. No se puede pausar.`) : L.T("Test conditions: this recording has been played. Choose your answer.", "Condiciones de prueba: esta grabación ya se reprodujo. Elige tu respuesta.")}</span>
    </div>
  </div>`;
  }
  return html`<div class="listen-player" data-player="${key}">
    <button type="button" class="listen-btn" data-listen="${key}" aria-describedby="lp-${key}">
      <span class="listen-icon" aria-hidden="true">${icon("play")}</span>
      <span class="listen-label">${n ? L.T("Listen again", "Escuchar otra vez") : label ?? L.T("Listen", "Escuchar")}</span>
    </button>
    <button type="button" class="ghost" data-stop-audio>${icon("stop")} ${L.T("Stop audio", "Detener audio")}</button>
    <div class="listen-meta" id="lp-${key}">
      <span class="listen-bars" aria-hidden="true">${listenBars()}</span>
      <span
        >${n ? L.T(`Played ${n} time${n === 1 ? "" : "s"}`, `Reproducido ${n} ${n === 1 ? "vez" : "veces"}`) : test ? L.T("Press play. You may listen more than once.", "Presiona reproducir. Puedes escuchar más de una vez.") : L.T("Press play to hear it.", "Presiona reproducir para escucharlo.")}</span
      >
    </div>
    <div class="speed" role="group" aria-label="${L.S("Audio speed", "Velocidad del audio")}">
      <button type="button" class="speed-btn" data-rate="0.75" aria-pressed="${rate <= 0.78}">
        ${L.T("Slower", "Más lento")}
      </button>
      <button type="button" class="speed-btn" data-rate="0.9" aria-pressed="${rate > 0.78}">
        ${L.T("Normal", "Normal")}
      </button>
    </div>
  </div>`;
}

/**
 * Reading companion bar: read-aloud (voice, speed) when the browser can speak, and the Spanish cognate lens
 * only when `cognates` is on (Learn with help). "Try independently" passes cognates: false.
 */
export function readingToolbarHTML(
  passageKey,
  segments,
  { rate = 0.9, voiceURI = "", showCognates = false, cognates = true, i18n = null } = {},
) {
  const L = i18n || I;
  scripts.set(passageKey, asList(segments));
  const speech = canSpeak();
  if (!speech && !cognates) return "";
  const voices = speech ? getVoiceOptions("en") : [];

  return html`<div class="reading-toolbar" data-reading-toolbar="${passageKey}">
    <div class="reading-toolbar-controls">
      ${
        speech
          ? html`<button type="button" class="btn btn-secondary reading-play-btn" data-read-passage="${passageKey}">
        <span class="play-icon" aria-hidden="true">${icon("volume")}</span>
        <span class="play-label">${L.T("Read Passage Aloud", "Leer el texto en voz alta")}</span>
      </button>
      <button type="button" class="ghost small reading-stop-btn" data-stop-audio>
        ${icon("stop")} ${L.T("Stop", "Detener")}
      </button>

      <label class="voice-picker-label">
        <span class="visually-hidden">${L.T("Choose Reading Voice", "Elige la voz de lectura")}</span>
        <select class="voice-select" data-select-voice aria-label="${L.S("Reading voice", "Voz de lectura")}">
          ${voices.map(
            (v) =>
              html`<option value="${v.id}" ${voiceURI === v.id || (!voiceURI && v.id === "default") ? raw("selected") : ""}>
                ${v.name}
              </option>`,
          )}
        </select>
      </label>

      <div class="speed" role="group" aria-label="${L.S("Reading speed", "Velocidad de lectura")}">
        <button type="button" class="speed-btn" data-rate="0.75" aria-pressed="${rate <= 0.78}">
          0.75x
        </button>
        <button type="button" class="speed-btn" data-rate="0.9" aria-pressed="${rate > 0.78 && rate <= 0.95}">
          0.9x
        </button>
        <button type="button" class="speed-btn" data-rate="1.0" aria-pressed="${rate > 0.95}">
          1.0x
        </button>
      </div>`
          : ""
      }
      ${
        cognates
          ? html`<button
        type="button"
        class="cognate-toggle-btn ${showCognates ? "is-active" : ""}"
        data-toggle-cognates
        aria-pressed="${showCognates}"
      >
        ${icon("language")} ${L.T("Spanish cognates", "Cognados en español")}
      </button>`
          : ""
      }
    </div>
    ${
      speech
        ? html`<p class="fine reading-helper-note">
      ${L.T("Tip: Click or tap any sentence in the text below (or focus it and press Enter) to hear just that sentence read aloud in your chosen voice.", "Consejo: haz clic o toca cualquier oración del texto de abajo (o enfócala y presiona Enter) para escuchar solo esa oración en la voz que elegiste.")}
    </p>`
        : ""
    }
  </div>`;
}

/**
 * Reading passage as sentence spans for voice playback and cognate exploration.
 * - `tagMode`: each sentence becomes a real <button data-nb-pick="<pickKey>|<index>"> that selects it for the
 *   Evidence Notebook (aria-pressed shows the selection); glossary words are not wrapped in this mode.
 * - `pinned`: Map(sentence index → tag id) shows a visible tag after sentences already in the notebook.
 * - `gist`: array of saved gist notes (Learn with help only) adds a "what is this paragraph mostly about?"
 *   prompt and field after each paragraph. Omit it for a clean, independent passage.
 */
export function renderPassageSentences(
  paragraphs,
  { showCognates = false, glossary = null, tagMode = false, pickKey = "", picked = -1, pinned = null, gist = null, i18n = null } = {},
) {
  const L = i18n || I;
  const paras = asList(paragraphs);
  const seen = new Set();
  let globalSentIdx = 0;

  return paras.map((para, pIdx) => {
    const sentences = splitSentences(para);
    const body = html`<p>
      ${sentences.map((sentence) => {
        const sIdx = globalSentIdx++;
        const cognates = showCognates ? findCognatesInText(sentence) : [];
        const tag = pinned?.get(sIdx);
        const mark = tag ? html`<span class="badge">${tagLabel(tag)}</span> ` : "";
        if (tagMode)
          return html`<button
          type="button"
          class="reading-sentence ${sIdx === picked ? "is-active-reading-sentence" : ""}"
          style="${INLINE_BTN}"
          data-nb-pick="${pickKey}|${sIdx}"
          aria-pressed="${String(sIdx === picked)}"
        >${sentence}</button> ${mark}`;
        return html`<span
          class="reading-sentence ${cognates.length ? "has-cognates" : ""}"
          data-say="${sentence}"
          data-sent-idx="${sIdx}"
          tabindex="0"
          role="button"
          aria-label="${L.S(`Click to hear: ${sentence}`, `Haz clic para escuchar: ${sentence}`)}"
        >${glossary ? glossInline(sentence, glossary, seen) : sentence} </span>${mark}`;
      })}
    </p>`;
    if (!gist) return body;
    const id = `gist-${pickKey || "p"}-${pIdx}`;
    return html`${body}<p class="field gist-prompt"><label for="${id}">${icon("writing")} ${L.T(`Gist of paragraph ${pIdx + 1}: what is it mostly about? (a few words)`, `Resumen del párrafo ${pIdx + 1}: ¿de qué trata principalmente? (unas pocas palabras)`)}</label>
      <input id="${id}" type="text" data-gist="${pIdx}" value="${gist[pIdx] || ""}" autocomplete="off" ${IGN} /></p>`;
  });
}

/**
 * Transcript, shown only after an answer is checked. `interactive` (Learn with help only) adds
 * per-part replay buttons and taggable signal words; otherwise it is the plain text.
 */
export function transcriptHTML(
  key,
  segments,
  { title = null, interactive = false, tags = null, target = null, canReplay = canSpeak(), i18n = null } = {},
) {
  const L = i18n || I;
  title ??= L.T("What you heard", "Lo que escuchaste");
  const lines = asList(segments);
  if (!lines.length) return "";
  if (!interactive)
    return html`<details class="transcript">
    <summary>${icon("list")} ${title}</summary>
    <div class="transcript-body">${lines.map((l) => html`<p>${l}</p>`)}</div>
  </details>`;
  const parts = listeningSegments(lines);
  const tagged = tags || new Set();
  // Stay open across re-renders once the learner is working in it (a diagnosed part or any tag).
  return html`<details class="transcript is-interactive" ${target != null || tags ? raw("open") : ""}>
    <summary>${icon("list")} ${title}</summary>
    <div class="transcript-body">
      <p class="fine">${L.T(`${canReplay ? "Press the play button beside a part to replay it. " : ""}Tap a signal word (however, first, not…) to tag it. Tags are only for this attempt.`, `${canReplay ? "Presiona el botón de reproducir junto a una parte para repetirla. " : ""}Toca una palabra señal (however, first, not…) para marcarla. Las marcas son solo para este intento.`)}</p>
      <ol class="transcript-parts">
        ${parts.map(
          (seg) => html`<li class="${seg.index === target ? "is-target" : ""}" ${seg.index === target ? raw('aria-current="true"') : ""}>
            ${canReplay ? html`<button type="button" class="speed-btn" data-replay-seg="transcript:${seg.index}" aria-label="${L.S(`Replay part ${seg.index + 1}`, `Repetir la parte ${seg.index + 1}`)}">${icon("play")} ${seg.index + 1}</button> ` : ""}${signalParts(seg.text).map((p, j) =>
              p.signal
                ? html`<button type="button" class="cat-chip signal-word" data-tag-signal="${seg.index}:${j}" aria-pressed="${String(tagged.has(`${seg.index}:${j}`))}" aria-label="${L.S(`Tag signal word ${p.text}`, `Marcar la palabra señal ${p.text}`)}">${p.text}</button>`
                : p.text,
            )}
          </li>`,
        )}
      </ol>
      ${tagged.size ? html`<p class="fine" role="status">${L.T(`Signal words tagged: ${tagged.size}`, `Palabras señal marcadas: ${tagged.size}`)}</p>` : ""}
    </div>
  </details>`;
}

/**
 * Listening Strategy Lab (Learn with help only): purpose preview, part-by-part replay after the
 * first listen, and a three-field scratchpad saved on this device for this activity.
 * Part buttons are labelled by number only, so no heard text reaches the page before an answer.
 */
export function listeningStrategyHTML(key, { purpose = null, parts = [], played = false, notes = {}, open = false, canReplay = canSpeak(), i18n = null } = {}) {
  const L = i18n || I;
  return html`<details class="helpers listen-strategy" data-listen-strategy="${key}" ${open ? raw("open") : ""}>
    <summary>${icon("listening")} ${L.T("Listening strategy lab", "Laboratorio de estrategias para escuchar")}</summary>
    <div class="helper-body">
      ${
        purpose
          ? html`<section aria-labelledby="ls-purpose-${key}">
              <h3 class="helper-title" id="ls-purpose-${key}">${L.T("Before you listen: your purpose", "Antes de escuchar: tu propósito")}</h3>
              ${purpose.kind ? html`<p><strong>${purpose.label}.</strong> ${purpose.text}</p>` : ""}
              ${purpose.focus.length ? html`<ul>${purpose.focus.map((f) => html`<li>${f}</li>`)}</ul>` : ""}
            </section>`
          : ""
      }
      ${
        canReplay && parts.length > 1
          ? html`<section aria-labelledby="ls-replay-${key}">
              <h3 class="helper-title" id="ls-replay-${key}">${L.T("Replay one part", "Repite una parte")}</h3>
              ${
                played
                  ? html`<div class="speed" role="group" aria-labelledby="ls-replay-${key}">
                      ${parts.map((seg) => html`<button type="button" class="speed-btn" data-replay-seg="bar:${seg.index}">${icon("play")} ${seg.kind === "turn" ? L.T("Turn", "Turno") : L.T("Part", "Parte")} ${seg.index + 1}</button>`)}
                    </div>`
                  : html`<p class="fine">${L.T("Listen to the whole recording once. Then you can replay one part at a time.", "Escucha toda la grabación una vez. Después podrás repetir una parte a la vez.")}</p>`
              }
            </section>`
          : ""
      }
      <section aria-labelledby="ls-notes-${key}">
        <h3 class="helper-title" id="ls-notes-${key}">${L.T("My listening notes", "Mis notas de escucha")}</h3>
        <p class="fine">${L.T("Saved only in this browser, for this activity. They are never sent anywhere or added to a progress code.", "Se guardan solo en este navegador, para esta actividad. Nunca se envían a ningún lugar ni se agregan a un código de progreso.")}</p>
        ${LISTEN_NOTE_FIELDS.map(
          ([field, label]) => html`<label class="field"><span>${L.T(label, NOTE_FIELD_ES[field])}</span><textarea rows="2" data-listen-note="${field}" ${IGN}>${notes[field] || ""}</textarea></label>`,
        )}
        <button type="button" class="ghost small" data-clear-listen-notes>${L.T("Clear my notes", "Borrar mis notas")}</button>
      </section>
    </div>
  </details>`;
}

/** Wrong-answer listening diagnosis with a targeted part replay. Shown in Learn with help only. */
export function listeningTrapHTML(diag, { held = false, hint = "", canReplay = canSpeak(), i18n = null } = {}) {
  const L = i18n || I;
  const part = diag.segment + 1;
  return html`<div class="feedback is-hint listen-trap" role="status">
    <p class="fb-title">${held ? L.T("Before you see the answer, replay one part", "Antes de ver la respuesta, repite una parte") : L.T("Not yet — check this listening trap", "Todavía no — revisa esta trampa de escucha")}</p>
    <p>${diag.message}</p>
    ${
      canReplay
        ? html`<button type="button" class="btn" data-replay-seg="trap:${diag.segment}">${icon("replay")} ${L.T(`Replay part ${part}`, `Repetir la parte ${part}`)}</button>`
        : html`<p>${L.T(`Ask your teacher to read part ${part} again.`, `Pide a tu docente que lea la parte ${part} otra vez.`)}</p>`
    }
    ${held ? html`<p class="fine">${L.T("After the replay, the answer appears here.", "Después de repetirla, la respuesta aparece aquí.")}</p>` : html`${hint ? html`<p>${hint}</p>` : ""}<button type="button" class="btn" data-retry>${L.T("Try again", "Inténtalo otra vez")}</button>`}
  </div>`;
}

/** Recorder block for Speaking. `key` scopes takes to one activity/test item. */
export function recorderHTML(
  key,
  { prompt = "", models = null, level = "A", recording = false, level01 = 0, seconds = 0, activity = {}, i18n = null } = {},
) {
  const L = i18n || I;
  const takes = takesFor(key);
  // Optional per-activity timing: a preparation countdown and a response time limit. Both off by default.
  const prep = Math.max(0, Math.floor(Number(activity.prepSeconds) || 0));
  const limit = Math.max(0, Math.floor(Number(activity.maxSeconds) || 0));
  if (!canRecord())
    return html`<div class="recorder is-unavailable">
      <p>
        <strong>${L.T("This browser cannot record.", "Este navegador no puede grabar.")}</strong>
        ${L.T("Say your answer aloud to a partner or your teacher, then use the checklist.", "Di tu respuesta en voz alta a un compañero o a tu docente y luego usa la lista de control.")}
      </p>
      ${models ? modelLadderHTML(models, level, activity, L) : ""}
    </div>`;
  return html`<section
    class="recorder ${recording ? "is-recording" : ""}"
    aria-label="${L.S("Record your answer", "Graba tu respuesta")}"
  >
    <p class="fine">${L.T("Use a quiet place and check your headphones. Microphone permission is optional: you can practice aloud with a partner instead.", "Usa un lugar tranquilo y revisa tus audífonos. El permiso del micrófono es opcional: puedes practicar en voz alta con un compañero.")}</p>
    <div class="rec-main">
      ${
        recording
          ? html`<button type="button" class="rec-btn is-stop" data-rec-stop="${key}">
                <span class="rec-dot" aria-hidden="true"></span>${L.T("Stop", "Detener")}
              </button>
              <div class="rec-live" aria-live="off">
                <span class="rec-meter" style="--lvl:${level01.toFixed(2)}"></span
                ><span class="rec-time">${L.T(`${seconds}s${limit ? ` of ${limit}s` : ""}`, `${seconds}s${limit ? ` de ${limit}s` : ""}`)}</span>
              </div>`
          : html`<button type="button" class="rec-btn" data-rec-start="${key}" data-rec-prep="${prep}" data-rec-max="${limit}">
              <span class="rec-dot" aria-hidden="true"></span
              >${takes.length ? L.T("Record again", "Grabar otra vez") : L.T("Record my answer", "Grabar mi respuesta")}
            </button>`
      }
      ${prompt ? html`<button type="button" class="ghost" data-say="${prompt}">${icon("volume")} ${L.T("Hear the question", "Escuchar la pregunta")}</button>` : ""}
    </div>
    ${
      takes.length
        ? html`<ol class="takes">
            ${takes.map((t, i) => html`<li><span>${L.T(`Try ${i + 1}`, `Intento ${i + 1}`)}${t.seconds ? ` · ${t.seconds}s` : ""}</span>${raw(waveformSVG(t.env))}<audio aria-label="${L.S(`Play recording ${i + 1}`, `Reproducir la grabación ${i + 1}`)}" controls preload="none" src="${t.url}"></audio><a class="ghost small" href="${t.url}" download="practice-recording-${i + 1}.${t.extension || "webm"}">${L.T("Download this recording", "Descargar esta grabación")}</a></li>`)}
          </ol>`
        : ""
    }
    ${takes.length > 1 ? compareTakesHTML(takes, L) : ""}
    <p class="rec-countdown" data-rec-countdown="${key}" role="status"></p>
    <p class="rec-error" data-rec-error="${key}" role="status"></p>
    <p class="fine">${L.T("Listen to your answer. Choose one detail to add, then record again if you want.", "Escucha tu respuesta. Elige un detalle para agregar y, si quieres, graba otra vez.")}</p>
    <p class="fine">${L.T("Recordings stay in this tab and disappear when you close or reload it. They are never uploaded. Download a recording before leaving if you want to keep it; a progress code does not include audio.", "Las grabaciones se quedan en esta pestaña y desaparecen cuando la cierras o la recargas. Nunca se suben. Descarga una grabación antes de salir si quieres conservarla; un código de progreso no incluye audio.")}</p>
    ${models ? modelLadderHTML(models, level, activity, L) : ""}
  </section>`;
}

// Oldest kept take against the latest. Only the three most recent takes are kept, so
// "oldest saved" is the honest label. Shows what was recorded, not a judgement of it.
function compareTakesHTML(takes, L = I) {
  const first = takes[0];
  const latest = takes[takes.length - 1];
  const cell = (label, labelEs, ariaEn, ariaEs, take, n) => html`<figure class="compare-cell">
      <figcaption>${L.T(label, labelEs)}${take.seconds ? ` · ${take.seconds}s` : ""}</figcaption>
      ${raw(waveformSVG(take.env))}
      <audio aria-label="${L.S(ariaEn, ariaEs)}" controls preload="none" src="${take.url}"></audio>
      <span class="fine">${L.T(`Try ${n}`, `Intento ${n}`)}</span>
    </figure>`;
  return html`<section class="compare" aria-label="${L.S("Compare your tries", "Compara tus intentos")}">
    <h4>${L.T("Compare your tries", "Compara tus intentos")}</h4>
    <p class="fine">${L.T("Listen to both. Notice what changed, such as a reason added or a clearer ending. Length alone does not make an answer better.", "Escucha los dos. Fíjate en lo que cambió, como una razón agregada o un final más claro. Que una respuesta sea más larga no la hace mejor.")}</p>
    <div class="compare-grid">
      ${cell("Oldest saved try", "Intento guardado más antiguo", "Play oldest saved try", "Reproducir el intento guardado más antiguo", first, 1)}
      ${cell("Latest try", "Último intento", "Play latest try", "Reproducir el último intento", latest, takes.length)}
    </div>
  </section>`;
}

export function modelLadderHTML(models, level, activity = {}, i18n = null) {
  const L = i18n || I;
  const rows = LEVEL_KEYS.filter((k) => models[k]);
  if (!rows.length) return "";
  return html`<details class="ladder">
    <summary>${icon("growth")} ${L.T("Hear answers that grow", "Escucha respuestas que crecen")}</summary>
    <p class="fine">
      ${L.T("Notice how each response communicates an idea. A short, specific answer can be strong. Borrow a useful technique, then explain your own idea. These examples are not WIDA scores.", "Fíjate en cómo cada respuesta comunica una idea. Una respuesta corta y específica puede ser sólida. Toma prestada una técnica útil y luego explica tu propia idea. Estos ejemplos no son puntajes de WIDA.")}
    </p>
    <ol>
      ${rows.map(
        (k) =>
          html`<li class="${k === level ? "is-you" : ""}">
            <span class="ladder-tier">${tierName(L, k)}</span>
            <p>${models[k]}</p>
            <p class="fine"><strong>${L.T("Notice:", "Fíjate:")}</strong> ${activity.modelNotes?.[k] || (k === "A" ? L.T("Find the main idea. Which words make it clear?", "Encuentra la idea principal. ¿Qué palabras la aclaran?") : k === "B" ? L.T("Find a specific detail. How does it help answer the question?", "Encuentra un detalle específico. ¿Cómo ayuda a responder la pregunta?") : L.T("Find a connection between ideas. Is every detail useful?", "Encuentra una conexión entre ideas. ¿Es útil cada detalle?"))}</p>
            <button type="button" class="ghost small" data-say="${models[k]}">${icon("volume")} ${L.T("Listen", "Escuchar")}</button>
          </li>`,
      )}
    </ol>
  </details>`;
}

export function selfCheckHTML(checks, saved = {}, { title = null, i18n = null } = {}) {
  const L = i18n || I;
  return html`<fieldset class="selfcheck">
    <legend>${title ?? L.T("Check your answer", "Revisa tu respuesta")}</legend>
    ${checks.map(
      (c) =>
        html`<label
          ><input
            type="checkbox"
            data-selfcheck="${c.id}"
            ${saved[c.id] ? raw("checked") : ""}
            ${IGN}
          /><span>${L.spanish && c.es ? L.T(c.label, c.es) : html`${c.label}${c.es ? html`<em lang="es">${c.es}</em>` : ""}`}</span></label
        >`,
    )}
  </fieldset>`;
}
export const speakingChecksHTML = (saved, { i18n = null } = {}) => {
  const L = i18n || I;
  return selfCheckHTML(SPEAKING_CHECKS, saved, { title: L.T("Speaking checklist", "Lista de control para hablar"), i18n: L });
};

export function vocabHTML(activity, shared, { focused = true, i18n = null } = {}) {
  const L = i18n || I;
  const terms = activity.vocabulary || [];
  const frames = focused || activity.type === "constructed" ? activity.frames || [] : [];
  const focus = focused ? activity.listenFor || activity.readFor || activity.sayFor || activity.writeFor || [] : [];
  if (!terms.length && !frames.length && !focus.length) return "";
  return html`<details class="helpers" ${focused ? raw("open") : ""}>
    <summary>${icon("bulb")} ${L.T("Helpful words and starters", "Palabras útiles y comienzos")}</summary>
    <div class="helper-body">
      ${
        focus.length
          ? html`<section>
              <h2 class="helper-title">${L.T("What to listen or look for", "Qué escuchar o buscar")}</h2>
              <ul>
                ${focus.map((f) => html`<li>${f}</li>`)}
              </ul>
            </section>`
          : ""
      }
      ${
        terms.length
          ? html`<section>
              <h2 class="helper-title">${L.T("Academic words", "Palabras académicas")}</h2>
              <dl class="vocab">
                ${terms.map(([en, def, spanish]) => {
                  return html`<div>
                    <dt>
                      <button
                        type="button"
                        class="say-word"
                        data-say="${en}"
                        aria-label="${L.S(`Say ${en}`, `Escuchar ${en}`)}"
                      >
                        ${icon("volume")}</button
                      >${en}
                    </dt>
                    <dd>
                      ${def}${spanish ? html`<span class="es" lang="es"><button type="button" class="say-word" data-say-es="${spanish.split(":")[0]}" aria-label="Escuchar">${icon("volume")}</button>${spanish}</span>` : ""}
                    </dd>
                  </div>`;
                })}
              </dl>
            </section>`
          : ""
      }
      ${
        frames.length
          ? html`<section>
              <h2 class="helper-title">${L.T("Sentence starters", "Comienzos de oración")}</h2>
              <ul class="frames">
                ${frames.map((f) => html`<li>${f}</li>`)}
              </ul>
            </section>`
          : ""
      }
      ${shared?.essentialTerms?.length ? html`<p class="fine">${shared.essentialTerms.map(([en, es]) => `${en} = ${es}`).join(" · ")}</p>` : ""}
    </div>
  </details>`;
}

export function tierPickerHTML(domain, level, hrefFor, { i18n = null } = {}) {
  const L = i18n || I;
  return html`<nav class="tier-picker" aria-label="${L.S("Choose your practice support", "Elige tu apoyo de práctica")}">
    ${LEVEL_KEYS.map(
      (k) =>
        html`<a
          class="tier ${k === level ? "is-current" : ""}"
          href="${hrefFor(k)}"
          ${k === level ? raw('aria-current="page"') : ""}
        >
          <strong>${tierName(L, k)}</strong><span>${L.T(TIERS[k].range, TIER_RANGE_ES[k])}</span>
        </a>`,
    )}
  </nav><p class="fine">${L.T("Support choice changes the task set: Starting uses words and short sentences; Growing connects ideas; Expanding develops details and explanations. Each set still offers optional help. These are not WIDA scores or placement levels.", "La opción de apoyo cambia el conjunto de tareas: Comenzando usa palabras y oraciones cortas; Creciendo conecta ideas; Ampliando desarrolla detalles y explicaciones. Cada conjunto sigue ofreciendo ayuda opcional. Estos no son puntajes ni niveles de ubicación de WIDA.")}</p>`;
}

export function bandSwitchHTML(band, bands, { i18n = null } = {}) {
  const L = i18n || I;
  if (bands.length < 2) return "";
  return html`<div class="band-switch" role="group" aria-label="${L.S("Grade band", "Grupo de grados")}">
    ${bands.map((b) => html`<button type="button" class="band-btn" data-set-band="${b}" aria-pressed="${b === band}">${L.T(bandLabel(b), `Grados ${b.replace("-", "–")}`)}</button>`)}
  </div>`;
}

export function ringHTML(done, total, { size = 56, color = "currentColor", label = "", i18n = null } = {}) {
  const L = i18n || I;
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const pct = total ? Math.min(1, done / total) : 0;
  return raw(
    `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${label || L.S(`${done} of ${total} done`, `${done} de ${total} hechas`)}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-bg"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fg" stroke="${color}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" transform="rotate(-90 ${size / 2} ${size / 2})"/><text x="50%" y="54%" text-anchor="middle" class="ring-text">${Math.round(pct * 100)}%</text></svg>`,
  );
}

export const domainGlyph = (d) => icon(DOMAIN_META[d]?.icon || "star");
export const crumbsHTML = (items, { i18n = null } = {}) =>
  html`<nav class="crumbs" aria-label="${(i18n || I).S("Breadcrumb", "Ruta de navegación")}">
    <ol>
      ${items.map(([label, href]) => html`<li>${href ? html`<a href="${href}">${label}</a>` : html`<span aria-current="page">${label}</span>`}</li>`)}
    </ol>
  </nav>`;
export { BASE };
