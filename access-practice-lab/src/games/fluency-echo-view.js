// Fluency Echo screens: the track header, the four rehearsal steps (listen, scoop, echo, check) and the
// support layer (English summary, Spanish gloss, key words) that follows the support mode.
import { recorderHTML } from "../components.js";
import { isRecording, takesFor } from "../recorder.js";
import { feedbackHTML, glossHTML, hintHTML, html, icon, pips, settled } from "./engine.js";
import { parsePassage, phraseText, scoreMarks } from "./fluency-echo-text.js";

export const STEPS = ["listen", "scoop", "echo", "check"];
const STEP_NAMES = {
  listen: ["Listen", "Escuchar"],
  scoop: ["Scoop", "Marcar"],
  echo: ["Echo", "Eco"],
  check: ["Check", "Revisar"],
};
export const SELF = [
  {
    id: "smooth",
    q: [
      "Smooth: I kept going without stopping to start over.",
      "Fluida: seguí leyendo sin parar para empezar de nuevo.",
    ],
    tip: [
      "Next time, read each phrase in your head first, then say it.",
      "La próxima vez, lee cada frase en tu mente primero y luego dila.",
    ],
  },
  {
    id: "phrased",
    q: [
      "Phrased: I paused at the slashes, not in the middle of a word group.",
      "Con fraseo: hice pausas en las barras, no en medio de un grupo de palabras.",
    ],
    tip: [
      "Next time, echo one phrase at a time with the model before you read it all.",
      "La próxima vez, repite una frase a la vez con el modelo antes de leerlo todo.",
    ],
  },
  {
    id: "expression",
    q: [
      "Expression: my voice matched how the text should sound.",
      "Expresión: mi voz sonó como debe sonar el texto.",
    ],
    tip: [
      "Next time, say the mood word to yourself before you start reading.",
      "La próxima vez, di la palabra del ánimo para ti antes de empezar a leer.",
    ],
  },
];

export const recKey = (s, row) => `game:fluency-echo:${s.sid}:${row.id}`;

function stepTrack(row, I) {
  const now = STEPS.indexOf(row.step);
  return html`<ol class="fe-steps" aria-label="${I.S("Rehearsal steps", "Pasos del ensayo")}">
    ${STEPS.map((k, n) => {
      const [en, es] = STEP_NAMES[k];
      const state = n < now ? "is-done" : n === now ? "is-now" : "";
      return html`<li class="${state}" ${n === now ? 'aria-current="step"' : ""}>
        <span class="fe-step-n" aria-hidden="true">${n < now ? "✓" : n + 1}</span
        >${I.T(en, es)}${n < now ? html`<span class="visually-hidden">${I.S(" (done)", " (hecho)")}</span>` : ""}
      </li>`;
    })}
  </ol>`;
}

function supportHTML(row, env) {
  const I = env.I;
  if (!env.sup.visuals) return "";
  return html`<details class="fe-help" ${env.sup.gloss === "show" ? "open" : ""}>
    <summary>
      ${icon("language")}${I.T("What it's about and key words", "De qué se trata y palabras clave")}
    </summary>
    <p class="fe-sum">${row.summary.en}</p>
    ${glossHTML(row.summary.es, env)}
    <ul class="fe-words">
      ${row.words.map((w) => html`<li><strong lang="en">${w.en}</strong>${glossHTML(w.es, env)}</li>`)}
    </ul>
  </details>`;
}

const playButtons = (I, { replay = false } = {}) =>
  html`<div class="fe-controls">
    <button type="button" class="btn btn-primary" data-fe-play="model">
      ${icon("play")}${replay ? I.T("Play the model again", "Escuchar el modelo otra vez") : I.T("Play the model", "Escuchar el modelo")}
    </button>
    <button type="button" class="btn" data-fe-play="slow">
      ${icon("listening")}${I.T("Slower", "Más despacio")}
    </button>
  </div>`;

