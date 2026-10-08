// Worked steps — the solution to Part 2's Apply problem, shown as a row of
// steps the class walks through together.
//
// WHY. Today's Problem used to hand each student three empty boxes ("What I
// know & need", "My work", "My answer & check") and an "I'm stuck" bar. Joel,
// 2026-10-08: "this part is not helpful. I would rather just have the
// steps/procedures for solving listed horizontally and already accessible for
// them. It would just show the step (visually and mathematically) and we would
// go through it together." So every step is on screen from the start, left to
// right, each with its picture and its math.
//
// WHERE THE STEPS COME FROM. They are AUTHORED, one entry per core lesson, in
// data/part-two-worked-steps.json, and carried onto each Part 2 config as
// `workedSteps` by scripts/generate-part-two.mjs. They restate the lesson's own
// sampleAnswer step by step. tools/part-two-warmup.test.mjs renders them on a
// booted page and holds every Part 2 config to validateWorkedSteps().
//
// This module is pure string-building with no imports, so the generator can
// run validateWorkedSteps() at build time and the test can render in Node.

/* ── Schema ──────────────────────────────────────────────────────────────── */

/** Every picture a step may carry. Each one is drawn by VISUALS below. */
export const WORKED_VISUAL_KINDS = Object.freeze([
  "chips",
  "tape",
  "table",
  "number-line",
  "rect",
  "groups",
  "bars",
  "coords",
]);

const isText = (v) => typeof v === "string" && v.trim() !== "";
const isNum = (v) => typeof v === "number" && Number.isFinite(v);

const VISUAL_RULES = {
  chips: (v) =>
    Array.isArray(v.items) && v.items.length && v.items.every(isText) ? "" : "items[]",
  tape: (v) =>
    Array.isArray(v.rows) &&
    v.rows.length &&
    v.rows.every(
      (r) =>
        Array.isArray(r.parts) &&
        r.parts.length &&
        r.parts.every(
          (p) => isText(p.text) && (p.size === undefined || (isNum(p.size) && p.size > 0)),
        ),
    )
      ? ""
      : "rows[].parts[] each with text (and optional positive size)",
  table: (v) =>
    Array.isArray(v.headers) &&
    v.headers.length &&
    Array.isArray(v.rows) &&
    v.rows.length &&
    v.rows.every((r) => Array.isArray(r) && r.length === v.headers.length)
      ? ""
      : "headers[] and rows[][] of the same width",
  "number-line": (v) =>
    isNum(v.min) &&
    isNum(v.max) &&
    v.max > v.min &&
    isNum(v.step) &&
    v.step > 0 &&
    (v.max - v.min) / v.step <= 40 &&
    (v.points || []).every((p) => isNum(p.value) && p.value >= v.min && p.value <= v.max) &&
    (v.jumps || []).every((j) => isNum(j.from) && isNum(j.to))
      ? ""
      : "min < max, step > 0 (≤ 40 ticks), points[].value and jumps[].from/to inside the range",
  rect: (v) => (isText(v.width) && isText(v.height) ? "" : "width and height labels"),
  groups: (v) =>
    Number.isInteger(v.groups) &&
    v.groups > 0 &&
    v.groups <= 12 &&
    Number.isInteger(v.each) &&
    v.each > 0 &&
    v.each <= 24
      ? ""
      : "integer groups (1–12) and each (1–24)",
  bars: (v) =>
    Array.isArray(v.items) &&
    v.items.length &&
    v.items.every((b) => isText(b.label) && isNum(b.value) && b.value >= 0)
      ? ""
      : "items[] each with label and value ≥ 0",
  coords: (v) =>
    Array.isArray(v.points) &&
    v.points.length &&
    v.points.every((p) => isNum(p.x) && isNum(p.y)) &&
    v.points.every((p) => Math.abs(p.x) <= 20 && Math.abs(p.y) <= 20)
      ? ""
      : "points[] with x and y between -20 and 20",
};

/**
 * Every problem with the spec, as readable strings. Empty means valid.
 * Required: steps[] (2–6), each with title + math; picture optional but, when
 * present, must be a known kind that passes its rule. At least one step must
 * carry a picture — "visually and mathematically".
 */
