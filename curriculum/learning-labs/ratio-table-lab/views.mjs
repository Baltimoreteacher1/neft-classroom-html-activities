// Shared markup helpers for the Lesson 3.4 ratio table lab.
// Every helper returns an HTML string; values that could come from saved
// state pass through esc() before they reach the page.

export const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

export const EMPTY = '<span class="empty">?</span>';
export const DASH = '<span class="empty">—</span>';

export function header(title, instruction, counter) {
  return `<div class="stage-heading"><div><h2 id="stage-title" tabindex="-1">${title}</h2><p id="stage-instruction">${instruction}</p></div><div class="stage-tools"><span class="counter">${counter}</span><button type="button" class="quiet speak" data-action="speak" aria-label="Read the directions aloud">🔊 Read aloud</button></div></div>`;
}

export function btn(action, text, cls = "primary", attrs = "") {
  return `<button type="button" class="btn ${cls}" id="act-${action}" data-action="${action}" ${attrs}>${text}</button>`;
}

export function submitBtn(form, text) {
  return `<button class="btn primary" type="submit" form="${form}">${text}</button>`;
}

export function numberInput(id, value, label, visibleLabel = false) {
  const labelHtml = `<label ${visibleLabel ? "" : 'class="sr-only" '}for="${id}">${label}</label>`;
  return `${labelHtml}<input class="number-input" id="${id}" type="number" inputmode="numeric" min="0" autocomplete="off" value="${esc(value)}">`;
}

export function hintBlock(ctx, text) {
  return ctx.hint ? `<div id="hint-content" class="hint">${text}</div>` : "";
}

export function hintButton(ctx) {
  return btn(
    "hint",
    ctx.hint ? "Hide hint" : "Give me a hint",
    "secondary",
    `aria-expanded="${ctx.hint}" aria-controls="hint-content"`,
  );
}

export function workbench(board, coach) {
  return `<div class="workbench"><div class="board">${board}</div><aside class="coach" aria-label="Coach">${coach}</aside></div>`;
}

/**
 * Two-row ratio table. `top` and `bottom` are arrays of cell HTML.
 * `active` is a 1-based column index (0 = none); `marked` lists extra
 * 1-based columns to tint (plotted points, known columns).
 */
export function ratioTable({
  top,
  bottom,
  active = 0,
  marked = [],
  caption = "Bags and soccer balls",
  topLabel = "Bags",
  bottomLabel = "Soccer<br>balls",
  cls = "",
}) {
  const cell = (value, i, extra = "") => {
    const classes = [extra];
    if (i + 1 === active) classes.push("active");
    else if (marked.includes(i + 1)) classes.push("marked");
    const list = classes.filter(Boolean).join(" ");
    return `<td${list ? ` class="${list}"` : ""}>${value}</td>`;
  };
  return `<div class="table-scroll"><table class="ratio-table ${cls}"><caption>${caption}</caption><tbody><tr class="top-row"><th scope="row">${topLabel}</th>${top.map((v, i) => cell(v, i)).join("")}</tr><tr class="bottom-row"><th scope="row">${bottomLabel}</th>${bottom.map((v, i) => cell(v, i, "answer-cell")).join("")}</tr></tbody></table></div>`;
}

const BALL_PATH =
  "m16 9 7 5-3 8h-8l-3-8zM16 2v7M3 12l6 2M8 27l4-5m12 5-4-5m9-10-6 2";

export const ball = (stroke = "#294338") =>
  `<svg class="ball-icon" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="white" stroke="${stroke}" stroke-width="1.4"/><path d="${BALL_PATH}" fill="${stroke}" stroke="${stroke}"/></svg>`;

export function bags(n, { label = true } = {}) {
  const bag = (i) =>
    `<div class="mini-bag pulse"><div class="bag-drawing">${ball().repeat(6)}</div>${label ? `<small>Bag ${i + 1}</small>` : ""}</div>`;
  return `<div class="rack" aria-hidden="true">${Array.from({ length: n }, (_, i) => bag(i)).join("")}</div>`;
}

export function choiceList(name, legend, options, selected) {
  const items = options
    .map(
      ([value, label]) =>
        `<label class="option" for="${name}-${value}"><input type="radio" id="${name}-${value}" name="${name}" value="${value}" ${selected === value ? "checked" : ""}><span>${label}</span></label>`,
    )
    .join("");
  return `<fieldset class="choice-list"><legend>${legend}</legend>${items}</fieldset>`;
}

export function pairInputs(prefix, xValue, yValue, xLabel, yLabel) {
  return `<div class="pair-inputs"><span class="paren" aria-hidden="true">(</span><div><label for="${prefix}-x">x · ${xLabel}</label><input class="number-input" id="${prefix}-x" type="number" inputmode="numeric" min="0" autocomplete="off" value="${esc(xValue)}"></div><span class="paren" aria-hidden="true">,</span><div><label for="${prefix}-y">y · ${yLabel}</label><input class="number-input" id="${prefix}-y" type="number" inputmode="numeric" min="0" autocomplete="off" value="${esc(yValue)}"></div><span class="paren" aria-hidden="true">)</span></div>`;
}

export const numeric = (value) => {
  const text = String(value ?? "").trim();
  if (text === "") return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
};
