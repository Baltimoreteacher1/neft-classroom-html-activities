// Sentence Lab (/sentences): build, combine and expand sentences from tiles (drag, or tap to place), spot and fix
// errors, and finish boss paragraphs. A live "sentence machine" shows the parts and the clauses. Spanish contrast
// notes explain common transfer challenges. Routes: /sentences, /sentences/<level>, /sentences/boss/<id>, /sentences/notes.
import { setComponentsI18n } from "../components.js";
import {
  BOSSES,
  CONTRAST,
  LEVELS,
  POS,
  RULES,
  ROLE,
  bossFor,
  findBoss,
  levelsFor,
  tasksFor,
} from "../content/craft-sentences.js";
import { i18nFor } from "../i18n.js";
import { loadCraft, recordCraft, saveCraft } from "../lang/craft.js";
import {
  SENTENCE_TYPE,
  checkBuild,
  joinerNote,
  machineModel,
  parseSentence,
  seededShuffle,
  sentenceType,
  tilesFor,
} from "../lang/craft-sentence.js";
import { ART as ARTS_BASE, announce, html, icon, raw } from "../util.js";
import {
  ART,
  cardHTML,
  craftCrumbs,
  craftHref,
  heroHTML,
  levelClick,
  levelPickerHTML,
  practiceNote,
  progressBar,
} from "./craft-ui.js";

const ROUND = 5;
let current = null; // { kind: "level"|"boss"|"notes", id }
let ui = {
  taskId: "",
  tray: [],
  placed: [],
  tries: 0,
  hint: false,
  result: null,
  pick: null,
  wrong: false,
};
let lastCtx = null;
let dragBound = false;

/** One practice order per level: kinds take turns so a level never feels like one worksheet. */
function ordered(band, lv) {
  const groups = ["b", "s", "c", "f", "e"].map((k) =>
    tasksFor(band, lv).filter((t) => t.kind === k),
  );
  const out = [];
  for (let i = 0; groups.some((g) => i < g.length); i++)
    for (const g of groups) if (g[i]) out.push(g[i]);
  return out;
}
const done = (state, id) => Boolean(state.sentences.tasks[id]?.ok);
const parsedOf = (task) => (task.a ? parseSentence(task.a) : null);
const corrected = (task) => (task.kind === "f" ? task.opts[0] : parsedOf(task)?.text || "");

function resetUi(task) {
  const parsed = parsedOf(task);
  const tiles = parsed ? tilesFor(task, parsed) : [];
  const base = {
    taskId: task.id,
    tray: parsed
      ? seededShuffle(tiles, task.id)
      : task.kind === "f"
        ? seededShuffle(task.opts, task.id)
        : [],
    placed: [],
    tries: 0,
    hint: false,
    result: null,
    pick: null,
    wrong: false,
  };
  ui = base;
}

// ── small renderers ──────────────────────────────────────────────────────────
const contrastHTML = (I, code) => {
  const c = CONTRAST[code];
  if (!c) return "";
  return html`<aside
    class="cs-contrast"
    aria-label="${I.S("Spanish tip", "Consejo para hispanohablantes")}"
  >
    <h4>${icon("language")} ${I.T("Spanish speakers: ", "Si hablas español: ")}${I.TO(c.name)}</h4>
    <p>${I.TO(c.text)}</p>
    <p class="cs-ex" lang="es">${c.ex}</p>
    <p class="cs-ex" lang="en">${icon("check")} ${c.right} <s>${c.wrong}</s></p>
  </aside>`;
};
const ruleHTML = (I, id) => {
  const r = RULES[id];
  return r
    ? html`<div class="cs-rule">
          <h4>${icon("bulb")} ${I.TO(r.name)}</h4>
          <p>${I.TO(r.rule)}</p>
        </div>
        ${contrastHTML(I, r.contrast)}`
    : "";
};

