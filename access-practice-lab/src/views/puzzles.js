// Puzzle Den: language puzzles with a three-step hint ladder. Sentence builders, clue grids and
// odd-one-out words. There is no timer and no lock; stars show how independently a puzzle was solved.
import { crumbsHTML, setComponentsI18n } from "../components.js";
import { award } from "../engagement.js";
import { i18nFor, makeI18n } from "../i18n.js";
import { loadPuzzles } from "../content.js";
import {
  MAX_HINTS,
  brokenClues,
  buildSentence,
  checkGrid,
  checkOdd,
  checkOrder,
  forBand,
  freshAttempt,
  gridComplete,
  normalizePuzzleState,
  puzzleSummary,
  recordSolve,
  starsFor,
} from "../puzzles.js";
import { BASE, announce, html, icon, safeJson, storage, todayISO } from "../util.js";

const KEY = "accessPracticeLab:v1:puzzle-den";
const load = () => normalizePuzzleState(safeJson(storage.get(KEY), {}));
const save = (state) => storage.set(KEY, JSON.stringify(state));
const bandKey = (band) => (band === "3-5" ? "3-5" : "6-8");

let I = makeI18n("en");
// The router calls handlers synchronously, so the puzzles loaded by render stay here for them.
let DATA = null;

const TYPE_LABEL = {
  order: ["Sentence Builder", "Constructor de oraciones"],
  grid: ["Clue Detective", "Detective de pistas"],
  odd: ["Odd One Out", "La palabra distinta"],
};
const TYPE_BLURB = {
  order: [
    "Tap word tiles to build a correct sentence.",
    "Toca las fichas para formar una oración correcta.",
  ],
  grid: [
    "Use every clue to match each person to one thing.",
    "Usa todas las pistas para unir a cada persona con una cosa.",
  ],
  odd: [
    "Find the word that does not belong, and say why.",
    "Encuentra la palabra que no pertenece y explica por qué.",
  ],
};
const typeName = (type) => I.S(...TYPE_LABEL[type]);

const starsHTML = (n, label) =>
  html`<span class="gm-stars" role="img" aria-label="${label}"
    >${[1, 2, 3].map((i) => html`<span class="gm-star ${i <= n ? "on" : ""}">${icon("star")}</span>`)}</span
  >`;
const starsLabel = (n) => I.S(`${n} of 3 stars`, `${n} de 3 estrellas`);
const rankLabel = (rank) => I.S(`Rank ${rank}`, `Rango ${rank}`);

function listHTML(puzzles, state, band) {
  const mine = forBand(puzzles, band);
  const s = puzzleSummary(state, mine);
  const sections = ["order", "grid", "odd"].map((type) => {
    const rows = mine.filter((p) => p.type === type).sort((a, b) => a.rank - b.rank);
    return html`<section class="panel gm-type" aria-labelledby="pz-${type}">
      <h2 id="pz-${type}">${typeName(type)}</h2>
      <p class="fine">${I.S(...TYPE_BLURB[type])}</p>
      <ul class="gm-cards">
        ${rows.map((p) => {
          const done = state.solved[p.id];
          return html`<li>
            <a
              class="gm-card ${done ? "is-solved" : ""}"
              href="${BASE}/puzzles/${p.id}?grades=${band}"
              ><span class="gm-card-title">${p.title}</span
              ><span class="gm-card-meta"
                >${rankLabel(p.rank)} ·
                ${done ? starsHTML(done.stars, starsLabel(done.stars)) : I.T("Not solved yet", "Sin resolver")}</span
              ></a
            >
          </li>`;
        })}
      </ul>
    </section>`;
  });
  return html`<div class="gm-studio d-writing">
    <header class="gm-hero">
      <div>
        <p class="gm-kicker">
          ${icon("detective")} ${I.T("Language puzzles", "Rompecabezas de lenguaje")}
        </p>
        <h1 tabindex="-1">${I.T("Puzzle Den", "Rincón de rompecabezas")}</h1>
        <p class="lead">
          ${I.T("Think hard about words and sentences. Every puzzle has three hints that never give the answer away. There is no timer, and every puzzle is open.", "Piensa con atención en palabras y oraciones. Cada rompecabezas tiene tres pistas que nunca revelan la respuesta. No hay reloj y todos están abiertos.")}
        </p>
      </div>
      <div class="gm-step-card">
        <p class="gm-step-now">
          ${I.T(`${s.solved} of ${s.total} solved`, `${s.solved} de ${s.total} resueltos`)}
        </p>
        <p>
          ${starsHTML(Math.min(3, s.solved ? Math.round(s.stars / s.solved) : 0), I.S("Average stars", "Estrellas promedio"))}
          <span class="fine"
            >${I.T(`${s.threeStar} with three stars`, `${s.threeStar} con tres estrellas`)}</span
          >
        </p>
      </div>
    </header>
    ${sections}
    <p class="gm-note">
      ${I.T("Stars show how much help you used. They are not a score, a language level or a prediction of any test result. Your progress stays on this device.", "Las estrellas muestran cuánta ayuda usaste. No son una calificación, un nivel de idioma ni una predicción del resultado de una prueba. Tu progreso se queda en este dispositivo.")}
    </p>
  </div>`;
}

