// Data charts: horizontal bar chart, dot plot, histogram. Axis ticks are derived from the data (a 1-2-5 step that
// covers it); no value, label or tick is ever invented. Every bar carries its own value label.

import {
  CAPS,
  COLOR,
  axisTicks,
  both,
  f1,
  fail,
  fmt,
  frame,
  langOf,
  line,
  listIn,
  numberIn,
  result,
  round,
  text,
  textIn,
  textWidth,
} from "./diagram-kit.js";

const W = 640;

const axisTitle = (x, y, s) =>
  s ? text(x, y, s, { size: 14, anchor: "middle", fill: COLOR.muted }) : "";

// ── bar chart ────────────────────────────────────────────────────────────────

/** @param {{categories:Array<{label:string,value:number}>, title:string, unit?:string, lang?:string}} spec */
export function barChartSvg(spec = {}) {
  const lang = langOf(spec);
  const title = textIn(spec.title, "title", { max: CAPS.title });
  const unit = textIn(spec.unit ?? "", "unit", { max: 40, required: false });
  const raw = listIn(spec.categories, "categories", { min: 1, max: CAPS.categories });
  const cats = raw.map((c, i) => ({
    label: textIn(c?.label, `categories[${i}].label`),
    value: numberIn(c?.value, `categories[${i}].value`, { min: 0, max: 1e9 }),
  }));
  const max = Math.max(...cats.map((c) => c.value));
  const axis = axisTicks(0, max > 0 ? max : 1, { target: 5 });
  const labelW = Math.min(
    300,
    Math.max(60, Math.max(...cats.map((c) => textWidth(c.label, 14))) + 14),
  );
  const left = labelW + 12;
  const plotW = W - left - 64;
  const top = 50;
  const row = 28;
  const plotH = cats.length * row;
  const axisY = top + plotH + 6;
  const h = axisY + 52;
  const px = (v) => (v / axis.end) * plotW;
  const g = [text(W / 2, 26, title, { size: 17, anchor: "middle", weight: "700" })];
  for (const t of axis.ticks) {
    g.push(
      line(left + px(t), top, left + px(t), axisY, { stroke: COLOR.grid, width: 0.6, dash: "2 3" }),
    );
    g.push(line(left + px(t), axisY, left + px(t), axisY + 5, { width: 1.5 }));
    g.push(text(left + px(t), axisY + 21, fmt(t, lang), { size: 13, anchor: "middle" }));
  }
  g.push(
    line(left, top, left, axisY, { width: 2 }),
    line(left, axisY, left + plotW, axisY, { width: 2 }),
  );
  g.push(axisTitle(left + plotW / 2, axisY + 42, unit));
  const bars = cats.map((c, i) => {
    const y = top + i * row + 4;
    const len = px(c.value);
    g.push(text(left - 8, y + 15, c.label, { size: 14, anchor: "end" }));
    g.push(
      `<rect data-value="${c.value}" data-length="${f1(len)}" x="${f1(left)}" y="${y}" width="${f1(len)}" height="20" fill="${COLOR.blue}"/>`,
    );
    g.push(text(left + len + 6, y + 15, fmt(c.value, lang), { size: 14, weight: "700" }));
    return { label: c.label, value: c.value, length: len };
  });
  const top1 = cats.reduce((a, c) => (c.value > a.value ? c : a), cats[0]);
  const alt = both((l) =>
    l === "es"
      ? `Gráfica de barras «${title}» con ${cats.length} categoría${cats.length === 1 ? "" : "s"}. El valor más alto es ${fmt(top1.value, l)} (${top1.label}).`
      : `Bar chart "${title}" with ${cats.length} categor${cats.length === 1 ? "y" : "ies"}. The highest value is ${fmt(top1.value)} (${top1.label}).`,
  );
  return result({
    svg: frame({
      p: "bc",
      w: W,
      h,
      title: alt[lang],
      desc: `${alt[lang]} ${lang === "es" ? "Cada barra tiene su valor escrito. La escala empieza en 0." : "Each bar has its value written beside it. The scale starts at 0."}`,
      lang,
      body: g.join(""),
    }),
    alt,
    caption: both(() => title),
    data: {
      title,
      unit,
      categories: bars,
      axis: { min: 0, max: axis.end, step: axis.step, ticks: axis.ticks },
      plot: { left, width: plotW },
    },
    table: {
      headers: [
        lang === "es" ? "Categoría" : "Category",
        unit || (lang === "es" ? "Valor" : "Value"),
      ],
      rows: cats.map((c) => [c.label, fmt(c.value, lang)]),
    },
  });
}

