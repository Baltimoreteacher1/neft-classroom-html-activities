const NS = "http://www.w3.org/2000/svg";
const STYLE_ID = "ewl-number-talk-board-styles";
let instanceSequence = 0;

const COPY = {
  en: {
    heading: "Compare strategies",
    instruction: "Reveal a model, then record what students notice or explain.",
    reveal: "Reveal model",
    hide: "Hide model",
    numberLine: "Number line",
    area: "Area model",
    decomposition: "Decomposition",
    stemsTitle: "Math talk sentence stems",
    noteLabel: "Whiteboard notes",
    notePlaceholder: "Record a student idea or a question to revisit…",
    noStems: ["I agree with ___ because ___.", "I decomposed ___ into ___ so that ___.", "I used the model to notice ___."],
    start: "Start",
    end: "End",
    total: "Total",
    split: "Split",
  },
  es: {
    heading: "Compara estrategias",
    instruction: "Revela un modelo y anota lo que observan o explican los estudiantes.",
    reveal: "Revelar modelo",
    hide: "Ocultar modelo",
    numberLine: "Recta numérica",
    area: "Modelo de área",
    decomposition: "Descomposición",
    stemsTitle: "Frases para hablar de matemáticas",
    noteLabel: "Notas para la pizarra",
    notePlaceholder: "Anota una idea de un estudiante o una pregunta para retomar…",
    noStems: ["Estoy de acuerdo con ___ porque ___.", "Descompuse ___ en ___ para que ___.", "Usé el modelo para observar ___."],
    start: "Inicio",
    end: "Final",
    total: "Total",
    split: "Partición",
  },
};

const MODEL_DEFS = [
  { id: "number-line", kind: "numberLine", title: "Number line", description: "Follow the quantities and jumps." },
  { id: "area-model", kind: "area", title: "Area model", description: "See the quantities as equal groups or an array." },
  { id: "decomposition", kind: "decomposition", title: "Decomposition", description: "Break a number into friendly parts." },
];

const STYLE_TEXT = `
.ewl-talk-board{--nt-ink:#172b4d;--nt-muted:#52627a;--nt-line:#cbd7e6;--nt-surface:#fff;--nt-soft:#f3f7fc;--nt-accent:#155e75;color:var(--nt-ink);font:inherit}
.ewl-talk-board *{box-sizing:border-box}.ewl-talk-board__header{margin:0 0 1rem}.ewl-talk-board__header h3{margin:0 0 .3rem;font-size:1.2rem}.ewl-talk-board__header p{margin:0;color:var(--nt-muted)}
.ewl-talk-board__grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.8rem;align-items:stretch}
.ewl-talk-board__card{border:1px solid var(--nt-line);border-radius:12px;background:var(--nt-surface);padding:.85rem;min-width:0;display:flex;flex-direction:column;gap:.55rem}
.ewl-talk-board__card h4{margin:0;font-size:1rem}.ewl-talk-board__card p{margin:0;color:var(--nt-muted);font-size:.9rem}
.ewl-talk-board__toggle{align-self:flex-start;border:1px solid var(--nt-accent);border-radius:8px;background:var(--nt-soft);color:var(--nt-ink);font:inherit;font-weight:700;padding:.48rem .7rem;cursor:pointer}
.ewl-talk-board__toggle:focus-visible,.ewl-talk-board textarea:focus-visible{outline:3px solid #f0b429;outline-offset:2px}
.ewl-talk-board__model{margin-top:.15rem;padding:.4rem;border-radius:8px;background:#fff;min-height:155px}.ewl-talk-board__model[hidden]{display:none}
.ewl-talk-board svg{display:block;width:100%;height:auto;max-height:220px}.ewl-talk-board .nt-axis{stroke:#38516b;stroke-width:3}.ewl-talk-board .nt-tick{stroke:#38516b;stroke-width:2}.ewl-talk-board .nt-jump{stroke:#147d92;stroke-width:3;fill:none}.ewl-talk-board .nt-fill{fill:#bde7ec;stroke:#147d92;stroke-width:2}.ewl-talk-board .nt-cell{fill:#e8f2f8;stroke:#6a8199;stroke-width:1.5}.ewl-talk-board .nt-highlight{fill:#f8d77a;stroke:#9b6b00;stroke-width:2}.ewl-talk-board svg text{font-family:inherit;fill:#172b4d;font-size:14px}
.ewl-talk-board__equation{font-size:1.05rem!important;font-weight:800!important;text-align:center;color:var(--nt-ink)!important;padding:.4rem}.ewl-talk-board__notes{display:block;margin-top:auto;padding-top:.2rem}.ewl-talk-board__notes span{display:block;font-weight:700;font-size:.85rem;margin-bottom:.25rem}.ewl-talk-board textarea{display:block;width:100%;min-height:3.5rem;resize:vertical;border:1px solid var(--nt-line);border-radius:7px;padding:.45rem;font:inherit;font-size:.88rem;color:var(--nt-ink);background:#fff}
.ewl-talk-board__stems{margin-top:1rem;padding:.85rem;border-radius:10px;background:var(--nt-soft)}.ewl-talk-board__stems h4{margin:0 0 .45rem}.ewl-talk-board__stems ul{display:flex;flex-wrap:wrap;gap:.45rem .8rem;margin:0;padding-left:1.3rem}.ewl-talk-board__stems li{max-width:32rem}
@media(max-width:800px){.ewl-talk-board__grid{grid-template-columns:1fr}.ewl-talk-board__card{display:grid;grid-template-columns:1fr auto}.ewl-talk-board__card>p,.ewl-talk-board__model,.ewl-talk-board__notes{grid-column:1/-1}.ewl-talk-board__toggle{grid-column:2;grid-row:1}}
@media(prefers-reduced-motion:no-preference){.ewl-talk-board__model{animation:ewlTalkReveal .18s ease-out}@keyframes ewlTalkReveal{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}}
`;