function machineHTML(I, parsed, placed) {
  const model = machineModel(parsed);
  const semi = parsed.tokens.some((t) => t.text === ";");
  const has = (text) => !placed || placed.includes(text);
  return html`<figure
    class="cs-machine"
    aria-label="${I.S("Sentence machine", "Máquina de oraciones")}"
  >
    <div class="cs-m-row">
      ${model.map(
        (c, n) =>
          html`${n > 0 ? html`<div class="cs-m-join" aria-hidden="false">${icon("settings")} ${c.conn.length ? c.conn.map((w) => html`<strong lang="en">${w.text}</strong> <small>${I.TO(joinerNote(w.text, w.pos))}</small>`) : semi ? html`<strong>;</strong> <small>${I.TO(joinerNote(";", ""))}</small>` : ""}</div>` : ""}
            <div class="cs-m-clause ${c.type === "D" ? "is-dep" : ""}">
              <p class="cs-m-type">
                ${c.type === "D" ? I.T("Needs another idea", "Necesita otra idea") : I.T("Complete idea", "Idea completa")}${n === 0 && c.conn.length && c.type === "D" ? html` · <strong lang="en">${c.conn[0].text}</strong> <small>${I.TO(joinerNote(c.conn[0].text, c.conn[0].pos))}</small>` : ""}
              </p>
              <div class="cs-m-slots">
                ${["S", "V", "O", "M", "R"].filter((r) => c.slots[r].length || r === "S" || r === "V").map((r) => html`<div class="cs-m-slot r-${r}"><span class="cs-m-label">${I.TO(ROLE[r])}</span><span class="cs-m-fill" lang="en">${c.slots[r].filter(has).join(" · ") || html`<i>${I.TO(ROLE[r].ask)}</i>`}</span></div>`)}
              </div>
            </div>`,
      )}
    </div>
    <figcaption>${I.TO(SENTENCE_TYPE[sentenceType(parsed)])}</figcaption>
  </figure>`;
}

function tileHTML(I, tile, level, shown, attrs) {
  const wordMode = tile.pos && POS[tile.pos];
  const label = wordMode
    ? POS[tile.pos].key
    : tile.role === "C"
      ? "Join"
      : tile.role === "P"
        ? ""
        : tile.role;
  const cls =
    shown || level !== "C" ? `t-${tile.role} ${tile.pos ? `p-${tile.pos}` : ""}` : "t-plain";
  return html`<button type="button" class="cs-tile ${cls}" ${raw(attrs)}>
    <span lang="en">${tile.text}</span
    >${(shown || level === "A") && label ? html`<small aria-hidden="true">${label}</small>` : ""}
  </button>`;
}

function legendHTML(I, task, parsed, level, shown) {
  if (!(shown || level !== "C")) return "";
  const words = task.kind === "b" && task.lv <= 2;
  const items = words
    ? [...new Set(parsed.tokens.map((t) => t.pos).filter((p) => POS[p]))].map((p) => [
        `p-${p}`,
        POS[p].key,
        I.T(POS[p].en, POS[p].es),
      ])
    : [...new Set(parsed.tokens.map((t) => t.role))].map((r) => [`t-${r}`, r, I.TO(ROLE[r])]);
  return html`<ul class="cs-legend" aria-label="${I.S("Color key", "Clave de colores")}">
    ${items.map(([cls, key, name]) => html`<li><span class="cs-sw ${cls}">${key}</span> ${name}</li>`)}
  </ul>`;
}