function orderBody(p, a, locked) {
  const placed = a.placed.map((i) => p.tiles[i]);
  return html`<p class="gm-sentence" aria-live="polite">
      ${placed.length ? buildSentence(placed, p.end) : html`<span class="fine">${I.T("Your sentence will appear here.", "Tu oración aparecerá aquí.")}</span>`}
    </p>
    <div
      class="gm-tiles"
      role="group"
      aria-label="${I.S("Your sentence, in order. Tap a word to take it back.", "Tu oración, en orden. Toca una palabra para quitarla.")}"
    >
      ${a.placed.map((tileIndex, pos) => html`<button type="button" class="gm-tile is-placed" data-pz-remove="${pos}" ${locked ? "disabled" : ""}>${p.tiles[tileIndex]}</button>`)}
    </div>
    <div class="gm-tiles" role="group" aria-label="${I.S("Word tiles", "Fichas de palabras")}">
      ${p.tiles.map((tile, i) => html`<button type="button" class="gm-tile" data-pz-tile="${i}" ${a.placed.includes(i) || locked ? "disabled" : ""}>${tile}</button>`)}
    </div>
    ${locked ? "" : html`<div class="gm-actions"><button class="btn btn-primary" type="button" data-pz-check ${a.placed.length === p.tiles.length ? "" : "disabled"}>${I.T("Check my sentence", "Revisar mi oración")}</button><button class="btn" type="button" data-pz-undo ${a.placed.length ? "" : "disabled"}>${I.T("Undo last word", "Quitar la última palabra")}</button><button class="btn" type="button" data-pz-clear ${a.placed.length ? "" : "disabled"}>${I.T("Clear", "Borrar")}</button></div>`}`;
}

function gridBody(p, a, locked) {
  return html`<ol class="gm-clues" aria-label="${I.S("Clues", "Pistas")}">
      ${p.clues.map((c, i) => html`<li id="pz-clue-${i + 1}">${c.text}</li>`)}
    </ol>
    <table class="gm-grid">
      <caption class="fine">
        ${I.T(`Choose one ${p.label} for each person. Each can be used once.`, `Elige una opción (${p.label}) para cada persona. Cada una se usa una sola vez.`)}
      </caption>
      <tbody>
        ${p.people.map(
          (person) =>
            html`<tr>
              <th scope="row">${person}</th>
              <td>
                <select
                  aria-label="${person}: ${p.label}"
                  data-pz-select="${person}"
                  ${locked ? "disabled" : ""}
                >
                  <option value="">${I.S("Choose…", "Elige…")}</option>
                  ${p.options.map((o) => html`<option value="${o}" ${a.picks[person] === o ? "selected" : ""}>${o}</option>`)}
                </select>
              </td>
            </tr>`,
        )}
      </tbody>
    </table>
    ${locked ? "" : html`<div class="gm-actions"><button class="btn btn-primary" type="button" data-pz-check>${I.T("Check my answer", "Revisar mi respuesta")}</button></div>`}`;
}

function oddBody(p, a, locked) {
  return html`<div
      class="gm-odd"
      role="radiogroup"
      aria-label="${I.S("Choose the word that does not belong", "Elige la palabra que no pertenece")}"
    >
      ${p.words.map((w, i) => html`<label class="gm-odd-word ${a.odd === i ? "is-picked" : ""}"><input type="radio" name="gm-odd" value="${i}" data-pz-odd ${a.odd === i ? "checked" : ""} ${locked ? "disabled" : ""} /> <span>${w}</span></label>`)}
    </div>
    ${locked ? "" : html`<div class="gm-actions"><button class="btn btn-primary" type="button" data-pz-check ${a.odd === null ? "disabled" : ""}>${I.T("Check my choice", "Revisar mi elección")}</button></div>`}`;
}