function text(document, tag, content, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = String(content ?? "");
  return node;
}

function svgElement(document, tag, attrs = {}, content) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  if (content !== undefined) node.textContent = String(content);
  return node;
}

function addStyles(document) {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = STYLE_TEXT;
  document.head?.append(style);
}

function numericValues(talk) {
  const model = talk.models || talk.visuals || {};
  const direct = Array.isArray(model.numberLine?.values) ? model.numberLine.values : Array.isArray(talk.numberLineValues) ? talk.numberLineValues : null;
  if (direct?.length >= 2) return direct.slice(0, 4).map((n) => Number(n)).filter(Number.isFinite);
  const fromProblem = String(talk.problem || "").match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
  return fromProblem.length >= 2 ? fromProblem.slice(0, 3) : [0, 4, 10];
}

function getDecomposition(talk) {
  const model = talk.models || talk.visuals || {};
  const custom = model.decomposition || talk.decomposition;
  if (custom && (custom.equation || custom.parts?.length)) {
    return { equation: custom.equation || "", parts: (custom.parts || []).map(String) };
  }
  const expression = String(talk.problem || "").split("=")[0].trim();
  const match = expression.match(/^(-?\d+(?:\.\d+)?)\s*([+×x*−-])\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return { equation: expression, parts: [] };
  const [, left, op, right] = match;
  if (op === "+") {
    const a = Number(left), b = Number(right), friendly = Math.max(0, 10 - a);
    return { equation: `${left} + ${right}`, parts: friendly > 0 && friendly < b ? [`${a} + ${friendly} = 10`, `${b} = ${friendly} + ${b - friendly}`, `10 + ${b - friendly} = ${a + b}`] : [`${left} + ${right} = ${a + b}`] };
  }
  if (["×", "x", "*"].includes(op)) {
    const a = Number(left), b = Number(right), base = Math.floor(a / 10) * 10, rest = a - base;
    return { equation: `${left} × ${right}`, parts: rest ? [`${a} × ${b} = (${base} + ${rest}) × ${b}`, `${base} × ${b} + ${rest} × ${b}`, `${base * b} + ${rest * b} = ${a * b}`] : [`${a} groups of ${b}`, `${a} × ${b} = ${a * b}`] };
  }
  const a = Number(left), b = Number(right);
  return { equation: `${left} − ${right}`, parts: [`${a} − ${b}`, `${a} = ${b} + ${a - b}`, `${a} − ${b} = ${a - b}`] };
}

function buildNumberLine(document, talk, copy) {
  const values = numericValues(talk);
  const min = Math.min(0, ...values), max = Math.max(10, ...values);
  const span = Math.max(1, max - min), left = 32, right = 368, y = 94;
  const x = (value) => left + ((value - min) / span) * (right - left);
  const svg = svgElement(document, "svg", { viewBox: "0 0 400 145", role: "img", "aria-label": `${copy.numberLine}: ${values.join(", ")}` });
  svg.append(svgElement(document, "line", { x1: left, y1: y, x2: right, y2: y, class: "nt-axis" }));
  const tickValues = Array.from(new Set([min, ...values, max])).sort((a, b) => a - b);
  for (const value of tickValues) {
    svg.append(svgElement(document, "line", { x1: x(value), y1: y - 8, x2: x(value), y2: y + 8, class: "nt-tick" }));
    svg.append(svgElement(document, "text", { x: x(value), y: y + 28, "text-anchor": "middle" }, value));
  }
  if (values.length >= 2) {
    const start = values[0], end = values[1], mid = (x(start) + x(end)) / 2;
    const arc = svgElement(document, "path", { d: `M ${x(start)} ${y - 2} Q ${mid} 24 ${x(end)} ${y - 2}`, class: "nt-jump" });
    svg.append(arc);
    svg.append(svgElement(document, "text", { x: mid, y: 35, "text-anchor": "middle" }, `${copy.start} ${start} → ${copy.end} ${end}`));
  }
  return svg;
}

function buildAreaModel(document, talk, copy) {
  const model = talk.models || talk.visuals || {};
  const area = model.area || talk.areaModel || {};
  const rows = clamp(Number(area.rows) || (numericValues(talk)[0] >= 2 ? 2 : 1), 1, 8);
  const cols = clamp(Number(area.columns) || (numericValues(talk)[1] >= 2 ? 5 : 4), 1, 10);
  const cell = Math.min(34, 260 / cols, 112 / rows), width = cols * cell, height = rows * cell;
  const svg = svgElement(document, "svg", { viewBox: `0 0 ${width + 50} ${height + 48}`, role: "img", "aria-label": `${copy.area}: ${rows} by ${cols} array` });
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
    const isPartition = area.splitAfter && col === Number(area.splitAfter) - 1;
    svg.append(svgElement(document, "rect", { x: 20 + col * cell, y: 8 + row * cell, width: cell, height: cell, class: isPartition ? "nt-highlight" : "nt-cell" }));
  }
  svg.append(svgElement(document, "text", { x: 20 + width / 2, y: height + 34, "text-anchor": "middle" }, `${rows} × ${cols} · ${copy.total} ${rows * cols}`));
  return svg;
}

