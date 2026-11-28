// Shared pieces for the three interactive Language Labs (Verb Time Machine, Connector Bridge, Paragraph X-Ray):
// the sticky step navigator, keyboard-shortcut panel, read-aloud button, feedback card, think-aloud steps,
// the "new task" writing panel and the small discovery card. Markup only: state lives in views/language-labs.js.
// i18n rule (LAB-V2.md): I.T translates chrome and directions; the English being practiced always stays English.
import * as C from "../content/language-labs.js";
import { BASE, esc, html, icon, raw, wordCount } from "../util.js";
import { DISCOVERY } from "./discoveries.js";

export const STEPS = [
  ["See it", "Míralo"],
  ["Explore", "Explora"],
  ["Example", "Ejemplo"],
  ["Practice", "Practica"],
  ["New task", "Tarea nueva"],
];
export const bandOf = (b) => (b === "3-5" ? "3-5" : "6-8");
export const labHref = (lab, step, band) =>
  `${BASE}/language-labs/${lab}?step=${step}&grades=${band}`;

export const usePill = (I, useKey) => {
  const u = C.KEY_USES[useKey];
  return u ? html`<span class="ll-use is-${u.tone}">${I.T(u.en, u.es)}</span>` : "";
};
export const dimPill = (I, dimKey) => {
  const d = C.DIMENSIONS[dimKey];
  return d ? html`<span class="ll-dim">${I.T(d.en, d.es)}</span>` : "";
};

/** Read-aloud button. The text to read rides in data-ll-speak; the label is plain text so it is safe inside any card. */
export const speakBtn = (I, text, labelEn = "Listen", labelEs = "Escuchar", cls = "") =>
  html`<button
    type="button"
    class="btn small ghost ll-speak-btn ${cls}"
    data-ll-speak="${text}"
    aria-label="${I.S(labelEn, labelEs)}"
  >
    ${icon("volume")} <span>${I.T(labelEn, labelEs)}</span>
  </button>`;

/** Wrap each phrase found in already-escaped HTML with <mark class=cls> (first match only, whole words). */
export function markHTML(escaped, phrases, cls = "ll-conn") {
  let out = escaped;
  for (const p of phrases) {
    const src = esc(p).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+");
    out = out.replace(new RegExp(`(^|[^\\w>])(${src})(?![\\w<])`, "i"), `$1<mark class="${cls}">$2</mark>`);
  }
  return out;
}
/** Wrap each phrase found in `text` with <mark class=cls>. Escapes everything else. */
export const markPhrases = (text, phrases, cls = "ll-conn") => raw(markHTML(esc(text), phrases, cls));

export const panelHead = (I, eyebrow, title, right = "", id = "") =>
  html`<div class="ll-panel-top">
    <div>
      <p class="eyebrow">${I.T(...eyebrow)}</p>
      <h2 ${id ? raw(`id="${id}"`) : ""}>${I.T(...title)}</h2>
    </div>
    ${right}
  </div>`;

// ── step navigator ───────────────────────────────────────────────────────────
const keyRow = (keys, label) =>
  html`<div class="ll-key-row">
    <dt>${keys.map((k) => html`<kbd>${k}</kbd>`)}</dt>
    <dd>${label}</dd>
  </div>`;

/** Shortcuts every lab step shares, then the ones the step adds (labKeys: [[keys[], en, es], ...]). */
export function keysPanelHTML(I, labKeys = []) {
  const base = [
    [["["], "Previous step", "Paso anterior"],
    [["]"], "Next step", "Paso siguiente"],
    [["L"], "Listen to the main sentence", "Escuchar la oración principal"],
    [["K"], "Show or hide this list", "Mostrar u ocultar esta lista"],
  ];
  return html`<div
    class="ll-keys"
    id="llKeys"
    role="region"
    aria-label="${I.S("Keyboard shortcuts", "Atajos de teclado")}"
  >
    <h2 class="ll-keys-h">
      ${I.T("Keyboard shortcuts for this step", "Atajos de teclado para este paso")}
    </h2>
    <dl class="ll-keys-list">
      ${[...labKeys, ...base].map(([k, en, es]) => keyRow(k, I.T(en, es)))}
    </dl>
    <p class="fine">
      ${I.T("Shortcuts pause while you are typing.", "Los atajos se pausan mientras escribes.")}
    </p>
  </div>`;
}