const passageHTML = (row, { slashes = false } = {}) =>
  html`<p class="fe-passage${slashes ? " has-slashes" : ""}" lang="en">
    ${row.phrases.map((p, k) => html`<span class="fe-ph" data-fe-ph="${k}">${phraseText(p)}</span>${slashes && k < row.phrases.length - 1 ? html`<span class="fe-cut" aria-hidden="true"> / </span>` : " "}`)}
  </p>`;

function listenHTML(row, env) {
  const I = env.I;
  return html`<p class="cg-instruction">
      ${I.T("Listen to the model reader. Each group of words lights up as it is read. Notice where the reader pauses.", "Escucha al lector modelo. Cada grupo de palabras se ilumina mientras se lee. Fíjate dónde hace pausas.")}
    </p>
    ${playButtons(I)} ${passageHTML(row)}
    <p class="fe-mood">
      ${icon("sparkle")}<span
        ><strong>${I.T("How it should sound:", "Cómo debe sonar:")}</strong>
        ${I.T(row.mood.en, row.mood.es)}</span
      >
    </p>
    <div class="gs-actions">
      <button type="button" class="btn btn-primary btn-big" data-fe-ready>
        ${icon("arrow-right")}${I.T("I'm ready to mark the pauses", "Estoy listo para marcar las pausas")}
      </button>
    </div>`;
}

function wordHTML(x, i, row, I) {
  if (x.end) return html`<span class="fe-w is-end">${x.w}</span>`;
  const marked = row.marks.includes(i);
  const done = settled(row.rs);
  let mark = "";
  let sr = "";
  if (done && x.brk && marked)
    [mark, sr] = [" is-hit", I.S("pause, matches the model", "pausa, coincide con el modelo")];
  else if (done && x.brk)
    [mark, sr] = [" is-missed", I.S("the model pauses here", "el modelo hace una pausa aquí")];
  else if (done && marked && x.opt)
    [mark, sr] = [" is-hit", I.S("pause, this also works", "pausa, también funciona")];
  else if (done && marked)
    [mark, sr] = [
      " is-extra",
      I.S("extra pause that splits a word group", "pausa de más que divide un grupo de palabras"),
    ];
  return html`<button
    type="button"
    class="fe-w${mark}"
    data-fe-word="${i}"
    aria-pressed="${marked}"
    ${done ? "disabled" : ""}
  >
    ${x.w}<span class="fe-slash" aria-hidden="true">/</span
    >${sr ? html`<span class="visually-hidden">, ${sr}</span>` : ""}
  </button>`;
}

function scoopHTML(row, env) {
  const I = env.I;
  const words = parsePassage(row.phrases);
  const sc = scoreMarks(words, row.marks);
  const done = settled(row.rs);
  const hints = [
    I.T(row.hint.en, row.hint.es),
    I.T(
      `There are ${sc.need} pauses inside the sentences. Sentence ends already have a stop.`,
      `Hay ${sc.need} pausas dentro de las oraciones. Los finales de oración ya tienen una parada.`,
    ),
    I.T(
      "Play the model again and watch where the highlight jumps to a new group of words.",
      "Escucha el modelo otra vez y mira dónde salta el resaltado a un nuevo grupo de palabras.",
    ),
  ];
  return html`<p class="cg-instruction" id="fe-scoop-help">
      ${I.T("Scoop the phrases: tap a word to put a slash after it where the reader pauses. Tap it again to take the slash away.", "Marca las frases: toca una palabra para poner una barra después de ella donde el lector hace una pausa. Tócala otra vez para quitar la barra.")}
    </p>
    ${env.sup.frames === "full" && !done ? html`<p class="fe-target">${I.T(`Find ${sc.need} pauses inside the sentences.`, `Encuentra ${sc.need} pausas dentro de las oraciones.`)}</p>` : ""}
    ${done ? "" : playButtons(I, { replay: true })}
    <div class="fe-scoop" role="group" aria-labelledby="fe-scoop-help" lang="en">
      ${words.map((x, i) => wordHTML(x, i, row, I))}
    </div>
    <p class="fe-count" aria-hidden="true">
      ${I.T(`Slashes placed: ${row.marks.length}`, `Barras puestas: ${row.marks.length}`)}
    </p>
    ${done ? "" : html`<div class="gs-actions"><button type="button" class="btn btn-primary btn-big" data-fe-check ${row.marks.length ? "" : "disabled"}>${icon("check")}${I.T("Check my slashes", "Revisar mis barras")}</button></div>`}
    ${hintHTML(row.rs, hints, env, { disabled: done })}
    ${feedbackHTML(row.rs, {
      I,
      right: I.T(
        "Your slashes match the model reader's pauses.",
        "Tus barras coinciden con las pausas del lector modelo.",
      ),
      retry: I.T(
        `You found ${sc.hit} of ${sc.need} pauses.${sc.extra ? ` ${sc.extra} of your slashes split a word group.` : ""} Listen again and revise.`,
        `Encontraste ${sc.hit} de ${sc.need} pausas.${sc.extra ? ` ${sc.extra} de tus barras dividen un grupo de palabras.` : ""} Escucha otra vez y revisa.`,
      ),
      answer: I.T(
        "The model's pauses are marked now. A dashed slash is one you did not place.",
        "Ahora están marcadas las pausas del modelo. Una barra punteada es una que no pusiste.",
      ),
      explain: I.T(row.explain.en, row.explain.es),
    })}
    ${done ? html`<div class="gs-actions"><button type="button" class="btn btn-primary btn-big" data-fe-to-echo>${icon("arrow-right")}${I.T("Next: echo it", "Siguiente: hacer eco")}</button></div>` : ""}`;
}