function buildDecomposition(document, talk) {
  const decomposition = getDecomposition(talk);
  const svg = svgElement(document, "svg", { viewBox: "0 0 400 152", role: "img", "aria-label": "Decomposition strategy diagram" });
  const parts = decomposition.parts.length ? decomposition.parts : [decomposition.equation || "Think about friendly parts"];
  const labels = parts.slice(0, 3);
  const boxWidth = 360 / labels.length;
  labels.forEach((part, index) => {
    const x = 20 + index * boxWidth;
    svg.append(svgElement(document, "rect", { x, y: 32, width: boxWidth - 10, height: 66, rx: 9, class: index === labels.length - 1 ? "nt-highlight" : "nt-fill" }));
    svg.append(svgElement(document, "text", { x: x + (boxWidth - 10) / 2, y: 69, "text-anchor": "middle" }, part));
    if (index < labels.length - 1) svg.append(svgElement(document, "text", { x: x + boxWidth - 6, y: 72, "text-anchor": "middle" }, "→"));
  });
  return { svg, equation: decomposition.equation };
}

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function stemsFor(talk, language) {
  const stems = talk.teacherStems || talk.sentenceStems || {};
  const localized = Array.isArray(stems[language]) ? stems[language] : Array.isArray(stems[language === "es" ? "en" : "es"]) ? stems[language === "es" ? "en" : "es"] : null;
  if (localized?.length) return localized;
  return COPY[language].noStems;
}

