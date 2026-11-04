/**
 * Live linked models for the five v2 families. Pure: (project, design, ctx) -> HTML string.
 * Every picture is drawn from the SAME design object, so changing a quantity changes every view.
 * A computed value stays "?" until the matching math check matches (or Teacher view is on), so a model
 * is a tool for reasoning rather than a place to read the answer. Given quantities always show.
 */
import { fieldsFor, format, model } from "./math.mjs";
import { WORDS } from "./feedback-division.mjs";

import { areaModels, coordinatesModels, solidsModels } from "./models-space.mjs";
import { discoveryModels, equationsModels, relationshipsModels, synthesisModels } from "./models-algebra.mjs";
import { BLUE, esc, f2, figure, INK, LIME, line, MINT, MUTED, ORANGE, PEACH, rect, svg, TEAL, text, unknown, usd, W } from "./models-kit.mjs";
export { esc };

/** Stepper size for a field: 1 for integers, finer for small decimals. */
export function stepFor(field) {
  if (field.integer) return 1;
  if (field.min < 0.5) return 0.125;
  return field.max <= 12 ? 0.25 : 0.5;
}
export const clampStep = (field, value) => {
  const step = stepFor(field);
  const snapped = Math.round(value / step) * step;
  return Math.min(field.max, Math.max(field.min, Number(snapped.toFixed(3))));
};

/** Steppers and number boxes for the fields a family's models use. Keyboard operable: every control is a button or input. */
export function controlsHTML(project, design, editable) {
  const fields = fieldsFor(project).filter((f) => !f.text);
  if (!fields.length) return "";
  return `<div class="wb-controls" role="group" aria-label="Change the quantities in the models">${fields
    .map((f) => {
      const id = `wb-${f.key}`;
      return `<div class="wb-field"><label for="${id}">${esc(f.label)}</label><div class="stepper"><button type="button" class="secondary small" data-wb-step="${f.key}" data-dir="-1" aria-label="Decrease: ${esc(f.label)}" ${editable ? "" : "disabled"}>−</button><input id="${id}" data-wb-field="${f.key}" type="text" inputmode="decimal" value="${esc(design[f.key] ?? "")}" ${editable ? "" : "readonly"} maxlength="12" autocomplete="off"><button type="button" class="secondary small" data-wb-step="${f.key}" data-dir="1" aria-label="Increase: ${esc(f.label)}" ${editable ? "" : "disabled"}>+</button></div></div>`;
    })
    .join("")}</div>`;
}

