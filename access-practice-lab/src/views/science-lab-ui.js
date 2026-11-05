// Science Investigation Lab: shared screen parts (header, path, support choice, help rail, feedback, fields).
// Markup only. Feedback is always the learner's own quoted words followed by a question; never a number.
import { crumbsHTML } from "../components.js";
import { STAGE_META, STAGES, TRANSFER_STAGE } from "../content/science-lab.js";
import { BASE, html, icon, raw } from "../util.js";
import { statusOf, workKind } from "./science-lab-model.js";

export const labHref = (t, stage = "") =>
  `${BASE}/worlds/science-lab${stage ? `/${stage}` : ""}?case=${t.caseId}`;
const domainOf = (stage) => (stage === "present" ? "d-speaking" : "d-writing");

export const statusText = (I, status) =>
  status === "done"
    ? I.T("Done", "Hecho")
    : status === "started"
      ? I.T("In progress", "En progreso")
      : I.T("Not started", "Sin empezar");

export const stageTitle = (I, stage) =>
  stage === TRANSFER_STAGE
    ? I.T("On your own: a new investigation", "Por tu cuenta: una investigación nueva")
    : I.TO(STAGE_META[stage].title);

export function crumbs(I, t, last) {
  return crumbsHTML(
    [
      [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${t.band}`],
      [I.S("Language Worlds", "Mundos lingüísticos"), `${BASE}/worlds?grades=${t.band}`],
      [
        I.S("Science Investigation Lab", "Laboratorio de investigación científica"),
        last ? labHref(t) : null,
      ],
      ...(last ? [[last, null]] : []),
    ],
    { i18n: I },
  );
}

// ── help settings ────────────────────────────────────────────────────────────
const LEVELS = {
  A: [
    ["Lots of help", "Mucha ayuda"],
    [
      "Starters, word help and questions start open.",
      "Los inicios, la ayuda con palabras y las preguntas empiezan abiertos.",
    ],
  ],
  B: [
    ["Some help", "Algo de ayuda"],
    [
      "Sentence starters start open. The rest is one tap away.",
      "Los inicios de oración empiezan abiertos. Lo demás está a un toque.",
    ],
  ],
  C: [
    ["On my own", "Por mi cuenta"],
    [
      "Help starts closed. You can still open any help you need.",
      "La ayuda empieza cerrada. Aún puedes abrir la ayuda que necesites.",
    ],
  ],
};

/** Chosen before anything else renders. `chosen` false = no button is pressed yet. */
export function supportChooserHTML(I, level, chosen) {
  return html`<fieldset class="ex-support sl-support">
    <legend>${I.T("How much help do you want?", "¿Cuánta ayuda quieres?")}</legend>
    <div class="ex-support-options">
      ${["A", "B", "C"].map(
        (l) =>
          html`<button
            type="button"
            class="ex-support-btn"
            data-sl-support="${l}"
            aria-pressed="${chosen && l === level}"
          >
            <strong>${I.T(...LEVELS[l][0])}</strong><span>${I.T(...LEVELS[l][1])}</span>
          </button>`,
      )}
    </div>
    <p class="fine">
      ${I.T("This is a help setting for practice. You can change it at any time.", "Es un ajuste de ayuda para practicar. Puedes cambiarlo cuando quieras.")}
    </p>
  </fieldset>`;
}

export function modePillHTML(I, cs, stage) {
  const helped = workKind(cs, stage) === "supported";
  return html`<p
    class="sl-mode ${helped ? "is-help" : "is-alone"}"
    data-sl-mode="${helped ? "supported" : "independent"}"
  >
    ${icon(helped ? "bulb" : "flag")}
    <strong
      >${helped ? I.T("Working with help", "Trabajando con ayuda") : I.T("On my own", "Por mi cuenta")}</strong
    >
    <span class="fine"
      >${helped ? I.T("Help is a normal part of learning. It is noted so you can see what helped.", "La ayuda es parte normal de aprender. Se anota para que veas qué te ayudó.") : I.T("Open any help you need. Opening help is noted.", "Abre la ayuda que necesites. Abrir ayuda queda anotado.")}</span
    >
  </p>`;
}

// ── the twelve-step path ─────────────────────────────────────────────────────
export function pathHTML(I, t, cs, current = "", open = true) {
  const index = STAGES.indexOf(current) + 1;
  const list = html`<ol class="sl-path">
    ${STAGES.map((stage, i) => {
      const status = statusOf(cs, stage);
      return html`<li class="sl-path-step is-${status} ${stage === current ? "is-current" : ""}">
        <a href="${labHref(t, stage)}" ${stage === current ? raw('aria-current="step"') : ""}>
          <span class="ex-path-n" aria-hidden="true"
            >${status === "done" ? icon("check") : i + 1}</span
          >
          <span class="ex-path-text"
            ><strong>${I.TO(STAGE_META[stage].title)}</strong
            ><span>${statusText(I, status)}</span></span
          >
        </a>
      </li>`;
    })}
  </ol>`;
  if (open)
    return html`<nav aria-label="${I.S("The twelve steps", "Los doce pasos")}">${list}</nav>`;
  return html`<details class="sl-path-d">
    <summary>
      ${I.T(`Step ${index} of 12 · see all steps`, `Paso ${index} de 12 · ver todos los pasos`)}
    </summary>
    <nav aria-label="${I.S("The twelve steps", "Los doce pasos")}">${list}</nav>
  </details>`;
}

// ── help rail ────────────────────────────────────────────────────────────────
const KIND = {
  prompt: ["A question to think about", "Una pregunta para pensar"],
  frame: ["Sentence starter", "Inicio de oración"],
  word: ["Word help", "Ayuda con palabras"],
};
/** Help toggled open on screen. Opening is recorded by the engine; closing only hides it. */
const openHelp = new Map();

export function helpItems(caseDef, stage) {
  const items = (caseDef.help[stage] || []).map((h) => ({ id: h.id, kind: h.kind, text: h.text }));
  return [...items, { id: "vocab", kind: "vocab" }];
}

export function openSetFor(t, stage, level) {
  const key = `${t.band}:${t.caseId}:${stage}`;
  if (!openHelp.has(key)) {
    const items = helpItems(t.caseDef, stage);
    const start =
      level === "A"
        ? items.map((h) => h.id)
        : level === "B"
          ? items.filter((h) => h.kind === "frame").map((h) => h.id)
          : [];
    openHelp.set(key, new Set(start));
  }
  return openHelp.get(key);
}

function helpBody(I, caseDef, item) {
  if (item.kind === "vocab")
    return html`<dl class="ex-words">
      ${caseDef.vocab.map(
        (v) =>
          html`<div>
            <dt>${I.TO(v.term)}</dt>
            <dd>${I.TO(v.meaning)}</dd>
          </div>`,
      )}
    </dl>`;
  return item.kind === "frame"
    ? html`<p class="sl-frame">${I.TO(item.text)}</p>`
    : html`<p>${I.TO(item.text)}</p>`;
}

export function helpRailHTML(I, t, stage, open) {
  const items = helpItems(t.caseDef, stage);
  const seen = {};
  return html`<aside class="ex-help sl-help" aria-labelledby="slHelpTitle">
    <h2 id="slHelpTitle">${icon("bulb")} ${I.T("Help for this step", "Ayuda para este paso")}</h2>
    <p class="fine">
      ${I.T("Open only what you need. Closing help never erases your work. Help you open is noted.", "Abre solo lo que necesites. Cerrar la ayuda nunca borra tu trabajo. La ayuda que abras queda anotada.")}
    </p>
    <ul class="ex-help-list">
      ${items.map((item) => {
        const isOpen = open.has(item.id);
        const [en, es] =
          item.kind === "vocab"
            ? ["Science words", "Palabras de ciencias"]
            : KIND[item.kind] || KIND.prompt;
        seen[item.kind] = (seen[item.kind] || 0) + 1;
        const n = seen[item.kind] > 1 ? ` ${seen[item.kind]}` : "";
        return html`<li class="${isOpen ? "is-open" : ""}">
          <button
            type="button"
            class="ex-help-toggle"
            data-sl-help="${item.id}"
            aria-expanded="${isOpen}"
            aria-controls="slHelp-${item.id}"
          >
            ${icon(isOpen ? "chevron-down" : "chevron-right")}<span
              >${I.T(`${en}${n}`, `${es}${n}`)}</span
            >
          </button>
          <div class="ex-help-body" id="slHelp-${item.id}" ${isOpen ? "" : raw("hidden")}>
            ${isOpen ? helpBody(I, t.caseDef, item) : ""}
          </div>
        </li>`;
      })}
    </ul>
  </aside>`;
}

export const closedRailHTML = (I) =>
  html`<aside class="ex-help sl-help" aria-labelledby="slHelpTitle">
    <h2 id="slHelpTitle">${icon("flag")} ${I.T("On your own", "Por tu cuenta")}</h2>
    <p>
      ${I.T("Help is closed for this step so you can show what you can do alone. Take your time. You can use what you have learned.", "La ayuda está cerrada en este paso para que muestres lo que puedes hacer solo. Tómate tu tiempo. Puedes usar lo que has aprendido.")}
    </p>
  </aside>`;

// ── feedback ────────────────────────────────────────────────────────────────
/** notes: [{quote, en, es}]. The learner's quoted words, then the question; never a number. */
export function feedbackHTML(I, notes, { stale = false, extra = "" } = {}) {
  return html`<section class="ex-notes sl-feedback" aria-labelledby="slFbTitle" data-sl-feedback>
    <h2 id="slFbTitle" tabindex="-1">
      ${I.T("Questions to think about", "Preguntas para pensar")}
    </h2>
    <p class="fine">
      ${I.T("These come from simple rules about your own words. They ask; they do not tell you what to write.", "Vienen de reglas simples sobre tus propias palabras. Preguntan; no te dicen qué escribir.")}
    </p>
    ${stale ? html`<p class="ex-change">${icon("retry")} ${I.T("You changed your words after this. Check again to see new questions.", "Cambiaste tus palabras después de esto. Revisa otra vez para ver preguntas nuevas.")}</p>` : ""}
    ${
      notes.length
        ? html`<ul class="sl-notes">
            ${notes.map(
              (n) =>
                html`<li>
                  ${n.quote ? html`<q class="sl-quote">${n.quote}</q>` : ""}
                  <p class="sl-ask">${I.T(n.en, n.es)}</p>
                </li>`,
            )}
          </ul>`
        : html`<p>
            ${I.T("No new questions this time. Read your words aloud once more. Does each part say what you mean?", "No hay preguntas nuevas esta vez. Lee tus palabras en voz alta otra vez. ¿Cada parte dice lo que quieres decir?")}
          </p>`
    }
    ${extra}
  </section>`;
}

// ── fields ───────────────────────────────────────────────────────────────────
/** A saved text field: `data-sl-field="<stage>:<name>"` is read by the view's input handler. */
export function fieldHTML(
  I,
  { stage, name, sub = "", label, value = "", rows = 3, hint = "", required = false },
) {
  const id = `slf-${stage}-${name}${sub ? `-${sub}` : ""}`;
  return html`<div class="field sl-field">
    <label for="${id}">${label}</label>
    ${hint ? html`<span class="fine" id="${id}-hint">${hint}</span>` : ""}
    <textarea
      id="${id}"
      rows="${rows}"
      spellcheck="true"
      data-sl-field="${stage}:${name}"
      ${sub ? raw(`data-sl-sub="${sub}"`) : ""}
      ${required ? raw('data-sl-required="true"') : ""}
      ${hint ? raw(`aria-describedby="${id}-hint"`) : ""}
    >
${value}</textarea>
  </div>`;
}

export const savedNote = (I) =>
  html`<p class="fine sl-saved" data-sl-saved>
    ${I.T("Saved on this device as you type.", "Se guarda en este dispositivo mientras escribes.")}
  </p>`;

/** Context the learner wrote earlier, shown back to them in their own words. */
export const echoHTML = (I, label, text) =>
  text?.trim()
    ? html`<div class="sl-echo">
        <p class="ex-kicker">${label}</p>
        <p class="sl-quote-block">${text}</p>
      </div>`
    : "";

// ── one stage ────────────────────────────────────────────────────────────────
export function stageShellHTML(I, t, cs, stage, { main, rail, foot = "" }) {
  const i = STAGES.indexOf(stage);
  const transfer = stage === TRANSFER_STAGE;
  const prev = i > 0 ? STAGES[i - 1] : transfer ? STAGES.at(-1) : "";
  const meta = STAGE_META[stage];
  return html`<div class="sl-stage ${domainOf(stage)}">
    <header class="ex-step-head">
      <div>
        <p class="ex-eyebrow">
          ${transfer ? I.T("Science Investigation Lab · Transfer", "Laboratorio de investigación científica · Transferencia") : I.T(`Science Investigation Lab · Step ${i + 1} of 12`, `Laboratorio de investigación científica · Paso ${i + 1} de 12`)}
        </p>
        <h1 id="slTitle" tabindex="-1">${stageTitle(I, stage)}</h1>
        <p class="ex-objective">
          ${transfer ? I.T("Use what you know on a new phenomenon, with all help closed.", "Usa lo que sabes en un fenómeno nuevo, con toda la ayuda cerrada.") : I.TO(meta.task)}
        </p>
      </div>
      ${modePillHTML(I, cs, stage)}
    </header>
    ${pathHTML(I, t, cs, stage, false)}
    <p class="sl-msg" id="slMsg" role="status" aria-live="polite"></p>
    <div class="ex-step-grid">
      <div class="ex-step-main">${main}</div>
      ${rail}
    </div>
    <nav class="ex-step-foot" aria-label="${I.S("Move between steps", "Moverse entre pasos")}">
      <a class="btn" href="${prev ? labHref(t, prev) : labHref(t)}"
        >${icon("arrow-left")}
        ${prev ? I.T("Back", "Atrás") : I.T("Back to the lab", "Volver al laboratorio")}</a
      >
      ${foot}
    </nav>
  </div>`;
}

/** The primary button that finishes a stage. The view checks the stage's requirement on click and says what is missing. */
export function doneButtonHTML(I, stage) {
  const next = STAGES[STAGES.indexOf(stage) + 1];
  const label =
    stage === TRANSFER_STAGE
      ? I.T("Finish", "Terminar")
      : next
        ? I.T(
            `Done. Next: ${STAGE_META[next].title.en}`,
            `Listo. Siguiente: ${STAGE_META[next].title.es}`,
          )
        : I.T(
            "Done. Next: a new investigation on my own",
            "Listo. Siguiente: una investigación nueva por mi cuenta",
          );
  return html`<button type="button" class="btn btn-primary" data-sl-done="${stage}">
    ${label} ${icon("arrow-right")}
  </button>`;
}
