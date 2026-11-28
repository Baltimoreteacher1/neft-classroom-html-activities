// Leveled writing assignments: the pieces of the Writing Studio that change with the support level a teacher chose
// (src/lang/write-level.js decides what changes; this file only draws it). The student page, the teacher's link buttons and
// the printed sheet all read the same plan.
import { disclosure } from "../studio-ui.js";
import { BASE, html, icon } from "../util.js";
import { glossOf, LEVEL_NOTE, leveledLink, levelPlan, linesFor, WRITE_LEVELS } from "../lang/write-level.js";

const chip = (text, insert) =>
  insert
    ? html`<li><button type="button" class="insert-chip" data-insert="${text}">${text}</button></li>`
    : html`<li>${text}</li>`;

// Learners see only the number ("Support level 2"). The WIDA level name stays on the teacher's side: a label like "Entering" is
// useful to a teacher choosing supports, and is not something to hang on a student's own page.
const levelTitle = (I, plan) => html`${I.T("Support level", "Nivel de apoyo")} ${plan.level}`;

/** Above the steps: who set this level and what it changes, in plain words. */
export function levelBannerHTML(I, plan, { changedStage = false } = {}) {
  return html`<aside class="focus-banner level-banner" aria-label="${I.S("Support level from your teacher", "Nivel de apoyo de tu docente")}">
    <span class="focus-ico">${icon("flag")}</span>
    <div>
      <p><strong>${I.T("Your teacher set this task for", "Tu docente preparó esta tarea para")} ${levelTitle(I, plan)}.</strong></p>
      <ul class="level-changes">${plan.changes.map(([en, es]) => html`<li>${I.T(en, es)}</li>`)}</ul>
      ${changedStage ? html`<p class="fine">${I.T("You chose a different help setting, so the usual supports for that setting are shown instead.", "Elegiste otra opción de ayuda, así que se muestran los apoyos habituales de esa opción.")}</p>` : ""}
      <p class="fine">${I.T(LEVEL_NOTE[0], LEVEL_NOTE[1])}</p>
    </div>
  </aside>`;
}