/* ---------------------------------------------------------------- ratio */
function ratioModels(project, v, ctx) {
  const { a, b, c, d, e, f, g } = v;
  const sport = project.id === "unit-3-b";
  const nameA = sport ? "Points" : "Part A", nameB = sport ? "Games" : "Part B";
  const rv = (id, value) => (ctx.reveal(id) ? f2(value) : unknown);
  const table = `<div class="table-scroll"><table class="wb-table"><caption>Ratio table: both rows use the same factor</caption><thead><tr><th scope="col">Quantity</th><th scope="col">Base ratio</th><th scope="col">Times ${c}</th></tr></thead><tbody><tr><th scope="row">${nameA}</th><td>${f2(a)}</td><td>${rv("scale-a", a * c)}</td></tr><tr><th scope="row">${nameB}</th><td>${f2(b)}</td><td>${rv("scale-b", b * c)}</td></tr><tr><th scope="row">${nameA} for 1 ${sport ? "game" : "of B"}</th><td>${rv("base-rate", a / b)}</td><td>${rv("base-rate", a / b)}</td></tr></tbody></table></div>`;
  // double number line: c equal steps, tick k on both lines at the same x
  const x0 = 70, x1 = 340, step = (x1 - x0) / c;
  let dnl = line(x0, 40, x1, 40, TEAL) + line(x0, 100, x1, 100, ORANGE) + text(4, 44, nameA, { size: 12, bold: true }) + text(4, 104, nameB, { size: 12, bold: true });
  for (let k = 0; k <= c; k++) {
    const x = x0 + k * step;
    dnl += line(x, 33, x, 47, TEAL) + line(x, 93, x, 107, ORANGE) + line(x, 47, x, 93, "#aab8b1", 'stroke-dasharray="3 3" stroke-width="1"');
  }
  dnl += text(x0, 26, "0", { anchor: "middle" }) + text(x0, 126, "0", { anchor: "middle" });
  dnl += text(x0 + step, 26, f2(a), { anchor: "middle", bold: true }) + text(x0 + step, 126, f2(b), { anchor: "middle", bold: true });
  const lastA = ctx.reveal("scale-a") ? f2(a * c) : "?", lastB = ctx.reveal("scale-b") ? f2(b * c) : "?";
  if (c > 1) dnl += text(x1, 26, lastA, { anchor: "end", bold: true }) + text(x1, 126, lastB, { anchor: "end", bold: true });
  dnl += text(W / 2, 70, `${c} equal steps`, { anchor: "middle", size: 12, fill: MUTED });
  const dnlSvg = svg(`Double number line. ${nameA} and ${nameB} each take ${c} equal steps from 0; one step is ${f2(a)} and ${f2(b)}.`, 140, dnl);
  // tape diagram: c equal blocks per row
  const bw = (x1 - x0) / c;
  let tape = text(4, 34, nameA, { size: 12, bold: true }) + text(4, 84, nameB, { size: 12, bold: true });
  for (let k = 0; k < c; k++) {
    tape += rect(x0 + k * bw, 14, bw, 28, k % 2 ? LIME : MINT) + rect(x0 + k * bw, 64, bw, 28, k % 2 ? PEACH : "#fbe5da", ORANGE);
    if (bw >= 24 || k === 0) tape += text(x0 + k * bw + bw / 2, 33, f2(a), { anchor: "middle", size: bw >= 24 ? 12 : 10 }) + text(x0 + k * bw + bw / 2, 83, f2(b), { anchor: "middle", size: bw >= 24 ? 12 : 10 });
  }
  tape += text(x0, 112, `${c} equal blocks in each row`, { size: 12, fill: MUTED });
  const tapeSvg = svg(`Tape diagram. Each row has ${c} equal blocks; blocks hold ${f2(a)} and ${f2(b)}.`, 124, tape);
  const rate = (id, total, qty) => (ctx.reveal(id) ? f2(total / qty) : unknown);
  const offers = `<div class="table-scroll"><table class="wb-table"><caption>${sport ? "Players compared per game" : "Offers compared per unit"}</caption><thead><tr><th scope="col">${sport ? "Player" : "Offer"}</th><th scope="col">${sport ? "Points" : "Total cost ($)"}</th><th scope="col">${sport ? "Games" : "Quantity"}</th><th scope="col">${sport ? "Points per game" : "Cost per unit ($)"}</th></tr></thead><tbody><tr><th scope="row">A</th><td>${f2(d)}</td><td>${f2(e)}</td><td>${rate("rate-a", d, e)}</td></tr><tr><th scope="row">B</th><td>${f2(f)}</td><td>${f2(g)}</td><td>${rate("rate-b", f, g)}</td></tr></tbody></table></div>`;
  return [
    figure("Ratio table", table, `The base ratio ${f2(a)} : ${f2(b)} is multiplied by ${c} in both rows.`),
    figure("Double number line", dnlSvg, "Matching ticks on the two lines are equivalent pairs."),
    figure("Tape diagram", tapeSvg, "Equal blocks show why both parts use the same factor."),
    figure("Compare by rate", offers, "A fair comparison uses the amount for ONE unit."),
  ].join("");
}

