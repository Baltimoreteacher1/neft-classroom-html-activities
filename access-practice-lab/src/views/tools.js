// Lab device readiness and supported-practice controls; not an official test simulation.
// Also home of the EduWonderLab rehearsal settings (high contrast, magnify, line reader, scratchpad)
// that the practice-test runner (views/test.js) reuses. They are this lab's own rehearsal settings and
// never stand in for official WIDA ACCESS accommodations.
import { crumbsHTML, listenPlayerHTML, recorderHTML } from "../components.js";
import { i18nFor, makeI18n } from "../i18n.js";
import { choiceTarget, inputHTML, reduceAnswer } from "../items.js";
import { isRecording } from "../recorder.js";
import { PREFIX } from "../store.js";
import { BASE, announce, html, icon, raw, safeJson, storage } from "../util.js";

// ── EduWonderLab rehearsal settings ───────────────────────────────────────────
const RH_KEY = `${PREFIX}:rehearsal`;
const MAGNIFY = 1.3;
export const REHEARSAL_TOOLS = [
  { id: "contrast", label: "High contrast", help: "Black text on white with bold outlines.", labelEs: "Alto contraste", helpEs: "Texto negro sobre blanco con bordes gruesos." },
  { id: "magnify", label: "Magnify", help: "Makes text and buttons larger.", labelEs: "Ampliar", helpEs: "Hace el texto y los botones más grandes." },
  { id: "reader", label: "Line reader", help: "Dims the page except a reading band that follows your pointer or keyboard focus.", labelEs: "Lector de líneas", helpEs: "Atenúa la página excepto una banda de lectura que sigue tu puntero o el foco del teclado." },
  { id: "scratch", label: "Scratchpad", help: "A notes box for your thinking. It is never scored and stays on this device.", labelEs: "Bloc de notas", helpEs: "Un cuadro de notas para tus ideas. Nunca se califica y se queda en este dispositivo." },
];
export const REHEARSAL_NOTICE =
  "These are EduWonderLab rehearsal settings, not official WIDA ACCESS accommodations. The official test has its own accommodation settings that this rehearsal does not copy. Ask your teacher which supports are in your testing plan.";
export const REHEARSAL_NOTICE_ES =
  "Estos son ajustes de ensayo de EduWonderLab, no adaptaciones oficiales de WIDA ACCESS. La prueba oficial tiene sus propios ajustes de adaptación que este ensayo no copia. Pregunta a tu docente qué apoyos están en tu plan de evaluación.";

/** Saved settings; anything unreadable (blocked storage, old data) falls back to all off. */
export function rehearsalPrefs() {
  const saved = safeJson(storage.get(RH_KEY), {}) || {};
  return Object.fromEntries(REHEARSAL_TOOLS.map((t) => [t.id, saved[t.id] === true]));
}
export function setRehearsalPref(id, on) {
  if (!REHEARSAL_TOOLS.some((t) => t.id === id)) return rehearsalPrefs();
  const next = { ...rehearsalPrefs(), [id]: Boolean(on) };
  storage.set(RH_KEY, JSON.stringify(next));
  return next;
}
export const rehearsalClasses = (p = rehearsalPrefs()) =>
  `rh-scope${p.contrast ? " rh-contrast" : ""}${p.magnify ? " rh-magnify" : ""}`;

/**
 * Toggle row. `compact` keeps the runner short; the full notice is on the intro and the tools page.
 * `I` is the caller's i18n (i18nFor(ctx)); without it the row is English.
 */
