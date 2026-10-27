// Pure HTML builders for the workbench: the ratio table, the goal strip, the model pictures and the given source. Each takes
// the round, the learner's in-progress state and the language, so a language switch can redraw everything without losing work.
// @fm2 FM-021 FM-036 FM-059
import {
  bowlsModel,
  coordGraph,
  doubleNumberLine,
  ratioTableHtml,
  tapeModel,
} from "../../art/ratios.js";
import { escapeHtml, L, tx } from "../../lang.js";
import { cmp, div, frac, mul } from "../../rational.js";
import { UI } from "./copy.js";
import { fmtVal, niceMax, R, rowLabel } from "./kit.js";
import { readNum } from "./logic.js";

const esc = escapeHtml;
const t = (copy, lang, vars) => tx(copy, lang, vars);

export const rowOf = (round, key) => round.rows.find((r) => r.key === key);
export function batchOf(round, state, ci) {
  const b = readNum(state.cols[ci].batch);
  return b && b.n >= 0 ? b : R(0);
}
export const wordFor = (round, b, lang) =>
  L(cmp(b, R(1)) <= 0 && b.n > 0 ? round.batchWord.one : round.batchWord.many, lang);

export function inputMode(round) {
  const whole =
    round.cols.every(
      (c) => c.batch.d === 1 && c.ask.every((k) => mul(c.per[k], c.batch).d === 1),
    ) && round.extra.every((e) => e.kind !== "num" || e.answer.d === 1);
  return whole && round.style !== "dec" ? "numeric" : round.style === "dec" ? "decimal" : "text";
}

const liveValue = (round, col, key, b) => fmtVal(mul(col.per[key], b), round.style);

// What a live (not typed, not goal) cell shows: the scaled amount, or "?" where seeing it would hand over the goal.
export function liveText(round, state, ci, key) {
  const col = round.cols[ci];
  if (round.hide && col.limit?.have[key]) return "?";
  return liveValue(round, col, key, batchOf(round, state, ci));
}

export function headText(round, state, ci, lang) {
  const col = round.cols[ci];
  const several = round.cols.length > 1;
  const name = several ? L(col.label, lang) : L(round.yourName || UI.yourBatch, lang);
  return round.hide ? name : `${name} ×${fmtVal(batchOf(round, state, ci), round.style)}`;
}

function cellHtml(round, state, ci, row, lang, locked) {
  const col = round.cols[ci];
  const b = batchOf(round, state, ci);
  if (col.pin?.key === row.key)
    return `<td class="rl-goal"><span class="rl-tag">${esc(t(UI.goal, lang))}</span> <strong>${esc(fmtVal(col.pin.value, round.style))}</strong></td>`;
  if (col.ask.includes(row.key)) {
    const label = `${rowLabel(row, lang)}${round.cols.length > 1 ? `, ${L(col.label, lang)}` : ""}`;
    return `<td class="rl-cell"><input type="text" class="rl-input" id="rl-f-${ci}-${row.key}" inputmode="${inputMode(round)}" autocomplete="off" autocapitalize="off" spellcheck="false" data-rl-field="${ci}:${row.key}" data-rl-key="f-${ci}-${row.key}" aria-label="${esc(label)}" value="${esc(state.cols[ci].values[row.key] || "")}" ${locked ? "disabled" : ""}></td>`;
  }
  const have = col.limit?.have[row.key];
  if (have) {
    const live = liveText(round, state, ci, row.key);
    return `<td class="rl-limit"><strong data-rl-live="${ci}:${row.key}">${esc(live)}</strong> <small>(${esc(t(UI.have, lang))} ${esc(fmtVal(have, round.style))})</small></td>`;
  }
  return `<td class="rl-live" data-rl-live="${ci}:${row.key}">${esc(liveText(round, state, ci, row.key))}</td>`;
}