/* -------------------------------------------------------------- percent */
function percentModels(project, v, ctx) {
  const { a, b, c } = v;
  const discount = (a * b) / 100, sale = a - discount;
  const money = (id, value) => (ctx.reveal(id) ? usd(Math.round(value * 100) / 100) : "$?");
  const bx = 20, bw = 320, cut = (bw * b) / 100;
  let bar = text(bx, 18, `Original price ${usd(a)} = 100%`, { bold: true }) + rect(bx, 28, cut, 38, PEACH, ORANGE) + rect(bx + cut, 28, bw - cut, 38, LIME);
  bar += text(bx + cut / 2, 52, `${b}%`, { anchor: "middle", bold: true, size: cut > 36 ? 13 : 11 }) + text(bx + cut + (bw - cut) / 2, 52, `${f2(100 - b)}%`, { anchor: "middle", bold: true });
  for (const t of [0, 25, 50, 75, 100]) bar += line(bx + (bw * t) / 100, 66, bx + (bw * t) / 100, 74) + text(bx + (bw * t) / 100, 88, `${t}%`, { anchor: "middle", size: 11, fill: MUTED });
  bar += text(bx, 112, `Discount: ${money("discount", discount)}`, { fill: ORANGE, bold: true }) + text(bx + bw, 112, `Price after discount: ${money("sale", sale)}`, { anchor: "end", fill: TEAL, bold: true });
  const taxW = (260 * c) / 100;
  let taxBar = text(bx, 18, `Subtotal after discount = 100% of the tax base`, { bold: true }) + rect(bx, 28, 260, 34, LIME) + rect(bx + 260, 28, Math.max(taxW, 2), 34, PEACH, ORANGE);
  taxBar += text(bx + 130, 50, "100%", { anchor: "middle", bold: true }) + text(bx + 260 + Math.max(taxW, 2) / 2, 78, `${f2(c)}% tax`, { anchor: "middle", size: 12, fill: ORANGE, bold: true });
  taxBar += text(bx, 106, `Tax: ${money("tax", Math.round(((sale * c) / 100) * 100) / 100)}`, { fill: ORANGE, bold: true }) + text(bx + bw, 106, `Receipt total: ${money("total", sale + Math.round(((sale * c) / 100) * 100) / 100)}`, { anchor: "end", fill: TEAL, bold: true });
  let cells = "";
  for (let i = 0; i < 100; i++) cells += `<rect x="${20 + (i % 10) * 30}" y="${10 + Math.floor(i / 10) * 24}" width="28" height="22" fill="${i < b ? ORANGE : MINT}" stroke="#536e65" data-cell="${i + 1}"/>`;
  const grid = `<div class="wb-slider" id="wb-grid" role="slider" tabindex="0" data-wb-grid aria-label="Discount percent, shown on a 10 by 10 grid" aria-valuemin="${fieldsFor(project).find((x) => x.key === "b").min}" aria-valuemax="${fieldsFor(project).find((x) => x.key === "b").max}" aria-valuenow="${b}" aria-valuetext="${b} of 100 squares shaded, ${b} percent">${`<svg class="wb-svg" viewBox="0 0 ${W} 256" aria-hidden="true" focusable="false"><rect width="${W}" height="256" fill="#fff"/>${cells}</svg>`}</div>`;
  return [
    figure("Percent bar: discount", svg(`Percent bar. The original price is the whole bar; ${b} percent is shaded as the discount and ${f2(100 - b)} percent remains.`, 124, bar), "The shaded part is the discount; the rest is what you pay before tax."),
    figure("Percent bar: tax", svg(`Tax bar. The discounted subtotal is 100 percent of the tax base; the tax is ${f2(c)} percent more.`, 118, taxBar), "Tax is a percent of the discounted subtotal, not of the original price."),
    figure("10 × 10 grid", grid, `${b} of 100 squares are shaded. Click a square, or focus the grid and use the arrow keys (Page Up and Page Down move by 10).`),
  ].join("");
}

