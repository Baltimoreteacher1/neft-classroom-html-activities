// Science Investigation Lab: the bar chart scene (one bar per data row) and its text version.
// Heights come from the dataset, or from the values the learner set (`values`), never from anything else.
import { esc, raw } from "../util.js";
import { C, condText, ln, niceMax, valueOf } from "./science-lab-scene-kit.js";

const W = 640;
const H = 330;
const PAD = { l: 64, r: 16, t: 34, b: 58 };
const PLOT_H = H - PAD.t - PAD.b;
const FILLS = [C.copper, C.sage, "#15969a", "#455a9a", C.wool];
const both = (I, o) => (o ? I.S(o.en, o.es) : "");

export const chartAxisMax = (caseDef, rows) =>
  niceMax(Math.max(1, ...rows.map((r) => valueOf(caseDef, r))));

/** A learner value close to the row's own value snaps to it exactly; anything else is kept as typed. */
export function snapValue(caseDef, rows, row, typed) {
  const v = Number(typed);
  if (!Number.isFinite(v) || v < 0) return null;
  const tol = Math.max(1, Math.round(chartAxisMax(caseDef, rows) * 0.03));
  const data = valueOf(caseDef, row);
  return Math.abs(v - data) <= tol ? data : Math.round(v);
}

/** One line about a bar: matches the table, or a question when it does not. Never a judgement word. */
export function barNote(I, caseDef, row, n, v) {
  const unit = both(I, caseDef.dataset.unit);
  if (v === null || v === undefined || v === "")
    return {
      kind: "empty",
      text: I.S("Type the number from your table.", "Escribe el número de tu tabla."),
    };
  if (Number(v) === valueOf(caseDef, row))
    return {
      kind: "match",
      text: I.S(
        `This bar matches your table: ${v} ${unit}.`,
        `Esta barra coincide con tu tabla: ${v} ${unit}.`,
      ),
    };
  return {
    kind: "ask",
    text: I.S(
      `Your bar for Test ${n} shows ${v}. What number does your table show for Test ${n}?`,
      `Tu barra para la Prueba ${n} muestra ${v}. ¿Qué número muestra tu tabla para la Prueba ${n}?`,
    ),
  };
}

/**
 * Real buttons laid over each bar's column, so a bar can be tapped (or reached with Tab) to choose it.
 * `pick` is the action key: each button carries data-slx-bar="<pick>:<rowId>" and aria-pressed when highlighted.
 */
function pickLayerHTML(I, caseDef, rows, pick, highlight, values) {
  const all = caseDef.dataset.rows;
  const unit = both(I, caseDef.dataset.unit);
  const pct = (v, of) => `${((v / of) * 100).toFixed(3)}%`;
  const box = `left:${pct(PAD.l, W)};right:${pct(PAD.r, W)};top:${pct(PAD.t - 30, H)};bottom:${pct(PAD.b - 34, H)};grid-template-columns:repeat(${Math.max(rows.length, 1)},1fr)`;
  const buttons = rows
    .map((r) => {
      const num = all.findIndex((x) => x.id === r.id) + 1;
      const v = values && values[r.id] !== undefined ? values[r.id] : valueOf(caseDef, r);
      const on = highlight.includes(r.id);
      const name = `${I.S("Test", "Prueba")} ${num} · ${condText(I, caseDef, r.conditions)} · ${v} ${unit}`;
      return `<button type="button" class="slx-pick" data-slx-bar="${esc(pick)}:${r.id}" aria-pressed="${on}" aria-label="${esc(name)}"></button>`;
    })
    .join("");
  return `<div class="slx-picks" role="group" aria-label="${esc(I.S("Tap a bar to choose it", "Toca una barra para elegirla"))}" style="${box}">${buttons}</div>`;
}

/**
 * rows: dataset rows to draw. values: { [rowId]: number } drawn instead of the data (a missing id = not drawn yet);
 * omit `values` to draw the data itself. highlight: row ids drawn as selected. pick: makes every bar a button
 * (see pickLayerHTML). compact: a smaller chart for thumbnails; the text version folds into a <details>.
 */
