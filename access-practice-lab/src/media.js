// Pictures, charts and tables. Charts and tables are drawn from data so they
// are always crisp, readable at any size, printable, and screen-reader friendly.
import { BASE, asList, esc, html, raw } from "./util.js";

const PALETTE = ["#1f766f", "#e07a5f", "#3d405b", "#81b29a", "#f2a541", "#6d597a"];

export function pictureHTML(pic, { size = "" } = {}) {
  if (!pic?.src) return "";
  return html`<figure class="lab-picture ${size}">
    <img
      src="${BASE}/${pic.src}"
      alt="${pic.alt}"
      loading="lazy"
      decoding="async"
      width="640"
      height="400"
    />
  </figure>`;
}

export function picturesHTML(item) {
  const pics = asList(item.picture);
  if (!pics.length) return "";
  return html`<div class="lab-pictures ${pics.length > 1 ? "is-multi" : ""}">
    ${pics.map((p) => pictureHTML(p))}
  </div>`;
}

function niceMax(v) {
  if (v <= 5) return 5;
  const pow = 10 ** Math.floor(Math.log10(v));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => v / s <= 5) || pow * 10;
  return Math.ceil(v / step) * step;
}

function barChartSVG(chart, idx) {
  const data = chart.data || [];
  const W = 560;
  const H = 300;
  const pad = { l: 48, r: 16, t: 16, b: 56 };
  const max = niceMax(Math.max(...data.map((d) => d.value), 1));
  const steps = 5;
  const bw = (W - pad.l - pad.r) / data.length;
  const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const grid = Array.from({ length: steps + 1 }, (_, i) => {
    const v = (max / steps) * i;
    return `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${pad.l - 8}" y="${y(v) + 4}" class="tick" text-anchor="end">${+v.toFixed(1)}</text>`;
  }).join("");
  const bars = data
    .map((d, i) => {
      const x = pad.l + i * bw + bw * 0.18;
      const w = bw * 0.64;
      const top = y(d.value);
      const color = PALETTE[(i + idx) % PALETTE.length];
      return `<rect x="${x}" y="${top}" width="${w}" height="${H - pad.b - top}" rx="6" fill="${color}"/>
        <text x="${x + w / 2}" y="${top - 6}" class="val" text-anchor="middle">${esc(d.value)}</text>
        <text x="${x + w / 2}" y="${H - pad.b + 20}" class="lbl" text-anchor="middle">${esc(d.label)}</text>`;
    })
    .join("");
  const unit = chart.unit
    ? `<text x="14" y="${(H - pad.b) / 2}" class="unit" transform="rotate(-90 14 ${(H - pad.b) / 2})" text-anchor="middle">${esc(chart.unit)}</text>`
    : "";
  return `<svg viewBox="0 0 ${W} ${H}" class="lab-chart-svg" aria-hidden="true" focusable="false">${grid}${unit}<line x1="${pad.l}" x2="${W - pad.r}" y1="${H - pad.b}" y2="${H - pad.b}" class="axis"/>${bars}</svg>`;
}

function pictographHTML(chart) {
  const icon = chart.icon || "●";
  const per = chart.per || 1;
  return `<div class="lab-pictograph" aria-hidden="true">${(chart.data || [])
    .map(
      (d) =>
        `<div class="pg-row"><span class="pg-label">${esc(d.label)}</span><span class="pg-icons">${esc(icon.repeat(Math.max(0, Math.round(d.value / per))))}</span></div>`,
    )
    .join(
      "",
    )}${per > 1 ? `<p class="pg-key">Key: ${esc(icon)} = ${esc(per)} ${esc(chart.unit || "")}</p>` : ""}</div>`;
}

export function chartHTML(chart, idx = 0) {
  const data = chart.data || [];
  const summary = `${chart.title || "Chart"}: ${data.map((d) => `${d.label} ${d.value}`).join(", ")}${chart.unit ? ` ${chart.unit}` : ""}.`;
  const body = chart.kind === "pictograph" ? pictographHTML(chart) : barChartSVG(chart, idx);
  return html`<figure class="lab-chart" role="img" aria-label="${summary}">
    ${chart.title ? html`<figcaption>${chart.title}</figcaption>` : ""}${raw(body)}
  </figure>`;
}

export function chartsHTML(item) {
  const charts = asList(item.chart);
  if (!charts.length) return "";
  return html`<div class="lab-charts ${charts.length > 1 ? "is-multi" : ""}">
    ${charts.map((c, i) => chartHTML(c, i * 2))}
  </div>`;
}

export function tableHTML(table) {
  if (!table) return "";
  return html`<div class="lab-table-wrap">
    <table class="lab-table">
      ${
        table.caption
          ? html`<caption>
              ${table.caption}
            </caption>`
          : ""
      }
      <thead>
        <tr>
          ${table.headers.map((h) => html`<th scope="col">${h}</th>`)}
        </tr>
      </thead>
      <tbody>
        ${table.rows.map(
          (r) =>
            html`<tr>
              ${r.map((c, i) => (i === 0 ? html`<th scope="row">${c}</th>` : html`<td>${c}</td>`))}
            </tr>`,
        )}
      </tbody>
    </table>
  </div>`;
}

/** Every visual an item carries, in reading order. */
export const visualsHTML = (item) =>
  html`${picturesHTML(item)}${chartsHTML(item)}${tableHTML(item.table)}`;