/* ----------------------------------------------------------- statistics */
const niceStep = (span) => {
  const raw = span / 7, pow = 10 ** Math.floor(Math.log10(raw || 1)), n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
};
export const defaultBin = (data) => {
  const span = Math.max(...data) - Math.min(...data);
  return Math.max(0.5, Math.ceil(span / 6));
};
export function statisticsEditor(data, editable) {
  const rows = data
    .map(
      (value, i) =>
        `<div class="wb-datum"><label for="wb-d${i}" class="wb-datum-label">Value ${i + 1}</label><div class="stepper"><button type="button" class="secondary small" data-wb-datum="${i}" data-dir="-1" aria-label="Decrease value ${i + 1}" ${editable ? "" : "disabled"}>−</button><input id="wb-d${i}" data-wb-datum-input="${i}" type="text" inputmode="decimal" value="${esc(value)}" maxlength="10" autocomplete="off" ${editable ? "" : "readonly"}><button type="button" class="secondary small" data-wb-datum="${i}" data-dir="1" aria-label="Increase value ${i + 1}" ${editable ? "" : "disabled"}>+</button></div></div>`,
    )
    .join("");
  return `<div class="wb-controls" role="group" aria-label="Edit the data set (6 to 12 values)"><div class="wb-datum-grid">${rows}</div><p class="actions compact"><button type="button" class="secondary small" data-wb="add-value" ${editable && data.length < 12 ? "" : "disabled"}>Add a value</button><button type="button" class="secondary small" data-wb="remove-value" ${editable && data.length > 6 ? "" : "disabled"}>Remove the last value</button><button type="button" class="secondary small" data-wb="sort-values" ${editable ? "" : "disabled"}>Sort the values</button></p></div>`;
}
function statisticsModels(project, v, ctx) {
  const data = [...v.data].sort((p, q) => p - q), n = data.length, lo = data[0], hi = data.at(-1);
  const span = hi - lo || 1, pad = span * 0.06 + 0.5, x0 = 24, x1 = 340;
  const x = (val) => x0 + ((val - (lo - pad)) / (span + 2 * pad)) * (x1 - x0);
  const step = niceStep(span);
  const stackMax = Math.max(...Object.values(data.reduce((m, val) => ((m[Math.round(val * 100)] = (m[Math.round(val * 100)] || 0) + 1), m), {})));
  const base = 30 + stackMax * 13;
  let ticks = "";
  for (let t = Math.ceil((lo - pad) / step) * step; t <= hi + pad; t += step) ticks += line(x(t), base, x(t), base + 6) + text(x(t), base + 20, f2(t), { anchor: "middle", size: 11, fill: MUTED });
  let dots = line(x0, base, x1, base, INK);
  const stack = new Map();
  for (const val of data) {
    const key = Math.round(val * 100) / 100, k = stack.get(key) || 0;
    stack.set(key, k + 1);
    dots += `<circle cx="${f2(x(val))}" cy="${base - 8 - k * 13}" r="6" fill="${TEAL}"/>`;
  }
  const mean = data.reduce((p, q) => p + q, 0) / n, mid = Math.floor(n / 2);
  const med = (arr) => (arr.length % 2 ? arr[(arr.length - 1) / 2] : (arr[arr.length / 2 - 1] + arr[arr.length / 2]) / 2);
  const lower = data.slice(0, mid), upper = data.slice(n % 2 ? mid + 1 : mid), q1 = med(lower), q3 = med(upper);
  let marks = "", legend = [];
  if (ctx.reveal("mean")) { marks += line(x(mean), 12, x(mean), base, ORANGE, 'stroke-width="3"'); legend.push(`mean ${f2(mean)}`); }
  if (ctx.reveal("median")) { marks += line(x(med(data)), 12, x(med(data)), base, BLUE, 'stroke-dasharray="6 4" stroke-width="3"'); legend.push(`median ${f2(med(data))}`); }
  if (ctx.reveal("range")) { marks += line(x(lo), base + 38, x(hi), base + 38, INK) + line(x(lo), base + 33, x(lo), base + 43, INK) + line(x(hi), base + 33, x(hi), base + 43, INK) + text((x(lo) + x(hi)) / 2, base + 56, `range ${f2(hi - lo)}`, { anchor: "middle", size: 11 }); legend.push(`range ${f2(hi - lo)}`); }
  if (ctx.reveal("q1") && ctx.reveal("iqr")) { marks += `<rect x="${f2(x(q1))}" y="${base + 66}" width="${f2(x(q3) - x(q1))}" height="14" fill="${MINT}" stroke="${TEAL}" stroke-width="2"/>` + text((x(q1) + x(q3)) / 2, base + 96, `middle half: Q1 ${f2(q1)} to Q3 ${f2(q3)}`, { anchor: "middle", size: 11 }); legend.push(`Q1 ${f2(q1)}, Q3 ${f2(q3)}`); }
  const hiddenLeft = [["mean", "mean"], ["median", "median"], ["range", "range"]].filter(([id]) => !ctx.reveal(id)).map(([, name]) => name).concat(ctx.reveal("q1") && ctx.reveal("iqr") ? [] : ["middle half"]);
  const dotSvg = svg(`Dot plot of ${n} values from ${f2(lo)} to ${f2(hi)}. Each dot is one observation.${legend.length ? " Marked: " + legend.join(", ") + "." : ""}`, ctx.reveal("q1") && ctx.reveal("iqr") ? base + 106 : ctx.reveal("range") ? base + 64 : base + 30, ticks + dots + marks);
  // histogram
  const bin = Math.max(0.5, Number(ctx.bin) || defaultBin(data)), start = Math.floor(lo / bin) * bin;
  const bins = Math.min(40, Math.floor((hi - start) / bin) + 1), counts = Array.from({ length: bins }, () => 0);
  for (const val of data) counts[Math.min(bins - 1, Math.floor((val - start) / bin))]++;
  const top = Math.max(...counts), bwid = (x1 - x0) / bins;
  let hist = line(x0, 120, x1, 120, INK);
  const rows = counts.map((cnt, i) => {
    hist += `<rect x="${f2(x0 + i * bwid)}" y="${f2(120 - (cnt / top) * 90)}" width="${f2(bwid - 1)}" height="${f2((cnt / top) * 90)}" fill="${i % 2 ? TEAL : "#2c7a6c"}"/>` + (cnt ? text(x0 + i * bwid + bwid / 2, 116 - (cnt / top) * 90, String(cnt), { anchor: "middle", size: 11, bold: true }) : "");
    if (bins <= 12 || i % 2 === 0) hist += text(x0 + i * bwid, 136, f2(start + i * bin), { size: 10, fill: MUTED });
    return `<tr><th scope="row">${f2(start + i * bin)} to under ${f2(start + (i + 1) * bin)}</th><td>${cnt}</td></tr>`;
  });
  const histSvg = svg(`Histogram with bin width ${f2(bin)}. ${counts.map((cnt, i) => `${f2(start + i * bin)} to under ${f2(start + (i + 1) * bin)}: ${cnt}`).join("; ")}.`, 146, hist);
  const binControl = `<div class="wb-field"><label for="wb-bin">Histogram bin width</label><div class="stepper"><button type="button" class="secondary small" data-wb-bin="-1" aria-label="Narrower bins">−</button><input id="wb-bin" data-wb-bin-input type="text" inputmode="decimal" value="${f2(bin)}" maxlength="6" autocomplete="off"><button type="button" class="secondary small" data-wb-bin="1" aria-label="Wider bins">+</button></div></div>`;
  return [
    figure("Dot plot", dotSvg + (hiddenLeft.length ? `<p class="wb-pending"><span class="wb-unknown">?</span> Not shown yet: ${hiddenLeft.join(", ")}.</p>` : ""), "Each dot is one value. Mean, median, range and the middle half appear after you check them."),
    figure("Histogram", binControl + histSvg + `<details class="wb-details"><summary>Read the histogram as a table</summary><div class="table-scroll"><table class="wb-table"><caption>Counts per bin</caption><thead><tr><th scope="col">Bin</th><th scope="col">Count</th></tr></thead><tbody>${rows.join("")}</tbody></table></div></details>`, "Change the bin width to see how the shape of the data depends on how it is grouped."),
  ].join("");
}

