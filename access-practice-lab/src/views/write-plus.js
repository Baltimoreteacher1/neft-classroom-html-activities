// Writing Studio, the parts around the draft: where a writer left off, finding a task, a self-check before feedback,
// live counts while typing, frames / words / evidence that drop into the draft, and the planning notes a teacher sees.
// Nothing here scores writing. Counts describe the page (words, sentences, versions); the self-check is the writer's
// own. "On my own" gets a proofreading check only, never the structure of the response, so an independent attempt
// stays independent. Teacher notes render only in Teacher view and reuse what the task already carries.
import { readAudience } from "../audience.js";
import { revealFoldsFor } from "../fold.js";
import { sentences as splitSentences } from "../lang/text.js";
import { cancelDictation, dictationControlsHTML, toggleDictation } from "../dictation-ui.js";
import { speak } from "../speech.js";
import { addVersion, writingState } from "../lang/studio.js";
import { disclosure } from "../studio-ui.js";
import { BASE, announce, formatDate, html, icon, raw, toHtml, todayISO, wordCount } from "../util.js";

const IGN = raw("data-nsr-ignore");
export const isTeacherView = () => readAudience() === "teacher";

// ── what a writer has done ───────────────────────────────────────────────────────────────────
/** "new" | "draft" (words or a plan, no feedback yet) | "feedback" (asked for feedback, not finished) | "done". */
export function taskStatus(w) {
  if (!w) return { id: "new", words: 0 };
  const text = w.draft ?? w.versions?.at(-1)?.text ?? "";
  const words = wordCount(text);
  if (w.finishedAt) return { id: "done", words };
  if (w.versions?.length) return { id: "feedback", words };
  const planned = Object.values(w.organizer || {}).some(Boolean) || (w.evidence || []).length > 0;
  return { id: words || planned ? "draft" : "new", words };
}

/** Totals over the given task ids: counts of what is on this device, never a judgment of it. */
export function studioStats(studio, ids) {
  const out = { started: 0, finished: 0, words: 0, revisions: 0 };
  for (const id of ids) {
    const w = studio.writing?.[id];
    const st = taskStatus(w);
    if (st.id === "new") continue;
    out.started += 1;
    out.words += st.words;
    if (st.id === "done") out.finished += 1;
    out.revisions += (w.versions || []).filter((v) => v.kind === "revision").length;
  }
  return out;
}

/** The unfinished piece touched most recently, or null. */
export function resumeTask(studio, tasks) {
  return (
    tasks
      .map((t) => ({ task: t, w: studio.writing?.[t.id], st: taskStatus(studio.writing?.[t.id]) }))
      .filter((r) => r.st.id === "draft" || r.st.id === "feedback")
      .sort((a, b) => String(b.w.updatedAt || "").localeCompare(String(a.w.updatedAt || "")))[0] || null
  );
}

/** Words, sentences and paragraphs in a draft. */
export function draftStats(text) {
  const t = String(text || "");
  return {
    words: wordCount(t),
    sentences: t.trim() ? splitSentences(t).length : 0,
    paragraphs: t.split(/\n\s*\n|\n/).filter((p) => p.trim()).length,
  };
}

const STATUS = {
  draft: ["writing", "In progress", "En progreso"],
  feedback: ["retry", "Ready to revise", "Listo para revisar"],
  done: ["check", "In my portfolio", "En mi portafolio"],
};
export function statusBadgeHTML(I, st) {
  const s = STATUS[st.id];
  if (!s) return "";
  return html`<span class="task-status is-${st.id}">${icon(s[0])} ${I.T(s[1], s[2])}${st.id !== "done" && st.words ? html` · ${I.T(`${st.words} words`, `${st.words} palabras`)}` : ""}</span>`;
}

// ── chooser: my writing, find a task ─────────────────────────────────────────────────────────
export function myWritingHTML(I, ctx, tasks, studio) {
  const stats = studioStats(studio, tasks.map((t) => t.id));
  if (!stats.started) return "";
  const r = resumeTask(studio, tasks);
  const stat = (n, en, es) => html`<li><strong>${n}</strong><span>${I.T(en, es)}</span></li>`;
  return html`<section class="my-writing panel" aria-labelledby="wrt-mine-h">
    <div class="my-writing-main">
      <h2 id="wrt-mine-h">${icon("bookmark")} ${I.T("My writing", "Mi escritura")}</h2>
      ${
        r
          ? html`<a class="resume-card" href="${BASE}/write/${r.task.id}?grades=${ctx.band}">
              <span class="resume-kicker">${r.st.id === "feedback" ? I.T("Keep revising", "Sigue revisando") : I.T("Keep writing", "Sigue escribiendo")}</span>
              <strong>${r.task.title}</strong>
              <span class="fine">${r.st.words ? I.T(`${r.st.words} words so far`, `${r.st.words} palabras hasta ahora`) : I.T("Your plan is saved", "Tu plan está guardado")}${r.w.updatedAt ? html` · ${formatDate(todayISO(new Date(r.w.updatedAt)))}` : ""}</span>
              ${icon("arrow-right")}
            </a>`
          : html`<p class="fine">${I.T("You finished everything you started. Great work! Pick a new task below.", "Terminaste todo lo que empezaste. ¡Muy buen trabajo! Elige una tarea nueva abajo.")}</p>`
      }
    </div>
    <ul class="writer-stats" aria-label="${I.S("What you have written on this device", "Lo que has escrito en este dispositivo")}">
      ${stat(stats.started, stats.started === 1 ? "piece started" : "pieces started", stats.started === 1 ? "texto empezado" : "textos empezados")}
      ${stat(stats.finished, "in my portfolio", "en mi portafolio")}
      ${stat(stats.words, "words written", "palabras escritas")}
      ${stat(stats.revisions, stats.revisions === 1 ? "revision" : "revisions", stats.revisions === 1 ? "revisión" : "revisiones")}
    </ul>
    <p class="fine my-writing-note">${I.T("This shows how much you have practiced here. It is not a score.", "Esto muestra cuánto has practicado aquí. No es una puntuación.")}</p>
  </section>`;
}

const filter = { q: "", subject: "", use: "", status: "" };
const uniq = (xs) => [...new Set(xs.filter(Boolean))].sort();

export function filterBarHTML(I, tasks, anyStarted) {
  const select = (key, label, labelEs, options) =>
    html`<label class="field find-field"><span>${I.T(label, labelEs)}</span>
      <select data-wrt-filter="${key}" ${IGN}>
        <option value="">${I.S("All", "Todos")}</option>
        ${options.map(([v, text]) => html`<option value="${v}" ${filter[key] === v ? raw("selected") : ""}>${text}</option>`)}
      </select></label>`;
  return html`<div class="find-task panel no-print" role="search" aria-label="${I.S("Find a writing task", "Buscar una tarea de escritura")}" data-wrt-find>
    <label class="field find-field find-q"><span>${icon("search")} ${I.T("Find a task", "Buscar una tarea")}</span>
      <input type="search" data-wrt-filter="q" value="${filter.q}" placeholder="${I.S("Try: garden, letter, science", "Prueba: jardín, carta, ciencias")}" autocomplete="off" ${IGN} /></label>
    ${select("subject", "Subject", "Materia", uniq(tasks.map((t) => t.contentArea)).map((v) => [v, v]))}
    ${select("use", "Purpose", "Propósito", uniq(tasks.map((t) => t.keyUse)).map((v) => [v, v]))}
    ${
      anyStarted
        ? select("status", "My progress", "Mi progreso", [
            ["new", I.S("Not started", "Sin empezar")],
            ["draft", I.S("In progress", "En progreso")],
            ["feedback", I.S("Ready to revise", "Listo para revisar")],
            ["done", I.S("In my portfolio", "En mi portafolio")],
          ])
        : ""
    }
    <button type="button" class="btn small" data-wrt-clear hidden>${icon("x")} ${I.T("Clear", "Borrar")}</button>
    <p class="find-count fine" data-wrt-count role="status"></p>
  </div>`;
}

/** Card attributes the filter reads. */
export const cardData = (task, st) => ({
  wrt: task.id,
  subject: task.contentArea || "",
  use: task.keyUse || "",
  status: st.id,
  text: `${task.title} ${task.form} ${task.contentArea} ${task.keyUse} ${task.scenario || ""}`.toLowerCase(),
});

export function matches(d, f) {
  return (
    (!f.subject || d.subject === f.subject) &&
    (!f.use || d.use === f.use) &&
    (!f.status || d.status === f.status) &&
    (!f.q.trim() || f.q.toLowerCase().trim().split(/\s+/).every((w) => d.text.includes(w)))
  );
}

/** Show the cards that match; fold open the groups that hold them; say how many. */
export function applyFilter(root, I) {
  const form = root.querySelector("[data-wrt-find]");
  if (!form) return;
  const active = Boolean(filter.q.trim() || filter.subject || filter.use || filter.status);
  let shown = 0;
  let total = 0;
  for (const group of root.querySelectorAll(".task-group")) {
    const isNext = group.classList.contains("is-next");
    let inGroup = 0;
    for (const card of group.querySelectorAll(".task-card[data-wrt]")) {
      const ok = !active || matches(card.dataset, filter);
      card.hidden = !ok;
      if (isNext) continue;
      total += 1;
      if (ok) {
        shown += 1;
        inGroup += 1;
      }
    }
    group.hidden = active && (isNext || !inGroup);
    if (active && inGroup) revealFoldsFor(group.querySelector(".task-card:not([hidden])"));
  }
  form.querySelector("[data-wrt-clear]").hidden = !active;
  form.querySelector("[data-wrt-count]").textContent = active
    ? shown
      ? I.S(`Showing ${shown} of ${total} tasks`, `Mostrando ${shown} de ${total} tareas`)
      : I.S("No task matches. Try fewer words or clear the filters.", "Ninguna tarea coincide. Prueba con menos palabras o borra los filtros.")
    : "";
}