// ── task bodies ──────────────────────────────────────────────────────────────
function buildBody(I, task, level) {
  const parsed = parsedOf(task);
  const solved = ui.result?.ok;
  const placedTexts = ui.placed.map((i) => ui.tray[i].text);
  const prompt =
    task.kind === "b"
      ? I.T(
          "Build the sentence. Put the tiles in order.",
          "Construye la oración. Pon las fichas en orden.",
        )
      : task.kind === "c"
        ? I.T("Combine these into one sentence.", "Combina estas oraciones en una sola.")
        : I.T("Expand the sentence.", "Amplía la oración.");
  return html`<p class="cs-prompt"><strong>${prompt}</strong></p>
    ${
      task.from
        ? html`<ul class="cs-from" lang="en">
            ${task.from.map((s) => html`<li>${s}</li>`)}
          </ul>`
        : ""
    }
    ${task.add ? html`<p class="cs-add" lang="en">${task.add}</p>` : ""}
    ${task.hint ? html`<p class="fine" lang="en">${level === "C" && !ui.hint ? "" : task.hint}</p>` : ""}
    ${legendHTML(I, task, parsed, level, solved)}
    <div
      class="cs-zone"
      data-sl-drop
      aria-label="${I.S("My sentence", "Mi oración")}"
      aria-live="polite"
    >
      ${ui.placed.length ? ui.placed.map((ti, pos) => html`<span class="cs-placed"><button type="button" class="cs-nudge" data-sl-left="${pos}" aria-label="${I.S("Move left", "Mover a la izquierda")}" ${pos === 0 || solved ? raw("disabled") : ""}>${icon("arrow-left")}</button>${tileHTML(I, ui.tray[ti], level, solved, `data-sl-placed="${pos}" draggable="true" aria-label="${ui.tray[ti].text} — ${I.S("tap to take it back", "toca para quitarla")}" ${solved ? "disabled" : ""}`)}<button type="button" class="cs-nudge" data-sl-right="${pos}" aria-label="${I.S("Move right", "Mover a la derecha")}" ${pos === ui.placed.length - 1 || solved ? raw("disabled") : ""}>${icon("arrow-right")}</button></span>`) : html`<span class="fine">${I.T("Tap or drag tiles here.", "Toca o arrastra fichas aquí.")}</span>`}
    </div>
    <div class="cs-tray-tiles" role="group" aria-label="${I.S("Tiles", "Fichas")}">
      ${ui.tray.map((t, i) => (ui.placed.includes(i) ? "" : tileHTML(I, t, level, solved, `data-sl-tile="${i}" draggable="true"`)))}
    </div>
    ${level !== "C" && !solved ? machineHTML(I, parsed, placedTexts) : ""}
    <p class="row-actions no-print">
      <button type="button" class="btn btn-primary" data-sl-check ${solved ? raw("disabled") : ""}>
        ${icon("check")} ${I.T("Check", "Revisar")}
      </button>
      <button
        type="button"
        class="ghost"
        data-sl-undo
        ${ui.placed.length && !solved ? "" : raw("disabled")}
      >
        ${I.T("Undo", "Deshacer")}
      </button>
      <button
        type="button"
        class="ghost"
        data-sl-clear
        ${ui.placed.length && !solved ? "" : raw("disabled")}
      >
        ${I.T("Clear", "Borrar todo")}
      </button>
      ${level !== "C" && !solved ? html`<button type="button" class="ghost" data-sl-hint>${icon("bulb")} ${I.T("Hint: next tile", "Pista: siguiente ficha")}</button>` : ""}
    </p>`;
}

function spotBody(I, task, level) {
  const words = task.s.split(" ");
  const solved = ui.result?.ok;
  return html`<p class="cs-prompt">
      <strong
        >${I.T("One part of this sentence has an error. Tap it.", "Una parte de esta oración tiene un error. Tócala.")}</strong
      >
    </p>
    ${level === "A" ? html`<p class="fine">${I.T("Look for a problem with:", "Busca un problema con:")} ${I.TO(RULES[task.rule].name)}</p>` : ""}
    <p class="cs-spot" lang="en">
      ${words.map((w, i) => html`<button type="button" class="cs-word ${solved && task.at.includes(i) ? "is-err" : ""} ${ui.pick === i && !solved ? "is-wrong" : ""}" data-sl-spot="${i}" ${solved ? raw("disabled") : ""}>${w}</button> `)}
    </p>
    ${ui.wrong ? html`<p class="cs-next" role="status">${icon("arrow-right")} ${I.T("That part is fine. Read the sentence aloud and listen for what sounds off.", "Esa parte está bien. Lee la oración en voz alta y escucha qué suena raro.")}</p>` : ""}`;
}

function fixBody(I, task, level) {
  const solved = ui.result?.ok;
  return html`<p class="cs-prompt">
      <strong
        >${I.T("This sentence has an error. Choose the best fix.", "Esta oración tiene un error. Elige la mejor corrección.")}</strong
      >
    </p>
    <p class="cs-wrong-s" lang="en"><s>${task.s}</s></p>
    ${level === "A" ? html`<p class="fine">${I.T("Look for a problem with:", "Busca un problema con:")} ${I.TO(RULES[task.rule].name)}</p>` : ""}
    <div class="cs-opts" role="group" aria-label="${I.S("Fixes", "Correcciones")}">
      ${ui.tray.map((o, i) => html`<button type="button" class="cat-chip cs-opt ${solved && o === task.opts[0] ? "is-right" : ""} ${ui.pick === o && !solved ? "is-wrong" : ""}" data-sl-opt="${i}" aria-pressed="${ui.pick === o}" lang="en" ${solved ? raw("disabled") : ""}>${o}</button>`)}
    </div>
    ${ui.wrong ? html`<p class="cs-next" role="status">${icon("arrow-right")} ${I.T("Not yet. Read your choice aloud. Does it follow the rule?", "Todavía no. Lee tu elección en voz alta. ¿Sigue la regla?")}</p>` : ""}`;
}

