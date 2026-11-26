// living/two-var-model.js — numbers and validation for the two-var play, no DOM
// and no prose. One play serves four lessons through `mode`:
//   variables (9-1)  independent vs dependent: change one, the other responds
//   graph     (9-2)  a table's rows become points; what a point means
//   equation  (9-3)  the rule y = kx found from the table and checked on every row
//   apply     (9-4)  use the equation and graph to answer "how much when…?" / "when is…?"
// Every relationship is y = k·x with k given to at most two decimals, so every
// table value is exact to the cent and `yOf` is the one place that computes it.

export const W = 480;
export const H = 330;
export const MAXROWS = 4;
export const MODES = ["variables", "graph", "equation", "apply"];

/**
 * @typedef {{ en: string, es: string }} Pair
 * @typedef {{
 *   xName: Pair, yName: Pair, story: Pair, read: Pair | null, k: number, xs: number[],
 *   xMax: number, yPrefix: string, cents: boolean, dashed: boolean, dashNote: Pair | null,
 *   vars: { x: string, y: string }, xUnit: Pair | null, sentences: { right: Pair, swapped: Pair } | null,
 *   second: number | null, secondStory: Pair | null, secondLabel: Pair | null, lineLabel: Pair | null,
 *   goal: number | null, wrongReads: { text: Pair, cue: Pair }[], scale: Scale | null
 * }} Sit
 * @typedef {{ xStep: number, yStep: number, yMax: number, xMax: number }} Scale
 */

export const r2 = (v) => Math.round(v * 100 + (v < 0 ? -1e-9 : 1e-9)) / 100;

