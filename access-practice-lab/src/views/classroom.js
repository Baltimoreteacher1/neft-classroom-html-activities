// Projector-friendly whole-class studio. Session annotations are in-memory only.
import { crumbsHTML } from "../components.js";
import { i18nFor, makeI18n } from "../i18n.js";
import { BASE, DOMAIN_META, html, icon } from "../util.js";
import { CLASSROOM_ROUTINES, isCorrectOrder, routineForBand } from "./classroom-data.js";

const state = { routine: "", supports: true, revealed: false, size: "large", selected: new Set(), order: [], checked: false, compare: false, note: "" };
let I = makeI18n("en");
// Display names for the routine's domain and language use (the data stays English; class names use the English value).
const DOMAIN_ES = { Listening: "Escuchar", Reading: "Leer", Speaking: "Hablar", Writing: "Escribir" };
const USE_ES = { Inform: "Informar", Explain: "Explicar", Argue: "Argumentar" };
const escAttr = (value) => String(value ?? "");
function active(band) {
  const rows = routineForBand(band);
  return rows.find((r) => r.id === state.routine) || rows[0] || CLASSROOM_ROUTINES[0];
}
function option(r, selected) { return html`<option value="${r.id}" ${r.id === selected ? "selected" : ""}>${r.title} · ${I.S(r.domain, DOMAIN_ES[r.domain])}</option>`; }
function move(arr, from, to) { const next = [...arr]; if (to < 0 || to >= next.length) return next; [next[from], next[to]] = [next[to], next[from]]; return next; }

const phases = () => [
  ["listening", I.T("Listen", "Escuchar")],
  ["evidence", I.T("Notice", "Observar")],
  ["conversation", I.T("Explain", "Explicar")],
];

function sourceCards(task) {
  return task.sources.map(
    (source, i) => html`<button type="button" class="classroom-source ${state.selected.has(i) ? "is-marked" : ""}" data-class-source="${i}" aria-pressed="${state.selected.has(i)}">
      <span class="classroom-source-number">${I.T(`Source ${i + 1}`, `Fuente ${i + 1}`)}${state.selected.has(i) ? html` · ${icon("check")} ${I.T("Marked", "Marcada")}` : ""}</span>
      <span class="classroom-source-text">${source}</span>
    </button>`,
  );
}

function sentenceRows(task) {
  const last = state.order.length - 1;
  return state.order.map(
    (index, position) => html`<li class="classroom-sentence-row">
      <span class="classroom-pos" aria-hidden="true">${position + 1}</span>
      <span class="classroom-sentence-text">${task.sentence[index]}</span>
      <span class="classroom-moves">
        <button class="btn classroom-move is-up" type="button" data-class-move="${position}" data-direction="-1" aria-label="${I.S("Move sentence up", "Subir la oración")}" ${position === 0 ? "disabled" : ""}>${icon("chevron-down")}</button>
        <button class="btn classroom-move" type="button" data-class-move="${position}" data-direction="1" aria-label="${I.S("Move sentence down", "Bajar la oración")}" ${position === last ? "disabled" : ""}>${icon("chevron-down")}</button>
      </span>
    </li>`,
  );
}