function resultHTML(I, task, level, hasNext, nextHref) {
  if (!ui.result?.ok)
    return ui.result?.hint
      ? html`<p class="cs-next" role="status">${icon("arrow-right")} ${I.TO(ui.result.hint)}</p>`
      : "";
  const parsed = parsedOf(task);
  return html`<div class="cs-result" role="status">
    <p class="cs-win">
      ${icon("check")}
      ${ui.tries ? I.T("You got it.", "Lo lograste.") : I.T("Correct on the first try.", "Correcto al primer intento.")}
      <span lang="en">${corrected(task)}</span>
    </p>
    ${parsed ? machineHTML(I, parsed, null) : ""}
    ${task.rule ? ruleHTML(I, task.rule) : task.c ? contrastHTML(I, task.c) : ""}
    ${task.c && task.rule ? contrastHTML(I, task.c) : ""}
    ${hasNext ? html`<p class="row-actions no-print"><button type="button" class="btn btn-primary" data-sl-next>${I.T("Next task", "Siguiente tarea")} ${icon("arrow-right")}</button></p>` : nextHref ? html`<p class="row-actions no-print"><a class="btn btn-primary" href="${nextHref}">${I.T("Finish", "Terminar")}</a></p>` : ""}
  </div>`;
}

function taskHTML(I, task, level, opts) {
  const body =
    task.kind === "s"
      ? spotBody(I, task, level)
      : task.kind === "f"
        ? fixBody(I, task, level)
        : buildBody(I, task, level);
  const kinds = {
    b: ["Build", "Construir"],
    c: ["Combine", "Combinar"],
    e: ["Expand", "Ampliar"],
    s: ["Spot the error", "Encuentra el error"],
    f: ["Fix it", "Corrígelo"],
  };
  const tip =
    level !== "C" && !ui.result?.ok && (task.c || (task.rule && RULES[task.rule].contrast))
      ? html`<details class="studio-disc">
          <summary>
            ${icon("language")} ${I.T("Spanish tip", "Consejo para hispanohablantes")}
          </summary>
          <div class="disc-body">${contrastHTML(I, task.c || RULES[task.rule].contrast)}</div>
        </details>`
      : "";
  return html`<section class="panel cs-task" aria-labelledby="sl-task">
    <h2 id="sl-task" tabindex="-1">
      <span class="tag">${I.T(...kinds[task.kind])}</span> ${opts.title}
    </h2>
    ${body}${tip} ${resultHTML(I, task, level, opts.hasNext, opts.nextHref)}
  </section>`;
}

