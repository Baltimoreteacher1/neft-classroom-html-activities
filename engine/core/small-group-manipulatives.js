// Small-group manipulatives — the models a student MOVES, not just looks at.
//
// Every practice figure that has a matching tool gets a "Try it with a model"
// disclosure. Tools open on a NEUTRAL board (they never start on the problem's own
// numbers) and read out only structure the student built, so a manipulative is a
// thinking surface and never a giveaway. Assessment cards (Prove It) get none.
//
// Every tool works three ways — pointer, keyboard and plain buttons — so nothing
// depends on drag-and-drop. Motion respects prefers-reduced-motion (CSS below).
// Tools are built lazily on first open: a studio holds ~10 figure cards.

import { coordinatePlane, factorTreeBuilder } from "./small-group-manipulatives-plane.js";
import { el, esc } from "./small-group-ui.js";

export const SVG_NS = "http://www.w3.org/2000/svg";
export const svgEl = (tag, attrs = {}, parent = null) => {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  parent?.appendChild(node);
  return node;
};

export const fmt = (n) => String(Math.round(n * 1e4) / 1e4);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const isInt = (v) => Number.isInteger(Number(v)) && String(v).trim() !== "";

/** A labelled "−  value  +" stepper. Returns {node, get, set}. */
export function stepper(label, { min, max, value, onChange }) {
  const node = el("div", "sgm-step");
  const lab = el("span", "sgm-step-lab", esc(label));
  const minus = /** @type {HTMLButtonElement} */ (el("button", "sgm-btn", "−"));
  const plus = /** @type {HTMLButtonElement} */ (el("button", "sgm-btn", "+"));
  const out = el("output", "sgm-step-val", String(value));
  minus.type = plus.type = "button";
  minus.setAttribute("aria-label", `Fewer ${label}`);
  plus.setAttribute("aria-label", `More ${label}`);
  let v = value;
  const set = (next, silent) => {
    v = clamp(next, min, max);
    out.textContent = String(v);
    minus.disabled = v <= min;
    plus.disabled = v >= max;
    if (!silent) onChange?.(v);
  };
  minus.addEventListener("click", () => set(v - 1));
  plus.addEventListener("click", () => set(v + 1));
  node.append(lab, minus, out, plus);
  set(value, true);
  return { node, get: () => v, set };
}

const readoutEl = () => {
  const p = el("p", "sgm-read");
  p.setAttribute("aria-live", "polite");
  return p;
};