// ── the draft: self-check, counts, inserting ─────────────────────────────────────────────────
const CHECKS = {
  cer: [
    ["claim", "My first sentence answers the question.", "Mi primera oración responde la pregunta."],
    ["evidence", "I used a fact or a number from the sources.", "Usé un dato o un número de las fuentes."],
    ["reason", "I explained why my evidence supports my claim.", "Expliqué por qué mi evidencia apoya mi afirmación."],
    ["reader", "A reader who did not see the sources would understand.", "Un lector que no vio las fuentes lo entendería."],
  ],
  paragraph: [
    ["main", "My first sentence tells my main idea.", "Mi primera oración dice mi idea principal."],
    ["details", "Each sentence after it supports that idea.", "Cada oración que sigue apoya esa idea."],
    ["link", "I used words that connect my ideas.", "Usé palabras que conectan mis ideas."],
    ["end", "My last sentence closes the paragraph.", "Mi última oración cierra el párrafo."],
  ],
  essay: [
    ["intro", "My introduction tells what the essay is about.", "Mi introducción dice de qué trata el ensayo."],
    ["body", "Each paragraph has one main idea.", "Cada párrafo tiene una idea principal."],
    ["evidence", "I used facts or details from the sources.", "Usé datos o detalles de las fuentes."],
    ["end", "My conclusion returns to my main point.", "Mi conclusión regresa a mi punto principal."],
  ],
  letter: [
    ["greet", "I greeted my reader and I signed my name.", "Saludé a mi lector y firmé con mi nombre."],
    ["purpose", "I said why I am writing near the start.", "Dije por qué escribo cerca del inicio."],
    ["reasons", "I gave reasons or details my reader needs.", "Di razones o detalles que mi lector necesita."],
    ["tone", "My words are polite for this reader.", "Mis palabras son amables para este lector."],
  ],
  report: [
    ["topic", "I named my topic at the start.", "Nombré mi tema al inicio."],
    ["facts", "My facts come from the sources.", "Mis datos vienen de las fuentes."],
    ["order", "My facts are in an order that makes sense.", "Mis datos están en un orden que tiene sentido."],
    ["own", "I used my own words, not copied sentences.", "Usé mis propias palabras, no oraciones copiadas."],
  ],
  summary: [
    ["main", "I told the main idea of the text.", "Dije la idea principal del texto."],
    ["key", "I kept only the most important details.", "Dejé solo los detalles más importantes."],
    ["own", "I used my own words.", "Usé mis propias palabras."],
    ["opinion", "I left out my opinion.", "No incluí mi opinión."],
  ],
  narrative: [
    ["order", "My story has a beginning, a middle and an end.", "Mi historia tiene inicio, desarrollo y final."],
    ["time", "I used words that show time order.", "Usé palabras que muestran el orden del tiempo."],
    ["detail", "I added a detail the reader can see, hear or feel.", "Agregué un detalle que el lector puede ver, oír o sentir."],
    ["tense", "My verbs stay in the same tense.", "Mis verbos se mantienen en el mismo tiempo."],
  ],
};
CHECKS.email = CHECKS.letter;
// "On my own": proofreading only. It names no part of the response.
const OWN_CHECKS = [
  ["task", "I reread the task and my writing answers it.", "Volví a leer la tarea y mi escritura la responde."],
  ["aloud", "I read my writing aloud and it sounds right.", "Leí mi escritura en voz alta y suena bien."],
  ["marks", "My sentences start with capital letters and end with punctuation.", "Mis oraciones empiezan con mayúscula y terminan con puntuación."],
];
export const checksFor = (task, stage) => (stage === "independent" ? OWN_CHECKS : CHECKS[task.form] || CHECKS.paragraph);

export function checklistHTML(I, task, state, stage) {
  const items = checksFor(task, stage);
  const on = state.checks || {};
  const n = items.filter(([id]) => on[id]).length;
  return html`<fieldset class="self-check" data-self-check>
    <legend>${icon("check")} ${I.T("Check your writing", "Revisa tu escritura")} <span class="fine" data-check-count>${I.T(`${n} of ${items.length}`, `${n} de ${items.length}`)}</span></legend>
    <ul>
      ${items.map(([id, en, es]) => html`<li><label><input type="checkbox" data-self-check-item="${id}" ${on[id] ? raw("checked") : ""} ${IGN} /> <span>${I.T(en, es)}</span></label></li>`)}
    </ul>
    <p class="fine">${I.T("Tick what you did. Then press Get feedback.", "Marca lo que hiciste. Después presiona Obtener comentarios.")}</p>
  </fieldset>`;
}

export function statsLineHTML(I, text) {
  const s = draftStats(text);
  return html`<span class="draft-stats" data-draft-stats>${statsText(I, s)}</span>`;
}
export const statsText = (I, s) =>
  I.S(
    `${s.sentences} ${s.sentences === 1 ? "sentence" : "sentences"} · ${s.paragraphs} ${s.paragraphs === 1 ? "paragraph" : "paragraphs"}`,
    `${s.sentences} ${s.sentences === 1 ? "oración" : "oraciones"} · ${s.paragraphs} ${s.paragraphs === 1 ? "párrafo" : "párrafos"}`,
  );

/** Text to add at the caret, with the spaces a writer would type. Pure, so it is tested without a browser. */
export function insertion(value, start, end, text) {
  const before = value.slice(0, start);
  const after = value.slice(end);
  const lead = before && !/\s$/.test(before) ? " " : "";
  const trail = after && !/^[\s.,;:!?]/.test(after) ? " " : "";
  const next = before + lead + text + trail + after;
  const at = before.length + lead.length;
  const blank = text.indexOf("___");
  return blank >= 0
    ? { value: next, selStart: at + blank, selEnd: at + blank + 3 }
    : { value: next, selStart: at + text.length + trail.length, selEnd: at + text.length + trail.length };
}

/** Put a frame, a word or a quotation into the draft at the caret; a frame's first blank is selected to type over. */
export function insertIntoDraft(text, I) {
  const box = document.querySelector("[data-draft]");
  if (!box) return false;
  const atEnd = document.activeElement !== box && box.selectionStart === 0 && box.selectionEnd === 0;
  const start = atEnd ? box.value.length : box.selectionStart;
  const end = atEnd ? box.value.length : box.selectionEnd;
  const r = insertion(box.value, start, end, text);
  box.value = r.value;
  box.focus();
  box.setSelectionRange(r.selStart, r.selEnd);
  box.dispatchEvent(new Event("input", { bubbles: true }));
  announce(I.S("Added to your writing.", "Agregado a tu escritura."), { toast: false });
  return true;
}

/** One short, kind line about how far the draft has come. It describes length only. */
export function cheer(words, min) {
  if (!words) return ["", ""];
  const part = words / min;
  if (part >= 1) return ["You have enough words. Read it again.", "Ya tienes suficientes palabras. Léelo otra vez."];
  if (part >= 0.6) return ["Almost there. Keep going.", "Ya casi. Sigue así."];
  if (part >= 0.25) return ["You are on your way.", "Vas por buen camino."];
  return ["Good start.", "Buen comienzo."];
}
export const cheerHTML = (I, words, min) =>
  html`<span class="goal-met" data-cheer>${words ? html`${icon(words >= min ? "check" : "sparkle")} ${I.T(...cheer(words, min))}` : ""}</span>`;

const goalAnnounced = new Set();
/** Called on every keystroke in the draft: sentence and paragraph counts, the saved stamp and the goal mark. */
export function onDraftTyped(I, task, text) {
  const s = draftStats(text);
  refreshTopicWords(I, task, text);
  const line = document.querySelector("[data-draft-stats]");
  if (line) line.textContent = statsText(I, s);
  const stamp = document.querySelector("[data-saved-stamp]");
  if (stamp) stamp.textContent = I.S("Saved", "Guardado");
  const meter = document.querySelector(".editor-panel .meter");
  const met = s.words >= task.expected.minWords;
  meter?.classList.toggle("is-met", met);
  const cheerEl = document.querySelector("[data-cheer]");
  // Same words as the first render; the icon comes back on the next render.
  if (cheerEl && cheerEl.dataset.words !== cheer(s.words, task.expected.minWords)[0]) {
    cheerEl.dataset.words = cheer(s.words, task.expected.minWords)[0];
    cheerEl.textContent = I.S(...cheer(s.words, task.expected.minWords));
  }
  if (met && !goalAnnounced.has(task.id)) {
    goalAnnounced.add(task.id);
    announce(I.S("You have enough words. Read it again, then press Get feedback.", "Ya tienes suficientes palabras. Léelo otra vez y presiona Obtener comentarios."));
  }
  if (!met) goalAnnounced.delete(task.id);
}
/** A writer who opens a draft that is already long enough is not told again. */
export const primeGoal = (task, text) => {
  if (wordCount(text) >= task.expected.minWords) goalAnnounced.add(task.id);
};

/**
 * "What do I do now?" in one sentence, with one button. It follows what is saved (evidence, plan, words, feedback,
 * finish) and points at a place on the page; it never says anything about the writing itself.
 */
export function nextStepHTML(I, ctx, task, state, text, analyzed) {
  const words = wordCount(text);
  const read = (state.evidence || []).length > 0;
  const planned = Object.values(state.organizer || {}).some(Boolean);
  const step = (n, en, es, href, btnEn, btnEs) => ({ n, en, es, href, btnEn, btnEs });
  let s;
  if (state.finishedAt)
    s = step(5, "You finished this piece. Great work! It is in your portfolio.", "Terminaste este texto. ¡Muy buen trabajo! Está en tu portafolio.", `${BASE}/write?tab=portfolio&grades=${ctx.band}`, "See my portfolio", "Ver mi portafolio");
  else if (analyzed && state.versions.length >= 2)
    s = step(5, "Nice revising! Tell what you made better. Then save your writing.", "¡Buena revisión! Di qué mejoraste. Después guarda tu escritura.", "#wrt-finish", "Go to Finish", "Ir a Terminar");
  else if (analyzed)
    s = step(4, "Read your feedback. Change one thing in your writing. Then ask again.", "Lee tus comentarios. Cambia una cosa en tu escritura. Después vuelve a pedirlos.", "#wrt-feedback", "Read my feedback", "Leer mis comentarios");
  else if (words >= task.expected.minWords)
    s = step(3, "You have enough words. Check your writing. Then press Get feedback.", "Ya tienes suficientes palabras. Revisa tu escritura. Después presiona Obtener comentarios.", "#wrt-write", "Go to my writing", "Ir a mi escritura");
  else if (words >= 4)
    s = step(3, "Keep writing. Use your plan to help you.", "Sigue escribiendo. Usa tu plan para ayudarte.", "#wrt-write", "Go to my writing", "Ir a mi escritura");
  else if (planned)
    s = step(3, "Your plan is ready. Now write your sentences.", "Tu plan está listo. Ahora escribe tus oraciones.", "#wrt-write", "Start writing", "Empezar a escribir");
  else if (read)
    s = step(2, "Good reading! Now make a plan. Short notes are fine.", "¡Buena lectura! Ahora haz un plan. Las notas cortas están bien.", "#wrt-plan", "Go to my plan", "Ir a mi plan");
  else
    s = step(1, "Start here: read the sources. Tap a sentence you want to use.", "Empieza aquí: lee las fuentes. Toca una oración que quieras usar.", "#wrt-sources", "Start reading", "Empezar a leer");
  return html`<aside class="next-step ${state.finishedAt ? "is-done" : ""}" aria-label="${I.S("What to do now", "Qué hacer ahora")}">
    <span class="next-step-n">${state.finishedAt ? icon("star") : html`<span class="visually-hidden">${I.T("Step", "Paso")} </span>${s.n}`}</span>
    <p><strong>${I.T("What to do now", "Qué hacer ahora")}</strong> ${I.T(s.en, s.es)}</p>
    <a class="btn btn-primary" href="${s.href}">${I.T(s.btnEn, s.btnEs)} ${icon("arrow-right")}</a>
  </aside>`;
}