// ── pages ────────────────────────────────────────────────────────────────────
function hubHTML(ctx, I) {
  const state = loadCraft();
  const lvls = levelsFor(ctx.band);
  const bosses = bossFor(ctx.band);
  const demo = parseSentence("Because/sc S[it] V[rained] , S[we] V[stayed] M[inside] .");
  return html`${craftCrumbs(I, "sentences", ctx.band)}
    <div class="cs-page cs-sentences">
      ${heroHTML(I, "sentences", {
        eyebrow: I.T(
          `Grades ${ctx.band.replace("-", "–")} · sentences and grammar`,
          `Grados ${ctx.band.replace("-", "–")} · oraciones y gramática`,
        ),
        title: I.T("Sentence Lab", "Laboratorio de oraciones"),
        lead: I.T(
          "Build sentences from tiles, join ideas, add details, and fix mistakes. A sentence machine shows how each part works. Nothing is timed.",
          "Construye oraciones con fichas, une ideas, agrega detalles y corrige errores. Una máquina de oraciones muestra cómo funciona cada parte. Nada tiene tiempo límite.",
        ),
        art: ART.sentences(
          I.S(
            "A sentence machine with gears, a conveyor belt and colored word tiles",
            "Una máquina de oraciones con engranajes, una cinta transportadora y fichas de colores",
          ),
        ),
      })}
      ${levelPickerHTML(I, state.level, "sentences")}
      <section class="panel" aria-labelledby="sl-how">
        <h2 id="sl-how">
          ${I.T("How the machine reads a sentence", "Cómo lee la máquina una oración")}
        </h2>
        ${machineHTML(I, demo, null)}
      </section>
      <section class="task-group" aria-labelledby="sl-levels">
        <header><h2 id="sl-levels">${icon("writing")} ${I.T("Levels", "Niveles")}</h2></header>
        <div class="task-grid">
          ${lvls.map((n) => {
            const info = LEVELS.find((l) => l.n === n);
            const list = tasksFor(ctx.band, n);
            const d = list.filter((t) => done(state, t.id)).length;
            return cardHTML({
              href: craftHref("sentences", ctx.band, String(n)),
              title: I.S(`${n}. ${info.en}`, `${n}. ${info.es}`),
              ico: "writing",
              kind: I.T(`${list.length} tasks`, `${list.length} tareas`),
              desc: I.TO(info.goal),
              done: d ? I.S(`${d} of ${list.length}`, `${d} de ${list.length}`) : "",
            });
          })}
        </div>
      </section>
      <section class="task-group" aria-labelledby="sl-boss">
        <header>
          <h2 id="sl-boss">${icon("medal")} ${I.T("Boss paragraphs", "Párrafos jefe")}</h2>
          <p class="fine">
            ${I.T("Four sentence tasks in one story. Finish them to read your paragraph.", "Cuatro tareas de oraciones en un cuento. Termínalas para leer tu párrafo.")}
          </p>
        </header>
        <div class="task-grid">
          ${bosses.map((b) => cardHTML({ href: craftHref("sentences", ctx.band, `boss/${b.id}`), title: I.TO(b.title), ico: "medal", kind: I.T("Boss paragraph", "Párrafo jefe"), desc: I.TO(b.intro), done: state.sentences.boss[b.id]?.complete ? I.S("Finished", "Terminado") : "" }))}
        </div>
      </section>
      <p class="row-actions">
        <a class="btn" href="${craftHref("sentences", ctx.band, "notes")}"
          >${icon("language")}
          ${I.T("Spanish contrast notes", "Notas de contraste con el español")}</a
        >
      </p>
      ${practiceNote(I)}
    </div>`;
}

function notesHTML(ctx, I) {
  return html`${craftCrumbs(I, "sentences", ctx.band, I.S("Spanish contrast notes", "Notas de contraste con el español"))}
    <article class="cs-page cs-sentences">
      <header class="act-head">
        <h1 tabindex="-1">
          ${icon("language")} ${I.T("Spanish contrast notes", "Notas de contraste con el español")}
        </h1>
        <p class="lead">
          ${I.T("English and Spanish build sentences in different ways. These notes name the differences that cause the most common mistakes. They are useful for every learner and are printable.", "El inglés y el español construyen las oraciones de maneras distintas. Estas notas nombran las diferencias que causan los errores más comunes. Sirven para todos y se pueden imprimir.")}
        </p>
      </header>
      <div class="cs-notes">${Object.keys(CONTRAST).map((k) => contrastHTML(I, k))}</div>
      <p class="row-actions no-print">
        <button type="button" class="btn" data-print>
          ${icon("print")} ${I.T("Print the notes", "Imprimir las notas")}
        </button>
      </p>
      ${practiceNote(I)}
    </article>`;
}

function levelHTML(ctx, I, n) {
  const state = loadCraft();
  const list = ordered(ctx.band, n);
  const key = `${ctx.band}:${n}`;
  let pos = state.sentences.pos?.[key] ?? list.findIndex((t) => !done(state, t.id));
  if (pos < 0) pos = state.sentences.pos?.[key] ?? 0;
  pos = Math.min(Math.max(pos, 0), list.length - 1);
  const task = list[pos];
  if (ui.taskId !== task.id) resetUi(task);
  const info = LEVELS.find((l) => l.n === n);
  const d = list.filter((t) => done(state, t.id)).length;
  return html`${craftCrumbs(I, "sentences", ctx.band, `${n}. ${I.S(info.en, info.es)}`)}
    <article class="cs-page cs-sentences activity d-writing">
      <header class="act-head">
        <p class="act-context">
          ${icon("writing")} ${I.T("Sentence Lab", "Laboratorio de oraciones")}
        </p>
        <h1 tabindex="-1">${n}. ${I.T(info.en, info.es)}</h1>
        <p class="lead">${I.TO(info.goal)}</p>
        <p class="fine">
          ${I.T(`Task ${pos + 1} of ${list.length} · ${d} done`, `Tarea ${pos + 1} de ${list.length} · ${d} hechas`)}
          ${progressBar(d, list.length, I.S("Tasks done", "Tareas hechas"))}
        </p>
      </header>
      ${levelPickerHTML(I, state.level, "sentences")}
      ${taskHTML(I, task, state.level, { title: I.T(`Task ${pos + 1}`, `Tarea ${pos + 1}`), hasNext: pos < list.length - 1, nextHref: craftHref("sentences", ctx.band) })}
      <p class="row-actions no-print">
        ${pos > 0 ? html`<button type="button" class="ghost" data-sl-go="${pos - 1}">${icon("arrow-left")} ${I.T("Previous task", "Tarea anterior")}</button>` : ""}${pos < list.length - 1 && !ui.result?.ok ? html`<button type="button" class="ghost" data-sl-go="${pos + 1}">${I.T("Skip for now", "Saltar por ahora")} ${icon("arrow-right")}</button>` : ""}
      </p>
      ${practiceNote(I)}
    </article>`;
}

