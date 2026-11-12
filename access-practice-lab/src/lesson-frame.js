// The lesson frame: what every activity page wraps around its task so it reads like one lesson.
// Header (skill, goal, language focus, time, key words), a four-step arc (Warm up, Learn, Try, Reflect) with a
// step rail, calm three-part feedback, an end-of-activity reflection and a "next best step" card.
// Pure markup and small derivations. The frame is derived from fields every activity already has plus the
// per-skill data in content/lesson-learn.json; no activity was edited to use it.
// Rules it keeps: "Try independently" renders no key words, model or language frame; nothing here states a
// level, a score or a prediction; the only thing saved is which skill lessons were seen and what helped.
import { asList, html, icon, raw } from "./util.js";

export const FRAME_KEY = "accessPracticeLab:lessonFrame:v1";
export const STEPS = [
  [
    "warm",
    "Warm up",
    "Calentamiento",
    "Directions and key words",
    "Instrucciones y palabras clave",
  ],
  ["learn", "Learn", "Aprender", "Skill lesson", "Lección de destreza"],
  ["try", "Try", "Intentar", "Your answer", "Tu respuesta"],
  ["reflect", "Reflect", "Reflexionar", "What helped", "Qué te ayudó"],
];

// ── saved state: skill lessons seen and what helped (one small key, no student writing) ────────────────
export function loadFrame(store) {
  try {
    const parsed = JSON.parse(store?.get(FRAME_KEY) || "null");
    return { seen: { ...(parsed?.seen || {}) }, reflect: { ...(parsed?.reflect || {}) } };
  } catch {
    return { seen: {}, reflect: {} };
  }
}
export function saveFrame(store, state) {
  try {
    store?.set(FRAME_KEY, JSON.stringify({ seen: state.seen, reflect: state.reflect }));
  } catch {
    /* storage unavailable: the choice stays on screen for this visit */
  }
}
export const seenKey = (band, domain, familyId) => `${band}|${domain}|${familyId}`;

// ── derivations ───────────────────────────────────────────────────────────────
/** Minutes from "6 min"; null when the activity gives none. */
export const minutesOf = (a) => Number(String(a.time || "").match(/\d+/)?.[0]) || null;

/** "spanish: polen" and "término: definición" both carry a Spanish word; return it with any definition. */
export function spanishGloss(text) {
  const m = String(text || "").match(/^([^:]+):\s*(.*)$/);
  if (!m) return { term: String(text || "").trim(), def: "" };
  return /^(spanish|español|espanol)$/i.test(m[1].trim())
    ? { term: m[2].trim(), def: "" }
    : { term: m[1].trim(), def: m[2].trim() };
}

/** Key words (up to four) as { term, def, es } from the activity's own vocabulary. */
export const keyWords = (a) =>
  asList(a.vocabulary)
    .slice(0, 4)
    .map(([term, def, spanish]) => ({ term, def, es: spanishGloss(spanish) }));

/**
 * Step statuses. `flags`: { mode, warmDone, learnSeen, attempted, done, reflected }.
 * Statuses are done | current | todo | skipped; "Learn" is skipped when the learner works on their own.
 */
export function arcState(flags) {
  const independent = flags.mode === "independent";
  const finished = {
    warm: Boolean(flags.warmDone || flags.learnSeen || flags.attempted || flags.done),
    learn: independent || Boolean(flags.learnSeen || flags.attempted || flags.done),
    try: Boolean(flags.done),
    reflect: Boolean(flags.reflected),
  };
  let currentSet = false;
  const steps = STEPS.map(([id]) => {
    let status = finished[id] ? "done" : "todo";
    if (id === "learn" && independent) status = "skipped";
    if (status === "todo" && !currentSet) {
      status = "current";
      currentSet = true;
    }
    return { id, status };
  });
  const complete = steps.filter((s) => s.status === "done").length;
  return { steps, complete, current: steps.findIndex((s) => s.status === "current") };
}

/** Right answers out of the total for answer types that can be partly right; null for the rest. */
export function partialCredit(a, answer) {
  const list = asList(answer);
  switch (a.type) {
    case "multiSelect":
    case "hotText": {
      const want = new Set(a.answers || []);
      return { right: list.filter((x) => want.has(x)).length, total: want.size };
    }
    case "order": {
      const want = a.answer || [];
      return { right: want.filter((id, i) => list[i] === id).length, total: want.length };
    }
    case "sort": {
      const got = answer || {};
      const items = a.items || [];
      return { right: items.filter((it) => got[it.id] === it.answer).length, total: items.length };
    }
    case "cloze": {
      const blanks = (a.segments || []).filter((s) => s.blank).map((s) => s.blank);
      const got = answer || {};
      return { right: blanks.filter((b) => got[b.id] === b.answer).length, total: blanks.length };
    }
    default:
      return null;
  }
}

