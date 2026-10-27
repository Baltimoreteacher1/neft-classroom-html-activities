// Shared building blocks for Array Architect screens: interface text, steppers, focus-safe re-rendering.
// @fm2 FM-020 FM-021 FM-037 FM-038 FM-039
import { escapeHtml, tx } from "../../lang.js";

export const UI = {
  rows: { en: "Rows", es: "Filas" },
  cols: { en: "Columns", es: "Columnas" },
  layers: { en: "Layers", es: "Capas" },
  moreRows: { en: "More rows", es: "Más filas" },
  fewerRows: { en: "Fewer rows", es: "Menos filas" },
  moreCols: { en: "More columns", es: "Más columnas" },
  fewerCols: { en: "Fewer columns", es: "Menos columnas" },
  moreLayers: { en: "More layers", es: "Más capas" },
  fewerLayers: { en: "Fewer layers", es: "Menos capas" },
  check: { en: "Check my work", es: "Revisar mi trabajo" },
  checkList: { en: "Check my list", es: "Revisar mi lista" },
  clear: { en: "Clear my work", es: "Borrar mi trabajo" },
  addList: { en: "Add to my list", es: "Agregar a mi lista" },
  myList: { en: "My list", es: "Mi lista" },
  listEmpty: { en: "Nothing in your list yet.", es: "Todavía no hay nada en tu lista." },
  remove: { en: "Remove {pair} from my list", es: "Quitar {pair} de mi lista" },
  added: { en: "Added {pair}. {n} in your list.", es: "Se agregó {pair}. Hay {n} en tu lista." },
  duplicate: {
    en: "{pair} is already in your list. A turned rectangle counts as the same one.",
    es: "{pair} ya está en tu lista. Un rectángulo girado cuenta como el mismo.",
  },
  duplicateTurn: { en: "{pair} is already in your list.", es: "{pair} ya está en tu lista." },
  buildFirst: { en: "Build a rectangle first.", es: "Primero construye un rectángulo." },
  removed: { en: "Removed {pair}.", es: "Se quitó {pair}." },
  gridPaint: {
    en: "Grid with {rows} rows and {cols} columns. Arrow keys move, Space places or removes one, Shift with an arrow paints.",
    es: "Cuadrícula de {rows} filas y {cols} columnas. Las flechas mueven, la barra espaciadora pone o quita una, Mayúsculas con una flecha pinta.",
  },
  gridSize: {
    en: "Grid with {rows} rows and {cols} columns. Arrow keys move, Space sets the far corner of your rectangle.",
    es: "Cuadrícula de {rows} filas y {cols} columnas. Las flechas mueven, la barra espaciadora fija la esquina lejana de tu rectángulo.",
  },
  cell: { en: "Row {r}, column {c}: {state}", es: "Fila {r}, columna {c}: {state}" },
  stFull: { en: "filled", es: "llena" },
  stEmpty: { en: "empty", es: "vacía" },
  stOff: { en: "outside the shape", es: "fuera de la figura" },
  stTool: { en: "color {tool}", es: "color {tool}" },
  bigBoard: {
    en: "This rectangle is too large to tap, so use the number boxes and the plus and minus buttons.",
    es: "Este rectángulo es muy grande para tocarlo; usa los cuadros de números y los botones de más y menos.",
  },
  nothing: { en: "Nothing built yet.", es: "Todavía no has construido nada." },
  roCounters: { en: "{rows} of {cols}", es: "{rows} de {cols}" },
  roSquares: { en: "{rows} × {cols} = {area}", es: "{rows} × {cols} = {area}" },
  roPerim: { en: "perimeter {perim}", es: "perímetro {perim}" },
  roPlaced: { en: "{n} counters placed", es: "{n} fichas puestas" },
  roPairs: { en: "{n} counters placed: {pairs} pairs, {left} left over", es: "{n} fichas puestas: {pairs} parejas, {left} sobrante(s)" },
  roCovered: { en: "{n} of {total} squares covered", es: "{n} de {total} cuadros cubiertos" },
  roColored: { en: "{n} of {total} squares colored", es: "{n} de {total} cuadros coloreados" },
  roPrism: { en: "{layers} × ({rows} × {cols}) = {volume}", es: "{layers} × ({rows} × {cols}) = {volume}" },
  roBuilt: { en: "Your rectangle: {rows} × {cols}, area {area}", es: "Tu rectángulo: {rows} × {cols}, área {area}" },
  tool: { en: "Color {tool}", es: "Color {tool}" },
  toolLabel: { en: "Choose a color to paint with", es: "Elige un color para pintar" },
  askTotal: { en: "How many in all?", es: "¿Cuántos hay en total?" },
  askCols: { en: "How many in each row?", es: "¿Cuántos hay en cada fila?" },
  askArea: { en: "Area in square units:", es: "Área en unidades cuadradas:" },
  askVolume: { en: "Volume in cubes:", es: "Volumen en cubos:" },
  parity: { en: "Is the number even or odd?", es: "¿El número es par o impar?" },
  even: { en: "Even", es: "Par" },
  odd: { en: "Odd", es: "Impar" },
  pickLabel: {
    en: "How many times as large is the new area?",
    es: "¿Cuántas veces más grande es el área nueva?",
  },
  pickOption: { en: "× {v}", es: "× {v}" },
  original: { en: "Original: {rows} by {cols}", es: "Original: {rows} por {cols}" },
  prismLabel: {
    en: "Prism with {layers} layers of {rows} by {cols}",
    es: "Prisma de {layers} capas de {rows} por {cols}",
  },
  announceDims: { en: "{rows} by {cols}, area {area}.", es: "{rows} por {cols}, área {area}." },
  announceTile: { en: "{n} placed.", es: "{n} puestas." },
  announceLayers: { en: "{layers}, {volume}.", es: "{layers}, {volume}." },
  cleared: { en: "Cleared. Start again.", es: "Borrado. Empieza de nuevo." },
  split: { en: "Split {whole}", es: "Dividir {whole}" },
  splitStep: { en: "First part of {whole}", es: "Primera parte de {whole}" },
  splitMore: {
    en: "Make the first part of {whole} bigger",
    es: "Hacer más grande la primera parte de {whole}",
  },
  splitLess: {
    en: "Make the first part of {whole} smaller",
    es: "Hacer más pequeña la primera parte de {whole}",
  },
  splitNone: {
    en: "Use the plus and minus buttons to choose where to split {whole}.",
    es: "Usa los botones de más y menos para elegir dónde dividir {whole}.",
  },
  splitIs: { en: "{whole} = {a} + {b}", es: "{whole} = {a} + {b}" },
  region: { en: "Region {id}: {label}", es: "Región {id}: {label}" },
  total: { en: "Total", es: "Total" },
  polyTip: { en: "Type terms like 5x, x^2 or −15.", es: "Escribe términos como 5x, x^2 o −15." },
  checkModel: { en: "Check my model", es: "Revisar mi modelo" },
  sideTile: { en: "Tile side", es: "Lado de la baldosa" },
  sideSquare: { en: "Side of the square", es: "Lado del cuadrado" },
  moreSide: { en: "Longer side", es: "Lado más largo" },
  lessSide: { en: "Shorter side", es: "Lado más corto" },
  roTiling: {
    en: "Across: {an} fit, {ar} left over. Down: {dn} fit, {dr} left over.",
    es: "A lo ancho: caben {an}, sobran {ar}. A lo alto: caben {dn}, sobran {dr}.",
  },
  exact: { en: "Exact fit, no gap.", es: "Encaja exacto, sin huecos." },
  wX: { en: "Width: x-tiles", es: "Ancho: fichas de x" },
  wOne: { en: "Width: 1-tiles", es: "Ancho: fichas de 1" },
  hX: { en: "Height: x-tiles", es: "Alto: fichas de x" },
  hOne: { en: "Height: 1-tiles", es: "Alto: fichas de 1" },
  moreOf: { en: "More: {name}", es: "Más: {name}" },
  fewerOf: { en: "Fewer: {name}", es: "Menos: {name}" },
  roTiles: {
    en: "Width {w}, height {h}. You use {x2} x², {x} x and {ones} ones.",
    es: "Ancho {w}, alto {h}. Usas {x2} de x², {x} de x y {ones} de 1.",
  },
  pool: {
    en: "Your tiles: {x2} x², {x} x, {ones} ones",
    es: "Tus fichas: {x2} de x², {x} de x, {ones} de 1",
  },
};