/** The supports panel for a level. Replaces the usual panel while the student keeps the level's starting help setting. */
export function levelSupportsHTML(I, task, plan) {
  const parts = [];
  if (plan.support === "frames") {
    parts.push(
      disclosure(
        "lvl-frames",
        I.T("Sentence frames", "Marcos de oraciones"),
        html`<p class="fine">${I.T(`Write these ${plan.frames.length} sentences. Tap a frame to add it, then fill the blanks.`, `Escribe estas ${plan.frames.length} oraciones. Toca un marco para agregarlo y llena los espacios.`)}</p><ul class="frames inline">${plan.frames.map((f) => chip(f, true))}</ul>`,
        { open: true },
      ),
    );
  } else if (plan.support === "starters") {
    parts.push(
      disclosure(
        "lvl-starters",
        I.T("Sentence starters", "Inicios de oraciones"),
        html`<p class="fine">${I.T("Start each sentence with one of these, then finish it in your own words.", "Empieza cada oración con uno de estos y termínala con tus propias palabras.")}</p><ul class="frames inline">${plan.starters.map((f) => chip(f.replace(/\s…$/, ""), true))}</ul>`,
        { open: true },
      ),
    );
  } else if (plan.support === "outline") {
    parts.push(
      disclosure(
        "lvl-outline",
        I.T("Your plan outline", "El esquema de tu plan"),
        html`<ol class="level-outline">${plan.outline.map((o) => html`<li><strong>${o.label}.</strong> ${o.hint}</li>`)}</ol>`,
        { open: true },
      ),
    );
  }
  if (plan.bank.words.length) {
    parts.push(
      disclosure(
        "lvl-bank",
        I.T(plan.bank.label[0], plan.bank.label[1]),
        html`<ul class="wordbank">${plan.bank.words.map((w) => {
          const es = plan.bank.glosses ? glossOf(task, w) : "";
          return es ? html`<li><button type="button" class="insert-chip" data-insert="${w}">${w}</button> <span class="fine" lang="es">${es}</span></li>` : chip(w, true);
        })}</ul>`,
        { open: plan.bank.open },
      ),
    );
  }
  if (plan.homeLanguage !== "off" && (task.promptEs || task.scenarioEs)) {
    parts.push(
      disclosure(
        "lvl-home",
        html`${icon("language")} ${I.T("Directions in Spanish", "Instrucciones en español")}`,
        html`${task.scenarioEs ? html`<p lang="es">${task.scenarioEs}</p>` : ""}${task.promptEs ? html`<p lang="es"><strong>${task.promptEs}</strong></p>` : ""}<p class="fine">${I.T("You can plan in any language you know. Your final writing is in English.", "Puedes planear en cualquier idioma que sepas. Tu escritura final es en inglés.")}</p>`,
        { open: plan.homeLanguage === "open" },
      ),
    );
  }
  if (plan.sayFirst) {
    parts.push(html`<p class="own-note level-say">${icon("volume")}<span>${I.T(`Say ${plan.sayFirst} out loud before you write it. Then write what you said.`, `Di ${plan.sayFirst === "each sentence" ? "cada oración" : "tu afirmación"} en voz alta antes de escribirla. Luego escribe lo que dijiste.`)}</span></p>`);
  }
  if (plan.model === "available") {
    parts.push(
      html`<details class="studio-disc" data-model data-d="model">
        <summary>${icon("star")} ${I.T("See a model response", "Ver una respuesta modelo")}</summary>
        <div class="disc-body"><p class="fine">${I.T("Opening the model is saved as extra support.", "Abrir el modelo se guarda como apoyo extra.")}</p><p class="portfolio-response">${task.stages.guided.model}</p></div>
      </details>`,
    );
  }
  if (plan.criteria.length) {
    parts.push(disclosure("lvl-criteria", I.T("What a good answer has", "Qué tiene una buena respuesta"), html`<ul>${plan.criteria.map((c) => html`<li>${c}</li>`)}</ul>`, { open: plan.level >= 5 }));
  }
  if (plan.revision.length) {
    parts.push(
      disclosure(
        "lvl-revise",
        I.T("When you revise, ask yourself", "Cuando revises, pregúntate"),
        html`<ul>${plan.revision.map((p) => html`<li>${p.prompt}</li>`)}</ul>`,
      ),
    );
  }
  const title = I.S(`Supports for level ${plan.level}`, `Apoyos para el nivel ${plan.level}`);
  return html`<section class="panel supports-panel level-supports" aria-label="${title}">
    <h3>${icon("bulb")} ${I.T("Supports for this level", "Apoyos para este nivel")} <span class="tag">${levelTitle(I, plan)}</span></h3>
    ${plan.level >= 5 && !plan.bank.words.length ? html`<p class="own-note">${icon("user")}<span>${I.T("This level has no frames or word bank. Your sources, your notes and the checklist are here.", "Este nivel no tiene marcos ni banco de palabras. Aquí están tus fuentes, tus notas y la lista de metas.")}</span></p>` : ""}
    ${parts}
  </section>`;
}