/** Render a standalone bilingual strategy board into a container. Returns a cleanup function. */
export function renderNumberTalkBoard(container, talk, options = {}) {
  if (!container?.ownerDocument) throw new TypeError("A DOM container is required.");
  if (!talk || typeof talk !== "object") throw new TypeError("A Number Talk object is required.");
  const document = container.ownerDocument;
  const language = options.language === "es" || options.language === "es-MX" ? "es" : "en";
  const copy = COPY[language];
  const instanceId = ++instanceSequence;
  addStyles(document);
  const root = document.createElement("section");
  root.className = "ewl-talk-board";
  root.setAttribute("aria-label", language === "es" ? "Pizarra de estrategias para conversación matemática" : "Number Talk strategy board");
  const header = document.createElement("header");
  header.className = "ewl-talk-board__header";
  header.append(text(document, "h3", copy.heading), text(document, "p", copy.instruction));
  root.append(header);
  const grid = document.createElement("div");
  grid.className = "ewl-talk-board__grid";
  const titleByKind = { numberLine: copy.numberLine, area: copy.area, decomposition: copy.decomposition };
  const descriptionByKind = {
    numberLine: language === "es" ? "Sigue las cantidades y los saltos." : "Follow the quantities and jumps.",
    area: language === "es" ? "Representa las cantidades como grupos iguales o un arreglo." : "See the quantities as equal groups or an array.",
    decomposition: language === "es" ? "Descompón un número en partes convenientes." : "Break a number into friendly parts.",
  };
  for (const definition of MODEL_DEFS) {
    const card = document.createElement("article");
    card.className = "ewl-talk-board__card";
    const titleId = `ewl-talk-${definition.id}-title-${instanceId}`;
    const title = text(document, "h4", titleByKind[definition.kind]);
    title.id = titleId;
    card.setAttribute("aria-labelledby", titleId);
    card.append(title);
    const toggle = text(document, "button", copy.reveal, "ewl-talk-board__toggle");
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");
    const modelPanel = document.createElement("div");
    modelPanel.className = "ewl-talk-board__model";
    modelPanel.hidden = true;
    let equation = "";
    if (definition.kind === "numberLine") modelPanel.append(buildNumberLine(document, talk, copy));
    if (definition.kind === "area") modelPanel.append(buildAreaModel(document, talk, copy));
    if (definition.kind === "decomposition") {
      const decomposition = buildDecomposition(document, talk);
      modelPanel.append(decomposition.svg);
      equation = decomposition.equation;
      if (equation) modelPanel.append(text(document, "p", equation, "ewl-talk-board__equation"));
    }
    const description = text(document, "p", descriptionByKind[definition.kind]);
    const notes = document.createElement("label");
    notes.className = "ewl-talk-board__notes";
    const noteCaption = text(document, "span", copy.noteLabel);
    const textarea = document.createElement("textarea");
    textarea.placeholder = copy.notePlaceholder;
    notes.append(noteCaption, textarea);
    toggle.setAttribute("aria-controls", `${titleId}-model`);
    modelPanel.id = `${titleId}-model`;
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      toggle.textContent = expanded ? copy.reveal : copy.hide;
      modelPanel.hidden = expanded;
    });
    card.append(description, toggle, modelPanel, notes);
    grid.append(card);
  }
  root.append(grid);
  const stemSection = document.createElement("section");
  stemSection.className = "ewl-talk-board__stems";
  stemSection.setAttribute("aria-labelledby", "ewl-talk-stems-heading");
  const stemHeading = text(document, "h4", copy.stemsTitle);
  stemHeading.id = "ewl-talk-stems-heading";
  const stemList = document.createElement("ul");
  for (const stem of stemsFor(talk, language)) stemList.append(text(document, "li", stem));
  stemSection.append(stemHeading, stemList);
  root.append(stemSection);
  container.replaceChildren(root);
  return () => { if (root.parentNode === container) root.remove(); };
}

export const mountNumberTalkBoard = renderNumberTalkBoard;
export default renderNumberTalkBoard;