/* ---------------------------------------------------------- expressions */
/** Test inputs for the equivalence check, kept away from the inputs the six checks already use. */
export const testInputs = (c) => [2, 3, 4, 5, 6, 7, 8, 9].filter((x) => x !== c && x !== c + 1).slice(0, 3);
export function equivalenceRows(v, A, B) {
  const { a, b, d } = v;
  return testInputs(v.c).map((x) => {
    const original = a * (x + b) + d ** 2, yours = Number.isFinite(A) && Number.isFinite(B) ? A * x + B : NaN;
    return { x, original, yours, same: Number.isFinite(yours) && Math.abs(original - yours) < 1e-9 };
  });
}
function expressionModels(project, v, ctx) {
  const { a, b, c, d } = v;
  const ux = 150, ub = 130, rowH = Math.min(26, 150 / a), h = a * rowH, left = 40, top = 34;
  let area = text(left, 18, "x", { anchor: "start" }) ;
  area = text(left + ux / 2, 22, "x", { anchor: "middle", bold: true }) + text(left + ux + ub / 2, 22, `+ ${b}`, { anchor: "middle", bold: true });
  area += rect(left, top, ux, h, LIME) + rect(left + ux, top, ub, h, PEACH, ORANGE);
  for (let r = 1; r < a; r++) area += line(left, top + r * rowH, left + ux + ub, top + r * rowH, "#8aa398", 'stroke-width="1"');
  for (let k = 1; k < b; k++) area += line(left + ux + (ub * k) / b, top, left + ux + (ub * k) / b, top + h, "#c28b78", 'stroke-width="1"');
  area += text(left - 6, top + h / 2 + 5, `${a}`, { anchor: "end", bold: true });
  area += text(left + ux / 2, top + h / 2 + 5, ctx.reveal("coefficient") ? `${a}x` : "?x", { anchor: "middle", bold: true });
  area += text(left + ux + ub / 2, top + h / 2 + 5, ctx.reveal("constant") ? `${a * b}` : "?", { anchor: "middle", bold: true });
  const sqSize = Math.min(54, 40 + d * 2), sqY = top + h + 24;
  area += rect(left, sqY, sqSize, sqSize, MINT) + text(left + sqSize / 2, sqY + sqSize / 2 + 5, ctx.reveal("square") ? `${d * d}` : "?", { anchor: "middle", bold: true }) + text(left + sqSize + 10, sqY + sqSize / 2 + 5, `a ${d} by ${d} square is ${d}²`, { size: 12, fill: MUTED });
  const areaSvg = svg(`Area model for ${a}(x + ${b}) plus ${d} squared. A rectangle ${a} rows tall is split into an x-part and a ${b}-part; a separate ${d} by ${d} square shows ${d} squared.`, sqY + sqSize + 14, area);
  const A = ctx.builder?.A ?? "", B = ctx.builder?.B ?? "";
  const nA = Number(String(A).trim() === "" ? NaN : A), nB = Number(String(B).trim() === "" ? NaN : B);
  const rows = equivalenceRows(v, nA, nB);
  const complete = Number.isFinite(nA) && Number.isFinite(nB);
  const verdict = !complete ? "Type a number for both boxes to test your expanded rule." : rows.every((r) => r.same) ? `Your rule ${f2(nA)}x + ${f2(nB)} matches the original at all ${rows.length} test inputs.` : `Your rule does not match the original at ${rows.filter((r) => !r.same).map((r) => `x = ${r.x}`).join(" and ")}.`;
  const builder = `<div class="wb-controls"><p>Original rule: <strong>${a}(x + ${b}) + ${d}²</strong></p><div class="wb-builder"><label for="wb-A">Number in front of x</label><input id="wb-A" data-wb-builder="A" type="text" inputmode="decimal" value="${esc(A)}" maxlength="10" autocomplete="off"><label for="wb-B">Number added at the end</label><input id="wb-B" data-wb-builder="B" type="text" inputmode="decimal" value="${esc(B)}" maxlength="10" autocomplete="off"></div><p class="wb-expanded" aria-live="polite">Your expanded rule: <strong>${complete ? `${f2(nA)}x + ${f2(nB)}` : "?x + ?"}</strong></p><div class="table-scroll"><table class="wb-table"><caption>Your rule compared with the original at three inputs</caption><thead><tr><th scope="col">x</th><th scope="col">Original</th><th scope="col">Your rule</th><th scope="col">Equal</th></tr></thead><tbody>${rows.map((r) => `<tr><th scope="row">${r.x}</th><td>${r.original}</td><td>${complete ? f2(r.yours) : "?"}</td><td>${!complete ? "Not tested" : r.same ? "Same" : "Different"}</td></tr>`).join("")}</tbody></table></div><p class="wb-verdict" role="status">${esc(verdict)}</p></div>`;
  return [
    figure("Area model of the rule", areaSvg, `The ${a} multiplies BOTH parts of (x + ${b}); the square is added after.`),
    figure("Equivalent expression builder", builder, "Matching a few inputs is evidence. Your explanation of why they always match is judged by your teacher."),
  ].join("");
}

