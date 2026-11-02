
const WIDTH = 1000;
const HEIGHT = 500;
let nextScratchpadId = 0;

const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const BACKGROUNDS = ["blank", "lined", "grid", "dots", "numberline"];
const TOOLS = ["pen", "highlighter", "eraser"];
const LABELS = {
  title: "Math scratchpad",
  backgrounds: "Choose a scratchpad background",
  tools: "Choose a drawing tool",
  blank: "Blank",
  lined: "Lined",
  grid: "Grid",
  dots: "Dot array",
  numberline: "Number line",
  pen: "Pen",
  highlighter: "Highlighter",
  eraser: "Eraser",
  undo: "Undo last action",
  clear: "Clear drawings",
  drawingSurface: "Drawing surface. Use a pointer to draw. When focused, use arrow keys to move the cursor, Enter to start or finish a stroke, and Escape to cancel.",
  cleared: "Drawings cleared. Use Undo to restore them.",
  undone: "Last scratchpad action undone.",
  stroke: "Stroke added.",
  erased: "Drawing erased.",
};
const LABELS_ES = {
  title: "Borrador de matemáticas", backgrounds: "Elige el fondo del borrador", tools: "Elige una herramienta de dibujo",
  blank: "En blanco", lined: "Con líneas", grid: "Cuadrícula", dots: "Arreglo de puntos", numberline: "Recta numérica",
  pen: "Lápiz", highlighter: "Resaltador", eraser: "Borrador", undo: "Deshacer la última acción", clear: "Borrar dibujos",
  drawingSurface: "Área de dibujo. Dibuja con un dispositivo señalador. Al enfocar el área, usa las flechas para mover el cursor, Enter para iniciar o terminar un trazo y Escape para cancelar.",
  cleared: "Dibujos borrados. Usa Deshacer para restaurarlos.", undone: "Se deshizo la última acción del borrador.", stroke: "Trazo agregado.", erased: "Dibujo borrado.",
};

/** Return the non-interactive SVG background layer for a scratchpad surface. */
export function scratchpadBackgroundMarkup(background, id = "scratchpad") {
  const safeBackground = BACKGROUNDS.includes(background) ? background : "lined";
  const patternId = `${String(id).replace(/[^a-zA-Z0-9_-]/g, "-")}-${safeBackground}-pattern`;
  if (safeBackground === "blank") return "";
  if (safeBackground === "numberline") {
    const ticks = Array.from({ length: 21 }, (_, index) => {
      const value = index - 10;
      const x = 80 + index * 42;
      const tickHeight = value % 5 === 0 ? 18 : 10;
      return `<path d="M${x} 250v${tickHeight}"/><text x="${x}" y="${278 + tickHeight - 10}" text-anchor="middle">${value}</text>`;
    }).join("");
    return `<g class="scratchpad-background-layer scratchpad-background-numberline" aria-hidden="true"><path class="scratchpad-numberline-axis" d="M72 250H928"/><path class="scratchpad-numberline-arrow" d="m72 250 12-7v14zM928 250l-12-7v14z"/>${ticks}</g>`;
  }
  if (safeBackground === "lined") {
    const lines = Array.from({ length: 11 }, (_, index) => `<path d="M28 ${44 + index * 40}H972"/>`).join("");
    return `<g class="scratchpad-background-layer scratchpad-background-lined" aria-hidden="true">${lines}</g>`;
  }
  const spacing = safeBackground === "dots" ? 32 : 40;
  const marks = safeBackground === "dots"
    ? `<circle class="scratchpad-pattern-dot" cx="2" cy="2" r="2"/>`
    : `<path class="scratchpad-pattern-grid" d="M${spacing} 0H0V${spacing}"/>`;
  return `<defs><pattern id="${esc(patternId)}" width="${spacing}" height="${spacing}" patternUnits="userSpaceOnUse">${marks}</pattern></defs><rect class="scratchpad-background-layer scratchpad-background-${safeBackground}" width="${WIDTH}" height="${HEIGHT}" fill="url(#${esc(patternId)})" aria-hidden="true"/>`;
}

function toolbarButton({ action, value = "", label, pressed = false, disabled = false, icon }) {
  return `<button type="button" class="scratchpad-button" data-scratchpad-action="${action}" data-scratchpad-value="${esc(value)}" aria-label="${esc(label)}"${action === "background" || action === "tool" ? ` aria-pressed="${pressed}"` : ""}${disabled ? " disabled" : ""}><span aria-hidden="true">${icon}</span><span class="scratchpad-button-label">${esc(label)}</span></button>`;
}

