// Writing Studio, the parts around the draft: where a writer left off, finding a task, a self-check before feedback,
// live counts while typing, frames / words / evidence that drop into the draft, and the planning notes a teacher sees.
// Nothing here scores writing. Counts describe the page (words, sentences, versions); the self-check is the writer's
// own. "On my own" gets a proofreading check only, never the structure of the response, so an independent attempt
// stays independent. Teacher notes render only in Teacher view and reuse what the task already carries.
import { readAudience } from "../audience.js";
import { revealFoldsFor } from "../fold.js";
import { sentences as splitSentences } from "../lang/text.js";
import { speak } from "../speech.js";
import { disclosure } from "../studio-ui.js";
import { BASE, announce, formatDate, html, icon, raw, todayISO, wordCount } from "../util.js";

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

const FOCUS = {
  evidence: ["Evidence", "Evidencia"],
  reasoning: ["Reasoning", "Razonamiento"],
  cohesion: ["Connecting ideas", "Conectar ideas"],
  precision: ["Precise words", "Palabras precisas"],
  sentence: ["Sentences", "Oraciones"],
};

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
                  <ul>${task.revisionPrompts.map((p) => html`<li><em>${FOCUS[p.focus] ? I.T(...FOCUS[p.focus]) : p.focus}:</em> ${p.prompt}</li>`)}</ul>`
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