export function barChartHTML(
  I,
  caseDef,
  rows,
  { values = null, highlight = [], uid = "slx-chart", pick = "", compact = false } = {},
) {
  const all = caseDef.dataset.rows;
  const unit = both(I, caseDef.dataset.unit);
  const max = chartAxisMax(caseDef, rows);
  const n = Math.max(rows.length, 1);
  const band = (W - PAD.l - PAD.r) / n;
  const bw = Math.min(64, band * 0.62);
  const focus = caseDef.focus || caseDef.variables[0].id;
  const fv = (caseDef.variables.find((v) => v.id === focus) || caseDef.variables[0]).values.map(
    (v) => v.id,
  );
  const parts = [5, 4, 2].find((k) => Number.isInteger(max / k)) || 1;
  const ticks = Array.from({ length: parts + 1 }, (_, k) => (max / parts) * k);
  const grid = ticks
    .map((tv) => {
      const y = PAD.t + PLOT_H - (tv / max) * PLOT_H;
      return `<line x1="${PAD.l}" y1="${y}" x2="${W - PAD.r}" y2="${y}" stroke="#e4ddd2" stroke-width="1.5"/><text x="${PAD.l - 10}" y="${y + 6}" text-anchor="end" font-size="17" fill="${C.ink}">${tv}</text>`;
    })
    .join("");
  const bars = rows
    .map((r, i) => {
      const num = all.findIndex((x) => x.id === r.id) + 1;
      const got = values ? values[r.id] : valueOf(caseDef, r);
      const has = got !== undefined && got !== null && got !== "";
      const v = has ? Math.max(0, Math.min(Number(got), max)) : 0;
      const h = (v / max) * PLOT_H;
      const x = PAD.l + band * i + (band - bw) / 2;
      const y = PAD.t + PLOT_H - h;
      const sel = highlight.includes(r.id);
      const fill = FILLS[Math.max(0, fv.indexOf(r.conditions[focus])) % FILLS.length];
      const bar = has
        ? `<rect class="slx-bar" data-row="${r.id}" data-value="${Number(got)}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="5" fill="${fill}" ${ln(sel ? 5 : 2.5)}/><text x="${(x + bw / 2).toFixed(1)}" y="${(y - 8).toFixed(1)}" text-anchor="middle" font-size="18" font-weight="700" fill="${C.ink}">${Number(got)}</text>`
        : `<rect class="slx-bar is-empty" data-row="${r.id}" data-value="" x="${x.toFixed(1)}" y="${PAD.t + PLOT_H - 22}" width="${bw.toFixed(1)}" height="22" rx="5" fill="none" stroke="${C.navy}" stroke-width="2" stroke-dasharray="5 4"/><text x="${(x + bw / 2).toFixed(1)}" y="${PAD.t + PLOT_H - 30}" text-anchor="middle" font-size="18" fill="${C.ink}">?</text>`;
      const mark = sel
        ? `<path d="M${(x + bw / 2 - 9).toFixed(1)} ${PAD.t - 26} h18 l-9 12 z" fill="${C.navy}"/>`
        : "";
      return `${bar}${mark}<text x="${(x + bw / 2).toFixed(1)}" y="${H - PAD.b + 26}" text-anchor="middle" font-size="18" font-weight="700" fill="${C.ink}">${num}</text>`;
    })
    .join("");
  const axes = `<line x1="${PAD.l}" y1="${PAD.t + PLOT_H}" x2="${W - PAD.r}" y2="${PAD.t + PLOT_H}" ${ln()}/><line x1="${PAD.l}" y1="${PAD.t - 6}" x2="${PAD.l}" y2="${PAD.t + PLOT_H}" ${ln()}/><text x="${(PAD.l + W - PAD.r) / 2}" y="${H - 6}" text-anchor="middle" font-size="17" fill="${C.ink}">${esc(I.S("Test number", "Número de prueba"))}</text><text x="18" y="${PAD.t + PLOT_H / 2}" text-anchor="middle" font-size="17" fill="${C.ink}" transform="rotate(-90 18 ${PAD.t + PLOT_H / 2})">${esc(unit)}</text>`;
  const line = (r) => {
    const num = all.findIndex((x) => x.id === r.id) + 1;
    const lead = `${I.S("Test", "Prueba")} ${num} · ${condText(I, caseDef, r.conditions)}`;
    if (!values) return `${lead}: ${valueOf(caseDef, r)} ${unit}.`;
    const v = values[r.id];
    const bar =
      v === undefined || v === null || v === ""
        ? I.S("your bar is not drawn yet", "tu barra todavía no está dibujada")
        : `${I.S("your bar", "tu barra")} ${v}`;
    return `${lead}: ${I.S("your table says", "tu tabla dice")} ${valueOf(caseDef, r)} ${unit}; ${bar}.`;
  };
  const desc = rows.map(line).join(" ");
  const title = `${I.S("Bar chart", "Gráfica de barras")}: ${both(I, caseDef.measure.label)}`;
  const legend = (caseDef.variables.find((v) => v.id === focus) || caseDef.variables[0]).values
    .map(
      (v, i) =>
        `<li><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><rect x="2" y="2" width="16" height="16" rx="4" fill="${FILLS[i % FILLS.length]}" stroke="${C.navy}" stroke-width="2"/></svg>${esc(I.S(v.label.en, v.label.es))}</li>`,
    )
    .join("");
  const svgOpen = `<svg class="slx-svg slx-chart-svg"`;
  const alt = compact
    ? `<details class="sl-alt slx-alt-fold"><summary>${esc(I.S("Text version", "Versión en texto"))}</summary><p>${esc(desc)}</p></details>`
    : `<div class="sl-alt"><p class="ex-kicker">${esc(I.S("Text version of the bar chart", "Versión en texto de la gráfica de barras"))}</p><p>${esc(desc)}</p></div>`;
  const keyList = compact
    ? ""
    : `<ul class="slx-legend" aria-label="${esc(I.S("Colour key", "Clave de colores"))}">${legend}</ul>`;
  const picks = pick ? pickLayerHTML(I, caseDef, rows, pick, highlight, values) : "";
  return raw(
    `<figure class="slx-chart${compact ? " is-compact" : ""}${pick ? " is-pick" : ""}" data-slx-chart><figcaption class="slx-chart-title">${esc(both(I, caseDef.measure.label))}</figcaption><div class="slx-plot">${svgOpen} viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${uid}-t ${uid}-d" focusable="false" xmlns="http://www.w3.org/2000/svg"><title id="${uid}-t">${esc(title)}</title><desc id="${uid}-d">${esc(desc)}</desc>${grid}${axes}${bars}</svg>${picks}</div>${keyList}${alt}</figure>`,
  );
}
