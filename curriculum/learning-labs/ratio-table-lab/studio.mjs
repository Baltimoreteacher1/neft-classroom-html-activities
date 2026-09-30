// Table Studio (Graph station, "Make your own table" mode).
// Students name the quantities, type or generate a ratio table, plot each
// column themselves, and the graph tells them whether the columns are
// equivalent: one line through the origin, or points that miss it.

import { coordGraph, moveCursor, PLOT_HELP } from "./graph.mjs";
import { intSet, str, strList } from "./sanitize.mjs";
import { btn, esc, numeric } from "./views.mjs";

const MIN_COLS = 2;
const MAX_COLS = 6;
const MAX_VALUE = 999;
const MAX_TICKS = 10;

export const studioFresh = () => ({
  xName: "Batches",
  yName: "Cups of flour",
  cols: [["1", "3"], ["2", "6"], ["4", "12"], ["", ""]],
  a: "",
  b: "",
  plotted: [],
  cursor: { x: 0, y: 0 },
});

export function studioRestore(s) {
  const fresh = studioFresh();
  const cols = Array.isArray(s.cols) ? s.cols.slice(0, MAX_COLS).map((c) => strList(c, 2, 8)) : fresh.cols;
  while (cols.length < MIN_COLS) cols.push(["", ""]);
  const c = s.cursor && typeof s.cursor === "object" ? s.cursor : {};
  return {
    xName: str(s.xName, 16) || fresh.xName,
    yName: str(s.yName, 16) || fresh.yName,
    cols,
    a: str(s.a, 8),
    b: str(s.b, 8),
    plotted: intSet(s.plotted, 0, MAX_COLS - 1),
    cursor: { x: Number.isFinite(c.x) ? c.x : 0, y: Number.isFinite(c.y) ? c.y : 0 },
  };
}

const valid = (v) => v !== null && v >= 0 && v <= MAX_VALUE;
const fmt = (n) => String(Math.round(n * 100) / 100);
const same = (a, b) => Math.abs(a - b) < 1e-9;