export function validateWorkedSteps(spec) {
  const errs = [];
  if (!spec || typeof spec !== "object") return ["not an object"];
  const steps = spec.steps;
  if (!Array.isArray(steps) || steps.length < 2 || steps.length > 6) {
    return ["steps must be an array of 2–6 steps"];
  }
  steps.forEach((s, i) => {
    const at = `step ${i + 1}`;
    if (!isText(s?.title)) errs.push(`${at}: no title`);
    if (!isText(s?.math)) errs.push(`${at}: no math`);
    if (s?.picture !== undefined) {
      const rule = VISUAL_RULES[s.picture?.kind];
      if (!rule) errs.push(`${at}: unknown picture kind "${s.picture?.kind}"`);
      else {
        const why = rule(s.picture);
        if (why) errs.push(`${at}: ${s.picture.kind} needs ${why}`);
      }
    }
  });
  if (!steps.some((s) => s && s.picture)) errs.push("no step carries a picture");
  if (!isText(spec.answer)) errs.push("no answer");
  return errs;
}

/* ── Rendering ───────────────────────────────────────────────────────────── */

function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

const TONES = new Set(["known", "unknown", "focus"]);
const tone = (t) => (TONES.has(t) ? ` is-${t}` : "");

function chips(v) {
  return `<div class="ws-chips">${v.items
    .map((t, i) => `<span class="ws-chip${i === v.focus ? " is-focus" : ""}">${esc(t)}</span>`)
    .join("")}</div>`;
}

function tape(v) {
  const rows = v.rows
    .map((r) => {
      const parts = r.parts
        .map(
          (p) =>
            `<span class="ws-tape-part${tone(p.tone)}" style="flex:${p.size ?? 1}">${esc(p.text)}</span>`,
        )
        .join("");
      const label = isText(r.label) ? `<span class="ws-tape-label">${esc(r.label)}</span>` : "";
      return `<div class="ws-tape-row">${label}<span class="ws-tape-bar">${parts}</span></div>`;
    })
    .join("");
  const total = isText(v.total) ? `<div class="ws-tape-total">${esc(v.total)}</div>` : "";
  return `<div class="ws-tape">${rows}${total}</div>`;
}