// ── shared numeric helpers ───────────────────────────────────────────────────

function dataset(values, name, cap) {
  const list = listIn(values, name, { min: 1, max: cap });
  return list.map((v, i) => numberIn(v, `${name}[${i}]`, { min: -1e9, max: 1e9 }));
}
const sum = (a) => a.reduce((s, v) => s + v, 0);
function median(sorted) {
  const m = sorted.length >> 1;
  return sorted.length % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
}
const stats = (v) => {
  const s = [...v].sort((a, b) => a - b);
  return {
    n: v.length,
    min: s[0],
    max: s[s.length - 1],
    mean: round(sum(v) / v.length, 6),
    median: median(s),
  };
};
const tableOfCounts = (lang, rows, first) => ({
  headers: [first, lang === "es" ? "Cantidad" : "Count"],
  rows: rows,
});

// ── dot plot ─────────────────────────────────────────────────────────────────

/** @param {{values:number[], title?:string, unit?:string, lang?:string}} spec */
export function dotPlotSvg(spec = {}) {
  const lang = langOf(spec);
  const values = dataset(spec.values, "values", CAPS.dotValues);
  const title = textIn(spec.title ?? "", "title", { max: CAPS.title, required: false });
  const unit = textIn(spec.unit ?? "", "unit", { max: 40, required: false });
  const st = stats(values);
  const key = (v) => round(v, 6);
  const counts = new Map();
  for (const v of values) counts.set(key(v), (counts.get(key(v)) ?? 0) + 1);
  const distinct = [...counts.keys()].sort((a, b) => a - b);
  const integers = values.every(Number.isInteger) && st.max - st.min <= 30;
  const axis =
    st.min === st.max
      ? { start: st.min - 1, end: st.max + 1, ticks: [st.min - 1, st.min, st.min + 1], step: 1 }
      : integers
        ? {
            start: st.min,
            end: st.max,
            step: 1,
            ticks: Array.from({ length: st.max - st.min + 1 }, (_, i) => st.min + i),
          }
        : axisTicks(st.min, st.max, { target: 8 });
  const left = 40;
  const plotW = W - 2 * left;
  const px = (v) => left + ((v - axis.start) / (axis.end - axis.start)) * plotW;
  const stack = Math.max(...counts.values());
  if (stack > 30)
    fail(
      "too-many-equal",
      "More than 30 identical values would not fit in one stack; use a histogram.",
    );
  let gap = Number.POSITIVE_INFINITY;
  for (let i = 1; i < distinct.length; i++)
    gap = Math.min(gap, px(distinct[i]) - px(distinct[i - 1]));
  const r = Math.min(9, 220 / (2.2 * stack), (gap - 1) / 2);
  if (r < 3) fail("too-dense", "Values are too close together for a dot plot; use a histogram.");
  const top = title ? 44 : 20;
  const plotH = Math.max(60, stack * (2 * r + 2) + 12);
  const axisY = top + plotH;
  const h = axisY + 56;
  const g = [];
  if (title) g.push(text(W / 2, 26, title, { size: 17, anchor: "middle", weight: "700" }));
  g.push(line(left - 14, axisY, W - left + 14, axisY, { width: 2.5 }));
  const every = axis.ticks.length > 16 ? Math.ceil(axis.ticks.length / 12) : 1;
  axis.ticks.forEach((t, i) => {
    g.push(line(px(t), axisY, px(t), axisY + 7, { width: 2 }));
    if (i % every === 0)
      g.push(text(px(t), axisY + 25, fmt(t, lang), { size: 14, anchor: "middle" }));
  });
  g.push(axisTitle(W / 2, axisY + 48, unit));
  const dots = [];
  for (const v of distinct)
    for (let i = 0; i < counts.get(v); i++) {
      const cy = axisY - r - 2 - i * (2 * r + 2);
      dots.push({ value: v, x: px(v), y: cy });
      g.push(
        `<circle data-value="${v}" cx="${f1(px(v))}" cy="${f1(cy)}" r="${f1(r)}" fill="${COLOR.blue}" stroke="${COLOR.white}" stroke-width="1"/>`,
      );
    }
  const alt = both((l) =>
    l === "es"
      ? `Diagrama de puntos${title ? ` «${title}»` : ""} con ${st.n} valores, de ${fmt(st.min, l)} a ${fmt(st.max, l)}. Mediana ${fmt(st.median, l)}.`
      : `Dot plot${title ? ` "${title}"` : ""} of ${st.n} values from ${fmt(st.min)} to ${fmt(st.max)}. Median ${fmt(st.median)}.`,
  );
  return result({
    svg: frame({
      p: "dp",
      w: W,
      h,
      title: alt[lang],
      desc: `${alt[lang]} ${lang === "es" ? "Cada punto es un valor; los valores iguales se apilan." : "Each dot is one value; equal values stack."}`,
      lang,
      body: g.join(""),
    }),
    alt,
    caption: both((l) => title || (l === "es" ? "Diagrama de puntos" : "Dot plot")),
    data: {
      ...st,
      unit,
      counts: distinct.map((v) => ({ value: v, count: counts.get(v) })),
      axis: { min: axis.start, max: axis.end, step: axis.step, ticks: axis.ticks },
      dots,
    },
    table: tableOfCounts(
      lang,
      distinct.map((v) => [fmt(v, lang), String(counts.get(v))]),
      lang === "es" ? "Valor" : "Value",
    ),
  });
}