/** Pointer + keyboard slider on an SVG number line. */
function numberLineTool(fig) {
  const min = Number(fig.min ?? 0);
  const max = Number(fig.max ?? 10);
  const step = Number(fig.step || 1);
  if (!(max > min) || (max - min) / step > 400) return null;
  const W = 640;
  const pad = 30;
  const X = (v) => pad + ((v - min) / (max - min)) * (W - 2 * pad);
  const root = el("div", "sgm-tool");
  const box = svgEl("svg", { viewBox: `0 0 ${W} 96`, class: "sgm-svg", role: "group" });
  box.setAttribute("aria-label", `Number line from ${fmt(min)} to ${fmt(max)}`);
  svgEl("line", { x1: pad, x2: W - pad, y1: 54, y2: 54, class: "sgm-axis" }, box);
  const every = Number(fig.labelEvery || Math.max(step, (max - min) / 10));
  for (let v = min; v <= max + 1e-9; v += step) {
    const major = Math.abs(v / every - Math.round(v / every)) < 1e-6;
    svgEl(
      "line",
      { x1: X(v), x2: X(v), y1: major ? 46 : 50, y2: major ? 62 : 58, class: "sgm-tick" },
      box,
    );
    if (major)
      svgEl(
        "text",
        { x: X(v), y: 82, class: "sgm-num", "text-anchor": "middle" },
        box,
      ).textContent = fmt(v);
  }
  let value = min;
  const knob = svgEl("g", { class: "sgm-knob", tabindex: 0, role: "slider" }, box);
  svgEl("circle", { r: 12, cy: 54 }, knob);
  knob.setAttribute("aria-valuemin", fmt(min));
  knob.setAttribute("aria-valuemax", fmt(max));
  knob.setAttribute("aria-label", "Marker. Use the arrow keys or the buttons.");
  const read = readoutEl();
  const set = (v) => {
    value = clamp(Math.round((v - min) / step) * step + min, min, max);
    knob.setAttribute("transform", `translate(${X(value)} 0)`);
    knob.setAttribute("aria-valuenow", fmt(value));
    read.textContent = `Marker at ${fmt(value)} — ${fmt(value - min)} from ${fmt(min)}, ${fmt(max - value)} from ${fmt(max)}.`;
  };
  const fromEvent = (e) => {
    const r = box.getBoundingClientRect();
    return min + ((((e.clientX - r.left) / r.width) * W - pad) / (W - 2 * pad)) * (max - min);
  };
  let down = false;
  box.addEventListener("pointerdown", (e) => {
    down = true;
    box.setPointerCapture?.(e.pointerId);
    set(fromEvent(e));
  });
  box.addEventListener("pointermove", (e) => down && set(fromEvent(e)));
  box.addEventListener("pointerup", () => (down = false));
  knob.addEventListener("keydown", (e) => {
    const k = {
      ArrowRight: step,
      ArrowUp: step,
      ArrowLeft: -step,
      ArrowDown: -step,
      PageUp: step * 10,
      PageDown: -step * 10,
    }[e.key];
    if (k !== undefined) set(value + k);
    else if (e.key === "Home") set(min);
    else if (e.key === "End") set(max);
    else return;
    e.preventDefault();
  });
  const btns = el("div", "sgm-row");
  for (const [text, d] of [
    ["◀ Back one step", -1],
    ["Forward one step ▶", 1],
  ]) {
    const b = /** @type {HTMLButtonElement} */ (el("button", "btn ghost sgm-btn-wide", text));
    b.type = "button";
    b.addEventListener("click", () => set(value + d * step));
    btns.appendChild(b);
  }
  set(min);
  root.append(box, btns, read);
  return root;
}

/** Equal parts, click to shade: tape diagrams and fraction bars. */
function partsBarTool(fig) {
  const first = fig.bars?.[0] || fig.rows?.[0] || {};
  const start = clamp(Number(first.parts) || 4, 2, 12);
  const root = el("div", "sgm-tool");
  const bar = el("div", "sgm-bar");
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", "Bar. Press a part to shade it.");
  const read = readoutEl();
  let n = start;
  let shaded = new Set();
  const draw = () => {
    bar.replaceChildren();
    shaded = new Set([...shaded].filter((i) => i < n));
    for (let i = 0; i < n; i++) {
      const b = /** @type {HTMLButtonElement} */ (el("button", "sgm-part", ""));
      b.type = "button";
      b.setAttribute("aria-pressed", String(shaded.has(i)));
      b.setAttribute("aria-label", `Part ${i + 1} of ${n}`);
      b.addEventListener("click", () => {
        if (shaded.has(i)) shaded.delete(i);
        else shaded.add(i);
        draw();
      });
      bar.appendChild(b);
    }
    const k = shaded.size;
    read.textContent = `${k} of ${n} equal parts shaded = ${k}/${n} = ${fmt(k / n)} = ${fmt((k / n) * 100)}%.`;
  };
  // Re-render in place so the focused part keeps focus order.
  const parts = stepper("equal parts", {
    min: 2,
    max: 24,
    value: n,
    onChange: (v) => ((n = v), draw()),
  });
  const clear = /** @type {HTMLButtonElement} */ (
    el("button", "btn ghost sgm-btn-wide", "Clear shading")
  );
  clear.type = "button";
  clear.addEventListener("click", () => ((shaded = new Set()), draw()));
  const row = el("div", "sgm-row");
  row.append(parts.node, clear);
  draw();
  for (const b of bar.children) b.setAttribute("tabindex", "0");
  root.append(row, bar, read);
  return root;
}