// ── header ────────────────────────────────────────────────────────────────────
export function railHTML(I, arc, { learnAvailable }) {
  const label = (s) => STEPS.find((x) => x[0] === s.id);
  const cur = arc.current >= 0 ? arc.steps[arc.current] : null;
  const pct = Math.round((arc.complete / STEPS.length) * 100);
  return html`<nav class="lf-rail" aria-label="${I.S("Lesson steps", "Pasos de la lección")}">
    <p class="lf-rail-count" role="status">
      ${cur ? I.T(`Step ${arc.current + 1} of 4: ${label(cur)[1]}`, `Paso ${arc.current + 1} de 4: ${label(cur)[2]}`) : I.T("All four steps done", "Los cuatro pasos están hechos")}
    </p>
    <ol class="lf-arc">
      ${arc.steps.map((s, i) => {
        const [id, en, es, subEn, subEs] = label(s);
        const off = id === "learn" && !learnAvailable;
        return html`<li
          class="lf-arc-step is-${s.status}"
          ${s.status === "current" ? raw('aria-current="step"') : ""}
        >
          <button
            type="button"
            class="lf-arc-btn"
            data-frame-go="${id}"
            ${off ? raw("disabled") : ""}
          >
            <span class="lf-arc-n" aria-hidden="true"
              >${s.status === "done" ? icon("check") : i + 1}</span
            >
            <span class="lf-arc-t">${I.T(en, es)}</span>
            <span class="lf-arc-s"
              >${s.status === "skipped" ? I.T("Closed on my own", "Cerrado: solo o sola") : I.T(subEn, subEs)}</span
            >
          </button>
        </li>`;
      })}
    </ol>
    <div
      class="lf-arc-bar"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="4"
      aria-valuenow="${arc.complete}"
      aria-label="${I.S("Lesson steps finished", "Pasos de la lección terminados")}"
    >
      <i style="width:${pct}%"></i>
    </div>
  </nav>`;
}

/** Skill, domain, level and time chips plus the "I can" goal and the language focus. */
export function goalHTML(I, m) {
  return html`<div class="lf-meta" role="list">
      <span class="lf-chip lf-chip--skill" role="listitem"
        ><span class="lf-chip-k">${I.T("Skill", "Destreza")}</span>
        <span lang="en">${m.skill.en}</span></span
      >
      <span class="lf-chip" role="listitem">${icon(m.domainIcon)} ${m.domainName}</span>
      <span class="lf-chip" role="listitem">${m.tierName}</span>
      ${m.minutes ? html`<span class="lf-chip" role="listitem">${icon("clock")} ${I.T(`${m.minutes} min`, `${m.minutes} min`)}</span>` : ""}
    </div>
    <section class="lf-goal" aria-labelledby="lf-goal-h">
      <h2 id="lf-goal-h" class="lf-eyebrow">${I.T("Today's goal", "La meta de hoy")}</h2>
      <p class="lf-goal-text">${m.can ? I.T(m.can.en, m.can.es) : ""}</p>
      ${m.focus.length ? html`<p class="lf-focus"><strong>${I.T("Language focus:", "Enfoque de lenguaje:")}</strong> ${m.focus.map((f, i) => html`${i ? " · " : ""}${typeof f === "string" ? html`<span lang="en">${f}</span>` : f}`)}</p>` : ""}
    </section>`;
}

/** Key words with audio and a Spanish gloss. A real <details class="helpers">, so opening it records help. */
export function keyWordsHTML(I, words, { open = false } = {}) {
  if (!words.length) return "";
  return html`<details class="helpers lf-words" ${open ? raw("open") : ""}>
    <summary>
      ${icon("words")} ${I.T(`Key words (${words.length})`, `Palabras clave (${words.length})`)}
    </summary>
    <ul class="lf-word-list" role="list">
      ${words.map(
        (w) =>
          html`<li>
            <p class="lf-word-term">
              <button
                type="button"
                class="say-word"
                data-say="${w.term}"
                aria-label="${I.S(`Say ${w.term}`, `Escuchar ${w.term}`)}"
              >
                ${icon("volume")}</button
              ><strong lang="en">${w.term}</strong>
            </p>
            <p class="lf-word-def" lang="en">${w.def}</p>
            ${w.es.term ? html`<p class="lf-word-es"><button type="button" class="say-word" data-say-es="${w.es.term}" aria-label="${I.S(`Say in Spanish: ${w.es.term}`, `Escuchar en español: ${w.es.term}`)}">${icon("volume")}</button><span lang="es">${w.es.term}${w.es.def ? html`: ${w.es.def}` : ""}</span></p>` : ""}
          </li>`,
      )}
    </ul>
  </details>`;
}