// ── histogram ────────────────────────────────────────────────────────────────

/**
 * Bins are [from, to), except the last, which also includes its upper edge. Without `binWidth` the width is a
 * 1-2-5 step near range / (log2(n) + 1) (Sturges).
 * @param {{values:number[], binWidth?:number, title?:string, unit?:string, lang?:string}} spec
 */
export function histogramSvg(spec = {}) {
  const lang = langOf(spec);
  const values = dataset(spec.values, "values", CAPS.histogramValues);
  const title = textIn(spec.title ?? "", "title", { max: CAPS.title, required: false });
  const unit = textIn(spec.unit ?? "", "unit", { max: 40, required: false });
  const st = stats(values);
  let bw;
  if (spec.binWidth !== undefined)
    bw = numberIn(spec.binWidth, "binWidth", { min: 1e-6, max: 1e9 });
  else {
    const k = Math.ceil(Math.log2(values.length)) + 1;
    bw = axisTicks(0, (st.max - st.min || 1) / k, { target: 1 }).step;
  }
  const start = round(Math.floor(st.min / bw + 1e-9) * bw, 9);
  const nBins = Math.max(1, Math.ceil((st.max - start) / bw - 1e-9));
  if (nBins > CAPS.bins)
    fail(
      "too-many-bins",
      `That would make ${nBins} bins; the limit is ${CAPS.bins}. Use a wider binWidth.`,
    );
  const bins = Array.from({ length: nBins }, (_, i) => ({
    from: round(start + i * bw, 9),
    to: round(start + (i + 1) * bw, 9),
    count: 0,
  }));
  for (const v of values)
    bins[Math.min(nBins - 1, Math.max(0, Math.floor((v - start) / bw + 1e-9)))].count++;
  const maxCount = Math.max(...bins.map((b) => b.count));
  const yAxis = axisTicks(0, maxCount, { target: 5, integer: true });
  const left = 62;
  const plotW = W - left - 24;
  const top = title ? 52 : 28;
  const plotH = 230;
  const axisY = top + plotH;
  const h = axisY + 62;
  const bwPx = plotW / nBins;
  const py = (c) => axisY - (c / yAxis.end) * plotH;
  const g = [];
  if (title) g.push(text(W / 2, 26, title, { size: 17, anchor: "middle", weight: "700" }));
  for (const t of yAxis.ticks) {
    g.push(line(left, py(t), left + plotW, py(t), { stroke: COLOR.grid, width: 0.6, dash: "2 3" }));
    g.push(text(left - 8, py(t) + 5, fmt(t, lang), { size: 13, anchor: "end" }));
  }
  bins.forEach((b, i) => {
    const x = left + i * bwPx;
    g.push(
      `<rect data-bin="${i + 1}" data-count="${b.count}" data-from="${b.from}" data-to="${b.to}" x="${f1(x)}" y="${f1(py(b.count))}" width="${f1(bwPx)}" height="${f1(axisY - py(b.count))}" fill="${COLOR.blue}" stroke="${COLOR.white}" stroke-width="1.5"/>`,
    );
    if (b.count)
      g.push(
        text(x + bwPx / 2, py(b.count) - 5, String(b.count), {
          size: 13,
          anchor: "middle",
          weight: "700",
        }),
      );
  });
  g.push(
    line(left, top, left, axisY, { width: 2 }),
    line(left, axisY, left + plotW, axisY, { width: 2 }),
  );
  const every = nBins > 12 ? Math.ceil(nBins / 10) : 1;
  const edges = [...bins.map((b) => b.from), bins[nBins - 1].to];
  const widest = Math.max(...edges.map((e) => textWidth(fmt(e, lang), 13)));
  const step = Math.max(every, Math.ceil((widest + 6) / bwPx));
  edges.forEach((e, i) => {
    g.push(line(left + i * bwPx, axisY, left + i * bwPx, axisY + 6, { width: 1.5 }));
    if (i % step === 0)
      g.push(text(left + i * bwPx, axisY + 22, fmt(e, lang), { size: 13, anchor: "middle" }));
  });
  g.push(axisTitle(left + plotW / 2, axisY + 46, unit));
  const alt = both((l) =>
    l === "es"
      ? `Histograma${title ? ` «${title}»` : ""} de ${st.n} valores en ${nBins} intervalo${nBins === 1 ? "" : "s"} de ancho ${fmt(bw, l)}. El intervalo más alto tiene ${maxCount}.`
      : `Histogram${title ? ` "${title}"` : ""} of ${st.n} values in ${nBins} bin${nBins === 1 ? "" : "s"} of width ${fmt(bw)}. The tallest bin holds ${maxCount}.`,
  );
  const range = (b, i) =>
    `${fmt(b.from, lang)}–${fmt(b.to, lang)}${i === nBins - 1 ? "" : lang === "es" ? " (sin incluir el final)" : " (not including the end)"}`;
  return result({
    svg: frame({
      p: "hg",
      w: W,
      h,
      title: alt[lang],
      desc: `${alt[lang]} ${lang === "es" ? "Un valor en el borde va al intervalo que empieza ahí. Cada barra tiene su cantidad escrita." : "A value on a boundary goes in the bin that starts there. Each bar has its count written above it."}`,
      lang,
     
      body: g.join(""),
    }),
    alt,
    caption: both((l) => title || (l === "es" ? "Histograma" : "Histogram")),
    data: {
      ...st,
      unit,
      binWidth: bw,
      bins,
      counts: bins.map((b) => b.count),
      axis: { yMax: yAxis.end, yStep: yAxis.step },
    },
    table: tableOfCounts(
      lang,
      bins.map((b, i) => [range(b, i), String(b.count)]),
      lang === "es" ? "Intervalo" : "Bin",
    ),
  });
}