export const u = (key, lang, vars) => tx(UI[key], lang, vars);
export const esc = escapeHtml;

export function stepperHtml({ id, label, value, down, up }) {
  return `<div class="aa-step" role="group" aria-label="${esc(label)}">
    <span class="aa-step-label" aria-hidden="true">${esc(label)}</span>
    <button type="button" class="fm2-btn aa-step-btn" data-act="dec" data-id="${id}" data-focus="dec:${id}" aria-label="${esc(down)}">−</button>
    <input class="aa-step-input" data-id="${id}" data-focus="in:${id}" type="text" inputmode="numeric" autocomplete="off" aria-label="${esc(label)}" value="${esc(value)}">
    <button type="button" class="fm2-btn aa-step-btn" data-act="inc" data-id="${id}" data-focus="inc:${id}" aria-label="${esc(up)}">+</button>
  </div>`;
}

// Re-render while keeping the same control focused (a language switch must not drop the learner's place).
export function keepFocus(root, render) {
  const active = root.contains(document.activeElement) ? document.activeElement : null;
  const key = active?.dataset?.focus || "";
  const grid = active?.classList?.contains("aa-grid");
  render();
  const target = grid
    ? root.querySelector(".aa-grid")
    : key
      ? root.querySelector(`[data-focus="${key}"]`)
      : null;
  target?.focus({ preventScroll: true });
}

export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export const intOf = (text) => (/^\s*\d{1,3}\s*$/.test(String(text)) ? Number(text) : null);

// Typing into a number box replaces what is there (so "0" never turns "1" into "10").
export const selectInput = (event) => {
  if (event.target.matches?.(".aa-step-input")) event.target.select();
};

const WORDS = {
  row: { en: ["row", "rows"], es: ["fila", "filas"] },
  col: { en: ["column", "columns"], es: ["columna", "columnas"] },
  square: { en: ["square", "squares"], es: ["cuadro", "cuadros"] },
  cube: { en: ["cube", "cubes"], es: ["cubo", "cubos"] },
  layer: { en: ["layer", "layers"], es: ["capa", "capas"] },
};
// "1 row", "3 rows", "1 fila", "3 filas".
export const counted = (n, word, lang) => `${n} ${WORDS[word][lang === "es" ? "es" : "en"][n === 1 ? 0 : 1]}`;
