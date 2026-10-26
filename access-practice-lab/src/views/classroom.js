// Projector-friendly whole-class studio. Session annotations are in-memory only.
import { crumbsHTML } from "../components.js";
import { BASE, DOMAIN_META, html, icon } from "../util.js";
import { CLASSROOM_ROUTINES, isCorrectOrder, routineForBand } from "./classroom-data.js";

const state = { routine: "", supports: true, revealed: false, size: "large", selected: new Set(), order: [], checked: false, compare: false, note: "" };
const escAttr = (value) => String(value ?? "");
function active(band) {
  const rows = routineForBand(band);
  return rows.find((r) => r.id === state.routine) || rows[0] || CLASSROOM_ROUTINES[0];
}
function option(r, selected) { return html`<option value="${r.id}" ${r.id === selected ? "selected" : ""}>${r.title} · ${r.domain}</option>`; }
function move(arr, from, to) { const next = [...arr]; if (to < 0 || to >= next.length) return next; [next[from], next[to]] = [next[to], next[from]]; return next; }

const PHASES = [
  ["listening", "Listen"],
  ["evidence", "Notice"],
  ["conversation", "Explain"],
];

function sourceCards(task) {
  return task.sources.map(
    (source, i) => html`<button type="button" class="classroom-source ${state.selected.has(i) ? "is-marked" : ""}" data-class-source="${i}" aria-pressed="${state.selected.has(i)}">
      <span class="classroom-source-number">Source ${i + 1}${state.selected.has(i) ? html` · ${icon("check")} Marked` : ""}</span>
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
        <button class="btn classroom-move is-up" type="button" data-class-move="${position}" data-direction="-1" aria-label="Move sentence up" ${position === 0 ? "disabled" : ""}>${icon("chevron-down")}</button>
        <button class="btn classroom-move" type="button" data-class-move="${position}" data-direction="1" aria-label="Move sentence down" ${position === last ? "disabled" : ""}>${icon("chevron-down")}</button>
      </span>
    </li>`,
  );
}

function revealHTML(task) {
  return html`<section class="classroom-reveal"><div class="classroom-step"><span>03</span><div><h3>Discuss, compare, and transfer</h3><p>Invite more than one interpretation, then compare reasoning with the sample. A model is one possible response.</p></div></div>
    <div class="classroom-reveal-grid">
      <article class="classroom-question"><span class="eyebrow">Discussion question</span><h3>${task.question}</h3><button type="button" class="btn" data-say="${task.question}">${icon("volume")} Read question aloud</button></article>
      <article class="classroom-model"><span class="eyebrow">One possible model</span><p>${task.model}</p></article>
    </div>
    <div class="classroom-compare"><div><h3>Compare responses</h3><p>What does the model include that our first idea did not? What could we improve?</p></div><button type="button" class="btn" data-class-compare aria-pressed="${state.compare}">${state.compare ? "Hide comparison lens" : "Show comparison lens"}</button></div>
    ${
      state.compare
        ? html`<div class="classroom-compare-grid"><article><span class="eyebrow">First think</span><p>State an idea or claim.</p></article><article><span class="eyebrow">Model response</span><p>${task.model}</p></article><article><span class="eyebrow">Look for</span><p>Notice the evidence, connection words, and explanation that make the response understandable.</p></article></div>`
        : ""
    }
    <article class="classroom-transfer"><span class="eyebrow">Independent transfer</span><h3>Try the thinking with a new situation</h3><p>${task.transfer}</p><p class="fine">Students can respond orally, write on paper, or discuss with a partner. This studio does not retain responses.</p></article></section>`;
}