/** 1,200 · 24.95 · 2.5 · −12 — thousands commas like the lesson pages; `cents` forces two decimals. */
export function fmt(v, cents = false, group = true) {
  const n = r2(v);
  let [i, d = ""] = Math.abs(n).toFixed(2).split(".");
  if (!cents) d = d.replace(/0+$/, "");
  if (group) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${n < 0 ? "−" : ""}${i}${d ? `.${d}` : ""}`;
}

/** A y value as the table prints it: "$74.85", "1,200", "2.5". */
export const fmtY = (sit, y) => `${sit.yPrefix}${fmt(y, sit.cents)}`;

export const yOf = (sit, x) => r2(sit.k * x);

/** Stable position for the correct choice — never always first. */
export function placeCorrect(options, seed) {
  const correct = options.find((o) => o.correct);
  const rest = options.filter((o) => !o.correct);
  rest.splice(seed % options.length, 0, correct);
  return rest;
}

const Y_STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000];
const X_STEPS = [1, 2, 4, 5, 10, 20, 25, 50];

/**
 * The graph's scale: at most six ticks per axis, y top rounded up to a tick.
 * @param {number} xMax @param {number} yTop the tallest value the graph must hold
 * @returns {Scale | null}
 */
export function scaleOf(xMax, yTop) {
  const xStep = X_STEPS.find((s) => Math.ceil(xMax / s) <= 6 && xMax % s === 0);
  const yStep = Y_STEPS.find((s) => Math.ceil(yTop / s - 1e-9) <= 6);
  if (!xStep || !yStep) return null;
  return { xStep, yStep, xMax, yMax: Math.ceil(yTop / yStep - 1e-9) * yStep };
}

/** A short label: a string or {en, es}; es falls back to en. */
export function cleanPair(v, max = 24) {
  if (v == null) return null;
  const p = typeof v === "string" ? { en: v, es: v } : v;
  if (typeof p !== "object") return null;
  const en = typeof p.en === "string" ? p.en.trim() : "";
  const es = typeof p.es === "string" && p.es.trim() ? p.es.trim() : en;
  return en && en.length <= max && es.length <= max ? { en, es } : null;
}

/** Two lines for a table header: the split that keeps both short. */
export function splitLabel(text, per = 12) {
  if (text.length <= per) return [text];
  const w = text.split(" ");
  let best = null;
  for (let i = 1; i < w.length; i++) {
    const a = w.slice(0, i).join(" ");
    const b = w.slice(i).join(" ");
    const score = Math.max(a.length, b.length);
    if (!best || score < best.score) best = { a, b, score };
  }
  return best && best.score <= per ? [best.a, best.b] : [text];
}

const okInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const optPair = (v, max) => (v == null ? null : cleanPair(v, max));

/**
 * One situation: a relationship y = k·x with its names, rows and stage.
 * @param {any} raw
 * @param {{ graph?: boolean, minRows?: number, needRead?: boolean }} [o]
 * @returns {Sit | null}
 */
export function validateSit(raw, { graph = true, minRows = 2, needRead = false } = {}) {
  if (!raw || typeof raw !== "object") return null;
  const xName = cleanPair(raw.xName);
  const yName = cleanPair(raw.yName);
  const story = cleanPair(raw.story, 300);
  const read = optPair(raw.read, 120);
  if (!xName || !yName || !story || (needRead && !read)) return null;
  if (read && !(read.en.includes("{x}") && read.en.includes("{y}"))) return null;
  if (read && !(read.es.includes("{x}") && read.es.includes("{y}"))) return null;
  const k = Number(raw.k);
  if (!(k > 0) || k > 100000 || r2(k) !== k) return null;
  const xs = Array.isArray(raw.xs) ? raw.xs.map(Number) : [];
  if (xs.length < minRows || xs.length > MAXROWS) return null;
  if (!xs.every((x, i) => okInt(x, 1, 1000) && (i === 0 || x > xs[i - 1]))) return null;
  const yPrefix = raw.yPrefix === "$" ? "$" : "";
  const vars = { x: String(raw.vars?.x ?? "x"), y: String(raw.vars?.y ?? "y") };
  if (!/^[a-zA-Z]$/.test(vars.x) || !/^[a-zA-Z]$/.test(vars.y) || vars.x === vars.y) return null;
  const xUnit = optPair(raw.xUnit, 10);
  const sentences = raw.sentences
    ? { right: cleanPair(raw.sentences.right, 90), swapped: cleanPair(raw.sentences.swapped, 90) }
    : null;
  if (sentences && !(sentences.right && sentences.swapped)) return null;
  const wrongReads = Array.isArray(raw.wrongReads)
    ? raw.wrongReads.map((w) => ({ text: cleanPair(w?.text, 90), cue: cleanPair(w?.cue, 200) }))
    : [];
  if (wrongReads.some((w) => !w.text || !w.cue)) return null;
  const sit = {
    xName,
    yName,
    story,
    read,
    k,
    xs,
    xMax: 0,
    yPrefix,
    cents: raw.cents === true,
    dashed: raw.dashed === true,
    dashNote: optPair(raw.dashNote, 140),
    vars,
    xUnit,
    sentences,
    second: raw.second == null ? null : Number(raw.second),
    secondStory: optPair(raw.secondStory, 160),
    secondLabel: optPair(raw.secondLabel, 14),
    lineLabel: optPair(raw.lineLabel, 14),
    goal: raw.goal == null ? null : Number(raw.goal),
    wrongReads,
    scale: null,
  };
  if (sit.dashed && !sit.dashNote) return null;
  if (sit.second != null && !(sit.second > 0 && sit.second < k && r2(sit.second) === sit.second))
    return null;
  if (sit.second != null && !(sit.secondStory && sit.secondLabel && sit.lineLabel)) return null;
  if (sit.goal != null && !(sit.goal > 0)) return null;
  if (!graph) return sit;
  const xMax = Number(raw.xMax);
  if (!okInt(xMax, xs[xs.length - 1], 60)) return null;
  sit.xMax = xMax;
  const top = Math.max(k * xMax, sit.goal ?? 0);
  sit.scale = scaleOf(xMax, top);
  return sit.scale ? sit : null;
}

/** @param {Sit} sit */
export const rowsOf = (sit) => sit.xs.map((x) => ({ x, y: yOf(sit, x) }));

/** Fill "{x}" and "{y}" in a `read` template ("{x} tickets cost {y}"). */
export function readOut(sit, x, y, lang) {
  return sit.read[lang].replace("{x}", fmt(x)).replace("{y}", fmtY(sit, y));
}

/** `(x, y)` the way a coordinate pair is printed. */
export const pairText = (sit, x, y) => `(${fmt(x, false, false)}, ${fmt(y, sit.cents, false)})`;

/** Does a point sit inside the plotted area? */
export const onGraph = (sit, x, y) =>
  x >= 0 && y >= 0 && x <= sit.xMax && y <= (sit.scale?.yMax ?? 0);

/**
 * Four ordered pairs for "where does the row for x land?": the right one and
 * three real mistakes (axes swapped, added instead of multiplied, repeated the
 * first row's value).
 */
export function pointChoices(sit, x) {
  const y = yOf(sit, x);
  const first = yOf(sit, sit.xs[0]);
  const raw = [
    { kind: "right", px: x, py: y, correct: true },
    { kind: "swapped", px: y, py: x, correct: false },
    { kind: "added", px: x, py: r2(sit.k + x), correct: false },
    { kind: "repeat", px: x, py: first, correct: false },
  ];
  const seen = new Set();
  return raw.filter((o) => !seen.has(`${o.px},${o.py}`) && seen.add(`${o.px},${o.py}`));
}

/**
 * Candidate equations for a table. Every wrong rule fails on at least one row;
 * `check` shows the arithmetic of testing the rule on row x.
 * @param {Sit} sit @param {"bigRate" | "minus"} fourth
 */
export function ruleChoices(sit, fourth) {
  const { x: X, y: Y } = sit.vars;
  const k = fmt(sit.k, sit.cents);
  const row2 = yOf(sit, sit.xs[1]);
  const defs = [
    { kind: "right", text: `${Y} = ${k}${X}`, correct: true },
    { kind: "added", text: `${Y} = ${X} + ${k}`, correct: false },
    { kind: "swapped", text: `${X} = ${k}${Y}`, correct: false },
    fourth === "minus"
      ? { kind: "minus", text: `${Y} = ${X} − ${k}`, correct: false }
      : { kind: "bigRate", text: `${Y} = ${fmt(row2, sit.cents)}${X}`, correct: false },
  ];
  return defs;
}

/**
 * Test rule `kind` on the row x: the expression computed, what it gives, and
 * what the table says. `ok` only for the rule that really is y = k·x. A product
 * with more than two decimals is shown rounded to a whole number with "≈".
 * @returns {{ shows: string, got: number, expect: number, ok: boolean, gotText: string, expectText: string }}
 */
export function ruleCheck(sit, kind, x) {
  const y = yOf(sit, x);
  const k = fmt(sit.k, sit.cents);
  const f = (v) => fmt(v, sit.cents);
  const big = yOf(sit, sit.xs[1]);
  const t = {
    right: { shows: `${k} × ${x}`, raw: sit.k * x, expect: y, ec: sit.cents },
    added: { shows: `${x} + ${k}`, raw: x + sit.k, expect: y, ec: sit.cents },
    swapped: { shows: `${k} × ${f(y)}`, raw: sit.k * y, expect: x, ec: false },
    minus: { shows: `${x} − ${k}`, raw: x - sit.k, expect: y, ec: sit.cents },
    bigRate: { shows: `${f(big)} × ${x}`, raw: big * x, expect: y, ec: sit.cents },
  }[kind];
  const approx = Math.abs(t.raw * 100 - Math.round(t.raw * 100)) > 1e-6;
  const got = approx ? Math.round(t.raw) : r2(t.raw);
  return {
    shows: t.shows,
    got,
    expect: t.expect,
    ok: got === t.expect,
    gotText: `${approx ? "≈" : "="} ${fmt(got, !approx && sit.cents)}`,
    expectText: fmt(t.expect, t.ec),
  };
}

/** The row on which a wrong rule is shown failing: the second row if it fails, else the first that does. */
export function failingRow(sit, kind) {
  const rows = sit.xs;
  const bad = rows.filter((x) => !ruleCheck(sit, kind, x).ok);
  if (!bad.length) return null;
  return bad.includes(rows[1]) ? rows[1] : bad[0];
}

/** Four hours-needed answers for "k·h = target": solved, ×k, −k, and ten times too small. */
export function solveChoices(k, target) {
  const right = r2(target / k);
  const raw = [
    { kind: "right", value: right, correct: true },
    { kind: "times", value: r2(target * k), correct: false },
    { kind: "minus", value: r2(target - k), correct: false },
    { kind: "small", value: r2(right / 10), correct: false },
  ];
  const seen = new Set();
  return raw.filter((o) => o.value > 0 && !seen.has(o.value) && seen.add(o.value));
}

/** Four "at least how many?" answers: two short, the right one, and a round overshoot. */
export function atLeastChoices(k, goal) {
  const need = Math.ceil(goal / k - 1e-9);
  const over = Math.ceil(need / 10) * 10;
  const raw = [
    { kind: "right", n: need, correct: true },
    { kind: "short", n: need - 1, correct: false },
    { kind: "roundDown", n: need - 2, correct: false },
    { kind: "round", n: over === need ? need + 10 : over, correct: false },
  ];
  const seen = new Set();
  return raw.filter((o) => o.n >= 1 && !seen.has(o.n) && seen.add(o.n));
}

/** The four "how many in x?" answers for the apply play: right, added, the last table row, and a miscounted x. */
export function askChoices(sit, x) {
  const y = yOf(sit, x);
  const lastX = sit.xs[sit.xs.length - 1];
  const raw = [
    { kind: "right", y, correct: true },
    { kind: "added", y: r2(sit.k + x), correct: false },
    { kind: "lastRow", y: yOf(sit, lastX), correct: false },
    { kind: "slip", y: yOf(sit, x - 4), correct: false },
  ];
  const seen = new Set();
  return raw.filter((o) => o.y > 0 && !seen.has(o.y) && seen.add(o.y));
}

/**
 * @param {any} cfg
 */
export function validateTwoVar(cfg) {
  if (!cfg || typeof cfg !== "object" || !MODES.includes(cfg.mode)) return null;
  const mode = cfg.mode;
  const graph = mode !== "variables";
  const main = validateSit(cfg.main, {
    graph,
    minRows:
      mode === "variables" || mode === "equation" || mode === "apply" || mode === "graph" ? 3 : 2,
    needRead: graph,
  });
  const transfer = validateSit(cfg.transfer, {
    graph,
    minRows: mode === "apply" ? 1 : 2,
    needRead: graph,
  });
  if (!main || !transfer) return null;
  if (main.xName.en === transfer.xName.en && main.k === transfer.k) return null;
  const base = { mode, main, transfer };
  if (mode === "variables") {
    if (!main.xUnit || !main.sentences || !transfer.sentences) return null;
    return base;
  }
  return GRAPH_MODES[mode]?.(cfg, base) ?? null;
}

/** Extra validation per graph mode; each returns the full normalised config or null. */
const GRAPH_MODES = {
  graph(cfg, base) {
    const { main, transfer } = base;
    const check = cfg.check;
    if (!check || !okInt(Number(check.x), 1, main.xMax) || main.xs.includes(Number(check.x)))
      return null;
    const cx = Number(check.x);
    const cy = Number(check.y);
    if (!(cy > 0) || cy === yOf(main, cx) || cy > main.scale.yMax) return null;
    if (pointChoices(main, main.xs[1]).length !== 4) return null;
    if (transfer.second == null) return null;
    const px = Number(cfg.pointX ?? transfer.xs[transfer.xs.length - 1]);
    if (!transfer.xs.includes(px) || transfer.wrongReads.length < 2) return null;
    return { ...base, check: { x: cx, y: cy }, pointX: px };
  },
  equation(cfg, base) {
    const { main, transfer } = base;
    const probeStart = Number(cfg.probeStart ?? 6);
    if (!okInt(probeStart, 1, main.xMax) || main.xs.includes(probeStart)) return null;
    const other = cfg.other;
    const ok = Number(other?.k);
    const story = cleanPair(other?.story, 200);
    const label = cleanPair(other?.label, 14);
    const mainLabel = cleanPair(other?.mainLabel, 14);
    if (!(ok > 0 && ok < main.k && r2(ok) === ok) || !story || !label || !mainLabel) return null;
    if (main.xs[1] === 1 || transfer.xs.length < 2) return null;
    // The other rate is drawn as a second line on the same graph.
    main.second = ok;
    main.secondLabel = label;
    main.lineLabel = mainLabel;
    return { ...base, probeStart, other: { k: ok, story, label } };
  },
  apply(cfg, base) {
    const { main, transfer } = base;
    const ask = Number(cfg.ask?.x);
    if (!okInt(ask, 1, main.xMax) || main.xs.includes(ask)) return null;
    const goals = Array.isArray(cfg.goals) ? cfg.goals.map(Number) : [];
    const goalXs = goals.map((g) => g / main.k);
    if (goals.length < 2 || goals.length > 4) return null;
    if (!goalXs.every((x) => okInt(x, 1, main.xMax))) return null;
    const target = Number(cfg.solve?.target);
    const perDay = Number(cfg.solve?.perDay ?? 0);
    if (!okInt(target / main.k, 1, 100000) || target <= main.scale.yMax) return null;
    const interpret = cleanPair(cfg.solve?.interpret, 160);
    if (!interpret || (perDay && !okInt(perDay, 2, 24))) return null;
    if (askChoices(main, ask).length !== 4) return null;
    if (transfer.goal == null || !transfer.dashed) return null;
    const need = Math.ceil(transfer.goal / transfer.k - 1e-9);
    if (need > transfer.xMax || need < 3) return null;
    if (yOf(transfer, need) < transfer.goal || yOf(transfer, need - 1) >= transfer.goal)
      return null;
    if (atLeastChoices(transfer.k, transfer.goal).length !== 4) return null;
    const over = atLeastChoices(transfer.k, transfer.goal).map((o) => o.n);
    if (Math.max(...over) > transfer.xMax) return null;
    return { ...base, ask: { x: ask }, goals, goalXs, solve: { target, perDay, interpret }, need };
  },
};