const REFLECT = [
  ["I added ", "Agregué "],
  ["I changed ___ because ", "Cambié ___ porque "],
  ["My writing is clearer now because ", "Mi escritura es más clara ahora porque "],
  ["Next time I will ", "La próxima vez voy a "],
];
/** Ways to begin the reflection. A tap puts the words in the box; the writer finishes the thought. */
export const reflectStartersHTML = (I) =>
  html`<p class="reflect-starters"><span class="fine">${I.T("Need a way to start? Tap one:", "¿Necesitas cómo empezar? Toca una:")}</span>
    ${REFLECT.map(([en, es]) => html`<button type="button" class="insert-chip" data-reflect-start="${I.S(en, es)}">${I.T(`${en.trim()}…`, `${es.trim()}…`)}</button>`)}</p>`;

export function startReflection(start) {
  const box = document.querySelector("[data-reflection]");
  if (!box) return false;
  const r = insertion(box.value, box.value.length, box.value.length, start);
  box.value = r.value;
  box.focus();
  box.setSelectionRange(r.selStart, r.selEnd);
  box.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}

// ── pictures: the plan as a map, a table as bars ─────────────────────────────────────────────
/** The task's own planning boxes as a path. A stop fills in when its box has a note. */
export function planMapHTML(I, task, state) {
  const slots = task.organizer || [];
  if (slots.length < 2) return "";
  return html`<ol class="plan-map" aria-label="${I.S("Map of your writing", "Mapa de tu escritura")}" data-plan-map>
    ${slots.map((slot, i) => html`<li class="${state.organizer?.[slot.id] ? "is-filled" : ""}" data-map-slot="${slot.id}"><span class="map-n">${i + 1}</span><span class="map-l">${slot.label}</span><span class="map-check">${icon("check")}<span class="visually-hidden"> ${I.T("(planned)", "(planeado)")}</span></span></li>`)}
  </ol>`;
}
export function onPlanTyped(slotId, value) {
  document.querySelector(`[data-map-slot="${CSS.escape(slotId)}"]`)?.classList.toggle("is-filled", Boolean(value.trim()));
}

/**
 * Numbers in a source table as { unit, max, cols, rows:[{label, values}] }, or null when the table is not plain
 * numbers in one unit ("410 grams", "95 grams"). Nothing is computed beyond reading the cells.
 */
export function tableSeries(table) {
  const headers = table?.headers || [];
  const rows = table?.rows || [];
  if (headers.length < 2 || headers.length > 4 || !rows.length || rows.length > 8) return null;
  const units = new Set();
  const out = [];
  for (const row of rows) {
    if (row.length !== headers.length) return null;
    const values = [];
    for (const cell of row.slice(1)) {
      const m = /^\$?(-?\d[\d,]*(?:\.\d+)?)\s*(%|[A-Za-z°][A-Za-z° ]*)?$/.exec(String(cell).trim());
      if (!m) return null;
      const n = Number(m[1].replace(/,/g, ""));
      if (!Number.isFinite(n) || n < 0) return null;
      units.add(String(cell).trim().startsWith("$") ? "$" : (m[2] || "").trim().toLowerCase().replace(/s$/, ""));
      values.push({ n, text: String(cell).trim() });
    }
    out.push({ label: String(row[0]), values });
  }
  if (units.size !== 1) return null;
  const max = Math.max(...out.flatMap((r) => r.values.map((v) => v.n)));
  return max > 0 ? { max, cols: headers.slice(1), rows: out } : null;
}

/** A source table drawn as bars, under the table it comes from. Every bar shows its number, and series differ by pattern as well as colour. */
export function tablePictureHTML(I, table) {
  const d = tableSeries(table);
  if (!d) return "";
  return html`<figure class="data-picture">
    <figcaption>${icon("growth")} ${I.T("The same numbers as a picture", "Los mismos números en una imagen")}</figcaption>
    ${d.cols.length > 1 ? html`<ul class="data-key">${d.cols.map((c, i) => html`<li><span class="bar-swatch s${i}"></span>${c}</li>`)}</ul>` : ""}
    <div class="data-bars">
      ${d.rows.map((r) => html`<div class="data-row"><span class="data-label">${r.label}</span><div class="data-set">${r.values.map((v, i) => html`<div class="data-bar"><span class="bar s${i}" style="width:${Math.max(2, Math.round((v.n / d.max) * 62))}%"></span><span class="bar-val">${v.text}</span></div>`)}</div></div>`)}
    </div>
  </figure>`;
}

// ── topic words ───────────────────────────────────────────────────────────────────────────────
const escRe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** A term counts as used when each of its words appears, allowing common endings (erosion, runoffs, trials). */
function termPattern(term) {
  const words = String(term).toLowerCase().split(/\s+/).filter(Boolean);
  const stem = (w) => (w.length > 4 ? w.replace(/(e|s|es|ed|ing)$/, "") : w);
  return new RegExp(`\\b${words.map((w) => `${escRe(stem(w))}[a-z]*`).join("\\s+")}\\b`, "i");
}
/** The task's vocabulary terms that appear in the draft. */
export function topicWordsUsed(vocab = [], text = "") {
  return vocab.map((v) => v.term).filter((term) => term && termPattern(term).test(text));
}

/** Chips for the task's own vocabulary that fill in as the writer uses them. A word bank, so never "on my own". */
export function topicWordsHTML(I, task, text, stage) {
  if (stage === "independent" || !task.vocab?.length) return "";
  const used = new Set(topicWordsUsed(task.vocab, text));
  return html`<div class="topic-words" data-topic-words>
    <p class="topic-words-label">${icon("words")} ${I.T("Topic words", "Palabras del tema")} <span class="fine" data-topic-count>${I.T(`${used.size} of ${task.vocab.length} used`, `${used.size} de ${task.vocab.length} usadas`)}</span></p>
    <ul>${task.vocab.map((v) => html`<li class="${used.has(v.term) ? "is-used" : ""}" data-topic-term="${v.term}" title="${v.def}"><span class="tw-check">${icon("check")}</span>${v.term}<span class="visually-hidden" data-tw-state>${used.has(v.term) ? I.T(" (used)", " (usada)") : ""}</span></li>`)}</ul>
  </div>`;
}
function refreshTopicWords(I, task, text) {
  const box = document.querySelector("[data-topic-words]");
  if (!box) return;
  const used = new Set(topicWordsUsed(task.vocab, text));
  for (const li of box.querySelectorAll("[data-topic-term]")) {
    const on = used.has(li.dataset.topicTerm);
    if (li.classList.contains("is-used") !== on) {
      li.classList.toggle("is-used", on);
      li.querySelector("[data-tw-state]").textContent = on ? I.S(" (used)", " (usada)") : "";
    }
  }
  const count = box.querySelector("[data-topic-count]");
  if (count) count.textContent = I.S(`${used.size} of ${task.vocab.length} used`, `${used.size} de ${task.vocab.length} usadas`);
}

// ── help tools beside the draft ──────────────────────────────────────────────────────────────
// Four tools a writer opens when they want them. "I'm stuck" gives ways of working, never words for the response.
// "Use my plan" and "Listen" work on the writer's own words, so they stay open "on my own". Connecting words are a
// word bank: they are offered with frames or a word bank only, where bank use is already recorded.
const STUCK = {
  read: [
    ["Read one part. Stop. Say what it is about.", "Lee una parte. Detente. Di de qué trata."],
    ["Press Read aloud and listen while you read.", "Presiona Leer en voz alta y escucha mientras lees."],
    ["Tap a sentence to save it. You can use it later.", "Toca una oración para guardarla. Puedes usarla después."],
  ],
  plan: [
    ["You can plan in any language you know.", "Puedes planear en cualquier idioma que sepas."],
    ["One or two words in each box is enough.", "Una o dos palabras en cada casilla es suficiente."],
    ["Look at the sentences you saved. They can help.", "Mira las oraciones que guardaste. Te pueden ayudar."],
  ],
  write: [
    ["Read the task again. What does it ask you to do?", "Vuelve a leer la tarea. ¿Qué te pide hacer?"],
    ["Say your sentence out loud. Then type what you said.", "Di tu oración en voz alta. Después escribe lo que dijiste."],
    ["Write a short sentence first. You can make it longer later.", "Primero escribe una oración corta. Después puedes alargarla."],
    ["Look at your plan. Turn one note into a sentence.", "Mira tu plan. Convierte una nota en una oración."],
  ],
  revise: [
    ["Change one thing only. Small changes count.", "Cambia solo una cosa. Los cambios pequeños cuentan."],
    ["Listen to your writing one sentence at a time.", "Escucha tu escritura una oración a la vez."],
    ["Ask a partner: which part is not clear?", "Pregunta a un compañero: ¿qué parte no está clara?"],
  ],
};
export function stuckStep(state, text, analyzed) {
  if (analyzed) return "revise";
  if (wordCount(text) >= 4 || Object.values(state.organizer || {}).some(Boolean)) return "write";
  return (state.evidence || []).length ? "plan" : "read";
}

export const CONNECTORS = [
  ["Add an idea", "Agregar una idea", [["also", "también"], ["in addition", "además"], ["another reason is", "otra razón es"]]],
  ["Give an example", "Dar un ejemplo", [["for example", "por ejemplo"], ["such as", "como"], ["the source says", "la fuente dice"]]],
  ["Tell why", "Decir por qué", [["because", "porque"], ["so", "así que"], ["as a result", "como resultado"], ["therefore", "por lo tanto"]]],
  ["Show a difference", "Mostrar una diferencia", [["but", "pero"], ["however", "sin embargo"], ["on the other hand", "por otro lado"]]],
  ["Show the order", "Mostrar el orden", [["first", "primero"], ["next", "después"], ["then", "luego"], ["finally", "por último"]]],
  ["Finish", "Terminar", [["in conclusion", "en conclusión"], ["this shows that", "esto muestra que"]]],
];

/** Plan notes as text to start a draft from: the writer's own words, in plan order. */
export function planText(task, state) {
  return (task.organizer || [])
    .map((slot) => String(state.organizer?.[slot.id] || "").trim())
    .filter(Boolean)
    .join(" ");
}