/** 10 × 10 percent grid with drag-paint and arrow-key navigation. */
function hundredGridTool() {
  const root = el("div", "sgm-tool");
  const grid = el("div", "sgm-hundred");
  grid.setAttribute("role", "grid");
  grid.setAttribute("aria-label", "Ten by ten grid. Space shades a square.");
  const read = readoutEl();
  const cells = [];
  let paint = null;
  const update = () => {
    const k = cells.filter((c) => c.getAttribute("aria-pressed") === "true").length;
    read.textContent = `${k} out of 100 squares = ${k}/100 = ${fmt(k / 100)} = ${k}%.`;
  };
  const set = (c, on) => {
    c.setAttribute("aria-pressed", String(on));
    update();
  };
  for (let i = 0; i < 100; i++) {
    const c = /** @type {HTMLButtonElement} */ (el("button", "sgm-cell", ""));
    c.type = "button";
    c.tabIndex = i === 0 ? 0 : -1;
    c.setAttribute("aria-pressed", "false");
    c.setAttribute("aria-label", `Row ${Math.floor(i / 10) + 1}, column ${(i % 10) + 1}`);
    c.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      paint = c.getAttribute("aria-pressed") !== "true";
      set(c, paint);
    });
    c.addEventListener("pointerenter", () => paint !== null && set(c, paint));
    c.addEventListener("click", (e) => {
      // Keyboard activation only: pointer clicks were handled on pointerdown.
      if (e.detail === 0) set(c, c.getAttribute("aria-pressed") !== "true");
    });
    c.addEventListener("keydown", (e) => {
      const d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 10, ArrowUp: -10 }[e.key];
      if (d === undefined) return;
      e.preventDefault();
      const next = cells[clamp(i + d, 0, 99)];
      for (const x of cells) x.tabIndex = -1;
      next.tabIndex = 0;
      next.focus();
    });
    cells.push(c);
    grid.appendChild(c);
  }
  document.addEventListener("pointerup", () => (paint = null));
  const clear = /** @type {HTMLButtonElement} */ (
    el("button", "btn ghost sgm-btn-wide", "Clear the grid")
  );
  clear.type = "button";
  clear.addEventListener("click", () => {
    for (const c of cells) c.setAttribute("aria-pressed", "false");
    update();
  });
  update();
  root.append(grid, clear, read);
  return root;
}

/** Build your own dot plot; the statistics read out are of YOUR data. */
function dotPlotTool(fig) {
  const lo = Math.floor(Number(fig.min ?? 0));
  const hi = Math.ceil(Number(fig.max ?? 10));
  if (!(hi > lo) || hi - lo > 40) return null;
  const root = el("div", "sgm-tool");
  const plot = el("div", "sgm-dots");
  plot.setAttribute("role", "group");
  plot.setAttribute("aria-label", "Dot plot. Press a number to add a dot above it.");
  const read = readoutEl();
  const counts = new Map();
  const history = [];
  const draw = () => {
    for (const col of plot.children) {
      const v = Number(col.dataset.v);
      const n = counts.get(v) || 0;
      col
        .querySelector(".sgm-stack")
        .replaceChildren(...Array.from({ length: n }, () => el("span", "sgm-dot", "")));
      col.querySelector("button").setAttribute("aria-label", `Add a dot at ${v}. ${n} so far.`);
    }
    const data = [...counts.entries()].flatMap(([v, n]) => Array(n).fill(v)).sort((a, b) => a - b);
    if (!data.length) return (read.textContent = "Press a number to add a dot.");
    const peak = Math.max(...counts.values());
    const modes = [...counts].filter(([, n]) => n === peak).map(([v]) => v);
    const mid = data.length >> 1;
    const median = data.length % 2 ? data[mid] : (data[mid - 1] + data[mid]) / 2;
    read.textContent = `${data.length} dots · from ${data[0]} to ${data.at(-1)} · median ${fmt(median)} · most dots at ${modes.join(", ")}.`;
  };
  for (let v = lo; v <= hi; v++) {
    const col = el("div", "sgm-dotcol", "");
    col.dataset.v = String(v);
    col.append(el("div", "sgm-stack", ""));
    const b = /** @type {HTMLButtonElement} */ (el("button", "sgm-tickbtn", String(v)));
    b.type = "button";
    b.addEventListener("click", () => {
      counts.set(v, (counts.get(v) || 0) + 1);
      history.push(v);
      draw();
    });
    col.append(b);
    plot.appendChild(col);
  }
  const undo = /** @type {HTMLButtonElement} */ (
    el("button", "btn ghost sgm-btn-wide", "Undo last dot")
  );
  undo.type = "button";
  undo.addEventListener("click", () => {
    const v = history.pop();
    if (v !== undefined) counts.set(v, counts.get(v) - 1);
    draw();
  });
  draw();
  root.append(plot, undo, read);
  return root;
}