export function rehearsalToolbarHTML({ compact = false, I = makeI18n("en") } = {}) {
  const p = rehearsalPrefs();
  return html`<section class="rh-tools" aria-label="${I.S("EduWonderLab rehearsal settings", "Ajustes de ensayo de EduWonderLab")}">
    ${compact ? "" : html`<h2>${I.T("EduWonderLab rehearsal settings", "Ajustes de ensayo de EduWonderLab")}</h2>`}
    <div class="rh-row">
      ${REHEARSAL_TOOLS.map(
        (t) =>
          html`<button type="button" class="btn small rh-toggle" data-rh-toggle="${t.id}" aria-pressed="${p[t.id]}" title="${I.S(t.help, t.helpEs)}">
            ${I.T(t.label, t.labelEs)}
          </button>`,
      )}
    </div>
    <p class="fine rh-note">
      ${compact ? I.T("EduWonderLab rehearsal settings — not the official WIDA ACCESS accommodations.", "Ajustes de ensayo de EduWonderLab — no son las adaptaciones oficiales de WIDA ACCESS.") : I.T(REHEARSAL_NOTICE, REHEARSAL_NOTICE_ES)}
    </p>
    ${p.reader ? raw('<div class="rh-reader" data-rh-reader aria-hidden="true"></div>') : ""}
  </section>`;
}

export function onRehearsalClick(e, ctx) {
  const b = e.target.closest?.("[data-rh-toggle]");
  if (!b) return false;
  const tool = REHEARSAL_TOOLS.find((t) => t.id === b.dataset.rhToggle);
  if (!tool) return false;
  const next = setRehearsalPref(tool.id, !rehearsalPrefs()[tool.id]);
  const I = i18nFor(ctx);
  announce(
    I.S(
      `${tool.label} ${next[tool.id] ? "on" : "off"}. This is an EduWonderLab rehearsal setting.`,
      `${tool.labelEs} ${next[tool.id] ? "activado" : "desactivado"}. Este es un ajuste de ensayo de EduWonderLab.`,
    ),
  );
  ctx.rerender();
  return true;
}

let releaseReader = null;
/** Call from a view's mount: magnifies and wires the line reader. The app resets --lab-scale on every render. */
export function applyRehearsal(ctx) {
  releaseRehearsal();
  if (typeof document === "undefined" || !document.querySelector) return;
  const p = rehearsalPrefs();
  if (p.magnify)
    document.documentElement?.style.setProperty(
      "--lab-scale",
      String(Math.max(Number(ctx?.prefs?.textSize) || 1, MAGNIFY)),
    );
  const band = document.querySelector("[data-rh-reader]");
  if (!p.reader || !band) return;
  const place = (y) => {
    band.style.top = `${Math.max(0, y - band.offsetHeight / 2)}px`;
  };
  const onMove = (e) => place(e.clientY);
  const onFocus = (e) => {
    const r = e.target?.getBoundingClientRect?.();
    if (r) place(r.top + Math.min(r.height, 48) / 2);
  };
  document.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("focusin", onFocus);
  releaseReader = () => {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("focusin", onFocus);
  };
}
export function releaseRehearsal() {
  releaseReader?.();
  releaseReader = null;
}

const IGN = raw("data-nsr-ignore");
const SAMPLE = {
  id: "tools-sample",
  type: "multipleChoice",
  options: [
    { id: "a", text: "A pencil", visual: "\u270F\uFE0F" },
    { id: "b", text: "A book", visual: "\u{1F4D8}" },
    { id: "c", text: "A backpack", visual: "\u{1F392}" },
  ],
  answer: "b",
};
const state = { answer: undefined, flagged: false, typed: "", scratch: "" };