export function tableHtml(round, state, lang, locked) {
  const several = round.cols.length > 1;
  const heads = [`<th scope="col"><span class="fm2-sr">${esc(t(UI.recipe, lang))}</span></th>`];
  round.cols.forEach((col, ci) => {
    if (col.showBase)
      heads.push(
        `<th scope="col" class="rl-basehead">${esc(several && round.cols.some((c, i) => i > 0 && c.showBase) ? `${L(col.label, lang)} · ` : "")}${esc(t(UI.head, lang, { n: "1", word: L(round.batchWord.one, lang) }))}</th>`,
      );
    heads.push(
      `<th scope="col" class="rl-yours${ci === state.active ? " is-active" : ""}" data-rl-head="${ci}">${esc(headText(round, state, ci, lang))}</th>`,
    );
  });
  const body = round.rows.map((row) => {
    const cells = [`<th scope="row">${esc(rowLabel(row, lang))}</th>`];
    round.cols.forEach((col, ci) => {
      if (col.showBase)
        cells.push(`<td class="rl-base">${esc(fmtVal(col.per[row.key], round.style))}</td>`);
      cells.push(cellHtml(round, state, ci, row, lang, locked));
    });
    return `<tr>${cells.join("")}</tr>`;
  });
  return `<table class="rl-table"><caption>${esc(["cook", "crowd", "craft"].includes(round.recipe.family) ? L(round.recipe.name, lang).replace(/^./, (c) => c.toUpperCase()) : t(UI.recipe, lang))}</caption><thead><tr>${heads.join("")}</tr></thead><tbody>${body.join("")}</tbody></table>`;
}

// The goal readout. Returns { html, text }; empty at the levels that hide it.
export function stripParts(round, state, lang) {
  if (round.hide) return { html: "", text: "" };
  const ci = state.active;
  const col = round.cols[ci];
  const b = batchOf(round, state, ci);
  const bits = [];
  if (col.pin) {
    const row = rowOf(round, col.pin.key);
    const live = mul(col.per[col.pin.key], b);
    const order = cmp(live, col.pin.value);
    const [icon, word, cls] =
      order === 0
        ? ["✓", UI.matches, "ok"]
        : order < 0
          ? ["•", UI.notEnough, "low"]
          : ["!", UI.tooMuch, "over"];
    bits.push({
      cls,
      icon,
      text: `${rowLabel(row, lang)}: ${fmtVal(live, round.style)} / ${t(UI.goal, lang)} ${fmtVal(col.pin.value, round.style)} · ${t(word, lang)}`,
    });
  } else if (col.limit) {
    for (const [key, have] of Object.entries(col.limit.have)) {
      const need = mul(col.per[key], b);
      const fits = cmp(need, have) <= 0;
      bits.push({
        cls: fits ? "ok" : "over",
        icon: fits ? "✓" : "!",
        text: `${rowLabel(rowOf(round, key), lang)}: ${t(UI.needs, lang)} ${fmtVal(need, round.style)} ${t(UI.of, lang)} ${fmtVal(have, round.style)} · ${t(fits ? UI.fits : UI.tooMany, lang)}`,
      });
    }
  }
  return {
    html: bits
      .map(
        (x) =>
          `<span class="rl-strip-item rl-${x.cls}"><span aria-hidden="true">${x.icon}</span> ${esc(x.text)}</span>`,
      )
      .join(""),
    text: bits.map((x) => x.text).join(". "),
  };
}

// ---- pictures ------------------------------------------------------------------------------------------------------------
const axes = (points, extra = 0) => ({
  xMax: niceMax(Math.max(...points.map((p) => p[0].n / p[0].d), extra) + 1),
  yMax: niceMax(Math.max(...points.map((p) => p[1].n / p[1].d)) + 1),
});

function graphFigure(round, ci, b, lang) {
  const col = round.cols[ci];
  const xKey = round.graph?.xKey ?? "x";
  const yKey = round.graph?.yKey ?? "y";
  const slope = div(col.per[yKey], col.per[xKey]);
  const pts = [];
  const shownPairs = col.source?.pairs ?? round.source?.pairs ?? col.source?.points ?? round.source?.points;
  const baseCol = round.cols.find((c) => c.showBase);
  if (shownPairs) for (const [x, y] of shownPairs) pts.push({ x, y, text: `(${fmtVal(x, round.style)}, ${fmtVal(y, round.style)})` });
  else if (baseCol) pts.push({ x: baseCol.per[xKey], y: baseCol.per[yKey], text: `(${fmtVal(baseCol.per[xKey], round.style)}, ${fmtVal(baseCol.per[yKey], round.style)})` });
  const span = round.graph ?? axes(pts.map((p) => [p.x, p.y]));
  const atLeast = (v, max) => (cmp(v, frac(max)) > 0 ? frac(max) : v);
  const current = { x: atLeast(mul(col.per[xKey], b), span.xMax), y: atLeast(mul(col.per[yKey], b), span.yMax) };
  const showLine = round.graph ? round.graph.showLine !== false : col.source?.rep !== "table";
  const word = wordFor(round, b, lang);
  return coordGraph({
    k: slope,
    xMax: span.xMax,
    yMax: span.yMax,
    xName: rowLabel(rowOf(round, xKey), lang),
    yName: rowLabel(rowOf(round, yKey), lang),
    points: pts,
    current,
    showLine,
    aria: t(UI.graph, lang, { n: fmtVal(b, round.style), word }),
  });
}