function solvedHTML(p, row, next, band) {
  const detail =
    p.type === "odd"
      ? html`<p>${p.rule}</p>`
      : p.type === "order"
        ? html`<p><b>${buildSentence(p.answers[0], p.end)}</b></p>`
        : html`<p>${p.people.map((person) => html`<span class="gm-pair">${person}</span>`)}</p>`;
  return html`<section class="feedback is-right" role="status" tabindex="-1">
    <p class="fb-title">
      ${icon("check")} ${I.T("Solved!", "¡Resuelto!")}
      ${starsHTML(row.stars, starsLabel(row.stars))}
    </p>
    ${detail}
    <p class="fine">
      ${row.stars === 3 ? I.T("Three stars: you solved it with no hints and no misses.", "Tres estrellas: lo resolviste sin pistas y sin errores.") : I.T(`You used ${row.hints} ${row.hints === 1 ? "hint" : "hints"} and had ${row.misses} ${row.misses === 1 ? "miss" : "misses"}. Try it again for more stars.`, `Usaste ${row.hints} ${row.hints === 1 ? "pista" : "pistas"} y tuviste ${row.misses} ${row.misses === 1 ? "error" : "errores"}. Inténtalo otra vez para ganar más estrellas.`)}
    </p>
    <div class="gm-actions">
      ${next ? html`<a class="btn btn-primary" href="${BASE}/puzzles/${next.id}?grades=${band}">${I.T("Next puzzle", "Siguiente rompecabezas")} ${icon("arrow-right")}</a>` : ""}<button
        class="btn"
        type="button"
        data-pz-retry
      >
        ${I.T("Play again", "Jugar otra vez")}</button
      ><a class="btn" href="${BASE}/puzzles?grades=${band}"
        >${I.T("All puzzles", "Todos los rompecabezas")}</a
      >
    </div>
  </section>`;
}

function playHTML(p, state, puzzles, band) {
  const solvedNow = state.solved[p.id];
  const a = { ...freshAttempt(), ...state.open[p.id] };
  const replay = Boolean(state.open[p.id]) || !solvedNow;
  const showSolved = solvedNow && !state.open[p.id];
  const mine = forBand(puzzles, band);
  const next = mine.find((q) => q.id !== p.id && !state.solved[q.id]) || null;
  const body = { order: orderBody, grid: gridBody, odd: oddBody }[p.type](p, a, showSolved);
  const hints = p.hints.slice(0, a.hints);
  const left = MAX_HINTS - a.hints;
  return html`<div class="gm-studio d-writing">
    <header class="gm-hero gm-hero-play">
      <div>
        <p class="gm-kicker">${icon("detective")} ${typeName(p.type)} · ${rankLabel(p.rank)}</p>
        <h1 tabindex="-1">${p.title}</h1>
        <p class="lead">${p.prompt}</p>
      </div>
      <div class="gm-step-card">
        <p class="gm-step-now">${I.T("Stars available", "Estrellas posibles")}</p>
        <p>${starsHTML(starsFor(a.hints, a.misses), starsLabel(starsFor(a.hints, a.misses)))}</p>
        <p class="fine">
          ${I.T("Hints and misses cost a star.", "Las pistas y los errores cuestan una estrella.")}
        </p>
      </div>
    </header>
    <section class="panel gm-play" aria-label="${I.S("Puzzle", "Rompecabezas")}">
      ${body}
      ${a.missText && replay ? html`<p class="feedback is-hint" role="status" tabindex="-1">${icon("bulb")} ${a.missText}</p>` : ""}
    </section>
    ${
      showSolved
        ? solvedHTML(p, solvedNow, next, band)
        : html`<section class="panel gm-hints" aria-labelledby="pzHints">
            <h2 id="pzHints">${I.T("Hints", "Pistas")}</h2>
            ${
              hints.length
                ? html`<ol>
                    ${hints.map((h) => html`<li>${h}</li>`)}
                  </ol>`
                : html`<p class="fine">
                    ${I.T("Try first. A hint helps you think; it will not give the answer.", "Intenta primero. Una pista te ayuda a pensar; no da la respuesta.")}
                  </p>`
            }
            <button class="btn" type="button" data-pz-hint ${left ? "" : "disabled"}>
              ${icon("bulb")}
              ${left ? I.T(`Show a hint (${left} left)`, `Mostrar una pista (quedan ${left})`) : I.T("No more hints", "No hay más pistas")}
            </button>
          </section>`
    }
    <p class="gm-actions">
      <a href="${BASE}/puzzles?grades=${band}"
        >${icon("arrow-left")} ${I.T("All puzzles", "Todos los rompecabezas")}</a
      >
    </p>
  </div>`;
}