function pointerPosition(event, svg) {
  const rect = svg.getBoundingClientRect();
  if (!rect.width || !rect.height) return { x: WIDTH / 2, y: HEIGHT / 2 };
  const scale = Math.min(rect.width / WIDTH, rect.height / HEIGHT);
  const drawnWidth = WIDTH * scale;
  const drawnHeight = HEIGHT * scale;
  const offsetX = (rect.width - drawnWidth) / 2;
  const offsetY = (rect.height - drawnHeight) / 2;
  return {
    x: Math.max(0, Math.min(WIDTH, ((event.clientX - rect.left - offsetX) / scale))),
    y: Math.max(0, Math.min(HEIGHT, ((event.clientY - rect.top - offsetY) / scale))),
  };
}

function makeStroke(svg, points, tool, labels) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const commands = points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const width = tool === "highlighter" ? 34 : tool === "eraser" ? 30 : 7;
  path.setAttribute("d", commands);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", tool === "highlighter" ? "#f4c84a" : "#174a78");
  path.setAttribute("stroke-width", String(width));
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("vector-effect", "non-scaling-stroke");
  path.setAttribute("class", `scratchpad-stroke scratchpad-stroke-${tool}`);
  path.setAttribute("aria-label", `${labels[tool]} stroke`);
  path.setAttribute("pointer-events", "stroke");
  return path;
}

/**
 * Mount an editable, local-only, layered scratchpad inside a container.
 * Returns { destroy, setBackground, setTool, clear, undo, getState }.
 * `t` may be supplied by the host's bilingual interface.
 */