function revealHTML(task) {
  return html`<section class="classroom-reveal"><div class="classroom-step"><span>03</span><div><h3>${I.T("Discuss, compare, and transfer", "Dialogar, comparar y aplicar")}</h3><p>${I.T("Invite more than one interpretation, then compare reasoning with the sample. A model is one possible response.", "Invite más de una interpretación y luego compare el razonamiento con el ejemplo. Un modelo es una respuesta posible.")}</p></div></div>
    <div class="classroom-reveal-grid">
      <article class="classroom-question"><span class="eyebrow">${I.T("Discussion question", "Pregunta para dialogar")}</span><h3>${task.question}</h3><button type="button" class="btn" data-say="${task.question}">${icon("volume")} ${I.T("Read question aloud", "Leer la pregunta en voz alta")}</button></article>
      <article class="classroom-model"><span class="eyebrow">${I.T("One possible model", "Un modelo posible")}</span><p>${task.model}</p></article>
    </div>
    <div class="classroom-compare"><div><h3>${I.T("Compare responses", "Comparar respuestas")}</h3><p>${I.T("What does the model include that our first idea did not? What could we improve?", "¿Qué incluye el modelo que nuestra primera idea no incluía? ¿Qué podríamos mejorar?")}</p></div><button type="button" class="btn" data-class-compare aria-pressed="${state.compare}">${state.compare ? I.T("Hide comparison lens", "Ocultar la guía de comparación") : I.T("Show comparison lens", "Mostrar la guía de comparación")}</button></div>
    ${
      state.compare
        ? html`<div class="classroom-compare-grid"><article><span class="eyebrow">${I.T("First think", "Primera idea")}</span><p>${I.T("State an idea or claim.", "Exprese una idea o afirmación.")}</p></article><article><span class="eyebrow">${I.T("Model response", "Respuesta modelo")}</span><p>${task.model}</p></article><article><span class="eyebrow">${I.T("Look for", "Qué observar")}</span><p>${I.T("Notice the evidence, connection words, and explanation that make the response understandable.", "Observe la evidencia, las palabras de enlace y la explicación que hacen comprensible la respuesta.")}</p></article></div>`
        : ""
    }
    <article class="classroom-transfer"><span class="eyebrow">${I.T("Independent transfer", "Aplicación independiente")}</span><h3>${I.T("Try the thinking with a new situation", "Aplicar el razonamiento a una situación nueva")}</h3><p>${task.transfer}</p><p class="fine">${I.T("Students can respond orally, write on paper, or discuss with a partner. This studio does not retain responses.", "Los estudiantes pueden responder en voz alta, escribir en papel o dialogar con un compañero. Este estudio no guarda las respuestas.")}</p></article></section>`;
}