/** Equation balance: add or remove from either pan, or do the same to both. */
function balanceTool() {
  const root = el("div", "sgm-tool");
  let L = 0;
  let R = 0;
  const beam = el("div", "sgm-beam", "");
  const left = el("div", "sgm-pan", "");
  const right = el("div", "sgm-pan", "");
  beam.append(left, right);
  const read = readoutEl();
  const draw = () => {
    beam.style.setProperty("--tilt", `${clamp((L - R) * -3, -14, 14)}deg`);
    for (const [pan, n] of [
      [left, L],
      [right, R],
    ])
      pan.replaceChildren(...Array.from({ length: n }, () => el("span", "sgm-tile", "1")));
    read.textContent =
      `Left ${L}, right ${R} — ` +
      (L === R
        ? "balanced: both sides are equal."
        : L > R
          ? "the left side is heavier."
          : "the right side is heavier.");
  };
  const act = (text, fn, label) => {
    const b = /** @type {HTMLButtonElement} */ (el("button", "btn ghost sgm-btn-wide", text));
    b.type = "button";
    b.setAttribute("aria-label", label || text);
    b.addEventListener("click", () => {
      fn();
      L = clamp(L, 0, 20);
      R = clamp(R, 0, 20);
      draw();
    });
    return b;
  };
  const controls = el("div", "sgm-row");
  controls.append(
    act("+1 left", () => L++, "Add 1 to the left side"),
    act("−1 left", () => L--, "Take 1 from the left side"),
    act("+1 right", () => R++, "Add 1 to the right side"),
    act("−1 right", () => R--, "Take 1 from the right side"),
  );
  const both = el("div", "sgm-row");
  both.append(
    act("Add 1 to both", () => (L++, R++)),
    act("Take 1 from both", () => ((L = Math.max(L, 1) - 1), (R = Math.max(R, 1) - 1))),
    act("Reset", () => ((L = 0), (R = 0))),
  );
  draw();
  root.append(beam, controls, both, read);
  return root;
}

/** Rectangle of unit squares (area models) or layers of a rectangular prism. */
function boxTool(fig) {
  const prism = fig.kind === "prism";
  if (prism && ![fig.l, fig.w, fig.h].every(isInt)) return null;
  if (!prism && ![...(fig.rows || []), ...(fig.cols || [])].every(isInt)) return null;
  const root = el("div", "sgm-tool");
  const stage = svgEl("svg", { viewBox: "0 0 360 220", class: "sgm-svg", role: "img" });
  const read = readoutEl();
  let l = 2;
  let w = 2;
  let h = 1;
  const draw = () => {
    stage.replaceChildren();
    const s = Math.min(20, 180 / Math.max(l, w + (prism ? h : 0)));
    const lift = prism ? 6 : 0;
    for (let layer = prism ? h - 1 : 0; layer >= 0; layer--)
      for (let r = 0; r < w; r++)
        for (let c = 0; c < l; c++)
          svgEl(
            "rect",
            {
              x: 20 + c * s + layer * lift,
              y: 200 - (r + 1) * s - layer * lift - (prism ? 0 : 0),
              width: s - 1,
              height: s - 1,
              class: layer === (prism ? h - 1 : 0) ? "sgm-top" : "sgm-under",
            },
            stage,
          );
    stage.setAttribute("aria-label", prism ? `Box ${l} by ${w} by ${h}` : `Rectangle ${l} by ${w}`);
    read.textContent = prism
      ? `${l} × ${w} = ${l * w} cubes in one layer · ${h} layer${h > 1 ? "s" : ""} → ${l * w * h} cubes in all.`
      : `${w} row${w > 1 ? "s" : ""} of ${l} = ${l * w} square units.`;
  };
  const row = el("div", "sgm-row");
  const steppers = [
    stepper(prism ? "length" : "columns", {
      min: 1,
      max: 12,
      value: l,
      onChange: (v) => ((l = v), draw()),
    }),
    stepper(prism ? "width" : "rows", {
      min: 1,
      max: 12,
      value: w,
      onChange: (v) => ((w = v), draw()),
    }),
  ];
  if (prism)
    steppers.push(
      stepper("layers", { min: 1, max: 12, value: h, onChange: (v) => ((h = v), draw()) }),
    );
  for (const s of steppers) row.appendChild(s.node);
  draw();
  root.append(row, stage, read);
  return root;
}