export function mountScratchpad(container, { t = (label) => label, language = "en", background = "lined", tool = "pen" } = {}) {
  if (!container?.ownerDocument) throw new TypeError("mountScratchpad needs a DOM container");
  const id = `fluency-scratchpad-${++nextScratchpadId}`;
  let currentLanguage = language === "es" ? "es" : "en";
  const resolveLabels = () => Object.fromEntries(Object.entries(LABELS).map(([key, value]) => {
    const translated = t(value);
    return [key, translated !== value ? translated : currentLanguage === "es" ? LABELS_ES[key] : value];
  }));
  let labels = resolveLabels();
  let activeBackground = BACKGROUNDS.includes(background) ? background : "lined";
  let activeTool = TOOLS.includes(tool) ? tool : "pen";
  let pointerStroke = null;
  let keyboardStroke = null;
  const undoStack = [];
  const drawingLayerId = `${id}-drawings`;

  container.innerHTML = `<section class="fluency-scratchpad" aria-label="${esc(labels.title)}">
    <div class="scratchpad-toolbar" role="toolbar" aria-label="${esc(labels.backgrounds)}">
      <div class="scratchpad-control-group" data-label-group="backgrounds" role="group" aria-label="${esc(labels.backgrounds)}">${BACKGROUNDS.map((name) => toolbarButton({ action: "background", value: name, label: labels[name], pressed: name === activeBackground, icon: ({ blank: "□", lined: "▤", grid: "▦", dots: "⠿", numberline: "↔" })[name] })).join("")}</div>
      <div class="scratchpad-control-group" data-label-group="tools" role="group" aria-label="${esc(labels.tools)}">${TOOLS.map((name) => toolbarButton({ action: "tool", value: name, label: labels[name], pressed: name === activeTool, icon: ({ pen: "✎", highlighter: "▰", eraser: "▱" })[name] })).join("")}</div>
      <div class="scratchpad-control-group scratchpad-actions" role="group" aria-label="${esc(labels.title)}">
        ${toolbarButton({ action: "undo", label: labels.undo, disabled: true, icon: "↶" })}
        ${toolbarButton({ action: "clear", label: labels.clear, icon: "⌫" })}
      </div>
    </div>
    <p class="scratchpad-instructions" id="${id}-instructions">${esc(labels.drawingSurface)}</p>
    <svg class="scratchpad-surface" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid meet" tabindex="0" role="img" aria-label="${esc(labels.drawingSurface)}" aria-describedby="${id}-instructions" aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Enter Escape">
      <rect class="scratchpad-paper" width="${WIDTH}" height="${HEIGHT}" aria-hidden="true"/>
      <g data-scratchpad-background>${scratchpadBackgroundMarkup(activeBackground, id)}</g>
      <g id="${drawingLayerId}" class="scratchpad-drawing-layer"></g>
      <circle class="scratchpad-keyboard-cursor" cx="500" cy="250" r="12" aria-hidden="true"/>
    </svg>
    <p class="scratchpad-status" role="status" aria-live="polite"></p>
  </section>`;

  const root = container.querySelector(".fluency-scratchpad");
  const svg = root.querySelector(".scratchpad-surface");
  const backgroundLayer = root.querySelector("[data-scratchpad-background]");
  const drawingLayer = root.querySelector(".scratchpad-drawing-layer");
  const status = root.querySelector(".scratchpad-status");
  const undoButton = root.querySelector('[data-scratchpad-action="undo"]');
  const syncUndoButton = () => { undoButton.disabled = undoStack.length === 0; };
  let lastStatus = "";
  const announce = (key) => { lastStatus = key; status.textContent = labels[key] || ""; };
  const setBackground = (value) => {
    if (!BACKGROUNDS.includes(value)) return;
    activeBackground = value;
    backgroundLayer.innerHTML = scratchpadBackgroundMarkup(value, id);
    root.querySelectorAll('[data-scratchpad-action="background"]').forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.scratchpadValue === value)));
    svg.setAttribute("aria-label", `${labels.title}. ${labels[value]}. ${labels.drawingSurface}`);
  };
  const setTool = (value) => {
    if (!TOOLS.includes(value)) return;
    activeTool = value;
    root.querySelectorAll('[data-scratchpad-action="tool"]').forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.scratchpadValue === value)));
    svg.dataset.tool = value;
  };
  const setLanguage = (value) => {
    currentLanguage = value === "es" ? "es" : "en";
    labels = resolveLabels();
    root.setAttribute("aria-label", labels.title);
    root.querySelector('[data-label-group="backgrounds"]').setAttribute("aria-label", labels.backgrounds);
    root.querySelector('[data-label-group="tools"]').setAttribute("aria-label", labels.tools);
    root.querySelector('.scratchpad-actions[role="group"]').setAttribute("aria-label", labels.title);
    root.querySelectorAll('[data-scratchpad-action="background"], [data-scratchpad-action="tool"]').forEach((button) => {
      const key = button.dataset.scratchpadValue;
      button.setAttribute("aria-label", labels[key]);
      button.querySelector(".scratchpad-button-label").textContent = labels[key];
      button.setAttribute("aria-pressed", String((button.dataset.scratchpadAction === "background" ? activeBackground : activeTool) === key));
    });
    undoButton.setAttribute("aria-label", labels.undo);
    undoButton.querySelector(".scratchpad-button-label").textContent = labels.undo;
    root.querySelector('[data-scratchpad-action="clear"]').setAttribute("aria-label", labels.clear);
    root.querySelector('[data-scratchpad-action="clear"] .scratchpad-button-label').textContent = labels.clear;
    root.querySelector(`#${id}-instructions`).textContent = labels.drawingSurface;
    svg.setAttribute("aria-label", `${labels.title}. ${labels[activeBackground]}. ${labels.drawingSurface}`);
    status.textContent = lastStatus ? labels[lastStatus] : "";
  };
  const beginStroke = (point) => {
    pointerStroke = { tool: activeTool, points: [point], removed: [], path: null };
    if (activeTool !== "eraser") {
      pointerStroke.path = makeStroke(svg, pointerStroke.points, activeTool, labels);
      drawingLayer.append(pointerStroke.path);
    } else eraseAt(point);
  };
  const updateStroke = (point) => {
    if (!pointerStroke) return;
    const previous = pointerStroke.points.at(-1);
    if (Math.hypot(point.x - previous.x, point.y - previous.y) < 1.5) return;
    pointerStroke.points.push(point);
    if (pointerStroke.tool === "eraser") eraseAt(point);
    else pointerStroke.path.setAttribute("d", pointerStroke.points.map((p, index) => `${index ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" "));
  };
  function eraseAt(point) {
    const screen = svg.getBoundingClientRect();
    const scale = Math.min(screen.width / WIDTH, screen.height / HEIGHT);
    const x = screen.left + (screen.width - WIDTH * scale) / 2 + point.x * scale;
    const y = screen.top + (screen.height - HEIGHT * scale) / 2 + point.y * scale;
    const hit = document.elementsFromPoint(x, y).find((element) => element?.classList?.contains("scratchpad-stroke") && drawingLayer.contains(element));
    if (hit && !pointerStroke.removed.some((entry) => entry.element === hit)) {
      const index = [...drawingLayer.children].indexOf(hit);
      pointerStroke.removed.push({ element: hit, index });
      hit.remove();
    }
  }
  const finishStroke = () => {
    if (!pointerStroke) return;
    if (pointerStroke.tool === "eraser") {
      if (pointerStroke.removed.length) {
        undoStack.push({ type: "erase", removed: pointerStroke.removed });
        announce("erased");
      }
    } else if (pointerStroke.points.length) {
      undoStack.push({ type: "add", element: pointerStroke.path });
      announce("stroke");
    }
    pointerStroke = null;
    syncUndoButton();
  };
  const cancelStroke = () => {
    if (!pointerStroke) return;
    if (pointerStroke.path?.isConnected) pointerStroke.path.remove();
    for (const entry of [...pointerStroke.removed].reverse()) drawingLayer.insertBefore(entry.element, drawingLayer.children[entry.index] || null);
    pointerStroke = null;
  };
  const clear = () => {
    if (!drawingLayer.childElementCount) return;
    const removed = [...drawingLayer.children].map((element, index) => ({ element, index }));
    drawingLayer.replaceChildren();
    undoStack.push({ type: "clear", removed });
    syncUndoButton();
    announce("cleared");
  };
  const undo = () => {
    const command = undoStack.pop();
    if (!command) return;
    if (command.type === "add") command.element.remove();
    else for (const entry of command.removed) drawingLayer.insertBefore(entry.element, drawingLayer.children[entry.index] || null);
    syncUndoButton();
    announce("undone");
  };
  const getState = () => ({ background: activeBackground, tool: activeTool, strokes: drawingLayer.childElementCount, undoable: undoStack.length });

  root.querySelectorAll("[data-scratchpad-action]").forEach((button) => button.addEventListener("click", () => {
    const action = button.getAttribute("data-scratchpad-action");
    const scratchpadValue = button.getAttribute("data-scratchpad-value");
    if (action === "background") setBackground(scratchpadValue);
    else if (action === "tool") setTool(scratchpadValue);
    else if (action === "undo") undo();
    else if (action === "clear") clear();
  }));
  svg.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    event.preventDefault();
    svg.focus({ preventScroll: true });
    svg.setPointerCapture(event.pointerId);
    beginStroke(pointerPosition(event, svg));
  });
  svg.addEventListener("pointermove", (event) => { if (pointerStroke) updateStroke(pointerPosition(event, svg)); });
  svg.addEventListener("pointerup", finishStroke);
  svg.addEventListener("pointercancel", cancelStroke);
  svg.addEventListener("lostpointercapture", cancelStroke);
  svg.addEventListener("keydown", (event) => {
    const cursor = root.querySelector(".scratchpad-keyboard-cursor");
    let point = { x: Number(cursor.getAttribute("cx")), y: Number(cursor.getAttribute("cy")) };
    const move = { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, -12], ArrowDown: [0, 12] }[event.key];
    if (move) {
      event.preventDefault();
      point = { x: Math.max(0, Math.min(WIDTH, point.x + move[0])), y: Math.max(0, Math.min(HEIGHT, point.y + move[1])) };
      cursor.setAttribute("cx", point.x);
      cursor.setAttribute("cy", point.y);
      if (keyboardStroke) {
        keyboardStroke.points.push(point);
        keyboardStroke.path.setAttribute("d", keyboardStroke.points.map((p, index) => `${index ? "L" : "M"}${p.x} ${p.y}`).join(" "));
      }
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (keyboardStroke) { pointerStroke = keyboardStroke; keyboardStroke = null; finishStroke(); }
      else if (activeTool !== "eraser") {
        const path = makeStroke(svg, [point], activeTool, labels);
        drawingLayer.append(path);
        keyboardStroke = { tool: activeTool, points: [point], path };
      }
    } else if (event.key === "Escape" && keyboardStroke) {
      event.preventDefault();
      keyboardStroke.path.remove();
      keyboardStroke = null;
    }
  });

  setTool(activeTool);
  setBackground(activeBackground);
  return {
    destroy() { root.remove(); },
    setBackground,
    setTool,
    setLanguage,
    clear,
    undo,
    getState,
  };
}