// The program text for step 2 names all three labs ("shift across seven timeline stops, audition transitions, or X-ray
// a mentor argument"). Inside one lab, say what THIS lab's Explore step does.
const EXPLORE_DO = {
  "verb-time-machine": ["Drag the action along the timeline and watch the verb change.", "Arrastra la acción por la línea del tiempo y mira cómo cambia el verbo."],
  "connector-bridge": ["Build bridges between two ideas and see how each connector changes the meaning.", "Construye puentes entre dos ideas y mira cómo cada conector cambia el significado."],
  "paragraph-xray": ["Peel the paragraph into layers and inspect what each sentence does.", "Separa el párrafo en capas e inspecciona qué hace cada oración."],
};

/** Sticky navigator: five step links, a progress count and the Keys button. Step links stay real links. */
export function stepperHTML(I, lab, step, ls, band, { keysOpen = false, labKeys = [] } = {}) {
  const p = C.programForLab(band);
  const stage = p.stages[step - 1] || p.stages[0];
  const seen = ls.seen.length;
  return html`<nav class="ll-steps" aria-label="${I.S("Lab steps", "Pasos del laboratorio")}">
      <ol>
        ${STEPS.map(
          ([en, es], i) =>
            html`<li>
              <a
                href="${labHref(lab, i + 1, band)}"
                ${i + 1 === step ? raw('aria-current="step"') : ""}
                class="${ls.seen.includes(i + 1) ? "is-seen" : ""}"
                ><span class="ll-step-n"
                  >${ls.seen.includes(i + 1) && i + 1 !== step ? icon("check") : i + 1}</span
                ><span class="ll-step-t">${I.T(en, es)}</span
                >${ls.found?.[i + 1] ? html`<span class="ll-step-star" title="${I.S("Discovery found", "Descubrimiento hecho")}">${icon("sparkle")}</span>` : ""}</a
              >
            </li>`,
        )}
      </ol>
      <div class="ll-steps-side">
        <span
          class="ll-progress"
          role="img"
          aria-label="${I.S(`${seen} of 5 steps visited`, `${seen} de 5 pasos visitados`)}"
          ><span class="ll-progress-bar" style="--p:${seen / 5}"></span
        ></span>
        <button
          type="button"
          class="btn small ghost ll-keys-btn"
          data-ll-keys-toggle
          aria-expanded="${keysOpen}"
          ${keysOpen ? raw('aria-controls="llKeys"') : ""}
        >
          <span aria-hidden="true">⌨</span><span class="ll-keys-t"> ${I.T("Keys", "Teclas")}</span>
        </button>
      </div>
    </nav>
    ${keysOpen ? keysPanelHTML(I, labKeys) : ""}
    <p class="ll-step-goal">
      <strong
        >${I.T(`Step ${step} of 5 · ${STEPS[step - 1][0]}:`, `Paso ${step} de 5 · ${STEPS[step - 1][1]}:`)}</strong
      >
      ${I.T(...(step === 2 && EXPLORE_DO[lab] ? EXPLORE_DO[lab] : stage.do))}
    </p>`;
}

export const resumeNote = (I, lab, ls, band) =>
  ls.resume > 1 && !ls.transfer?.ok
    ? html`<p class="ll-resume">
        ${icon("flag")}
        ${I.T(`Welcome back. You stopped at Step ${ls.resume}.`, `Qué bueno verte. Te quedaste en el Paso ${ls.resume}.`)}
        <a class="btn small" href="${labHref(lab, ls.resume, band)}"
          >${I.T(`Go to Step ${ls.resume}`, `Ir al Paso ${ls.resume}`)} ${icon("arrow-right")}</a
        >
      </p>`
    : "";

export const nextLink = (I, lab, step, band) =>
  step < 5
    ? html`<div class="ll-next-bar">
        <p class="ll-next-meta">
          ${I.T(`Ready for Step ${step + 1}? Move to ${STEPS[step][0]}.`, `¿Listo para el Paso ${step + 1}? Pasa a ${STEPS[step][1]}.`)}
        </p>
        <p class="ll-next">
          <a class="btn btn-primary" href="${labHref(lab, step + 1, band)}"
            >${I.T(`Next: ${STEPS[step][0]}`, `Siguiente: ${STEPS[step][1]}`)}
            ${icon("arrow-right")}</a
          >
        </p>
      </div>`
    : "";