function echoHTML(s, row, env) {
  const I = env.I;
  const key = recKey(s, row);
  const recording = isRecording(key);
  const takes = takesFor(key);
  return html`<p class="cg-instruction">
      ${I.T("Echo one phrase at a time: play it, then say it the same way out loud.", "Haz eco de una frase a la vez: escúchala y luego dila en voz alta de la misma manera.")}
    </p>
    <ol class="fe-echo">
      ${row.phrases.map((p, k) => {
        const t = phraseText(p);
        return html`<li>
          <button
            type="button"
            class="fe-echo-btn"
            data-say="${t}"
            aria-label="${I.S(`Hear phrase ${k + 1}`, `Escuchar la frase ${k + 1}`)}: ${t}"
          >
            ${icon("play")}</button
          ><span lang="en">${t}</span>
        </li>`;
      })}
    </ol>
    <h3 class="fe-sub">
      ${I.T("Now read the whole passage with your pauses", "Ahora lee todo el texto con tus pausas")}
    </h3>
    ${passageHTML(row, { slashes: true })}
    <p class="fe-mood">
      ${icon("sparkle")}<span
        ><strong>${I.T("How it should sound:", "Cómo debe sonar:")}</strong>
        ${I.T(row.mood.en, row.mood.es)}</span
      >
    </p>
    ${recorderHTML(key, { recording, i18n: I })}
    ${
      recording
        ? ""
        : html`<div class="gs-actions">
              ${takes.length ? html`<button type="button" class="btn btn-primary btn-big" data-fe-to-check>${icon("arrow-right")}${I.T("Check my reading", "Revisar mi lectura")}</button>` : ""}
              ${takes.length ? "" : html`<button type="button" class="btn" data-fe-norec>${icon("speaking")}${I.T("I can't record right now", "No puedo grabar ahora")}</button>`}
            </div>
            ${takes.length ? "" : html`<p class="fine">${I.T("No microphone? Read the passage aloud to yourself or a partner, then check your reading.", "¿No tienes micrófono? Lee el texto en voz alta para ti o para un compañero y luego revisa tu lectura.")}</p>`}`
    }`;
}

