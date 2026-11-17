// Language Choice Boards (/choice-boards, /choice-boards/<narrate|inform|explain|argue>): for each grade band and
// WIDA Key Language Use, a 3×3 board of short tasks. The learner picks any three squares in a row. Every square works
// in class or at home with only this page and paper. No timer, no score; done squares and notes stay on this device.
// Rules and content checks: src/lang/boards.js. Content: content/choice-boards.json.
import { bandLabel, bandLabelEs } from "../bands.js";
import { crumbsHTML } from "../components.js";
import { loadChoiceBoards } from "../content.js";
import { award } from "../engagement.js";
import { i18nFor } from "../i18n.js";
import {
  CHOICE_KEY,
  DOMAIN_KIDS,
  KEY_LANGUAGE_USES,
  KLU_KIDS,
  boardRecord,
  boardStatus,
  cleanChoice,
  kluFromSlug,
  nearWins,
  setSquareDone,
  setSquareNote,
} from "../lang/boards.js";
import { printSheet } from "../print-sheet.js";
import { BASE, announce, html, icon, safeJson, storage } from "../util.js";

const KLU_ES = { Narrate: "Narrar", Inform: "Informar", Explain: "Explicar", Argue: "Argumentar" };
const ui = { key: "", open: -1, flash: "" };

const readAll = () => cleanChoice(safeJson(storage.get(CHOICE_KEY), {}));
const writeAll = (all) => storage.set(CHOICE_KEY, JSON.stringify(all));
const pairT = (I, p) => I.T(p[0], p[1]);
const pairS = (I, p) => I.S(p[0], p[1]);
const boardHref = (band, klu) => `${BASE}/choice-boards/${KLU_KIDS[klu].slug}?grades=${band}`;

function hubHTML(I, data, band, all) {
  const tiles = KEY_LANGUAGE_USES.map((klu) => {
    const k = KLU_KIDS[klu];
    const board = data.bands?.[band]?.[klu];
    const st = boardStatus(boardRecord(all, band, klu).done);
    return html`<li class="cb-tile tone-${k.tone}">
      <span class="cb-tile-ico" aria-hidden="true">${icon(k.icon)}</span>
      <h2 class="cb-tile-title"><a href="${boardHref(band, klu)}">${pairT(I, k.name)}</a></h2>
      <p class="cb-tile-klu">
        ${I.T(`WIDA Key Language Use: ${klu}`, `Uso clave del lenguaje WIDA: ${KLU_ES[klu]}`)}
      </p>
      ${board ? html`<p class="cb-tile-theme">${I.T("Theme:", "Tema:")} <strong>${pairT(I, board.theme)}</strong></p>` : ""}
      <p class="cb-tile-progress">
        ${st.bingo ? html`<span class="cb-badge">${icon("star")} ${I.T("Three in a row!", "¡Tres en línea!")}</span>` : ""}
        ${I.T(`${st.done} of 9 squares done`, `${st.done} de 9 casillas hechas`)}
      </p>
    </li>`;
  });
  return html`<header class="cb-hero">
      <p class="eyebrow">${icon("grid")} ${I.S(bandLabel(band), bandLabelEs(band))}</p>
      <h1 tabindex="-1">${I.T("Language Choice Boards", "Tableros de opciones de lenguaje")}</h1>
      <p class="lead">
        ${I.T("Pick a board. Do any three squares in a row: across, down or corner to corner. Each square takes 3 to 10 minutes.", "Elige un tablero. Haz tres casillas en línea: horizontal, vertical o en diagonal. Cada casilla toma de 3 a 10 minutos.")}
      </p>
    </header>
    <ul class="cb-tiles">
      ${tiles}
    </ul>
    <section class="panel cb-guide" data-fold aria-labelledby="cbTeach">
      <h2 id="cbTeach">
        ${icon("teacher")}
        ${I.T("For teachers: one board, all week", "Para docentes: un tablero para toda la semana")}
      </h2>
      <ul>
        <li>
          ${I.T("Each board practices one WIDA Key Language Use across Listening, Reading, Speaking and Writing, with a Create square in the middle.", "Cada tablero practica un uso clave del lenguaje WIDA en Escuchar, Leer, Hablar y Escribir, con una casilla para Crear en el centro.")}
        </li>
        <li>
          ${I.T("Every row, column and diagonal mixes different skills, so any three in a row is a balanced set.", "Cada fila, columna y diagonal mezcla destrezas distintas, así que cualquier línea de tres es un conjunto equilibrado.")}
        </li>
        <li>
          ${I.T("Use it for early finishers, a station, homework or a sub plan. Print the board: every task and passage is on the page.", "Úselo para quienes terminan antes, una estación, tarea o un plan para suplentes. Imprima el tablero: cada tarea y texto está en la hoja.")}
        </li>
        <li>
          ${I.T("Each square has a sentence frame and a 'look for' line students can use to check their own work.", "Cada casilla tiene un marco de oración y una línea de 'qué buscar' para que los estudiantes revisen su trabajo.")}
        </li>
      </ul>
      <p>
        <a href="${BASE}/lesson-builder?grades=${band}"
          >${I.T("Plan a whole week with a board in the Lesson Builder", "Planifique una semana completa con un tablero en el Creador de lecciones")}</a
        >
      </p>
    </section>
    <section class="panel cb-guide" data-fold aria-labelledby="cbFam">
      <h2 id="cbFam">${icon("families")} ${I.T("For families", "Para familias")}</h2>
      <p>
        ${I.T("Sit with your child and choose a square together. Read or listen to the task, then help with the sentence frame. It is fine to talk it through in Spanish first.", "Siéntese con su hijo o hija y elijan una casilla juntos. Lean o escuchen la tarea y ayude con el marco de oración. Está bien hablarlo primero en español.")}
      </p>
      <p>
        <a href="${BASE}/talk-table?grades=${band}"
          >${I.T("Then try tonight's Talk Table card", "Luego prueben la tarjeta de Mesa de conversación de hoy")}</a
        >
      </p>
    </section>`;
}