/** Teacher view: one link and one printable sheet per level, and the six levels side by side. */
export function teacherLevelsHTML(I, ctx, task, focus = "") {
  const origin = typeof location === "undefined" ? "" : location.origin;
  return html`<div class="teacher-assign teacher-levels">
    <h4>${I.T("Assign at a support level", "Asignar con un nivel de apoyo")}</h4>
    <p class="fine">${I.T("Each link opens this task with that level's frames, word bank, length and Spanish help already set. The link carries only the level number. It carries no student information.", "Cada enlace abre esta tarea con los marcos, el banco de palabras, la extensión y la ayuda en español de ese nivel. El enlace solo lleva el número del nivel. No lleva información de estudiantes.")}</p>
    <ul class="level-rows">${WRITE_LEVELS.map((n) => {
      const p = levelPlan(task, n);
      return html`<li>
        <span class="level-name"><strong>${n}</strong> ${I.T(p.name.en, p.name.es)}</span>
        <span class="fine">${I.T(p.changes[1][0], p.changes[1][1])}</span>
        <span class="level-acts">
          <button type="button" class="btn small" data-copy-link="${leveledLink(origin, BASE, ctx.band, task.id, n, focus)}" aria-label="${I.S(`Copy the level ${n} link`, `Copiar el enlace del nivel ${n}`)}">${icon("copy")} ${I.T("Copy link", "Copiar enlace")}</button>
          <a class="btn small" href="${BASE}/write/${task.id}?grades=${ctx.band}&sheet=level&level=${n}" target="_blank" rel="noopener" aria-label="${I.S(`Print the level ${n} sheet`, `Imprimir la hoja del nivel ${n}`)}">${icon("print")} ${I.T("Print", "Imprimir")}</a>
        </span>
      </li>`;
    })}</ul>
    <p class="row-actions"><a class="btn small" href="${BASE}/write/${task.id}?grades=${ctx.band}&sheet=levels" target="_blank" rel="noopener">${icon("print")} ${I.T("Compare all six levels", "Comparar los seis niveles")}</a></p>
    <p class="fine">${I.T(LEVEL_NOTE[0], LEVEL_NOTE[1])}</p>
  </div>`;
}

/** A printable copy of the task at one level: only what that level offers, with ruled lines for the writing. */
export function levelSheetHTML(I, ctx, task, plan) {
  const lines = (n) => Array.from({ length: n }, () => html`<span class="sheet-line"></span>`);
  return html`<article class="conference-sheet level-sheet d-writing">
    <p class="row-actions no-print"><button type="button" class="btn btn-primary" data-print>${icon("print")} ${I.T("Print this sheet", "Imprimir esta hoja")}</button><a class="btn" href="${BASE}/write/${task.id}?grades=${ctx.band}">${icon("arrow-left")} ${I.T("Back to the task", "Volver a la tarea")}</a></p>
    <header>
      <p class="eyebrow">${I.T("Writing", "Escritura")} · ${task.keyUse} · ${task.contentArea} · ${levelTitle(I, plan)}</p>
      <h1 tabindex="-1">${task.title}</h1>
      <p class="sheet-names"><span>${I.T("Name", "Nombre")}: <span class="sheet-line"></span></span><span>${I.T("Date", "Fecha")}: <span class="sheet-line"></span></span></p>
      <p class="sheet-task"><strong>${I.T("Task", "Tarea")}:</strong> ${task.prompt}</p>
      ${plan.homeLanguage !== "off" && task.promptEs ? html`<p class="sheet-task" lang="es"><strong>Tarea:</strong> ${task.promptEs}</p>` : ""}
      <p class="fine">${I.T(plan.changes[0][0], plan.changes[0][1])}</p>
    </header>
    ${plan.support === "frames" ? html`<section><h2>${I.T("Sentence frames", "Marcos de oraciones")}</h2><ol class="sheet-frames">${plan.frames.map((f) => html`<li>${f}</li>`)}</ol></section>` : ""}
    ${plan.support === "starters" ? html`<section><h2>${I.T("Sentence starters", "Inicios de oraciones")}</h2><ol class="sheet-frames">${plan.starters.map((f) => html`<li>${f}</li>`)}</ol></section>` : ""}
    ${plan.support === "outline" ? html`<section><h2>${I.T("Plan outline", "Esquema del plan")}</h2><ol class="sheet-frames">${plan.outline.map((o) => html`<li><strong>${o.label}.</strong> ${o.hint}</li>`)}</ol></section>` : ""}
    ${plan.bank.words.length ? html`<section><h2>${I.T(plan.bank.label[0].replace(/ \(.*\)$/, ""), plan.bank.label[1].replace(/ \(.*\)$/, ""))}</h2><p class="sheet-words">${plan.bank.words.map((w) => { const es = plan.bank.glosses ? glossOf(task, w) : ""; return html`<span class="sheet-word">${w}${es ? html` <i lang="es">(${es})</i>` : ""}</span>`; })}</p></section>` : ""}
    <section><h2>${I.T("Write here", "Escribe aquí")}</h2><div class="sheet-writing">${lines(linesFor(plan))}</div></section>
    ${plan.criteria.length ? html`<section><h2>${I.T("Check your writing", "Revisa tu escritura")}</h2><ul class="sheet-checks">${plan.criteria.map((c) => html`<li><span class="sheet-box"></span><span>${c}</span></li>`)}</ul></section>` : ""}
    <p class="fine">${I.T(LEVEL_NOTE[0], LEVEL_NOTE[1])}</p>
  </article>`;
}