function lineFigure(round, ci, b, lang) {
  const col = round.cols[ci];
  const key = round.lineKey ?? col.pin?.key ?? Object.keys(col.limit.have)[0];
  const row = rowOf(round, key);
  return doubleNumberLine({
    batch: b,
    topName: L(round.batchWord.many, lang),
    bottom: {
      per: col.per[key],
      name: rowLabel(row, lang),
      hide: col.ask.includes(key) || round.hide,
    },
    aria: t(UI.line, lang),
  });
}

export function modelHtml(round, state, lang) {
  if (round.layout === "stack") return "";
  const ci = state.active;
  const col = round.cols[ci];
  const b = batchOf(round, state, ci);
  const word = wordFor(round, b, lang);
  const aria = t(UI.model, lang, { n: fmtVal(b, round.style), word });
  const visible = round.rows.filter((r) => !r.batchRow && col.per[r.key]);
  let figure = "";
  if (round.view === "bowls") {
    const first = visible[0];
    const whole = Math.floor(b.n / b.d);
    const sum =
      round.sum && b.d === 1 && whole >= 2 && whole <= 8
        ? Array.from({ length: whole }, () => fmtVal(col.per[round.sum])).join(" + ")
        : null;
    figure = bowlsModel({
      batch: b,
      rows: visible.slice(0, round.recipe.family === "group" ? 2 : 1).map((r, i) => ({ per: col.per[r.key], shape: i, show: true })),
      sum: first ? sum : null,
      aria,
    });
  } else if (round.view === "share") {
    const tiles = col.per[col.pin.key];
    figure = bowlsModel({ batch: tiles, rows: [{ per: b, shape: 0, show: true }], aria });
  } else if (round.view === "tape") {
    figure = tapeModel({
      batch: b,
      rows: visible.map((r, i) => ({
        name: rowLabel(r, lang),
        per: col.per[r.key],
        shape: i,
        show: true,
      })),
      aria,
    });
  } else if (round.view === "graph") figure = graphFigure(round, ci, b, lang);
  const line = round.line ? lineFigure(round, ci, b, lang) : "";
  return `${figure}${line}`;
}

// Given information that the table does not show: a table of pairs, an equation, or (in stacked rounds) each column's own.
function oneSource(round, source, lang, label = "", ci = 0, state = null) {
  const prefix = label ? `<h3 class="rl-source-title">${esc(label)}</h3>` : "";
  if (source.rep === "table") {
    const xRow = rowOf(round, "x");
    const yRow = rowOf(round, "y");
    const xs = source.pairs.map(([x]) => fmtVal(x, round.style));
    const ys = source.pairs.map(([, y]) => fmtVal(y, round.style));
    return `${prefix}${ratioTableHtml({
      caption: t(UI.givenTable, lang),
      head: null,
      rows: [
        [rowLabel(xRow, lang), ...xs],
        [rowLabel(yRow, lang), ...ys],
      ],
    })}`;
  }
  if (source.rep === "equation")
    return `${prefix}<p class="rl-eq"><span class="fm2-sr">${esc(t(UI.givenEquation, lang))}: </span><strong>${esc(source.text)}</strong></p>`;
  if (source.rep === "graph" && round.layout === "stack" && state) {
    const col = round.cols[ci];
    const span = axes(source.points);
    const slope = source.k ?? div(col.per.y, col.per.x);
    const pts = source.points.map(([x, y]) => ({
      x,
      y,
      text: `(${fmtVal(x, round.style)}, ${fmtVal(y, round.style)})`,
    }));
    return `${prefix}${coordGraph({ k: slope, xMax: span.xMax, yMax: span.yMax, xName: rowLabel(rowOf(round, "x"), lang), yName: rowLabel(rowOf(round, "y"), lang), points: pts, showLine: true, aria: t(UI.givenGraph, lang) })}`;
  }
  return "";
}

export function sourceHtml(round, state, lang) {
  if (round.layout === "stack")
    return round.cols
      .map(
        (col, ci) =>
          `<div class="rl-source">${oneSource(round, col.source, lang, L(col.label, lang), ci, state)}</div>`,
      )
      .join("");
  return round.source && round.source.rep !== "graph"
    ? `<div class="rl-source">${oneSource(round, round.source, lang)}</div>`
    : "";
}

export const emptyBatch = (col, style) => fmtVal(col.start, style);