function squareButton(I, sq, i, rec, line, near, open) {
  const d = DOMAIN_KIDS[sq.domain];
  const done = rec.done.includes(i);
  return html`<li
    class="cb-cell tone-${d.tone}${done ? " is-done" : ""}${line.has(i) ? " is-line" : ""}"
  >
    <button
      type="button"
      class="cb-square"
      data-cb-open="${i}"
      aria-expanded="${open === i}"
      aria-controls="cbSquare"
    >
      <span class="cb-sq-domain">${icon(d.icon)} ${pairT(I, d.name)}</span>
      <span class="cb-sq-title">${pairT(I, sq.title)}</span>
      <span class="cb-sq-meta"
        >${sq.minutes}
        min${done ? html` · ${icon("check")} ${I.T("Done", "Hecho")}` : near.includes(i) ? html` · ${I.T("finishes a line", "completa una línea")}` : ""}</span
      >
    </button>
  </li>`;
}

function squarePanel(I, sq, i, rec) {
  const d = DOMAIN_KIDS[sq.domain];
  const done = rec.done.includes(i);
  const note = rec.notes[i] || "";
  return html`<section
    class="panel cb-panel tone-${d.tone}"
    id="cbSquare"
    aria-labelledby="cbSquareTitle"
  >
    <p class="cb-panel-domain">${icon(d.icon)} ${pairT(I, d.name)} · ${sq.minutes} min</p>
    <h2 id="cbSquareTitle" tabindex="-1">${pairT(I, sq.title)}</h2>
    <p class="cb-task">${pairT(I, sq.task)}</p>
    <div class="row-actions">
      <button type="button" class="btn small" data-say="${sq.task[0]}">
        ${icon("volume")} ${I.T("Hear the task", "Escuchar la tarea")}
      </button>
    </div>
    ${
      sq.listen
        ? html`<div class="cb-passage">
            <div class="row-actions">
              <button type="button" class="btn btn-primary" data-say="${sq.listen}">
                ${icon("play")} ${I.T("Listen", "Escuchar")}
              </button>
              <button type="button" class="btn" data-say="${sq.listen}" data-say-rate="0.7">
                ${icon("replay")} ${I.T("Listen slowly", "Escuchar despacio")}
              </button>
            </div>
            <details class="cb-words">
              <summary>
                ${I.T("Show the words (after you listen)", "Mostrar las palabras (después de escuchar)")}
              </summary>
              <p lang="en">${sq.listen}</p>
            </details>
          </div>`
        : ""
    }
    ${
      sq.read
        ? html`<div class="cb-passage">
            <p class="cb-read" lang="en">${sq.read}</p>
            <button type="button" class="btn small ghost" data-say="${sq.read}">
              ${icon("volume")} ${I.T("Read it to me", "Léemelo")}
            </button>
          </div>`
        : ""
    }
    <div class="cb-frame">
      <p class="cb-label">${I.T("Sentence frame", "Marco de oración")}</p>
      <p class="cb-frame-en" lang="en">${sq.frame[0]}</p>
      <p class="cb-frame-es fine" lang="es">${sq.frame[1]}</p>
      <button
        type="button"
        class="btn small ghost"
        data-say="${sq.frame[0].replaceAll("___", "blank")}"
      >
        ${icon("volume")} ${I.T("Hear the frame", "Escuchar el marco")}
      </button>
    </div>
    <p class="cb-look">
      ${icon("check")}
      <strong>${I.T("I did it well when:", "Lo hice bien cuando:")}</strong> ${pairT(I, sq.lookFor)}
    </p>
    <label class="field cb-note"
      >${I.T("My work (optional, saved on this device)", "Mi trabajo (opcional, se guarda en este dispositivo)")}<textarea
        rows="4"
        lang="en"
        maxlength="1200"
        data-cb-note="${i}"
      >
${note}</textarea>
    </label>
    <div class="row-actions">
      <button
        type="button"
        class="btn ${done ? "" : "btn-primary"}"
        data-cb-done="${i}"
        aria-pressed="${done}"
      >
        ${icon("check")}
        ${done ? I.T("Done. Tap to undo", "Hecho. Toca para deshacer") : I.T("I did it", "Lo hice")}
      </button>
      <button type="button" class="btn ghost" data-cb-close>
        ${I.T("Back to the board", "Volver al tablero")}
      </button>
    </div>
  </section>`;
}