export function helpToolsHTML(I, task, state, stage, text, analyzed) {
  const own = stage === "independent";
  const now = stuckStep(state, text, analyzed);
  const tool = (id, ico, en, es) =>
    html`<button type="button" class="btn small" data-help-tool="${id}" aria-expanded="false" aria-controls="wrt-help-${id}">${icon(ico)} ${I.T(en, es)}</button>`;
  return html`<div class="help-tools" data-help-tools>
    <p class="help-tools-label">${icon("help")} ${I.T("Help tools", "Herramientas de ayuda")}</p>
    <div class="help-tools-row">
      ${tool("stuck", "bulb", "I'm stuck", "Estoy atascado")}
      ${tool("plan", "list", "Use my plan", "Usar mi plan")}
      ${own ? "" : tool("link", "words", "Connecting words", "Palabras para conectar")}
      ${tool("listen", "volume", "Listen to each sentence", "Escuchar cada oración")}
      ${own ? "" : tool("say", "speaking", "Say it, see it", "Dilo y míralo")}
    </div>
    <div class="help-panel" id="wrt-help-stuck" hidden>
      <p class="help-title">${I.T("Try one of these:", "Prueba una de estas ideas:")}</p>
      ${Object.entries(STUCK).map(([step, tips]) => html`<ul data-stuck="${step}" ${step === now ? "" : raw("hidden")}>${tips.map(([en, es]) => html`<li>${I.T(en, es)}</li>`)}</ul>`)}
      <p class="fine">${I.T("Still stuck? Ask a partner or your teacher. Asking is what good writers do.", "¿Sigues atascado? Pregunta a un compañero o a tu docente. Preguntar es lo que hacen los buenos escritores.")}</p>
    </div>
    <div class="help-panel" id="wrt-help-plan" hidden>
      <p class="help-title">${I.T("Start from your plan", "Empieza desde tu plan")}</p>
      <p>${I.T("This puts your plan notes into your writing. Then turn each note into a full sentence.", "Esto pone las notas de tu plan en tu escritura. Después convierte cada nota en una oración completa.")}</p>
      <button type="button" class="btn btn-primary small" data-use-plan>${icon("arrow-right")} ${I.T("Put my plan in my writing", "Poner mi plan en mi escritura")}</button>
    </div>
    ${
      own
        ? ""
        : html`<div class="help-panel" id="wrt-help-link" hidden>
            <p class="help-title">${I.T("Tap a word to add it to your writing", "Toca una palabra para agregarla a tu escritura")}</p>
            <dl class="connectors">${CONNECTORS.map(([en, es, words]) => html`<div><dt>${I.T(en, es)}</dt><dd>${words.map(([w, g]) => html`<button type="button" class="insert-chip" data-insert="${w}">${w}${I.mode === "en" ? "" : html` <span class="gloss" lang="es">${g}</span>`}</button>`)}</dd></div>`)}</dl>
          </div>`
    }
    ${
      own
        ? ""
        : html`<div class="help-panel" id="wrt-help-say" hidden>
            <p class="help-title">${I.T("Say your sentence out loud", "Di tu oración en voz alta")}</p>
            <p>${I.T("Your words appear here. When you stop, they go into your writing so you can check and fix them.", "Tus palabras aparecen aquí. Cuando te detienes, pasan a tu escritura para que las revises y corrijas.")}</p>
            <div data-say-controls>${dictationControlsHTML(DICT_ID, I, { label: I.T("Start talking", "Empezar a hablar") })}</div>
            <p class="listen-sentence" data-say-preview aria-live="polite"></p>
          </div>`
    }
    <div class="help-panel" id="wrt-help-listen" hidden>
      <p class="help-title">${I.T("Listen for what sounds wrong", "Escucha lo que suena mal")}</p>
      <p class="listen-sentence" data-listen-text aria-live="polite"></p>
      <p class="row-actions">
        <button type="button" class="btn small" data-listen="prev">${icon("arrow-left")} ${I.T("Back", "Atrás")}</button>
        <button type="button" class="btn small" data-listen="again">${icon("replay")} ${I.T("Hear it again", "Escuchar otra vez")}</button>
        <button type="button" class="btn btn-primary small" data-listen="next">${I.T("Next sentence", "Siguiente oración")} ${icon("arrow-right")}</button>
        <span class="fine" data-listen-count></span>
      </p>
    </div>
  </div>`;
}

const DICT_ID = "wrt-draft";
let listenAt = 0;
function showSentence(I, ctx, move) {
  const box = document.querySelector("[data-draft]");
  const out = document.querySelector("[data-listen-text]");
  const count = document.querySelector("[data-listen-count]");
  if (!box || !out) return;
  const list = box.value.trim() ? splitSentences(box.value).map((x) => x.text.trim()).filter(Boolean) : [];
  if (!list.length) {
    out.textContent = I.S("Write a sentence first. Then you can listen to it.", "Primero escribe una oración. Después puedes escucharla.");
    if (count) count.textContent = "";
    return;
  }
  listenAt = Math.max(0, Math.min(list.length - 1, move === "start" ? 0 : listenAt + (move === "next" ? 1 : move === "prev" ? -1 : 0)));
  out.textContent = list[listenAt];
  if (count) count.textContent = I.S(`Sentence ${listenAt + 1} of ${list.length}`, `Oración ${listenAt + 1} de ${list.length}`);
  speak(list[listenAt], { rate: ctx.prefs?.rate });
}