function checkHTML(s, row, env, last) {
  const I = env.I;
  const take = takesFor(recKey(s, row)).at(-1);
  const all = SELF.every((q) => row.self[q.id] !== undefined);
  return html`<p class="cg-instruction">
      ${I.T("Compare, then check yourself. This is your own judgment: nothing here is scored.", "Compara y luego revísate. Es tu propia opinión: aquí nada recibe puntos.")}
    </p>
    <div class="fe-controls">
      <button type="button" class="btn" data-fe-hear="model">
        ${icon("play")}${I.T("Hear the model", "Escuchar el modelo")}
      </button>
      ${
        take
          ? html`<button type="button" class="btn" data-fe-hear="mine">
                ${icon("record")}${I.T("Hear my reading", "Escuchar mi lectura")}
              </button>
              <button type="button" class="btn btn-primary" data-fe-hear="both">
                ${icon("replay")}${I.T("Model, then mine", "Modelo y luego yo")}
              </button>`
          : ""
      }
    </div>
    ${take ? "" : html`<p class="fine">${I.T("No recording this time. Read the passage aloud once more, then check yourself.", "Esta vez no hay grabación. Lee el texto en voz alta una vez más y luego revísate.")}</p>`}
    ${passageHTML(row, { slashes: true })}
    <div class="fe-self">
      ${SELF.map((q) => {
        const v = row.self[q.id];
        return html`<fieldset class="fe-q">
          <legend>${I.T(q.q[0], q.q[1])}</legend>
          <div class="fe-q-row">
            <button
              type="button"
              class="fe-yn"
              data-fe-self="${q.id}:yes"
              aria-pressed="${v === true}"
            >
              ${icon("check")}${I.T("Yes", "Sí")}
            </button>
            <button
              type="button"
              class="fe-yn"
              data-fe-self="${q.id}:no"
              aria-pressed="${v === false}"
            >
              ${icon("growth")}${I.T("Not yet", "Todavía no")}
            </button>
          </div>
          ${v === false ? html`<p class="gs-hint">${icon("sparkle")}${I.T(q.tip[0], q.tip[1])}</p>` : ""}
        </fieldset>`;
      })}
    </div>
    <div class="gs-actions">
      <button type="button" class="btn btn-primary btn-big" data-fe-finish ${all ? "" : "disabled"}>
        ${icon("star")}${last ? I.T("Finish the last track", "Terminar la última pista") : I.T("Finish this track", "Terminar esta pista")}
      </button>
    </div>
    ${all ? "" : html`<p class="fine">${I.T("Answer all three to finish.", "Responde las tres para terminar.")}</p>`}`;
}

export function stageHTML(s, env) {
  const I = env.I;
  const row = s.rows[s.i];
  if (!row)
    return html`<p role="status">
      ${I.T("Every track is recorded and checked.", "Todas las pistas están grabadas y revisadas.")}
    </p>`;
  const doneCount = s.rows.filter((r) => r.step === "done").length;
  const body = {
    listen: () => listenHTML(row, env),
    scoop: () => scoopHTML(row, env),
    echo: () => echoHTML(s, row, env),
    check: () => checkHTML(s, row, env, s.i === s.rows.length - 1),
  }[row.step]();
  return html`<section class="fe-studio" data-mechanic="echo-record">
    ${s.cheer ? html`<p class="fe-cheer"><span class="fe-cheer-star" aria-hidden="true">⭐</span>${I.T(`Track complete: ${s.cheer.en}`, `Pista completa: ${s.cheer.es}`)}</p>` : ""}
    <header class="fe-head">
      <span class="fe-emoji" aria-hidden="true">${row.emoji}</span>
      <div>
        <p class="fe-track">
          ${I.T(`Track ${s.i + 1} of ${s.rows.length}`, `Pista ${s.i + 1} de ${s.rows.length}`)}
        </p>
        <h2 class="fe-title" tabindex="-1">${I.T(row.title.en, row.title.es)}</h2>
      </div>
    </header>
    ${pips(doneCount, s.rows.length, I.S(`${doneCount} of ${s.rows.length} tracks finished`, `${doneCount} de ${s.rows.length} pistas terminadas`), I.S)}
    ${stepTrack(row, I)} ${supportHTML(row, env)}
    <div class="fe-body">${body}</div>
  </section>`;
}