/** Equivalent ratios as batches on a double number line. Needs two numeric quantities. */
function doubleLineTool(fig) {
  const cells = (fig.rows?.[0] || []).slice(0, 2).map(Number);
  const heads = fig.headers || [];
  if (
    cells.length < 2 ||
    cells.some((n) => !(n > 0)) ||
    fig.rows[0].slice(0, 2).some((c) => !isInt(c) && !/^\d+(\.\d+)?$/.test(String(c)))
  )
    return null;
  const [a, b] = cells;
  const root = el("div", "sgm-tool");
  const stage = svgEl("svg", { viewBox: "0 0 640 150", class: "sgm-svg", role: "img" });
  const read = readoutEl();
  let k = 1;
  const draw = () => {
    stage.replaceChildren();
    const X = (i) => 70 + (i / 8) * 520;
    for (const [y, name, unit] of [
      [48, heads[0] || "Quantity A", a],
      [112, heads[1] || "Quantity B", b],
    ]) {
      svgEl("line", { x1: 60, x2: 600, y1: y, y2: y, class: "sgm-axis" }, stage);
      svgEl("text", { x: 60, y: y - 22, class: "sgm-num" }, stage).textContent = name;
      for (let i = 0; i <= k; i++) {
        svgEl("line", { x1: X(i), x2: X(i), y1: y - 9, y2: y + 9, class: "sgm-tick" }, stage);
        svgEl(
          "text",
          { x: X(i), y: y + 28, class: "sgm-num", "text-anchor": "middle" },
          stage,
        ).textContent = fmt(i * unit);
      }
    }
    for (let i = 1; i <= k; i++)
      svgEl("line", { x1: X(i), x2: X(i), y1: 48, y2: 112, class: "sgm-link" }, stage);
    stage.setAttribute("aria-label", `Double number line with ${k} equal batches`);
    read.textContent = `${k} batch${k > 1 ? "es" : ""}: ${fmt(k * a)} for ${fmt(k * b)}. Every batch adds the same amount to both lines.`;
  };
  const row = el("div", "sgm-row");
  const batches = stepper("batches", {
    min: 1,
    max: 8,
    value: k,
    onChange: (v) => ((k = v), draw()),
  });
  row.appendChild(batches.node);
  draw();
  root.append(row, stage, read);
  return root;
}

const TOOLS = {
  numberLine: ["Number line", numberLineTool],
  tape: ["Tape diagram", partsBarTool],
  fractionBars: ["Fraction bar", partsBarTool],
  hundredGrid: ["Percent grid", hundredGridTool],
  dotPlot: ["Dot plot", dotPlotTool],
  balance: ["Equation balance", balanceTool],
  areaModel: ["Area builder", boxTool],
  prism: ["Box builder", boxTool],
  ratioTable: ["Double number line", doubleLineTool],
  coordGrid: ["Coordinate plane", coordinatePlane],
  factorTree: ["Factor tree builder", factorTreeBuilder],
};

/** Kinds that have a manipulative — used by the Build stage and the verification ledger. */
export const MANIPULATIVE_KINDS = Object.keys(TOOLS);

/**
 * A "Try it with a model" disclosure for a figure, or null when the figure has no tool.
 * @param {{kind?: string}} fig
 * @param {{key?: string, store?: any, open?: boolean}} [opts]
 */
