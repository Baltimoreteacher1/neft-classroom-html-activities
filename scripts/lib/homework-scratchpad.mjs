/**
 * The Family Math Scratchpad: markup, styles and drawing engine.
 *
 * Background stamps sit on the canvas's wrapper, never on the canvas itself,
 * so the eraser (destination-out) removes ink and leaves the grid in place.
 * Stamps are blank on purpose: a double number line has ticks and no numbers,
 * a percent grid has no shading, a coordinate plane has axes and no points.
 * The family supplies the mathematics.
 *
 * Domain stamps come from ONE table, keyed by Reveal unit:
 *   3 ratios and rates → double number line
 *   4 percents         → 10×10 percent grid
 *   7 integers, rational numbers, coordinate plane → coordinate plane
 */

import { act, EL } from "./homework-actions.mjs";

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Reveal unit → the stamp that unit's mathematics lives on. */
export const SCRATCHPAD_STAMPS = {
  3: { key: "doubleline", icon: "📏", en: "Double number line", es: "Recta numérica doble" },
  4: { key: "percent", icon: "💯", en: "100 grid", es: "Cuadrícula de 100" },
  7: { key: "plane", icon: "🧭", en: "Coordinate plane", es: "Plano de coordenadas" },
};

const stampButton = (stamp) =>
  stamp
    ? `<button type="button" class="btn btn-sm btn-outline-secondary grid-btn" ${act("setScratchpadGrid", stamp.key, EL)}>${stamp.icon} <span class="lang-en">${esc(stamp.en)}</span><span class="lang-es" lang="es">${esc(stamp.es)}</span></button>`
    : "";

export function renderScratchpadHtml(unit) {
  const stamp = SCRATCHPAD_STAMPS[Number(unit)];
  return `
    <div class="interactive-scratchpad card-ish" id="hw_scratchpad_wrapper" hidden>
      <div class="scratchpad-header">
        <div class="scratchpad-title">
          <span class="scratchpad-icon" aria-hidden="true">✏️</span>
          <strong><span class="lang-en">Family Math Scratchpad</span><span class="lang-es" lang="es">Pizarra Familiar de Matemáticas</span></strong>
        </div>
        <div class="scratchpad-tools">
          <div class="color-palette" role="radiogroup" aria-label="Drawing color">
            <button type="button" class="color-dot is-active u-pen-navy" data-color="#12355b" ${act("setScratchpadColor", "#12355b", EL)} aria-label="Navy pen"></button>
            <button type="button" class="color-dot u-pen-teal" data-color="#1fa6a2" ${act("setScratchpadColor", "#1fa6a2", EL)} aria-label="Teal pen"></button>
            <button type="button" class="color-dot u-pen-amber" data-color="#d97706" ${act("setScratchpadColor", "#d97706", EL)} aria-label="Amber pen"></button>
            <button type="button" class="color-dot u-pen-coral" data-color="#d9795d" ${act("setScratchpadColor", "#d9795d", EL)} aria-label="Coral pen"></button>
          </div>
          <div class="grid-mode-group">
            <button type="button" class="btn btn-sm btn-outline-secondary grid-btn is-active" ${act("setScratchpadGrid", "blank", EL)}>📄 <span class="lang-en">Blank</span><span class="lang-es" lang="es">Blanco</span></button>
            <button type="button" class="btn btn-sm btn-outline-secondary grid-btn" ${act("setScratchpadGrid", "graph", EL)}>📐 <span class="lang-en">Grid</span><span class="lang-es" lang="es">Cuadrícula</span></button>
            <button type="button" class="btn btn-sm btn-outline-secondary grid-btn" ${act("setScratchpadGrid", "dots", EL)}>⚬ <span class="lang-en">Dots</span><span class="lang-es" lang="es">Puntos</span></button>
            ${stampButton(stamp)}
          </div>
          <button type="button" class="btn btn-sm btn-secondary tool-btn" id="scratchpad_eraser_btn" ${act("toggleScratchpadEraser")}>🧹 <span class="lang-en">Eraser</span><span class="lang-es" lang="es">Borrador</span></button>
          <button type="button" class="btn btn-sm btn-secondary tool-btn" ${act("clearScratchpad")}>🗑️ <span class="lang-en">Clear</span><span class="lang-es" lang="es">Borrar</span></button>
          <button type="button" class="btn btn-sm btn-secondary tool-btn scratchpad-expand-btn" id="scratchpad_expand_btn" aria-pressed="false" ${act("toggleScratchpadExpand")}>⛶ <span class="lang-en scratchpad-expand-en">Full screen</span><span class="lang-es scratchpad-expand-es" lang="es">Pantalla completa</span></button>
          <button type="button" class="scratchpad-close-btn" ${act("toggleScratchpad")} aria-label="Close scratchpad">✕</button>
        </div>
      </div>
      <div class="scratchpad-canvas-wrap">
        <canvas class="scratchpad-canvas" id="hw_scratchpad_canvas" width="760" height="220"></canvas>
      </div>
      <p class="scratchpad-hint"><span class="lang-en">💡 Draw fraction bars, tape diagrams, equations, or line up decimals together!</span><span class="lang-es" lang="es">💡 ¡Dibujen barras de fracciones, modelos o alineen decimales juntos!</span></p>
    </div>`;
}