// ── discovery card ───────────────────────────────────────────────────────────
/** A small reveal per step. Step 2 unlocks after `need` things were tried; the rest open any time. */
export function discoveryHTML(I, lab, step, ls, tried = 0) {
  const d = DISCOVERY[lab]?.[step];
  if (!d) return "";
  const found = Boolean(ls.found?.[step]);
  const locked = !found && d.need && tried < d.need;
  return html`<aside
    class="ll-discovery ${found ? "is-found" : ""}"
    aria-label="${I.S("Discovery", "Descubrimiento")}"
  >
    <span class="ll-disc-ico" aria-hidden="true">${icon("sparkle")}</span>
    <div class="ll-disc-body">
      <p class="ll-disc-q">
        <strong>${I.T("Discovery:", "Descubrimiento:")}</strong> ${I.T(...d.q)}
      </p>
      ${found ? html`<p class="ll-disc-a" role="status">${I.T(...d.a)}</p>` : ""}
      ${
        locked
          ? html`<p class="fine">
              ${I.T(`Try ${d.need - tried} more to unlock this.`, `Prueba ${d.need - tried} más para desbloquearlo.`)}
            </p>`
          : found
            ? ""
            : html`<button type="button" class="btn small" data-ll-discover="${step}">
                ${I.T("Show what I might notice", "Mostrar lo que podrías notar")}
              </button>`
      }
    </div>
  </aside>`;
}

// ── feedback, comparison, think-aloud, transfer ─────────────────────────────
export const feedbackHTML = (I, r) =>
  r
    ? html`<div
        class="feedback ${r.ok ? "is-right" : r.reveal ? "is-shown" : "is-hint"}"
        role="status"
      >
        <p class="fb-title">${icon(r.ok ? "check" : "bulb")} ${I.T(r.message.en, r.message.es)}</p>
      </div>`
    : "";

export function compareCardHTML(I, cmp, marks = []) {
  if (!cmp) return "";
  return html`<div class="ll-compare-grid">
    <div class="ll-compare-card is-before">
      <span class="ll-compare-tag"
        >${I.T("Everyday draft (before)", "Borrador cotidiano (antes)")}</span
      >
      <p class="ll-compare-text" lang="en">${cmp.before}</p>
    </div>
    <div class="ll-compare-card is-after">
      <div class="ll-compare-head">
        <span class="ll-compare-tag"
          >${I.T("Author's move (after)", "Jugada del autor (después)")}</span
        >
        ${speakBtn(I, cmp.after)}
      </div>
      <p class="ll-compare-text" lang="en">
        ${marks.length ? markPhrases(cmp.after, marks, "ll-conn") : cmp.after}
      </p>
      <p class="fine">${I.T(...cmp.why)}</p>
    </div>
  </div>`;
}

export function mentorHTML(I, mentor, passageHTML) {
  return html`<div class="ll-mentor-spotlight">
    <div class="ll-mentor-head">
      <span class="ll-mentor-source">${icon("reading")} ${I.T(...mentor.source)}</span>
      ${speakBtn(I, mentor.passage, "Listen to passage", "Escuchar pasaje")}
    </div>
    <blockquote class="ll-mentor-quote" lang="en">${passageHTML || mentor.passage}</blockquote>
    <p class="fine">${I.T(...mentor.takeaway)}</p>
  </div>`;
}