/** Print-only head and foot so a printed activity is a lesson sheet, not a screenshot. */
export const printHeadHTML = (I, title) =>
  html`<div class="lf-print-head">
    <p class="lf-print-name">
      ${I.T("Name", "Nombre")}: ______________________ ${I.T("Date", "Fecha")}: ____________
    </p>
    <p class="lf-print-title">${title}</p>
  </div>`;
export const printFootHTML = (I) =>
  html`<p class="lf-print-foot">
    ${I.T("Practice sheet. This is not an official WIDA or ACCESS test and gives no score or level.", "Hoja de práctica. No es una prueba oficial de WIDA ni de ACCESS y no da puntaje ni nivel.")}
  </p>`;

// ── passage tools ─────────────────────────────────────────────────────────────
export const MARKS = [
  ["highlight", "Highlight", "Resaltar", "bookmark"],
  ["underline", "Underline", "Subrayar", "pin"],
  ["question", "Question", "Pregunta", "help"],
];
/** Pen tools for the reading passage. Marks are the learner's own notes: they never count as help. */
export function annotateBarHTML(I, { tool = "", count = 0 }) {
  return html`<div
    class="lf-annotate"
    role="group"
    aria-label="${I.S("Mark the text", "Marca el texto")}"
  >
    <span class="lf-annotate-k">${I.T("Mark the text", "Marca el texto")}</span>
    ${MARKS.map(([id, en, es, ico]) => html`<button type="button" class="cat-chip lf-tool" data-frame-mark="${id}" aria-pressed="${String(tool === id)}">${icon(ico)} ${I.T(en, es)}</button>`)}
    <button
      type="button"
      class="ghost small"
      data-frame-clear-marks
      ${count ? "" : raw("disabled")}
    >
      ${I.T("Clear marks", "Borrar marcas")}
    </button>
    <p class="fine lf-annotate-hint" ${tool ? "" : raw("hidden")}>
      ${I.T("Tap a sentence to mark it. Tap again to remove the mark. Turn the pen off to hear sentences read aloud.", "Toca una oración para marcarla. Tócala otra vez para quitar la marca. Apaga el lápiz para escuchar las oraciones.")}
    </p>
  </div>`;
}

// ── feedback, reflection, next step ───────────────────────────────────────────
/**
 * The calm three-part body of a feedback panel: what went well, one next step, and (when the learner is
 * learning with help) a way to see the model. `well` and `next` are plain text from the activity's own fields.
 */
export function feedbackBodyHTML(I, { well, next, canModel }) {
  return html`<div class="lf-fb">
    <section class="lf-fb-part">
      <h3>${I.T("What went well", "Qué salió bien")}</h3>
      <p>${well}</p>
    </section>
    ${
      next
        ? html`<section class="lf-fb-part">
            <h3>${I.T("One next step", "Un siguiente paso")}</h3>
            <p>${next}</p>
          </section>`
        : ""
    }
    ${canModel ? html`<p class="lf-fb-model"><button type="button" class="btn small" data-frame-model>${icon("bulb")} ${I.T("Show me the model", "Muéstrame el modelo")}</button></p>` : ""}
  </div>`;
}

/** The "what went well" sentence for a miss: specific when part of the answer is right, honest when none is. */
export function wellOnMiss(I, partial) {
  if (partial && partial.right > 0)
    return I.T(
      `You have ${partial.right} of ${partial.total} right. Keep those and look again at the rest.`,
      `Tienes ${partial.right} de ${partial.total} bien. Conserva esas y vuelve a mirar las demás.`,
    );
  return I.T(
    "You chose an answer and checked it. That is how you find the one thing to fix.",
    "Elegiste una respuesta y la revisaste. Así se encuentra lo único que hay que corregir.",
  );
}