/** Columns with two usable numbers, keeping their table position. */
function filled(st) {
  return st.cols
    .map(([x, y], i) => ({ i, x: numeric(x), y: numeric(y) }))
    .filter((c) => valid(c.x) && valid(c.y));
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

// Tick spacing: the values' own common factor when it gives a readable axis
// (so every point lands on a grid line), otherwise a round 1-2-5 step.
function axisFor(values) {
  const max = Math.max(1, ...values);
  const ints = values.filter((v) => v > 0);
  let step = 0;
  if (ints.length && ints.every(Number.isInteger)) {
    const g = ints.reduce(gcd);
    if (Math.ceil(max / g) <= MAX_TICKS) step = g;
  }
  if (!step) {
    for (const base of [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000]) {
      if (Math.ceil(max / base) <= MAX_TICKS) {
        step = base;
        break;
      }
    }
  }
  return { step, max: step * Math.max(2, Math.ceil(max / step)) };
}

function grid(st) {
  const cols = filled(st);
  const x = axisFor(cols.map((c) => c.x));
  const y = axisFor(cols.map((c) => c.y));
  return { xMax: x.max, xStep: x.step, yMax: y.max, yStep: y.step };
}

/** Is the table equivalent? Compares every column with the first x > 0 column. */
export function analyse(st) {
  const cols = filled(st);
  const base = cols.find((c) => c.x > 0);
  if (!base) return { cols, rate: null, off: [] };
  const rate = base.y / base.x;
  const off = cols.filter((c) => !same(c.y, c.x * rate));
  return { cols, rate, base, off };
}

function verdict(st) {
  const { cols, rate, base, off } = analyse(st);
  const unplotted = cols.filter((c) => !st.plotted.includes(c.i));
  if (cols.length < 2) return ["", "Fill both numbers in at least two columns to graph your table."];
  if (unplotted.length) return ["", `Plot your table: ${cols.length - unplotted.length} of ${cols.length} columns plotted. Next, try column ${unplotted[0].i + 1}.`];
  if (rate === null) return ["error", `Every ${esc(st.xName)} value is 0. Give at least one column an x-value greater than 0.`];
  if (!off.length) {
    return ["success", `<strong>Equivalent ratios.</strong> In every column, y ÷ x = ${fmt(rate)}. The points line up on a straight line through the origin (0, 0), so the relationship is proportional. The unit rate point is (1, ${fmt(rate)}).`];
  }
  const list = off.map((c) => `column ${c.i + 1} (${fmt(c.x)}, ${fmt(c.y)})${c.x > 0 ? ` gives y ÷ x = ${fmt(c.y / c.x)}` : " has 0 for x but not for y"}`).join("; ");
  return ["error", `<strong>Not all equivalent.</strong> Column ${base.i + 1} gives y ÷ x = ${fmt(rate)}, but ${list}. Those points miss the line through the origin.`];
}

function graphHtml(st) {
  const g = grid(st);
  const { cols, rate, off } = analyse(st);
  const complete = cols.length >= 2 && cols.every((c) => st.plotted.includes(c.i));
  const points = cols
    .filter((c) => st.plotted.includes(c.i))
    .map((c) => ({ x: c.x, y: c.y, cls: complete && off.includes(c) ? "miss" : "plotted", label: `(${fmt(c.x)}, ${fmt(c.y)})` }));
  const lines = [];
  if (complete && rate !== null) {
    lines.push({ rate, cls: off.length ? "gold" : "" });
    points.push({ x: 0, y: 0, cls: "origin" });
    if (!off.length && g.xMax >= 1 && rate <= g.yMax) points.push({ x: 1, y: rate, cls: "unit" });
  }
  return coordGraph({
    ...g,
    id: "studio-board",
    interactive: !complete,
    cursor: st.cursor,
    points,
    lines,
    xLabel: esc(st.xName),
    yLabel: esc(st.yName),
    label: complete ? `Graph of your table: ${esc(st.xName)} and ${esc(st.yName)}` : `Plotting grid for your table. ${esc(st.xName)} on x, ${esc(st.yName)} on y.`,
  });
}

function cellInput(i, axis, value, name) {
  return `<label class="sr-only" for="studio-${axis}-${i}">${esc(name)}, column ${i + 1}</label><input class="number-input" id="studio-${axis}-${i}" type="number" inputmode="decimal" min="0" max="${MAX_VALUE}" step="any" autocomplete="off" value="${esc(value)}">`;
}

export function studioBoard(st) {
  const row = (axis, name, cls) =>
    `<tr class="${cls}"><th scope="row" id="studio-th-${axis}">${esc(name)}</th>${st.cols.map((c, i) => `<td class="answer-cell">${cellInput(i, axis, c[axis === "x" ? 0 : 1], name)}</td>`).join("")}</tr>`;
  const [kind, text] = verdict(st);
  return `<div class="studio-names"><label>x quantity <input type="text" id="studio-xname" maxlength="16" autocomplete="off" value="${esc(st.xName)}"></label><label>y quantity <input type="text" id="studio-yname" maxlength="16" autocomplete="off" value="${esc(st.yName)}"></label></div>
<div class="table-scroll"><table class="ratio-table studio-table"><caption>Your ratio table · type any numbers</caption><tbody>${row("x", st.xName, "top-row")}${row("y", st.yName, "bottom-row")}</tbody></table></div>
<div class="studio-row">${btn("studio-add", "+ Add column", "secondary", st.cols.length >= MAX_COLS ? "disabled" : "")}${btn("studio-remove", "− Remove column", "secondary", st.cols.length <= MIN_COLS ? "disabled" : "")}${btn("studio-plot-all", "Plot all for me", "secondary")}${btn("studio-clear-plot", "Clear points", "secondary")}</div>
<div class="graph-wrap" id="studio-graph">${graphHtml(st)}</div><p class="points-note" id="studio-board-help">${PLOT_HELP}</p>
<p id="studio-verdict" class="studio-verdict ${kind}" aria-live="polite">${text}</p>`;
}

export function studioCoach() {
  return `<h3>Start from a ratio.</h3><form id="studio-ratio-form" class="ratio-seed" novalidate><label class="sr-only" for="studio-a">First quantity of the ratio</label><input class="number-input" id="studio-a" type="number" inputmode="decimal" min="0" step="any" placeholder="a"><span aria-hidden="true">:</span><label class="sr-only" for="studio-b">Second quantity of the ratio</label><input class="number-input" id="studio-b" type="number" inputmode="decimal" min="0" step="any" placeholder="b"><button class="btn primary" type="submit">Fill my table</button></form><p class="points-note">Fills the table with equivalent ratios: ×1, ×2, ×3, ×4.</p><h3>Try this</h3><ul class="checklist small"><li>Make a table for <strong>2 : 5</strong>, then plot it.</li><li>Change <strong>one</strong> number so the table is not equivalent. What happens to that point?</li><li>Make a line <strong>steeper</strong> than 6 balls per bag.</li><li>Rename the quantities for something in your life.</li></ul>${btn("graph-mode-guided", "Back to the guided graph", "secondary")}`;
}

/** Live update after a table edit, without rebuilding the inputs being typed in. */
function repaint(st) {
  const graphEl = document.getElementById("studio-graph");
  if (graphEl) graphEl.innerHTML = graphHtml(st);
  const v = document.getElementById("studio-verdict");
  if (v) {
    const [kind, text] = verdict(st);
    v.className = `studio-verdict ${kind}`;
    v.innerHTML = text;
  }
  st.cols.forEach(([x, y], i) => {
    for (const [axis, raw] of [["x", x], ["y", y]]) {
      const el = document.getElementById(`studio-${axis}-${i}`);
      const n = numeric(raw);
      if (el) el.setAttribute("aria-invalid", String(raw.trim() !== "" && !valid(n)));
    }
  });
}

export function studioInput(el, st) {
  const m = /^studio-([xy])-(\d)$/.exec(el.id);
  if (m) {
    const i = Number(m[2]);
    st.cols[i][m[1] === "x" ? 0 : 1] = el.value.slice(0, 8);
    st.plotted = st.plotted.filter((p) => p !== i);
    repaint(st);
    return true;
  }
  if (el.id === "studio-xname" || el.id === "studio-yname") {
    const axis = el.id === "studio-xname" ? "x" : "y";
    st[`${axis}Name`] = el.value.slice(0, 16);
    const th = document.getElementById(`studio-th-${axis}`);
    if (th) th.textContent = el.value || (axis === "x" ? "x" : "y");
    repaint(st);
    return true;
  }
  if (el.id === "studio-a" || el.id === "studio-b") {
    st[el.id.slice(-1)] = el.value.slice(0, 8);
    return true;
  }
  return false;
}

export function studioAction(name, st) {
  if (name === "studio-add" && st.cols.length < MAX_COLS) st.cols.push(["", ""]);
  else if (name === "studio-remove" && st.cols.length > MIN_COLS) {
    st.cols.pop();
    st.plotted = st.plotted.filter((i) => i < st.cols.length);
  } else if (name === "studio-plot-all") st.plotted = filled(st).map((c) => c.i);
  else if (name === "studio-clear-plot") st.plotted = [];
  else return null;
  return { focus: `act-${name}`, message: name === "studio-plot-all" ? "All columns plotted. Read the result under the graph." : "" };
}

/** Fill from a : b. Returns an error string, or "" on success. */
export function studioFill(st) {
  const a = numeric(st.a);
  const b = numeric(st.b);
  if (!valid(a) || !valid(b) || a === 0) return "Type a ratio a : b with a greater than 0, like 2 : 5.";
  const n = Math.max(4, Math.min(st.cols.length, MAX_COLS));
  if (a * n > MAX_VALUE || b * n > MAX_VALUE) return `Use smaller numbers (up to ${Math.floor(MAX_VALUE / n)}).`;
  st.cols = Array.from({ length: n }, (_, k) => [fmt(a * (k + 1)), fmt(b * (k + 1))]);
  st.plotted = [];
  st.cursor = { x: 0, y: 0 };
  return "";
}

/** Plot at a lattice point. Returns [message, kind]. */
export function studioPlot(st, x, y) {
  st.cursor = { x, y };
  const g = grid(st);
  const cols = filled(st).filter((c) => !st.plotted.includes(c.i));
  const hit =
    cols.find((c) => same(c.x, x) && same(c.y, y)) ??
    cols.find((c) => Math.abs(c.x - x) <= g.xStep / 2 && Math.abs(c.y - y) <= g.yStep / 2);
  if (!hit) {
    const plottedHere = filled(st).find((c) => st.plotted.includes(c.i) && same(c.x, x) && same(c.y, y));
    if (plottedHere) return [`(${fmt(x)}, ${fmt(y)}) is already plotted.`, ""];
    return [`(${fmt(x)}, ${fmt(y)}) is not a column in your table. Pick a column: go right to its x-value, then up to its y-value.`, "error"];
  }
  st.plotted.push(hit.i);
  const left = cols.length - 1;
  return [`Plotted column ${hit.i + 1}: (${fmt(hit.x)}, ${fmt(hit.y)}).${left ? ` ${left} to go.` : " Every column is plotted — read the result under the graph."}`, "success"];
}

export function studioKey(e, st) {
  return moveCursor(st.cursor, e.key, grid(st));
}