function table(v) {
  const hl = new Set((v.highlight || []).map((rc) => `${rc[0]}:${rc[1]}`));
  const head = v.headers.map((h) => `<th scope="col">${esc(h)}</th>`).join("");
  const body = v.rows
    .map(
      (r, ri) =>
        `<tr>${r
          .map((c, ci) => `<td${hl.has(`${ri}:${ci}`) ? ' class="is-focus"' : ""}>${esc(c)}</td>`)
          .join("")}</tr>`,
    )
    .join("");
  return `<table class="ws-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function fmt(n) {
  return String(Math.round(n * 1000) / 1000);
}

function numberLine(v) {
  const W = 220;
  const PAD = 12;
  const Y = 52;
  const x = (n) => PAD + ((n - v.min) / (v.max - v.min)) * (W - 2 * PAD);
  const ticks = [];
  const count = Math.round((v.max - v.min) / v.step);
  const every = Math.max(1, Math.ceil(count / 10));
  for (let i = 0; i <= count; i += 1) {
    const n = v.min + i * v.step;
    ticks.push(`<line x1="${x(n)}" y1="${Y - 5}" x2="${x(n)}" y2="${Y + 5}" class="ws-axis"/>`);
    if (i % every === 0 || i === count) {
      ticks.push(`<text x="${x(n)}" y="${Y + 19}" class="ws-tick">${esc(fmt(n))}</text>`);
    }
  }
  const jumps = (v.jumps || [])
    .map((j) => {
      const a = x(j.from);
      const b = x(j.to);
      const mid = (a + b) / 2;
      return `<path d="M${a} ${Y - 6} Q${mid} ${Y - 34} ${b} ${Y - 6}" class="ws-jump"/>${
        isText(j.label)
          ? `<text x="${mid}" y="${Y - 26}" class="ws-jump-label">${esc(j.label)}</text>`
          : ""
      }`;
    })
    .join("");
  const points = (v.points || [])
    .map(
      (p) =>
        `<circle cx="${x(p.value)}" cy="${Y}" r="5" class="ws-point${p.tone === "unknown" ? " is-unknown" : ""}"/>${
          isText(p.label)
            ? `<text x="${x(p.value)}" y="${Y - 10}" class="ws-point-label">${esc(p.label)}</text>`
            : ""
        }`,
    )
    .join("");
  return `<svg class="ws-svg" viewBox="0 0 ${W} 80" role="img" aria-label="${esc(v.alt || "Number line")}"><line x1="${PAD}" y1="${Y}" x2="${W - PAD}" y2="${Y}" class="ws-axis"/>${ticks.join("")}${jumps}${points}</svg>`;
}

function rect(v) {
  const inner = isText(v.label) ? `<span class="ws-rect-inside">${esc(v.label)}</span>` : "";
  return `<div class="ws-rect-wrap"><div class="ws-rect">${inner}</div><span class="ws-rect-w">${esc(v.width)}</span><span class="ws-rect-h">${esc(v.height)}</span></div>`;
}

function groups(v) {
  const icon = esc(isText(v.icon) ? v.icon : "●");
  const one = `<span class="ws-group">${`<span class="ws-dot">${icon}</span>`.repeat(v.each)}</span>`;
  const label = isText(v.label) ? `<div class="ws-caption">${esc(v.label)}</div>` : "";
  return `<div class="ws-groups">${one.repeat(v.groups)}</div>${label}`;
}

function bars(v) {
  const max = Math.max(...v.items.map((b) => b.value), 1);
  return `<div class="ws-bars">${v.items
    .map(
      (b) =>
        `<div class="ws-bar-row"><span class="ws-bar-label">${esc(b.label)}</span><span class="ws-bar-track"><span class="ws-bar${tone(b.tone)}" style="width:${Math.max(4, (b.value / max) * 100)}%"></span></span><span class="ws-bar-value">${esc(isText(b.text) ? b.text : fmt(b.value))}</span></div>`,
    )
    .join("")}</div>`;
}

function coords(v) {
  const xs = v.points.map((p) => p.x);
  const ys = v.points.map((p) => p.y);
  const lo = Math.min(0, ...xs, ...ys) - 1;
  const hi = Math.max(0, ...xs, ...ys) + 1;
  const S = 200;
  const P = 14;
  const sx = (n) => P + ((n - lo) / (hi - lo)) * (S - 2 * P);
  const sy = (n) => S - P - ((n - lo) / (hi - lo)) * (S - 2 * P);
  const grid = [];
  for (let n = Math.ceil(lo); n <= hi; n += 1) {
    grid.push(
      `<line x1="${sx(n)}" y1="${sy(lo)}" x2="${sx(n)}" y2="${sy(hi)}" class="ws-grid${n === 0 ? " is-axis" : ""}"/>`,
      `<line x1="${sx(lo)}" y1="${sy(n)}" x2="${sx(hi)}" y2="${sy(n)}" class="ws-grid${n === 0 ? " is-axis" : ""}"/>`,
    );
  }
  const path = v.connect
    ? `<polyline points="${v.points.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ")}" class="ws-jump"/>`
    : "";
  const pts = v.points
    .map(
      (p) =>
        `<circle cx="${sx(p.x)}" cy="${sy(p.y)}" r="4.5" class="ws-point"/><text x="${sx(p.x) + 6}" y="${sy(p.y) - 6}" class="ws-coord-label">${esc(isText(p.label) ? p.label : `(${p.x}, ${p.y})`)}</text>`,
    )
    .join("");
  return `<svg class="ws-svg ws-coords" viewBox="0 0 ${S} ${S}" role="img" aria-label="${esc(v.alt || "Coordinate plane")}">${grid.join("")}${path}${pts}</svg>`;
}

const VISUALS = {
  chips,
  tape,
  table,
  "number-line": numberLine,
  rect,
  groups,
  bars,
  coords,
};

function visualHtml(v) {
  if (!v || !VISUALS[v.kind]) return "";
  const caption =
    isText(v.caption) && v.kind !== "groups"
      ? `<div class="ws-caption">${esc(v.caption)}</div>`
      : "";
  return `<div class="ws-visual ws-visual--${esc(v.kind)}">${VISUALS[v.kind](v)}${caption}</div>`;
}

/**
 * The whole row as HTML: an ordered list laid out across (see .ws-row in
 * design-system.css), then the answer. Returns "" for an invalid spec so a bad
 * entry can never render half a solution.
 */
export function workedStepsHtml(spec) {
  if (validateWorkedSteps(spec).length) return "";
  const steps = spec.steps
    .map(
      (s, i) => `<li class="ws-step">
  <div class="ws-step-head"><span class="ws-num" aria-hidden="true">${i + 1}</span><span class="ws-title">${esc(s.title)}</span></div>
  ${visualHtml(s.picture)}
  <div class="ws-math">${esc(s.math)}</div>
  ${isText(s.say) ? `<p class="ws-say">${esc(s.say)}</p>` : ""}
</li>`,
    )
    .join("");
  const label = isText(spec.label) ? `<p class="ws-label">${esc(spec.label)}</p>` : "";
  return `${label}<ol class="ws-row" aria-label="Steps to solve today's problem">${steps}</ol>
<p class="ws-answer"><span class="ws-answer-tag">✅ Answer</span> ${esc(spec.answer)}</p>`;
}