/** Clicks inside the help tools. Returns true when it handled the click. */
export const stopDraftDictation = cancelDictation;
export function onHelpClick(e, ctx, I, task, state) {
  const t = e.target;
  const open = t.closest("[data-help-tool]");
  if (open) {
    const root = open.closest("[data-help-tools]");
    const id = open.dataset.helpTool;
    const was = open.getAttribute("aria-expanded") === "true";
    for (const b of root.querySelectorAll("[data-help-tool]")) b.setAttribute("aria-expanded", "false");
    for (const p of root.querySelectorAll(".help-panel")) p.hidden = true;
    if (!was) {
      open.setAttribute("aria-expanded", "true");
      root.querySelector(`#wrt-help-${id}`).hidden = false;
      if (id === "listen") showSentence(I, ctx, "start");
      if (id === "stuck") {
        // Tips follow where the writer is now, not where they were when the page was drawn.
        const live = stuckStep(state, document.querySelector("[data-draft]")?.value || "", Boolean(document.querySelector("#wrt-feedback")));
        for (const ul of root.querySelectorAll("[data-stuck]")) ul.hidden = ul.dataset.stuck !== live;
      }
    }
    return true;
  }
  if (t.closest("[data-use-plan]")) {
    const plan = planText(task, state);
    if (plan) insertIntoDraft(plan, I);
    else announce(I.S("Your plan is empty. Write a note in a plan box first.", "Tu plan está vacío. Primero escribe una nota en una casilla del plan."));
    return true;
  }
  const dict = t.closest(`[data-dictate="${DICT_ID}"]`);
  if (dict) {
    const preview = document.querySelector("[data-say-preview]");
    const controls = document.querySelector("[data-say-controls]");
    const redraw = () => {
      if (controls) controls.innerHTML = toHtml(dictationControlsHTML(DICT_ID, I, { label: I.T("Start talking", "Empezar a hablar") }));
    };
    toggleDictation(DICT_ID, {
      I,
      onText: (words) => {
        if (preview) preview.textContent = words;
      },
      onDone: (words) => {
        let said = String(words || "").trim();
        const before = document.querySelector("[data-draft]")?.value.trim() || "";
        // Recognizers return lowercase without a final mark; start a new sentence with a capital.
        if (said && (!before || /[.!?]["”']?$/.test(before))) said = said[0].toUpperCase() + said.slice(1);
        if (said) {
          state.used ||= {};
          state.used.dictation = true;
          insertIntoDraft(said, I);
        }
        if (preview) preview.textContent = "";
        redraw();
      },
    }).then(redraw);
    return true;
  }
  const listen = t.closest("[data-listen]");
  if (listen) {
    showSentence(I, ctx, listen.dataset.listen);
    return true;
  }
  return false;
}

/** After "Save to my portfolio": how the piece changed, in counts. */
export function journeyHTML(I, state) {
  const first = state.versions[0];
  const last = state.versions.at(-1);
  if (!first || !last) return "";
  const a = wordCount(first.text);
  const b = wordCount(last.text);
  const revs = state.versions.filter((v) => v.kind === "revision").length;
  const item = (n, en, es) => html`<li><strong>${n}</strong><span>${I.T(en, es)}</span></li>`;
  return html`<div class="journey" aria-label="${I.S("How this piece changed", "Cómo cambió este texto")}">
    <p class="journey-title">${icon("star")} ${I.T("You did it! Look how your writing grew.", "¡Lo lograste! Mira cómo creció tu escritura.")}</p>
    <div class="growth-bars" role="img" aria-label="${I.S(`First draft: ${a} words. Now: ${b} words.`, `Primer borrador: ${a} palabras. Ahora: ${b} palabras.`)}">
      <div class="data-bar"><span class="data-label">${I.T("First draft", "Primer borrador")}</span><span class="bar s1" style="width:${Math.max(4, Math.round((a / Math.max(a, b, 1)) * 70))}%"></span><span class="bar-val">${a}</span></div>
      <div class="data-bar"><span class="data-label">${I.T("Now", "Ahora")}</span><span class="bar s0" style="width:${Math.max(4, Math.round((b / Math.max(a, b, 1)) * 70))}%"></span><span class="bar-val">${b}</span></div>
    </div>
    <ul class="writer-stats">
      ${item(a, "words in my first draft", "palabras en mi primer borrador")}
      ${item(b, "words now", "palabras ahora")}
      ${item(revs, revs === 1 ? "revision" : "revisions", revs === 1 ? "revisión" : "revisiones")}
      ${item((state.evidence || []).length, "evidence notes", "notas de evidencia")}
    </ul>
    <p class="row-actions no-print"><button type="button" class="btn small" data-copy-writing>${icon("copy")} ${I.T("Copy my writing", "Copiar mi escritura")}</button></p>
  </div>`;
}

// ── teacher view ─────────────────────────────────────────────────────────────────────────────
const studentLink = (ctx, id = "") => `${location.origin}${BASE}/write${id ? `/${id}` : ""}?grades=${ctx.band}`;

const ROUTINE = [
  ["Read together", "Leer juntos", "Read the situation and the sources aloud. Students tap the sentences they may use as evidence.", "Lean en voz alta la situación y las fuentes. Los estudiantes tocan las oraciones que pueden usar como evidencia."],
  ["Plan out loud", "Planear en voz alta", "Partners say each planning box to each other before they type it.", "En parejas, digan cada casilla del plan antes de escribirla."],
  ["Write", "Escribir", "Students choose their own level of help. The choice is saved with the draft, so you can see what was independent.", "Cada estudiante elige su nivel de ayuda. La elección se guarda con el borrador, para que vea qué fue independiente."],
  ["Feedback and revise", "Comentarios y revisión", "Students ask for feedback, change one thing, and ask again. The first draft is always kept.", "Los estudiantes piden comentarios, cambian una cosa y vuelven a pedir. El primer borrador siempre se guarda."],
  ["Share", "Compartir", "Finished pieces go to the portfolio. Students in a class can send a piece to your review queue.", "Los textos terminados van al portafolio. Los estudiantes de una clase pueden enviar un texto a su lista de revisión."],
];

export function teacherChooserHTML(I, ctx, tasks) {
  if (!isTeacherView()) return "";
  return html`<section class="teacher-notes panel no-print" aria-labelledby="wrt-teach-h" data-fold="open" id="wrt-teach">
    <header><h2 id="wrt-teach-h">${icon("teacher")} ${I.T("Teach with the Writing Studio", "Enseñar con el Estudio de escritura")}</h2>
      <p class="fine">${I.T("Shown in Teacher view only. Students do not see this panel.", "Se muestra solo en la vista docente. Los estudiantes no ven este panel.")}</p></header>
    <div class="teacher-grid">
      <div>
        <h3>${I.T("A lesson routine that needs no prep", "Una rutina de clase sin preparación")}</h3>
        <ol class="teach-routine">${ROUTINE.map(([en, es, den, des]) => html`<li><strong>${I.T(en, es)}.</strong> ${I.T(den, des)}</li>`)}</ol>
        <p class="row-actions">
          <button type="button" class="btn small" data-copy-link="${studentLink(ctx)}">${icon("copy")} ${I.T("Copy the student link", "Copiar el enlace para estudiantes")}</button>
          <a class="btn small" href="${BASE}/printables/studio-writing" target="_blank" rel="noopener">${icon("print")} ${I.T("Print task cards", "Imprimir tarjetas")}</a>
        </p>
        <h3>${I.T("A five-minute warm-up", "Un calentamiento de cinco minutos")}</h3>
        <p>${I.T("Quick writes are picture and question prompts with no feedback and no record of supports: a low-pressure start, a bell-ringer or an early-finisher choice.", "Las escrituras rápidas son imágenes y preguntas sin comentarios ni registro de apoyos: un inicio sin presión, una actividad de entrada o una opción para quien termina antes.")}</p>
        <p class="row-actions"><button type="button" class="btn small" data-copy-link="${location.origin}${BASE}/write?tab=quick&grades=${ctx.band}">${icon("copy")} ${I.T("Copy the quick-write link", "Copiar el enlace de escritura rápida")}</button></p>
        <h3>${I.T("On each task, in Teacher view", "En cada tarea, en la vista docente")}</h3>
        <ul class="teach-routine"><li>${I.T("Assign with a focus: the link shows students one goal for the day.", "Asignar con un enfoque: el enlace muestra a los estudiantes una meta para el día.")}</li><li>${I.T("Print a conference sheet with look-fors and questions.", "Imprimir una hoja de conferencia con qué observar y preguntas.")}</li><li>${I.T("Leave a conference note on the writer's device. They see it with the piece and in their portfolio.", "Dejar una nota de conferencia en el dispositivo del escritor. La ve con el texto y en su portafolio.")}</li></ul>
      </div>
      <div class="table-scroll" tabindex="0" role="region" aria-label="${I.S("Every writing task for this grade band", "Todas las tareas de escritura de este grupo de grados")}">
        <table class="data-table teach-table">
          <caption>${I.T(`${tasks.length} tasks for grades ${ctx.band.replace("-", "–")}`, `${tasks.length} tareas para los grados ${ctx.band.replace("-", "–")}`)}</caption>
          <thead><tr><th scope="col">${I.T("Task", "Tarea")}</th><th scope="col">${I.T("Purpose", "Propósito")}</th><th scope="col">${I.T("Subject", "Materia")}</th><th scope="col">${I.T("Time", "Tiempo")}</th><th scope="col"><span class="visually-hidden">${I.T("Link", "Enlace")}</span></th></tr></thead>
          <tbody>${tasks.map((t) => html`<tr><th scope="row"><a href="${BASE}/write/${t.id}?grades=${ctx.band}">${t.title}</a></th><td>${t.keyUse}</td><td>${t.contentArea}</td><td>${t.time}</td><td><button type="button" class="ghost small" data-copy-link="${studentLink(ctx, t.id)}" aria-label="${I.S(`Copy the link to ${t.title}`, `Copiar el enlace a ${t.title}`)}">${icon("copy")}</button></td></tr>`)}</tbody>
        </table>
      </div>
    </div>
  </section>`;
}


export function teacherTaskHTML(I, ctx, task, extra = "") {
  if (!isTeacherView()) return "";
  const e = task.expected || {};
  const g = task.stages?.guided || {};
  return disclosure(
    "wrt-teacher",
    html`${icon("teacher")} ${I.T("Teacher notes for this task", "Notas docentes para esta tarea")}`,
    html`<p class="fine">${I.T("Shown in Teacher view only. Everything here comes from the task itself.", "Se muestra solo en la vista docente. Todo lo que aparece aquí viene de la tarea misma.")}</p>
      <div class="teacher-grid">
        <div>
          <h4>${I.T("Language focus", "Enfoque de lenguaje")}</h4>
          <p class="entry-meta"><span class="tag">${task.keyUse}</span>${(task.dimensions || []).map((d) => html`<span class="tag">${d}</span>`)}${(task.standards || []).map((s) => html`<span class="tag">${s}</span>`)}</p>
          <h4>${I.T("What a complete response includes", "Qué incluye una respuesta completa")}</h4>
          <ul>${(task.organizer || []).map((o) => html`<li><strong>${o.label}.</strong> ${o.hint}</li>`)}</ul>
          ${e.minWords ? html`<p class="fine">${I.T(`Usual length: ${e.minWords}–${e.maxWords} words, ${e.paragraphs || 1} paragraph${(e.paragraphs || 1) === 1 ? "" : "s"}.`, `Extensión habitual: ${e.minWords}–${e.maxWords} palabras, ${e.paragraphs || 1} ${(e.paragraphs || 1) === 1 ? "párrafo" : "párrafos"}.`)}</p>` : ""}
          <p class="row-actions"><button type="button" class="btn small" data-copy-link="${studentLink(ctx, task.id)}">${icon("copy")} ${I.T("Copy the student link", "Copiar el enlace para estudiantes")}</button></p>
          ${extra}
        </div>
        <div>
          ${
            task.revisionPrompts?.length
              ? html`<h4>${I.T("Conference questions", "Preguntas para la conferencia")}</h4>
                  <ul>${task.revisionPrompts.map((p) => html`<li><em>${FOCUS[p.focus] ? I.T(FOCUS[p.focus][0], FOCUS[p.focus][1]) : p.focus}:</em> ${p.prompt}</li>`)}</ul>`
              : ""
          }
          ${g.model ? html`<h4>${I.T("Model response", "Respuesta modelo")}</h4><p class="portfolio-response">${g.model}</p>` : ""}
        </div>
      </div>`,
    { cls: "panel teacher-notes no-print" },
  );
}

// ── events ───────────────────────────────────────────────────────────────────────────────────
/** Chooser and shared buttons. Returns true when it handled the click. */
export function onPlusClick(e, I) {
  const t = e.target;
  const link = t.closest("[data-copy-link]");
  if (link) {
    navigator.clipboard
      ?.writeText(link.dataset.copyLink)
      .then(() => announce(I.S("Link copied. Paste it where your students will find it.", "Enlace copiado. Pégalo donde tus estudiantes lo encuentren.")))
      .catch(() => announce(link.dataset.copyLink));
    return true;
  }
  if (t.closest("[data-wrt-clear]")) {
    Object.assign(filter, { q: "", subject: "", use: "", status: "" });
    const root = t.closest("[data-wrt-find]");
    for (const el of root.querySelectorAll("[data-wrt-filter]")) el.value = "";
    applyFilter(document, I);
    root.querySelector('[data-wrt-filter="q"]')?.focus();
    return true;
  }
  return false;
}

/** Search box and selects on the chooser. */
export function onPlusFilter(e, I) {
  const el = e.target.closest?.("[data-wrt-filter]");
  if (!el) return false;
  filter[el.dataset.wrtFilter] = el.value;
  applyFilter(document, I);
  return true;
}

// ═════════════════════════════════════════════════════════════════════════════════════════════
// Engagement and teaching extras (kept in this module so the lab shell lists one Writing Studio helper, not two):
//   students  quick writes from a picture or a question (no feedback, no record of supports: a place to write freely),
//             badges for what a writer has tried, a partner share with "glow" and "wonder", and a surprise task
//   teachers  a focus for the day carried in the task link, a printable conference sheet, and a conference note that
//             stays with the piece on the device and shows in the writer's portfolio
// Nothing here scores writing or adds to the language ledger. Badges count what a writer has done, not how well.
// Quick writes are kept in the studio document under "quick-<prompt id>", in the same shape as a task's writing,
// so backup, import and the teacher's samples read them without a special case.
const PIC = `${BASE}/pictures`;

// ── quick writes ─────────────────────────────────────────────────────────────────────────────
const STARTERS = {
  story: [["First, ", "Primero, "], ["Then ", "Luego "], ["After that, ", "Después de eso, "], ["In the end, ", "Al final, "]],
  howto: [["First, ", "Primero, "], ["Next, ", "Después, "], ["Last, ", "Por último, "]],
  opinion: [["I think ___ because ", "Pienso que ___ porque "], ["Another reason is ", "Otra razón es "], ["That is why ", "Por eso "]],
  describe: [["I see ", "Veo "], ["One difference is ", "Una diferencia es "], ["I think this happens because ", "Creo que esto pasa porque "]],
  memory: [["One day, ", "Un día, "], ["I felt ___ because ", "Me sentí ___ porque "], ["I learned that ", "Aprendí que "]],
};

/** id, kind, picture file (or ""), prompt EN/ES, picture description EN/ES. Pictures are the lab's own drawings. */
export const QUICK = [
  ["kite", "story", "35t-kite-seq.svg", "Tell the story of the kite. What happens first, next and last?", "Cuenta la historia de la cometa. ¿Qué pasa primero, después y al final?", "Three pictures: a girl flies a red kite, the kite gets stuck in a tall tree, and her grandfather pulls it down with a rake.", "Tres imágenes: una niña vuela una cometa roja, la cometa se atora en un árbol alto y su abuelo la baja con un rastrillo."],
  ["lost-dog", "story", "35-speaking-lost-dog.svg", "Tell the story of the lost dog. How does it end?", "Cuenta la historia del perro perdido. ¿Cómo termina?", "Three pictures: a dog runs out of an open gate, a girl and her father put up a Lost Dog poster, and a neighbor brings the dog back.", "Tres imágenes: un perro sale por una puerta abierta, una niña y su papá ponen un cartel de perro perdido y un vecino devuelve al perro."],
  ["picnic", "story", "35-speaking-rainy-picnic.svg", "Tell what happens to the picnic. How does the family fix the problem?", "Cuenta qué pasa con el pícnic. ¿Cómo resuelve el problema la familia?", "Three pictures: a family carries a picnic basket to the park, rain falls on their blanket, and they eat the picnic at home on the floor.", "Tres imágenes: una familia lleva una canasta de pícnic al parque, llueve sobre su manta y comen el pícnic en casa, en el piso."],
  ["backpack", "story", "35-writing-lost-backpack.svg", "Tell the story of the green backpack. How do you think the boy feels at the end?", "Cuenta la historia de la mochila verde. ¿Cómo crees que se siente el niño al final?", "Three pictures: a boy leaves his green backpack on the bus, a girl finds it, and she gives it back to him at school.", "Tres imágenes: un niño deja su mochila verde en el autobús, una niña la encuentra y se la devuelve en la escuela."],
  ["umbrella", "story", "35t-rain-seq.svg", "Tell the story of the rainy walk to school. What does a good friend do?", "Cuenta la historia de la caminata bajo la lluvia. ¿Qué hace un buen amigo?", "Four pictures: a girl walks to school in the sun, rain pours down, a friend comes with a red umbrella, and they share it.", "Cuatro imágenes: una niña camina a la escuela con sol, empieza a llover, llega un amigo con un paraguas rojo y lo comparten."],
  ["tortillas", "howto", "35t-tortilla-seq.svg", "Tell how they make the food, step by step. Then tell about a food your family makes.", "Di cómo preparan la comida, paso a paso. Después cuenta sobre una comida que hace tu familia.", "Three pictures: a girl and her grandmother mix dough, they roll and flatten it into circles, and the family shares the food at the table.", "Tres imágenes: una niña y su abuela mezclan la masa, la aplanan en círculos y la familia comparte la comida en la mesa."],
  ["bird-feeder", "howto", "35-writing-bird-feeder.svg", "Teach a friend how to make this bird feeder. Write the steps in order.", "Enseña a un amigo a hacer este comedero para pájaros. Escribe los pasos en orden.", "Three steps: spread sunflower butter on a pinecone, roll it in birdseed, and hang it on a branch where a bird eats.", "Tres pasos: untar crema de girasol en una piña de pino, rodarla en semillas y colgarla en una rama donde come un pájaro."],
  ["class-pet", "opinion", "35-writing-class-pet.svg", "Which class pet is better: the fish or the hamster? Give two reasons.", "¿Qué mascota de clase es mejor: el pez o el hámster? Da dos razones.", "Two choices for a class pet: a goldfish in a tank and a hamster in a cage with a wheel.", "Dos opciones de mascota para la clase: un pez dorado en una pecera y un hámster en una jaula con una rueda."],
  ["classrooms", "opinion", "68-two-classrooms.svg", "Which classroom would you choose? Tell why.", "¿Qué salón escogerías? Di por qué.", "Two classrooms side by side. Both have desks and a board. One has computers. The other has paint and art supplies.", "Dos salones, uno junto al otro. Los dos tienen pupitres y un pizarrón. Uno tiene computadoras. El otro tiene pintura y materiales de arte."],
  ["park-cleanup", "describe", "35t-park-cleanup.svg", "What are the neighbors doing? Why does their work matter?", "¿Qué hacen los vecinos? ¿Por qué es importante su trabajo?", "Neighbors clean up a park: a girl picks up a can, a boy carries a recycling bin, two children plant a tree and a man waters flowers.", "Unos vecinos limpian un parque: una niña recoge una lata, un niño lleva un bote de reciclaje, dos niños plantan un árbol y un señor riega las flores."],
  ["hillsides", "describe", "68c-hillside-erosion.svg", "How are the two hillsides different after the rain? Why do you think so?", "¿En qué son diferentes las dos laderas después de la lluvia? ¿Por qué crees que es así?", "Two hillsides by a river after a storm. One has trees and grass and clear water. The other has bare soil, stumps and muddy water.", "Dos laderas junto a un río después de una tormenta. Una tiene árboles, pasto y agua clara. La otra tiene tierra sin plantas, troncos cortados y agua con lodo."],
  ["helped", "memory", "", "Tell about a time you helped someone, or someone helped you.", "Cuenta sobre una vez que ayudaste a alguien, o que alguien te ayudó.", "", ""],
  ["rather", "opinion", "", "Would you rather live near the ocean or near the mountains? Tell why.", "¿Preferirías vivir cerca del mar o cerca de las montañas? Di por qué.", "", ""],
  ["teach", "howto", "", "Teach someone how to do something you are good at.", "Enseña a alguien a hacer algo que tú haces bien.", "", ""],
  ["place", "describe", "", "Describe a place you love. What do you see and hear there?", "Describe un lugar que te encanta. ¿Qué ves y qué oyes allí?", "", ""],
].map(([id, kind, pic, en, es, alt, altEs]) => ({ id, kind, pic, en, es, alt, altEs }));

export const quickKey = (id) => `quick-${id}`;
export const isQuickKey = (key) => String(key).startsWith("quick-");
/** Saved quick writes, newest first: [{prompt, w, text}]. */
export function quickWrites(studio) {
  return QUICK.map((prompt) => ({ prompt, w: studio.writing?.[quickKey(prompt.id)] }))
    .filter((r) => r.w?.versions?.length)
    .map((r) => ({ ...r, text: r.w.versions.at(-1).text }))
    .sort((a, b) => String(b.w.updatedAt || "").localeCompare(String(a.w.updatedAt || "")));
}

const KIND = {
  story: ["Tell a story", "Cuenta una historia"],
  howto: ["Explain the steps", "Explica los pasos"],
  opinion: ["Share your opinion", "Da tu opinión"],
  describe: ["Describe it", "Descríbelo"],
  memory: ["Tell about you", "Cuenta sobre ti"],
};

export function quickChooserHTML(I, ctx, studio) {
  const saved = quickWrites(studio);
  const done = new Set(saved.map((s) => s.prompt.id));
  return html`<div class="d-writing quick-write" data-no-studio-video>
    <header class="quick-head">
      <p class="eyebrow">${icon("sparkle")} ${I.T("Writing Studio", "Estudio de escritura")}</p>
      <h1 tabindex="-1">${I.T("Quick write", "Escritura rápida")}</h1>
      <p class="lead">${I.T("Pick a picture or a question. Write what you think. There is no wrong answer here, and nobody checks it.", "Elige una imagen o una pregunta. Escribe lo que piensas. Aquí no hay respuesta incorrecta y nadie lo revisa.")}</p>
    </header>
    <ul class="quick-grid">
      ${QUICK.map((p) => html`<li><a class="card quick-card ${p.pic ? "" : "is-text"}" href="${BASE}/write?tab=quick&p=${p.id}&grades=${ctx.band}">
        ${p.pic ? html`<img src="${PIC}/${p.pic}" alt="" width="640" height="400" loading="lazy" decoding="async" />` : html`<span class="quick-q" aria-hidden="true">?</span>`}
        <span class="quick-kind">${I.T(...KIND[p.kind])}${done.has(p.id) ? html` <span class="task-status is-done">${icon("check")} ${I.T("Written", "Escrito")}</span>` : ""}</span>
        <strong>${I.T(p.en, p.es)}</strong>
      </a></li>`)}
    </ul>
    ${
      saved.length
        ? html`<section class="panel quick-saved" aria-labelledby="qw-saved-h"><h2 id="qw-saved-h">${icon("bookmark")} ${I.T("My quick writes", "Mis escrituras rápidas")}</h2>
            <ul>${saved.map((s) => html`<li><p class="quick-saved-meta"><strong>${I.T(s.prompt.en, s.prompt.es)}</strong> <span class="fine">${I.T(`${wordCount(s.text)} words`, `${wordCount(s.text)} palabras`)}${s.w.updatedAt ? html` · ${formatDate(todayISO(new Date(s.w.updatedAt)))}` : ""}</span></p><p class="portfolio-response">${s.text}</p><p class="row-actions no-print"><a class="btn small" href="${BASE}/write?tab=quick&p=${s.prompt.id}&grades=${ctx.band}">${icon("writing")} ${I.T("Add more", "Agregar más")}</a></p></li>`)}</ul>
          </section>`
        : ""
    }
    <p><a class="btn" href="${BASE}/write?grades=${ctx.band}">${icon("arrow-left")} ${I.T("Back to Writing Studio", "Volver al Estudio de escritura")}</a></p>
  </div>`;
}

export function quickWriteHTML(I, ctx, studio, prompt) {
  const w = writingState(studio, quickKey(prompt.id));
  const text = w.draft ?? w.versions.at(-1)?.text ?? "";
  const starters = STARTERS[prompt.kind] || STARTERS.story;
  return html`<article class="d-writing quick-write quick-one" data-quick="${prompt.id}" data-no-studio-video>
    <header class="quick-head">
      <p class="eyebrow">${icon("sparkle")} ${I.T("Quick write", "Escritura rápida")} · ${I.T(...KIND[prompt.kind])}</p>
      <h1 tabindex="-1">${I.T(prompt.en, prompt.es)}</h1>
      <p><button type="button" class="ghost small" data-say="${I.S(prompt.en, prompt.es)}">${icon("volume")} ${I.T("Hear the question", "Escuchar la pregunta")}</button></p>
    </header>
    <div class="quick-cols ${prompt.pic ? "" : "is-text"}">
      ${prompt.pic ? html`<figure class="quick-pic"><img src="${PIC}/${prompt.pic}" alt="${I.S(prompt.alt, prompt.altEs)}" width="640" height="400" decoding="async" /></figure>` : ""}
      <section class="panel editor-panel">
        <label class="field paper"><span class="paper-head">${I.T("Your writing", "Tu escritura")} <span class="fine">${I.T("Saved on this device as you type", "Se guarda en este dispositivo mientras escribes")}</span></span>
          <textarea rows="9" spellcheck="false" placeholder="${I.S("Write here. Any length is fine.", "Escribe aquí. Cualquier extensión está bien.")}" data-quick-draft ${IGN}>
${text}</textarea></label>
        <p class="meter-line"><span data-quick-count>${I.S(`${wordCount(text)} words`, `${wordCount(text)} palabras`)}</span></p>
        <p class="reflect-starters"><span class="fine">${I.T("Need a way to start? Tap one:", "¿Necesitas cómo empezar? Toca una:")}</span>
          ${starters.map(([en, es]) => html`<button type="button" class="insert-chip" data-quick-start="${I.S(en, es)}">${I.T(`${en.trim()}…`, `${es.trim()}…`)}</button>`)}</p>
        <div class="row-actions">
          <button type="button" class="btn btn-primary" data-quick-save ${wordCount(text) ? "" : raw("disabled")}>${icon("bookmark")} ${I.T("Save my quick write", "Guardar mi escritura rápida")}</button>
          <a class="btn" href="${BASE}/write?tab=quick&grades=${ctx.band}">${I.T("Pick another one", "Elegir otra")}</a>
        </div>
        ${w.finishedAt && w.versions.at(-1)?.text === text ? html`<p class="saved-note">${icon("check")} <span>${I.T("Saved. Nice writing!", "Guardado. ¡Buena escritura!")}</span></p>` : ""}
      </section>
    </div>
  </article>`;
}

// ── badges ───────────────────────────────────────────────────────────────────────────────────
/** What a writer has done on this device, as booleans. Reads the studio document; judges nothing. */
export function badgeFacts(studio, tasks) {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const entries = Object.entries(studio.writing || {}).filter(([id]) => byId.has(id));
  const finished = entries.filter(([, w]) => w.finishedAt);
  return {
    draft: entries.some(([, w]) => w.versions?.length),
    reviser: entries.some(([, w]) => (w.versions || []).some((v) => v.kind === "revision")),
    evidence: entries.some(([, w]) => (w.evidence || []).length >= 2),
    planner: entries.some(([id, w]) => (byId.get(id).organizer || []).length > 0 && byId.get(id).organizer.every((s) => String(w.organizer?.[s.id] || "").trim())),
    published: finished.length >= 1,
    three: finished.length >= 3,
    explorer: new Set(finished.map(([id]) => byId.get(id).form)).size >= 3,
    own: finished.some(([, w]) => w.stage === "independent"),
    partner: entries.some(([, w]) => String(w.partner?.glow || "").trim() && String(w.partner?.wonder || "").trim()),
    quick: quickWrites(studio).length >= 3,
  };
}

export const BADGES = [
  ["draft", "writing", "First draft", "Primer borrador", "Ask for feedback on a draft.", "Pide comentarios sobre un borrador."],
  ["planner", "list", "Planner", "Planificador", "Fill every box of a plan.", "Llena todas las casillas de un plan."],
  ["evidence", "evidence", "Evidence collector", "Coleccionista de evidencia", "Save two sentences from the sources.", "Guarda dos oraciones de las fuentes."],
  ["reviser", "retry", "Reviser", "Revisor", "Change a draft and ask for feedback again.", "Cambia un borrador y pide comentarios otra vez."],
  ["partner", "conversation", "Good partner", "Buen compañero", "Share a piece and write what your partner said.", "Comparte un texto y escribe lo que dijo tu compañero."],
  ["published", "bookmark", "In my portfolio", "En mi portafolio", "Finish one piece.", "Termina un texto."],
  ["three", "medal", "Three pieces", "Tres textos", "Finish three pieces.", "Termina tres textos."],
  ["explorer", "worlds", "Explorer", "Explorador", "Finish three different kinds of writing.", "Termina tres tipos de escritura diferentes."],
  ["own", "user", "On my own", "Por mi cuenta", "Finish a piece you wrote on your own.", "Termina un texto que escribiste por tu cuenta."],
  ["quick", "sparkle", "Quick writer", "Escritor veloz", "Save three quick writes.", "Guarda tres escrituras rápidas."],
];

export function badgesHTML(I, studio, tasks) {
  const facts = badgeFacts(studio, tasks);
  const n = BADGES.filter(([id]) => facts[id]).length;
  return html`<section class="panel writer-badges" aria-labelledby="wrt-badges-h" id="wrt-badges">
    <header><h2 id="wrt-badges-h">${icon("medal")} ${I.T("My writer badges", "Mis insignias de escritor")}</h2>
      <p class="fine">${I.T(`${n} of ${BADGES.length} collected. Badges show what you have tried. They are not a score.`, `${n} de ${BADGES.length} conseguidas. Las insignias muestran lo que has probado. No son una puntuación.`)}</p></header>
    <ul class="badge-grid">
      ${BADGES.map(([id, ico, en, es, how, howEs]) => html`<li class="${facts[id] ? "is-earned" : ""}"><span class="badge-ico">${icon(facts[id] ? ico : "lock")}</span><strong>${I.T(en, es)}</strong><span class="fine">${facts[id] ? html`<span class="visually-hidden">${I.T("Collected.", "Conseguida.")} </span>` : html`<span class="visually-hidden">${I.T("Not yet.", "Todavía no.")} </span>`}${I.T(how, howEs)}</span></li>`)}
    </ul>
  </section>`;
}

/** Badges collected between two readings of the facts, as [en, es] names. */
export function newBadges(before, after) {
  return BADGES.filter(([id]) => after[id] && !before[id]).map(([, , en, es]) => [en, es]);
}
/** Say which badge was just collected. Call with the facts read before and after a save. */
export function celebrateBadges(I, before, after) {
  for (const [en, es] of newBadges(before, after))
    announce(I.S(`New badge: ${en}! See it in the Writing Studio.`, `¡Nueva insignia: ${es}! Mírala en el Estudio de escritura.`));
}

/** A task the writer has not started, for "Surprise me". `pick` is injectable so the choice can be tested. */
export function surpriseTask(tasks, studio, pick = Math.random) {
  const fresh = tasks.filter((t) => !studio.writing?.[t.id]);
  const pool = fresh.length ? fresh : tasks;
  return pool.length ? pool[Math.min(pool.length - 1, Math.floor(pick() * pool.length))] : null;
}

/** Doors from the chooser: quick write and surprise. */
export function extrasRowHTML(I, ctx, tasks, studio) {
  const s = surpriseTask(tasks, studio);
  return html`<div class="wrt-doors no-print">
    <a class="card wrt-door" href="${BASE}/write?tab=quick&grades=${ctx.band}"><span class="task-ico">${icon("sparkle")}</span><span><strong>${I.T("Quick write", "Escritura rápida")}</strong><span class="fine">${I.T("A picture or a question. Write freely. Nobody checks it.", "Una imagen o una pregunta. Escribe con libertad. Nadie lo revisa.")}</span></span>${icon("arrow-right")}</a>
    ${s ? html`<a class="card wrt-door" href="${BASE}/write/${s.id}?grades=${ctx.band}"><span class="task-ico">${icon("replay")}</span><span><strong>${I.T("Surprise me", "Sorpréndeme")}</strong><span class="fine">${I.T("Open a task you have not tried yet.", "Abre una tarea que aún no has probado.")}</span></span>${icon("arrow-right")}</a>` : ""}
  </div>`;
}

// ── partner share ────────────────────────────────────────────────────────────────────────────
export function partnerHTML(I, state) {
  const p = state.partner || {};
  return html`<div class="partner-share" data-partner>
    <h4>${icon("conversation")} ${I.T("Share with a partner", "Comparte con un compañero")}</h4>
    <ol class="partner-steps">
      <li>${I.T("Read your writing aloud to a partner.", "Lee tu escritura en voz alta a un compañero.")}</li>
      <li>${I.T("Your partner tells you one thing they liked and one thing they wonder.", "Tu compañero te dice una cosa que le gustó y una cosa que se pregunta.")}
        <span class="partner-stems"><span class="tag">${I.T("I like how you…", "Me gusta cómo…")}</span><span class="tag">${I.T("I wonder…", "Me pregunto…")}</span></span></li>
      <li>${I.T("Write what your partner said.", "Escribe lo que dijo tu compañero.")}</li>
    </ol>
    <div class="partner-fields">
      <label class="field"><span>${I.T("My partner liked…", "A mi compañero le gustó…")}</span><textarea rows="2" data-partner-field="glow" ${IGN}>${p.glow || ""}</textarea></label>
      <label class="field"><span>${I.T("My partner wondered…", "Mi compañero se preguntó…")}</span><textarea rows="2" data-partner-field="wonder" ${IGN}>${p.wonder || ""}</textarea></label>
    </div>
  </div>`;
}

/** Partner and conference notes as they appear in the portfolio. */
export function notesForPortfolioHTML(I, w) {
  const p = w.partner || {};
  const c = w.conference || {};
  const has = (x) => String(x || "").trim();
  if (!has(p.glow) && !has(p.wonder) && !has(c.glow) && !has(c.next)) return "";
  return html`<section class="entry-notes">
    ${has(p.glow) || has(p.wonder) ? html`<div><h3>${icon("conversation")} ${I.T("What my partner said", "Lo que dijo mi compañero")}</h3>${has(p.glow) ? html`<p><strong>${I.T("Liked:", "Le gustó:")}</strong> ${p.glow}</p>` : ""}${has(p.wonder) ? html`<p><strong>${I.T("Wondered:", "Se preguntó:")}</strong> ${p.wonder}</p>` : ""}</div>` : ""}
    ${has(c.glow) || has(c.next) ? html`<div><h3>${icon("teacher")} ${I.T("From my writing conference", "De mi conferencia de escritura")}</h3>${has(c.glow) ? html`<p><strong>${I.T("Working well:", "Va bien:")}</strong> ${c.glow}</p>` : ""}${has(c.next) ? html`<p><strong>${I.T("Next step:", "Siguiente paso:")}</strong> ${c.next}</p>` : ""}</div>` : ""}
  </section>`;
}

// ── teacher: compare two samples (a projectable mini-lesson) ──────────────────────────────────
/** The early and strong practice samples for a task, side by side; what each writer did stays hidden until revealed. */
export function compareLessonHTML(I, ctx, task, exemplars) {
  const back = html`<p class="row-actions no-print"><a class="btn" href="${BASE}/write/${task.id}?grades=${ctx.band}">${icon("arrow-left")} ${I.T("Back to the task", "Volver a la tarea")}</a></p>`;
  if (!isTeacherView())
    return html`<article class="compare-lesson d-writing" data-no-studio-video>${back}<h1 tabindex="-1">${task.title}</h1><p>${I.T("This mini-lesson opens in Teacher view.", "Esta minilección se abre en la vista docente.")}</p></article>`;
  const pick = (b) => exemplars.find((x) => x.taskId === task.id && x.practiceBand === b);
  const a = pick("early");
  const b = pick("strong");
  if (!a || !b)
    return html`<article class="compare-lesson d-writing" data-no-studio-video>${back}<h1 tabindex="-1">${task.title}</h1><p>${I.T("This task has no sample responses yet.", "Esta tarea aún no tiene respuestas de ejemplo.")}</p></article>`;
  const sample = (label, x) => html`<section class="compare-sample"><h2>${label}</h2><p class="portfolio-response">${x.response}</p>
    <details class="studio-disc"><summary>${icon("search")} ${I.T("Show what this writer did", "Mostrar lo que hizo este escritor")}</summary><div class="disc-body"><ul>${x.annotations.map((n) => html`<li>“${n.quote}” — <em>${n.dimension}</em>: ${n.note}</li>`)}</ul><p class="fine"><strong>${I.T("Next step:", "Próximo paso:")}</strong> ${x.nextStep}</p></div></details></section>`;
  return html`<article class="compare-lesson d-writing" data-no-studio-video>
    ${back}
    <header>
      <p class="eyebrow">${icon("teacher")} ${I.T("Mini-lesson · compare two samples", "Minilección · comparar dos ejemplos")} · ${task.keyUse}</p>
      <h1 tabindex="-1">${task.title}</h1>
      <p class="lead">${task.prompt}</p>
      <p class="fine no-print">${I.T("Press Present to project it. Use it before students draft, or after their first draft to plan a revision. These are practice samples, not WIDA levels.", "Presione Presentar para proyectarla. Úsela antes de que escriban o después del primer borrador para planear una revisión. Son ejemplos de práctica, no niveles de WIDA.")}</p>
    </header>
    <div class="compare-grid">${sample(I.T("Sample A", "Ejemplo A"), a)}${sample(I.T("Sample B", "Ejemplo B"), b)}</div>
    <section class="compare-talk panel">
      <h2>${icon("conversation")} ${I.T("Talk with a partner", "Habla con un compañero")}</h2>
      <ol>
        <li>${I.T("Which sample would help the reader more? Why?", "¿Qué ejemplo ayudaría más al lector? ¿Por qué?")} <span class="tag">${I.T("Sample ___ helps more because…", "El ejemplo ___ ayuda más porque…")}</span></li>
        <li>${I.T("Find one sentence in Sample B that does something Sample A does not.", "Encuentra una oración del ejemplo B que hace algo que el ejemplo A no hace.")} <span class="tag">${I.T("In Sample B, the writer…", "En el ejemplo B, el escritor…")}</span></li>
        <li>${I.T("Choose one move you will try in your own writing.", "Elige una estrategia que vas a probar en tu propia escritura.")} <span class="tag">${I.T("I will try…", "Voy a intentar…")}</span></li>
      </ol>
    </section>
  </article>`;
}

// ── teacher: focus for the day, conference note, conference sheet ───────────────────────────
export const FOCUS = {
  evidence: ["Evidence", "Evidencia", "Use facts or numbers from the sources.", "Usa datos o números de las fuentes."],
  reasoning: ["Reasoning", "Razonamiento", "Explain why your evidence matters.", "Explica por qué importa tu evidencia."],
  cohesion: ["Connecting ideas", "Conectar ideas", "Use words that link your sentences.", "Usa palabras que enlacen tus oraciones."],
  precision: ["Precise words", "Palabras precisas", "Choose exact words from the topic.", "Elige palabras exactas del tema."],
  sentence: ["Sentences", "Oraciones", "Write complete sentences. Try joining two short ones.", "Escribe oraciones completas. Intenta unir dos cortas."],
};
export const focusFrom = (search) => {
  const f = new URLSearchParams(search).get("focus") || "";
  return Object.hasOwn(FOCUS, f) ? f : "";
};

/** The focus a teacher put in the link, shown to the writer above the steps. The values are a fixed list, never free text. */
export function focusBannerHTML(I, task, focus) {
  if (!focus) return "";
  const f = FOCUS[focus];
  const ask = (task.revisionPrompts || []).find((p) => p.focus === focus)?.prompt;
  return html`<aside class="focus-banner" aria-label="${I.S("Focus from your teacher", "Enfoque de tu docente")}">
    <span class="focus-ico">${icon("flag")}</span>
    <p><strong>${I.T("Today's focus from your teacher", "El enfoque de hoy de tu docente")}: ${I.T(f[0], f[1])}</strong> ${I.T(f[2], f[3])}${ask ? html` <span class="focus-ask">${ask}</span>` : ""}</p>
  </aside>`;
}

const link = (ctx, id, extra = "") => `${location.origin}${BASE}/write/${id}?grades=${ctx.band}${extra}`;

/** Teacher view, inside the task's teacher notes: assign with a focus, print a conference sheet. */
export function teacherAssignHTML(I, ctx, task) {
  const offered = Object.keys(FOCUS).filter((k) => (task.revisionPrompts || []).some((p) => p.focus === k));
  const list = offered.length ? offered : Object.keys(FOCUS);
  return html`<div class="teacher-assign">
    <h4>${I.T("Assign with a focus", "Asignar con un enfoque")}</h4>
    <p class="fine">${I.T("Pick one focus. Students who open the link see it above the steps. The link carries no student information.", "Elija un enfoque. Los estudiantes que abren el enlace lo ven sobre los pasos. El enlace no lleva información de estudiantes.")}</p>
    <p class="focus-links">${list.map((k) => html`<button type="button" class="btn small" data-copy-link="${link(ctx, task.id, `&focus=${k}`)}">${icon("copy")} ${I.T(FOCUS[k][0], FOCUS[k][1])}</button>`)}</p>
    <p class="row-actions"><a class="btn small" href="${BASE}/write/${task.id}?grades=${ctx.band}&sheet=conference" target="_blank" rel="noopener">${icon("print")} ${I.T("Conference sheet to print", "Hoja de conferencia para imprimir")}</a><a class="btn small" href="${BASE}/write/${task.id}?grades=${ctx.band}&sheet=compare">${icon("library")} ${I.T("Mini-lesson: compare two samples", "Minilección: comparar dos ejemplos")}</a></p>
  </div>`;
}

/** Teacher view, beside a draft: a note that stays with this piece on this device and shows in the writer's portfolio. */
export function conferenceHTML(I, state, hasDraft) {
  const c = state.conference || {};
  if (!isTeacherView()) {
    if (!String(c.glow || "").trim() && !String(c.next || "").trim()) return "";
    return html`<aside class="conference-card" aria-label="${I.S("From your writing conference", "De tu conferencia de escritura")}">
      <h4>${icon("teacher")} ${I.T("From your writing conference", "De tu conferencia de escritura")}</h4>
      ${String(c.glow || "").trim() ? html`<p><strong>${I.T("Working well:", "Va bien:")}</strong> ${c.glow}</p>` : ""}
      ${String(c.next || "").trim() ? html`<p><strong>${I.T("Next step:", "Siguiente paso:")}</strong> ${c.next}</p>` : ""}
    </aside>`;
  }
  return html`<section class="panel teacher-notes conference-note no-print" aria-labelledby="wrt-conf-h">
    <h3 id="wrt-conf-h">${icon("teacher")} ${I.T("Conference with this writer", "Conferencia con este escritor")}</h3>
    <p class="fine">${hasDraft ? I.T("Teacher view only. Your note is saved with this piece on this device. The writer sees it here and in their portfolio.", "Solo en la vista docente. Su nota se guarda con este texto en este dispositivo. El escritor la ve aquí y en su portafolio.") : I.T("Teacher view only. Open this on the writer's device after they have a draft, then leave a note here.", "Solo en la vista docente. Abra esto en el dispositivo del escritor cuando tenga un borrador y deje una nota aquí.")}</p>
    <div class="partner-fields">
      <label class="field"><span>${I.T("One thing that is working", "Una cosa que va bien")}</span><textarea rows="2" maxlength="400" data-conference-field="glow" ${IGN}>${c.glow || ""}</textarea></label>
      <label class="field"><span>${I.T("One next step", "Un siguiente paso")}</span><textarea rows="2" maxlength="400" data-conference-field="next" ${IGN}>${c.next || ""}</textarea></label>
    </div>
  </section>`;
}

/** A one-page sheet for conferring on a task: look-fors, questions and room for notes. Carries no student data. */
export function conferenceSheetHTML(I, ctx, task) {
  const lines = (n) => Array.from({ length: n }, () => html`<span class="sheet-line"></span>`);
  return html`<article class="conference-sheet d-writing">
    <p class="row-actions no-print"><button type="button" class="btn btn-primary" data-print>${icon("print")} ${I.T("Print this sheet", "Imprimir esta hoja")}</button><a class="btn" href="${BASE}/write/${task.id}?grades=${ctx.band}">${icon("arrow-left")} ${I.T("Back to the task", "Volver a la tarea")}</a></p>
    <header>
      <p class="eyebrow">${I.T("Writing conference", "Conferencia de escritura")} · ${task.keyUse} · ${task.contentArea}</p>
      <h1 tabindex="-1">${task.title}</h1>
      <p class="sheet-names"><span>${I.T("Writer", "Escritor")}: <span class="sheet-line"></span></span><span>${I.T("Date", "Fecha")}: <span class="sheet-line"></span></span></p>
      <p class="sheet-task"><strong>${I.T("Task", "Tarea")}:</strong> ${task.prompt}</p>
    </header>
    <section><h2>${I.T("Look for", "Observe")}</h2>
      <ul class="sheet-checks">${(task.organizer || []).map((o) => html`<li><span class="sheet-box"></span><span><strong>${o.label}.</strong> ${o.hint}</span></li>`)}</ul></section>
    ${task.revisionPrompts?.length ? html`<section><h2>${I.T("Questions to ask", "Preguntas para hacer")}</h2><ul>${task.revisionPrompts.map((p) => html`<li><em>${FOCUS[p.focus] ? I.T(FOCUS[p.focus][0], FOCUS[p.focus][1]) : p.focus}:</em> ${p.prompt}</li>`)}</ul></section>` : ""}
    <section class="sheet-notes">
      <div><h2>${I.T("Working well", "Va bien")}</h2>${lines(3)}</div>
      <div><h2>${I.T("One next step", "Un siguiente paso")}</h2>${lines(3)}</div>
    </section>
    <section><h2>${I.T("Help the writer used", "Ayuda que usó el escritor")}</h2>
      <p class="sheet-help"><span><span class="sheet-box"></span> ${I.T("Frames and words", "Marcos y palabras")}</span><span><span class="sheet-box"></span> ${I.T("Word bank", "Banco de palabras")}</span><span><span class="sheet-box"></span> ${I.T("On their own", "Por su cuenta")}</span></p></section>
    <p class="fine">${I.T("Classroom practice notes. Not a WIDA score or a proficiency level.", "Notas de práctica en el aula. No son una puntuación de WIDA ni un nivel de dominio.")}</p>
  </article>`;
}

// ── events ───────────────────────────────────────────────────────────────────────────────────
/** Typing in a quick write, a partner field or a conference field. `save` persists the studio document. */
export function onMoreInput(e, I, studio, state, save) {
  const t = e.target;
  if (t.matches?.("[data-quick-draft]")) {
    const id = t.closest("[data-quick]")?.dataset.quick;
    if (!id) return true;
    const w = writingState(studio, quickKey(id));
    w.draft = t.value;
    w.quick = true;
    w.updatedAt = new Date().toISOString();
    const n = wordCount(t.value);
    const count = document.querySelector("[data-quick-count]");
    if (count) count.textContent = I.S(`${n} words`, `${n} palabras`);
    const b = document.querySelector("[data-quick-save]");
    if (b) b.disabled = !n;
    save();
    return true;
  }
  if (!state) return false;
  if (t.matches?.("[data-partner-field]")) {
    state.partner ||= {};
    state.partner[t.dataset.partnerField] = t.value;
    save();
    return true;
  }
  if (t.matches?.("[data-conference-field]")) {
    state.conference ||= {};
    state.conference[t.dataset.conferenceField] = t.value;
    state.conference.t = new Date().toISOString();
    save();
    return true;
  }
  return false;
}

/** Clicks on the quick-write page. Returns "rerender" when the page should be drawn again, true when handled. */
export function onMoreClick(e, I, studio, save, tasks = []) {
  const t = e.target;
  const start = t.closest("[data-quick-start]");
  if (start) {
    const box = document.querySelector("[data-quick-draft]");
    if (!box) return true;
    const r = insertion(box.value, box.value.length, box.value.length, start.dataset.quickStart);
    box.value = r.value;
    box.focus();
    box.setSelectionRange(r.selStart, r.selEnd);
    box.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }
  if (t.closest("[data-quick-save]")) {
    const id = t.closest("[data-quick]")?.dataset.quick;
    const box = document.querySelector("[data-quick-draft]");
    if (!id || !box?.value.trim()) return true;
    const before = badgeFacts(studio, tasks);
    const w = writingState(studio, quickKey(id));
    addVersion(w, box.value, "final");
    w.draft = box.value;
    w.quick = true;
    w.finishedAt = new Date().toISOString();
    w.updatedAt = w.finishedAt;
    save();
    announce(I.S("Saved. Nice writing!", "Guardado. ¡Buena escritura!"));
    celebrateBadges(I, before, badgeFacts(studio, tasks));
    return "rerender";
  }
  return false;
}