/** Teacher view: the six levels for one task side by side, to print and keep. */
export function levelsGlanceHTML(I, ctx, task) {
  const rows = WRITE_LEVELS.map((n) => levelPlan(task, n));
  const yes = I.T("Open", "Abierto");
  return html`<article class="conference-sheet level-sheet d-writing">
    <p class="row-actions no-print"><button type="button" class="btn btn-primary" data-print>${icon("print")} ${I.T("Print this page", "Imprimir esta página")}</button><a class="btn" href="${BASE}/write/${task.id}?grades=${ctx.band}">${icon("arrow-left")} ${I.T("Back to the task", "Volver a la tarea")}</a></p>
    <header>
      <p class="eyebrow">${I.T("Writing at six support levels", "Escritura en seis niveles de apoyo")} · ${task.keyUse} · ${task.contentArea}</p>
      <h1 tabindex="-1">${task.title}</h1>
    </header>
    <div class="lab-table-wrap"><table class="data-table level-table">
      <caption class="visually-hidden">${I.S("What each support level changes for this task", "Lo que cambia cada nivel de apoyo en esta tarea")}</caption>
      <thead><tr><th scope="col">${I.T("Level", "Nivel")}</th><th scope="col">${I.T("Length", "Extensión")}</th><th scope="col">${I.T("Writing help", "Ayuda para escribir")}</th><th scope="col">${I.T("Word bank", "Banco de palabras")}</th><th scope="col">${I.T("Spanish", "Español")}</th><th scope="col">${I.T("Model", "Modelo")}</th></tr></thead>
      <tbody>${rows.map((p) => html`<tr>
        <th scope="row">${p.level} ${I.T(p.name.en, p.name.es)}</th>
        <td>${p.sentences ? I.T(`${p.sentences} sentences`, `${p.sentences} oraciones`) : ""} ${p.expected.minWords}–${p.expected.maxWords} ${I.T("words", "palabras")}</td>
        <td>${{ frames: I.T("Full frames", "Marcos completos"), starters: I.T("Starters", "Inicios"), outline: I.T("Outline", "Esquema"), none: I.T("None", "Ninguna") }[p.support]}</td>
        <td>${p.bank.words.length ? html`${p.bank.words.length} ${p.bank.open ? yes : I.T("On request", "A pedido")}${p.bank.glosses ? html` + ${I.T("Spanish", "español")}` : ""}` : "—"}</td>
        <td>${p.homeLanguage === "open" ? yes : p.homeLanguage === "on-request" ? I.T("On request", "A pedido") : "—"}</td>
        <td>${p.model === "available" ? yes : "—"}</td>
      </tr>`)}</tbody>
    </table></div>
    <p class="fine">${I.T(LEVEL_NOTE[0], LEVEL_NOTE[1])}</p>
  </article>`;
}