export async function render(ctx) {
  I = i18nFor(ctx);
  setComponentsI18n(I);
  const band = bandKey(ctx.band);
  const data = await loadPuzzles();
  DATA = data;
  const state = load();
  const p = ctx.route.id ? data.puzzles.find((q) => q.id === ctx.route.id) : null;
  const crumbs = [
    [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
    [I.S("Puzzle Den", "Rincón de rompecabezas"), p ? `${BASE}/puzzles?grades=${band}` : null],
    ...(p ? [[p.title, null]] : []),
  ];
  return {
    title: p ? p.title : I.S("Puzzle Den", "Rincón de rompecabezas"),
    html: html`${crumbsHTML(crumbs)}${p ? playHTML(p, state, data.puzzles, band) : listHTML(data.puzzles, state, band)}`,
  };
}

// ---- events: attempts are saved after every action, so a reload keeps hints and misses
const attemptOf = (state, id) => ({ ...freshAttempt(), ...state.open[id] });
const withAttempt = (state, id, a) => ({ ...state, open: { ...state.open, [id]: a } });

function checkResult(ctx, p, state, a) {
  const done = {
    order: () =>
      checkOrder(
        p,
        a.placed.map((i) => p.tiles[i]),
      ),
    grid: () => checkGrid(p, a.picks),
    odd: () => checkOdd(p, a.odd),
  }[p.type]();
  if (done) {
    const next = recordSolve(state, p.id, a, todayISO());
    award(ctx, `puzzle:${p.id}`, next.solved[p.id].stars, "Puzzle solved");
    return next;
  }
  const missText =
    p.type === "grid" && !gridComplete(p, a.picks)
      ? I.S(
          "Choose something for every person, and use each option once.",
          "Elige algo para cada persona y usa cada opción una sola vez.",
        )
      : p.type === "grid"
        ? I.S(
            `Not yet. These clues are not all true in your answer: ${brokenClues(p, a.picks)
              .map((i) => i + 1)
              .join(", ")}. Reread them.`,
            `Todavía no. Estas pistas no se cumplen en tu respuesta: ${brokenClues(p, a.picks)
              .map((i) => i + 1)
              .join(", ")}. Vuelve a leerlas.`,
          )
        : p.type === "odd"
          ? I.S(
              "Not that one. Find the rule that three of the words share.",
              "No es esa. Busca la regla que comparten tres de las palabras.",
            )
          : I.S(
              "Not yet. Read your sentence aloud. Does it sound right? Move the tiles and try again.",
              "Todavía no. Lee tu oración en voz alta. ¿Suena bien? Mueve las fichas e inténtalo otra vez.",
            );
  announce(missText);
  // An unfinished grid is not a wrong answer, so it costs no star.
  const incomplete = p.type === "grid" && !gridComplete(p, a.picks);
  return withAttempt(state, p.id, { ...a, misses: a.misses + (incomplete ? 0 : 1), missText });
}

export function onClick(event, ctx) {
  const button = event.target.closest("button");
  if (!button || !DATA || !ctx.route.id) return false;
  const p = DATA.puzzles.find((q) => q.id === ctx.route.id);
  if (!p) return false;
  let state = load();
  const solved = state.solved[p.id] && !state.open[p.id];
  const a = attemptOf(state, p.id);
  if (button.hasAttribute("data-pz-retry")) state = withAttempt(state, p.id, freshAttempt());
  else if (solved) return false;
  else if (button.hasAttribute("data-pz-tile"))
    state = withAttempt(state, p.id, {
      ...a,
      placed: [...a.placed, Number(button.dataset.pzTile)],
      missText: "",
    });
  else if (button.hasAttribute("data-pz-remove"))
    state = withAttempt(state, p.id, {
      ...a,
      placed: a.placed.filter((_, i) => i !== Number(button.dataset.pzRemove)),
      missText: "",
    });
  else if (button.hasAttribute("data-pz-undo"))
    state = withAttempt(state, p.id, { ...a, placed: a.placed.slice(0, -1), missText: "" });
  else if (button.hasAttribute("data-pz-clear"))
    state = withAttempt(state, p.id, { ...a, placed: [], missText: "" });
  else if (button.hasAttribute("data-pz-hint"))
    state = withAttempt(state, p.id, { ...a, hints: Math.min(MAX_HINTS, a.hints + 1) });
  else if (button.hasAttribute("data-pz-check")) state = checkResult(ctx, p, state, a);
  else return false;
  save(state);
  ctx.rerender();
  return true;
}

export function onChange(event, ctx) {
  const target = event.target;
  if (!DATA || !ctx.route.id) return;
  const p = DATA.puzzles.find((q) => q.id === ctx.route.id);
  if (!p) return;
  const state = load();
  const a = attemptOf(state, p.id);
  if (target.matches("[data-pz-select]")) {
    const picks = { ...a.picks };
    if (target.value) picks[target.dataset.pzSelect] = target.value;
    else delete picks[target.dataset.pzSelect];
    save(withAttempt(state, p.id, { ...a, picks, missText: "" }));
  } else if (target.matches("[data-pz-odd]")) {
    save(withAttempt(state, p.id, { ...a, odd: Number(target.value), missText: "" }));
    ctx.rerender();
  }
}