export function manipulativeFor(fig, { key, store, open = false } = {}) {
  const entry = TOOLS[fig?.kind];
  if (!entry) return null;
  const [name, make] = entry;
  // Build once, up front: a figure whose data a tool cannot use (a ratio table with a "?" in
  // its first column, a non-integer box) gets no toggle at all rather than a button that
  // opens onto nothing.
  let tool = null;
  try {
    tool = make(fig);
  } catch {
    tool = null;
  }
  if (!tool) return null;
  const wrap = el("div", "sgm");
  const toggle = /** @type {HTMLButtonElement} */ (
    el("button", "btn ghost sgm-toggle", `🧩 Try it with a model: ${name}`)
  );
  toggle.type = "button";
  toggle.setAttribute("aria-expanded", "false");
  const body = el("div", "sgm-body");
  body.hidden = true;
  body.appendChild(tool);
  const show = (on) => {
    body.hidden = !on;
    toggle.setAttribute("aria-expanded", String(on));
    if (key) store?.set(key, on);
  };
  toggle.addEventListener("click", () => show(body.hidden));
  wrap.append(toggle, body);
  if (open || (key && store?.get(key))) queueMicrotask(() => show(true));
  return wrap;
}

/**
 * The "Move the model" block of Build Understanding: the first figure in the lesson's
 * own Build and Practice data that has a tool, opened for the student to build with.
 * Reads figures the lesson already draws, so the model always matches the mathematics.
 */
export function createBuildModel(config, { store } = {}) {
  let found = null;
  const walk = (o) => {
    if (found || !o || typeof o !== "object") return;
    if (typeof o.kind === "string" && TOOLS[o.kind] && o.kind !== "ratioTable") {
      found = o;
      return;
    }
    for (const v of Object.values(o)) walk(v);
  };
  walk(config.launch?.build);
  walk(config.launch?.practice?.together);
  if (!found) {
    const first =
      config.launch?.build?.examples?.[0]?.figure || config.launch?.practice?.together?.[0]?.figure;
    if (first?.kind === "ratioTable") found = first;
  }
  const tool = found && manipulativeFor(found, { key: "bm", store, open: true });
  if (!tool) return null;
  const sec = el("section", "sg-sec sgm-build");
  sec.id = "sg-build-model";
  sec.innerHTML =
    '<h3 class="sgb-title">Move the model</h3><p class="sgp-intro">Build it yourself, then use it to explain the idea to your group.</p>';
  sec.appendChild(tool);
  return sec;
}