/** Think-aloud steps revealed one at a time. `art(shown)` draws a picture that follows the steps. */
export function guidedHTML(I, ls, steps, sentence, rule, art) {
  const shown = Math.min(steps.length, Math.max(1, ls.guided || 1));
  const doneAll = shown >= steps.length;
  return html`<section class="panel ll-guided" aria-labelledby="llGuidedH">
    ${panelHead(
      I,
      [
        `Writer's Think-Aloud · Step ${shown} of ${steps.length}`,
        `Pensamiento en voz alta · Paso ${shown} de ${steps.length}`,
      ],
      ["Watch it done, one step at a time", "Míralo paso a paso"],
      sentence
        ? speakBtn(I, sentence.replace(/___/g, "blank"), "Listen to example", "Escuchar ejemplo")
        : "",
      "llGuidedH",
    )}
    ${sentence ? html`<p class="ll-sentence" lang="en">${sentence}</p>` : ""}
    ${art ? art(shown) : ""}
    <ol class="ll-guided-steps">
      ${steps.slice(0, shown).map(([en, es], i) => html`<li class="${i === steps.length - 1 ? "is-final" : ""} ${i === shown - 1 ? "is-new" : ""}">${I.T(en, es)}</li>`)}
    </ol>
    <div class="row-actions">
      ${shown < steps.length ? html`<button type="button" class="btn btn-primary" data-ll-guided>${I.T("Show the next step", "Mostrar el siguiente paso")} ${icon("arrow-right")}</button>` : ""}
      ${shown > 1 ? html`<button type="button" class="btn ghost small" data-ll-guided-reset>${icon("replay")} ${I.T("Replay steps", "Repetir pasos")}</button>` : ""}
    </div>
    ${
      doneAll && rule
        ? html`<div class="ll-rule-callout">
            <p>${icon("bulb")} <strong>${I.T(...rule)}</strong></p>
          </div>`
        : ""
    }
  </section>`;
}

export function transferHTML(I, ls, prompt, result, extra = "", { lab, band } = {}) {
  const words = wordCount(ls.transfer.text || "");
  const topics = prompt.topics || [];
  const wordBank = prompt.wordBank || [];
  const chosenTopic = ls.transfer.topic || 0;
  return html`<section class="panel ll-transfer" aria-labelledby="llTrH">
    ${panelHead(
      I,
      ["Your own words, on a new task", "Tus propias palabras, en una tarea nueva"],
      ["New task", "Tarea nueva"],
      speakBtn(I, prompt.en, "Listen to prompt", "Escuchar consigna"),
      "llTrH",
    )}
    <p class="ll-transfer-prompt">${I.T(prompt.en, prompt.es)}</p>
    ${
      topics.length
        ? html`<div
            class="ll-topic-strip"
            role="group"
            aria-label="${I.S("Topic ideas", "Ideas de tema")}"
          >
            <span class="ll-strip-label">${I.T("Pick an angle:", "Elige un enfoque:")}</span>
            ${topics.map((tp, idx) => html`<button type="button" class="chip ${chosenTopic === idx ? "is-on" : ""}" data-ll-topic="${idx}" aria-pressed="${chosenTopic === idx}">${I.T(...tp)}</button>`)}
          </div>`
        : ""
    }
    ${
      wordBank.length
        ? html`<div
            class="ll-wordbank"
            role="group"
            aria-label="${I.S("Word bank", "Banco de palabras")}"
          >
            <span class="ll-strip-label"
              >${I.T("Tap to insert a starter word:", "Toca para insertar una palabra:")}</span
            >
            ${wordBank.map((w) => html`<button type="button" class="chip ll-insert-chip" data-ll-insert="${w}" lang="en">+ ${w}</button>`)}
          </div>`
        : ""
    }
    ${extra}
    <label class="field"
      ><span class="ll-field-bar"
        ><span>${I.T("My writing", "Mi escritura")}</span>
        <span class="fine"><b data-ll-wc>${words}</b> ${I.T("words", "palabras")}</span></span
      ><textarea
        rows="6"
        data-ll-transfer
        data-nsr-ignore
        placeholder="${I.S("Write your sentences here…", "Escribe tus oraciones aquí…")}"
      >
${ls.transfer.text}</textarea>
    </label>
    <div class="row-actions">
      <button type="button" class="btn btn-primary" data-ll-check-transfer>
        ${icon("check")} ${I.T("Check my writing", "Revisar mi escritura")}
      </button>
      ${ls.transfer.hint ? "" : html`<button type="button" class="btn ghost" data-ll-transfer-hint>${icon("bulb")} ${I.T("I want a hint", "Quiero una pista")}</button>`}
      <button type="button" class="btn ghost" data-ll-speak-transfer>
        ${icon("volume")} ${I.T("Listen to my writing", "Escuchar mi escritura")}
      </button>
      <button
        type="button"
        class="btn ghost"
        data-ll-to-book="${lab || ""}"
        data-band="${band || "6-8"}"
      >
        ${icon("library")}
        ${I.T("Turn into a Book Studio page", "Convertir en página de Book Studio")}
      </button>
    </div>
    ${result}
  </section>`;
}

/** A row of lamps: label + lit or not. Icons carry the meaning, not color alone. */
export const lampsHTML = (items) =>
  html`<ul class="ll-lamps">
    ${items.map(([on, label]) => html`<li class="${on ? "is-on" : ""}"><span class="ll-lamp" aria-hidden="true">${on ? icon("check") : ""}</span> <span class="visually-hidden">${on ? "✓" : "–"}</span>${label}</li>`)}
  </ul>`;