/* ------------------------------------------------------------- division */
function ribbon(total, unit, o) {
  const x0 = 20, rw = 320, segs = Math.ceil(total / unit - 1e-9), full = Math.floor((total + 1e-9) / unit), partial = total - full * unit > 1e-9;
  let body = text(x0, 16, o.title, { bold: true });
  if (segs > 60) return { body: body + text(x0, 50, "Too many pieces to draw one by one.", { size: 12 }) + rect(x0, 62, rw, 30, MINT), height: 110 };
  for (let k = 0; k < segs; k++) {
    const w = Math.min(unit, total - k * unit) / total * rw, isPartial = partial && k === segs - 1;
    body += rect(x0 + (k * unit * rw) / total, 28, w, 34, isPartial ? PEACH : k % 2 ? LIME : MINT, isPartial ? ORANGE : TEAL, isPartial ? 'stroke-dasharray="5 3"' : "");
  }
  body += text(x0, 82, `0`, { size: 11, fill: MUTED }) + text(x0 + rw, 82, o.totalLabel, { size: 11, fill: MUTED, anchor: "end" });
  body += text(x0, 100, o.unitLabel, { size: 12, fill: MUTED });
  body += text(x0, 120, o.countLabel, { bold: true, fill: TEAL }) + text(x0 + rw, 120, o.restLabel, { bold: true, fill: ORANGE, anchor: "end" });
  return { body, height: 130 };
}
function divisionModels(project, v, ctx) {
  const { a, b, c, d, e, f } = v, W2 = WORDS[project.id];
  const full = Math.floor(a / b), rem = a % b, packs = Math.floor((c + 1e-9) / d), pieces = Math.floor((e + 1e-9) / f);
  const r = (id, shown) => (ctx.reveal(id) ? shown : "?");
  const seat = ribbon(a, b, { title: `Seating: ${a} ${W2.who} in groups of ${b}`, totalLabel: `${a} ${W2.who}`, unitLabel: `Each block holds ${b}`, countLabel: `${r("groups", Math.ceil(a / b))} ${W2.group}s needed`, restLabel: `${r("remainder", rem)} in the last one` });
  const buy = ribbon(c, d, { title: `Buying: ${usd(c)} budget, ${usd(d)} per pack`, totalLabel: usd(c), unitLabel: `Each block costs ${usd(d)}`, countLabel: `${r("packs", packs)} complete packs`, restLabel: `${ctx.reveal("money") ? usd(Math.round((c - packs * d) * 100) / 100) : "$?"} left` });
  const cut = ribbon(e, f, { title: `Cutting: ${f2(e)} m of ${W2.stuff}, ${f2(f)} m per ${W2.piece}`, totalLabel: `${f2(e)} m`, unitLabel: `Each block is ${f2(f)} m`, countLabel: `${r("quotient", f2(e / f))} pieces in all`, restLabel: `${ctx.reveal("leftover") ? f2(e - pieces * f) : "?"} m left` });
  const label = (s, tail) => `${s}. Whole blocks are full; the dashed block, if any, is only partly filled. ${tail}`;
  return [
    figure("Seating ribbon", svg(label(`Ribbon of ${a} split into blocks of ${b}`, ""), seat.height, seat.body), "Whole groups round up when everyone needs a seat."),
    figure("Supply ribbon", svg(label(`Ribbon of ${usd(c)} split into packs of ${usd(d)}`, ""), buy.height, buy.body), "Only complete packs can be bought, so a partial block is leftover money."),
    figure("Cutting ribbon", svg(label(`Ribbon of ${f2(e)} meters split into pieces of ${f2(f)} meters`, ""), cut.height, cut.body), "The quotient may include a fraction of a piece; the cut list uses whole pieces."),
  ].join("");
}

const BUILDERS = { division: divisionModels, statistics: statisticsModels, ratio: ratioModels, percent: percentModels, expressions: expressionModels, area: areaModels, coordinates: coordinatesModels, equations: equationsModels, relationships: relationshipsModels, solids: solidsModels, discovery: discoveryModels, synthesis: synthesisModels };
export const hasModels = (project) => project.family in BUILDERS;

/** @param ctx {reveal: (checkId) => boolean, bin?: number, builder?: {A..F}, mover?: "A"|"B"} */
export function modelsHTML(project, design, ctx) {
  if (!hasModels(project)) return "";
  const m = model(project, design);
  if (m.errors.length) return `<div class="notice" role="alert"><strong>Check these inputs:</strong><ul>${m.errors.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`;
  return BUILDERS[project.family](project, m.values, ctx);
}
export { format };