const HELPED = [
  ["words", "The key words", "Las palabras clave", ["supported"]],
  ["lesson", "The skill lesson", "La lección de destreza", ["supported"]],
  ["again", "Reading or listening again", "Leer o escuchar otra vez", ["supported", "independent"]],
  ["hint", "A hint", "Una pista", ["supported"]],
  ["mind", "Thinking it through myself", "Pensarlo yo mismo o misma", ["independent"]],
  ["unsure", "I am not sure yet", "Todavía no estoy seguro o segura", ["supported", "independent"]],
];
export const helpedIds = (mode) => HELPED.filter((h) => h[3].includes(mode)).map((h) => h[0]);

/** "What helped you most?" chips; the pick is saved on this device only. */
export function reflectionHTML(I, { mode, picked = "" }) {
  return html`<div class="lf-reflect" id="lf-reflect" role="group" aria-labelledby="lf-reflect-h">
    <h3 id="lf-reflect-h">${I.T("What helped you most?", "¿Qué te ayudó más?")}</h3>
    <div class="learn-chip-row">
      ${HELPED.filter((h) => h[3].includes(mode)).map(([id, en, es]) => html`<button type="button" class="cat-chip" data-frame-helped="${id}" aria-pressed="${String(picked === id)}">${picked === id ? icon("check") : ""} ${I.T(en, es)}</button>`)}
    </div>
    ${picked ? html`<p class="fine" role="status">${I.T("Saved on this device. Thinking about what helps is part of learning.", "Guardado en este dispositivo. Pensar en lo que te ayuda es parte de aprender.")}</p>` : ""}
  </div>`;
}

/**
 * The next best step, chosen from what just happened (never a level, score or prediction).
 * Needs: ok, supportUsed, mode, nextHref, independentHref, roomHref, hasLearn.
 */
export function nextStepHTML(I, n) {
  let title;
  let body;
  const actions = [];
  const nextLabel = n.nextHref
    ? I.T("Next activity", "Siguiente actividad")
    : I.T("Back to the room", "Volver a la sala");
  const forward = n.nextHref || n.roomHref;
  if (!n.ok) {
    title = I.T("Look at the skill, then go again", "Mira la destreza y vuelve a intentarlo");
    body = I.T(
      "Read the skill lesson once more, then try this one again or move on to another activity.",
      "Lee otra vez la lección de la destreza y luego intenta esta de nuevo o pasa a otra actividad.",
    );
    if (n.hasLearn)
      actions.push(
        html`<button type="button" class="btn btn-primary" data-frame-learn-open>
          ${icon("bulb")} ${I.T("Open the skill lesson", "Abrir la lección")}
        </button>`,
      );
    actions.push(html`<a class="btn" href="${forward}">${nextLabel} ${icon("arrow-right")}</a>`);
  } else if (n.mode === "supported" && n.supportUsed && n.independentHref) {
    title = I.T("Try one on your own", "Intenta una tú solo o sola");
    body = I.T(
      "You used help on this one. The next activity opens with the help closed, so you can show what you can do by yourself.",
      "Usaste ayuda en esta. La siguiente actividad abre con la ayuda cerrada, para que muestres lo que puedes hacer por tu cuenta.",
    );
    actions.push(
      html`<a class="btn btn-primary" href="${n.independentHref}"
        >${I.T("Next: on my own", "Siguiente: yo solo o sola")} ${icon("arrow-right")}</a
      >`,
    );
    actions.push(
      html`<a class="btn" href="${n.nextHref}">${I.T("Next with help", "Siguiente con ayuda")}</a>`,
    );
  } else {
    title = n.nextHref
      ? I.T("Keep going", "Sigue adelante")
      : I.T("You reached the end of this list", "Llegaste al final de esta lista");
    body = n.nextHref
      ? I.T(
          "Another activity for the same skill is ready.",
          "Hay otra actividad para la misma destreza.",
        )
      : I.T(
          "Choose another skill, or come back to this room to practice more.",
          "Elige otra destreza o vuelve a esta sala para practicar más.",
        );
    actions.push(
      html`<a class="btn btn-primary" href="${forward}">${nextLabel} ${icon("arrow-right")}</a>`,
    );
  }
  return html`<section class="lf-next" id="lf-next" aria-labelledby="lf-next-h">
    <p class="lf-eyebrow">
      ${icon("road")} ${I.T("Your next best step", "Tu mejor siguiente paso")}
    </p>
    <h3 id="lf-next-h">${title}</h3>
    <p>${body}</p>
    <div class="row-actions">${actions}</div>
  </section>`;
}