export async function render(ctx) {
  const rows = routineForBand(ctx.band);
  const task = active(ctx.band);
  if (state.routine !== task.id) { state.routine = task.id; state.selected = new Set(); state.order = task.sentence.map((_, i) => i); state.checked = false; state.revealed = false; state.note = ""; }
  const correctlyOrdered = isCorrectOrder(state.order, task.answer);
  const domainIcon = DOMAIN_META[task.domain]?.icon || "classroom";
  return { title: `Whole-Class Language Studio · ${task.title}`, html: html`${crumbsHTML([["Lab", `${BASE}/?grades=${ctx.band}`], ["Whole-Class Studio", null]])}
    <div class="classroom-studio classroom-size-${state.size} d-${task.domain.toLowerCase()}">
      <header class="classroom-hero"><div><p class="eyebrow">${icon("classroom")} Project and explore · Grades ${ctx.band.replace("-", "–")}</p><h1 tabindex="-1">Whole-Class Language Studio</h1><p class="classroom-lead">Guide a brief listen, read, discuss, and revise routine. Reveal prompts and models when your class is ready.</p></div><ol class="classroom-hero-mark" aria-label="Routine">${PHASES.map(([ic, label]) => html`<li>${icon(ic)} ${label}</li>`)}</ol></header>
      <section class="classroom-toolbar" aria-label="Studio controls"><label>Class routine<select data-class-routine>${rows.map((r) => option(r, task.id))}</select></label><label>Display size<select data-class-size><option value="large" ${state.size === "large" ? "selected" : ""}>Projector</option><option value="regular" ${state.size === "regular" ? "selected" : ""}>Standard</option></select></label><button type="button" class="btn" data-class-support aria-pressed="${state.supports}">${state.supports ? "Hide scaffolds" : "Show scaffolds"}</button><button type="button" class="btn" data-class-reveal aria-expanded="${state.revealed}">${state.revealed ? "Hide question & model" : "Reveal question & model"}</button><button type="button" class="btn" data-class-print>${icon("print")} Print routine</button></section>
      <section class="classroom-task-head"><div><span class="classroom-domain">${icon(domainIcon)} ${task.domain} · ${task.use}</span><h2>${task.title}</h2><p>${task.focus}</p></div><div class="classroom-meta"><span>Grades ${task.band === "Both" ? "3–8" : task.band.replace("-", "–")}</span><span>Original classroom practice</span></div></section>
      <div class="classroom-grid">
        <section class="classroom-panel classroom-context"><div class="classroom-step"><span>01</span><div><h3>Set the scene</h3><p>${task.context}</p></div></div>
          ${task.audio ? html`<div class="classroom-audio"><div class="sound-icon" aria-hidden="true">${icon("listening")}</div><div><strong>Listen together</strong><span>Browser speech · replay as needed</span></div><button type="button" class="btn btn-primary" data-say="${task.audio}" aria-label="Play or replay original listening script">${icon("play")} Play / replay</button><button type="button" class="btn" data-stop-audio>${icon("stop")} Stop</button></div>` : ""}
          <h3 class="classroom-section-title">${task.audio ? "Listening notes and source cards" : "Read and mark the evidence"}</h3><p class="classroom-instruction">Select source cards to highlight evidence. Select again to clear. These marks stay in this tab only.</p><div class="classroom-sources">${sourceCards(task)}</div>
          <label class="classroom-note-label">Class idea / teacher annotation<textarea data-class-note rows="2" placeholder="Capture a shared idea (no student names or personal details)">${state.note}</textarea></label>
        </section>
        <section class="classroom-panel classroom-work"><div class="classroom-step"><span>02</span><div><h3>Reconstruct the idea</h3><p>Use the sentence pieces to build a clear explanation. Move pieces with the arrows; no dragging is required.</p></div></div>
          <ol class="classroom-sentences" aria-label="Reorder sentence pieces">${sentenceRows(task)}</ol>
          <div class="classroom-actions"><button type="button" class="btn btn-primary" data-class-check>Check the sequence</button><button type="button" class="btn" data-class-reset>Reset pieces</button></div>
          ${state.checked ? html`<div class="classroom-feedback ${correctlyOrdered ? "is-good" : "is-coach"}" role="status"><strong>${icon(correctlyOrdered ? "check" : "bulb")} ${correctlyOrdered ? "That sequence is coherent." : "Try a different relationship."}</strong><span>${correctlyOrdered ? "Now explain why the order makes sense." : "Look for the sentence that introduces the idea, then connect evidence and explanation."}</span></div>` : ""}
          ${state.supports ? html`<aside class="classroom-scaffold"><strong>${icon("bulb")} Strategy support</strong><p>${task.scaffold}</p><div class="classroom-vocab">${task.vocabulary.map((word) => html`<span>${word}</span>`)}</div></aside>` : ""}
        </section>
      </div>
      ${state.revealed ? revealHTML(task) : html`<section class="classroom-closed" aria-live="polite"><span>03</span><p>Question, model response, and independent transfer are hidden.</p><button class="btn" type="button" data-class-reveal>Reveal when ready</button></section>`}
      <footer class="classroom-footer"><span>Teacher-led routine · Anonymous by default · No response collection</span><span>EduWonderLab original practice · Not an official WIDA assessment</span></footer>
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