function bossHTML(ctx, I, boss) {
  const state = loadCraft();
  const bs = state.sentences.boss[boss.id] || { step: 0 };
  const step = Math.min(bs.step || 0, boss.steps.length);
  const complete = step >= boss.steps.length;
  const task = boss.steps[Math.min(step, boss.steps.length - 1)];
  if (!complete && ui.taskId !== task.id) resetUi(task);
  const paragraph = boss.steps.map(corrected).join(" ");
  return html`${craftCrumbs(I, "sentences", ctx.band, I.TO(boss.title))}
    <article class="cs-page cs-sentences activity d-writing">
      <header class="act-head">
        <p class="act-context">${icon("medal")} ${I.T("Boss paragraph", "Párrafo jefe")}</p>
        <h1 tabindex="-1">${I.TO(boss.title)}</h1>
        <p class="lead">${I.TO(boss.intro)}</p>
        <p class="fine">
          ${I.T(`Step ${Math.min(step + 1, boss.steps.length)} of ${boss.steps.length}`, `Paso ${Math.min(step + 1, boss.steps.length)} de ${boss.steps.length}`)}
          ${progressBar(Math.min(step, boss.steps.length), boss.steps.length, I.S("Steps done", "Pasos hechos"))}
        </p>
      </header>
      ${levelPickerHTML(I, state.level, "sentences")}
      ${
        complete
          ? html`<section class="panel cs-win" role="status">
              <h2 tabindex="-1">${I.T("Your paragraph", "Tu párrafo")}</h2>
              <p class="cs-paragraph" lang="en">${paragraph}</p>
              <p class="row-actions no-print">
                <button type="button" class="btn" data-print>
                  ${icon("print")} ${I.T("Print", "Imprimir")}
                </button>
                <a class="btn btn-primary" href="${craftHref("sentences", ctx.band)}"
                  >${I.T("Back to Sentence Lab", "Volver al Laboratorio de oraciones")}</a
                >
              </p>
            </section>`
          : taskHTML(I, task, state.level, {
              title: I.T(`Step ${step + 1}`, `Paso ${step + 1}`),
              hasNext: true,
            })
      }
      ${practiceNote(I)}
    </article>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  setComponentsI18n(I);
  lastCtx = ctx;
  const id = ctx.route.id || "";
  const sub = ctx.route.sub || "";
  if (!id) {
    current = null;
    return { title: I.S("Sentence Lab", "Laboratorio de oraciones"), html: hubHTML(ctx, I) };
  }
  if (id === "notes") {
    current = { kind: "notes" };
    return {
      title: I.S("Spanish contrast notes", "Notas de contraste con el español"),
      html: notesHTML(ctx, I),
    };
  }
  if (id === "boss") {
    const boss = findBoss(sub);
    if (boss && boss.band === ctx.band) {
      current = { kind: "boss", id: boss.id };
      return { title: I.TO(boss.title), html: bossHTML(ctx, I, boss) };
    }
  } else if (levelsFor(ctx.band).includes(Number(id))) {
    current = { kind: "level", id: Number(id) };
    return {
      title: I.S("Sentence Lab", "Laboratorio de oraciones"),
      html: levelHTML(ctx, I, Number(id)),
    };
  }
  current = null;
  return {
    title: I.S("Not found", "No se encontró"),
    html: html`${craftCrumbs(I, "sentences", ctx.band, I.S("Not found", "No se encontró"))}
      <section class="panel empty-state">
        <img src="${ARTS_BASE}/empty.svg" alt="" width="480" height="300" />
        <h1 tabindex="-1">
          ${I.T("We could not find that Sentence Lab page for this grade band.", "No encontramos esa página del Laboratorio de oraciones para esta banda de grados.")}
        </h1>
        <a class="btn" href="${craftHref("sentences", ctx.band)}"
          >${I.T("Sentence Lab", "Laboratorio de oraciones")}</a
        >
      </section>`,
  };
}

// ── actions ──────────────────────────────────────────────────────────────────
function currentTask(ctx) {
  if (!current) return null;
  const state = loadCraft();
  if (current.kind === "level") {
    const list = ordered(ctx.band, current.id);
    const key = `${ctx.band}:${current.id}`;
    let pos = state.sentences.pos?.[key] ?? list.findIndex((t) => !done(state, t.id));
    if (pos < 0) pos = 0;
    return { task: list[Math.min(pos, list.length - 1)], pos, list, key };
  }
  if (current.kind === "boss") {
    const boss = findBoss(current.id);
    const step = loadCraft().sentences.boss[boss.id]?.step || 0;
    return step < boss.steps.length ? { task: boss.steps[step], boss, step } : null;
  }
  return null;
}

/** Records a solved task and, every ROUND solved tasks at one level, one evidence-ledger entry. */
function solved(ctx, task, level, scope) {
  const state = loadCraft();
  const prev = state.sentences.tasks[task.id] || {};
  state.sentences.tasks[task.id] = {
    ok: true,
    first: prev.ok ? prev.first : ui.tries === 0 && !ui.hint,
    tries: (prev.tries || 0) + ui.tries + 1,
    hint: Boolean(prev.hint || ui.hint),
  };
  const r = (state.sentences.round ||= {});
  const rk = `${ctx.band}:${scope}`;
  const round = (r[rk] ||= { n: 0, first: 0, support: 0 });
  if (!prev.ok) {
    round.n += 1;
    round.first += state.sentences.tasks[task.id].first ? 1 : 0;
    round.support += ui.hint ? 1 : 0;
  }
  if (round.n >= ROUND) {
    recordCraft({
      src: "craft",
      task: `sentences/${rk}`,
      band: ctx.band,
      domain: "Writing",
      use: "Explain",
      level,
      supportUsed: round.support > 0,
      m: { tool: "sentences", stepId: "round", ok: round.first, n: round.n },
    });
    r[rk] = { n: 0, first: 0, support: 0 };
  }
  saveCraft(state);
}

function check(ctx, cur, level, scope) {
  const task = cur.task;
  let ok = false;
  let hint = null;
  if (task.kind === "s") ok = task.at.includes(ui.pick);
  else if (task.kind === "f") ok = ui.pick === task.opts[0];
  else {
    const parsed = parsedOf(task);
    const res = checkBuild(
      parsed,
      tilesFor(task, parsed),
      task.alt || [],
      ui.placed.map((i) => ui.tray[i].text),
    );
    ok = res.ok;
    hint = res.hint;
  }
  if (!ok) ui.tries += 1;
  ui.result = { ok, hint };
  ui.wrong = !ok && task.kind !== "b" && task.kind !== "c" && task.kind !== "e";
  if (ok) {
    if (cur.key) {
      // Stay on this task so its result and machine can be read before moving on.
      const state = loadCraft();
      (state.sentences.pos ||= {})[cur.key] = cur.pos;
      saveCraft(state);
    }
    solved(ctx, task, level, scope);
    announce(i18nFor(ctx).S("Correct.", "Correcto."));
  }
  ctx.rerender();
}

const move = (arr, from, to) => {
  const [x] = arr.splice(from, 1);
  arr.splice(to, 0, x);
};

export function onClick(e, ctx) {
  if (levelClick(e, ctx)) return true;
  const hit = (sel) => e.target.closest?.(sel);
  if (!current || current.kind === "notes") return false;
  const cur = currentTask(ctx);
  if (!cur) return false;
  const level = loadCraft().level;
  const scope = current.kind === "boss" ? current.id : current.id;
  let b;
  const parsedNow = parsedOf(cur.task);
  if ((b = hit("[data-sl-tile]")) && !ui.result?.ok) {
    ui.placed.push(Number(b.dataset.slTile));
    ui.result = null;
  } else if ((b = hit("[data-sl-placed]")) && !ui.result?.ok) {
    ui.placed.splice(Number(b.dataset.slPlaced), 1);
    ui.result = null;
  } else if ((b = hit("[data-sl-left]")))
    move(ui.placed, Number(b.dataset.slLeft), Number(b.dataset.slLeft) - 1);
  else if ((b = hit("[data-sl-right]")))
    move(ui.placed, Number(b.dataset.slRight), Number(b.dataset.slRight) + 1);
  else if (hit("[data-sl-undo]")) ui.placed.pop();
  else if (hit("[data-sl-clear]")) ui.placed = [];
  else if (hit("[data-sl-hint]") && parsedNow) {
    const want = tilesFor(cur.task, parsedNow).map((t) => t.text);
    const good = ui.placed.every((ti, k) => ui.tray[ti].text === want[k]);
    if (!good) ui.placed = [];
    const next = ui.tray.findIndex(
      (t, i) => !ui.placed.includes(i) && t.text === want[ui.placed.length],
    );
    if (next >= 0) ui.placed.push(next);
    ui.hint = true;
  } else if (hit("[data-sl-check]")) return (check(ctx, cur, level, scope), true);
  else if ((b = hit("[data-sl-spot]")) && !ui.result?.ok) {
    ui.pick = Number(b.dataset.slSpot);
    return (check(ctx, cur, level, scope), true);
  } else if ((b = hit("[data-sl-opt]")) && !ui.result?.ok) {
    ui.pick = ui.tray[Number(b.dataset.slOpt)];
    return (check(ctx, cur, level, scope), true);
  } else if (hit("[data-sl-next]")) {
    const state = loadCraft();
    if (current.kind === "boss") {
      const bs = (state.sentences.boss[current.id] ||= { step: 0 });
      bs.step = (bs.step || 0) + 1;
      if (bs.step >= cur.boss.steps.length) {
        bs.complete = true;
        recordCraft({
          src: "craft",
          task: `sentences/${current.id}`,
          band: ctx.band,
          domain: "Writing",
          use: "Explain",
          level,
          supportUsed: ui.hint,
          m: { tool: "sentences", stepId: "boss", ok: 1, n: cur.boss.steps.length },
        });
      }
    } else (state.sentences.pos ||= {})[cur.key] = Math.min(cur.pos + 1, cur.list.length - 1);
    saveCraft(state);
    ctx.rerender()?.then?.(() => document.querySelector("#sl-task, .cs-win h2")?.focus());
    return true;
  } else if ((b = hit("[data-sl-go]"))) {
    const state = loadCraft();
    (state.sentences.pos ||= {})[cur.key] = Number(b.dataset.slGo);
    saveCraft(state);
  } else return false;
  ctx.rerender();
  return true;
}

function bindDrag() {
  if (dragBound || typeof document === "undefined") return;
  dragBound = true;
  document.addEventListener("dragstart", (e) => {
    const t = e.target.closest?.("[data-sl-tile], [data-sl-placed]");
    if (!t || !current) return;
    e.dataTransfer?.setData(
      "text/plain",
      t.dataset.slTile != null ? `t:${t.dataset.slTile}` : `p:${t.dataset.slPlaced}`,
    );
  });
  document.addEventListener("dragover", (e) => {
    if (current && e.target.closest?.("[data-sl-drop]")) e.preventDefault();
  });
  document.addEventListener("drop", (e) => {
    if (!current || !e.target.closest?.("[data-sl-drop]") || ui.result?.ok) return;
    e.preventDefault();
    const [kind, idx] = (e.dataTransfer?.getData("text/plain") || "").split(":");
    const over = e.target.closest?.("[data-sl-placed]");
    const at = over ? Number(over.dataset.slPlaced) : ui.placed.length;
    if (kind === "t") ui.placed.splice(at, 0, Number(idx));
    else if (kind === "p") move(ui.placed, Number(idx), Math.min(at, ui.placed.length - 1));
    ui.result = null;
    lastCtx?.rerender();
  });
}

export function mount() {
  bindDrag();
}
export function unmount() {
  current = null;
  ui = { ...ui, taskId: "" };
}