export const SCRATCHPAD_JS = `
/* Family Math Scratchpad */
var scratchpadCanvas = null;
var scratchpadCtx = null;
var isDrawing = false;
var scratchpadColor = "#12355b";
var isEraser = false;
var scratchpadReturnFocus = null;

function scratchpadScale() {
  var rect = scratchpadCanvas.getBoundingClientRect();
  return rect.width ? scratchpadCanvas.width / rect.width : 1;
}

/* Keep the backing store the size it is drawn, so full screen is crisp and never stretched. */
function fitScratchpad() {
  if (!scratchpadCanvas || !scratchpadCtx || isDrawing) return;
  var rect = scratchpadCanvas.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return;
  var ratio = Math.min(window.devicePixelRatio || 1, 2);
  var w = Math.round(rect.width * ratio);
  var h = Math.round(rect.height * ratio);
  if (w === scratchpadCanvas.width && h === scratchpadCanvas.height) return;
  var snap = document.createElement("canvas");
  snap.width = scratchpadCanvas.width;
  snap.height = scratchpadCanvas.height;
  snap.getContext("2d").drawImage(scratchpadCanvas, 0, 0);
  scratchpadCanvas.width = w;
  scratchpadCanvas.height = h;
  scratchpadCtx.drawImage(snap, 0, 0, w, h);
}

function initScratchpad() {
  scratchpadCanvas = document.getElementById("hw_scratchpad_canvas");
  if (!scratchpadCanvas) return;
  scratchpadCtx = scratchpadCanvas.getContext("2d");
  var canvas = scratchpadCanvas;

  function getPos(e) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }
  function startDraw(e) {
    e.preventDefault();
    isDrawing = true;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    var pos = getPos(e);
    scratchpadCtx.beginPath();
    scratchpadCtx.moveTo(pos.x, pos.y);
  }
  function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    var pos = getPos(e);
    var scale = scratchpadScale();
    scratchpadCtx.lineCap = "round";
    scratchpadCtx.lineJoin = "round";
    scratchpadCtx.globalCompositeOperation = isEraser ? "destination-out" : "source-over";
    scratchpadCtx.strokeStyle = scratchpadColor;
    scratchpadCtx.lineWidth = (isEraser ? 18 : 3.5) * scale;
    scratchpadCtx.lineTo(pos.x, pos.y);
    scratchpadCtx.stroke();
  }
  function stopDraw() {
    if (!isDrawing) return;
    isDrawing = false;
    scratchpadCtx.closePath();
  }
  canvas.addEventListener("pointerdown", startDraw);
  canvas.addEventListener("pointermove", draw);
  canvas.addEventListener("pointerup", stopDraw);
  canvas.addEventListener("pointercancel", stopDraw);
  canvas.addEventListener("pointerleave", stopDraw);
  if (window.ResizeObserver) new ResizeObserver(fitScratchpad).observe(canvas);
  fitScratchpad();
}

function setScratchpadExpanded(on) {
  var wrap = document.getElementById("hw_scratchpad_wrapper");
  if (!wrap) return;
  var wasOn = wrap.classList.contains("is-expanded");
  wrap.classList.toggle("is-expanded", on);
  document.body.classList.toggle("hw-scratchpad-open", on);
  if (on) {
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-label", "Family Math Scratchpad");
  } else {
    wrap.removeAttribute("role");
    wrap.removeAttribute("aria-modal");
    wrap.removeAttribute("aria-label");
  }
  var btn = document.getElementById("scratchpad_expand_btn");
  if (btn) {
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    var en = btn.querySelector(".scratchpad-expand-en");
    var es = btn.querySelector(".scratchpad-expand-es");
    if (en) en.textContent = on ? "Exit full screen" : "Full screen";
    if (es) es.textContent = on ? "Salir de pantalla completa" : "Pantalla completa";
    if (on && !wasOn) btn.focus();
  }
  fitScratchpad();
}

function toggleScratchpadExpand() {
  var wrap = document.getElementById("hw_scratchpad_wrapper");
  if (wrap) setScratchpadExpanded(!wrap.classList.contains("is-expanded"));
}

function toggleScratchpad() {
  var wrap = document.getElementById("hw_scratchpad_wrapper");
  if (!wrap) return;
  var willOpen = wrap.hidden;
  wrap.hidden = !willOpen;
  if (willOpen) {
    scratchpadReturnFocus = document.activeElement;
    if (!scratchpadCtx) initScratchpad();
    /* A 220px strip is too small to draw in on a phone, so phones open full screen. */
    if (window.matchMedia && window.matchMedia("(max-width: 640px)").matches) setScratchpadExpanded(true);
    else wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
    fitScratchpad();
  } else {
    setScratchpadExpanded(false);
    if (scratchpadReturnFocus && scratchpadReturnFocus.focus) scratchpadReturnFocus.focus();
  }
}

document.addEventListener("keydown", function (e) {
  if (e.key !== "Escape") return;
  var wrap = document.getElementById("hw_scratchpad_wrapper");
  if (wrap && wrap.classList.contains("is-expanded")) setScratchpadExpanded(false);
});

function setScratchpadColor(color, btn) {
  scratchpadColor = color;
  isEraser = false;
  document.querySelectorAll(".color-dot").forEach(function (d) { d.classList.remove("is-active"); });
  if (btn) btn.classList.add("is-active");
  var eraserBtn = document.getElementById("scratchpad_eraser_btn");
  if (eraserBtn) eraserBtn.classList.remove("is-active");
}

function toggleScratchpadEraser() {
  isEraser = !isEraser;
  var eraserBtn = document.getElementById("scratchpad_eraser_btn");
  if (eraserBtn) eraserBtn.classList.toggle("is-active", isEraser);
  if (isEraser) {
    document.querySelectorAll(".color-dot").forEach(function (d) { d.classList.remove("is-active"); });
  } else {
    var dot = document.querySelector('.color-dot[data-color="' + scratchpadColor + '"]');
    if (dot) dot.classList.add("is-active");
  }
}

function clearScratchpad() {
  if (!scratchpadCanvas || !scratchpadCtx) return;
  scratchpadCtx.clearRect(0, 0, scratchpadCanvas.width, scratchpadCanvas.height);
}

function setScratchpadGrid(gridType, btn) {
  document.querySelectorAll(".grid-btn").forEach(function (b) { b.classList.remove("is-active"); });
  if (btn) btn.classList.add("is-active");
  var wrap = document.querySelector(".scratchpad-canvas-wrap");
  if (!wrap) return;
  Array.prototype.slice.call(wrap.classList).forEach(function (name) {
    if (name.indexOf("scratchpad-bg-") === 0) wrap.classList.remove(name);
  });
  if (gridType !== "blank") wrap.classList.add("scratchpad-bg-" + gridType);
}
`;