export async function render(ctx) {
  const I = i18nFor(ctx);
  const step = (n, title, body, { wide = false } = {}) =>
    html`<li class="tl-step ${wide ? "is-wide" : ""}">
      <header class="tl-step-head"><span class="tl-n">${n}</span><h2>${title}</h2></header>
      <div class="tl-step-body">${body}</div>
    </li>`;
  const READY = I.T("I'm ready — go to practice tests", "Estoy listo o lista — ir a las pruebas de práctica");
  const group = (label, text, href, linkText) =>
    html`<li><strong>${label}</strong> ${text} <a href="${href}">${linkText}</a></li>`;
  return {
    title: I.S("Lab tools and device check", "Herramientas del laboratorio y revisión del dispositivo"),
    html: html`<div class="${rehearsalClasses()} tl-page">${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/`],
        [I.S("Lab tools", "Herramientas del laboratorio"), null],
      ])}
      <section class="prog-hero tl-hero">
        <div class="prog-hero-copy">
          <p class="eyebrow">${icon("tools")} ${I.T("Before you practice", "Antes de practicar")}</p>
          <h1 tabindex="-1">${I.T("Lab tools and device check", "Herramientas del laboratorio y revisión del dispositivo")}</h1>
          <p class="lead">
            ${I.T("Try the lab controls and check your headphones before practicing. These are lab practice tools, not an official test simulation.", "Prueba los controles del laboratorio y revisa tus audífonos antes de practicar. Son herramientas de práctica del laboratorio, no una simulación de la prueba oficial.")}
          </p>
          <a class="btn btn-primary" href="${BASE}/tests">${READY} ${icon("arrow-right")}</a>
        </div>
      </section>
      <section class="tl-notice" aria-labelledby="tlActual"><span class="tl-notice-ico">${icon("info")}</span><div><h2 id="tlActual">${I.T("Prepare for the actual test", "Prepárate para la prueba real")}</h2><p>${I.T("Replay, slower speech, flagging, and recording here may work differently on ACCESS. Use the ", "Repetir, el habla más lenta, marcar y grabar aquí pueden funcionar de otra manera en ACCESS. Usa los ")}<a href="https://wida.wisc.edu/assess/access/preparing-students" target="_blank" rel="noopener">${I.T("official WIDA preparation resources and test demo (new tab)", "recursos oficiales de preparación de WIDA y la demostración de la prueba (pestaña nueva)")}</a>${I.T(" to learn the real test interface. Follow your teacher’s directions about allowed tools.", " para conocer la interfaz real de la prueba. Sigue las indicaciones de tu docente sobre las herramientas permitidas.")}</p></div></section>
      <ol class="tl-steps">
        ${step(
          1,
          I.T("Headphones and playback check", "Revisión de audífonos y reproducción"),
          html`<p>
              ${I.T("Connect your headphones and set a comfortable volume. Press Listen, then Stop audio. Replay and try slower speech. If you hear nothing, check the volume and audio output, then ask your teacher.", "Conecta tus audífonos y pon un volumen cómodo. Presiona Escuchar y luego Detener audio. Repite y prueba el habla más lenta. Si no oyes nada, revisa el volumen y la salida de audio, y pregunta a tu docente.")}
            </p>
            ${listenPlayerHTML("tools-listen", ["Point to the book on the table. Then choose the book."], { rate: ctx.prefs.rate })}`,
        )}
        ${step(
          2,
          I.T("Choose an answer", "Elige una respuesta"),
          html`<p>${I.T("Click one answer. Click a different one to change your mind.", "Haz clic en una respuesta. Haz clic en otra para cambiar de idea.")}</p>
            ${inputHTML(SAMPLE, state.answer)}${state.answer ? html`<p class="saved-note tl-note">${state.answer === "b" ? html`${icon("check")} ${I.T("You chose the book.", "Elegiste el libro.")}` : I.T("You can change your answer any time before you submit.", "Puedes cambiar tu respuesta en cualquier momento antes de enviarla.")}</p>` : ""}`,
        )}
        ${step(
          3,
          I.T("Flag a question", "Marca una pregunta"),
          html`<p>${I.T("Not sure? Flag it, and come back to it before you finish.", "¿No estás seguro o segura? Márcala y vuelve a ella antes de terminar.")}</p>
            <button
              type="button"
              class="flag ${state.flagged ? "is-on" : ""}"
              data-tool-flag
              aria-pressed="${state.flagged}"
            >
              ${icon(state.flagged ? "flag" : "bookmark")} ${state.flagged ? I.T("Flagged", "Marcada") : I.T("Flag", "Marcar")}
            </button>`,
        )}
        ${step(
          4,
          I.T("Record your voice", "Graba tu voz"),
          html`<p>
              ${I.T("Optional microphone check: press Record, say “The book is on the table,” then press Stop and play it back. Do not say your name or other personal information.", "Revisión opcional del micrófono: presiona Grabar, di “The book is on the table,” luego presiona Detener y escúchate. No digas tu nombre ni otra información personal.")}
            </p>
            ${recorderHTML("tools-rec", { recording: isRecording("tools-rec") })}
            <p>${I.T("No microphone, permission denied, or no playback? Practice the sentence aloud with a partner or teacher. You can continue without recording. Recordings disappear when this page closes or reloads; resume codes do not contain audio.", "¿No hay micrófono, se negó el permiso o no hay reproducción? Practica la oración en voz alta con un compañero o con tu docente. Puedes continuar sin grabar. Las grabaciones desaparecen cuando esta página se cierra o se recarga; los códigos para continuar no contienen audio.")}</p>`,
        )}
        ${step(
          5,
          I.T("Type an answer", "Escribe una respuesta"),
          html`<p>${I.T("Type one sentence. Use a capital letter and a period.", "Escribe una oración. Usa una letra mayúscula y un punto.")}</p>
            <label for="tool-typing">${I.T("Practice sentence", "Oración de práctica")}</label>
            <textarea
              id="tool-typing"
              rows="2"
              data-tool-type
              placeholder="My favorite subject is ___ because ___."
              ${IGN}
            >
${state.typed}</textarea>`,
        )}
        ${step(
          6,
          I.T("Try the rehearsal settings", "Prueba los ajustes de ensayo"),
          html`<p>
              ${I.T("Practice tests have two modes.", "Las pruebas de práctica tienen dos modos.")} <strong>${I.T("Guided Practice", "Práctica guiada")}</strong> ${I.T("is untimed and gives hints, answer explanations and retries.", "no tiene tiempo y ofrece pistas, explicaciones de las respuestas y nuevos intentos.")}
              <strong>${I.T("Independent Rehearsal", "Ensayo independiente")}</strong> ${I.T("is like test day: each recording plays once, there are no sentence frames or word banks, and you review each section before you submit.", "es como el día de la prueba: cada grabación se reproduce una vez, no hay estructuras de oraciones ni bancos de palabras, y revisas cada sección antes de enviar.")}
            </p>
            <p>${I.T("Turn these on to try them. Your choices are saved on this device and also apply in practice tests.", "Actívalos para probarlos. Tus elecciones se guardan en este dispositivo y también se aplican en las pruebas de práctica.")}</p>
            ${rehearsalToolbarHTML({ I })}
            <ul class="fine">
              ${REHEARSAL_TOOLS.map((t) => html`<li><strong>${I.T(t.label, t.labelEs)}:</strong> ${I.T(t.help, t.helpEs)}</li>`)}
            </ul>
            ${
              rehearsalPrefs().scratch
                ? html`<label class="field rh-scratch"
                    ><span>${I.T("Scratchpad (EduWonderLab rehearsal setting, never scored)", "Bloc de notas (ajuste de ensayo de EduWonderLab, nunca se califica)")}</span
                    ><textarea rows="3" data-tool-scratch ${IGN}>${state.scratch}</textarea></label
                  >`
                : ""
            }`,
          { wide: true },
        )}
        ${step(
          7,
          I.T("Teacher Hub & Differentiated Instructional Grouping", "Centro docente y agrupación diferenciada para la enseñanza"),
          html`<p>${I.T("Actionable language development tools for educators. Analyze evidence, plan small-group interventions, and access printable materials.", "Herramientas prácticas de desarrollo del lenguaje para docentes. Analice evidencia, planifique intervenciones en grupos pequeños y acceda a materiales imprimibles.")}</p>
            <div class="tl-teacher">
              <p class="tl-teacher-tag">${icon("teacher")} ${I.T("For teachers", "Para docentes")}</p>
              <h3>${I.T("Targeted Language Interventions", "Intervenciones lingüísticas dirigidas")}</h3>
              <ul>
                ${group(I.T("Group A (Discourse & Cohesion):", "Grupo A (discurso y cohesión):"), html`${I.T("Focus on cause-and-effect transitions (", "Enfoque en transiciones de causa y efecto (")}<em>because, consequently, therefore</em>${I.T(") and multi-paragraph structures. Use the", ") y en estructuras de varios párrafos. Use el")}`, `${BASE}/construction`, I.T("Language Construction Lab", "Laboratorio de construcción del lenguaje"))}
                ${group(I.T("Group B (Evidence & Scientific Claims):", "Grupo B (evidencia y afirmaciones científicas):"), I.T("Focus on data interpretation and citing specific textual evidence. Use the", "Enfoque en la interpretación de datos y en citar evidencia textual específica. Use el"), `${BASE}/evidence`, I.T("Evidence Studio", "Estudio de evidencia"))}
                ${group(I.T("Group C (Oral Fluency & Discourse):", "Grupo C (fluidez oral y discurso):"), I.T("Focus on academic dialogue turn-taking and spoken elaboration. Use the", "Enfoque en los turnos de diálogo académico y la elaboración oral. Use el"), `${BASE}/conversation`, I.T("Conversation Simulator", "Simulador de conversación"))}
                ${group(I.T("Group D (Vocabulary & Morphology):", "Grupo D (vocabulario y morfología):"), I.T("Focus on Greek and Latin roots, prefixes, and suffixes. Use", "Enfoque en raíces griegas y latinas, prefijos y sufijos. Use"), `${BASE}/vocabulary`, I.T("Word Builder", "Constructor de palabras"))}
                ${group(I.T("Whole-Class Modeling:", "Modelado para toda la clase:"), I.T("Projector routines for listening, evidence reading, and sequence reconstruction. Use the", "Rutinas con proyector para escuchar, leer evidencia y reconstruir secuencias. Use el"), `${BASE}/classroom`, I.T("Whole-Class Studio", "Estudio para toda la clase"))}
              </ul>
              <div class="row-actions">
                <a class="btn ghost small" href="${BASE}/launch-studio">${I.T("Open Teacher Launch Studio", "Abrir el Estudio de lanzamiento para docentes")} ${icon("arrow-right")}</a>
                <a class="btn ghost small" href="${BASE}/classroom">${I.T("Open Whole-Class Studio", "Abrir el Estudio para toda la clase")} ${icon("arrow-right")}</a>
                <a class="btn ghost small" href="/access-teacher/">${I.T("Open Full Teacher Dashboard", "Abrir el panel docente completo")} ${icon("arrow-right")}</a>
                <a class="btn ghost small" href="${BASE}/passport?portfolio=1">${I.T("View Student Practice Portfolios", "Ver portafolios de práctica de los estudiantes")} ${icon("arrow-right")}</a>
              </div>
            </div>`,
          { wide: true },
        )}
      </ol>
      <div class="row-actions">
        <a class="btn btn-primary" href="${BASE}/tests">${READY} ${icon("arrow-right")}</a>
      </div></div>`,
  };
}
export function onChange(e, ctx) {
  const next = reduceAnswer(SAMPLE, state.answer, e.target);
  if (next !== undefined) {
    state.answer = next;
    ctx.rerender();
  }
}
export function mount(_root, ctx) {
  applyRehearsal(ctx);
}
export function unmount() {
  releaseRehearsal();
}
export function onClick(e, ctx) {
  if (onRehearsalClick(e, ctx)) return true;
  const choice = choiceTarget(e);
  if (choice) {
    state.answer = reduceAnswer(SAMPLE, state.answer, choice);
    ctx.rerender();
    return true;
  }
  if (e.target.closest("[data-tool-flag]")) {
    state.flagged = !state.flagged;
    ctx.rerender();
  }
}
export function onInput(e) {
  if (e.target.matches("[data-tool-type]")) state.typed = e.target.value;
  if (e.target.matches("[data-tool-scratch]")) state.scratch = e.target.value;
}