function boardHTML(I, data, band, klu, all) {
  const board = data.bands?.[band]?.[klu];
  const k = KLU_KIDS[klu];
  if (!board)
    return html`<p class="panel">
      ${I.T("This board is not ready for this grade band yet.", "Este tablero todavía no está listo para este nivel.")}
    </p>`;
  const rec = boardRecord(all, band, klu);
  const st = boardStatus(rec.done);
  const line = new Set(st.lines.flat());
  const near = nearWins(rec.done);
  const open = ui.open >= 0 && ui.open < 9 ? ui.open : -1;
  const others = KEY_LANGUAGE_USES.filter((x) => x !== klu);
  return html`<header class="cb-hero tone-${k.tone}">
      <p class="eyebrow">
        ${icon(k.icon)}
        ${I.T(`WIDA Key Language Use: ${klu}`, `Uso clave del lenguaje WIDA: ${KLU_ES[klu]}`)} ·
        ${I.S(bandLabel(band), bandLabelEs(band))}
      </p>
      <h1 tabindex="-1">${pairT(I, k.name)}: ${pairT(I, board.theme)}</h1>
      <p class="lead">
        ${pairT(I, k.hint)}
        ${I.T("Pick any three squares in a row.", "Elige tres casillas en línea.")}
      </p>
    </header>
    <p class="cb-status" role="status">
      ${ui.flash ? html`<strong class="cb-badge">${icon("star")} ${ui.flash}</strong> ` : ""}
      ${st.full ? I.T("You finished the whole board.", "Terminaste todo el tablero.") : st.bingo ? I.T(`Three in a row! ${st.done} of 9 squares done. Keep going or try another board.`, `¡Tres en línea! ${st.done} de 9 casillas hechas. Sigue o prueba otro tablero.`) : I.T(`${st.done} of 9 squares done.`, `${st.done} de 9 casillas hechas.`)}
    </p>
    <ol class="cb-grid" aria-label="${I.S("Choice board, 3 by 3", "Tablero de opciones, 3 por 3")}">
      ${board.squares.map((sq, i) => squareButton(I, sq, i, rec, line, near, open))}
    </ol>
    ${open >= 0 ? squarePanel(I, board.squares[open], open, rec) : html`<p class="fine cb-pick">${I.T("Tap a square to open it.", "Toca una casilla para abrirla.")}</p>`}
    <div class="row-actions cb-actions">
      <button type="button" class="btn" data-cb-print>
        ${icon("print")} ${I.T("Print this board", "Imprimir este tablero")}
      </button>
      ${others.map((o) => html`<a class="btn ghost small" href="${boardHref(band, o)}">${pairT(I, KLU_KIDS[o].name)}</a>`)}
    </div>`;
}