export const MANIPULATIVE_CSS = `
.sgm{margin:6px 0 14px}
.sgm-toggle{min-height:44px}
.sgm-body{margin-top:10px;padding:14px;border:2px solid var(--sg-line);border-radius:var(--sg-radius-sm);background:linear-gradient(180deg,#fff,var(--sg-soft))}
.sgm-body[hidden]{display:none!important}
.sgm-row{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin:8px 0}
.sgm-svg{display:block;width:100%;max-width:640px;height:auto;touch-action:none}
.sgm-axis{stroke:var(--sg-deep,#0b2540);stroke-width:3;stroke-linecap:round}
.sgm-tick{stroke:var(--sg-deep,#0b2540);stroke-width:2}
.sgm-link{stroke:var(--sg,#1fa6a2);stroke-width:2;stroke-dasharray:4 4}
.sgm-num{font:600 13px var(--sg-body,system-ui);fill:var(--sg-ink,#14213d)}
.sgm-knob{cursor:grab;outline:none}
.sgm-knob circle{fill:var(--sg-accent,#e5a63f);stroke:var(--sg-deep,#0b2540);stroke-width:3}
.sgm-knob:focus-visible circle{stroke-width:5;stroke:#1f5fd6}
.sgm-read{margin:8px 0 0;font-weight:700;color:var(--sg-deep,#0b2540);min-height:1.5em}
.sgm-step{display:inline-flex;align-items:center;gap:6px}
.sgm-step-lab{font-weight:700;margin-right:2px}
.sgm-step-val{min-width:2ch;text-align:center;font-weight:800;font-size:18px}
.sgm-btn{min-width:44px;min-height:44px;border:2px solid var(--sg-line);border-radius:10px;background:#fff;color:var(--sg-ink);font-size:20px;font-weight:800;cursor:pointer}
.sgm-btn:disabled{opacity:.45;cursor:default}
.sgm-btn-wide{min-height:44px}
.sgm-bar{display:flex;gap:3px;margin:8px 0}
.sgm-part{flex:1 1 0;min-width:0;padding:0;height:54px;border:2px solid var(--sg-deep,#0b2540);border-radius:6px;background:#fff;cursor:pointer}
.sgm-part[aria-pressed="true"]{background:var(--sg,#1fa6a2)}
.sgm-part:focus-visible,.sgm-cell:focus-visible,.sgm-tickbtn:focus-visible,.sgm-btn:focus-visible{outline:3px solid #1f5fd6;outline-offset:2px}
.sgm-hundred{display:grid;grid-template-columns:repeat(10,1fr);gap:2px;max-width:340px;touch-action:none}
.sgm-cell{aspect-ratio:1;min-height:0;padding:0;border:1px solid var(--sg-line);background:#fff;cursor:pointer}
.sgm-cell[aria-pressed="true"]{background:var(--sg,#1fa6a2);border-color:var(--sg-deep,#0b2540)}
.sgm-dots{display:flex;align-items:flex-end;gap:2px;overflow-x:auto;padding-bottom:4px}
.sgm-dotcol{display:flex;flex-direction:column;align-items:center;min-width:34px}
.sgm-stack{display:flex;flex-direction:column-reverse;gap:2px;min-height:6px;margin-bottom:4px}
.sgm-dot{width:18px;height:18px;border-radius:50%;background:var(--sg-accent,#e5a63f);border:2px solid var(--sg-deep,#0b2540)}
.sgm-tickbtn{min-width:34px;min-height:44px;border:0;border-top:3px solid var(--sg-deep,#0b2540);background:transparent;font-weight:700;cursor:pointer;color:var(--sg-ink)}
.sgm-beam{position:relative;display:flex;justify-content:space-between;gap:12px;padding:12px;margin:8px auto;max-width:520px;border-bottom:8px solid var(--sg-deep,#0b2540);transform:rotate(var(--tilt,0deg));transition:transform .35s ease}
.sgm-pan{display:flex;flex-wrap:wrap;gap:3px;align-content:flex-end;width:46%;min-height:76px;padding:6px;border-radius:0 0 14px 14px;background:var(--sg-soft);border:2px solid var(--sg-line)}
.sgm-tile{display:grid;place-items:center;width:24px;height:24px;border-radius:5px;background:var(--sg,#1fa6a2);color:#fff;font-weight:800;font-size:13px}
.sgm-top{fill:var(--sg,#1fa6a2);stroke:#fff}
.sgm-under{fill:var(--sg-deep,#0b2540);opacity:.5;stroke:#fff}
.sgm-plane-wrap{display:grid;gap:8px}
.sgm-grid-line{stroke:var(--sg-line);stroke-width:1}
.sgm-axis-line{stroke:var(--sg-deep,#0b2540);stroke-width:2.5}
.sgm-pt{fill:var(--sg-accent,#e5a63f);stroke:var(--sg-deep,#0b2540);stroke-width:2.5}
.sgm-cursor{fill:none;stroke:#1f5fd6;stroke-width:2.5}
.sgm-field{width:5.5ch;min-height:44px;font-size:18px;text-align:center}
.sgm-tree{display:flex;flex-direction:column;align-items:center;gap:8px;overflow-x:auto;padding:6px 0}
.sgm-kids{display:flex;gap:18px;align-items:flex-start;justify-content:center}
.sgm-node{display:flex;flex-direction:column;align-items:center;gap:6px}
.sgm-nodebtn{min-width:52px;min-height:52px;border-radius:50%;border:3px solid var(--sg-deep,#0b2540);background:#fff;font-weight:800;font-size:18px;color:var(--sg-ink);cursor:pointer}
.sgm-nodebtn.is-prime{background:var(--sg,#1fa6a2);color:#fff;cursor:default}
.sgm-nodebtn[aria-expanded="true"]{box-shadow:0 0 0 4px #1f5fd633}
.sgm-split{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
@media (prefers-reduced-motion:reduce){.sgm-beam{transition:none}}
@media print{.sgm{display:none!important}}
`;