export async function render(ctx) {
  I = i18nFor(ctx);
  const rows = routineForBand(ctx.band);
  const task = active(ctx.band);
  if (state.routine !== task.id) { state.routine = task.id; state.selected = new Set(); state.order = task.sentence.map((_, i) => i); state.checked = false; state.revealed = false; state.note = ""; }
  const correctlyOrdered = isCorrectOrder(state.order, task.answer);
  const domainIcon = DOMAIN_META[task.domain]?.icon || "classroom";
  return { title: `${I.S("Whole-Class Language Studio", "Estudio de lenguaje para toda la clase")} · ${task.title}`, html: html`${crumbsHTML([[I.S("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band}`], [I.S("Whole-Class Studio", "Estudio para toda la clase"), null]])}
    <div class="classroom-studio classroom-size-${state.size} d-${task.domain.toLowerCase()}">
      <header class="classroom-hero"><div><p class="eyebrow">${icon("classroom")} ${I.T(`Project and explore · Grades ${ctx.band.replace("-", "–")}`, `Proyectar y explorar · Grados ${ctx.band.replace("-", "–")}`)}</p><h1 tabindex="-1">${I.T("Whole-Class Language Studio", "Estudio de lenguaje para toda la clase")}</h1><p class="classroom-lead">${I.T("Guide a brief listen, read, discuss, and revise routine. Reveal prompts and models when your class is ready.", "Guíe una rutina breve de escuchar, leer, dialogar y revisar. Muestre las preguntas y los modelos cuando su clase esté lista.")}</p></div><ol class="classroom-hero-mark" aria-label="${I.S("Routine", "Rutina")}">${phases().map(([ic, label]) => html`<li>${icon(ic)} ${label}</li>`)}</ol></header>
      <section class="classroom-toolbar" aria-label="${I.S("Studio controls", "Controles del estudio")}"><label>${I.T("Class routine", "Rutina de clase")}<select data-class-routine>${rows.map((r) => option(r, task.id))}</select></label><label>${I.T("Display size", "Tamaño de pantalla")}<select data-class-size><option value="large" ${state.size === "large" ? "selected" : ""}>${I.S("Projector", "Proyector")}</option><option value="regular" ${state.size === "regular" ? "selected" : ""}>${I.S("Standard", "Estándar")}</option></select></label><button type="button" class="btn" data-class-support aria-pressed="${state.supports}">${state.supports ? I.T("Hide scaffolds", "Ocultar apoyos") : I.T("Show scaffolds", "Mostrar apoyos")}</button><button type="button" class="btn" data-class-reveal aria-expanded="${state.revealed}">${state.revealed ? I.T("Hide question & model", "Ocultar pregunta y modelo") : I.T("Reveal question & model", "Mostrar pregunta y modelo")}</button><button type="button" class="btn" data-class-print>${icon("print")} ${I.T("Print routine", "Imprimir la rutina")}</button></section>
      <section class="classroom-task-head"><div><span class="classroom-domain">${icon(domainIcon)} ${I.T(task.domain, DOMAIN_ES[task.domain])} · ${I.T(task.use, USE_ES[task.use])}</span><h2>${task.title}</h2><p>${task.focus}</p></div><div class="classroom-meta"><span>${I.T(`Grades ${task.band === "Both" ? "3–8" : task.band.replace("-", "–")}`, `Grados ${task.band === "Both" ? "3–8" : task.band.replace("-", "–")}`)}</span><span>${I.T("Original classroom practice", "Práctica de clase original")}</span></div></section>
      <div class="classroom-grid">
        <section class="classroom-panel classroom-context"><div class="classroom-step"><span>01</span><div><h3>${I.T("Set the scene", "Presente la situación")}</h3><p>${task.context}</p></div></div>
          ${task.audio ? html`<div class="classroom-audio"><div class="sound-icon" aria-hidden="true">${icon("listening")}</div><div><strong>${I.T("Listen together", "Escuchar juntos")}</strong><span>${I.T("Browser speech · replay as needed", "Voz del navegador · repita cuando haga falta")}</span></div><button type="button" class="btn btn-primary" data-say="${task.audio}" aria-label="${I.S("Play or replay original listening script", "Reproducir o repetir el guion original de escucha")}">${icon("play")} ${I.T("Play / replay", "Reproducir / repetir")}</button><button type="button" class="btn" data-stop-audio>${icon("stop")} ${I.T("Stop", "Detener")}</button></div>` : ""}
          <h3 class="classroom-section-title">${task.audio ? I.T("Listening notes and source cards", "Notas de escucha y tarjetas de fuentes") : I.T("Read and mark the evidence", "Lea y marque la evidencia")}</h3><p class="classroom-instruction">${I.T("Select source cards to highlight evidence. Select again to clear. These marks stay in this tab only.", "Seleccione las tarjetas de fuentes para resaltar la evidencia. Selecciónelas de nuevo para quitar la marca. Las marcas se quedan solo en esta pestaña.")}</p><div class="classroom-sources">${sourceCards(task)}</div>
          <label class="classroom-note-label">${I.T("Class idea / teacher annotation", "Idea de la clase / anotación docente")}<textarea data-class-note rows="2" placeholder="${I.S("Capture a shared idea (no student names or personal details)", "Anote una idea compartida (sin nombres de estudiantes ni datos personales)")}">${state.note}</textarea></label>
        </section>
        <section class="classroom-panel classroom-work"><div class="classroom-step"><span>02</span><div><h3>${I.T("Reconstruct the idea", "Reconstruya la idea")}</h3><p>${I.T("Use the sentence pieces to build a clear explanation. Move pieces with the arrows; no dragging is required.", "Use las piezas de oraciones para armar una explicación clara. Mueva las piezas con las flechas; no hace falta arrastrar.")}</p></div></div>
          <ol class="classroom-sentences" aria-label="${I.S("Reorder sentence pieces", "Reordenar las piezas de oraciones")}">${sentenceRows(task)}</ol>
          <div class="classroom-actions"><button type="button" class="btn btn-primary" data-class-check>${I.T("Check the sequence", "Revisar la secuencia")}</button><button type="button" class="btn" data-class-reset>${I.T("Reset pieces", "Reiniciar las piezas")}</button></div>
          ${state.checked ? html`<div class="classroom-feedback ${correctlyOrdered ? "is-good" : "is-coach"}" role="status"><strong>${icon(correctlyOrdered ? "check" : "bulb")} ${correctlyOrdered ? I.T("That sequence is coherent.", "Esa secuencia es coherente.") : I.T("Try a different relationship.", "Pruebe otra relación.")}</strong><span>${correctlyOrdered ? I.T("Now explain why the order makes sense.", "Ahora expliquen por qué tiene sentido ese orden.") : I.T("Look for the sentence that introduces the idea, then connect evidence and explanation.", "Busquen la oración que presenta la idea y luego conecten la evidencia y la explicación.")}</span></div>` : ""}
          ${state.supports ? html`<aside class="classroom-scaffold"><strong>${icon("bulb")} ${I.T("Strategy support", "Apoyo de estrategia")}</strong><p>${task.scaffold}</p><div class="classroom-vocab">${task.vocabulary.map((word) => html`<span>${word}</span>`)}</div></aside>` : ""}
        </section>
      </div>
      ${state.revealed ? revealHTML(task) : html`<section class="classroom-closed" aria-live="polite"><span>03</span><p>${I.T("Question, model response, and independent transfer are hidden.", "La pregunta, la respuesta modelo y la aplicación independiente están ocultas.")}</p><button class="btn" type="button" data-class-reveal>${I.T("Reveal when ready", "Mostrar cuando esté listo")}</button></section>`}
      <footer class="classroom-footer"><span>${I.T("Teacher-led routine · Anonymous by default · No response collection", "Rutina dirigida por el docente · Anónima por defecto · No se recogen respuestas")}</span><span>${I.T("EduWonderLab original practice · Not an official WIDA assessment", "Práctica original de EduWonderLab · No es una evaluación oficial de WIDA")}</span></footer>
    </div>` };
}

export async function onChange(e, ctx) {
  if (e.target.matches("[data-class-routine]")) { state.routine = e.target.value; state.selected = new Set(); state.order = []; state.checked = false; ctx.rerender(); return true; }
  if (e.target.matches("[data-class-size]")) { state.size = e.target.value; ctx.rerender(); return true; }
  if (e.target.matches("[data-class-note]")) { state.note = e.target.value; return true; }
  return false;
}

export async function onClick(e, ctx) {
  const b = e.target.closest("button");
  if (!b) return false;
  if (b.hasAttribute("data-say") || b.hasAttribute("data-stop-audio")) return false;
  const task = active(ctx.band);
  if (b.hasAttribute("data-class-source")) { const i = Number(b.dataset.classSource); state.selected.has(i) ? state.selected.delete(i) : state.selected.add(i); }
  else if (b.hasAttribute("data-class-support")) state.supports = !state.supports;
  else if (b.hasAttribute("data-class-reveal")) state.revealed = !state.revealed;
  else if (b.hasAttribute("data-class-compare")) state.compare = !state.compare;
  else if (b.hasAttribute("data-class-print")) { window.print(); return true; }
  else if (b.hasAttribute("data-class-check")) state.checked = true;
  else if (b.hasAttribute("data-class-reset")) { state.order = task.sentence.map((_, i) => i); state.checked = false; }
  else if (b.hasAttribute("data-class-move")) { const at = Number(b.dataset.classMove); state.order = move(state.order, at, at + Number(b.dataset.direction)); state.checked = false; }
  else return false;
  ctx.rerender(); return true;
}

export const classroomStudioInternals = { routineForBand, isCorrectOrder, move };