/** The printed board: the grid on top, then every task with its passage and frame, English then Spanish. */
function printHTML(band, klu, board) {
  return html`<article class="cb-print" lang="en">
    <h1>${KLU_KIDS[klu].name[0]}: ${board.theme[0]}</h1>
    <p>
      ${bandLabel(band)} · WIDA Key Language Use: ${klu} · Do any three squares in a row. Check off
      each one you finish.
    </p>
    <ol class="cb-print-grid">
      ${board.squares.map((sq, i) => html`<li><span>☐ ${i + 1}. ${DOMAIN_KIDS[sq.domain].name[0]}</span><strong>${sq.title[0]}</strong><small>${sq.minutes} min</small></li>`)}
    </ol>
    ${board.squares.map(
      (sq, i) =>
        html`<section class="cb-print-sq">
          <h2>
            ${i + 1}. ${sq.title[0]}
            <small>(${DOMAIN_KIDS[sq.domain].name[0]}, ${sq.minutes} min)</small>
          </h2>
          <p>${sq.task[0]} <span lang="es">/ ${sq.task[1]}</span></p>
          ${sq.read ? html`<blockquote>${sq.read}</blockquote>` : ""}
          ${
            sq.listen
              ? html`<p>
                    <em
                      >Listening square: a grown-up or partner reads this aloud, or open the board
                      online to hear it.</em
                    >
                  </p>
                  <blockquote>${sq.listen}</blockquote>`
              : ""
          }
          <p><strong>Frame:</strong> ${sq.frame[0]} <span lang="es">/ ${sq.frame[1]}</span></p>
          <p><strong>I did it well when:</strong> ${sq.lookFor[0]}</p>
        </section>`,
    )}
  </article>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const band = ctx.band;
  const klu = kluFromSlug(ctx.route.id);
  const key = `${band}:${klu}`;
  if (ui.key !== key) Object.assign(ui, { key, open: -1, flash: "" });
  const data = await loadChoiceBoards();
  const all = readAll();
  const title = I.S("Language Choice Boards", "Tableros de opciones de lenguaje");
  const crumbs = [[I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`]];
  if (klu)
    crumbs.push(
      [title, `${BASE}/choice-boards?grades=${band}`],
      [pairS(I, KLU_KIDS[klu].name), null],
    );
  else crumbs.push([title, null]);
  return {
    title: klu ? `${pairS(I, KLU_KIDS[klu].name)} · ${title}` : title,
    html: html`${crumbsHTML(crumbs)}
      <div class="cb">
        ${klu ? boardHTML(I, data, band, klu, all) : hubHTML(I, data, band, all)}
      </div>`,
  };
}

export async function onClick(e, ctx) {
  const I = i18nFor(ctx);
  const t = e.target.closest("button");
  if (!t) return false;
  const band = ctx.band;
  const klu = kluFromSlug(ctx.route.id);
  if (t.matches("[data-cb-open]")) {
    ui.open = Number(t.dataset.cbOpen);
    ui.flash = "";
    await ctx.rerender();
    document.getElementById("cbSquareTitle")?.focus();
    document.getElementById("cbSquare")?.scrollIntoView({ block: "start", behavior: "smooth" });
    return true;
  }
  if (t.matches("[data-cb-close]")) {
    const i = ui.open;
    ui.open = -1;
    await ctx.rerender();
    document.querySelector(`[data-cb-open="${i}"]`)?.focus();
    return true;
  }
  if (t.matches("[data-cb-done]") && klu) {
    const i = Number(t.dataset.cbDone);
    const all = readAll();
    const before = boardStatus(boardRecord(all, band, klu).done);
    const isDone = !boardRecord(all, band, klu).done.includes(i);
    const next = setSquareDone(all, band, klu, i, isDone);
    writeAll(next);
    const after = boardStatus(boardRecord(next, band, klu).done);
    ui.flash = "";
    if (isDone) {
      award(ctx, `choice:${band}:${klu}:${i}`, 3, "Choice board square");
      if (after.lines.length > before.lines.length) {
        ui.flash = I.S("Three in a row!", "¡Tres en línea!");
        award(ctx, `choice-line:${band}:${klu}`, 8, "Choice board line");
      }
      announce(
        ui.flash
          ? I.S("Three in a row! Great work.", "¡Tres en línea! Muy buen trabajo.")
          : I.S("Square done.", "Casilla hecha."),
      );
      ui.open = -1;
    } else announce(I.S("Marked not done.", "Marcada como no hecha."));
    await ctx.rerender();
    document.querySelector(`[data-cb-open="${i}"]`)?.focus();
    return true;
  }
  if (t.matches("[data-cb-print]") && klu) {
    const data = await loadChoiceBoards();
    const board = data.bands?.[band]?.[klu];
    if (board) printSheet(printHTML(band, klu, board));
    return true;
  }
  return false;
}

export function onInput(e, ctx) {
  const t = e.target;
  if (!t.matches("[data-cb-note]")) return;
  const klu = kluFromSlug(ctx.route.id);
  if (!klu) return;
  writeAll(setSquareNote(readAll(), ctx.band, klu, Number(t.dataset.cbNote), t.value));
}

